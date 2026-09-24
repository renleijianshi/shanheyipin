import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AdminAuthService, AdminSessionPrincipal } from './admin-auth-service.js';
import { isAdminAuthorized } from './rbac.js';
import type { AdminCategoryService } from '../catalog/category-service.js';
import type { AdminProductService, ProductInput, ProductStatus } from '../catalog/product-service.js';
import type { PublicCatalogService } from '../catalog/catalog-query-service.js';
import type { PublicCategoryService } from '../catalog/category-service.js';
import type { AdminSkuService, SkuInput, SkuSaleStatus } from '../catalog/sku-service.js';

export interface AdminHttpServices {
  readonly auth: AdminAuthService;
  readonly products: AdminProductService;
  readonly categories: AdminCategoryService;
  readonly publicCatalog?: PublicCatalogService;
  readonly publicCategories?: PublicCategoryService;
  readonly skus?: AdminSkuService;
  readonly dashboard?: () => Promise<{
    readonly todaySalesCent: number;
    readonly todayOrders: number;
    readonly pendingShipments: number;
    readonly aftersales: number;
  }>;
}

const MAX_BODY_BYTES = 1_048_576;

export function createAdminHttpHandler(services: AdminHttpServices) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const requestId = randomUUID();
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (request.method === 'OPTIONS') { response.writeHead(204, { Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }).end(); return; }
      if (url.pathname === '/health' && request.method === 'GET') { send(response, 200, { code: 0, message: 'ok', data: { service: 'api', status: 'ok' }, requestId }); return; }
      if (await handlePublicCatalog(request, response, url, services, requestId)) return;
      if (!url.pathname.startsWith('/api/v1/admin/')) { send(response, 404, { code: 404, message: 'Not found', data: null, requestId }); return; }

      const token = bearerToken(request.headers.authorization);
      if (url.pathname === '/api/v1/admin/auth/login' && request.method === 'POST') {
        const body = await readBody(request);
        const result = await services.auth.login(requiredText(body.username), requiredText(body.password));
        send(response, 200, { code: 0, message: 'ok', data: result, requestId }); return;
      }
      const principal = await services.auth.authenticate(token);
      if (!principal) { send(response, 401, { code: 401, message: '需要管理账号授权', data: null, requestId }); return; }
      if (url.pathname === '/api/v1/admin/auth/logout' && request.method === 'POST') {
        await services.auth.logout(token); send(response, 200, { code: 0, message: 'ok', data: null, requestId }); return;
      }
      if (url.pathname === '/api/v1/admin/auth/me' && request.method === 'GET') {
        send(response, 200, { code: 0, message: 'ok', data: { id: principal.id, username: principal.username, displayName: principal.displayName, permissions: [...principal.permissions] }, requestId }); return;
      }

      if (url.pathname === '/api/v1/admin/dashboard' && request.method === 'GET') {
        requirePermission(principal, 'dashboard.read');
        if (!services.dashboard) throw new Error('Dashboard service not configured');
        send(response, 200, { code: 0, message: 'ok', data: await services.dashboard(), requestId }); return;
      }

      const path = url.pathname.slice('/api/v1/admin/'.length).split('/').filter(Boolean);
      if (path[0] === 'products') { await handleProducts(request, response, url, path, principal, services.products, services.skus, requestId); return; }
      if (path[0] === 'skus') { await handleSkus(request, response, url, path, principal, services.skus, requestId); return; }
      if (path[0] === 'categories') { await handleCategories(request, response, path, principal, services.categories, requestId); return; }
      send(response, 404, { code: 404, message: 'Not found', data: null, requestId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = errorStatus(error, message);
      const safeMessage = status >= 500 ? '服务器暂时无法处理请求' : message;
      send(response, status, { code: status, message: safeMessage, data: null, requestId });
    }
  };
}

async function handlePublicCatalog(request: IncomingMessage, response: ServerResponse, url: URL, services: AdminHttpServices, requestId: string): Promise<boolean> {
  if (request.method !== 'GET') return false;
  if (url.pathname === '/api/v1/categories' && services.publicCategories) {
    send(response, 200, { code: 0, message: 'ok', data: await services.publicCategories.listTree(), requestId }); return true;
  }
  if (!services.publicCatalog) return false;
  if (url.pathname === '/api/v1/products') {
    const page = positiveInteger(url.searchParams.get('page'), 1);
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 20);
    const categoryId = url.searchParams.get('categoryId') ?? undefined;
    const data = await services.publicCatalog.list({ page, pageSize, ...(categoryId ? { categoryId } : {}) });
    send(response, 200, { code: 0, message: 'ok', data, requestId }); return true;
  }
  if (url.pathname === '/api/v1/search') {
    const data = await services.publicCatalog.search({ page: positiveInteger(url.searchParams.get('page'), 1), pageSize: positiveInteger(url.searchParams.get('pageSize'), 20), keyword: url.searchParams.get('keyword') ?? '', ...(url.searchParams.has('categoryId') ? { categoryId: url.searchParams.get('categoryId')! } : {}) });
    send(response, 200, { code: 0, message: 'ok', data, requestId }); return true;
  }
  const match = url.pathname.match(/^\/api\/v1\/products\/([^/]+)$/);
  if (match?.[1]) {
    send(response, 200, { code: 0, message: 'ok', data: await services.publicCatalog.get(decodeURIComponent(match[1])), requestId }); return true;
  }
  return false;
}

async function handleProducts(
  request: IncomingMessage, response: ServerResponse, url: URL, path: string[], principal: AdminSessionPrincipal,
  products: AdminProductService, skus: AdminSkuService | undefined, requestId: string
): Promise<void> {
  const id = path[1];
  if (!id && request.method === 'GET') {
    requirePermission(principal, 'catalog.product.read');
    const page = positiveInteger(url.searchParams.get('page'), 1);
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 20);
    const status = url.searchParams.get('status') as ProductStatus | null;
    const categoryId = url.searchParams.get('categoryId') ?? undefined;
    const data = await products.list({ page, pageSize, ...(status ? { status } : {}), ...(categoryId ? { categoryId } : {}) });
    send(response, 200, { code: 0, message: 'ok', data, requestId }); return;
  }
  if (!id && request.method === 'POST') {
    requirePermission(principal, 'catalog.product.write');
    const data = await products.create(await productInput(await readBody(request)));
    send(response, 201, { code: 0, message: 'ok', data, requestId }); return;
  }
  if (id && path.length === 2 && request.method === 'GET') {
    requirePermission(principal, 'catalog.product.read');
    send(response, 200, { code: 0, message: 'ok', data: await products.get(id), requestId }); return;
  }
  if (id && path[2] === 'skus' && path.length === 3 && request.method === 'GET') {
    requirePermission(principal, 'catalog.product.read');
    if (!skus) throw new Error('SKU service not configured');
    const data = await skus.list({ productId: id, page: positiveInteger(url.searchParams.get('page'), 1), pageSize: positiveInteger(url.searchParams.get('pageSize'), 50) });
    send(response, 200, { code: 0, message: 'ok', data, requestId }); return;
  }
  if (id && path[2] === 'skus' && path.length === 3 && request.method === 'POST') {
    requirePermission(principal, 'catalog.product.write');
    if (!skus) throw new Error('SKU service not configured');
    const data = await skus.create(await skuInput(await readBody(request), id));
    send(response, 201, { code: 0, message: 'ok', data, requestId }); return;
  }
  if (id && path.length === 2 && (request.method === 'PUT' || request.method === 'PATCH')) {
    requirePermission(principal, 'catalog.product.write');
    const data = await products.update(id, await productInput(await readBody(request)));
    send(response, 200, { code: 0, message: 'ok', data, requestId }); return;
  }
  send(response, 404, { code: 404, message: 'Not found', data: null, requestId });
}

async function handleSkus(request: IncomingMessage, response: ServerResponse, _url: URL, path: string[], principal: AdminSessionPrincipal, skus: AdminSkuService | undefined, requestId: string): Promise<void> {
  const id = path[1];
  if (!id || path.length !== 2 || request.method !== 'PUT') { send(response, 404, { code: 404, message: 'Not found', data: null, requestId }); return; }
  requirePermission(principal, 'catalog.product.write');
  if (!skus) throw new Error('SKU service not configured');
  const body = await readBody(request);
  const data = await skus.update(id, await skuInput(body, requiredText(body.productId)));
  send(response, 200, { code: 0, message: 'ok', data, requestId });
}

async function handleCategories(
  request: IncomingMessage, response: ServerResponse, path: string[], principal: AdminSessionPrincipal,
  categories: AdminCategoryService, requestId: string
): Promise<void> {
  const id = path[1];
  if (!id && request.method === 'GET') {
    requirePermission(principal, 'catalog.category.read');
    send(response, 200, { code: 0, message: 'ok', data: await categories.list(), requestId }); return;
  }
  if (!id && request.method === 'POST') {
    requirePermission(principal, 'catalog.category.write');
    const body = await readBody(request);
    const data = await categories.create({ parentId: nullableText(body.parentId), code: requiredText(body.code), name: requiredText(body.name), sortOrder: numberValue(body.sortOrder), status: categoryStatus(body.status) });
    send(response, 201, { code: 0, message: 'ok', data, requestId }); return;
  }
  if (id && path.length === 2 && (request.method === 'PUT' || request.method === 'PATCH')) {
    requirePermission(principal, 'catalog.category.write');
    const body = await readBody(request);
    const data = await categories.update(id, { parentId: nullableText(body.parentId), code: requiredText(body.code), name: requiredText(body.name), sortOrder: numberValue(body.sortOrder), status: categoryStatus(body.status) });
    send(response, 200, { code: 0, message: 'ok', data, requestId }); return;
  }
  if (id && path.length === 2 && request.method === 'DELETE') {
    requirePermission(principal, 'catalog.category.write');
    await categories.remove(id); send(response, 200, { code: 0, message: 'ok', data: null, requestId }); return;
  }
  send(response, 404, { code: 404, message: 'Not found', data: null, requestId });
}

async function productInput(body: Record<string, unknown>): Promise<ProductInput> {
  if (!Array.isArray(body.media) || !Array.isArray(body.tags)) throw new Error('Invalid product media or tags');
  const media = body.media.map((row) => {
    if (!isRecord(row)) throw new Error('Invalid product media');
    const type = requiredText(row.type);
    if (type !== 'IMAGE' && type !== 'VIDEO') throw new Error('Invalid product media type');
    return { type, objectKey: requiredText(row.objectKey), altText: nullableText(row.altText), sortOrder: numberValue(row.sortOrder) } as const;
  });
  return {
    categoryId: requiredText(body.categoryId), name: requiredText(body.name), subtitle: nullableText(body.subtitle),
    productType: body.productType === 'BUNDLE' ? 'BUNDLE' : body.productType === 'STANDARD' ? 'STANDARD' : invalid('Invalid product type'),
    content: requiredText(body.content), origin: nullableText(body.origin), sortOrder: numberValue(body.sortOrder),
    status: productStatus(body.status), media, tags: body.tags.map((tag) => requiredText(tag))
  };
}

async function skuInput(body: Record<string, unknown>, productId: string): Promise<SkuInput> {
  if (!Array.isArray(body.specs)) throw new Error('Invalid SKU specifications');
  const specs = body.specs.map((row) => {
    if (!isRecord(row)) throw new Error('Invalid SKU specification');
    return { name: requiredText(row.name), value: requiredText(row.value) };
  });
  const saleStatus = body.saleStatus;
  if (saleStatus !== 'DRAFT' && saleStatus !== 'ON_SALE' && saleStatus !== 'OFF_SALE') throw new Error('Invalid SKU sale status');
  const marketPriceCent = body.marketPriceCent === null || body.marketPriceCent === undefined || body.marketPriceCent === '' ? null : numberValue(body.marketPriceCent);
  return {
    productId, skuCode: requiredText(body.skuCode), skuName: requiredText(body.skuName), salePriceCent: numberValue(body.salePriceCent),
    marketPriceCent, weightGram: numberValue(body.weightGram), barcode: nullableText(body.barcode), saleStatus: saleStatus as SkuSaleStatus,
    stockMode: 'BATCH', presaleEnabled: body.presaleEnabled === true, specs
  };
}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request body too large');
    chunks.push(buffer);
  }
  if (!size) return {};
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!isRecord(parsed)) throw new Error('Invalid JSON body');
  return parsed;
}

function bearerToken(value: string | undefined): string | null {
  const match = value?.match(/^Bearer ([A-Za-z0-9_-]{40,100})$/);
  return match?.[1] ?? null;
}
function requirePermission(principal: AdminSessionPrincipal, permission: string): void {
  if (!isAdminAuthorized({ status: 'active', permissions: principal.permissions }, [permission])) throw new Error('Permission denied');
}
function positiveInteger(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error('Invalid pagination');
  return parsed;
}
function requiredText(value: unknown): string { if (typeof value !== 'string') throw new Error('Invalid text field'); return value; }
function nullableText(value: unknown): string | null { if (value === null || value === undefined || value === '') return null; return requiredText(value); }
function numberValue(value: unknown): number { if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid number field'); return value; }
function categoryStatus(value: unknown): 'ENABLED' | 'DISABLED' { if (value !== 'ENABLED' && value !== 'DISABLED') return invalid('Invalid category status'); return value; }
function productStatus(value: unknown): ProductStatus { if (value !== 'DRAFT' && value !== 'ON_SALE' && value !== 'OFF_SALE') return invalid('Invalid product status'); return value; }
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function invalid(message: string): never { throw new Error(message); }
function send(response: ServerResponse, status: number, body: unknown): void { response.writeHead(status).end(JSON.stringify(body)); }
function errorStatus(error: unknown, message: string): number {
  if (message === '需要管理账号授权' || message === 'Invalid credentials') return 401;
  if (message === 'Permission denied') return 403;
  if (message === 'Not found' || /not found$/i.test(message)) return 404;
  if (error instanceof SyntaxError || /^(Invalid |Too many |Category has |Duplicate )/.test(message) ||
      /^(Product category must be enabled|On-sale product requires|Market price cannot|SKU cannot|Category hierarchy cycle)/.test(message)) return 400;
  return 500;
}
