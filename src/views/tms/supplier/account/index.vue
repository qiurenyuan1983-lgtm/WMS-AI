<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetSupplierAccountList } from '@/service/api/tms/supplier';
import OmsListPage from '@/views/oms/components/oms-list-page.vue';

defineOptions({ name: 'TmsSupplierAccount' });

const { record: statusRecord } = useDict('oms_supplier_status');

const searchParams = ref<Api.Oms.SupplierAccountSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  status: null
});

const ROLE_LABEL: Record<string, string> = {
  TASK: '查看任务',
  BILL: '查看账单',
  DRIVER: '管理司机',
  VEHICLE: '管理车辆',
  QUOTE: '查看报价',
  EXCEPTION: '提交异常'
};

function getText(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

function roleTags(codes: string) {
  return codes.split(',').filter(Boolean).map(c => ROLE_LABEL[c] || c);
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetSupplierAccountList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: ({ page, pageSize }) => {
      searchParams.value.pageNum = page;
      searchParams.value.pageSize = pageSize;
    },
    columns: () => [
      { key: 'loginName', title: '登录账号', width: 140, fixed: 'left' },
      { key: 'supplierName', title: '所属供应商', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'contactName', title: '联系人', width: 100, render: row => getText(row.contactName) },
      { key: 'contactPhone', title: '联系电话', width: 130, render: row => getText(row.contactPhone) },
      {
        key: 'roleCodes',
        title: '权限',
        minWidth: 220,
        render: row => (
          <div class="flex flex-wrap gap-4px">
            {roleTags(row.roleCodes).map(label => (
              <NTag size="small" type="info">{label}</NTag>
            ))}
          </div>
        )
      },
      { key: 'lastLoginTime', title: '最近登录', width: 160, render: row => getText(row.lastLoginTime) },
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
        width: 120,
        fixed: 'right',
        render: () => (
          <NButton text type="primary" size="small" onClick={() => window.$message?.info('[原型] 编辑账号')}>编辑</NButton>
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

function handleAddAccount() {
  window.$message?.info('[原型] 新增账号');
}
</script>

<template>
  <OmsListPage
    filter-title="供应商账号权限管理"
    filter-description="配置供应商门户登录账号，控制任务、账单、报价、司机与车辆等权限范围。"
    content-title="账号列表"
  >
    <template #filter-actions>
      <NButton type="primary" @click="handleAddAccount">新增账号</NButton>
    </template>

    <template #filters>
      <NForm inline :show-feedback="false" class="mt-12px">
        <NFormItem label="关键字">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="账号/供应商" class="w-180px" @keydown.enter="handleSearch" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" clearable :options="[{ label: '启用', value: 'ENABLED' }, { label: '停用', value: 'DISABLED' }]" placeholder="全部" class="w-120px" />
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
