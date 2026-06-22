<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetSupplierList } from '@/service/api/tms/supplier';
import OmsListPage from '@/views/oms/components/oms-list-page.vue';
import SupplierDetailDrawer from './supplier-detail-drawer.vue';

const props = defineProps<{
  supplierType: Api.Oms.SupplierType;
  pageTitle: string;
  pageDescription: string;
  showOrderPortal?: boolean;
}>();

defineOptions({ name: 'TmsSupplierTypeList' });

const { record: statusRecord } = useDict('oms_supplier_status');

const searchParams = ref<Api.Oms.SupplierSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  supplierType: props.supplierType,
  status: null
});

const detailVisible = ref(false);
const currentId = ref<CommonType.IdType | null>(null);

function getText(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

function openDetail(row: Api.Oms.Supplier) {
  currentId.value = row.id;
  detailVisible.value = true;
}

const statusOptions = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' }
];

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetSupplierList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: ({ page, pageSize }) => {
      searchParams.value.pageNum = page;
      searchParams.value.pageSize = pageSize;
    },
    columns: () => [
      {
        key: 'supplierCode',
        title: '供应商编码',
        width: 130,
        fixed: 'left',
        render: row => (
          <span class="text-primary cursor-pointer hover:underline" onClick={() => openDetail(row)}>
            {row.supplierCode}
          </span>
        )
      },
      { key: 'supplierName', title: '供应商名称', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'contactName', title: '联系人', width: 100, render: row => getText(row.contactName) },
      { key: 'contactPhone', title: '联系电话', width: 130, render: row => getText(row.contactPhone) },
      { key: 'serviceRegion', title: '合作区域', width: 120, ellipsis: { tooltip: true }, render: row => getText(row.serviceRegion) },
      ...(props.showOrderPortal
        ? [
            {
              key: 'orderPortalUrl',
              title: '下单门户',
              minWidth: 180,
              ellipsis: { tooltip: true },
              render: (row: Api.Oms.Supplier) =>
                row.orderPortalUrl ? (
                  <a href={row.orderPortalUrl} target="_blank" rel="noopener noreferrer" class="text-primary">
                    {row.orderPortalUrl}
                  </a>
                ) : (
                  '--'
                )
            }
          ]
        : []),
      { key: 'serviceTerminals', title: '服务码头', width: 140, ellipsis: { tooltip: true }, render: row => getText(row.serviceTerminals) },
      { key: 'paymentTerms', title: '账期', width: 80, render: row => getText(row.paymentTerms) },
      {
        key: 'score',
        title: '评分',
        width: 70,
        align: 'center',
        render: row => (row.score != null ? <span class="text-amber-600 font-medium">{row.score}</span> : '--')
      },
      {
        key: 'status',
        title: '状态',
        width: 80,
        render: row => (
          <NTag size="small" type={(statusRecord.value[row.status]?.listClass as NaiveUI.ThemeColor) || 'default'}>
            {statusRecord.value[row.status]?.dictLabel || row.status}
          </NTag>
        )
      },
      {
        key: 'actions',
        title: '操作',
        width: 100,
        fixed: 'right',
        render: row => (
          <NButton text type="primary" size="small" onClick={() => openDetail(row)}>详情</NButton>
        )
      }
    ]
  });

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value.keyword = null;
  searchParams.value.status = null;
  handleSearch();
}

function handleAdd() {
  window.$message?.info('[原型] 新增供应商');
}
</script>

<template>
  <OmsListPage
    :filter-title="pageTitle"
    :filter-description="pageDescription"
    :content-title="`${pageTitle}列表`"
  >
    <template #filter-actions>
      <NButton type="primary" @click="handleAdd">新增</NButton>
    </template>

    <template #filters>
      <NForm inline :show-feedback="false" class="mt-12px">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="编码/名称/联系人" class="w-200px" @keydown.enter="handleSearch" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" clearable :options="statusOptions" placeholder="全部" class="w-120px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </template>

    <template #header-extra>
      <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getData" />
    </template>

    <NDataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :scroll-x="scrollX"
      :pagination="mobilePagination"
      remote
      size="small"
      class="min-h-0 flex-1"
      flex-height
    />

    <SupplierDetailDrawer v-model:visible="detailVisible" :supplier-id="currentId" />
  </OmsListPage>
</template>
