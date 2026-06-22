<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  fetchCreateTransferInstruction,
  fetchLookupTransferOrder
} from '@/service/api/wms/transfer-workbench';
import {
  DEPT_OPTIONS,
  INSTRUCTION_CATEGORY_LABEL,
  OPERATION_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  RELABEL_TYPE_OPTIONS
} from '../constants';

const emit = defineEmits<{ (e: 'created'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const orderNo = ref('');
const orderLookup = ref<Api.Wms.TransferOrderLookup | null>(null);
const lookupLoading = ref(false);
const submitting = ref(false);

const form = ref<Api.Wms.TransferInstructionCreateParams>({
  orderNo: '',
  category: 'OPERATION',
  operationType: 'PHOTO',
  operationRequirement: '',
  targetLocation: null,
  deptName: '库内作业组',
  assigneeName: null,
  deadline: null as unknown as string,
  priority: 'NORMAL',
  relabelTypes: null
});

const categoryOptions = computed(() =>
  Object.entries(INSTRUCTION_CATEGORY_LABEL).map(([value, label]) => ({ label, value }))
);

const operationOptions = computed(() =>
  OPERATION_TYPE_OPTIONS.filter(o => o.category === form.value.category || form.value.category === 'OPERATION')
);

const showRelabelTypes = computed(() =>
  ['RELABEL_FBA', 'RELABEL_SKU', 'RELABEL_CARTON', 'RELABEL_PALLET', 'RELABEL_OTHER'].includes(form.value.operationType)
);

watch(visible, val => {
  if (val) resetForm();
});

function resetForm() {
  orderNo.value = '';
  orderLookup.value = null;
  form.value = {
    orderNo: '',
    category: 'OPERATION',
    operationType: 'PHOTO',
    operationRequirement: '',
    targetLocation: null,
    deptName: '库内作业组',
    assigneeName: null,
    deadline: null as unknown as string,
    priority: 'NORMAL',
    relabelTypes: null
  };
}

async function handleLookup() {
  if (!orderNo.value.trim()) {
    window.$message?.warning('请先输入订单号');
    return;
  }
  lookupLoading.value = true;
  const { data, error } = await fetchLookupTransferOrder(orderNo.value.trim());
  lookupLoading.value = false;
  if (error || !data) {
    orderLookup.value = null;
    window.$message?.warning('未找到订单，请检查订单号');
    return;
  }
  orderLookup.value = data;
  form.value.orderNo = data.orderNo;
  form.value.targetLocation = data.cargoLines[0]?.targetLocation || null;
}

watch(
  () => form.value.operationType,
  type => {
    const opt = OPERATION_TYPE_OPTIONS.find(o => o.value === type);
    if (opt) form.value.category = opt.category as Api.Wms.TransferInstructionCategory;
  }
);

async function handleSubmit() {
  if (!orderLookup.value) {
    window.$message?.warning('请先查询并确认订单号');
    return;
  }
  if (!form.value.deadline) {
    window.$message?.warning('请填写最晚完成时间');
    return;
  }
  submitting.value = true;
  const { error } = await fetchCreateTransferInstruction(form.value);
  submitting.value = false;
  if (error) return;
  window.$message?.success('指令已创建');
  visible.value = false;
  emit('created');
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="创建操作指令" style="width: 720px; max-width: 96vw" :mask-closable="false">
    <NAlert type="warning" class="mb-12px">创建任何操作指令前必须先输入或选择订单号，系统将自动带出订单信息。</NAlert>

    <NForm label-placement="left" label-width="110">
      <NFormItem label="订单号" required>
        <NSpace class="w-full">
          <NInput v-model:value="orderNo" placeholder="输入订单号后查询" class="flex-1" @keyup.enter="handleLookup" />
          <NButton type="primary" :loading="lookupLoading" @click="handleLookup">查询订单</NButton>
        </NSpace>
      </NFormItem>

      <template v-if="orderLookup">
        <NDescriptions bordered :column="2" size="small" label-placement="left" class="mb-12px">
          <NDescriptionsItem label="客户">{{ orderLookup.customerName }}</NDescriptionsItem>
          <NDescriptionsItem label="平台">{{ orderLookup.platform }}</NDescriptionsItem>
          <NDescriptionsItem label="目的地">{{ orderLookup.destination }}</NDescriptionsItem>
          <NDescriptionsItem label="订单状态">{{ orderLookup.orderStatus }}</NDescriptionsItem>
          <NDescriptionsItem label="当前库位">{{ orderLookup.currentLocation }}</NDescriptionsItem>
          <NDescriptionsItem label="货物行数">{{ orderLookup.cargoLines.length }}</NDescriptionsItem>
        </NDescriptions>

        <NFormItem label="指令类别">
          <NSelect v-model:value="form.category" :options="categoryOptions" />
        </NFormItem>
        <NFormItem label="操作类型" required>
          <NSelect v-model:value="form.operationType" :options="operationOptions" filterable />
        </NFormItem>
        <NFormItem v-if="showRelabelTypes" label="换标类型">
          <NSelect v-model:value="form.relabelTypes" :options="RELABEL_TYPE_OPTIONS" multiple clearable />
        </NFormItem>
        <NFormItem label="目标位置">
          <NInput v-model:value="form.targetLocation" placeholder="可选" />
        </NFormItem>
        <NFormItem label="操作要求">
          <NInput v-model:value="form.operationRequirement" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </NFormItem>
        <NFormItem label="责任部门">
          <NSelect v-model:value="form.deptName" :options="DEPT_OPTIONS" />
        </NFormItem>
        <NFormItem label="指派人员">
          <NInput v-model:value="form.assigneeName" placeholder="可选" />
        </NFormItem>
        <NFormItem label="最晚完成" required>
          <NDatePicker
            v-model:formatted-value="form.deadline"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            class="w-full"
            clearable
          />
        </NFormItem>
        <NFormItem label="优先级">
          <NSelect v-model:value="form.priority" :options="PRIORITY_OPTIONS" />
        </NFormItem>
      </template>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="submitting" :disabled="!orderLookup" @click="handleSubmit">创建指令</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
