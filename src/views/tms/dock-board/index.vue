<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NProgress, NSwitch, NTag } from 'naive-ui';
import { fetchGetTmsDockBoard } from '@/service/api/tms';
import TripDeadlineCountdown from '@/components/tms/TripDeadlineCountdown.vue';
import TripDeadlineRiskTag from '@/components/tms/TripDeadlineRiskTag.vue';
import { TMS_DOCK_STATUS_META } from '../constants';

defineOptions({ name: 'TmsDockBoard' });

const docks = ref<Api.Tms.DockSlot[]>([]);
const loading = ref(false);
const autoRefresh = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;

const statusColor: Record<string, string> = {
  IDLE: '#10b981',
  RESERVED: '#3b82f6',
  CHECKED_IN: '#06b6d4',
  QUEUING: '#f59e0b',
  LOADING: '#8b5cf6',
  DEPARTED: '#6b7280',
  EXCEPTION: '#ef4444',
  CLOSED: '#9ca3af'
};

async function loadBoard() {
  loading.value = true;
  try {
    const { data } = await fetchGetTmsDockBoard();
    docks.value = data ?? [];
  } finally {
    loading.value = false;
  }
}

function toggleAutoRefresh(val: boolean) {
  if (val) timer = setInterval(loadBoard, 15000);
  else if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function progressPercent(dock: Api.Tms.DockSlot) {
  if (!dock.palletQty) return 0;
  return Math.round((dock.loadedPallet / dock.palletQty) * 100);
}

onMounted(() => {
  loadBoard();
  if (autoRefresh.value) toggleAutoRefresh(true);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-auto">
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="flex items-center justify-between flex-wrap gap-8px">
        <div>
          <span class="text-16px font-semibold">DOCK 实时看板</span>
          <span class="text-13px text-gray-500 ml-8px">排队 · 装车进度 · 异常监控</span>
        </div>
        <div class="flex items-center gap-8px">
          <span class="text-12px text-gray-500">自动刷新 15s</span>
          <NSwitch v-model:value="autoRefresh" size="small" @update:value="toggleAutoRefresh" />
          <NButton size="small" :loading="loading" @click="loadBoard">刷新</NButton>
        </div>
      </div>
    </NCard>

    <div class="dock-grid">
      <NCard
        v-for="dock in docks"
        :key="dock.id"
        size="small"
        :bordered="false"
        class="dock-card"
        :style="{ borderTop: `4px solid ${statusColor[dock.status] ?? '#e5e7eb'}` }"
      >
        <div class="flex items-center justify-between mb-8px">
          <span class="text-16px font-bold">{{ dock.dockNo }}</span>
          <NTag :type="TMS_DOCK_STATUS_META[dock.status]?.type ?? 'default'" size="small">
            {{ TMS_DOCK_STATUS_META[dock.status]?.label ?? dock.status }}
          </NTag>
        </div>
        <template v-if="dock.tripNo">
          <div class="dock-row"><span class="label">车次</span>{{ dock.tripNo }}</div>
          <div class="dock-row"><span class="label">司机</span>{{ dock.driverName ?? '—' }}</div>
          <div class="dock-row"><span class="label">车牌</span>{{ dock.plateNo ?? '—' }}</div>
          <div class="dock-row"><span class="label">目的地</span>{{ dock.destination ?? '—' }}</div>
          <div v-if="dock.appointmentTime" class="dock-row">
            <span class="label">预约</span>{{ dock.appointmentTime }}
          </div>
          <div v-if="dock.distanceMiles != null" class="dock-row">
            <span class="label">距离</span>{{ dock.distanceMiles }} mi · 行驶 {{ dock.estimatedTravelMinutes }} 分
          </div>
          <div v-if="dock.latestStartLoadingTime" class="dock-row">
            <span class="label">最晚开始</span>{{ dock.latestStartLoadingTime }}
          </div>
          <div v-if="dock.latestFinishTime" class="dock-row">
            <span class="label">最晚完成</span>{{ dock.latestFinishTime }}
          </div>
          <div v-if="dock.latestFinishTime" class="dock-deadline mt-8px">
            <TripDeadlineCountdown
              :appointment-time="dock.appointmentTime"
              :origin-warehouse="dock.originWarehouse"
              :destination="dock.destination"
              :pallet-qty="dock.palletQty"
              :latest-finish-time="dock.latestFinishTime"
              :latest-start-loading-time="dock.latestStartLoadingTime"
              :remaining-minutes="dock.remainingMinutes"
              :deadline-risk-level="dock.deadlineRiskLevel"
              :tick-ms="15000"
            />
            <TripDeadlineRiskTag :level="dock.deadlineRiskLevel" size="small" />
          </div>
          <div class="dock-row"><span class="label">板数</span>{{ dock.palletQty }} 板</div>
          <div v-if="dock.palletQty > 0" class="mt-8px">
            <div class="text-12px text-gray-500 mb-4px">装车进度 {{ dock.loadedPallet }}/{{ dock.palletQty }}</div>
            <NProgress type="line" :percentage="progressPercent(dock)" :show-indicator="false" />
          </div>
          <div v-if="dock.exceptionNote" class="mt-8px text-12px text-red-500">异常：{{ dock.exceptionNote }}</div>
          <div v-if="dock.etaDepart" class="mt-4px text-12px text-gray-400">预计发车 {{ dock.etaDepart }}</div>
        </template>
        <div v-else class="text-13px text-gray-400 py-24px text-center">空闲 · 可安排车辆</div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.dock-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 1200px) {
  .dock-grid { grid-template-columns: repeat(2, 1fr); }
}
.dock-card { min-height: 200px; }
.dock-row {
  font-size: 13px;
  color: #374151;
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
}
.dock-row .label {
  color: #9ca3af;
  width: 56px;
  flex-shrink: 0;
}
.dock-deadline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f9fafb;
}
</style>
