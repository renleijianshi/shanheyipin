export interface UserProfile {
  readonly publicId: string;
  readonly nickname: string | null;
  readonly avatarObjectKey: string | null;
  readonly status: 'active' | 'disabled' | 'cancelled';
  readonly memberSince: Date;
}

export interface UpdateUserProfile {
  readonly nickname?: string | null;
  readonly avatarObjectKey?: string | null;
}

export interface UserProfileRepository {
  getById(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, profile: UpdateUserProfile): Promise<UserProfile>;
}

const AVATAR_KEY_PATTERN = /^avatars\/[A-Za-z0-9/_-]+\.(?:avif|jpeg|jpg|png|webp)$/;

export class UserCenterService {
  constructor(private readonly users: UserProfileRepository) {}

  getProfile(userId: string): Promise<UserProfile> {
    return this.users.getById(userId);
  }

  async updateProfile(userId: string, input: UpdateUserProfile): Promise<UserProfile> {
    const profile: UpdateUserProfile = {};

    if (input.nickname !== undefined) {
      const nickname = input.nickname?.trim() ?? null;
      if (nickname !== null && (nickname.length < 1 || nickname.length > 30)) {
        throw new Error('Nickname must contain 1 to 30 characters');
      }
      Object.assign(profile, { nickname });
    }

    if (input.avatarObjectKey !== undefined) {
      const key = input.avatarObjectKey;
      if (key !== null && (!AVATAR_KEY_PATTERN.test(key) || key.includes('..'))) {
        throw new Error('Invalid avatar object key');
      }
      Object.assign(profile, { avatarObjectKey: key });
    }

    if (Object.keys(profile).length === 0) {
      throw new Error('At least one profile field is required');
    }

    return this.users.updateProfile(userId, profile);
  }
}
