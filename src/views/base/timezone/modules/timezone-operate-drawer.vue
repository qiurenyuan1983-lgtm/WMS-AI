<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateTimezone, fetchUpdateTimezone } from '@/service/api/base/timezone';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'TimezoneOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.Timezone | null;
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
    add: '新增时区',
    edit: '编辑时区'
  };
  return titles[props.operateType];
});

type Model = Api.Base.TimezoneOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    tzCode: null,
    nameEn: null,
    utcOffset: null,
    countryCode: null,
    isDst: 0,
    status: '0',
    sortOrder: 0
  };
}

type RuleKey = 'tzCode' | 'nameEn' | 'utcOffset';

const rules: Record<RuleKey, App.Global.FormRule> = {
  tzCode: createRequiredRule('时区代码不能为空'),
  nameEn: createRequiredRule('时区名称不能为空'),
  utcOffset: createRequiredRule('UTC偏移量不能为空')
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
    const { error } = await fetchCreateTimezone(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateTimezone(model.value);
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
        <NFormItem label="时区代码" path="tzCode">
          <NInput
            v-model:value="model.tzCode"
            placeholder="如：Asia/Shanghai"
            :disabled="operateType === 'edit'"
          />
        </NFormItem>
        <NFormItem label="英文名称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="如：China Standard Time" />
        </NFormItem>
        <NFormItem label="UTC偏移量" path="utcOffset">
          <NInput v-model:value="model.utcOffset" placeholder="如：UTC+08:00" />
        </NFormItem>
        <NFormItem label="国家代码" path="countryCode">
          <NInput v-model:value="model.countryCode" placeholder="如：CN / US（可选）" />
        </NFormItem>
        <NFormItem label="夏令时" path="isDst">
          <NRadioGroup v-model:value="model.isDst">
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
