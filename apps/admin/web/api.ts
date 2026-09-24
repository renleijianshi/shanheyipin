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

export async function getAdminData<T>(path: string, signal?: AbortSignal): Promise<T> {
  return adminRequest<T>(path, { method: 'GET', ...(signal ? { signal } : {}) });
}

export async function adminRequest<T>(path: string, init: RequestInit): Promise<T> {
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

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(cents / 100);
}
