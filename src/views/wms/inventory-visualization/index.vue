<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGetWmsInventoryVisualization } from '@/service/api/wms';
import { FLOOR_PLAN_OCCUPANCY_STYLES } from '@/mock/data/wms-inventory-floor';
import { useDict } from '@/hooks/business/dict';
import {
  DELIVERY_FILTER_OPTIONS,
  DESTINATION_FILTER_OPTIONS,
  FLOOR_PLAN_VIEW_OPTIONS,
  PLATFORM_FILTER_OPTIONS,
  type FloorPlanViewMode
} from './constants';
import FloorPlanStats from './modules/floor-plan-stats.vue';
import FloorPlanGrid from './modules/floor-plan-grid.vue';
import FloorPlanList from './modules/floor-plan-list.vue';
import FloorPlanKanban from './modules/floor-plan-kanban.vue';
import FloorPlanDetailDrawer from './modules/floor-plan-detail-drawer.vue';

defineOptions({ name: 'WmsInventoryVisualization' });

useDict('wms_location_status');

const loading = ref(false);
const viewMode = ref<FloorPlanViewMode>('map');
const mapScale = ref(0.85);
const isFullscreen = ref(false);
const useCssFullscreen = ref(false);
/** 全屏容器：包含工具栏、图例与视图区域，避免进入全屏后无法操作退出 */
const fullscreenHostRef = ref<HTMLElement | null>(null);

const warehouseId = ref<CommonType.IdType | null>(null);
const warehouseOptions = ref<CommonType.Option[]>([]);
const selectedZoneId = ref<CommonType.IdType | 'all'>('all');
const zoneKeyword = ref('');

const filters = ref({
  platformCode: '',
  deliveryMethod: '',
  destinationCode: '',
  customerName: '',
  status: null as string | null,
  onlyAvailable: false
});

const visualization = ref<Api.Wms.InventoryVisualization | null>(null);
const detailVisible = ref(false);
const selectedLocation = ref<Api.Wms.LocationVisualization | null>(null);

const sidebarZones = computed(() => {
  const keyword = zoneKeyword.value.trim().toLowerCase();
  const zones = visualization.value?.zones || [];
  return keyword ? zones.filter(z => z.zoneName.toLowerCase().includes(keyword)) : zones;
});

const displayZones = computed(() => {
  let zones = visualization.value?.zones || [];
  if (selectedZoneId.value !== 'all') {
    zones = zones.filter(z => String(z.zoneId) === String(selectedZoneId.value));
  }
  return zones.map(z => ({
    ...z,
    locations: z.locations.slice(0, selectedZoneId.value === 'all' ? 48 : 120)
  }));
});

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500 } as any);
  warehouseOptions.value = ((data as any)?.rows || []).map((item: any) => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id
  }));
  if (!warehouseId.value && warehouseOptions.value.length) {
    warehouseId.value = warehouseOptions.value[0].value as CommonType.IdType;
  }
}

async function loadVisualization() {
  if (!warehouseId.value) return;
  loading.value = true;
  const { data, error } = await fetchGetWmsInventoryVisualization({
    warehouseId: warehouseId.value,
    zoneId: selectedZoneId.value === 'all' ? null : selectedZoneId.value,
    zoneKeyword: zoneKeyword.value || null,
    platformCode: filters.value.platformCode || null,
    deliveryMethod: filters.value.deliveryMethod || null,
    destinationCode: filters.value.destinationCode || null,
    customerName: filters.value.customerName || null,
    status: filters.value.status,
    onlyAvailable: filters.value.onlyAvailable
  });
  loading.value = false;
  if (error) return;
  visualization.value = data || null;
}

function selectZone(zoneId: CommonType.IdType | 'all') {
  selectedZoneId.value = zoneId;
  loadVisualization();
}

function openDetail(loc: Api.Wms.LocationVisualization) {
  selectedLocation.value = loc;
  detailVisible.value = true;
}

function handleReset() {
  filters.value = {
    platformCode: '',
    deliveryMethod: '',
    destinationCode: '',
    customerName: '',
    status: null,
    onlyAvailable: false
  };
  zoneKeyword.value = '';
  selectedZoneId.value = 'all';
  loadVisualization();
}

function zoomStep(delta: number) {
  mapScale.value = Math.min(1.25, Math.max(0.5, Math.round((mapScale.value + delta) * 100) / 100));
}

function syncFullscreenState() {
  const host = fullscreenHostRef.value;
  isFullscreen.value = Boolean(host && document.fullscreenElement === host) || useCssFullscreen.value;
}

async function enterFullscreen() {
  const el = fullscreenHostRef.value;
  if (!el) return;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return;
    }
  } catch {
    // 浏览器策略限制时降级为页面内全屏
  }
  useCssFullscreen.value = true;
  syncFullscreenState();
}

async function exitFullscreen() {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }
  useCssFullscreen.value = false;
  syncFullscreenState();
}

async function toggleFullscreen() {
  if (isFullscreen.value) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
}

function onFullscreenChange() {
  if (!document.fullscreenElement) {
    useCssFullscreen.value = false;
  }
  syncFullscreenState();
}

function onFullscreenKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && useCssFullscreen.value) {
    useCssFullscreen.value = false;
    syncFullscreenState();
  }
}

function handleMove() {
  window.$message?.info('发起移位（原型：请前往卡板管理执行移位）');
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('keydown', onFullscreenKeydown);
  await loadWarehouses();
  await loadVisualization();
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  document.removeEventListener('keydown', onFullscreenKeydown);
  if (document.fullscreenElement === fullscreenHostRef.value) {
    document.exitFullscreen().catch(() => undefined);
  }
});

watch(warehouseId, () => {
  selectedZoneId.value = 'all';
  loadVisualization();
});
</script>

<template>
  <div class="floor-page min-h-500px flex-col-stretch gap-12px overflow-hidden">
    <NCard :bordered="false" size="small" class="card-wrapper shrink-0">
      <div class="mb-10px text-16px font-600">仓库库存平面图</div>
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" class="flex flex-wrap gap-y-8px">
        <NFormItem label="仓库代码">
          <NSelect v-model:value="warehouseId" :options="warehouseOptions" filterable class="w-200px" />
        </NFormItem>
        <NFormItem label="平台">
          <NSelect v-model:value="filters.platformCode" :options="PLATFORM_FILTER_OPTIONS" class="w-120px" />
        </NFormItem>
        <NFormItem label="派送方式">
          <NSelect v-model:value="filters.deliveryMethod" :options="DELIVERY_FILTER_OPTIONS" class="w-110px" />
        </NFormItem>
        <NFormItem label="平台代码">
          <NSelect v-model:value="filters.destinationCode" :options="DESTINATION_FILTER_OPTIONS" class="w-110px" />
        </NFormItem>
        <NFormItem label="客户">
          <NInput v-model:value="filters.customerName" clearable placeholder="客户名称" class="w-120px" />
        </NFormItem>
        <NFormItem label="状态">
          <DictSelect v-model:value="filters.status" dict-code="wms_location_status" clearable class="w-110px" />
        </NFormItem>
        <NFormItem label="库区">
          <NInput v-model:value="zoneKeyword" clearable placeholder="库区名称" class="w-110px" />
        </NFormItem>
        <NFormItem>
          <NSwitch v-model:value="filters.onlyAvailable" size="small" />
          <span class="ml-6px text-12px">仅显示可用库位</span>
        </NFormItem>
        <NFormItem>
          <NButton type="primary" :loading="loading" @click="loadVisualization">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm></NCollapseItem></NCollapse>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper shrink-0">
      <FloorPlanStats :stats="visualization?.stats" :refresh-time="visualization?.refreshTime" />
    </NCard>

    <div class="floor-body min-h-0 flex flex-1 gap-12px overflow-hidden">
      <NCard :bordered="false" size="small" class="zone-sidebar card-wrapper w-260px shrink-0">
        <div class="mb-8px font-600">库区导航</div>
        <div
          class="zone-item"
          :class="{ active: selectedZoneId === 'all' }"
          @click="selectZone('all')"
        >
          <div class="flex justify-between">
            <span class="font-600">全部库区</span>
            <span class="text-12px">{{ visualization?.locationCount || 0 }}</span>
          </div>
          <NProgress type="line" :percentage="visualization?.occupancyPercent || 0" :height="6" class="mt-6px" />
        </div>
        <div
          v-for="zone in sidebarZones"
          :key="zone.zoneId"
          class="zone-item"
          :class="{ active: String(selectedZoneId) === String(zone.zoneId) }"
          @click="selectZone(zone.zoneId)"
        >
          <div class="flex justify-between gap-8px">
            <span class="font-600">{{ zone.zoneName }}</span>
            <span class="text-12px shrink-0">{{ zone.usedPalletCount }}/{{ zone.totalCapacity }}</span>
          </div>
          <NProgress type="line" :percentage="zone.occupancyPercent" :height="6" class="mt-6px" />
        </div>
      </NCard>

      <NCard :bordered="false" size="small" class="card-wrapper min-w-0 flex-1 flex-col" content-class="viz-card-body">
        <div
          ref="fullscreenHostRef"
          class="fullscreen-host"
          :class="{ 'css-fullscreen': useCssFullscreen }"
        >
          <div v-if="isFullscreen" class="fullscreen-banner">
            <span class="text-13px font-600">库存视图全屏</span>
            <NSpace size="small">
              <NButton size="small" type="primary" @click="exitFullscreen">
                <template #icon>
                  <icon-material-symbols-fullscreen-exit class="text-icon" />
                </template>
                退出全屏
              </NButton>
            </NSpace>
          </div>

          <div class="mb-10px flex flex-wrap items-center justify-between gap-8px">
            <NButtonGroup size="small">
              <NButton
                v-for="opt in FLOOR_PLAN_VIEW_OPTIONS"
                :key="opt.value"
                :type="viewMode === opt.value ? 'primary' : 'default'"
                @click="viewMode = opt.value"
              >
                {{ opt.label }}
              </NButton>
            </NButtonGroup>
            <NSpace size="small">
              <NButton size="small" quaternary @click="zoomStep(-0.1)">缩小</NButton>
              <span class="text-12px tabular-nums">{{ Math.round(mapScale * 100) }}%</span>
              <NButton size="small" quaternary @click="zoomStep(0.1)">放大</NButton>
              <NButton size="small" @click="toggleFullscreen">
                <template #icon>
                  <icon-material-symbols-fullscreen v-if="!isFullscreen" class="text-icon" />
                  <icon-material-symbols-fullscreen-exit v-else class="text-icon" />
                </template>
                {{ isFullscreen ? '退出全屏' : '全屏' }}
              </NButton>
              <NButton size="small" type="primary" :loading="loading" @click="loadVisualization">刷新</NButton>
            </NSpace>
          </div>

          <div class="mb-10px flex flex-wrap gap-8px text-11px text-#6b7280">
            <span class="font-600">图例</span>
            <span v-for="(style, key) in FLOOR_PLAN_OCCUPANCY_STYLES" :key="key" class="inline-flex items-center gap-4px">
              <span class="legend-dot" :style="{ background: style.bg, borderColor: style.border }" />
              {{ style.label }}
            </span>
            <span>🔒 锁定</span>
            <span>⚠ 异常</span>
          </div>

          <div class="map-panel min-h-0 flex-1 overflow-auto" :class="{ 'map-panel--fill': isFullscreen }">
            <NSpin :show="loading" class="map-spin">
              <FloorPlanGrid
                v-if="viewMode === 'map'"
                :zones="displayZones"
                :map-scale="mapScale"
                :selected-location-id="selectedLocation?.id"
                @select="openDetail"
              />
              <FloorPlanList
                v-else-if="viewMode === 'list'"
                :zones="displayZones"
                :fill-height="isFullscreen"
                @select="openDetail"
              />
              <FloorPlanKanban v-else :zones="displayZones" :fill-height="isFullscreen" @select="openDetail" />
            </NSpin>
          </div>

          <div class="floor-footer text-11px text-#9ca3af">
            说明：库位块内大数字为剩余库容（板）；平面图按排/列网格展示，Mock 数据演示。
          </div>
        </div>
      </NCard>
    </div>

    <FloorPlanDetailDrawer
      v-model:visible="detailVisible"
      :location="selectedLocation"
      :warehouse-id="warehouseId"
      @refresh="loadVisualization"
      @move="handleMove"
    />
  </div>
</template>

<style scoped lang="scss">
.floor-page {
  height: calc(100vh - 120px - var(--calc-footer-height, 0px));
}

.floor-body {
  min-height: 0;
}

:deep(.viz-card-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.zone-sidebar :deep(.n-card__content) {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

.zone-item {
  margin-bottom: 8px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgb(var(--primary-color) / 0.4);
  }

  &.active {
    border-color: rgb(var(--primary-color));
    background: rgb(var(--primary-color) / 0.06);
  }
}

.fullscreen-host {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.fullscreen-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgb(var(--primary-color) / 0.08);
  border: 1px solid rgb(var(--primary-color) / 0.2);
}

.map-panel {
  min-height: 420px;
  max-height: calc(100vh - 380px);
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid;
  border-radius: 3px;
}

.fullscreen-host:fullscreen,
.fullscreen-host.css-fullscreen {
  padding: 16px;
  background: var(--n-color);
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}

.fullscreen-host:fullscreen .map-panel,
.fullscreen-host.css-fullscreen .map-panel {
  flex: 1;
  max-height: none;
  min-height: 0;
  overflow: hidden;
}

.fullscreen-host:fullscreen .map-panel--fill,
.fullscreen-host.css-fullscreen .map-panel--fill {
  display: flex;
  flex-direction: column;
}

.map-spin {
  min-height: 0;
}

.map-panel--fill .map-spin {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.map-panel--fill .map-spin :deep(.n-spin-container) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.map-panel--fill .map-spin :deep(.n-spin-content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.floor-footer {
  flex-shrink: 0;
  margin-top: 8px;
}

.fullscreen-host:fullscreen .floor-footer,
.fullscreen-host.css-fullscreen .floor-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);
}

.fullscreen-host.css-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  width: 100vw;
  height: 100vh;
}
</style>
