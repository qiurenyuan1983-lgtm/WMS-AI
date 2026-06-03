<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NEmpty, NSelect, NSwitch, NTag } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGetOverview } from '@/service/api/yms/overview';
import DockBoardPanel from '../dispatch/modules/DockBoardPanel.vue';
import { YMS_ROUTE, ymsTo } from '../shared/yms-route';

defineOptions({ name: 'YmsOverview' });

const router = useRouter();

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const selectedWarehouseId = ref<CommonType.IdType | null>(null);

const overview = ref<Api.Yms.Overview>({
  todayCheckIns: 0,
  inYardCount: 0,
  waitDevanningCount: 0,
  waitLoadingCount: 0,
  totalDocks: 0,
  occupiedDocks: 0,
  freeDocks: 0,
  exceptionCount: 0,
  dispatchStats: null,
  recentEvents: [],
  hourlyTrends: [],
  timeoutWaitingCount: 0
});

const dockPanelRef = ref<InstanceType<typeof DockBoardPanel> | null>(null);

const statCards = [
  { label: '今日 Check-in', key: 'todayCheckIns', color: '#374151', route: YMS_ROUTE.gateInYard },
  { label: '当前在场', key: 'inYardCount', color: '#2563eb', route: YMS_ROUTE.gateInYard },
  { label: '等待拆柜', key: 'waitDevanningCount', color: '#8b5cf6', route: YMS_ROUTE.devanning },
  { label: '等待装车', key: 'waitLoadingCount', color: '#06b6d4', route: YMS_ROUTE.loading },
  { label: '空闲 Dock', key: 'freeDocks', color: '#10b981', route: null },
  { label: '异常任务', key: 'exceptionCount', color: '#ef4444', route: YMS_ROUTE.task }
] as const;

const EVENT_TYPE_TAG: Record<string, { type: 'success' | 'info' | 'warning' | 'error' | 'default'; label: string }> = {
  CHECK_IN: { type: 'success', label: '入场' },
  CHECK_OUT: { type: 'info', label: '离场' },
  TASK: { type: 'default', label: '任务' },
  EXCEPTION: { type: 'error', label: '异常' }
};

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
  if (warehouseOptions.value.length && !selectedWarehouseId.value) {
    selectedWarehouseId.value = warehouseOptions.value[0].value;
  }
}

async function loadOverview() {
  const { data } = await fetchGetOverview(selectedWarehouseId.value);
  if (data) overview.value = data;
}

async function refreshAll() {
  await loadOverview();
  dockPanelRef.value?.reload();
}

function handleCardClick(card: typeof statCards[number]) {
  if (card.route) {
    router.push(ymsTo(card.route));
  }
}

function formatEventTime(time: string | null) {
  if (!time) return '—';
  const d = new Date(time);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const autoRefresh = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function toggleAutoRefresh(val: boolean) {
  if (val) timer = setInterval(refreshAll, 30000);
  else if (timer) clearInterval(timer);
}

onMounted(async () => {
  await loadWarehouses();
  await refreshAll();
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div
    class="overview-root h-full flex flex-col gap-12px overflow-hidden"
  >
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="flex items-center justify-between flex-wrap gap-12px mb-12px">
        <span class="text-16px font-semibold text-gray-700">园区总览</span>
        <div class="flex items-center gap-8px flex-wrap">
          <NSelect
            v-model:value="selectedWarehouseId"
            :options="warehouseOptions"
            placeholder="选择仓库"
            class="w-180px"
            @update:value="refreshAll"
          />
          <span class="text-12px text-gray-500">自动刷新</span>
          <NSwitch v-model:value="autoRefresh" size="small" @update:value="toggleAutoRefresh" />
          <NButton size="small" @click="refreshAll">刷新</NButton>
        </div>
      </div>

      <div class="stat-grid">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="stat-card"
          @click="handleCardClick(card)"
        >
          <span class="stat-num" :style="{ color: card.color }">
            {{ overview[card.key] }}
          </span>
          <span class="stat-label">{{ card.label }}</span>
          <span v-if="card.key === 'freeDocks'" class="stat-sub">
            共 {{ overview.totalDocks }} 个 Dock，占用 {{ overview.occupiedDocks }}
          </span>
          <span v-else-if="card.key === 'exceptionCount' && overview.timeoutWaitingCount" class="stat-sub text-orange-500">
            等待超时 {{ overview.timeoutWaitingCount }}
          </span>
        </div>
      </div>

      <div v-if="overview.hourlyTrends?.length" class="trend-bar mt-12px">
        <span class="text-12px text-gray-500 mr-8px">今日 Check-in 趋势</span>
        <div class="trend-cols">
          <div
            v-for="t in overview.hourlyTrends.filter(x => x.checkInCount > 0 || x.hour >= 6 && x.hour <= 20)"
            :key="t.hour"
            class="trend-col"
            :title="`${t.hour}:00 — ${t.checkInCount}`"
          >
            <div class="trend-fill" :style="{ height: `${Math.min(t.checkInCount * 12, 48)}px` }" />
            <span class="trend-h">{{ t.hour }}</span>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 两栏：Dock 看板 | 事件流 -->
    <div class="main-grid flex-1 min-h-0 overflow-hidden">
      <NCard :bordered="false" class="card-wrapper dock-panel overflow-y-auto min-w-0">
        <div class="panel-title">Dock 看板</div>
        <DockBoardPanel
          ref="dockPanelRef"
          :warehouse-id="selectedWarehouseId"
          :selected-task="null"
          @operated="refreshAll"
        />
      </NCard>

      <NCard :bordered="false" class="card-wrapper event-panel overflow-y-auto flex-shrink-0">
        <div class="panel-title">实时事件</div>
        <NEmpty v-if="!overview.recentEvents?.length" description="暂无事件" class="mt-40px" />
        <div v-else class="event-list">
          <div v-for="(evt, idx) in overview.recentEvents" :key="idx" class="event-item">
            <div class="flex items-center gap-6px mb-2px">
              <span class="event-time">{{ formatEventTime(evt.eventTime) }}</span>
              <NTag size="tiny" :type="EVENT_TYPE_TAG[evt.eventType]?.type ?? 'default'">
                {{ EVENT_TYPE_TAG[evt.eventType]?.label ?? evt.eventType }}
              </NTag>
            </div>
            <div class="event-msg">{{ evt.message }}</div>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.main-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 300px;
}
@media (max-width: 960px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}
.dock-panel :deep(.n-card__content),
.event-panel :deep(.n-card__content) {
  height: calc(100% - 8px);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 1200px) {
  .stat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.stat-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px #dbeafe;
}
.stat-num { font-size: 26px; font-weight: 700; line-height: 1.1; }
.stat-label { font-size: 12px; color: #6b7280; }
.stat-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.event-list { display: flex; flex-direction: column; gap: 10px; }
.event-item { border-bottom: 1px dashed #e5e7eb; padding-bottom: 8px; }
.event-time { font-size: 12px; font-weight: 600; color: #374151; font-variant-numeric: tabular-nums; }
.event-msg { font-size: 12px; color: #4b5563; line-height: 1.4; }
.trend-bar { display: flex; align-items: flex-end; gap: 8px; }
.trend-cols { display: flex; align-items: flex-end; gap: 4px; flex: 1; overflow-x: auto; }
.trend-col { display: flex; flex-direction: column; align-items: center; min-width: 20px; }
.trend-fill { width: 14px; background: #3b82f6; border-radius: 2px 2px 0 0; min-height: 2px; }
.trend-h { font-size: 10px; color: #9ca3af; margin-top: 2px; }
</style>
