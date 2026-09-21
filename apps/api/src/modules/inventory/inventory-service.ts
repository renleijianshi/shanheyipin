import { createHash } from 'node:crypto';
import type { InventoryBalance, InventoryQuantities } from '@shanheyipin/shared-types';

export const inventoryMovementTypes = [
  'PURCHASE_IN', 'PURCHASE_RETURN_OUT', 'PROCESS_MATERIAL_OUT', 'PROCESS_FINISHED_IN',
  'SALES_RESERVE', 'SALES_RELEASE', 'SALES_OUT', 'RETURN_IN', 'TRANSFER_OUT', 'TRANSFER_IN',
  'STOCKTAKE_GAIN', 'STOCKTAKE_LOSS', 'DAMAGE_LOSS', 'MANUAL_ADJUST', 'RESHIP_OUT'
] as const;
export type InventoryMovementType = typeof inventoryMovementTypes[number];
export type InventoryDeltas = InventoryQuantities;

export interface InventoryCommand {
  readonly skuId: string;
  readonly warehouseId: string;
  readonly batchId: string;
  readonly type: InventoryMovementType;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly reason: string;
  readonly deltas: InventoryDeltas;
}

export interface InventoryMovement {
  readonly id: string;
  readonly movementNo: string;
  readonly type: InventoryMovementType;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly before: InventoryQuantities;
  readonly after: InventoryQuantities;
  readonly createdAt: string;
}

export interface InventoryRepository {
  findByIdempotency(adminUserId: string, key: string, requestHash: string): Promise<InventoryMovement | null>;
  apply(input: {
    readonly adminUserId: string;
    readonly idempotencyKey: string;
    readonly requestHash: string;
    readonly command: InventoryCommand;
  }): Promise<{ readonly balance: InventoryBalance | null; readonly movement: InventoryMovement }>;
}

export class InventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  async apply(adminUserId: string, idempotencyKey: string, input: InventoryCommand) {
    assertNumericId(adminUserId);
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) throw new Error('Invalid inventory idempotency key');
    const command = normalizeCommand(input);
    const requestHash = createHash('sha256').update(JSON.stringify(command)).digest('hex');
    const replay = await this.inventory.findByIdempotency(adminUserId, idempotencyKey, requestHash);
    if (replay) return { balance: null, movement: replay };
    return this.inventory.apply({ adminUserId, idempotencyKey, requestHash, command });
  }
}

export function applyInventoryDeltas(current: InventoryQuantities, deltas: InventoryDeltas): InventoryQuantities {
  const next = mapQuantities((key) => current[key] + deltas[key]);
  for (const value of Object.values(next)) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Insufficient inventory');
  }
  if (next.physical !== next.available + next.locked + next.outbound + next.frozen
    + next.defective + next.returnInspection) throw new Error('Inventory quantities do not balance');
  return next;
}

function normalizeCommand(input: InventoryCommand): InventoryCommand {
  assertUuid(input.skuId, 'sku'); assertUuid(input.warehouseId, 'warehouse'); assertUuid(input.batchId, 'batch');
  assertUuid(input.sourceId, 'source');
  if (!inventoryMovementTypes.includes(input.type)) throw new Error('Invalid inventory movement type');
  const sourceType = input.sourceType.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(sourceType)) throw new Error('Invalid inventory source type');
  const reason = input.reason.trim().normalize('NFC');
  if (reason.length < 1 || reason.length > 200) throw new Error('Invalid inventory reason');
  const deltas = mapQuantities((key) => {
    const value = input.deltas[key];
    if (!Number.isSafeInteger(value) || Math.abs(value) > 1_000_000) throw new Error('Invalid inventory delta');
    return value;
  });
  if (Object.values(deltas).every((value) => value === 0)) throw new Error('Inventory movement cannot be empty');
  if (deltas.physical !== deltas.available + deltas.locked + deltas.outbound + deltas.frozen
    + deltas.defective + deltas.returnInspection) throw new Error('Inventory deltas do not balance');
  return { ...input, sourceType, reason, deltas };
}

export const emptyInventory = (): InventoryQuantities => mapQuantities(() => 0);

function mapQuantities(mapper: (key: keyof InventoryQuantities) => number): InventoryQuantities {
  return {
    physical: mapper('physical'), available: mapper('available'), locked: mapper('locked'),
    outbound: mapper('outbound'), frozen: mapper('frozen'), defective: mapper('defective'),
    returnInspection: mapper('returnInspection')
  };
}

function assertNumericId(value: string): void {
  if (!/^[1-9]\d*$/.test(value)) throw new Error('Invalid admin user id');
}
function assertUuid(value: string, label: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${label} id`);
  }
}
