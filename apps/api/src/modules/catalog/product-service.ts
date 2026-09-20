export type ProductStatus = 'DRAFT' | 'ON_SALE' | 'OFF_SALE';
export type ProductType = 'STANDARD' | 'BUNDLE';
export type ProductMediaType = 'IMAGE' | 'VIDEO';

export interface ProductMediaInput {
  readonly type: ProductMediaType;
  readonly objectKey: string;
  readonly altText: string | null;
  readonly sortOrder: number;
}

export interface ProductInput {
  readonly categoryId: string;
  readonly name: string;
  readonly subtitle: string | null;
  readonly productType: ProductType;
  readonly content: string;
  readonly origin: string | null;
  readonly sortOrder: number;
  readonly status: ProductStatus;
  readonly media: readonly ProductMediaInput[];
  readonly tags: readonly string[];
}

export interface Product extends ProductInput {
  readonly id: string;
  readonly publicId: string;
}

export interface ProductListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly status?: ProductStatus;
  readonly categoryId?: string;
}

export interface ProductListResult {
  readonly items: Product[];
  readonly total: number;
}

export interface ProductRepository {
  findCategory(id: string): Promise<{ readonly id: string; readonly status: 'ENABLED' | 'DISABLED' } | null>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  list(query: ProductListQuery): Promise<ProductListResult>;
}

const IMAGE_KEY = /^products\/[A-Za-z0-9/_-]+\.(?:avif|jpeg|jpg|png|webp)$/;
const VIDEO_KEY = /^products\/[A-Za-z0-9/_-]+\.(?:mp4|webm)$/;

export class AdminProductService {
  constructor(private readonly products: ProductRepository) {}

  async create(input: ProductInput): Promise<Product> {
    const valid = validateProduct(input);
    await this.assertCategory(valid);
    return this.products.create(valid);
  }

  async update(id: string, input: ProductInput): Promise<Product> {
    validateId(id, 'product');
    if (!(await this.products.findById(id))) throw new Error('Product not found');
    const valid = validateProduct(input);
    await this.assertCategory(valid);
    return this.products.update(id, valid);
  }

  async get(id: string): Promise<Product> {
    validateId(id, 'product');
    const product = await this.products.findById(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async list(query: ProductListQuery): Promise<ProductListResult> {
    if (!Number.isInteger(query.page) || query.page < 1) throw new Error('Invalid product page');
    if (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 100) {
      throw new Error('Invalid product page size');
    }
    if (query.categoryId !== undefined) validateId(query.categoryId, 'category');
    if (query.status !== undefined) validateStatus(query.status);
    return this.products.list(query);
  }

  private async assertCategory(product: ProductInput): Promise<void> {
    const category = await this.products.findCategory(product.categoryId);
    if (!category) throw new Error('Product category not found');
    if (product.status === 'ON_SALE' && category.status !== 'ENABLED') {
      throw new Error('Product category must be enabled');
    }
  }
}

function validateProduct(input: ProductInput): ProductInput {
  validateId(input.categoryId, 'category');
  const name = normalizeRequired(input.name, 100, 'product name');
  const subtitle = normalizeOptional(input.subtitle, 200, 'product subtitle');
  const content = normalizeRequired(input.content, 20_000, 'product content');
  const origin = normalizeOptional(input.origin, 100, 'product origin');
  if (input.productType !== 'STANDARD' && input.productType !== 'BUNDLE') {
    throw new Error('Invalid product type');
  }
  validateStatus(input.status);
  validateSortOrder(input.sortOrder, 'product');
  if (input.media.length > 20) throw new Error('Too many product media items');
  const media = input.media.map(validateMedia);
  if (new Set(media.map((item) => item.objectKey)).size !== media.length) {
    throw new Error('Duplicate product media object key');
  }
  if (input.status === 'ON_SALE' && !media.some((item) => item.type === 'IMAGE')) {
    throw new Error('On-sale product requires an image');
  }
  const tags = [...new Set(input.tags.map((tag) => normalizeRequired(tag, 30, 'product tag')))];
  if (tags.length > 10) throw new Error('Too many product tags');
  return {
    categoryId: input.categoryId, name, subtitle, productType: input.productType,
    content, origin, sortOrder: input.sortOrder, status: input.status, media, tags
  };
}

function validateMedia(media: ProductMediaInput): ProductMediaInput {
  const pattern = media.type === 'IMAGE' ? IMAGE_KEY : media.type === 'VIDEO' ? VIDEO_KEY : null;
  if (!pattern || !pattern.test(media.objectKey)) throw new Error('Invalid product media object key');
  validateSortOrder(media.sortOrder, 'product media');
  return {
    type: media.type, objectKey: media.objectKey,
    altText: normalizeOptional(media.altText, 100, 'product media alt text'),
    sortOrder: media.sortOrder
  };
}

function normalizeRequired(value: string, max: number, field: string): string {
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > max) throw new Error(`Invalid ${field}`);
  return normalized;
}

function normalizeOptional(value: string | null, max: number, field: string): string | null {
  if (value === null) return null;
  return normalizeRequired(value, max, field);
}

function validateId(id: string, field: string): void {
  if (!/^[1-9]\d*$/.test(id)) throw new Error(`Invalid ${field} id`);
}

function validateSortOrder(sortOrder: number, field: string): void {
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999_999) {
    throw new Error(`Invalid ${field} sort order`);
  }
}

function validateStatus(status: ProductStatus): void {
  if (status !== 'DRAFT' && status !== 'ON_SALE' && status !== 'OFF_SALE') {
    throw new Error('Invalid product status');
  }
}
