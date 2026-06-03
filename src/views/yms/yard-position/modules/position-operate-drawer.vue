<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { fetchCreateYardPosition, fetchUpdateYardPosition } from '@/service/api/yms/yard-position';
import { fetchGetZonesByWarehouse } from '@/service/api/yms/zone';
import { fetchGetWarehouseList } from '@/service/api/base';
import { useDict } from '@/hooks/business/dict';

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Yms.YardPosition | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();
const { options: positionTypeOptions } = useDict('yms_position_type');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const zoneOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

type FormModel = Api.Yms.YardPositionOperate;

const model = ref<FormModel>(createDefaultModel());

function createDefaultModel(): FormModel {
  return {
    warehouseId: null as unknown as CommonType.IdType,
    zoneId: null as unknown as CommonType.IdType,
    positionCode: '',
    positionName: null,
    positionType: 'CONTAINER_SLOT',
    gridRow: null,
    gridCol: null,
    remark: null
  };
}

const title = computed(() => (props.operateType === 'add' ? '新增堆场位' : '编辑堆场位'));

const rules = {
  warehouseId: [defaultRequiredRule],
  zoneId: [defaultRequiredRule],
  positionCode: [defaultRequiredRule],
  positionType: [defaultRequiredRule]
};

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({
    label: w.warehouseName,
    value: w.id
  }));
}

async function loadZones(warehouseId: CommonType.IdType | null) {
  zoneOptions.value = [];
  if (!warehouseId) return;
  const { data } = await fetchGetZonesByWarehouse(warehouseId);
  zoneOptions.value = (data ?? []).map(z => ({
    label: `${z.zoneName}（${z.zoneCode}）`,
    value: z.id
  }));
}

watch(() => model.value.warehouseId, val => {
  if (props.operateType === 'add') {
    model.value.zoneId = null as unknown as CommonType.IdType;
  }
  loadZones(val);
});

watch(visible, async val => {
  if (!val) return;
  restoreValidation();
  await loadWarehouses();
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData);
    await loadZones(props.rowData.warehouseId);
  } else {
    Object.assign(model.value, createDefaultModel());
  }
});

async function handleSubmit() {
  await validate();
  const api = props.operateType === 'add' ? fetchCreateYardPosition : fetchUpdateYardPosition;
  const { error } = await api(model.value);
  if (!error) {
    window.$message?.success(props.operateType === 'add' ? '新增成功' : '编辑成功');
    emit('submitted');
    visible.value = false;
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="500" display-directive="show">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
        <NFormItem label="所属仓库" path="warehouseId">
          <NSelect
            v-model:value="model.warehouseId"
            :options="warehouseOptions"
            placeholder="请选择仓库"
            filterable
          />
        </NFormItem>
        <NFormItem label="堆场分区" path="zoneId">
          <NSelect
            v-model:value="model.zoneId"
            :options="zoneOptions"
            placeholder="请先选择仓库"
            filterable
          />
        </NFormItem>
        <NFormItem label="位置编码" path="positionCode">
          <NInput v-model:value="model.positionCode" placeholder="如 A-001" :disabled="operateType === 'edit'" />
        </NFormItem>
        <NFormItem label="位置名称" path="positionName">
          <NInput v-model:value="model.positionName" placeholder="可选" />
        </NFormItem>
        <NFormItem label="位置类型" path="positionType">
          <NSelect v-model:value="model.positionType" :options="positionTypeOptions" placeholder="请选择类型" />
        </NFormItem>
        <NFormItem label="行坐标" path="gridRow">
          <NInputNumber v-model:value="model.gridRow" class="w-full" placeholder="地图行" />
        </NFormItem>
        <NFormItem label="列坐标" path="gridCol">
          <NInputNumber v-model:value="model.gridCol" class="w-full" placeholder="地图列" />
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" :rows="3" placeholder="备注" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" class="ml-8px" @click="handleSubmit">确定</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
