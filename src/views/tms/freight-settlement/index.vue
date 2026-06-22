<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NSelect, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetTmsFreightList } from '@/service/api/tms';

defineOptions({ name: 'TmsFreightSettlement' });

const payStatus = ref<string | null>(null);
const searchParams = ref({ pageNum: 1, pageSize: 10 });

const payOptions = [
  { label: '未审核', value: 'PENDING' },
  { label: '已审核', value: 'AUDITED' },
  { label: '已对账', value: 'RECONCILED' },
  { label: '已付款', value: 'PAID' }
];

const payType: Record<string, NaiveUI.ThemeColor> = {
  PENDING: 'default',
  AUDITED: 'info',
  RECONCILED: 'warning',
  PAID: 'success'
};

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTmsFreightList({ ...searchParams.value, payStatus: payStatus.value ?? undefined }),
  transform: response => defaultTransform(response),
  columns: () => [
    { key: 'tripNo', title: '车次号', width: 120 },
    { key: 'supplierName', title: '供应商', width: 130 },
    { key: 'linehaul', title: '基础运费', width: 100, align: 'right', render: row => `$${row.linehaul}` },
    { key: 'accessorial', title: '附加费', width: 88, align: 'right', render: row => `$${row.accessorial}` },
    { key: 'insurance', title: '保险费', width: 88, align: 'right', render: row => `$${row.insurance}` },
    { key: 'otherFee', title: '其他', width: 80, align: 'right', render: row => `$${row.otherFee}` },
    { key: 'totalFee', title: '总费用', width: 100, align: 'right', render: row => `$${row.totalFee}` },
    {
      key: 'payStatusLabel',
      title: '应付状态',
      width: 100,
      render: row => <NTag size="small" type={payType[row.payStatus] ?? 'default'}>{row.payStatusLabel}</NTag>
    },
    { key: 'invoiceNo', title: '发票号', width: 150, render: row => row.invoiceNo ?? '—' },
    {
      key: 'action',
      title: '操作',
      width: 120,
      fixed: 'right',
      render: () => <NButton size="tiny" type="primary">审核</NButton>
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
      <div class="mb-8px">
        <span class="text-16px font-semibold">运费结算</span>
        <span class="text-13px text-gray-500 ml-8px">计费确认 · 审核对账 · 付款</span>
      </div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex gap-8px">
            <NSelect v-model:value="payStatus" :options="payOptions" placeholder="应付状态" class="w-140px" clearable />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable :columns="columns" :data="data" :loading="loading" :row-key="(r: Api.Tms.FreightRecord) => r.id" :scroll-x="1100" size="small" remote />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>
  </div>
</template>
