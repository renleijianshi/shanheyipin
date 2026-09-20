import { describe, expect, it } from 'vitest';
import {
  AdminProductService,
  type Product,
  type ProductRepository
} from '../src/modules/catalog/product-service.js';

const baseInput = {
  categoryId: '1',
  name: ' 舟曲吊柿 ',
  subtitle: ' 自然霜降，软糯清甜 ',
  productType: 'STANDARD' as const,
  content: ' 产地与工艺介绍 ',
  origin: ' 甘肃舟曲 ',
  sortOrder: 10,
  status: 'DRAFT' as const,
  media: [{
    type: 'IMAGE' as const,
    objectKey: 'products/zhouqu-diaoshi/cover.webp',
    altText: ' 舟曲吊柿 ',
    sortOrder: 0
  }],
  tags: [' 柿饼 ', '送礼', '柿饼']
};

function createRepository(categoryStatus: 'ENABLED' | 'DISABLED' = 'ENABLED'): ProductRepository {
  let current: Product | null = null;
  return {
    findCategory: async (id) => id === '1' ? { id, status: categoryStatus } : null,
    create: async (input) => {
      current = { id: '1', publicId: 'product-public-id', ...input };
      return current;
    },
    update: async (id, input) => {
      current = { id, publicId: 'product-public-id', ...input };
      return current;
    },
    findById: async (id) => current?.id === id ? current : null,
    list: async () => ({ items: current ? [current] : [], total: current ? 1 : 0 })
  };
}

describe('AdminProductService', () => {
  it('normalizes SPU main data, media and unique tags', async () => {
    const service = new AdminProductService(createRepository());
    const product = await service.create(baseInput);

    expect(product).toMatchObject({
      name: '舟曲吊柿', subtitle: '自然霜降，软糯清甜', content: '产地与工艺介绍',
      origin: '甘肃舟曲', status: 'DRAFT', tags: ['柿饼', '送礼']
    });
    expect(product.media[0]).toMatchObject({ altText: '舟曲吊柿', sortOrder: 0 });
  });

  it('updates the complete SPU aggregate', async () => {
    const service = new AdminProductService(createRepository());
    const created = await service.create(baseInput);
    await expect(service.update(created.id, {
      ...baseInput, name: '舟曲吊柿礼赠系列', status: 'OFF_SALE', tags: ['节礼']
    })).resolves.toMatchObject({
      id: created.id, name: '舟曲吊柿礼赠系列', status: 'OFF_SALE', tags: ['节礼']
    });
  });

  it('requires an enabled category and image before a product can go on sale', async () => {
    const disabledCategoryService = new AdminProductService(createRepository('DISABLED'));
    await expect(disabledCategoryService.create({ ...baseInput, status: 'ON_SALE' }))
      .rejects.toThrow('Product category must be enabled');

    const service = new AdminProductService(createRepository());
    await expect(service.create({ ...baseInput, status: 'ON_SALE', media: [] }))
      .rejects.toThrow('On-sale product requires an image');
  });

  it('rejects external URLs and path traversal in product media keys', async () => {
    const service = new AdminProductService(createRepository());
    await expect(service.create({
      ...baseInput,
      media: [{ ...baseInput.media[0]!, objectKey: 'https://example.com/cover.webp' }]
    })).rejects.toThrow('Invalid product media object key');
    await expect(service.create({
      ...baseInput,
      media: [{ ...baseInput.media[0]!, objectKey: 'products/../secret.webp' }]
    })).rejects.toThrow('Invalid product media object key');
  });

  it('rejects duplicate product media object keys', async () => {
    const service = new AdminProductService(createRepository());
    await expect(service.create({
      ...baseInput,
      media: [baseInput.media[0]!, baseInput.media[0]!]
    })).rejects.toThrow('Duplicate product media object key');
  });

  it('validates pagination bounds for admin product lists', async () => {
    const service = new AdminProductService(createRepository());
    await expect(service.list({ page: 0, pageSize: 20 })).rejects.toThrow('Invalid product page');
    await expect(service.list({ page: 1, pageSize: 101 })).rejects.toThrow('Invalid product page size');
  });
});
