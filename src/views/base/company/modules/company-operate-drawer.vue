<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateCompany, fetchUpdateCompany } from '@/service/api/base/company';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'CompanyOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.MdmCompany | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增主体' : '编辑主体'));

type Model = Api.Base.MdmCompanyOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    companyCode: null,
    companyName: null,
    countryCode: null,
    registeredAddr: null,
    taxNo: null,
    vatRegistered: 0,
    invoiceTitle: null,
    invoiceTaxNo: null,
    invoiceBankName: null,
    bankAccountMasked: null,
    bankName: null,
    bankAccountNo: null,
    swiftCode: null,
    beneficiary: null,
    currencyCode: 'USD',
    timezone: 'UTC',
    licenseFiles: null,
    status: '0',
    remark: null
  };
}

type RuleKey = 'companyCode' | 'companyName' | 'countryCode' | 'currencyCode' | 'timezone';

const rules: Record<RuleKey, App.Global.FormRule> = {
  companyCode:  createRequiredRule('主体编码不能为空'),
  companyName:  createRequiredRule('主体名称不能为空'),
  countryCode:  createRequiredRule('国家代码不能为空'),
  currencyCode: createRequiredRule('结算货币不能为空'),
  timezone:     createRequiredRule('时区不能为空')
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
    const { error } = await fetchCreateCompany(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateCompany(model.value);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="680" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">

        <!-- 基础信息 -->
        <NDivider title-placement="left">基础信息</NDivider>
        <NFormItem label="主体编码" path="companyCode">
          <NInput
            v-model:value="model.companyCode"
            placeholder="如：EXAMPLE-CO（新增后不可修改）"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="主体名称" path="companyName">
          <NInput v-model:value="model.companyName" placeholder="完整主体名称" />
        </NFormItem>
        <NFormItem label="国家代码" path="countryCode">
          <NInput v-model:value="model.countryCode" placeholder="如：US / CN / DE" style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="注册地址" path="registeredAddr">
          <NInput v-model:value="model.registeredAddr" placeholder="注册地址（可选）" />
        </NFormItem>
        <NFormItem label="结算货币" path="currencyCode">
          <NInput v-model:value="model.currencyCode" placeholder="如：USD / CNY" style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="时区" path="timezone">
          <NInput v-model:value="model.timezone" placeholder="如：America/Los_Angeles" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">启用</NRadio>
            <NRadio value="1">停用</NRadio>
          </NRadioGroup>
        </NFormItem>

        <!-- 税务信息 -->
        <NDivider title-placement="left">税务信息</NDivider>
        <NFormItem label="税号" path="taxNo">
          <NInput v-model:value="model.taxNo" placeholder="EIN / 统一社会信用代码（可选）" />
        </NFormItem>
        <NFormItem label="VAT注册" path="vatRegistered">
          <NRadioGroup v-model:value="model.vatRegistered">
            <NRadio :value="0">否</NRadio>
            <NRadio :value="1">是</NRadio>
          </NRadioGroup>
        </NFormItem>

        <!-- 开票信息 -->
        <NDivider title-placement="left">开票信息</NDivider>
        <NFormItem label="开票抬头" path="invoiceTitle">
          <NInput v-model:value="model.invoiceTitle" placeholder="发票抬头（可选）" />
        </NFormItem>
        <NFormItem label="开票税号" path="invoiceTaxNo">
          <NInput v-model:value="model.invoiceTaxNo" placeholder="开票税号（可选）" />
        </NFormItem>
        <NFormItem label="开票银行" path="invoiceBankName">
          <NInput v-model:value="model.invoiceBankName" placeholder="开票行名称（可选）" />
        </NFormItem>

        <!-- 银行账户 -->
        <NDivider title-placement="left">银行账户</NDivider>
        <NFormItem label="银行名称" path="bankName">
          <NInput v-model:value="model.bankName" placeholder="银行全名（可选）" />
        </NFormItem>
        <NFormItem label="账号（脱敏）" path="bankAccountMasked">
          <NInput v-model:value="model.bankAccountMasked" placeholder="如：****1234（展示用）" />
        </NFormItem>
        <NFormItem label="账号（明文）" path="bankAccountNo">
          <NInput v-model:value="model.bankAccountNo" placeholder="完整账号（加密存储）" type="password" show-password-on="click" />
        </NFormItem>
        <NFormItem label="SWIFT代码" path="swiftCode">
          <NInput v-model:value="model.swiftCode" placeholder="SWIFT/BIC（可选）" style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="收款人" path="beneficiary">
          <NInput v-model:value="model.beneficiary" placeholder="收款人名称（可选）" />
        </NFormItem>

        <!-- 备注 -->
        <NDivider title-placement="left">其他</NDivider>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" placeholder="备注（可选）" :rows="2" />
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
