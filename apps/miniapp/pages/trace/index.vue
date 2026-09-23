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
</script>

<template>
  <view class="trace-page">
    <view class="trace-mark">溯</view>
    <text class="eyebrow">TRACEABILITY</text>
    <text class="trace-title">扫一扫包装上的溯源码</text>
    <text class="trace-copy">正式版将从批次、供应商、收货与质检记录中读取可追溯信息。</text>
    <button class="scan-button" @tap="scanTraceCode">扫一扫溯源</button>
    <view v-if="scannedCode" class="trace-result"><text class="eyebrow">SCAN RESULT</text><text class="trace-code">{{ scannedCode }}</text><text class="trace-copy">{{ scanNote }}</text></view>
    <view v-if="traces.length" class="trace-result"><text class="eyebrow">V19 TRACE PREVIEW</text><view v-for="item in traces" :key="item.id" class="trace-record"><text class="trace-code">{{ item.product }} · {{ item.batchNo }}</text><text class="trace-copy">产地：{{ item.origin }} · 供应：{{ item.supplier || '—' }}</text><text class="trace-copy">收货：{{ item.receiveDate || '—' }} · 包装：{{ item.packDate || '—' }}</text><text class="trace-copy">工艺：{{ item.craft || '—' }} · 质检：{{ item.quality || '—' }}</text><text class="trace-copy">{{ item.note }}</text></view></view>
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
.trace-record { padding: 18rpx 0; border-top: 1px solid var(--v19-line); }
.trace-code { display: block; margin: 14rpx 0; font-size: 24rpx; overflow-wrap: anywhere; }
</style>
