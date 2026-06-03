<script setup lang="tsx">
import { computed, onActivated, onMounted, ref } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import { fetchDeletePreOutboundOrder, fetchGetPreOutboundList } from '@/service/api/oms/pre-outbound';
import OmsListPage from '../components/oms-list-page.vue';
import PreOutboundDetailModal from './modules/pre-outbound-detail-modal.vue';
import {
  MERGED_PRE_OUTBOUND_TAB,
  PENDING_PRE_OUTBOUND_STATUSES
} from './utils/outbound-readiness';

defineOptions({ name: 'OmsPreOutbound' });

const appStore = useAppStore();
const searchCollapsed = ref(false);

const STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING_INBOUND: { label: '待入库', type: 'warning' },
  DEVANNING: { label: '拆柜中', type: 'info' },
  READY_TO_CONVERT: { label: '可转出库', type: 'success' }
};

const DIRECTION_META: Record<string, string> = {
  DELIVERY: '派送',
  TRANSFER: '调拨'
};

const LOADING_TYPE_META: Record<string, string> = {
  PALLET: '卡板',
  FLOOR: '地板'
};

const TRANSPORT_TYPE_META: Record<string, string> = {
  FTL: 'FTL',
  LTL: 'LTL'
};

const searchParams = ref<Api.Oms.PreOutboundSearchParams>({ pageNum: 1, pageSize: 10 });
const activeTag = ref<string>('');

const modalVisible = ref(false);
const modalMode = ref<'detail' | 'convert'>('detail');
const currentRow = ref<Api.Oms.PreOutbound | null>(null);

const statusTabs = computed(() => [
  { label: '全部', value: '', count: data.value.length },
  {
    label: '待到库',
    value: MERGED_PRE_OUTBOUND_TAB,
    count: data.value.filter(item =>
      PENDING_PRE_OUTBOUND_STATUSES.includes(item.preOutboundStatus as (typeof PENDING_PRE_OUTBOUND_STATUSES)[number])
    ).length
  },
  {
    label: STATUS_META.READY_TO_CONVERT.label,
    value: 'READY_TO_CONVERT',
    count: data.value.filter(item => item.preOutboundStatus === 'READY_TO_CONVERT').length
  }
]);

function getCargoOrderSummary(row: Api.Oms.PreOutbound) {
  return row.cargoOrderNo || '--';
}

function getText(value: unknown) {
  if (value === null || value === undefined || value === '') return '--';
  return String(value);
}

function getOutboundPalletQty(row: Api.Oms.PreOutbound) {
  return row.actualPalletQty ?? row.declaredPalletQty ?? 0;
}

function getOutboundCbm(row: Api.Oms.PreOutbound) {
  return row.actualCbm ?? row.declaredCbm ?? 0;
}

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2);
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } = useNaivePaginatedTable<
  Api.Oms.PreOutboundList,
  Api.Oms.PreOutbound
>({
  api: () => fetchGetPreOutboundList(searchParams.value),
  columns: () => [
    { key: 'preOutboundNo', title: '预出单号', minWidth: 170, fixed: 'left' },
    { key: 'cargoOrderNo', title: '运单号汇总', minWidth: 240, ellipsis: { tooltip: true }, render: row => getCargoOrderSummary(row) },
    { key: 'appointmentNo', title: '预约号', minWidth: 130, render: row => getText(row.appointmentNo) },
    { key: 'appointmentTime', title: '预约日期', minWidth: 170, render: row => getText(row.appointmentTime) },
    { key: 'deliveryTruck', title: '派送卡车', minWidth: 130, render: row => getText(row.deliveryTruck) },
    {
      key: 'loadingType',
      title: '装车类型',
      width: 110,
      render: row => (row.loadingType ? LOADING_TYPE_META[row.loadingType] || row.loadingType : '--')
    },
    {
      key: 'transportType',
      title: '运输类型',
      width: 110,
      render: row => (row.transportType ? TRANSPORT_TYPE_META[row.transportType] || row.transportType : '--')
    },
    { key: 'deliveryTag', title: '派送标签', minWidth: 120, render: row => getText(row.deliveryTag) },
    {
      key: 'destination',
      title: '目的地',
      minWidth: 160,
      ellipsis: { tooltip: true },
      render: row => getText(row.destination || row.outboundWarehouseName)
    },
    { key: 'deliveryMethod', title: '派送方式', minWidth: 130, render: row => getText(row.deliveryMethod) },
    {
      key: 'preOutboundStatus',
      title: '状态',
      width: 120,
      render: row => {
        const meta = STATUS_META[row.preOutboundStatus] || { label: row.preOutboundStatus, type: 'default' };
        return (
          <NTag type={meta.type} size="small">
            {meta.label}
          </NTag>
        );
      }
    },
    { key: 'outboundDirection', title: '出库类型', width: 100, render: row => DIRECTION_META[row.outboundDirection] || row.outboundDirection },
    { key: 'outboundWarehouseName', title: '出库仓库', minWidth: 150, ellipsis: { tooltip: true } },
    { key: 'customerName', title: '客户', minWidth: 150, ellipsis: { tooltip: true } },
    { key: 'containerNo', title: '柜号', minWidth: 130 },
    { key: 'shipmentCodes', title: '货件编码', minWidth: 180, ellipsis: { tooltip: true } },
    { key: 'declaredCartonQty', title: '预报箱数', width: 100 },
    { key: 'actualCartonQty', title: '入库箱数', width: 100 },
    { key: 'outboundPalletQty', title: '出库卡板数', width: 120, render: row => getOutboundPalletQty(row) },
    { key: 'outboundCbm', title: '出库体积', width: 110, render: row => formatNumber(getOutboundCbm(row)) },
    { key: 'readyTime', title: '可转时间', width: 160, render: row => getText(row.readyTime) },
    { key: 'outboundOrderNo', title: '出库单号', minWidth: 170, render: row => getText(row.outboundOrderNo) },
    { key: 'followRecord', title: '跟进记录', minWidth: 180, ellipsis: { tooltip: true }, render: row => getText(row.followRecord) },
    { key: 'remark', title: '备注', minWidth: 160, ellipsis: { tooltip: true }, render: row => getText(row.remark) },
    { key: 'createBy', title: '创建人', width: 110, render: row => getText(row.createBy) },
    { key: 'createTime', title: '创建时间', width: 170, render: row => getText(row.createTime) },
    {
      key: 'operate',
      title: '操作',
      width: 110,
      fixed: 'right',
      render: row => (
        <NDropdown trigger="click" options={getOperateOptions(row)} onSelect={key => handleOperate(String(key), row)}>
          <NButton size="small">更多</NButton>
        </NDropdown>
      )
    }
  ],
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page;
    searchParams.value.pageSize = pageSize;
  }
});

function getOperateOptions(row: Api.Oms.PreOutbound) {
  return [
    { label: '详情', key: 'detail' },
    { label: '转出库单', key: 'convert', disabled: row.preOutboundStatus !== 'READY_TO_CONVERT' },
    { label: '删除', key: 'delete' }
  ];
}

function openModal(row: Api.Oms.PreOutbound, mode: 'detail' | 'convert') {
  currentRow.value = row;
  modalMode.value = mode;
  modalVisible.value = true;
}

function handleOperate(key: string, row: Api.Oms.PreOutbound) {
  if (key === 'detail') openModal(row, 'detail');
  if (key === 'convert') openModal(row, 'convert');
  if (key === 'delete') handleDelete(row);
}

async function handleDelete(row: Api.Oms.PreOutbound) {
  await fetchDeletePreOutboundOrder(row.id);
  window.$message?.success('已删除');
  await getData();
}

async function handleModalSaved() {
  const id = currentRow.value?.id;
  await getData();
  if (id != null) {
    const updated = data.value.find(item => item.id === id);
    if (updated) currentRow.value = updated;
  }
}

async function handleModalConverted() {
  await getData();
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage(1);
}

function handleReset() {
  activeTag.value = '';
  searchParams.value = { pageNum: 1, pageSize: searchParams.value.pageSize || 10 };
  getDataByPage(1);
}

function handleTagChange(value: string) {
  activeTag.value = value;
  if (value === MERGED_PRE_OUTBOUND_TAB) {
    searchParams.value.preOutboundStatus = PENDING_PRE_OUTBOUND_STATUSES.join(',');
  } else {
    searchParams.value.preOutboundStatus = value || null;
  }
  handleSearch();
}

onMounted(getData);
onActivated(getData);
</script>

<template>
  <OmsListPage content-title="预出单管理" filter-description="预出单按状态标签切换，可折叠常用筛选">
    <template #filter-actions>
      <NButton quaternary @click="searchCollapsed = !searchCollapsed">
        {{ searchCollapsed ? '展开筛选' : '收起筛选' }}
      </NButton>
      <NButton type="primary" @click="handleSearch">查询</NButton>
      <NButton @click="handleReset">重置</NButton>
    </template>

    <template #filters>
      <div v-show="!searchCollapsed" class="mt-14px">
        <NForm inline label-placement="left" :show-feedback="false">
          <NFormItem label="关键词">
            <NInput v-model:value="searchParams.keyword" placeholder="预出单/运单/柜号/货件" clearable class="w-240px" />
          </NFormItem>
          <NFormItem label="状态">
            <NSelect
              v-model:value="searchParams.preOutboundStatus"
              :to="POPUP_TO_BODY"
              clearable
              :options="Object.entries(STATUS_META).map(([value, meta]) => ({ label: meta.label, value }))"
              class="w-160px"
            />
          </NFormItem>
          <NFormItem label="方向">
            <NSelect
              v-model:value="searchParams.outboundDirection"
              :to="POPUP_TO_BODY"
              clearable
              :options="[
                { label: '派送', value: 'DELIVERY' },
                { label: '调拨', value: 'TRANSFER' }
              ]"
              class="w-150px"
            />
          </NFormItem>
          <NFormItem label="客户">
            <NInput v-model:value="searchParams.customerName" placeholder="客户名称" clearable class="w-180px" />
          </NFormItem>
        </NForm>
      </div>
    </template>

    <template #header-extra>
      <TableHeaderOperation
        v-model:columns="columnChecks"
        :loading="loading"
        :show-add="false"
        :show-delete="false"
        :show-export="false"
        @refresh="getData"
      />
    </template>

    <template #tabs>
      <div class="mb-12px flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
        <div
          v-for="tab in statusTabs"
          :key="tab.value"
          class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
          :class="activeTag === tab.value ? 'bg-primary text-white shadow-sm' : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'"
          @click="handleTagChange(tab.value)"
        >
          <span>{{ tab.label }}</span>
          <span
            class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold leading-14px"
            :class="
              activeTag === tab.value
                ? 'bg-white/25 text-white'
                : tab.count > 0
                  ? 'bg-#ef4444 text-white'
                  : 'bg-#d0d3d9 text-#909399'
            "
          >
            {{ tab.count }}
          </span>
        </div>
      </div>
    </template>

    <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
      <DataTable
        remote
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        class="h-full min-h-280px sm:min-h-0"
      />
    </div>

    <PreOutboundDetailModal
      v-model:visible="modalVisible"
      :row="currentRow"
      :mode="modalMode"
      @saved="handleModalSaved"
      @converted="handleModalConverted"
    />
  </OmsListPage>
</template>
