<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateCountry, fetchUpdateCountry } from '@/service/api/base/country';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'CountryOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.Country | null;
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
    add: '新增国家',
    edit: '编辑国家'
  };
  return titles[props.operateType];
});

type Model = Api.Base.CountryOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    code: null,
    nameEn: null,
    phoneCode: null,
    currencyCode: null,
    timezoneDefault: null,
    isActive: 1,
    sortOrder: 0
  };
}

type RuleKey = 'code' | 'nameEn';

const rules: Record<RuleKey, App.Global.FormRule> = {
  code: createRequiredRule('国家代码不能为空'),
  nameEn: createRequiredRule('国家名称不能为空')
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
    const { error } = await fetchCreateCountry(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateCountry(model.value);
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
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="110">
        <NFormItem label="国家代码" path="code">
          <NInput
            v-model:value="model.code"
            placeholder="如：US / DE / JP"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="英文名称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="请输入英文名称" />
        </NFormItem>
        <NFormItem label="电话区号" path="phoneCode">
          <NInput v-model:value="model.phoneCode" placeholder="如：+1 / +49" />
        </NFormItem>
        <NFormItem label="默认货币代码" path="currencyCode">
          <NInput v-model:value="model.currencyCode" placeholder="如：USD / EUR" />
        </NFormItem>
        <NFormItem label="默认时区" path="timezoneDefault">
          <NInput v-model:value="model.timezoneDefault" placeholder="如：America/New_York" />
        </NFormItem>
        <NFormItem label="是否已开通" path="isActive">
          <NRadioGroup v-model:value="model.isActive">
            <NRadio :value="1">是</NRadio>
            <NRadio :value="0">否</NRadio>
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
