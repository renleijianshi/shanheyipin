<script setup lang="ts">
function goBack() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/home/index' }) }); }
</script>

<template>
  <scroll-view scroll-y class="subpage-scroll">
    <view class="trace-page">
      <view class="subpage-header"><button class="back-button" @tap="goBack"><text>‹</text><text>返回</text></button><text class="subpage-title">扫码溯源</text></view>
      <view class="trace-mark">溯</view>
      <text class="eyebrow">TRACEABILITY</text>
      <text class="trace-title">让每一份风物，都有清晰来处。</text>
      <text class="trace-copy">正式溯源将读取真实批次、供应商、收货和质检记录。当前溯源查询尚未接入，暂时无法验证包装上的二维码。</text>
      <view class="trace-status" role="status"><text class="status-mark">i</text><view><text class="status-title">溯源服务尚未开放</text><text class="status-copy">当前不会展示演示批次或虚构质检信息。</text></view></view>
      <button class="scan-button" disabled>暂不可查询</button>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.trace-page { min-height: 100%; padding: 24rpx 44rpx 40rpx; background: var(--color-canvas); }
.subpage-header { min-height: 88rpx; margin: 0 0 46rpx -4rpx; display: flex; align-items: center; gap: 18rpx; }
.back-button { min-width: 132rpx; min-height: 80rpx; margin: 0; padding: 0 14rpx; display: flex; align-items: center; justify-content: center; gap: 6rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); font-size: 23rpx; }
.back-button text:first-child { font-size: 38rpx; line-height: 1; }
.subpage-title { color: var(--color-text-primary); font-size: 28rpx; font-weight: 600; }
.trace-mark { width: 112rpx; height: 112rpx; margin: 0 auto 28rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-size: 48rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; text-align: center; }
.trace-title { display: block; margin: 18rpx 0 14rpx; color: var(--color-text-primary); font-size: 37rpx; line-height: 1.4; font-weight: 600; text-align: center; }
.trace-copy { display: block; color: var(--color-text-secondary); font-size: 23rpx; line-height: 1.7; text-align: center; }
.trace-status { margin-top: 38rpx; padding: 20rpx; display: flex; align-items: flex-start; gap: 14rpx; border: 1px solid var(--color-border); border-radius: var(--radius-feature); background: var(--color-surface); }
.status-mark { width: 32rpx; height: 32rpx; flex: none; display: grid; place-items: center; border-radius: 50%; color: var(--color-brand); background: var(--color-brand-soft); font-size: 18rpx; }
.status-title, .status-copy { display: block; }
.status-title { color: var(--color-text-primary); font-size: 22rpx; font-weight: 600; }
.status-copy { margin-top: 6rpx; color: var(--color-text-secondary); font-size: 19rpx; line-height: 1.5; }
.scan-button { width: 100%; min-height: 92rpx; margin-top: 24rpx; border-radius: var(--radius-control); color: #69716c; background: #e7e6df; font-size: 26rpx; font-weight: 600; }
.scan-button[disabled] { opacity: 1; }
.bottom-space { height: 30rpx; }
</style>
