<script setup lang="ts">
const stories = [
  { title: '舟曲，山谷与白龙江', kicker: '产地 · 舟曲', copy: '先认识一片土地，再认识它的味道。白龙江穿过山谷，昼夜温差与山地气候，孕育出舟曲吊柿的风味。' },
  { title: '一枚吊柿的慢晒时光', kicker: '工艺 · 慢晒', copy: '从鲜果挑选、削皮整理，到悬挂风干、回软与自然挂霜，时间让果香慢慢沉淀。' }
];
</script>

<template>
  <view class="story-page">
    <view class="story-hero-photo"><text>SHANHE STORIES</text></view>
    <text class="eyebrow">{{ stories[0]?.kicker }}</text>
    <text class="story-title">{{ stories[0]?.title }}</text>
    <text class="story-copy">{{ stories[0]?.copy }}</text>
    <view class="story-divider"></view>
    <text class="eyebrow">ALL STORIES</text><text class="story-section-title">继续往下看</text>
    <view v-for="story in stories" :key="story.title" class="story-row"><view class="story-photo"><text>{{ story.kicker }}</text></view><view><text class="story-row-title">{{ story.title }}</text><text class="story-row-copy">{{ story.copy }}</text></view></view>
    <text class="preview-note">内容为 V19 页面结构示例，正式内容将由内容管理模块提供。</text>
  </view>
</template>

<style scoped>
.story-page { min-height: 100vh; padding: 40rpx; background: var(--v19-canvas); }
.story-hero-photo { height: 480rpx; margin-bottom: 34rpx; padding: 28rpx; display: flex; align-items: flex-end; border-radius: 14rpx; color: white; background: linear-gradient(145deg,#89937c,#465d4a 58%,#1f382c); font-size: 20rpx; letter-spacing: 3rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.story-title { display: block; margin: 12rpx 0; font-size: 44rpx; font-weight: 600; }
.story-copy { display: block; color: var(--v19-ink-700); font-size: 26rpx; line-height: 44rpx; }
.story-divider { height: 1px; margin: 48rpx 0 30rpx; background: var(--v19-line-strong); }
.story-section-title { display: block; margin: 8rpx 0 24rpx; font-size: 35rpx; font-weight: 600; }
.story-row { padding: 26rpx 0; display: grid; grid-template-columns: 200rpx 1fr; gap: 24rpx; border-bottom: 1px solid var(--v19-line); }
.story-photo { min-height: 180rpx; padding: 14rpx; display: flex; align-items: flex-end; border-radius: 10rpx; color: white; background: linear-gradient(140deg,#ad9366,#52624b); font-size: 18rpx; }
.story-row-title { display: block; font-size: 26rpx; font-weight: 600; }
.story-row-copy { display: block; margin-top: 10rpx; color: var(--v19-muted); font-size: 21rpx; line-height: 34rpx; }
.preview-note { display: block; margin-top: 26rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 32rpx; }
</style>
