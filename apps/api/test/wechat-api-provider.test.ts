import { describe, expect, it } from 'vitest';
import { WeChatApiIdentityProvider } from '../src/modules/auth/wechat-api-provider.js';

describe('WeChatApiIdentityProvider', () => {
  it('uses the fixed WeChat endpoint and returns validated identity fields', async () => {
    let requestedUrl: URL | undefined;
    const provider = new WeChatApiIdentityProvider(
      { appId: 'app-id', appSecret: 'app-secret' },
      async (input) => {
        requestedUrl = new URL(input instanceof Request ? input.url : input);
        return Response.json({ openid: 'open-id', unionid: 'union-id', session_key: 'ignored' });
      }
    );

    await expect(provider.exchangeCode('login-code')).resolves.toEqual({
      openId: 'open-id',
      unionId: 'union-id'
    });
    expect(requestedUrl?.origin).toBe('https://api.weixin.qq.com');
    expect(requestedUrl?.pathname).toBe('/sns/jscode2session');
    expect(requestedUrl?.searchParams.get('js_code')).toBe('login-code');
  });

  it('returns a generic error when WeChat rejects the code', async () => {
    const provider = new WeChatApiIdentityProvider(
      { appId: 'app-id', appSecret: 'app-secret' },
      async () => Response.json({ errcode: 40029, errmsg: 'invalid code with provider details' })
    );

    await expect(provider.exchangeCode('login-code')).rejects.toThrow('WeChat login failed');
  });
});
