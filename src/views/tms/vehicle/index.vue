<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NInput, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetTmsVehicleList } from '@/service/api/tms';

defineOptions({ name: 'TmsVehicle' });

const keyword = ref('');
const searchParams = ref({ pageNum: 1, pageSize: 10 });

const statusType: Record<string, NaiveUI.ThemeColor> = {
  AVAILABLE: 'success',
  IN_USE: 'info',
  IN_TRANSIT: 'primary',
  RESERVED: 'warning',
  MAINTENANCE: 'error',
  CHECKED_IN: 'info'
};

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTmsVehicleList({ ...searchParams.value, keyword: keyword.value || undefined }),
  transform: response => defaultTransform(response),
  columns: () => [
    { key: 'plateNo', title: '车牌号', width: 100 },
    { key: 'vehicleType', title: '车型', width: 88 },
    { key: 'maxPallet', title: '最大板数', width: 88, align: 'center' },
    { key: 'maxWeightLbs', title: '最大重量(lbs)', width: 110, align: 'right' },
    { key: 'supplierName', title: '所属供应商', width: 130 },
    {
      key: 'statusLabel',
      title: '状态',
      width: 88,
      render: row => <NTag size="small" type={statusType[row.status] ?? 'default'}>{row.statusLabel}</NTag>
    },
    { key: 'insuranceExpiry', title: '保险到期', width: 110 },
    { key: 'registrationExpiry', title: '年检到期', width: 110 },
    { key: 'currentDriver', title: '当前司机', width: 88, render: row => row.currentDriver ?? '—' },
    { key: 'currentTripNo', title: '当前车次', width: 120, render: row => row.currentTripNo ?? '—' }
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
      <div class="mb-8px text-16px font-semibold">车辆管理</div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex gap-8px">
            <NInput v-model:value="keyword" placeholder="车牌/车型" class="w-200px" clearable @keyup.enter="handleSearch" />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable :columns="columns" :data="data" :loading="loading" :row-key="(r: Api.Tms.Vehicle) => r.id" :scroll-x="1100" size="small" remote />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>
  </div>
</template>
