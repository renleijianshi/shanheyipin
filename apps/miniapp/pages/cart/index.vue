<script setup lang="ts">
function continueShopping() {
  uni.switchTab({ url: '/pages/category/index' });
}
</script>

<template>
  <view class="page-shell">
    <view class="page-heading"><text class="eyebrow">YOUR SELECTION</text><text class="page-title">购物车</text></view>
    <view class="empty-cart"><text class="empty-mark">禾</text><text class="empty-title">购物车功能准备中</text><text class="empty-copy">页面视觉已按 V19 接入，正式购物车数据会通过 CartPort 连接。</text><button @tap="continueShopping">先逛逛商品</button></view>
    <view class="preview-note">当前页面不保存或提交真实订单。</view>
  </view>
</template>

<style scoped>
.page-shell { min-height: 100vh; padding: 40rpx; background: var(--v19-canvas); }
.page-heading { padding: 20rpx 0 30rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.page-title { display: block; margin-top: 8rpx; font-size: 48rpx; font-weight: 600; }
.empty-cart { min-height: 62vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-mark { width: 108rpx; height: 108rpx; display: grid; place-items: center; border: 1px solid var(--v19-line-strong); border-radius: 50%; color: var(--v19-brand-900); font-size: 44rpx; }
.empty-title { margin-top: 28rpx; font-size: 32rpx; font-weight: 600; }
.empty-copy { max-width: 560rpx; margin-top: 14rpx; color: var(--v19-muted); font-size: 23rpx; line-height: 38rpx; }
.empty-cart button { min-height: 82rpx; margin-top: 34rpx; padding: 0 34rpx; border-radius: 12rpx; color: #fff; background: var(--v19-brand-900); font-size: 25rpx; }
.preview-note { color: var(--v19-muted); font-size: 20rpx; }
</style>
