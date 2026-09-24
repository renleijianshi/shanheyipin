<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { readV19Content, storefrontProducts, type V19Product } from '../../src/v19-content-store.js';
import { V12_SELECTION_TABS, filterSelectionProducts, type V12SelectionTab } from '@miniapp-model/v12-ui-model.js';

const activeSelection = ref<V12SelectionTab>('brand');
const allProducts = ref(storefrontProducts());
const productDetails = ref<V19Product[]>(readV19Content().products);
const products = computed(() => filterSelectionProducts(allProducts.value, activeSelection.value));
onShow(() => { allProducts.value = storefrontProducts(); productDetails.value = readV19Content().products; });
function description(id: string): string { return productDetails.value.find(product => product.id === id)?.summary || '从产地、原料到工艺，讲清楚风物的来处。'; }

const copy = {
  brand: {
    eyebrow: 'LOCAL SELECTION · GANSU',
    title: '本地好物，我们为什么选这些',
    body: '山禾甄选以甘肃及周边本地风物为主，不限定只有一个单品。这里持续收录来源清楚、地域特色明确、适合日常食用或节令分享的本地好物。'
  },
  season: {
    eyebrow: 'THIS SEASON',
    title: '这一期，我们为什么选这些',
    body: '本期甄选不以促销和价格为重点，只讲来源、风味、工艺与为什么值得被山禾颐品选进来。'
  }
} as const;
</script>

<template>
  <scroll-view scroll-y class="tab-page-scroll">
    <view class="page-shell">
      <view class="selection-top"><text class="eyebrow">SHANHE SELECTION</text>
        <view class="selection-tabs"><button v-for="tab in V12_SELECTION_TABS" :key="tab.key" :class="{ active: activeSelection === tab.key }" @tap="activeSelection = tab.key">{{ tab.label }}</button></view>
      </view>
      <view class="selection-intro"><text class="eyebrow">{{ copy[activeSelection].eyebrow }}</text><text class="selection-title">{{ copy[activeSelection].title }}</text><text class="selection-body">{{ copy[activeSelection].body }}</text></view>
      <view v-if="products.length" class="selection-products">
      <view v-for="(product,index) in products" :key="product.id" class="editorial-item">
        <view class="editorial-photo" :class="['photo-'+index,'photo-'+activeSelection]"><image v-if="product.coverObjectKey" :src="product.coverObjectKey" mode="aspectFill" /><text>{{ product.tags[0] }}</text></view>
        <view class="editorial-copy"><text class="eyebrow">{{ product.subtitle }}</text><text class="editorial-title">{{ product.name }}</text><text class="editorial-body">{{ description(product.id) }}</text><view class="selection-points"><text v-for="tag in product.tags" :key="tag">{{ tag }}</text></view></view>
      </view>
      </view>
      <view v-else class="selection-empty"><text class="empty-mark">禾</text><text class="empty-title">本期内容正在整理</text><text class="empty-copy">新一期甄选发布后，会在这里介绍产地、风味与入选理由。</text></view>
    <view v-if="activeSelection === 'brand'" class="editorial-item">
      <view class="editorial-photo gaolan-photo"><image src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80" mode="aspectFill" /><text>甘肃 · 皋兰</text></view>
      <view class="editorial-copy"><text class="eyebrow">甘肃 · 皋兰</text><text class="editorial-title">皋兰禾尚头挂面</text><text class="editorial-subline">本地麦香 · 筋道耐煮 · 家常面食</text><text class="editorial-body">禾尚头小麦是皋兰具有地域特色的小麦。做成挂面或长寿面一类面食时，我们更看重它自然的麦香、筋道口感和日常食用属性。山禾甄选会把这类真正扎根本地餐桌的东西放进来，而不是只追求稀有或猎奇。</text><view class="selection-points"><text>皋兰本地</text><text>麦香清楚</text><text>家常耐吃</text></view></view>
    </view>
    <view v-else class="editorial-item">
      <view class="editorial-photo seasonal-photo"><image src="https://n.sinaimg.cn/sinacn10107/36/w1024h612/20190407/d066-hvhrcxm5250136.jpg" mode="aspectFill" /><text>山野 · 时令</text></view>
      <view class="editorial-copy"><text class="eyebrow">山野 · 时令</text><text class="editorial-title">山野时令好物</text><text class="editorial-subline">跟着季节更新 · 不长期固定上架</text><text class="editorial-body">有些山野风物最好的时候很短，所以它们不适合被做成常年固定 SKU。这里会根据季节、产量、风味和供应稳定性更新：什么时候好吃，什么时候上；季节过去，就暂时下架。</text><view class="selection-points"><text>应季而选</text><text>来源清楚</text><text>少量更新</text></view></view>
    </view>
      <view class="selection-note">甄选页呈现内容与入选理由，不显示价格或加购操作。</view>
    </view>
  </scroll-view>
</template>

<style scoped>
.page-shell { min-height: 100%; padding: 36rpx 40rpx 60rpx; background: var(--color-canvas); }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); line-height: 1.5; letter-spacing: 3rpx; }
.selection-top { padding: 18rpx 0 30rpx; }
.selection-tabs { margin-top: 16rpx; display: flex; gap: 44rpx; border-bottom: 1px solid var(--color-border); }
.selection-tabs button { min-height: 92rpx; margin: 0; padding: 0; position: relative; border: 0; border-radius: 0; color: var(--color-text-secondary); background: transparent; font-size: 35rpx; font-weight: 600; transition: color var(--motion-quick) ease-out; }
.selection-tabs button::after { border: 0; }
.selection-tabs button.active { color: var(--color-text-primary); }
.selection-tabs button.active::after { height: 4rpx; position: absolute; right: 0; bottom: -1px; left: 0; background: var(--color-brand); content: ''; }
.selection-intro { max-width: 670rpx; padding: 30rpx 0 24rpx; }
.selection-title { display: block; margin: 12rpx 0; color: var(--color-text-primary); font-size: 38rpx; line-height: 1.35; font-weight: 600; }
.selection-body { display: block; color: var(--v19-ink-700); font-size: 24rpx; line-height: 1.65; }
.selection-products { display: flex; flex-direction: column; }
.editorial-item { padding: 22rpx 0 30rpx; border-bottom: 1px solid var(--color-border); }
.editorial-photo { height: 390rpx; padding: 24rpx; position: relative; overflow: hidden; display: flex; align-items: flex-end; border-radius: var(--radius-surface); color: var(--v19-white); background: var(--color-surface-muted); font-size: 22rpx; }
.editorial-photo image { position: absolute; inset: 0; width: 100%; height: 100%; }
.editorial-photo text { padding: 10rpx 14rpx; position: relative; z-index: 1; border-radius: 4rpx; color: #fff; background: rgba(24, 36, 29, .58); }
.editorial-photo.photo-1 { background: var(--v19-brand-700); }
.editorial-photo.photo-season { background: var(--v19-brand-800); }
.editorial-copy { padding: 22rpx 0 4rpx; }
.editorial-title { display: block; margin: 8rpx 0 10rpx; color: var(--color-text-primary); font-size: 34rpx; line-height: 1.4; font-weight: 600; }
.editorial-subline { display: block; margin: 0 0 12rpx; color: var(--color-text-secondary); font-size: 22rpx; line-height: var(--leading-body); }
.editorial-body { display: block; color: var(--v19-ink-700); font-size: 24rpx; line-height: 1.65; }
.selection-points { margin-top: 20rpx; display: flex; flex-wrap: wrap; gap: 12rpx; }
.selection-points text { min-height: 48rpx; padding: 8rpx 14rpx; display: inline-flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-text-secondary); font-size: 20rpx; }
.selection-empty { min-height: 360rpx; padding: 36rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); text-align: center; }
.empty-mark { width: 76rpx; height: 76rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); font-size: 32rpx; }
.empty-title { margin-top: 20rpx; color: var(--color-text-primary); font-size: var(--type-title); font-weight: 600; }
.empty-copy { max-width: 540rpx; margin-top: 10rpx; color: var(--color-text-secondary); font-size: var(--type-caption); line-height: var(--leading-body); }
.selection-note { margin-top: 28rpx; color: var(--color-text-secondary); font-size: 20rpx; line-height: 1.6; }
@media (prefers-reduced-motion: reduce) { .selection-tabs button { transition: none; } }
</style>
