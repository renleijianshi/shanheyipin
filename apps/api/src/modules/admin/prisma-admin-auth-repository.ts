import type { PrismaClient } from '@prisma/client';
import type { AdminAuthRepository } from './admin-auth-service.js';

export class PrismaAdminAuthRepository implements AdminAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUser(username: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { username }, select: { id: true, username: true, displayName: true, passwordHash: true, status: true }
    });
    return user ? { ...user, id: user.id.toString() } : null;
  }

  async createSession(input: { readonly adminUserId: string; readonly tokenHash: string; readonly expiresAt: Date }): Promise<void> {
    await this.prisma.adminSession.create({
      data: { adminUserId: BigInt(input.adminUserId), tokenHash: input.tokenHash, expiresAt: input.expiresAt }
    });
  }

  async findSession(tokenHash: string, now: Date) {
    const session = await this.prisma.adminSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      include: {
        adminUser: {
          include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
        }
      }
    });
    if (!session) return null;
    const permissions = session.adminUser.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code));
    return {
      id: session.adminUser.id.toString(), username: session.adminUser.username,
      displayName: session.adminUser.displayName, status: session.adminUser.status, permissions
    } as const;
  }

  async revokeSession(tokenHash: string, at: Date): Promise<void> {
    await this.prisma.adminSession.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: at } });
  }
}
