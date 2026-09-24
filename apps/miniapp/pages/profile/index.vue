<script setup lang="ts">
const entries = [
  { id: 'orders', title: '我的订单', description: '订单服务接入后开放', icon: '▤' },
  { id: 'address', title: '收货地址', description: '登录与地址服务接入后开放', icon: '⌖' },
  { id: 'service', title: '客服与售后', description: '售后服务接入后开放', icon: '◌' },
  { id: 'benefits', title: '优惠权益', description: '会员服务接入后开放', icon: '◇' }
];

function openEntry(id: string) {
  if (id === 'address') uni.navigateTo({ url: '/pages/address/index' });
}
</script>

<template>
  <scroll-view scroll-y class="tab-page-scroll">
    <view class="page-shell">
      <view class="profile-hero">
        <view class="profile-identity"><view class="profile-avatar">禾</view><view><text class="eyebrow">MY SHANHE</text><text class="profile-title">欢迎来到山禾颐品</text></view></view>
        <text class="profile-copy">把山川好物，慢慢带回家。</text>
        <text class="profile-service-state">用户登录服务尚未接入</text>
      </view>
      <view class="profile-section-title"><text>我的服务</text><text>PERSONAL CENTER</text></view>
      <view class="profile-menu">
        <button v-for="entry in entries" :key="entry.id" class="profile-menu-row" :class="{ 'address-row': entry.id === 'address' }" :disabled="entry.id !== 'address'" @tap="openEntry(entry.id)">
          <view class="profile-menu-icon">{{ entry.icon }}</view>
          <view class="profile-menu-copy"><text class="profile-menu-title">{{ entry.title }}</text><text class="profile-menu-description">{{ entry.description }}</text></view>
          <text v-if="entry.id === 'address'" class="profile-manage">查看状态</text><text v-else class="profile-arrow">›</text>
        </button>
      </view>
      <text class="preview-note">账户、订单、地址、售后与会员权益暂未开放。</text>
    </view>
  </scroll-view>
</template>

<style scoped>
.page-shell { min-height: 100%; background: var(--color-canvas); }
.profile-hero { min-height: 305rpx; padding: 48rpx 40rpx 38rpx; position: relative; overflow: hidden; color: var(--v19-canvas); background: radial-gradient(ellipse at 94% 5%, rgba(229,201,158,.12), transparent 42%), linear-gradient(145deg, #18362b, #214537 78%, #294b3e); }
.profile-hero::after { width: 310rpx; height: 310rpx; position: absolute; right: -110rpx; bottom: -200rpx; border: 1px solid rgba(207,181,142,.35); border-radius: 50%; box-shadow: 0 0 0 28rpx rgba(207,181,142,.06), 0 0 0 58rpx rgba(207,181,142,.04); content: ''; }
.profile-identity { display: flex; align-items: center; gap: 20rpx; }
.profile-avatar { width: 88rpx; height: 88rpx; display: grid; place-items: center; border: 1px solid rgba(229,201,158,.7); border-radius: 50%; color: var(--v19-gold-light); background: linear-gradient(145deg, rgba(255,255,255,.13), rgba(255,255,255,.035)); box-shadow: 0 0 0 7rpx rgba(255,255,255,.035), 0 10rpx 24rpx rgba(0,0,0,.12); font-family: STSong, "Songti SC", serif; font-size: 38rpx; }
.eyebrow { display: block; color: var(--v19-gold-light); font-size: 19rpx; letter-spacing: 3rpx; }
.profile-title { display: block; margin-top: 7rpx; font-size: 31rpx; line-height: 1.4; font-weight: 600; }
.profile-copy { display: block; margin: 22rpx 0 0 108rpx; color: rgba(247,243,232,.78); font-size: 23rpx; }
.profile-service-state { display: inline-block; margin: 22rpx 0 0 108rpx; padding: 7rpx 12rpx; border: 1px solid rgba(229,201,158,.3); border-radius: 999rpx; color: rgba(247,243,232,.82); font-size: 18rpx; }
.profile-section-title { margin: 36rpx 40rpx 17rpx; display: flex; align-items: baseline; justify-content: space-between; color: var(--v19-ink); font-size: 27rpx; font-weight: 600; }
.profile-section-title text:last-child { color: var(--v19-muted-2); font-size: 16rpx; font-weight: 400; letter-spacing: 2rpx; }
.profile-menu { margin: 0 28rpx; overflow: hidden; border: 1px solid var(--v19-line); border-radius: var(--radius-feature); background: var(--v19-paper-light); box-shadow: var(--shadow-soft); }
.profile-menu-row { width: 100%; min-height: 112rpx; padding: 16rpx 24rpx; display: flex; align-items: center; gap: 18rpx; border-bottom: 1px solid var(--v19-line); text-align: left; }
.profile-menu-row:last-child { border-bottom: 0; }
.profile-menu-row:disabled { opacity: .62; }
.profile-menu-row.address-row { background: linear-gradient(90deg, rgba(232,239,234,.65), transparent 70%); }
.profile-menu-icon { width: 60rpx; height: 60rpx; flex: none; display: grid; place-items: center; border: 1px solid rgba(24,54,43,.06); border-radius: 50%; color: var(--v19-brand-800); background: linear-gradient(145deg, #eef3ee, #e4ece5); font-size: 27rpx; }
.profile-menu-row.address-row .profile-menu-icon { color: #8b673f; background: linear-gradient(145deg, #f5efe4, #eee4d2); }
.profile-menu-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 5rpx; }
.profile-menu-title { color: var(--v19-ink); font-size: 25rpx; font-weight: 600; }
.profile-menu-description { color: var(--v19-muted); font-size: 18rpx; }
.profile-arrow { color: var(--v19-muted-2); font-size: 34rpx; }
.profile-manage { padding: 8rpx 14rpx; border: 1px solid var(--v19-line); border-radius: 999rpx; color: var(--v19-brand-800); background: var(--v19-paper-light); font-size: 17rpx; white-space: nowrap; }
.preview-note { display: block; margin: 24rpx 40rpx; color: var(--v19-muted); font-size: 19rpx; line-height: 1.55; text-align: center; }
</style>
