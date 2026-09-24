<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onHide, onShow } from '@dcloudio/uni-app';
import { readV19Content, saveV19Content, resetV19Content, type V19Content, type V19Product, type V19Story, type V19Trace } from '../../src/v19-content-store.js';

const groups = [
  { name: '经营', items: ['工作台', '数据报表'] },
  { name: '小程序前台', items: ['首页图片', '自有商品', '山禾甄选', '本期甄选', '山野故事', '溯源内容'] },
  { name: '交易', items: ['商品中心', '订单中心', '售后中心'] },
  { name: '用户与增长', items: ['会员中心', '营销中心', '内容中心'] },
  { name: '供应链', items: ['采购管理', '收货质检', '仓库库存', '加工包装', '溯源管理'] },
  { name: '企业与系统', items: ['企业团购', '客服中心', '财务中心', '系统管理'] }
];
const state = ref<V19Content>(readV19Content());
const active = ref('工作台');
const editor = ref<'product' | 'story' | 'trace' | 'images' | ''>('');
const productForm = reactive<V19Product & { origin: string; intro: string; detail: string }>({ id: '', name: '', subtitle: '', category: 'seasonal', priceCent: 0, spec: '', summary: '', imageUrl: '', origin: '', intro: '', detail: '', type: 'owned', status: '上架', selection: [], selectionTitle: '' });
const storyForm = reactive<V19Story>({ id: '', title: '', type: '产地', origin: '', product: '', summary: '', body: '', coverUrl: '', status: '发布' });
const traceForm = reactive<V19Trace>({ id: '', product: '', batchNo: '', origin: '', supplier: '', receiveDate: '', packDate: '', craft: '', quality: '', note: '', status: '启用' });
const imageForm = reactive({ hero: '', persimmon: '', gift: '' });
const imageErrors = reactive({ hero: false, persimmon: false, gift: false });
const homeImageSlots = [
  { key: 'hero', label: '首页首屏大图', note: '建议竖版 3:4 或 4:5' },
  { key: 'persimmon', label: '舟曲吊柿商品图', note: '首页商品图，建议 4:5' },
  { key: 'gift', label: '礼盒商品图', note: '首页商品图，建议 4:5' }
] as const;
const isContentPage = computed(() => ['首页图片', '自有商品', '山禾甄选', '本期甄选', '山野故事', '溯源内容'].includes(active.value));
const visibleProducts = computed(() => state.value.products.filter(p => active.value === '自有商品' ? p.type === 'owned' : active.value === '山禾甄选' ? p.selection.includes('brand') : active.value === '本期甄选' ? p.selection.includes('season') : true));
const report = computed(() => {
  const products = state.value.products;
  const total = products.length || 1;
  const categoryRows = [
    { label: '应季甄选', key: 'seasonal' },
    { label: '礼盒', key: 'gift' },
    { label: '山野好物', key: 'mountain' }
  ].map(item => ({ ...item, count: products.filter(product => product.category === item.key).length }));
  const maxCategory = Math.max(1, ...categoryRows.map(item => item.count));
  return {
    total: products.length,
    live: products.filter(product => product.status === '上架').length,
    owned: products.filter(product => product.type === 'owned').length,
    curated: products.filter(product => product.selection.length > 0).length,
    stories: state.value.stories.filter(story => story.status === '发布').length,
    activeTraces: state.value.traces.filter(trace => trace.status === '启用').length,
    categoryRows: categoryRows.map(item => ({ ...item, percent: Math.round(item.count / maxCategory * 100), share: Math.round(item.count / total * 100) }))
  };
});

function refresh() { state.value = readV19Content(); }
onShow(() => {
  refresh();
  // #ifdef H5
  document.body.classList.add('v19-admin-preview');
  // #endif
});
onHide(() => {
  // #ifdef H5
  document.body.classList.remove('v19-admin-preview');
  // #endif
});
function persist(mutator: (content: V19Content) => void) { state.value = saveV19Content(mutator); }
function open(item: string) { active.value = item; refresh(); }
function beginProduct(kind: 'owned' | 'curated', selection?: 'brand' | 'season') {
  Object.assign(productForm, { id: `product-${Date.now()}`, name: '', subtitle: '', category: 'seasonal', priceCent: 0, spec: '', summary: '', imageUrl: '', origin: '', intro: '', detail: '', type: kind, status: '上架', selection: selection ? [selection] : [], selectionTitle: '' }); editor.value = 'product';
}
function saveProduct() {
  if (!productForm.name.trim()) return uni.showToast({ title: '请填写商品名称', icon: 'none' });
  const yuan = Number(productForm.priceCent);
  if (!Number.isFinite(yuan) || yuan < 0 || Math.abs(yuan * 100 - Math.round(yuan * 100)) > 0.000001) return uni.showToast({ title: '售价请填写到分', icon: 'none' });
  const draft = { ...productForm, priceCent: Math.round(yuan * 100), selection: [...productForm.selection] };
  persist(c => { const index = c.products.findIndex(x => x.id === draft.id); if (index < 0) c.products.unshift(draft); else c.products[index] = draft; });
  editor.value = '';
}
function beginStory() { Object.assign(storyForm, { id: `story-${Date.now()}`, title: '', type: '产地', origin: '', product: '', summary: '', body: '', coverUrl: '', status: '发布' }); editor.value = 'story'; }
function saveStory() { if (!storyForm.title.trim() || !storyForm.summary.trim()) return uni.showToast({ title: '请填写标题和摘要', icon: 'none' }); persist(c => c.stories.unshift({ ...storyForm })); editor.value = ''; }
function beginTrace() { Object.assign(traceForm, { id: `trace-${Date.now()}`, product: '', batchNo: '', origin: '', supplier: '', receiveDate: '', packDate: '', craft: '', quality: '', note: '', status: '启用' }); editor.value = 'trace'; }
function saveTrace() { if (!traceForm.product.trim() || !traceForm.batchNo.trim() || !traceForm.origin.trim()) return uni.showToast({ title: '商品、批次、产地为必填项', icon: 'none' }); persist(c => c.traces.unshift({ ...traceForm })); editor.value = ''; }
function editImages() { Object.assign(imageForm, state.value.homeImages); Object.assign(imageErrors, { hero: false, persimmon: false, gift: false }); editor.value = 'images'; }
function saveImages() { persist(c => { c.homeImages = { ...imageForm }; }); editor.value = ''; uni.showToast({ title: '首页图片设置已保存' }); }
function toggleProduct(p: V19Product) { persist(c => { const item = c.products.find(x => x.id === p.id); if (item) item.status = item.status === '上架' ? '下架' : '上架'; }); }
function toggleStory(p: V19Story) { persist(c => { const item = c.stories.find(x => x.id === p.id); if (item) item.status = item.status === '发布' ? '草稿' : '发布'; }); }
function toggleTrace(p: V19Trace) { persist(c => { const item = c.traces.find(x => x.id === p.id); if (item) item.status = item.status === '启用' ? '停用' : '启用'; }); }
function updateProductSelections(values: string[]) { productForm.selection = values.filter((value): value is 'brand' | 'season' => value === 'brand' || value === 'season'); }
function clearDemo() { uni.showModal({ title: '恢复演示数据', content: '清除本设备保存的编辑内容并恢复 V19 默认预览数据？', success: ({ confirm }) => { if (confirm) { resetV19Content(); refresh(); } } }); }
function goBack() { uni.switchTab({ url: '/pages/home/index' }); }
function placeholder(item: string) { return `${item}在 V19 原型中为功能结构占位，正式经营数据/API 尚未接入。`; }
</script>

<template>
  <view class="admin-preview">
    <view class="admin-banner"><button @tap="goBack">‹ 返回</button><view><text class="admin-brand">山禾颐品</text><text class="admin-subbrand">运营管理中心 · V19联动预览</text></view><text class="admin-avatar">管</text></view>
    <view class="preview-alert">本地预览模式 · 商品、故事、溯源和首页图片保存在当前设备，并同步给小程序前台。尚未连接线上 API。</view>
    <view class="admin-layout">
      <scroll-view scroll-x scroll-y class="admin-menu"><view class="admin-menu-inner"><view class="menu-brand"><text class="menu-brand-mark">禾</text><view><text class="menu-brand-title">管理导航</text><text class="menu-brand-caption">SHANHE CONSOLE</text></view></view><view v-for="group in groups" :key="group.name" class="menu-group"><text class="group-title">{{ group.name }}</text><button v-for="item in group.items" :key="item" :class="{ active: active === item }" @tap="open(item)"><text class="menu-item-dot"></text><text>{{ item }}</text><text v-if="active === item" class="menu-item-current">当前</text></button></view></view></scroll-view><text class="nav-swipe-cue">滑动查看更多 ›</text>
      <view class="admin-main" :class="{ 'is-workbench': active === '工作台' }">
        <view class="admin-heading"><text class="eyebrow">V19 WORKSPACE</text><text class="admin-title">{{ active }}</text><text class="admin-copy">后台编辑保存后，返回小程序前台即可查看效果。</text></view>
        <template v-if="active === '工作台'">
          <view class="metric-grid"><view class="metric-card"><text>前台商品</text><text>{{ state.products.filter(x => x.status === '上架').length }}</text></view><view class="metric-card"><text>已发布故事</text><text>{{ state.stories.filter(x => x.status === '发布').length }}</text></view><view class="metric-card"><text>启用溯源</text><text>{{ state.traces.filter(x => x.status === '启用').length }}</text></view><view class="metric-card"><text>演示订单</text><text>—</text></view></view>
          <view class="todo-card"><text class="card-title">小程序前台内容</text><button @tap="open('首页图片')">管理首页图片 ›</button><button @tap="open('自有商品')">管理商品与甄选 ›</button><button @tap="open('山野故事')">管理山野故事 ›</button><button @tap="open('溯源内容')">管理批次溯源 ›</button></view>
          <button class="report-link" @tap="open('数据报表')">查看内容与商品报表 <text>→</text></button>
        </template>
        <template v-else-if="active === '数据报表'">
          <view class="report-lead"><text class="eyebrow">LOCAL PREVIEW DATA</text><text>只统计本机已保存的商品、故事与溯源演示资料。</text></view>
          <view class="report-kpis">
            <view class="report-kpi"><text class="report-kpi-title">在售商品</text><view class="report-kpi-value">{{ report.live }}<text class="report-kpi-denominator"> / {{ report.total }}</text></view><text class="report-hint">已上架 / 商品总数</text></view>
            <view class="report-kpi"><text class="report-kpi-title">自有商品</text><view class="report-kpi-value">{{ report.owned }}</view><text class="report-hint">自有商品目录</text></view>
            <view class="report-kpi"><text class="report-kpi-title">甄选内容</text><view class="report-kpi-value">{{ report.curated }}</view><text class="report-hint">已加入甄选栏目</text></view>
            <view class="report-kpi"><text class="report-kpi-title">已发布故事</text><view class="report-kpi-value">{{ report.stories }}</view><text class="report-hint">启用溯源 {{ report.activeTraces }} 条</text></view>
          </view>
          <view class="report-grid">
            <view class="report-panel"><view class="report-panel-head"><text>商品分类结构</text><text>{{ report.total }} 件</text></view>
              <view v-for="row in report.categoryRows" :key="row.key" class="report-bar-row"><view class="report-bar-label"><text>{{ row.label }}</text><text>{{ row.count }} 件 · {{ row.share }}%</text></view><view class="report-track"><view :class="['report-fill', row.key]" :style="{ transform: `scaleX(${row.percent / 100})` }"></view></view></view>
            </view>
            <view class="report-panel report-status-panel"><view class="report-panel-head"><text>内容发布状态</text><text>本地预览</text></view>
              <view class="report-status-row"><text class="status-dot live"></text><view><text class="report-status-name">商品上架</text><text class="report-status-caption">前台可见</text></view><text class="report-status-count">{{ report.live }}</text></view>
              <view class="report-status-row"><text class="status-dot story"></text><view><text class="report-status-name">故事发布</text><text class="report-status-caption">故事页可见</text></view><text class="report-status-count">{{ report.stories }}</text></view>
              <view class="report-status-row"><text class="status-dot trace"></text><view><text class="report-status-name">溯源启用</text><text class="report-status-caption">前台演示可见</text></view><text class="report-status-count">{{ report.activeTraces }}</text></view>
            </view>
          </view>
          <view class="report-notice"><text>订单金额、销售趋势和转化率尚无线上订单/API 数据，接通后台后再展示真实经营报表。</text></view>
        </template>
        <template v-else-if="active === '首页图片'"><view class="action-card"><text>可保存首页主视觉、吊柿商品图和礼盒图地址；留空时使用页面默认视觉。</text><button class="primary" @tap="editImages">编辑首页图片</button></view></template>
        <template v-else-if="['自有商品','山禾甄选','本期甄选','商品中心'].includes(active)"><view class="action-row"><button class="primary" @tap="beginProduct(active === '自有商品' ? 'owned' : 'curated', active === '山禾甄选' ? 'brand' : active === '本期甄选' ? 'season' : undefined)">{{ active === '自有商品' ? '上传自有商品' : active === '商品中心' ? '新增商品' : '添加甄选内容' }}</button><text>保存后前台立即读取；甄选内容页不展示价格。</text></view><view v-for="p in visibleProducts" :key="p.id" class="record-card"><view><text class="record-title">{{ p.name }}</text><text class="record-copy">{{ p.subtitle }} · {{ p.status }} · {{ p.category }}</text></view><button @tap="toggleProduct(p)">{{ p.status === '上架' ? '下架' : '上架' }}</button></view><text v-if="!visibleProducts.length" class="empty">暂无内容</text></template>
        <template v-else-if="active === '山野故事'"><button class="primary add-button" @tap="beginStory">添加山野故事</button><view v-for="p in state.stories" :key="p.id" class="record-card"><view><text class="record-title">{{ p.title }}</text><text class="record-copy">{{ p.origin }} · {{ p.status }} · {{ p.summary }}</text></view><button @tap="toggleStory(p)">{{ p.status === '发布' ? '转草稿' : '发布' }}</button></view></template>
        <template v-else-if="active === '溯源内容'"><button class="primary add-button" @tap="beginTrace">新增溯源批次</button><view v-for="p in state.traces" :key="p.id" class="record-card"><view><text class="record-title">{{ p.product }} · {{ p.batchNo }}</text><text class="record-copy">{{ p.origin }} · {{ p.status }} · {{ p.quality }}</text></view><button @tap="toggleTrace(p)">{{ p.status === '启用' ? '停用' : '启用' }}</button></view></template>
        <template v-else><view class="action-card"><text>{{ placeholder(active) }}</text><text class="preview-note">订单、售后、会员、采购、库存、财务及权限菜单保留 V19 导航结构；需先实现对应管理端页面与 API。</text></view></template>
        <button class="reset-button" @tap="clearDemo">恢复 V19 默认演示数据</button>
      </view>
    </view>
    <view v-if="editor" class="modal-mask" @tap="editor = ''"><scroll-view scroll-y class="editor-modal" @tap.stop>
      <view class="modal-title"><text>{{ editor === 'product' ? '商品内容' : editor === 'story' ? '山野故事' : editor === 'trace' ? '溯源记录' : '首页图片' }}</text><button @tap="editor = ''">×</button></view>
      <template v-if="editor === 'product'">
        <view class="admin-form-grid">
          <label>商品名称<input v-model="productForm.name" placeholder="例如：舟曲吊柿 · 分享装" /></label>
          <label>商品类型<picker :range="['自有商品','山禾甄选']" @change="productForm.type = Number($event.detail.value) === 0 ? 'owned' : 'curated'"><view class="picker-value">{{ productForm.type === 'owned' ? '自有商品' : '山禾甄选' }}</view></picker></label>
          <label>前台分类<picker :range="['应季甄选','礼盒','山野好物']" @change="productForm.category = (['seasonal','gift','mountain'] as const)[$event.detail.value]!"><view class="picker-value">{{ productForm.category === 'seasonal' ? '应季甄选' : productForm.category === 'gift' ? '礼盒' : '山野好物' }}</view></picker></label>
          <label>产地<input v-model="productForm.origin" placeholder="例如：甘肃舟曲" /></label>
          <label>售价（元）<input v-model.number="productForm.priceCent" type="digit" placeholder="例如：59.80" /></label>
          <label>前台状态<picker :range="['上架','下架']" @change="productForm.status = Number($event.detail.value) === 0 ? '上架' : '下架'"><view class="picker-value">{{ productForm.status }}</view></picker></label>
          <label>规格<input v-model="productForm.spec" placeholder="例如：500g" /></label>
          <label>副标题<input v-model="productForm.subtitle" /></label>
          <label class="form-full">一句话卖点<input v-model="productForm.summary" /></label>
          <label class="form-full">商品介绍<textarea v-model="productForm.intro" placeholder="用户打开商品后首先看到的介绍" /></label>
          <label class="form-full">详细说明 / 工艺 / 风味<textarea v-model="productForm.detail" placeholder="产地、制作方式、口感与保存方式" /></label>
          <label class="form-full">封面图片 URL<input v-model="productForm.imageUrl" placeholder="https://..." /></label>
          <label class="form-full">甄选栏目<checkbox-group class="selection-options" @change="updateProductSelections($event.detail.value)"><label class="selection-option"><checkbox value="brand" :checked="productForm.selection.includes('brand')" />山禾甄选</label><label class="selection-option"><checkbox value="season" :checked="productForm.selection.includes('season')" />本期甄选</label></checkbox-group></label>
        </view>
        <button class="primary save-button" @tap="saveProduct">保存商品</button>
      </template>
      <template v-else-if="editor === 'story'"><label>标题<input v-model="storyForm.title" /></label><label>类型<input v-model="storyForm.type" /></label><label>产地<input v-model="storyForm.origin" /></label><label>相关商品<input v-model="storyForm.product" /></label><label>摘要<input v-model="storyForm.summary" /></label><label>正文<textarea v-model="storyForm.body" /></label><label>封面图片地址<input v-model="storyForm.coverUrl" /></label><button class="primary save-button" @tap="saveStory">保存故事</button></template>
      <template v-else-if="editor === 'trace'"><label>商品<input v-model="traceForm.product" /></label><label>批次号<input v-model="traceForm.batchNo" /></label><label>产地<input v-model="traceForm.origin" /></label><label>供应商<input v-model="traceForm.supplier" /></label><label>收货日期<input v-model="traceForm.receiveDate" /></label><label>包装日期<input v-model="traceForm.packDate" /></label><label>加工工艺<input v-model="traceForm.craft" /></label><label>质检摘要<input v-model="traceForm.quality" /></label><label>消费者说明<textarea v-model="traceForm.note" /></label><button class="primary save-button" @tap="saveTrace">保存溯源</button></template>
      <template v-else>
        <text class="image-help">修改只影响首页相应位置，保存后返回前台即可查看。</text>
        <view v-for="slot in homeImageSlots" :key="slot.key" class="home-image-row">
          <view class="home-image-preview"><image v-if="imageForm[slot.key] && !imageErrors[slot.key]" :src="imageForm[slot.key]" mode="aspectFill" @error="imageErrors[slot.key] = true" /><text v-else>{{ imageErrors[slot.key] ? '图片无法加载' : '暂无图片' }}</text></view>
          <label><text class="image-label">{{ slot.label }}</text><text class="image-note">{{ slot.note }}</text><input v-model="imageForm[slot.key]" placeholder="https://..." @input="imageErrors[slot.key] = false" /></label>
        </view>
        <button class="primary save-button" @tap="saveImages">保存图片设置</button>
      </template>
    </scroll-view></view>
  </view>
</template>

<style scoped>
.admin-preview{min-height:100vh;padding-bottom:40rpx;background:#f3f1ea}.admin-banner{min-height:126rpx;padding:20rpx 30rpx;display:flex;align-items:center;gap:22rpx;color:#f7f3e8;background:#18362b}.admin-banner button{color:#fff;font-size:24rpx}.admin-brand,.admin-subbrand{display:block}.admin-brand{font-size:29rpx;font-weight:600;letter-spacing:2rpx}.admin-subbrand{margin-top:5rpx;color:#b9c7bf;font-size:19rpx}.admin-avatar{width:58rpx;height:58rpx;margin-left:auto;display:grid;place-items:center;border-radius:50%;color:#18362b;background:#e5c99e}.preview-alert{margin:20rpx 24rpx;padding:16rpx;border:1px solid #e9d6b2;border-radius:8rpx;color:#79572b;background:#fcf3df;font-size:20rpx;line-height:31rpx}.admin-layout{display:flex;align-items:flex-start;gap:18rpx}.admin-menu{width:190rpx;max-height:calc(100vh - 190rpx);flex:none}.group-title{display:block;padding:18rpx 14rpx 8rpx;color:#7b807a;font-size:18rpx}.admin-menu button{width:100%;padding:12rpx 14rpx;text-align:left;font-size:20rpx;line-height:1.4}.admin-menu button.active{border-radius:8rpx;color:white;background:#18362b}.admin-main{min-width:0;flex:1;padding-right:20rpx}.admin-heading{padding:20rpx 0}.eyebrow{display:block;color:#9b673e;font-size:18rpx;letter-spacing:3rpx}.admin-title{display:block;margin:6rpx 0;font-size:36rpx;font-weight:600}.admin-copy{color:#747a75;font-size:19rpx;line-height:1.5}.metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:12rpx}.metric-card,.todo-card,.action-card,.record-card{padding:18rpx;border:1px solid #e6e1d5;border-radius:9rpx;background:#fffdf7}.metric-card{min-height:95rpx;display:flex;flex-direction:column;justify-content:space-between}.metric-card text:first-child,.record-copy{color:#747a75;font-size:18rpx}.metric-card text:last-child{font-size:28rpx;font-weight:600}.todo-card,.action-card{margin-top:16rpx}.card-title,.record-title{display:block;font-size:22rpx;font-weight:600}.todo-card button{width:100%;padding:16rpx 0;border-top:1px solid #eee9de;text-align:left;font-size:20rpx}.action-row{display:flex;flex-direction:column;gap:12rpx;color:#747a75;font-size:18rpx}.primary{padding:12rpx 18rpx;border-radius:8rpx;color:white;background:#18362b;font-size:20rpx}.record-card{margin-top:12rpx;display:flex;align-items:center;justify-content:space-between;gap:8rpx}.record-title{font-size:20rpx}.record-copy{display:block;margin-top:6rpx;line-height:1.4}.record-card button{flex:none;padding:10rpx;border:1px solid #ddd5c5;border-radius:7rpx;font-size:18rpx}.empty,.preview-note{display:block;margin-top:16rpx;color:#747a75;font-size:19rpx;line-height:1.5}.reset-button{margin:26rpx 0;color:#8b5e43;font-size:18rpx}.add-button{margin-bottom:10rpx}.modal-mask{position:fixed;inset:0;z-index:10;display:flex;align-items:flex-end;background:#0008}.editor-modal{width:100%;max-height:82vh;padding:28rpx 34rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:20rpx 20rpx 0 0;background:#fffdf7;box-sizing:border-box}.modal-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:18rpx;font-size:30rpx;font-weight:600}.editor-modal>label{display:block;margin:14rpx 0;color:#454943;font-size:20rpx}.editor-modal input,.editor-modal textarea,.picker-value{width:100%;min-height:68rpx;margin-top:8rpx;padding:14rpx;box-sizing:border-box;border:1px solid #ded9cd;border-radius:8rpx;background:white;font-size:21rpx}.editor-modal textarea{min-height:130rpx}.save-button{width:100%;margin-top:18rpx}.editor-modal checkbox-group label{display:inline-block;margin-right:18rpx}
</style>
<style scoped>
.admin-preview button { margin: 0; background: transparent; box-shadow: none; }
.admin-preview { color: var(--v19-ink); background: var(--v19-canvas); }
.admin-banner { color: var(--v19-canvas); background: var(--v19-brand-900); }
.admin-avatar { color: var(--v19-brand-900); background: var(--v19-gold-light); }
.preview-alert { border-color: var(--v19-line); color: var(--v19-brand-900); background: var(--v19-paper); }
.metric-card, .todo-card, .action-card, .record-card { border-color: var(--v19-line); background: var(--v19-paper-light); }
.admin-title, .card-title, .record-title { color: var(--v19-ink); }
.admin-menu { background: var(--v19-brand-900); }
.admin-menu button.active, .admin-preview .primary { background: var(--v19-brand-900); }
.report-link { width: 100%; min-height: 54px; margin-top: 18px !important; padding: 0 16px !important; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--v19-line) !important; border-radius: 9px !important; color: var(--v19-brand-900); background: var(--v19-paper-light) !important; font-size: 14px; }
.report-lead { margin: 4px 0 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--v19-copper); color: var(--v19-muted); background: var(--v19-paper); font-size: 13px; line-height: 1.55; }
.report-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.report-kpi { min-height: 112px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--v19-line); border-radius: 10px; background: var(--v19-paper-light); }
.report-kpi-title { color: var(--v19-muted); font-size: 12px; }
.report-kpi-value { margin: 8px 0; color: var(--v19-brand-900); font-size: 26px; line-height: 1.1; }
.report-kpi-denominator { color: var(--v19-muted); font-size: 13px; }
.report-hint { color: var(--v19-muted); font-size: 11px; }
.report-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 14px; }
.report-panel { min-width: 0; padding: 18px; border: 1px solid var(--v19-line); border-radius: 10px; background: var(--v19-paper-light); }
.report-panel-head { margin-bottom: 16px; display: flex; justify-content: space-between; gap: 10px; color: var(--v19-ink); font-size: 14px; font-weight: 600; }
.report-panel-head text:last-child { color: var(--v19-muted); font-size: 11px; font-weight: 400; }
.report-bar-row { margin-top: 14px; }
.report-bar-label { margin-bottom: 7px; display: flex; justify-content: space-between; gap: 10px; color: var(--v19-ink-700); font-size: 12px; }
.report-bar-label text:last-child { color: var(--v19-muted); }
.report-track { height: 8px; overflow: hidden; border-radius: 8px; background: var(--v19-brand-100); }
.report-fill { width: 100%; height: 100%; border-radius: inherit; background: var(--v19-brand-700); transform: scaleX(0); transform-origin: left center; transition: transform var(--motion-standard) ease-out; }
.report-fill.gift { background: var(--v19-copper); }
.report-fill.mountain { background: var(--v19-brand-800); }
.report-status-row { min-height: 55px; display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 11px; border-top: 1px solid var(--v19-line); }
.report-status-row view { display: flex; flex-direction: column; gap: 3px; }
.report-status-name { color: var(--v19-ink); font-size: 12px; }
.report-status-caption { color: var(--v19-muted); font-size: 10px; }
.report-status-count { color: var(--v19-brand-900); font-size: 18px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--v19-brand-700); }
.status-dot.story { background: var(--v19-copper); }
.status-dot.trace { background: var(--v19-warning); }
.report-notice { margin-top: 14px; padding: 13px 15px; border: 1px solid var(--v19-line); border-radius: 9px; color: var(--v19-muted); background: var(--v19-paper); font-size: 11px; line-height: 1.6; }
.admin-preview button::after { border: 0; }
.admin-preview button { transition: background-color .16s ease, color .16s ease, transform .16s ease; }
.admin-preview button:active { transform: translateY(1rpx); }
.admin-preview button:focus-visible { outline: 2px solid #9b673e; outline-offset: 2px; }
.editor-modal { height: 82vh; overflow-y: auto; }
.admin-preview .primary { color: white; background: #18362b; }
.admin-preview .primary:active { background: #2b5747; }
.admin-menu button { background: transparent; }
.admin-menu button.active { background: #2b5142; }
.admin-menu { scrollbar-width: none; }
.admin-menu::-webkit-scrollbar { width: 0; height: 0; display: none; }
.admin-banner button { padding: 0 14rpx; border: 1px solid #6c8778; border-radius: 7rpx; color: #f7f3e8; background: transparent; }
.record-card button { background: transparent; }
.todo-card button { background: transparent; }
.record-card button:active, .todo-card button:active { color: var(--v19-brand-700); background: var(--v19-brand-100); }
.admin-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
.admin-form-grid label { min-width: 0; color: var(--v19-ink-700); font-size: 20rpx; }
.admin-form-grid .form-full { grid-column: 1 / -1; }
.image-help { display: block; padding: 14rpx; color: var(--v19-ink-700); background: var(--v19-brand-100); font-size: 19rpx; line-height: 1.5; }
.home-image-row { display: grid; grid-template-columns: 150rpx minmax(0, 1fr); align-items: center; gap: 20rpx; padding: 18rpx 0; border-bottom: 1px solid var(--v19-line); }
.home-image-preview { height: 130rpx; overflow: hidden; display: grid; place-items: center; border-radius: 8rpx; color: var(--v19-muted); background: var(--v19-paper); font-size: 18rpx; }
.home-image-preview image { width: 100%; height: 100%; }
.image-label, .image-note { display: block; }
.image-label { font-size: 22rpx; font-weight: 600; }
.image-note { margin-top: 4rpx; color: var(--v19-muted); font-size: 17rpx; }
.admin-main { max-width: 1360px; margin-right: auto; margin-left: auto; padding: 0 var(--admin-content-gap); box-sizing: border-box; }
.is-workbench .admin-heading { padding: 30px 0 24px; text-align: center; }
.is-workbench .admin-heading .eyebrow { letter-spacing: .16em; }
.is-workbench .admin-heading .admin-title { margin: 8px 0; font-size: 30px; }
.is-workbench .admin-copy { font-size: 13px; }
.is-workbench .metric-grid { max-width: 1080px; margin: 0 auto; gap: 14px; }
.is-workbench .metric-card { min-height: 126px; padding: 18px; align-items: center; justify-content: center; gap: 14px; border-radius: 12px; text-align: center; }
.is-workbench .metric-card text:first-child { font-size: 13px; }
.is-workbench .metric-card text:last-child { color: var(--v19-brand-900); font-size: 30px; }
.is-workbench .todo-card { max-width: 1080px; margin: 22px auto 0; padding: 22px 28px; border-radius: 12px; }
.is-workbench .card-title { margin-bottom: 10px; text-align: center; }
.is-workbench .todo-card button { min-height: 54px; padding: 12px 0; display: flex; align-items: center; justify-content: center; border-top: 1px solid var(--v19-line); color: var(--v19-ink-700); font-size: 14px; text-align: center; }
.is-workbench .report-link { max-width: 1080px; margin: 16px auto 0 !important; }
.reset-button { width: fit-content; min-height: 40px; margin: 26px auto; padding: 0 15px; display: block; border: 1px solid var(--v19-line); border-radius: 8px; color: var(--v19-muted); background: var(--v19-paper-light); font-size: 12px; }
.selection-options { margin-top: 8px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.selection-option { min-height: 44px; margin: 0 !important; padding: 0 14px; display: inline-flex !important; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--v19-line); border-radius: 8px; color: var(--v19-ink-700); background: var(--v19-paper-light); font-size: 13px !important; }
.selection-option checkbox { transform: scale(.86); }
.admin-layout { gap: 22px; }
.nav-swipe-cue { display: none; }
.admin-menu { width: var(--admin-sidebar-width); height: calc(100vh - 190px); max-height: 860px; min-height: 540px; overflow-y: auto; border: 1px solid rgba(255,255,255,.08); border-radius: 0 14px 14px 0; box-shadow: 8px 10px 28px rgba(24,54,43,.12); }
.admin-menu-inner { padding: 16px 12px 20px; }
.menu-brand { min-height: 66px; margin: 0 4px 14px; padding: 0 10px 14px; display: flex; align-items: center; gap: 11px; border-bottom: 1px solid rgba(255,255,255,.14); }
.menu-brand-mark { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid rgba(229,201,158,.55); border-radius: 11px; color: var(--v19-gold-light); font-family: STSong, "Songti SC", serif; font-size: 19px; }
.menu-brand-title, .menu-brand-caption { display: block; }
.menu-brand-title { color: #f7f3e8; font-size: 14px; font-weight: 600; letter-spacing: .08em; }
.menu-brand-caption { margin-top: 4px; color: #9fb1a6; font-size: 9px; letter-spacing: .12em; }
.menu-group { margin: 0 0 7px; }
.group-title { padding: 12px 12px 7px; color: #b2c0b8; font-size: 11px; letter-spacing: .12em; }
.admin-menu button { min-height: var(--admin-nav-item-height); margin: 2px 0; padding: 0 11px; display: flex; align-items: center; gap: 10px; border-radius: 8px; color: #e1e8e3; text-align: left; font-size: 13px; transition: background-color var(--motion-quick) ease-out, color var(--motion-quick) ease-out; }
.menu-item-dot { width: 6px; height: 6px; flex: none; border-radius: 50%; background: rgba(217,228,220,.38); }
.menu-item-current { margin-left: auto; padding: 3px 6px; border-radius: 999px; color: #f2d9b2; background: rgba(229,201,158,.13); font-size: 9px; }
.admin-menu button.active { color: #fffaf0; background: #315543; box-shadow: inset 3px 0 #d4b27e; }
.admin-menu button.active .menu-item-dot { background: #e5c99e; box-shadow: 0 0 0 3px rgba(229,201,158,.14); }
.admin-menu button:not(.active):active { background: rgba(255,255,255,.08); }
@media (min-width: 600px) {
  .admin-menu { width: var(--admin-sidebar-width); }
  .report-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .report-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .report-kpi { min-height: 132px; padding: 18px; }
  .report-kpi-value { font-size: 32px; }
  .editor-modal { height: min(86vh, 760px); }
  .modal-mask { align-items: center; justify-content: center; }
  .editor-modal { width: min(920px, calc(100vw - 48px)); max-height: calc(100vh - 64px); padding: 24px 28px; border-radius: 12px; }
  .modal-title { font-size: 24px; }
  .editor-modal label, .admin-form-grid label { font-size: 13px; }
  .editor-modal input, .editor-modal textarea, .picker-value { min-height: 42px; padding: 9px 11px; font-size: 13px; }
  .editor-modal textarea { min-height: 90px; }
  .admin-form-grid { gap: 14px 18px; }
  .home-image-row { grid-template-columns: 120px minmax(0, 1fr); gap: 18px; padding: 16px 0; }
  .home-image-preview { height: 96px; font-size: 12px; }
  .image-label { font-size: 14px; }
  .image-note { font-size: 11px; }
  .image-help { padding: 12px 14px; font-size: 12px; }
  .save-button { max-width: 240px; min-height: 42px; margin: 20px 0 0 auto; font-size: 13px; }
}
@media (max-width: 599px) {
  .admin-layout { position: relative; display: block; }
  .admin-menu { width: 100%; height: 92rpx; min-height: 0; max-height: none; overflow: hidden; border: 0; border-radius: 0; box-shadow: none; background: #18362b; }
  .admin-menu-inner { display: flex; width: max-content; padding: 10rpx 20rpx; }
  .menu-brand { display: none; }
  .menu-group { display: flex; align-items: center; margin: 0; }
  .admin-menu-inner > view { display: flex; align-items: center; }
  .group-title { display: none; }
  .admin-menu button { width: auto; min-height: 92rpx; margin: 0 5rpx; padding: 0 18rpx; flex: none; color: #d7e0db; white-space: nowrap; }
  .menu-item-dot, .menu-item-current { display: none; }
  .nav-swipe-cue { padding-left: 28rpx; position: absolute; top: 0; right: 0; z-index: 2; display: flex; align-items: center; height: 92rpx; color: #e0e8e2; background: linear-gradient(90deg, rgba(24,54,43,0), #18362b 28%); font-size: 18rpx; pointer-events: none; }
  .admin-menu button.active { background: #355c4b; }
  .admin-main { padding: 0 24rpx; }
  .record-card { padding: 20rpx; }
  .record-card button { min-height: 88rpx; padding: 0 16rpx; font-size: 21rpx; }
}
.record-card { padding: 18px 20px; border-color: var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); }
.record-card > view { min-width: 0; flex: 1; }
.record-title { color: var(--color-text-primary); font-size: 24rpx; line-height: 1.45; }
.record-copy { color: var(--color-text-secondary); font-size: 20rpx; line-height: var(--leading-body); }
.record-card button { min-width: 76px; min-height: 40px; padding: 0 12px; border-color: var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); font-size: 12px; }
.action-card { color: var(--color-text-secondary); line-height: var(--leading-body); }
.editor-modal { background: var(--color-surface); }
.editor-modal input, .editor-modal textarea, .picker-value { border-color: var(--color-border); border-radius: var(--radius-control); }
.editor-modal input:focus, .editor-modal textarea:focus { border-color: var(--color-brand); outline: 2px solid rgba(43,87,71,.16); }
.empty { min-height: 180px; padding: 24px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--color-border); border-radius: var(--radius-surface); color: var(--color-text-secondary); background: var(--color-surface); text-align: center; }
@media (min-width: 600px) {
  .record-title { font-size: 14px; }
  .record-copy { font-size: 12px; }
}
</style>
