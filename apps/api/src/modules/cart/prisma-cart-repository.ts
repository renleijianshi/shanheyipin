import type { Prisma, PrismaClient } from '@prisma/client';
import type { CartItemInvalidReason } from '@shanheyipin/shared-types';
import { findVisibleCategoryIds } from '../catalog/catalog-visibility.js';
import type { CartRepository, CartRepositoryItem } from './cart-service.js';

const itemInclude = {
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
      specificationValues: {
        include: { specValue: { include: { spec: true } } }
      }
    }
  }
} satisfies Prisma.CartItemInclude;

type CartItemRecord = Prisma.CartItemGetPayload<{ include: typeof itemInclude }>;

export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listItems(userId: string): Promise<CartRepositoryItem[]> {
    const ownerId = BigInt(userId);
    await assertActiveUser(this.prisma, ownerId);
    const visibleCategoryIds = await findVisibleCategoryIds(this.prisma);
    const cart = await this.prisma.cart.findUnique({
      where: { userId: ownerId },
      include: { items: { include: itemInclude, orderBy: { id: 'asc' } } }
    });
    return cart?.items.map((item) => toCartItem(item, visibleCategoryIds)) ?? [];
  }

  async addItem(userId: string, skuId: string, quantity: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const ownerId = BigInt(userId);
      await assertActiveUser(tx, ownerId);
      const visibleCategoryIds = await findVisibleCategoryIds(tx);
      const sku = await tx.productSku.findUnique({
        where: { publicId: skuId },
        include: { product: { select: { status: true, categoryId: true } } }
      });
      if (!sku || invalidReason(sku, visibleCategoryIds) !== null) throw new Error('SKU unavailable');

      const cart = await tx.cart.upsert({
        where: { userId: ownerId },
        create: { userId: ownerId },
        update: {}
      });
      await lockCart(tx, cart.id);
      const existing = await tx.cartItem.findUnique({
        where: { cartId_skuId: { cartId: cart.id, skuId: sku.id } }
      });
      if (existing) {
        const nextQuantity = existing.quantity + quantity;
        if (nextQuantity > 99) throw new Error('Cart item quantity exceeds limit');
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
        return;
      }
      if (await tx.cartItem.count({ where: { cartId: cart.id } }) >= 100) {
        throw new Error('Cart item count exceeds limit');
      }
      await tx.cartItem.create({ data: { cartId: cart.id, skuId: sku.id, quantity } });
    });
  }

  async updateItem(userId: string, itemId: string, quantity: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const ownerId = BigInt(userId);
      await assertActiveUser(tx, ownerId);
      const cart = await tx.cart.findUnique({ where: { userId: ownerId } });
      if (!cart) throw new Error('Cart item not found');
      await lockCart(tx, cart.id);
      const item = await tx.cartItem.findFirst({ where: { publicId: itemId, cartId: cart.id } });
      if (!item) throw new Error('Cart item not found');
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity } });
    });
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const ownerId = BigInt(userId);
      await assertActiveUser(tx, ownerId);
      const cart = await tx.cart.findUnique({ where: { userId: ownerId } });
      if (!cart) throw new Error('Cart item not found');
      await lockCart(tx, cart.id);
      const item = await tx.cartItem.findFirst({ where: { publicId: itemId, cartId: cart.id } });
      if (!item) throw new Error('Cart item not found');
      await tx.cartItem.delete({ where: { id: item.id } });
    });
  }
}

function toCartItem(row: CartItemRecord, visibleCategoryIds: readonly bigint[]): CartRepositoryItem {
  const reason = invalidReason(row.sku, visibleCategoryIds);
  return {
    id: row.publicId,
    skuId: row.sku.publicId,
    quantity: row.quantity,
    skuName: row.sku.skuName,
    productName: row.sku.product.name,
    coverObjectKey: row.sku.product.media[0]?.objectKey ?? null,
    salePriceCent: row.sku.salePriceCent,
    specs: row.sku.specificationValues
      .map(({ specValue }) => ({ name: specValue.spec.name, value: specValue.value }))
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN')),
    isValid: reason === null,
    invalidReason: reason
  };
}

function invalidReason(
  sku: { readonly saleStatus: string; readonly product: { readonly status: string; readonly categoryId: bigint } },
  visibleCategoryIds: readonly bigint[]
): CartItemInvalidReason | null {
  if (sku.saleStatus !== 'ON_SALE') return 'SKU_OFF_SALE';
  if (sku.product.status !== 'ON_SALE') return 'PRODUCT_OFF_SALE';
  if (!visibleCategoryIds.includes(sku.product.categoryId)) return 'CATEGORY_UNAVAILABLE';
  return null;
}

async function assertActiveUser(
  prisma: PrismaClient | Prisma.TransactionClient,
  userId: bigint
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user || user.status !== 'ACTIVE') throw new Error('User unavailable');
}

async function lockCart(tx: Prisma.TransactionClient, cartId: bigint): Promise<void> {
  await tx.$queryRaw`SELECT id FROM carts WHERE id = ${cartId} FOR UPDATE`;
}
