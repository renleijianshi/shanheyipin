import type { StorefrontProductSummary, SelectionChannel, StorefrontCategory } from './v12-ports.js';
import { V19_STOREFRONT_PREVIEW } from '../preview-products.js';

const KEY = 'shanhe-v19-content-v3';
const PREVIOUS_KEY = 'shanhe-v19-content-v2';
// Keep the V19 source imagery for local visual review only. Production media must use approved OSS keys/domains.
const V19_PREVIEW_IMAGES = {
  persimmon: 'https://image.nzpm.cn/uploads/20250112/3f08487db3f72132d1214d8c44ba4616.jpg',
  gift: 'https://tu.chdesign.cn/Thumbnail/upload/creation/20180708/giytgojsguzdomjsgi3dkobtonidozllpbmhs4zonjygox3qojxxa33soruw63s7hayda6bygaya.jpg',
  coffee: 'https://miro.medium.com/v2/0%2AfEk_as8NTYbSbluy',
  beef: 'https://img.alicdn.com/bao/uploaded/i4/2212287855603/O1CN01viatkQ1rGDv5V0NDn_%21%212212287855603.jpg'
};
export interface V19Product {
  id: string; name: string; subtitle: string; category: StorefrontCategory;
  priceCent: number; spec: string; summary: string; imageUrl: string;
  origin?: string; intro?: string; detail?: string;
  type: 'owned' | 'curated'; status: '上架' | '下架';
  selection: SelectionChannel[]; selectionTitle: string;
}
export interface V19Story {
  id: string; title: string; type: string; origin: string; product: string;
  summary: string; body: string; coverUrl: string; status: '发布' | '草稿';
}
export interface V19Trace {
  id: string; product: string; batchNo: string; origin: string; supplier: string;
  receiveDate: string; packDate: string; craft: string; quality: string;
  note: string; status: '启用' | '停用';
}
export interface V19Content {
  products: V19Product[]; stories: V19Story[]; traces: V19Trace[];
  homeImages: { hero: string; persimmon: string; gift: string };
  cart: Record<string, number>;
}
const defaults: V19Content = {
  products: V19_STOREFRONT_PREVIEW.map((p, i) => ({
    id: p.id, name: p.name, subtitle: p.subtitle ?? '', category: requirePreviewCategory(p.storefrontCategory),
    priceCent: p.minSalePriceCent, spec: i === 0 ? '500g' : i === 1 ? '礼盒装' : '精选装',
    summary: [
      '从鲜柿挑选、削皮、整理，到悬挂风干、回软与自然挂霜。山风和时间留下柔软、甜润与果香。',
      '把舟曲的自然甜润装进礼盒，适合节令分享与心意相赠。',
      '产地清楚、风味鲜明的云南咖啡豆，适合慢慢冲煮、认真品尝。',
      '来自草原的浓郁风味，记录原料、产地与制作工艺。'
    ][i] ?? (p.subtitle ?? ''),
    origin: ['甘肃舟曲', '甘肃舟曲', '云南', '草原产区'][i] ?? '',
    intro: [
      '舟曲吊柿从鲜果挑选开始，经削皮、整理、悬挂风干、回软与自然挂霜，留下柔软甜润的果香。',
      '舟曲吊柿礼盒把山野风味收进一份适合赠礼的心意。',
      '这一期甄选的云南咖啡豆，注重产地来源与自然风味。',
      '本期草原风味，适合分享与随行。'
    ][i] ?? '',
    detail: [
      '传统吊晒 · 自然风干 · 柔软甜润。图片与文案均为 V19 预览资料，正式商品信息以上线资料为准。',
      '礼盒规格、包装和保存方式以上线商品资料为准。',
      '烘焙程度、产区与风味信息以上线商品资料为准。',
      '原料、口味与保存方式以上线商品资料为准。'
    ][i] ?? '',
    imageUrl: [V19_PREVIEW_IMAGES.persimmon, V19_PREVIEW_IMAGES.gift, V19_PREVIEW_IMAGES.coffee, V19_PREVIEW_IMAGES.beef][i] ?? '', type: i < 2 ? 'owned' : 'curated', status: '上架',
    selection: [...p.selectionChannels], selectionTitle: p.name
  })),
  stories: [
    { id: 'story-origin', title: '舟曲，山谷与白龙江', type: '产地', origin: '甘肃舟曲', product: '舟曲吊柿', summary: '先认识一片土地，再认识它的味道。', body: '白龙江穿过山谷，昼夜温差与山地气候，孕育出舟曲吊柿的风味。', coverUrl: '', status: '发布' },
    { id: 'story-craft', title: '一枚吊柿的慢晒时光', type: '工艺', origin: '甘肃舟曲', product: '舟曲吊柿', summary: '时间让果香慢慢沉淀。', body: '从鲜果挑选、削皮整理，到悬挂风干、回软与自然挂霜，时间让果香慢慢沉淀。', coverUrl: '', status: '发布' }
  ],
  traces: [{ id: 'trace-demo', product: '舟曲吊柿', batchNo: 'ZQ-2026-001', origin: '甘肃省甘南州舟曲县', supplier: '舟曲合作农户', receiveDate: '2026-09-12', packDate: '2026-09-18', craft: '自然慢晒', quality: '抽检合格 · 果肉饱满', note: '感谢选择山禾颐品。', status: '启用' }],
  homeImages: { hero: V19_PREVIEW_IMAGES.persimmon, persimmon: V19_PREVIEW_IMAGES.persimmon, gift: V19_PREVIEW_IMAGES.gift }, cart: {}
};
function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export function readV19Content(): V19Content {
  try {
    const raw = uni.getStorageSync(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<V19Content>;
      const content = { ...copy(defaults), ...saved };
      content.products = content.products.map(product => {
        const seed = defaults.products.find(item => item.id === product.id);
        return seed ? { ...seed, ...product } : product;
      });
      return content;
    }
    const previous = uni.getStorageSync(PREVIOUS_KEY);
    if (previous) {
      const old = JSON.parse(previous) as V19Content;
      const customProducts = Array.isArray(old.products) ? old.products.filter(p => !p.id.startsWith('preview-')) : [];
      const migrated = { ...copy(defaults), ...old, products: [...customProducts, ...copy(defaults.products)] };
      writeV19Content(migrated);
      return migrated;
    }
  } catch { /* recover with preview defaults */ }
  return copy(defaults);
}
export function writeV19Content(value: V19Content): void { uni.setStorageSync(KEY, JSON.stringify(value)); }
export function saveV19Content(update: (value: V19Content) => void): V19Content {
  const value = readV19Content(); update(value); writeV19Content(value); return value;
}
export function storefrontProducts(includeHidden = false): StorefrontProductSummary[] {
  return readV19Content().products.filter(p => includeHidden || p.status === '上架').map(p => ({
    id: p.id, categoryCode: p.category, name: p.name, subtitle: p.subtitle, coverObjectKey: p.imageUrl,
    tags: [p.category === 'gift' ? '礼盒' : p.category === 'seasonal' ? '应季甄选' : '山野好物', ...p.selection.map(s => s === 'brand' ? '山禾甄选' : '本期甄选')],
    minSalePriceCent: p.priceCent, maxSalePriceCent: p.priceCent, presaleEnabled: false,
    storefrontCategory: p.category, selectionChannels: p.selection
  }));
}
export function resetV19Content(): void { writeV19Content(copy(defaults)); }
export function addV19CartItem(id: string): void { saveV19Content(c => { c.cart[id] = (c.cart[id] ?? 0) + 1; }); }
function requirePreviewCategory(category: StorefrontCategory | null): StorefrontCategory {
  if (category === null) throw new Error('V19 preview products require a configured storefront category');
  return category;
}
