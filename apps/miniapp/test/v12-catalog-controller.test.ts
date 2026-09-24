import { describe, expect, it } from 'vitest';
import type { Cart } from '@shanheyipin/shared-types';
import { V12CatalogController } from '../src/v12-catalog-controller.js';
import type { StorefrontProductDetail } from '../src/v12-ports.js';

const product: StorefrontProductDetail = {
  id: '8a9a0fea-44bc-4fa2-9d76-2137596ed108',
  categoryCode: 'seasonal',
  name: '舟曲吊柿', subtitle: '自然霜降，软糯清甜',
  coverObjectKey: 'products/zhouqu/cover.webp', tags: ['柿饼'],
  minSalePriceCent: 5980, maxSalePriceCent: 5980, presaleEnabled: false,
  storefrontCategory: 'seasonal', selectionChannels: ['brand'],
  content: '产地与工艺介绍', origin: '甘肃舟曲', media: [],
  skus: [{
    id: 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103', skuName: '500g',
    salePriceCent: 5980, marketPriceCent: null, weightGram: 500,
    presaleEnabled: false, specs: [{ name: '净含量', value: '500g' }]
  }]
};

const emptyCart: Cart = { items: [], validItemCount: 0, totalQuantity: 0, subtotalCent: 0 };

describe('V12 catalog controller', () => {
  it('loads explicit storefront categories without guessing from names', async () => {
    const controller = new V12CatalogController(
      {
        list: async () => ({ items: [product], total: 1 }),
        search: async () => ({ items: [product], total: 1 }),
        get: async () => product
      },
      {
        get: async () => emptyCart,
        add: async () => emptyCart,
        update: async () => emptyCart,
        remove: async () => emptyCart
      }
    );

    await expect(controller.loadCategory('seasonal')).resolves.toHaveLength(1);
    await expect(controller.loadCategory('gift')).resolves.toHaveLength(0);
  });

  it('keeps selection editorial-only while adding products through CartPort', async () => {
    let addedSkuId = '';
    const controller = new V12CatalogController(
      {
        list: async () => ({ items: [product], total: 1 }),
        search: async () => ({ items: [product], total: 1 }),
        get: async () => product
      },
      {
        get: async () => emptyCart,
        add: async ({ skuId }) => { addedSkuId = skuId; return emptyCart; },
        update: async () => emptyCart,
        remove: async () => emptyCart
      }
    );

    const editorial = await controller.loadSelection('brand');
    expect(editorial[0]).toEqual(expect.objectContaining({ id: product.id, title: product.name }));
    expect(editorial[0]).not.toHaveProperty('priceText');
    await controller.addSkuToCart(product.skus[0]!.id);
    expect(addedSkuId).toBe(product.skus[0]!.id);
  });
});
