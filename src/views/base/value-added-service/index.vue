<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteValueAddedService, fetchGetValueAddedServiceList } from '@/service/api/base/value-added-service';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import ValueAddedServiceOperateDrawer from './modules/value-added-service-operate-drawer.vue';

defineOptions({ name: 'ValueAddedServiceList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const SERVICE_CATEGORY_OPTIONS = [
  { label: '标签类', value: 'LABEL' }, { label: '包装类', value: 'PACKAGE' }, { label: '质检类', value: 'QC' },
  { label: '拍照类', value: 'PHOTO' }, { label: '打托类', value: 'PALLET' }, { label: '销毁类', value: 'DESTROY' },
  { label: '暂存类', value: 'STORAGE' }
];
const BILLING_OPTIONS = [{ label: '按件', value: 'BY_ITEM' }, { label: '按箱', value: 'BY_CARTON' }, { label: '按板', value: 'BY_PALLET' }, { label: '按订单', value: 'BY_ORDER' }, { label: '按小时', value: 'BY_HOUR' }];
const optionLabel = (options: { label: string; value: string }[], value?: string | null) => options.find(item => item.value === value)?.label || value || '-';
const yesNoTag = (value?: string | null) => <NTag type={value === '1' ? 'success' : 'default'} size="small">{value === '1' ? '是' : '否'}</NTag>;

const searchParams = ref<Api.Base.ValueAddedServiceSearchParams>({
  pageNum: 1, pageSize: 10, keyword: null, serviceCategory: null, chargeableFlag: null, operationRequired: null, status: null, params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetValueAddedServiceList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'serviceCode', title: '服务编码', align: 'center', width: 150 },
      { key: 'serviceName', title: '服务名称', align: 'center', minWidth: 150 },
      { key: 'serviceCategory', title: '服务分类', align: 'center', width: 110, render: row => <NTag size="small">{optionLabel(SERVICE_CATEGORY_OPTIONS, row.serviceCategory)}</NTag> },
      { key: 'billingMode', title: '计费方式', align: 'center', width: 100, render: row => optionLabel(BILLING_OPTIONS, row.billingMode) },
      { key: 'chargeableFlag', title: '收费', align: 'center', width: 70, render: row => yesNoTag(row.chargeableFlag) },
      { key: 'operationRequired', title: '需作业', align: 'center', width: 80, render: row => yesNoTag(row.operationRequired) },
      { key: 'pdaOperationFlag', title: '需PDA', align: 'center', width: 80, render: row => yesNoTag(row.pdaOperationFlag) },
      { key: 'priority', title: '优先级', align: 'center', width: 80 },
      { key: 'status', title: '状态', align: 'center', width: 80, render: row => <NTag type={row.status === '0' ? 'success' : 'error'} size="small">{row.status === '0' ? '正常' : '禁用'}</NTag> },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('base:vas:edit') && <ButtonIcon text type="primary" icon="material-symbols:drive-file-rename-outline-outline" tooltipContent="编辑" onClick={() => handleEdit(row.id)} />}
            {hasAuth('base:vas:remove') && <ButtonIcon text type="error" icon="material-symbols:delete-outline" tooltipContent="删除" popconfirmContent="确认删除该增值服务？" onPositiveClick={() => handleDelete(row.id)} />}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteValueAddedService(checkedRowKeys.value);
  if (!error) onBatchDeleted();
}
async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteValueAddedService([id]);
  if (!error) onDeleted();
}
function handleExport() {
  download('/base/vas/export', searchParams.value, `增值服务数据_${new Date().getTime()}.xlsx`);
}
function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}
function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 10, keyword: null, serviceCategory: null, chargeableFlag: null, operationRequired: null, status: null, params: {} };
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="编码/名称"><NInput v-model:value="searchParams.keyword" clearable placeholder="服务编码或名称" class="w-160px" /></NFormItem>
        <NFormItem label="服务分类"><NSelect v-model:value="searchParams.serviceCategory" :options="SERVICE_CATEGORY_OPTIONS" clearable placeholder="全部" class="w-120px" /></NFormItem>
        <NFormItem label="是否收费"><NSelect v-model:value="searchParams.chargeableFlag" :options="[{ label: '是', value: '1' }, { label: '否', value: '0' }]" clearable placeholder="全部" class="w-100px" /></NFormItem>
        <NFormItem label="需要作业"><NSelect v-model:value="searchParams.operationRequired" :options="[{ label: '是', value: '1' }, { label: '否', value: '0' }]" clearable placeholder="全部" class="w-100px" /></NFormItem>
        <NFormItem label="状态"><NSelect v-model:value="searchParams.status" :options="[{ label: '正常', value: '0' }, { label: '禁用', value: '1' }]" clearable placeholder="全部" class="w-100px" /></NFormItem>
        <NFormItem><NButton type="primary" @click="handleSearch">查询</NButton><NButton class="ml-8px" @click="handleReset">重置</NButton></NFormItem>
      </NForm>
    </NCard>
    <NCard title="增值服务管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :disabled-delete="checkedRowKeys.length === 0" :loading="loading" :show-add="hasAuth('base:vas:add')" :show-delete="hasAuth('base:vas:remove')" :show-export="hasAuth('base:vas:export')" @add="handleAdd" @delete="handleBatchDelete" @export="handleExport" @refresh="getData" />
      </template>
      <DataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data" :flex-height="!appStore.isMobile" :scroll-x="scrollX" :loading="loading" remote :row-key="(row: Api.Base.ValueAddedService) => row.id" :pagination="mobilePagination" class="sm:h-full" />
      <ValueAddedServiceOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getDataByPage" />
    </NCard>
  </div>
</template>

