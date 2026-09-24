<script setup lang="ts">
function browseProducts() {
  uni.switchTab({ url: '/pages/category/index' });
}
</script>

<template>
  <scroll-view scroll-y class="tab-page-scroll">
    <view class="page-shell">
      <view class="selection-top"><text class="eyebrow">SHANHE SELECTION</text><text class="page-title">山禾甄选</text></view>
      <view class="selection-intro">
        <text class="eyebrow">FROM LAND TO TABLE</text>
        <text class="selection-title">每一份甄选，都从真实来处开始。</text>
        <text class="selection-body">甄选内容发布后，我们会在这里介绍风物的产地、风味与入选理由。</text>
      </view>
      <view class="selection-unavailable" role="status">
        <text class="empty-mark">禾</text>
        <text class="empty-title">甄选内容服务尚未接入</text>
        <text class="empty-copy">目前还没有可供展示的已发布甄选内容。你可以先浏览后台已上架的商品。</text>
        <button class="browse-button" @tap="browseProducts">浏览已上架商品 <text>→</text></button>
      </view>
    </view>
  </scroll-view>
</template>

<style scoped>
.page-shell { min-height: 100%; padding: 36rpx 40rpx 60rpx; background: var(--color-canvas); }
.selection-top { padding: 18rpx 0 30rpx; border-bottom: 1px solid var(--color-border); }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); line-height: 1.5; letter-spacing: 3rpx; }
.page-title { display: block; margin-top: 8rpx; color: var(--color-text-primary); font-size: 48rpx; line-height: 1.35; font-weight: 600; }
.selection-intro { max-width: 670rpx; padding: 36rpx 0 28rpx; }
.selection-title { display: block; margin: 12rpx 0; color: var(--color-text-primary); font-size: 38rpx; line-height: 1.4; font-weight: 600; }
.selection-body { display: block; color: var(--v19-ink-700); font-size: 24rpx; line-height: 1.65; }
.selection-unavailable { min-height: 390rpx; margin-top: 8rpx; padding: 38rpx 28rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); text-align: center; }
.empty-mark { width: 76rpx; height: 76rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); font-size: 32rpx; }
.empty-title { margin-top: 20rpx; color: var(--color-text-primary); font-size: var(--type-title); line-height: 1.45; font-weight: 600; }
.empty-copy { max-width: 550rpx; margin-top: 10rpx; color: var(--color-text-secondary); font-size: var(--type-caption); line-height: 1.65; }
.browse-button { min-height: 76rpx; margin-top: 26rpx; padding: 0 24rpx; display: flex; align-items: center; gap: 12rpx; border-radius: var(--radius-control); color: white; background: var(--color-brand); font-size: 22rpx; }
@media (prefers-reduced-motion: reduce) { .browse-button { transition: none; } }
</style>
