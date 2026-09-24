import { describe, expect, it } from 'vitest';
import { toProductCardView, toProductDetailView } from '../src/catalog-view-model.js';

const summary = {
  id: '8a9a0fea-44bc-4fa2-9d76-2137596ed108',
  categoryCode: 'seasonal',
  name: '舟曲吊柿', subtitle: '自然霜降，软糯清甜',
  coverObjectKey: 'products/zhouqu/cover.webp', tags: ['柿饼', '送礼'],
  minSalePriceCent: 5980, maxSalePriceCent: 16800, presaleEnabled: false
};

describe('miniapp catalog view model', () => {
  it('formats integer cents without floating-point business calculations', () => {
    expect(toProductCardView(summary)).toMatchObject({
      id: summary.id, priceText: '¥59.80 起', coverObjectKey: summary.coverObjectKey
    });
  });

  it('selects the first on-sale SKU as the detail default', () => {
    expect(toProductDetailView({
      ...summary, content: '产地与工艺介绍', origin: '甘肃舟曲', media: [],
      skus: [{
        id: 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103', skuName: '16 枚礼盒',
        salePriceCent: 16800, marketPriceCent: 19800, weightGram: 1200,
        presaleEnabled: false, specs: [{ name: '包装', value: '礼盒' }]
      }]
    })).toMatchObject({ selectedSkuId: 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103', priceText: '¥168.00' });
  });
});
