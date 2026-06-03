<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGetZonesByWarehouse } from '@/service/api/yms/zone';
import { fetchCreateYardInventory } from '@/service/api/yms/yard-inventory';
import { useDict } from '@/hooks/business/dict';

const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { options: inventoryTypeOptions } = useDict('yms_inventory_type');
const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const zoneOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

type FormModel = Api.Yms.YardInventoryCreate & { objectNosText?: string };

const model = ref<FormModel>({
  warehouseId: null as unknown as CommonType.IdType,
  inventoryType: 'FULL',
  zoneId: null,
  objectNosText: '',
  remark: null
});

const showZone = computed(() => model.value.inventoryType === 'ZONE');
const showObjectList = computed(() => model.value.inventoryType === 'CONTAINER_LIST');

const rules: Record<string, App.Global.FormRule[]> = {
  warehouseId: [defaultRequiredRule],
  inventoryType: [defaultRequiredRule]
};

watch(visible, async val => {
  if (val) {
    restoreValidation();
    model.value = {
      warehouseId: warehouseOptions.value[0]?.value ?? (null as unknown as CommonType.IdType),
      inventoryType: 'FULL',
      zoneId: null,
      objectNosText: '',
      remark: null
    };
    if (model.value.warehouseId) {
      await loadZones(model.value.warehouseId);
    }
  }
});

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
}

async function loadZones(warehouseId: CommonType.IdType) {
  const { data } = await fetchGetZonesByWarehouse(warehouseId);
  zoneOptions.value = (data ?? []).map(z => ({ label: z.zoneName, value: z.id }));
}

async function onWarehouseChange(val: CommonType.IdType) {
  model.value.zoneId = null;
  await loadZones(val);
}

async function handleSubmit() {
  await validate();
  if (showZone.value && !model.value.zoneId) {
    window.$message?.warning('请选择盘点分区');
    return;
  }
  const payload: Api.Yms.YardInventoryCreate = {
    warehouseId: model.value.warehouseId,
    inventoryType: model.value.inventoryType,
    zoneId: model.value.zoneId,
    remark: model.value.remark
  };
  if (showObjectList.value) {
    payload.objectNos = (model.value.objectNosText ?? '')
      .split(/[\n,，\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (!payload.objectNos.length) {
      window.$message?.warning('请输入至少一个柜号/车厢号');
      return;
    }
  }
  const { error } = await fetchCreateYardInventory(payload);
  if (!error) {
    window.$message?.success('盘点任务已创建');
    emit('submitted');
    visible.value = false;
  }
}

loadWarehouses();
</script>

<template>
  <NDrawer v-model:show="visible" :width="520" display-directive="show">
    <NDrawerContent title="新建盘点任务" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
        <NFormItem label="仓库" path="warehouseId">
          <NSelect
            v-model:value="model.warehouseId"
            :options="warehouseOptions"
            filterable
            placeholder="选择仓库"
            @update:value="onWarehouseChange"
          />
        </NFormItem>
        <NFormItem label="盘点类型" path="inventoryType">
          <NSelect v-model:value="model.inventoryType" :options="inventoryTypeOptions" placeholder="盘点类型" />
        </NFormItem>
        <NFormItem v-if="showZone" label="分区">
          <NSelect
            v-model:value="model.zoneId"
            :options="zoneOptions"
            filterable
            placeholder="选择分区"
          />
        </NFormItem>
        <NFormItem v-if="showObjectList" label="对象列表">
          <NInput
            v-model:value="model.objectNosText"
            type="textarea"
            :rows="4"
            placeholder="每行一个柜号/车厢号，或用逗号分隔"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="model.remark" type="textarea" :rows="2" placeholder="备注" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" class="ml-8px" @click="handleSubmit">创建</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
