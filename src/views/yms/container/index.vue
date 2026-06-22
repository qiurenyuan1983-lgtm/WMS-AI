<script setup lang="tsx">
import { onActivated, onMounted, ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchAssignContainerPosition,
  fetchDeleteContainerResource,
  fetchGetContainerResourceList,
  fetchMarkContainerArrived
} from '@/service/api/yms/container';
import { fetchGetFreeYardPositions } from '@/service/api/yms/yard-position';
import ContainerOperateDrawer from './modules/container-operate-drawer.vue';

defineOptions({ name: 'YmsContainerResourceList' });

const { hasAuth } = useAuth();
const { record: statusRecord } = useDict('yms_container_status');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const positionOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const assignVisible = ref(false);
const assignTargetId = ref<CommonType.IdType | null>(null);
const assignPositionId = ref<CommonType.IdType | null>(null);

const searchParams = ref<Api.Yms.ContainerResourceSearchParams>({ pageNum: 1, pageSize: 20 });

const { columns, data, getData, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetContainerResourceList(searchParams.value),
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    { key: 'containerNo', title: '柜号', width: 150, ellipsis: { tooltip: true } },
    { key: 'containerType', title: '柜型', width: 80 },
    {
      key: 'containerStatus',
      title: '状态',
      width: 110,
      render: row => (
        <NTag size="small" type="info">
          {statusRecord.value[row.containerStatus]?.dictLabel ?? row.containerStatus}
        </NTag>
      )
    },
    { key: 'positionCode', title: '堆场位', width: 100 },
    { key: 'zoneName', title: '分区', width: 110, ellipsis: { tooltip: true } },
    { key: 'dockCode', title: 'Dock', width: 90 },
    { key: 'plateNo', title: '车牌', width: 110 },
    { key: 'lfdReturn', title: '还柜LFD', width: 110 },
    { key: 'arrivedTime', title: '到仓时间', width: 165 },
    {
      key: 'operate',
      title: '操作',
      width: 240,
      fixed: 'right',
      render: row => (
        <div class="flex flex-wrap gap-1">
          {hasAuth('yms:containerResource:edit') && (
            <NButton size="tiny" quaternary type="primary" onClick={() => handleEdit(row)}>编辑</NButton>
          )}
          {hasAuth('yms:gate:checkIn') && row.containerStatus === 'EXPECTED_ARRIVAL' && (
            <NButton size="tiny" quaternary type="success" onClick={() => handleArrived(row.id)}>到仓</NButton>
          )}
          {hasAuth('yms:containerResource:assignPosition') && (
            <NButton size="tiny" quaternary onClick={() => openAssign(row)}>分配位</NButton>
          )}
          {hasAuth('yms:containerResource:remove') && (
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

async function openAssign(row: Api.Yms.ContainerResource) {
  assignTargetId.value = row.id;
  assignPositionId.value = null;
  if (row.warehouseId) {
    const { data } = await fetchGetFreeYardPositions(row.warehouseId, 'CONTAINER_SLOT');
    positionOptions.value = (data ?? []).map(p => ({
      label: `${p.positionCode}${p.zoneName ? `（${p.zoneName}）` : ''}`,
      value: p.id
    }));
  }
  assignVisible.value = true;
}

async function handleAssign() {
  if (!assignTargetId.value || !assignPositionId.value) {
    window.$message?.warning('请选择堆场位');
    return;
  }
  const { error } = await fetchAssignContainerPosition(assignTargetId.value, assignPositionId.value);
  if (!error) {
    window.$message?.success('分配成功');
    assignVisible.value = false;
    getData();
  }
}

async function handleArrived(id: CommonType.IdType) {
  const { error } = await fetchMarkContainerArrived(id);
  if (!error) { window.$message?.success('已标记到仓'); getData(); }
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchDeleteContainerResource(String(id));
  if (!error) { window.$message?.success('删除成功'); getData(); }
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 20 };
  getData();
}

onMounted(loadWarehouses);
onActivated(getData);
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
            :options="warehouseOptions"
            placeholder="仓库"
          />
        </NFormItem>
        <NFormItem label="柜号">
          <NInput v-model:value="searchParams.containerNo" clearable placeholder="柜号" />
        </NFormItem>
        <NFormItem label="状态">
          <NInput v-model:value="searchParams.containerStatus" clearable placeholder="状态编码" class="w-130px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper overflow-hidden">
      <div class="mb-12px"></div>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-key="(row: Api.Yms.ContainerResource) => row.id"
        size="small"
        flex-height
        remote
        class="h-full"
      />
    </NCard>

    <ContainerOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getData"
    />

    <NModal v-model:show="assignVisible" preset="card" title="分配堆场位" class="w-420px">
      <NSelect
        v-model:value="assignPositionId"
        :options="positionOptions"
        filterable
        placeholder="选择空闲海柜位"
      />
      <template #footer>
        <NButton @click="assignVisible = false">取消</NButton>
        <NButton type="primary" class="ml-8px" @click="handleAssign">确定</NButton>
      </template>
    </NModal>
  </div>
</template>
