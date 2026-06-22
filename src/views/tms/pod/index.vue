<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NSelect, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetTmsPodList } from '@/service/api/tms';

defineOptions({ name: 'TmsPod' });

const auditStatus = ref<string | null>(null);
const searchParams = ref({ pageNum: 1, pageSize: 10 });

const auditOptions = [
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '驳回', value: 'REJECTED' }
];

const auditType: Record<string, NaiveUI.ThemeColor> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
};

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTmsPodList({ ...searchParams.value, auditStatus: auditStatus.value ?? undefined }),
  transform: response => defaultTransform(response),
  columns: () => [
    { key: 'tripNo', title: '车次号', width: 120 },
    { key: 'omsOrderNo', title: '订单号', width: 130 },
    { key: 'destination', title: '目的地', width: 140, ellipsis: { tooltip: true } },
    { key: 'deliveredTime', title: '签收时间', width: 150, render: row => row.deliveredTime ?? '—' },
    { key: 'receiver', title: '签收人', width: 120, render: row => row.receiver ?? '—' },
    { key: 'uploadSource', title: '上传来源', width: 110 },
    {
      key: 'auditStatusLabel',
      title: '审核状态',
      width: 100,
      render: row => <NTag size="small" type={auditType[row.auditStatus] ?? 'default'}>{row.auditStatusLabel}</NTag>
    },
    { key: 'fileName', title: 'POD文件', width: 160, render: row => row.fileName ?? '—' },
    { key: 'createTime', title: '上传时间', width: 150 },
    {
      key: 'action',
      title: '操作',
      width: 140,
      fixed: 'right',
      render: () => (
        <>
          <NButton size="tiny" class="mr-4px">查看</NButton>
          <NButton size="tiny" type="primary">审核</NButton>
        </>
      )
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
        <span class="text-16px font-semibold">POD 回传</span>
        <span class="text-13px text-gray-500 ml-8px">签收证明上传与人工复核</span>
      </div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <div class="flex gap-8px">
            <NSelect v-model:value="auditStatus" :options="auditOptions" placeholder="审核状态" class="w-140px" clearable />
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="getData">刷新</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable :columns="columns" :data="data" :loading="loading" :row-key="(r: Api.Tms.PodRecord) => r.id" :scroll-x="1200" size="small" remote />
      <div class="mt-12px flex justify-end"><NPagination v-bind="mobilePagination" /></div>
    </NCard>
  </div>
</template>
