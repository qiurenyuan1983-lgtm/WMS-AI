<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateShippingLine, fetchUpdateShippingLine } from '@/service/api/base/shipping-line';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'ShippingLineOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.ShippingLine | null;
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
    add: '新增船司',
    edit: '编辑船司'
  };
  return titles[props.operateType];
});

type Model = Api.Base.ShippingLineOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    code: null,
    nameEn: null,
    nameAbbr: null,
    countryCode: null,
    contactEmail: null,
    contactPhone: null,
    website: null,
    trackingUrl: null,
    status: '0',
    sortOrder: 0,
    remark: null
  };
}

type RuleKey = 'code' | 'nameEn';

const rules: Record<RuleKey, App.Global.FormRule> = {
  code: createRequiredRule('船司代码不能为空'),
  nameEn: createRequiredRule('船司名称不能为空')
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
    const { error } = await fetchCreateShippingLine(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateShippingLine(model.value);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="600" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="110">
        <NFormItem label="SCAC代码" path="code">
          <NInput
            v-model:value="model.code"
            placeholder="如：MSCU / COSU / EGLV"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="船司全称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="如：Mediterranean Shipping Company" />
        </NFormItem>
        <NFormItem label="常用简称" path="nameAbbr">
          <NInput v-model:value="model.nameAbbr" placeholder="如：MSC / COSCO / Evergreen（可选）" />
        </NFormItem>
        <NFormItem label="注册国家" path="countryCode">
          <NInput v-model:value="model.countryCode" placeholder="如：CH / CN（可选）" />
        </NFormItem>
        <NFormItem label="联系邮箱" path="contactEmail">
          <NInput v-model:value="model.contactEmail" placeholder="请输入联系邮箱（可选）" />
        </NFormItem>
        <NFormItem label="联系电话" path="contactPhone">
          <NInput v-model:value="model.contactPhone" placeholder="请输入联系电话（可选）" />
        </NFormItem>
        <NFormItem label="官网" path="website">
          <NInput v-model:value="model.website" placeholder="请输入官网URL（可选）" />
        </NFormItem>
        <NFormItem label="追踪URL" path="trackingUrl">
          <NInput
            v-model:value="model.trackingUrl"
            placeholder="含 {container_no} 占位符（可选）"
            type="textarea"
            :rows="2"
          />
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
