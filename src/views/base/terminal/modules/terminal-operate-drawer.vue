<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateTerminal, fetchUpdateTerminal } from '@/service/api/base/terminal';
import { fetchGetPortList } from '@/service/api/base/port';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'TerminalOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.Terminal | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增码头' : '编辑码头'));
const portOptions = ref<CommonType.Option[]>([]);

const appointmentMethodOptions = [
  { label: '邮件', value: 'EMAIL' },
  { label: '平台', value: 'PLATFORM' },
  { label: '电话', value: 'PHONE' },
  { label: 'API', value: 'API' }
];

const releaseMethodOptions = [
  { label: 'DO 放行', value: 'DO' },
  { label: 'EDO 电子放行', value: 'EDO' },
  { label: 'PIN 码放行', value: 'PIN' },
  { label: '邮件放行', value: 'EMAIL_RELEASE' },
  { label: '纸质放行', value: 'PAPER' }
];

type Model = Api.Base.TerminalOperateParams;
const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    terminalCode: null,
    terminalName: null,
    terminalNameEn: null,
    portId: null,
    portCode: null,
    portName: null,
    countryCode: null,
    stateCode: null,
    city: null,
    address: null,
    contactPhone: null,
    contactEmail: null,
    website: null,
    appointmentSupported: 1,
    defaultAppointmentMethod: null,
    defaultReleaseMethod: null,
    timezone: null,
    status: '0',
    remark: null
  };
}

type RuleKey = 'terminalCode' | 'terminalName' | 'portId';
const rules: Record<RuleKey, App.Global.FormRule> = {
  terminalCode: createRequiredRule('码头代码不能为空'),
  terminalName: createRequiredRule('码头名称不能为空'),
  portId: createRequiredRule('所属港口不能为空')
};

async function loadPortOptions() {
  const { data } = await fetchGetPortList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.PortSearchParams);
  portOptions.value = (data?.rows || []).map(item => ({
    label: `${item.nameEn}（${item.portCode}）`,
    value: item.id
  }));
}

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
    const { error } = await fetchCreateTerminal(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateTerminal(model.value);
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
    loadPortOptions();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="640" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="120">
        <NFormItem label="码头代码" path="terminalCode">
          <NInput
            v-model:value="model.terminalCode"
            placeholder="如：APM / TRAPAC"
            :disabled="operateType === 'edit'"
            style="text-transform: uppercase"
          />
        </NFormItem>
        <NFormItem label="码头名称" path="terminalName">
          <NInput v-model:value="model.terminalName" placeholder="请输入码头名称" />
        </NFormItem>
        <NFormItem label="英文名称" path="terminalNameEn">
          <NInput v-model:value="model.terminalNameEn" placeholder="请输入英文名称（可选）" />
        </NFormItem>
        <NFormItem label="所属港口" path="portId">
          <NSelect v-model:value="model.portId" :options="portOptions" filterable clearable placeholder="请选择港口" />
        </NFormItem>
        <NFormItem label="地址" path="address">
          <NInput v-model:value="model.address" placeholder="请输入码头地址" />
        </NFormItem>
        <NFormItem label="联系电话" path="contactPhone">
          <NInput v-model:value="model.contactPhone" placeholder="请输入联系电话（可选）" />
        </NFormItem>
        <NFormItem label="联系邮箱" path="contactEmail">
          <NInput v-model:value="model.contactEmail" placeholder="请输入联系邮箱（可选）" />
        </NFormItem>
        <NFormItem label="官网" path="website">
          <NInput v-model:value="model.website" placeholder="请输入官网地址（可选）" />
        </NFormItem>
        <NFormItem label="是否支持预约" path="appointmentSupported">
          <NRadioGroup v-model:value="model.appointmentSupported">
            <NRadio :value="1">是</NRadio>
            <NRadio :value="0">否</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="默认预约方式" path="defaultAppointmentMethod">
          <NSelect v-model:value="model.defaultAppointmentMethod" :options="appointmentMethodOptions" clearable placeholder="请选择默认预约方式" />
        </NFormItem>
        <NFormItem label="默认放行方式" path="defaultReleaseMethod">
          <NSelect v-model:value="model.defaultReleaseMethod" :options="releaseMethodOptions" clearable placeholder="请选择默认放行方式" />
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
