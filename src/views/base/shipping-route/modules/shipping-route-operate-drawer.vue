<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchGetPortList } from '@/service/api/base/port';
import { fetchGetShippingLineList } from '@/service/api/base/shipping-line';
import { fetchCreateShippingRoute, fetchUpdateShippingRoute } from '@/service/api/base/shipping-route';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'ShippingRouteOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.ShippingRoute | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增航线' : '编辑航线'));
const shippingLineOptions = ref<CommonType.Option[]>([]);
const portOptions = ref<CommonType.Option[]>([]);

const routeTypeOptions = [
  { label: '直航', value: 'DIRECT' },
  { label: '中转', value: 'TRANSSHIP' }
];

type Model = Api.Base.ShippingRouteOperateParams;
const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    routeCode: null,
    routeName: null,
    routeNameEn: null,
    shippingLineId: null,
    shippingLineCode: null,
    shippingLineName: null,
    originPortId: null,
    originPortCode: null,
    originPortName: null,
    destinationPortId: null,
    destinationPortCode: null,
    destinationPortName: null,
    defaultTransitDays: null,
    routeType: 'DIRECT',
    referenceMinDays: null,
    referenceAvgDays: null,
    referenceMaxDays: null,
    referenceFreight: null,
    status: '0',
    remark: null
  };
}

type RuleKey = 'routeCode' | 'routeName';
const rules: Record<RuleKey, App.Global.FormRule> = {
  routeCode: createRequiredRule('航线代码不能为空'),
  routeName: createRequiredRule('航线名称不能为空')
};

async function loadOptions() {
  const [lineRes, portRes] = await Promise.all([
    fetchGetShippingLineList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.ShippingLineSearchParams),
    fetchGetPortList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.PortSearchParams)
  ]);
  shippingLineOptions.value = (lineRes.data?.rows || []).map(item => ({
    label: `${item.nameAbbr || item.nameEn}（${item.code}）`,
    value: item.id
  }));
  portOptions.value = (portRes.data?.rows || []).map(item => ({
    label: `${item.nameEn}（${item.portCode}）`,
    value: item.id
  }));
}

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) Object.assign(model.value, jsonClone(props.rowData));
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchCreateShippingRoute(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateShippingRoute(model.value);
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
    loadOptions();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="680" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="130">
        <NFormItem label="航线代码" path="routeCode">
          <NInput v-model:value="model.routeCode" placeholder="如 AAS2" :disabled="operateType === 'edit'" style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="航线名称" path="routeName">
          <NInput v-model:value="model.routeName" placeholder="请输入航线名称" />
        </NFormItem>
        <NFormItem label="船公司" path="shippingLineId">
          <NSelect v-model:value="model.shippingLineId" :options="shippingLineOptions" filterable clearable placeholder="请选择船公司" />
        </NFormItem>
        <NFormItem label="起运港" path="originPortId">
          <NSelect v-model:value="model.originPortId" :options="portOptions" filterable clearable placeholder="请选择起运港" />
        </NFormItem>
        <NFormItem label="目的港" path="destinationPortId">
          <NSelect v-model:value="model.destinationPortId" :options="portOptions" filterable clearable placeholder="请选择目的港" />
        </NFormItem>
        <NFormItem label="航程天数" path="defaultTransitDays">
          <NInputNumber v-model:value="model.defaultTransitDays" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem label="直航/中转" path="routeType">
          <NSelect v-model:value="model.routeType" :options="routeTypeOptions" placeholder="请选择" />
        </NFormItem>
        <NFormItem label="参考时效(天)" path="referenceAvgDays">
          <NSpace>
            <NInputNumber v-model:value="model.referenceMinDays" :min="0" placeholder="最短" class="w-120px" />
            <NInputNumber v-model:value="model.referenceAvgDays" :min="0" placeholder="平均" class="w-120px" />
            <NInputNumber v-model:value="model.referenceMaxDays" :min="0" placeholder="最长" class="w-120px" />
          </NSpace>
        </NFormItem>
        <NFormItem label="参考运费" path="referenceFreight">
          <NInputNumber v-model:value="model.referenceFreight" :min="0" :precision="2" class="w-full" placeholder="USD/40HQ" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">启用</NRadio>
            <NRadio value="1">停用</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
