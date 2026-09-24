<script setup lang="ts">
import { ref } from 'vue';
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import { resolvePublicMediaUrl } from '../../src/public-media-url.js';

const heroImage = resolvePublicMediaUrl(import.meta.env.VITE_HOME_HERO_OBJECT_KEY);
const internalTest = import.meta.env.VITE_INTERNAL_TEST === 'true';
const previewToast = ref('');
onShareAppMessage(() => ({ title: '山禾颐品 · 来自舟曲的山野风物', path: '/pages/home/index' }));

function openCategoryGift() {
  uni.setStorageSync('v19-category', 'gift');
  uni.switchTab({ url: '/pages/category/index' });
}

function openSelection() {
  uni.switchTab({ url: '/pages/selection/index' });
}

function openStories() {
  uni.navigateTo({ url: '/pages/story/index' });
}

function openAllCategories() {
  uni.switchTab({ url: '/pages/category/index' });
}

function showPreviewNotice() {
  previewToast.value = '搜索页面尚未开放';
  setTimeout(() => { previewToast.value = ''; }, 2200);
}

onShow(() => {
  // #ifdef H5
  document.body.classList.remove('v19-admin-preview');
  // #endif
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

      <view class="hero" :style="heroImage ? { backgroundImage: `url(${heroImage})` } : {}">
        <view class="hero-copy">
          <text class="eyebrow hero-eyebrow">舟曲 · 白龙江畔</text>
          <text class="hero-title">山河有味<br />一口知秋</text>
          <text class="hero-summary">自然慢晒，把西北的甜认真带给你。</text>
          <button class="hero-cta" @tap="openAllCategories">探索山野风物 <text>→</text></button>
        </view>
      </view>

      <view class="quick-links">
        <button @tap="openCategoryGift"><text class="quick-title">礼盒精选</text><text class="quick-note">节令与赠礼</text></button>
        <button disabled><text class="quick-title">扫码溯源</text><text class="quick-note">批次服务待接入</text></button>
        <button @tap="openStories"><text class="quick-title">山野故事</text><text class="quick-note">阅读山野志</text></button>
        <button @tap="openSelection"><text class="quick-title">本季甄选</text><text class="quick-note">内容服务待接入</text></button>
      </view>

      <view v-if="internalTest" class="preview-note">内部测试 · 图片为 AI 生成示意，暂不开放交易</view>
      <view class="bottom-safe-space"></view>
    </scroll-view>

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
.preview-note { padding: 28rpx 40rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 32rpx; }
.bottom-safe-space { height: calc(38rpx + env(safe-area-inset-bottom)); }
.preview-toast { padding: 20rpx 28rpx; position: fixed; left: 50%; bottom: calc(112rpx + env(safe-area-inset-bottom)); z-index: 40; transform: translateX(-50%); border-radius: 12rpx; color: white; background: rgba(25,31,27,.86); font-size: 23rpx; white-space: nowrap; }
</style>
