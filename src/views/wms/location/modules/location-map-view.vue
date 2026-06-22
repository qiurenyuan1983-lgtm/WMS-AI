<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LOCATION_STATUS_COLORS } from '@/mock/data/wms-location-mgmt';
import { useDict } from '@/hooks/business/dict';

const props = defineProps<{
  locations: Api.Wms.Location[];
  zoneOptions: Array<{ label: string; value: CommonType.IdType; zoneName: string }>;
}>();

const emit = defineEmits<{
  (e: 'select', row: Api.Wms.Location): void;
}>();

const { record: statusRecord } = useDict('wms_location_status');

const selectedZoneId = ref<CommonType.IdType | 'all'>('all');

const grouped = computed(() => {
  const map = new Map<string, Api.Wms.Location[]>();
  props.locations.forEach(loc => {
    const key = loc.zoneName || '未知库区';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(loc);
  });
  return [...map.entries()].map(([zoneName, items]) => ({ zoneName, items }));
});

const filteredGroups = computed(() => {
  if (selectedZoneId.value === 'all') return grouped.value;
  const zone = props.zoneOptions.find(z => z.value === selectedZoneId.value);
  if (!zone) return grouped.value;
  return grouped.value.filter(g => g.zoneName === zone.zoneName);
});

function cellStyle(status: string) {
  const c = LOCATION_STATUS_COLORS[status] || LOCATION_STATUS_COLORS.EMPTY;
  return { background: c.bg, borderColor: c.border, color: c.text };
}

function statusLabel(status: string) {
  return statusRecord.value[status]?.dictLabel || status;
}

watch(
  () => props.zoneOptions,
  opts => {
    if (opts.length && selectedZoneId.value === 'all') return;
  },
  { immediate: true }
);
</script>

<template>
  <div class="map-view">
    <div class="mb-12px flex flex-wrap items-center gap-12px">
      <NSelect
        v-model:value="selectedZoneId"
        :options="[{ label: '全部库区', value: 'all' }, ...zoneOptions.map(z => ({ label: z.label, value: z.value }))]"
        class="w-180px"
        size="small"
      />
      <div class="flex flex-wrap gap-8px text-12px">
        <span v-for="(style, key) in LOCATION_STATUS_COLORS" :key="key" class="legend-item">
          <span class="legend-dot" :style="{ background: style.bg, borderColor: style.border }" />
          {{ statusRecord[key]?.dictLabel || key }}
        </span>
      </div>
    </div>

    <div class="map-scroll">
      <div v-for="group in filteredGroups" :key="group.zoneName" class="zone-block">
        <div class="zone-title">{{ group.zoneName }}（{{ group.items.length }}）</div>
        <div class="cell-grid">
          <NTooltip v-for="loc in group.items" :key="loc.id">
            <template #trigger>
              <button type="button" class="loc-cell" :style="cellStyle(loc.status)" @click="emit('select', loc)">
                <span class="loc-code">{{ loc.locationCode }}</span>
                <span class="loc-qty">{{ loc.currentQty ?? 0 }}/{{ loc.capacity ?? 30 }}</span>
              </button>
            </template>
            {{ loc.locationCode }} · {{ statusLabel(loc.status) }} · {{ loc.currentQty ?? 0 }}/{{ loc.capacity ?? 30 }}
          </NTooltip>
        </div>
      </div>
      <NEmpty v-if="!filteredGroups.length" description="暂无库位数据" class="py-40px" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-scroll {
  max-height: calc(100vh - 420px);
  min-height: 360px;
  overflow: auto;
}

.zone-block {
  margin-bottom: 16px;
}

.zone-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.cell-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loc-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  min-height: 52px;
  padding: 6px 8px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
  }
}

.loc-code {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.loc-qty {
  margin-top: 2px;
  font-size: 10px;
  opacity: 0.85;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border: 1px solid;
  border-radius: 2px;
}
</style>
