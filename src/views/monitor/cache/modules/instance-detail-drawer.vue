<script setup lang="ts">
import { ref, watch } from 'vue';
import { fetchGetRedisInstanceDetail } from '@/service/api/monitor/cache';
import { INSTANCE_STATUS_LABEL, INSTANCE_STATUS_TAG } from '../constants';

const props = defineProps<{ instanceId?: CommonType.IdType | null }>();
const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const detail = ref<Api.Monitor.RedisInstance | null>(null);

async function load() {
  if (!props.instanceId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data, error } = await fetchGetRedisInstanceDetail(props.instanceId);
  loading.value = false;
  if (!error && data) detail.value = data;
}

watch([() => props.instanceId, visible], () => {
  if (visible.value) load();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="640" display-directive="show">
    <NDrawerContent title="Redis实例详情" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <div class="mb-12px flex gap-6px">
            <NTag type="primary" size="small">{{ detail.instanceName }}</NTag>
            <NTag :type="INSTANCE_STATUS_TAG[detail.status] || 'default'" size="small">
              {{ INSTANCE_STATUS_LABEL[detail.status] || detail.status }}
            </NTag>
          </div>
          <NDescriptions bordered :column="1" size="small" label-placement="left">
            <NDescriptionsItem label="环境">{{ detail.env }}</NDescriptionsItem>
            <NDescriptionsItem label="IP/端口">{{ detail.host }}:{{ detail.port }}</NDescriptionsItem>
            <NDescriptionsItem label="模式">{{ detail.mode }}</NDescriptionsItem>
            <NDescriptionsItem label="角色">{{ detail.role }}</NDescriptionsItem>
            <NDescriptionsItem label="Redis版本">{{ detail.redisVersion || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="内存使用">{{ detail.memoryUsedHuman }} ({{ detail.memoryUsagePercent }}%)</NDescriptionsItem>
            <NDescriptionsItem label="最大内存">{{ detail.maxMemoryHuman || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="命中率">{{ detail.hitRate }}%</NDescriptionsItem>
            <NDescriptionsItem label="连接数">{{ detail.connections }}</NDescriptionsItem>
            <NDescriptionsItem label="QPS">{{ detail.qps }}</NDescriptionsItem>
            <NDescriptionsItem label="AOF">{{ detail.aofEnabled ? '已开启' : '未开启' }}</NDescriptionsItem>
            <NDescriptionsItem label="RDB状态">{{ detail.rdbStatus || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="最近检查">{{ detail.lastCheckTime }}</NDescriptionsItem>
          </NDescriptions>
        </template>
        <NEmpty v-else description="暂无实例数据" />
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
