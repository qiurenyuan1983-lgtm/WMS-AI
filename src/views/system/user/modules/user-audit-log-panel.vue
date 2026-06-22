<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getUserAuditLogs, type AuditLogType } from '@/mock/data/user-audit-logs';

defineOptions({ name: 'UserAuditLogPanel' });

interface Props {
  selectedUserId?: CommonType.IdType | null;
}

const props = defineProps<Props>();

const logTab = ref<AuditLogType>('operation');
const pageNum = ref(1);
const pageSize = ref(5);

const logTabs: { key: AuditLogType; label: string }[] = [
  { key: 'login', label: '登录日志' },
  { key: 'operation', label: '操作日志' },
  { key: 'permission', label: '权限变更记录' },
  { key: 'password', label: '密码重置记录' }
];

const logResult = computed(() =>
  getUserAuditLogs({
    logType: logTab.value,
    userId: props.selectedUserId,
    pageNum: pageNum.value,
    pageSize: pageSize.value
  })
);

const columns = [
  { key: 'time', title: '操作时间', width: 160 },
  { key: 'operator', title: '操作人', width: 100 },
  { key: 'target', title: '目标用户', width: 100 },
  { key: 'actionType', title: '类型', width: 100 },
  { key: 'content', title: '内容', ellipsis: { tooltip: true } },
  { key: 'beforeValue', title: '变更前', width: 100, ellipsis: { tooltip: true } },
  { key: 'afterValue', title: '变更后', width: 100, ellipsis: { tooltip: true } },
  { key: 'ip', title: 'IP 地址', width: 120 }
];

watch([() => props.selectedUserId, logTab], () => {
  pageNum.value = 1;
});
</script>

<template>
  <NCard :bordered="false" size="small" class="audit-log-panel card-wrapper shrink-0">
    <NTabs v-model:value="logTab" type="line" size="small">
      <NTabPane v-for="tab in logTabs" :key="tab.key" :name="tab.key" :tab="tab.label" />
    </NTabs>
    <NDataTable
      :columns="columns"
      :data="logResult.rows"
      size="small"
      :scroll-x="900"
      :max-height="180"
      :bordered="false"
    />
    <div class="mt-8px flex justify-end">
      <NPagination
        v-model:page="pageNum"
        :page-size="pageSize"
        :item-count="logResult.total"
        size="small"
        simple
      />
    </div>
  </NCard>
</template>

<style scoped lang="scss">
.audit-log-panel {
  :deep(.n-card__content) {
    padding-top: 8px;
  }
}
</style>
