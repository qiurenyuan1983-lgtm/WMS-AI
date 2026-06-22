<script setup lang="ts">
import { computed, ref } from 'vue';
import { NAlert, NButton, NSpace } from 'naive-ui';
import { fetchGetPortalContacts, fetchGetPortalConversations } from '@/service/api/portal';
import ContactCards from './modules/contact-cards.vue';
import ConversationList from './modules/conversation-list.vue';
import ChatWindow from './modules/chat-window.vue';
import BizPanel from './modules/biz-panel.vue';
import CreateConversationModal from './modules/create-conversation-modal.vue';

defineOptions({ name: 'PortalComm' });

const contacts = ref<Api.Portal.AssignedContact[]>([]);
const conversations = ref<Api.Portal.PortalConversation[]>([]);
const activeConversationId = ref<string | null>(null);
const listLoading = ref(false);
const showCreate = ref(false);
const listFilter = ref<{ category?: string; keyword?: string }>({});

const activeConversation = computed(() =>
  conversations.value.find(c => c.id === activeConversationId.value) ?? null
);

async function loadContacts() {
  const { data } = await fetchGetPortalContacts();
  contacts.value = Array.isArray(data) ? data : [];
}

async function loadConversations() {
  listLoading.value = true;
  const params: Record<string, string> = {};
  if (listFilter.value.category && listFilter.value.category !== 'all') {
    params.category = listFilter.value.category;
  }
  if (listFilter.value.keyword) params.keyword = listFilter.value.keyword;
  const { data } = await fetchGetPortalConversations({ pageNum: 1, pageSize: 50, ...params });
  listLoading.value = false;
  conversations.value = (data as any)?.rows ?? [];
}

function onFilterChange(v: string) {
  if (v.startsWith('kw:')) {
    listFilter.value = { keyword: v.slice(3) };
  } else {
    listFilter.value = { category: v };
  }
  loadConversations();
}

function onConversationCreated(conv: Api.Portal.PortalConversation) {
  conversations.value.unshift(conv);
  activeConversationId.value = conv.id;
}

loadContacts();
loadConversations();
</script>

<template>
  <div class="portal-comm">
    <NAlert type="info" :bordered="false" class="portal-comm__alert">
      沟通中心为一对一客服/调度沟通，非内部群聊。您无法直接联系仓库、财务、司机或供应商。
    </NAlert>

    <div class="portal-comm__contacts">
      <ContactCards :contacts="contacts" />
    </div>

    <div class="portal-comm__toolbar">
      <NSpace>
        <NButton type="primary" size="small" @click="showCreate = true">发起沟通</NButton>
      </NSpace>
    </div>

    <div class="portal-comm__workspace">
      <aside class="portal-comm__col portal-comm__col--list">
        <ConversationList
          :conversations="conversations"
          :active-id="activeConversationId"
          :loading="listLoading"
          @select="activeConversationId = $event"
          @filter-change="onFilterChange"
        />
      </aside>
      <main class="portal-comm__col portal-comm__col--chat">
        <ChatWindow :conversation-id="activeConversationId" :conversation="activeConversation" />
      </main>
      <aside class="portal-comm__col portal-comm__col--biz">
        <BizPanel :conversation-id="activeConversationId" />
      </aside>
    </div>

    <CreateConversationModal
      v-model:show="showCreate"
      :contacts="contacts"
      @created="onConversationCreated"
    />
  </div>
</template>

<style scoped>
.portal-comm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 120px);
  max-height: 920px;
  min-height: 520px;
}
.portal-comm__alert {
  flex-shrink: 0;
}
.portal-comm__contacts {
  flex-shrink: 0;
}
.portal-comm__toolbar {
  flex-shrink: 0;
}
.portal-comm__workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  background: #fff;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
}
.portal-comm__col {
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.portal-comm__col--list {
  width: 280px;
  flex-shrink: 0;
}
.portal-comm__col--chat {
  flex: 1;
  min-width: 0;
}
.portal-comm__col--biz {
  width: 260px;
  flex-shrink: 0;
}
@media (max-width: 1200px) {
  .portal-comm__col--biz {
    display: none;
  }
}
</style>
