import { Prisma, PrismaClient } from '@prisma/client';
import type { Story, StoryInput, StoryListQuery, StoryListResult, StoryRepository, StoryStatus } from './story-service.js';

const STORY_INCLUDE = {
  relatedProduct: { include: { media: { orderBy: { sortOrder: 'asc' as const } } } }
} satisfies Prisma.StoryInclude;
type StoryRow = Prisma.StoryGetPayload<{ include: typeof STORY_INCLUDE }>;

export class PrismaStoryRepository implements StoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: StoryInput): Promise<Story> {
    const relatedProductId = await this.resolveProduct(input.relatedProductPublicId);
    const row = await this.prisma.story.create({ data: {
      contentType: input.contentType, title: input.title, summary: input.summary, body: input.body,
      coverObjectKey: input.coverObjectKey!, relatedProductId, sortOrder: input.sortOrder, status: 'DRAFT'
    }, include: STORY_INCLUDE });
    return mapStory(row);
  }

  async update(id: string, input: StoryInput): Promise<Story> {
    const relatedProductId = await this.resolveProduct(input.relatedProductPublicId);
    const row = await this.prisma.story.update({ where: { id: BigInt(id) }, data: {
      contentType: input.contentType, title: input.title, summary: input.summary, body: input.body,
      coverObjectKey: input.coverObjectKey!, relatedProductId, sortOrder: input.sortOrder
    }, include: STORY_INCLUDE });
    return mapStory(row);
  }

  async findById(id: string): Promise<Story | null> {
    const row = await this.prisma.story.findUnique({ where: { id: BigInt(id) }, include: STORY_INCLUDE });
    return row ? mapStory(row) : null;
  }

  async listAdmin(query: StoryListQuery): Promise<StoryListResult> {
    const where: Prisma.StoryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.contentType ? { contentType: query.contentType } : {}),
      ...(query.keyword ? { OR: [{ title: { contains: query.keyword } }, { summary: { contains: query.keyword } }] } : {})
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({ where, include: STORY_INCLUDE, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      this.prisma.story.count({ where })
    ]);
    return { items: rows.map(mapStory), total };
  }

  async setStatus(id: string, status: StoryStatus): Promise<Story> {
    const row = await this.prisma.story.update({ where: { id: BigInt(id) }, data: {
      status,
      ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {})
    }, include: STORY_INCLUDE });
    return mapStory(row);
  }

  async listPublished(): Promise<readonly Story[]> {
    const rows = await this.prisma.story.findMany({ where: { status: 'PUBLISHED' }, include: STORY_INCLUDE, orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }] });
    return rows.map(mapStory);
  }

  async findPublishedByPublicId(publicId: string): Promise<Story | null> {
    const row = await this.prisma.story.findFirst({ where: { publicId, status: 'PUBLISHED' }, include: STORY_INCLUDE });
    return row ? mapStory(row) : null;
  }

  private async resolveProduct(publicId: string | null): Promise<bigint | null> {
    if (!publicId) return null;
    const product = await this.prisma.product.findUnique({ where: { publicId }, select: { id: true } });
    if (!product) throw new Error('Related product not found');
    return product.id;
  }
}

function mapStory(row: StoryRow): Story {
  const relatedProduct = row.relatedProduct;
  const showPublicProduct = !!relatedProduct && relatedProduct.status === 'ON_SALE' && relatedProduct.archivedAt === null;
  return {
    id: row.id.toString(), publicId: row.publicId, contentType: row.contentType, title: row.title,
    summary: row.summary, body: row.body, coverObjectKey: row.coverObjectKey,
    relatedProductPublicId: relatedProduct?.publicId ?? null,
    relatedProduct: showPublicProduct && relatedProduct ? {
      publicId: relatedProduct.publicId, name: relatedProduct.name,
      coverObjectKey: relatedProduct.media[0]?.objectKey ?? null
    } : null,
    status: row.status, sortOrder: row.sortOrder, publishedAt: row.publishedAt?.toISOString() ?? null
  };
}
