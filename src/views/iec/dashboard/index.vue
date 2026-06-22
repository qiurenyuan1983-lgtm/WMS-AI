<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NGi, NGrid, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetIecDashboardSummary, fetchGetIecEmployeeList } from '@/service/api/iec';
import { EMPLOYEE_STATUS_META } from '../constants';

defineOptions({ name: 'IecDashboard' });

const summary = ref<Api.Iec.DashboardSummary | null>(null);
const loading = ref(false);
const rows = ref<Api.Iec.IntelligentEmployee[]>([]);
const keyword = ref('');
const status = ref<string | null>(null);

const statusOptions = [
  { label: '全部状态', value: '' },
  ...Object.entries(EMPLOYEE_STATUS_META).map(([k, v]) => ({ label: v.label, value: k }))
];

const columns: DataTableColumns<Api.Iec.IntelligentEmployee> = [
  { key: 'employeeName', title: '智能员工', width: 140, fixed: 'left' },
  { key: 'roleTypeLabel', title: '岗位类型', width: 110 },
  {
    key: 'status',
    title: '当前状态',
    width: 96,
    render: row => {
      const m = EMPLOYEE_STATUS_META[row.status];
      return <NTag size="small" type={m.type}>{m.label}</NTag>;
    }
  },
  { key: 'todayTaskCount', title: '今日任务', width: 88, align: 'center' },
  {
    key: 'successRate',
    title: '成功率',
    width: 80,
    align: 'center',
    render: row => `${row.successRate}%`
  },
  { key: 'manualTakeoverCount', title: '人工接管', width: 88, align: 'center' },
  {
    key: 'avgDurationMinutes',
    title: '平均耗时',
    width: 96,
    render: row => `${row.avgDurationMinutes} 分`
  },
  { key: 'lastExecuteTime', title: '最近执行', width: 158, render: row => row.lastExecuteTime ?? '—' },
  {
    key: 'action',
    title: '操作',
    width: 160,
    fixed: 'right',
    render: row => (
      <NSpace size="small">
        <NButton size="tiny" onClick={() => proto(`查看 ${row.employeeName}`)}>详情</NButton>
        <NButton size="tiny" type="primary" onClick={() => proto(`分配任务给 ${row.employeeName}`)}>分配任务</NButton>
      </NSpace>
    )
  }
];

async function load() {
  loading.value = true;
  try {
    const [{ data: s }, { data: list }] = await Promise.all([
      fetchGetIecDashboardSummary(),
      fetchGetIecEmployeeList({ pageNum: 1, pageSize: 50, keyword: keyword.value || undefined, status: status.value || undefined })
    ]);
    summary.value = s ?? null;
    rows.value = (list as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

onMounted(load);
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">
    <NGrid v-if="summary" :cols="5" :x-gap="12" responsive="screen" class="flex-shrink-0">
      <NGi><NCard size="small" :bordered="false"><div class="kpi-val">{{ summary.totalEmployees }}</div><div class="kpi-lbl">智能员工</div></NCard></NGi>
      <NGi><NCard size="small" :bordered="false"><div class="kpi-val text-green-600">{{ summary.workingCount }}</div><div class="kpi-lbl">工作中</div></NCard></NGi>
      <NGi><NCard size="small" :bordered="false"><div class="kpi-val">{{ summary.todayTasks }}</div><div class="kpi-lbl">今日执行任务</div></NCard></NGi>
      <NGi><NCard size="small" :bordered="false"><div class="kpi-val">{{ summary.avgSuccessRate }}%</div><div class="kpi-lbl">平均成功率</div></NCard></NGi>
      <NGi><NCard size="small" :bordered="false"><div class="kpi-val text-orange-500">{{ summary.openTakeoverCount }}</div><div class="kpi-lbl">待人工接管</div></NCard></NGi>
    </NGrid>

    <NCard title="智能员工看板" :bordered="false" class="card-wrapper flex-1 overflow-hidden flex flex-col">
      <div class="mb-10px flex flex-wrap gap-8px">
        <NInput v-model:value="keyword" placeholder="搜索员工名称" clearable class="w-200px" @keyup.enter="load" />
        <NSelect v-model:value="status" :options="statusOptions" clearable class="w-140px" @update:value="load" />
        <NButton @click="load">刷新</NButton>
      </div>
      <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Api.Iec.IntelligentEmployee) => r.id" size="small" :scroll-x="1100" flex-height class="flex-1" />
    </NCard>
  </div>
</template>

<style scoped>
.kpi-val { font-size: 22px; font-weight: 700; }
.kpi-lbl { margin-top: 4px; font-size: 12px; color: #6b7280; }
</style>
