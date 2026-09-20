import { describe, expect, it } from 'vitest';
import { AdminSkuService, type SkuRepository } from '../src/modules/catalog/sku-service.js';

const baseInput = {
  productId: '1', skuCode: ' gift-16 ', skuName: ' 精品双层礼盒 16 枚 ',
  salePriceCent: 16800, marketPriceCent: 19800, weightGram: 1200,
  barcode: ' 6971234567890 ', saleStatus: 'DRAFT' as const,
  stockMode: 'BATCH' as const, presaleEnabled: false,
  specs: [{ name: '包装', value: '双层礼盒' }, { name: '数量', value: '16 枚' }]
};

function repository(productStatus: 'DRAFT' | 'ON_SALE' | 'OFF_SALE' = 'ON_SALE'): SkuRepository {
  return {
    findProduct: async (id) => id === '1' ? { id, status: productStatus } : null,
    create: async (input) => ({ id: '1', publicId: 'sku-public-id', ...input }),
    update: async (id, input) => ({ id, publicId: 'sku-public-id', ...input }),
    findById: async () => null,
    list: async () => ({ items: [], total: 0 })
  };
}

describe('AdminSkuService', () => {
  it('normalizes SKU data and creates an order-independent specification signature', async () => {
    const signatures: string[] = [];
    const repo = repository();
    repo.create = async (input) => {
      signatures.push(input.specSignature);
      return { id: '1', publicId: 'sku-public-id', ...input };
    };
    const service = new AdminSkuService(repo);
    const sku = await service.create(baseInput);
    await service.create({ ...baseInput, skuCode: 'gift-16-alt', specs: [...baseInput.specs].reverse() });
    expect(sku).toMatchObject({ skuCode: 'GIFT-16', skuName: '精品双层礼盒 16 枚', barcode: '6971234567890' });
    expect(signatures[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(signatures[1]).toBe(signatures[0]);
  });

  it('matches the case-insensitive database collation when signing specifications', async () => {
    const signatures: string[] = [];
    const repo = repository();
    repo.create = async (input) => {
      signatures.push(input.specSignature);
      return { id: '1', publicId: 'sku-public-id', ...input };
    };
    const service = new AdminSkuService(repo);
    await service.create({
      ...baseInput,
      specs: [{ name: 'Color', value: 'Red' }, { name: 'size', value: 'Large' }]
    });
    await service.create({
      ...baseInput,
      skuCode: 'gift-16-alt',
      specs: [{ name: 'Size', value: 'large' }, { name: 'color', value: 'red' }]
    });
    expect(signatures[1]).toBe(signatures[0]);
  });

  it('rejects decimal or inconsistent money values', async () => {
    const service = new AdminSkuService(repository());
    await expect(service.create({ ...baseInput, salePriceCent: 168.5 })).rejects.toThrow('Invalid sale price');
    await expect(service.create({ ...baseInput, salePriceCent: 4_294_967_296 })).rejects.toThrow('Invalid sale price');
    await expect(service.create({ ...baseInput, marketPriceCent: 10000 })).rejects.toThrow('Market price cannot be lower');
  });

  it('does not allow an SKU to move to another product', async () => {
    const repo = repository();
    repo.findById = async () => ({ id: '9', publicId: 'sku-public-id', ...baseInput, productId: '2' });
    await expect(new AdminSkuService(repo).update('9', baseInput)).rejects.toThrow('SKU cannot change parent product');
  });

  it('validates boolean configuration at the runtime boundary', async () => {
    const service = new AdminSkuService(repository());
    await expect(service.create({ ...baseInput, presaleEnabled: 'yes' as unknown as boolean }))
      .rejects.toThrow('Invalid presale setting');
  });

  it('rejects duplicate specification dimensions', async () => {
    const service = new AdminSkuService(repository());
    await expect(service.create({
      ...baseInput,
      specs: [{ name: '包装', value: '礼盒' }, { name: ' 包装 ', value: '袋装' }]
    })).rejects.toThrow('Duplicate SKU specification');
    await expect(service.create({
      ...baseInput,
      specs: [{ name: 'Color', value: 'Red' }, { name: 'color', value: 'Blue' }]
    })).rejects.toThrow('Duplicate SKU specification');
  });

  it('only allows an SKU on sale when its SPU is on sale', async () => {
    await expect(new AdminSkuService(repository('DRAFT')).create({ ...baseInput, saleStatus: 'ON_SALE' }))
      .rejects.toThrow('Parent product must be on sale');
  });

  it('validates admin pagination bounds', async () => {
    const service = new AdminSkuService(repository());
    await expect(service.list({ productId: '1', page: 1, pageSize: 101 }))
      .rejects.toThrow('Invalid SKU page size');
  });
});
