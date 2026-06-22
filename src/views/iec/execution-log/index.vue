<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NCard, NDataTable, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetIecExecutionLogList } from '@/service/api/iec';
import { LOG_STATUS_META } from '../constants';

defineOptions({ name: 'IecExecutionLog' });

const loading = ref(false);
const rows = ref<Api.Iec.ExecutionLog[]>([]);

const columns: DataTableColumns<Api.Iec.ExecutionLog> = [
  { key: 'executeTime', title: '时间', width: 158, fixed: 'left' },
  { key: 'employeeName', title: '智能员工', width: 120 },
  { key: 'flowName', title: '流程名称', width: 150, ellipsis: { tooltip: true } },
  { key: 'stepName', title: '执行步骤', width: 120 },
  { key: 'inputSummary', title: '输入数据', minWidth: 140, ellipsis: { tooltip: true } },
  { key: 'outputSummary', title: '输出结果', minWidth: 140, ellipsis: { tooltip: true } },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: row => {
      const m = LOG_STATUS_META[row.status];
      return <NTag size="small" type={m.type}>{m.label}</NTag>;
    }
  },
  { key: 'failReason', title: '失败原因', width: 130, render: row => row.failReason ?? '—' },
  { key: 'operator', title: '操作人', width: 88, render: row => row.operator ?? '系统' }
];

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchGetIecExecutionLogList({ pageNum: 1, pageSize: 50 });
    rows.value = (data as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <NCard title="执行日志" :bordered="false" class="card-wrapper h-full flex flex-col">
    <p class="text-13px text-gray-500 mb-12px">记录每次智能员工动作，满足审计与追溯要求。</p>
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Api.Iec.ExecutionLog) => r.id" size="small" :scroll-x="1200" flex-height class="flex-1" />
  </NCard>
</template>
