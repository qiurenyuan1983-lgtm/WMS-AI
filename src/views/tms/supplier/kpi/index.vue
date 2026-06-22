<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NCard, NForm, NFormItem, NInput, NSelect, NStatistic, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetSupplierKpiList, fetchGetSupplierKpiSummary } from '@/service/api/tms/supplier';
import OmsListPage from '@/views/oms/components/oms-list-page.vue';

defineOptions({ name: 'TmsSupplierKpi' });

const { record: typeRecord } = useDict('oms_supplier_type');

const summary = ref<Api.Oms.SupplierKpiSummary>({
  totalSuppliers: 0,
  drayageCount: 0,
  linehaulCount: 0,
  devanningLoadingCount: 0,
  pendingBills: 0,
  avgScore: 0
});

const searchParams = ref<Api.Oms.SupplierKpiSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  supplierType: null,
  statMonth: '2026-05'
});

const typeOptions = computed(() =>
  Object.entries(typeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function pct(v: number | null | undefined) {
  return v == null ? '--' : `${v}%`;
}

async function loadSummary() {
  const { data } = await fetchGetSupplierKpiSummary();
  if (data) summary.value = data;
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetSupplierKpiList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: ({ page, pageSize }) => {
      searchParams.value.pageNum = page;
      searchParams.value.pageSize = pageSize;
    },
    columns: () => [
      { key: 'supplierName', title: '供应商', minWidth: 180, fixed: 'left', ellipsis: { tooltip: true } },
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
      { key: 'statMonth', title: '月份', width: 90 },
      { key: 'warehouseName', title: '仓库', width: 100 },
      {
        key: 'kpi1',
        title: '核心指标1',
        width: 110,
        render: row => pct(row.onTimePickupRate ?? row.onTimeArrivalRate ?? row.onTimeFinishRate)
      },
      {
        key: 'kpi2',
        title: '核心指标2',
        width: 110,
        render: row => pct(row.onTimeReturnRate ?? row.onTimeDeliveryRate ?? row.devanningEfficiency)
      },
      {
        key: 'kpi3',
        title: '核心指标3',
        width: 110,
        render: row => pct(row.gpsOnlineRate ?? row.podUploadRate ?? row.loadingEfficiency)
      },
      {
        key: 'exceptionRate',
        title: '异常率',
        width: 90,
        render: row => pct(row.exceptionRate ?? row.siteExceptionRate)
      },
      {
        key: 'score',
        title: '综合评分',
        width: 90,
        align: 'center',
        render: row => (row.score != null ? <span class="text-amber-600 font-semibold">{row.score}</span> : '--')
      }
    ]
  });

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

onMounted(() => {
  loadSummary();
  getDataByPage();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <div class="grid grid-cols-2 gap-12px md:grid-cols-3 lg:grid-cols-6 flex-shrink-0">
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NStatistic label="合作供应商" :value="summary.totalSuppliers" />
      </NCard>
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NStatistic label="提柜供应商" :value="summary.drayageCount" />
      </NCard>
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NStatistic label="卡派供应商" :value="summary.linehaulCount" />
      </NCard>
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NStatistic label="拆柜/装车" :value="summary.devanningLoadingCount" />
      </NCard>
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NStatistic label="待审账单" :value="summary.pendingBills" />
      </NCard>
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NStatistic label="平均评分" :value="summary.avgScore" :precision="1" />
      </NCard>
    </div>

    <OmsListPage
      filter-title="供应商绩效看板"
      filter-description="按供应商、业务类型、月份与仓库维度评估准时率、异常率、GPS 在线率与服务评分。"
      content-title="绩效明细"
      class="flex-1 min-h-0"
    >
      <template #filters>
        <NForm inline :show-feedback="false" class="mt-12px">
          <NFormItem label="关键字">
            <NInput v-model:value="searchParams.keyword" clearable placeholder="供应商名称" class="w-180px" @keydown.enter="handleSearch" />
          </NFormItem>
          <NFormItem label="类型">
            <NSelect v-model:value="searchParams.supplierType" clearable :options="typeOptions" placeholder="全部" class="w-150px" />
          </NFormItem>
          <NFormItem label="月份">
            <NInput v-model:value="searchParams.statMonth" placeholder="2026-05" class="w-110px" />
          </NFormItem>
          <NFormItem>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
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
  </div>
</template>
