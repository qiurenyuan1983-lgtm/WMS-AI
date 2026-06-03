<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import {
  NButton,
  NCard,
  NCheckbox,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NStatistic,
  NTag
} from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchAdjustWmsInventory, fetchGetWmsInventoryList, fetchGetWmsInventoryStats } from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';

defineOptions({ name: 'WmsInventoryList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { record: statusRecord } = useDict('wms_inventory_status');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const adjustModalVisible = ref(false);
const currentInventory = ref<Api.Wms.Inventory | null>(null);
const adjustForm = ref<Api.Wms.InventoryAdjustParams>({
  inventoryId: null as any,
  deltaAvailableBoxQty: null,
  deltaLockedBoxQty: null,
  deltaExceptionBoxQty: null,
  remark: null
});

const stats = ref<Api.Wms.InventoryStats>({
  inventoryCount: 0,
  palletCount: 0,
  totalBoxQty: 0,
  availableBoxQty: 0,
  lockedBoxQty: 0,
  exceptionBoxQty: 0,
  totalWeight: 0,
  totalCbm: 0
});

const searchParams = ref<Api.Wms.InventorySearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: null,
  warehouseId: null,
  customerId: null,
  keyword: null,
  cargoOrderNo: null,
  shipmentCode: null,
  skuCode: null,
  inventoryStatus: null,
  includeDepleted: false,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.InventoryList, Api.Wms.Inventory>({
    api: () => fetchGetWmsInventoryList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { key: 'cargoOrderNo', title: '订单号', width: 150, fixed: 'left', ellipsis: { tooltip: true } },
      { key: 'shipmentCode', title: '货件编码', width: 140, ellipsis: { tooltip: true } },
      { key: 'customerName', title: '客户', width: 160, ellipsis: { tooltip: true } },
      { key: 'warehouseName', title: '仓库', width: 160, ellipsis: { tooltip: true } },
      { key: 'totalBoxQty', title: '总箱数', width: 90, align: 'right' },
      { key: 'lockedBoxQty', title: '锁定箱数', width: 100, align: 'right' },
      { key: 'availableBoxQty', title: '可用箱数', width: 100, align: 'right' },
      { key: 'exceptionBoxQty', title: '异常箱数', width: 100, align: 'right' },
      { key: 'totalWeight', title: '重量KG', width: 110, align: 'right' },
      { key: 'totalCbm', title: 'CBM', width: 100, align: 'right' },
      {
        key: 'inventoryStatus',
        title: '库存状态',
        width: 110,
        align: 'center',
        render: row => (
          <NTag size="small" type={row.inventoryStatus === 'IN_STOCK' ? 'success' : row.inventoryStatus === 'HOLD' ? 'warning' : 'default'}>
            {statusRecord.value[row.inventoryStatus]?.dictLabel || row.inventoryStatus}
          </NTag>
        )
      },
      { key: 'updateTime', title: '最近变动时间', width: 170 },
      { key: 'remark', title: '备注', width: 160, ellipsis: { tooltip: true } },
      {
        key: 'operate',
        title: '操作',
        width: 110,
        fixed: 'right',
        render: row =>
          hasAuth('wms:inventory:adjust') ? (
            <NButton size="small" type="primary" onClick={() => openAdjustModal(row)}>
              库存调整
            </NButton>
          ) : (
            '—'
          )
      }
    ]
  });

const tableScrollX = computed(() => Math.max(scrollX.value, 1500));

async function loadWarehouses() {
  const { data: whData } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500 } as any);
  warehouseOptions.value = ((whData as any)?.rows || []).map((item: any) => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id
  }));
}

async function loadStats() {
  const { data: statData } = await fetchGetWmsInventoryStats(searchParams.value);
  if (statData) stats.value = statData;
}

async function refreshAll() {
  await Promise.all([getData(), loadStats()]);
}

function openAdjustModal(row: Api.Wms.Inventory) {
  currentInventory.value = row;
  adjustForm.value = {
    inventoryId: row.id,
    deltaAvailableBoxQty: null,
    deltaLockedBoxQty: null,
    deltaExceptionBoxQty: null,
    remark: null
  };
  adjustModalVisible.value = true;
}

async function submitAdjust() {
  const dAvail = adjustForm.value.deltaAvailableBoxQty ?? 0;
  const dLock = adjustForm.value.deltaLockedBoxQty ?? 0;
  const dExc = adjustForm.value.deltaExceptionBoxQty ?? 0;
  if (dAvail === 0 && dLock === 0 && dExc === 0) {
    window.$message?.warning('请填写至少一项调整数量（正数增加、负数减少）');
    return;
  }
  const { error } = await fetchAdjustWmsInventory(adjustForm.value);
  if (error) return;
  window.$message?.success('库存已调整');
  adjustModalVisible.value = false;
  refreshAll();
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
  loadStats();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    companyId: null,
    warehouseId: null,
    customerId: null,
    keyword: null,
    cargoOrderNo: null,
    shipmentCode: null,
    skuCode: null,
    inventoryStatus: null,
    includeDepleted: false,
    orderByColumn: null,
    isAsc: null,
    params: {}
  };
  handleSearch();
}

onMounted(() => {
  loadWarehouses();
  loadStats();
});
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="仓库">
          <NSelect v-model:value="searchParams.warehouseId" :options="warehouseOptions" filterable clearable placeholder="请选择仓库" class="w-220px" />
        </NFormItem>
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="订单/货件/SKU/客户" class="w-220px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.inventoryStatus"
            clearable
            placeholder="请选择状态"
            class="w-150px"
            :options="[
              { label: '在库', value: 'IN_STOCK' },
              { label: '部分出库', value: 'PARTIAL_OUT' },
              { label: '已清空', value: 'DEPLETED' },
              { label: '冻结', value: 'HOLD' }
            ]"
          />
        </NFormItem>
        <NFormItem>
          <NCheckbox v-model:checked="searchParams.includeDepleted">含已清空/零库存</NCheckbox>
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
        <span>库存查询</span>
        <span class="ml-8px text-12px font-normal text-gray-500">默认仅显示有库存货件，勾选后可查历史清零记录</span>
      </template>
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-add="false"
          :show-delete="false"
          :show-export="false"
          @refresh="refreshAll"
        />
      </template>

      <div class="mb-12px grid flex-shrink-0 grid-cols-4 gap-12px xl:grid-cols-8">
        <NStatistic label="总箱数" :value="stats.totalBoxQty" />
        <NStatistic label="锁定箱数" :value="stats.lockedBoxQty" />
        <NStatistic label="可用箱数" :value="stats.availableBoxQty" />
        <NStatistic label="异常箱数" :value="stats.exceptionBoxQty" />
        <NStatistic label="总卡板" :value="stats.palletCount" />
        <NStatistic label="总CBM" :value="stats.totalCbm" />
        <NStatistic label="库存行" :value="stats.inventoryCount" />
        <NStatistic label="总重量" :value="stats.totalWeight" />
      </div>

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

    <NModal v-model:show="adjustModalVisible" preset="card" title="库存调整" class="w-520px">
      <p class="mb-12px text-13px text-gray-500">
        订单 {{ currentInventory?.cargoOrderNo }} / 货件 {{ currentInventory?.shipmentCode }}。调整量为正数增加、负数减少，将同步卡板明细并记流水。
      </p>
      <div class="mb-16px grid grid-cols-3 gap-8px text-13px">
        <div>锁定：{{ currentInventory?.lockedBoxQty ?? 0 }}</div>
        <div>可用：{{ currentInventory?.availableBoxQty ?? 0 }}</div>
        <div>异常：{{ currentInventory?.exceptionBoxQty ?? 0 }}</div>
      </div>
      <NForm label-placement="left" label-width="110">
        <NFormItem label="锁定箱数调整">
          <NInputNumber v-model:value="adjustForm.deltaLockedBoxQty" class="w-full" placeholder="如 +1 或 -1" />
        </NFormItem>
        <NFormItem label="可用箱数调整">
          <NInputNumber v-model:value="adjustForm.deltaAvailableBoxQty" class="w-full" placeholder="如 +5 或 -2" />
        </NFormItem>
        <NFormItem label="异常箱数调整">
          <NInputNumber v-model:value="adjustForm.deltaExceptionBoxQty" class="w-full" placeholder="如 +1 或 -1" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="adjustForm.remark" type="textarea" placeholder="调整原因" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="adjustModalVisible = false">取消</NButton>
          <NButton type="primary" @click="submitAdjust">确定</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
