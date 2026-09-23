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
      <scroll-view scroll-y class="sheet-scroll">
        <view class="sheet-photo">
          <image v-if="product.coverObjectKey && !imageFailed" :src="product.coverObjectKey" mode="aspectFill" @error="imageFailed = true" />
          <text v-else>山禾颐品</text>
        </view>
        <text class="sheet-kicker">SHANHE PRODUCT</text>
        <text class="sheet-title">{{ product.name }}</text>
        <text class="sheet-intro">{{ detail?.summary || product.subtitle }}</text>
        <view class="sheet-meta">
          <view><text>产地</text><strong>{{ detail?.origin || '以商品资料为准' }}</strong></view>
          <view><text>规格</text><strong>{{ detail?.spec || '详见商品说明' }}</strong></view>
        </view>
        <text v-if="detail?.detail || detail?.intro" class="sheet-body">{{ detail?.detail || detail?.intro }}</text>
      </scroll-view>
      <view class="sheet-footer">
        <view><text>到手价</text><strong>¥{{ price }}</strong></view>
        <button @tap="emit('add', product.id)">加入购物车</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.sheet-mask { position: fixed; inset: 0; z-index: 30; display: flex; align-items: flex-end; background: rgba(24, 28, 25, .46); }
.product-sheet { width: 100%; max-width: 750rpx; height: min(68vh, 1180rpx); max-height: 72%; margin: 0 auto; padding-top: 10rpx; position: relative; display: flex; flex-direction: column; overflow: hidden; border-radius: 32rpx 32rpx 0 0; background: var(--v19-paper-light); box-shadow: 0 -16rpx 48rpx rgba(24, 54, 43, .12); }
.sheet-handle { width: 72rpx; height: 8rpx; margin: 8rpx auto 12rpx; flex: none; border-radius: 8rpx; background: var(--v19-line-strong); }
.sheet-scroll { height: 0; min-height: 0; padding: 10rpx 40rpx 24rpx; flex: 1; box-sizing: border-box; }
.sheet-close { width: 64rpx; height: 64rpx; margin: 0; padding: 0; position: absolute; top: 24rpx; right: 24rpx; z-index: 1; border: 0; border-radius: 50%; color: var(--v19-ink); background: rgba(251, 248, 240, .94); font-size: 40rpx; line-height: 1; }
.sheet-close::after, .sheet-footer button::after { border: 0; }
.sheet-photo { height: 336rpx; margin-bottom: 26rpx; overflow: hidden; display: grid; place-items: center; border-radius: 16rpx; color: white; background: var(--v19-brand-800); font-size: 30rpx; }
.sheet-photo image { width: 100%; height: 100%; }
.sheet-kicker { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.sheet-title { display: block; margin: 12rpx 0 8rpx; font-size: 42rpx; line-height: 1.35; font-weight: 600; }
.sheet-intro, .sheet-body { display: block; margin: 16rpx 0; color: var(--v19-ink-700); font-size: 24rpx; line-height: 1.65; }
.sheet-intro { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.sheet-body { display: -webkit-box; overflow: hidden; white-space: pre-line; -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
.sheet-meta { margin: 24rpx 0; padding: 20rpx 0; display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; border-top: 1px solid var(--v19-line); border-bottom: 1px solid var(--v19-line); }
.sheet-meta view { display: flex; flex-direction: column; gap: 8rpx; }
.sheet-meta text, .sheet-footer view text { color: var(--v19-muted); font-size: 21rpx; }
.sheet-meta strong { color: var(--v19-ink); font-size: 24rpx; font-weight: 500; }
.sheet-footer { min-height: 122rpx; padding: 16rpx 40rpx calc(18rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; gap: 20rpx; flex: none; border-top: 1px solid var(--v19-line); background: var(--v19-paper-light); }
.sheet-footer view { display: flex; flex-direction: column; gap: 4rpx; }
.sheet-footer view strong { color: var(--v19-orange); font-size: 44rpx; line-height: 1.2; }
.sheet-footer button { min-width: 292rpx; min-height: 92rpx; margin: 0; padding: 0 28rpx; border: 0; border-radius: 16rpx; color: white; background: var(--v19-brand-900); font-size: 30rpx; font-weight: 600; }
@media (max-height: 620px) { .product-sheet { height: 82vh; } .sheet-photo { height: 260rpx; } }
</style>
