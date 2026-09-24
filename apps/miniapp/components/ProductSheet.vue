<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';
import type { ProductDetailView } from '../src/catalog-view-model.js';
import { resolvePublicMediaUrl } from '../src/public-media-url.js';

const props = defineProps<{
  product: StorefrontProductSummary;
  detail: ProductDetailView | null;
  loading: boolean;
  error: string;
}>();
const emit = defineEmits<{ close: []; retry: [] }>();
const selectedSkuId = ref('');
const imageUrl = computed(() => resolvePublicMediaUrl(props.product.coverObjectKey));
const selectedSku = computed(() => props.detail?.skuOptions.find(sku => sku.id === selectedSkuId.value) ?? null);
const price = computed(() => selectedSku.value ? formatPrice(selectedSku.value.salePriceCent) : '—');
const imageFailed = ref(false);
watch(() => props.product.coverObjectKey, () => { imageFailed.value = false; });
watch(() => props.detail?.selectedSkuId, id => { selectedSkuId.value = id ?? ''; }, { immediate: true });

function formatPrice(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
</script>

<template>
  <view class="sheet-mask" @tap="emit('close')">
    <view class="product-sheet" role="dialog" aria-modal="true" aria-label="商品详情" @tap.stop>
      <view class="sheet-handle"></view>
      <button class="sheet-close" aria-label="关闭商品详情" @tap="emit('close')">×</button>
      <scroll-view scroll-y class="sheet-content">
        <view class="sheet-photo">
          <image v-if="imageUrl && !imageFailed" :src="imageUrl" mode="aspectFill" @error="imageFailed = true" />
          <text v-else>产品实拍图待接入</text>
        </view>
        <text class="sheet-kicker">SHANHE PRODUCT</text>
        <text class="sheet-title">{{ product.name }}</text>
        <text class="sheet-intro">{{ detail?.origin ? `产地 · ${detail.origin}` : (product.subtitle || '商品介绍待发布') }}</text>
        <text class="sheet-section-title">商品介绍</text>
        <view v-if="loading" class="sheet-state">正在读取商品资料…</view>
        <view v-else-if="error" class="sheet-state sheet-error">
          <text>{{ error }}</text>
          <button @tap="emit('retry')">重试</button>
        </view>
        <template v-else-if="detail">
          <view class="sheet-meta">
            <view><text>产地</text><text class="sheet-meta-value">{{ detail.origin || '商品资料未填写' }}</text></view>
            <view><text>可选规格</text><text class="sheet-meta-value">{{ detail.skuOptions.length }} 种</text></view>
          </view>
          <text class="sheet-section-title">选择规格</text>
          <view class="sku-options">
            <button v-for="sku in detail.skuOptions" :key="sku.id" :class="{ selected: selectedSkuId === sku.id }" :aria-pressed="selectedSkuId === sku.id" @tap="selectedSkuId = sku.id">
              <text class="sku-name">{{ sku.name }}</text>
              <text class="sku-specs">{{ sku.specsText || `${sku.weightGram}g` }}</text>
              <text class="sku-price">¥{{ formatPrice(sku.salePriceCent) }}</text>
            </button>
          </view>
          <text class="sheet-body">{{ detail.content }}</text>
        </template>
        <view v-else class="sheet-state">商品详情尚未加载。</view>
      </scroll-view>
      <view class="sheet-footer">
        <view class="sheet-footer-price">
          <text>到手价</text>
          <text class="sheet-price">{{ price === '—' ? price : `¥${price}` }}</text>
          <text class="purchase-note">购物车服务尚未接入，暂不可购买</text>
        </view>
        <button disabled>加入购物车</button>
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
.sheet-state { min-height: 140rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: var(--color-text-secondary); font-size: var(--type-body); }
.sheet-error { color: var(--color-danger); }
.sheet-error button { min-height: 60rpx; padding: 0 24rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); }
.sku-options { margin-top: 12rpx; display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }
.sku-options button { min-width: 0; min-height: 94rpx; margin: 0; padding: 12rpx 16rpx; display: flex; flex-direction: column; align-items: flex-start; gap: 5rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-text-primary); background: var(--color-surface); text-align: left; }
.sku-options button.selected { border-color: var(--color-brand); color: var(--color-brand); }
.sku-name { font-size: 22rpx; font-weight: 600; }
.sku-specs { color: var(--color-text-secondary); font-size: 18rpx; }
.sku-price { color: var(--color-accent); font-size: 20rpx; font-weight: 600; }
.sheet-body { display: block; white-space: pre-line; }
.sheet-meta { margin: 10rpx 0 6rpx; padding: 12rpx 0; display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; border-top: 1px solid var(--v19-line); border-bottom: 1px solid var(--v19-line); }
.sheet-meta view { display: flex; flex-direction: column; gap: 8rpx; }
.sheet-meta text, .sheet-footer view text { color: var(--v19-muted); font-size: var(--type-caption); }
.sheet-meta .sheet-meta-value { color: var(--v19-ink); font-size: 24rpx; font-weight: 500; }
.sheet-footer { min-height: 122rpx; padding: 16rpx 40rpx calc(18rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; gap: 20rpx; flex: none; border-top: 1px solid var(--v19-line); background: var(--v19-paper-light); }
.sheet-footer-price { min-width: 0; display: flex; flex-direction: column; gap: 4rpx; }
.purchase-note { color: var(--color-warning); font-size: 17rpx; }
.sheet-footer .sheet-price { color: var(--v19-orange); font-size: 44rpx; line-height: 1.2; }
.sheet-footer button { min-width: 292rpx; min-height: 92rpx; margin: 0; padding: 0 28rpx; border: 0; border-radius: 16rpx; color: white; background: var(--v19-brand-900); font-size: 30rpx; font-weight: 600; }
.sheet-footer button[disabled] { color: rgba(255,255,255,.86); opacity: .72; }
@media (max-height: 700px) { .product-sheet { height: 78%; } .sheet-photo { height: 160rpx; } .sheet-title { font-size: 34rpx; } }
</style>
