import type {
  Cart,
  PublicProductDetail,
  PublicProductSummary
} from '@shanheyipin/shared-types';

export type StorefrontCategory = 'seasonal' | 'gift' | 'mountain';
export type SelectionChannel = 'brand' | 'season';

export interface StorefrontPresentation {
  readonly storefrontCategory: StorefrontCategory | null;
  readonly selectionChannels: readonly SelectionChannel[];
}

export type StorefrontProductSummary = PublicProductSummary & StorefrontPresentation;
export type StorefrontProductDetail = PublicProductDetail & StorefrontPresentation;

export interface StorefrontProductListResult {
  readonly items: readonly StorefrontProductSummary[];
  readonly total: number;
}

export interface CatalogPort {
  list(input: {
    readonly page: number;
    readonly pageSize: number;
    readonly categoryId?: string;
  }): Promise<StorefrontProductListResult>;
  search(input: {
    readonly page: number;
    readonly pageSize: number;
    readonly keyword: string;
    readonly categoryId?: string;
  }): Promise<StorefrontProductListResult>;
  get(publicId: string): Promise<StorefrontProductDetail>;
}

export interface CartPort {
  get(): Promise<Cart>;
  add(input: { readonly skuId: string; readonly quantity: number }): Promise<Cart>;
  update(itemId: string, input: { readonly quantity: number }): Promise<Cart>;
  remove(itemId: string): Promise<Cart>;
}

export interface StorySummary {
  readonly id: string;
  readonly title: string;
  readonly type: 'ORIGIN' | 'PERSON' | 'CRAFT' | 'BRAND' | 'VIDEO';
  readonly origin: string | null;
  readonly summary: string;
  readonly coverObjectKey: string | null;
}

export interface ContentPort {
  listStories(): Promise<readonly StorySummary[]>;
}

export interface TraceSummary {
  readonly id: string;
  readonly productName: string;
  readonly batchNo: string;
  readonly origin: string;
  readonly supplier: string | null;
  readonly craft: string;
  readonly qualitySummary: string;
  readonly consumerNote: string;
}

export interface TracePort {
  getByCode(code: string): Promise<TraceSummary | null>;
}
