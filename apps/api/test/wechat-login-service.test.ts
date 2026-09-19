import { describe, expect, it } from 'vitest';
import { WeChatLoginService } from '../src/modules/auth/wechat-login-service.js';

describe('WeChatLoginService', () => {
  it('exchanges a code, resolves the user and creates a session', async () => {
    const createdSessions: unknown[] = [];
    const service = new WeChatLoginService({
      identityProvider: {
        exchangeCode: async () => ({ openId: 'wx-open-id' })
      },
      users: {
        findOrCreateByWeChat: async () => ({ id: 'user-1', status: 'active' })
      },
      sessions: {
        create: async (session) => {
          createdSessions.push(session);
        }
      },
      tokens: {
        create: () => ({ raw: 'access-token', hash: 'token-hash' })
      },
      now: () => new Date('2026-09-20T00:00:00.000Z')
    });

    await expect(service.login('valid-code')).resolves.toEqual({
      accessToken: 'access-token',
      expiresAt: new Date('2026-09-27T00:00:00.000Z'),
      userId: 'user-1'
    });
    expect(createdSessions).toEqual([
      {
        expiresAt: new Date('2026-09-27T00:00:00.000Z'),
        tokenHash: 'token-hash',
        userId: 'user-1'
      }
    ]);
  });

  it('rejects malformed login codes before calling WeChat', async () => {
    const service = new WeChatLoginService({
      identityProvider: { exchangeCode: async () => ({ openId: 'unused' }) },
      users: { findOrCreateByWeChat: async () => ({ id: 'unused', status: 'active' }) },
      sessions: { create: async () => undefined },
      tokens: { create: () => ({ raw: 'unused', hash: 'unused' }) }
    });

    await expect(service.login(' bad code ')).rejects.toThrow('Invalid WeChat login code');
  });

  it('does not issue a session for a disabled user', async () => {
    const service = new WeChatLoginService({
      identityProvider: { exchangeCode: async () => ({ openId: 'wx-open-id' }) },
      users: { findOrCreateByWeChat: async () => ({ id: 'user-1', status: 'disabled' }) },
      sessions: { create: async () => undefined },
      tokens: { create: () => ({ raw: 'unused', hash: 'unused' }) }
    });

    await expect(service.login('valid-code')).rejects.toThrow('User account is disabled');
  });
});
