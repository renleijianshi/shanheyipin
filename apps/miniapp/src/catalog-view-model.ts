import type {
  PublicProductDetail,
  PublicProductSummary
} from '@shanheyipin/shared-types';

export interface ProductCardView {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string | null;
  readonly coverObjectKey: string;
  readonly tags: readonly string[];
  readonly priceText: string;
  readonly isPresale: boolean;
}

export interface ProductDetailView extends ProductCardView {
  readonly content: string;
  readonly origin: string | null;
  readonly selectedSkuId: string;
  readonly priceText: string;
  readonly marketPriceText: string | null;
  readonly skuOptions: readonly {
    readonly id: string;
    readonly name: string;
    readonly specsText: string;
  }[];
}

export function toProductCardView(product: PublicProductSummary): ProductCardView {
  return {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle,
    coverObjectKey: product.coverObjectKey,
    tags: product.tags,
    priceText: `${formatCent(product.minSalePriceCent)}${product.maxSalePriceCent > product.minSalePriceCent ? ' 起' : ''}`,
    isPresale: product.presaleEnabled
  };
}

export function toProductDetailView(product: PublicProductDetail): ProductDetailView {
  const selectedSku = product.skus[0];
  if (!selectedSku) throw new Error('Product detail requires an on-sale SKU');
  return {
    ...toProductCardView(product),
    content: product.content,
    origin: product.origin,
    selectedSkuId: selectedSku.id,
    priceText: formatCent(selectedSku.salePriceCent),
    marketPriceText: selectedSku.marketPriceCent === null ? null : formatCent(selectedSku.marketPriceCent),
    skuOptions: product.skus.map((sku) => ({
      id: sku.id,
      name: sku.skuName,
      specsText: sku.specs.map((spec) => `${spec.name}：${spec.value}`).join(' · ')
    }))
  };
}

function formatCent(value: number): string {
  const yuan = Math.floor(value / 100);
  const cent = String(value % 100).padStart(2, '0');
  return `¥${yuan}.${cent}`;
}
