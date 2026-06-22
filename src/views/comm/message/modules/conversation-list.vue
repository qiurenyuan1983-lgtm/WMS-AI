<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NBadge, NInput, NTabPane, NTabs, NTag } from 'naive-ui';
import { CONVERSATION_TABS, CONVERSATION_TYPE_LABEL } from '../../constants';
import { fetchGetConversationList } from '@/service/api/comm';

const props = defineProps<{
  activeId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const activeTab = ref('all');
const keyword = ref('');
const loading = ref(false);
const conversations = ref<Api.Comm.Conversation[]>([]);

async function loadList() {
  loading.value = true;
  const { data } = await fetchGetConversationList({
    tab: activeTab.value,
    keyword: keyword.value || undefined,
    pageNum: 1,
    pageSize: 50
  });
  loading.value = false;
  conversations.value = (data as any)?.rows ?? (Array.isArray(data) ? data : []);
}

watch([activeTab, keyword], () => loadList(), { immediate: true });

watch(
  () => conversations.value,
  list => {
    if (!props.activeId && list.length) emit('select', list[0].id);
  },
  { immediate: true }
);

function typePrefix(type: Api.Comm.ConversationType) {
  const label = CONVERSATION_TYPE_LABEL[type];
  return label === '单聊' ? '' : `[${label}]`;
}
</script>

<template>
  <div class="conv-list-root">
    <NTabs v-model:value="activeTab" type="line" size="small" class="conv-tabs" animated>
      <NTabPane v-for="tab in CONVERSATION_TABS" :key="tab.key" :name="tab.key" :tab="tab.label" />
    </NTabs>
    <div class="conv-search">
      <NInput v-model:value="keyword" size="small" placeholder="搜索会话" clearable />
    </div>
    <div v-if="loading" class="conv-loading">加载中…</div>
    <div v-else class="conv-scroll">
      <button
        v-for="item in conversations"
        :key="item.id"
        type="button"
        class="conv-item"
        :class="{ 'conv-item--active': activeId === item.id }"
        @click="emit('select', item.id)"
      >
        <div class="conv-avatar" :style="{ background: item.avatarColor || '#64748b' }">
          {{ item.avatarText }}
        </div>
        <div class="conv-body">
          <div class="conv-top">
            <span class="conv-name">
              <span v-if="typePrefix(item.type)" class="conv-type">{{ typePrefix(item.type) }}</span>
              {{ item.name }}
            </span>
            <span class="conv-time">{{ item.lastTime }}</span>
          </div>
          <div class="conv-bottom">
            <span class="conv-preview">{{ item.lastMessage }}</span>
            <NBadge v-if="item.unreadCount" :value="item.unreadCount" :max="99" />
          </div>
          <div v-if="item.mentioned || item.pinned || item.hasTodo" class="conv-tags">
            <NTag v-if="item.pinned" size="tiny" type="warning">置顶</NTag>
            <NTag v-if="item.mentioned" size="tiny" type="error">@我</NTag>
            <NTag v-if="item.hasTodo" size="tiny" type="info">待办</NTag>
            <NTag v-if="item.overdueReply" size="tiny" type="error">超时</NTag>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.conv-list-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-right: 1px solid var(--n-border-color);
  background: #fafafa;
}

.conv-tabs :deep(.n-tabs-nav) {
  padding: 0 8px;
}

.conv-search {
  padding: 8px 12px;
  flex-shrink: 0;
}

.conv-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.conv-loading {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.conv-item {
  display: flex;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.conv-item:hover {
  background: #f3f4f6;
}

.conv-item--active {
  background: #e8f0fe;
}

.conv-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conv-body {
  flex: 1;
  min-width: 0;
}

.conv-top,
.conv-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.conv-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-type {
  color: #6b7280;
  font-weight: 500;
  margin-right: 2px;
}

.conv-time {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}

.conv-preview {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.conv-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
</style>
