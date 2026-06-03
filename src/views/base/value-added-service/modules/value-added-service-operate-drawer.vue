<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateValueAddedService, fetchUpdateValueAddedService } from '@/service/api/base/value-added-service';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'ValueAddedServiceOperateDrawer' });

const props = defineProps<{ operateType: NaiveUI.TableOperateType; rowData?: Api.Base.ValueAddedService | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();
const title = computed(() => (props.operateType === 'add' ? '新增增值服务' : '编辑增值服务'));

const SERVICE_CATEGORY_OPTIONS = [{ label: '标签类', value: 'LABEL' }, { label: '包装类', value: 'PACKAGE' }, { label: '质检类', value: 'QC' }, { label: '拍照类', value: 'PHOTO' }, { label: '打托类', value: 'PALLET' }, { label: '销毁类', value: 'DESTROY' }, { label: '暂存类', value: 'STORAGE' }];
const BILLING_OPTIONS = [{ label: '按件', value: 'BY_ITEM' }, { label: '按箱', value: 'BY_CARTON' }, { label: '按板', value: 'BY_PALLET' }, { label: '按订单', value: 'BY_ORDER' }, { label: '按小时', value: 'BY_HOUR' }];

const model = ref<any>(createDefaultModel());
function createDefaultModel(): Api.Base.ValueAddedServiceOperateParams {
  return {
    id: null, serviceCode: null, serviceName: null, serviceCategory: null, billingMode: null,
    chargeableFlag: '1', operationRequired: '1', pdaOperationFlag: '0', photoRequired: '0', qcRequired: '0',
    supportBatchOperation: '1', defaultSelected: '0', priority: 100, sortOrder: 0, status: '0', remark: null
  };
}
const rules = {
  serviceCode: createRequiredRule('服务编码不能为空'),
  serviceName: createRequiredRule('服务名称不能为空'),
  serviceCategory: createRequiredRule('请选择服务分类')
};
function closeDrawer() {
  visible.value = false;
}
async function handleSubmit() {
  await validate();
  const { error } = props.operateType === 'add' ? await fetchCreateValueAddedService(model.value) : await fetchUpdateValueAddedService(model.value);
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
  <NDrawer v-model:show="visible" :width="600" class="max-w-90%" display-directive="show">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="110">
        <NFormItem label="服务编码" path="serviceCode"><NInput v-model:value="model.serviceCode" :disabled="operateType === 'edit'" placeholder="如：LABELING" style="text-transform: uppercase" /></NFormItem>
        <NFormItem label="服务名称" path="serviceName"><NInput v-model:value="model.serviceName" placeholder="如：贴标" /></NFormItem>
        <NFormItem label="服务分类" path="serviceCategory"><NSelect v-model:value="model.serviceCategory" :options="SERVICE_CATEGORY_OPTIONS" placeholder="请选择服务分类" /></NFormItem>
        <NFormItem label="作业配置"><NSpace><NCheckbox v-model:checked="model.operationRequired" checked-value="1" unchecked-value="0">需要作业</NCheckbox><NCheckbox v-model:checked="model.pdaOperationFlag" checked-value="1" unchecked-value="0">需要PDA</NCheckbox><NCheckbox v-model:checked="model.photoRequired" checked-value="1" unchecked-value="0">需要拍照</NCheckbox><NCheckbox v-model:checked="model.qcRequired" checked-value="1" unchecked-value="0">需要质检</NCheckbox><NCheckbox v-model:checked="model.supportBatchOperation" checked-value="1" unchecked-value="0">支持批量</NCheckbox></NSpace></NFormItem>
        <NFormItem label="计费配置"><NSpace><NCheckbox v-model:checked="model.chargeableFlag" checked-value="1" unchecked-value="0">参与计费</NCheckbox><NCheckbox v-model:checked="model.defaultSelected" checked-value="1" unchecked-value="0">默认勾选</NCheckbox></NSpace></NFormItem>
        <NFormItem label="计费方式" path="billingMode"><NSelect v-model:value="model.billingMode" :options="BILLING_OPTIONS" clearable placeholder="请选择默认计费方式" /></NFormItem>
        <NFormItem label="优先级" path="priority"><NInputNumber v-model:value="model.priority" :min="1" :max="9999" class="w-full" /></NFormItem>
        <NFormItem label="排序" path="sortOrder"><NInputNumber v-model:value="model.sortOrder" :min="0" class="w-full" /></NFormItem>
        <NFormItem label="状态" path="status"><NRadioGroup v-model:value="model.status"><NRadio value="0">正常</NRadio><NRadio value="1">禁用</NRadio></NRadioGroup></NFormItem>
        <NFormItem label="备注" path="remark"><NInput v-model:value="model.remark" type="textarea" :rows="2" placeholder="备注（可选）" /></NFormItem>
      </NForm>
      <template #footer><NSpace :size="16"><NButton @click="closeDrawer">取消</NButton><NButton type="primary" @click="handleSubmit">确定</NButton></NSpace></template>
    </NDrawerContent>
  </NDrawer>
</template>
