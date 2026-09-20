import { describe, expect, it } from 'vitest';
import {
  PublicCatalogService,
  type PublicCatalogRepository
} from '../src/modules/catalog/catalog-query-service.js';

const product = {
  id: '8a9a0fea-44bc-4fa2-9d76-2137596ed108',
  name: '舟曲吊柿',
  subtitle: '自然霜降，软糯清甜',
  coverObjectKey: 'products/zhouqu/cover.webp',
  tags: ['柿饼', '送礼'],
  minSalePriceCent: 5980,
  maxSalePriceCent: 16800,
  presaleEnabled: false
};

function repository(): PublicCatalogRepository {
  return {
    listPublished: async () => ({ items: [product], total: 1 }),
    findPublishedByPublicId: async (id) => id === product.id ? {
      ...product,
      content: '舟曲产地与古法慢晒工艺',
      origin: '甘肃舟曲',
      media: [{ type: 'IMAGE', objectKey: product.coverObjectKey, altText: '舟曲吊柿' }],
      skus: [{
        id: 'af3cbd2c-e282-4ea2-8b95-5c9d449c3103', skuName: '16 枚双层礼盒',
        salePriceCent: 16800, marketPriceCent: 19800, weightGram: 1200,
        presaleEnabled: false, specs: [{ name: '包装', value: '双层礼盒' }]
      }]
    } : null
  };
}

describe('PublicCatalogService', () => {
  it('lists published products with bounded pagination', async () => {
    await expect(new PublicCatalogService(repository()).list({ page: 1, pageSize: 20 }))
      .resolves.toEqual({ items: [product], total: 1 });
    await expect(new PublicCatalogService(repository()).list({ page: 1, pageSize: 51 }))
      .rejects.toThrow('Invalid public product page size');
  });

  it('normalizes search keywords and rejects oversized input', async () => {
    let receivedKeyword = '';
    const repo = repository();
    repo.listPublished = async (query) => {
      receivedKeyword = query.keyword ?? '';
      return { items: [product], total: 1 };
    };
    const service = new PublicCatalogService(repo);
    await service.search({ keyword: '  舟曲吊柿  ', page: 1, pageSize: 20 });
    expect(receivedKeyword).toBe('舟曲吊柿');
    await expect(service.search({ keyword: '柿'.repeat(51), page: 1, pageSize: 20 }))
      .rejects.toThrow('Invalid product search keyword');
  });

  it('returns a published product detail by stable public id', async () => {
    const detail = await new PublicCatalogService(repository()).get(product.id);
    expect(detail).toMatchObject({ id: product.id, skus: [{ salePriceCent: 16800 }] });
  });

  it('does not reveal missing, draft or off-sale products', async () => {
    await expect(new PublicCatalogService(repository()).get('90e68ba2-2e94-4bc3-aadc-cc755132f5f4'))
      .rejects.toThrow('Product not found');
  });

  it('validates category and public product identifiers', async () => {
    const service = new PublicCatalogService(repository());
    await expect(service.list({ page: 1, pageSize: 20, categoryId: '0 OR 1=1' }))
      .rejects.toThrow('Invalid category id');
    await expect(service.get('../secret')).rejects.toThrow('Invalid product id');
  });
});
