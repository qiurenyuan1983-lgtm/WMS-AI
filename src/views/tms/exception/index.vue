<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NSelect, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetTmsExceptionList } from '@/service/api/tms';

defineOptions({ name: 'TmsException' });

const status = ref<string | null>(null);
const searchParams = ref({ pageNum: 1, pageSize: 10 });

const statusOptions = [
  { label: '处理中', value: 'OPEN' },
  { label: '已关闭', value: 'CLOSED' }
];

const severityType: Record<string, NaiveUI.ThemeColor> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info'
};

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTmsExceptionList({ ...searchParams.value, status: status.value ?? undefined }),
  transform: response => defaultTransform(response),
  columns: () => [
    { key: 'tripNo', title: '车次号', width: 120 },
    { key: 'exceptionType', title: '异常类型', width: 100 },
    {
      key: 'severity',
      title: '严重程度',
      width: 88,
      render: row => <NTag size="small" type={severityType[row.severity] ?? 'default'}>{row.severity}</NTag>
    },
    { key: 'description', title: '描述', minWidth: 200, ellipsis: { tooltip: true } },
    {
      key: 'statusLabel',
      title: '状态',
      width: 88,
      render: row => <NTag size="small" type={row.status === 'OPEN' ? 'warning' : 'default'}>{row.statusLabel}</NTag>
    },
    { key: 'handler', title: '处理人', width: 100, render: row => row.handler ?? '—' },
    { key: 'createTime', title: '创建时间', width: 150 },
    {
      key: 'action',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: () => <NButton size="tiny" type="primary">处理</NButton>
    }
  ]
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

onMounted(getData);
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="mb-8px text-16px font-semibold">运输异常</div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex gap-8px">
            <NSelect v-model:value="status" :options="statusOptions" placeholder="状态" class="w-120px" clearable />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable :columns="columns" :data="data" :loading="loading" :row-key="(r: Api.Tms.Exception) => r.id" :scroll-x="1000" size="small" remote />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>
  </div>
</template>
