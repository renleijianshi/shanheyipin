import { describe, expect, it } from 'vitest';
import {
  CartService,
  type CartRepository,
  type CartRepositoryItem
} from '../src/modules/cart/cart-service.js';

const skuId = 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103';
const itemId = '8a9a0fea-44bc-4fa2-9d76-2137596ed108';

function repository(initial: CartRepositoryItem[] = []): CartRepository & { items: CartRepositoryItem[] } {
  const repo = {
    items: [...initial],
    listItems: async () => repo.items,
    addItem: async (_userId: string, receivedSkuId: string, quantity: number) => {
      if (receivedSkuId !== skuId) throw new Error('SKU unavailable');
      const existing = repo.items.find((item) => item.skuId === receivedSkuId);
      if (existing) {
        if (existing.quantity + quantity > 99) throw new Error('Cart item quantity exceeds limit');
        repo.items = repo.items.map((item) => item === existing
          ? { ...item, quantity: item.quantity + quantity }
          : item);
        return;
      }
      repo.items.push({
        id: itemId,
        skuId,
        quantity,
        skuName: '16 枚双层礼盒',
        productName: '舟曲吊柿',
        coverObjectKey: 'products/zhouqu/cover.webp',
        salePriceCent: 16800,
        specs: [{ name: '包装', value: '双层礼盒' }],
        isValid: true,
        invalidReason: null
      });
    },
    updateItem: async (_userId: string, receivedItemId: string, quantity: number) => {
      const item = repo.items.find((candidate) => candidate.id === receivedItemId);
      if (!item) throw new Error('Cart item not found');
      repo.items = repo.items.map((candidate) => candidate === item
        ? { ...candidate, quantity }
        : candidate);
    },
    removeItem: async (_userId: string, receivedItemId: string) => {
      const index = repo.items.findIndex((candidate) => candidate.id === receivedItemId);
      if (index < 0) throw new Error('Cart item not found');
      repo.items.splice(index, 1);
    }
  };
  return repo;
}

describe('CartService', () => {
  it('adds a SKU and returns current totals without reserving inventory', async () => {
    const service = new CartService(repository());
    await expect(service.add('42', { skuId, quantity: 2 })).resolves.toMatchObject({
      validItemCount: 1,
      totalQuantity: 2,
      subtotalCent: 33600,
      items: [{ id: itemId, skuId, quantity: 2, isValid: true }]
    });
  });

  it('increments an existing SKU and enforces the per-line quantity limit', async () => {
    const repo = repository();
    const service = new CartService(repo);
    await service.add('42', { skuId, quantity: 2 });
    await expect(service.add('42', { skuId, quantity: 3 }))
      .resolves.toMatchObject({ totalQuantity: 5, subtotalCent: 84000 });
    await expect(service.add('42', { skuId, quantity: 95 }))
      .rejects.toThrow('Cart item quantity exceeds limit');
  });

  it('keeps unavailable items visible but excludes them from valid totals', async () => {
    const invalidItem: CartRepositoryItem = {
      id: itemId,
      skuId,
      quantity: 2,
      skuName: '16 枚双层礼盒',
      productName: '舟曲吊柿',
      coverObjectKey: 'products/zhouqu/cover.webp',
      salePriceCent: 16800,
      specs: [],
      isValid: false,
      invalidReason: 'SKU_OFF_SALE'
    };
    await expect(new CartService(repository([invalidItem])).get('42')).resolves.toMatchObject({
      validItemCount: 0,
      totalQuantity: 0,
      subtotalCent: 0,
      items: [{ invalidReason: 'SKU_OFF_SALE' }]
    });
  });

  it('updates and removes only UUID-addressed items belonging to the current user', async () => {
    const repo = repository();
    const service = new CartService(repo);
    await service.add('42', { skuId, quantity: 1 });
    await expect(service.update('42', itemId, { quantity: 4 }))
      .resolves.toMatchObject({ totalQuantity: 4 });
    await expect(service.remove('42', itemId)).resolves.toMatchObject({ items: [] });
    await expect(service.update('42', '../other-user', { quantity: 1 }))
      .rejects.toThrow('Invalid cart item id');
  });

  it('rejects malformed users, SKU ids and quantities before storage', async () => {
    const service = new CartService(repository());
    await expect(service.get('user-1')).rejects.toThrow('Invalid user id');
    await expect(service.add('42', { skuId: 'not-a-uuid', quantity: 1 }))
      .rejects.toThrow('Invalid SKU id');
    await expect(service.add('42', { skuId, quantity: 0 }))
      .rejects.toThrow('Invalid cart item quantity');
    await expect(service.add('42', { skuId, quantity: 1.5 }))
      .rejects.toThrow('Invalid cart item quantity');
  });
});
