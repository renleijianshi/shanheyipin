<script setup lang="ts">
function goBack() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/home/index' }) }); }
</script>

<template>
  <scroll-view scroll-y class="subpage-scroll">
    <view class="story-page">
      <view class="subpage-header"><button class="back-button" @tap="goBack"><text>‹</text><text>返回</text></button><text class="subpage-title">山野故事</text></view>
      <view class="story-mark">禾</view>
      <text class="eyebrow">SHANHE STORIES</text>
      <text class="story-title">把土地与风物，慢慢讲给你听。</text>
      <view class="story-empty" role="status">
        <text class="empty-title">故事内容服务尚未接入</text>
        <text class="empty-copy">已发布的产地与工艺内容将在这里展示。目前没有可读取的故事记录。</text>
      </view>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.story-page { min-height: 100%; padding: 24rpx 40rpx 40rpx; background: var(--color-canvas); }
.subpage-header { min-height: 88rpx; margin-bottom: 42rpx; display: flex; align-items: center; gap: 18rpx; }
.back-button { min-width: 132rpx; min-height: 80rpx; margin: 0; padding: 0 14rpx; display: flex; align-items: center; justify-content: center; gap: 6rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); font-size: 23rpx; }
.back-button text:first-child { font-size: 38rpx; line-height: 1; }
.subpage-title { color: var(--color-text-primary); font-size: 28rpx; font-weight: 600; }
.story-mark { width: 94rpx; height: 94rpx; margin-bottom: 24rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-family: STSong, "Songti SC", serif; font-size: 40rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; }
.story-title { display: block; max-width: 660rpx; margin: 12rpx 0 30rpx; color: var(--color-text-primary); font-size: 42rpx; line-height: 1.4; font-weight: 600; }
.story-empty { min-height: 250rpx; padding: 30rpx 0; display: flex; flex-direction: column; justify-content: center; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.empty-title { color: var(--color-text-primary); font-size: 27rpx; font-weight: 600; }
.empty-copy { max-width: 600rpx; margin-top: 12rpx; color: var(--color-text-secondary); font-size: 22rpx; line-height: 1.7; }
.bottom-space { height: 30rpx; }
</style>
