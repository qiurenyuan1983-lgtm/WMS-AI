<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchGetShippingLineList } from '@/service/api/base/shipping-line';
import { fetchCreateVessel, fetchUpdateVessel } from '@/service/api/base/vessel';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'VesselOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.Vessel | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增船舶' : '编辑船舶'));
const shippingLineOptions = ref<CommonType.Option[]>([]);

const vesselTypeOptions = [
  { label: '集装箱船', value: 'CONTAINER' },
  { label: '散货船', value: 'BULK' },
  { label: '冷藏船', value: 'REEFER' },
  { label: '滚装船', value: 'RORO' },
  { label: '其他', value: 'OTHER' }
];

type Model = Api.Base.VesselOperateParams;
const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    vesselCode: null,
    vesselName: null,
    vesselNameEn: null,
    imoNo: null,
    mmsi: null,
    callSign: null,
    shippingLineId: null,
    shippingLineCode: null,
    shippingLineName: null,
    vesselType: 'CONTAINER',
    capacityTeu: null,
    lengthM: null,
    widthM: null,
    buildYear: null,
    flagCountry: null,
    status: '0',
    remark: null
  };
}

type RuleKey = 'vesselCode' | 'vesselName' | 'shippingLineId';
const rules: Record<RuleKey, App.Global.FormRule> = {
  vesselCode: createRequiredRule('船舶编码不能为空'),
  vesselName: createRequiredRule('船名不能为空'),
  shippingLineId: createRequiredRule('所属船司不能为空')
};

async function loadOptions() {
  const { data } = await fetchGetShippingLineList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.ShippingLineSearchParams);
  shippingLineOptions.value = (data?.rows || []).map(item => ({
    label: `${item.nameAbbr || item.nameEn}（${item.code}）`,
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
    const { error } = await fetchCreateVessel(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateVessel(model.value);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="760" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="120">
        <NGrid :cols="2" :x-gap="16">
          <NFormItemGi label="船舶编码" path="vesselCode">
            <NInput v-model:value="model.vesselCode" placeholder="如 VSL000001" :disabled="operateType === 'edit'" />
          </NFormItemGi>
          <NFormItemGi label="所属船司" path="shippingLineId">
            <NSelect v-model:value="model.shippingLineId" :options="shippingLineOptions" filterable clearable placeholder="请选择船司" />
          </NFormItemGi>
          <NFormItemGi label="船名（中文）" path="vesselName">
            <NInput v-model:value="model.vesselName" placeholder="请输入船名" />
          </NFormItemGi>
          <NFormItemGi label="船名（英文）" path="vesselNameEn">
            <NInput v-model:value="model.vesselNameEn" placeholder="请输入英文船名" />
          </NFormItemGi>
          <NFormItemGi label="IMO编号" path="imoNo">
            <NInput v-model:value="model.imoNo" placeholder="请输入 IMO 编号" />
          </NFormItemGi>
          <NFormItemGi label="MMSI" path="mmsi">
            <NInput v-model:value="model.mmsi" placeholder="请输入 MMSI" />
          </NFormItemGi>
          <NFormItemGi label="呼号" path="callSign">
            <NInput v-model:value="model.callSign" placeholder="请输入呼号" />
          </NFormItemGi>
          <NFormItemGi label="船舶类型" path="vesselType">
            <NSelect v-model:value="model.vesselType" :options="vesselTypeOptions" placeholder="请选择类型" />
          </NFormItemGi>
          <NFormItemGi label="TEU容量" path="capacityTeu">
            <NInputNumber v-model:value="model.capacityTeu" :min="0" class="w-full" />
          </NFormItemGi>
          <NFormItemGi label="建造年份" path="buildYear">
            <NInputNumber v-model:value="model.buildYear" :min="1900" :max="2100" class="w-full" />
          </NFormItemGi>
          <NFormItemGi label="船长(米)" path="lengthM">
            <NInputNumber v-model:value="model.lengthM" :min="0" :precision="2" class="w-full" />
          </NFormItemGi>
          <NFormItemGi label="船宽(米)" path="widthM">
            <NInputNumber v-model:value="model.widthM" :min="0" :precision="2" class="w-full" />
          </NFormItemGi>
          <NFormItemGi label="船籍国家" path="flagCountry">
            <NInput v-model:value="model.flagCountry" placeholder="如 Panama" />
          </NFormItemGi>
          <NFormItemGi label="状态" path="status">
            <NRadioGroup v-model:value="model.status">
              <NRadio value="0">启用</NRadio>
              <NRadio value="1">停用</NRadio>
            </NRadioGroup>
          </NFormItemGi>
        </NGrid>
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
