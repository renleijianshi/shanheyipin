import type { PrismaClient } from '@prisma/client';
import type {
  LoginUserRepository,
  SessionRepository,
  WeChatIdentity
} from './wechat-login-service.js';

export class PrismaLoginUserRepository implements LoginUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findOrCreateByWeChat(identity: WeChatIdentity) {
    const account = await this.prisma.userWechatAccount.upsert({
      where: { openId: identity.openId },
      update: identity.unionId ? { unionId: identity.unionId } : {},
      create: {
        openId: identity.openId,
        ...(identity.unionId ? { unionId: identity.unionId } : {}),
        user: { create: {} }
      },
      include: { user: true }
    });

    return {
      id: account.userId.toString(),
      status: account.user.status === 'ACTIVE' ? 'active' : 'disabled'
    } as const;
  }
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(session: {
    readonly userId: string;
    readonly tokenHash: string;
    readonly expiresAt: Date;
  }): Promise<void> {
    await this.prisma.userSession.create({
      data: {
        userId: BigInt(session.userId),
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt
      }
    });
  }
}
