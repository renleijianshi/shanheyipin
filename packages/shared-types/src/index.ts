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

export type CartItemInvalidReason =
  | 'SKU_OFF_SALE'
  | 'PRODUCT_OFF_SALE'
  | 'CATEGORY_UNAVAILABLE';

export interface CartItem {
  readonly id: string;
  readonly skuId: string;
  readonly quantity: number;
  readonly skuName: string;
  readonly productName: string;
  readonly coverObjectKey: string | null;
  readonly salePriceCent: number;
  readonly specs: readonly { readonly name: string; readonly value: string }[];
  readonly isValid: boolean;
  readonly invalidReason: CartItemInvalidReason | null;
}

export interface Cart {
  readonly items: readonly CartItem[];
  readonly validItemCount: number;
  readonly totalQuantity: number;
  readonly subtotalCent: number;
}

export interface CheckoutAddress {
  readonly id: string;
  readonly recipientName: string;
  readonly phone: string;
  readonly province: string;
  readonly city: string;
  readonly district: string;
  readonly detail: string;
}

export interface CheckoutItem {
  readonly cartItemId: string;
  readonly skuId: string;
  readonly productName: string;
  readonly skuName: string;
  readonly coverObjectKey: string | null;
  readonly specs: readonly { readonly name: string; readonly value: string }[];
  readonly quantity: number;
  readonly unitPriceCent: number;
  readonly lineAmountCent: number;
}

export interface CheckoutDiscount {
  readonly type: string;
  readonly description: string;
  readonly amountCent: number;
}

export interface ShippingQuote {
  readonly method: string;
  readonly feeCent: number;
  readonly description: string;
}

export interface CheckoutPreview {
  readonly address: CheckoutAddress;
  readonly items: readonly CheckoutItem[];
  readonly merchandiseAmountCent: number;
  readonly discounts: readonly CheckoutDiscount[];
  readonly discountAmountCent: number;
  readonly shipping: ShippingQuote;
  readonly payableAmountCent: number;
}
