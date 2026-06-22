<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NInput, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetTmsDriverList } from '@/service/api/tms';

defineOptions({ name: 'TmsDriver' });

const keyword = ref('');
const searchParams = ref({ pageNum: 1, pageSize: 10 });

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTmsDriverList({ ...searchParams.value, keyword: keyword.value || undefined }),
  transform: response => defaultTransform(response),
  columns: () => [
    { key: 'driverName', title: '司机姓名', width: 100 },
    { key: 'phone', title: '手机号', width: 140 },
    { key: 'supplierName', title: '所属供应商', width: 130 },
    { key: 'licenseNo', title: '驾照', width: 130 },
    {
      key: 'statusLabel',
      title: '当前状态',
      width: 100,
      render: row => <NTag size="small" type={row.status === 'EXCEPTION' ? 'error' : row.status === 'IDLE' ? 'success' : 'info'}>{row.statusLabel}</NTag>
    },
    { key: 'currentTripNo', title: '当前车次', width: 120, render: row => row.currentTripNo ?? '—' },
    {
      key: 'gpsOnline',
      title: 'GPS',
      width: 72,
      align: 'center',
      render: row => <NTag size="small" type={row.gpsOnline ? 'success' : 'default'}>{row.gpsOnline ? '在线' : '离线'}</NTag>
    },
    { key: 'checkinTime', title: 'Check-in', width: 150, render: row => row.checkinTime ?? '—' },
    {
      key: 'kpi',
      title: '评分',
      width: 120,
      render: row => `准时 ${row.onTimeRate}% / 异常 ${row.exceptionRate}%`
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
      <div class="mb-8px text-16px font-semibold">司机管理</div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex gap-8px">
            <NInput v-model:value="keyword" placeholder="姓名/手机/车次" class="w-220px" clearable @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable :columns="columns" :data="data" :loading="loading" :row-key="(r: Api.Tms.Driver) => r.id" :scroll-x="1100" size="small" remote />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>
  </div>
</template>
