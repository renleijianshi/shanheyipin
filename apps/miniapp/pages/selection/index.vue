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
  <view class="page-shell">
    <view class="selection-top"><text class="eyebrow">SHANHE SELECTION</text>
      <view class="selection-tabs"><button v-for="tab in V12_SELECTION_TABS" :key="tab.key" :class="{ active: activeSelection === tab.key }" @tap="activeSelection = tab.key">{{ tab.label }}</button></view>
    </view>
    <view class="selection-intro"><text class="eyebrow">{{ copy[activeSelection].eyebrow }}</text><text class="selection-title">{{ copy[activeSelection].title }}</text><text class="selection-body">{{ copy[activeSelection].body }}</text></view>
    <view v-for="(product,index) in products" :key="product.id" class="editorial-item">
      <view class="editorial-photo" :class="['photo-'+index,'photo-'+activeSelection]"><image v-if="product.coverObjectKey" :src="product.coverObjectKey" mode="aspectFill" /><text>{{ product.tags[0] }}</text></view>
      <view class="editorial-copy"><text class="eyebrow">{{ product.subtitle }}</text><text class="editorial-title">{{ product.name }}</text><text class="editorial-body">{{ description(product.id) }}</text><view class="selection-points"><text v-for="tag in product.tags" :key="tag">{{ tag }}</text></view></view>
    </view>
    <view v-if="activeSelection === 'brand'" class="editorial-item">
      <view class="editorial-photo gaolan-photo"><image src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80" mode="aspectFill" /><text>甘肃 · 皋兰</text></view>
      <view class="editorial-copy"><text class="eyebrow">甘肃 · 皋兰</text><text class="editorial-title">皋兰禾尚头挂面</text><text class="editorial-body">禾尚头小麦是皋兰具有地域特色的小麦。做成挂面时，我们更看重自然的麦香、筋道口感和日常食用属性。</text><view class="selection-points"><text>皋兰本地</text><text>麦香清楚</text><text>家常耐吃</text></view></view>
    </view>
    <view class="selection-note">甄选页呈现内容与入选理由，不显示价格或加购操作。</view>
  </view>
</template>

<style scoped>
.page-shell { min-height: 100vh; padding: 36rpx 40rpx 60rpx; background: var(--v19-canvas); }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; line-height: 32rpx; letter-spacing: 3rpx; }
.selection-top { padding: 18rpx 0 30rpx; }
.selection-tabs { margin-top: 16rpx; display: flex; gap: 44rpx; border-bottom: 1px solid var(--v19-line); }
.selection-tabs button { min-height: 100rpx; margin: 0; padding: 0; position: relative; border: 0; border-radius: 0; color: var(--v19-muted); background: transparent; font-size: 39rpx; font-weight: 600; }
.selection-tabs button::after { border: 0; }
.selection-tabs button.active { color: var(--v19-ink); }
.selection-tabs button.active::after { height: 4rpx; position: absolute; right: 0; bottom: -1px; left: 0; background: var(--v19-brand-900); content: ''; }
.selection-intro { padding: 24rpx 0 30rpx; }
.selection-title { display: block; margin: 12rpx 0; font-size: 39rpx; line-height: 56rpx; font-weight: 600; }
.selection-body { display: block; color: var(--v19-ink-700); font-size: 25rpx; line-height: 42rpx; }
.editorial-item { padding: 24rpx 0 40rpx; border-bottom: 1px solid var(--v19-line); }
.editorial-photo { height: 390rpx; padding: 24rpx; position: relative; overflow: hidden; display: flex; align-items: flex-end; border-radius: 12rpx; color: white; background: linear-gradient(145deg,#a88a63,#405343); font-size: 22rpx; }
.editorial-photo image { position: absolute; inset: 0; width: 100%; height: 100%; }
.editorial-photo text { position: relative; z-index: 1; text-shadow: 0 1px 5px #0009; }
.editorial-photo.photo-1 { background: linear-gradient(145deg,#bea26d,#766142); }
.editorial-photo.photo-season { background: linear-gradient(145deg,#859272,#374b3d); }
.editorial-copy { padding: 22rpx 0; }
.editorial-title { display: block; margin: 8rpx 0 10rpx; font-size: 36rpx; font-weight: 600; }
.editorial-body { display: block; color: var(--v19-ink-700); font-size: 24rpx; line-height: 40rpx; }
.selection-points { margin-top: 20rpx; display: flex; flex-wrap: wrap; gap: 12rpx; }
.selection-points text { padding: 8rpx 14rpx; border: 1px solid var(--v19-line); border-radius: 999rpx; color: var(--v19-muted); font-size: 20rpx; }
.selection-note { margin-top: 28rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 34rpx; }
</style>
