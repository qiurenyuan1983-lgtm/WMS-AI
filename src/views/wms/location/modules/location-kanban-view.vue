<script setup lang="ts">
import { computed } from 'vue';
import { NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { KANBAN_STATUS_KEYS, occupancyPercent, statusTagType } from '../constants';

const props = defineProps<{
  locations: Api.Wms.Location[];
}>();

const emit = defineEmits<{
  (e: 'select', row: Api.Wms.Location): void;
}>();

const { record: statusRecord } = useDict('wms_location_status');

const columns = computed(() =>
  KANBAN_STATUS_KEYS.map(key => ({
    key,
    label: statusRecord.value[key]?.dictLabel || key,
    items: props.locations.filter(l => l.status === key).slice(0, 40)
  }))
);
</script>

<template>
  <div class="kanban-board">
    <div v-for="col in columns" :key="col.key" class="kanban-col">
      <div class="kanban-head">
        <span>{{ col.label }}</span>
        <NTag size="tiny" :type="statusTagType(col.key)">{{ col.items.length }}</NTag>
      </div>
      <div class="kanban-body">
        <div v-for="loc in col.items" :key="loc.id" class="kanban-card" @click="emit('select', loc)">
          <div class="font-600">{{ loc.locationCode }}</div>
          <div class="mt-4px text-12px text-#6b7280">{{ loc.zoneName }}</div>
          <div class="mt-6px flex items-center justify-between text-12px">
            <span>{{ loc.currentQty ?? 0 }}/{{ loc.capacity ?? 30 }}</span>
            <span>{{ occupancyPercent(loc) }}%</span>
          </div>
          <NProgress
            class="mt-4px"
            type="line"
            :percentage="occupancyPercent(loc)"
            :show-indicator="false"
            :height="4"
            :status="loc.status === 'FULL' ? 'warning' : 'default'"
          />
        </div>
        <div v-if="!col.items.length" class="kanban-empty">暂无</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  min-height: 420px;
}

.kanban-col {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 420px);
  background: rgb(var(--container-bg-color));
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
}

.kanban-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--n-border-color);
}

.kanban-body {
  flex: 1;
  overflow: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
  background: var(--n-color);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgb(var(--primary-color));
  }
}

.kanban-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}
</style>
