import { describe, expect, it } from 'vitest';
import type { CartRepositoryItem } from '../src/modules/cart/cart-service.js';
import {
  CheckoutService,
  FixedShippingQuoteProvider,
  type CheckoutRepository,
  type ShippingQuoteProvider
} from '../src/modules/checkout/checkout-service.js';

const itemId = '8a9a0fea-44bc-4fa2-9d76-2137596ed108';
const skuId = 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103';
const cartItem: CartRepositoryItem = {
  id: itemId,
  skuId,
  quantity: 2,
  skuName: '16 枚双层礼盒',
  productName: '舟曲吊柿',
  coverObjectKey: 'products/zhouqu/cover.webp',
  salePriceCent: 16800,
  specs: [{ name: '包装', value: '双层礼盒' }],
  isValid: true,
  invalidReason: null
};

function repository(items: CartRepositoryItem[] = [cartItem]): CheckoutRepository {
  return {
    findOwnedAddress: async (userId, addressId) => userId === '42' && addressId === '9' ? {
      id: '9', recipientName: '张三', phone: '13800138000', province: '甘肃省',
      city: '甘南州', district: '舟曲县', detail: '城关镇 1 号'
    } : null,
    listCartItems: async () => items
  };
}

const shipping: ShippingQuoteProvider = {
  quote: async () => ({ method: 'STANDARD', feeCent: 1200, description: '标准配送' })
};

describe('CheckoutService', () => {
  it('calculates prices on the server and exposes explicit discount placeholders', async () => {
    const preview = await new CheckoutService(repository(), shipping).preview('42', {
      addressId: '9', cartItemIds: [itemId]
    });
    expect(preview).toMatchObject({
      address: { id: '9', province: '甘肃省' },
      items: [{ cartItemId: itemId, quantity: 2, lineAmountCent: 33600 }],
      merchandiseAmountCent: 33600,
      discountAmountCent: 0,
      discounts: [],
      shipping: { method: 'STANDARD', feeCent: 1200 },
      payableAmountCent: 34800
    });
  });

  it('rejects addresses not owned by the current user', async () => {
    await expect(new CheckoutService(repository(), shipping).preview('42', {
      addressId: '10', cartItemIds: [itemId]
    })).rejects.toThrow('Checkout address not found');
  });

  it('rejects missing, duplicate and unavailable cart items', async () => {
    const service = new CheckoutService(repository(), shipping);
    await expect(service.preview('42', { addressId: '9', cartItemIds: [] }))
      .rejects.toThrow('Checkout requires cart items');
    await expect(service.preview('42', { addressId: '9', cartItemIds: [itemId, itemId] }))
      .rejects.toThrow('Duplicate cart item id');
    await expect(new CheckoutService(repository([]), shipping).preview('42', {
      addressId: '9', cartItemIds: [itemId]
    })).rejects.toThrow('Checkout cart item not found');
    await expect(new CheckoutService(repository([{ ...cartItem, isValid: false, invalidReason: 'SKU_OFF_SALE' }]), shipping)
      .preview('42', { addressId: '9', cartItemIds: [itemId] }))
      .rejects.toThrow('Checkout contains unavailable item');
  });

  it('rejects malformed identifiers and invalid shipping quotes', async () => {
    const service = new CheckoutService(repository(), shipping);
    await expect(service.preview('user', { addressId: '9', cartItemIds: [itemId] }))
      .rejects.toThrow('Invalid user id');
    await expect(service.preview('42', { addressId: '0', cartItemIds: [itemId] }))
      .rejects.toThrow('Invalid address id');
    await expect(service.preview('42', { addressId: '9', cartItemIds: ['../cart'] }))
      .rejects.toThrow('Invalid cart item id');
    const invalidShipping: ShippingQuoteProvider = {
      quote: async () => ({ method: 'STANDARD', feeCent: -1, description: 'bad' })
    };
    await expect(new CheckoutService(repository(), invalidShipping).preview('42', {
      addressId: '9', cartItemIds: [itemId]
    })).rejects.toThrow('Invalid shipping quote');
  });

  it('supports configured fixed shipping with an optional free-shipping threshold', async () => {
    const provider = new FixedShippingQuoteProvider({ feeCent: 1200, freeAboveCent: 30000 });
    await expect(provider.quote({
      address: { id: '9', recipientName: '张三', phone: '13800138000', province: '甘肃省', city: '甘南州', district: '舟曲县', detail: '1 号' },
      items: [], merchandiseAmountCent: 29999
    })).resolves.toMatchObject({ feeCent: 1200, method: 'STANDARD' });
    await expect(provider.quote({
      address: { id: '9', recipientName: '张三', phone: '13800138000', province: '甘肃省', city: '甘南州', district: '舟曲县', detail: '1 号' },
      items: [], merchandiseAmountCent: 30000
    })).resolves.toMatchObject({ feeCent: 0, description: '满额包邮' });
  });
});
