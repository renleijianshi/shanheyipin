import { describe, expect, it } from 'vitest';
import { AddressService } from '../src/modules/addresses/address-service.js';

const validAddress = {
  recipientName: '张三', phone: '13800138000', province: '甘肃省', city: '甘南州',
  district: '舟曲县', detail: '城关镇 1 号', isDefault: true
};

describe('AddressService', () => {
  it('validates and creates an address owned by the current user', async () => {
    let saved: unknown;
    const service = new AddressService({
      list: async () => [],
      create: async (userId, input) => { saved = { userId, ...input }; return { id: '1', ...input }; },
      update: async () => { throw new Error('unused'); },
      remove: async () => undefined
    });
    await service.create('user-1', validAddress);
    expect(saved).toMatchObject({ userId: 'user-1', phone: '13800138000', isDefault: true });
  });

  it('rejects invalid phone numbers', async () => {
    const service = new AddressService({
      list: async () => [], create: async () => { throw new Error('unused'); },
      update: async () => { throw new Error('unused'); }, remove: async () => undefined
    });
    await expect(service.create('user-1', { ...validAddress, phone: '123' }))
      .rejects.toThrow('Invalid recipient phone');
  });

  it('creates an order-safe address snapshot without ownership fields', () => {
    expect(AddressService.toOrderSnapshot({ id: '9', ...validAddress })).toEqual(validAddress);
  });
});
