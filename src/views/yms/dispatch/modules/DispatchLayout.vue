<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NSelect, NSwitch } from 'naive-ui';
import { fetchGetDispatchStats } from '@/service/api/yms/dispatch';
import { fetchGetWarehouseList } from '@/service/api/base';
import { useAuth } from '@/hooks/business/auth';
import { useRouter } from 'vue-router';
import DockBoardPanel from './DockBoardPanel.vue';
import TaskListPanel from './TaskListPanel.vue';
import { YMS_ROUTE, ymsTo } from '../../shared/yms-route';
import { getTaskDisplayNo } from './dispatch-meta';

const props = defineProps<{
  taskGroup: 'DEVANNING' | 'LOADING';
}>();

const router = useRouter();
const { hasAuth } = useAuth();

const TITLE = { DEVANNING: '拆柜调度', LOADING: '装车调度' };

// 仓库
const warehouseOptions = ref<{ label: string; value: any }[]>([]);
const selectedWarehouseId = ref<CommonType.IdType | null>(null);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? (Array.isArray(data) ? data : []);
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
  if (warehouseOptions.value.length) selectedWarehouseId.value = warehouseOptions.value[0].value;
}

// 统计
const stats = ref<Api.Yms.DispatchStats>({
  totalTasks: 0, waitingTasks: 0, workingTasks: 0, devanningTasks: 0,
  loadingTasks: 0, finishedTasks: 0, inYardVehicles: 0, totalDocks: 0, occupiedDocks: 0,
});

async function loadStats() {
  const { data } = await fetchGetDispatchStats(selectedWarehouseId.value as any, props.taskGroup);
  if (data) stats.value = data;
}

// 选中任务（用于分配 Dock）
const _selectedTask = ref<Api.Yms.YardTask | null>(null);
const selectedTaskId = computed(() => _selectedTask.value?.id ?? null);

function onTaskSelect(task: Api.Yms.YardTask | null) {
  _selectedTask.value = task;
}

// 面板 Ref
const taskPanelRef = ref<InstanceType<typeof TaskListPanel> | null>(null);
const dockPanelRef = ref<InstanceType<typeof DockBoardPanel> | null>(null);

async function refreshAll() {
  await loadStats();
  taskPanelRef.value?.reload();
  dockPanelRef.value?.reload();
}

function onAssigned() {
  _selectedTask.value = null;
  refreshAll();
}

function onOperated() {
  refreshAll();
}

// 自动刷新
const autoRefresh = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function toggleAutoRefresh(val: boolean) {
  if (val) timer = setInterval(refreshAll, 30000);
  else if (timer) clearInterval(timer);
}

// 生命周期
onMounted(async () => {
  await loadWarehouses();
  await loadStats();
});

onUnmounted(() => { if (timer) clearInterval(timer); });

// 统计数字配置
const statItems = computed(() => {
  if (props.taskGroup === 'DEVANNING') {
    return [
      { label: '拆柜任务', val: stats.value.devanningTasks, color: '#8b5cf6' },
      { label: '排队中',   val: stats.value.waitingTasks,   color: '#f97316' },
      { label: '作业中',   val: stats.value.workingTasks,   color: '#3b82f6' },
      { label: '已完成',   val: stats.value.finishedTasks,  color: '#10b981' },
      { label: '在场车辆', val: stats.value.inYardVehicles, color: '#374151' },
      { label: 'Dock使用率', val: `${stats.value.occupiedDocks}/${stats.value.totalDocks}`, color: '#2563eb' },
    ];
  }
  return [
    { label: '装车任务',  val: stats.value.loadingTasks,   color: '#06b6d4' },
    { label: '排队中',    val: stats.value.waitingTasks,   color: '#f97316' },
    { label: '作业中',    val: stats.value.workingTasks,   color: '#3b82f6' },
    { label: '已完成',    val: stats.value.finishedTasks,  color: '#10b981' },
    { label: '在场车辆',  val: stats.value.inYardVehicles, color: '#374151' },
    { label: 'Dock使用率', val: `${stats.value.occupiedDocks}/${stats.value.totalDocks}`, color: '#2563eb' },
  ];
});
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">

    <!-- 顶部统计 -->
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="dispatch-header flex items-center gap-16px flex-wrap">
        <!-- 左侧统计 -->
        <div class="header-side flex items-center gap-24px flex-wrap">
          <div v-for="item in statItems" :key="item.label" class="stat-item">
            <span class="stat-num" :style="{ color: item.color }">{{ item.val }}</span>
            <span class="stat-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 居中标题 -->
        <h1 class="header-title">{{ TITLE[taskGroup] }}</h1>

        <!-- 右侧控制 -->
        <div class="header-side flex items-center gap-8px flex-wrap justify-end">
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

    <!-- 选中任务提示 -->
    <div
      v-if="_selectedTask"
      class="flex-shrink-0 px-16px py-8px rounded-6px bg-blue-50 border border-blue-200 text-sm flex items-center gap-8px"
    >
      <span class="text-blue-600 font-medium">
        已选中：{{ getTaskDisplayNo(_selectedTask, taskGroup) }}
      </span>
      <span class="text-gray-500">点击空闲Dock可直接分配</span>
      <NButton size="tiny" @click="_selectedTask = null">取消选中</NButton>
    </div>

    <!-- 主区域 -->
    <div class="flex-1 flex gap-12px overflow-hidden">

      <!-- 左：任务列表 -->
      <NCard
        :bordered="false"
        class="w-430px flex-shrink-0 card-wrapper flex flex-col overflow-hidden"
        :content-style="{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0, padding: '12px' }"
      >
        <TaskListPanel
          ref="taskPanelRef"
          :warehouse-id="selectedWarehouseId"
          :task-group="taskGroup"
          :selected-task-id="selectedTaskId"
          :status-counts="stats.statusCounts"
          @select="onTaskSelect"
          @operated="onOperated"
        />
      </NCard>

      <!-- 右：Dock 看板 -->
      <NCard :bordered="false" class="flex-1 card-wrapper overflow-y-auto">
        <DockBoardPanel
          ref="dockPanelRef"
          :warehouse-id="selectedWarehouseId"
          :task-group="taskGroup"
          :selected-task="_selectedTask"
          @assigned="onAssigned"
          @operated="onOperated"
        />
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.dispatch-header { position: relative; }
.header-side { flex: 1; min-width: 0; }
.header-title {
  flex-shrink: 0;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #374151;
  letter-spacing: 0.04em;
  text-align: center;
}
.stat-item  { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 52px; }
.stat-num   { font-size: 22px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 11px; color: #6b7280; }
</style>
