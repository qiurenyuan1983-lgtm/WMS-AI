<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteBusinessType, fetchGetBusinessTypeList } from '@/service/api/base/business-type';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import BusinessTypeOperateDrawer from './modules/business-type-operate-drawer.vue';

defineOptions({ name: 'BusinessTypeList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const BUSINESS_CATEGORY_OPTIONS = [
  { label: '仓储业务', value: 'WAREHOUSE' }, { label: '运输业务', value: 'TRANSPORT' },
  { label: '增值服务', value: 'VAS' }, { label: '售后业务', value: 'AFTER_SALES' }
];
const FLOW_OPTIONS = [
  { label: '入库型', value: 'INBOUND' }, { label: '出库型', value: 'OUTBOUND' },
  { label: '入出库型', value: 'INBOUND_OUTBOUND' }, { label: '服务型', value: 'SERVICE' }
];
const optionLabel = (options: { label: string; value: string }[], value?: string | null) =>
  options.find(item => item.value === value)?.label || value || '-';
const yesNo = (value?: string | null) => (value === '1' ? '是' : '否');

const searchParams = ref<Api.Base.BusinessTypeSearchParams>({
  pageNum: 1, pageSize: 10, keyword: null, businessCategory: null, operationFlowType: null, status: null, params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetBusinessTypeList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'businessTypeCode', title: '业务类型编码', align: 'center', width: 160 },
      { key: 'businessTypeName', title: '业务类型名称', align: 'center', minWidth: 150 },
      { key: 'businessCategory', title: '业务大类', align: 'center', width: 110, render: row => <NTag size="small">{optionLabel(BUSINESS_CATEGORY_OPTIONS, row.businessCategory)}</NTag> },
      { key: 'operationFlowType', title: '流程类型', align: 'center', width: 110, render: row => optionLabel(FLOW_OPTIONS, row.operationFlowType) },
      { key: 'inboundRequired', title: '入库', align: 'center', width: 70, render: row => yesNo(row.inboundRequired) },
      { key: 'outboundRequired', title: '出库', align: 'center', width: 70, render: row => yesNo(row.outboundRequired) },
      { key: 'deliveryRequired', title: '派送', align: 'center', width: 70, render: row => yesNo(row.deliveryRequired) },
      { key: 'vasSupported', title: '支持VAS', align: 'center', width: 90, render: row => <NTag type={row.vasSupported === '1' ? 'success' : 'default'} size="small">{yesNo(row.vasSupported)}</NTag> },
      { key: 'sortOrder', title: '排序', align: 'center', width: 70 },
      { key: 'status', title: '状态', align: 'center', width: 80, render: row => <NTag type={row.status === '0' ? 'success' : 'error'} size="small">{row.status === '0' ? '正常' : '禁用'}</NTag> },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('base:businessType:edit') && <ButtonIcon text type="primary" icon="material-symbols:drive-file-rename-outline-outline" tooltipContent="编辑" onClick={() => handleEdit(row.id)} />}
            {hasAuth('base:businessType:remove') && <ButtonIcon text type="error" icon="material-symbols:delete-outline" tooltipContent="删除" popconfirmContent="确认删除该业务类型？" onPositiveClick={() => handleDelete(row.id)} />}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteBusinessType(checkedRowKeys.value);
  if (!error) onBatchDeleted();
}
async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteBusinessType([id]);
  if (!error) onDeleted();
}
function handleExport() {
  download('/base/business-type/export', searchParams.value, `业务类型数据_${new Date().getTime()}.xlsx`);
}
function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}
function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 10, keyword: null, businessCategory: null, operationFlowType: null, status: null, params: {} };
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="编码/名称"><NInput v-model:value="searchParams.keyword" clearable placeholder="业务类型编码或名称" class="w-180px" /></NFormItem>
        <NFormItem label="业务大类"><NSelect v-model:value="searchParams.businessCategory" :options="BUSINESS_CATEGORY_OPTIONS" clearable placeholder="全部" class="w-120px" /></NFormItem>
        <NFormItem label="流程类型"><NSelect v-model:value="searchParams.operationFlowType" :options="FLOW_OPTIONS" clearable placeholder="全部" class="w-120px" /></NFormItem>
        <NFormItem label="状态"><NSelect v-model:value="searchParams.status" :options="[{ label: '正常', value: '0' }, { label: '禁用', value: '1' }]" clearable placeholder="全部" class="w-100px" /></NFormItem>
        <NFormItem><NButton type="primary" @click="handleSearch">搜索</NButton><NButton class="ml-8px" @click="handleReset">重置</NButton></NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>
    <NCard title="业务类型管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :disabled-delete="checkedRowKeys.length === 0" :loading="loading" :show-add="hasAuth('base:businessType:add')" :show-delete="hasAuth('base:businessType:remove')" :show-export="hasAuth('base:businessType:export')" @add="handleAdd" @delete="handleBatchDelete" @export="handleExport" @refresh="getData" />
      </template>
      <DataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data" :flex-height="!appStore.isMobile" :scroll-x="scrollX" :loading="loading" remote :row-key="(row: Api.Base.BusinessType) => row.id" :pagination="mobilePagination" class="sm:h-full" />
      <BusinessTypeOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getDataByPage" />
    </NCard>
  </div>
</template>

