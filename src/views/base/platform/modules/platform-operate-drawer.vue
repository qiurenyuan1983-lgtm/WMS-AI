<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreatePlatform, fetchUpdatePlatform } from '@/service/api/base/platform';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'PlatformOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.Platform | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const PLATFORM_TYPE_OPTIONS = [
  { label: '电商平台', value: 'ECOMMERCE' },
  { label: '独立站', value: 'INDEPENDENT_SITE' },
  { label: '门店', value: 'STORE' }
];

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增平台',
    edit: '编辑平台'
  };
  return titles[props.operateType];
});

type Model = Api.Base.PlatformOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    code: null,
    nameEn: null,
    typeCode: null,
    logoOssId: null,
    logoUrl: null,
    status: '0',
    sortOrder: 0,
    remark: null
  };
}

type RuleKey = 'code' | 'nameEn' | 'typeCode';

const rules: Record<RuleKey, App.Global.FormRule> = {
  code: createRequiredRule('平台代码不能为空'),
  nameEn: createRequiredRule('平台名称不能为空'),
  typeCode: createRequiredRule('平台类型不能为空')
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
    const { error } = await fetchCreatePlatform(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdatePlatform(model.value);
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
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem label="平台代码" path="code">
          <NInput
            v-model:value="model.code"
            placeholder="如：AMAZON / WALMART / SHOPIFY"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="平台名称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="平台英文名称" />
        </NFormItem>
        <NFormItem label="平台类型" path="typeCode">
          <NSelect
            v-model:value="model.typeCode"
            :options="PLATFORM_TYPE_OPTIONS"
            placeholder="请选择平台类型"
          />
        </NFormItem>
        <NFormItem label="Logo URL" path="logoUrl">
          <NInput v-model:value="model.logoUrl" placeholder="请输入 Logo 图片链接（可选）" />
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
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" placeholder="请输入备注（可选）" :rows="3" />
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
