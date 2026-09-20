import type {
  PublicProductDetail,
  PublicProductListResult
} from '@shanheyipin/shared-types';

export interface PublicCatalogListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly categoryId?: string;
  readonly keyword?: string;
}

export interface PublicCatalogRepository {
  listPublished(query: PublicCatalogListQuery): Promise<PublicProductListResult>;
  findPublishedByPublicId(publicId: string): Promise<PublicProductDetail | null>;
}

export class PublicCatalogService {
  constructor(private readonly products: PublicCatalogRepository) {}

  async list(query: Omit<PublicCatalogListQuery, 'keyword'>): Promise<PublicProductListResult> {
    return this.products.listPublished(validateListQuery(query));
  }

  async search(query: PublicCatalogListQuery & { readonly keyword: string }): Promise<PublicProductListResult> {
    const valid = validateListQuery(query);
    const keyword = query.keyword.trim().normalize('NFC');
    if (keyword.length < 1 || keyword.length > 50) throw new Error('Invalid product search keyword');
    return this.products.listPublished({ ...valid, keyword });
  }

  async get(publicId: string): Promise<PublicProductDetail> {
    if (!isUuid(publicId)) throw new Error('Invalid product id');
    const product = await this.products.findPublishedByPublicId(publicId);
    if (!product) throw new Error('Product not found');
    return product;
  }
}

function validateListQuery(query: Omit<PublicCatalogListQuery, 'keyword'>): Omit<PublicCatalogListQuery, 'keyword'> {
  if (!Number.isInteger(query.page) || query.page < 1) throw new Error('Invalid public product page');
  if (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 50) {
    throw new Error('Invalid public product page size');
  }
  if (query.categoryId !== undefined && !/^[1-9]\d*$/.test(query.categoryId)) {
    throw new Error('Invalid category id');
  }
  return query.categoryId === undefined
    ? { page: query.page, pageSize: query.pageSize }
    : { page: query.page, pageSize: query.pageSize, categoryId: query.categoryId };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
