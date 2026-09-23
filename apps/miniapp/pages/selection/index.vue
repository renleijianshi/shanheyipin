<script setup lang="ts">
import { computed, ref } from 'vue';
import { V19_STOREFRONT_PREVIEW } from '../../preview-products.js';
import { V12_SELECTION_TABS, filterSelectionProducts, type V12SelectionTab } from '@miniapp-model/v12-ui-model.js';

const activeSelection = ref<V12SelectionTab>('brand');
const products = computed(() => filterSelectionProducts(V19_STOREFRONT_PREVIEW, activeSelection.value));

const copy = {
  brand: {
    eyebrow: 'LOCAL SELECTION · GANSU',
    title: '本地好物，我们为什么选这些',
    body: '山禾甄选以甘肃及周边本地风物为主，收录来源清楚、地域特色明确的好物；每一款都讲产地、原料、工艺与入选理由。'
  },
  season: {
    eyebrow: 'THIS SEASON',
    title: '这一期，我们为什么选这些',
    body: '跟着季节、产量与风味更新。什么时候好吃，什么时候上；季节过去，就暂时下架。'
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
      <view class="editorial-photo" :class="['photo-'+index,'photo-'+activeSelection]"><text>{{ product.tags[0] }}</text></view>
      <view class="editorial-copy"><text class="eyebrow">{{ product.subtitle }}</text><text class="editorial-title">{{ product.name }}</text><text class="editorial-body">{{ activeSelection === 'brand' ? '从产地、原料到工艺，先讲清楚风物的来处，再让好味道进入日常餐桌。' : '按季节挑选，关注风味、来源和供应稳定性；当季结束后适时更新。' }}</text><view class="selection-points"><text v-for="tag in product.tags" :key="tag">{{ tag }}</text></view></view>
    </view>
    <view class="selection-note">甄选页呈现内容与入选理由，不显示价格或加购操作。</view>
  </view>
</template>

<style scoped>
.page-shell { min-height: 100vh; padding: 36rpx 40rpx 60rpx; background: var(--v19-canvas); }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; line-height: 32rpx; letter-spacing: 3rpx; }
.selection-top { padding: 18rpx 0 30rpx; }
.selection-tabs { margin-top: 16rpx; display: flex; gap: 44rpx; border-bottom: 1px solid var(--v19-line); }
.selection-tabs button { min-height: 100rpx; position: relative; color: var(--v19-muted); font-size: 39rpx; font-weight: 600; }
.selection-tabs button.active { color: var(--v19-ink); }
.selection-tabs button.active::after { height: 4rpx; position: absolute; right: 0; bottom: -1px; left: 0; background: var(--v19-brand-900); content: ''; }
.selection-intro { padding: 24rpx 0 30rpx; }
.selection-title { display: block; margin: 12rpx 0; font-size: 39rpx; line-height: 56rpx; font-weight: 600; }
.selection-body { display: block; color: var(--v19-ink-700); font-size: 25rpx; line-height: 42rpx; }
.editorial-item { padding: 24rpx 0 40rpx; border-bottom: 1px solid var(--v19-line); }
.editorial-photo { height: 390rpx; padding: 24rpx; display: flex; align-items: flex-end; border-radius: 12rpx; color: white; background: linear-gradient(145deg,#a88a63,#405343); font-size: 22rpx; }
.editorial-photo.photo-1 { background: linear-gradient(145deg,#bea26d,#766142); }
.editorial-photo.photo-season { background: linear-gradient(145deg,#859272,#374b3d); }
.editorial-copy { padding: 22rpx 0; }
.editorial-title { display: block; margin: 8rpx 0 10rpx; font-size: 36rpx; font-weight: 600; }
.editorial-body { display: block; color: var(--v19-ink-700); font-size: 24rpx; line-height: 40rpx; }
.selection-points { margin-top: 20rpx; display: flex; flex-wrap: wrap; gap: 12rpx; }
.selection-points text { padding: 8rpx 14rpx; border: 1px solid var(--v19-line); border-radius: 999rpx; color: var(--v19-muted); font-size: 20rpx; }
.selection-note { margin-top: 28rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 34rpx; }
</style>
