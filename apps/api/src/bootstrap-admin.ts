import { PrismaClient } from '@prisma/client';
import { hashAdminPassword } from './modules/admin/admin-auth-service.js';

try { process.loadEnvFile(); } catch { /* environment may be supplied by the process manager */ }

const username = process.env.ADMIN_BOOTSTRAP_USERNAME?.trim();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const displayName = process.env.ADMIN_BOOTSTRAP_DISPLAY_NAME?.trim() || '系统管理员';
if (!username || !password) throw new Error('Set ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD in the environment');
if (username.length > 64 || displayName.length > 100) throw new Error('Admin username or display name is too long');

const prisma = new PrismaClient();
try {
  if (await prisma.adminUser.count()) throw new Error('Admin bootstrap is allowed only when no admin account exists');
  const passwordHash = await hashAdminPassword(password);
  await prisma.$transaction(async (tx) => {
    const role = await tx.role.create({ data: { code: 'owner', name: '系统管理员', isSystem: true } });
    const permission = await tx.permission.create({ data: { code: '*', name: '全部管理权限', scope: 'API' } });
    await tx.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
    const admin = await tx.adminUser.create({ data: { username, displayName, passwordHash } });
    await tx.adminUserRole.create({ data: { adminUserId: admin.id, roleId: role.id } });
  });
  process.stdout.write(`Created first admin account: ${username}\n`);
} finally {
  await prisma.$disconnect();
}
