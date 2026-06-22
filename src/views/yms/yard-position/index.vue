<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGetZonesByWarehouse } from '@/service/api/yms/zone';
import {
  fetchDeleteYardPosition,
  fetchDisableYardPosition,
  fetchEnableYardPosition,
  fetchGetYardPositionList,
  fetchReleaseYardPosition
} from '@/service/api/yms/yard-position';
import PositionOperateDrawer from './modules/position-operate-drawer.vue';

defineOptions({ name: 'YmsYardPositionList' });

const { hasAuth } = useAuth();
const { record: positionTypeRecord } = useDict('yms_position_type');
const { record: positionStatusRecord } = useDict('yms_position_status');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const zoneOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const STATUS_COLOR: Record<string, NaiveUI.ThemeColor> = {
  FREE: 'success',
  OCCUPIED: 'primary',
  RESERVED: 'warning',
  DISABLED: 'default'
};

const searchParams = ref<Api.Yms.YardPositionSearchParams>({ pageNum: 1, pageSize: 20 });

const { columns, data, getData, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetYardPositionList(searchParams.value),
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    { key: 'positionCode', title: '位置编码', width: 120, ellipsis: { tooltip: true } },
    { key: 'zoneName', title: '所属分区', width: 130, ellipsis: { tooltip: true } },
    {
      key: 'positionType',
      title: '类型',
      width: 110,
      render: row => (
        <NTag size="small">
          {positionTypeRecord.value[row.positionType]?.dictLabel ?? row.positionType}
        </NTag>
      )
    },
    {
      key: 'positionStatus',
      title: '状态',
      width: 90,
      render: row => {
        const type = (STATUS_COLOR[row.positionStatus] ?? 'default') as NaiveUI.ThemeColor;
        return (
          <NTag type={type} size="small">
            {positionStatusRecord.value[row.positionStatus]?.dictLabel ?? row.positionStatus}
          </NTag>
        );
      }
    },
    { key: 'occupiedObjectNo', title: '当前对象', width: 140, ellipsis: { tooltip: true } },
    {
      key: 'gridRow',
      title: '坐标',
      width: 80,
      render: row => (row.gridRow != null ? `${row.gridRow},${row.gridCol ?? '-'}` : '-')
    },
    { key: 'remark', title: '备注', ellipsis: { tooltip: true } },
    {
      key: 'operate',
      title: '操作',
      width: 220,
      fixed: 'right',
      render: row => (
        <div class="flex flex-wrap gap-1">
          {hasAuth('yms:yardPosition:edit') && (
            <NButton size="tiny" quaternary type="primary" onClick={() => handleEdit(row)}>编辑</NButton>
          )}
          {hasAuth('yms:yardPosition:edit') && (row.positionStatus === 'OCCUPIED' || row.positionStatus === 'RESERVED') && (
            <NPopconfirm onPositiveClick={() => handleRelease(row.id)}>
              {{
                default: () => '确认释放该堆场位？',
                trigger: () => <NButton size="tiny" quaternary type="warning">释放</NButton>
              }}
            </NPopconfirm>
          )}
          {hasAuth('yms:yardPosition:edit') && row.positionStatus === 'FREE' && (
            <NPopconfirm onPositiveClick={() => handleDisable(row.id)}>
              {{
                default: () => '确认禁用该堆场位？',
                trigger: () => <NButton size="tiny" quaternary>禁用</NButton>
              }}
            </NPopconfirm>
          )}
          {hasAuth('yms:yardPosition:edit') && row.positionStatus === 'DISABLED' && (
            <NButton size="tiny" quaternary type="success" onClick={() => handleEnable(row.id)}>启用</NButton>
          )}
          {hasAuth('yms:yardPosition:remove') && row.positionStatus === 'FREE' && (
            <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
              {{
                default: () => '确认删除？',
                trigger: () => <NButton size="tiny" quaternary type="error">删除</NButton>
              }}
            </NPopconfirm>
          )}
        </div>
      )
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys } =
  useTableOperate(getData);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
}

async function onWarehouseChange(warehouseId: CommonType.IdType | null) {
  searchParams.value.zoneId = null;
  zoneOptions.value = [];
  if (!warehouseId) return;
  const { data } = await fetchGetZonesByWarehouse(warehouseId);
  zoneOptions.value = (data ?? []).map(z => ({ label: z.zoneName, value: z.id }));
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchDeleteYardPosition(String(id));
  if (!error) { window.$message?.success('删除成功'); getData(); }
}

async function handleBatchDelete() {
  const { error } = await fetchDeleteYardPosition(checkedRowKeys.value.join(','));
  if (!error) { window.$message?.success('删除成功'); getData(); }
}

async function handleRelease(id: CommonType.IdType) {
  const { error } = await fetchReleaseYardPosition(id);
  if (!error) { window.$message?.success('已释放'); getData(); }
}

async function handleDisable(id: CommonType.IdType) {
  const { error } = await fetchDisableYardPosition(id);
  if (!error) { window.$message?.success('已禁用'); getData(); }
}

async function handleEnable(id: CommonType.IdType) {
  const { error } = await fetchEnableYardPosition(id);
  if (!error) { window.$message?.success('已启用'); getData(); }
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

onMounted(loadWarehouses);
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="仓库">
          <NSelect
            v-model:value="searchParams.warehouseId"
            clearable
            filterable
            class="w-160px"
            placeholder="请选择"
            :options="warehouseOptions"
            @update:value="onWarehouseChange"
          />
        </NFormItem>
        <NFormItem label="分区">
          <NSelect
            v-model:value="searchParams.zoneId"
            clearable
            filterable
            class="w-140px"
            placeholder="请选择"
            :options="zoneOptions"
          />
        </NFormItem>
        <NFormItem label="位置编码">
          <NInput v-model:value="searchParams.positionCode" clearable placeholder="编码" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.positionStatus"
            clearable
            class="w-120px"
            placeholder="状态"
            :options="[
              { label: '空闲', value: 'FREE' },
              { label: '占用', value: 'OCCUPIED' },
              { label: '预占', value: 'RESERVED' },
              { label: '禁用', value: 'DISABLED' }
            ]"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper overflow-hidden">
      <div class="mb-12px flex gap-8px">
        <NButton v-if="hasAuth('yms:yardPosition:add')" type="primary" @click="handleAdd">
          <template #icon><SvgIcon icon="ic:round-plus" /></template>
          新增堆场位
        </NButton>
        <NButton
          v-if="hasAuth('yms:yardPosition:remove')"
          type="error"
          :disabled="!checkedRowKeys.length"
          @click="handleBatchDelete"
        >
          批量删除
        </NButton>
      </div>

      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-key="(row: Api.Yms.YardPosition) => row.id"
        size="small"
        flex-height
        remote
        class="h-full"
      />
    </NCard>

    <PositionOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getData"
    />
  </div>
</template>
