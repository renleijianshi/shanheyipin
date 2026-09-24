<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { adminRequest, formatMoney, getAdminData, isAdminPreviewSession, setAdminPreviewSession, type AdminProduct, type DashboardData, type PageResult } from './api';

type View = 'dashboard' | 'products' | 'categories';
type LoadState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; value: T | null; message: string };
const isDevelopmentPreview = import.meta.env.DEV;
const previewUsername = import.meta.env.VITE_ADMIN_PREVIEW_USER ?? '';
const previewPassword = import.meta.env.VITE_ADMIN_PREVIEW_PASSWORD ?? '';

const navigation: { id: View; label: string; mark: string }[] = [
  { id: 'dashboard', label: '经营概览', mark: '◇' },
  { id: 'products', label: '商品管理', mark: '▧' },
  { id: 'categories', label: '商品分类', mark: '▤' }
];
const view = ref<View>('dashboard');
const dashboard = ref<LoadState<DashboardData>>({ status: 'idle', value: null, message: '' });
const products = ref<LoadState<PageResult<AdminProduct>>>({ status: 'idle', value: null, message: '' });
const categories = ref<LoadState<readonly Category[]>>({ status: 'idle', value: null, message: '' });
const query = ref('');
const statusFilter = ref('ALL');
const editorOpen = ref(false);
const authenticated = ref(false);
const previewMode = ref(false);
const loginUsername = ref('');
const loginPassword = ref('');
const loginError = ref('');
const loginBusy = ref(false);
const adminPermissions = ref<ReadonlySet<string>>(new Set());
const editingProductId = ref<string | null>(null);
const savingProduct = ref(false);
const productError = ref('');
const productDraft = ref({ name: '', subtitle: '', categoryId: '', productType: 'STANDARD' as 'STANDARD' | 'BUNDLE', content: '', origin: '', sortOrder: 0, status: 'DRAFT' as AdminProduct['status'], mediaText: '', tagsText: '' });
const categoryEditorOpen = ref(false);
const editingCategoryId = ref<string | null>(null);
const categoryError = ref('');
const categoryDraft = ref({ parentId: '', code: '', name: '', sortOrder: 0, status: 'ENABLED' as 'ENABLED' | 'DISABLED' });
const skuDrawerOpen = ref(false);
const skuProduct = ref<AdminProduct | null>(null);
const skuRows = ref<LoadState<PageResult<AdminSku>>>({ status: 'idle', value: null, message: '' });
const skuEditingId = ref<string | null>(null);
const skuError = ref('');
const skuDraft = ref({ skuCode: '', skuName: '', salePriceYuan: '', marketPriceYuan: '', weightGram: 500, barcode: '', saleStatus: 'DRAFT' as AdminSku['saleStatus'], specsText: '' });
const lastUpdated = ref('尚未读取');

interface Category { readonly id: string; readonly parentId: string | null; readonly code: string; readonly name: string; readonly status: 'ENABLED' | 'DISABLED'; readonly sortOrder: number }
interface AdminSku { readonly id: string; readonly productId: string; readonly skuCode: string; readonly skuName: string; readonly salePriceCent: number; readonly marketPriceCent: number | null; readonly weightGram: number; readonly barcode: string | null; readonly saleStatus: 'DRAFT' | 'ON_SALE' | 'OFF_SALE'; readonly specs: readonly { readonly name: string; readonly value: string }[] }
const filteredProducts = computed(() => {
  const rows = products.value.value?.items ?? [];
  return rows.filter(product => {
    const matchesText = `${product.name} ${product.publicId} ${product.origin ?? ''}`.toLowerCase().includes(query.value.trim().toLowerCase());
    return matchesText && (statusFilter.value === 'ALL' || product.status === statusFilter.value);
  });
});
const metrics = computed(() => {
  const data = dashboard.value.value;
  return [
    { label: '今日销售额', value: data?.todaySalesCent === undefined ? '—' : formatMoney(data.todaySalesCent), suffix: '支付成功订单' },
    { label: '今日订单', value: data?.todayOrders === undefined ? '—' : data.todayOrders.toLocaleString('zh-CN'), suffix: '今日创建' },
    { label: '待发货', value: data?.pendingShipments === undefined ? '—' : data.pendingShipments.toLocaleString('zh-CN'), suffix: '等待履约' },
    { label: '售后待处理', value: data?.aftersales === undefined ? '—' : data.aftersales.toLocaleString('zh-CN'), suffix: '需要跟进' },
    { label: '库存提醒', value: data?.inventoryAlerts === undefined ? '—' : data.inventoryAlerts.toLocaleString('zh-CN'), suffix: '低库存或异常' }
  ];
});
const canWriteProducts = computed(() => adminPermissions.value.has('*') || adminPermissions.value.has('catalog.product.write'));
const canWriteCategories = computed(() => adminPermissions.value.has('*') || adminPermissions.value.has('catalog.category.write'));

async function loadDashboard() {
  dashboard.value = { ...dashboard.value, status: 'loading', message: '' };
  try { dashboard.value = { status: 'ready', value: await getAdminData<DashboardData>('dashboard'), message: '' }; lastUpdated.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
  catch (error) { dashboard.value = { status: 'error', value: null, message: error instanceof Error ? error.message : '工作台数据暂时无法读取' }; }
}
async function loadProducts() {
  products.value = { ...products.value, status: 'loading', message: '' };
  try { products.value = { status: 'ready', value: await getAdminData<PageResult<AdminProduct>>('products?page=1&pageSize=50'), message: '' }; lastUpdated.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
  catch (error) { products.value = { status: 'error', value: null, message: error instanceof Error ? error.message : '商品列表暂时无法读取' }; }
}
async function loadCategories() {
  categories.value = { ...categories.value, status: 'loading', message: '' };
  try { categories.value = { status: 'ready', value: await getAdminData<readonly Category[]>('categories'), message: '' }; lastUpdated.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
  catch (error) { categories.value = { status: 'error', value: null, message: error instanceof Error ? error.message : '分类列表暂时无法读取' }; }
}
function reload() { if (view.value === 'dashboard') void loadDashboard(); else if (view.value === 'products') void loadProducts(); else void loadCategories(); }
function selectView(next: View) { view.value = next; }
function statusName(status: AdminProduct['status']) { return status === 'ON_SALE' ? '在售' : status === 'OFF_SALE' ? '已下架' : '草稿'; }
async function openEditor(product?: AdminProduct) {
  if (categories.value.status !== 'ready') await loadCategories();
  editingProductId.value = product?.id ?? null;
  productError.value = '';
  productDraft.value = product ? {
    name: product.name, subtitle: product.subtitle ?? '', categoryId: product.categoryId,
    productType: product.productType, content: product.content, origin: product.origin ?? '',
    sortOrder: product.sortOrder, status: product.status,
    mediaText: product.media.map(item => item.objectKey).join('\n'), tagsText: product.tags.join('、')
  } : { name: '', subtitle: '', categoryId: categories.value.value?.[0]?.id ?? '', productType: 'STANDARD', content: '', origin: '', sortOrder: 0, status: 'DRAFT', mediaText: '', tagsText: '' };
  editorOpen.value = true;
}
async function saveProduct() {
  savingProduct.value = true; productError.value = '';
  const body = {
    categoryId: productDraft.value.categoryId, name: productDraft.value.name, subtitle: productDraft.value.subtitle || null,
    productType: productDraft.value.productType, content: productDraft.value.content, origin: productDraft.value.origin || null,
    sortOrder: Number(productDraft.value.sortOrder), status: productDraft.value.status,
    media: productDraft.value.mediaText.split(/\n+/).map(key => key.trim()).filter(Boolean).map((objectKey, sortOrder) => ({ type: /\.(?:mp4|webm)$/i.test(objectKey) ? 'VIDEO' : 'IMAGE', objectKey, altText: productDraft.value.name, sortOrder })),
    tags: productDraft.value.tagsText.split(/[、,，]/).map(tag => tag.trim()).filter(Boolean)
  };
  try {
    await adminRequest(editingProductId.value ? `products/${editingProductId.value}` : 'products', {
      method: editingProductId.value ? 'PUT' : 'POST', body: JSON.stringify(body)
    });
    editorOpen.value = false; await loadProducts();
  } catch (error) { productError.value = error instanceof Error ? error.message : '商品保存失败'; }
  finally { savingProduct.value = false; }
}
async function toggleProduct(product: AdminProduct) {
  const nextStatus = product.status === 'ON_SALE' ? 'OFF_SALE' : 'ON_SALE';
  try {
    await adminRequest(`products/${product.id}`, { method: 'PUT', body: JSON.stringify({ ...product, status: nextStatus }) });
    await loadProducts();
  } catch (error) { window.alert(error instanceof Error ? error.message : '商品状态更新失败'); }
}
function openCategoryEditor(category?: Category) {
  editingCategoryId.value = category?.id ?? null; categoryError.value = '';
  categoryDraft.value = category ? { parentId: category.parentId ?? '', code: category.code, name: category.name, sortOrder: category.sortOrder, status: category.status }
    : { parentId: '', code: '', name: '', sortOrder: 0, status: 'ENABLED' };
  categoryEditorOpen.value = true;
}
async function saveCategory() {
  categoryError.value = '';
  try {
    const method = editingCategoryId.value ? 'PUT' : 'POST';
    const path = editingCategoryId.value ? `categories/${editingCategoryId.value}` : 'categories';
    await adminRequest(path, { method, body: JSON.stringify({ ...categoryDraft.value, parentId: categoryDraft.value.parentId || null, sortOrder: Number(categoryDraft.value.sortOrder) }) });
    categoryEditorOpen.value = false; await loadCategories();
  } catch (error) { categoryError.value = error instanceof Error ? error.message : '分类保存失败'; }
}
async function toggleCategory(category: Category) {
  try { await adminRequest(`categories/${category.id}`, { method: 'PUT', body: JSON.stringify({ ...category, status: category.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' }) }); await loadCategories(); }
  catch (error) { window.alert(error instanceof Error ? error.message : '分类状态更新失败'); }
}
async function deleteCategory(category: Category) {
  if (!window.confirm(`确定删除分类“${category.name}”吗？`)) return;
  try { await adminRequest(`categories/${category.id}`, { method: 'DELETE' }); await loadCategories(); }
  catch (error) { window.alert(error instanceof Error ? error.message : '分类删除失败'); }
}
async function openSkuManager(product: AdminProduct) {
  skuProduct.value = product; skuDrawerOpen.value = true; skuEditingId.value = null; skuError.value = '';
  await loadSkus();
}
async function loadSkus() {
  if (!skuProduct.value) return;
  skuRows.value = { ...skuRows.value, status: 'loading', message: '' };
  try { skuRows.value = { status: 'ready', value: await getAdminData<PageResult<AdminSku>>(`products/${skuProduct.value.id}/skus?page=1&pageSize=100`), message: '' }; }
  catch (error) { skuRows.value = { status: 'error', value: null, message: error instanceof Error ? error.message : '规格读取失败' }; }
}
function editSku(sku?: AdminSku) {
  skuEditingId.value = sku?.id ?? null; skuError.value = '';
  skuDraft.value = sku ? {
    skuCode: sku.skuCode, skuName: sku.skuName, salePriceYuan: (sku.salePriceCent / 100).toFixed(2),
    marketPriceYuan: sku.marketPriceCent === null ? '' : (sku.marketPriceCent / 100).toFixed(2), weightGram: sku.weightGram,
    barcode: sku.barcode ?? '', saleStatus: sku.saleStatus, specsText: sku.specs.map(spec => `${spec.name}=${spec.value}`).join('、')
  } : { skuCode: '', skuName: '', salePriceYuan: '', marketPriceYuan: '', weightGram: 500, barcode: '', saleStatus: 'DRAFT', specsText: '' };
}
function toCent(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) throw new Error('请填写有效价格，最多保留两位小数');
  const [yuan = '', fraction = ''] = value.trim().split('.');
  const amount = Number(yuan) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount)) throw new Error('商品价格超出允许范围');
  return amount;
}
async function saveSku() {
  if (!skuProduct.value) return;
  skuError.value = '';
  try {
    const specs = skuDraft.value.specsText.split(/[、,，]/).map(item => item.trim()).filter(Boolean).map(item => {
      const [name, ...rest] = item.split('=');
      if (!name || !rest.length) throw new Error('规格请按“名称=值”填写，例如“净含量=500克”');
      return { name: name.trim(), value: rest.join('=').trim() };
    });
    const body = { productId: skuProduct.value.id, skuCode: skuDraft.value.skuCode, skuName: skuDraft.value.skuName, salePriceCent: toCent(skuDraft.value.salePriceYuan), marketPriceCent: skuDraft.value.marketPriceYuan ? toCent(skuDraft.value.marketPriceYuan) : null, weightGram: Number(skuDraft.value.weightGram), barcode: skuDraft.value.barcode || null, saleStatus: skuDraft.value.saleStatus, presaleEnabled: false, specs };
    await adminRequest(skuEditingId.value ? `skus/${skuEditingId.value}` : `products/${skuProduct.value.id}/skus`, { method: skuEditingId.value ? 'PUT' : 'POST', body: JSON.stringify(body) });
    editSku(); await loadSkus();
  } catch (error) { skuError.value = error instanceof Error ? error.message : '规格保存失败'; }
}
async function login() {
  loginBusy.value = true; loginError.value = '';
  try {
    if (isDevelopmentPreview && previewUsername && previewPassword && loginUsername.value === previewUsername && loginPassword.value === previewPassword) {
      setAdminPreviewSession(true);
      previewMode.value = true;
      adminPermissions.value = new Set(['dashboard.read', 'catalog.product.read', 'catalog.category.read']);
      loginPassword.value = ''; authenticated.value = true; await loadDashboard();
      return;
    }
    const result = await adminRequest<{ accessToken: string }>('auth/login', { method: 'POST', body: JSON.stringify({ username: loginUsername.value, password: loginPassword.value }) });
    sessionStorage.setItem('shanhe.admin.accessToken', result.accessToken);
    const identity = await adminRequest<{ permissions: string[] }>('auth/me', { method: 'GET' });
    previewMode.value = false; adminPermissions.value = new Set(identity.permissions); loginPassword.value = ''; authenticated.value = true; await loadDashboard();
  } catch (error) { loginError.value = error instanceof Error ? error.message : '登录失败'; }
  finally { loginBusy.value = false; }
}
async function logout() {
  if (!previewMode.value) {
    try { await adminRequest('auth/logout', { method: 'POST' }); } catch { /* expire the local session even if the API is unavailable */ }
  }
  setAdminPreviewSession(false); sessionStorage.removeItem('shanhe.admin.accessToken'); adminPermissions.value = new Set(); authenticated.value = false; previewMode.value = false;
}
onMounted(async () => {
  if (isAdminPreviewSession()) {
    previewMode.value = true; adminPermissions.value = new Set(['dashboard.read', 'catalog.product.read', 'catalog.category.read']); authenticated.value = true; await loadDashboard(); return;
  }
  const token = sessionStorage.getItem('shanhe.admin.accessToken');
  if (!token) return;
  try { const identity = await getAdminData<{ permissions: string[] }>('auth/me'); adminPermissions.value = new Set(identity.permissions); authenticated.value = true; await loadDashboard(); }
  catch { sessionStorage.removeItem('shanhe.admin.accessToken'); }
});
watch(view, reload);
</script>

<template>
  <div v-if="!authenticated" class="login-screen"><form class="login-card" @submit.prevent="login"><span class="brand-seal">禾</span><span class="overline">SHANHE · ADMIN</span><h1>运营管理中心</h1><p>使用已开通的管理账号登录</p><div v-if="isDevelopmentPreview && previewUsername && previewPassword" class="preview-login-hint">本机只读预览：<strong>{{ previewUsername }}</strong> / <strong>{{ previewPassword }}</strong></div><label>账号<input v-model="loginUsername" autocomplete="username" required /></label><label>密码<input v-model="loginPassword" type="password" autocomplete="current-password" required /></label><div v-if="loginError" class="form-error" role="alert">{{ loginError }}</div><button class="primary-button" :disabled="loginBusy">{{ loginBusy ? '正在登录…' : '登录管理后台' }}</button></form></div>
  <div v-else class="admin-app">
    <aside class="sidebar">
      <a class="brand" href="#/" aria-label="山禾颐品运营管理首页">
        <span class="brand-seal">禾</span><span class="brand-copy"><strong>山禾颐品</strong><small>运营管理中心</small></span>
      </a>
      <div class="side-caption">工作空间</div>
      <nav class="main-nav" aria-label="主导航">
        <button v-for="item in navigation" :key="item.id" :class="{ active: view === item.id }" :aria-current="view === item.id ? 'page' : false" @click="selectView(item.id)"><span class="nav-mark">{{ item.mark }}</span>{{ item.label }}<span v-if="view === item.id" class="nav-current"></span></button>
      </nav>
      <div class="sidebar-bottom"><span class="online-dot"></span><span>管理服务</span><strong>已授权</strong></div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="breadcrumbs"><span>管理后台</span><span class="crumb-sep">/</span><strong>{{ navigation.find(item => item.id === view)?.label }}</strong></div>
      <div class="top-actions"><span class="refresh-time">更新于 {{ lastUpdated }}</span><button class="icon-action" aria-label="刷新当前页面" @click="reload">↻</button><button class="user-avatar" aria-label="退出管理后台" title="退出登录" @click="logout">管</button></div>
      </header>

      <section class="page-content">
        <div v-if="previewMode" class="preview-banner" role="status"><span>只读预览</span><p>当前使用演示数据浏览界面，不会读取或更改真实商品、订单或库存。</p><button @click="logout">退出预览</button></div>
        <div v-if="dashboard.status === 'error'" class="connection-notice" role="status"><span class="notice-icon">!</span><div><strong>经营概览读取失败</strong><p>{{ dashboard.message }}</p></div><button @click="reload">重新检查 <span>↗</span></button></div>

        <template v-if="view === 'dashboard'">
          <div class="page-heading"><div><span class="overline">SHANHE · OPERATIONS</span><h1>经营概览</h1><p>今日需要关注的订单、商品和供应情况。</p></div><span class="date-chip">{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</span></div>

          <section class="metric-grid" aria-label="核心经营指标">
            <article v-for="(metric, index) in metrics" :key="metric.label" class="metric-card" :class="{ 'metric-main': index === 0 }"><div class="metric-label"><span class="metric-index">0{{ index + 1 }}</span>{{ metric.label }}</div><strong>{{ dashboard.status === 'loading' ? '…' : metric.value }}</strong><small>{{ dashboard.status === 'ready' ? metric.suffix : '等待后台数据' }}</small></article>
          </section>

          <div class="overview-grid">
            <section class="panel trend-panel"><div class="panel-heading"><div><span class="overline">BUSINESS PULSE</span><h2>经营趋势</h2></div><span class="panel-period">近 7 天</span></div><div class="chart-empty"><div class="chart-lines"><i></i><i></i><i></i><i></i></div><div class="chart-center"><span class="chart-mark">山</span><strong>等待经营数据</strong><small>接入报表 API 后显示销售与订单趋势</small></div></div><div class="chart-axis"><span>周一</span><span>周三</span><span>周五</span><span>周日</span></div></section>
            <section class="panel attention-panel"><div class="panel-heading"><div><span class="overline">NEEDS ATTENTION</span><h2>待处理事项</h2></div><span class="quiet-count">—</span></div><div class="attention-empty"><span class="attention-rule"></span><div><strong>提醒数据尚未接入</strong><p>待发货、售后与库存预警将在后台服务连接后汇总在这里。</p></div></div><div class="attention-footer"><span class="tiny-dot"></span>目前没有可核实的运营提醒</div></section>
          </div>

          <section class="panel quick-panel"><div class="panel-heading"><div><span class="overline">DAILY WORK</span><h2>常用工作</h2></div></div><div class="quick-links"><button @click="selectView('products')"><span>商品资料</span><small>查看商品档案与状态</small><b>→</b></button><button @click="selectView('categories')"><span>商品分类</span><small>检查前台分类结构</small><b>→</b></button><div class="quick-disabled"><span>订单履约</span><small>订单管理接口待接入</small><b>·</b></div></div></section>
          <div v-if="dashboard.status === 'error'" class="service-message"><strong>{{ dashboard.message }}</strong><span>配置管理 API 后可以读取真实指标。</span></div>
        </template>

        <template v-else-if="view === 'products'">
          <div class="page-heading"><div><span class="overline">CATALOG · PRODUCTS</span><h1>商品管理</h1><p>维护商品资料与前台展示状态。</p></div><button v-if="canWriteProducts" class="primary-button" title="新增商品" @click="() => openEditor()"><span>＋</span> 新增商品</button></div>
          <section class="panel table-panel"><div class="table-toolbar"><div class="table-title"><h2>商品档案</h2><span class="result-count">{{ products.value?.total ?? '—' }} 条</span></div><div class="filters"><label class="search-field"><span>⌕</span><input v-model="query" type="search" placeholder="搜索商品名称或编号" :disabled="products.status !== 'ready'" /></label><select v-model="statusFilter" aria-label="商品状态筛选" :disabled="products.status !== 'ready'"><option value="ALL">全部状态</option><option value="ON_SALE">在售</option><option value="OFF_SALE">已下架</option><option value="DRAFT">草稿</option></select></div></div>
            <div class="table-scroll"><table><thead><tr><th>商品</th><th>商品编号</th><th>分类编号</th><th>产地</th><th>状态</th><th>类型</th><th>操作</th></tr></thead><tbody v-if="products.status === 'ready' && filteredProducts.length"><tr v-for="product in filteredProducts" :key="product.id"><td><span class="product-cell"><span class="product-thumb">{{ product.media.length ? '图' : '禾' }}</span><span><strong>{{ product.name }}</strong><small>{{ product.subtitle || '暂无副标题' }}</small></span></span></td><td class="mono">{{ product.publicId }}</td><td>{{ product.categoryId }}</td><td>{{ product.origin || '—' }}</td><td><span class="status-tag" :class="product.status.toLowerCase()">{{ statusName(product.status) }}</span></td><td>{{ product.productType === 'BUNDLE' ? '组合商品' : '标准商品' }}</td><td class="row-actions"><template v-if="canWriteProducts"><button class="text-button" @click="openEditor(product)">编辑</button><button class="text-button" @click="openSkuManager(product)">规格/价格</button><button class="text-button" @click="toggleProduct(product)">{{ product.status === 'ON_SALE' ? '下架' : '上架' }}</button></template><span v-else>只读</span></td></tr></tbody></table></div>
            <div v-if="products.status === 'loading'" class="table-state"><span class="state-spinner"></span><strong>正在读取商品档案</strong><small>连接管理 API…</small></div>
            <div v-else-if="products.status === 'error'" class="table-state error-state"><span class="state-mark">!</span><strong>{{ products.message }}</strong><small>商品数据不会用演示内容代替。</small><button class="text-button" @click="loadProducts">再试一次</button></div>
            <div v-else-if="products.status === 'ready' && !filteredProducts.length" class="table-state"><span class="state-mark">禾</span><strong>{{ query ? '没有匹配的商品' : '目前没有商品记录' }}</strong><small>{{ query ? '请调整关键词或筛选条件。' : '创建商品档案后会显示在这里。' }}</small></div>
            <footer v-if="products.status === 'ready'" class="table-footer"><span>当前显示 {{ filteredProducts.length }} / {{ products.value?.total ?? 0 }} 条</span><button class="pagination-button" disabled>上一页</button><span class="page-number">1</span><button class="pagination-button" disabled>下一页</button></footer>
          </section>
        </template>

        <template v-else>
          <div class="page-heading"><div><span class="overline">CATALOG · STRUCTURE</span><h1>商品分类</h1><p>维护小程序前台共用的商品分类。</p></div><button v-if="canWriteCategories" class="primary-button" @click="openCategoryEditor()"><span>＋</span> 新增分类</button></div>
          <section class="panel table-panel"><div class="table-toolbar"><div class="table-title"><h2>分类目录</h2><span class="result-count">{{ categories.value?.length ?? '—' }} 项</span></div></div><div class="category-list"><div v-for="category in categories.value ?? []" :key="category.id" class="category-row"><span class="category-symbol">禾</span><div><strong>{{ category.name }}</strong><small>{{ category.code }} · 排序 {{ category.sortOrder }}</small></div><span class="status-tag" :class="category.status.toLowerCase()">{{ category.status === 'ENABLED' ? '启用' : '停用' }}</span><div v-if="canWriteCategories" class="row-actions"><button class="text-button" @click="openCategoryEditor(category)">编辑</button><button class="text-button" @click="toggleCategory(category)">{{ category.status === 'ENABLED' ? '停用' : '启用' }}</button><button class="text-button danger-text" @click="deleteCategory(category)">删除</button></div><span v-else>只读</span></div></div><div v-if="categories.status === 'loading'" class="table-state"><span class="state-spinner"></span><strong>正在读取分类</strong></div><div v-else-if="categories.status === 'error'" class="table-state error-state"><span class="state-mark">!</span><strong>{{ categories.message }}</strong><small>分类数据不会用演示内容代替。</small><button class="text-button" @click="loadCategories">再试一次</button></div><div v-else-if="categories.status === 'ready' && !categories.value?.length" class="table-state"><span class="state-mark">禾</span><strong>目前没有分类记录</strong><small>新增分类后，小程序会读取启用的分类。</small></div></section>
        </template>
      </section>
      <footer class="workspace-footer"><span>山禾颐品 · 运营管理</span><span>数据由管理 API 实时读取</span></footer>
    </main>

    <div v-if="editorOpen" class="drawer-mask" @click.self="editorOpen = false"><form class="editor-drawer" @submit.prevent="saveProduct"><header><div><span class="overline">PRODUCT INFORMATION</span><h2 id="editor-title">{{ editingProductId ? '编辑商品' : '新增商品' }}</h2></div><button type="button" class="icon-action" aria-label="关闭" @click="editorOpen = false">×</button></header><div class="form-section"><h3>基础信息</h3><label>商品名称<input v-model="productDraft.name" required maxlength="100" placeholder="请输入商品名称" /></label><label>副标题<input v-model="productDraft.subtitle" maxlength="200" placeholder="一句话说明商品特点" /></label><div class="form-columns"><label>商品分类<select v-model="productDraft.categoryId" required><option value="" disabled>请选择分类</option><option v-for="category in categories.value ?? []" :key="category.id" :value="category.id">{{ category.name }}</option></select></label><label>商品类型<select v-model="productDraft.productType"><option value="STANDARD">标准商品</option><option value="BUNDLE">组合商品</option></select></label></div><label>商品状态<select v-model="productDraft.status"><option value="DRAFT">草稿</option><option value="OFF_SALE">已下架</option><option value="ON_SALE">在售</option></select></label></div><div class="form-section"><h3>商品内容</h3><label>产地<input v-model="productDraft.origin" placeholder="如：甘肃舟曲" /></label><label>素材对象键（每行一项）<textarea v-model="productDraft.mediaText" rows="4" placeholder="products/zhouqu-diaoshi/cover.webp"></textarea><small>媒体上传和素材库尚未接入；编辑时请保留现有对象键，支持图片与视频。</small></label><label>商品介绍<textarea v-model="productDraft.content" required placeholder="介绍原料、风味与工艺" rows="5"></textarea></label><label>标签<input v-model="productDraft.tagsText" placeholder="用顿号分隔，如：柿饼、送礼" /></label><label>排序<input v-model.number="productDraft.sortOrder" type="number" min="0" /></label></div><div v-if="productError" class="form-error" role="alert">{{ productError }}</div><footer><button type="button" class="secondary-button" @click="editorOpen = false">取消</button><button class="primary-button" :disabled="savingProduct">{{ savingProduct ? '保存中…' : '保存商品' }}</button></footer></form></div>
    <div v-if="categoryEditorOpen" class="drawer-mask" @click.self="categoryEditorOpen = false"><form class="editor-drawer compact-drawer" @submit.prevent="saveCategory"><header><div><span class="overline">CATEGORY STRUCTURE</span><h2>{{ editingCategoryId ? '编辑分类' : '新增分类' }}</h2></div><button type="button" class="icon-action" aria-label="关闭" @click="categoryEditorOpen = false">×</button></header><div class="form-section"><label>分类名称<input v-model="categoryDraft.name" required maxlength="50" /></label><label>分类编码<input v-model="categoryDraft.code" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxlength="64" placeholder="如: dried-fruit" /></label><label>上级分类<select v-model="categoryDraft.parentId"><option value="">顶级分类</option><option v-for="category in categories.value ?? []" :key="category.id" :value="category.id" :disabled="category.id === editingCategoryId">{{ category.name }}</option></select></label><div class="form-columns"><label>排序<input v-model.number="categoryDraft.sortOrder" type="number" min="0" /></label><label>状态<select v-model="categoryDraft.status"><option value="ENABLED">启用</option><option value="DISABLED">停用</option></select></label></div></div><div v-if="categoryError" class="form-error" role="alert">{{ categoryError }}</div><footer><button type="button" class="secondary-button" @click="categoryEditorOpen = false">取消</button><button class="primary-button">保存分类</button></footer></form></div>
    <div v-if="skuDrawerOpen" class="drawer-mask" @click.self="skuDrawerOpen = false"><section class="editor-drawer compact-drawer"><header><div><span class="overline">SKU · PRICE · SPECIFICATION</span><h2>{{ skuProduct?.name }} · 规格与价格</h2></div><button class="icon-action" aria-label="关闭" @click="skuDrawerOpen = false">×</button></header><div class="sku-list"><div v-for="sku in skuRows.value?.items ?? []" :key="sku.id" class="sku-row"><div><strong>{{ sku.skuName }}</strong><small>{{ sku.skuCode }} · {{ sku.specs.map(spec => `${spec.name} ${spec.value}`).join(' / ') || '无规格' }}</small></div><b>¥{{ (sku.salePriceCent / 100).toFixed(2) }}</b><span class="status-tag" :class="sku.saleStatus.toLowerCase()">{{ sku.saleStatus === 'ON_SALE' ? '在售' : sku.saleStatus === 'OFF_SALE' ? '已下架' : '草稿' }}</span><button class="text-button" @click="editSku(sku)">编辑</button></div><div v-if="skuRows.status === 'loading' || skuRows.status === 'error'" class="table-state"><strong>{{ skuRows.status === 'loading' ? '正在读取规格' : skuRows.message }}</strong><button v-if="skuRows.status === 'error'" class="text-button" @click="loadSkus">重试</button></div><div v-else-if="!skuRows.value?.items.length" class="table-state"><strong>还没有规格</strong><small>添加 SKU 后设置售价与销售状态。</small></div></div><form class="form-section" @submit.prevent="saveSku"><h3>{{ skuEditingId ? '编辑规格' : '新增规格' }}</h3><label>SKU 编码<input v-model="skuDraft.skuCode" required maxlength="64" placeholder="例如 DIAOSHI-500G" /></label><label>规格名称<input v-model="skuDraft.skuName" required maxlength="100" placeholder="例如 500 克装" /></label><div class="form-columns"><label>售价（元）<input v-model="skuDraft.salePriceYuan" required inputmode="decimal" placeholder="如 39.90" /></label><label>市场价（元）<input v-model="skuDraft.marketPriceYuan" inputmode="decimal" placeholder="可不填" /></label></div><div class="form-columns"><label>重量（克）<input v-model.number="skuDraft.weightGram" type="number" min="1" required /></label><label>条码<input v-model="skuDraft.barcode" inputmode="numeric" placeholder="可不填" /></label></div><label>规格项<input v-model="skuDraft.specsText" placeholder="净含量=500克、包装=礼盒" /><small>多项用顿号分隔，每项用等号连接名称和值。</small></label><label>销售状态<select v-model="skuDraft.saleStatus"><option value="DRAFT">草稿</option><option value="OFF_SALE">已下架</option><option value="ON_SALE">在售</option></select></label><div v-if="skuError" class="form-error" role="alert">{{ skuError }}</div><footer><button class="primary-button">{{ skuEditingId ? '保存规格' : '新增 SKU' }}</button></footer></form></section></div>
  </div>
</template>
