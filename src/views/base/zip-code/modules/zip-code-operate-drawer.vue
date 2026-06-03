<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateZipCode, fetchUpdateZipCode } from '@/service/api/base/zip-code';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'ZipCodeOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.ZipCode | null;
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
    add: '新增邮编',
    edit: '编辑邮编'
  };
  return titles[props.operateType];
});

type Model = Api.Base.ZipCodeOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    countryCode: null,
    stateCode: null,
    cityName: null,
    zip: null
  };
}

type RuleKey = 'countryCode' | 'stateCode' | 'cityName' | 'zip';

const rules: Record<RuleKey, App.Global.FormRule> = {
  countryCode: createRequiredRule('国家代码不能为空'),
  stateCode: createRequiredRule('州/省代码不能为空'),
  cityName: createRequiredRule('城市名称不能为空'),
  zip: createRequiredRule('邮编不能为空')
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
    const { error } = await fetchCreateZipCode(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateZipCode(model.value);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="480" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem label="国家代码" path="countryCode">
          <NInput v-model:value="model.countryCode" placeholder="如：CN / US" />
        </NFormItem>
        <NFormItem label="州/省代码" path="stateCode">
          <NInput v-model:value="model.stateCode" placeholder="如：SH / CA" />
        </NFormItem>
        <NFormItem label="城市名称" path="cityName">
          <NInput v-model:value="model.cityName" placeholder="请输入城市英文名称" />
        </NFormItem>
        <NFormItem label="邮编" path="zip">
          <NInput v-model:value="model.zip" placeholder="请输入邮编" />
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
