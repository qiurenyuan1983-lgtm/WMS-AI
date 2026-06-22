<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetOrderWorkbenchList, fetchGetOrderWorkbenchStats } from '@/service/api/oms/order-workbench';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { useAppStore } from '@/store/modules/app';
import { CARGO_OPERATION_STATUS_META, type CargoOperationStatus } from '@/utils/oms/operation-status';
import CargoOrderDetailDrawer from '@/views/oms/cargo-order/modules/cargo-order-detail-drawer.vue';
import TableColumnSetting from '@/components/advanced/table-column-setting.vue';
import { useOrderWorkbenchGenerateTrip } from './composables/use-order-workbench-generate-trip';
import WorkbenchGenerateTripModal from './modules/workbench-generate-trip-modal.vue';
import {
  ORDER_POOL_OPTIONS,
  POOL_TYPE_TAG,
  STATUS_META,
  type OrderPoolKey,
  type OrderTabKey
} from './constants';
defineOptions({ name: 'OmsOrderWorkbench' });

const TIMELINESS_TAG: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  T: 'error',
  K: 'warning',
  NORMAL_SHIP: 'default'
};

const { record: timelinessLevelRecord } = useDict('oms_timeliness_level');

const appStore = useAppStore();
const detailDrawerVisible = ref(false);
const viewingId = ref<CommonType.IdType>();

const EMPTY_POOL_COUNTS: Record<OrderPoolKey, number> = {
  ALL: 0,
  AMAZON: 0,
  PLATFORM: 0,
  LTL: 0,
  LOCAL: 0,
  EXPRESS: 0
};

const stats = ref<Api.Oms.OrderWorkbenchStats | null>(null);

const poolCounts = computed(() => ({
  ...EMPTY_POOL_COUNTS,
  ...(stats.value?.poolCounts as Partial<Record<OrderPoolKey, number>> | undefined)
}));
const activePool = ref<OrderPoolKey>('ALL');
const activeTab = ref<OrderTabKey>('ALL');
const poolSidebarCollapsed = ref(false);

const searchParams = ref<Api.Oms.OrderWorkbenchSearchParams>({
  pageNum: 1,
  pageSize: 10,
  pool: null,
  tab: null,
  orderNo: null,
  customerName: null,
  platform: null,
  destination: null,
  isaNo: null,
  dwTime: null,
  status: null
});

const platformOptions = [
  { label: '全部', value: '' },
  { label: 'Amazon', value: 'Amazon' },
  { label: 'Walmart', value: 'Walmart' },
  { label: 'SHEIN', value: 'SHEIN' },
  { label: 'FedEx', value: 'FedEx' },
  { label: 'UPS', value: 'UPS' },
  { label: 'Local', value: 'Local' }
];

const statusTabs = computed(() => {
  const c = stats.value?.tabCounts || {};
  return [
    { key: 'ALL' as OrderTabKey, label: '全部', count: c.ALL || 0 },
    { key: 'PENDING_APPT' as OrderTabKey, label: '待预约', count: c.PENDING_APPT || 0 },
    { key: 'PRE_TRIP' as OrderTabKey, label: '预出车次', count: c.PRE_TRIP || 0 },
    { key: 'PENDING_MANUAL' as OrderTabKey, label: '待人工确认', count: c.PENDING_MANUAL || 0 },
    { key: 'PENDING_CARGO' as OrderTabKey, label: '待添加货物', count: c.PENDING_CARGO || 0 },
    { key: 'PENDING_CUSTOMER' as OrderTabKey, label: '待客户确认', count: c.PENDING_CUSTOMER || 0 },
    { key: 'ABNORMAL' as OrderTabKey, label: '异常订单', count: c.ABNORMAL || 0 }
  ];
});

function syncSearchPool() {
  searchParams.value.pool = activePool.value === 'ALL' ? null : activePool.value;
  searchParams.value.tab = activeTab.value === 'ALL' ? null : activeTab.value;
}

async function loadStats() {
  const { data, error } = await fetchGetOrderWorkbenchStats();
  if (error || !data) {
    stats.value = null;
    return;
  }
  stats.value = {
    ...data,
    poolCounts: { ...EMPTY_POOL_COUNTS, ...(data.poolCounts || {}) },
    tabCounts: { ...(data.tabCounts || {}) }
  };
}

/** 打开订单管理详情抽屉（与 cargo-order 同源数据） */
function openDedicatedPage(row: Api.Oms.OrderWorkbenchRow) {
  viewingId.value = row.id;
  detailDrawerVisible.value = true;
}

async function refreshAll() {
  syncSearchPool();
  await Promise.all([loadStats(), getData()]);
}

const {
  checkedRowKeys,
  selectedRows,
  selectionTotals,
  selectedCount,
  modalVisible,
  submitting,
  syncSelectionFromPage,
  handleCheckedRowKeysChange,
  openGenerateModal,
  confirmGenerate,
  isRowTripGenerated
} = useOrderWorkbenchGenerateTrip(refreshAll);

function resetFilters() {
  searchParams.value.orderNo = null;
  searchParams.value.customerName = null;
  searchParams.value.platform = null;
  searchParams.value.destination = null;
  searchParams.value.isaNo = null;
  searchParams.value.dwTime = null;
  searchParams.value.status = null;
  refreshAll();
}

const { columns, columnChecks, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetOrderWorkbenchList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page;
    searchParams.value.pageSize = pageSize;
  },
  columns: () => [
    { type: 'selection', width: 48, disabled: (row: Api.Oms.OrderWorkbenchRow) => isRowTripGenerated(row) },
    {
      key: 'orderNo',
      title: '订单号',
      width: 140,
      fixed: 'left',
      render: row => (
        <NButton text type="primary" onClick={() => openDedicatedPage(row)}>
          {row.orderNo}
        </NButton>
      )
    },
    {
      key: 'orderTypeLabel',
      title: '订单类型',
      width: 130,
      render: row => (
        <NTag size="small" type={POOL_TYPE_TAG[row.pool] || 'default'}>
          {row.orderTypeLabel}
        </NTag>
      )
    },
    { key: 'customerName', title: '客户', minWidth: 120, ellipsis: { tooltip: true } },
    { key: 'platform', title: '平台', width: 90, render: row => row.platform || '—' },
    { key: 'destination', title: '目的地', width: 110, ellipsis: { tooltip: true } },
    { key: 'isaNo', title: 'ISA', width: 130, ellipsis: { tooltip: true }, render: row => row.isaNo || '—' },
    { key: 'dwTime', title: 'DW', width: 130, render: row => row.dwTime || '—' },
    {
      key: 'timelinessLevel',
      title: '时效等级',
      width: 100,
      render: row => {
        const code = row.timelinessLevel;
        if (!code) return '—';
        const label = timelinessLevelRecord.value[code]?.dictLabel ?? code;
        return <NTag size="small" type={TIMELINESS_TAG[code] || 'default'}>{label}</NTag>;
      }
    },
    { key: 'appointmentTime', title: '预约时间', width: 150, render: row => row.appointmentTime || '—' },
    {
      key: 'qty',
      title: '板数/箱数',
      width: 100,
      render: row => (row.pool === 'EXPRESS' ? `${row.cartonQty}箱` : `${row.palletQty}板`)
    },
    {
      key: 'weightKg',
      title: '重量(KG)',
      width: 92,
      align: 'right',
      render: row => (row.weightKg != null ? row.weightKg.toFixed(1) : '—')
    },
    {
      key: 'volumeCbm',
      title: 'CBM',
      width: 72,
      align: 'right',
      render: row => (row.volumeCbm != null ? Number(row.volumeCbm).toFixed(2) : '—')
    },
    {
      key: 'operationStatus',
      title: '操作状态',
      width: 120,
      render: row => {
        const code = row.operationStatus as CargoOperationStatus | undefined;
        const meta = code ? CARGO_OPERATION_STATUS_META[code] : null;
        return <NTag size="small" type={meta?.type ?? 'default'}>{meta?.label ?? code ?? '—'}</NTag>;
      }
    },
    {
      key: 'status',
      title: '状态',
      width: 110,
      render: row => {
        const meta = STATUS_META[row.status];
        return <NTag size="small" type={meta?.type || 'default'}>{meta?.label || row.status}</NTag>;
      }
    },
    {
      key: 'operate',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => (
        <NButton size="tiny" type="primary" text onClick={() => openDedicatedPage(row)}>
          查看
        </NButton>
      )
    }
  ]
});

watch([activePool, activeTab], () => {
  searchParams.value.pageNum = 1;
  refreshAll();
});

watch(data, rows => {
  if (rows?.length) syncSelectionFromPage(rows);
});

onMounted(async () => {
  syncSearchPool();
  await refreshAll();
});
</script>

<template>
  <div class="order-workbench h-full min-h-500px flex-col-stretch gap-12px overflow-hidden">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false" class="filter-form">
        <NFormItem label="订单号">
          <NInput v-model:value="searchParams.orderNo" clearable placeholder="SO/LD/EX" class="w-140px" />
        </NFormItem>
        <NFormItem label="客户">
          <NInput v-model:value="searchParams.customerName" clearable placeholder="客户名称" class="w-120px" />
        </NFormItem>
        <NFormItem label="平台">
          <NSelect :to="POPUP_TO_BODY" v-model:value="searchParams.platform" :options="platformOptions" class="w-110px" />
        </NFormItem>
        <NFormItem label="目的地">
          <NInput v-model:value="searchParams.destination" clearable placeholder="ONT8/地址" class="w-120px" />
        </NFormItem>
        <NFormItem label="ISA">
          <NInput v-model:value="searchParams.isaNo" clearable placeholder="ISA/预约号" class="w-130px" />
        </NFormItem>
        <NFormItem label="DW">
          <NInput v-model:value="searchParams.dwTime" clearable placeholder="DW时间" class="w-130px" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" :loading="loading" @click="refreshAll">搜索</NButton>
            <NButton @click="resetFilters">重置</NButton>
            <NButton @click="refreshAll">刷新</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <div class="workbench-body">
      <div class="pool-shell" :class="{ 'pool-shell--collapsed': poolSidebarCollapsed }">
        <NCard
          v-show="!poolSidebarCollapsed"
          class="pool-sidebar card-wrapper"
          :bordered="false"
          size="small"
          content-class="pool-body"
        >
          <div class="pool-header">
            <span class="pool-title">订单池分类</span>
            <NButton text type="primary" size="tiny" @click="poolSidebarCollapsed = true">收起</NButton>
          </div>

          <div class="pool-list">
            <div
              v-for="pool in ORDER_POOL_OPTIONS"
              :key="pool.key"
              class="pool-item"
              :class="{ active: activePool === pool.key }"
              @click="activePool = pool.key"
            >
              <div class="flex items-center justify-between">
                <span class="font-600 text-13px">{{ pool.label }}</span>
                <span class="pool-count">{{ poolCounts[pool.key] }}</span>
              </div>
              <div class="mt-4px text-11px text-#9ca3af">{{ pool.desc }}</div>
            </div>
          </div>
        </NCard>

        <button
          type="button"
          class="pool-collapse-handle"
          :class="{ 'pool-collapse-handle--expand': poolSidebarCollapsed }"
          :title="poolSidebarCollapsed ? '展开订单池' : '向左收起订单池'"
          @click="poolSidebarCollapsed = !poolSidebarCollapsed"
        >
          <span class="pool-collapse-handle__icon">{{ poolSidebarCollapsed ? '⟩' : '⟨' }}</span>
          <span class="pool-collapse-handle__text">{{ poolSidebarCollapsed ? '订单池' : '收起' }}</span>
        </button>
      </div>

      <NCard
        class="list-panel card-wrapper"
        :class="{ 'list-panel--pool-collapsed': poolSidebarCollapsed }"
        :bordered="false"
        size="small"
        content-class="list-body"
      >
        <div class="list-toolbar mb-10px">
          <div class="flex flex-wrap items-center gap-6px">
            <NTag
              v-for="tab in statusTabs"
              :key="tab.key"
              size="small"
              class="cursor-pointer"
              :type="activeTab === tab.key ? 'primary' : 'default'"
              :bordered="activeTab !== tab.key"
              @click="activeTab = tab.key"
            >
              {{ tab.label }} ({{ tab.count }})
            </NTag>
          </div>
          <div class="list-toolbar-actions">
            <div v-if="selectedCount" class="selection-bar">
              <span class="selection-stat">已选 {{ selectedCount }} 单</span>
              <span class="selection-stat">总重量 {{ selectionTotals.weightKg }} KG</span>
              <span class="selection-stat">总 CBM {{ selectionTotals.cbm }}</span>
              <span class="selection-stat">总卡板 {{ selectionTotals.palletQty }} 板</span>
              <NButton type="primary" size="small" @click="openGenerateModal">生成车次订单</NButton>
            </div>
            <TableColumnSetting v-model:columns="columnChecks" />
          </div>
        </div>

        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          :loading="loading"
          :pagination="mobilePagination"
          :scroll-x="scrollX"
          :row-key="(row: Api.Oms.OrderWorkbenchRow) => row.id"
          :flex-height="!appStore.isMobile"
          size="small"
          class="table-area"
          @update:checked-row-keys="(keys: CommonType.IdType[]) => handleCheckedRowKeysChange(keys, data)"
        />
      </NCard>
    </div>

    <CargoOrderDetailDrawer
      v-model:visible="detailDrawerVisible"
      :order-id="viewingId"
      @refresh="refreshAll"
    />

    <WorkbenchGenerateTripModal
      v-model:visible="modalVisible"
      :rows="selectedRows"
      :loading="submitting"
      @confirm="confirmGenerate"
    />
  </div>
</template>

<style scoped lang="scss">
.order-workbench {
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
}

.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.list-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

.selection-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.selection-stat {
  color: #374151;
  white-space: nowrap;
}

.filter-form {
  flex-wrap: wrap;
}

.workbench-body {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

.pool-shell {
  display: flex;
  flex-shrink: 0;
  min-height: 0;
  align-items: stretch;
  width: 262px;
  transition: width 0.2s ease;
}

.pool-shell--collapsed {
  width: 28px;
}

:deep(.pool-sidebar.n-card) {
  width: 240px;
  flex-shrink: 0;
  min-height: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.pool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.pool-title {
  font-weight: 600;
  font-size: 13px;
}

.pool-collapse-handle {
  width: 22px;
  flex-shrink: 0;
  border: 1px solid var(--n-border-color);
  border-left: none;
  border-radius: 0 8px 8px 0;
  background: #fff;
  box-shadow: 2px 0 8px rgb(15 23 42 / 0.06);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  color: rgb(var(--primary-color));
  transition:
    background 0.15s,
    color 0.15s,
    width 0.2s ease;

  &:hover {
    background: rgb(var(--primary-color) / 0.08);
  }
}

.pool-collapse-handle--expand {
  width: 28px;
  border-left: 1px solid var(--n-border-color);
  border-radius: 0 8px 8px 0;
}

.pool-collapse-handle__icon {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.pool-collapse-handle__text {
  writing-mode: vertical-rl;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
}

:deep(.list-panel.n-card) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

:deep(.list-panel--pool-collapsed.n-card) {
  border-top-left-radius: var(--n-border-radius);
  border-bottom-left-radius: var(--n-border-radius);
}

:deep(.pool-body),
:deep(.list-body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.pool-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-count {
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgb(var(--primary-color) / 0.12);
  color: rgb(var(--primary-color));
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
  flex-shrink: 0;
}

.pool-item {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgb(var(--primary-color) / 0.4);
  }

  &.active {
    border-color: rgb(var(--primary-color));
    background: rgb(var(--primary-color) / 0.05);
  }
}

.table-area {
  flex: 1;
  min-height: 0;
}

@media (max-width: 1200px) {
  .workbench-body {
    flex-direction: column;
    overflow: auto;
    gap: 12px;
  }

  .pool-shell {
    width: 100%;
  }

  .pool-shell--collapsed {
    width: 100%;
  }

  .pool-shell--collapsed .pool-collapse-handle {
    width: 100%;
    height: 34px;
    flex-direction: row;
    gap: 8px;
    border-radius: 8px;
    border: 1px solid var(--n-border-color);
  }

  :deep(.pool-sidebar.n-card) {
    flex: 1;
    width: auto;
    border-radius: var(--n-border-radius);
  }

  .pool-collapse-handle,
  .pool-collapse-handle--expand {
    width: 36px;
    border-left: 1px solid var(--n-border-color);
    border-radius: 0 8px 8px 0;
  }

  .pool-collapse-handle__text {
    writing-mode: horizontal-tb;
    letter-spacing: 0;
  }

  .pool-list {
    max-height: 200px;
  }
}
</style>
