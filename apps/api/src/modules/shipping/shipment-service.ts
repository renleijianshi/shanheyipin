import { createHash } from 'node:crypto';
import type { Shipment } from '@shanheyipin/shared-types';

export interface CreateShipmentInput {
  readonly carrierCode: string;
  readonly carrierName: string;
  readonly trackingNo: string;
  readonly items: readonly { readonly orderItemId: string; readonly quantity: number }[];
}

export interface ShipmentRepository {
  findByIdempotency(adminUserId: string, orderId: string, key: string, requestHash: string): Promise<Shipment | null>;
  create(input: {
    readonly adminUserId: string;
    readonly orderId: string;
    readonly idempotencyKey: string;
    readonly requestHash: string;
    readonly shipment: CreateShipmentInput;
  }): Promise<Shipment>;
  listOwned(userId: string, orderId: string): Promise<readonly Shipment[] | null>;
}

export interface ShipmentSyncProvider {
  readonly name: 'MOCK' | 'DISABLED' | 'WECHAT';
  sync(shipment: Shipment): Promise<{ readonly providerReference: string }>;
}

export class ShipmentSyncDisabledError extends Error {
  constructor() {
    super('Shipment sync provider disabled');
    this.name = 'ShipmentSyncDisabledError';
  }
}

export class DisabledShipmentSyncProvider implements ShipmentSyncProvider {
  readonly name = 'DISABLED' as const;
  async sync(shipment: Shipment): Promise<never> {
    void shipment;
    throw new ShipmentSyncDisabledError();
  }
}

export class MockShipmentSyncProvider implements ShipmentSyncProvider {
  readonly name = 'MOCK' as const;
  async sync(shipment: Shipment) { return { providerReference: `mock:${shipment.id}` }; }
}

export class ShipmentService {
  constructor(private readonly shipments: ShipmentRepository) {}

  async create(adminUserId: string, orderId: string, idempotencyKey: string, input: CreateShipmentInput) {
    assertNumericId(adminUserId, 'admin user');
    assertUuid(orderId, 'order');
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) throw new Error('Invalid shipment idempotency key');
    const shipment = normalizeShipment(input);
    const requestHash = createHash('sha256').update(JSON.stringify(shipment)).digest('hex');
    const replay = await this.shipments.findByIdempotency(adminUserId, orderId, idempotencyKey, requestHash);
    if (replay) return replay;
    return this.shipments.create({ adminUserId, orderId, idempotencyKey, requestHash, shipment });
  }

  async list(userId: string, orderId: string): Promise<readonly Shipment[]> {
    assertNumericId(userId, 'user');
    assertUuid(orderId, 'order');
    const shipments = await this.shipments.listOwned(userId, orderId);
    if (!shipments) throw new Error('Order not found');
    return shipments;
  }
}

export function evaluateShipmentAllocation(
  orderItems: readonly { readonly id: string; readonly quantity: number }[],
  alreadyShipped: ReadonlyMap<string, number>,
  requested: readonly { readonly orderItemId: string; readonly quantity: number }[]
): { readonly fullyShipped: boolean } {
  const byId = new Map(orderItems.map((item) => [item.id, item]));
  const requestedById = new Map<string, number>();
  for (const item of requested) {
    const orderItem = byId.get(item.orderItemId);
    if (!orderItem) throw new Error('Shipment item does not belong to order');
    const next = (alreadyShipped.get(item.orderItemId) ?? 0) + item.quantity;
    if (next > orderItem.quantity) throw new Error('Shipment quantity exceeds remaining quantity');
    requestedById.set(item.orderItemId, item.quantity);
  }
  return {
    fullyShipped: orderItems.every((item) =>
      (alreadyShipped.get(item.id) ?? 0) + (requestedById.get(item.id) ?? 0) === item.quantity
    )
  };
}

function normalizeShipment(input: CreateShipmentInput): CreateShipmentInput {
  const carrierCode = input.carrierCode.trim().toUpperCase();
  const carrierName = input.carrierName.trim().normalize('NFC');
  const trackingNo = input.trackingNo.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,32}$/.test(carrierCode)) throw new Error('Invalid carrier code');
  if (carrierName.length < 1 || carrierName.length > 50) throw new Error('Invalid carrier name');
  if (!/^[A-Z0-9-]{6,64}$/.test(trackingNo)) throw new Error('Invalid tracking number');
  if (input.items.length < 1 || input.items.length > 100) throw new Error('Invalid shipment items');
  const seen = new Set<string>();
  const items = input.items.map((item) => {
    assertUuid(item.orderItemId, 'order item');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error('Invalid shipment quantity');
    }
    if (seen.has(item.orderItemId)) throw new Error('Duplicate shipment item');
    seen.add(item.orderItemId);
    return { orderItemId: item.orderItemId.toLowerCase(), quantity: item.quantity };
  }).sort((left, right) => left.orderItemId.localeCompare(right.orderItemId));
  return { carrierCode, carrierName, trackingNo, items };
}

function assertNumericId(value: string, label: string): void {
  if (!/^[1-9]\d*$/.test(value)) throw new Error(`Invalid ${label} id`);
}

function assertUuid(value: string, label: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${label} id`);
  }
}
