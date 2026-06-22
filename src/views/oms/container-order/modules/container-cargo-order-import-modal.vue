<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { getToken } from '@/store/modules/auth/shared';
import { useDownload } from '@/hooks/business/download';
import { getServiceBaseURL } from '@/utils/service';
import {
  getContainerCargoImportTemplateUrl,
  getContainerCargoImportUrl,
  getContainerCargoParseImportUrl
} from '@/service/api/oms/container-order';
import { mergeImportedCargoWithDefaults, type ContainerCargoDefaults } from '../utils/container-cargo-order';

defineOptions({ name: 'ContainerCargoOrderImportModal' });

const props = defineProps<{
  /** 有值时上传并落库；无值时仅解析并回填表单 */
  containerOrderId?: CommonType.IdType | null;
  /** 解析模式下用海柜 Step1 字段补全导入行空白项 */
  defaults?: ContainerCargoDefaults;
}>();

const emit = defineEmits<{
  (e: 'submitted'): void;
  (e: 'parsed', orders: Api.Oms.ContainerCargoOrderForm[]): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const { download } = useDownload();
const { baseURL } = getServiceBaseURL(import.meta.env);

const headers: Record<string, string> = {
  Authorization: `Bearer ${getToken()}`,
  clientid: import.meta.env.VITE_APP_CLIENT_ID!
};

const uploadRef = ref();
const fileList = ref<UploadFileInfo[]>([]);
const message = ref('');
const success = ref(false);

const isBindMode = computed(() => Boolean(props.containerOrderId));

const uploadAction = computed(() => {
  if (!fileList.value.length) return '';
  if (isBindMode.value) {
    return `${baseURL}${getContainerCargoImportUrl(props.containerOrderId!)}`;
  }
  return `${baseURL}${getContainerCargoParseImportUrl()}`;
});

function closeModal() {
  visible.value = false;
  if (success.value) {
    if (isBindMode.value) {
      emit('submitted');
    }
  }
}

function handleSubmit() {
  fileList.value.forEach(item => {
    item.status = 'pending';
  });
  uploadRef.value?.submit();
}

function handleFinish(options: { file: UploadFileInfo; event?: ProgressEvent }) {
  const { file, event } = options;
  const responseText = (event?.target as XMLHttpRequest)?.responseText;
  const response = JSON.parse(responseText || '{}');
  if (response.code !== 200) {
    message.value = response.msg || '导入失败';
    window.$message?.error(() => h('div', { innerHTML: message.value }));
    success.value = false;
    return file;
  }
  if (isBindMode.value) {
    message.value = response.msg || String(response.data) || '导入完成';
    window.$message?.success(message.value);
    success.value = true;
  } else {
    const rows = (response.data || []) as Api.Oms.CargoOrder[];
    const merged = mergeImportedCargoWithDefaults(rows, props.defaults);
    message.value = response.msg || `成功解析 ${merged.length} 条订单，已加入列表`;
    window.$message?.success(message.value);
    emit('parsed', merged);
    success.value = true;
  }
  return file;
}

function handleError(options: { event?: ProgressEvent }) {
  const responseText = (options.event?.target as XMLHttpRequest)?.responseText;
  const msg = JSON.parse(responseText || '{}').msg;
  message.value = msg;
  window.$message?.error(() => h('div', { innerHTML: msg || '导入失败' }));
  success.value = false;
}

function handleDownloadTemplate() {
  download(getContainerCargoImportTemplateUrl(), {}, `海柜关联订单导入模板_${Date.now()}.xlsx`);
}

watch(visible, val => {
  if (val) {
    fileList.value = [];
    message.value = '';
    success.value = false;
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    title="导入关联订单"
    preset="card"
    class="w-600px max-w-90%"
    @close="closeModal"
  >
    <NAlert type="info" class="mb-12px">
      同一「导入分组号」多行合并为一条订单；每行至少填写货件编码。计量单位填 BY_CARTON（按箱）或 BY_PALLET（按板）。
      <template v-if="!isBindMode">解析结果将追加到当前订单列表，提交海柜时一并保存。</template>
    </NAlert>
    <NUpload
      ref="uploadRef"
      v-model:file-list="fileList"
      :action="uploadAction"
      :headers="headers"
      :max="1"
      accept=".xls,.xlsx"
      :default-upload="false"
      @finish="handleFinish"
      @error="handleError"
    >
      <NButton>选择 Excel 文件</NButton>
    </NUpload>
    <div v-if="message" class="mt-12px text-12px text-#6b7280">{{ message }}</div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleDownloadTemplate">下载模板</NButton>
        <NButton @click="closeModal">关闭</NButton>
        <NButton type="primary" :disabled="!fileList.length" @click="handleSubmit">开始导入</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
