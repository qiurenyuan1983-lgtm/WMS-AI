<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteWarehouse, fetchGetWarehouseList } from '@/service/api/base/warehouse';
import { fetchGetCompanyList } from '@/service/api/base/company';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import WarehouseOperateDrawer from './modules/warehouse-operate-drawer.vue';

defineOptions({ name: 'WarehouseList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const WAREHOUSE_TYPE_MAP: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'default' }> = {
  SELF_OP:  { label: '自营仓',    type: 'success' },
  PARTNER:  { label: '合作仓',    type: 'info' },
  TRANSIT:  { label: '中转仓',    type: 'warning' },
  CUSTOMER: { label: '客户指定仓', type: 'default' }
};

const WAREHOUSE_TYPE_OPTIONS = Object.entries(WAREHOUSE_TYPE_MAP).map(([v, o]) => ({ label: o.label, value: v }));

const companyOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

async function loadCompanyOptions() {
  const { data } = await fetchGetCompanyList({ pageSize: 200, pageNum: 1, status: '0' });
  if (data?.rows) {
    companyOptions.value = data.rows.map(c => ({ label: `${c.companyCode} - ${c.companyName}`, value: c.id }));
  }
}

const searchParams = ref<Api.Base.MdmWarehouseSearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: null,
  warehouseCode: null,
  warehouseName: null,
  warehouseType: null,
  countryCode: null,
  status: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetWarehouseList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'id', title: 'ID', align: 'center', width: 180 },
      { key: 'warehouseCode', title: '仓库编码', align: 'center', width: 120 },
      { key: 'warehouseName', title: '仓库名称', align: 'center', minWidth: 160 },
      { key: 'companyName', title: '所属主体', align: 'center', width: 160, ellipsis: { tooltip: true } },
      {
        key: 'warehouseType',
        title: '仓库类型',
        align: 'center',
        width: 110,
        render: row => {
          const info = WAREHOUSE_TYPE_MAP[row.warehouseType ?? ''];
          return info
            ? <NTag type={info.type} size="small">{info.label}</NTag>
            : <span>{row.warehouseType}</span>;
        }
      },
      { key: 'countryCode', title: '国家', align: 'center', width: 70 },
      { key: 'city', title: '城市', align: 'center', width: 110 },
      {
        key: 'isBonded',
        title: '保税仓',
        align: 'center',
        width: 80,
        render: row => (
          <NTag type={row.isBonded === 1 ? 'warning' : 'default'} size="small">
            {row.isBonded === 1 ? '是' : '否'}
          </NTag>
        )
      },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 80,
        render: row => (
          <NTag type={row.status === '0' ? 'success' : 'error'} size="small">
            {row.status === '0' ? '启用' : '停用'}
          </NTag>
        )
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:warehouse:edit')) return null;
            return (
              <ButtonIcon
                text
                type="primary"
                icon="material-symbols:drive-file-rename-outline-outline"
                tooltipContent="编辑"
                onClick={() => handleEdit(row.id)}
              />
            );
          };
          const deleteBtn = () => {
            if (!hasAuth('base:warehouse:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该仓库？"
                onPositiveClick={() => handleDelete(row.id)}
              />
            );
          };
          return (
            <div class="flex-center gap-8px">
              {editBtn()}{deleteBtn()}
            </div>
          );
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteWarehouse(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteWarehouse([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/warehouse/export', searchParams.value, `仓库数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    companyId: null,
    warehouseCode: null,
    warehouseName: null,
    warehouseType: null,
    countryCode: null,
    status: null,
    params: {}
  };
  getDataByPage();
}

onMounted(() => {
  loadCompanyOptions();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="所属主体">
          <NSelect
            v-model:value="searchParams.companyId"
            :options="companyOptions"
            clearable
            placeholder="全部主体"
            filterable
            class="w-200px"
          />
        </NFormItem>
        <NFormItem label="编码/名称">
          <NInput v-model:value="searchParams.warehouseName" clearable placeholder="仓库编码或名称" class="w-160px" />
        </NFormItem>
        <NFormItem label="仓库类型">
          <NSelect
            v-model:value="searchParams.warehouseType"
            :options="WAREHOUSE_TYPE_OPTIONS"
            clearable
            placeholder="全部"
            class="w-120px"
          />
        </NFormItem>
        <NFormItem label="国家">
          <NInput v-model:value="searchParams.countryCode" clearable placeholder="如 US / CN" class="w-90px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.status"
            :options="[{ label: '启用', value: '0' }, { label: '停用', value: '1' }]"
            clearable
            placeholder="全部"
            class="w-100px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard title="仓库管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:warehouse:add')"
          :show-delete="hasAuth('base:warehouse:remove')"
          :show-export="hasAuth('base:warehouse:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        />
      </template>
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        :loading="loading"
        remote
        :row-key="(row: Api.Base.MdmWarehouse) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <WarehouseOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :company-options="companyOptions"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
