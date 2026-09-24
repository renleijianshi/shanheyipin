import { describe, expect, it } from 'vitest';
import type { PublicProductDetail, PublicProductListResult } from '@shanheyipin/shared-types';
import { createPublicCatalogPort, type PublicApiGet } from '../src/public-catalog-port.js';

const summary = {
  id: '8a9a0fea-44bc-4fa2-9d76-2137596ed108',
  categoryCode: 'gift',
  name: '舟曲吊柿礼盒',
  subtitle: '自然霜降，软糯清甜',
  coverObjectKey: 'products/zhouqu/cover.webp',
  tags: ['柿饼', '送礼'],
  minSalePriceCent: 16800,
  maxSalePriceCent: 16800,
  presaleEnabled: false
};

const detail: PublicProductDetail = {
  ...summary,
  content: '来自后台发布的商品介绍',
  origin: '甘肃舟曲',
  media: [],
  skus: [{
    id: 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103',
    skuName: '16 枚礼盒',
    salePriceCent: 16800,
    marketPriceCent: 19800,
    weightGram: 1200,
    presaleEnabled: false,
    specs: [{ name: '包装', value: '礼盒' }]
  }]
};

describe('public catalog port', () => {
  it('loads published products from the shared public API and maps the managed category code', async () => {
    const requests: Array<{ path: string; query?: Readonly<Record<string, string | number>> }> = [];
    const get: PublicApiGet = async <T>(path: string, query?: Readonly<Record<string, string | number>>) => {
      requests.push({ path, ...(query ? { query } : {}) });
      return { items: [summary], total: 1 } as T;
    };
    const port = createPublicCatalogPort(get);

    await expect(port.list({ page: 1, pageSize: 20 })).resolves.toEqual({
      items: [{ ...summary, storefrontCategory: 'gift', selectionChannels: [] }],
      total: 1
    });
    expect(requests).toEqual([{ path: '/api/v1/products', query: { page: 1, pageSize: 20 } }]);
  });

  it('requests product details by encoded public ID and preserves real SKU data', async () => {
    const requests: string[] = [];
    const get: PublicApiGet = async <T>(path: string) => {
      requests.push(path);
      return detail as T;
    };
    const port = createPublicCatalogPort(get);

    await expect(port.get('product/with slash')).resolves.toMatchObject({
      content: '来自后台发布的商品介绍',
      skus: detail.skus,
      storefrontCategory: 'gift'
    });
    expect(requests).toEqual(['/api/v1/products/product%2Fwith%20slash']);
  });

  it('keeps unknown category codes out of named storefront filters', async () => {
    const get: PublicApiGet = async <T>() => ({
      items: [{ ...summary, categoryCode: 'unmapped-category' }], total: 1
    } satisfies PublicProductListResult) as T;
    const port = createPublicCatalogPort(get);

    await expect(port.list({ page: 1, pageSize: 20 })).resolves.toMatchObject({
      items: [{ storefrontCategory: null, selectionChannels: [] }]
    });
  });
});
