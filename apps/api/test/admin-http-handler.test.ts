import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminAuthService, hashAdminPassword, type AdminAuthRepository } from '../src/modules/admin/admin-auth-service.js';
import { createAdminHttpHandler } from '../src/modules/admin/admin-http-handler.js';
import { AdminCategoryService, type CategoryRepository } from '../src/modules/catalog/category-service.js';
import { AdminProductService, type ProductRepository } from '../src/modules/catalog/product-service.js';

describe('admin HTTP catalog routes', () => {
  const servers: ReturnType<typeof createServer>[] = [];
  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
  });

  it('serves catalog reads only with a valid session and required permission', async () => {
    const passwordHash = await hashAdminPassword('correct horse battery staple');
    const sessions = new Set<string>();
    const authRepo: AdminAuthRepository = {
      findUser: async username => username === 'operator' ? { id: '1', username, displayName: '运营', passwordHash, status: 'ACTIVE' } : null,
      createSession: async ({ tokenHash }) => { sessions.add(tokenHash); },
      findSession: async hash => sessions.has(hash) ? { id: '1', username: 'operator', displayName: '运营', status: 'ACTIVE', permissions: ['catalog.product.read'] } : null,
      revokeSession: async hash => { sessions.delete(hash); }
    };
    const productList = vi.fn(async () => ({ items: [], total: 0 }));
    const productRepo: ProductRepository = {
      findCategory: async () => ({ id: '1', status: 'ENABLED' }),
      create: async input => ({ id: '1', publicId: 'public-id', ...input }),
      update: async (id, input) => ({ id, publicId: 'public-id', ...input }),
      findById: async () => null,
      list: productList
    };
    const categoryRepo: CategoryRepository = {
      list: async () => [], findById: async () => null, create: async input => ({ id: '1', ...input }),
      update: async (id, input) => ({ id, ...input }), remove: async () => {}, hasChildren: async () => false,
      isDescendant: async () => false
    };
    const server = createServer(createAdminHttpHandler({ auth: new AdminAuthService(authRepo), products: new AdminProductService(productRepo), categories: new AdminCategoryService(categoryRepo) }));
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test server did not bind');
    const base = `http://127.0.0.1:${address.port}/api/v1/admin`;
    const unauthorized = await fetch(`${base}/products`);
    expect(unauthorized.status).toBe(401);
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'operator', password: 'correct horse battery staple' }) });
    expect(login.status).toBe(200);
    const token = (await login.json() as { data: { accessToken: string } }).data.accessToken;
    const response = await fetch(`${base}/products?page=1&pageSize=20`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ code: 0, data: { items: [], total: 0 } });
    const deniedWrite = await fetch(`${base}/products`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' });
    expect(deniedWrite.status).toBe(403);
    expect(productList).toHaveBeenCalledOnce();
    productList.mockRejectedValueOnce(new Error('SQL connection contains private details'));
    const unavailable = await fetch(`${base}/products`, { headers: { Authorization: `Bearer ${token}` } });
    expect(unavailable.status).toBe(500);
    expect(await unavailable.json()).toMatchObject({ message: '服务器暂时无法处理请求' });
  });
});
