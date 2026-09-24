<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { adminRequest, formatMoney, getAdminData, isAdminPreviewSession, setAdminPreviewSession, type AdminProduct, type DashboardData, type PageResult } from './api';
import { serializeProductsCsv } from './product-csv';
import StoriesWorkspace from './components/StoriesWorkspace.vue';

type View = 'dashboard' | 'products' | 'categories' | 'stories';
type LoadState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; value: T | null; message: string };
const isDevelopmentPreview = import.meta.env.DEV && import.meta.env.VITE_INTERNAL_TEST !== 'true';
const previewUsername = import.meta.env.VITE_ADMIN_PREVIEW_USER ?? '';
const previewPassword = import.meta.env.VITE_ADMIN_PREVIEW_PASSWORD ?? '';

const navigation: { id: View; label: string; mark: string }[] = [
  { id: 'dashboard', label: '经营概览', mark: '◇' },
  { id: 'products', label: '商品管理', mark: '▧' },
  { id: 'categories', label: '商品分类', mark: '▤' },
  { id: 'stories', label: '山野志', mark: '▥' }
];
const visibleNavigation = computed(() => navigation.filter(item => item.id !== 'stories' || canReadStories.value));
const view = ref<View>('dashboard');
const storiesRefreshKey = ref(0);
const dashboard = ref<LoadState<DashboardData>>({ status: 'idle', value: null, message: '' });
const products = ref<LoadState<PageResult<AdminProduct>>>({ status: 'idle', value: null, message: '' });
const categories = ref<LoadState<readonly Category[]>>({ status: 'idle', value: null, message: '' });
const query = ref('');
const statusFilter = ref('ALL');
const showArchived = ref(false);
const productPage = ref(1);
const exporting = ref(false);
const uploading = ref(false);
const savingSku = ref(false);
const feedback = ref('');
const mediaKeys = computed(() => productDraft.value.mediaText.split(/\n+/).map(key => key.trim()).filter(Boolean));
const internalTest = import.meta.env.VITE_INTERNAL_TEST === 'true';
let productRequest = 0;
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
const canReadStories = computed(() => adminPermissions.value.has('*') || adminPermissions.value.has('content.story.read'));

async function loadDashboard() {
  dashboard.value = { ...dashboard.value, status: 'loading', message: '' };
  try { dashboard.value = { status: 'ready', value: await getAdminData<DashboardData>('dashboard'), message: '' }; lastUpdated.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
  catch (error) { dashboard.value = { status: 'error', value: null, message: error instanceof Error ? error.message : '工作台数据暂时无法读取' }; }
}
async function loadProducts() {
  const request = ++productRequest;
  products.value = { ...products.value, status: 'loading', message: '' };
  try {
    const result = await getAdminData<PageResult<AdminProduct>>(`products?${productQuery(productPage.value, 20)}`);
    if (request !== productRequest) return;
    products.value = { status: 'ready', value: result, message: '' };
    lastUpdated.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (categories.value.status === 'idle') await loadCategories();
  } catch (error) { if (request === productRequest) products.value = { status: 'error', value: null, message: error instanceof Error ? error.message : '商品列表暂时无法读取' }; }
}
function productQuery(page: number, pageSize: number) {
  return new URLSearchParams({ page: String(page), pageSize: String(pageSize), keyword: query.value.trim(), archived: String(showArchived.value), ...(statusFilter.value !== 'ALL' ? { status: statusFilter.value } : {}) });
}
function mediaUrl(key?: string) { return key && /^products\/[A-Za-z0-9/_-]+\.(png|jpe?g|webp|avif)$/.test(key) ? `/media/${key}` : ''; }
function categoryName(id: string) { return categories.value.value?.find(category => category.id === id)?.name ?? '—'; }
function notify(message: string) { feedback.value = message; }
async function archiveProduct(product: AdminProduct) {
  if (!product.archivedAt && !window.confirm(`将“${product.name}”移入回收站？商品将立即下架，资料与历史订单会保留。`)) return;
  try {
    await adminRequest(`products/${product.id}${product.archivedAt ? '/restore' : ''}`, { method: product.archivedAt ? 'POST' : 'DELETE' });
    notify(product.archivedAt ? '商品已恢复为下架状态，可编辑后重新上架。' : '商品已移入回收站，可随时恢复。');
    await loadProducts();
  } catch (error) { notify(error instanceof Error ? error.message : '操作失败，请重试'); }
}
async function exportProducts() {
  exporting.value = true;
  try {
    const rows: AdminProduct[] = [];
    for (let page = 1; ; page++) {
      const result = await getAdminData<PageResult<AdminProduct>>(`products?${productQuery(page, 100)}`);
      rows.push(...result.items);
      if (rows.length >= result.total || result.items.length === 0) break;
    }
    const csv = serializeProductsCsv(rows.map(row => ({ publicId: row.publicId, name: row.name, category: categoryName(row.categoryId), origin: row.origin ?? '', status: row.archivedAt ? '已归档' : statusName(row.status), coverObjectKey: row.media[0]?.objectKey ?? '' })));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `山禾商品清单-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); notify(`已下载 ${rows.length} 条商品记录。`);
  } catch (error) { notify(error instanceof Error ? error.message : '下载失败，请重试'); }
  finally { exporting.value = false; }
}
async function uploadImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  uploading.value = true; productError.value = '';
  try {
    if (files.length + mediaKeys.value.length > 20) throw new Error('最多添加 20 张图片');
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) throw new Error('每张图片不能超过 5 MB');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = () => reject(new Error('图片读取失败')); reader.readAsDataURL(file);
      });
      const result = await adminRequest<{ objectKey: string }>('media', { method: 'POST', body: JSON.stringify({ base64 }) });
      productDraft.value.mediaText = [...mediaKeys.value, result.objectKey].join('\n');
    }
  } catch (error) { productError.value = error instanceof Error ? error.message : '图片上传失败'; }
  finally { uploading.value = false; input.value = ''; }
}
function moveImage(index: number, target: number) {
  const keys = [...mediaKeys.value]; const [key] = keys.splice(index, 1); if (!key) return;
  keys.splice(target, 0, key); productDraft.value.mediaText = keys.join('\n');
}
function removeImage(index: number) { productDraft.value.mediaText = mediaKeys.value.filter((_, i) => i !== index).join('\n'); }
async function loadCategories() {
  categories.value = { ...categories.value, status: 'loading', message: '' };
  try { categories.value = { status: 'ready', value: await getAdminData<readonly Category[]>('categories'), message: '' }; lastUpdated.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
  catch (error) { categories.value = { status: 'error', value: null, message: error instanceof Error ? error.message : '分类列表暂时无法读取' }; }
}
function reload() { if (view.value === 'dashboard') void loadDashboard(); else if (view.value === 'products') void loadProducts(); else if (view.value === 'categories') void loadCategories(); else storiesRefreshKey.value++; }
function selectView(next: View) { if (next === 'stories' && !canReadStories.value) return; view.value = next; }
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
    editorOpen.value = false; notify('商品已保存。上架且有在售规格时，前台即可查看。'); await loadProducts();
  } catch (error) { productError.value = error instanceof Error ? error.message : '商品保存失败'; }
  finally { savingProduct.value = false; }
}
async function toggleProduct(product: AdminProduct) {
  const nextStatus = product.status === 'ON_SALE' ? 'OFF_SALE' : 'ON_SALE';
  try {
    await adminRequest(`products/${product.id}`, { method: 'PUT', body: JSON.stringify({ ...product, status: nextStatus }) });
    notify(nextStatus === 'ON_SALE' ? '商品已上架；请确认至少有一个在售规格。' : '商品已下架，前台刷新后不再展示。');
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
  editSku();
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
  if (!skuProduct.value || savingSku.value) return;
  savingSku.value = true;
  skuError.value = '';
  try {
    const specs = skuDraft.value.specsText.split(/[、,，]/).map(item => item.trim()).filter(Boolean).map(item => {
      const [name, ...rest] = item.split('=');
      if (!name || !rest.length) throw new Error('规格请按“名称=值”填写，例如“净含量=500克”');
      return { name: name.trim(), value: rest.join('=').trim() };
    });
    const body = { productId: skuProduct.value.id, skuCode: skuDraft.value.skuCode, skuName: skuDraft.value.skuName, salePriceCent: toCent(skuDraft.value.salePriceYuan), marketPriceCent: skuDraft.value.marketPriceYuan ? toCent(skuDraft.value.marketPriceYuan) : null, weightGram: Number(skuDraft.value.weightGram), barcode: skuDraft.value.barcode || null, saleStatus: skuDraft.value.saleStatus, presaleEnabled: false, specs };
    await adminRequest(skuEditingId.value ? `skus/${skuEditingId.value}` : `products/${skuProduct.value.id}/skus`, { method: skuEditingId.value ? 'PUT' : 'POST', body: JSON.stringify(body) });
    editSku(); notify('规格与价格已保存。'); await loadSkus();
  } catch (error) { skuError.value = error instanceof Error ? error.message : '规格保存失败'; }
  finally { savingSku.value = false; }
}
async function login() {
  loginBusy.value = true; loginError.value = '';
  try {
    setAdminPreviewSession(false);
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
watch([query, statusFilter, showArchived], () => { productPage.value = 1; void loadProducts(); });
watch(productPage, () => { void loadProducts(); });
const drawerOpen = computed(() => editorOpen.value || categoryEditorOpen.value || skuDrawerOpen.value);
watch(drawerOpen, open => { document.body.style.overflow = open ? 'hidden' : ''; });
function closeDrawers(event: KeyboardEvent) { if (event.key === 'Escape' && !savingProduct.value && !uploading.value && !savingSku.value) { editorOpen.value = false; categoryEditorOpen.value = false; skuDrawerOpen.value = false; } }
onMounted(() => document.addEventListener('keydown', closeDrawers));
onUnmounted(() => { document.removeEventListener('keydown', closeDrawers); document.body.style.overflow = ''; });
</script>

<template>
  <div v-if="!authenticated" class="login-screen"><form class="login-card" @submit.prevent="login"><span class="brand-seal">禾</span><span class="overline">SHANHE · ADMIN</span><h1>运营管理中心</h1><p>使用已开通的管理账号登录</p><div v-if="isDevelopmentPreview && previewUsername && previewPassword" class="preview-login-hint">本机只读预览：<strong>{{ previewUsername }}</strong> / <strong>{{ previewPassword }}</strong></div><label>账号<input v-model="loginUsername" autocomplete="username" required /></label><label>密码<input v-model="loginPassword" type="password" autocomplete="current-password" required /></label><div v-if="loginError" class="form-error" role="alert">{{ loginError }}</div><button class="primary-button" :disabled="loginBusy">{{ loginBusy ? '正在登录…' : '登录管理后台' }}</button></form></div>
  <div v-else class="admin-app">
    <aside class="sidebar">
      <a class="brand" href="#/" aria-label="山禾颐品运营管理首页">
        <span class="brand-seal">禾</span><span class="brand-copy"><strong>山禾颐品</strong><small>运营管理中心</small></span>
      </a>
      <div class="side-caption">商品与经营</div>
      <nav class="main-nav" aria-label="主导航">
        <button v-for="item in visibleNavigation" :key="item.id" :class="{ active: view === item.id }" :aria-current="view === item.id ? 'page' : false" @click="selectView(item.id)"><span class="nav-mark">{{ item.mark }}</span>{{ item.label }}<span v-if="view === item.id" class="nav-current"></span></button>
      </nav>
      <div class="nav-roadmap"><span class="side-caption">内容与运营</span><span>山野志文章 <small>已接入</small></span><span>视频与专题 <small>待接入</small></span><span>订单与售后 <small>待接入</small></span><span>采购与仓储 <small>待接入</small></span></div>
      <div class="sidebar-bottom" :class="{ 'preview-status': previewMode }"><span class="online-dot"></span><span>{{ previewMode ? '本机预览' : '管理服务' }}</span><strong>{{ previewMode ? '只读' : '已授权' }}</strong></div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="breadcrumbs"><span>管理后台</span><span class="crumb-sep">/</span><strong>{{ navigation.find(item => item.id === view)?.label }}</strong></div>
      <div class="top-actions"><span class="refresh-time">更新于 {{ lastUpdated }}</span><button class="icon-action" aria-label="刷新当前页面" @click="reload">↻</button><button class="user-avatar" aria-label="退出管理后台" title="退出登录" @click="logout">管</button></div>
      </header>

      <section class="page-content">
        <div v-if="internalTest && !previewMode" class="internal-test-banner">内部测试 · 商品与文章资料可保存，图片与价格为测试数据</div>
        <div v-if="feedback" class="operation-feedback" role="status"><span>{{ feedback }}</span><button aria-label="关闭提示" @click="feedback = ''">×</button></div>
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
          <div class="page-heading"><div><span class="overline">CATALOG · PRODUCTS</span><h1>商品管理</h1><p>维护商品资料与前台展示状态。</p></div><div class="heading-actions"><button class="secondary-button" :disabled="exporting || previewMode" @click="exportProducts">{{ exporting ? '下载中…' : '下载清单' }}</button><button v-if="canWriteProducts" class="primary-button" title="新增商品" @click="() => openEditor()"><span>＋</span> 新增商品</button></div></div>
          <div class="catalog-tabs"><button :class="{ selected: !showArchived }" @click="showArchived = false">商品档案</button><button :class="{ selected: showArchived }" @click="showArchived = true">回收站</button></div><section class="panel table-panel"><div class="table-toolbar"><div class="table-title"><h2>{{ showArchived ? '已归档商品' : '商品档案' }}</h2><span class="result-count">{{ products.value?.total ?? '—' }} 条</span></div><div class="filters"><label class="search-field"><span>⌕</span><input v-model="query" type="search" placeholder="搜索商品名称或编号" /></label><select v-model="statusFilter" aria-label="商品状态筛选"><option value="ALL">全部状态</option><option value="ON_SALE">在售</option><option value="OFF_SALE">已下架</option><option value="DRAFT">草稿</option></select></div></div>
            <div class="table-scroll"><table><thead><tr><th>商品</th><th>商品编号</th><th>分类</th><th>产地</th><th>状态</th><th>类型</th><th>操作</th></tr></thead><tbody v-if="products.status === 'ready' && filteredProducts.length"><tr v-for="product in filteredProducts" :key="product.id"><td><span class="product-cell"><span class="product-thumb"><img v-if="mediaUrl(product.media[0]?.objectKey)" :src="mediaUrl(product.media[0]?.objectKey)" :alt="product.name" /><span v-else>禾</span></span><span><strong>{{ product.name }}</strong><small>{{ product.subtitle || '暂无副标题' }}</small></span></span></td><td class="mono product-id" :title="product.publicId">{{ product.publicId.slice(0, 8) }}</td><td>{{ categoryName(product.categoryId) }}</td><td>{{ product.origin || '—' }}</td><td><span class="status-tag" :class="product.status.toLowerCase()">{{ statusName(product.status) }}</span></td><td>{{ product.productType === 'BUNDLE' ? '组合商品' : '标准商品' }}</td><td class="row-actions"><template v-if="canWriteProducts && !product.archivedAt"><button class="text-button" @click="openEditor(product)">编辑</button><button class="text-button" @click="openSkuManager(product)">规格/价格</button><button class="text-button" @click="toggleProduct(product)">{{ product.status === 'ON_SALE' ? '下架' : '上架' }}</button><button class="text-button danger-text" @click="archiveProduct(product)">归档</button></template><button v-else-if="canWriteProducts" class="text-button" @click="archiveProduct(product)">恢复商品</button><span v-else>只读</span></td></tr></tbody></table></div>
            <div v-if="products.status === 'loading'" class="table-state"><span class="state-spinner"></span><strong>正在读取商品档案</strong><small>连接管理 API…</small></div>
            <div v-else-if="products.status === 'error'" class="table-state error-state"><span class="state-mark">!</span><strong>{{ products.message }}</strong><small>检查服务连接后重试。</small><button class="text-button" @click="loadProducts">再试一次</button></div>
            <div v-else-if="products.status === 'ready' && !filteredProducts.length" class="table-state"><span class="state-mark">禾</span><strong>{{ query ? '没有匹配的商品' : '目前没有商品记录' }}</strong><small>{{ query ? '请调整关键词或筛选条件。' : '创建商品档案后会显示在这里。' }}</small></div>
            <footer v-if="products.status === 'ready'" class="table-footer"><span>当前显示 {{ filteredProducts.length }} / {{ products.value?.total ?? 0 }} 条</span><button class="pagination-button" :disabled="productPage === 1" @click="productPage--">上一页</button><span class="page-number">{{ productPage }}</span><button class="pagination-button" :disabled="productPage * 20 >= (products.value?.total ?? 0)" @click="productPage++">下一页</button></footer>
          </section>
        </template>

        <StoriesWorkspace v-else-if="view === 'stories'" :can-write="adminPermissions.has('*') || adminPermissions.has('content.story.write')" :refresh-key="storiesRefreshKey" />

        <template v-else>
          <div class="page-heading"><div><span class="overline">CATALOG · STRUCTURE</span><h1>商品分类</h1><p>维护小程序前台共用的商品分类。</p></div><button v-if="canWriteCategories" class="primary-button" @click="openCategoryEditor()"><span>＋</span> 新增分类</button></div>
          <section class="panel table-panel"><div class="table-toolbar"><div class="table-title"><h2>分类目录</h2><span class="result-count">{{ categories.value?.length ?? '—' }} 项</span></div></div><div class="category-list"><div v-for="category in categories.value ?? []" :key="category.id" class="category-row"><span class="category-symbol">禾</span><div><strong>{{ category.name }}</strong><small>{{ category.code }} · 排序 {{ category.sortOrder }}</small></div><span class="status-tag" :class="category.status.toLowerCase()">{{ category.status === 'ENABLED' ? '启用' : '停用' }}</span><div v-if="canWriteCategories" class="row-actions"><button class="text-button" @click="openCategoryEditor(category)">编辑</button><button class="text-button" @click="toggleCategory(category)">{{ category.status === 'ENABLED' ? '停用' : '启用' }}</button><button class="text-button danger-text" @click="deleteCategory(category)">删除</button></div><span v-else>只读</span></div></div><div v-if="categories.status === 'loading'" class="table-state"><span class="state-spinner"></span><strong>正在读取分类</strong></div><div v-else-if="categories.status === 'error'" class="table-state error-state"><span class="state-mark">!</span><strong>{{ categories.message }}</strong><small>分类数据不会用演示内容代替。</small><button class="text-button" @click="loadCategories">再试一次</button></div><div v-else-if="categories.status === 'ready' && !categories.value?.length" class="table-state"><span class="state-mark">禾</span><strong>目前没有分类记录</strong><small>新增分类后，小程序会读取启用的分类。</small></div></section>
        </template>
      </section>
      <footer class="workspace-footer"><span>山禾颐品 · 运营管理</span><span>{{ previewMode ? '本机演示数据，仅供界面预览' : '数据由管理 API 实时读取' }}</span></footer>
    </main>

    <div v-if="editorOpen" class="drawer-mask" @click.self="editorOpen = false"><form class="editor-drawer" role="dialog" aria-modal="true" aria-labelledby="editor-title" @submit.prevent="saveProduct"><header><div><span class="overline">PRODUCT INFORMATION</span><h2 id="editor-title">{{ editingProductId ? '编辑商品' : '新增商品' }}</h2></div><button type="button" class="icon-action" aria-label="关闭" @click="editorOpen = false">×</button></header><div class="form-section"><h3>基础信息</h3><label>商品名称<input v-model="productDraft.name" required maxlength="100" placeholder="请输入商品名称" /></label><label>副标题<input v-model="productDraft.subtitle" maxlength="200" placeholder="一句话说明商品特点" /></label><div class="form-columns"><label>商品分类<select v-model="productDraft.categoryId" required><option value="" disabled>请选择分类</option><option v-for="category in categories.value ?? []" :key="category.id" :value="category.id">{{ category.name }}</option></select></label><label>商品类型<select v-model="productDraft.productType"><option value="STANDARD">标准商品</option><option value="BUNDLE">组合商品</option></select></label></div><label>商品状态<select v-model="productDraft.status"><option value="DRAFT">草稿</option><option value="OFF_SALE">已下架</option><option value="ON_SALE">在售</option></select></label></div><div class="form-section"><h3>商品内容</h3><label>产地<input v-model="productDraft.origin" placeholder="如：甘肃舟曲" /></label><div class="media-editor"><div class="media-heading"><h3>商品图片</h3><label class="upload-control">{{ uploading ? '上传中…' : '上传图片' }}<input type="file" accept="image/png,image/jpeg,image/webp" multiple :disabled="uploading || savingProduct" @change="uploadImages" /></label></div><p class="field-help">第一张为封面。支持 PNG、JPEG、WebP，每张不超过 5 MB。</p><div class="media-grid"><div v-for="(key, index) in mediaKeys" :key="key" class="media-item"><img v-if="mediaUrl(key)" :src="mediaUrl(key)" alt="商品图片" /><span v-else class="media-filename">{{ key }}</span><span v-if="index === 0" class="cover-label">封面</span><div><button type="button" :disabled="index === 0 || uploading" @click="moveImage(index, 0)">设为封面</button><button type="button" :disabled="index === 0 || uploading" @click="moveImage(index, index - 1)">前移</button><button type="button" :disabled="uploading" @click="removeImage(index)">移除</button></div></div></div><p v-if="!mediaKeys.length" class="media-empty">上传一张图片，开始呈现商品。</p></div><label>商品介绍<textarea v-model="productDraft.content" required placeholder="介绍原料、风味与工艺" rows="5"></textarea></label><label>标签<input v-model="productDraft.tagsText" placeholder="用顿号分隔，如：柿饼、送礼" /></label><label>排序<input v-model.number="productDraft.sortOrder" type="number" min="0" /></label></div><div v-if="productError" class="form-error" role="alert">{{ productError }}</div><footer><button type="button" class="secondary-button" @click="editorOpen = false">取消</button><button class="primary-button" :disabled="savingProduct || uploading">{{ savingProduct ? '保存中…' : '保存商品' }}</button></footer></form></div>
    <div v-if="categoryEditorOpen" class="drawer-mask" @click.self="categoryEditorOpen = false"><form class="editor-drawer compact-drawer" @submit.prevent="saveCategory"><header><div><span class="overline">CATEGORY STRUCTURE</span><h2>{{ editingCategoryId ? '编辑分类' : '新增分类' }}</h2></div><button type="button" class="icon-action" aria-label="关闭" @click="categoryEditorOpen = false">×</button></header><div class="form-section"><label>分类名称<input v-model="categoryDraft.name" required maxlength="50" /></label><label>分类编码<input v-model="categoryDraft.code" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxlength="64" placeholder="如: dried-fruit" /></label><label>上级分类<select v-model="categoryDraft.parentId"><option value="">顶级分类</option><option v-for="category in categories.value ?? []" :key="category.id" :value="category.id" :disabled="category.id === editingCategoryId">{{ category.name }}</option></select></label><div class="form-columns"><label>排序<input v-model.number="categoryDraft.sortOrder" type="number" min="0" /></label><label>状态<select v-model="categoryDraft.status"><option value="ENABLED">启用</option><option value="DISABLED">停用</option></select></label></div></div><div v-if="categoryError" class="form-error" role="alert">{{ categoryError }}</div><footer><button type="button" class="secondary-button" @click="categoryEditorOpen = false">取消</button><button class="primary-button">保存分类</button></footer></form></div>
    <div v-if="skuDrawerOpen" class="drawer-mask" @click.self="skuDrawerOpen = false"><section class="editor-drawer compact-drawer"><header><div><span class="overline">SKU · PRICE · SPECIFICATION</span><h2>{{ skuProduct?.name }} · 规格与价格</h2></div><button class="icon-action" aria-label="关闭" @click="skuDrawerOpen = false">×</button></header><div class="sku-list"><div v-for="sku in skuRows.value?.items ?? []" :key="sku.id" class="sku-row"><div><strong>{{ sku.skuName }}</strong><small>{{ sku.skuCode }} · {{ sku.specs.map(spec => `${spec.name} ${spec.value}`).join(' / ') || '无规格' }}</small></div><b>¥{{ (sku.salePriceCent / 100).toFixed(2) }}</b><span class="status-tag" :class="sku.saleStatus.toLowerCase()">{{ sku.saleStatus === 'ON_SALE' ? '在售' : sku.saleStatus === 'OFF_SALE' ? '已下架' : '草稿' }}</span><button class="text-button" @click="editSku(sku)">编辑</button></div><div v-if="skuRows.status === 'loading' || skuRows.status === 'error'" class="table-state"><strong>{{ skuRows.status === 'loading' ? '正在读取规格' : skuRows.message }}</strong><button v-if="skuRows.status === 'error'" class="text-button" @click="loadSkus">重试</button></div><div v-else-if="!skuRows.value?.items.length" class="table-state"><strong>还没有规格</strong><small>添加 SKU 后设置售价与销售状态。</small></div></div><form class="form-section" @submit.prevent="saveSku"><div class="media-heading"><h3>{{ skuEditingId ? '编辑规格' : '新增规格' }}</h3><button v-if="skuEditingId" type="button" class="text-button" @click="editSku()">新增另一规格</button></div><p v-if="skuProduct?.status !== 'ON_SALE'" class="field-help">商品上架后，规格才能设置为“在售”。可以先保存草稿。</p><label>SKU 编码<input v-model="skuDraft.skuCode" required maxlength="64" placeholder="例如 DIAOSHI-500G" /></label><label>规格名称<input v-model="skuDraft.skuName" required maxlength="100" placeholder="例如 500 克装" /></label><div class="form-columns"><label>售价（元）<input v-model="skuDraft.salePriceYuan" required inputmode="decimal" placeholder="如 39.90" /></label><label>市场价（元）<input v-model="skuDraft.marketPriceYuan" inputmode="decimal" placeholder="可不填" /></label></div><div class="form-columns"><label>重量（克）<input v-model.number="skuDraft.weightGram" type="number" min="1" required /></label><label>条码<input v-model="skuDraft.barcode" inputmode="numeric" placeholder="可不填" /></label></div><label>规格项<input v-model="skuDraft.specsText" placeholder="净含量=500克、包装=礼盒" /><small>多项用顿号分隔，每项用等号连接名称和值。</small></label><label>销售状态<select v-model="skuDraft.saleStatus"><option value="DRAFT">草稿</option><option value="OFF_SALE">已下架</option><option value="ON_SALE">在售</option></select></label><div v-if="skuError" class="form-error" role="alert">{{ skuError }}</div><footer><button class="primary-button" :disabled="savingSku">{{ savingSku ? '保存中…' : skuEditingId ? '保存规格' : '新增 SKU' }}</button></footer></form></section></div>
  </div>
</template>
