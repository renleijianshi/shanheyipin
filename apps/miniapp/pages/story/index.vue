<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { readV19Content, type V19Story } from '../../src/v19-content-store.js';
const stories = ref<V19Story[]>([]);
onShow(() => { stories.value = readV19Content().stories.filter(story => story.status === '发布'); });
</script>

<template>
  <view class="story-page">
    <view class="story-hero-photo" :style="stories[0]?.coverUrl ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.65),rgba(18,29,23,.02)),url('${stories[0].coverUrl}')` } : undefined"><text>SHANHE STORIES</text></view>
    <text class="eyebrow">{{ stories[0]?.type }} · {{ stories[0]?.origin }}</text>
    <text class="story-title">{{ stories[0]?.title || '山野故事' }}</text>
    <text class="story-copy">{{ stories[0]?.body || stories[0]?.summary || '故事内容由后台发布。' }}</text>
    <view class="story-divider"></view>
    <text class="eyebrow">ALL STORIES</text><text class="story-section-title">继续往下看</text>
    <view v-for="story in stories" :key="story.id" class="story-row"><view class="story-photo" :style="story.coverUrl ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.5),rgba(18,29,23,.05)),url('${story.coverUrl}')` } : undefined"><text>{{ story.type }} · {{ story.origin }}</text></view><view><text class="story-row-title">{{ story.title }}</text><text class="story-row-copy">{{ story.summary }}</text></view></view>
    <text class="preview-note">V19 联动演示内容 · 故事由后台内容管理发布</text>
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
