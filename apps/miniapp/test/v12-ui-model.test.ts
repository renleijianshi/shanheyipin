import { describe, expect, it } from 'vitest';
import {
  V12_BOTTOM_TABS,
  V12_CATEGORY_TABS,
  V12_SELECTION_TABS,
  filterCatalogProducts,
  filterSelectionProducts,
  resolveHomeEntry
} from '../src/v12-ui-model.js';
import type { StorefrontProductSummary } from '../src/v12-ports.js';

const seasonalProduct: StorefrontProductSummary = {
  id: '8a9a0fea-44bc-4fa2-9d76-2137596ed108',
  categoryCode: 'seasonal',
  name: '舟曲吊柿',
  subtitle: '自然霜降，软糯清甜',
  coverObjectKey: 'products/zhouqu/cover.webp',
  tags: ['柿饼'],
  minSalePriceCent: 5980,
  maxSalePriceCent: 5980,
  presaleEnabled: false,
  storefrontCategory: 'seasonal',
  selectionChannels: ['brand']
};

describe('V12 UI contract', () => {
  it('keeps the confirmed navigation labels and order', () => {
    expect(V12_BOTTOM_TABS.map((item) => item.label)).toEqual([
      '首页', '分类', '甄选', '购物车', '我的'
    ]);
    expect(V12_CATEGORY_TABS.map((item) => item.label)).toEqual([
      '全部商品', '应季甄选', '礼盒', '山野好物'
    ]);
    expect(V12_SELECTION_TABS.map((item) => item.label)).toEqual([
      '山禾甄选', '本期甄选'
    ]);
  });

  it('filters catalog and selection with explicit backend-facing fields', () => {
    expect(filterCatalogProducts([seasonalProduct], 'seasonal')).toEqual([seasonalProduct]);
    expect(filterCatalogProducts([seasonalProduct], 'gift')).toEqual([]);
    expect(filterSelectionProducts([seasonalProduct], 'brand')).toEqual([seasonalProduct]);
    expect(filterSelectionProducts([seasonalProduct], 'season')).toEqual([]);
  });

  it('maps every home entry to the confirmed destination', () => {
    expect(resolveHomeEntry('hero')).toEqual({ tab: 'selection', selection: 'brand' });
    expect(resolveHomeEntry('gift')).toEqual({ tab: 'category', category: 'gift' });
    expect(resolveHomeEntry('trace')).toEqual({ page: '/subpackages/trace/index' });
    expect(resolveHomeEntry('story')).toEqual({ page: '/subpackages/story/index' });
    expect(resolveHomeEntry('season')).toEqual({ tab: 'selection', selection: 'season' });
  });
});
