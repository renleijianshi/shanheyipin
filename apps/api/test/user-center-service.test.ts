import { describe, expect, it } from 'vitest';
import { UserCenterService } from '../src/modules/users/user-center-service.js';

describe('UserCenterService', () => {
  it('returns only the public user profile fields', async () => {
    const service = new UserCenterService({
      getById: async () => ({
        publicId: 'public-user-id',
        nickname: '山禾用户',
        avatarObjectKey: null,
        status: 'active',
        memberSince: new Date('2026-09-20T00:00:00.000Z')
      }),
      updateProfile: async () => {
        throw new Error('not used');
      }
    });

    await expect(service.getProfile('1')).resolves.toEqual({
      publicId: 'public-user-id',
      nickname: '山禾用户',
      avatarObjectKey: null,
      status: 'active',
      memberSince: new Date('2026-09-20T00:00:00.000Z')
    });
  });

  it('trims nickname and accepts an owned avatar object key', async () => {
    let saved: unknown;
    const service = new UserCenterService({
      getById: async () => {
        throw new Error('not used');
      },
      updateProfile: async (_userId, profile) => {
        saved = profile;
        return {
          publicId: 'public-user-id',
          nickname: profile.nickname ?? null,
          avatarObjectKey: profile.avatarObjectKey ?? null,
          status: 'active',
          memberSince: new Date('2026-09-20T00:00:00.000Z')
        };
      }
    });

    await service.updateProfile('1', {
      nickname: '  新昵称  ',
      avatarObjectKey: 'avatars/public-user-id/avatar.webp'
    });
    expect(saved).toEqual({
      nickname: '新昵称',
      avatarObjectKey: 'avatars/public-user-id/avatar.webp'
    });
  });

  it('rejects path traversal in avatar object keys', async () => {
    const service = new UserCenterService({
      getById: async () => {
        throw new Error('not used');
      },
      updateProfile: async () => {
        throw new Error('not used');
      }
    });

    await expect(
      service.updateProfile('1', { avatarObjectKey: 'avatars/../secret' })
    ).rejects.toThrow('Invalid avatar object key');
  });
});
