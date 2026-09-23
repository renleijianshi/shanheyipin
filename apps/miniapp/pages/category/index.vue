<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ProductTile from '../../components/ProductTile.vue';
import ProductSheet from '../../components/ProductSheet.vue';
import { storefrontProducts } from '../../src/v19-content-store.js';
import { addV19CartItem } from '../../src/v19-content-store.js';
import { V12_CATEGORY_TABS, filterCatalogProducts, type V12CategoryKey } from '@miniapp-model/v12-ui-model.js';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

const activeCategory = ref<V12CategoryKey>('all');
const allProducts = ref(storefrontProducts());
const selectedProduct = ref<StorefrontProductSummary | null>(null);
const productTones = ['persimmon', 'gift', 'wheat', 'season'] as const;
const products = computed(() => filterCatalogProducts(allProducts.value, activeCategory.value));

function applySavedCategory() {
  const saved = uni.getStorageSync('v19-category');
  if (V12_CATEGORY_TABS.some((tab) => tab.key === saved)) activeCategory.value = saved as V12CategoryKey;
  uni.removeStorageSync('v19-category');
}

function addProduct(id: string) {
  addV19CartItem(id);
  selectedProduct.value = null;
  uni.showToast({ title: '已加入演示购物车' });
}

function refresh() { allProducts.value = storefrontProducts(); applySavedCategory(); }
onMounted(refresh);
onShow(refresh);
</script>

<template>
  <view>
    <scroll-view scroll-y class="tab-page-scroll">
      <view class="page-shell">
        <view class="page-heading"><text class="eyebrow">DISCOVER</text><text class="page-title">分类</text></view>
        <scroll-view scroll-x class="category-tabs">
          <button v-for="tab in V12_CATEGORY_TABS" :key="tab.key" :class="{ active: activeCategory === tab.key }" @tap="activeCategory = tab.key">{{ tab.label }}</button>
        </scroll-view>
        <text class="category-note">后台按商品分类标签归档；“全部商品”汇总所有已上架商品。</text>
        <view class="products-grid">
          <ProductTile v-for="(product, index) in products" :key="product.id" :product="product" :tone="productTones[index % productTones.length]!" @select="selectedProduct = $event" />
        </view>
        <view class="bottom-space"></view>
      </view>
    </scroll-view>
    <ProductSheet v-if="selectedProduct" :product="selectedProduct" @close="selectedProduct = null" @add="addProduct" />
  </view>
</template>

<style scoped>
.page-shell { min-height: 100%; padding: 40rpx; background: var(--v19-canvas); }
.page-heading { padding: 20rpx 0 30rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.page-title { display: block; margin-top: 8rpx; font-size: 48rpx; font-weight: 600; }
.category-tabs { width: 100%; white-space: nowrap; border-bottom: 1px solid var(--v19-line); }
.category-tabs button { min-height: 92rpx; margin: 0 36rpx 0 0; padding: 0; position: relative; display: inline-flex; align-items: center; border: 0; border-radius: 0; color: var(--v19-muted); background: transparent; font-size: 25rpx; }
.category-tabs button::after { border: 0; }
.category-tabs button.active { color: var(--v19-brand-900); font-weight: 600; }
.category-tabs button.active::after { height: 4rpx; position: absolute; right: 0; bottom: -1px; left: 0; background: var(--v19-brand-900); content: ''; }
.category-note { display: block; margin: 26rpx 0 34rpx; color: var(--v19-muted); font-size: 22rpx; line-height: 36rpx; }
.products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40rpx 24rpx; }
.preview-note { padding: 36rpx 0; color: var(--v19-muted); font-size: 20rpx; }
.bottom-space { height: 36rpx; }
</style>
