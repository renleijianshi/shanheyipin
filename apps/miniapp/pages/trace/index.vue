<script setup lang="ts">
import { ref } from 'vue';

const scannedCode = ref('');
const scanNote = ref('');

function scanTraceCode() {
  uni.scanCode({
    onlyFromCamera: false,
    success: (result) => {
      scannedCode.value = result.result;
      scanNote.value = '已读取溯源码。批次查询接口尚未接入。';
    },
    fail: () => {
      uni.showToast({ title: '未完成扫码', icon: 'none' });
    }
  });
}
</script>

<template>
  <view class="trace-page">
    <view class="trace-mark">溯</view>
    <text class="eyebrow">TRACEABILITY</text>
    <text class="trace-title">扫一扫包装上的溯源码</text>
    <text class="trace-copy">正式版将从批次、供应商、收货与质检记录中读取可追溯信息。</text>
    <button class="scan-button" @tap="scanTraceCode">扫一扫溯源</button>
    <view v-if="scannedCode" class="trace-result"><text class="eyebrow">SCAN RESULT</text><text class="trace-code">{{ scannedCode }}</text><text class="trace-copy">{{ scanNote }}</text></view>
  </view>
</template>

<style scoped>
.trace-page { min-height: 100vh; padding: 90rpx 44rpx; background: var(--v19-canvas); text-align: center; }
.trace-mark { width: 112rpx; height: 112rpx; margin: 0 auto 28rpx; display: grid; place-items: center; border: 1px solid var(--v19-line-strong); border-radius: 50%; color: var(--v19-brand-900); font-size: 48rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.trace-title { display: block; margin: 18rpx 0 14rpx; font-size: 37rpx; font-weight: 600; }
.trace-copy { display: block; color: var(--v19-muted); font-size: 24rpx; line-height: 40rpx; }
.scan-button { min-height: 90rpx; margin-top: 42rpx; border-radius: 12rpx; color: white; background: var(--v19-brand-900); font-size: 28rpx; }
.trace-result { margin-top: 46rpx; padding: 28rpx; border: 1px solid var(--v19-line); border-radius: 12rpx; text-align: left; }
.trace-code { display: block; margin: 14rpx 0; font-size: 24rpx; overflow-wrap: anywhere; }
</style>
