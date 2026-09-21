import { describe, expect, it } from 'vitest';
import { applyInventoryDeltas, emptyInventory, InventoryService, type InventoryRepository } from '../src/modules/inventory/inventory-service.js';

const skuId = 'f410126b-b44a-483f-aad5-8dfb83382599';
const warehouseId = 'e0c75503-e3d5-4bd3-982f-dfef733736ac';
const batchId = '581f1d31-fb5a-44e5-82a9-29a4a80294a5';
const sourceId = '2d3ad268-497f-4858-9cac-8d7dc06604ee';
const inbound = {
  skuId, warehouseId, batchId, type: 'PURCHASE_IN' as const, sourceType: 'PURCHASE_RECEIPT',
  sourceId, reason: '采购入库', deltas: { ...emptyInventory(), physical: 10, available: 10 }
};

describe('inventory domain', () => {
  it('preserves the physical inventory equation for inbound and reservations', () => {
    const stocked = applyInventoryDeltas(emptyInventory(), inbound.deltas);
    expect(stocked).toMatchObject({ physical: 10, available: 10 });
    expect(applyInventoryDeltas(stocked, { ...emptyInventory(), available: -3, locked: 3 }))
      .toMatchObject({ physical: 10, available: 7, locked: 3 });
  });

  it('rejects negative or unbalanced inventory', () => {
    expect(() => applyInventoryDeltas(emptyInventory(), { ...emptyInventory(), available: -1, physical: -1 }))
      .toThrow('Insufficient inventory');
    expect(() => applyInventoryDeltas(emptyInventory(), { ...emptyInventory(), physical: 1 }))
      .toThrow('Inventory quantities do not balance');
  });

  it('normalizes commands and replays by idempotency key', async () => {
    let applies = 0;
    const movement = { id: sourceId, movementNo: 'IM1', type: 'PURCHASE_IN' as const, sourceType: 'PURCHASE_RECEIPT', sourceId, before: emptyInventory(), after: { ...emptyInventory(), physical: 10, available: 10 }, createdAt: '2026-09-21T00:00:00.000Z' };
    const repo: InventoryRepository = {
      findByIdempotency: async (_admin, key) => key === 'inventory:repeat' ? movement : null,
      apply: async () => { applies += 1; return { balance: { ...movement.after, skuId, warehouseId, batchId, version: 1 }, movement }; }
    };
    const service = new InventoryService(repo);
    await expect(service.apply('7', 'inventory:new', inbound)).resolves.toMatchObject({ movement });
    await expect(service.apply('7', 'inventory:repeat', inbound)).resolves.toMatchObject({ balance: null, movement });
    expect(applies).toBe(1);
  });

  it('rejects empty, malformed and unbalanced commands before persistence', async () => {
    const repo: InventoryRepository = { findByIdempotency: async () => null, apply: async () => { throw new Error('not reached'); } };
    const service = new InventoryService(repo);
    await expect(service.apply('7', 'inventory:new', { ...inbound, deltas: emptyInventory() })).rejects.toThrow('cannot be empty');
    await expect(service.apply('7', 'inventory:new', { ...inbound, deltas: { ...emptyInventory(), physical: 1 } })).rejects.toThrow('do not balance');
  });
});
