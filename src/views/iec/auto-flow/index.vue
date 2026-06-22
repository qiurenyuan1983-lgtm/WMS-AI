<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetIecAutoFlowList } from '@/service/api/iec';
import { FLOW_STATUS_META } from '../constants';

defineOptions({ name: 'IecAutoFlow' });

const loading = ref(false);
const rows = ref<Api.Iec.AutoFlow[]>([]);

const columns: DataTableColumns<Api.Iec.AutoFlow> = [
  { key: 'flowName', title: '流程名称', width: 180, ellipsis: { tooltip: true } },
  { key: 'triggerTypeLabel', title: '触发方式', width: 100 },
  { key: 'employeeName', title: '负责智能员工', width: 130 },
  { key: 'stepSummary', title: '执行步骤', minWidth: 220, ellipsis: { tooltip: true } },
  {
    key: 'status',
    title: '状态',
    width: 88,
    render: row => {
      const m = FLOW_STATUS_META[row.status];
      return <NTag size="small" type={m.type}>{m.label}</NTag>;
    }
  },
  { key: 'successRate', title: '成功率', width: 80, align: 'center', render: row => `${row.successRate}%` },
  { key: 'lastExecuteTime', title: '最后执行', width: 158, render: row => row.lastExecuteTime ?? '—' },
  {
    key: 'action',
    title: '操作',
    width: 140,
    fixed: 'right',
    render: () => (
      <NSpace size="small">
        <NButton size="tiny" onClick={() => proto('查看流程')}>查看</NButton>
        <NButton size="tiny" type="primary" onClick={() => proto('立即执行')}>执行</NButton>
      </NSpace>
    )
  }
];

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchGetIecAutoFlowList({ pageNum: 1, pageSize: 50 });
    rows.value = (data as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <NCard title="自动任务流程" :bordered="false" class="card-wrapper h-full flex flex-col">
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Api.Iec.AutoFlow) => r.id" size="small" :scroll-x="1100" flex-height class="flex-1" />
  </NCard>
</template>
