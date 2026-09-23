import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

/** Explicitly temporary screen-preview data; replace with CatalogPort before commerce is enabled. */
export const V19_STOREFRONT_PREVIEW: readonly StorefrontProductSummary[] = [
  {
    id: 'preview-persimmon-share', name: '舟曲吊柿 · 分享装', subtitle: '应季甄选 · 甘肃舟曲',
    coverObjectKey: '', tags: ['甘肃舟曲', '应季甄选'], minSalePriceCent: 5980, maxSalePriceCent: 5980,
    presaleEnabled: false, storefrontCategory: 'seasonal', selectionChannels: ['brand']
  },
  {
    id: 'preview-persimmon-gift', name: '吊柿 · 臻选礼盒', subtitle: '礼盒 · 节日赠礼',
    coverObjectKey: '', tags: ['礼盒', '舟曲'], minSalePriceCent: 16800, maxSalePriceCent: 16800,
    presaleEnabled: false, storefrontCategory: 'gift', selectionChannels: []
  },
  {
    id: 'preview-yunnan-coffee', name: '云南精品咖啡豆', subtitle: '山野好物 · 云南',
    coverObjectKey: '', tags: ['山野好物', '云南'], minSalePriceCent: 6800, maxSalePriceCent: 6800,
    presaleEnabled: false, storefrontCategory: 'mountain', selectionChannels: ['season']
  },
  {
    id: 'preview-grassland-beef', name: '草原风味牛肉干', subtitle: '山野好物 · 草原风物',
    coverObjectKey: '', tags: ['本期甄选', '草原风物'], minSalePriceCent: 7900, maxSalePriceCent: 7900,
    presaleEnabled: false, storefrontCategory: 'mountain', selectionChannels: ['season']
  }
];
