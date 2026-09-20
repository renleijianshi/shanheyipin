import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  PublicProductDetail,
  PublicProductListResult,
  PublicProductSummary
} from '@shanheyipin/shared-types';
import type {
  PublicCatalogListQuery,
  PublicCatalogRepository
} from './catalog-query-service.js';
import { findVisibleCategoryIds } from './catalog-visibility.js';

const publicProductListInclude = {
  media: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  tags: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  skus: {
    where: { saleStatus: 'ON_SALE' as const },
    orderBy: { id: 'asc' as const },
    select: { salePriceCent: true, presaleEnabled: true }
  }
} satisfies Prisma.ProductInclude;

const publicProductDetailInclude = {
  media: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  tags: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  skus: {
    where: { saleStatus: 'ON_SALE' as const },
    orderBy: { id: 'asc' as const },
    include: {
      specificationValues: { include: { specValue: { include: { spec: true } } } }
    }
  }
} satisfies Prisma.ProductInclude;

type PublicProductListRecord = Prisma.ProductGetPayload<{ include: typeof publicProductListInclude }>;
type PublicProductDetailRecord = Prisma.ProductGetPayload<{ include: typeof publicProductDetailInclude }>;

export class PrismaCatalogQueryRepository implements PublicCatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listPublished(query: PublicCatalogListQuery): Promise<PublicProductListResult> {
    const visibleCategoryIds = await findVisibleCategoryIds(this.prisma);
    if (query.categoryId !== undefined && !visibleCategoryIds.some((id) => id === BigInt(query.categoryId!))) {
      return { items: [], total: 0 };
    }
    const where = publishedWhere(query, visibleCategoryIds);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: publicProductListInclude,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.product.count({ where })
    ]);
    return { items: rows.map(toSummary), total };
  }

  async findPublishedByPublicId(publicId: string): Promise<PublicProductDetail | null> {
    const visibleCategoryIds = await findVisibleCategoryIds(this.prisma);
    const row = await this.prisma.product.findFirst({
      where: {
        publicId,
        status: 'ON_SALE',
        categoryId: { in: visibleCategoryIds },
        skus: { some: { saleStatus: 'ON_SALE' } }
      },
      include: publicProductDetailInclude
    });
    return row ? toDetail(row) : null;
  }
}

function publishedWhere(
  query: PublicCatalogListQuery,
  visibleCategoryIds: readonly bigint[]
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: 'ON_SALE',
    categoryId: query.categoryId === undefined ? { in: [...visibleCategoryIds] } : BigInt(query.categoryId),
    skus: { some: { saleStatus: 'ON_SALE' } }
  };
  if (query.keyword !== undefined) {
    where.OR = [
      { name: { contains: query.keyword } },
      { subtitle: { contains: query.keyword } },
      { tags: { some: { name: { contains: query.keyword } } } },
      { skus: { some: { saleStatus: 'ON_SALE', skuName: { contains: query.keyword } } } }
    ];
  }
  return where;
}

function toSummary(row: PublicProductListRecord | PublicProductDetailRecord): PublicProductSummary {
  const cover = row.media.find((item) => item.type === 'IMAGE');
  if (!cover) throw new Error('Published product missing cover image');
  const prices = row.skus.map((sku) => sku.salePriceCent);
  if (prices.length === 0) throw new Error('Published product missing on-sale SKU');
  return {
    id: row.publicId,
    name: row.name,
    subtitle: row.subtitle,
    coverObjectKey: cover.objectKey,
    tags: row.tags.map((tag) => tag.name),
    minSalePriceCent: Math.min(...prices),
    maxSalePriceCent: Math.max(...prices),
    presaleEnabled: row.skus.some((sku) => sku.presaleEnabled)
  };
}

function toDetail(row: PublicProductDetailRecord): PublicProductDetail {
  return {
    ...toSummary(row),
    content: row.content,
    origin: row.origin,
    media: row.media.map((item) => ({
      type: item.type, objectKey: item.objectKey, altText: item.altText
    })),
    skus: row.skus.map((sku) => ({
      id: sku.publicId,
      skuName: sku.skuName,
      salePriceCent: sku.salePriceCent,
      marketPriceCent: sku.marketPriceCent,
      weightGram: sku.weightGram,
      presaleEnabled: sku.presaleEnabled,
      specs: sku.specificationValues
        .map(({ specValue }) => ({ name: specValue.spec.name, value: specValue.value }))
        .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
    }))
  };
}
