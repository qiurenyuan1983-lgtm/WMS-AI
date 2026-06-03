<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateCurrency, fetchUpdateCurrency } from '@/service/api/base/currency';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'CurrencyOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.Currency | null;
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
    add: '新增币种',
    edit: '编辑币种'
  };
  return titles[props.operateType];
});

type Model = Api.Base.CurrencyOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    code: null,
    nameEn: null,
    symbol: null,
    decimalPlaces: 2,
    isBase: 0,
    status: '0',
    sortOrder: 0
  };
}

type RuleKey = 'code' | 'nameEn' | 'symbol' | 'decimalPlaces';

const rules: Record<RuleKey, App.Global.FormRule> = {
  code: createRequiredRule('货币代码不能为空'),
  nameEn: createRequiredRule('货币名称不能为空'),
  symbol: createRequiredRule('货币符号不能为空'),
  decimalPlaces: createRequiredRule('小数位数不能为空')
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
    const { error } = await fetchCreateCurrency(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateCurrency(model.value);
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
        <NFormItem label="货币代码" path="code">
          <NInput
            v-model:value="model.code"
            placeholder="如：USD / EUR / CNY（ISO 4217）"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="货币名称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="如：US Dollar / Euro" />
        </NFormItem>
        <NFormItem label="货币符号" path="symbol">
          <NInput v-model:value="model.symbol" placeholder="如：$ / € / ¥" />
        </NFormItem>
        <NFormItem label="小数位数" path="decimalPlaces">
          <NInputNumber v-model:value="model.decimalPlaces" :min="0" :max="4" placeholder="如日元为0，美元为2" />
        </NFormItem>
        <NFormItem label="是否基准货币" path="isBase">
          <NSwitch
            :value="model.isBase === 1"
            @update:value="(v: boolean) => { model.isBase = v ? 1 : 0 }"
          />
          <NText class="ml-12px text-12px text-gray-400">设为基准货币后，原基准货币将自动取消</NText>
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">正常</NRadio>
            <NRadio value="1">禁用</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="排序" path="sortOrder">
          <NInputNumber v-model:value="model.sortOrder" :min="0" placeholder="数字越小越靠前" />
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
