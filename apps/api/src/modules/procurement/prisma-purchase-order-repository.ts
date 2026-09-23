import { randomBytes } from 'node:crypto';
import type { Prisma, PrismaClient, PurchaseOrderItem as PurchaseOrderItemRow, PurchaseOrder as PurchaseOrderRow } from '@prisma/client';
import type { PurchaseOrder, PurchaseOrderInput, PurchaseOrderRepository, PurchaseOrderStatus } from './purchase-order-service.js';

const includeItems = {
  supplier: { select: { publicId: true } },
  items: { orderBy: { id: 'asc' as const }, include: { sku: { select: { publicId: true } } } }
};

export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: { readonly page: number; readonly pageSize: number; readonly status?: PurchaseOrderStatus; readonly supplierId?: string }) {
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.supplierId ? { supplier: { publicId: query.supplierId } } : {})
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where, include: includeItems,
        skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
      }),
      this.prisma.purchaseOrder.count({ where })
    ]);
    return { items: rows.map(toPurchaseOrder), total };
  }

  async findByPublicId(publicId: string): Promise<PurchaseOrder | null> {
    const row = await this.prisma.purchaseOrder.findUnique({ where: { publicId }, include: includeItems });
    return row ? toPurchaseOrder(row) : null;
  }

  async create(input: PurchaseOrderInput): Promise<PurchaseOrder> {
    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { publicId: input.supplierId } });
      if (!supplier || supplier.status !== 'ACTIVE') throw new Error('Active supplier not found');
      const skus = await resolveSkus(tx, input);
      const row = await tx.purchaseOrder.create({
        data: {
          purchaseNo: `PO${randomBytes(16).toString('hex').toUpperCase()}`,
          supplierId: supplier.id, supplierNameSnapshot: supplier.name,
          expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
          note: input.note, totalAmountCent: totalAmount(input),
          items: { create: input.items.map((item) => {
            const sku = skus.get(item.skuId)!;
            return {
              skuId: sku.id, skuCodeSnapshot: sku.skuCode, skuNameSnapshot: sku.skuName,
              quantity: item.quantity, unitCostCent: item.unitCostCent,
              lineAmountCent: item.quantity * item.unitCostCent
            };
          }) }
        }, include: includeItems
      });
      return toPurchaseOrder(row);
    });
  }

  async updateDraft(publicId: string, input: PurchaseOrderInput): Promise<PurchaseOrder> {
    return this.prisma.$transaction(async (tx) => {
      await lockPurchaseOrder(tx, publicId);
      const existing = await tx.purchaseOrder.findUnique({ where: { publicId } });
      if (!existing) throw new Error('Purchase order not found');
      if (existing.status !== 'DRAFT') throw new Error('Only draft purchase orders can be edited');
      const supplier = await tx.supplier.findUnique({ where: { publicId: input.supplierId } });
      if (!supplier || supplier.status !== 'ACTIVE') throw new Error('Active supplier not found');
      const skus = await resolveSkus(tx, input);
      const row = await tx.purchaseOrder.update({
        where: { id: existing.id },
        data: {
          supplierId: supplier.id, supplierNameSnapshot: supplier.name,
          expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
          note: input.note, totalAmountCent: totalAmount(input),
          items: {
            deleteMany: {},
            create: input.items.map((item) => {
              const sku = skus.get(item.skuId)!;
              return {
                skuId: sku.id, skuCodeSnapshot: sku.skuCode, skuNameSnapshot: sku.skuName,
                quantity: item.quantity, unitCostCent: item.unitCostCent,
                lineAmountCent: item.quantity * item.unitCostCent
              };
            })
          }
        }, include: includeItems
      });
      return toPurchaseOrder(row);
    });
  }

  async transition(publicId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    return this.prisma.$transaction(async (tx) => {
      await lockPurchaseOrder(tx, publicId);
      const current = await tx.purchaseOrder.findUnique({ where: { publicId } });
      if (!current) throw new Error('Purchase order not found');
      const transitions: Readonly<Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]>> = {
        DRAFT: ['APPROVED', 'CANCELLED'], APPROVED: ['ORDERED', 'CANCELLED'],
        ORDERED: ['CANCELLED'], PART_RECEIVED: [], RECEIVED: ['CLOSED'], CLOSED: [], CANCELLED: []
      };
      if (!transitions[current.status].includes(status)) {
        throw new Error(`Invalid purchase order transition: ${current.status} -> ${status}`);
      }
      return toPurchaseOrder(await tx.purchaseOrder.update({ where: { id: current.id }, data: { status }, include: includeItems }));
    });
  }
}

async function lockPurchaseOrder(tx: Prisma.TransactionClient, publicId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM purchase_orders WHERE public_id = ${publicId} FOR UPDATE`;
}

async function resolveSkus(tx: Prisma.TransactionClient, input: PurchaseOrderInput) {
  const publicIds = input.items.map((item) => item.skuId);
  const rows = await tx.productSku.findMany({ where: { publicId: { in: publicIds } } });
  const byPublicId = new Map(rows.map((row) => [row.publicId, row]));
  if (byPublicId.size !== publicIds.length) throw new Error('Purchase SKU not found');
  return byPublicId;
}

function totalAmount(input: PurchaseOrderInput): number {
  return input.items.reduce((sum, item) => sum + item.quantity * item.unitCostCent, 0);
}

function toPurchaseOrder(row: PurchaseOrderRow & {
  supplier: { publicId: string };
  items: (PurchaseOrderItemRow & { sku: { publicId: string } })[];
}): PurchaseOrder {
  return {
    id: row.publicId, purchaseNo: row.purchaseNo, supplierId: row.supplier.publicId,
    supplierName: row.supplierNameSnapshot, status: row.status,
    expectedAt: row.expectedAt?.toISOString() ?? null, totalAmountCent: row.totalAmountCent,
    note: row.note, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    items: row.items.map((item) => ({
      skuId: item.sku.publicId, skuCode: item.skuCodeSnapshot, skuName: item.skuNameSnapshot,
      quantity: item.quantity, receivedQuantity: item.receivedQuantity,
      unitCostCent: item.unitCostCent, lineAmountCent: item.lineAmountCent
    }))
  };
}
