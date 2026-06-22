<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetIecTaskQueueList, fetchIecTaskAction } from '@/service/api/iec';
import { TASK_STATUS_META } from '../constants';

defineOptions({ name: 'IecTaskQueue' });

const loading = ref(false);
const rows = ref<Api.Iec.ExecutionTask[]>([]);
const status = ref<string | null>(null);

const statusOptions = [
  { label: '全部', value: '' },
  ...Object.entries(TASK_STATUS_META).map(([k, v]) => ({ label: v.label, value: k }))
];

const columns: DataTableColumns<Api.Iec.ExecutionTask> = [
  { key: 'taskNo', title: '任务编号', width: 150, fixed: 'left' },
  { key: 'employeeName', title: '智能员工', width: 120 },
  { key: 'taskType', title: '任务类型', width: 100 },
  { key: 'relatedDocNo', title: '关联单据', width: 130 },
  { key: 'currentStep', title: '当前步骤', width: 110 },
  {
    key: 'status',
    title: '执行状态',
    width: 100,
    render: row => {
      const m = TASK_STATUS_META[row.status];
      return <NTag size="small" type={m.type}>{m.label}</NTag>;
    }
  },
  { key: 'startTime', title: '开始时间', width: 150, render: row => row.startTime ?? '—' },
  { key: 'finishTime', title: '完成时间', width: 150, render: row => row.finishTime ?? '—' },
  { key: 'failReason', title: '失败原因', minWidth: 140, ellipsis: { tooltip: true }, render: row => row.failReason ?? '—' },
  {
    key: 'action',
    title: '操作',
    width: 200,
    fixed: 'right',
    render: row => (
      <NSpace size="small">
        <NButton size="tiny" onClick={() => proto(`详情 ${row.taskNo}`)}>详情</NButton>
        {['FAILED', 'CANCELLED'].includes(row.status) && (
          <NButton size="tiny" type="primary" onClick={() => doAction(row.id, 'retry')}>重试</NButton>
        )}
        {row.status === 'WAITING_MANUAL' && (
          <NButton size="tiny" type="warning" onClick={() => doAction(row.id, 'takeover')}>人工接管</NButton>
        )}
        {!['SUCCESS', 'CANCELLED'].includes(row.status) && (
          <NButton size="tiny" type="error" secondary onClick={() => doAction(row.id, 'cancel')}>取消</NButton>
        )}
      </NSpace>
    )
  }
];

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchGetIecTaskQueueList({ pageNum: 1, pageSize: 50, status: status.value || undefined });
    rows.value = (data as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

async function doAction(id: number, action: string) {
  const { data } = await fetchIecTaskAction(id, action);
  window.$message?.success((data as any)?.message ?? '完成');
  await load();
}

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

onMounted(load);
</script>

<template>
  <NCard title="执行任务队列" :bordered="false" class="card-wrapper h-full flex flex-col">
    <div class="mb-10px">
      <NSelect v-model:value="status" :options="statusOptions" class="w-160px" @update:value="load" />
    </div>
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Api.Iec.ExecutionTask) => r.id" size="small" :scroll-x="1300" flex-height class="flex-1" />
  </NCard>
</template>
