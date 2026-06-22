<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetSupplierQuoteList } from '@/service/api/tms/supplier';
import OmsListPage from '@/views/oms/components/oms-list-page.vue';

defineOptions({ name: 'TmsSupplierQuote' });

const { record: typeRecord } = useDict('oms_supplier_type');

const searchParams = ref<Api.Oms.SupplierQuoteSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  supplierType: null,
  status: null
});

const typeOptions = computed(() =>
  Object.entries(typeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function getText(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetSupplierQuoteList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: ({ page, pageSize }) => {
      searchParams.value.pageNum = page;
      searchParams.value.pageSize = pageSize;
    },
    columns: () => [
      { key: 'supplierName', title: '供应商', minWidth: 160, fixed: 'left', ellipsis: { tooltip: true } },
      {
        key: 'supplierType',
        title: '类型',
        width: 120,
        render: row => (
          <NTag size="small" type={(typeRecord.value[row.supplierType]?.listClass as NaiveUI.ThemeColor) || 'default'}>
            {typeRecord.value[row.supplierType]?.dictLabel || row.supplierType}
          </NTag>
        )
      },
      { key: 'feeTypeLabel', title: '费用类型', width: 120 },
      { key: 'terminalCode', title: '码头', width: 90, render: row => getText(row.terminalCode) },
      { key: 'warehouseName', title: '仓库', width: 100, render: row => getText(row.warehouseName) },
      { key: 'containerType', title: '柜型', width: 80, render: row => getText(row.containerType) },
      { key: 'destination', title: '目的地', width: 90, render: row => getText(row.destination) },
      {
        key: 'unitPrice',
        title: '单价',
        width: 90,
        align: 'right',
        render: row => `${row.currency} ${row.unitPrice}`
      },
      { key: 'effectiveFrom', title: '生效起', width: 110 },
      { key: 'effectiveTo', title: '生效止', width: 110, render: row => getText(row.effectiveTo) },
      { key: 'versionNo', title: '版本', width: 90 },
      {
        key: 'status',
        title: '状态',
        width: 80,
        render: row => (
          <NTag size="small" type={row.status === 'ACTIVE' ? 'success' : 'default'}>
            {row.status === 'ACTIVE' ? '生效' : row.status}
          </NTag>
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
  searchParams.value.supplierType = null;
  searchParams.value.status = null;
  handleSearch();
}

function handleAddQuote() {
  window.$message?.info('[原型] 新增报价');
}

function handleImportQuote() {
  window.$message?.info('[原型] 模板导入');
}
</script>

<template>
  <OmsListPage
    filter-title="供应商报价管理"
    filter-description="统一维护提柜、卡派、拆柜/装车供应商报价，支持按码头、仓库、柜型、目的地与生效日期自动匹配。"
    content-title="报价列表"
  >
    <template #filter-actions>
      <NButton type="primary" @click="handleAddQuote">新增报价</NButton>
      <NButton @click="handleImportQuote">模板导入</NButton>
    </template>

    <template #filters>
      <NForm inline :show-feedback="false" class="mt-12px">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="供应商/费用类型" class="w-180px" @keydown.enter="handleSearch" />
        </NFormItem>
        <NFormItem label="供应商类型">
          <NSelect v-model:value="searchParams.supplierType" clearable :options="typeOptions" placeholder="全部" class="w-150px" />
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
  </OmsListPage>
</template>
