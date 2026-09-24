import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminAuthService, hashAdminPassword, type AdminAuthRepository } from '../src/modules/admin/admin-auth-service.js';
import { createAdminHttpHandler } from '../src/modules/admin/admin-http-handler.js';
import { AdminCategoryService, type CategoryRepository } from '../src/modules/catalog/category-service.js';
import { AdminProductService, type ProductRepository } from '../src/modules/catalog/product-service.js';
import { AdminStoryService, type Story, type StoryInput, type StoryRepository } from '../src/modules/content/story-service.js';

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
      setArchived: async () => { throw new Error('Product not found'); },
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

  it('protects story administration with content RBAC and exposes only published public fields', async () => {
    const passwordHash = await hashAdminPassword('story test password');
    const sessions = new Set<string>();
    const authRepo: AdminAuthRepository = {
      findUser: async username => username === 'editor' ? { id: '1', username, displayName: '内容编辑', passwordHash, status: 'ACTIVE' } : null,
      createSession: async ({ tokenHash }) => { sessions.add(tokenHash); },
      findSession: async hash => sessions.has(hash) ? { id: '1', username: 'editor', displayName: '内容编辑', status: 'ACTIVE', permissions: ['content.story.read'] } : null,
      revokeSession: async hash => { sessions.delete(hash); }
    };
    const story: Story = {
      id: '7', publicId: '6ed7300a-f580-49ef-a844-a5f0c58b44aa', contentType: 'ORIGIN', title: '内测文章', summary: '用于接口测试。',
      body: '内测正文', coverObjectKey: 'products/internal-test/orchard.png', relatedProductPublicId: null, relatedProduct: null,
      status: 'PUBLISHED', sortOrder: 0, publishedAt: new Date().toISOString()
    };
    const input: StoryInput = { contentType: 'ORIGIN', title: story.title, summary: story.summary, body: story.body, coverObjectKey: story.coverObjectKey, relatedProductPublicId: null, sortOrder: 0 };
    const stories: StoryRepository = {
      create: async value => ({ ...story, ...value, id: '8', status: 'DRAFT' }),
      update: async (id, value) => ({ ...story, ...value, id }),
      findById: async id => id === story.id ? story : null,
      listAdmin: async () => ({ items: [story], total: 1 }),
      setStatus: async (id, status) => ({ ...story, id, status }),
      listPublished: async () => [story],
      findPublishedByPublicId: async id => id === story.publicId ? story : null
    };
    const productRepo: ProductRepository = {
      setArchived: async () => { throw new Error('Product not found'); }, findCategory: async () => null,
      create: async value => ({ id: '1', publicId: 'product-public-id', ...value }), update: async (id, value) => ({ id, publicId: 'product-public-id', ...value }),
      findById: async () => null, list: async () => ({ items: [], total: 0 })
    };
    const categoryRepo: CategoryRepository = {
      list: async () => [], findById: async () => null, create: async value => ({ id: '1', ...value }),
      update: async (id, value) => ({ id, ...value }), remove: async () => {}, hasChildren: async () => false, isDescendant: async () => false
    };
    const server = createServer(createAdminHttpHandler({
      auth: new AdminAuthService(authRepo), products: new AdminProductService(productRepo),
      categories: new AdminCategoryService(categoryRepo), stories: new AdminStoryService(stories)
    }));
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test server did not bind');
    const base = `http://127.0.0.1:${address.port}`;
    const login = await fetch(`${base}/api/v1/admin/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'editor', password: 'story test password' }) });
    const token = (await login.json() as { data: { accessToken: string } }).data.accessToken;
    const adminList = await fetch(`${base}/api/v1/admin/stories`, { headers: { Authorization: `Bearer ${token}` } });
    expect(adminList.status).toBe(200);
    const deniedWrite = await fetch(`${base}/api/v1/admin/stories`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    expect(deniedWrite.status).toBe(403);
    const publicList = await fetch(`${base}/api/v1/stories`);
    const publicPayload = await publicList.json();
    expect(publicPayload).toMatchObject({ data: [{ id: story.publicId, title: story.title }] });
    expect(JSON.stringify(publicPayload)).not.toContain('"id":"7"');
  });
});
