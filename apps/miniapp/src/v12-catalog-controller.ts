import { toProductDetailView, type ProductDetailView } from './catalog-view-model.js';
import {
  filterCatalogProducts,
  filterSelectionProducts,
  type V12CategoryKey,
  type V12SelectionTab
} from './v12-ui-model.js';
import type { CartPort, CatalogPort, StorefrontProductSummary } from './v12-ports.js';

export interface SelectionEditorialView {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly coverObjectKey: string;
  readonly tags: readonly string[];
}

export class V12CatalogController {
  constructor(
    private readonly catalog: CatalogPort,
    private readonly cart: CartPort
  ) {}

  async loadCategory(category: V12CategoryKey): Promise<readonly StorefrontProductSummary[]> {
    const result = await this.catalog.list({ page: 1, pageSize: 50 });
    return filterCatalogProducts(result.items, category);
  }

  async loadSelection(selection: V12SelectionTab): Promise<readonly SelectionEditorialView[]> {
    const result = await this.catalog.list({ page: 1, pageSize: 50 });
    return filterSelectionProducts(result.items, selection).map((product) => ({
      id: product.id,
      title: product.name,
      summary: product.subtitle ?? '山野风物与当季滋味',
      coverObjectKey: product.coverObjectKey,
      tags: product.tags
    }));
  }

  async openProduct(publicId: string): Promise<ProductDetailView> {
    return toProductDetailView(await this.catalog.get(publicId));
  }

  async addSkuToCart(skuId: string, quantity = 1) {
    return this.cart.add({ skuId, quantity });
  }
}
