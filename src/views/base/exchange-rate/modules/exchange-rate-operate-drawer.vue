<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateExchangeRate, fetchUpdateExchangeRate } from '@/service/api/base/exchange-rate';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'ExchangeRateOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.ExchangeRate | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增汇率',
    edit: '编辑汇率'
  };
  return titles[props.operateType];
});

type AddModel = Api.Base.ExchangeRateOperateParams;
type EditModel = Api.Base.ExchangeRateEditParams;
type Model = AddModel & EditModel;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    fromCurrency: null,
    toCurrency: null,
    rate: null,
    effectiveDate: null,
    remark: null
  };
}

const rules = computed(() => {
  const base = {
    rate: createRequiredRule('汇率不能为空')
  };
  if (props.operateType === 'add') {
    return {
      ...base,
      fromCurrency: createRequiredRule('源货币不能为空'),
      toCurrency: createRequiredRule('目标货币不能为空'),
      effectiveDate: createRequiredRule('生效日期不能为空')
    };
  }
  return base;
});

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) {
    const cloned = jsonClone(props.rowData);
    model.value.id = cloned.id;
    model.value.rate = cloned.rate;
    model.value.remark = cloned.remark;
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchCreateExchangeRate(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateExchangeRate({ id: model.value.id, rate: model.value.rate, remark: model.value.remark });
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="520" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="110">
        <template v-if="operateType === 'add'">
          <NFormItem label="源货币" path="fromCurrency">
            <NInput v-model:value="model.fromCurrency" placeholder="如：USD" style="text-transform: uppercase" />
          </NFormItem>
          <NFormItem label="目标货币" path="toCurrency">
            <NInput v-model:value="model.toCurrency" placeholder="如：CNY" style="text-transform: uppercase" />
          </NFormItem>
          <NFormItem label="生效日期" path="effectiveDate">
            <NDatePicker
              v-model:formatted-value="model.effectiveDate"
              value-format="yyyy-MM-dd"
              type="date"
              clearable
              placeholder="请选择生效日期"
              class="w-full"
            />
          </NFormItem>
        </template>
        <template v-else>
          <NFormItem label="货币对">
            <NText>{{ (model as any).fromCurrency }} → {{ (model as any).toCurrency }}</NText>
          </NFormItem>
        </template>
        <NFormItem label="汇率" path="rate">
          <NInputNumber
            v-model:value="model.rate"
            :precision="6"
            :min="0.000001"
            placeholder="请输入汇率，最多6位小数"
            class="w-full"
          />
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" placeholder="如：参考中国银行官方汇率（可选）" />
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
