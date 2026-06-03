<script setup lang="ts">
import { ref } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { fetchUnifiedCheckIn } from '@/service/api/yms/gate';
import { useDict } from '@/hooks/business/dict';

const emit = defineEmits<{ (e: 'checked-in', result: Api.Yms.CheckIn): void }>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();
const { options: taskTypeOptions } = useDict('yms_task_type');

type LegacyGateCheckInForm = Omit<Api.Yms.UnifiedCheckInParams, 'warehouseId'> & {
  warehouseId: number | null;
  taskType?: string;
  aptId?: number | null;
};

const loading = ref(false);
const model = ref<LegacyGateCheckInForm>({
  plateNo: '',
  driverName: null,
  driverPhone: null,
  idCardNo: null,
  containerNo: null,
  taskType: 'DEVANNING',
  warehouseId: null,
  aptId: null,
  remark: null
});

const rules = {
  plateNo: [defaultRequiredRule],
  taskType: [defaultRequiredRule],
  warehouseId: [defaultRequiredRule]
};

async function handleSubmit() {
  await validate();
  loading.value = true;
  try {
    const payload = { ...model.value };
    delete payload.taskType;
    delete payload.aptId;
    const { data, error } = await fetchUnifiedCheckIn(payload as Api.Yms.UnifiedCheckInParams);
    if (!error && data) {
      emit('checked-in', data);
      restoreValidation();
      model.value.plateNo = '';
      model.value.driverName = null;
      model.value.driverPhone = null;
      model.value.idCardNo = null;
      model.value.containerNo = null;
      model.value.aptId = null;
      model.value.remark = null;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NCard title="门卫入场登记" :bordered="false" class="card-wrapper">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="80">
      <NGrid :cols="2" :x-gap="16">
        <NFormItemGi label="仓库" path="warehouseId" :span="2">
          <NInputNumber v-model:value="model.warehouseId" :show-button="false" placeholder="请输入仓库ID" class="w-full" />
        </NFormItemGi>
        <NFormItemGi label="车牌号" path="plateNo">
          <NInput v-model:value="model.plateNo" placeholder="请输入车牌号" clearable />
        </NFormItemGi>
        <NFormItemGi label="任务类型" path="taskType">
          <NSelect v-model:value="model.taskType" :options="taskTypeOptions" placeholder="请选择" />
        </NFormItemGi>
        <NFormItemGi label="司机姓名" path="driverName">
          <NInput v-model:value="model.driverName" placeholder="请输入司机姓名" clearable />
        </NFormItemGi>
        <NFormItemGi label="司机电话" path="driverPhone">
          <NInput v-model:value="model.driverPhone" placeholder="请输入司机电话" clearable />
        </NFormItemGi>
        <NFormItemGi label="身份证号" path="idCardNo">
          <NInput v-model:value="model.idCardNo" placeholder="请输入身份证号" clearable />
        </NFormItemGi>
        <NFormItemGi label="柜号" path="containerNo">
          <NInput v-model:value="model.containerNo" placeholder="集装箱号（可选）" clearable />
        </NFormItemGi>
        <NFormItemGi label="预约ID" path="aptId">
          <NInputNumber v-model:value="model.aptId" :show-button="false" placeholder="有预约时填写（可选）" class="w-full" />
        </NFormItemGi>
        <NFormItemGi label="备注" path="remark" :span="2">
          <NInput v-model:value="model.remark" placeholder="备注（可选）" clearable />
        </NFormItemGi>
      </NGrid>
    </NForm>
    <div class="mt-16px flex justify-end">
      <NButton type="primary" :loading="loading" size="large" @click="handleSubmit">
        <template #icon><SvgIcon icon="ic:round-check-circle" /></template>
        办理入场
      </NButton>
    </div>
  </NCard>
</template>
