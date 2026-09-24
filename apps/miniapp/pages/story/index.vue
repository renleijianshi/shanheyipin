<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { createPublicContentPort } from '../../src/public-content-port.js';
import { resolvePublicMediaUrl } from '../../src/public-media-url.js';
import type { StoryDetail, StorySummary } from '../../src/v12-ports.js';

const content = createPublicContentPort();
const internalTest = import.meta.env.VITE_INTERNAL_TEST === 'true';
const stories = ref<readonly StorySummary[]>([]);
const loading = ref(true);
const error = ref('');
const detail = ref<StoryDetail | null>(null);
const detailLoading = ref(false);
const detailError = ref('');
let detailRequest = 0;

async function refreshStories() {
  loading.value = true; error.value = '';
  try { stories.value = await content.listStories(); }
  catch (reason) { stories.value = []; error.value = reason instanceof Error ? reason.message : '山野故事暂时无法读取，请稍后重试'; }
  finally { loading.value = false; }
}
async function openStory(story: StorySummary) {
  const request = ++detailRequest;
  detail.value = null; detailError.value = ''; detailLoading.value = true;
  try { const result = await content.getStory(story.id); if (request === detailRequest) detail.value = result; }
  catch (reason) { if (request === detailRequest) detailError.value = reason instanceof Error ? reason.message : '文章暂时无法读取'; }
  finally { if (request === detailRequest) detailLoading.value = false; }
}
function closeStory() { detailRequest++; detail.value = null; detailError.value = ''; detailLoading.value = false; }
function imageUrl(key: string | null) { return resolvePublicMediaUrl(key) || (key && /^products\/[A-Za-z0-9/_-]+\.(?:png|jpe?g|webp|avif)$/.test(key) ? `/media/${key}` : ''); }
function typeName(type: StorySummary['contentType']) {
  return ({ ORIGIN: '产地风物', CRAFT: '工艺介绍', PEOPLE: '人物', PRODUCT_KNOWLEDGE: '产品知识', USAGE: '食用方法', STORAGE: '保存方法', BRAND: '品牌故事', GIFTING: '节令送礼' })[type];
}
function goBack() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/home/index' }) }); }

onShow(() => { void refreshStories(); });
</script>

<template>
  <scroll-view scroll-y class="subpage-scroll">
      <view class="story-page">
        <view v-if="detail || detailLoading || detailError" class="story-article-view">
          <view class="subpage-header"><button class="back-button" @tap="closeStory"><text>‹</text><text>故事列表</text></button><text class="subpage-title">山野志</text></view>
          <view v-if="detailLoading" class="story-state" role="status"><text class="state-mark">禾</text><text class="empty-title">正在读取文章</text></view>
          <view v-else-if="detailError" class="story-state story-error" role="alert"><text class="empty-title">暂时无法读取</text><text class="empty-copy">{{ detailError }}</text></view>
          <view v-else-if="detail" class="story-article">
            <image v-if="imageUrl(detail.coverObjectKey)" class="article-cover" :src="imageUrl(detail.coverObjectKey)" :alt="detail.title" mode="widthFix" />
            <view v-if="internalTest" class="internal-story-note">内部测试内容 · 封面为 AI 生成示意图，不代表授权实拍</view>
            <text class="article-type">{{ typeName(detail.contentType) }}</text>
            <text class="article-title">{{ detail.title }}</text>
            <text class="article-summary">{{ detail.summary }}</text>
            <text class="article-body">{{ detail.body }}</text>
            <view v-if="detail.relatedProduct" class="related-product"><text class="related-caption">相关商品</text><text class="related-name">{{ detail.relatedProduct.name }}</text></view>
          </view>
        </view>
        <template v-else>
        <view class="subpage-header"><button class="back-button" @tap="goBack"><text>‹</text><text>返回</text></button><text class="subpage-title">山野故事</text></view>
      <view class="story-mark">禾</view>
      <text class="eyebrow">SHANHE STORIES</text>
      <text class="story-title">把土地与风物，慢慢讲给你听。</text>
      <view v-if="internalTest" class="internal-story-note">内部测试内容 · 示例文案与 AI 生成示意图</view>
      <view v-if="loading" class="story-state" role="status"><text class="state-mark">禾</text><text class="empty-title">正在读取故事</text><text class="empty-copy">连接内容服务…</text></view>
      <view v-else-if="error" class="story-state story-error" role="alert"><text class="empty-title">暂时无法读取</text><text class="empty-copy">{{ error }}</text><button class="retry-button" @tap="refreshStories">重试</button></view>
      <view v-else-if="!stories.length" class="story-state"><text class="state-mark">禾</text><text class="empty-title">还没有已发布的故事</text><text class="empty-copy">经过审核的山野风物内容发布后，会展示在这里。</text></view>
      <view v-else class="story-list">
        <view v-for="story in stories" :key="story.id" class="story-card" @tap="openStory(story)">
          <image v-if="imageUrl(story.coverObjectKey)" class="story-cover" :src="imageUrl(story.coverObjectKey)" :alt="story.title" mode="aspectFill" />
          <view v-else class="story-cover story-cover-empty">禾</view>
          <view class="story-card-copy"><text class="story-type">{{ typeName(story.contentType) }}</text><text class="story-card-title">{{ story.title }}</text><text class="story-summary">{{ story.summary }}</text><text v-if="story.relatedProduct" class="story-related">相关商品：{{ story.relatedProduct.name }}</text><text class="story-read">阅读全文　↗</text></view>
        </view>
      </view>
        </template>
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
.story-mark, .state-mark { width: 94rpx; height: 94rpx; margin-bottom: 24rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-family: STSong, "Songti SC", serif; font-size: 40rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; }
.story-title { display: block; max-width: 660rpx; margin: 12rpx 0 30rpx; color: var(--color-text-primary); font-size: 42rpx; line-height: 1.4; font-weight: 600; }
.internal-story-note { margin: 0 0 24rpx; padding: 14rpx 16rpx; border-left: 2rpx solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface); font-size: 21rpx; line-height: 1.6; }
.story-state { min-height: 280rpx; padding: 34rpx 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.state-mark { width: 60rpx; height: 60rpx; margin: 0 0 18rpx; font-size: 28rpx; }
.empty-title { color: var(--color-text-primary); font-size: 27rpx; font-weight: 600; }
.empty-copy { max-width: 600rpx; margin-top: 12rpx; color: var(--color-text-secondary); font-size: 22rpx; line-height: 1.7; }
.story-list { display: grid; gap: 24rpx; }
.story-card { overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-card); background: var(--color-surface); }
.story-cover { display: block; width: 100%; height: 360rpx; }
.story-cover-empty { display: grid; place-items: center; color: var(--color-brand); background: var(--color-surface-muted); font-family: STSong, "Songti SC", serif; font-size: 52rpx; }
.story-card-copy { padding: 22rpx 24rpx 24rpx; display: flex; flex-direction: column; align-items: flex-start; }
.story-type { color: var(--v19-copper); font-size: 20rpx; letter-spacing: 2rpx; }
.story-card-title { margin-top: 10rpx; color: var(--color-text-primary); font-size: 30rpx; line-height: 1.4; font-weight: 600; }
.story-summary { margin-top: 10rpx; color: var(--color-text-secondary); font-size: 22rpx; line-height: 1.65; }
.story-related { margin-top: 10rpx; color: var(--color-text-secondary); font-size: 20rpx; }
.story-read { margin-top: 20rpx; color: var(--color-brand); font-size: 21rpx; }
.story-article-view { min-height: 100%; }
.article-cover { width: 100%; max-height: 620rpx; margin-bottom: 24rpx; border-radius: var(--radius-card); }
.article-type { color: var(--v19-copper); font-size: 21rpx; letter-spacing: 2rpx; }
.article-title { margin-top: 12rpx; color: var(--color-text-primary); font-size: 40rpx; line-height: 1.42; font-weight: 600; }
.article-summary { margin-top: 16rpx; padding-bottom: 22rpx; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); font-size: 25rpx; line-height: 1.7; }
.article-body { margin-top: 24rpx; white-space: pre-wrap; color: var(--color-text-primary); font-size: 25rpx; line-height: 1.9; }
.related-product { margin-top: 32rpx; padding: 20rpx; display: flex; flex-direction: column; gap: 8rpx; border: 1px solid var(--color-border); border-radius: var(--radius-card); background: var(--color-surface); }
.related-caption { color: var(--color-text-secondary); font-size: 21rpx; }
.related-name { color: var(--color-brand); font-size: 25rpx; font-weight: 600; }
.retry-button { margin: 18rpx 0 0; padding: 12rpx 22rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); font-size: 22rpx; }
.bottom-space { height: 30rpx; }
</style>
