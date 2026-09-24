export interface AdminProduct {
  readonly id: string;
  readonly publicId: string;
  readonly name: string;
  readonly subtitle: string | null;
  readonly productType: 'STANDARD' | 'BUNDLE';
  readonly origin: string | null;
  readonly status: 'DRAFT' | 'ON_SALE' | 'OFF_SALE';
  readonly categoryId: string;
  readonly sortOrder: number;
  readonly content: string;
  readonly media: readonly { readonly objectKey: string; readonly type: 'IMAGE' | 'VIDEO'; readonly altText: string | null; readonly sortOrder: number }[];
  readonly tags: readonly string[];
}

export interface PageResult<T> {
  readonly items: readonly T[];
  readonly total: number;
}

export interface DashboardData {
  readonly todaySalesCent?: number;
  readonly todayOrders?: number;
  readonly pendingShipments?: number;
  readonly aftersales?: number;
  readonly inventoryAlerts?: number;
}

const previewProduct: AdminProduct = {
  id: '1', publicId: 'c81ed1dd-378e-4f44-88bf-35997d3114a0', name: '舟曲霜降吊柿礼盒', subtitle: '甘肃舟曲 · 自然霜降',
  productType: 'STANDARD', origin: '甘肃舟曲', status: 'ON_SALE', categoryId: '1', sortOrder: 10,
  content: '产自甘肃舟曲，传统吊制、自然挂霜。',
  media: [{ objectKey: 'products/zhouqu-diaoshi/cover.webp', type: 'IMAGE', altText: '舟曲吊柿礼盒', sortOrder: 0 }],
  tags: ['舟曲特产', '当季甄选']
};
const previewCategories = [
  { id: '1', parentId: null, code: 'dried-fruit', name: '山野干果', sortOrder: 10, status: 'ENABLED' },
  { id: '2', parentId: null, code: 'gift-box', name: '山河礼盒', sortOrder: 20, status: 'ENABLED' }
] as const;

export function setAdminPreviewSession(enabled: boolean): void {
  if (enabled) sessionStorage.setItem('shanhe.admin.previewMode', 'true');
  else sessionStorage.removeItem('shanhe.admin.previewMode');
}

export function isAdminPreviewSession(): boolean {
  return import.meta.env.DEV && sessionStorage.getItem('shanhe.admin.previewMode') === 'true';
}

export async function getAdminData<T>(path: string, signal?: AbortSignal): Promise<T> {
  return adminRequest<T>(path, { method: 'GET', ...(signal ? { signal } : {}) });
}

export async function adminRequest<T>(path: string, init: RequestInit): Promise<T> {
  if (isAdminPreviewSession()) return previewRequest<T>(path, init.method ?? 'GET');
  const token = sessionStorage.getItem('shanhe.admin.accessToken');
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api/v1/admin/${path}`, { ...init, headers });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message : `服务暂不可用（${response.status}）`;
    if (response.status === 401) sessionStorage.removeItem('shanhe.admin.accessToken');
    throw new Error(message);
  }
  if (payload && typeof payload === 'object' && 'data' in payload) return (payload as { data: T }).data;
  return payload as T;
}

function previewRequest<T>(path: string, method: string): T {
  if (method !== 'GET') throw new Error('本地预览账号仅供查看，不会保存管理操作');
  let value: unknown;
  if (path === 'auth/me') value = { id: 'preview', username: 'admin', displayName: '本地预览', permissions: ['dashboard.read', 'catalog.product.read', 'catalog.category.read'] };
  else if (path === 'dashboard') value = { todaySalesCent: 128800, todayOrders: 18, pendingShipments: 4, aftersales: 2, inventoryAlerts: 3 };
  else if (path.startsWith('products?')) value = { items: [previewProduct], total: 1 };
  else if (path === 'categories') value = previewCategories;
  else if (/^products\/\d+\/skus(?:\?|$)/.test(path)) value = { items: [], total: 0 };
  else throw new Error('本地预览账号仅供查看，不会保存管理操作');
  return value as T;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(cents / 100);
}
