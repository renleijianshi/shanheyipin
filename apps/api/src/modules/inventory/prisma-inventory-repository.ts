import { randomBytes } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { InventoryBalance, InventoryQuantities } from '@shanheyipin/shared-types';
import { applyInventoryDeltas, type InventoryMovement, type InventoryRepository } from './inventory-service.js';

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByIdempotency(adminUserId: string, key: string, requestHash: string): Promise<InventoryMovement | null> {
    const row = await this.prisma.inventoryMovement.findUnique({ where: { idempotencyKey: key } });
    if (!row) return null;
    if (row.operatorAdminId !== BigInt(adminUserId) || row.requestHash !== requestHash) {
      throw new Error('Inventory idempotency key reused with different request');
    }
    return toMovement(row);
  }

  async apply(input: Parameters<InventoryRepository['apply']>[0]) {
    const replay = await this.findByIdempotency(input.adminUserId, input.idempotencyKey, input.requestHash);
    if (replay) return { balance: null, movement: replay };
    try {
      return await this.prisma.$transaction(async (tx) => {
        const adminId = BigInt(input.adminUserId);
        const admin = await tx.adminUser.findUnique({ where: { id: adminId }, select: { status: true } });
        if (!admin || admin.status !== 'ACTIVE') throw new Error('Admin user unavailable');
        const batch = await tx.inventoryBatch.findUnique({
          where: { publicId: input.command.batchId }, include: { sku: true, warehouse: true }
        });
        if (!batch || batch.sku.publicId !== input.command.skuId
          || batch.warehouse.publicId !== input.command.warehouseId || !batch.warehouse.enabled) {
          throw new Error('Inventory batch unavailable');
        }
        const balance = await tx.inventoryBalance.upsert({
          where: { skuId_warehouseId_batchId: { skuId: batch.skuId, warehouseId: batch.warehouseId, batchId: batch.id } },
          create: { skuId: batch.skuId, warehouseId: batch.warehouseId, batchId: batch.id }, update: {}
        });
        await tx.$queryRaw`SELECT id FROM inventory_balances WHERE id = ${balance.id} FOR UPDATE`;
        const locked = await tx.inventoryBalance.findUniqueOrThrow({ where: { id: balance.id } });
        const before = quantities(locked);
        const after = applyInventoryDeltas(before, input.command.deltas);
        const updated = await tx.inventoryBalance.update({
          where: { id: locked.id }, data: {
            physicalQty: after.physical, availableQty: after.available, lockedQty: after.locked,
            outboundQty: after.outbound, frozenQty: after.frozen, defectiveQty: after.defective,
            returnInspectionQty: after.returnInspection, version: { increment: 1 }
          }
        });
        const movement = await tx.inventoryMovement.create({ data: {
          movementNo: `IM${randomBytes(16).toString('hex').toUpperCase()}`,
          balanceId: locked.id, skuId: batch.skuId, warehouseId: batch.warehouseId, batchId: batch.id,
          operatorAdminId: adminId, type: input.command.type, sourceType: input.command.sourceType,
          sourceId: input.command.sourceId, reason: input.command.reason, idempotencyKey: input.idempotencyKey,
          requestHash: input.requestHash, deltas: input.command.deltas as unknown as Prisma.InputJsonValue,
          beforeQuantities: before as unknown as Prisma.InputJsonValue,
          afterQuantities: after as unknown as Prisma.InputJsonValue
        } });
        return { balance: toBalance(updated, batch.sku.publicId, batch.warehouse.publicId, batch.publicId), movement: toMovement(movement) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.findByIdempotency(input.adminUserId, input.idempotencyKey, input.requestHash);
        if (raced) return { balance: null, movement: raced };
      }
      throw error;
    }
  }
}

function quantities(row: { physicalQty: number; availableQty: number; lockedQty: number; outboundQty: number; frozenQty: number; defectiveQty: number; returnInspectionQty: number }): InventoryQuantities {
  return { physical: row.physicalQty, available: row.availableQty, locked: row.lockedQty, outbound: row.outboundQty, frozen: row.frozenQty, defective: row.defectiveQty, returnInspection: row.returnInspectionQty };
}
function toBalance(row: Parameters<typeof quantities>[0] & { version: number }, skuId: string, warehouseId: string, batchId: string): InventoryBalance {
  return { ...quantities(row), skuId, warehouseId, batchId, version: row.version };
}
function toMovement(row: { publicId: string; movementNo: string; type: InventoryMovement['type']; sourceType: string; sourceId: string; beforeQuantities: Prisma.JsonValue; afterQuantities: Prisma.JsonValue; createdAt: Date }): InventoryMovement {
  return { id: row.publicId, movementNo: row.movementNo, type: row.type, sourceType: row.sourceType, sourceId: row.sourceId, before: parseQuantities(row.beforeQuantities), after: parseQuantities(row.afterQuantities), createdAt: row.createdAt.toISOString() };
}
function parseQuantities(value: Prisma.JsonValue): InventoryQuantities {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid inventory quantities');
  const keys = ['physical','available','locked','outbound','frozen','defective','returnInspection'] as const;
  for (const key of keys) if (!Number.isSafeInteger(value[key])) throw new Error('Invalid inventory quantities');
  return value as unknown as InventoryQuantities;
}
