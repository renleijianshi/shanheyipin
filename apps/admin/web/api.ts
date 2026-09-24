export interface AdminProduct {
  readonly id: string;
  readonly publicId: string;
  readonly name: string;
  readonly subtitle: string | null;
  readonly productType: 'STANDARD' | 'BUNDLE';
  readonly origin: string | null;
  readonly status: 'DRAFT' | 'ON_SALE' | 'OFF_SALE';
  readonly categoryId: string;
  readonly media: readonly { readonly objectKey: string; readonly type: 'IMAGE' | 'VIDEO' }[];
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
  const token = sessionStorage.getItem('shanhe.admin.accessToken');
  const request: RequestInit = {};
  if (token) request.headers = { Authorization: `Bearer ${token}` };
  if (signal) request.signal = signal;
  const response = await fetch(`/api/v1/admin/${path}`, request);
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? '需要管理账号授权' : `服务暂不可用（${response.status}）`);
  const payload: unknown = await response.json();
  if (payload && typeof payload === 'object' && 'data' in payload) return (payload as { data: T }).data;
  return payload as T;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(cents / 100);
}
