<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import ProductTile from '../../components/ProductTile.vue';
import ProductSheet from '../../components/ProductSheet.vue';
import { createPublicCatalogPort } from '../../src/public-catalog-port.js';
import { toProductDetailView, type ProductDetailView } from '../../src/catalog-view-model.js';
import type { StorefrontProductSummary } from '../../src/v12-ports.js';

const catalog = createPublicCatalogPort();
const selectedProduct = ref<StorefrontProductSummary | null>(null);
const selectedProductDetail = ref<ProductDetailView | null>(null);
const productDetailLoading = ref(false);
const productDetailError = ref('');
const previewToast = ref('');
const products = ref<StorefrontProductSummary[]>([]);
const catalogLoading = ref(true);
const catalogError = ref('');
const homeProducts = computed(() => products.value.slice(0, 2));
onShareAppMessage(() => ({ title: '山禾颐品 · 来自舟曲的山野风物', path: '/pages/home/index' }));

function openCategoryGift() {
  uni.setStorageSync('v19-category', 'gift');
  uni.switchTab({ url: '/pages/category/index' });
}

function openSelection() {
  uni.switchTab({ url: '/pages/selection/index' });
}

function openAllCategories() {
  uni.switchTab({ url: '/pages/category/index' });
}

function showPreviewNotice() {
  previewToast.value = '搜索页面尚未开放';
  setTimeout(() => { previewToast.value = ''; }, 2200);
}

async function refreshCatalog() {
  catalogLoading.value = true;
  catalogError.value = '';
  try {
    const result = await catalog.list({ page: 1, pageSize: 50 });
    products.value = [...result.items];
  } catch (error) {
    products.value = [];
    catalogError.value = error instanceof Error ? error.message : '商品目录暂时无法读取，请稍后重试';
  } finally {
    catalogLoading.value = false;
  }
}

async function loadSelectedProduct() {
  if (!selectedProduct.value) return;
  productDetailLoading.value = true;
  productDetailError.value = '';
  try {
    selectedProductDetail.value = toProductDetailView(await catalog.get(selectedProduct.value.id));
  } catch (error) {
    selectedProductDetail.value = null;
    productDetailError.value = error instanceof Error ? error.message : '商品详情暂时无法读取，请稍后重试';
  } finally {
    productDetailLoading.value = false;
  }
}

function openProduct(product: StorefrontProductSummary) {
  selectedProduct.value = product;
  selectedProductDetail.value = null;
  void loadSelectedProduct();
}

onShow(() => {
  // #ifdef H5
  document.body.classList.remove('v19-admin-preview');
  // #endif
  void refreshCatalog();
});
</script>

<template>
  <view class="storefront-preview">
    <scroll-view scroll-y class="home-scroll">
      <view class="mini-head">
        <view>
          <text class="eyebrow">FROM ZHOUQU</text>
          <text class="brand-name">山禾颐品</text>
        </view>
        <view class="head-actions"><button class="icon-btn" aria-label="商品搜索暂未开放" @tap="showPreviewNotice">⌕</button></view>
      </view>

      <view class="hero">
        <view class="hero-copy">
          <text class="eyebrow hero-eyebrow">舟曲 · 白龙江畔</text>
          <text class="hero-title">山河有味<br />一口知秋</text>
          <text class="hero-summary">自然慢晒，把西北的甜认真带给你。</text>
          <button class="hero-cta" @tap="openAllCategories">浏览已上架商品 <text>→</text></button>
        </view>
      </view>

      <view class="quick-links">
        <button @tap="openCategoryGift"><text class="quick-title">礼盒精选</text><text class="quick-note">节令与赠礼</text></button>
        <button disabled><text class="quick-title">扫码溯源</text><text class="quick-note">批次服务待接入</text></button>
        <button disabled><text class="quick-title">山野故事</text><text class="quick-note">内容服务待接入</text></button>
        <button @tap="openSelection"><text class="quick-title">本季甄选</text><text class="quick-note">内容服务待接入</text></button>
      </view>

      <view class="section">
        <view class="section-head">
          <view><text class="eyebrow">SHANHE ORIGINAL</text><text class="section-title">山禾好物</text></view>
          <button class="more-link" @tap="openAllCategories">查看全部 →</button>
        </view>
        <view v-if="catalogLoading" class="catalog-state" aria-live="polite">正在读取后台已发布商品…</view>
        <view v-else-if="catalogError" class="catalog-state catalog-error" role="status"><text>{{ catalogError }}</text><button @tap="refreshCatalog">重试</button></view>
        <view v-else-if="homeProducts.length" class="products-grid">
          <ProductTile
            v-for="(product, index) in homeProducts"
            :key="product.id"
            :product="product"
            :tone="index === 0 ? 'persimmon' : 'gift'"
            @select="openProduct"
          />
        </view>
        <view v-else class="catalog-state"><text class="empty-title">暂无已发布商品</text><text class="empty-copy">商品上架并发布后会显示在这里。</text></view>
      </view>

      <view class="preview-note">商品信息来自后台公开目录；首页内容、甄选、故事与溯源仍待接入管理服务。</view>
      <view class="bottom-safe-space"></view>
    </scroll-view>

    <ProductSheet v-if="selectedProduct" :product="selectedProduct" :detail="selectedProductDetail" :loading="productDetailLoading" :error="productDetailError" @close="selectedProduct = null" @retry="loadSelectedProduct" />
    <view v-if="previewToast" class="preview-toast">{{ previewToast }}</view>
  </view>
</template>

<style scoped>
.storefront-preview { width: 100%; max-width: 750rpx; min-height: 100vh; margin: 0 auto; overflow: hidden; background: var(--color-canvas); }
.home-scroll { height: 100vh; }
.mini-head { min-height: 126rpx; padding: 38rpx 40rpx 24rpx; display: flex; align-items: center; justify-content: space-between; }
.head-actions { display: flex; align-items: center; gap: 12rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); line-height: 1.5; letter-spacing: 3rpx; }
.brand-name { display: block; margin-top: var(--space-1); color: var(--color-text-primary); font-size: var(--type-display); line-height: 1.3; font-weight: 600; letter-spacing: 2rpx; }
.icon-btn { width: 88rpx; height: 88rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-feature); font-size: 42rpx; }
.hero { height: 780rpx; margin: 0 40rpx; position: relative; overflow: hidden; display: flex; align-items: flex-end; border-radius: var(--radius-surface); color: white; background-color: var(--v19-brand-900); background-size: cover; background-position: center; }
.hero-copy { width: 100%; padding: 54rpx 48rpx; position: relative; z-index: 1; }
.hero-eyebrow { color: var(--v19-gold-light); }
.hero-title { display: block; margin: var(--space-2) 0 var(--space-3); font-size: 62rpx; line-height: 1.28; font-weight: 600; letter-spacing: 2rpx; }
.hero-summary { display: block; max-width: 500rpx; color: rgba(255,255,255,.88); font-size: 28rpx; line-height: 44rpx; }
.hero-cta { min-height: 88rpx; margin-top: 36rpx; padding: 0 32rpx; display: flex; align-items: center; gap: 18rpx; border-radius: 16rpx; color: var(--v19-brand-900); background: var(--v19-paper-light); font-size: 26rpx; font-weight: 600; }
.quick-links { margin: var(--space-5) 40rpx 0; display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.quick-links button { width: 100%; min-height: 112rpx; padding: 20rpx 24rpx; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; border-radius: 0; background: transparent; text-align: left; }
.quick-links button[disabled] { opacity: .58; }
.quick-links button:nth-child(odd) { border-right: 1px solid var(--v19-line); }
.quick-links button:nth-child(-n+2) { border-bottom: 1px solid var(--v19-line); }
.quick-title { font-size: 26rpx; }
.quick-note { margin-top: 8rpx; color: var(--v19-muted); font-size: 22rpx; }
.section { padding: var(--space-6) 40rpx 0; }
.section-head { margin-bottom: 32rpx; display: flex; justify-content: space-between; align-items: flex-end; }
.section-title { display: block; margin-top: var(--space-1); color: var(--color-text-primary); font-size: 42rpx; line-height: 1.4; font-weight: 600; }
.more-link { min-height: 72rpx; display: flex; align-items: center; color: var(--v19-brand-900); font-size: 24rpx; }
.products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5) var(--space-3); }
.catalog-state { min-height: 260rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: var(--color-text-secondary); font-size: var(--type-body); line-height: var(--leading-body); text-align: center; }
.catalog-state button { min-height: 64rpx; padding: 0 28rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); }
.catalog-error { color: var(--color-danger); }
.catalog-state .empty-title { color: var(--color-text-primary); font-size: var(--type-title); font-weight: 600; }
.catalog-state .empty-copy { color: var(--color-text-secondary); font-size: var(--type-body); }
.preview-note { padding: 28rpx 40rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 32rpx; }
.bottom-safe-space { height: calc(38rpx + env(safe-area-inset-bottom)); }
.preview-toast { padding: 20rpx 28rpx; position: fixed; left: 50%; bottom: calc(112rpx + env(safe-area-inset-bottom)); z-index: 40; transform: translateX(-50%); border-radius: 12rpx; color: white; background: rgba(25,31,27,.86); font-size: 23rpx; white-space: nowrap; }
</style>
