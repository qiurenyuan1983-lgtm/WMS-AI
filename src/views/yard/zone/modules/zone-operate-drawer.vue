<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchCreateYardZone, fetchUpdateYardZone } from '@/service/api/yard/zone';
import { useDict } from '@/hooks/business/dict';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'YardZoneOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Yard.Zone | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();
const { options: zoneTypeOptions } = useDict('yard_zone_type');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

type FormModel = Api.Yard.ZoneOperateParams;
const model = ref<FormModel>(createDefaultModel());

function createDefaultModel(): FormModel {
  return { id: null, warehouseId: null, zoneCode: null, zoneName: null, zoneType: null, sortOrder: null, remark: null };
}

const title = computed(() => (props.operateType === 'add' ? '新增堆场分区' : '编辑堆场分区'));
const rules = {
  warehouseId: [defaultRequiredRule],
  zoneCode: [defaultRequiredRule],
  zoneName: [defaultRequiredRule],
  zoneType: [defaultRequiredRule]
};

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  warehouseOptions.value = ((data as any)?.rows ?? []).map((w: any) => ({ label: w.warehouseName, value: w.id }));
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
  const api = props.operateType === 'add' ? fetchCreateYardZone : fetchUpdateYardZone;
  const { error } = await api(model.value);
  if (!error) {
    window.$message?.success(props.operateType === 'add' ? '新增成功' : '编辑成功');
    emit('submitted');
    visible.value = false;
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="480" display-directive="show">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
        <NFormItem label="所属仓库" path="warehouseId">
          <NSelect v-model:value="model.warehouseId" :options="warehouseOptions" filterable placeholder="选择仓库" />
        </NFormItem>
        <NFormItem label="分区编码" path="zoneCode">
          <NInput v-model:value="model.zoneCode" placeholder="分区编码" :disabled="operateType === 'edit'" />
        </NFormItem>
        <NFormItem label="分区名称" path="zoneName">
          <NInput v-model:value="model.zoneName" placeholder="分区名称" />
        </NFormItem>
        <NFormItem label="分区类型" path="zoneType">
          <NSelect v-model:value="model.zoneType" :options="zoneTypeOptions" placeholder="选择类型" />
        </NFormItem>
        <NFormItem label="排序" path="sortOrder">
          <NInputNumber v-model:value="model.sortOrder" class="w-full" placeholder="越小越靠前" />
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
