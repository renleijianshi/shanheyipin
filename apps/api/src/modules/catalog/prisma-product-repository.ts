import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  Product,
  ProductInput,
  ProductListQuery,
  ProductListResult,
  ProductRepository
} from './product-service.js';

const productInclude = {
  media: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  tags: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] }
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCategory(id: string) {
    const row = await this.prisma.category.findUnique({
      where: { id: BigInt(id) }, select: { id: true, status: true }
    });
    return row ? { id: row.id.toString(), status: row.status } : null;
  }

  create(input: ProductInput): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      await requireValidCategory(tx, input);
      return toProduct(await tx.product.create({ data: toCreateData(input), include: productInclude }));
    });
  }

  update(id: string, input: ProductInput): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      const productId = BigInt(id);
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId} FOR UPDATE`;
      if (!(await tx.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
        throw new Error('Product not found');
      }
      await requireValidCategory(tx, input);
      await tx.productMedia.deleteMany({ where: { productId } });
      await tx.productTag.deleteMany({ where: { productId } });
      return toProduct(await tx.product.update({
        where: { id: productId }, data: toUpdateData(input), include: productInclude
      }));
    });
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id: BigInt(id) }, include: productInclude });
    return row ? toProduct(row) : null;
  }

  async list(query: ProductListQuery): Promise<ProductListResult> {
    const where: Prisma.ProductWhereInput = {};
    if (query.status !== undefined) where.status = query.status;
    if (query.categoryId !== undefined) where.categoryId = BigInt(query.categoryId);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where, include: productInclude,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize, take: query.pageSize
      }),
      this.prisma.product.count({ where })
    ]);
    return { items: rows.map(toProduct), total };
  }
}

async function requireValidCategory(tx: Prisma.TransactionClient, input: ProductInput): Promise<void> {
  const category = await tx.category.findUnique({
    where: { id: BigInt(input.categoryId) }, select: { status: true }
  });
  if (!category) throw new Error('Product category not found');
  if (input.status === 'ON_SALE' && category.status !== 'ENABLED') {
    throw new Error('Product category must be enabled');
  }
}

function toCreateData(input: ProductInput): Prisma.ProductCreateInput {
  return {
    category: { connect: { id: BigInt(input.categoryId) } },
    name: input.name, subtitle: input.subtitle, productType: input.productType,
    content: input.content, origin: input.origin, sortOrder: input.sortOrder, status: input.status,
    media: { create: input.media.map((item) => ({ ...item })) },
    tags: { create: input.tags.map((name, sortOrder) => ({ name, sortOrder })) }
  };
}

function toUpdateData(input: ProductInput): Prisma.ProductUpdateInput {
  return {
    category: { connect: { id: BigInt(input.categoryId) } },
    name: input.name, subtitle: input.subtitle, productType: input.productType,
    content: input.content, origin: input.origin, sortOrder: input.sortOrder, status: input.status,
    media: { create: input.media.map((item) => ({ ...item })) },
    tags: { create: input.tags.map((name, sortOrder) => ({ name, sortOrder })) }
  };
}

function toProduct(row: ProductRecord): Product {
  return {
    id: row.id.toString(), publicId: row.publicId, categoryId: row.categoryId.toString(),
    name: row.name, subtitle: row.subtitle, productType: row.productType,
    content: row.content, origin: row.origin, sortOrder: row.sortOrder, status: row.status,
    media: row.media.map((item) => ({
      type: item.type, objectKey: item.objectKey, altText: item.altText, sortOrder: item.sortOrder
    })),
    tags: row.tags.map((tag) => tag.name)
  };
}
