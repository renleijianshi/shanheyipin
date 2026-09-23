<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import ProductTile from '../../components/ProductTile.vue';
import { addV19CartItem, readV19Content, storefrontProducts } from '../../src/v19-content-store.js';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

const selectedProduct = ref<StorefrontProductSummary | null>(null);
const previewToast = ref('');
const products = ref(storefrontProducts());
const homeImages = ref(readV19Content().homeImages);
const homeProducts = computed(() => products.value.slice(0, 2).map((product, index) => ({ ...product, coverObjectKey: product.coverObjectKey || (index === 0 ? homeImages.value.persimmon : homeImages.value.gift) })));

onShareAppMessage(() => ({ title: '山禾颐品 · 来自舟曲的山野风物', path: '/pages/home/index' }));

function openAdminPreview() {
  uni.navigateTo({ url: '/pages/admin-preview/index' });
}

function openCategoryGift() {
  uni.setStorageSync('v19-category', 'gift');
  uni.switchTab({ url: '/pages/category/index' });
}

function openStory() {
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
onShow(() => { products.value = storefrontProducts(); homeImages.value = readV19Content().homeImages; });
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
        <button class="icon-btn" aria-label="搜索" @tap="showPreviewNotice">⌕</button>
      </view>

      <button class="admin-test-entry" @tap="openAdminPreview">
        <text>测试：进入后台预览</text><text class="entry-arrow">↗</text>
      </button>

      <view class="hero" :style="homeImages.hero ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.76),rgba(18,29,23,.08)),url('${homeImages.hero}')` } : undefined">
        <view class="hero-landscape" aria-hidden="true"><view class="ridge ridge-back"></view><view class="ridge ridge-front"></view><view class="persimmon-orb"></view></view>
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
        <button @tap="openStory"><text class="quick-title">山野故事</text><text class="quick-note">人、地与风物</text></button>
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

      <button class="editorial-link" @tap="openStory">
        <view class="editorial-photo"><text>白龙江畔 · 舟曲</text></view>
        <text class="editorial-title">舟曲，山谷与白龙江</text>
        <text class="editorial-copy">先认识一片土地，再认识它的味道。</text>
        <text class="editorial-action">阅读山野故事 →</text>
      </button>

      <view class="preview-note">本机 V19 演示内容 · 正式商品目录、API 与授权素材待接入</view>
      <view class="bottom-safe-space"></view>
    </scroll-view>

    <view v-if="selectedProduct" class="sheet-mask" @tap="selectedProduct = null">
      <view class="product-sheet" @tap.stop>
        <button class="sheet-close" aria-label="关闭" @tap="selectedProduct = null">×</button>
        <view class="sheet-image"><text>山禾颐品</text></view>
        <text class="eyebrow">SHANHE PRODUCT</text>
        <text class="sheet-title">{{ selectedProduct.name }}</text>
        <text class="sheet-description">{{ selectedProduct.subtitle }}</text>
        <view class="sheet-meta"><text>产地</text><text>甘肃 · 舟曲</text></view>
        <view class="sheet-meta"><text>详情</text><text>将从正式商品资料读取</text></view>
        <button class="sheet-action" @tap="addProductToCart">加入购物车</button>
      </view>
    </view>
    <view v-if="previewToast" class="preview-toast">{{ previewToast }}</view>
  </view>
</template>

<style scoped>
.storefront-preview { width: 100%; max-width: 750rpx; min-height: 100vh; margin: 0 auto; overflow: hidden; background: var(--v19-canvas); }
.home-scroll { height: 100vh; }
.mini-head { min-height: 126rpx; padding: 38rpx 40rpx 24rpx; display: flex; align-items: center; justify-content: space-between; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; line-height: 32rpx; letter-spacing: 3rpx; }
.brand-name { display: block; margin-top: 8rpx; font-size: 50rpx; line-height: 66rpx; font-weight: 600; letter-spacing: 2rpx; }
.icon-btn { width: 88rpx; height: 88rpx; display: grid; place-items: center; border: 1px solid var(--v19-line); border-radius: 18rpx; font-size: 42rpx; }
.admin-test-entry { min-height: 68rpx; margin: 0 40rpx 18rpx; padding: 0 22rpx; display: flex; justify-content: space-between; align-items: center; border-radius: 10rpx; color: #fff; background: var(--v19-orange); font-size: 24rpx; font-weight: 600; }
.entry-arrow { font-size: 34rpx; }
.hero { height: 780rpx; margin: 0 40rpx; position: relative; overflow: hidden; display: flex; align-items: flex-end; border-radius: var(--v19-r-md); color: white; background: linear-gradient(160deg,#7a8062 0%,#435949 42%,#18362b 100%); }
.hero-landscape { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(ellipse at 78% 31%,rgba(222,173,111,.68),transparent 18%),linear-gradient(to top,rgba(18,29,23,.82),rgba(18,29,23,.08) 72%); }
.ridge { position: absolute; width: 900rpx; height: 470rpx; bottom: 100rpx; border-radius: 50% 50% 0 0; transform: rotate(-14deg); }
.ridge-back { left: -210rpx; bottom: 210rpx; background: linear-gradient(160deg,#839078,#425b48); }
.ridge-front { right: -300rpx; bottom: 70rpx; background: linear-gradient(155deg,#586d50,#1f3a2d); }
.persimmon-orb { width: 150rpx; height: 150rpx; position: absolute; top: 245rpx; right: 120rpx; border-radius: 50%; background: radial-gradient(circle at 34% 31%,#f3b66b,#ca642e 72%); box-shadow: 0 24rpx 64rpx rgba(19,28,20,.22); }
.hero-copy { width: 100%; padding: 54rpx 48rpx; position: relative; z-index: 1; }
.hero-eyebrow { color: #f0d7b7; }
.hero-title { display: block; margin: 16rpx 0 20rpx; font-size: 62rpx; line-height: 1.28; font-weight: 600; letter-spacing: 2rpx; }
.hero-summary { display: block; max-width: 500rpx; color: rgba(255,255,255,.88); font-size: 28rpx; line-height: 44rpx; }
.hero-cta { min-height: 88rpx; margin-top: 36rpx; padding: 0 32rpx; display: flex; align-items: center; gap: 18rpx; border-radius: 16rpx; color: var(--v19-brand-900); background: var(--v19-paper-light); font-size: 26rpx; font-weight: 600; }
.quick-links { margin: 52rpx 40rpx 0; display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--v19-line); border-bottom: 1px solid var(--v19-line); }
.quick-links button { min-height: 112rpx; padding: 20rpx 24rpx; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; text-align: left; }
.quick-links button:nth-child(odd) { border-right: 1px solid var(--v19-line); }
.quick-links button:nth-child(-n+2) { border-bottom: 1px solid var(--v19-line); }
.quick-title { font-size: 26rpx; }
.quick-note { margin-top: 8rpx; color: var(--v19-muted); font-size: 22rpx; }
.section { padding: 72rpx 40rpx 0; }
.section-head { margin-bottom: 32rpx; display: flex; justify-content: space-between; align-items: flex-end; }
.section-title { display: block; margin-top: 6rpx; font-size: 42rpx; line-height: 58rpx; font-weight: 600; }
.more-link { min-height: 72rpx; display: flex; align-items: center; color: var(--v19-brand-900); font-size: 24rpx; }
.products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40rpx 24rpx; }
.editorial-link { margin: 82rpx 40rpx 18rpx; padding: 36rpx 0 0; display: flex; flex-direction: column; align-items: stretch; border-top: 1px solid var(--v19-line); text-align: left; }
.editorial-photo { height: 320rpx; padding: 24rpx; display: flex; align-items: flex-end; border-radius: var(--v19-r-sm); color: var(--v19-paper-light); background: linear-gradient(160deg,#879078,#3f5544 58%,#253c30); font-size: 22rpx; letter-spacing: 2rpx; }
.editorial-title { margin-top: 26rpx; font-size: 42rpx; font-weight: 600; }
.editorial-copy { margin-top: 12rpx; color: var(--v19-ink-700); font-size: 27rpx; line-height: 42rpx; }
.editorial-action { min-height: 76rpx; display: flex; align-items: center; color: var(--v19-brand-900); font-size: 24rpx; font-weight: 600; }
.preview-note { padding: 28rpx 40rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 32rpx; }
.bottom-safe-space { height: calc(38rpx + env(safe-area-inset-bottom)); }
.sheet-mask { position: fixed; inset: 0; z-index: 30; display: flex; align-items: flex-end; background: rgba(24,28,25,.44); }
.product-sheet { width: 100%; max-width: 750rpx; max-height: 82vh; margin: 0 auto; padding: 38rpx 40rpx calc(30rpx + env(safe-area-inset-bottom)); position: relative; overflow-y: auto; border-radius: 28rpx 28rpx 0 0; background: var(--v19-paper-light); }
.sheet-close { position: absolute; top: 22rpx; right: 26rpx; font-size: 48rpx; }
.sheet-image { height: 340rpx; margin-bottom: 26rpx; display: grid; place-items: center; border-radius: 14rpx; color: white; background: linear-gradient(145deg,#785b41,#3c4f3e); font-size: 30rpx; letter-spacing: 5rpx; }
.sheet-title { display: block; margin-top: 14rpx; font-size: 38rpx; font-weight: 600; }
.sheet-description { display: block; margin-top: 12rpx; color: var(--v19-muted); font-size: 25rpx; }
.sheet-meta { min-height: 72rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--v19-line); font-size: 24rpx; }
.sheet-meta text:first-child { color: var(--v19-muted); }
.sheet-action { width: 100%; min-height: 86rpx; margin-top: 32rpx; border-radius: 12rpx; color: white; background: var(--v19-brand-900); font-size: 27rpx; }
.preview-toast { padding: 20rpx 28rpx; position: fixed; left: 50%; bottom: calc(112rpx + env(safe-area-inset-bottom)); z-index: 40; transform: translateX(-50%); border-radius: 12rpx; color: white; background: rgba(25,31,27,.86); font-size: 23rpx; white-space: nowrap; }
</style>
