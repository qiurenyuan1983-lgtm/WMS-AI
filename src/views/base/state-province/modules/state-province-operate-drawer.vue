<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateStateProvince, fetchUpdateStateProvince } from '@/service/api/base/state-province';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'StateProvinceOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.StateProvince | null;
}
const props = defineProps<Props>();
interface Emits { (e: 'submitted'): void; }
const emit = defineEmits<Emits>();
const visible = defineModel<boolean>('visible', { default: false });
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => ({ add: '新增州/省', edit: '编辑州/省' }[props.operateType]));

type Model = Api.Base.StateProvinceOperateParams;
const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return { id: null, countryCode: null, code: null, nameEn: null, sortOrder: 0, status: '0' };
}

const rules: Record<'countryCode' | 'code' | 'nameEn', App.Global.FormRule> = {
  countryCode: createRequiredRule('国家代码不能为空'),
  code: createRequiredRule('州/省代码不能为空'),
  nameEn: createRequiredRule('英文名称不能为空')
};

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) Object.assign(model.value, jsonClone(props.rowData));
}

function closeDrawer() { visible.value = false; }

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchCreateStateProvince(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  } else {
    const { error } = await fetchUpdateStateProvince(model.value);
    if (error) return;
    window.$message?.success('修改成功');
  }
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) { handleUpdateModelWhenEdit(); restoreValidation(); }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="520" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem label="国家代码" path="countryCode">
          <NInput v-model:value="model.countryCode" placeholder="如：US" :disabled="operateType === 'edit'"
            style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="州/省代码" path="code">
          <NInput v-model:value="model.code" placeholder="如：CA / NY" :disabled="operateType === 'edit'"
            style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="英文名称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="请输入英文名称" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">正常</NRadio>
            <NRadio value="1">停用</NRadio>
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
