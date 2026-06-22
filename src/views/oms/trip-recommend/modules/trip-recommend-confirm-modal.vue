<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NDataTable, NModal, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import type { TripRecommendConfirmItem } from '../utils/trip-recommend-confirm';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  items: TripRecommendConfirmItem[];
  ruleStatusLabel?: string;
  loadingKey?: string | null;
}>();

const emit = defineEmits<{
  (e: 'confirm', payload: { orderIds: number[]; item: TripRecommendConfirmItem }): void;
}>();

const confirmingKey = ref<string | null>(null);

const ruleTagType = computed(() => {
  const text = props.ruleStatusLabel || '';
  if (text.includes('偏差低') || text.includes('偏低')) return 'warning' as const;
  if (text.includes('超载') || text.includes('超重') || text.includes('超出')) return 'error' as const;
  if (text.includes('可生成') || text.includes('正常')) return 'success' as const;
  return 'default' as const;
});

const columns = computed<DataTableColumns<TripRecommendConfirmItem>>(() => [
  { key: 'appointmentDate', title: '预约日期', width: 108 },
  { key: 'appointmentNo', title: '预约号', width: 140, ellipsis: { tooltip: true } },
  { key: 'destination', title: '目的地', width: 88 },
  {
    key: 'appointmentType',
    title: '预约类型',
    width: 108,
    render: row => {
      const code = row.appointmentTypeCode;
      if (code === 'MIXED') {
        return (
          <NTag size="small" type="warning">
            Floor/Pallet
          </NTag>
        );
      }
      return (
        <NTag size="small" type={code === 'FLOOR' ? 'info' : 'primary'}>
          {row.appointmentType}
        </NTag>
      );
    }
  },
  { key: 'palletQty', title: '板数', width: 72, align: 'center' },
  {
    key: 'weightKg',
    title: '重量',
    width: 96,
    align: 'right',
    render: row => `${row.weightKg.toFixed(1)} KG`
  },
  {
    key: 'cbm',
    title: 'CBM',
    width: 80,
    align: 'right',
    render: row => row.cbm.toFixed(2)
  },
  {
    key: 'action',
    title: '操作',
    width: 108,
    fixed: 'right',
    render: row => (
      <NButton
        size="tiny"
        type="primary"
        loading={confirmingKey.value === row.key || props.loadingKey === row.key}
        onClick={() => handleConfirmRow(row)}
      >
        确认车次
      </NButton>
    )
  }
]);

function handleConfirmRow(item: TripRecommendConfirmItem) {
  confirmingKey.value = item.key;
  emit('confirm', { orderIds: item.orderIds, item });
}

defineExpose({
  clearConfirming: () => {
    confirmingKey.value = null;
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="确认生成车次"
    class="w-920px max-w-96vw"
    :to="POPUP_TO_BODY"
    :mask-closable="false"
  >
    <div v-if="ruleStatusLabel" class="mb-12px">
      <NTag :type="ruleTagType" size="small">{{ ruleStatusLabel }}</NTag>
    </div>

    <NDataTable
      :columns="columns"
      :data="items"
      :row-key="row => row.key"
      size="small"
      :scroll-x="820"
      :max-height="360"
    />

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
