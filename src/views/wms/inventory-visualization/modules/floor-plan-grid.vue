<script setup lang="ts">
import { computed } from 'vue';
import { FLOOR_PLAN_OCCUPANCY_STYLES } from '@/mock/data/wms-inventory-floor';
import { buildZoneGrid } from '../constants';

const props = defineProps<{
  zones: Api.Wms.ZoneVisualization[];
  mapScale: number;
  selectedLocationId?: CommonType.IdType | null;
}>();

const emit = defineEmits<{
  (e: 'select', loc: Api.Wms.LocationVisualization): void;
}>();

const cellSize = computed(() => Math.max(72, Math.round(96 * props.mapScale)));

function cellStyle(level: string, loc: Api.Wms.LocationVisualization) {
  const style = FLOOR_PLAN_OCCUPANCY_STYLES[level as keyof typeof FLOOR_PLAN_OCCUPANCY_STYLES] || FLOOR_PLAN_OCCUPANCY_STYLES.EMPTY;
  const selected = String(props.selectedLocationId) === String(loc.id);
  return {
    width: `${cellSize.value}px`,
    minHeight: `${cellSize.value}px`,
    backgroundColor: style.bg,
    borderColor: selected ? 'rgb(var(--primary-color))' : style.border,
    color: style.text,
    boxShadow: selected ? '0 0 0 2px rgb(var(--primary-color) / 0.25)' : undefined
  };
}

const zoneGrids = computed(() =>
  props.zones.map(zone => ({
    zone,
    grid: buildZoneGrid(zone)
  }))
);
</script>

<template>
  <div class="floor-map">
    <section v-for="{ zone, grid } in zoneGrids" :key="zone.zoneId" class="zone-section">
      <div class="zone-head">
        <span class="zone-name">{{ zone.zoneName }}</span>
        <span class="zone-meta">{{ zone.usedPalletCount }}/{{ zone.totalCapacity }} 板 · {{ zone.occupancyPercent }}%</span>
      </div>

      <div class="grid-wrap">
        <div v-for="row in grid.rows" :key="`row-${row}`" class="grid-row">
          <div class="grid-row-head">{{ row }}排</div>
          <div class="grid-row-cells">
            <button
              v-for="loc in grid.rowMap.get(row) || []"
              :key="loc.id"
              type="button"
              class="loc-block"
              :style="cellStyle(loc.occupancyLevel, loc)"
              @click="emit('select', loc)"
            >
              <span class="loc-code">{{ loc.locationCode }}</span>
              <span class="loc-remain">{{ loc.remainingCapacity ?? 0 }}</span>
              <span v-if="loc.platformCode" class="loc-platform">{{ loc.platformCode }}</span>
              <span v-if="loc.palletCount" class="loc-pallets">{{ loc.palletCount }}板</span>
              <span v-if="loc.locked" class="loc-flag">🔒</span>
              <span v-if="loc.abnormal" class="loc-flag">⚠</span>
            </button>
          </div>
        </div>
      </div>
    </section>
    <NEmpty v-if="!zoneGrids.length" description="暂无库位数据" class="py-40px" />
  </div>
</template>

<style scoped lang="scss">
.floor-map {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.zone-section {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--n-border-color);
  background: rgb(var(--container-bg-color));
}

.zone-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.zone-name {
  font-size: 15px;
  font-weight: 700;
}

.zone-meta {
  font-size: 12px;
  color: #6b7280;
}

.grid-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-x: auto;
}

.grid-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.grid-row-head {
  flex-shrink: 0;
  width: 52px;
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  font-weight: 600;
}

.grid-row-cells {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.loc-block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 72px;
  min-height: 72px;
  padding: 6px 4px;
  border: 1px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.08);
  }
}

.loc-code {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
}

.loc-remain {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.loc-platform,
.loc-pallets {
  font-size: 9px;
  opacity: 0.85;
}

.loc-flag {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
}
</style>
