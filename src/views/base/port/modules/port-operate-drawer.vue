<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreatePort, fetchUpdatePort } from '@/service/api/base/port';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'PortOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.Port | null;
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
    add: '新增港口',
    edit: '编辑港口'
  };
  return titles[props.operateType];
});

const portTypeOptions = [
  { label: '海港', value: 1 },
  { label: '空港', value: 2 },
  { label: '内陆港', value: 3 }
];

type Model = Api.Base.PortOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    portCode: null,
    nameEn: null,
    countryCode: null,
    stateCode: null,
    city: null,
    portType: 1,
    timezone: null,
    containerQueryUrl: null,
    status: '0',
    sortOrder: 0,
    remark: null
  };
}

type RuleKey = 'portCode' | 'nameEn' | 'countryCode' | 'portType';

const rules: Record<RuleKey, App.Global.FormRule> = {
  portCode: createRequiredRule('港口代码不能为空'),
  nameEn: createRequiredRule('港口名称不能为空'),
  countryCode: createRequiredRule('国家代码不能为空'),
  portType: createRequiredRule('港口类型不能为空')
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
    const { error } = await fetchCreatePort(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdatePort(model.value);
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
        <NFormItem label="港口代码" path="portCode">
          <NInput
            v-model:value="model.portCode"
            placeholder="如：CNSHA（UN/LOCODE）"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="港口名称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="请输入英文名称" />
        </NFormItem>
        <NFormItem label="国家代码" path="countryCode">
          <NInput v-model:value="model.countryCode" placeholder="如：CN / US" />
        </NFormItem>
        <NFormItem label="州/省代码" path="stateCode">
          <NInput v-model:value="model.stateCode" placeholder="如：SH（可选）" />
        </NFormItem>
        <NFormItem label="城市" path="city">
          <NInput v-model:value="model.city" placeholder="请输入城市名称（可选）" />
        </NFormItem>
        <NFormItem label="港口类型" path="portType">
          <NSelect v-model:value="model.portType" :options="portTypeOptions" placeholder="请选择港口类型" />
        </NFormItem>
        <NFormItem label="时区" path="timezone">
          <NInput v-model:value="model.timezone" placeholder="如：Asia/Shanghai（可选）" />
        </NFormItem>
        <NFormItem label="集装箱查询" path="containerQueryUrl">
          <NInput v-model:value="model.containerQueryUrl" placeholder="查询URL（可选）" />
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
