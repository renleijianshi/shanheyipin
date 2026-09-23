<script setup lang="ts">
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

defineProps<{ product: StorefrontProductSummary; tone?: 'persimmon' | 'gift' | 'wheat' | 'season' }>();
const emit = defineEmits<{ select: [product: StorefrontProductSummary] }>();

function formatPrice(cents: number, maxCents: number): string {
  if (cents === 0 && maxCents === 0) return '敬请期待';
  const format = (value: number) => `¥${(value / 100).toFixed(value % 100 === 0 ? 0 : 2)}`;
  return `${format(cents)}${maxCents > cents ? ' 起' : ''}`;
}
</script>

<template>
  <button class="product-tile" @tap="emit('select', product)">
    <view class="product-image" :class="tone || 'season'">
      <text class="image-mark">山禾颐品</text>
      <text class="image-caption">产品图片待接入</text>
    </view>
    <text class="product-name">{{ product.name }}</text>
    <text class="product-subtitle">{{ product.subtitle || '山野风物与当季滋味' }}</text>
    <text class="product-price">{{ formatPrice(product.minSalePriceCent, product.maxSalePriceCent) }}</text>
  </button>
</template>

<style scoped>
.product-tile { min-width: 0; display: flex; flex-direction: column; align-items: stretch; text-align: left; }
.product-image { aspect-ratio: 4 / 5; border: 1px solid rgba(24,54,43,.06); border-radius: 10rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx; color: rgba(255,255,255,.92); background: linear-gradient(155deg,#9f7651,#543d2e); }
.product-image.gift { color: var(--v19-paper-light); background: linear-gradient(145deg,#6d402f,#2c2520); }
.product-image.wheat { color: var(--v19-ink); background: linear-gradient(145deg,#e4d0a8,#ad8f5d); }
.product-image.season { background: linear-gradient(145deg,#7b8b6b,#394d3d); }
.image-mark { font-family: STSong, "Songti SC", serif; font-size: 28rpx; letter-spacing: 5rpx; }
.image-caption { font-size: 18rpx; opacity: .72; }
.product-name { display: -webkit-box; margin-top: 18rpx; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-size: 28rpx; line-height: 42rpx; font-weight: 600; }
.product-subtitle { margin-top: 6rpx; color: var(--v19-muted); font-size: 22rpx; line-height: 34rpx; }
.product-price { margin-top: 12rpx; color: var(--v19-orange); font-size: 34rpx; line-height: 42rpx; font-weight: 600; }
</style>
