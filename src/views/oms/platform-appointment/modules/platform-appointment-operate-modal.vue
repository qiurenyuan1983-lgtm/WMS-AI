<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { useDict } from '@/hooks/business/dict';
import { fetchGetPlatformAddressList, fetchGetPlatformList } from '@/service/api/base';
import { fetchCreatePlatformAppointment } from '@/service/api/oms/platform-appointment';

defineOptions({ name: 'PlatformAppointmentOperateModal' });

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ (e: 'success', row: Api.Oms.PlatformAppointment): void }>();

const { options: typeOptions } = useDict('oms_platform_appointment_type');
const { options: tagOptions } = useDict('oms_platform_appointment_tag');

const submitting = ref(false);
const platformOptions = ref<CommonType.Option[]>([]);
const warehouseOptions = ref<CommonType.Option[]>([]);
const platformAddressRows = ref<Api.Base.PlatformAddress[]>([]);

const form = ref<Api.Oms.PlatformAppointmentOperateParams>({
  platformName: '',
  warehouseCode: '',
  appointmentNo: '',
  appointmentTime: '',
  appointmentType: 'FBA_DELIVERY',
  remark: null,
  tagCodes: [],
  existingCargoCbm: 0
});

const appointmentTimeTs = ref<number | null>(null);

const filteredWarehouseOptions = computed(() => {
  if (!form.value.platformName) return warehouseOptions.value;
  const codes = platformAddressRows.value
    .filter(row => row.platformName === form.value.platformName)
    .map(row => row.addressCode)
    .filter(Boolean);
  const unique = [...new Set(codes)];
  if (!unique.length) return warehouseOptions.value;
  return unique.map(code => ({ label: String(code), value: String(code) }));
});

function resetForm() {
  form.value = {
    platformName: '',
    warehouseCode: '',
    appointmentNo: '',
    appointmentTime: '',
    appointmentType: 'FBA_DELIVERY',
    remark: null,
    tagCodes: [],
    existingCargoCbm: 0
  };
  appointmentTimeTs.value = null;
}

watch(visible, show => {
  if (show) resetForm();
});

watch(appointmentTimeTs, ts => {
  if (!ts) {
    form.value.appointmentTime = '';
    return;
  }
  form.value.appointmentTime = new Date(ts).toISOString().slice(0, 19).replace('T', ' ');
});

watch(
  () => form.value.platformName,
  () => {
    if (!filteredWarehouseOptions.value.some(o => o.value === form.value.warehouseCode)) {
      form.value.warehouseCode = '';
    }
  }
);

onMounted(async () => {
  const [platformRes, addressRes] = await Promise.all([
    fetchGetPlatformList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformAddressList({ pageNum: 1, pageSize: 2000, status: '0', params: {} })
  ]);
  platformOptions.value = (platformRes.data?.rows || []).map(item => ({
    label: item.platformName,
    value: item.platformName
  }));
  platformAddressRows.value = addressRes.data?.rows || [];
  const codes = [...new Set(platformAddressRows.value.map(row => row.addressCode).filter(Boolean))];
  warehouseOptions.value = codes.map(code => ({ label: String(code), value: String(code) }));
});

async function handleSubmit() {
  if (!form.value.platformName) {
    window.$message?.warning('请选择平台');
    return;
  }
  if (!form.value.warehouseCode) {
    window.$message?.warning('请选择仓库代码');
    return;
  }
  if (!form.value.appointmentTime) {
    window.$message?.warning('请选择预约时间');
    return;
  }
  if (!form.value.appointmentType) {
    window.$message?.warning('请选择预约类型');
    return;
  }

  submitting.value = true;
  const { data, error } = await fetchCreatePlatformAppointment({
    ...form.value,
    appointmentNo: form.value.appointmentNo?.trim() || undefined,
    tagCodes: form.value.tagCodes || [],
    existingCargoCbm: Number(form.value.existingCargoCbm) || 0
  } as Api.Oms.PlatformAppointmentOperateParams);
  submitting.value = false;
  if (!error && data) {
    window.$message?.success(`预约已创建：${data.appointmentNo}`);
    visible.value = false;
    emit('success', data);
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="新增平台预约"
    :mask-closable="false"
    style="width: 560px; max-width: 96vw"
  >
    <NForm label-placement="top" size="small">
      <NFormItem label="平台" required>
        <NSelect
          :to="POPUP_TO_BODY"
          v-model:value="form.platformName"
          filterable
          tag
          :options="platformOptions"
          placeholder="选择或输入平台"
        />
      </NFormItem>
      <NFormItem label="仓库代码" required>
        <NSelect
          :to="POPUP_TO_BODY"
          v-model:value="form.warehouseCode"
          filterable
          tag
          :options="filteredWarehouseOptions"
          placeholder="选择或输入仓库代码"
        />
      </NFormItem>
      <NFormItem label="预约号">
        <NInput v-model:value="form.appointmentNo" clearable placeholder="留空则系统自动生成" />
      </NFormItem>
      <NFormItem label="预约时间" required>
        <NDatePicker
          :to="POPUP_TO_BODY"
          v-model:value="appointmentTimeTs"
          type="datetime"
          clearable
          class="w-full"
          format="yyyy-MM-dd HH:mm:ss"
        />
      </NFormItem>
      <NFormItem label="类型" required>
        <NSelect :to="POPUP_TO_BODY" v-model:value="form.appointmentType" :options="typeOptions" />
      </NFormItem>
      <NFormItem label="标签">
        <NSelect
          :to="POPUP_TO_BODY"
          v-model:value="form.tagCodes"
          multiple
          clearable
          :options="tagOptions"
          placeholder="可选"
        />
      </NFormItem>
      <NFormItem label="现有货物 CBM">
        <NInputNumber v-model:value="form.existingCargoCbm" :min="0" :precision="2" class="w-full" />
      </NFormItem>
      <NFormItem label="备注">
        <NInput v-model:value="form.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确认</NButton>
      </div>
    </template>
  </NModal>
</template>
