<script setup lang="ts">
const entries = ['我的订单', '收货地址', '我的收藏', '优惠权益', '客服与售后', '关于山禾颐品'];

function notConnected() {
  uni.showToast({ title: '该功能页面尚未接入', icon: 'none' });
}

function openAdminPreview() {
  uni.navigateTo({ url: '/pages/admin-preview/index' });
}
</script>

<template>
  <view class="page-shell">
    <view class="profile-hero"><text class="eyebrow">MY SHANHE</text><text class="profile-title">晚上好，山友</text><text class="profile-copy">把山川好物慢慢带回家。</text></view>
    <view class="profile-menu"><button v-for="entry in entries" :key="entry" @tap="notConnected">{{ entry }}<text>›</text></button></view>
    <button class="admin-test-entry" @tap="openAdminPreview">测试：进入后台预览 <text>↗</text></button>
    <text class="preview-note">页面示例 · 账户和会员数据尚未连接</text>
  </view>
</template>

<style scoped>
.page-shell { min-height: 100vh; background: var(--v19-canvas); }
.profile-hero { padding: 56rpx 40rpx 66rpx; color: var(--v19-canvas); background: var(--v19-brand-900); }
.eyebrow { color: #cfb58e; font-size: 20rpx; letter-spacing: 3rpx; }
.profile-title { display: block; margin: 12rpx 0; font-size: 43rpx; font-weight: 600; }
.profile-copy { color: rgba(247,243,232,.74); font-size: 24rpx; }
.profile-menu { margin: 34rpx 40rpx 0; border-top: 1px solid var(--v19-line); }
.profile-menu button { width: 100%; min-height: 108rpx; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--v19-line); text-align: left; font-size: 27rpx; }
.profile-menu button text { color: var(--v19-muted); font-size: 32rpx; }
.admin-test-entry { min-height: 84rpx; margin: 42rpx 40rpx 12rpx; padding: 0 24rpx; display: flex; align-items: center; justify-content: space-between; border-radius: 12rpx; color: white; background: var(--v19-orange); font-size: 25rpx; font-weight: 600; }
.preview-note { display: block; margin: 0 40rpx; color: var(--v19-muted); font-size: 20rpx; }
</style>
