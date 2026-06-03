<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateBusinessType, fetchUpdateBusinessType } from '@/service/api/base/business-type';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'BusinessTypeOperateDrawer' });

const props = defineProps<{ operateType: NaiveUI.TableOperateType; rowData?: Api.Base.BusinessType | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();
const title = computed(() => (props.operateType === 'add' ? '新增业务类型' : '编辑业务类型'));

const BUSINESS_CATEGORY_OPTIONS = [{ label: '仓储业务', value: 'WAREHOUSE' }, { label: '运输业务', value: 'TRANSPORT' }, { label: '增值服务', value: 'VAS' }, { label: '售后业务', value: 'AFTER_SALES' }];
const FLOW_OPTIONS = [{ label: '入库型', value: 'INBOUND' }, { label: '出库型', value: 'OUTBOUND' }, { label: '入出库型', value: 'INBOUND_OUTBOUND' }, { label: '服务型', value: 'SERVICE' }];
const SORTING_STRATEGY_OPTIONS = [{ label: '按字段分货', value: 'FIELD_BASED' }, { label: '不分货', value: 'NONE' }];
const SORTING_FIELD_OPTIONS = [
  { label: '仓库代码', value: 'warehouse_code' }, { label: '订单号', value: 'order_no' }, { label: 'SKU', value: 'sku' },
  { label: 'PO号', value: 'po_no' }, { label: '批次号', value: 'batch_no' }, { label: '柜号', value: 'container_no' },
  { label: '目的仓代码', value: 'dest_warehouse' }
];

const model = ref<any>(createDefaultModel());
function createDefaultModel(): Api.Base.BusinessTypeOperateParams {
  return {
    id: null, businessTypeCode: null, businessTypeName: null, businessCategory: null, operationFlowType: null,
    receiveRequired: '0', inboundRequired: '0', putawayRequired: '0', storageRequired: '0', pickingRequired: '0',
    outboundRequired: '0', deliveryRequired: '0', appointmentRequired: '0', vasSupported: '0',
    sortingStrategy: 'NONE', sortingField: null, sortOrder: 0, status: '0', remark: null
  };
}
const rules = {
  businessTypeCode: createRequiredRule('业务类型编码不能为空'),
  businessTypeName: createRequiredRule('业务类型名称不能为空'),
  businessCategory: createRequiredRule('请选择业务大类'),
  sortingField: {
    trigger: ['blur', 'change'],
    validator: (_rule: unknown, value: string | null) => model.value.sortingStrategy !== 'FIELD_BASED' || Boolean(value),
    message: '请选择分货依据字段'
  }
};
function closeDrawer() {
  visible.value = false;
}
async function handleSubmit() {
  await validate();
  const { error } = props.operateType === 'add' ? await fetchCreateBusinessType(model.value) : await fetchUpdateBusinessType(model.value);
  if (error) return;
  window.$message?.success(props.operateType === 'add' ? '新增成功' : '修改成功');
  closeDrawer();
  emit('submitted');
}
watch(visible, () => {
  if (!visible.value) return;
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) Object.assign(model.value, jsonClone(props.rowData));
  restoreValidation();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="640" class="max-w-90%" display-directive="show">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="116">
        <NFormItem label="业务类型编码" path="businessTypeCode"><NInput v-model:value="model.businessTypeCode" :disabled="operateType === 'edit'" placeholder="如：BULK_TRANSFER" style="text-transform: uppercase" /></NFormItem>
        <NFormItem label="业务类型名称" path="businessTypeName"><NInput v-model:value="model.businessTypeName" placeholder="如：大货中转" /></NFormItem>
        <NFormItem label="业务大类" path="businessCategory"><NSelect v-model:value="model.businessCategory" :options="BUSINESS_CATEGORY_OPTIONS" placeholder="请选择业务大类" /></NFormItem>
        <NFormItem label="流程类型" path="operationFlowType"><NSelect v-model:value="model.operationFlowType" :options="FLOW_OPTIONS" clearable placeholder="请选择流程类型" /></NFormItem>
        <NFormItem label="作业要素"><NSpace><NCheckbox v-model:checked="model.receiveRequired" checked-value="1" unchecked-value="0">接单</NCheckbox><NCheckbox v-model:checked="model.inboundRequired" checked-value="1" unchecked-value="0">入库</NCheckbox><NCheckbox v-model:checked="model.putawayRequired" checked-value="1" unchecked-value="0">上架</NCheckbox><NCheckbox v-model:checked="model.storageRequired" checked-value="1" unchecked-value="0">仓储</NCheckbox><NCheckbox v-model:checked="model.pickingRequired" checked-value="1" unchecked-value="0">拣货</NCheckbox><NCheckbox v-model:checked="model.outboundRequired" checked-value="1" unchecked-value="0">出库</NCheckbox><NCheckbox v-model:checked="model.deliveryRequired" checked-value="1" unchecked-value="0">派送</NCheckbox><NCheckbox v-model:checked="model.appointmentRequired" checked-value="1" unchecked-value="0">预约</NCheckbox><NCheckbox v-model:checked="model.vasSupported" checked-value="1" unchecked-value="0">支持VAS</NCheckbox></NSpace></NFormItem>
        <NFormItem label="分货策略" path="sortingStrategy"><NSelect v-model:value="model.sortingStrategy" :options="SORTING_STRATEGY_OPTIONS" clearable placeholder="请选择分货策略" /></NFormItem>
        <NFormItem v-if="model.sortingStrategy === 'FIELD_BASED'" label="分货依据字段" path="sortingField"><NSelect v-model:value="model.sortingField" :options="SORTING_FIELD_OPTIONS" placeholder="请选择分货字段" /></NFormItem>
        <NFormItem label="排序" path="sortOrder"><NInputNumber v-model:value="model.sortOrder" :min="0" class="w-full" /></NFormItem>
        <NFormItem label="状态" path="status"><NRadioGroup v-model:value="model.status"><NRadio value="0">正常</NRadio><NRadio value="1">禁用</NRadio></NRadioGroup></NFormItem>
        <NFormItem label="备注" path="remark"><NInput v-model:value="model.remark" type="textarea" :rows="2" placeholder="备注（可选）" /></NFormItem>
      </NForm>
      <template #footer><NSpace :size="16"><NButton @click="closeDrawer">取消</NButton><NButton type="primary" @click="handleSubmit">确定</NButton></NSpace></template>
    </NDrawerContent>
  </NDrawer>
</template>
