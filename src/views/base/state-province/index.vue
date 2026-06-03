<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { fetchBatchDeleteStateProvince, fetchGetStateProvinceList } from '@/service/api/base/state-province';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import StateProvinceOperateDrawer from './modules/state-province-operate-drawer.vue';

defineOptions({ name: 'StateProvinceList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const searchParams = ref<Api.Base.StateProvinceSearchParams>({
  pageNum: 1,
  pageSize: 10,
  countryCode: null,
  code: null,
  nameEn: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetStateProvinceList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'countryCode', title: '国家代码', align: 'center', minWidth: 100 },
      { key: 'code', title: '州/省代码', align: 'center', minWidth: 120 },
      { key: 'nameEn', title: '英文名称', align: 'center', minWidth: 160 },
      { key: 'sortOrder', title: '排序', align: 'center', width: 80 },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 90,
        render: row => (
          <NTag type={row.status === '0' ? 'success' : 'default'}>
            {row.status === '0' ? '正常' : '停用'}
          </NTag>
        )
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('base:stateProvince:edit') && (
              <ButtonIcon text type="primary" icon="material-symbols:drive-file-rename-outline-outline"
                tooltipContent="编辑" onClick={() => handleEdit(row.id)} />
            )}
            {hasAuth('base:stateProvince:remove') && (
              <ButtonIcon text type="error" icon="material-symbols:delete-outline"
                tooltipContent="删除" popconfirmContent="确认删除该州/省？"
                onPositiveClick={() => handleDelete(row.id)} />
            )}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteStateProvince(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteStateProvince([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/state-province/export', searchParams.value, `州省数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() { searchParams.value.pageNum = 1; getDataByPage(); }
function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 10, countryCode: null, code: null, nameEn: null, status: null, orderByColumn: null, isAsc: null, params: {} };
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="国家代码">
          <NInput v-model:value="searchParams.countryCode" clearable placeholder="如：US" class="w-100px" />
        </NFormItem>
        <NFormItem label="州省代码">
          <NInput v-model:value="searchParams.code" clearable placeholder="如：CA" class="w-120px" />
        </NFormItem>
        <NFormItem label="英文名称">
          <NInput v-model:value="searchParams.nameEn" clearable placeholder="请输入名称" class="w-160px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status"
            :options="[{ label: '正常', value: '0' }, { label: '停用', value: '1' }]"
            clearable placeholder="全部" class="w-100px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard title="州/省列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading" :show-add="hasAuth('base:stateProvince:add')"
          :show-delete="hasAuth('base:stateProvince:remove')" :show-export="hasAuth('base:stateProvince:export')"
          @add="handleAdd" @delete="handleBatchDelete" @export="handleExport" @refresh="getData" />
      </template>
      <DataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data"
        :flex-height="!appStore.isMobile" :scroll-x="scrollX" :loading="loading" remote
        :row-key="(row: Api.Base.StateProvince) => row.id" :pagination="mobilePagination" class="sm:h-full" />
      <StateProvinceOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType"
        :row-data="editingData" @submitted="getDataByPage" />
    </NCard>
  </div>
</template>

<style scoped></style>
