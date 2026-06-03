<script setup lang="tsx">
import { ref } from 'vue';
import { NCard, NDataTable, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import { fetchGetWmsInventoryLockList } from '@/service/api/wms';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';

defineOptions({ name: 'WmsInventoryLockList' });

const appStore = useAppStore();
const { record: statusRecord } = useDict('wms_inventory_lock_status');

const searchParams = ref<Api.Wms.InventoryLockSearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: null,
  warehouseId: null,
  keyword: null,
  shipmentCode: null,
  lockStatus: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.InventoryLockList, Api.Wms.InventoryLock>({
    api: () => fetchGetWmsInventoryLockList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { key: 'bizDocType', title: '业务单据类型', width: 130, fixed: 'left' },
      { key: 'bizDocId', title: '业务单据ID', width: 140 },
      { key: 'bizDocLineId', title: '业务行ID', width: 140 },
      { key: 'shipmentCode', title: '货件编码', width: 140 },
      { key: 'palletNo', title: '卡板号', width: 140 },
      { key: 'lockedBoxQty', title: '锁定箱数', width: 100, align: 'right' },
      {
        key: 'lockStatus',
        title: '状态',
        width: 100,
        render: row => (
          <NTag size="small" type={row.lockStatus === 'LOCKED' ? 'warning' : 'default'}>
            {statusRecord.value[row.lockStatus]?.dictLabel || row.lockStatus}
          </NTag>
        )
      },
      { key: 'lockTime', title: '锁定时间', width: 170 },
      { key: 'releaseTime', title: '释放时间', width: 170 },
      { key: 'remark', title: '备注', minWidth: 160, ellipsis: { tooltip: true } }
    ]
  });

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value.keyword = null;
  searchParams.value.lockStatus = null;
  searchParams.value.pageNum = 1;
  getDataByPage();
}
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="卡板/货件" class="w-260px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.lockStatus"
            clearable
            placeholder="请选择状态"
            class="w-150px"
            :options="[
              { label: '锁定中', value: 'LOCKED' },
              { label: '部分释放', value: 'PART_RELEASED' },
              { label: '已释放', value: 'RELEASED' }
            ]"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard title="锁定记录" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
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
