<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetIecTakeoverList, fetchIecTakeoverAction } from '@/service/api/iec';
import { TAKEOVER_STATUS_META } from '../constants';

defineOptions({ name: 'IecTakeover' });

const loading = ref(false);
const rows = ref<Api.Iec.TakeoverTask[]>([]);

const columns: DataTableColumns<Api.Iec.TakeoverTask> = [
  { key: 'takeoverNo', title: '接管单号', width: 140, fixed: 'left' },
  { key: 'employeeName', title: '智能员工', width: 120 },
  { key: 'reasonLabel', title: '异常原因', width: 130 },
  { key: 'relatedDocNo', title: '关联单据', width: 130 },
  { key: 'description', title: '说明', minWidth: 200, ellipsis: { tooltip: true } },
  {
    key: 'status',
    title: '状态',
    width: 96,
    render: row => {
      const m = TAKEOVER_STATUS_META[row.status];
      return <NTag size="small" type={m.type}>{m.label}</NTag>;
    }
  },
  { key: 'createTime', title: '创建时间', width: 158 },
  { key: 'handler', title: '处理人', width: 88, render: row => row.handler ?? '—' },
  {
    key: 'action',
    title: '操作',
    width: 240,
    fixed: 'right',
    render: row => (
      <NSpace size="small">
        {row.status === 'OPEN' && <NButton size="tiny" type="primary" onClick={() => act(row.id, 'claim')}>接管</NButton>}
        {row.status === 'IN_PROGRESS' && <NButton size="tiny" onClick={() => act(row.id, 'resolve')}>处理完成</NButton>}
        {['IN_PROGRESS', 'RESOLVED'].includes(row.status) && (
          <NButton size="tiny" type="success" onClick={() => act(row.id, 'continue')}>继续执行</NButton>
        )}
        <NButton size="tiny" type="error" secondary onClick={() => act(row.id, 'close')}>关闭</NButton>
      </NSpace>
    )
  }
];

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchGetIecTakeoverList({ pageNum: 1, pageSize: 50 });
    rows.value = (data as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

async function act(id: number, action: string) {
  const { data } = await fetchIecTakeoverAction(id, action);
  window.$message?.success((data as any)?.message ?? '完成');
  await load();
}

onMounted(load);
</script>

<template>
  <NCard title="人工接管中心" :bordered="false" class="card-wrapper h-full flex flex-col">
    <p class="text-13px text-gray-500 mb-12px">智能员工遇到验证码、缺字段、报价异常等情况时，由此处人工处理后继续流程。</p>
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Api.Iec.TakeoverTask) => r.id" size="small" :scroll-x="1200" flex-height class="flex-1" />
  </NCard>
</template>
