<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NInput, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetTmsLogList } from '@/service/api/tms';

defineOptions({ name: 'TmsLog' });

const module = ref('');
const searchParams = ref({ pageNum: 1, pageSize: 10 });

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTmsLogList({ ...searchParams.value, module: module.value || undefined }),
  transform: response => defaultTransform(response),
  columns: () => [
    { key: 'createTime', title: '时间', width: 150 },
    {
      key: 'module',
      title: '模块',
      width: 120,
      render: row => <NTag size="small" bordered={false}>{row.module}</NTag>
    },
    { key: 'tripNo', title: '车次号', width: 120, render: row => row.tripNo ?? '—' },
    { key: 'operator', title: '操作人', width: 100 },
    { key: 'action', title: '操作', width: 120 },
    { key: 'detail', title: '详情', minWidth: 240, ellipsis: { tooltip: true } }
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
      <div class="mb-8px text-16px font-semibold">TMS 日志</div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex gap-8px">
            <NInput v-model:value="module" placeholder="模块筛选" class="w-180px" clearable @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable :columns="columns" :data="data" :loading="loading" :row-key="(r: Api.Tms.TmsLog) => r.id" :scroll-x="900" size="small" remote />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>
  </div>
</template>
