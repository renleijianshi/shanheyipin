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
      <view v-if="!product.coverObjectKey || imageFailed" class="image-fallback">
        <text class="image-origin">SHANHE · ZHOUQU</text>
        <text class="image-mark">{{ product.name.includes('礼盒') ? '山禾礼盒' : '舟曲风物' }}</text>
        <text class="image-caption">产品实拍图待接入</text>
      </view>
    </view>
    <text class="product-name">{{ product.name }}</text>
    <text class="product-subtitle">{{ product.subtitle || '山野风物与当季滋味' }}</text>
    <text class="product-price">{{ formatPrice(product.minSalePriceCent, product.maxSalePriceCent) }}</text>
  </button>
</template>

<style scoped>
.product-tile { width: 100%; min-width: 0; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: stretch; border: 0; border-radius: 0; background: transparent; box-shadow: none; text-align: left; }
.product-tile::after { border: 0; }
.product-image { aspect-ratio: 4 / 5; position: relative; overflow: hidden; border: 1px solid rgba(30,33,31,.1); border-radius: var(--radius-surface); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--v19-paper-light); background: var(--v19-brand-800); }
.product-cover { position: absolute; inset: 0; width: 100%; height: 100%; }
.product-image.gift { color: var(--v19-paper-light); background: var(--v19-brand-900); }
.product-image.wheat { color: var(--v19-ink); background: var(--v19-paper); }
.product-image.season { background: var(--v19-brand-700); }
.image-fallback { padding: 20rpx; display: flex; flex-direction: column; align-items: center; gap: 12rpx; text-align: center; }
.image-origin { color: rgba(251,248,240,.72); font-size: var(--type-caption); letter-spacing: 2rpx; }
.product-image.wheat .image-origin, .product-image.wheat .image-caption { color: rgba(30,33,31,.7); }
.product-image.wheat .image-caption { border-color: rgba(30,33,31,.22); }
.image-mark { font-family: STSong, "Songti SC", serif; font-size: 34rpx; letter-spacing: 5rpx; }
.image-caption { padding-top: 10rpx; border-top: 1px solid rgba(251,248,240,.3); color: rgba(251,248,240,.78); font-size: var(--type-caption); }
.product-name { display: -webkit-box; margin-top: var(--space-2); overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: var(--color-text-primary); font-size: 28rpx; line-height: 1.45; font-weight: 600; }
.product-subtitle { margin-top: var(--space-1); color: var(--color-text-secondary); font-size: 22rpx; line-height: var(--leading-body); }
.product-price { margin-top: var(--space-2); color: var(--color-accent); font-size: 34rpx; line-height: 1.25; font-weight: 600; }
.product-tile:active .product-cover { transform: scale(1.025); }
.product-tile:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 4rpx; }
.product-cover { transition: transform var(--motion-standard) ease-out; }
@media (prefers-reduced-motion: reduce) { .product-cover { transition: none; } }
</style>
