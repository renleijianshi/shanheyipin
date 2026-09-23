import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

/** Explicitly temporary screen-preview data; replace with CatalogPort before commerce is enabled. */
export const V19_STOREFRONT_PREVIEW: readonly StorefrontProductSummary[] = [
  {
    id: 'preview-persimmon-share', name: '舟曲吊柿 · 分享装', subtitle: '自然慢晒 · 500g',
    coverObjectKey: '', tags: ['甘肃舟曲', '应季甄选'], minSalePriceCent: 5980, maxSalePriceCent: 5980,
    presaleEnabled: false, storefrontCategory: 'seasonal', selectionChannels: ['brand', 'season']
  },
  {
    id: 'preview-persimmon-gift', name: '吊柿 · 臻选礼盒', subtitle: '节日赠礼 · 山禾颐品',
    coverObjectKey: '', tags: ['礼盒', '舟曲'], minSalePriceCent: 16800, maxSalePriceCent: 16800,
    presaleEnabled: false, storefrontCategory: 'gift', selectionChannels: ['brand']
  },
  {
    id: 'preview-gaolan-noodles', name: '皋兰禾尚头挂面', subtitle: '甘肃皋兰 · 家常风物',
    coverObjectKey: '', tags: ['甘肃本地', '山禾甄选'], minSalePriceCent: 0, maxSalePriceCent: 0,
    presaleEnabled: false, storefrontCategory: 'mountain', selectionChannels: ['brand']
  },
  {
    id: 'preview-seasonal-goods', name: '山野时令好物', subtitle: '按季节更新 · 来源清楚',
    coverObjectKey: '', tags: ['本期甄选', '季节限定'], minSalePriceCent: 0, maxSalePriceCent: 0,
    presaleEnabled: false, storefrontCategory: 'mountain', selectionChannels: ['season']
  }
];
