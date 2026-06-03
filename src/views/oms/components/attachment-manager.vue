<script setup lang="tsx">
import { computed, h, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { NButton, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { AcceptType } from '@/enum/business';
import { useDict } from '@/hooks/business/dict';
import FileUpload from '@/components/custom/file-upload.vue';
import {
  fetchDeleteContainerOrderAttachment,
  fetchGetContainerOrderAttachments,
  fetchUploadContainerOrderAttachment,
  fetchUploadContainerOrderDo
} from '@/service/api/oms/container-order';
import {
  fetchDeleteCargoOrderAttachment,
  fetchGetCargoOrderAttachments,
  fetchUploadCargoOrderAttachment
} from '@/service/api/oms/cargo-order';
import {
  fetchDeleteOutboundOrderAttachment,
  fetchGetOutboundOrderAttachments,
  fetchUploadOutboundOrderAttachment
} from '@/service/api/oms/outbound-order';

defineOptions({ name: 'OmsAttachmentManager' });

type TargetKind = 'container' | 'cargo' | 'outbound';

const props = withDefaults(
  defineProps<{
    targetKind: TargetKind;
    targetId?: CommonType.IdType | null;
    includeContainerAttachments?: boolean;
  }>(),
  {
    includeContainerAttachments: true
  }
);

const emit = defineEmits<{ (e: 'changed'): void }>();

const { options: attachmentTypeOptions, record: attachmentTypeRecord } = useDict('oms_attachment_type');

/** 图片 + 文档类型并集，与 AcceptType 枚举保持同步 */
const OMS_FILE_ACCEPT = [...new Set([...AcceptType.Image.split(','), ...AcceptType.File.split(',')])].join(',');

const CUSTOMER_VISIBLE_TYPES = new Set(['DO', 'POD', 'CUSTOMER_FILE']);

const loading = ref(false);
const bizUploading = ref(false);
const uploadVisible = ref(false);
const uploadAsDo = ref(false);
const attachments = ref<Api.Oms.BizAttachment[]>([]);
const modalFileList = ref<UploadFileInfo[]>([]);
const selectedAttachmentType = ref<string | null>(null);
const uploadRemark = ref('');
const registeredOssIds = ref(new Set<string>());

const uploadModalTitle = computed(() => (uploadAsDo.value ? '上传 DO' : '上传文件'));

/** 普通上传不含 DO（海柜走「上传 DO」按钮） */
const uploadAttachmentTypeOptions = computed(() =>
  attachmentTypeOptions.value.filter(item => item.value !== 'DO')
);

const doFiles = computed(() => attachments.value.filter(item => item.attachmentType === 'DO'));
const containerFiles = computed(() => attachments.value.filter(item => item.targetType === 'CONTAINER_ORDER' && item.attachmentType !== 'DO'));
const cargoFiles = computed(() => attachments.value.filter(item => item.targetType === 'CARGO_ORDER'));
const exceptionFiles = computed(() => attachments.value.filter(item => item.attachmentType === 'EXCEPTION_IMAGE'));

function attachmentTypeLabel(type?: string | null) {
  if (!type) return '--';
  return attachmentTypeRecord.value[type]?.dictLabel || type;
}

function tagTypeForAttachment(type?: string | null): NaiveUI.ThemeColor {
  if (type === 'DO') return 'primary';
  if (type === 'POD') return 'success';
  if (type === 'EXCEPTION_IMAGE') return 'error';
  if (type === 'CUSTOMER_FILE') return 'info';
  return 'default';
}

function defaultAttachmentType() {
  const preferred = uploadAttachmentTypeOptions.value.find(item => item.value === 'OTHER');
  const value = preferred?.value ?? uploadAttachmentTypeOptions.value[0]?.value ?? null;
  return value == null ? null : String(value);
}

function openUpload(doFile = false) {
  uploadAsDo.value = doFile;
  selectedAttachmentType.value = doFile ? 'DO' : defaultAttachmentType();
  uploadRemark.value = '';
  modalFileList.value = [];
  registeredOssIds.value.clear();
  uploadVisible.value = true;
}

function closeUploadModal() {
  uploadVisible.value = false;
  modalFileList.value = [];
}

function buildAttachmentParams(file: UploadFileInfo, attachmentType: string): Api.Oms.BizAttachmentOperateParams {
  const fileName = file.name || 'file';
  const dot = fileName.lastIndexOf('.');
  const fileExt = dot > 0 ? fileName.slice(dot + 1) : '';
  return {
    attachmentType,
    fileName,
    fileUrl: file.url || '',
    fileSize: file.file?.size ?? null,
    fileExt,
    mimeType: file.file?.type || '',
    customerVisibleFlag: CUSTOMER_VISIBLE_TYPES.has(attachmentType) ? 1 : 0,
    internalVisibleFlag: 1,
    remark: uploadRemark.value?.trim() || ''
  };
}

async function registerUploadedFile(file: UploadFileInfo, attachmentType: string, asDo: boolean) {
  if (!props.targetId || !file.url) return false;
  const ossKey = String(file.id);
  if (registeredOssIds.value.has(ossKey)) return true;
  registeredOssIds.value.add(ossKey);

  const params = buildAttachmentParams(file, attachmentType);
  let uploadFn: (id: CommonType.IdType, data: Api.Oms.BizAttachmentOperateParams) => any;
  if (props.targetKind === 'container') {
    uploadFn = asDo ? fetchUploadContainerOrderDo : fetchUploadContainerOrderAttachment;
  } else if (props.targetKind === 'outbound') {
    uploadFn = fetchUploadOutboundOrderAttachment;
  } else {
    uploadFn = fetchUploadCargoOrderAttachment;
  }

  const { error } = await uploadFn(props.targetId, params);
  if (error) {
    registeredOssIds.value.delete(ossKey);
    return false;
  }
  return true;
}

async function processModalUpload(list: UploadFileInfo[]) {
  const attachmentType = uploadAsDo.value ? 'DO' : selectedAttachmentType.value;
  if (!attachmentType) {
    window.$message?.warning('请先选择文件类型');
    return;
  }

  const pending = list.filter(item => item.status === 'finished' && item.url && !registeredOssIds.value.has(String(item.id)));
  if (!pending.length || bizUploading.value) return;

  bizUploading.value = true;
  try {
    let okCount = 0;
    for (const file of pending) {
      const ok = await registerUploadedFile(file, attachmentType, uploadAsDo.value);
      if (ok) okCount += 1;
    }
    if (okCount > 0) {
      window.$message?.success(uploadAsDo.value ? 'DO 上传成功' : '文件上传成功');
      closeUploadModal();
      await loadData();
      emit('changed');
    }
  } finally {
    bizUploading.value = false;
  }
}

watch(
  modalFileList,
  list => {
    if (uploadVisible.value) processModalUpload(list);
  },
  { deep: true }
);

watch(
  uploadAttachmentTypeOptions,
  options => {
    if (uploadVisible.value && !uploadAsDo.value && !selectedAttachmentType.value && options.length) {
      selectedAttachmentType.value = defaultAttachmentType();
    }
  },
  { immediate: true }
);

async function loadData() {
  if (!props.targetId) return;
  loading.value = true;
  let fetchPromise: any;
  if (props.targetKind === 'container') {
    fetchPromise = fetchGetContainerOrderAttachments(props.targetId);
  } else if (props.targetKind === 'outbound') {
    fetchPromise = fetchGetOutboundOrderAttachments(props.targetId);
  } else {
    fetchPromise = fetchGetCargoOrderAttachments(props.targetId, props.includeContainerAttachments);
  }
  const { data } = await fetchPromise;
  attachments.value = data || [];
  loading.value = false;
}

async function remove(row: Api.Oms.BizAttachment) {
  let deleteFn: (id: CommonType.IdType) => any;
  if (props.targetKind === 'container') {
    deleteFn = fetchDeleteContainerOrderAttachment;
  } else if (props.targetKind === 'outbound') {
    deleteFn = fetchDeleteOutboundOrderAttachment;
  } else {
    deleteFn = fetchDeleteCargoOrderAttachment;
  }
  const { error } = await deleteFn(row.id);
  if (error) return;
  window.$message?.success('删除成功');
  await loadData();
  emit('changed');
}

function openUrl(url?: string | null) {
  if (!url) return;
  window.open(url, '_blank');
}

const columns = [
  { key: 'fileName', title: '文件名称', minWidth: 180, ellipsis: { tooltip: true } },
  {
    key: 'attachmentType',
    title: '文件类型',
    width: 120,
    render: (row: Api.Oms.BizAttachment) =>
      h(
        NTag,
        { size: 'small', type: tagTypeForAttachment(row.attachmentType) },
        () => attachmentTypeLabel(row.attachmentType)
      )
  },
  { key: 'targetNo', title: '归属单号', width: 150, ellipsis: { tooltip: true } },
  { key: 'uploadUserName', title: '上传人', width: 100 },
  { key: 'uploadTime', title: '上传时间', width: 160 },
  {
    key: 'fileSize',
    title: '大小',
    width: 90,
    render: (row: Api.Oms.BizAttachment) => (row.fileSize ? `${(row.fileSize / 1024 / 1024).toFixed(2)} MB` : '--')
  },
  {
    key: 'operate',
    title: '操作',
    width: 150,
    render: (row: Api.Oms.BizAttachment) =>
      h('div', { class: 'flex gap-8px' }, [
        h(NButton, { text: true, type: 'primary', onClick: () => openUrl(row.fileUrl) }, () => '预览'),
        h(NButton, { text: true, type: 'primary', onClick: () => openUrl(row.fileUrl) }, () => '下载'),
        h(NButton, { text: true, type: 'error', onClick: () => remove(row) }, () => '删除')
      ])
  }
];

watch(
  () => [props.targetId, props.targetKind],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="flex-col gap-12px">
    <div class="flex flex-wrap items-center justify-between gap-8px">
      <NSpace>
        <NButton type="primary" @click="openUpload(false)">上传文件</NButton>
        <NButton v-if="targetKind === 'container'" secondary type="primary" @click="openUpload(true)">上传 DO</NButton>
      </NSpace>
    </div>

    <NTabs type="segment" animated>
      <NTabPane name="all" :tab="`全部 (${attachments.length})`">
        <NDataTable :columns="columns" :data="attachments" :loading="loading" size="small" :pagination="{ pageSize: 10 }" />
      </NTabPane>
      <NTabPane name="do" :tab="`DO 文件 (${doFiles.length})`">
        <NDataTable :columns="columns" :data="doFiles" :loading="loading" size="small" :pagination="{ pageSize: 10 }" />
      </NTabPane>
      <NTabPane v-if="targetKind === 'cargo'" name="cargo" :tab="`本单附件 (${cargoFiles.length})`">
        <NDataTable :columns="columns" :data="cargoFiles" :loading="loading" size="small" :pagination="{ pageSize: 10 }" />
      </NTabPane>
      <NTabPane name="container" :tab="`海柜附件 (${containerFiles.length})`">
        <NDataTable :columns="columns" :data="containerFiles" :loading="loading" size="small" :pagination="{ pageSize: 10 }" />
      </NTabPane>
      <NTabPane name="exception" :tab="`异常附件 (${exceptionFiles.length})`">
        <NDataTable :columns="columns" :data="exceptionFiles" :loading="loading" size="small" :pagination="{ pageSize: 10 }" />
      </NTabPane>
    </NTabs>

    <NModal
      v-model:show="uploadVisible"
      preset="card"
      :title="uploadModalTitle"
      class="w-600px max-w-96%"
      @after-leave="modalFileList = []"
    >
      <NSpin :show="bizUploading">
        <NAlert v-if="uploadAsDo" type="info" class="mb-12px">
          DO 上传成功后，海柜列表柜号旁将显示 DO 标识。
        </NAlert>
        <NSpace v-if="!uploadAsDo" vertical class="w-full mb-12px">
          <NFormItem label="* 文件类型" label-placement="left" :show-feedback="false" class="mb-0" required>
            <NSelect
              :to="POPUP_TO_BODY"
              v-model:value="selectedAttachmentType"
              :options="uploadAttachmentTypeOptions"
              placeholder="请选择文件类型"
              clearable
            />
          </NFormItem>
          <NFormItem label="备注" label-placement="left" :show-feedback="false" class="mb-0">
            <NInput v-model:value="uploadRemark" placeholder="可选" />
          </NFormItem>
        </NSpace>
        <NAlert v-if="!uploadAsDo && !selectedAttachmentType" type="warning" class="mb-12px">
          请先选择文件类型，再选择要上传的文件。
        </NAlert>
        <FileUpload
          v-model:file-list="modalFileList"
          upload-type="file"
          :accept="OMS_FILE_ACCEPT"
          :max="1"
          :file-size="50"
          :show-tip="true"
        />
      </NSpin>
      <template #footer>
        <div class="flex justify-end">
          <NButton @click="closeUploadModal">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
