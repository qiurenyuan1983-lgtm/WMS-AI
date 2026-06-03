<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchGetBusinessTypeList, fetchGetWarehouseList } from '@/service/api/base';
import { fetchCreateYardDock, fetchUpdateYardDock } from '@/service/api/yard/dock';
import { fetchGetYardZonesByWarehouse } from '@/service/api/yard/zone';
import { useDict } from '@/hooks/business/dict';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'DockOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Yard.Dock | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const { options: locationTypeOptions } = useDict('yard_location_type');
const { options: dockLocationOptions } = useDict('yard_dock_location');

const title = computed(() => (props.operateType === 'add' ? '新增月台' : '编辑月台'));
const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const businessTypeOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const zoneOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const isDock = computed(() => model.value.locationType === 'DOCK');
const isSlot = computed(() => model.value.locationType && model.value.locationType !== 'DOCK');

const dockStatusOptions = [
  { label: '空闲', value: 'IDLE' },
  { label: '在用', value: 'OCCUPIED' },
  { label: '维护中', value: 'MAINTENANCE' },
  { label: '停用', value: 'DISABLED' }
];

const dockTypeOptions = [
  { label: '拆柜专用', value: 'DEVANNING' },
  { label: '装车专用', value: 'LOADING' },
  { label: '通用（拆柜+装车）', value: 'MIXED_DOCK' }
];

const filteredDockLocationOptions = computed(() => {
  const locationType = model.value.locationType;
  if (!locationType) return dockLocationOptions.value;
  const suffix = locationType === 'DOCK' ? '_DOCK' : '_PARKING';
  return dockLocationOptions.value.filter(item => String(item.value).endsWith(suffix));
});

type Model = Api.Yard.DockOperateParams;
const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    dockCode: null,
    dockName: null,
    locationType: 'DOCK',
    warehouseId: null,
    warehouseCode: null,
    warehouseName: null,
    businessTypeId: null,
    businessTypeCode: null,
    businessTypeName: null,
    dockLocation: null,
    gridRow: null,
    gridCol: null,
    allowedVehicleTypes: null,
    appointmentSupported: 1,
    maxConcurrent: 1,
    dockStatus: 'IDLE',
    enabledFlag: 1,
    sortOrder: 0,
    dispatchPriority: 1,
    zoneId: null,
    zoneCode: null,
    dockType: null,
    enableQueue: 0,
    maxQueueCount: null,
    remark: null
  };
}

type RuleKey = 'dockCode' | 'dockName' | 'locationType' | 'warehouseId' | 'businessTypeId' | 'dockLocation' | 'zoneId';
const rules = computed(() => ({
  dockCode: createRequiredRule('编码不能为空'),
  dockName: createRequiredRule('名称不能为空'),
  locationType: createRequiredRule('位置类型不能为空'),
  warehouseId: createRequiredRule('所属仓库不能为空'),
  businessTypeId: [],
  dockLocation: isDock.value ? createRequiredRule('月台位置不能为空') : [],
  zoneId: isSlot.value ? createRequiredRule('堆场分区不能为空') : []
}));

async function loadZoneOptions(warehouseId: CommonType.IdType | null) {
  if (!warehouseId) {
    zoneOptions.value = [];
    return;
  }
  const { data } = await fetchGetYardZonesByWarehouse(warehouseId);
  zoneOptions.value = (data ?? []).map(z => ({ label: `${z.zoneName}（${z.zoneCode}）`, value: z.id }));
}

async function loadOptions() {
  const [warehouseRes, businessTypeRes] = await Promise.all([
    fetchGetWarehouseList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.MdmWarehouseSearchParams),
    fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} })
  ]);
  warehouseOptions.value = (warehouseRes.data?.rows || []).map(item => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id
  }));
  businessTypeOptions.value = (businessTypeRes.data?.rows || []).map(item => ({
    label: item.businessTypeName,
    value: item.id
  }));
  await loadZoneOptions(model.value.warehouseId ?? null);
}

watch(
  () => model.value.warehouseId,
  warehouseId => {
    loadZoneOptions(warehouseId ?? null);
    if (isSlot.value) model.value.zoneId = null;
  }
);

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) Object.assign(model.value, jsonClone(props.rowData));
}

watch(
  () => model.value.locationType,
  () => {
    if (!model.value.dockLocation) return;
    const exists = filteredDockLocationOptions.value.some(item => item.value === model.value.dockLocation);
    if (!exists) model.value.dockLocation = null;
  }
);

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchCreateYardDock(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateYardDock(model.value);
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
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="120">
        <NFormItem label="月台编码" path="dockCode">
          <NInput v-model:value="model.dockCode" placeholder="如 DOC-LA-001" :disabled="operateType === 'edit'" style="text-transform: uppercase" />
        </NFormItem>
        <NFormItem label="月台名称" path="dockName">
          <NInput v-model:value="model.dockName" placeholder="如 Dock43" />
        </NFormItem>
        <NFormItem label="位置类型" path="locationType">
          <NSelect v-model:value="model.locationType" :options="locationTypeOptions" placeholder="道口 / 停车位" />
        </NFormItem>
        <NFormItem label="所属仓库" path="warehouseId">
          <NSelect v-model:value="model.warehouseId" :options="warehouseOptions" filterable clearable placeholder="请选择仓库" />
        </NFormItem>
        <NFormItem v-if="isDock" label="适合业务类型" path="businessTypeId">
          <NSelect v-model:value="model.businessTypeId" :options="businessTypeOptions" filterable clearable placeholder="请选择业务类型" />
        </NFormItem>
        <NFormItem v-if="isDock" label="调度类型" path="dockType">
          <NSelect
            v-model:value="model.dockType"
            :options="dockTypeOptions"
            clearable
            placeholder="拆柜专用 / 装车专用 / 通用"
          />
          <template #feedback>
            <span class="text-12px text-gray-400">决定该月台在拆柜/装车调度看板中是否显示</span>
          </template>
        </NFormItem>
        <NFormItem v-if="isSlot" label="堆场分区" path="zoneId">
          <NSelect v-model:value="model.zoneId" :options="zoneOptions" filterable clearable placeholder="请选择堆场分区" />
        </NFormItem>
        <NFormItem v-if="isDock" label="月台位置" path="dockLocation">
          <NSelect v-model:value="model.dockLocation" :options="filteredDockLocationOptions" placeholder="请选择月台位置" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem label="行" path="gridRow">
              <NInputNumber v-model:value="model.gridRow" :min="0" :precision="0" class="w-full" placeholder="整数" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="列" path="gridCol">
              <NInputNumber v-model:value="model.gridCol" :min="0" :precision="0" class="w-full" placeholder="整数" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="排序" path="sortOrder">
              <NInputNumber v-model:value="model.sortOrder" :min="0" :precision="0" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="调度优先级" path="dispatchPriority">
              <NInputNumber v-model:value="model.dispatchPriority" :min="1" :precision="0" class="w-full" />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <NFormItem label="允许车型" path="allowedVehicleTypes">
          <NInput v-model:value="model.allowedVehicleTypes" placeholder="如 53FT,40HQ" />
        </NFormItem>
        <NFormItem label="状态" path="dockStatus">
          <NSelect v-model:value="model.dockStatus" :options="dockStatusOptions" />
        </NFormItem>
        <NFormItem label="是否启用" path="enabledFlag">
          <NRadioGroup v-model:value="model.enabledFlag">
            <NRadio :value="1">启用</NRadio>
            <NRadio :value="0">停用</NRadio>
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
