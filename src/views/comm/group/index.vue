<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NCard, NDataTable, NTag } from 'naive-ui';
import { fetchGetConversationList } from '@/service/api/comm';
import { CONVERSATION_TYPE_LABEL } from '../constants';

defineOptions({ name: 'CommGroup' });

const loading = ref(false);
const data = ref<Api.Comm.Conversation[]>([]);

onMounted(async () => {
  loading.value = true;
  const { data: res } = await fetchGetConversationList({ pageNum: 1, pageSize: 50 });
  const rows = (res as any)?.rows ?? [];
  data.value = rows.filter((r: Api.Comm.Conversation) => r.type === 'group' || r.memberCount);
  loading.value = false;
});

const columns = [
  { key: 'name', title: '群名称' },
  {
    key: 'type',
    title: '类型',
    render: (row: Api.Comm.Conversation) => CONVERSATION_TYPE_LABEL[row.type]
  },
  { key: 'memberCount', title: '成员数', render: (row: Api.Comm.Conversation) => row.memberCount ?? '—' },
  { key: 'lastMessage', title: '最新消息', ellipsis: { tooltip: true } },
  {
    key: 'unreadCount',
    title: '未读',
    render: (row: Api.Comm.Conversation) =>
      row.unreadCount ? h(NTag, { type: 'error', size: 'small' }, () => row.unreadCount) : '—'
  }
];
</script>

<template>
  <NCard title="群聊" size="small" class="card-wrapper sm:flex-1-hidden">
    <p class="text-sm text-gray-500 mb-12px">内部群、客户群、供应商群、异常群等；支持群公告、群文件、群待办（原型）。</p>
    <NDataTable :columns="columns" :data="data" :loading="loading" size="small" />
  </NCard>
</template>
