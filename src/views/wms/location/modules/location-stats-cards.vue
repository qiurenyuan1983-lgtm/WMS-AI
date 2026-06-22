<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  stats: Api.Wms.LocationStats | null;
  loading?: boolean;
}>();

const cards = computed(() => {
  const s = props.stats;
  if (!s) return [];
  return [
    { key: 'total', label: '库位总数', value: s.total, color: '#2563eb', sub: `利用率 ${s.utilizationRate}%` },
    { key: 'empty', label: '空闲', value: s.empty, color: '#059669' },
    { key: 'partial', label: '部分占用', value: s.partial, color: '#0284c7' },
    { key: 'full', label: '已满', value: s.full, color: '#ea580c' },
    { key: 'locked', label: '锁定', value: s.locked, color: '#d97706' },
    { key: 'disabled', label: '禁用', value: s.disabled, color: '#6b7280' },
    { key: 'maintenance', label: '维修', value: s.maintenance, color: '#7c3aed' },
    { key: 'abnormal', label: '异常', value: s.abnormal, color: '#dc2626' },
    { key: 'preOccupied', label: '预占用', value: s.preOccupied, color: '#4f46e5' },
    { key: 'pendingClean', label: '待清理', value: s.pendingClean, color: '#db2777' }
  ];
});
</script>

<template>
  <NSpin :show="loading">
    <div class="stats-grid">
      <div v-for="card in cards" :key="card.key" class="stat-card">
        <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
        <div class="stat-label">{{ card.label }}</div>
        <div v-if="card.sub" class="stat-sub">{{ card.sub }}</div>
      </div>
    </div>
  </NSpin>
</template>

<style scoped lang="scss">
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.stat-card {
  padding: 12px 14px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  border: 1px solid var(--n-border-color);
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.stat-sub {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}
</style>
