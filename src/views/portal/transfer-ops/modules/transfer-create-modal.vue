<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NUpload } from 'naive-ui';
import {
  fetchGetPortalTransferEligibleOrders,
  fetchGetPortalTransferOperationOptions,
  fetchSubmitPortalTransferInstruction
} from '@/service/api/portal';

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ success: [] }>();

const orderNo = ref<string | null>(null);
const operationType = ref<string | null>(null);
const remark = ref('');
const uploadFileList = ref<UploadFileInfo[]>([]);

const orderOptions = ref<Array<{ label: string; value: string }>>([]);
const operationOptions = ref<Array<{ label: string; value: string }>>([]);
const submitting = ref(false);

async function loadOptions() {
  const [ordersRes, opsRes] = await Promise.all([
    fetchGetPortalTransferEligibleOrders(),
    fetchGetPortalTransferOperationOptions()
  ]);
  orderOptions.value = (ordersRes.data || []).map(o => ({
    label: `${o.orderNo} · ${o.customerOrderNo} · ${o.locationSummary}`,
    value: o.orderNo
  }));
  operationOptions.value = opsRes.data || [];
}

function customUpload({ file, onFinish }: { file: UploadFileInfo; onFinish: () => void }) {
  onFinish();
}

async function handleSubmit() {
  if (!orderNo.value || !operationType.value) {
    window.$message?.warning('请选择订单与操作类型');
    return false;
  }
  submitting.value = true;
  const names = uploadFileList.value.map(f => f.name).filter(Boolean);
  const { data, error } = await fetchSubmitPortalTransferInstruction({
    orderNo: orderNo.value,
    operationType: operationType.value,
    remark: remark.value.trim() || undefined,
    attachmentNames: names.length ? names : undefined
  });
  submitting.value = false;
  if (error) return false;
  if (!data?.success) {
    window.$message?.warning(data?.message || '提交失败');
    return false;
  }
  window.$message?.success(data.message);
  visible.value = false;
  orderNo.value = null;
  operationType.value = null;
  remark.value = '';
  uploadFileList.value = [];
  emit('success');
  return true;
}

onMounted(loadOptions);
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="dialog"
    title="下发库内操作指令"
    positive-text="提交"
    negative-text="取消"
    :loading="submitting"
    @positive-click="handleSubmit"
    @after-enter="loadOptions"
  >
    <NForm label-placement="left" label-width="96" class="mt-8px">
      <NFormItem label="关联订单" required>
        <NSelect v-model:value="orderNo" :options="orderOptions" filterable placeholder="选择在库/暂扣订单" />
      </NFormItem>
      <NFormItem label="操作类型" required>
        <NSelect v-model:value="operationType" :options="operationOptions" placeholder="换标、拍照、暂扣等" />
      </NFormItem>
      <NFormItem label="备注说明">
        <NInput v-model:value="remark" type="textarea" :rows="3" placeholder="作业要求、标签版本等" />
      </NFormItem>
      <NFormItem label="上传附件">
        <NUpload
          v-model:file-list="uploadFileList"
          multiple
          :default-upload="false"
          :custom-request="customUpload as any"
        >
          <NButton size="small">选择文件</NButton>
        </NUpload>
        <p class="mt-4px text-12px text-#6b7280">原型模式：仅记录文件名，同步至文件中心。</p>
      </NFormItem>
    </NForm>
  </NModal>
</template>
