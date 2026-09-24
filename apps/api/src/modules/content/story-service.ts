export type StoryContentType = 'ORIGIN' | 'CRAFT' | 'PEOPLE' | 'PRODUCT_KNOWLEDGE' | 'USAGE' | 'STORAGE' | 'BRAND' | 'GIFTING';
export type StoryStatus = 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN';

export interface StoryInput {
  readonly contentType: StoryContentType;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly coverObjectKey: string | null;
  readonly relatedProductPublicId: string | null;
  readonly sortOrder: number;
}

export interface StoryRelatedProduct {
  readonly publicId: string;
  readonly name: string;
  readonly coverObjectKey: string | null;
}

export interface Story extends StoryInput {
  readonly id: string;
  readonly publicId: string;
  readonly status: StoryStatus;
  readonly publishedAt: string | null;
  readonly relatedProduct: StoryRelatedProduct | null;
}

export interface StoryListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly keyword?: string;
  readonly status?: StoryStatus;
  readonly contentType?: StoryContentType;
}

export interface StoryListResult { readonly items: readonly Story[]; readonly total: number }

export interface StoryRepository {
  create(input: StoryInput): Promise<Story>;
  update(id: string, input: StoryInput): Promise<Story>;
  findById(id: string): Promise<Story | null>;
  listAdmin(query: StoryListQuery): Promise<StoryListResult>;
  setStatus(id: string, status: StoryStatus): Promise<Story>;
  listPublished(): Promise<readonly Story[]>;
  findPublishedByPublicId(publicId: string): Promise<Story | null>;
}

const COVER_KEY = /^products\/[A-Za-z0-9/_-]+\.(?:avif|jpeg|jpg|png|webp)$/;
const CONTENT_TYPES: readonly StoryContentType[] = ['ORIGIN', 'CRAFT', 'PEOPLE', 'PRODUCT_KNOWLEDGE', 'USAGE', 'STORAGE', 'BRAND', 'GIFTING'];
const STORY_STATUSES: readonly StoryStatus[] = ['DRAFT', 'PUBLISHED', 'WITHDRAWN'];

export class AdminStoryService {
  constructor(private readonly stories: StoryRepository) {}

  async create(input: StoryInput): Promise<Story> {
    return this.stories.create(validateInput(input));
  }

  async update(id: string, input: StoryInput): Promise<Story> {
    validateId(id);
    const current = await this.requireStory(id);
    if (current.status === 'PUBLISHED') throw new Error('Invalid operation: withdraw story before editing');
    return this.stories.update(id, validateInput(input));
  }

  async get(id: string): Promise<Story> {
    validateId(id);
    return this.requireStory(id);
  }

  async listAdmin(query: StoryListQuery): Promise<StoryListResult> {
    if (!Number.isInteger(query.page) || query.page < 1) throw new Error('Invalid story page');
    if (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 100) throw new Error('Invalid story page size');
    if (query.keyword !== undefined && query.keyword.length > 120) throw new Error('Invalid story search keyword');
    if (query.status !== undefined && !STORY_STATUSES.includes(query.status)) throw new Error('Invalid story status');
    if (query.contentType !== undefined && !CONTENT_TYPES.includes(query.contentType)) throw new Error('Invalid story content type');
    return this.stories.listAdmin(query);
  }

  async publish(id: string): Promise<Story> {
    validateId(id);
    const current = await this.requireStory(id);
    if (!current.coverObjectKey || !current.title || !current.summary || !current.body) throw new Error('Invalid story: title, summary, body and cover image are required before publishing');
    if (current.status === 'PUBLISHED') return current;
    return this.stories.setStatus(id, 'PUBLISHED');
  }

  async withdraw(id: string): Promise<Story> {
    validateId(id);
    const current = await this.requireStory(id);
    if (current.status === 'WITHDRAWN') return current;
    if (current.status !== 'PUBLISHED') throw new Error('Invalid operation: only a published story can be withdrawn');
    return this.stories.setStatus(id, 'WITHDRAWN');
  }

  listPublished(): Promise<readonly Story[]> { return this.stories.listPublished(); }

  getPublished(publicId: string): Promise<Story | null> {
    if (!/^[0-9a-f-]{36}$/i.test(publicId)) throw new Error('Invalid story public id');
    return this.stories.findPublishedByPublicId(publicId);
  }

  private async requireStory(id: string): Promise<Story> {
    const story = await this.stories.findById(id);
    if (!story) throw new Error('Story not found');
    return story;
  }
}

function validateInput(input: StoryInput): StoryInput {
  if (!CONTENT_TYPES.includes(input.contentType)) throw new Error('Invalid story content type');
  const title = required(input.title, 120, 'story title');
  const summary = required(input.summary, 300, 'story summary');
  const body = required(input.body, 50_000, 'story body');
  if (input.coverObjectKey !== null && !COVER_KEY.test(input.coverObjectKey)) throw new Error('Invalid story cover object key');
  if (!input.coverObjectKey) throw new Error('Invalid story: cover image is required');
  if (input.relatedProductPublicId !== null && !/^[0-9a-f-]{36}$/i.test(input.relatedProductPublicId)) throw new Error('Invalid related product public id');
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 999_999) throw new Error('Invalid story sort order');
  return { contentType: input.contentType, title, summary, body, coverObjectKey: input.coverObjectKey, relatedProductPublicId: input.relatedProductPublicId, sortOrder: input.sortOrder };
}

function required(value: string, maxLength: number, field: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`Invalid ${field}`);
  return normalized;
}

function validateId(id: string): void {
  if (!/^[1-9]\d*$/.test(id)) throw new Error('Invalid story id');
}
