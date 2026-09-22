import type {
  SelectionChannel,
  StorefrontProductSummary
} from './v12-ports.js';

export type V12TabKey = 'home' | 'category' | 'selection' | 'cart' | 'profile';
export type V12CategoryKey = 'all' | 'seasonal' | 'gift' | 'mountain';
export type V12SelectionTab = SelectionChannel;
export type V12HomeEntry = 'hero' | 'gift' | 'trace' | 'story' | 'season';

export const V12_BOTTOM_TABS = [
  { key: 'home', label: '首页' },
  { key: 'category', label: '分类' },
  { key: 'selection', label: '甄选' },
  { key: 'cart', label: '购物车' },
  { key: 'profile', label: '我的' }
] as const;

export const V12_CATEGORY_TABS = [
  { key: 'all', label: '全部商品' },
  { key: 'seasonal', label: '应季甄选' },
  { key: 'gift', label: '礼盒' },
  { key: 'mountain', label: '山野好物' }
] as const;

export const V12_SELECTION_TABS = [
  { key: 'brand', label: '山禾甄选' },
  { key: 'season', label: '本期甄选' }
] as const;

export type V12HomeDestination =
  | { readonly tab: 'category'; readonly category: V12CategoryKey }
  | { readonly tab: 'selection'; readonly selection: V12SelectionTab }
  | { readonly page: '/subpackages/story/index' | '/subpackages/trace/index' };

const HOME_DESTINATIONS: Record<V12HomeEntry, V12HomeDestination> = {
  hero: { tab: 'selection', selection: 'brand' },
  gift: { tab: 'category', category: 'gift' },
  trace: { page: '/subpackages/trace/index' },
  story: { page: '/subpackages/story/index' },
  season: { tab: 'selection', selection: 'season' }
};

export function resolveHomeEntry(entry: V12HomeEntry): V12HomeDestination {
  return HOME_DESTINATIONS[entry];
}

export function filterCatalogProducts(
  products: readonly StorefrontProductSummary[],
  category: V12CategoryKey
): readonly StorefrontProductSummary[] {
  return category === 'all'
    ? products
    : products.filter((product) => product.storefrontCategory === category);
}

export function filterSelectionProducts(
  products: readonly StorefrontProductSummary[],
  selection: V12SelectionTab
): readonly StorefrontProductSummary[] {
  return products.filter((product) => product.selectionChannels.includes(selection));
}
