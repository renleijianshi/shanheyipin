<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { formatMoney, getAdminData, type AdminProduct, type DashboardData, type PageResult } from './api';

type View = 'dashboard' | 'products' | 'categories';
type LoadState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; value: T | null; message: string };

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
const lastUpdated = ref('尚未读取');

interface Category { readonly id: string; readonly code: string; readonly name: string; readonly status: 'ENABLED' | 'DISABLED'; readonly sortOrder: number }
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
function openEditor() { editorOpen.value = true; }
onMounted(() => { void loadDashboard(); });
watch(view, reload);
</script>

<template>
  <div class="admin-app">
    <aside class="sidebar">
      <a class="brand" href="#/" aria-label="山禾颐品运营管理首页">
        <span class="brand-seal">禾</span><span class="brand-copy"><strong>山禾颐品</strong><small>运营管理中心</small></span>
      </a>
      <div class="side-caption">工作空间</div>
      <nav class="main-nav" aria-label="主导航">
        <button v-for="item in navigation" :key="item.id" :class="{ active: view === item.id }" :aria-current="view === item.id ? 'page' : false" @click="selectView(item.id)"><span class="nav-mark">{{ item.mark }}</span>{{ item.label }}<span v-if="view === item.id" class="nav-current"></span></button>
      </nav>
      <div class="sidebar-bottom"><span class="online-dot"></span><span>管理数据源</span><strong>连接待配置</strong></div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="breadcrumbs"><span>管理后台</span><span class="crumb-sep">/</span><strong>{{ navigation.find(item => item.id === view)?.label }}</strong></div>
        <div class="top-actions"><span class="refresh-time">更新于 {{ lastUpdated }}</span><button class="icon-action" aria-label="刷新当前页面" @click="reload">↻</button><span class="user-avatar" aria-label="当前用户未登录">管</span></div>
      </header>

      <section class="page-content">
        <div class="connection-notice" role="status"><span class="notice-icon">i</span><div><strong>后台服务尚未接通</strong><p>当前页面已在正式后台工程中建立。管理 API 与账号认证接入前，不会显示模拟经营数据，也不会保存管理操作。</p></div><button @click="reload">重新检查 <span>↗</span></button></div>

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
          <div class="page-heading"><div><span class="overline">CATALOG · PRODUCTS</span><h1>商品管理</h1><p>维护商品资料与前台展示状态。</p></div><button class="primary-button" title="查看商品编辑表单" @click="openEditor"><span>＋</span> 新增商品</button></div>
          <section class="panel table-panel"><div class="table-toolbar"><div class="table-title"><h2>商品档案</h2><span class="result-count">{{ products.value?.total ?? '—' }} 条</span></div><div class="filters"><label class="search-field"><span>⌕</span><input v-model="query" type="search" placeholder="搜索商品名称或编号" :disabled="products.status !== 'ready'" /></label><select v-model="statusFilter" aria-label="商品状态筛选" :disabled="products.status !== 'ready'"><option value="ALL">全部状态</option><option value="ON_SALE">在售</option><option value="OFF_SALE">已下架</option><option value="DRAFT">草稿</option></select></div></div>
            <div class="table-scroll"><table><thead><tr><th>商品</th><th>商品编号</th><th>分类编号</th><th>产地</th><th>状态</th><th>类型</th></tr></thead><tbody v-if="products.status === 'ready' && filteredProducts.length"><tr v-for="product in filteredProducts" :key="product.id"><td><span class="product-cell"><span class="product-thumb">{{ product.media.length ? '图' : '禾' }}</span><span><strong>{{ product.name }}</strong><small>{{ product.subtitle || '暂无副标题' }}</small></span></span></td><td class="mono">{{ product.publicId }}</td><td>{{ product.categoryId }}</td><td>{{ product.origin || '—' }}</td><td><span class="status-tag" :class="product.status.toLowerCase()">{{ statusName(product.status) }}</span></td><td>{{ product.productType === 'BUNDLE' ? '组合商品' : '标准商品' }}</td></tr></tbody></table></div>
            <div v-if="products.status === 'loading'" class="table-state"><span class="state-spinner"></span><strong>正在读取商品档案</strong><small>连接管理 API…</small></div>
            <div v-else-if="products.status === 'error'" class="table-state error-state"><span class="state-mark">!</span><strong>{{ products.message }}</strong><small>商品数据不会用演示内容代替。</small><button class="text-button" @click="loadProducts">再试一次</button></div>
            <div v-else-if="products.status === 'ready' && !filteredProducts.length" class="table-state"><span class="state-mark">禾</span><strong>{{ query ? '没有匹配的商品' : '目前没有商品记录' }}</strong><small>{{ query ? '请调整关键词或筛选条件。' : '商品接入管理 API 后会显示在这里。' }}</small></div>
            <footer v-if="products.status === 'ready'" class="table-footer"><span>当前显示 {{ filteredProducts.length }} / {{ products.value?.total ?? 0 }} 条</span><button class="pagination-button" disabled>上一页</button><span class="page-number">1</span><button class="pagination-button" disabled>下一页</button></footer>
          </section>
        </template>

        <template v-else>
          <div class="page-heading"><div><span class="overline">CATALOG · STRUCTURE</span><h1>商品分类</h1><p>查看已配置的前台分类。</p></div><button class="primary-button" disabled title="管理写入接口与权限校验尚未实现"><span>＋</span> 新增分类</button></div>
          <section class="panel table-panel"><div class="table-toolbar"><div class="table-title"><h2>分类目录</h2><span class="result-count">{{ categories.value?.length ?? '—' }} 项</span></div></div><div class="category-list"><div v-for="category in categories.value ?? []" :key="category.id" class="category-row"><span class="category-symbol">禾</span><div><strong>{{ category.name }}</strong><small>{{ category.code }} · 排序 {{ category.sortOrder }}</small></div><span class="status-tag" :class="category.status.toLowerCase()">{{ category.status === 'ENABLED' ? '启用' : '停用' }}</span></div></div><div v-if="categories.status === 'loading'" class="table-state"><span class="state-spinner"></span><strong>正在读取分类</strong></div><div v-else-if="categories.status === 'error'" class="table-state error-state"><span class="state-mark">!</span><strong>{{ categories.message }}</strong><small>分类数据不会用演示内容代替。</small><button class="text-button" @click="loadCategories">再试一次</button></div><div v-else-if="categories.status === 'ready' && !categories.value?.length" class="table-state"><span class="state-mark">禾</span><strong>目前没有分类记录</strong><small>分类接入管理 API 后会显示在这里。</small></div></section>
        </template>
      </section>
      <footer class="workspace-footer"><span>山禾颐品 · 运营管理</span><span>管理界面建设中 · 数据以后台服务为准</span></footer>
    </main>

    <div v-if="editorOpen" class="drawer-mask" @click.self="editorOpen = false"><section class="editor-drawer" role="dialog" aria-modal="true" aria-labelledby="editor-title"><header><div><span class="overline">PRODUCT INFORMATION</span><h2 id="editor-title">商品编辑</h2></div><button class="icon-action" aria-label="关闭" @click="editorOpen = false">×</button></header><div class="drawer-notice">商品保存接口和权限验证尚未接入，表单内容不会写入系统。</div><div class="form-section"><h3>基础信息</h3><label>商品名称<input placeholder="请输入商品名称" /></label><label>副标题<input placeholder="一句话说明商品特点" /></label><div class="form-columns"><label>商品分类<select><option>等待分类 API</option></select></label><label>商品类型<select><option>标准商品</option><option>组合商品</option></select></label></div></div><div class="form-section"><h3>商品内容</h3><label>产地<input placeholder="如：甘肃舟曲" /></label><label>商品介绍<textarea placeholder="介绍原料、风味与工艺" rows="5"></textarea></label></div><footer><button class="secondary-button" @click="editorOpen = false">返回列表</button><button class="primary-button" disabled>保存商品</button></footer></section></div>
  </div>
</template>
