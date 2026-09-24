export interface PublicApiRequest {
  readonly url: string;
  readonly method: 'GET';
  readonly data?: Readonly<Record<string, string | number>>;
}

export interface PublicApiResponse {
  readonly statusCode: number;
  readonly data: unknown;
}

export type PublicApiTransport = (request: PublicApiRequest) => Promise<PublicApiResponse>;
export type PublicApiQuery = Readonly<Record<string, string | number>>;
export type PublicApiGet = <T>(path: string, query?: PublicApiQuery) => Promise<T>;

interface ApiEnvelope<T> {
  readonly code: number;
  readonly message: string;
  readonly data: T;
}

export function createPublicApiGet(baseUrl: string, transport: PublicApiTransport) {
  const configuredBaseUrl = baseUrl.trim();
  const normalizedBaseUrl = configuredBaseUrl === '/' ? '' : configuredBaseUrl.replace(/\/+$/, '');

  return async function get<T>(path: string, query?: PublicApiQuery): Promise<T> {
    if (!configuredBaseUrl) throw new Error('商品服务地址尚未配置');

    let response: PublicApiResponse;
    try {
      response = await transport({
        url: `${normalizedBaseUrl}${path}`,
        method: 'GET',
        ...(query ? { data: query } : {})
      });
    } catch {
      throw new Error('无法连接商品服务，请检查网络后重试');
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error('商品服务暂不可用，请稍后重试');
    }

    if (!isApiEnvelope<T>(response.data) || response.data.code !== 0) {
      throw new Error('商品信息暂时无法读取，请稍后重试');
    }

    return response.data.data;
  };
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === 'object' && value !== null && 'code' in value &&
    'data' in value && typeof (value as { code?: unknown }).code === 'number';
}

function uniTransport(request: PublicApiRequest): Promise<PublicApiResponse> {
  return new Promise((resolve, reject) => {
    const runtime = globalThis as typeof globalThis & {
      uni: { request: (options: PublicApiRequest & {
        readonly timeout: number;
        readonly success: (response: PublicApiResponse) => void;
        readonly fail: () => void;
      }) => void };
    };
    runtime.uni.request({
      ...request,
      timeout: 10_000,
      success: (response) => resolve({ statusCode: response.statusCode, data: response.data }),
      fail: () => reject(new Error('network request failed'))
    });
  });
}

const miniappEnv = (import.meta as ImportMeta & { readonly env?: { readonly VITE_API_BASE_URL?: string } }).env;
export const publicApiGet = createPublicApiGet(miniappEnv?.VITE_API_BASE_URL ?? '', uniTransport);
