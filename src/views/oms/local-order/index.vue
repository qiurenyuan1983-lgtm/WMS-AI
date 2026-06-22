<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import { NButton, NCard, NCollapse, NCollapseItem, NDataTable, NInput, NPagination, NTag } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetOrderWorkbenchList } from '@/service/api/oms/order-workbench';
import { useWorkbenchBatchTrip } from '../_shared/composables/use-workbench-batch-trip';
import BatchGenerateTripModal from '../_shared/modules/batch-generate-trip-modal.vue';
import { STATUS_META } from '../order-workbench/constants';

defineOptions({ name: 'OmsLocalOrder' });

const { routerPushByKey } = useRouterPush();
const keyword = ref('');
const searchParams = ref<Api.Oms.OrderWorkbenchSearchParams>({ pageNum: 1, pageSize: 10, pool: 'LOCAL' });

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
} = useWorkbenchBatchTrip('LOCAL', () => reloadTable?.());

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () =>
    fetchGetOrderWorkbenchList({
      ...searchParams.value,
      orderNo: keyword.value || undefined
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
      width: 130,
      fixed: 'left',
      render: row => (
        <NButton text type="primary" onClick={() => openDetail(row.id)}>
          {row.orderNo}
        </NButton>
      )
    },
    { key: 'customerName', title: '客户', width: 140, ellipsis: { tooltip: true } },
    { key: 'destination', title: '收货地址', minWidth: 180, ellipsis: { tooltip: true } },
    { key: 'palletQty', title: '板数', width: 64, align: 'center' },
    { key: 'appointmentTime', title: '预约时间', width: 150, render: row => row.appointmentTime ?? '—' },
    { key: 'generatedTripNo', title: '车次号', width: 130, render: row => row.generatedTripNo || '—' },
    {
      key: 'customerConfirmed',
      title: '客户确认',
      width: 88,
      render: row => (
        <NTag size="small" type={row.customerConfirmed ? 'success' : 'warning'}>
          {row.customerConfirmed ? '已确认' : '待确认'}
        </NTag>
      )
    },
    {
      key: 'status',
      title: '状态',
      width: 110,
      render: row => {
        const meta = STATUS_META[row.status];
        return <NTag size="small" type={meta?.type ?? 'default'}>{meta?.label ?? row.status}</NTag>;
      }
    },
    { key: 'createTime', title: '创建时间', width: 150 }
  ]
});

reloadTable = getData;

function openDetail(id: CommonType.IdType) {
  routerPushByKey('oms_local-order-detail' as any, { query: { id: String(id) } });
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

watch(data, rows => syncSelectionFromPage(rows ?? []));

onMounted(getData);
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="mb-8px">
        <span class="text-16px font-semibold">本地/商业地址订单</span>
        <span class="text-13px text-gray-500 ml-8px">客户邮件确认 · 预车次生成 · 出库执行</span>
      </div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex gap-8px">
            <NInput v-model:value="keyword" placeholder="订单号" class="w-200px" clearable @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
            <NButton type="success" :disabled="selectedCount < 2" @click="openBatchModal">
              生成车次{{ selectedCount ? ` (${selectedCount})` : '' }}
            </NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="(r: Api.Oms.OrderWorkbenchRow) => r.id"
        :scroll-x="1140"
        size="small"
        remote
        @update:checked-row-keys="keys => handleCheckedRowKeysChange(keys, data)"
      />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>

    <BatchGenerateTripModal
      v-model:visible="modalVisible"
      :loading="submitting"
      :preview="preview"
      @confirm="confirmBatchGenerate"
    />
  </div>
</template>
