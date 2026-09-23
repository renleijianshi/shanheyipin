import type { Prisma, PrismaClient, QualityInspection as QualityInspectionRow } from '@prisma/client';
import type { QualityInspection, QualityInspectionInput, QualityInspectionRepository } from './quality-inspection-service.js';

const inspectionInclude = {
  receiptItem: {
    include: {
      receipt: { select: { publicId: true, receiptNo: true } },
      purchaseOrderItem: { select: { skuNameSnapshot: true, sku: { select: { publicId: true } } } }
    }
  }
};

export class PrismaQualityInspectionRepository implements QualityInspectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: QualityInspectionInput, context: {
    readonly receiptId: string;
    readonly skuId: string;
    readonly inspectorAdminId: string;
    readonly idempotencyKey: string;
    readonly requestHash: string;
  }): Promise<QualityInspection> {
    return this.prisma.$transaction(async (tx) => {
      const replay = await tx.qualityInspection.findUnique({ where: { idempotencyKey: context.idempotencyKey }, include: inspectionInclude });
      if (replay) {
        if (replay.requestHash !== context.requestHash) throw new Error('Inspection idempotency key reused with different input');
        return toInspection(replay);
      }

      const receiptItems = await tx.$queryRaw<Array<{ id: bigint; quantity: number }>>`
        SELECT pri.id, pri.quantity
        FROM purchase_receipt_items pri
        JOIN purchase_receipts pr ON pr.id = pri.receipt_id
        JOIN purchase_order_items poi ON poi.id = pri.purchase_order_item_id
        JOIN product_skus sku ON sku.id = poi.sku_id
        WHERE pr.public_id = ${context.receiptId} AND sku.public_id = ${context.skuId}
        FOR UPDATE
      `;
      const receiptItem = receiptItems[0];
      if (!receiptItem) throw new Error('Receipt item not found');
      const inspector = await tx.adminUser.findUnique({ where: { id: BigInt(context.inspectorAdminId) }, select: { id: true, status: true } });
      if (!inspector || inspector.status !== 'ACTIVE') throw new Error('Active quality inspector not found');
      const existing = await tx.qualityInspection.aggregate({
        where: { receiptItemId: receiptItem.id }, _sum: { sampleQuantity: true }
      });
      if ((existing._sum.sampleQuantity ?? 0) + input.sampleQuantity > receiptItem.quantity) {
        throw new Error('Inspection quantity exceeds received quantity');
      }

      const row = await tx.qualityInspection.create({
        data: {
          receiptItemId: receiptItem.id, inspectorAdminId: inspector.id,
          idempotencyKey: context.idempotencyKey, requestHash: context.requestHash,
          sampleQuantity: input.sampleQuantity, acceptedQuantity: input.acceptedQuantity,
          downgradedQuantity: input.downgradedQuantity, rejectedQuantity: input.rejectedQuantity,
          appearance: input.appearance, sizeObservation: input.sizeObservation, firmness: input.firmness,
          bloom: input.bloom, dryness: input.dryness, damage: input.damage, mold: input.mold,
          foreignMatter: input.foreignMatter, odor: input.odor, qualityGrade: input.qualityGrade,
          sampleImageObjectKeys: [...input.sampleImageObjectKeys] as Prisma.InputJsonValue,
          conclusion: input.conclusion, note: input.note
        }, include: inspectionInclude
      });
      return toInspection(row);
    });
  }

  async listForReceipt(receiptId: string): Promise<readonly QualityInspection[]> {
    const rows = await this.prisma.qualityInspection.findMany({
      where: { receiptItem: { receipt: { publicId: receiptId } } },
      include: inspectionInclude,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
    });
    return rows.map(toInspection);
  }
}

function toInspection(row: QualityInspectionRow & {
  receiptItem: {
    receipt: { publicId: string; receiptNo: string };
    purchaseOrderItem: { skuNameSnapshot: string; sku: { publicId: string } };
  };
}): QualityInspection {
  const imageKeys = row.sampleImageObjectKeys;
  if (!Array.isArray(imageKeys) || imageKeys.some((key) => typeof key !== 'string')) throw new Error('Invalid inspection image JSON');
  return {
    id: row.publicId, receiptId: row.receiptItem.receipt.publicId,
    receiptNo: row.receiptItem.receipt.receiptNo, skuId: row.receiptItem.purchaseOrderItem.sku.publicId,
    skuName: row.receiptItem.purchaseOrderItem.skuNameSnapshot,
    inspectorAdminId: row.inspectorAdminId.toString(), sampleQuantity: row.sampleQuantity,
    acceptedQuantity: row.acceptedQuantity, downgradedQuantity: row.downgradedQuantity,
    rejectedQuantity: row.rejectedQuantity, appearance: row.appearance,
    sizeObservation: row.sizeObservation, firmness: row.firmness, bloom: row.bloom,
    dryness: row.dryness, damage: row.damage, mold: row.mold, foreignMatter: row.foreignMatter,
    odor: row.odor, qualityGrade: row.qualityGrade, sampleImageObjectKeys: imageKeys as string[],
    conclusion: row.conclusion, note: row.note, createdAt: row.createdAt.toISOString()
  };
}
