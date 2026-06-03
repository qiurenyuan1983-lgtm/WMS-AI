<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect
} from 'naive-ui';
import { fetchGetWmsPalletList } from '@/service/api/wms';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import { useWmsPalletOperate } from './composables/use-wms-pallet-operate.tsx';

defineOptions({ name: 'WmsPalletList' });

const appStore = useAppStore();
const { record: statusRecord } = useDict('wms_pallet_status');

const searchParams = ref<Api.Wms.PalletSearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: null,
  warehouseId: null,
  customerId: null,
  keyword: null,
  palletNo: null,
  cargoOrderNo: null,
  shipmentCode: null,
  locationCode: null,
  palletStatus: null,
  scope: 'ACTIVE',
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const activeStatusOptions = computed(() =>
  Object.entries(statusRecord.value)
    .filter(([, item]) => item.dictValue !== 'OUTBOUND')
    .map(([, item]) => ({ label: item.dictLabel, value: item.dictValue }))
);

let refreshList: () => void = () => {};
const {
  orderDrawerVisible,
  moveModalVisible,
  expandedOrderKeys,
  currentPallet,
  orderRows,
  orderColumns,
  orderRowKey,
  locationOptions,
  moveForm,
  buildPalletTableColumns,
  submitMove
} = useWmsPalletOperate({ onRefresh: () => refreshList() });

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.PalletList, Api.Wms.Pallet>({
    api: () => fetchGetWmsPalletList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => buildPalletTableColumns()
  });
refreshList = getData;

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value.keyword = null;
  searchParams.value.palletStatus = null;
  searchParams.value.scope = 'ACTIVE';
  searchParams.value.pageNum = 1;
  getDataByPage();
}

watch(
  () => searchParams.value.palletStatus,
  status => {
    if (status === 'OUTBOUND') {
      searchParams.value.palletStatus = null;
    }
  }
);
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="卡板/订单/货件/库位" class="w-240px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.palletStatus"
            :options="activeStatusOptions"
            clearable
            placeholder="在库/已出单/HOLD"
            class="w-140px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <span>卡板库存</span>
        <span class="ml-8px text-12px font-normal text-gray-500">默认仅显示在库、已出单、HOLD；已出库请至「出库历史」</span>
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

    <NDrawer v-model:show="orderDrawerVisible" width="1000">
      <NDrawerContent :title="`卡板订单明细 - ${currentPallet?.palletNo || ''}`" closable>
        <p class="mb-12px text-13px text-gray-500">点击订单行「明细」展开该订单下的货件（PO号、唛头等）。</p>
        <NDataTable
          v-model:expanded-row-keys="expandedOrderKeys"
          :columns="orderColumns"
          :data="orderRows"
          :row-key="(row: Api.Wms.PalletOrderSummary) => orderRowKey(row)"
          :pagination="false"
          :scroll-x="1150"
          size="small"
        />
      </NDrawerContent>
    </NDrawer>

    <NModal v-model:show="moveModalVisible" preset="card" title="移动库位" class="w-480px">
      <NForm label-placement="left" label-width="90">
        <NFormItem label="卡板号">
          <NInput :value="currentPallet?.palletNo" disabled />
        </NFormItem>
        <NFormItem label="目标库位" required>
          <NSelect v-model:value="moveForm.locationId" :options="locationOptions" filterable placeholder="请选择库位" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="moveForm.remark" type="textarea" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="moveModalVisible = false">取消</NButton>
          <NButton type="primary" @click="submitMove">确定</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
