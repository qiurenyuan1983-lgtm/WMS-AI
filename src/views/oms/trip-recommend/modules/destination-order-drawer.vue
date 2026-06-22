<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NSpace,
  NStatistic,
  NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import {
  fetchGenerateTripRecommend,
  fetchGetTripRecommendOrders,
  fetchPreviewTripRecommendLoad
} from '@/service/api/oms/trip-recommend';
import { FEE_STATUS_META, INVENTORY_STATUS_META } from '../constants';
import TripRecommendConfirmModal from './trip-recommend-confirm-modal.vue';
import {
  buildConfirmItemFromOrderLine,
  buildConfirmItemsFromOrderLines
} from '../utils/trip-recommend-confirm';
import type { TripRecommendConfirmItem } from '../utils/trip-recommend-confirm';

defineOptions({ name: 'TripRecommendDestinationDrawer' });

const props = defineProps<{
  groupId: string | null;
  filterParams?: Api.Oms.TripRecommendSearchParams;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const submitting = ref(false);
const rows = ref<Api.Oms.TripRecommendOrderLine[]>([]);
const groupContext = ref<Api.Oms.TripRecommendGroupContext | null>(null);
const loadPreview = ref<Api.Oms.TripRecommendLoadPreview | null>(null);
const checkedRowKeys = ref<number[]>([]);
const generatingOrderId = ref<number | null>(null);
const confirmModalVisible = ref(false);
const confirmItems = ref<TripRecommendConfirmItem[]>([]);
const confirmRuleLabel = ref('');
const confirmLoadingKey = ref<string | null>(null);

const selectionColumn = {
  type: 'selection' as const,
  fixed: 'left' as const,
  disabled: (row: Api.Oms.TripRecommendOrderLine) => row.tripGenerated || row.holdFlag || row.exceptionFlag
};

const columns = computed<DataTableColumns<Api.Oms.TripRecommendOrderLine>>(() => [
  selectionColumn,
  { key: 'orderNo', title: '订单号', width: 130, fixed: 'left' },
  { key: 'customerOrderNo', title: '客户订单号', width: 130, ellipsis: { tooltip: true }, render: row => row.customerOrderNo || '—' },
  { key: 'customerName', title: '客户', minWidth: 110, ellipsis: { tooltip: true } },
  { key: 'platform', title: '平台', width: 88 },
  { key: 'destination', title: '目的地', width: 90 },
  { key: 'appointmentNo', title: '预约号', width: 140, ellipsis: { tooltip: true } },
  {
    key: 'appointmentType',
    title: '预约类型',
    width: 88,
    render: row => (
      <NTag size="small" type={row.appointmentType === 'FLOOR' ? 'info' : 'primary'}>
        {row.appointmentType === 'FLOOR' ? 'Floor' : 'Pallet'}
      </NTag>
    )
  },
  { key: 'containerNo', title: '柜号', width: 120, ellipsis: { tooltip: true }, render: row => row.containerNo || '—' },
  { key: 'palletQty', title: '卡板数', width: 72, align: 'center' },
  { key: 'cartonQty', title: '箱数', width: 64, align: 'center' },
  { key: 'cbm', title: 'CBM', width: 72, align: 'right', render: row => row.cbm?.toFixed(2) },
  { key: 'weightKg', title: '重量KG', width: 88, align: 'right', render: row => row.weightKg?.toFixed(1) },
  {
    key: 'inventoryStatus',
    title: '库存状态',
    width: 88,
    render: row => {
      const meta = INVENTORY_STATUS_META[row.inventoryStatus] || { label: row.inventoryStatus, type: 'default' as const };
      return <NTag size="small" type={meta.type}>{meta.label}</NTag>;
    }
  },
  {
    key: 'feeStatus',
    title: '费用状态',
    width: 96,
    render: row => {
      const meta = FEE_STATUS_META[row.feeStatus] || { label: row.feeStatus, type: 'default' as const };
      return <NTag size="small" type={meta.type}>{meta.label}</NTag>;
    }
  },
  {
    key: 'tripGenerated',
    title: '已生成车次',
    width: 96,
    render: row => (
      <NTag size="small" type={row.tripGenerated ? 'success' : 'default'}>
        {row.tripGenerated ? '是' : '否'}
      </NTag>
    )
  },
  {
    key: 'action',
    title: '操作',
    width: 100,
    fixed: 'right',
    render: row => (
      <NButton
        size="tiny"
        type="primary"
        loading={generatingOrderId.value === row.id}
        disabled={row.tripGenerated || row.holdFlag || row.exceptionFlag || row.inventoryStatus !== 'AVAILABLE'}
        onClick={() => handleGenerateSingle(row)}
      >
        生成车次
      </NButton>
    )
  }
]);

async function loadDrawerData() {
  if (!props.groupId) return;
  loading.value = true;
  const { data, error } = await fetchGetTripRecommendOrders({
    ...props.filterParams,
    groupId: props.groupId
  });
  loading.value = false;
  if (error || !data) return;
  rows.value = data.rows || [];
  groupContext.value = data.groupContext || null;
  loadPreview.value = data.loadPreview || null;
  checkedRowKeys.value = (data.defaultSelectedIds || []).map(Number);
}

async function refreshPreview() {
  if (!props.groupId || !checkedRowKeys.value.length) {
    loadPreview.value = dataEmptyPreview();
    return;
  }
  const { data } = await fetchPreviewTripRecommendLoad(props.groupId, checkedRowKeys.value);
  loadPreview.value = data || dataEmptyPreview();
}

function dataEmptyPreview(): Api.Oms.TripRecommendLoadPreview {
  return {
    selectedOrderCount: 0,
    selectedPalletQty: 0,
    selectedCartonQty: 0,
    selectedCbm: 0,
    targetCbm: 0,
    selectedWeightKg: 0,
    maxWeightKg: 19000,
    loadRate: 0,
    weightUsageRate: 0,
    ruleStatus: 'EMPTY',
    ruleStatusLabel: '请勾选订单'
  };
}

async function handleGenerate(orderIds: number[]) {
  if (!props.groupId || !orderIds.length) return false;
  submitting.value = true;
  const { data, error } = await fetchGenerateTripRecommend({
    groupId: props.groupId,
    orderIds
  });
  submitting.value = false;
  if (error || !data?.success) {
    window.$message?.error(data?.message || '生成车次失败');
    return false;
  }
  window.$message?.success(data.message);
  confirmModalVisible.value = false;
  visible.value = false;
  emit('success');
  return true;
}

async function openConfirmModal(orderIds: number[], preview?: Api.Oms.TripRecommendLoadPreview | null) {
  if (!orderIds.length) {
    window.$message?.warning('请先勾选订单');
    return;
  }
  confirmItems.value =
    orderIds.length === 1
      ? rows.value
          .filter(row => orderIds.includes(row.id))
          .map(row => buildConfirmItemFromOrderLine(row))
      : buildConfirmItemsFromOrderLines(rows.value, orderIds);
  confirmRuleLabel.value = preview?.ruleStatusLabel || loadPreview.value?.ruleStatusLabel || '';
  confirmModalVisible.value = true;
}

async function handleConfirmGenerate(payload: { orderIds: number[]; item: TripRecommendConfirmItem }) {
  confirmLoadingKey.value = payload.item.key;
  try {
    await handleGenerate(payload.orderIds);
  } finally {
    confirmLoadingKey.value = null;
  }
}

async function handleGenerateSingle(row: Api.Oms.TripRecommendOrderLine) {
  if (!props.groupId) return;
  generatingOrderId.value = row.id;
  try {
    const { data: preview } = await fetchPreviewTripRecommendLoad(props.groupId, [row.id]);
    await openConfirmModal([row.id], preview);
  } finally {
    generatingOrderId.value = null;
  }
}

async function handleGenerateBatch() {
  if (!props.groupId) return;
  const { data: preview } = await fetchPreviewTripRecommendLoad(props.groupId, checkedRowKeys.value);
  await openConfirmModal(checkedRowKeys.value, preview);
}

const ruleStatusType = computed(() => {
  const status = loadPreview.value?.ruleStatus;
  if (status === 'OK') return 'success';
  if (status === 'UNDER') return 'warning';
  if (status === 'OVER_CBM' || status === 'OVER_WEIGHT') return 'error';
  return 'default';
});

watch(
  () => [visible.value, props.groupId],
  ([open]) => {
    if (open && props.groupId) loadDrawerData();
  }
);

watch(checkedRowKeys, () => {
  refreshPreview();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="960" placement="right" :to="POPUP_TO_BODY">
    <NDrawerContent title="目的地订单详情" closable>
      <template v-if="groupContext">
        <NDescriptions :column="3" size="small" label-placement="left" class="mb-16px">
          <NDescriptionsItem label="平台">{{ groupContext.platform }}</NDescriptionsItem>
          <NDescriptionsItem label="目的地">{{ groupContext.destination }}</NDescriptionsItem>
          <NDescriptionsItem label="预约号">{{ groupContext.appointmentNo }}</NDescriptionsItem>
          <NDescriptionsItem label="预约类型">
            <NTag
              size="small"
              :type="
                groupContext.appointmentType === 'MIXED'
                  ? 'warning'
                  : groupContext.appointmentType === 'FLOOR'
                    ? 'info'
                    : 'primary'
              "
            >
              {{
                groupContext.appointmentType === 'MIXED'
                  ? 'Floor/Pallet'
                  : groupContext.appointmentType === 'FLOOR'
                    ? 'Floor'
                    : 'Pallet'
              }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="预约时间">{{ groupContext.appointmentTime }}</NDescriptionsItem>
          <NDescriptionsItem label="推荐规则" :span="2">{{ groupContext.recommendRule }}</NDescriptionsItem>
          <NDescriptionsItem label="当前CBM">{{ loadPreview?.selectedCbm?.toFixed(2) ?? '0.00' }}</NDescriptionsItem>
          <NDescriptionsItem label="当前重量">{{ loadPreview?.selectedWeightKg?.toFixed(1) ?? '0' }} KG</NDescriptionsItem>
          <NDescriptionsItem label="可操作订单数">{{ rows.filter(r => !r.tripGenerated).length }}</NDescriptionsItem>
        </NDescriptions>
      </template>

      <NDataTable
        :columns="columns"
        :data="rows"
        :loading="loading"
        :row-key="row => row.id"
        :checked-row-keys="checkedRowKeys"
        size="small"
        :scroll-x="1680"
        flex-height
        class="min-h-320px"
        @update:checked-row-keys="keys => (checkedRowKeys = keys as number[])"
      />

      <div v-if="loadPreview" class="mt-16px border border-#e5e7eb rounded-8px p-12px bg-#f9fafb">
        <div class="mb-8px flex items-center justify-between">
          <span class="text-14px font-medium">装载测算</span>
          <NTag :type="ruleStatusType" size="small">{{ loadPreview.ruleStatusLabel }}</NTag>
        </div>
        <NSpace :size="24" wrap>
          <NStatistic label="已选订单" :value="loadPreview.selectedOrderCount" />
          <NStatistic label="已选板数" :value="loadPreview.selectedPalletQty" />
          <NStatistic label="已选箱数" :value="loadPreview.selectedCartonQty" />
          <NStatistic label="已选CBM" :value="loadPreview.selectedCbm" :precision="2" />
          <NStatistic label="目标CBM" :value="loadPreview.targetCbm" :precision="0" />
          <NStatistic label="已选重量" :value="loadPreview.selectedWeightKg" :precision="1" suffix="KG" />
          <NStatistic label="最大重量" :value="loadPreview.maxWeightKg" suffix="KG" />
          <NStatistic label="装载率" :value="loadPreview.loadRate" suffix="%" />
          <NStatistic label="重量使用率" :value="loadPreview.weightUsageRate" suffix="%" />
        </NSpace>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">关闭</NButton>
          <NButton type="primary" :loading="submitting" :disabled="!checkedRowKeys.length" @click="handleGenerateBatch">
            批量生成车次
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>

  <TripRecommendConfirmModal
    v-model:visible="confirmModalVisible"
    :items="confirmItems"
    :rule-status-label="confirmRuleLabel"
    :loading-key="confirmLoadingKey"
    @confirm="handleConfirmGenerate"
  />
</template>
