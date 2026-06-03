<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { fetchCreateTrailerResource, fetchUpdateTrailerResource } from '@/service/api/yms/trailer';
import { fetchGetWarehouseList } from '@/service/api/base';
import { useDict } from '@/hooks/business/dict';

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Yms.TrailerResource | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();
const { options: vehicleSourceOptions } = useDict('yms_vehicle_source');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const model = ref<Api.Yms.TrailerResourceOperate>(createDefaultModel());

function createDefaultModel(): Api.Yms.TrailerResourceOperate {
  return {
    warehouseId: null as unknown as CommonType.IdType,
    vehicleSource: 'SUPPLIER_TRUCK',
    trailerNo: null,
    tractorNo: null,
    plateNo: null,
    driverName: null,
    driverPhone: null,
    relatedOrderNo: null,
    remark: null
  };
}

const title = computed(() => (props.operateType === 'add' ? '新增车厢资源' : '编辑车厢资源'));

const rules = {
  warehouseId: [defaultRequiredRule],
  vehicleSource: [defaultRequiredRule]
};

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
}

watch(visible, async val => {
  if (!val) return;
  restoreValidation();
  await loadWarehouses();
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData);
  } else {
    Object.assign(model.value, createDefaultModel());
  }
});

async function handleSubmit() {
  await validate();
  const api = props.operateType === 'add' ? fetchCreateTrailerResource : fetchUpdateTrailerResource;
  const { error } = await api(model.value);
  if (!error) {
    window.$message?.success(props.operateType === 'add' ? '新增成功' : '编辑成功');
    emit('submitted');
    visible.value = false;
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="520" display-directive="show">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NFormItem label="所属仓库" path="warehouseId">
          <NSelect v-model:value="model.warehouseId" :options="warehouseOptions" filterable placeholder="请选择仓库" />
        </NFormItem>
        <NFormItem label="车辆来源" path="vehicleSource">
          <NSelect v-model:value="model.vehicleSource" :options="vehicleSourceOptions" placeholder="请选择" />
        </NFormItem>
        <NFormItem label="车厢号" path="trailerNo">
          <NInput v-model:value="model.trailerNo" placeholder="车厢号" />
        </NFormItem>
        <NFormItem label="车头号" path="tractorNo">
          <NInput v-model:value="model.tractorNo" placeholder="车头号" />
        </NFormItem>
        <NFormItem label="车牌号" path="plateNo">
          <NInput v-model:value="model.plateNo" placeholder="整车车牌" />
        </NFormItem>
        <NFormItem label="司机" path="driverName">
          <NInput v-model:value="model.driverName" placeholder="司机姓名" />
        </NFormItem>
        <NFormItem label="司机电话" path="driverPhone">
          <NInput v-model:value="model.driverPhone" placeholder="司机电话" />
        </NFormItem>
        <NFormItem label="关联单号" path="relatedOrderNo">
          <NInput v-model:value="model.relatedOrderNo" placeholder="出库/派送单号" />
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" :rows="3" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" class="ml-8px" @click="handleSubmit">确定</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
