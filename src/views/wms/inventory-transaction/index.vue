<script setup lang="tsx">
import { ref } from 'vue';
import { NCard, NDataTable, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import { fetchGetWmsInventoryTransactionList } from '@/service/api/wms';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';

defineOptions({ name: 'WmsInventoryTransactionList' });

const appStore = useAppStore();
const { record: typeRecord } = useDict('wms_inventory_transaction_type');

const searchParams = ref<Api.Wms.InventoryTransactionSearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: null,
  warehouseId: null,
  keyword: null,
  transactionNo: null,
  transactionType: null,
  cargoOrderNo: null,
  shipmentCode: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.InventoryTransactionList, Api.Wms.InventoryTransaction>({
    api: () => fetchGetWmsInventoryTransactionList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { key: 'transactionNo', title: '流水号', width: 160, fixed: 'left' },
      {
        key: 'transactionType',
        title: '变动类型',
        width: 120,
        render: row => <NTag size="small">{typeRecord.value[row.transactionType]?.dictLabel || row.transactionType}</NTag>
      },
      { key: 'customerName', title: '客户', width: 180, ellipsis: { tooltip: true } },
      { key: 'cargoOrderNo', title: '订单号', width: 150 },
      { key: 'shipmentCode', title: '货件编码', width: 140 },
      { key: 'palletNo', title: '卡板号', width: 140 },
      { key: 'fromLocationCode', title: '原库位', width: 110 },
      { key: 'toLocationCode', title: '目标库位', width: 110 },
      { key: 'changeTotal', title: '总数变动', width: 100, align: 'right' },
      { key: 'changeAvailable', title: '可用变动', width: 100, align: 'right' },
      { key: 'changeLocked', title: '锁定变动', width: 100, align: 'right' },
      { key: 'operateTime', title: '变动时间', width: 170 },
      { key: 'remark', title: '备注', minWidth: 180, ellipsis: { tooltip: true } }
    ]
  });

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value.keyword = null;
  searchParams.value.transactionType = null;
  searchParams.value.pageNum = 1;
  getDataByPage();
}
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="流水/订单/货件/卡板/库位" class="w-260px" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect
            v-model:value="searchParams.transactionType"
            clearable
            placeholder="请选择类型"
            class="w-160px"
            :options="[
              { label: '收货入账', value: 'RECEIVE' },
              { label: '库存锁定', value: 'LOCK' },
              { label: '锁定释放', value: 'RELEASE_LOCK' },
              { label: '出库扣减', value: 'OUTBOUND' },
              { label: '库存调整', value: 'ADJUST' }
            ]"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard title="库存流水" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
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
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :scroll-x="scrollX"
        :flex-height="!appStore.isMobile"
        remote
        size="small"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>
