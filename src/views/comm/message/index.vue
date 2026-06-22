<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NInput, NSpace } from 'naive-ui';
import { fetchGetConversationList } from '@/service/api/comm';
import ConversationList from './modules/conversation-list.vue';
import ChatWindow from './modules/chat-window.vue';
import BusinessPanel from './modules/business-panel.vue';
import ChatOrderDetailDrawer from './modules/chat-order-detail-drawer.vue';

defineOptions({ name: 'CommMessage' });

const activeConversationId = ref<string | null>(null);
const conversations = ref<Api.Comm.Conversation[]>([]);

async function loadConversations() {
  const { data } = await fetchGetConversationList({ pageNum: 1, pageSize: 50 });
  conversations.value = (data as any)?.rows ?? [];
}

loadConversations();

const activeConversation = computed(() =>
  conversations.value.find(c => c.id === activeConversationId.value)
);

const bizDrawerVisible = ref(false);
const orderDetailVisible = ref(false);
const orderDetailNo = ref<string | null>(null);

function onSelectConversation(id: string) {
  activeConversationId.value = id;
}

function openBusinessPanel() {
  if (!activeConversationId.value) {
    window.$message?.warning('请先选择会话');
    return;
  }
  bizDrawerVisible.value = true;
}

function openOrderDetail(orderNo: string) {
  orderDetailNo.value = orderNo;
  orderDetailVisible.value = true;
}

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}
</script>

<template>
  <div class="comm-message-page">
    <div class="comm-topbar">
      <NInput placeholder="搜索联系人、订单号、车次号…" clearable class="comm-search" size="small" />
      <NSpace>
        <NButton size="small" @click="proto('新建聊天')">新建聊天</NButton>
        <NButton size="small" @click="proto('发起群聊')">发起群聊</NButton>
        <NButton size="small" type="primary" @click="proto('发起会议')">发起会议</NButton>
      </NSpace>
    </div>
    <div class="comm-workspace">
      <aside class="comm-col comm-col--list">
        <ConversationList :active-id="activeConversationId" @select="onSelectConversation" />
      </aside>
      <main class="comm-col comm-col--chat">
        <ChatWindow
          :conversation-id="activeConversationId"
          :conversation-name="activeConversation?.name"
          @open-business-panel="openBusinessPanel"
          @open-order-detail="openOrderDetail"
        />
      </main>
    </div>

    <BusinessPanel
      v-model:visible="bizDrawerVisible"
      :conversation-id="activeConversationId"
      @open-order-detail="openOrderDetail"
    />

    <ChatOrderDetailDrawer v-model:visible="orderDetailVisible" :order-no="orderDetailNo" />
  </div>
</template>

<style scoped>
.comm-message-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  max-height: 900px;
  min-height: 520px;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.comm-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
  background: #fafafa;
}

.comm-search {
  max-width: 360px;
  flex: 1;
}

.comm-workspace {
  display: flex;
  flex: 1;
  min-height: 0;
}

.comm-col {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.comm-col--list {
  width: 280px;
  flex-shrink: 0;
}

.comm-col--chat {
  flex: 1;
  min-width: 0;
}

@media (max-width: 1200px) {
  .comm-col--list {
    width: 240px;
  }
}
</style>
