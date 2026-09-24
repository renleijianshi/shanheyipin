<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ProductTile from '../../components/ProductTile.vue';
import ProductSheet from '../../components/ProductSheet.vue';
import { createPublicCatalogPort } from '../../src/public-catalog-port.js';
import { toProductDetailView, type ProductDetailView } from '../../src/catalog-view-model.js';
import { V12_CATEGORY_TABS, filterCatalogProducts, type V12CategoryKey } from '@miniapp-model/v12-ui-model.js';
import type { StorefrontProductSummary } from '@miniapp-model/v12-ports.js';

const catalog = createPublicCatalogPort();
const activeCategory = ref<V12CategoryKey>('all');
const allProducts = ref<StorefrontProductSummary[]>([]);
const selectedProduct = ref<StorefrontProductSummary | null>(null);
const selectedProductDetail = ref<ProductDetailView | null>(null);
const productDetailLoading = ref(false);
const productDetailError = ref('');
const catalogLoading = ref(true);
const catalogError = ref('');
const productTones = ['persimmon', 'gift', 'wheat', 'season'] as const;
const products = computed(() => filterCatalogProducts(allProducts.value, activeCategory.value));

function applySavedCategory() {
  const saved = uni.getStorageSync('v19-category');
  if (V12_CATEGORY_TABS.some((tab) => tab.key === saved)) activeCategory.value = saved as V12CategoryKey;
  uni.removeStorageSync('v19-category');
}

async function refreshCatalog() {
  catalogLoading.value = true;
  catalogError.value = '';
  try {
    const result = await catalog.list({ page: 1, pageSize: 50 });
    allProducts.value = [...result.items];
  } catch (error) {
    allProducts.value = [];
    catalogError.value = error instanceof Error ? error.message : '商品目录暂时无法读取，请稍后重试';
  } finally {
    catalogLoading.value = false;
  }
}

async function loadSelectedProduct() {
  if (!selectedProduct.value) return;
  productDetailLoading.value = true;
  productDetailError.value = '';
  try {
    selectedProductDetail.value = toProductDetailView(await catalog.get(selectedProduct.value.id));
  } catch (error) {
    selectedProductDetail.value = null;
    productDetailError.value = error instanceof Error ? error.message : '商品详情暂时无法读取，请稍后重试';
  } finally {
    productDetailLoading.value = false;
  }
}

function openProduct(product: StorefrontProductSummary) {
  selectedProduct.value = product;
  selectedProductDetail.value = null;
  void loadSelectedProduct();
}

function onPageShow() {
  applySavedCategory();
  void refreshCatalog();
}

onShow(onPageShow);
</script>

<template>
  <view>
    <scroll-view scroll-y class="tab-page-scroll">
      <view class="page-shell">
        <view class="page-heading"><text class="eyebrow">DISCOVER</text><text class="page-title">分类</text></view>
        <scroll-view scroll-x class="category-tabs">
          <button v-for="tab in V12_CATEGORY_TABS" :key="tab.key" :class="{ active: activeCategory === tab.key }" @tap="activeCategory = tab.key">{{ tab.label }}</button>
        </scroll-view>
        <text class="category-note">从山野好物到当季滋味，慢慢挑一份喜欢的风物。</text>
        <view v-if="catalogLoading" class="catalog-state" aria-live="polite">正在读取后台已发布商品…</view>
        <view v-else-if="catalogError" class="catalog-state catalog-error" role="status"><text>{{ catalogError }}</text><button @tap="refreshCatalog">重试</button></view>
        <view v-else-if="products.length" class="products-grid">
          <ProductTile v-for="(product, index) in products" :key="product.id" :product="product" :tone="productTones[index % productTones.length]!" @select="openProduct" />
        </view>
        <view v-else class="catalog-empty"><text class="empty-title">这一类暂时没有已发布商品</text><text class="empty-copy">商品上架后会显示在这里，也可以切换其他分类看看。</text></view>
        <view class="bottom-space"></view>
      </view>
    </scroll-view>
    <ProductSheet v-if="selectedProduct" :product="selectedProduct" :detail="selectedProductDetail" :loading="productDetailLoading" :error="productDetailError" @close="selectedProduct = null" @retry="loadSelectedProduct" />
  </view>
</template>

<style scoped>
.page-shell { min-height: 100%; padding: 40rpx; background: var(--color-canvas); }
.page-heading { padding: 20rpx 0 30rpx; }
.eyebrow { display: block; color: var(--v19-copper); font-size: 20rpx; letter-spacing: 3rpx; }
.page-title { display: block; margin-top: 8rpx; color: var(--color-text-primary); font-size: 48rpx; font-weight: 600; }
.category-tabs { width: 100%; white-space: nowrap; border-bottom: 1px solid var(--color-border); }
.category-tabs button { min-height: 92rpx; margin: 0 36rpx 0 0; padding: 0; position: relative; display: inline-flex; align-items: center; border: 0; border-radius: 0; color: var(--color-text-secondary); background: transparent; font-size: 25rpx; transition: color var(--motion-quick) ease-out; }
.category-tabs button::after { border: 0; }
.category-tabs button.active { color: var(--color-brand); font-weight: 600; }
.category-tabs button.active::after { height: 4rpx; position: absolute; right: 0; bottom: -1px; left: 0; background: var(--v19-brand-900); content: ''; }
.category-note { display: block; margin: 26rpx 0 34rpx; color: var(--v19-muted); font-size: 22rpx; line-height: 36rpx; }
.products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5) var(--space-3); }
.catalog-state { min-height: 300rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: var(--color-text-secondary); font-size: var(--type-body); line-height: var(--leading-body); text-align: center; }
.catalog-state button { min-height: 64rpx; padding: 0 28rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); }
.catalog-error { color: var(--color-danger); }
.catalog-empty { min-height: 340rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-title { color: var(--color-text-primary); font-size: var(--type-title); font-weight: 600; }
.empty-copy { margin-top: var(--space-1); color: var(--color-text-secondary); font-size: var(--type-body); line-height: var(--leading-body); }
.preview-note { padding: 36rpx 0; color: var(--v19-muted); font-size: 20rpx; }
.bottom-space { height: 36rpx; }
</style>
