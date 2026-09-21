import { describe, expect, it } from 'vitest';
import type { CheckoutPreview } from '@shanheyipin/shared-types';
import {
  OrderService,
  type CheckoutPreviewProvider,
  type OrderRepository,
  type PersistedOrder
} from '../src/modules/orders/order-service.js';

const itemId = '8a9a0fea-44bc-4fa2-9d76-2137596ed108';
const orderId = 'f410126b-b44a-483f-aad5-8dfb83382599';
const preview: CheckoutPreview = {
  address: { id: '9', recipientName: '张三', phone: '13800138000', province: '甘肃省', city: '甘南州', district: '舟曲县', detail: '城关镇 1 号' },
  items: [{
    cartItemId: itemId, skuId: 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103', productName: '舟曲吊柿',
    skuName: '16 枚双层礼盒', coverObjectKey: 'products/zhouqu/cover.webp', specs: [{ name: '包装', value: '双层礼盒' }],
    quantity: 2, unitPriceCent: 16800, lineAmountCent: 33600
  }],
  merchandiseAmountCent: 33600, discounts: [], discountAmountCent: 0,
  shipping: { method: 'STANDARD', feeCent: 1200, description: '标准配送' }, payableAmountCent: 34800
};

function checkout(): CheckoutPreviewProvider {
  return { preview: async () => preview };
}

function repository(): OrderRepository {
  const byKey = new Map<string, { hash: string; order: PersistedOrder }>();
  const order: PersistedOrder = {
    id: orderId, orderNo: 'SH20260921A1B2C3D4E5F6', orderType: 'STANDARD', orderStatus: 'CREATED',
    paymentStatus: 'UNPAID', fulfillmentStatus: 'UNFULFILLED', aftersaleStatus: 'NONE',
    goodsAmountCent: 33600, discountAmountCent: 0, freightAmountCent: 1200, payableAmountCent: 34800,
    paidAmountCent: 0, createdAt: '2026-09-21T00:00:00.000Z', items: preview.items,
    address: preview.address, priceDetails: [
      { type: 'GOODS', description: '商品金额', amountCent: 33600 },
      { type: 'FREIGHT', description: '标准配送', amountCent: 1200 },
      { type: 'PAYABLE', description: '应付金额', amountCent: 34800 }
    ], statusLogs: [{ fromStatus: null, toStatus: 'CREATED', reason: 'ORDER_CREATED', createdAt: '2026-09-21T00:00:00.000Z' }]
  };
  return {
    findByIdempotency: async (_userId, key, hash) => {
      const existing = byKey.get(key);
      if (!existing) return null;
      if (existing.hash !== hash) throw new Error('Idempotency key reused with different request');
      return existing.order;
    },
    create: async (input) => {
      const existing = byKey.get(input.idempotencyKey);
      if (existing) {
        if (existing.hash !== input.requestHash) throw new Error('Idempotency key reused with different request');
        return existing.order;
      }
      byKey.set(input.idempotencyKey, { hash: input.requestHash, order });
      return order;
    },
    list: async () => ({ items: [order], total: 1 }),
    findOwned: async (_userId, id) => id === orderId ? order : null,
    cancel: async (_userId, id) => {
      if (id !== orderId) throw new Error('Order not found');
      if (order.orderStatus !== 'CREATED') throw new Error('Order cannot be cancelled');
      return { ...order, orderStatus: 'CANCELLED' };
    }
  };
}

describe('OrderService', () => {
  it('creates an unpaid standard order with immutable checkout snapshots', async () => {
    const service = new OrderService(checkout(), repository());
    await expect(service.create('42', 'order:web:4bf61ee7', { addressId: '9', cartItemIds: [itemId] }))
      .resolves.toMatchObject({
        id: orderId, orderStatus: 'CREATED', paymentStatus: 'UNPAID', payableAmountCent: 34800,
        items: [{ productName: '舟曲吊柿', unitPriceCent: 16800 }],
        statusLogs: [{ fromStatus: null, toStatus: 'CREATED' }]
      });
  });

  it('replays the same order for the same intent and rejects key reuse with another payload', async () => {
    let previewCalls = 0;
    const checkoutOnce: CheckoutPreviewProvider = {
      preview: async () => {
        previewCalls += 1;
        if (previewCalls > 1) throw new Error('cart was already cleared');
        return preview;
      }
    };
    const service = new OrderService(checkoutOnce, repository());
    const first = await service.create('42', 'order:web:4bf61ee7', { addressId: '9', cartItemIds: [itemId] });
    const replay = await service.create('42', 'order:web:4bf61ee7', { addressId: '9', cartItemIds: [itemId] });
    expect(replay.id).toBe(first.id);
    expect(previewCalls).toBe(1);
    await expect(service.create('42', 'order:web:4bf61ee7', { addressId: '10', cartItemIds: [itemId] }))
      .rejects.toThrow('Idempotency key reused with different request');
  });

  it('validates idempotency keys and pagination at the boundary', async () => {
    const service = new OrderService(checkout(), repository());
    await expect(service.create('42', 'short', { addressId: '9', cartItemIds: [itemId] }))
      .rejects.toThrow('Invalid idempotency key');
    await expect(service.list('42', { page: 0, pageSize: 20 })).rejects.toThrow('Invalid order page');
    await expect(service.list('42', { page: 1, pageSize: 51 })).rejects.toThrow('Invalid order page size');
  });

  it('enforces ownership and only allows created orders to be cancelled', async () => {
    const service = new OrderService(checkout(), repository());
    await expect(service.get('42', orderId)).resolves.toMatchObject({ id: orderId });
    await expect(service.get('42', '8df4000d-445b-4d0c-8a92-f0f69dc3295a')).rejects.toThrow('Order not found');
    await expect(service.cancel('42', orderId, '用户不再需要')).resolves.toMatchObject({ orderStatus: 'CANCELLED' });
    await expect(service.cancel('42', '../order', '取消')).rejects.toThrow('Invalid order id');
  });
});
