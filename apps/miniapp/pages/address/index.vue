<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

interface AddressRecord {
  id: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

type AddressDraft = Omit<AddressRecord, 'id'>;
const STORAGE_KEY = 'shanhe-v19-address-preview-v1';
const addresses = ref<AddressRecord[]>([]);
const editorOpen = ref(false);
const editingId = ref('');
const draft = reactive<AddressDraft>(emptyDraft());

function emptyDraft(): AddressDraft {
  return { recipientName: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false };
}

function refresh() {
  const saved = uni.getStorageSync(STORAGE_KEY);
  if (Array.isArray(saved)) addresses.value = saved as AddressRecord[];
  else if (typeof saved === 'string') {
    try { addresses.value = JSON.parse(saved) as AddressRecord[]; }
    catch { addresses.value = []; }
  } else addresses.value = [];
}

onShow(refresh);

function openCreate() {
  editingId.value = '';
  Object.assign(draft, emptyDraft(), { isDefault: addresses.value.length === 0 });
  editorOpen.value = true;
}

function openEdit(address: AddressRecord) {
  editingId.value = address.id;
  Object.assign(draft, address);
  editorOpen.value = true;
}

function updateRegion(event: { detail: { value: unknown } }) {
  const region = Array.isArray(event.detail.value) ? event.detail.value.map(String) : [];
  [draft.province, draft.city, draft.district] = [region[0] ?? '', region[1] ?? '', region[2] ?? ''];
}

function saveAddress() {
  const completeRegion = [draft.province, draft.city, draft.district].every(value => value.trim().length > 0);
  if (!draft.recipientName.trim() || !/^1[3-9]\d{9}$/.test(draft.phone) || !completeRegion || !draft.detail.trim()) {
    uni.showToast({ title: '请填写完整信息并检查手机号', icon: 'none' });
    return;
  }

  const id = editingId.value || `preview-address-${Date.now()}`;
  const record = { ...draft, recipientName: draft.recipientName.trim(), detail: draft.detail.trim(), id };
  const next = editingId.value
    ? addresses.value.map(address => address.id === id ? record : address)
    : [...addresses.value, record];
  const makeDefault = record.isDefault || next.length === 1;
  addresses.value = next.map(address => ({ ...address, isDefault: makeDefault ? address.id === id : address.isDefault }));
  uni.setStorageSync(STORAGE_KEY, addresses.value);
  editorOpen.value = false;
  uni.showToast({ title: '已保存到本机预览' });
}

function setDefault(id: string) {
  addresses.value = addresses.value.map(address => ({ ...address, isDefault: address.id === id }));
  uni.setStorageSync(STORAGE_KEY, addresses.value);
}

function removeAddress(id: string) {
  uni.showModal({
    title: '删除收货地址',
    content: '确定从本机预览中删除这条地址吗？',
    success: ({ confirm }) => {
      if (!confirm) return;
      addresses.value = addresses.value.filter(address => address.id !== id);
      if (addresses.value.length && !addresses.value.some(address => address.isDefault)) addresses.value[0]!.isDefault = true;
      uni.setStorageSync(STORAGE_KEY, addresses.value);
    }
  });
}

function closeEditor() { editorOpen.value = false; }
function goBack() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/profile/index' }) }); }
</script>

<template>
  <scroll-view scroll-y class="subpage-scroll">
    <view class="address-page">
      <view class="address-header"><button class="back-button" @tap="goBack"><text>‹</text><text>返回</text></button><text class="page-title">收货地址</text></view>
      <view class="preview-note"><text class="note-mark">i</text><text>当前为本机预览地址簿，保存内容只留在这台设备。</text></view>

      <view v-if="addresses.length" class="address-list">
        <view v-for="address in addresses" :key="address.id" class="address-card">
          <view class="address-card-head"><view class="recipient"><text class="recipient-name">{{ address.recipientName }}</text><text class="recipient-phone">{{ address.phone }}</text></view><text v-if="address.isDefault" class="default-tag">默认地址</text></view>
          <text class="address-detail">{{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}</text>
          <view class="address-card-actions"><button class="default-action" :class="{ selected: address.isDefault }" @tap="setDefault(address.id)"><text class="default-check">{{ address.isDefault ? '✓' : '' }}</text>默认地址</button><view class="address-action-group"><button @tap="openEdit(address)">编辑</button><text></text><button @tap="removeAddress(address.id)">删除</button></view></view>
        </view>
      </view>

      <view v-else class="address-empty"><view class="empty-illustration"><view class="map-pin">⌖</view><view class="empty-ground"></view></view><text class="empty-title">还没有收货地址</text><text class="empty-copy">添加常用地址，方便后续下单配送。</text><button class="add-address-button" @tap="openCreate"><text>＋</text>添加收货地址</button></view>
      <button v-if="addresses.length" class="secondary-add-button" @tap="openCreate">＋ 新增收货地址</button>
      <view class="bottom-space"></view>
    </view>
  </scroll-view>

  <view v-if="editorOpen" class="editor-mask" @tap="closeEditor">
    <view class="address-editor" @tap.stop>
      <view class="editor-heading"><view><text class="editor-title">{{ editingId ? '编辑地址' : '新增地址' }}</text><text class="editor-subtitle">请填写完整收件信息</text></view><button class="editor-close" @tap="closeEditor">×</button></view>
      <scroll-view scroll-y class="editor-fields">
        <label class="field-label">收件人<input v-model="draft.recipientName" placeholder="请输入收件人姓名" /></label>
        <label class="field-label">手机号码<input v-model="draft.phone" type="number" maxlength="11" placeholder="请输入收件人手机号" /></label>
        <label class="field-label">所在地区<picker mode="region" :value="[draft.province, draft.city, draft.district]" @change="updateRegion"><view class="region-picker">{{ draft.province ? `${draft.province} ${draft.city} ${draft.district}` : '请选择省 / 市 / 区' }}<text>›</text></view></picker></label>
        <label class="field-label">详细地址<textarea v-model="draft.detail" maxlength="255" placeholder="街道、门牌号、小区或村组" /></label>
        <label class="default-toggle"><checkbox v-model="draft.isDefault" color="#18362b" /><text>设为默认收货地址</text></label>
      </scroll-view>
      <button class="save-address-button" @tap="saveAddress">保存地址</button>
    </view>
  </view>
</template>

<style scoped>
.address-page { min-height: 100%; padding: 22rpx 34rpx 40rpx; background: var(--color-canvas); }
.address-header { min-height: 84rpx; margin-bottom: 22rpx; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.back-button { min-width: 112rpx; min-height: 88rpx; margin: 0; padding: 0 13rpx; display: flex; align-items: center; gap: 6rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: var(--color-surface); font-size: 22rpx; }
.back-button text:first-child { font-size: 36rpx; line-height: 1; }
.page-title { color: var(--color-text-primary); font-size: 34rpx; font-weight: 600; }
.preview-note { margin-bottom: 26rpx; padding: 17rpx 18rpx; display: flex; align-items: center; gap: 12rpx; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-text-secondary); background: var(--color-surface-muted); font-size: 19rpx; line-height: 1.5; }
.note-mark { width: 32rpx; height: 32rpx; flex: none; display: grid; place-items: center; border-radius: 50%; color: var(--color-brand); background: var(--color-surface); font-size: 18rpx; }
.address-list { display: flex; flex-direction: column; gap: 18rpx; }
.address-card { padding: 26rpx 24rpx 18rpx; border: 1px solid var(--color-border); border-radius: var(--radius-feature); background: var(--color-surface); box-shadow: 0 8rpx 24rpx rgba(24,54,43,.04); }
.address-card-head, .recipient, .address-card-actions, .address-action-group { display: flex; align-items: center; }
.address-card-head { justify-content: space-between; gap: 14rpx; }
.recipient { min-width: 0; flex-wrap: wrap; gap: 18rpx; }
.recipient-name { color: var(--color-text-primary); font-size: 28rpx; font-weight: 600; }
.recipient-phone { color: var(--color-text-secondary); font-size: 24rpx; }
.default-tag { padding: 6rpx 12rpx; border-radius: 999rpx; color: var(--color-brand); background: var(--v19-brand-100); font-size: 17rpx; white-space: nowrap; }
.address-detail { display: block; margin: 18rpx 0 22rpx; color: var(--color-text-secondary); font-size: 23rpx; line-height: 1.6; }
.address-card-actions { min-height: 65rpx; justify-content: space-between; border-top: 1px solid var(--color-border); }
.default-action { display: flex; align-items: center; gap: 9rpx; color: var(--color-text-secondary); font-size: 19rpx; }
.default-action.selected { color: var(--color-brand); }
.default-check { width: 26rpx; height: 26rpx; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: white; background: var(--color-surface); font-size: 17rpx; }
.default-action.selected .default-check { border-color: var(--v19-brand-700); background: var(--v19-brand-700); }
.address-action-group { gap: 14rpx; }
.address-action-group button { padding: 10rpx 6rpx; color: var(--color-text-secondary); font-size: 19rpx; }
.address-action-group text { height: 22rpx; border-left: 1px solid var(--color-border); }
.address-empty { margin: 36rpx 0 24rpx; padding: 44rpx 24rpx 36rpx; display: flex; flex-direction: column; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-feature); background: var(--color-surface); }
.empty-illustration { width: 160rpx; height: 140rpx; margin-bottom: 20rpx; position: relative; display: grid; place-items: center; }
.map-pin { width: 92rpx; height: 92rpx; position: relative; z-index: 1; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; color: var(--v19-brand-800); background: var(--v19-brand-100); font-size: 48rpx; }
.empty-ground { width: 135rpx; height: 20rpx; position: absolute; bottom: 0; border-radius: 50%; background: var(--color-surface-muted); }
.empty-title { color: var(--color-text-primary); font-size: 27rpx; font-weight: 600; }
.empty-copy { margin-top: 9rpx; color: var(--color-text-secondary); font-size: 20rpx; text-align: center; }
.add-address-button { min-width: 280rpx; min-height: 92rpx; margin-top: 28rpx; padding: 0 24rpx; display: flex; align-items: center; justify-content: center; gap: 10rpx; border-radius: var(--radius-control); color: white; background: var(--color-brand); font-size: 23rpx; font-weight: 600; }
.add-address-button text { font-size: 30rpx; line-height: 1; }
.secondary-add-button { width: 100%; min-height: 92rpx; margin-top: 22rpx; border: 1px dashed var(--color-border); border-radius: var(--radius-control); color: var(--color-brand); background: transparent; font-size: 22rpx; }
.bottom-space { height: 34rpx; }
.editor-mask { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: flex-end; justify-content: center; background: rgba(24,28,25,.48); }
.address-editor { width: 100%; max-width: 750rpx; max-height: 88%; padding: 30rpx 30rpx calc(24rpx + env(safe-area-inset-bottom)); display: flex; flex-direction: column; border-radius: 24rpx 24rpx 0 0; background: var(--color-surface); box-sizing: border-box; }
.editor-heading { margin-bottom: 16rpx; display: flex; align-items: center; justify-content: space-between; }
.editor-title, .editor-subtitle { display: block; }
.editor-title { color: var(--color-text-primary); font-size: 30rpx; font-weight: 600; }
.editor-subtitle { margin-top: 6rpx; color: var(--color-text-secondary); font-size: 18rpx; }
.editor-close { width: 58rpx; height: 58rpx; border-radius: 50%; color: var(--color-text-primary); background: var(--color-canvas); font-size: 34rpx; }
.editor-fields { min-height: 0; flex: 1; }
.field-label { display: block; margin: 15rpx 0; color: var(--color-text-secondary); font-size: 20rpx; }
.field-label input, .field-label textarea, .region-picker { width: 100%; min-height: 74rpx; margin-top: 8rpx; padding: 16rpx 18rpx; display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-text-primary); background: white; box-sizing: border-box; font-size: 21rpx; }
.field-label textarea { min-height: 110rpx; display: block; }
.region-picker { justify-content: space-between; }
.region-picker text { color: var(--v19-muted-2); font-size: 30rpx; }
.default-toggle { min-height: 58rpx; display: flex; align-items: center; gap: 10rpx; color: var(--color-text-secondary); font-size: 20rpx; }
.default-toggle checkbox { transform: scale(.85); transform-origin: left center; }
.save-address-button { width: 100%; min-height: 82rpx; margin-top: 18rpx; border-radius: var(--radius-control); color: white; background: var(--color-brand); font-size: 24rpx; font-weight: 600; }
</style>
