<script setup lang="ts">
import { reactive, watch } from 'vue';
import {
  NButton,
  NCheckbox,
  NDatePicker,
  NForm,
  NFormItem,
  NModal,
  NRadio,
  NRadioGroup,
  NSpace
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';

defineOptions({ name: 'PlatformAppointmentPreOutboundFilterModal' });

const TIME_FIELD_OPTIONS: Array<{
  label: string;
  value: Api.Oms.PlatformAppointmentTimeFilterField;
}> = [
  { label: '预计到仓时间', value: 'EXPECTED_ARRIVAL' },
  { label: 'ETA', value: 'ETA' },
  { label: '提柜预约时间', value: 'PICKUP_APPOINTMENT' },
  { label: 'available时间', value: 'AVAILABLE' },
  { label: '提柜时间', value: 'PICKUP' },
  { label: '实际到仓时间', value: 'ACTUAL_ARRIVAL' }
];

const visible = defineModel<boolean>('visible', { default: false });
const appointment = defineModel<Api.Oms.PlatformAppointment | null>('appointment', { default: null });

const emit = defineEmits<{
  confirm: [filter: Api.Oms.PlatformAppointmentPreOutboundFilter];
}>();

const form = reactive({
  timeField: 'ETA' as Api.Oms.PlatformAppointmentTimeFilterField,
  timeRange: null as [number, number] | null,
  includeInbounded: false
});

function resetForm() {
  form.timeField = 'ETA';
  form.timeRange = null;
  form.includeInbounded = false;
}

function handleConfirm() {
  if (!form.timeRange?.[0] || !form.timeRange?.[1]) {
    window.$message?.warning('请选择时间段');
    return;
  }
  emit('confirm', {
    timeField: form.timeField,
    timeStart: form.timeRange[0],
    timeEnd: form.timeRange[1],
    includeInbounded: form.includeInbounded
  });
  visible.value = false;
}

watch(visible, val => {
  if (val) resetForm();
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="appointment ? `生成预出单 · ${appointment.appointmentNo}` : '生成预出单'"
    style="width: 560px; max-width: 95vw"
    :mask-closable="false"
  >
    <p class="text-13px text-#6b7280 m-0 mb-16px">
      选择时间字段与筛选区间，系统将匹配对应货物；可勾选是否包含已入库数据。
    </p>
    <NForm label-placement="top">
      <NFormItem label="时间字段">
        <NRadioGroup v-model:value="form.timeField">
          <div class="time-field-grid">
            <NRadio v-for="opt in TIME_FIELD_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </NRadio>
          </div>
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="时间段">
        <NDatePicker
          :to="POPUP_TO_BODY"
          v-model:value="form.timeRange"
          type="datetimerange"
          clearable
          class="w-full"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </NFormItem>
      <NFormItem :show-label="false">
        <NCheckbox v-model:checked="form.includeInbounded">包含已入库数据</NCheckbox>
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" @click="handleConfirm">确认</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.time-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}
</style>
