export type AppKind = 'api' | 'admin' | 'miniapp';

export interface AppManifest {
  readonly kind: AppKind;
  readonly name: string;
  readonly status: 'bootstrap';
}

export interface PublicProductSummary {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string | null;
  readonly coverObjectKey: string;
  readonly tags: readonly string[];
  readonly minSalePriceCent: number;
  readonly maxSalePriceCent: number;
  readonly presaleEnabled: boolean;
}

export interface PublicProductMedia {
  readonly type: 'IMAGE' | 'VIDEO';
  readonly objectKey: string;
  readonly altText: string | null;
}

export interface PublicProductSku {
  readonly id: string;
  readonly skuName: string;
  readonly salePriceCent: number;
  readonly marketPriceCent: number | null;
  readonly weightGram: number;
  readonly presaleEnabled: boolean;
  readonly specs: readonly { readonly name: string; readonly value: string }[];
}

export interface PublicProductDetail extends PublicProductSummary {
  readonly content: string;
  readonly origin: string | null;
  readonly media: readonly PublicProductMedia[];
  readonly skus: readonly PublicProductSku[];
}

export interface PublicProductListResult {
  readonly items: readonly PublicProductSummary[];
  readonly total: number;
}
