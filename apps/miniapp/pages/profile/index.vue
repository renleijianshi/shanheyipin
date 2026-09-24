<script setup lang="ts">
const entries = [
  { id: 'orders', title: '我的订单', description: '查看订单状态与配送进度', icon: '▤' },
  { id: 'address', title: '收货地址', description: '管理收件人与配送地址', icon: '⌖' },
  { id: 'favorites', title: '我的收藏', description: '收藏的山野风物', icon: '♡' },
  { id: 'benefits', title: '优惠权益', description: '会员与活动权益', icon: '◇' },
  { id: 'service', title: '客服与售后', description: '获取订单与商品帮助', icon: '◌' },
  { id: 'about', title: '关于山禾颐品', description: '认识山禾与产地风物', icon: 'i' }
];

function openEntry(id: string) {
  if (id === 'address') {
    uni.navigateTo({ url: '/pages/address/index' });
    return;
  }
  uni.showToast({ title: '该功能页面尚未接入', icon: 'none' });
}

function openAdminPreview() {
  uni.navigateTo({ url: '/pages/admin-preview/index' });
}
</script>

<template>
  <scroll-view scroll-y class="tab-page-scroll">
    <view class="page-shell">
      <view class="profile-hero">
        <view class="profile-identity"><view class="profile-avatar">禾</view><view><text class="eyebrow">MY SHANHE</text><text class="profile-title">晚上好，山友</text></view></view>
        <text class="profile-copy">把山川好物，慢慢带回家。</text>
        <view class="profile-hero-mark">山禾颐品 · 山野相逢</view>
      </view>
      <view class="profile-section-title"><text>我的服务</text><text>PERSONAL CENTER</text></view>
      <view class="profile-menu">
        <button v-for="entry in entries" :key="entry.id" class="profile-menu-row" :class="{ 'address-row': entry.id === 'address' }" @tap="openEntry(entry.id)">
          <view class="profile-menu-icon">{{ entry.icon }}</view>
          <view class="profile-menu-copy"><text class="profile-menu-title">{{ entry.title }}</text><text class="profile-menu-description">{{ entry.description }}</text></view>
          <text v-if="entry.id === 'address'" class="profile-manage">管理</text><text v-else class="profile-arrow">›</text>
        </button>
      </view>
      <button class="admin-test-entry" @tap="openAdminPreview"><view><text class="admin-entry-title">运营管理预览</text><text class="admin-entry-copy">查看前后台内容联动效果</text></view><text class="admin-entry-arrow">↗</text></button>
      <text class="preview-note">账户、订单与会员信息尚未接入线上服务</text>
    </view>
  </scroll-view>
</template>

<style scoped>
.page-shell { min-height: 100%; background: var(--v19-canvas); }
.profile-hero { min-height: 290rpx; padding: 48rpx 40rpx 38rpx; position: relative; overflow: hidden; color: var(--v19-canvas); background: var(--v19-brand-900); }
.profile-hero::after { width: 310rpx; height: 310rpx; position: absolute; right: -110rpx; bottom: -200rpx; border: 1px solid rgba(207,181,142,.35); border-radius: 50%; box-shadow: 0 0 0 28rpx rgba(207,181,142,.06), 0 0 0 58rpx rgba(207,181,142,.04); content: ''; }
.profile-identity { display: flex; align-items: center; gap: 20rpx; }
.profile-avatar { width: 84rpx; height: 84rpx; display: grid; place-items: center; border: 1px solid rgba(207,181,142,.55); border-radius: 50%; color: var(--v19-gold-light); background: rgba(255,255,255,.06); font-family: STSong, "Songti SC", serif; font-size: 37rpx; }
.eyebrow { display: block; color: var(--v19-gold-light); font-size: 19rpx; letter-spacing: 3rpx; }
.profile-title { display: block; margin-top: 6rpx; font-size: 39rpx; font-weight: 600; }
.profile-copy { display: block; margin: 22rpx 0 0 104rpx; color: rgba(247,243,232,.78); font-size: 23rpx; }
.profile-hero-mark { margin: 32rpx 0 0 104rpx; color: rgba(207,181,142,.72); font-size: 18rpx; letter-spacing: 2rpx; }
.profile-section-title { margin: 34rpx 40rpx 16rpx; display: flex; align-items: baseline; justify-content: space-between; color: var(--v19-ink); font-size: 27rpx; font-weight: 600; }
.profile-section-title text:last-child { color: var(--v19-muted-2); font-size: 16rpx; font-weight: 400; letter-spacing: 2rpx; }
.profile-menu { margin: 0 28rpx; overflow: hidden; border: 1px solid var(--v19-line); border-radius: 16rpx; background: var(--v19-paper-light); box-shadow: 0 8rpx 26rpx rgba(24,54,43,.04); }
.profile-menu-row { width: 100%; min-height: 112rpx; padding: 16rpx 22rpx; display: flex; align-items: center; gap: 18rpx; border-bottom: 1px solid var(--v19-line); text-align: left; }
.profile-menu-row:last-child { border-bottom: 0; }
.profile-menu-row.address-row { background: linear-gradient(90deg, rgba(232,239,234,.65), transparent 70%); }
.profile-menu-icon { width: 58rpx; height: 58rpx; flex: none; display: grid; place-items: center; border-radius: 50%; color: var(--v19-brand-800); background: var(--v19-brand-100); font-size: 28rpx; }
.profile-menu-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 5rpx; }
.profile-menu-title { color: var(--v19-ink); font-size: 25rpx; font-weight: 600; }
.profile-menu-description { color: var(--v19-muted); font-size: 19rpx; }
.profile-arrow { color: var(--v19-muted-2); font-size: 34rpx; }
.profile-manage { padding: 8rpx 15rpx; border: 1px solid var(--v19-line); border-radius: 999rpx; color: var(--v19-brand-800); background: var(--v19-paper-light); font-size: 18rpx; }
.admin-test-entry { width: calc(100% - 56rpx); min-height: 96rpx; margin: 28rpx auto 14rpx; padding: 0 22rpx; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--v19-line); border-radius: 14rpx; color: var(--v19-brand-900); background: var(--v19-paper); text-align: left; }
.admin-entry-title, .admin-entry-copy { display: block; }
.admin-entry-title { font-size: 23rpx; font-weight: 600; }
.admin-entry-copy { margin-top: 5rpx; color: var(--v19-muted); font-size: 18rpx; font-weight: 400; }
.admin-entry-arrow { color: var(--v19-copper); font-size: 28rpx; }
.preview-note { display: block; margin: 0 40rpx 24rpx; color: var(--v19-muted); font-size: 18rpx; text-align: center; }
.profile-hero { min-height: 300rpx; padding: 48rpx 40rpx 36rpx; background: radial-gradient(ellipse at 94% 5%, rgba(229,201,158,.12), transparent 42%), linear-gradient(145deg, #18362b, #214537 78%, #294b3e); }
.profile-avatar { width: 88rpx; height: 88rpx; border: 1px solid rgba(229,201,158,.7); background: linear-gradient(145deg, rgba(255,255,255,.13), rgba(255,255,255,.035)); box-shadow: 0 0 0 7rpx rgba(255,255,255,.035), 0 10rpx 24rpx rgba(0,0,0,.12); }
.profile-title { letter-spacing: .02em; }
.profile-copy { margin-top: 24rpx; }
.profile-section-title { margin-top: 38rpx; margin-bottom: 18rpx; }
.profile-menu { border-radius: var(--radius-feature); box-shadow: var(--shadow-soft); }
.profile-menu-row { min-height: 116rpx; padding-left: 24rpx; padding-right: 24rpx; transition: background-color .16s ease; }
.profile-menu-icon { width: 62rpx; height: 62rpx; border: 1px solid rgba(24,54,43,.06); background: linear-gradient(145deg, #eef3ee, #e4ece5); }
.profile-menu-title { font-size: 26rpx; }
.profile-menu-description { margin-top: 1rpx; }
.profile-menu-row.address-row .profile-menu-icon { color: #8b673f; background: linear-gradient(145deg, #f5efe4, #eee4d2); }
.admin-test-entry { min-height: 104rpx; border-radius: 16rpx; box-shadow: 0 8rpx 24rpx rgba(24,54,43,.045); }
.admin-entry-arrow { width: 42rpx; height: 42rpx; display: grid; place-items: center; border-radius: 50%; color: var(--v19-brand-900); background: var(--v19-brand-100); }
</style>
