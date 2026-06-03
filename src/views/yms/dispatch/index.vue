<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NSelect, NSwitch } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchGetDispatchStats } from '@/service/api/yms/dispatch';
import { fetchGetWarehouseList } from '@/service/api/base';
import { useAuth } from '@/hooks/business/auth';
import DockBoardPanel from './modules/DockBoardPanel.vue';
import { YMS_ROUTE, ymsTo } from '../shared/yms-route';

defineOptions({ name: 'YmsDispatch' });

const router = useRouter();
const { hasAuth } = useAuth();

const warehouseOptions = ref<{ label: string; value: any }[]>([]);
const selectedWarehouseId = ref<CommonType.IdType | null>(null);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? (Array.isArray(data) ? data : []);
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
  if (warehouseOptions.value.length) selectedWarehouseId.value = warehouseOptions.value[0].value;
}

const stats = ref<Api.Yms.DispatchStats>({
  totalTasks: 0, waitingTasks: 0, workingTasks: 0, devanningTasks: 0,
  loadingTasks: 0, finishedTasks: 0, inYardVehicles: 0, totalDocks: 0, occupiedDocks: 0,
});

async function loadStats() {
  const { data } = await fetchGetDispatchStats(selectedWarehouseId.value as any);
  if (data) stats.value = data;
}

const dockPanelRef = ref<InstanceType<typeof DockBoardPanel> | null>(null);

async function refreshAll() {
  await loadStats();
  dockPanelRef.value?.reload();
}

const autoRefresh = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function toggleAutoRefresh(val: boolean) {
  if (val) timer = setInterval(refreshAll, 30000);
  else if (timer) clearInterval(timer);
}

onMounted(async () => {
  await loadWarehouses();
  await loadStats();
});
onUnmounted(() => { if (timer) clearInterval(timer); });

const statItems = [
  { label: '任务总数',  key: 'totalTasks',    color: '#374151' },
  { label: '拆柜任务',  key: 'devanningTasks', color: '#8b5cf6' },
  { label: '装车任务',  key: 'loadingTasks',   color: '#06b6d4' },
  { label: '作业中',    key: 'workingTasks',   color: '#3b82f6' },
  { label: '已完成',    key: 'finishedTasks',  color: '#10b981' },
  { label: '在场车辆',  key: 'inYardVehicles', color: '#374151' },
];

const navLinks = [
  { label: '拆柜调度', route: YMS_ROUTE.devanning },
  { label: '装车调度', route: YMS_ROUTE.loading },
  { label: '任务管理', route: YMS_ROUTE.task },
  { label: '园区总览', route: YMS_ROUTE.overview }
];
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">

    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="flex items-center justify-between flex-wrap gap-12px">
        <div class="flex flex-col gap-6px">
          <div class="flex items-center gap-24px flex-wrap">
            <span class="text-16px font-semibold text-gray-700">园区调度</span>
            <div v-for="item in statItems" :key="item.label" class="stat-item">
              <span class="stat-num" :style="{ color: item.color }">{{ (stats as any)[item.key] }}</span>
              <span class="stat-label">{{ item.label }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-num" style="color: #2563eb">{{ stats.occupiedDocks }}/{{ stats.totalDocks }}</span>
              <span class="stat-label">Dock使用率</span>
            </div>
          </div>
          <span class="text-12px text-gray-400">
            调度工作台：全类型 Dock 看板 + 快捷入口；拆柜/装车请进入专项调度页；大屏监控请用园区总览
          </span>
        </div>

        <div class="flex items-center gap-8px flex-wrap">
          <NButton
            v-for="link in navLinks"
            :key="link.route"
            size="small"
            secondary
            @click="router.push(ymsTo(link.route))"
          >{{ link.label }}</NButton>
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
          <NButton
            v-if="hasAuth('yms:yard:create')"
            type="primary" size="small"
            @click="router.push(ymsTo(YMS_ROUTE.dispatchCreate))"
          >新建任务</NButton>
        </div>
      </div>
    </NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper overflow-y-auto">
      <DockBoardPanel
        ref="dockPanelRef"
        :warehouse-id="selectedWarehouseId"
        :selected-task="null"
        @operated="refreshAll"
      />
    </NCard>
  </div>
</template>

<style scoped>
.stat-item  { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 52px; }
.stat-num   { font-size: 22px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 11px; color: #6b7280; }
</style>
