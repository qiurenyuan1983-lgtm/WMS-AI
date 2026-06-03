<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGetZonesByWarehouse } from '@/service/api/yms/zone';
import {
  fetchCompleteYardInventory,
  fetchConfirmYardInventoryDiff,
  fetchGetYardInventoryList,
  fetchStartYardInventory
} from '@/service/api/yms/yard-inventory';
import CreateDrawer from './modules/create-drawer.vue';
import ScanDrawer from './modules/scan-drawer.vue';

defineOptions({ name: 'YmsYardInventory' });

const { hasAuth } = useAuth();
const { options: inventoryTypeOptions, record: inventoryTypeRecord } = useDict('yms_inventory_type');
const { options: statusOptions, record: statusRecord } = useDict('yms_inventory_status');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const zoneOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const searchParams = ref<Api.Yms.YardInventorySearchParams>({ pageNum: 1, pageSize: 20 });

const STATUS_TAG: Record<string, NaiveUI.ThemeColor> = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  DIFF_FOUND: 'warning'
};

const { columns, data, getData, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetYardInventoryList(searchParams.value),
  columns: () => [
    { key: 'inventoryNo', title: '盘点单号', width: 160, ellipsis: { tooltip: true } },
    {
      key: 'inventoryType',
      title: '类型',
      width: 110,
      render: row => (
        <NTag size="small">
          {inventoryTypeRecord.value[row.inventoryType]?.dictLabel ?? row.inventoryType}
        </NTag>
      )
    },
    { key: 'zoneName', title: '分区', width: 120, ellipsis: { tooltip: true } },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: row => (
        <NTag size="small" type={STATUS_TAG[row.status] ?? 'default'}>
          {statusRecord.value[row.status]?.dictLabel ?? row.status}
        </NTag>
      )
    },
    {
      key: 'expectedCount',
      title: '应盘/实盘/差异',
      width: 140,
      render: row => `${row.expectedCount} / ${row.actualCount} / ${row.diffCount}`
    },
    { key: 'operatorName', title: '操作人', width: 100, ellipsis: { tooltip: true } },
    { key: 'createTime', title: '创建时间', width: 160 },
    {
      key: 'operate',
      title: '操作',
      width: 220,
      fixed: 'right',
      render: row => (
        <div class="flex flex-wrap gap-1">
          {hasAuth('yms:inventory:execute') && row.status === 'PENDING' && (
            <NButton size="tiny" type="primary" onClick={() => handleStart(row)}>
              开始
            </NButton>
          )}
          {hasAuth('yms:inventory:execute') && row.status === 'IN_PROGRESS' && (
            <NButton size="tiny" type="info" onClick={() => openScan(row)}>
              扫码盘点
            </NButton>
          )}
          {hasAuth('yms:inventory:execute') && row.status === 'IN_PROGRESS' && (
            <NPopconfirm onPositiveClick={() => handleComplete(row.id)}>
              {{
                default: () => '确认结束盘点？未扫项将标记为缺失。',
                trigger: () => (
                  <NButton size="tiny" type="success">
                    完成
                  </NButton>
                )
              }}
            </NPopconfirm>
          )}
          {hasAuth('yms:inventory:execute') && row.status === 'DIFF_FOUND' && (
            <NPopconfirm onPositiveClick={() => handleConfirmDiff(row.id)}>
              {{
                default: () => '确认差异已处理？',
                trigger: () => (
                  <NButton size="tiny" type="warning">
                    确认差异
                  </NButton>
                )
              }}
            </NPopconfirm>
          )}
          {hasAuth('yms:inventory:query') && (
            <NButton size="tiny" quaternary onClick={() => openScan(row, true)}>
              详情
            </NButton>
          )}
        </div>
      )
    }
  ]
});

const createVisible = ref(false);
const scanVisible = ref(false);
const scanTask = ref<Api.Yms.YardInventoryTask | null>(null);
const scanReadonly = ref(false);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
}

async function loadZones(warehouseId?: CommonType.IdType | null) {
  if (!warehouseId) {
    zoneOptions.value = [];
    return;
  }
  const { data } = await fetchGetZonesByWarehouse(warehouseId);
  zoneOptions.value = (data ?? []).map(z => ({ label: z.zoneName, value: z.id }));
}

async function handleStart(row: Api.Yms.YardInventoryTask) {
  const { error } = await fetchStartYardInventory(row.id);
  if (!error) {
    window.$message?.success('盘点已开始');
    getData();
  }
}

async function handleComplete(id: CommonType.IdType) {
  const { error } = await fetchCompleteYardInventory(id);
  if (!error) {
    window.$message?.success('盘点已完成');
    getData();
  }
}

async function handleConfirmDiff(id: CommonType.IdType) {
  const { error } = await fetchConfirmYardInventoryDiff(id);
  if (!error) {
    window.$message?.success('差异已确认');
    getData();
  }
}

function openScan(row: Api.Yms.YardInventoryTask, readonly = false) {
  scanTask.value = row;
  scanReadonly.value = readonly;
  scanVisible.value = true;
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 20 };
  zoneOptions.value = [];
  getData();
}

function onWarehouseChange(val: CommonType.IdType | null) {
  searchParams.value.zoneId = null;
  loadZones(val);
}

onMounted(loadWarehouses);
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="仓库">
          <NSelect
            v-model:value="searchParams.warehouseId"
            :options="warehouseOptions"
            clearable
            filterable
            class="w-160px"
            placeholder="仓库"
            @update:value="onWarehouseChange"
          />
        </NFormItem>
        <NFormItem label="盘点单号">
          <NInput v-model:value="searchParams.inventoryNo" clearable placeholder="盘点单号" class="w-140px" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect
            v-model:value="searchParams.inventoryType"
            :options="inventoryTypeOptions"
            clearable
            class="w-130px"
            placeholder="类型"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.status"
            :options="statusOptions"
            clearable
            class="w-120px"
            placeholder="状态"
          />
        </NFormItem>
        <NFormItem label="分区">
          <NSelect
            v-model:value="searchParams.zoneId"
            :options="zoneOptions"
            clearable
            filterable
            class="w-140px"
            placeholder="分区"
            :disabled="!searchParams.warehouseId"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper overflow-hidden">
      <div class="mb-12px">
        <NButton v-if="hasAuth('yms:inventory:add')" type="primary" @click="createVisible = true">
          <template #icon><SvgIcon icon="ic:round-plus" /></template>
          新建盘点
        </NButton>
      </div>

      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-key="(row: Api.Yms.YardInventoryTask) => row.id"
        size="small"
        flex-height
        remote
        class="h-full"
      />
    </NCard>

    <CreateDrawer v-model:visible="createVisible" @submitted="getData" />
    <ScanDrawer
      v-model:visible="scanVisible"
      :task-id="scanTask?.id ?? null"
      :readonly="scanReadonly"
      @submitted="getData"
    />
  </div>
</template>
