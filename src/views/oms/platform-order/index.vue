<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NCollapse, NCollapseItem, NDataTable, NInput, NPagination, NSelect, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetOrderWorkbenchList } from '@/service/api/oms/order-workbench';
import { useWorkbenchBatchTrip } from '../_shared/composables/use-workbench-batch-trip';
import BatchGenerateTripModal from '../_shared/modules/batch-generate-trip-modal.vue';
import { PLATFORM_STATUS_TABS, STATUS_META } from './constants';
import PlatformOrderDetailDrawer from './modules/platform-order-detail-drawer.vue';
import { CARGO_OPERATION_STATUS_META, type CargoOperationStatus } from '@/utils/oms/operation-status';

defineOptions({ name: 'OmsPlatformOrder' });

const route = useRoute();
const router = useRouter();

const keyword = ref('');
const activeTab = ref('ALL');
const searchParams = ref<Api.Oms.OrderWorkbenchSearchParams>({
  pageNum: 1,
  pageSize: 10,
  pool: 'PLATFORM',
  tab: null,
  platform: null,
  destination: null,
  isaNo: null
});

const detailVisible = ref(false);
const detailOrderId = ref<CommonType.IdType | null>(null);

const platformOptions = [
  { label: '全部', value: '' },
  { label: 'Amazon', value: 'Amazon' },
  { label: 'Walmart', value: 'Walmart' }
];

let reloadTable: (() => void) | undefined;

const {
  checkedRowKeys,
  selectionColumn,
  syncSelectionFromPage,
  handleCheckedRowKeysChange,
  modalVisible,
  submitting,
  preview,
  openBatchModal,
  confirmBatchGenerate,
  selectedCount
} = useWorkbenchBatchTrip('PLATFORM', () => reloadTable?.());

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () =>
    fetchGetOrderWorkbenchList({
      ...searchParams.value,
      orderNo: keyword.value || undefined,
      tab: activeTab.value === 'ALL' ? null : activeTab.value
    }),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page ?? 1;
    searchParams.value.pageSize = pageSize ?? 10;
  },
  columns: () => [
    selectionColumn,
    {
      key: 'orderNo',
      title: '订单号',
      width: 140,
      fixed: 'left',
      render: row => (
        <span
          class="text-primary cursor-pointer hover:underline"
          title="双击查看详情"
          onDblclick={() => openDetail(row.id)}
        >
          {row.orderNo}
        </span>
      )
    },
    {
      key: 'orderTypeLabel',
      title: '订单类型',
      width: 130,
      render: row => (
        <NTag size="small" type="info">
          {row.orderTypeLabel}
        </NTag>
      )
    },
    { key: 'customerName', title: '客户', minWidth: 120, ellipsis: { tooltip: true } },
    { key: 'platform', title: '平台', width: 90, render: row => row.platform || '—' },
    { key: 'destination', title: '目的地', width: 100, ellipsis: { tooltip: true } },
    { key: 'isaNo', title: 'ISA号', width: 140, ellipsis: { tooltip: true }, render: row => row.isaNo || '—' },
    { key: 'appointmentTime', title: '预约时间', width: 150, render: row => row.appointmentTime || '—' },
    { key: 'palletQty', title: '板数', width: 64, align: 'center' },
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
      key: 'palletSize',
      title: '卡板尺寸',
      width: 130,
      ellipsis: { tooltip: true },
      render: row => row.palletSize || '—'
    },
    { key: 'preTripNo', title: '预车次号', width: 130, render: row => row.preTripNo || '—' },
    { key: 'generatedTripNo', title: '车次号', width: 130, render: row => row.generatedTripNo || '—' },
    {
      key: 'operationStatus',
      title: '操作状态',
      width: 140,
      render: row => {
        const code = row.operationStatus as CargoOperationStatus | undefined;
        const meta = code ? CARGO_OPERATION_STATUS_META[code] : null;
        return <NTag size="small" type={meta?.type ?? 'default'}>{meta?.label ?? code ?? '—'}</NTag>;
      }
    },
    {
      key: 'status',
      title: '流程状态',
      width: 110,
      render: row => {
        const meta = STATUS_META[row.status];
        return <NTag size="small" type={meta?.type ?? 'default'}>{meta?.label ?? row.status}</NTag>;
      }
    },
    { key: 'createTime', title: '创建时间', width: 150 },
    {
      key: 'action',
      title: '操作',
      width: 80,
      fixed: 'right',
      render: row => (
        <NButton size="tiny" type="primary" onClick={() => openDetail(row.id)}>
          详情
        </NButton>
      )
    }
  ]
});

reloadTable = getData;

function openDetail(id: CommonType.IdType) {
  detailOrderId.value = id;
  detailVisible.value = true;
  syncOpenIdQuery(id);
}

function syncOpenIdQuery(id: CommonType.IdType | null) {
  const query = { ...route.query };
  if (id) query.openId = String(id);
  else delete query.openId;
  router.replace({ query });
}

watch(detailVisible, show => {
  if (!show) {
    detailOrderId.value = null;
    syncOpenIdQuery(null);
  }
});

watch(activeTab, () => {
  searchParams.value.pageNum = 1;
  getData();
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function tryOpenFromQuery() {
  const openId = route.query.openId;
  if (openId) openDetail(openId as string);
}

watch(data, rows => syncSelectionFromPage(rows ?? []));

onMounted(() => {
  getData();
  tryOpenFromQuery();
});
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="mb-8px">
        <span class="text-16px font-semibold">平台预约订单</span>
        <span class="text-13px text-gray-500 ml-8px">Amazon/平台 ISA 匹配 · 预车次生成 · 双击订单号查看详情</span>
      </div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex flex-wrap gap-8px items-center">
            <NInput v-model:value="keyword" placeholder="订单号" class="w-160px" clearable @keyup.enter="handleSearch" />
            <NSelect
              v-model:value="searchParams.platform"
              :to="POPUP_TO_BODY"
              clearable
              :options="platformOptions"
              placeholder="平台"
              class="w-120px"
            />
            <NInput v-model:value="searchParams.destination" clearable placeholder="目的地" class="w-120px" />
            <NInput v-model:value="searchParams.isaNo" clearable placeholder="ISA号" class="w-140px" />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
            <NButton type="success" :disabled="selectedCount < 2" @click="openBatchModal">
              生成车次{{ selectedCount ? ` (${selectedCount})` : '' }}
            </NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
      <div class="mt-10px flex flex-wrap gap-6px">
        <NTag
          v-for="tab in PLATFORM_STATUS_TABS"
          :key="tab.key"
          size="small"
          class="cursor-pointer"
          :type="activeTab === tab.key ? 'primary' : 'default'"
          :bordered="activeTab !== tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </NTag>
      </div>
    </NCard>

    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="(r: Api.Oms.OrderWorkbenchRow) => r.id"
        :scroll-x="1780"
        size="small"
        remote
        @update:checked-row-keys="keys => handleCheckedRowKeysChange(keys, data)"
      />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>

    <PlatformOrderDetailDrawer v-model:visible="detailVisible" :order-id="detailOrderId" @refresh="getData" />
    <BatchGenerateTripModal
      v-model:visible="modalVisible"
      :loading="submitting"
      :preview="preview"
      @confirm="confirmBatchGenerate"
    />
  </div>
</template>
