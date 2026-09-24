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
      <template v-if="selected">
        <view class="story-hero-photo" :style="selected.coverUrl ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.65),rgba(18,29,23,.02)),url('${selected.coverUrl}')` } : undefined"><text>SHANHE STORIES</text></view>
        <text class="eyebrow">{{ selected.type }} · {{ selected.origin }}</text>
        <text class="story-title">{{ selected.title }}</text>
        <text class="story-copy">{{ selected.body || selected.summary }}</text>
      </template>
      <view v-else class="story-empty"><text class="empty-mark">禾</text><text class="story-section-title">新的山野手记正在路上</text><text class="story-row-copy">故事发布后，会在这里记录产地、时令与风物。</text></view>
      <view v-if="stories.length > 1" class="story-divider"></view>
      <template v-if="stories.length > 1"><text class="eyebrow">ALL STORIES</text><text class="story-section-title">继续往下看</text>
      <button v-for="story in stories" :key="story.id" class="story-row" :class="{ selected: selected?.id === story.id }" @tap="selectedId = story.id"><view class="story-photo" :style="story.coverUrl ? { backgroundImage: `linear-gradient(to top,rgba(18,29,23,.5),rgba(18,29,23,.05)),url('${story.coverUrl}')` } : undefined"><text>{{ story.type }} · {{ story.origin }}</text></view><view class="story-row-info"><text class="story-row-title">{{ story.title }}</text><text class="story-row-copy">{{ story.summary }}</text></view></button></template>
      <text class="preview-note">V19 联动演示内容 · 故事由后台内容管理发布</text>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.story-page { min-height: 100%; padding: 24rpx 40rpx 40rpx; background: var(--color-canvas); }
.subpage-header { min-height: 88rpx; margin-bottom: 24rpx; display: flex; align-items: center; gap: 18rpx; }
.back-button { min-width: 132rpx; min-height: 80rpx; margin: 0; padding: 0 14rpx; display: flex; align-items: center; justify-content: center; gap: 6rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); font-size: 23rpx; }
.back-button text:first-child { font-size: 38rpx; line-height: 1; }
.subpage-title { color: var(--color-text-primary); font-size: 28rpx; font-weight: 600; }
.story-hero-photo { height: 480rpx; margin-bottom: 34rpx; padding: 28rpx; display: flex; align-items: flex-end; border-radius: var(--radius-surface); color: white; background: linear-gradient(145deg,var(--v19-brand-700),var(--v19-brand-900)); background-position: center; background-size: cover; font-size: 20rpx; letter-spacing: 3rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; }
.story-title { display: block; max-width: 660rpx; margin: 12rpx 0; color: var(--color-text-primary); font-size: 44rpx; line-height: 1.3; font-weight: 600; }
.story-copy { display: block; max-width: 660rpx; color: var(--v19-ink-700); font-size: 26rpx; line-height: 1.7; white-space: pre-line; }
.story-divider { height: 1px; margin: 48rpx 0 30rpx; background: var(--color-border); }
.story-section-title { display: block; margin: 8rpx 0 24rpx; color: var(--color-text-primary); font-size: 34rpx; line-height: 1.4; font-weight: 600; }
.story-row { width: 100%; min-height: 204rpx; margin: 0; padding: 24rpx 0; display: grid; grid-template-columns: 220rpx minmax(0, 1fr); align-items: center; gap: 24rpx; border: 0; border-bottom: 1px solid var(--color-border); border-radius: 0; background: transparent; text-align: left; }
.story-row::after { border: 0; }
.story-row.selected .story-row-title { color: var(--color-brand); }
.story-row:active { opacity: .78; }
.story-photo { min-height: 176rpx; padding: 14rpx; display: flex; align-items: flex-end; border-radius: var(--radius-surface); color: white; background: linear-gradient(140deg,#ad9366,#52624b); background-position: center; background-size: cover; font-size: 18rpx; }
.story-photo text { padding: 6rpx 8rpx; border-radius: 3rpx; background: rgba(18,29,23,.56); }
.story-row-info { min-width: 0; }
.story-row-title { display: block; color: var(--color-text-primary); font-size: 26rpx; line-height: 1.4; font-weight: 600; }
.story-row-copy { display: block; margin-top: 10rpx; color: var(--color-text-secondary); font-size: 21rpx; line-height: 1.6; }
.story-empty { min-height: 400rpx; padding: 38rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); text-align: center; }
.empty-mark { width: 76rpx; height: 76rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); }
.preview-note { display: block; margin-top: 26rpx; color: var(--color-text-secondary); font-size: 20rpx; line-height: 1.6; }
.bottom-space { height: 30rpx; }
@media (prefers-reduced-motion: reduce) { .story-row { transition: none; } }
</style>
