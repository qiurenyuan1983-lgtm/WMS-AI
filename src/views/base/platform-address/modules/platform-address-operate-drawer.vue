<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreatePlatformAddress, fetchUpdatePlatformAddress } from '@/service/api/base/platform-address';
import { fetchZipCodeAutocomplete } from '@/service/api/base/zip-code';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'PlatformAddressOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.PlatformAddress | null;
  platformOptions?: { label: string; value: number }[];
}

const props = withDefaults(defineProps<Props>(), {
  platformOptions: () => []
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const ADDRESS_TYPE_OPTIONS = [
  { label: 'FBA仓库', value: 1 },
  { label: '门店', value: 2 },
  { label: '配送中心', value: 3 },
  { label: '其他', value: 4 }
];

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增地址',
    edit: '编辑地址'
  };
  return titles[props.operateType];
});

type Model = Api.Base.PlatformAddressOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    platformId: null,
    addressCode: null,
    addressType: null,
    nameEn: null,
    countryCode: null,
    stateCode: null,
    city: null,
    addressLine1: null,
    addressLine2: null,
    zipCode: null,
    unitPalletCbm: 2,
    contactName: null,
    contactPhone: null,
    status: '0',
    remark: null
  };
}

type RuleKey = 'platformId' | 'addressCode' | 'addressType' | 'nameEn' | 'countryCode' | 'addressLine1';

const rules: Record<RuleKey, App.Global.FormRule> = {
  platformId: createRequiredRule('请选择所属平台'),
  addressCode: createRequiredRule('地址编码不能为空'),
  addressType: createRequiredRule('请选择地址类型'),
  nameEn: createRequiredRule('地址名称不能为空'),
  countryCode: createRequiredRule('国家代码不能为空'),
  addressLine1: createRequiredRule('地址行1不能为空')
};

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, jsonClone(props.rowData));
  }
}

async function handleZipCodeAutocomplete() {
  if (!model.value.countryCode || !model.value.zipCode) return;
  const { data } = await fetchZipCodeAutocomplete(model.value.countryCode, model.value.zipCode);
  if (data) {
    if (data.stateCode && !model.value.stateCode) model.value.stateCode = data.stateCode;
    if (data.cityName && !model.value.city) model.value.city = data.cityName;
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchCreatePlatformAddress(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdatePlatformAddress(model.value);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="620" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
        <NFormItem label="所属平台" path="platformId">
          <NSelect
            v-model:value="model.platformId"
            :options="props.platformOptions"
            :disabled="operateType === 'edit'"
            placeholder="请选择平台"
            filterable
          />
        </NFormItem>
        <NFormItem label="地址编码" path="addressCode">
          <NInput
            v-model:value="model.addressCode"
            placeholder="如：ONT8 / LAX9"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="地址类型" path="addressType">
          <NSelect
            v-model:value="model.addressType"
            :options="ADDRESS_TYPE_OPTIONS"
            placeholder="请选择地址类型"
          />
        </NFormItem>
        <NFormItem label="地址名称" path="nameEn">
          <NInput v-model:value="model.nameEn" placeholder="地址英文名称" />
        </NFormItem>
        <NFormItem label="国家代码" path="countryCode">
          <NInput v-model:value="model.countryCode" placeholder="如：US / CN / DE" style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="邮编" path="zipCode">
          <NInputGroup>
            <NInput
              v-model:value="model.zipCode"
              placeholder="输入邮编后可自动补全州/城市"
              class="flex-1"
            />
            <NButton @click="handleZipCodeAutocomplete">自动补全</NButton>
          </NInputGroup>
        </NFormItem>
        <NFormItem label="单板CBM" path="unitPalletCbm">
          <NInputNumber
            v-model:value="model.unitPalletCbm"
            :min="0"
            :precision="3"
            class="w-full"
            placeholder="默认 2.000"
          />
        </NFormItem>
        <NFormItem label="州/省" path="stateCode">
          <NInput v-model:value="model.stateCode" placeholder="如：CA / NY（可选）" style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="城市" path="city">
          <NInput v-model:value="model.city" placeholder="城市名称（可选）" />
        </NFormItem>
        <NFormItem label="地址行1" path="addressLine1">
          <NInput v-model:value="model.addressLine1" placeholder="详细地址第1行（必填）" />
        </NFormItem>
        <NFormItem label="地址行2" path="addressLine2">
          <NInput v-model:value="model.addressLine2" placeholder="地址第2行（可选）" />
        </NFormItem>
        <NFormItem label="联系人" path="contactName">
          <NInput v-model:value="model.contactName" placeholder="联系人姓名（可选）" />
        </NFormItem>
        <NFormItem label="联系电话" path="contactPhone">
          <NInput v-model:value="model.contactPhone" placeholder="联系电话（可选）" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">正常</NRadio>
            <NRadio value="1">禁用</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" placeholder="备注（可选）" :rows="3" />
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
