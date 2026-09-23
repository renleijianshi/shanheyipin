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
    <view class="product-sheet" @tap.stop>
      <button class="sheet-close" aria-label="关闭商品详情" @tap="emit('close')">×</button>
      <view class="sheet-photo"><image v-if="product.coverObjectKey && !imageFailed" :src="product.coverObjectKey" mode="aspectFill" @error="imageFailed = true" /><text v-else>山禾颐品</text></view>
      <text class="sheet-kicker">SHANHE PRODUCT</text>
      <text class="sheet-title">{{ product.name }}</text>
      <text class="sheet-subtitle">{{ product.subtitle }}</text>
      <text v-if="detail?.summary" class="sheet-intro">{{ detail.summary }}</text>
      <view class="sheet-meta"><text>产地</text><text>{{ detail?.origin || '以商品资料为准' }}</text></view>
      <view class="sheet-meta"><text>规格</text><text>{{ detail?.spec || '详见商品说明' }}</text></view>
      <text v-if="detail?.intro" class="sheet-body">{{ detail.intro }}</text>
      <text v-if="detail?.detail" class="sheet-body">{{ detail.detail }}</text>
      <view class="sheet-footer"><text class="sheet-price">¥{{ price }}</text><button @tap="emit('add', product.id)">加入购物车</button></view>
    </view>
  </view>
</template>

<style scoped>
.sheet-mask { position: fixed; inset: 0; z-index: 30; display: flex; align-items: flex-end; background: rgba(24, 28, 25, .5); }
.product-sheet { width: 100%; max-width: 750rpx; max-height: 82vh; margin: 0 auto; padding: 38rpx 40rpx calc(30rpx + env(safe-area-inset-bottom)); position: relative; overflow-y: auto; border-radius: 28rpx 28rpx 0 0; background: var(--v19-paper-light); }
.sheet-close { width: 56rpx; height: 56rpx; position: absolute; top: 22rpx; right: 26rpx; z-index: 1; border-radius: 50%; color: var(--v19-ink); background: var(--v19-paper-light); font-size: 42rpx; }
.sheet-photo { height: 340rpx; margin-bottom: 26rpx; overflow: hidden; display: grid; place-items: center; border-radius: 14rpx; color: white; background: var(--v19-brand-800); font-size: 30rpx; }
.sheet-photo image { width: 100%; height: 100%; }
.sheet-kicker { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.sheet-title { display: block; margin-top: 14rpx; font-size: 38rpx; line-height: 1.35; font-weight: 600; }
.sheet-subtitle { display: block; margin-top: 10rpx; color: var(--v19-muted); font-size: 24rpx; }
.sheet-intro, .sheet-body { display: block; margin: 22rpx 0; color: var(--v19-ink-700); font-size: 24rpx; line-height: 1.65; }
.sheet-meta { min-height: 68rpx; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; border-bottom: 1px solid var(--v19-line); font-size: 23rpx; }
.sheet-meta text:first-child { flex: none; color: var(--v19-muted); }
.sheet-footer { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-top: 26rpx; }
.sheet-price { color: var(--v19-orange); font-size: 34rpx; font-weight: 600; }
.sheet-footer button { min-height: 82rpx; padding: 0 28rpx; border-radius: 12rpx; color: white; background: var(--v19-brand-900); font-size: 24rpx; }
.sheet-footer button::after, .sheet-close::after { border: 0; }
</style>
