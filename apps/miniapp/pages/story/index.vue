<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { readV19Content, type V19Story } from '../../src/v19-content-store.js';
const stories = ref<V19Story[]>([]);
const selectedId = ref('');
const selected = computed(() => stories.value.find(story => story.id === selectedId.value) ?? stories.value[0]);
function goBack() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/home/index' }) }); }
onShow(() => {
  stories.value = readV19Content().stories.filter(story => story.status === '发布');
  selectedId.value = uni.getStorageSync('v19-story') || stories.value[0]?.id || '';
  uni.removeStorageSync('v19-story');
});
</script>

<template>
  <scroll-view scroll-y class="subpage-scroll">
    <view class="story-page">
      <view class="subpage-header"><button class="back-button" @tap="goBack"><text>‹</text><text>返回</text></button><text class="subpage-title">山野故事</text></view>
      <view class="story-hero-photo" :style="selected?.coverUrl ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.65),rgba(18,29,23,.02)),url('${selected.coverUrl}')` } : undefined"><text>SHANHE STORIES</text></view>
      <text class="eyebrow">{{ selected?.type }} · {{ selected?.origin }}</text>
      <text class="story-title">{{ selected?.title || '山野故事' }}</text>
      <text class="story-copy">{{ selected?.body || selected?.summary || '故事内容由后台发布。' }}</text>
      <view class="story-divider"></view>
      <text class="eyebrow">ALL STORIES</text><text class="story-section-title">继续往下看</text>
      <button v-for="story in stories" :key="story.id" class="story-row" @tap="selectedId = story.id"><view class="story-photo" :style="story.coverUrl ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.5),rgba(18,29,23,.05)),url('${story.coverUrl}')` } : undefined"><text>{{ story.type }} · {{ story.origin }}</text></view><view><text class="story-row-title">{{ story.title }}</text><text class="story-row-copy">{{ story.summary }}</text></view></button>
      <text class="preview-note">V19 联动演示内容 · 故事由后台内容管理发布</text>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.story-page { min-height: 100%; padding: 24rpx 40rpx 40rpx; background: var(--v19-canvas); }
.subpage-header { min-height: 82rpx; margin-bottom: 24rpx; display: flex; align-items: center; gap: 18rpx; }
.back-button { min-width: 118rpx; height: 68rpx; padding: 0 14rpx; display: flex; align-items: center; gap: 6rpx; border: 1px solid var(--v19-line); border-radius: 12rpx; color: var(--v19-brand-900); background: var(--v19-paper-light); font-size: 23rpx; }
.back-button text:first-child { font-size: 38rpx; line-height: 1; }
.subpage-title { color: var(--v19-ink); font-size: 28rpx; font-weight: 600; }
.story-hero-photo { height: 480rpx; margin-bottom: 34rpx; padding: 28rpx; display: flex; align-items: flex-end; border-radius: 14rpx; color: white; background: linear-gradient(145deg,var(--v19-brand-700),var(--v19-brand-900)); background-position: center; background-size: cover; font-size: 20rpx; letter-spacing: 3rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.story-title { display: block; margin: 12rpx 0; font-size: 44rpx; font-weight: 600; }
.story-copy { display: block; color: var(--v19-ink-700); font-size: 26rpx; line-height: 44rpx; }
.story-divider { height: 1px; margin: 48rpx 0 30rpx; background: var(--v19-line-strong); }
.story-section-title { display: block; margin: 8rpx 0 24rpx; font-size: 35rpx; font-weight: 600; }
.story-row { width: 100%; padding: 26rpx 0; display: grid; grid-template-columns: 200rpx 1fr; gap: 24rpx; border-bottom: 1px solid var(--v19-line); background: transparent; text-align: left; }
.story-photo { min-height: 180rpx; padding: 14rpx; display: flex; align-items: flex-end; border-radius: 10rpx; color: white; background: linear-gradient(140deg,#ad9366,#52624b); font-size: 18rpx; }
.story-row-title { display: block; font-size: 26rpx; font-weight: 600; }
.story-row-copy { display: block; margin-top: 10rpx; color: var(--v19-muted); font-size: 21rpx; line-height: 34rpx; }
.preview-note { display: block; margin-top: 26rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 32rpx; }
.bottom-space { height: 30rpx; }
</style>
