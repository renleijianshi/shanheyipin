import type { PublicProductDetail, PublicProductListResult } from '@shanheyipin/shared-types';
import { toStorefrontProductSummary } from './catalog-view-model.js';
import type { CatalogPort, StorefrontProductDetail, StorefrontProductListResult } from './v12-ports.js';
import { publicApiGet, type PublicApiGet, type PublicApiQuery } from './public-api-client.js';

export type { PublicApiGet } from './public-api-client.js';

export function createPublicCatalogPort(get: PublicApiGet = publicApiGet): CatalogPort {
  return {
    async list(input) {
      const result = await get<PublicProductListResult>('/api/v1/products', listQuery(input));
      return toStorefrontList(result);
    },
    async search(input) {
      const result = await get<PublicProductListResult>('/api/v1/search', {
        ...listQuery(input),
        keyword: input.keyword
      });
      return toStorefrontList(result);
    },
    async get(publicId) {
      const product = await get<PublicProductDetail>(`/api/v1/products/${encodeURIComponent(publicId)}`);
      return {
        ...product,
        storefrontCategory: toStorefrontProductSummary(product).storefrontCategory,
        selectionChannels: []
      } satisfies StorefrontProductDetail;
    }
  };
}

function listQuery(input: { readonly page: number; readonly pageSize: number; readonly categoryId?: string }): PublicApiQuery {
  return {
    page: input.page,
    pageSize: input.pageSize,
    ...(input.categoryId ? { categoryId: input.categoryId } : {})
  };
}

function toStorefrontList(result: PublicProductListResult): StorefrontProductListResult {
  return { items: result.items.map(toStorefrontProductSummary), total: result.total };
}
