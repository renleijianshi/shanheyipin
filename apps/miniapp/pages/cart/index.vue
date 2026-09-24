<script setup lang="ts">
function browseProducts() { uni.switchTab({ url: '/pages/category/index' }); }
</script>

<template>
  <scroll-view scroll-y class="tab-page-scroll">
    <view class="page-shell">
      <view class="page-heading"><text class="eyebrow">YOUR SELECTION</text><text class="page-title">购物车</text></view>
      <view class="unavailable-state" role="status">
        <text class="empty-mark">禾</text>
        <text class="empty-title">购物车服务尚未接入</text>
        <text class="empty-copy">加入商品、核验库存与结算将在服务端完成。在此之前暂不保存购物车或接受下单。</text>
        <button @tap="browseProducts">浏览已上架商品</button>
      </view>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.page-shell { min-height: 100%; padding: 40rpx; background: var(--color-canvas); }
.page-heading { padding: 20rpx 0 30rpx; border-bottom: 1px solid var(--color-border); }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; }
.page-title { display: block; margin-top: var(--space-1); color: var(--color-text-primary); font-size: 48rpx; font-weight: 600; }
.unavailable-state { min-height: 62vh; padding: 30rpx 10rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-mark { width: 100rpx; height: 100rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-size: 42rpx; }
.empty-title { margin-top: 25rpx; color: var(--color-text-primary); font-size: 29rpx; line-height: 1.45; font-weight: 600; }
.empty-copy { max-width: 550rpx; margin-top: 11rpx; color: var(--color-text-secondary); font-size: 21rpx; line-height: 1.7; }
.unavailable-state button { min-height: 82rpx; margin-top: 28rpx; padding: 0 30rpx; border-radius: var(--radius-control); color: white; background: var(--color-brand); font-size: 23rpx; }
.bottom-space { height: 36rpx; }
</style>
