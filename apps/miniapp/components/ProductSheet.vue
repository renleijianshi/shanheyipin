<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';
import { readV19Content } from '../src/v19-content-store.js';

const props = defineProps<{ product: StorefrontProductSummary }>();
const emit = defineEmits<{ close: []; add: [id: string] }>();
const detail = computed(() => readV19Content().products.find(item => item.id === props.product.id));
const price = computed(() => (props.product.minSalePriceCent / 100).toFixed(2));
const imageFailed = ref(false);
watch(() => props.product.coverObjectKey, () => { imageFailed.value = false; });
</script>

<template>
  <view class="sheet-mask" @tap="emit('close')">
    <view class="product-sheet" role="dialog" aria-modal="true" aria-label="商品详情" @tap.stop>
      <view class="sheet-handle"></view>
      <button class="sheet-close" aria-label="关闭商品详情" @tap="emit('close')">×</button>
      <scroll-view scroll-y class="sheet-content">
        <view class="sheet-photo">
          <image v-if="product.coverObjectKey && !imageFailed" :src="product.coverObjectKey" mode="aspectFill" @error="imageFailed = true" />
          <text v-else>山禾颐品</text>
        </view>
        <text class="sheet-kicker">SHANHE PRODUCT</text>
        <text class="sheet-title">{{ product.name }}</text>
        <text class="sheet-intro">{{ detail?.summary || product.subtitle }}</text>
        <text class="sheet-section-title">商品介绍</text>
        <view class="sheet-meta">
          <view><text>产地</text><text class="sheet-meta-value">{{ detail?.origin || '以商品资料为准' }}</text></view>
          <view><text>规格</text><text class="sheet-meta-value">{{ detail?.spec || '详见商品说明' }}</text></view>
        </view>
        <text v-if="detail?.detail || detail?.intro" class="sheet-body">{{ detail?.detail || detail?.intro }}</text>
      </scroll-view>
      <view class="sheet-footer">
        <view><text>到手价</text><text class="sheet-price">¥{{ price }}</text></view>
        <button @tap="emit('add', product.id)">加入购物车</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.sheet-mask { position: fixed; inset: 0; z-index: 99999; display: flex; align-items: flex-end; background: rgba(24, 28, 25, .46); }
.product-sheet { width: 100%; max-width: 750rpx; height: 75%; max-height: 78%; margin: 0 auto; padding-top: 10rpx; position: relative; display: flex; flex-direction: column; overflow: hidden; border-radius: 32rpx 32rpx 0 0; background: var(--color-surface); box-shadow: 0 -16rpx 48rpx rgba(24, 54, 43, .12); }
.sheet-handle { width: 72rpx; height: 8rpx; margin: 8rpx auto 12rpx; flex: none; border-radius: 8rpx; background: var(--v19-line-strong); }
.sheet-content { width: 100%; height: 0; min-height: 0; padding: 10rpx 40rpx 16rpx; flex: 1; box-sizing: border-box; }
.sheet-close { width: 64rpx; height: 64rpx; margin: 0; padding: 0; position: absolute; top: 24rpx; right: 24rpx; z-index: 1; border: 0; border-radius: 50%; color: var(--v19-ink); background: rgba(251, 248, 240, .94); font-size: 40rpx; line-height: 1; }
.sheet-close::after, .sheet-footer button::after { border: 0; }
.sheet-photo { height: 210rpx; margin-bottom: 14rpx; flex: none; overflow: hidden; display: grid; place-items: center; border-radius: var(--radius-feature); color: white; background: var(--v19-brand-800); font-size: 30rpx; }
.sheet-photo image { width: 100%; height: 100%; }
.sheet-kicker { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; }
.sheet-title { display: block; margin: 6rpx 0 2rpx; font-size: 38rpx; line-height: 1.3; font-weight: 600; }
.sheet-intro, .sheet-body { display: block; margin: 8rpx 0; color: var(--v19-ink-700); font-size: 23rpx; line-height: 1.5; }
.sheet-intro { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.sheet-section-title { display: block; margin-top: 8rpx; color: var(--v19-ink); font-size: 23rpx; font-weight: 600; }
.sheet-body { display: block; white-space: pre-line; }
.sheet-meta { margin: 10rpx 0 6rpx; padding: 12rpx 0; display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; border-top: 1px solid var(--v19-line); border-bottom: 1px solid var(--v19-line); }
.sheet-meta view { display: flex; flex-direction: column; gap: 8rpx; }
.sheet-meta text, .sheet-footer view text { color: var(--v19-muted); font-size: var(--type-caption); }
.sheet-meta .sheet-meta-value { color: var(--v19-ink); font-size: 24rpx; font-weight: 500; }
.sheet-footer { min-height: 122rpx; padding: 16rpx 40rpx calc(18rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; gap: 20rpx; flex: none; border-top: 1px solid var(--v19-line); background: var(--v19-paper-light); }
.sheet-footer view { display: flex; flex-direction: column; gap: 4rpx; }
.sheet-footer .sheet-price { color: var(--v19-orange); font-size: 44rpx; line-height: 1.2; }
.sheet-footer button { min-width: 292rpx; min-height: 92rpx; margin: 0; padding: 0 28rpx; border: 0; border-radius: 16rpx; color: white; background: var(--v19-brand-900); font-size: 30rpx; font-weight: 600; }
@media (max-height: 700px) { .product-sheet { height: 78%; } .sheet-photo { height: 160rpx; } .sheet-title { font-size: 34rpx; } }
</style>
