<script setup lang="tsx">
import { computed, ref } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NTag
} from 'naive-ui';
import { fetchGetWmsPalletItems, fetchGetWmsPalletList } from '@/service/api/wms';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';

defineOptions({ name: 'WmsPalletOutboundHistory' });

const appStore = useAppStore();
const { record: statusRecord } = useDict('wms_pallet_status');
const { record: typeRecord } = useDict('wms_pallet_type');
const { record: addressTypeRecord } = useDict('oms_address_type');

const orderDrawerVisible = ref(false);
const expandedOrderKeys = ref<string[]>([]);
const currentPallet = ref<Api.Wms.Pallet | null>(null);
const allPalletItems = ref<Api.Wms.PalletItem[]>([]);

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
  scope: 'OUTBOUND',
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const orderRows = computed(() => buildOrderRows(allPalletItems.value));

function formatDateTime(value?: string | null) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 19);
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.PalletList, Api.Wms.Pallet>({
    api: () => fetchGetWmsPalletList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { key: 'palletNo', title: '卡板号', width: 150, fixed: 'left' },
      {
        key: 'palletStatus',
        title: '状态',
        width: 100,
        render: () => (
          <NTag size="small" type="default">
            {statusRecord.value['OUTBOUND']?.dictLabel || '出库'}
          </NTag>
        )
      },
      {
        key: 'palletType',
        title: '卡板类型',
        width: 90,
        render: row => typeRecord.value[row.palletType || 'NORMAL']?.dictLabel || row.palletType || '常规'
      },
      { key: 'businessTypeName', title: '业务类型', width: 120, ellipsis: { tooltip: true } },
      { key: 'containerNo', title: '柜号', width: 130, ellipsis: { tooltip: true } },
      { key: 'groupDestination', title: '分组/目的地', width: 140, ellipsis: { tooltip: true } },
      { key: 'locationCode', title: '原库位', width: 110 },
      { key: 'totalBoxQty', title: '出库箱数', width: 100, align: 'right' },
      { key: 'updateTime', title: '出库时间', width: 170, render: row => formatDateTime(row.updateTime as string) },
      {
        key: 'operate',
        title: '操作',
        width: 90,
        fixed: 'right',
        render: row => (
          <NButton size="small" onClick={() => openOrderDetail(row)}>
            明细
          </NButton>
        )
      }
    ]
  });

const tableScrollX = computed(() => Math.max(scrollX.value, 1200));

const shipmentColumns: NaiveUI.TableColumn<Api.Wms.PalletItem>[] = [
  { key: 'shipmentCode', title: '货件编码', minWidth: 150, ellipsis: { tooltip: true } },
  { key: 'poNo', title: 'PO号', width: 120, ellipsis: { tooltip: true } },
  { key: 'shippingMark', title: '唛头', width: 120, ellipsis: { tooltip: true } },
  { key: 'boxQty', title: '总箱数', width: 90, align: 'right' }
];

function orderRowKey(order: Api.Wms.PalletOrderSummary) {
  return String(order.cargoOrderId ?? order.cargoOrderNo);
}

function renderOrderExpand(row: Api.Wms.PalletOrderSummary) {
  const items = allPalletItems.value.filter(item => isSameOrder(item, row));
  return (
    <div class="px-12px py-8px">
      <NDataTable columns={shipmentColumns} data={items} pagination={false} scroll-x={700} size="small" bordered />
    </div>
  );
}

const orderColumns: NaiveUI.TableColumn<Api.Wms.PalletOrderSummary>[] = [
  { type: 'expand', renderExpand: renderOrderExpand },
  { key: 'cargoOrderNo', title: '订单号', minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'businessTypeName', title: '业务类型', width: 110, ellipsis: { tooltip: true } },
  { key: 'containerNo', title: '柜号', width: 120, ellipsis: { tooltip: true } },
  { key: 'groupDestination', title: '分组/目的地', width: 120, ellipsis: { tooltip: true } },
  { key: 'platformName', title: '平台', width: 100, ellipsis: { tooltip: true } },
  {
    key: 'addressType',
    title: '地址类型',
    width: 100,
    render: row => addressTypeRecord.value[row.addressType || '']?.dictLabel || row.addressType || '—'
  },
  { key: 'shipmentCount', title: '货件数', width: 80, align: 'center' },
  { key: 'boxQty', title: '总箱数', width: 80, align: 'right' }
];

function isSameOrder(item: Api.Wms.PalletItem, order: Api.Wms.PalletOrderSummary) {
  if (order.cargoOrderId != null && item.cargoOrderId != null) {
    return String(item.cargoOrderId) === String(order.cargoOrderId);
  }
  return (item.cargoOrderNo || '') === order.cargoOrderNo;
}

function pickFirst(values: Array<string | null | undefined>) {
  return values.find(v => v) || null;
}

function buildOrderRows(items: Api.Wms.PalletItem[]): Api.Wms.PalletOrderSummary[] {
  const map = new Map<string, Api.Wms.PalletOrderSummary & { shipmentKeys: Set<string> }>();
  for (const item of items) {
    const key = String(item.cargoOrderId ?? item.cargoOrderNo ?? 'unknown');
    let row = map.get(key);
    if (!row) {
      row = {
        cargoOrderId: item.cargoOrderId ?? null,
        cargoOrderNo: item.cargoOrderNo || '—',
        businessTypeName: item.businessTypeName,
        containerNo: item.containerNo,
        groupDestination: item.groupDestination,
        platformName: item.platformName,
        platformWarehouseCode: item.platformWarehouseCode,
        addressType: item.addressType,
        shipmentCount: 0,
        boxQty: 0,
        availableBoxQty: 0,
        lockedBoxQty: 0,
        exceptionBoxQty: 0,
        weight: 0,
        cbm: 0,
        shipmentKeys: new Set()
      };
      map.set(key, row);
    }
    row.businessTypeName = pickFirst([row.businessTypeName, item.businessTypeName]);
    row.containerNo = pickFirst([row.containerNo, item.containerNo]);
    row.groupDestination = pickFirst([row.groupDestination, item.groupDestination]);
    row.platformName = pickFirst([row.platformName, item.platformName]);
    row.addressType = pickFirst([row.addressType, item.addressType]);
    const shipmentKey = String(item.shipmentId ?? item.shipmentCode ?? item.id);
    row.shipmentKeys.add(shipmentKey);
    row.boxQty += item.boxQty || 0;
  }
  return Array.from(map.values()).map(({ shipmentKeys, ...row }) => ({
    ...row,
    shipmentCount: shipmentKeys.size
  }));
}

async function openOrderDetail(row: Api.Wms.Pallet) {
  const { data: itemData } = await fetchGetWmsPalletItems(row.id);
  allPalletItems.value = itemData || [];
  currentPallet.value = row;
  expandedOrderKeys.value = [];
  orderDrawerVisible.value = true;
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value.keyword = null;
  searchParams.value.scope = 'OUTBOUND';
  searchParams.value.pageNum = 1;
  getDataByPage();
}
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="卡板/订单/货件/库位" class="w-240px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <span>出库历史</span>
        <span class="ml-8px text-12px font-normal text-gray-500">只读追溯，不含移库/出库操作</span>
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
      <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
        <NDataTable
          :columns="columns"
          :data="data"
          :loading="loading"
          :pagination="mobilePagination"
          :scroll-x="tableScrollX"
          :flex-height="!appStore.isMobile"
          remote
          size="small"
          class="h-full min-h-280px sm:min-h-0"
        />
      </div>
    </NCard>

    <NDrawer v-model:show="orderDrawerVisible" width="900">
      <NDrawerContent :title="`出库卡板明细 - ${currentPallet?.palletNo || ''}`" closable>
        <NDataTable
          v-model:expanded-row-keys="expandedOrderKeys"
          :columns="orderColumns"
          :data="orderRows"
          :row-key="(row: Api.Wms.PalletOrderSummary) => orderRowKey(row)"
          :pagination="false"
          :scroll-x="900"
          size="small"
        />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
