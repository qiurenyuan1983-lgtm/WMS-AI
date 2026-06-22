<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  stats?: Api.Wms.InventoryFloorPlanStats | null;
  refreshTime?: string | null;
  loading?: boolean;
}>();

const cards = computed(() => {
  const s = props.stats;
  if (!s) return [];
  return [
    { key: 'total', label: '总库位数', value: s.totalLocations, color: '#2563eb' },
    { key: 'used', label: '已用库位', value: s.usedLocations, color: '#059669' },
    { key: 'empty', label: '空闲库位', value: s.emptyLocations, color: '#0284c7' },
    { key: 'rate', label: '占用率', value: `${s.occupancyRate}%`, color: '#ea580c' },
    { key: 'high', label: '高占用库位', value: s.highOccupancyCount, color: '#dc2626' },
    { key: 'abnormal', label: '异常库位', value: s.abnormalCount, color: '#7c3aed' }
  ];
});
</script>

<template>
  <NSpin :show="loading">
    <div class="stats-wrap">
      <div v-for="card in cards" :key="card.key" class="stat-card">
        <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
        <div class="stat-label">{{ card.label }}</div>
      </div>
      <div v-if="refreshTime" class="refresh-time">刷新时间：{{ refreshTime }}</div>
    </div>
  </NSpin>
</template>

<style scoped lang="scss">
.stats-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.stat-card {
  min-width: 120px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  border: 1px solid var(--n-border-color);
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.refresh-time {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
}
</style>
