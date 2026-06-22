<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NCard, NDataTable, NTag } from 'naive-ui';
import { fetchGetCommTodoList } from '@/service/api/comm';

defineOptions({ name: 'CommTodo' });

const loading = ref(false);
const data = ref<Api.Comm.CommTodo[]>([]);

onMounted(async () => {
  loading.value = true;
  const { data: res } = await fetchGetCommTodoList({ pageNum: 1, pageSize: 20 });
  data.value = (res as any)?.rows ?? [];
  loading.value = false;
});

const columns = [
  { key: 'title', title: '待办标题', ellipsis: { tooltip: true } },
  { key: 'source', title: '来源', width: 100 },
  { key: 'assignee', title: '责任人', width: 90 },
  { key: 'bizNo', title: '关联单号', width: 140 },
  { key: 'dueTime', title: '截止时间', width: 160 },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (row: Api.Comm.CommTodo) =>
      h(NTag, { type: row.status === 'done' ? 'success' : 'warning', size: 'small' }, () =>
        row.status === 'done' ? '已完成' : '待处理'
      )
  }
];
</script>

<template>
  <NCard title="待办" size="small" class="card-wrapper sm:flex-1-hidden">
    <p class="text-sm text-gray-500 mb-12px">支持从聊天消息一键转为待办，并指派责任人与截止时间。</p>
    <NDataTable :columns="columns" :data="data" :loading="loading" size="small" />
  </NCard>
</template>
