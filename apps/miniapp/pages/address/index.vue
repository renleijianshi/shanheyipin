<script setup lang="ts">
function goBack() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/profile/index' }) }); }
</script>

<template>
  <scroll-view scroll-y class="subpage-scroll">
    <view class="address-page">
      <view class="address-header"><button class="back-button" @tap="goBack"><text>‹</text><text>返回</text></button><text class="page-title">收货地址</text></view>
      <view class="address-status" role="status">
        <view class="status-mark">⌖</view>
        <text class="status-title">地址服务尚未接入</text>
        <text class="status-copy">登录与收货地址接口完成后，可以在这里管理并同步配送地址。目前不会将个人信息仅保存在这台设备上。</text>
        <button disabled>暂不可新增地址</button>
      </view>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.address-page { min-height: 100%; padding: 22rpx 34rpx 40rpx; background: var(--color-canvas); }
.address-header { min-height: 84rpx; margin-bottom: 22rpx; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.back-button { min-width: 112rpx; min-height: 84rpx; margin: 0; padding: 0 13rpx; display: flex; align-items: center; gap: 6rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); font-size: 22rpx; }
.back-button text:first-child { font-size: 36rpx; line-height: 1; }
.page-title { color: var(--color-text-primary); font-size: 34rpx; font-weight: 600; }
.address-status { min-height: 58vh; padding: 30rpx 24rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); text-align: center; }
.status-mark { width: 90rpx; height: 90rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-size: 42rpx; }
.status-title { margin-top: 24rpx; color: var(--color-text-primary); font-size: 28rpx; font-weight: 600; }
.status-copy { max-width: 560rpx; margin-top: 10rpx; color: var(--color-text-secondary); font-size: 21rpx; line-height: 1.7; }
.address-status button { min-width: 270rpx; min-height: 80rpx; margin-top: 27rpx; border-radius: var(--radius-control); color: #69716c; background: #e7e6df; font-size: 22rpx; }
.address-status button[disabled] { opacity: 1; }
.bottom-space { height: 34rpx; }
</style>
