import type { Category as CategoryRow, Prisma, PrismaClient } from '@prisma/client';
import type { Category, CategoryInput, CategoryRepository } from './category-service.js';

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ onlyEnabled }: { readonly onlyEnabled: boolean }): Promise<Category[]> {
    const orderBy = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }];
    const rows = onlyEnabled
      ? await this.prisma.category.findMany({ where: { status: 'ENABLED' }, orderBy })
      : await this.prisma.category.findMany({ orderBy });
    return rows.map(toCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id: BigInt(id) } });
    return row ? toCategory(row) : null;
  }

  create(input: CategoryInput): Promise<Category> {
    return this.prisma.$transaction(async (tx) => {
      if (input.parentId) await requireCategory(tx, BigInt(input.parentId));
      return toCategory(await tx.category.create({ data: toData(input) }));
    });
  }

  update(id: string, input: CategoryInput): Promise<Category> {
    return this.prisma.$transaction(async (tx) => {
      await lockTree(tx);
      const categoryId = BigInt(id);
      await requireCategory(tx, categoryId);
      if (input.parentId) {
        const parentId = BigInt(input.parentId);
        await requireCategory(tx, parentId);
        if (parentId === categoryId || await isDescendant(tx, categoryId, parentId)) {
          throw new Error('Category hierarchy cycle');
        }
      }
      return toCategory(await tx.category.update({ where: { id: categoryId }, data: toData(input) }));
    });
  }

  remove(id: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      await lockTree(tx);
      const categoryId = BigInt(id);
      await requireCategory(tx, categoryId);
      if (await tx.category.count({ where: { parentId: categoryId } })) throw new Error('Category has children');
      await tx.category.delete({ where: { id: categoryId } });
    });
  }

  async hasChildren(id: string): Promise<boolean> {
    return (await this.prisma.category.count({ where: { parentId: BigInt(id) } })) > 0;
  }

  isDescendant(categoryId: string, possibleDescendantId: string): Promise<boolean> {
    return isDescendant(this.prisma, BigInt(categoryId), BigInt(possibleDescendantId));
  }
}

function toData(input: CategoryInput) {
  return {
    parentId: input.parentId ? BigInt(input.parentId) : null,
    code: input.code, name: input.name, sortOrder: input.sortOrder, status: input.status
  };
}

async function requireCategory(tx: Prisma.TransactionClient, id: bigint): Promise<void> {
  if (!(await tx.category.findUnique({ where: { id }, select: { id: true } }))) {
    throw new Error('Category not found');
  }
}

async function lockTree(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$queryRaw`SELECT id FROM categories ORDER BY id FOR UPDATE`;
}

async function isDescendant(
  client: PrismaClient | Prisma.TransactionClient,
  categoryId: bigint,
  possibleDescendantId: bigint
): Promise<boolean> {
  let currentId: bigint | null = possibleDescendantId;
  const visited = new Set<string>();
  while (currentId !== null) {
    const key = currentId.toString();
    if (visited.has(key)) throw new Error('Existing category hierarchy cycle');
    visited.add(key);
    const row: { parentId: bigint | null } | null = await client.category.findUnique({
      where: { id: currentId }, select: { parentId: true }
    });
    if (!row?.parentId) return false;
    if (row.parentId === categoryId) return true;
    currentId = row.parentId;
  }
  return false;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id.toString(), parentId: row.parentId?.toString() ?? null,
    code: row.code, name: row.name, sortOrder: row.sortOrder, status: row.status
  };
}
