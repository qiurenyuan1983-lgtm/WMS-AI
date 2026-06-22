<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NModal, NSelect } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import {
  fetchDispatchAssign,
  fetchGetTmsDockBoard,
  fetchGetTmsDriverList,
  fetchGetTmsSupplierList,
  fetchGetTmsVehicleList
} from '@/service/api/tms';

defineOptions({ name: 'DispatchAssignModal' });

const props = defineProps<{
  planId: number | null;
  assignType: 'dock' | 'driver' | 'vehicle' | 'supplier' | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ (e: 'assigned'): void }>();

const value = ref<string | null>(null);
const loading = ref(false);
const options = ref<{ label: string; value: string }[]>([]);

const titleMap = {
  dock: '分配 DOCK',
  driver: '分配司机',
  vehicle: '分配车辆',
  supplier: '分配供应商'
};

const title = computed(() => (props.assignType ? titleMap[props.assignType] : '分配资源'));

async function loadOptions() {
  if (!props.assignType) return;
  options.value = [];
  if (props.assignType === 'dock') {
    const { data } = await fetchGetTmsDockBoard();
    options.value = (data ?? [])
      .filter(d => d.status === 'IDLE' || d.status === 'RESERVED')
      .map(d => ({ label: `${d.dockNo} (${d.status})`, value: d.dockNo }));
  } else if (props.assignType === 'driver') {
    const { data } = await fetchGetTmsDriverList({ pageNum: 1, pageSize: 50 });
    options.value = (data?.rows ?? []).map(d => ({
      label: `${d.driverName} · ${d.supplierName}`,
      value: d.driverName
    }));
  } else if (props.assignType === 'vehicle') {
    const { data } = await fetchGetTmsVehicleList({ pageNum: 1, pageSize: 50 });
    options.value = (data?.rows ?? []).map(v => ({
      label: `${v.plateNo} · ${v.vehicleType}`,
      value: v.plateNo
    }));
  } else {
    const { data } = await fetchGetTmsSupplierList({ pageNum: 1, pageSize: 50 });
    options.value = (data?.rows ?? []).map(s => ({
      label: `${s.supplierName} · ${s.serviceArea}`,
      value: s.supplierName
    }));
  }
}

watch(visible, async val => {
  if (val) {
    value.value = null;
    await loadOptions();
  }
});

async function handleConfirm() {
  if (!props.planId || !props.assignType || !value.value) {
    window.$message?.warning('请选择分配项');
    return false;
  }
  loading.value = true;
  try {
    const { data, error } = await fetchDispatchAssign(props.planId, props.assignType, value.value);
    if (error) return false;
    window.$message?.success(data?.message ?? '分配成功');
    emit('assigned');
    return true;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="dialog"
    :title="title"
    :to="POPUP_TO_BODY"
    positive-text="确认"
    negative-text="取消"
    :loading="loading"
    @positive-click="handleConfirm"
  >
    <NSelect v-model:value="value" :options="options" filterable placeholder="请选择" class="w-full" />
  </NModal>
</template>
