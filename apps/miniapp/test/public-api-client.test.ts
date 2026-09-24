import { describe, expect, it, vi } from 'vitest';
import { createPublicApiGet } from '../src/public-api-client.js';

describe('public API client', () => {
  it('sends GET parameters and unwraps the shared API envelope', async () => {
    const transport = vi.fn(async () => ({
      statusCode: 200,
      data: { code: 0, message: 'ok', data: { items: [], total: 0 } }
    }));
    const get = createPublicApiGet('http://127.0.0.1:3200/', transport);

    await expect(get('/api/v1/products', { page: 1, pageSize: 20 })).resolves.toEqual({ items: [], total: 0 });
    expect(transport).toHaveBeenCalledWith({
      url: 'http://127.0.0.1:3200/api/v1/products',
      method: 'GET',
      data: { page: 1, pageSize: 20 }
    });
  });

  it('surfaces service failures without inventing fallback data', async () => {
    const get = createPublicApiGet('http://127.0.0.1:3200', async () => ({
      statusCode: 503,
      data: { code: 503, message: 'database unavailable', data: null }
    }));

    await expect(get('/api/v1/products')).rejects.toThrow('商品服务暂不可用');
  });

  it('does not send requests when the public API address is not configured', async () => {
    const transport = vi.fn();
    const get = createPublicApiGet('', transport);

    await expect(get('/api/v1/products')).rejects.toThrow('商品服务地址尚未配置');
    expect(transport).not.toHaveBeenCalled();
  });
});
