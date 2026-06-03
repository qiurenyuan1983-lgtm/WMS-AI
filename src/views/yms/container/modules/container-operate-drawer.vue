<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { fetchCreateContainerResource, fetchUpdateContainerResource } from '@/service/api/yms/container';
import { fetchGetWarehouseList } from '@/service/api/base';

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Yms.ContainerResource | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const model = ref<Api.Yms.ContainerResourceOperate>(createDefaultModel());

function createDefaultModel(): Api.Yms.ContainerResourceOperate {
  return {
    warehouseId: null as unknown as CommonType.IdType,
    containerNo: '',
    containerType: null,
    carrier: null,
    sealNo: null,
    relatedOrderNo: null,
    emptyStatus: 'FULL',
    plateNo: null,
    driverName: null,
    driverPhone: null,
    remark: null
  };
}

const title = computed(() => (props.operateType === 'add' ? '新增海柜资源' : '编辑海柜资源'));

const rules = {
  warehouseId: [defaultRequiredRule],
  containerNo: [defaultRequiredRule]
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
  const api = props.operateType === 'add' ? fetchCreateContainerResource : fetchUpdateContainerResource;
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
        <NFormItem label="柜号" path="containerNo">
          <NInput v-model:value="model.containerNo" placeholder="柜号" :disabled="operateType === 'edit'" />
        </NFormItem>
        <NFormItem label="柜型" path="containerType">
          <NInput v-model:value="model.containerType" placeholder="40HQ / 45HQ" />
        </NFormItem>
        <NFormItem label="船司" path="carrier">
          <NInput v-model:value="model.carrier" placeholder="船司" />
        </NFormItem>
        <NFormItem label="关联订单号" path="relatedOrderNo">
          <NInput v-model:value="model.relatedOrderNo" placeholder="海柜订单号" />
        </NFormItem>
        <NFormItem label="车牌号" path="plateNo">
          <NInput v-model:value="model.plateNo" placeholder="送柜车辆车牌" />
        </NFormItem>
        <NFormItem label="司机" path="driverName">
          <NInput v-model:value="model.driverName" placeholder="司机姓名" />
        </NFormItem>
        <NFormItem label="司机电话" path="driverPhone">
          <NInput v-model:value="model.driverPhone" placeholder="司机电话" />
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
