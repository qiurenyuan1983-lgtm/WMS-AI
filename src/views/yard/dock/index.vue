<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchGetBusinessTypeList, fetchGetWarehouseList } from '@/service/api/base';
import { fetchBatchDeleteYardDock, fetchGetYardDockList } from '@/service/api/yard/dock';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import DockOperateDrawer from './modules/dock-operate-drawer.vue';

defineOptions({ name: 'YardDockList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();
const { options: locationTypeOptions, record: locationTypeRecord } = useDict('yard_location_type');
const { record: dockLocationRecord } = useDict('yard_dock_location');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const businessTypeOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const dockTypeMap: Record<string, { label: string; type: 'success' | 'info' | 'warning' | 'default' }> = {
  DEVANNING:  { label: '拆柜专用', type: 'info' },
  LOADING:    { label: '装车专用', type: 'warning' },
  MIXED_DOCK: { label: '通用', type: 'success' }
};

const dockStatusMap: Record<string, { label: string; type: 'success' | 'info' | 'warning' | 'default' }> = {
  IDLE: { label: '空闲', type: 'success' },
  OCCUPIED: { label: '在用', type: 'info' },
  MAINTENANCE: { label: '维护中', type: 'warning' },
  DISABLED: { label: '停用', type: 'default' }
};

const searchParams = ref<Api.Yard.DockSearchParams>({
  pageNum: 1,
  pageSize: 10,
  dockCode: null,
  dockName: null,
  warehouseId: null,
  locationType: null,
  businessTypeId: null,
  dockLocation: null,
  dockStatus: null,
  enabledFlag: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

async function loadFilterOptions() {
  const [warehouseRes, businessTypeRes] = await Promise.all([
    fetchGetWarehouseList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.MdmWarehouseSearchParams),
    fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} })
  ]);
  warehouseOptions.value = (warehouseRes.data?.rows || []).map(item => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id
  }));
  businessTypeOptions.value = (businessTypeRes.data?.rows || []).map(item => ({
    label: item.businessTypeName,
    value: item.id
  }));
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetYardDockList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 60, render: (_, index) => index + 1 },
      { key: 'dockCode', title: '月台编码', align: 'center', width: 120 },
      { key: 'dockName', title: '月台名称', align: 'center', minWidth: 120 },
      {
        key: 'locationType',
        title: '位置类型',
        align: 'center',
        width: 100,
        render: row => (
          <NTag size="small" type={row.locationType === 'DOCK' ? 'info' : 'default'}>
            {locationTypeRecord.value[row.locationType]?.dictLabel || row.locationType}
          </NTag>
        )
      },
      {
        key: 'businessTypeName',
        title: '适合业务类型',
        align: 'center',
        minWidth: 120,
        render: row => (
          <NTag size="small" type="primary">
            {row.businessTypeName || '--'}
          </NTag>
        )
      },
      {
        key: 'dockType',
        title: '调度类型',
        align: 'center',
        width: 110,
        render: row => {
          const m = row.dockType ? dockTypeMap[row.dockType] : null;
          return m
            ? <NTag size="small" type={m.type}>{m.label}</NTag>
            : <span class="text-gray-300">--</span>;
        }
      },
      { key: 'gridRow', title: '行', align: 'right', width: 70, render: row => row.gridRow ?? '--' },
      { key: 'gridCol', title: '列', align: 'right', width: 70, render: row => row.gridCol ?? '--' },
      { key: 'sortOrder', title: '排序', align: 'right', width: 80 },
      { key: 'dispatchPriority', title: '调度优先级', align: 'right', width: 100 },
      {
        key: 'dockLocation',
        title: '月台位置',
        align: 'center',
        width: 120,
        render: row => dockLocationRecord.value[row.dockLocation || '']?.dictLabel || row.dockLocation || '--'
      },
      { key: 'warehouseName', title: '所属仓库', align: 'center', minWidth: 120 },
      {
        key: 'dockStatus',
        title: '状态',
        align: 'center',
        width: 100,
        render: row => (
          <NTag type={dockStatusMap[row.dockStatus]?.type || 'default'} size="small">
            {dockStatusMap[row.dockStatus]?.label || row.dockStatus}
          </NTag>
        )
      },
      {
        key: 'enabledFlag',
        title: '是否启用',
        align: 'center',
        width: 100,
        render: row => (
          <NTag type={row.enabledFlag ? 'success' : 'default'} size="small">
            {row.enabledFlag ? '启用' : '停用'}
          </NTag>
        )
      },
      { key: 'remark', title: '备注', align: 'left', minWidth: 120, ellipsis: { tooltip: true } },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('yard:dock:edit') ? (
              <ButtonIcon
                text
                type="primary"
                icon="material-symbols:drive-file-rename-outline-outline"
                tooltipContent="编辑"
                onClick={() => handleEdit(row.id)}
              />
            ) : null}
            {hasAuth('yard:dock:remove') ? (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该月台？"
                onPositiveClick={() => handleDelete(row.id)}
              />
            ) : null}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

const activeLocationType = ref<'DOCK' | 'PARKING' | ''>('DOCK');
const locationTabs = [
  { label: '道口', value: 'DOCK' },
  { label: '停车位', value: 'PARKING' },
  { label: '全部', value: '' }
] as const;

const locationTypeSelectOptions = computed(() => locationTypeOptions.value);

function handleLocationTabChange(value: 'DOCK' | 'PARKING' | '') {
  activeLocationType.value = value;
  searchParams.value.locationType = value || null;
  searchParams.value.pageNum = 1;
  getDataByPage();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteYardDock(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteYardDock([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/yard/dock/export', searchParams.value, `月台数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  activeLocationType.value =
    searchParams.value.locationType === 'DOCK' || searchParams.value.locationType === 'PARKING'
      ? searchParams.value.locationType
      : '';
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    dockCode: null,
    dockName: null,
    warehouseId: null,
    locationType: 'DOCK',
    businessTypeId: null,
    dockLocation: null,
    dockStatus: null,
    enabledFlag: null,
    orderByColumn: null,
    isAsc: null,
    params: {}
  };
  activeLocationType.value = 'DOCK';
  getDataByPage();
}

onMounted(loadFilterOptions);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="月台编码">
          <NInput v-model:value="searchParams.dockCode" clearable placeholder="月台编码" class="w-130px" />
        </NFormItem>
        <NFormItem label="月台名称">
          <NInput v-model:value="searchParams.dockName" clearable placeholder="月台名称" class="w-130px" />
        </NFormItem>
        <NFormItem label="所属仓库">
          <NSelect
            v-model:value="searchParams.warehouseId"
            :options="warehouseOptions"
            filterable
            clearable
            placeholder="仓库"
            class="w-160px"
          />
        </NFormItem>
        <NFormItem label="位置类型">
          <NSelect
            v-model:value="searchParams.locationType"
            :options="locationTypeSelectOptions"
            clearable
            placeholder="位置类型"
            class="w-120px"
          />
        </NFormItem>
        <NFormItem label="业务类型">
          <NSelect
            v-model:value="searchParams.businessTypeId"
            :options="businessTypeOptions"
            filterable
            clearable
            placeholder="业务类型"
            class="w-140px"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.dockStatus"
            :options="[
              { label: '空闲', value: 'IDLE' },
              { label: '在用', value: 'OCCUPIED' },
              { label: '维护中', value: 'MAINTENANCE' },
              { label: '停用', value: 'DISABLED' }
            ]"
            clearable
            placeholder="状态"
            class="w-110px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard title="月台列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('yard:dock:add')"
          :show-delete="hasAuth('yard:dock:remove')"
          :show-export="hasAuth('yard:dock:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        />
      </template>
      <NSpace class="mb-12px">
        <NButton
          v-for="tab in locationTabs"
          :key="tab.value || 'all'"
          size="small"
          round
          :type="activeLocationType === tab.value ? 'primary' : 'default'"
          :secondary="activeLocationType !== tab.value"
          @click="handleLocationTabChange(tab.value)"
        >
          {{ tab.label }}
        </NButton>
      </NSpace>
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        :loading="loading"
        remote
        :row-key="(row: Api.Yard.Dock) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <DockOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getDataByPage" />
    </NCard>

  </div>
</template>
