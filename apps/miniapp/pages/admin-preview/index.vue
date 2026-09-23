<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
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
const productForm = reactive<V19Product>({ id: '', name: '', subtitle: '', category: 'seasonal', priceCent: 0, spec: '', summary: '', imageUrl: '', type: 'owned', status: '上架', selection: [], selectionTitle: '' });
const storyForm = reactive<V19Story>({ id: '', title: '', type: '产地', origin: '', product: '', summary: '', body: '', coverUrl: '', status: '发布' });
const traceForm = reactive<V19Trace>({ id: '', product: '', batchNo: '', origin: '', supplier: '', receiveDate: '', packDate: '', craft: '', quality: '', note: '', status: '启用' });
const imageForm = reactive({ hero: '', persimmon: '', gift: '' });
const isContentPage = computed(() => ['首页图片', '自有商品', '山禾甄选', '本期甄选', '山野故事', '溯源内容'].includes(active.value));
const visibleProducts = computed(() => state.value.products.filter(p => active.value === '自有商品' ? p.type === 'owned' : active.value === '山禾甄选' ? p.selection.includes('brand') : active.value === '本期甄选' ? p.selection.includes('season') : true));

function refresh() { state.value = readV19Content(); }
onShow(refresh);
function persist(mutator: (content: V19Content) => void) { state.value = saveV19Content(mutator); }
function open(item: string) { active.value = item; refresh(); }
function beginProduct(kind: 'owned' | 'curated', selection?: 'brand' | 'season') {
  Object.assign(productForm, { id: `product-${Date.now()}`, name: '', subtitle: '', category: 'seasonal', priceCent: 0, spec: '', summary: '', imageUrl: '', type: kind, status: '上架', selection: selection ? [selection] : [], selectionTitle: '' }); editor.value = 'product';
}
function saveProduct() { if (!productForm.name.trim()) return uni.showToast({ title: '请填写商品名称', icon: 'none' }); persist(c => { const index = c.products.findIndex(x => x.id === productForm.id); if (index < 0) c.products.unshift({ ...productForm, selection: [...productForm.selection] }); else c.products[index] = { ...productForm, selection: [...productForm.selection] }; }); editor.value = ''; }
function beginStory() { Object.assign(storyForm, { id: `story-${Date.now()}`, title: '', type: '产地', origin: '', product: '', summary: '', body: '', coverUrl: '', status: '发布' }); editor.value = 'story'; }
function saveStory() { if (!storyForm.title.trim() || !storyForm.summary.trim()) return uni.showToast({ title: '请填写标题和摘要', icon: 'none' }); persist(c => c.stories.unshift({ ...storyForm })); editor.value = ''; }
function beginTrace() { Object.assign(traceForm, { id: `trace-${Date.now()}`, product: '', batchNo: '', origin: '', supplier: '', receiveDate: '', packDate: '', craft: '', quality: '', note: '', status: '启用' }); editor.value = 'trace'; }
function saveTrace() { if (!traceForm.product.trim() || !traceForm.batchNo.trim() || !traceForm.origin.trim()) return uni.showToast({ title: '商品、批次、产地为必填项', icon: 'none' }); persist(c => c.traces.unshift({ ...traceForm })); editor.value = ''; }
function editImages() { Object.assign(imageForm, state.value.homeImages); editor.value = 'images'; }
function saveImages() { persist(c => { c.homeImages = { ...imageForm }; }); editor.value = ''; uni.showToast({ title: '首页图片设置已保存' }); }
function toggleProduct(p: V19Product) { persist(c => { const item = c.products.find(x => x.id === p.id); if (item) item.status = item.status === '上架' ? '下架' : '上架'; }); }
function toggleStory(p: V19Story) { persist(c => { const item = c.stories.find(x => x.id === p.id); if (item) item.status = item.status === '发布' ? '草稿' : '发布'; }); }
function toggleTrace(p: V19Trace) { persist(c => { const item = c.traces.find(x => x.id === p.id); if (item) item.status = item.status === '启用' ? '停用' : '启用'; }); }
function updateProductSelections(values: string[]) { productForm.selection = values.filter((value): value is 'brand' | 'season' => value === 'brand' || value === 'season'); }
function clearDemo() { uni.showModal({ title: '恢复演示数据', content: '清除本设备保存的编辑内容并恢复 V19 默认预览数据？', success: ({ confirm }) => { if (confirm) { resetV19Content(); refresh(); } } }); }
function goBack() { uni.navigateBack({ delta: 1 }); }
function placeholder(item: string) { return `${item}在 V19 原型中为功能结构占位，正式经营数据/API 尚未接入。`; }
</script>

<template>
  <view class="admin-preview">
    <view class="admin-banner"><button @tap="goBack">‹ 返回</button><view><text class="admin-brand">山禾颐品</text><text class="admin-subbrand">运营管理中心 · V19联动预览</text></view><text class="admin-avatar">管</text></view>
    <view class="preview-alert">本地预览模式 · 商品、故事、溯源和首页图片保存在当前设备，并同步给小程序前台。尚未连接线上 API。</view>
    <view class="admin-layout">
      <scroll-view scroll-y class="admin-menu"><view v-for="group in groups" :key="group.name"><text class="group-title">{{ group.name }}</text><button v-for="item in group.items" :key="item" :class="{ active: active === item }" @tap="open(item)">{{ item }}</button></view></scroll-view>
      <view class="admin-main">
        <view class="admin-heading"><text class="eyebrow">V19 WORKSPACE</text><text class="admin-title">{{ active }}</text><text class="admin-copy">后台编辑保存后，返回小程序前台即可查看效果。</text></view>
        <template v-if="active === '工作台'">
          <view class="metric-grid"><view class="metric-card"><text>前台商品</text><text>{{ state.products.filter(x => x.status === '上架').length }}</text></view><view class="metric-card"><text>已发布故事</text><text>{{ state.stories.filter(x => x.status === '发布').length }}</text></view><view class="metric-card"><text>启用溯源</text><text>{{ state.traces.filter(x => x.status === '启用').length }}</text></view><view class="metric-card"><text>演示订单</text><text>—</text></view></view>
          <view class="todo-card"><text class="card-title">小程序前台内容</text><button @tap="open('首页图片')">管理首页图片 ›</button><button @tap="open('自有商品')">管理商品与甄选 ›</button><button @tap="open('山野故事')">管理山野故事 ›</button><button @tap="open('溯源内容')">管理批次溯源 ›</button></view>
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
      <template v-if="editor === 'product'"><label>商品名称<input v-model="productForm.name" placeholder="例如：舟曲吊柿分享装" /></label><label>副标题<input v-model="productForm.subtitle" /></label><label>分类<picker :range="['应季甄选','礼盒','山野好物']" @change="productForm.category = (['seasonal','gift','mountain'] as const)[$event.detail.value]!"><view class="picker-value">{{ productForm.category }}</view></picker></label><label>售价（元）<input v-model.number="productForm.priceCent" type="digit" placeholder="输入金额（元）" /></label><label>规格<input v-model="productForm.spec" /></label><label>简介<textarea v-model="productForm.summary" /></label><label>图片地址<input v-model="productForm.imageUrl" /></label><label>甄选栏目<checkbox-group @change="updateProductSelections($event.detail.value)"><label><checkbox value="brand" :checked="productForm.selection.includes('brand')" />山禾甄选</label><label><checkbox value="season" :checked="productForm.selection.includes('season')" />本期甄选</label></checkbox-group></label><button class="primary save-button" @tap="productForm.priceCent = Math.round(Number(productForm.priceCent) * 100); saveProduct()">保存商品</button></template>
      <template v-else-if="editor === 'story'"><label>标题<input v-model="storyForm.title" /></label><label>类型<input v-model="storyForm.type" /></label><label>产地<input v-model="storyForm.origin" /></label><label>相关商品<input v-model="storyForm.product" /></label><label>摘要<input v-model="storyForm.summary" /></label><label>正文<textarea v-model="storyForm.body" /></label><label>封面图片地址<input v-model="storyForm.coverUrl" /></label><button class="primary save-button" @tap="saveStory">保存故事</button></template>
      <template v-else-if="editor === 'trace'"><label>商品<input v-model="traceForm.product" /></label><label>批次号<input v-model="traceForm.batchNo" /></label><label>产地<input v-model="traceForm.origin" /></label><label>供应商<input v-model="traceForm.supplier" /></label><label>收货日期<input v-model="traceForm.receiveDate" /></label><label>包装日期<input v-model="traceForm.packDate" /></label><label>加工工艺<input v-model="traceForm.craft" /></label><label>质检摘要<input v-model="traceForm.quality" /></label><label>消费者说明<textarea v-model="traceForm.note" /></label><button class="primary save-button" @tap="saveTrace">保存溯源</button></template>
      <template v-else><label>首页首屏大图<input v-model="imageForm.hero" placeholder="图片链接" /></label><label>吊柿商品图<input v-model="imageForm.persimmon" placeholder="图片链接" /></label><label>礼盒商品图<input v-model="imageForm.gift" placeholder="图片链接" /></label><button class="primary save-button" @tap="saveImages">保存图片设置</button></template>
    </scroll-view></view>
  </view>
</template>

<style scoped>
.admin-preview{min-height:100vh;padding-bottom:40rpx;background:#f3f1ea}.admin-banner{min-height:126rpx;padding:20rpx 30rpx;display:flex;align-items:center;gap:22rpx;color:#f7f3e8;background:#18362b}.admin-banner button{color:#fff;font-size:24rpx}.admin-brand,.admin-subbrand{display:block}.admin-brand{font-size:29rpx;font-weight:600;letter-spacing:2rpx}.admin-subbrand{margin-top:5rpx;color:#b9c7bf;font-size:19rpx}.admin-avatar{width:58rpx;height:58rpx;margin-left:auto;display:grid;place-items:center;border-radius:50%;color:#18362b;background:#e5c99e}.preview-alert{margin:20rpx 24rpx;padding:16rpx;border:1px solid #e9d6b2;border-radius:8rpx;color:#79572b;background:#fcf3df;font-size:20rpx;line-height:31rpx}.admin-layout{display:flex;align-items:flex-start;gap:18rpx}.admin-menu{width:190rpx;max-height:calc(100vh - 190rpx);flex:none}.group-title{display:block;padding:18rpx 14rpx 8rpx;color:#7b807a;font-size:18rpx}.admin-menu button{width:100%;padding:12rpx 14rpx;text-align:left;font-size:20rpx;line-height:1.4}.admin-menu button.active{border-radius:8rpx;color:white;background:#18362b}.admin-main{min-width:0;flex:1;padding-right:20rpx}.admin-heading{padding:20rpx 0}.eyebrow{display:block;color:#9b673e;font-size:18rpx;letter-spacing:3rpx}.admin-title{display:block;margin:6rpx 0;font-size:36rpx;font-weight:600}.admin-copy{color:#747a75;font-size:19rpx;line-height:1.5}.metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:12rpx}.metric-card,.todo-card,.action-card,.record-card{padding:18rpx;border:1px solid #e6e1d5;border-radius:9rpx;background:#fffdf7}.metric-card{min-height:95rpx;display:flex;flex-direction:column;justify-content:space-between}.metric-card text:first-child,.record-copy{color:#747a75;font-size:18rpx}.metric-card text:last-child{font-size:28rpx;font-weight:600}.todo-card,.action-card{margin-top:16rpx}.card-title,.record-title{display:block;font-size:22rpx;font-weight:600}.todo-card button{width:100%;padding:16rpx 0;border-top:1px solid #eee9de;text-align:left;font-size:20rpx}.action-row{display:flex;flex-direction:column;gap:12rpx;color:#747a75;font-size:18rpx}.primary{padding:12rpx 18rpx;border-radius:8rpx;color:white;background:#18362b;font-size:20rpx}.record-card{margin-top:12rpx;display:flex;align-items:center;justify-content:space-between;gap:8rpx}.record-title{font-size:20rpx}.record-copy{display:block;margin-top:6rpx;line-height:1.4}.record-card button{flex:none;padding:10rpx;border:1px solid #ddd5c5;border-radius:7rpx;font-size:18rpx}.empty,.preview-note{display:block;margin-top:16rpx;color:#747a75;font-size:19rpx;line-height:1.5}.reset-button{margin:26rpx 0;color:#8b5e43;font-size:18rpx}.add-button{margin-bottom:10rpx}.modal-mask{position:fixed;inset:0;z-index:10;display:flex;align-items:flex-end;background:#0008}.editor-modal{width:100%;max-height:82vh;padding:28rpx 34rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:20rpx 20rpx 0 0;background:#fffdf7;box-sizing:border-box}.modal-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:18rpx;font-size:30rpx;font-weight:600}.editor-modal>label{display:block;margin:14rpx 0;color:#454943;font-size:20rpx}.editor-modal input,.editor-modal textarea,.picker-value{width:100%;min-height:68rpx;margin-top:8rpx;padding:14rpx;box-sizing:border-box;border:1px solid #ded9cd;border-radius:8rpx;background:white;font-size:21rpx}.editor-modal textarea{min-height:130rpx}.save-button{width:100%;margin-top:18rpx}.editor-modal checkbox-group label{display:inline-block;margin-right:18rpx}
</style>
