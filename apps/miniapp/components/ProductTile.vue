<script setup lang="ts">
import { ref, watch } from 'vue';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

const props = defineProps<{ product: StorefrontProductSummary; tone?: 'persimmon' | 'gift' | 'wheat' | 'season' }>();
const emit = defineEmits<{ select: [product: StorefrontProductSummary] }>();
const imageFailed = ref(false);
watch(() => props.product.coverObjectKey, () => { imageFailed.value = false; });

function formatPrice(cents: number, maxCents: number): string {
  if (cents === 0 && maxCents === 0) return '敬请期待';
  const format = (value: number) => `¥${(value / 100).toFixed(value % 100 === 0 ? 0 : 2)}`;
  return `${format(cents)}${maxCents > cents ? ' 起' : ''}`;
}
</script>

<template>
  <button class="product-tile" @tap="emit('select', product)">
    <view class="product-image" :class="tone || 'season'">
      <image v-if="product.coverObjectKey && !imageFailed" class="product-cover" :src="product.coverObjectKey" mode="aspectFill" @error="imageFailed = true" />
      <text v-if="!product.coverObjectKey || imageFailed" class="image-mark">{{ product.name.includes('礼盒') ? '山禾礼盒' : '山禾颐品' }}</text>
      <text v-if="!product.coverObjectKey || imageFailed" class="image-caption">{{ imageFailed ? '图片暂不可用' : '产品图片待接入' }}</text>
    </view>
    <text class="product-name">{{ product.name }}</text>
    <text class="product-subtitle">{{ product.subtitle || '山野风物与当季滋味' }}</text>
    <text class="product-price">{{ formatPrice(product.minSalePriceCent, product.maxSalePriceCent) }}</text>
  </button>
</template>

<style scoped>
.product-tile { width: 100%; min-width: 0; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: stretch; border: 0; border-radius: 0; background: transparent; box-shadow: none; text-align: left; }
.product-tile::after { border: 0; }
.product-image { aspect-ratio: 4 / 5; position: relative; overflow: hidden; border: 1px solid var(--v19-line); border-radius: 10rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx; color: var(--v19-paper-light); background: var(--v19-brand-800); }
.product-cover { position: absolute; inset: 0; width: 100%; height: 100%; }
.product-image.gift { color: var(--v19-paper-light); background: var(--v19-brand-900); }
.product-image.wheat { color: var(--v19-ink); background: var(--v19-paper); }
.product-image.season { background: var(--v19-brand-700); }
.image-mark { font-family: STSong, "Songti SC", serif; font-size: 28rpx; letter-spacing: 5rpx; }
.image-caption { font-size: 18rpx; opacity: .72; }
.product-name { display: -webkit-box; margin-top: 18rpx; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-size: 28rpx; line-height: 42rpx; font-weight: 600; }
.product-subtitle { margin-top: 6rpx; color: var(--v19-muted); font-size: 22rpx; line-height: 34rpx; }
.product-price { margin-top: 12rpx; color: var(--v19-orange); font-size: 34rpx; line-height: 42rpx; font-weight: 600; }
</style>
