<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NAutoComplete,
  NButton,
  NCheckbox,
  NFormItem,
  NModal,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  NUpload,
  NUploadDragger
} from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetCommApprovalFiles, fetchSearchCommOrders } from '@/service/api/comm';

const props = defineProps<{
  mode: 'image' | 'file';
}>();

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  (
    e: 'confirm',
    payload: {
      type: 'image' | 'file';
      orderNo: string;
      files: Array<{ name: string; sizeLabel: string; source: 'upload' | 'approval'; orderNo?: string }>;
    }
  ): void;
}>();

const orderKeyword = ref('');
const orderOptions = ref<Api.Comm.CommOrderOption[]>([]);
const selectedOrderNo = ref('');
const uploadFiles = ref<UploadFileInfo[]>([]);
const fileTab = ref<'upload' | 'approval'>('upload');
const approvalFiles = ref<Api.Comm.CommApprovalFile[]>([]);
const checkedApprovalIds = ref<string[]>([]);
const dragOver = ref(false);
const orderNoError = ref('');

const title = computed(() => (props.mode === 'image' ? '发送图片' : '发送文件'));
const showOrderField = computed(() => props.mode === 'image' || fileTab.value === 'upload');
const accept = computed(() => (props.mode === 'image' ? 'image/*' : undefined));
const dropHint = computed(() =>
  props.mode === 'image'
    ? '点击或拖拽图片到此处上传'
    : '点击或拖拽文件到此处上传，或从审批单中选择'
);

const autocompleteOptions = computed(() =>
  orderOptions.value.map(row => ({
    label: `${row.orderNo} · ${row.customerName} · ${row.destination}`,
    value: row.orderNo
  }))
);

const selectedOrder = computed(() => {
  if (!selectedOrderNo.value) return null;
  return orderOptions.value.find(row => row.orderNo === selectedOrderNo.value) ?? null;
});

function resolveOrderFromKeyword(): Api.Comm.CommOrderOption | null {
  const keyword = orderKeyword.value.trim();
  if (!keyword) return null;
  if (selectedOrder.value) return selectedOrder.value;
  return orderOptions.value.find(row => row.orderNo === keyword) ?? null;
}

async function searchOrders(keyword?: string) {
  const { data } = await fetchSearchCommOrders(keyword);
  orderOptions.value = data ?? [];
  if (!selectedOrderNo.value && orderOptions.value.length === 1) {
    selectedOrderNo.value = orderOptions.value[0].orderNo;
  }
}

async function loadApprovalFiles() {
  const keyword = showOrderField.value ? orderKeyword.value || selectedOrderNo.value || undefined : undefined;
  const { data } = await fetchGetCommApprovalFiles({ keyword });
  approvalFiles.value = data ?? [];
}

watch(fileTab, tab => {
  orderNoError.value = '';
  if (props.mode === 'file' && tab === 'approval') {
    loadApprovalFiles();
  }
});

watch(orderKeyword, val => {
  orderNoError.value = '';
  if (!val) {
    selectedOrderNo.value = '';
  } else if (selectedOrderNo.value && val !== selectedOrderNo.value) {
    selectedOrderNo.value = '';
  }
  searchOrders(val);
  if (props.mode === 'file') loadApprovalFiles();
});

watch(visible, open => {
  if (!open) return;
  orderKeyword.value = '';
  selectedOrderNo.value = '';
  orderNoError.value = '';
  uploadFiles.value = [];
  checkedApprovalIds.value = [];
  fileTab.value = 'upload';
  searchOrders();
  if (props.mode === 'file') loadApprovalFiles();
});

function formatSize(size?: number) {
  if (!size) return '未知大小';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function handleUploadChange(options: { fileList: UploadFileInfo[] }) {
  uploadFiles.value = options.fileList;
}

function onDropFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  const next = files.map((file, index) => ({
    id: `drop-${Date.now()}-${index}`,
    name: file.name,
    status: 'finished' as const,
    file,
    url: props.mode === 'image' ? URL.createObjectURL(file) : undefined
  }));
  uploadFiles.value = [...uploadFiles.value, ...next];
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  dragOver.value = true;
}

function onDragLeave() {
  dragOver.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  dragOver.value = false;
  if (e.dataTransfer?.files?.length) onDropFiles(e.dataTransfer.files);
}

function handleSelectOrder(value: string) {
  selectedOrderNo.value = value;
  orderKeyword.value = value;
  orderNoError.value = '';
  if (props.mode === 'file') loadApprovalFiles();
}

function validateOrderNo(): Api.Comm.CommOrderOption | null {
  const order = resolveOrderFromKeyword();
  if (!orderKeyword.value.trim()) {
    orderNoError.value = '请填写关联订单号';
    return null;
  }
  if (!order) {
    orderNoError.value = '请从搜索结果中选择有效订单号';
    return null;
  }
  selectedOrderNo.value = order.orderNo;
  orderKeyword.value = order.orderNo;
  orderNoError.value = '';
  return order;
}

function toggleApproval(id: string, checked: boolean) {
  if (checked) {
    if (!checkedApprovalIds.value.includes(id)) checkedApprovalIds.value.push(id);
  } else {
    checkedApprovalIds.value = checkedApprovalIds.value.filter(item => item !== id);
  }
}

function handleConfirm() {
  const isApprovalTab = props.mode === 'file' && fileTab.value === 'approval';
  const files: Array<{ name: string; sizeLabel: string; source: 'upload' | 'approval'; orderNo?: string }> = [];

  if (isApprovalTab) {
    approvalFiles.value
      .filter(item => checkedApprovalIds.value.includes(item.id))
      .forEach(item => {
        files.push({
          name: item.fileName,
          sizeLabel: item.sizeLabel,
          source: 'approval',
          orderNo: item.orderNo
        });
      });
  } else {
    const order = validateOrderNo();
    if (!order) {
      window.$message?.warning(orderNoError.value || '请先选择关联订单号');
      return;
    }
    uploadFiles.value.forEach(item => {
      files.push({
        name: item.name,
        sizeLabel: formatSize(item.file?.size),
        source: 'upload'
      });
    });
    if (!files.length) {
      window.$message?.warning(props.mode === 'image' ? '请先上传或拖入图片' : '请先上传文件');
      return;
    }
    emit('confirm', { type: props.mode, orderNo: order.orderNo, files });
    visible.value = false;
    return;
  }

  if (!files.length) {
    window.$message?.warning('请先选择审批附件');
    return;
  }

  emit('confirm', {
    type: props.mode,
    orderNo: files[0].orderNo || '',
    files
  });
  visible.value = false;
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="title"
    class="w-560px"
    :to="POPUP_TO_BODY"
    :mask-closable="false"
  >
    <template v-if="mode === 'file'">
      <NTabs v-model:value="fileTab" type="line" size="small" class="mb-12px">
        <NTabPane name="upload" tab="上传文件" />
        <NTabPane name="approval" tab="审批文件" />
      </NTabs>
    </template>

    <template v-if="showOrderField">
      <NFormItem label="关联订单号" required :validation-status="orderNoError ? 'error' : undefined" :feedback="orderNoError">
        <NAutoComplete
          v-model:value="orderKeyword"
          :options="autocompleteOptions"
          clearable
          placeholder="模糊搜索订单号 / 客户 / 目的地（必填）"
          @select="handleSelectOrder"
          @update:value="val => searchOrders(val)"
        />
      </NFormItem>

      <div v-if="selectedOrder" class="order-meta">
        <div class="order-meta-row">
          <span class="order-meta-label">已选订单</span>
          <span>{{ selectedOrder.orderNo }} · {{ selectedOrder.customerName }} · {{ selectedOrder.destination }}</span>
        </div>
        <div class="order-meta-row order-meta-row--cs">
          <span class="order-meta-label">海柜客服</span>
          <NTag type="success" size="small">{{ selectedOrder.containerCs }}</NTag>
        </div>
      </div>
    </template>

    <div
      v-if="mode === 'image' || fileTab === 'upload'"
      class="drop-zone"
      :class="{ 'drop-zone--active': dragOver }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <NUpload
        :accept="accept"
        multiple
        :default-upload="false"
        :file-list="uploadFiles"
        @update:file-list="handleUploadChange"
      >
        <NUploadDragger>
          <div class="text-14px text-#374151">{{ dropHint }}</div>
          <div class="mt-4px text-12px text-#9ca3af">支持多选，发送前需关联订单号</div>
        </NUploadDragger>
      </NUpload>
    </div>

    <div v-else class="approval-list">
      <div v-if="!approvalFiles.length" class="py-24px text-center text-#9ca3af text-13px">暂无匹配审批文件</div>
      <div v-for="item in approvalFiles" :key="item.id" class="approval-item">
        <NCheckbox
          :checked="checkedApprovalIds.includes(item.id)"
          @update:checked="checked => toggleApproval(item.id, checked)"
        />
        <div class="flex-1 min-w-0">
          <div class="text-13px font-medium truncate">{{ item.fileName }}</div>
          <div class="text-12px text-#6b7280">{{ item.orderNo }} · {{ item.sizeLabel }}</div>
        </div>
        <NTag size="small" :type="item.status === '已通过' ? 'success' : item.status === '待审批' ? 'warning' : 'error'">
          {{ item.status }}
        </NTag>
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" @click="handleConfirm">发送</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.order-meta {
  margin: -4px 0 12px;
  padding: 10px 12px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #f0fdf4;
  font-size: 13px;
}

.order-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
}

.order-meta-row + .order-meta-row {
  margin-top: 8px;
}

.order-meta-label {
  flex-shrink: 0;
  width: 64px;
  color: #6b7280;
}

.order-meta-row--cs .order-meta-label {
  font-weight: 500;
}

.drop-zone {
  border-radius: 8px;
}

.drop-zone--active :deep(.n-upload-dragger) {
  border-color: #2563eb;
  background: #eff6ff;
}

.approval-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px;
}

.approval-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px dashed #f3f4f6;
}

.approval-item:last-child {
  border-bottom: none;
}
</style>
