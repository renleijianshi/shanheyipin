import { randomBytes } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { CheckoutAddress, CheckoutItem, CheckoutPreview } from '@shanheyipin/shared-types';
import { findVisibleCategoryIds } from '../catalog/catalog-visibility.js';
import type { OrderRepository, PersistedOrder } from './order-service.js';

const orderInclude = {
  items: { orderBy: { id: 'asc' as const }, include: { sku: { select: { publicId: true } } } },
  address: true,
  priceDetails: { orderBy: { id: 'asc' as const } },
  statusLogs: { orderBy: { id: 'asc' as const } }
} satisfies Prisma.OrderInclude;

const cartItemInclude = {
  sku: {
    include: {
      product: {
        include: {
          media: {
            where: { type: 'IMAGE' as const },
            orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
            take: 1
          }
        }
      },
      specificationValues: { include: { specValue: { include: { spec: true } } } }
    }
  }
} satisfies Prisma.CartItemInclude;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type CartItemRecord = Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>;

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: Parameters<OrderRepository['create']>[0]): Promise<PersistedOrder> {
    const existing = await this.findByIdempotency(input.userId, input.idempotencyKey, input.requestHash);
    if (existing) return existing;
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const userId = BigInt(input.userId);
        const user = await tx.user.findUnique({ where: { id: userId }, select: { status: true } });
        if (!user || user.status !== 'ACTIVE') throw new Error('User unavailable');
        const duplicate = await tx.order.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
          include: orderInclude
        });
        if (duplicate) {
          if (duplicate.requestHash !== input.requestHash) {
            throw new Error('Idempotency key reused with different request');
          }
          return duplicate;
        }

        const address = await tx.userAddress.findFirst({
          where: { id: BigInt(input.preview.address.id), userId }
        });
        if (!address || !sameAddress(address, input.preview.address)) throw new Error('Checkout changed; preview again');

        const cart = await tx.cart.findUnique({ where: { userId } });
        if (!cart) throw new Error('Checkout changed; preview again');
        await tx.$queryRaw`SELECT id FROM carts WHERE id = ${cart.id} FOR UPDATE`;
        const rows = await tx.cartItem.findMany({
          where: { cartId: cart.id, publicId: { in: [...input.cartItemIds] } },
          include: cartItemInclude
        });
        if (rows.length !== input.cartItemIds.length) throw new Error('Checkout changed; preview again');
        const visibleCategoryIds = await findVisibleCategoryIds(tx);
        const currentItems = rows.map((row) => currentCheckoutItem(row, visibleCategoryIds));
        assertPreviewStillCurrent(input.preview, currentItems);

        const priceDetails = [
          { type: 'GOODS' as const, description: '商品金额', amountCent: input.preview.merchandiseAmountCent },
          ...input.preview.discounts.map((detail) => ({
            type: discountType(detail.type), description: detail.description, amountCent: detail.amountCent
          })),
          { type: 'FREIGHT' as const, description: input.preview.shipping.description, amountCent: input.preview.shipping.feeCent },
          { type: 'PAYABLE' as const, description: '应付金额', amountCent: input.preview.payableAmountCent }
        ];
        const rowByPublicId = new Map(rows.map((row) => [row.publicId, row]));
        const order = await tx.order.create({
          data: {
            orderNo: `SH${randomBytes(16).toString('hex').toUpperCase()}`,
            userId,
            idempotencyKey: input.idempotencyKey,
            requestHash: input.requestHash,
            goodsAmountCent: input.preview.merchandiseAmountCent,
            discountAmountCent: input.preview.discountAmountCent,
            freightAmountCent: input.preview.shipping.feeCent,
            payableAmountCent: input.preview.payableAmountCent,
            address: { create: addressSnapshot(input.preview.address) },
            items: { create: input.preview.items.map((item) => {
              const current = rowByPublicId.get(item.cartItemId)!;
              return {
                productId: current.sku.product.id,
                skuId: current.sku.id,
                productNameSnapshot: item.productName,
                skuNameSnapshot: item.skuName,
                imageSnapshot: item.coverObjectKey,
                specsSnapshot: item.specs as Prisma.InputJsonValue,
                unitPriceCent: item.unitPriceCent,
                quantity: item.quantity,
                discountCent: 0,
                finalAmountCent: item.lineAmountCent
              };
            }) },
            priceDetails: { create: priceDetails },
            statusLogs: { create: { fromStatus: null, toStatus: 'CREATED', reason: 'ORDER_CREATED' } }
          },
          include: orderInclude
        });
        await tx.cartItem.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } });
        return order;
      });
      return toOrder(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.findByIdempotency(input.userId, input.idempotencyKey, input.requestHash);
        if (raced) return raced;
      }
      throw error;
    }
  }

  async list(userId: string, query: { readonly page: number; readonly pageSize: number }) {
    const ownerId = BigInt(userId);
    const where = { userId: ownerId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where, include: orderInclude, orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize, take: query.pageSize
      }),
      this.prisma.order.count({ where })
    ]);
    return { items: items.map(toOrder), total };
  }

  async findOwned(userId: string, orderId: string): Promise<PersistedOrder | null> {
    const order = await this.prisma.order.findFirst({
      where: { publicId: orderId, userId: BigInt(userId) }, include: orderInclude
    });
    return order ? toOrder(order) : null;
  }

  async cancel(userId: string, orderId: string, reason: string): Promise<PersistedOrder> {
    const order = await this.prisma.$transaction(async (tx) => {
      const row = await tx.order.findFirst({ where: { publicId: orderId, userId: BigInt(userId) } });
      if (!row) throw new Error('Order not found');
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${row.id} FOR UPDATE`;
      const locked = await tx.order.findUnique({ where: { id: row.id } });
      if (!locked) throw new Error('Order not found');
      if (locked.orderStatus === 'CANCELLED') {
        return tx.order.findUniqueOrThrow({ where: { id: locked.id }, include: orderInclude });
      }
      if (locked.orderStatus !== 'CREATED' || locked.paymentStatus !== 'UNPAID') {
        throw new Error('Order cannot be cancelled');
      }
      return tx.order.update({
        where: { id: locked.id },
        data: {
          orderStatus: 'CANCELLED', paymentStatus: 'CLOSED', cancelledAt: new Date(),
          statusLogs: { create: { fromStatus: 'CREATED', toStatus: 'CANCELLED', reason } }
        },
        include: orderInclude
      });
    });
    return toOrder(order);
  }

  async findByIdempotency(
    userId: string,
    idempotencyKey: string,
    requestHash: string
  ): Promise<PersistedOrder | null> {
    const order = await this.prisma.order.findUnique({
      where: { userId_idempotencyKey: { userId: BigInt(userId), idempotencyKey } },
      include: orderInclude
    });
    return order ? replay(order, requestHash) : null;
  }
}

function replay(order: OrderRecord, requestHash: string): PersistedOrder {
  if (order.requestHash !== requestHash) throw new Error('Idempotency key reused with different request');
  return toOrder(order);
}

function currentCheckoutItem(row: CartItemRecord, visibleCategoryIds: readonly bigint[]): CheckoutItem {
  if (row.sku.saleStatus !== 'ON_SALE' || row.sku.product.status !== 'ON_SALE'
    || !visibleCategoryIds.includes(row.sku.product.categoryId)) {
    throw new Error('Checkout changed; preview again');
  }
  const specs = row.sku.specificationValues
    .map(({ specValue }) => ({ name: specValue.spec.name, value: specValue.value }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  return {
    cartItemId: row.publicId, skuId: row.sku.publicId,
    productName: row.sku.product.name, skuName: row.sku.skuName,
    coverObjectKey: row.sku.product.media[0]?.objectKey ?? null, specs,
    quantity: row.quantity, unitPriceCent: row.sku.salePriceCent,
    lineAmountCent: row.quantity * row.sku.salePriceCent
  };
}

function assertPreviewStillCurrent(preview: CheckoutPreview, currentItems: readonly CheckoutItem[]): void {
  const currentById = new Map(currentItems.map((item) => [item.cartItemId, item]));
  const unchanged = preview.items.every((item) => {
    const current = currentById.get(item.cartItemId);
    return current !== undefined && JSON.stringify(current) === JSON.stringify(item);
  });
  const goods = currentItems.reduce((sum, item) => sum + item.lineAmountCent, 0);
  if (!unchanged || goods !== preview.merchandiseAmountCent
    || preview.discountAmountCent !== preview.discounts.reduce((sum, item) => sum + item.amountCent, 0)
    || preview.payableAmountCent !== goods - preview.discountAmountCent + preview.shipping.feeCent) {
    throw new Error('Checkout changed; preview again');
  }
}

function sameAddress(row: {
  recipientName: string; phone: string; province: string; city: string; district: string; detail: string;
}, address: CheckoutAddress): boolean {
  return row.recipientName === address.recipientName && row.phone === address.phone
    && row.province === address.province && row.city === address.city
    && row.district === address.district && row.detail === address.detail;
}

function addressSnapshot(address: {
  recipientName: string; phone: string; province: string; city: string; district: string; detail: string;
}) {
  return {
    recipientName: address.recipientName, phone: address.phone, province: address.province,
    city: address.city, district: address.district, detail: address.detail
  };
}

function discountType(type: string): 'PROMOTION' | 'COUPON' | 'MEMBER' | 'POINTS' | 'ADJUSTMENT' {
  return ['PROMOTION', 'COUPON', 'MEMBER', 'POINTS', 'ADJUSTMENT'].includes(type)
    ? type as 'PROMOTION' | 'COUPON' | 'MEMBER' | 'POINTS' | 'ADJUSTMENT'
    : 'PROMOTION';
}

function toOrder(row: OrderRecord): PersistedOrder {
  if (!row.address) throw new Error('Order address snapshot missing');
  return {
    id: row.publicId, orderNo: row.orderNo, orderType: row.orderType,
    orderStatus: row.orderStatus, paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus, aftersaleStatus: row.aftersaleStatus,
    goodsAmountCent: row.goodsAmountCent, discountAmountCent: row.discountAmountCent,
    freightAmountCent: row.freightAmountCent, payableAmountCent: row.payableAmountCent,
    paidAmountCent: row.paidAmountCent, createdAt: row.createdAt.toISOString(),
    address: addressSnapshot(row.address),
    items: row.items.map((item) => ({
      skuId: item.sku.publicId, productName: item.productNameSnapshot,
      skuName: item.skuNameSnapshot, coverObjectKey: item.imageSnapshot,
      specs: parseSpecs(item.specsSnapshot), quantity: item.quantity,
      unitPriceCent: item.unitPriceCent, lineAmountCent: item.finalAmountCent
    })),
    priceDetails: row.priceDetails.map((detail) => ({
      type: detail.type, description: detail.description, amountCent: detail.amountCent
    })),
    statusLogs: row.statusLogs.map((log) => ({
      fromStatus: log.fromStatus, toStatus: log.toStatus,
      reason: log.reason, createdAt: log.createdAt.toISOString()
    }))
  };
}

function parseSpecs(value: Prisma.JsonValue): readonly { readonly name: string; readonly value: string }[] {
  if (!Array.isArray(value)) throw new Error('Invalid order specification snapshot');
  return value.map((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)
      || typeof item.name !== 'string' || typeof item.value !== 'string') {
      throw new Error('Invalid order specification snapshot');
    }
    return { name: item.name, value: item.value };
  });
}
