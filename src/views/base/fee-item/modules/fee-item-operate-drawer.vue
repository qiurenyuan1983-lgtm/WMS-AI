<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateFeeItem, fetchUpdateFeeItem } from '@/service/api/base/fee-item';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'FeeItemOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.FeeItem | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const FEE_CATEGORY_OPTIONS = [
  { label: '入库', value: 'INBOUND' },
  { label: '出库', value: 'OUTBOUND' },
  { label: '仓储', value: 'STORAGE' },
  { label: '退货', value: 'RETURN' },
  { label: '运输', value: 'TRANSPORT' },
  { label: '其他', value: 'OTHER' }
];

const FULFILLMENT_TYPE_OPTIONS = [
  { label: '一件代发', value: 'DROPSHIP' },
  { label: 'FBA头程', value: 'FBA' },
  { label: '自提',    value: 'SELF_PICKUP' },
  { label: '转运',    value: 'TRANSIT' }
];

const title = computed(() => (props.operateType === 'add' ? '新增费项' : '编辑费项'));

type Model = Api.Base.FeeItemOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    feeCode: null,
    feeName: null,
    feeCategory: null,
    businessStage: null,
    businessType: null,
    isBillable: 1,
    description: null,
    status: '0',
    sortOrder: 0,
    remark: null
  };
}

type RuleKey = 'feeCode' | 'feeName' | 'feeCategory' | 'businessStage';

const rules: Record<RuleKey, App.Global.FormRule> = {
  feeCode:       createRequiredRule('费项编码不能为空'),
  feeName:       createRequiredRule('费项名称不能为空'),
  feeCategory:   createRequiredRule('请选择费项类别'),
  businessStage: createRequiredRule('请选择业务阶段')
};

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, jsonClone(props.rowData));
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchCreateFeeItem(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateFeeItem(model.value);
    if (error) return;
    window.$message?.success('修改成功');
  }
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="560" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
        <NFormItem label="费项编码" path="feeCode">
          <NInput
            v-model:value="model.feeCode"
            placeholder="如：PICK_FEE（新增后不可修改）"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="费项名称" path="feeName">
          <NInput v-model:value="model.feeName" placeholder="如：拣货费" />
        </NFormItem>
        <NFormItem label="费项类别" path="feeCategory">
          <NSelect v-model:value="model.feeCategory" :options="FEE_CATEGORY_OPTIONS" placeholder="请选择费项类别" />
        </NFormItem>
        <NFormItem label="业务阶段" path="businessStage">
          <NSelect v-model:value="model.businessStage" :options="FEE_CATEGORY_OPTIONS" placeholder="请选择业务阶段" />
        </NFormItem>
        <NFormItem label="业务类型" path="businessType">
          <NSelect
            v-model:value="model.businessType"
            :options="FULFILLMENT_TYPE_OPTIONS"
            clearable
            placeholder="不限（通用）"
          />
        </NFormItem>
        <NFormItem label="是否出账单" path="isBillable">
          <NRadioGroup v-model:value="model.isBillable">
            <NRadio :value="1">是</NRadio>
            <NRadio :value="0">否</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">正常</NRadio>
            <NRadio value="1">禁用</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="排序" path="sortOrder">
          <NInputNumber v-model:value="model.sortOrder" :min="0" placeholder="数字越小越靠前" class="w-full" />
        </NFormItem>
        <NFormItem label="费项说明" path="description">
          <NInput v-model:value="model.description" type="textarea" placeholder="费项用途说明（可选）" :rows="2" />
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" placeholder="备注（可选）" :rows="2" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
