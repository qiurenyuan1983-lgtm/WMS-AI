<script setup lang="ts">
import { NBadge, NInput, NTabPane, NTabs, NTag } from 'naive-ui';
import { PORTAL_COMM_CATEGORY_META } from '../../constants';

defineProps<{
  conversations: Api.Portal.PortalConversation[];
  activeId: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  filterChange: [category: string];
}>();

const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: 'ORDER', label: '订单' },
  { key: 'FEE', label: '费用' },
  { key: 'FILE', label: '文件' },
  { key: 'DELIVERY_TIME', label: '派送' },
  { key: 'EXCEPTION_REPLY', label: '异常' },
  { key: 'SYSTEM', label: '通知' }
];

function onTabChange(v: string) {
  emit('filterChange', v);
}
</script>

<template>
  <div class="conv-list">
    <div class="conv-list__search">
      <NInput size="small" placeholder="搜索订单号…" clearable @update:value="v => emit('filterChange', v ? `kw:${v}` : 'all')" />
    </div>
    <NTabs type="line" size="small" default-value="all" @update:value="onTabChange">
      <NTabPane v-for="t in categoryTabs" :key="t.key" :name="t.key" :tab="t.label" />
    </NTabs>
    <div v-if="loading" class="conv-list__empty">加载中…</div>
    <div v-else-if="!conversations.length" class="conv-list__empty">暂无会话</div>
    <div v-else class="conv-list__items">
      <div
        v-for="c in conversations"
        :key="c.id"
        class="conv-item"
        :class="{ 'conv-item--active': activeId === c.id }"
        @click="emit('select', c.id)"
      >
        <div class="conv-item__head">
          <NTag size="tiny" :bordered="false" :color="{ color: PORTAL_COMM_CATEGORY_META[c.category].color, textColor: '#fff' }">
            {{ PORTAL_COMM_CATEGORY_META[c.category].label }}
          </NTag>
          <span class="conv-item__time">{{ c.lastTime }}</span>
        </div>
        <div class="conv-item__title">{{ c.title }}</div>
        <div class="conv-item__sub">
          <span>{{ c.contactName }}</span>
          <NBadge v-if="c.unreadCount" :value="c.unreadCount" :max="99" />
        </div>
        <div class="conv-item__preview">{{ c.lastMessage }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conv-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--n-border-color);
}
.conv-list__search {
  padding: 8px;
  flex-shrink: 0;
}
.conv-list__items {
  flex: 1;
  overflow-y: auto;
}
.conv-list__empty {
  padding: 24px;
  text-align: center;
  color: var(--n-text-color-3);
  font-size: 13px;
}
.conv-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--n-border-color);
}
.conv-item:hover,
.conv-item--active {
  background: rgba(32, 128, 240, 0.06);
}
.conv-item__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.conv-item__time {
  font-size: 11px;
  color: var(--n-text-color-3);
}
.conv-item__title {
  margin-top: 4px;
  font-weight: 500;
  font-size: 13px;
}
.conv-item__sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
  font-size: 12px;
  color: var(--n-text-color-3);
}
.conv-item__preview {
  margin-top: 4px;
  font-size: 12px;
  color: var(--n-text-color-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
