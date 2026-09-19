import type { PrismaClient, UserStatus } from '@prisma/client';
import type {
  UpdateUserProfile,
  UserProfile,
  UserProfileRepository
} from './user-center-service.js';

export class PrismaUserProfileRepository implements UserProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getById(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: BigInt(userId) }
    });
    return toProfile(user);
  }

  async updateProfile(userId: string, profile: UpdateUserProfile): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: profile
    });
    return toProfile(user);
  }
}

function toProfile(user: {
  publicId: string;
  nickname: string | null;
  avatarObjectKey: string | null;
  status: UserStatus;
  createdAt: Date;
}): UserProfile {
  return {
    publicId: user.publicId,
    nickname: user.nickname,
    avatarObjectKey: user.avatarObjectKey,
    status: mapStatus(user.status),
    memberSince: user.createdAt
  };
}

function mapStatus(status: UserStatus): UserProfile['status'] {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'DISABLED':
      return 'disabled';
    case 'CANCELLED':
      return 'cancelled';
  }
}
