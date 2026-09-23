<script setup lang="ts">
const groups = [
  { name: '经营', items: ['工作台', '数据报表'] },
  { name: '小程序前台', items: ['首页图片', '自有商品', '山禾甄选', '本期甄选', '山野故事', '溯源内容'] },
  { name: '交易', items: ['商品中心', '订单中心', '售后中心'] },
  { name: '用户与增长', items: ['会员中心', '营销中心', '内容中心'] },
  { name: '供应链', items: ['采购管理', '收货质检', '仓库库存', '加工包装', '溯源管理'] },
  { name: '企业与系统', items: ['企业团购', '客服中心', '财务中心', '系统管理'] }
];

function openEntry(entry: string) {
  uni.showToast({ title: `${entry}为预览入口，尚未连接后台`, icon: 'none' });
}

function goBack() {
  uni.navigateBack({ delta: 1 });
}
</script>

<template>
  <view class="admin-preview">
    <view class="admin-banner"><button @tap="goBack">‹ 返回</button><view><text class="admin-brand">山禾颐品</text><text class="admin-subbrand">运营管理中心 · 测试预览</text></view><text class="admin-avatar">管</text></view>
    <view class="preview-alert">测试预览 · 以下数据和功能入口均为示意，不代表真实经营数据，也不会修改业务数据。</view>
    <view class="admin-heading"><text class="eyebrow">WORKSPACE</text><text class="admin-title">经营概览</text><text class="admin-copy">今日经营、履约与供应链关键数据</text></view>
    <view class="metric-grid"><view v-for="metric in [{label:'今日 GMV',value:'演示数据'},{label:'支付订单',value:'演示数据'},{label:'待发货',value:'演示数据'},{label:'库存预警',value:'演示数据'}]" :key="metric.label" class="metric-card"><text>{{ metric.label }}</text><text>{{ metric.value }}</text></view></view>
    <view class="todo-card"><text class="card-title">常用待办</text><view><text>采购与收货</text><text>查看入口 ›</text></view><view><text>订单与售后</text><text>查看入口 ›</text></view><view><text>前台内容更新</text><text>查看入口 ›</text></view></view>
    <view v-for="group in groups" :key="group.name" class="menu-group"><text class="group-title">{{ group.name }}</text><view class="entry-grid"><button v-for="entry in group.items" :key="entry" @tap="openEntry(entry)">{{ entry }}<text>›</text></button></view></view>
    <view class="preview-note">测试入口仅用于查看 V19 后台结构。真实后台要在 Web 管理端实现登录、权限和 API 接入。</view>
  </view>
</template>

<style scoped>
.admin-preview { min-height: 100vh; padding-bottom: 50rpx; background: #f3f1ea; }
.admin-banner { min-height: 126rpx; padding: 20rpx 30rpx; display: flex; align-items: center; gap: 22rpx; color: var(--v19-paper-light); background: var(--v19-brand-900); }
.admin-banner button { color: var(--v19-paper-light); font-size: 24rpx; }
.admin-brand,.admin-subbrand { display: block; }
.admin-brand { font-size: 29rpx; font-weight: 600; letter-spacing: 2rpx; }
.admin-subbrand { margin-top: 5rpx; color: #b9c7bf; font-size: 19rpx; }
.admin-avatar { width: 58rpx; height: 58rpx; margin-left: auto; display: grid; place-items: center; border-radius: 50%; color: var(--v19-brand-900); background: #e5c99e; }
.preview-alert { margin: 24rpx 28rpx 0; padding: 18rpx 20rpx; border: 1px solid #e9d6b2; border-radius: 8rpx; color: #79572b; background: #fcf3df; font-size: 20rpx; line-height: 31rpx; }
.admin-heading { padding: 34rpx 30rpx 18rpx; }
.eyebrow { color: var(--v19-copper); font-size: 19rpx; letter-spacing: 3rpx; }
.admin-title { display: block; margin: 8rpx 0; font-size: 41rpx; font-weight: 600; }
.admin-copy { color: var(--v19-muted); font-size: 22rpx; }
.metric-grid { padding: 10rpx 28rpx; display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.metric-card { min-height: 122rpx; padding: 20rpx; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--v19-line); border-radius: 10rpx; background: var(--v19-paper-light); }
.metric-card text:first-child { color: var(--v19-muted); font-size: 21rpx; }
.metric-card text:last-child { font-size: 25rpx; font-weight: 600; }
.todo-card,.menu-group { margin: 20rpx 28rpx; padding: 24rpx; border: 1px solid var(--v19-line); border-radius: 10rpx; background: var(--v19-paper-light); }
.card-title,.group-title { display: block; margin-bottom: 14rpx; font-size: 25rpx; font-weight: 600; }
.todo-card view { min-height: 70rpx; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--v19-line); font-size: 22rpx; }
.todo-card view text:last-child { color: var(--v19-muted); }
.entry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }
.entry-grid button { min-height: 74rpx; padding: 0 16rpx; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--v19-line); border-radius: 7rpx; text-align: left; font-size: 21rpx; }
.entry-grid button text { color: var(--v19-muted); }
.preview-note { margin: 28rpx; color: var(--v19-muted); font-size: 20rpx; line-height: 32rpx; }
</style>
