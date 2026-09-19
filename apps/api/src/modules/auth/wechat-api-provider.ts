import type {
  WeChatIdentity,
  WeChatIdentityProvider
} from './wechat-login-service.js';

export interface WeChatLoginConfig {
  readonly appId: string;
  readonly appSecret: string;
}

export function readWeChatLoginConfig(
  env: Readonly<Record<string, string | undefined>>
): WeChatLoginConfig {
  const appId = env.WECHAT_MINIAPP_APP_ID;
  const appSecret = env.WECHAT_MINIAPP_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('WeChat login is not configured');
  }
  return { appId, appSecret };
}

export class WeChatApiIdentityProvider implements WeChatIdentityProvider {
  constructor(
    private readonly config: WeChatLoginConfig,
    private readonly fetcher: typeof fetch = fetch
  ) {}

  async exchangeCode(code: string): Promise<WeChatIdentity> {
    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.search = new URLSearchParams({
      appid: this.config.appId,
      secret: this.config.appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    }).toString();

    const response = await this.fetcher(url, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      throw new Error('WeChat login failed');
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload) || typeof payload.openid !== 'string' || payload.openid === '') {
      throw new Error('WeChat login failed');
    }

    if (typeof payload.unionid === 'string' && payload.unionid !== '') {
      return { openId: payload.openid, unionId: payload.unionid };
    }
    return { openId: payload.openid };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
