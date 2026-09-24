<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { readV19Content, type V19Trace } from '../../src/v19-content-store.js';

const scannedCode = ref('');
const scanNote = ref('');
const traces = ref<V19Trace[]>([]);
onShow(() => { traces.value = readV19Content().traces.filter(item => item.status === '启用'); });

function scanTraceCode() {
  uni.scanCode({
    onlyFromCamera: false,
    success: (result) => {
      scannedCode.value = result.result;
      scanNote.value = '已读取演示溯源码。展示的是本地预览记录，尚未连接批次 API。';
    },
    fail: () => {
      uni.showToast({ title: '未完成扫码', icon: 'none' });
    }
  });
}
function goBack() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/home/index' }) }); }
</script>

<template>
  <scroll-view scroll-y class="subpage-scroll">
    <view class="trace-page">
      <view class="subpage-header"><button class="back-button" @tap="goBack"><text>‹</text><text>返回</text></button><text class="subpage-title">扫码溯源</text></view>
      <view class="trace-mark">溯</view>
      <text class="eyebrow">TRACEABILITY</text>
      <text class="trace-title">扫一扫包装上的溯源码</text>
      <text class="trace-copy">正式版将从批次、供应商、收货与质检记录中读取可追溯信息。</text>
      <button class="scan-button" @tap="scanTraceCode">扫一扫溯源</button>
      <view v-if="scannedCode" class="trace-result scan-result"><view class="result-heading"><text class="eyebrow">SCAN RESULT</text><text class="preview-badge">本机预览</text></view><text class="trace-code">{{ scannedCode }}</text><text class="trace-copy">{{ scanNote }}</text></view>
      <view v-if="traces.length" class="trace-result"><view class="result-heading"><text class="eyebrow">TRACE RECORDS</text><text class="preview-badge">V19 演示记录</text></view><view v-for="item in traces" :key="item.id" class="trace-record"><view class="record-heading"><text class="trace-product">{{ item.product }}</text><text class="trace-batch">批次 {{ item.batchNo }}</text></view><view class="trace-fields"><view><text class="field-label">产地</text><text class="field-value">{{ item.origin }}</text></view><view><text class="field-label">供应方</text><text class="field-value">{{ item.supplier || '—' }}</text></view><view><text class="field-label">收货日期</text><text class="field-value">{{ item.receiveDate || '—' }}</text></view><view><text class="field-label">包装日期</text><text class="field-value">{{ item.packDate || '—' }}</text></view></view><view class="quality-note"><text class="field-label">工艺与质检</text><text class="field-value">{{ item.craft || '—' }} · {{ item.quality || '—' }}</text></view><text v-if="item.note" class="trace-note">{{ item.note }}</text></view></view>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.trace-page { min-height: 100%; padding: 24rpx 44rpx 40rpx; background: var(--color-canvas); text-align: center; }
.subpage-header { min-height: 88rpx; margin: 0 0 46rpx -4rpx; display: flex; align-items: center; gap: 18rpx; text-align: left; }
.back-button { min-width: 132rpx; min-height: 80rpx; margin: 0; padding: 0 14rpx; display: flex; align-items: center; justify-content: center; gap: 6rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); font-size: 23rpx; }
.back-button text:first-child { font-size: 38rpx; line-height: 1; }
.subpage-title { color: var(--color-text-primary); font-size: 28rpx; font-weight: 600; }
.trace-mark { width: 112rpx; height: 112rpx; margin: 0 auto 28rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-size: 48rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; }
.trace-title { display: block; margin: 18rpx 0 14rpx; color: var(--color-text-primary); font-size: 37rpx; line-height: 1.4; font-weight: 600; }
.trace-copy { display: block; color: var(--color-text-secondary); font-size: 24rpx; line-height: 1.65; }
.scan-button { width: 100%; min-height: 92rpx; margin-top: 42rpx; border-radius: var(--radius-control); color: white; background: var(--color-brand); font-size: 28rpx; font-weight: 600; }
.trace-result { margin-top: 36rpx; padding: 26rpx; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); text-align: left; }
.result-heading { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.preview-badge { padding: 7rpx 11rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-text-secondary); font-size: 18rpx; white-space: nowrap; }
.trace-record { padding: 24rpx 0 8rpx; border-top: 1px solid var(--color-border); }
.record-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8rpx; }
.trace-product { color: var(--color-text-primary); font-size: 26rpx; font-weight: 600; }
.trace-batch { color: var(--color-text-secondary); font-size: 20rpx; font-variant-numeric: tabular-nums; }
.trace-code { display: block; margin: 14rpx 0 6rpx; color: var(--color-text-primary); font-size: 24rpx; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.trace-fields { margin-top: 20rpx; display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx 14rpx; }
.trace-fields view, .quality-note { min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
.field-label { color: var(--color-text-secondary); font-size: 19rpx; }
.field-value { color: var(--color-text-primary); font-size: 22rpx; line-height: 1.45; overflow-wrap: anywhere; }
.quality-note { margin-top: 20rpx; padding-top: 16rpx; border-top: 1px solid var(--color-border); }
.trace-note { display: block; margin-top: 16rpx; color: var(--color-text-secondary); font-size: 21rpx; line-height: 1.6; }
.bottom-space { height: 30rpx; }
</style>
