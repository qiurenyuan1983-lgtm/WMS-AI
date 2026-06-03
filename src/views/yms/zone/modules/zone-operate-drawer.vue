<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { fetchCreateYardZone, fetchUpdateYardZone } from '@/service/api/yms/zone';
import { useDict } from '@/hooks/business/dict';

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Yms.YardZone | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();
const { options: zoneTypeOptions } = useDict('yms_zone_type');

type FormModel = {
  id?: CommonType.IdType;
  warehouseId: number | null;
  zoneCode: string;
  zoneName: string;
  zoneType: string;
  sortOrder: number | null;
  remark: string | null;
};

const model = ref<FormModel>(createDefaultModel());

function createDefaultModel(): FormModel {
  return { warehouseId: null, zoneCode: '', zoneName: '', zoneType: '', sortOrder: null, remark: null };
}

const title = computed(() => (props.operateType === 'add' ? '新增堆场分区' : '编辑堆场分区'));

const rules = {
  warehouseId: [defaultRequiredRule],
  zoneCode: [defaultRequiredRule],
  zoneName: [defaultRequiredRule],
  zoneType: [defaultRequiredRule]
};

watch(visible, val => {
  if (!val) return;
  restoreValidation();
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData);
  } else {
    Object.assign(model.value, createDefaultModel());
  }
});

async function handleSubmit() {
  await validate();
  const data = model.value as Api.Yms.YardZoneOperate;
  const api = props.operateType === 'add' ? fetchCreateYardZone : fetchUpdateYardZone;
  const { error } = await api(data);
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
          <NInputNumber v-model:value="model.warehouseId" :show-button="false" placeholder="请输入仓库ID" class="w-full" />
        </NFormItem>
        <NFormItem label="分区编码" path="zoneCode">
          <NInput v-model:value="model.zoneCode" placeholder="请输入分区编码" :disabled="operateType === 'edit'" />
        </NFormItem>
        <NFormItem label="分区名称" path="zoneName">
          <NInput v-model:value="model.zoneName" placeholder="请输入分区名称" />
        </NFormItem>
        <NFormItem label="分区类型" path="zoneType">
          <NSelect v-model:value="model.zoneType" :options="zoneTypeOptions" placeholder="请选择分区类型" />
        </NFormItem>
        <NFormItem label="排序" path="sortOrder">
          <NInputNumber v-model:value="model.sortOrder" placeholder="数值越小越靠前" class="w-full" />
        </NFormItem>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" placeholder="请输入备注" :rows="3" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" class="ml-8px" @click="handleSubmit">确定</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
