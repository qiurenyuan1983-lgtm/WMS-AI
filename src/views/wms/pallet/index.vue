<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDropdown,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import type { DataTableColumns, DataTableRowKey } from 'naive-ui';
import TableColumnSetting from '@/components/advanced/table-column-setting.vue';
import {
  fetchGetPalletInventoryList,
  fetchGetPalletInventoryStats,
  fetchPalletInventoryAction
} from '@/service/api/wms/inventory';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import {
  AGE_WARNING_DAYS,
  PALLET_INVENTORY_STATUS_META,
  PALLET_INVENTORY_TABS,
  type PalletInventoryTab
} from './constants';
import PalletStatsCards from './modules/pallet-stats-cards.vue';
import PalletInventoryDetailDrawer from './modules/pallet-inventory-detail-drawer.vue';

defineOptions({ name: 'WmsPalletInventory' });

const appStore = useAppStore();
const activeTab = ref<PalletInventoryTab>('all');
const scanCode = ref('');
const stats = ref<Api.Wms.PalletInventoryStats>({
  totalCount: 0,
  availableCount: 0,
  holdCount: 0,
  exceptionCount: 0,
  pendingOutboundCount: 0,
  lockedCount: 0,
  todayInbound: 0,
  todayOutbound: 0
});
const statsLoading = ref(false);
const selectedRowKey = ref<DataTableRowKey | null>(null);
const detailVisible = ref(false);
const detailPalletId = ref<CommonType.IdType | null>(null);

const searchParams = ref<Api.Wms.PalletInventorySearchParams>({
  pageNum: 1,
  pageSize: 10,
  tab: 'all',
  palletNo: null,
  cargoOrderNo: null,
  containerNo: null,
  customerName: null,
  platformName: null,
  destination: null,
  warehouseName: null,
  zoneName: null,
  locationCode: null,
  inventoryStatus: null,
  exceptionFlag: null,
  ageDaysMin: null
});

const statusOptions = Object.entries(PALLET_INVENTORY_STATUS_META).map(([value, meta]) => ({
  label: meta.label,
  value
}));

const boolOptions = [
  { label: '是', value: true },
  { label: '否', value: false }
];

async function loadStats() {
  statsLoading.value = true;
  const { data } = await fetchGetPalletInventoryStats({ ...searchParams.value, tab: undefined });
  statsLoading.value = false;
  if (data) stats.value = data;
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.PalletInventoryList, Api.Wms.PalletInventoryRecord>({
    api: () => fetchGetPalletInventoryList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 10;
    },
    columns: () => buildColumns()
  });

function buildColumns(): DataTableColumns<Api.Wms.PalletInventoryRecord> {
  return [
    { key: 'palletNo', title: '卡板号', width: 130, fixed: 'left' },
    { key: 'cargoOrderNo', title: '订单号', width: 130, ellipsis: { tooltip: true } },
    { key: 'containerNo', title: '柜号', width: 120, ellipsis: { tooltip: true } },
    { key: 'customerName', title: '客户', width: 130, ellipsis: { tooltip: true } },
    { key: 'platformName', title: '平台', width: 90 },
    { key: 'destination', title: '目的地', width: 90 },
    { key: 'warehouseName', title: '仓库', width: 120, ellipsis: { tooltip: true } },
    { key: 'locationCode', title: '当前库位', width: 100 },
    { key: 'palletQty', title: '板数', width: 60, align: 'center' },
    { key: 'boxQty', title: '箱数', width: 60, align: 'center' },
    { key: 'skuQty', title: 'SKU数量', width: 80, align: 'center' },
    {
      key: 'size',
      title: '卡板尺寸',
      width: 110,
      render: row =>
        row.lengthCm && row.widthCm && row.heightCm ? `${row.lengthCm}×${row.widthCm}×${row.heightCm}` : '—'
    },
    { key: 'weight', title: '重量(kg)', width: 90, align: 'right' },
    {
      key: 'inventoryStatus',
      title: '库存状态',
      width: 100,
      render: row => {
        const meta = PALLET_INVENTORY_STATUS_META[row.inventoryStatus];
        return <NTag size="small" type={meta.type}>{meta.label}</NTag>;
      }
    },
    { key: 'inboundTime', title: '入库时间', width: 150 },
    {
      key: 'ageDays',
      title: '库龄',
      width: 70,
      render: row => (
        <span class={row.ageDays >= AGE_WARNING_DAYS ? 'text-warning' : ''}>{row.ageDays}天</span>
      )
    },
    {
      key: 'exceptionFlag',
      title: '异常',
      width: 60,
      render: row => (row.exceptionFlag ? <NTag size="small" type="error">是</NTag> : '否')
    },
    {
      key: 'actions',
      title: '操作',
      width: 90,
      fixed: 'right',
      render: row => (
        <NButton text type="primary" size="small" onClick={() => openDetail(row.id)}>
          详情
        </NButton>
      )
    }
  ];
}

function openDetail(id: CommonType.IdType) {
  detailPalletId.value = id;
  detailVisible.value = true;
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage(1);
  loadStats();
}

function handleReset() {
  activeTab.value = 'all';
  scanCode.value = '';
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize ?? 10,
    tab: 'all',
    palletNo: null,
    cargoOrderNo: null,
    containerNo: null,
    customerName: null,
    platformName: null,
    destination: null,
    warehouseName: null,
    zoneName: null,
    locationCode: null,
    inventoryStatus: null,
    exceptionFlag: null,
    ageDaysMin: null
  };
  getDataByPage(1);
  loadStats();
}

function onTabChange(tab: string | number) {
  const key = String(tab) as PalletInventoryTab;
  activeTab.value = key;
  searchParams.value.tab = key === 'all' ? undefined : key;
  if (key === 'AGE_WARNING') {
    searchParams.value.ageDaysMin = AGE_WARNING_DAYS;
  } else if (searchParams.value.ageDaysMin === AGE_WARNING_DAYS) {
    searchParams.value.ageDaysMin = null;
  }
  searchParams.value.pageNum = 1;
  getDataByPage(1);
}

function handleScanSearch() {
  searchParams.value.palletNo = scanCode.value.trim() || null;
  searchParams.value.scanCode = scanCode.value.trim() || undefined;
  handleSearch();
}

function handleRowClick(row: Api.Wms.PalletInventoryRecord) {
  selectedRowKey.value = row.id;
}

function handleRowDblclick(row: Api.Wms.PalletInventoryRecord) {
  openDetail(row.id);
}

function handleExport() {
  const header = [
    '卡板号',
    '订单号',
    '柜号',
    '客户',
    '平台',
    '目的地',
    '库位',
    '箱数',
    '状态',
    '入库时间',
    '库龄'
  ];
  const lines = (data.value || []).map(row =>
    [
      row.palletNo,
      row.cargoOrderNo,
      row.containerNo,
      row.customerName,
      row.platformName,
      row.destination,
      row.locationCode,
      row.boxQty,
      PALLET_INVENTORY_STATUS_META[row.inventoryStatus].label,
      row.inboundTime,
      row.ageDays
    ].join(',')
  );
  const blob = new Blob([`\uFEFF${header.join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pallet-inventory-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const batchActionOptions = [
  { label: '批量暂扣', key: 'hold' },
  { label: '批量锁定', key: 'lock' },
  { label: '打印卡板标签', key: 'print_label' }
];

async function handleBatchAction(key: string) {
  if (!selectedRowKey.value) {
    window.$message?.warning('请先单击选中卡板');
    return;
  }
  const { data, error } = await fetchPalletInventoryAction({
    palletId: selectedRowKey.value as CommonType.IdType,
    action: key as Api.Wms.PalletInventoryActionPayload['action']
  });
  if (error) return;
  const result = data as { success: boolean; message: string };
  window.$message?.success(result?.message || '操作完成');
  getData();
  loadStats();
}

function onDetailUpdated() {
  getData();
  loadStats();
}

onMounted(() => {
  loadStats();
  getData();
});
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <PalletStatsCards :stats="stats" :loading="statsLoading" />
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="筛选查询" name="search">
          <NForm inline label-placement="left" :show-feedback="false" class="flex-wrap">
            <NFormItem label="扫码">
              <NInput
                v-model:value="scanCode"
                clearable
                placeholder="扫描/输入卡板号"
                class="w-200px"
                @keyup.enter="handleScanSearch"
              />
            </NFormItem>
            <NFormItem label="卡板号">
              <NInput v-model:value="searchParams.palletNo" clearable placeholder="卡板号" class="w-140px" />
            </NFormItem>
            <NFormItem label="订单号">
              <NInput v-model:value="searchParams.cargoOrderNo" clearable placeholder="订单号" class="w-140px" />
            </NFormItem>
            <NFormItem label="柜号">
              <NInput v-model:value="searchParams.containerNo" clearable placeholder="柜号" class="w-130px" />
            </NFormItem>
            <NFormItem label="客户">
              <NInput v-model:value="searchParams.customerName" clearable placeholder="客户" class="w-130px" />
            </NFormItem>
            <NFormItem label="平台">
              <NInput v-model:value="searchParams.platformName" clearable placeholder="平台" class="w-110px" />
            </NFormItem>
            <NFormItem label="目的地">
              <NInput v-model:value="searchParams.destination" clearable placeholder="目的地" class="w-100px" />
            </NFormItem>
            <NFormItem label="库区">
              <NInput v-model:value="searchParams.zoneName" clearable placeholder="库区" class="w-100px" />
            </NFormItem>
            <NFormItem label="库位">
              <NInput v-model:value="searchParams.locationCode" clearable placeholder="库位" class="w-100px" />
            </NFormItem>
            <NFormItem label="状态">
              <NSelect
                v-model:value="searchParams.inventoryStatus"
                :options="statusOptions"
                clearable
                placeholder="库存状态"
                class="w-120px"
              />
            </NFormItem>
            <NFormItem label="异常">
              <NSelect v-model:value="searchParams.exceptionFlag" :options="boolOptions" clearable class="w-90px" />
            </NFormItem>
            <NFormItem>
              <NButton type="primary" @click="handleSearch">查询</NButton>
              <NButton class="ml-8px" @click="handleReset">重置</NButton>
            </NFormItem>
          </NForm>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper flex-1-hidden">
      <NTabs v-model:value="activeTab" type="line" size="small" class="mb-8px" @update:value="onTabChange">
        <NTabPane v-for="t in PALLET_INVENTORY_TABS" :key="t.key" :name="t.key" :tab="t.label" />
      </NTabs>

      <div class="mb-8px flex items-center justify-between gap-8px">
        <NSpace>
          <NDropdown :options="batchActionOptions" @select="handleBatchAction">
            <NButton size="small">批量操作</NButton>
          </NDropdown>
        </NSpace>
        <NSpace>
          <NButton size="small" @click="handleExport">导出</NButton>
          <NButton size="small" @click="getData(); loadStats()">刷新</NButton>
          <TableColumnSetting v-model:columns="columnChecks" />
        </NSpace>
      </div>

      <NDataTable
        :row-key="(row: Api.Wms.PalletInventoryRecord) => row.id"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :scroll-x="scrollX"
        :flex-height="!appStore.isMobile"
        size="small"
        striped
        :row-props="row => ({
          style: selectedRowKey === row.id ? 'background: rgba(32,128,240,0.08)' : undefined,
          onClick: () => handleRowClick(row),
          onDblclick: () => handleRowDblclick(row)
        })"
        class="h-full"
      />
    </NCard>

    <PalletInventoryDetailDrawer
      v-model:show="detailVisible"
      :pallet-id="detailPalletId"
      @updated="onDetailUpdated"
    />
  </div>
</template>

<style scoped>
.text-warning {
  color: #f0a020;
  font-weight: 600;
}
</style>
