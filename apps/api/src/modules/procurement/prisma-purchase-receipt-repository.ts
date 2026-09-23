import { randomBytes } from 'node:crypto';
import type { PrismaClient, PurchaseReceipt as PurchaseReceiptRow, PurchaseReceiptItem as PurchaseReceiptItemRow } from '@prisma/client';
import type { PurchaseReceipt, PurchaseReceiptInput, PurchaseReceiptRepository } from './purchase-receipt-service.js';

const receiptInclude = {
  purchaseOrder: { select: { publicId: true, purchaseNo: true } },
  items: {
    orderBy: { id: 'asc' as const },
    include: { purchaseOrderItem: { select: { skuId: true, skuCodeSnapshot: true, skuNameSnapshot: true, sku: { select: { publicId: true } } } } }
  }
};

export class PrismaPurchaseReceiptRepository implements PurchaseReceiptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(purchaseOrderId: string, idempotencyKey: string, requestHash: string, input: PurchaseReceiptInput): Promise<PurchaseReceipt> {
    return this.prisma.$transaction(async (tx) => {
      const replay = await tx.purchaseReceipt.findUnique({ where: { idempotencyKey }, include: receiptInclude });
      if (replay) {
        if (replay.requestHash !== requestHash) throw new Error('Receipt idempotency key reused with different input');
        return toPurchaseReceipt(replay);
      }

      const orderRows = await tx.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM purchase_orders WHERE public_id = ${purchaseOrderId} FOR UPDATE
      `;
      if (orderRows.length === 0) throw new Error('Purchase order not found');
      const order = await tx.purchaseOrder.findUnique({
        where: { id: orderRows[0]!.id }, include: { items: { orderBy: { id: 'asc' } } }
      });
      if (!order) throw new Error('Purchase order not found');
      if (order.status !== 'ORDERED' && order.status !== 'PART_RECEIVED') {
        throw new Error('Purchase order is not open for receipt');
      }

      const skuIds = input.items.map((item) => item.skuId);
      const skuRows = await tx.productSku.findMany({ where: { publicId: { in: skuIds } }, select: { id: true, publicId: true } });
      const skuIdByPublicId = new Map(skuRows.map((sku) => [sku.publicId, sku.id]));
      if (skuIdByPublicId.size !== skuIds.length) throw new Error('Receipt SKU not found');
      const orderItemsBySkuId = new Map(order.items.map((item) => [item.skuId.toString(), item]));
      const receiptItems: { purchaseOrderItemId: bigint; quantity: number; grossWeightGram: number | null; netWeightGram: number | null }[] = [];
      for (const item of input.items) {
        const skuId = skuIdByPublicId.get(item.skuId);
        const orderItem = skuId === undefined ? undefined : orderItemsBySkuId.get(skuId.toString());
        if (!orderItem) throw new Error('SKU is not part of purchase order');
        if (orderItem.receivedQuantity + item.quantity > orderItem.quantity) throw new Error('Received quantity exceeds ordered quantity');
        receiptItems.push({
          purchaseOrderItemId: orderItem.id, quantity: item.quantity,
          grossWeightGram: item.grossWeightGram, netWeightGram: item.netWeightGram
        });
      }

      for (const item of receiptItems) {
        await tx.purchaseOrderItem.update({
          where: { id: item.purchaseOrderItemId },
          data: { receivedQuantity: { increment: item.quantity } }
        });
      }
      const refreshedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: order.id } });
      const nextStatus = refreshedItems.every((item) => item.receivedQuantity === item.quantity) ? 'RECEIVED' : 'PART_RECEIVED';
      await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: nextStatus } });

      const row = await tx.purchaseReceipt.create({
        data: {
          receiptNo: `RC${randomBytes(16).toString('hex').toUpperCase()}`,
          purchaseOrderId: order.id, arrivedAt: new Date(input.arrivedAt),
          transportStatus: input.transportStatus,
          grossWeightGram: input.grossWeightGram, netWeightGram: input.netWeightGram,
          packagingDescription: input.packagingDescription, note: input.note,
          idempotencyKey, requestHash,
          items: { create: receiptItems }
        }, include: receiptInclude
      });
      return toPurchaseReceipt(row);
    });
  }
}

function toPurchaseReceipt(row: PurchaseReceiptRow & {
  purchaseOrder: { publicId: string; purchaseNo: string };
  items: (PurchaseReceiptItemRow & {
    purchaseOrderItem: { skuId: bigint; skuCodeSnapshot: string; skuNameSnapshot: string; sku: { publicId: string } };
  })[];
}): PurchaseReceipt {
  return {
    id: row.publicId, receiptNo: row.receiptNo,
    purchaseOrderId: row.purchaseOrder.publicId, purchaseNo: row.purchaseOrder.purchaseNo,
    arrivedAt: row.arrivedAt.toISOString(), transportStatus: row.transportStatus,
    grossWeightGram: row.grossWeightGram, netWeightGram: row.netWeightGram,
    packagingDescription: row.packagingDescription, note: row.note,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      skuId: item.purchaseOrderItem.sku.publicId,
      quantity: item.quantity, grossWeightGram: item.grossWeightGram, netWeightGram: item.netWeightGram
    }))
  };
}
