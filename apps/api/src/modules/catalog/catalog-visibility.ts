import type { Prisma, PrismaClient } from '@prisma/client';

export async function findVisibleCategoryIds(
  prisma: PrismaClient | Prisma.TransactionClient
): Promise<bigint[]> {
  const rows = await prisma.category.findMany({ select: { id: true, parentId: true, status: true } });
  const categories = new Map(rows.map((row) => [row.id, row]));
  const memo = new Map<bigint, boolean>();

  const isVisible = (id: bigint, ancestors: ReadonlySet<bigint>): boolean => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const category = categories.get(id);
    if (!category || category.status !== 'ENABLED' || ancestors.has(id)) return false;
    const visible = category.parentId === null || isVisible(category.parentId, new Set(ancestors).add(id));
    memo.set(id, visible);
    return visible;
  };

  return rows.filter((row) => isVisible(row.id, new Set())).map((row) => row.id);
}
