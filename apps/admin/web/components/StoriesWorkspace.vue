<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { adminRequest, getAdminData, type PageResult } from '../api';

type StoryType = 'ORIGIN' | 'CRAFT' | 'PEOPLE' | 'PRODUCT_KNOWLEDGE' | 'USAGE' | 'STORAGE' | 'BRAND' | 'GIFTING';
type StoryStatus = 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN';
interface AdminStory {
  readonly id: string; readonly publicId: string; readonly contentType: StoryType; readonly title: string;
  readonly summary: string; readonly body: string; readonly coverObjectKey: string | null;
  readonly relatedProductPublicId: string | null; readonly relatedProduct: { readonly publicId: string; readonly name: string; readonly coverObjectKey: string | null } | null;
  readonly status: StoryStatus; readonly sortOrder: number; readonly publishedAt: string | null;
}
interface ProductOptionsEnvelope { readonly code: number; readonly message: string; readonly data: { readonly items: readonly { readonly id: string; readonly name: string }[] } }

const props = defineProps<{ readonly canWrite: boolean; readonly refreshKey: number }>();
const stories = ref<PageResult<AdminStory> | null>(null);
const loading = ref(false);
const loadError = ref('');
const keyword = ref('');
const statusFilter = ref('ALL');
const page = ref(1);
const editorOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const uploading = ref(false);
const feedback = ref('');
const formError = ref('');
const productOptions = ref<readonly { readonly id: string; readonly name: string }[]>([]);
const productOptionsError = ref('');
const draft = ref({ contentType: 'ORIGIN' as StoryType, title: '', summary: '', body: '', coverObjectKey: '', relatedProductPublicId: '', sortOrder: 0 });
const typeOptions: readonly { value: StoryType; label: string }[] = [
  { value: 'ORIGIN', label: '产地风物' }, { value: 'CRAFT', label: '工艺介绍' }, { value: 'PEOPLE', label: '人物' },
  { value: 'PRODUCT_KNOWLEDGE', label: '产品知识' }, { value: 'USAGE', label: '食用方法' }, { value: 'STORAGE', label: '保存方法' },
  { value: 'BRAND', label: '品牌故事' }, { value: 'GIFTING', label: '节令送礼' }
];

function typeName(type: StoryType) { return typeOptions.find(option => option.value === type)?.label ?? type; }
function statusName(status: StoryStatus) { return status === 'PUBLISHED' ? '已发布' : status === 'WITHDRAWN' ? '已撤回' : '草稿'; }
function mediaUrl(key: string | null) { return key && /^products\/[A-Za-z0-9/_-]+\.(?:png|jpe?g|webp|avif)$/.test(key) ? `/media/${key}` : ''; }

async function loadStories() {
  loading.value = true; loadError.value = '';
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: '20', keyword: keyword.value.trim() });
    if (statusFilter.value !== 'ALL') params.set('status', statusFilter.value);
    stories.value = await getAdminData<PageResult<AdminStory>>(`stories?${params}`);
  } catch (error) { loadError.value = error instanceof Error ? error.message : '山野志内容暂时无法读取'; }
  finally { loading.value = false; }
}

async function loadProductOptions() {
  productOptionsError.value = '';
  try {
    const response = await fetch('/api/v1/products?page=1&pageSize=50');
    const payload = await response.json() as ProductOptionsEnvelope;
    if (!response.ok || payload.code !== 0) throw new Error('商品选项暂时无法读取');
    productOptions.value = payload.data.items.map(item => ({ id: item.id, name: item.name }));
  } catch (error) { productOptionsError.value = error instanceof Error ? error.message : '商品选项暂时无法读取'; }
}

async function openEditor(story?: AdminStory) {
  if (!props.canWrite) return;
  if (!productOptions.value.length) await loadProductOptions();
  editingId.value = story?.id ?? null; formError.value = '';
  draft.value = story ? {
    contentType: story.contentType, title: story.title, summary: story.summary, body: story.body,
    coverObjectKey: story.coverObjectKey ?? '', relatedProductPublicId: story.relatedProductPublicId ?? '', sortOrder: story.sortOrder
  } : { contentType: 'ORIGIN', title: '', summary: '', body: '', coverObjectKey: '', relatedProductPublicId: '', sortOrder: 0 };
  editorOpen.value = true;
}

async function uploadCover(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploading.value = true; formError.value = '';
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('封面图片不能超过 5 MB');
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => reject(new Error('封面图片读取失败')); reader.readAsDataURL(file);
    });
    const result = await adminRequest<{ readonly objectKey: string }>('media', { method: 'POST', body: JSON.stringify({ base64 }) });
    draft.value.coverObjectKey = result.objectKey;
    feedback.value = '封面已上传，保存草稿后生效。';
  } catch (error) { formError.value = error instanceof Error ? error.message : '封面上传失败'; }
  finally { uploading.value = false; input.value = ''; }
}

async function saveStory() {
  if (!props.canWrite || saving.value) return;
  saving.value = true; formError.value = '';
  try {
    const body = { ...draft.value, relatedProductPublicId: draft.value.relatedProductPublicId || null, sortOrder: Number(draft.value.sortOrder) };
    await adminRequest(editingId.value ? `stories/${editingId.value}` : 'stories', { method: editingId.value ? 'PUT' : 'POST', body: JSON.stringify(body) });
    editorOpen.value = false; feedback.value = editingId.value ? '文章已保存为草稿或已撤回内容。' : '文章草稿已保存。'; await loadStories();
  } catch (error) { formError.value = error instanceof Error ? error.message : '文章保存失败'; }
  finally { saving.value = false; }
}

async function changeStatus(story: AdminStory, action: 'publish' | 'withdraw') {
  if (!props.canWrite) return;
  try {
    await adminRequest(`stories/${story.id}/${action}`, { method: 'POST' });
    feedback.value = action === 'publish' ? '文章已发布到小程序故事列表。' : '文章已撤回，小程序刷新后不再展示。';
    await loadStories();
  } catch (error) { feedback.value = error instanceof Error ? error.message : '内容状态更新失败'; }
}

function changePage(next: number) { if (next < 1 || next > Math.ceil((stories.value?.total ?? 0) / 20)) return; page.value = next; void loadStories(); }
watch([keyword, statusFilter], () => { page.value = 1; void loadStories(); });
watch(() => props.refreshKey, () => { void loadStories(); });
onMounted(() => { void loadStories(); });
</script>

<template>
  <div class="stories-workspace">
    <div class="page-heading">
      <div><span class="overline">CONTENT · SHANHE STORIES</span><h1>山野志</h1><p>管理文章草稿与发布状态，公开内容会同步到小程序故事页。</p></div>
      <button v-if="canWrite" class="primary-button" @click="openEditor()"><span>＋</span> 新建文章</button>
    </div>
    <div class="story-scope-note">当前已接入文章、封面图片与商品关联。视频上传、专题管理和溯源内容仍未接入；内测示例不是经核实的产地或交易资料。</div>
    <div v-if="feedback" class="operation-feedback" role="status"><span>{{ feedback }}</span><button aria-label="关闭提示" @click="feedback = ''">×</button></div>
    <section class="panel table-panel">
      <div class="table-toolbar">
        <div class="table-title"><h2>文章列表</h2><span class="result-count">{{ stories?.total ?? '—' }} 篇</span></div>
        <div class="filters"><label class="search-field"><span>⌕</span><input v-model="keyword" type="search" placeholder="搜索文章标题或摘要" /></label><select v-model="statusFilter" aria-label="文章状态筛选"><option value="ALL">全部状态</option><option value="DRAFT">草稿</option><option value="PUBLISHED">已发布</option><option value="WITHDRAWN">已撤回</option></select></div>
      </div>
      <div v-if="loading" class="table-state"><span class="state-spinner"></span><strong>正在读取山野志</strong><small>连接内容管理 API…</small></div>
      <div v-else-if="loadError" class="table-state error-state"><span class="state-mark">!</span><strong>{{ loadError }}</strong><button class="text-button" @click="loadStories">再试一次</button></div>
      <div v-else-if="!stories?.items.length" class="table-state"><span class="state-mark">禾</span><strong>目前没有文章记录</strong><small>新建文章并保存草稿后，会显示在这里。</small></div>
      <div v-else class="story-list">
        <article v-for="story in stories.items" :key="story.id" class="story-row">
          <img v-if="mediaUrl(story.coverObjectKey)" class="story-cover" :src="mediaUrl(story.coverObjectKey)" :alt="story.title" />
          <span v-else class="story-cover story-cover-empty">禾</span>
          <div class="story-copy"><div class="story-meta"><span>{{ typeName(story.contentType) }}</span><span class="status-tag" :class="story.status.toLowerCase()">{{ statusName(story.status) }}</span></div><h3>{{ story.title }}</h3><p>{{ story.summary }}</p><small>{{ story.relatedProduct?.name ? `关联商品：${story.relatedProduct.name}` : '未关联商品' }} · 排序 {{ story.sortOrder }}</small></div>
          <div class="story-actions"><button v-if="canWrite && story.status !== 'PUBLISHED'" class="text-button" @click="openEditor(story)">编辑</button><button v-if="canWrite && story.status !== 'PUBLISHED'" class="text-button" @click="changeStatus(story, 'publish')">发布</button><button v-if="canWrite && story.status === 'PUBLISHED'" class="text-button danger-text" @click="changeStatus(story, 'withdraw')">撤回</button><span v-if="!canWrite">只读</span></div>
        </article>
      </div>
      <footer v-if="stories && stories.total > 20" class="table-footer"><span>共 {{ stories.total }} 篇</span><button class="pagination-button" :disabled="page === 1" @click="changePage(page - 1)">上一页</button><span class="page-number">{{ page }}</span><button class="pagination-button" :disabled="page * 20 >= stories.total" @click="changePage(page + 1)">下一页</button></footer>
    </section>

    <div v-if="editorOpen" class="drawer-mask" @click.self="editorOpen = false">
      <form class="editor-drawer story-editor" role="dialog" aria-modal="true" aria-labelledby="story-editor-title" @submit.prevent="saveStory">
        <header><div><span class="overline">ARTICLE · DRAFT</span><h2 id="story-editor-title">{{ editingId ? '编辑文章' : '新建文章' }}</h2></div><button type="button" class="icon-action" aria-label="关闭" @click="editorOpen = false">×</button></header>
        <div class="drawer-notice">内测期间请使用已核实的文案。请勿把示意图标记为授权实拍，也不要添加未经证实的认证、检测或交易信息。</div>
        <div class="form-section">
          <label>内容类型<select v-model="draft.contentType"><option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
          <label>文章标题<input v-model="draft.title" required maxlength="120" placeholder="填写准确、清晰的标题" /></label>
          <label>摘要<textarea v-model="draft.summary" required maxlength="300" rows="2" placeholder="用于列表展示，最多 300 字" /></label>
          <label>正文<textarea v-model="draft.body" required maxlength="50000" rows="12" placeholder="文章正文；按段落换行即可" /></label>
          <div class="story-cover-field"><strong>封面图片</strong><p class="field-help">沿用本机媒体存储，可上传或替换 PNG、JPEG、WebP 图片，每张不超过 5 MB。</p><img v-if="mediaUrl(draft.coverObjectKey)" :src="mediaUrl(draft.coverObjectKey)" alt="当前文章封面" /><label class="upload-control">{{ uploading ? '正在上传…' : draft.coverObjectKey ? '替换封面' : '上传封面' }}<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading || saving" @change="uploadCover" /></label><small v-if="draft.coverObjectKey" class="mono">{{ draft.coverObjectKey }}</small></div>
          <label>关联在售商品<select v-model="draft.relatedProductPublicId"><option value="">不关联商品</option><option v-for="product in productOptions" :key="product.id" :value="product.id">{{ product.name }}</option></select><small>{{ productOptionsError || '仅显示当前前台可见的在售商品。' }}</small></label>
          <label>排序<input v-model.number="draft.sortOrder" type="number" min="0" max="999999" /></label>
        </div>
        <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>
        <footer><button type="button" class="secondary-button" @click="editorOpen = false">取消</button><button class="primary-button" :disabled="saving || uploading">{{ saving ? '保存中…' : '保存草稿' }}</button></footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.story-scope-note { margin: -4px 0 18px; padding: 12px 14px; border-left: 2px solid var(--admin-border); color: var(--admin-text-muted); background: var(--admin-surface-muted); font-size: 12px; line-height: 1.6; }
.story-list { padding: 0 18px; }
.story-row { min-height: 128px; padding: 14px 0; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #efeee9; }
.story-cover { width: 110px; height: 92px; flex: none; object-fit: cover; border: 1px solid var(--admin-border); border-radius: 6px; }
.story-cover-empty { display: grid; place-items: center; color: var(--admin-brand); background: var(--admin-brand-soft); font-family: STSong, "Songti SC", serif; }
.story-copy { min-width: 0; flex: 1; }
.story-meta { display: flex; align-items: center; gap: 9px; color: var(--admin-text-muted); font-size: 10px; }
.story-copy h3 { margin: 8px 0 5px; color: var(--admin-text); font-size: 14px; }
.story-copy p { margin: 0 0 8px; overflow: hidden; color: var(--admin-text-muted); font-size: 12px; line-height: 1.5; text-overflow: ellipsis; }
.story-copy > small { color: var(--admin-text-faint); font-size: 10px; }
.story-actions { min-width: 84px; display: flex; flex-direction: column; align-items: flex-end; }
.story-actions .text-button { margin: 1px 0; }
.story-cover-field { display: grid; gap: 8px; color: #667067; font-size: 12px; }
.story-cover-field > img { width: 100%; max-height: 210px; object-fit: cover; border-radius: 6px; }
.story-cover-field > small { overflow-wrap: anywhere; }
.story-editor { gap: 0; }
.story-editor .form-section { margin-top: 16px; }
@media (max-width: 620px) {
  .story-list { padding: 0 12px; }
  .story-row { align-items: flex-start; gap: 10px; }
  .story-cover { width: 78px; height: 78px; }
  .story-actions { min-width: 56px; }
  .story-actions .text-button { min-height: 38px; padding-right: 4px; padding-left: 4px; }
  .story-copy h3 { font-size: 13px; line-height: 1.45; }
  .story-copy p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
}
</style>
