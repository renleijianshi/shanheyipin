import { describe, expect, it } from 'vitest';
import { AdminAuthService, hashAdminPassword, type AdminAuthRepository } from '../src/modules/admin/admin-auth-service.js';

async function repository(password: string, status: 'ACTIVE' | 'DISABLED' = 'ACTIVE') {
  const sessions = new Map<string, { expiresAt: Date; revoked: boolean }>();
  const passwordHash = await hashAdminPassword(password);
  const repo: AdminAuthRepository = {
    findUser: async username => username === 'operator' ? {
      id: '4', username, displayName: '运营', passwordHash, status
    } : null,
    createSession: async input => { sessions.set(input.tokenHash, { expiresAt: input.expiresAt, revoked: false }); },
    findSession: async (hash, now) => {
      const session = sessions.get(hash);
      return session && session.expiresAt > now && !session.revoked
        ? { id: '4', username: 'operator', displayName: '运营', status, permissions: ['catalog.product.read'] }
        : null;
    },
    revokeSession: async hash => { const session = sessions.get(hash); if (session) session.revoked = true; }
  };
  return repo;
}

describe('AdminAuthService', () => {
  it('creates an expiring session only after valid credentials and revokes it on logout', async () => {
    const now = new Date('2026-09-24T12:00:00Z');
    const service = new AdminAuthService(await repository('correct horse battery staple'), () => now);
    await expect(service.login('operator', 'wrong password')).rejects.toThrow('Invalid credentials');
    const session = await service.login('operator', 'correct horse battery staple');
    expect(session.admin.displayName).toBe('运营');
    expect(session.expiresAt.getTime() - now.getTime()).toBe(8 * 60 * 60 * 1000);
    await expect(service.authenticate(session.accessToken)).resolves.toMatchObject({ permissions: new Set(['catalog.product.read']) });
    await service.logout(session.accessToken);
    await expect(service.authenticate(session.accessToken)).resolves.toBeNull();
  });

  it('rejects disabled accounts and short passwords cannot be hashed', async () => {
    const service = new AdminAuthService(await repository('correct horse battery staple', 'DISABLED'));
    await expect(service.login('operator', 'correct horse battery staple')).rejects.toThrow('Invalid credentials');
    await expect(hashAdminPassword('short')).rejects.toThrow('12 to 256 characters');
  });
});
