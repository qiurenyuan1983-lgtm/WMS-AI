<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NInput, NTag } from 'naive-ui';
import { fetchGetPortalMessages, fetchSendPortalMessage } from '@/service/api/portal';

const props = defineProps<{
  conversationId: string | null;
  conversation?: Api.Portal.PortalConversation | null;
}>();

const draft = ref('');
const loading = ref(false);
const sending = ref(false);
const messages = ref<Api.Portal.PortalMessage[]>([]);

const title = computed(() => {
  if (!props.conversation) return '选择会话';
  return `${props.conversation.contactName} · ${props.conversation.title}`;
});

async function loadMessages() {
  if (!props.conversationId) {
    messages.value = [];
    return;
  }
  loading.value = true;
  const { data } = await fetchGetPortalMessages(props.conversationId);
  loading.value = false;
  messages.value = Array.isArray(data) ? data : [];
}

watch(() => props.conversationId, () => loadMessages(), { immediate: true });

async function sendText() {
  if (!props.conversationId || !draft.value.trim()) return;
  sending.value = true;
  const { data, error } = await fetchSendPortalMessage(props.conversationId, draft.value);
  sending.value = false;
  if (error) return;
  const result = data as { success: boolean; message: string };
  if (!result?.success) {
    window.$message?.warning(result?.message || '发送失败');
    return;
  }
  draft.value = '';
  await loadMessages();
}
</script>

<template>
  <div class="chat-root">
    <div class="chat-header">
      <div>
        <div class="chat-title">{{ title }}</div>
        <div v-if="conversation" class="chat-sub">
          <NTag size="tiny">{{ conversation.contactRole }}</NTag>
          <span v-if="conversation.orderNo">订单 {{ conversation.orderNo }}</span>
        </div>
      </div>
    </div>

    <div v-if="!conversationId" class="chat-empty">请从左侧选择会话，或发起新沟通</div>
    <div v-else-if="loading" class="chat-empty">加载消息…</div>
    <div v-else class="chat-messages">
      <div v-for="msg in messages" :key="msg.id" class="msg-row" :class="{ 'msg-row--self': msg.isSelf }">
        <div class="msg-bubble" :class="{ 'msg-bubble--self': msg.isSelf }">
          <div v-if="!msg.isSelf" class="msg-sender">{{ msg.senderName }} · {{ msg.senderRole }}</div>
          <div>{{ msg.content }}</div>
          <div class="msg-time">{{ msg.time }}</div>
        </div>
      </div>
    </div>

    <div v-if="conversationId" class="chat-input">
      <NInput
        v-model:value="draft"
        type="textarea"
        :rows="2"
        placeholder="输入消息…（仅发送给当前对接人）"
        @keydown.enter.exact.prevent="sendText"
      />
      <NButton type="primary" size="small" :loading="sending" :disabled="!draft.trim()" @click="sendText">发送</NButton>
    </div>
  </div>
</template>

<style scoped>
.chat-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}
.chat-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}
.chat-title {
  font-weight: 600;
}
.chat-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--n-text-color-3);
}
.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-3);
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.msg-row {
  display: flex;
}
.msg-row--self {
  justify-content: flex-end;
}
.msg-bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f4f4f5;
  font-size: 13px;
}
.msg-bubble--self {
  background: #e8f3ff;
}
.msg-sender {
  font-size: 11px;
  color: var(--n-text-color-3);
  margin-bottom: 4px;
}
.msg-time {
  font-size: 10px;
  color: var(--n-text-color-3);
  margin-top: 4px;
  text-align: right;
}
.chat-input {
  padding: 10px 16px;
  border-top: 1px solid var(--n-border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
</style>
