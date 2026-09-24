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
      <view v-else class="cart-content"><view v-for="item in items" :key="item.product.id" class="cart-item"><view class="cart-cover"><image v-if="item.product.coverObjectKey" :src="item.product.coverObjectKey" mode="aspectFill" /><text v-else>山禾颐品</text></view><view class="cart-info"><text class="cart-name">{{ item.product.name }}</text><text class="cart-subtitle">{{ item.product.subtitle }}</text><text class="cart-price">¥{{ (item.product.minSalePriceCent / 100).toFixed(2) }}</text><view class="quantity"><button aria-label="减少数量" @tap="setQuantity(item.product.id, -1)">−</button><text>{{ item.quantity }}</text><button aria-label="增加数量" @tap="setQuantity(item.product.id, 1)">＋</button></view></view></view><view class="cart-total"><view><text class="total-label">合计</text><text class="total-price">¥{{ (totalCent / 100).toFixed(2) }}</text></view><text>本机演示购物车 · 暂不支持真实下单</text></view><button class="checkout-disabled" disabled>结算暂未开放</button></view>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>
</template>
<style scoped>
.page-shell { min-height: 100%; padding: 40rpx; background: var(--color-canvas); }
.page-heading { padding: 20rpx 0 30rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: var(--type-caption); letter-spacing: 3rpx; }
.page-title { display: block; margin-top: var(--space-1); color: var(--color-text-primary); font-size: 48rpx; font-weight: 600; }
.empty-cart { min-height: 62vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-mark { width: 108rpx; height: 108rpx; display: grid; place-items: center; border: 1px solid var(--v19-line-strong); border-radius: 50%; color: var(--color-brand); font-size: 44rpx; }
.empty-title { margin-top: 28rpx; color: var(--color-text-primary); font-size: 32rpx; font-weight: 600; }
.empty-copy { margin-top: 14rpx; color: var(--color-text-secondary); font-size: var(--type-caption); }
.empty-cart button { min-height: 88rpx; margin-top: 34rpx; padding: 0 34rpx; border-radius: var(--radius-control); color: var(--v19-white); background: var(--color-brand); font-size: 25rpx; }
.cart-content { padding-bottom: 36rpx; }
.cart-item { min-height: 240rpx; padding: 24rpx 0; display: flex; gap: 24rpx; border-bottom: 1px solid var(--color-border); }
.cart-cover { width: 190rpx; height: 220rpx; flex: none; position: relative; overflow: hidden; display: grid; place-items: center; border-radius: var(--radius-surface); color: var(--color-brand); background: var(--color-brand-soft); }
.cart-cover image { width: 100%; height: 100%; }
.cart-info { min-width: 0; flex: 1; position: relative; padding-bottom: 64rpx; }
.cart-name { display: block; color: var(--color-text-primary); font-size: 27rpx; line-height: 1.45; font-weight: 600; }
.cart-subtitle { display: block; margin-top: 8rpx; color: var(--color-text-secondary); font-size: var(--type-caption); line-height: var(--leading-body); }
.cart-price { display: block; margin-top: 16rpx; color: var(--color-accent); font-size: 28rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
.quantity { position: absolute; right: 0; bottom: 0; display: flex; align-items: center; gap: 14rpx; }
.quantity button { width: 76rpx; height: 76rpx; margin: 0; padding: 0; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-size: 30rpx; line-height: 1; }
.quantity text { min-width: 28rpx; color: var(--color-text-primary); font-size: 24rpx; text-align: center; font-variant-numeric: tabular-nums; }
.cart-total { margin-top: 26rpx; padding: 22rpx 0; display: flex; align-items: flex-end; justify-content: space-between; gap: 16rpx; border-bottom: 1px solid var(--color-border); }
.cart-total view { display: flex; align-items: baseline; gap: 14rpx; }
.total-label { color: var(--color-text-primary); font-size: 23rpx; }
.total-price { color: var(--color-accent); font-size: 34rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
.cart-total > text { max-width: 46%; color: var(--color-text-secondary); font-size: 19rpx; line-height: 1.45; text-align: right; }
.checkout-disabled { width: 100%; min-height: 88rpx; margin-top: 24rpx; border-radius: var(--radius-control); color: #69716c; background: #e7e6df; font-size: 25rpx; font-weight: 600; }
.checkout-disabled[disabled] { opacity: 1; }
.bottom-space { height: 36rpx; }
</style>
