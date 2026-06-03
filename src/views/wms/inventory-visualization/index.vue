<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NProgress,
  NSelect,
  NSlider,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  NTooltip
} from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGetWmsInventoryVisualization } from '@/service/api/wms';
import { useDict } from '@/hooks/business/dict';
import { useAppStore } from '@/store/modules/app';
/** 异步加载，避免与含 JSX 的卡板 composable 同 chunk 导致路由动态导入失败 */
const LocationPalletsDrawer = defineAsyncComponent(
  () => import('@/views/wms/pallet/modules/location-pallets-drawer.vue')
);

defineOptions({ name: 'WmsInventoryVisualization' });

const appStore = useAppStore();

/** 库内平面图显示比例（调格子尺寸而非 CSS scale） */
const MAP_SCALE_MIN = 0.35;
const MAP_SCALE_MAX = 1.25;
const MAP_SCALE_DEFAULT = 0.85;
const MAP_SCALE_STEP = 0.05;
const MAP_SCALE_COMPACT_THRESHOLD = 0.56;
/** 库位卡片基准宽度（px），在 scale 上乘算 */
const CELL_BASE_WIDTH_PX = 108;
const mapScale = ref(MAP_SCALE_DEFAULT);

function clampMapScale(v: number) {
  const n = Math.round(v * 100) / 100;
  return Math.min(MAP_SCALE_MAX, Math.max(MAP_SCALE_MIN, n));
}

function zoomStep(delta: number) {
  mapScale.value = clampMapScale(mapScale.value + delta);
}

function resetMapZoom() {
  mapScale.value = MAP_SCALE_DEFAULT;
}

let mapScaleRafId = 0;
let pendingMapScale: number | null = null;

function scheduleMapScaleFromSlider(raw: number | number[]) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  pendingMapScale = clampMapScale(Number(v));
  if (mapScaleRafId !== 0) return;
  mapScaleRafId = requestAnimationFrame(() => {
    mapScaleRafId = 0;
    if (pendingMapScale != null) {
      mapScale.value = pendingMapScale;
      pendingMapScale = null;
    }
  });
}

onBeforeUnmount(() => {
  if (mapScaleRafId !== 0) cancelAnimationFrame(mapScaleRafId);
});

const isCompactCellView = computed(() => mapScale.value <= MAP_SCALE_COMPACT_THRESHOLD);

const cellMinWidthPx = computed(() => Math.max(52, Math.round(CELL_BASE_WIDTH_PX * mapScale.value)));

const cellMinHeightPx = computed(() => {
  const s = mapScale.value;
  const base = Math.max(38, Math.round(72 * s));
  if (s <= MAP_SCALE_COMPACT_THRESHOLD) return base;
  const span = MAP_SCALE_MAX - MAP_SCALE_MIN;
  const u = span > 1e-6 ? Math.min(1, Math.max(0, (s - MAP_SCALE_MIN) / span)) : 0;
  return base + Math.round(12 + 54 * u);
});

const { record: zoneTypeRecord } = useDict('wms_zone_type');
const { record: storageRecord } = useDict('wms_storage_method');

const OCCUPANCY_STYLES: Record<string, { bg: string; border: string; label: string }> = {
  EMPTY: { bg: '#d8f3dc', border: '#95d5b2', label: '空闲 0%' },
  LOW: { bg: '#cfe8ff', border: '#6ea8fe', label: '低 1-49%' },
  MEDIUM: { bg: '#fff3cd', border: '#ffc107', label: '中 50-79%' },
  HIGH: { bg: '#fde2e4', border: '#f08080', label: '高 80-94%' },
  CRITICAL: { bg: '#f8b4b4', border: '#dc3545', label: '临界 95%+' },
  INVALID: { bg: '#e9ecef', border: '#adb5bd', label: '无效' }
};

const loading = ref(false);
const warehouseId = ref<CommonType.IdType | null>(null);
const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const zoneKeyword = ref('');
const selectedZoneId = ref<CommonType.IdType | 'all'>('all');
const visualization = ref<Api.Wms.InventoryVisualization | null>(null);
const zonePlanEnabled = ref<Record<string, boolean>>({});
const filterExpanded = ref(['filter']);
const locationDrawerVisible = ref(false);
const selectedLocation = ref<Api.Wms.LocationVisualization | null>(null);

const filteredZones = computed(() => {
  const zones = visualization.value?.zones || [];
  const keyword = zoneKeyword.value.trim().toLowerCase();
  let list = keyword ? zones.filter(z => z.zoneName?.toLowerCase().includes(keyword)) : zones;
  if (selectedZoneId.value !== 'all') {
    list = list.filter(z => String(z.zoneId) === String(selectedZoneId.value));
  }
  return list;
});

const sidebarZones = computed(() => {
  const keyword = zoneKeyword.value.trim().toLowerCase();
  const zones = visualization.value?.zones || [];
  return keyword ? zones.filter(z => z.zoneName?.toLowerCase().includes(keyword)) : zones;
});

const visibleCanvasZones = computed(() =>
  filteredZones.value.filter(z => zonePlanEnabled.value[String(z.zoneId)] !== false)
);

const summary = computed(() => visualization.value);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500 } as any);
  const rows = (data as any)?.rows || [];
  warehouseOptions.value = rows.map((item: any) => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id
  }));
  if (!warehouseId.value && warehouseOptions.value.length) {
    warehouseId.value = warehouseOptions.value[0].value;
  }
}

async function loadVisualization() {
  if (!warehouseId.value) return;
  loading.value = true;
  const { data, error } = await fetchGetWmsInventoryVisualization({
    warehouseId: warehouseId.value,
    zoneId: selectedZoneId.value === 'all' ? null : selectedZoneId.value,
    zoneKeyword: zoneKeyword.value || null
  });
  loading.value = false;
  if (error) return;
  visualization.value = data || null;
  const enabled: Record<string, boolean> = { ...zonePlanEnabled.value };
  for (const zone of data?.zones || []) {
    const key = String(zone.zoneId);
    if (enabled[key] === undefined) enabled[key] = true;
  }
  zonePlanEnabled.value = enabled;
}

function openLocationDrawer(loc: Api.Wms.LocationVisualization) {
  selectedLocation.value = loc;
  locationDrawerVisible.value = true;
}

function onLocationPalletsRefreshed() {
  loadVisualization();
}

function cellStyle(level: string) {
  const style = OCCUPANCY_STYLES[level] || OCCUPANCY_STYLES.EMPTY;
  return {
    backgroundColor: style.bg,
    borderColor: style.border,
    borderWidth: '1px',
    borderStyle: 'solid'
  };
}

function locationCellStyle(loc: Api.Wms.LocationVisualization) {
  return {
    width: `${cellMinWidthPx.value}px`,
    height: `${cellMinHeightPx.value}px`,
    minHeight: `${cellMinHeightPx.value}px`,
    ...cellStyle(loc.occupancyLevel)
  };
}

function selectZone(zoneId: CommonType.IdType | 'all') {
  selectedZoneId.value = zoneId;
  loadVisualization();
}

function formatRatio(used: number, total: number) {
  return `${used}/${total || 0} 板`;
}

function getDestinationLines(loc: Api.Wms.LocationVisualization) {
  const stats = loc.destinationStats || [];
  if (stats.length) {
    return stats.map(s => ({ label: s.groupDestination, count: s.palletCount }));
  }
  if (loc.currentQty > 0) {
    return [{ label: '未指定目的地', count: loc.currentQty }];
  }
  return [];
}

onMounted(async () => {
  await loadWarehouses();
  await loadVisualization();
});

watch(warehouseId, () => {
  selectedZoneId.value = 'all';
  loadVisualization();
});
</script>

<template>
  <div class="viz-page h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <div class="viz-layout">
      <!-- 左侧库区 -->
      <NCard
        class="viz-sidebar card-wrapper"
        :bordered="false"
        size="small"
        content-class="viz-sidebar-body"
      >
        <div class="mb-10px flex flex-shrink-0 items-center justify-between">
          <span class="font-600">库区</span>
          <span class="text-12px text-gray-500">共 {{ sidebarZones.length }} 条</span>
        </div>
        <NInput
          v-model:value="zoneKeyword"
          clearable
          placeholder="搜索库区名称"
          class="mb-12px flex-shrink-0"
          @keyup.enter="loadVisualization"
        />
        <div class="min-h-0 flex-1 flex flex-col gap-10px overflow-y-auto pr-4px">
        <div
          class="cursor-pointer rounded-8px border border-solid p-10px transition-colors"
          :class="selectedZoneId === 'all' ? 'border-primary bg-primary/5' : 'border-#e5e7eb hover:border-primary/40'"
          @click="selectZone('all')"
        >
          <div class="mb-6px font-600">全部库位</div>
          <div class="mb-6px text-12px text-gray-600">
            {{ formatRatio(summary?.usedPalletCount || 0, summary?.totalCapacity || 0) }}
          </div>
          <NProgress type="line" :percentage="summary?.occupancyPercent || 0" :show-indicator="true" />
        </div>
        <div
          v-for="zone in sidebarZones"
          :key="zone.zoneId"
          class="cursor-pointer rounded-8px border border-solid p-10px transition-colors"
          :class="String(selectedZoneId) === String(zone.zoneId) ? 'border-primary bg-primary/5' : 'border-#e5e7eb hover:border-primary/40'"
          @click="selectZone(zone.zoneId)"
        >
          <div class="mb-6px flex items-center justify-between gap-8px">
            <span class="font-600">{{ zone.zoneName }}</span>
            <NTag size="small" :bordered="false">{{ zone.occupancyPercent }}%</NTag>
          </div>
          <NSpace size="small" class="mb-6px">
            <NTag v-if="zone.zoneType" size="tiny" type="info">
              {{ zoneTypeRecord[zone.zoneType]?.dictLabel || zone.zoneType }}
            </NTag>
            <NTag v-if="zone.storageMethod" size="tiny">
              {{ storageRecord[zone.storageMethod]?.dictLabel || zone.storageMethod }}
            </NTag>
          </NSpace>
          <div class="mb-6px flex items-center justify-between text-12px">
            <span class="text-gray-600">{{ formatRatio(zone.usedPalletCount, zone.totalCapacity) }}</span>
            <NSwitch
              v-model:value="zonePlanEnabled[String(zone.zoneId)]"
              size="small"
              @click.stop
            >
              <template #checked>平面图</template>
              <template #unchecked>平面图</template>
            </NSwitch>
          </div>
          <NProgress type="line" :percentage="zone.occupancyPercent" :show-indicator="false" />
        </div>
        </div>
      </NCard>

      <!-- 右侧可视化 -->
      <NCard class="viz-main card-wrapper" :bordered="false" size="small" content-class="viz-main-body">
        <div class="mb-12px flex flex-shrink-0 items-center justify-between">
        <div>
          <div class="text-16px font-600">仓库库存可视化</div>
          <div v-if="summary" class="text-12px text-gray-500">
            {{ summary.warehouseName }}（{{ summary.warehouseCode }}）· {{ summary.locationCount }} 个库位
          </div>
        </div>
        <NButton type="primary" :loading="loading" @click="loadVisualization">刷新</NButton>
      </div>

      <NCollapse v-model:expanded-names="filterExpanded" class="mb-12px flex-shrink-0">
        <NCollapseItem title="筛选条件" name="filter">
          <NForm inline label-placement="left" :show-feedback="false">
            <NFormItem label="仓库">
              <NSelect
                v-model:value="warehouseId"
                :options="warehouseOptions"
                filterable
                class="w-260px"
                placeholder="请选择仓库"
              />
            </NFormItem>
            <NFormItem label="库区搜索">
              <NInput v-model:value="zoneKeyword" clearable placeholder="库区名称" class="w-200px" @keyup.enter="loadVisualization" />
            </NFormItem>
            <NFormItem>
              <NButton @click="loadVisualization">应用</NButton>
            </NFormItem>
          </NForm>
        </NCollapseItem>
      </NCollapse>

      <div
        class="mb-12px flex flex-shrink-0 flex-wrap items-center gap-8px border border-gray-200 rounded-8px bg-gray-50 px-10px py-8px dark:border-gray-600 dark:bg-gray-800/50"
      >
        <span class="shrink-0 whitespace-nowrap text-12px text-gray-600">缩放</span>
        <NButton quaternary size="tiny" class="min-w-28px shrink-0 px-4px" @click="zoomStep(-MAP_SCALE_STEP)">-</NButton>
        <NSlider
          class="min-w-120px max-w-full flex-1 sm:min-w-160px sm:max-w-240px"
          :value="mapScale"
          :min="MAP_SCALE_MIN"
          :max="MAP_SCALE_MAX"
          :step="MAP_SCALE_STEP"
          :format-tooltip="v => `${Math.round(Number(v) * 100)}%`"
          @update:value="scheduleMapScaleFromSlider"
        />
        <NButton quaternary size="tiny" class="min-w-28px shrink-0 px-4px" @click="zoomStep(MAP_SCALE_STEP)">+</NButton>
        <span class="shrink-0 tabular-nums text-12px text-gray-700">{{ Math.round(mapScale * 100) }}%</span>
        <NButton size="tiny" secondary class="shrink-0" @click="resetMapZoom">默认</NButton>
      </div>

        <NSpin :show="loading" class="map-spin min-h-0 flex flex-1 flex-col">
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              v-if="!loading && !visibleCanvasZones.length"
              class="flex flex-1 items-center justify-center py-48px"
            >
              <NEmpty description="请选择仓库或开启库区平面图" />
            </div>

            <div
              v-else
              class="warehouse-visual-outer min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-10px sm:p-12px"
              :style="{ maxHeight: appStore.isMobile ? '65vh' : 'calc(100vh - 300px)' }"
            >
              <div
                class="warehouse-visual-frame w-full max-w-full rounded-12px border-2 border-solid border-slate-600 bg-slate-100/80 p-12px shadow-inner sm:p-14px"
              >
                <div class="mb-12px flex flex-col gap-8px border-b border-slate-300/80 pb-10px">
                  <div class="flex flex-wrap items-center gap-x-12px gap-y-6px">
                    <span class="text-13px font-600 text-slate-700">库内平面</span>
                    <span class="text-11px text-slate-400">悬浮查看目的地与板数；放大卡片内联显示；点击打开卡板抽屉</span>
                  </div>
                  <div class="flex flex-wrap gap-x-10px gap-y-6px">
                    <span class="mr-4px text-11px font-600 text-slate-600">占用图例</span>
                    <span
                      v-for="(style, key) in OCCUPANCY_STYLES"
                      :key="key"
                      class="inline-flex items-center gap-4px text-11px text-slate-600"
                    >
                      <span
                        class="inline-block size-12px shrink-0 rounded-3px border border-solid"
                        :style="{ backgroundColor: style.bg, borderColor: style.border }"
                      />
                      {{ style.label }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col gap-18px">
                  <section v-for="zone in visibleCanvasZones" :key="zone.zoneId" class="min-w-0">
                    <div class="mb-10px text-15px font-700 text-slate-800">{{ zone.zoneName }}</div>
                    <div class="flex flex-wrap content-start gap-6px">
                      <NTooltip
                        v-for="loc in zone.locations"
                        :key="loc.id"
                        trigger="hover"
                        placement="top-start"
                        :show-arrow="false"
                      >
                        <template #trigger>
                          <div
                            class="flat-loc-cell flex shrink-0 cursor-pointer flex-col overflow-hidden rounded-8px transition-shadow select-none hover:shadow-md"
                            :style="locationCellStyle(loc)"
                            @click="openLocationDrawer(loc)"
                          >
                            <template v-if="isCompactCellView">
                              <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2px px-4px py-4px text-center">
                                <span
                                  class="w-full truncate font-700 leading-tight text-slate-900"
                                  :class="mapScale < 0.45 ? 'text-10px' : 'text-11px'"
                                >
                                  {{ loc.locationCode }}
                                </span>
                                <span
                                  v-if="loc.currentQty > 0"
                                  class="w-full truncate text-9px text-slate-600 leading-tight"
                                >
                                  {{ loc.currentQty }}板
                                </span>
                              </div>
                            </template>
                            <template v-else>
                              <div class="flex h-full min-h-0 flex-col gap-3px overflow-hidden p-6px text-11px leading-snug">
                                <div class="shrink-0 truncate text-center text-12px font-700 text-slate-900">
                                  {{ loc.locationCode }}
                                </div>
                                <div class="shrink-0 flex justify-between gap-6px border-b border-black/10 pb-3px">
                                  <span class="text-gray-600">占用</span>
                                  <span class="font-600 tabular-nums">{{ loc.occupancyPercent }}%</span>
                                </div>
                                <div class="shrink-0 text-center text-slate-700">
                                  <span class="font-600 tabular-nums">{{ loc.currentQty }}/{{ loc.capacity ?? '—' }}</span>
                                  <span class="ml-2px text-10px text-gray-500">板</span>
                                </div>
                                <div
                                  v-if="getDestinationLines(loc).length"
                                  class="min-h-0 flex-1 overflow-y-auto border-t border-black/8 pt-3px text-left"
                                >
                                  <div
                                    v-for="line in getDestinationLines(loc)"
                                    :key="line.label"
                                    class="mb-2px flex items-start justify-between gap-4px text-10px leading-tight last:mb-0"
                                    :title="`${line.label} ${line.count}板`"
                                  >
                                    <span class="min-w-0 flex-1 truncate text-gray-600">{{ line.label }}</span>
                                    <span class="shrink-0 font-600 tabular-nums text-slate-800">{{ line.count }}板</span>
                                  </div>
                                </div>
                                <div v-else class="shrink-0 text-center text-10px text-gray-400">空闲</div>
                              </div>
                            </template>
                          </div>
                        </template>
                        <div class="max-w-300px whitespace-pre-line text-12px leading-relaxed">
                          <div class="mb-6px font-600">{{ loc.locationCode }}</div>
                          <div class="mb-6px text-gray-600">
                            {{ loc.currentQty }}/{{ loc.capacity ?? '—' }} 板 · 占用 {{ loc.occupancyPercent }}%
                          </div>
                          <template v-if="getDestinationLines(loc).length">
                            <div
                              v-for="line in getDestinationLines(loc)"
                              :key="`tip-${line.label}`"
                              class="flex justify-between gap-12px"
                            >
                              <span class="max-w-200px truncate">{{ line.label }}</span>
                              <span class="shrink-0 font-600 tabular-nums">{{ line.count }} 板</span>
                            </div>
                          </template>
                          <div v-else class="text-gray-500">暂无在库卡板</div>
                        </div>
                      </NTooltip>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </NSpin>
      </NCard>
    </div>

    <LocationPalletsDrawer
      v-model:visible="locationDrawerVisible"
      :warehouse-id="warehouseId"
      :location-id="selectedLocation?.id ?? null"
      :location-code="selectedLocation?.locationCode"
      :occupancy-percent="selectedLocation?.occupancyPercent"
      :current-qty="selectedLocation?.currentQty"
      :capacity="selectedLocation?.capacity"
      @refreshed="onLocationPalletsRefreshed"
    />
  </div>
</template>

<style scoped>
.viz-page {
  display: flex;
  flex-direction: column;
}

.viz-layout {
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.viz-layout > :deep(.viz-sidebar.n-card) {
  width: 280px !important;
  max-width: 280px;
  flex-shrink: 0;
  min-height: 0;
  height: 100%;
}

.viz-layout > :deep(.viz-main.n-card) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  width: auto !important;
  max-width: none;
}

:deep(.viz-sidebar-body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

:deep(.viz-main-body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.map-spin :deep(.n-spin-content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.warehouse-visual-outer {
  scrollbar-gutter: stable both-edges;
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 640px) {
  .viz-layout {
    flex-direction: column;
  }

  .viz-layout > :deep(.viz-sidebar.n-card) {
    width: 100% !important;
    max-width: none;
  }
}
</style>
