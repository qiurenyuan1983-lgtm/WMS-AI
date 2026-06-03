<script setup lang="ts">
import { h, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { getToken } from '@/store/modules/auth/shared';
import { useDownload } from '@/hooks/business/download';
import { getServiceBaseURL } from '@/utils/service';
import type FileUpload from '@/components/custom/file-upload.vue';

defineOptions({ name: 'WmsLocationImportModal' });

interface Props {
  warehouseId?: CommonType.IdType | null;
  companyId?: CommonType.IdType | null;
}

interface Emits {
  (e: 'submitted'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { download } = useDownload();
const { baseURL } = getServiceBaseURL(import.meta.env);

const headers: Record<string, string> = {
  Authorization: `Bearer ${getToken()}`,
  clientid: import.meta.env.VITE_APP_CLIENT_ID!
};

const uploadRef = ref<typeof FileUpload>();
const message = ref<string>('');
const success = ref<boolean>(false);
const visible = defineModel<boolean>('visible', { default: false });
const fileList = ref<UploadFileInfo[]>([]);

const uploadAction = ref('');

function closeModal() {
  visible.value = false;
  if (success.value) emit('submitted');
}

async function handleSubmit() {
  if (!props.warehouseId) {
    window.$message?.warning('请先选择仓库');
    return;
  }
  fileList.value.forEach(item => {
    item.status = 'pending';
  });
  uploadRef.value?.submit();
}

function handleFinish(options: { file: UploadFileInfo; event?: ProgressEvent }) {
  const { file, event } = options;
  const responseText = (event?.target as XMLHttpRequest)?.responseText;
  const response = JSON.parse(responseText);
  message.value = response.msg;
  window.$message?.success('导入完成');
  success.value = true;
  return file;
}

function handleError(options: { event?: ProgressEvent }) {
  const responseText = (options.event?.target as XMLHttpRequest)?.responseText;
  const msg = JSON.parse(responseText).msg;
  message.value = msg;
  window.$message?.error(() => h('div', { innerHTML: msg || '导入失败' }));
  success.value = false;
}

function handleDownloadTemplate() {
  download('/wms/location/importTemplate', {}, `库位导入模板_${Date.now()}.xlsx`);
}

watch(visible, () => {
  if (visible.value) {
    fileList.value = [];
    success.value = false;
    message.value = '';
    uploadAction.value = `${baseURL}/wms/location/importData?warehouseId=${props.warehouseId}&companyId=${props.companyId ?? 4000001}`;
  }
});
</script>

<template>
  <NModal v-model:show="visible" title="导入库位" preset="card" class="w-600px" @close="closeModal">
    <p class="mb-12px text-13px text-gray-500">模板字段：所属库区、库位编码、行、列、库位容量、状态</p>
    <NUpload
      ref="uploadRef"
      v-model:file-list="fileList"
      :action="uploadAction"
      :headers="headers"
      :max="1"
      :file-size="50"
      accept=".xls,.xlsx"
      :default-upload="false"
      @finish="handleFinish"
      @error="handleError"
    >
      <NUploadDragger>
        <div class="text-center">点击或拖拽上传 Excel 文件</div>
      </NUploadDragger>
    </NUpload>
    <div v-if="message" class="mt-12px text-13px" v-html="message" />
    <template #footer>
      <div class="flex justify-between">
        <NButton text type="primary" @click="handleDownloadTemplate">下载模板</NButton>
        <div class="flex gap-8px">
          <NButton @click="closeModal">关闭</NButton>
          <NButton type="primary" @click="handleSubmit">开始导入</NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>
