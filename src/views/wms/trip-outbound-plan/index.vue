<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NGi, NGrid, NInput, NModal, NSelect, NSpace, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import {
  fetchAssignTripDock,
  fetchGetTripOutboundPlanList,
  fetchGetTripOutboundPlanStats,
  fetchNotifyTripDrivers
} from '@/service/api/wms/outbound-mgmt';
import {
  CHECKIN_STATUS_META,
  DOCK_ASSIGN_STATUS_META,
  NOTIFY_STATUS_META,
  OUTBOUND_STATUS_META,
  TRIP_OP_STATUS_META,
  TRIP_PLAN_FLOW_TABS
} from '../outbound-mgmt/constants';
import TripPlanDetailPanel from './modules/trip-plan-detail-panel.vue';

defineOptions({ name: 'WmsTripOutboundPlan' });

const appStore = useAppStore();
const stats = ref<Api.Wms.TripOutboundPlanStats | null>(null);
const activeTab = ref('ALL');
const checkedRowKeys = ref<CommonType.IdType[]>([]);
const selectedId = ref<CommonType.IdType | null>(null);
const detailPanelRef = ref<InstanceType<typeof TripPlanDetailPanel> | null>(null);
const dockModalVisible = ref(false);
const dockTripId = ref<CommonType.IdType | null>(null);
const dockNo = ref('');
const dockReason = ref('');

const searchParams = ref<Api.Wms.TripOutboundPlanSearchParams>({
  pageNum: 1,
  pageSize: 10,
  flowTab: null,
  tripNo: null,
  orderNo: null,
  customerName: null,
  destination: null,
  driverName: null,
  plateNo: null,
  supplierName: null,
  operationStatus: null,
  outboundStatus: null
});

const kpiCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { key: 'today', label: '今日车次', value: s.todayTrips, color: '#2563eb' },
    { key: 'pendingNotify', label: '待通知司机', value: s.pendingNotify, color: '#64748b' },
    { key: 'notified', label: '已通知司机', value: s.notified, color: '#0284c7' },
    { key: 'pendingCheckin', label: '待Check-in', value: s.pendingCheckin, color: '#f59e0b' },
    { key: 'checkedIn', label: '已Check-in', value: s.checkedIn, color: '#16a34a' },
    { key: 'waitingDock', label: '等待DOCK', value: s.waitingDock, color: '#7c3aed' },
    { key: 'dockAssigned', label: '已分配DOCK', value: s.dockAssigned, color: '#0891b2' },
    { key: 'overtime', label: '超时风险', value: s.overtimeRisk, color: '#dc2626' }
  ];
});

const opStatusOptions = Object.entries(TRIP_OP_STATUS_META).map(([value, meta]) => ({
  label: meta.label,
  value
}));

async function loadStats() {
  const { data } = await fetchGetTripOutboundPlanStats();
  stats.value = data ?? null;
}

function syncTab() {
  searchParams.value.flowTab = activeTab.value === 'ALL' ? null : activeTab.value;
}

async function refreshAll() {
  syncTab();
  await Promise.all([loadStats(), getData()]);
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetTripOutboundPlanList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page;
    searchParams.value.pageSize = pageSize;
  },
  columns: () => [
    { type: 'selection', width: 44 },
    {
      key: 'tripNo',
      title: '车次号',
      width: 140,
      fixed: 'left',
      render: row => (
        <NButton text type="primary" onClick={() => selectRow(row.id)}>
          {row.tripNo}
        </NButton>
      )
    },
    { key: 'orderNos', title: '订单号', width: 160, ellipsis: { tooltip: true } },
    { key: 'customerName', title: '客户', width: 120, ellipsis: { tooltip: true } },
    { key: 'destination', title: '目的地', width: 80 },
    { key: 'appointmentTime', title: '预约时间', width: 150 },
    { key: 'palletQty', title: '板数', width: 56, align: 'center' },
    { key: 'cartonQty', title: '箱数', width: 56, align: 'center' },
    { key: 'vehicleType', title: '车型', width: 110, ellipsis: { tooltip: true } },
    { key: 'driverName', title: '司机', width: 88, render: r => r.driverName || '—' },
    { key: 'plateNo', title: '车牌', width: 92, render: r => r.plateNo || '—' },
    { key: 'supplierName', title: '供应商', width: 130, ellipsis: { tooltip: true } },
    {
      key: 'notifyStatus',
      title: '通知状态',
      width: 100,
      render: r => {
        const m = NOTIFY_STATUS_META[r.notifyStatus];
        return <NTag size="small" type={m?.type || 'default'}>{m?.label || r.notifyStatus}</NTag>;
      }
    },
    {
      key: 'checkinStatus',
      title: 'Check-in',
      width: 100,
      render: r => {
        const m = CHECKIN_STATUS_META[r.checkinStatus];
        return <NTag size="small" type={m?.type || 'default'}>{m?.label || r.checkinStatus}</NTag>;
      }
    },
    { key: 'dockNo', title: 'DOCK', width: 72, render: r => r.dockNo || '—' },
    {
      key: 'dockStatus',
      title: 'DOCK状态',
      width: 96,
      render: r => {
        const m = DOCK_ASSIGN_STATUS_META[r.dockStatus];
        return <NTag size="small" type={m?.type || 'default'}>{m?.label || r.dockStatus}</NTag>;
      }
    },
    {
      key: 'operationStatus',
      title: '操作状态',
      width: 100,
      render: r => {
        const m = TRIP_OP_STATUS_META[r.operationStatus];
        return (
          <NTag size="small" type={m?.type || 'default'} style={m?.color ? { borderColor: m.color, color: m.color } : undefined}>
            {m?.label || r.operationStatus}
          </NTag>
        );
      }
    },
    { key: 'latestLoadStart', title: '最晚开始装车', width: 150 },
    { key: 'latestLoadFinish', title: '最晚完成', width: 150 },
    {
      key: 'outboundStatus',
      title: '出库状态',
      width: 96,
      render: r => {
        const m = OUTBOUND_STATUS_META[r.outboundStatus];
        return <NTag size="small" type={m?.type || 'default'}>{m?.label || r.outboundStatus}</NTag>;
      }
    },
    {
      key: 'action',
      title: '操作',
      width: 160,
      fixed: 'right',
      render: row => (
        <NSpace size="small">
          {row.notifyStatus === 'PENDING' && (
            <NButton size="tiny" type="primary" onClick={() => notifyOne(row.id)}>通知司机</NButton>
          )}
          <NButton size="tiny" onClick={() => openDockModal(row.id)}>分配DOCK</NButton>
        </NSpace>
      )
    }
  ]
});

function selectRow(id: CommonType.IdType) {
  selectedId.value = id;
}

async function notifyOne(id: CommonType.IdType) {
  const { data, error } = await fetchNotifyTripDrivers([id]);
  if (!error && data?.success) {
    window.$message?.success(data.message);
    await refreshAll();
    detailPanelRef.value?.reload();
  }
}

async function batchNotify() {
  if (!checkedRowKeys.value.length) {
    window.$message?.warning('请先勾选车次');
    return;
  }
  const { data, error } = await fetchNotifyTripDrivers(checkedRowKeys.value);
  if (!error && data?.success) {
    window.$message?.success(data.message);
    checkedRowKeys.value = [];
    await refreshAll();
  }
}

function openDockModal(id: CommonType.IdType) {
  dockTripId.value = id;
  dockNo.value = '';
  dockReason.value = '';
  dockModalVisible.value = true;
}

async function confirmDock() {
  if (!dockTripId.value || !dockNo.value) {
    window.$message?.warning('请选择 DOCK');
    return;
  }
  const { data, error } = await fetchAssignTripDock(dockTripId.value, dockNo.value, dockReason.value || undefined);
  if (!error && data?.success) {
    window.$message?.success(data.message);
    dockModalVisible.value = false;
    await refreshAll();
    detailPanelRef.value?.reload();
  }
}

function handleExport() {
  window.$message?.info('[原型] 导出车次出库计划');
}

onMounted(refreshAll);
</script>

<template>
  <div class="trip-plan-page h-full flex-col-stretch gap-12px overflow-hidden">
    <NGrid :x-gap="10" :y-gap="10" cols="2 s:4 m:8" responsive="screen" class="flex-shrink-0">
      <NGi v-for="card in kpiCards" :key="card.key">
        <NCard :bordered="false" size="small" class="kpi-card">
          <div class="kpi-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="kpi-label">{{ card.label }}</div>
        </NCard>
      </NGi>
    </NGrid>

    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="筛选" name="search">
          <div class="flex flex-wrap gap-8px items-center">
            <NInput v-model:value="searchParams.tripNo" clearable placeholder="车次号" class="w-140px" />
            <NInput v-model:value="searchParams.orderNo" clearable placeholder="订单号" class="w-140px" />
            <NInput v-model:value="searchParams.customerName" clearable placeholder="客户" class="w-120px" />
            <NInput v-model:value="searchParams.destination" clearable placeholder="目的地" class="w-100px" />
            <NInput v-model:value="searchParams.driverName" clearable placeholder="司机" class="w-100px" />
            <NInput v-model:value="searchParams.plateNo" clearable placeholder="车牌" class="w-100px" />
            <NInput v-model:value="searchParams.supplierName" clearable placeholder="供应商" class="w-130px" />
            <NSelect
              :to="POPUP_TO_BODY"
              v-model:value="searchParams.operationStatus"
              clearable
              :options="opStatusOptions"
              placeholder="操作状态"
              class="w-120px"
            />
            <NButton type="primary" :loading="loading" @click="refreshAll">搜索</NButton>
            <NButton @click="refreshAll">刷新</NButton>
            <NButton type="success" :disabled="!checkedRowKeys.length" @click="batchNotify">批量通知</NButton>
            <NButton @click="handleExport">导出</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
      <div class="mt-10px flex flex-wrap gap-6px">
        <NTag
          v-for="tab in TRIP_PLAN_FLOW_TABS"
          :key="tab.key"
          size="small"
          class="cursor-pointer"
          :type="activeTab === tab.key ? 'primary' : 'default'"
          :bordered="activeTab !== tab.key"
          @click="activeTab = tab.key; refreshAll()"
        >
          {{ tab.label }}
        </NTag>
      </div>
    </NCard>

    <div class="plan-body flex flex-1 gap-12px min-h-0 overflow-hidden">
      <NCard :bordered="false" size="small" class="list-panel card-wrapper flex-1 min-w-0">
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          :loading="loading"
          :pagination="mobilePagination"
          :scroll-x="scrollX"
          :row-key="(r: Api.Wms.TripOutboundPlanRow) => r.id"
          :flex-height="!appStore.isMobile"
          size="small"
          :row-props="(row: Api.Wms.TripOutboundPlanRow) => ({ style: selectedId === row.id ? 'background: rgb(var(--primary-color) / 0.06)' : '', onClick: () => selectRow(row.id) })"
        />
      </NCard>
      <NCard v-if="!appStore.isMobile" :bordered="false" size="small" class="detail-panel card-wrapper w-360px flex-shrink-0">
        <div class="mb-8px font-600">车次详情</div>
        <TripPlanDetailPanel ref="detailPanelRef" :trip-id="selectedId" />
      </NCard>
    </div>

    <NDrawer
      v-if="appStore.isMobile"
      :show="Boolean(selectedId)"
      :width="360"
      @update:show="v => { if (!v) selectedId = null; }"
    >
      <NDrawerContent title="车次详情" closable>
        <TripPlanDetailPanel ref="detailPanelRef" :trip-id="selectedId" />
      </NDrawerContent>
    </NDrawer>

    <NModal v-model:show="dockModalVisible" preset="card" title="分配 / 调整 DOCK" class="w-420px">
      <NForm label-placement="left" label-width="88">
        <NFormItem label="DOCK">
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="dockNo"
            :options="['D-01','D-02','D-03','D-04','D-05','D-06'].map(v => ({ label: v, value: v }))"
            placeholder="选择 DOCK"
          />
        </NFormItem>
        <NFormItem label="调整原因">
          <NInput v-model:value="dockReason" type="textarea" placeholder="人工调整时填写原因" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="dockModalVisible = false">取消</NButton>
          <NButton type="primary" @click="confirmDock">确认</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.kpi-card {
  min-height: 64px;
}
.kpi-value {
  font-size: 20px;
  font-weight: 700;
}
.kpi-label {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}
.plan-body :deep(.list-panel .n-card__content) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
</style>
