import { describe, expect, it } from 'vitest';
import {
  DisabledShipmentSyncProvider,
  evaluateShipmentAllocation,
  MockShipmentSyncProvider,
  ShipmentService,
  ShipmentSyncDisabledError,
  type ShipmentRepository
} from '../src/modules/shipping/shipment-service.js';

const orderId = 'f410126b-b44a-483f-aad5-8dfb83382599';
const itemId = 'e0c75503-e3d5-4bd3-982f-dfef733736ac';
const shipment = {
  id: '581f1d31-fb5a-44e5-82a9-29a4a80294a5', shipmentNo: 'SHIPPING202609210001', orderId,
  status: 'SHIPPED' as const, carrierCode: 'SF', carrierName: '顺丰速运', trackingNo: 'SF1234567890',
  items: [{ orderItemId: itemId, quantity: 2 }], shippedAt: '2026-09-21T08:00:00.000Z', deliveredAt: null
};

function repository(): ShipmentRepository & { creates: number } {
  const repo = {
    creates: 0,
    findByIdempotency: async (_admin: string, _order: string, key: string, hash: string) => {
      if (key === 'shipment:repeat') return shipment;
      if (key === 'shipment:mismatch') throw new Error(`Shipment idempotency key reused:${hash}`);
      return null;
    },
    create: async () => { repo.creates += 1; return shipment; },
    listOwned: async (_user: string, id: string) => id === orderId ? [shipment] : null
  };
  return repo;
}

const input = {
  carrierCode: ' sf ', carrierName: ' 顺丰速运 ', trackingNo: ' sf1234567890 ',
  items: [{ orderItemId: itemId, quantity: 2 }]
};
const inputItem = { orderItemId: itemId, quantity: 2 };

describe('ShipmentService', () => {
  it('normalizes and creates an idempotent shipment command', async () => {
    const repo = repository();
    const service = new ShipmentService(repo);
    await expect(service.create('7', orderId, 'shipment:new', input)).resolves.toEqual(shipment);
    expect(repo.creates).toBe(1);
  });

  it('replays a shipment without creating a duplicate', async () => {
    const repo = repository();
    const service = new ShipmentService(repo);
    await expect(service.create('7', orderId, 'shipment:repeat', input)).resolves.toEqual(shipment);
    expect(repo.creates).toBe(0);
  });

  it('rejects malformed carrier, tracking, duplicate items and quantities', async () => {
    const service = new ShipmentService(repository());
    await expect(service.create('7', orderId, 'shipment:new', { ...input, carrierCode: '<script>' }))
      .rejects.toThrow('Invalid carrier code');
    await expect(service.create('7', orderId, 'shipment:new', { ...input, trackingNo: '../bad' }))
      .rejects.toThrow('Invalid tracking number');
    await expect(service.create('7', orderId, 'shipment:new', { ...input, items: [inputItem, inputItem] }))
      .rejects.toThrow('Duplicate shipment item');
    await expect(service.create('7', orderId, 'shipment:new', { ...input, items: [{ ...inputItem, quantity: 0 }] }))
      .rejects.toThrow('Invalid shipment quantity');
  });

  it('returns logistics only through the ownership-filtered repository', async () => {
    const service = new ShipmentService(repository());
    await expect(service.list('42', orderId)).resolves.toEqual([shipment]);
    await expect(service.list('42', 'a410126b-b44a-483f-aad5-8dfb83382599')).rejects.toThrow('Order not found');
  });

  it('keeps real shipment sync disabled while providing a deterministic mock', async () => {
    await expect(new DisabledShipmentSyncProvider().sync(shipment)).rejects.toBeInstanceOf(ShipmentSyncDisabledError);
    await expect(new MockShipmentSyncProvider().sync(shipment))
      .resolves.toEqual({ providerReference: `mock:${shipment.id}` });
  });

  it('supports partial packages and detects completion without over-shipping', () => {
    const orderItems = [{ id: itemId, quantity: 3 }, { id: orderId, quantity: 1 }];
    expect(evaluateShipmentAllocation(orderItems, new Map(), [{ orderItemId: itemId, quantity: 2 }]))
      .toEqual({ fullyShipped: false });
    expect(evaluateShipmentAllocation(
      orderItems, new Map([[itemId, 2]]),
      [{ orderItemId: itemId, quantity: 1 }, { orderItemId: orderId, quantity: 1 }]
    )).toEqual({ fullyShipped: true });
    expect(() => evaluateShipmentAllocation(
      orderItems, new Map([[itemId, 2]]), [{ orderItemId: itemId, quantity: 2 }]
    )).toThrow('Shipment quantity exceeds remaining quantity');
  });
});
