<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import ProductTile from '../../components/ProductTile.vue';
import ProductSheet from '../../components/ProductSheet.vue';
import { addV19CartItem, readV19Content, storefrontProducts } from '../../src/v19-content-store.js';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

const selectedProduct = ref<StorefrontProductSummary | null>(null);
const previewToast = ref('');
const products = ref(storefrontProducts());
const homeImages = ref(readV19Content().homeImages);
const homeProducts = computed(() => products.value.slice(0, 2).map(product => ({
  ...product,
  subtitle: product.id === 'preview-persimmon-share' ? '自然慢晒 · 500g' : product.id === 'preview-persimmon-gift' ? '节日赠礼 · 山禾颐品' : product.subtitle,
  coverObjectKey: product.id === 'preview-persimmon-share' ? homeImages.value.persimmon || product.coverObjectKey
    : product.id === 'preview-persimmon-gift' ? homeImages.value.gift || product.coverObjectKey
    : product.coverObjectKey
})));
onShareAppMessage(() => ({ title: '山禾颐品 · 来自舟曲的山野风物', path: '/pages/home/index' }));

function openAdminPreview() {
  uni.navigateTo({ url: '/pages/admin-preview/index' });
}

function openCategoryGift() {
  uni.setStorageSync('v19-category', 'gift');
  uni.switchTab({ url: '/pages/category/index' });
}

function openStory(id?: string) {
  if (id) uni.setStorageSync('v19-story', id);
  uni.navigateTo({ url: '/pages/story/index' });
}

function openTrace() {
  uni.navigateTo({ url: '/pages/trace/index' });
}

function openSelection() {
  uni.switchTab({ url: '/pages/selection/index' });
}

function openAllCategories() {
  uni.switchTab({ url: '/pages/category/index' });
}

function showPreviewNotice() {
  previewToast.value = '当前为 V19 界面预览，商品接口尚未接入';
  setTimeout(() => { previewToast.value = ''; }, 2200);
}
onShow(() => {
  // #ifdef H5
  document.body.classList.remove('v19-admin-preview');
  // #endif
  const content = readV19Content();
  products.value = storefrontProducts();
  homeImages.value = content.homeImages;
});
function addProductToCart() { if (!selectedProduct.value) return; addV19CartItem(selectedProduct.value.id); selectedProduct.value = null; uni.showToast({ title: '已加入演示购物车' }); }
</script>

<template>
  <view class="storefront-preview">
    <scroll-view scroll-y class="home-scroll">
      <view class="mini-head">
        <view>
          <text class="eyebrow">FROM ZHOUQU</text>
          <text class="brand-name">山禾颐品</text>
        </view>
        <view class="head-actions"><button class="admin-test-entry" @tap="openAdminPreview">后台预览 ↗</button><button class="icon-btn" aria-label="搜索" @tap="showPreviewNotice">⌕</button></view>
      </view>

      <view class="hero" :style="homeImages.hero ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.76),rgba(18,29,23,.08)),url('${homeImages.hero}')` } : undefined">
        <view class="hero-copy">
          <text class="eyebrow hero-eyebrow">舟曲 · 白龙江畔</text>
          <text class="hero-title">山河有味<br />一口知秋</text>
          <text class="hero-summary">自然慢晒，把西北的甜认真带给你。</text>
          <button class="hero-cta" @tap="openSelection">探索本季吊柿 <text>→</text></button>
        </view>
      </view>

      <view class="quick-links">
        <button @tap="openCategoryGift"><text class="quick-title">礼盒精选</text><text class="quick-note">节令与赠礼</text></button>
        <button @tap="openTrace"><text class="quick-title">扫码溯源</text><text class="quick-note">看见来源</text></button>
        <button @tap="openStory()"><text class="quick-title">山野故事</text><text class="quick-note">人、地与风物</text></button>
        <button @tap="openSelection"><text class="quick-title">本季甄选</text><text class="quick-note">编辑推荐</text></button>
      </view>

      <view class="section">
        <view class="section-head">
          <view><text class="eyebrow">SHANHE ORIGINAL</text><text class="section-title">舟曲好物</text></view>
          <button class="more-link" @tap="openAllCategories">查看全部 →</button>
        </view>
        <view class="products-grid">
          <ProductTile
            v-for="(product, index) in homeProducts"
            :key="product.id"
            :product="product"
            :tone="index === 0 ? 'persimmon' : 'gift'"
            @select="selectedProduct = $event"
          />
        </view>
      </view>

      <view class="preview-note">本机 V19 演示内容 · 正式商品目录、API 与授权素材待接入</view>
      <view class="bottom-safe-space"></view>
    </scroll-view>

    <ProductSheet v-if="selectedProduct" :product="selectedProduct" @close="selectedProduct = null" @add="addProductToCart" />
    <view v-if="previewToast" class="preview-toast">{{ previewToast }}</view>
  </view>
</template>

<style scoped>
.storefront-preview { width: 100%; max-width: 750rpx; min-height: 100vh; margin: 0 auto; overflow: hidden; background: var(--v19-canvas); }
.home-scroll { height: 100vh; }
.mini-head { min-height: 126rpx; padding: 38rpx 40rpx 24rpx; display: flex; align-items: center; justify-content: space-between; }
.head-actions { display: flex; align-items: center; gap: 12rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; line-height: 32rpx; letter-spacing: 3rpx; }
.brand-name { display: block; margin-top: 8rpx; font-size: 50rpx; line-height: 66rpx; font-weight: 600; letter-spacing: 2rpx; }
.icon-btn { width: 88rpx; height: 88rpx; display: grid; place-items: center; border: 1px solid var(--v19-line); border-radius: 18rpx; font-size: 42rpx; }
.admin-test-entry { min-height: 56rpx; padding: 0 13rpx; border: 1px solid var(--v19-line-strong); border-radius: 8rpx; color: var(--v19-brand-900); background: var(--v19-paper-light); font-size: 19rpx; white-space: nowrap; }
.hero { height: 780rpx; margin: 0 40rpx; position: relative; overflow: hidden; display: flex; align-items: flex-end; border-radius: var(--v19-r-md); color: white; background-color: var(--v19-brand-900); background-size: cover; background-position: center; }
.hero-copy { width: 100%; padding: 54rpx 48rpx; position: relative; z-index: 1; }
.hero-eyebrow { color: var(--v19-gold-light); }
.hero-title { display: block; margin: 16rpx 0 20rpx; font-size: 62rpx; line-height: 1.28; font-weight: 600; letter-spacing: 2rpx; }
.hero-summary { display: block; max-width: 500rpx; color: rgba(255,255,255,.88); font-size: 28rpx; line-height: 44rpx; }
.hero-cta { min-height: 88rpx; margin-top: 36rpx; padding: 0 32rpx; display: flex; align-items: center; gap: 18rpx; border-radius: 16rpx; color: var(--v19-brand-900); background: var(--v19-paper-light); font-size: 26rpx; font-weight: 600; }
.quick-links { margin: 52rpx 40rpx 0; display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--v19-line); border-bottom: 1px solid var(--v19-line); }
.quick-links button { width: 100%; min-height: 112rpx; padding: 20rpx 24rpx; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; border-radius: 0; background: transparent; text-align: left; }
.quick-links button:nth-child(odd) { border-right: 1px solid var(--v19-line); }
.quick-links button:nth-child(-n+2) { border-bottom: 1px solid var(--v19-line); }
.quick-title { font-size: 26rpx; }
.quick-note { margin-top: 8rpx; color: var(--v19-muted); font-size: 22rpx; }
.section { padding: 72rpx 40rpx 0; }
.section-head { margin-bottom: 32rpx; display: flex; justify-content: space-between; align-items: flex-end; }
.section-title { display: block; margin-top: 6rpx; font-size: 42rpx; line-height: 58rpx; font-weight: 600; }
.more-link { min-height: 72rpx; display: flex; align-items: center; color: var(--v19-brand-900); font-size: 24rpx; }
.products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40rpx 24rpx; }
.preview-note { padding: 28rpx 40rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 32rpx; }
.bottom-safe-space { height: calc(38rpx + env(safe-area-inset-bottom)); }
.preview-toast { padding: 20rpx 28rpx; position: fixed; left: 50%; bottom: calc(112rpx + env(safe-area-inset-bottom)); z-index: 40; transform: translateX(-50%); border-radius: 12rpx; color: white; background: rgba(25,31,27,.86); font-size: 23rpx; white-space: nowrap; }
</style>
