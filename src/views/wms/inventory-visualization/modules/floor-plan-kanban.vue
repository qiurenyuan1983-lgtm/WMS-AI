<script setup lang="ts">
import { computed } from 'vue';
import { FLOOR_PLAN_OCCUPANCY_STYLES } from '@/mock/data/wms-inventory-floor';

const props = defineProps<{ zones: Api.Wms.ZoneVisualization[]; fillHeight?: boolean }>();
const emit = defineEmits<{ (e: 'select', loc: Api.Wms.LocationVisualization): void }>();

const levels = ['EMPTY', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INVALID'] as const;

const columns = computed(() =>
  levels.map(level => ({
    level,
    label: FLOOR_PLAN_OCCUPANCY_STYLES[level].label,
    style: FLOOR_PLAN_OCCUPANCY_STYLES[level],
    items: props.zones
      .flatMap(z => z.locations)
      .filter(l => l.occupancyLevel === level)
      .slice(0, 30)
  }))
);
</script>

<template>
  <div class="kanban" :class="{ 'kanban--fill': fillHeight }">
    <div v-for="col in columns" :key="col.level" class="kanban-col">
      <div class="kanban-head">
        <span class="dot" :style="{ background: col.style.bg, borderColor: col.style.border }" />
        {{ col.label.split(' ')[0] }}
        <NTag size="tiny" :bordered="false">{{ col.items.length }}</NTag>
      </div>
      <div class="kanban-body">
        <div v-for="loc in col.items" :key="loc.id" class="kanban-card" @click="emit('select', loc)">
          <div class="font-600">{{ loc.locationCode }}</div>
          <div class="text-12px text-#6b7280">{{ loc.zoneName }}</div>
          <div class="mt-4px text-12px">剩余 {{ loc.remainingCapacity ?? 0 }} · {{ loc.palletCount ?? 0 }}板</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kanban {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  min-height: 420px;
  padding-bottom: 8px;
}

.kanban--fill {
  flex: 1;
  min-height: 0;
  height: 100%;
  align-items: stretch;
}

.kanban-col {
  flex: 0 0 200px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  max-height: 520px;
  display: flex;
  flex-direction: column;
}

.kanban--fill .kanban-col {
  max-height: none;
  height: 100%;
}

.kanban-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--n-border-color);
}

.dot {
  width: 10px;
  height: 10px;
  border: 1px solid;
  border-radius: 2px;
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
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
  cursor: pointer;

  &:hover {
    border-color: rgb(var(--primary-color));
  }
}
</style>
