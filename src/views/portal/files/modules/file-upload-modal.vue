<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NForm, NFormItem, NInput, NModal, NSelect } from 'naive-ui';
import { fetchGetPortalFileTypeOptions, fetchUploadPortalFile } from '@/service/api/portal';

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ success: [] }>();

const fileName = ref('');
const fileType = ref<string | null>(null);
const orderNo = ref('');
const containerNo = ref('');
const typeOptions = ref<Array<{ label: string; value: string }>>([]);
const submitting = ref(false);

async function loadTypes() {
  const { data } = await fetchGetPortalFileTypeOptions();
  typeOptions.value = data || [];
}

async function handleSubmit() {
  if (!fileName.value.trim()) {
    window.$message?.warning('请填写文件名');
    return false;
  }
  submitting.value = true;
  const { data, error } = await fetchUploadPortalFile({
    fileName: fileName.value.trim(),
    fileType: (fileType.value || 'OTHER') as Api.Portal.PortalFileType,
    orderNo: orderNo.value.trim() || undefined,
    containerNo: containerNo.value.trim() || undefined,
    fileSize: '—'
  });
  submitting.value = false;
  if (error) return false;
  window.$message?.success(data?.message || '上传成功');
  fileName.value = '';
  orderNo.value = '';
  containerNo.value = '';
  emit('success');
  return true;
}

onMounted(loadTypes);
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="dialog"
    title="上传文件"
    positive-text="提交"
    negative-text="取消"
    :loading="submitting"
    @positive-click="handleSubmit"
    @after-enter="loadTypes"
  >
    <NForm label-placement="left" label-width="88" class="mt-8px">
      <NFormItem label="文件名" required>
        <NInput v-model:value="fileName" placeholder="例如 POD-xxx.pdf" />
      </NFormItem>
      <NFormItem label="文件类型">
        <NSelect v-model:value="fileType" :options="typeOptions" placeholder="选择类型" clearable />
      </NFormItem>
      <NFormItem label="关联订单">
        <NInput v-model:value="orderNo" placeholder="可选" />
      </NFormItem>
      <NFormItem label="关联海柜">
        <NInput v-model:value="containerNo" placeholder="可选" />
      </NFormItem>
    </NForm>
    <p class="text-12px text-#6b7280">原型模式：仅记录文件名，不实际上传二进制。</p>
  </NModal>
</template>
