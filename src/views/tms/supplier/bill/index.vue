<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetSupplierBillList } from '@/service/api/tms/supplier';
import OmsListPage from '@/views/oms/components/oms-list-page.vue';

defineOptions({ name: 'TmsSupplierBill' });

const { record: typeRecord } = useDict('oms_supplier_type');
const { record: billStatusRecord } = useDict('oms_supplier_bill_status');

const searchParams = ref<Api.Oms.SupplierBillSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  supplierType: null,
  billStatus: null
});

const typeOptions = computed(() =>
  Object.entries(typeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

const billStatusOptions = computed(() =>
  Object.entries(billStatusRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function getText(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetSupplierBillList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: ({ page, pageSize }) => {
      searchParams.value.pageNum = page;
      searchParams.value.pageSize = pageSize;
    },
    columns: () => [
      { key: 'billNo', title: '账单号', width: 150, fixed: 'left' },
      { key: 'supplierName', title: '供应商', minWidth: 160, ellipsis: { tooltip: true } },
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
      { key: 'sourceTaskNo', title: '来源任务', width: 130, render: row => getText(row.sourceTaskNo) },
      { key: 'sourceRefNo', title: '柜号/车次', width: 130, render: row => getText(row.sourceRefNo) },
      {
        key: 'billAmount',
        title: '金额',
        width: 100,
        align: 'right',
        render: row => `${row.currency} ${row.billAmount}`
      },
      {
        key: 'billStatus',
        title: '状态',
        width: 120,
        render: row => (
          <NTag size="small" type={(billStatusRecord.value[row.billStatus]?.listClass as NaiveUI.ThemeColor) || 'default'}>
            {billStatusRecord.value[row.billStatus]?.dictLabel || row.billStatus}
          </NTag>
        )
      },
      { key: 'submitTime', title: '提交时间', width: 160, render: row => getText(row.submitTime) },
      {
        key: 'actions',
        title: '操作',
        width: 140,
        fixed: 'right',
        render: () => (
          <div class="flex gap-4px">
            <NButton text type="primary" size="small" onClick={() => window.$message?.info('[原型] 审核')}>审核</NButton>
            <NButton text size="small" onClick={() => window.$message?.info('[原型] 导出')}>导出</NButton>
          </div>
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
  searchParams.value.billStatus = null;
  handleSearch();
}
</script>

<template>
  <OmsListPage
    filter-title="供应商账单管理"
    filter-description="任务完成后自动生成应付账单草稿，支持供应商确认、调度/仓库/财务多级审批与导出。"
    content-title="账单列表"
  >
    <template #filters>
      <NForm inline :show-feedback="false" class="mt-12px">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="账单号/供应商/柜号车次" class="w-200px" @keydown.enter="handleSearch" />
        </NFormItem>
        <NFormItem label="供应商类型">
          <NSelect v-model:value="searchParams.supplierType" clearable :options="typeOptions" placeholder="全部" class="w-150px" />
        </NFormItem>
        <NFormItem label="账单状态">
          <NSelect v-model:value="searchParams.billStatus" clearable :options="billStatusOptions" placeholder="全部" class="w-140px" />
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
