<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NCard, NDataTable, NTag } from 'naive-ui';
import { fetchGetConversationList } from '@/service/api/comm';

defineOptions({ name: 'CommBusinessSession' });

const loading = ref(false);
const data = ref<Api.Comm.Conversation[]>([]);

const bizTypes = ['order', 'trip', 'exception', 'bill', 'customer', 'supplier', 'driver'];

onMounted(async () => {
  loading.value = true;
  const { data: res } = await fetchGetConversationList({ pageNum: 1, pageSize: 50 });
  const rows = (res as any)?.rows ?? [];
  data.value = rows.filter((r: Api.Comm.Conversation) => r.hasBizLink || bizTypes.includes(r.type));
  loading.value = false;
});

const columns = [
  { key: 'name', title: '会话' },
  { key: 'bizId', title: '业务单号', render: (row: Api.Comm.Conversation) => row.bizId || '—' },
  {
    key: 'bizType',
    title: '业务类型',
    render: (row: Api.Comm.Conversation) => (row.bizType ? h(NTag, { size: 'small', type: 'info' }, () => row.bizType) : '—')
  },
  { key: 'lastMessage', title: '最新消息', ellipsis: { tooltip: true } },
  { key: 'lastTime', title: '时间', width: 80 }
];
</script>

<template>
  <NCard title="业务会话" size="small" class="card-wrapper sm:flex-1-hidden">
    <p class="text-sm text-gray-500 mb-12px">订单、车次、异常、账单等业务自动关联的会话入口。</p>
    <NDataTable :columns="columns" :data="data" :loading="loading" size="small" />
  </NCard>
</template>
