<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { readV19Content, saveV19Content, storefrontProducts } from '../../src/v19-content-store.js';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';
const products = ref<StorefrontProductSummary[]>(storefrontProducts());
const cart = ref<Record<string, number>>(readV19Content().cart);
const items = computed(() => products.value.filter(p => (cart.value[p.id] ?? 0) > 0).map(p => ({ product: p, quantity: cart.value[p.id] ?? 0 })));
const totalCent = computed(() => items.value.reduce((sum, item) => sum + item.product.minSalePriceCent * item.quantity, 0));
onShow(() => { products.value = storefrontProducts(); cart.value = readV19Content().cart; });
function setQuantity(id: string, amount: number) { cart.value = saveV19Content(c => { const next = (c.cart[id] ?? 0) + amount; if (next <= 0) delete c.cart[id]; else c.cart[id] = next; }).cart; }
function continueShopping() { uni.switchTab({ url: '/pages/category/index' }); }
</script>
<template>
  <scroll-view scroll-y class="tab-page-scroll">
    <view class="page-shell"><view class="page-heading"><text class="eyebrow">YOUR SELECTION</text><text class="page-title">购物车</text></view>
      <view v-if="!items.length" class="empty-cart"><text class="empty-mark">禾</text><text class="empty-title">购物车还是空的</text><text class="empty-copy">去分类页挑选山野好物。</text><button @tap="continueShopping">去逛逛</button></view>
      <view v-else><view v-for="item in items" :key="item.product.id" class="cart-item"><view class="cart-cover"><image v-if="item.product.coverObjectKey" :src="item.product.coverObjectKey" mode="aspectFill" /><text v-else>山禾颐品</text></view><view class="cart-info"><text class="cart-name">{{ item.product.name }}</text><text class="cart-subtitle">{{ item.product.subtitle }}</text><text class="cart-price">¥{{ (item.product.minSalePriceCent / 100).toFixed(2) }}</text><view class="quantity"><button @tap="setQuantity(item.product.id, -1)">−</button><text>{{ item.quantity }}</text><button @tap="setQuantity(item.product.id, 1)">＋</button></view></view></view><view class="cart-total"><text>合计 ¥{{ (totalCent / 100).toFixed(2) }}</text><text>演示购物车，不创建真实订单</text></view></view>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>
<style scoped>
.page-shell{min-height:100%;padding:40rpx;background:var(--v19-canvas)}.page-heading{padding:20rpx 0 30rpx}.eyebrow{display:block;color:var(--v19-copper);font-size:20rpx;letter-spacing:3rpx}.page-title{display:block;margin-top:8rpx;font-size:48rpx;font-weight:600}.empty-cart{min-height:62vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-mark{width:108rpx;height:108rpx;display:grid;place-items:center;border:1px solid var(--v19-line-strong);border-radius:50%;color:var(--v19-brand-900);font-size:44rpx}.empty-title{margin-top:28rpx;font-size:32rpx;font-weight:600}.empty-copy{margin-top:14rpx;color:var(--v19-muted);font-size:23rpx}.empty-cart button{min-height:76rpx;margin-top:34rpx;padding:0 34rpx;border-radius:12rpx;color:var(--v19-white);background:var(--v19-brand-900);font-size:25rpx}.cart-item{display:flex;gap:22rpx;padding:24rpx 0;border-bottom:1px solid var(--v19-line)}.cart-cover{width:190rpx;height:220rpx;position:relative;overflow:hidden;display:grid;place-items:center;border-radius:10rpx;color:var(--v19-brand-900);background:var(--v19-brand-100)}.cart-cover image{width:100%;height:100%}.cart-info{flex:1;position:relative}.cart-name{display:block;font-size:27rpx;font-weight:600}.cart-subtitle{display:block;margin-top:8rpx;color:var(--v19-muted);font-size:21rpx}.cart-price{display:block;margin-top:16rpx;color:var(--v19-orange);font-size:27rpx}.quantity{position:absolute;right:0;bottom:4rpx;display:flex;align-items:center;gap:16rpx}.quantity button{width:48rpx;height:48rpx;border:1px solid var(--v19-line);border-radius:50%;line-height:48rpx}.cart-total{display:flex;justify-content:space-between;margin-top:30rpx;font-size:24rpx}.cart-total text:last-child{color:var(--v19-muted);font-size:18rpx}.bottom-space{height:36rpx}
</style>
