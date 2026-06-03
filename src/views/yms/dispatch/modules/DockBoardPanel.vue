<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDrawer, NDrawerContent, NEmpty, NModal, NPopconfirm, NProgress, NSelect, NSpin, NTag } from 'naive-ui';
import {
  fetchAssignDock, fetchFinishWork, fetchGetDockBoard, fetchGetFreeYardSlots,
  fetchGetFreeDocks, fetchPauseWork, fetchRelease, fetchResumeWork, fetchStartWork
} from '@/service/api/yms/dispatch';
import { useAuth } from '@/hooks/business/auth';
import { DOCK_TYPE_LABEL } from './dispatch-meta';

const props = withDefaults(defineProps<{
  warehouseId: CommonType.IdType | null;
  selectedTask?: Api.Yms.YardTask | null;
  taskGroup?: '' | 'DEVANNING' | 'LOADING';
}>(), { selectedTask: null, taskGroup: '' });

const emit = defineEmits<{ assigned: []; operated: [] }>();
const { hasAuth } = useAuth();

// ─── 元数据 ──────────────────────────────────────────────────────────

const DOCK_STATUS_COLOR: Record<string, { bg: string; border: string; label: string }> = {
  IDLE:        { bg: '#f0fdf4', border: '#86efac', label: '空闲' },
  OCCUPIED:    { bg: '#fff7ed', border: '#fdba74', label: '作业中' },
  MAINTENANCE: { bg: '#fef2f2', border: '#fca5a5', label: '维护中' },
  DISABLED:    { bg: '#f9fafb', border: '#d1d5db', label: '停用' },
};

const STATUS_LABEL: Record<string, string> = {
  DOCK_ASSIGNED: '已分配Dock', DOCK_WORKING: '作业中',
  DEVANNING: '卸柜中', LOADING: '装车中',
  OPERATION_PAUSED: '作业暂停', OPERATION_FINISHED: '作业完成',
};

const INTERNAL_TASK_STATUS_LABEL: Record<string, string> = {
  PENDING: '待领取',
  ASSIGNED: '已分配',
  ACCEPTED: '已领取',
  IN_PROGRESS: '执行中',
};

const TASK_TYPE_LABEL: Record<string, string> = {
  DEVANNING: '卸柜任务', DELIVERY_LOADING: '派送装车',
  TRANSFER_LOADING: '调拨装车', PICKUP_LOADING: '自提装车',
  RETURN_LOADING: '退货装车', OTHER: '其他',
};

// ─── 数据 ────────────────────────────────────────────────────────────

const docks = ref<Api.Yms.DockBoard[]>([]);
const docksLoading = ref(false);

const dockGroups = computed(() => {
  const groups: Record<string, Api.Yms.DockBoard[]> = {};
  for (const d of docks.value) {
    const key = d.dockLocation || '默认区域';
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  }
  return groups;
});

function getDockMeta(dock: Api.Yms.DockBoard) {
  if (dock.dockStatus === 'MAINTENANCE') return DOCK_STATUS_COLOR.MAINTENANCE;
  if (dock.dockStatus === 'DISABLED' || dock.enabledFlag === 0) return DOCK_STATUS_COLOR.DISABLED;
  if (dock.activeTask || dock.incomingTasks?.length) return DOCK_STATUS_COLOR.OCCUPIED;
  return DOCK_STATUS_COLOR.IDLE;
}

function canAssignToDock(dock: Api.Yms.DockBoard) {
  return Boolean(
    props.selectedTask
    && canReceiveTask(dock)
  );
}

function canReceiveTask(dock: Api.Yms.DockBoard) {
  return Boolean(
    !dock.activeTask
    && !dock.incomingTasks?.length
    && dock.dockStatus !== 'MAINTENANCE'
    && dock.dockStatus !== 'DISABLED'
    && dock.enabledFlag !== 0
  );
}

function canDropToDock(dock: Api.Yms.DockBoard) {
  return Boolean(
    dock.dockStatus !== 'MAINTENANCE'
    && dock.dockStatus !== 'DISABLED'
    && dock.enabledFlag !== 0
  );
}

function formatElapsed(start: string | null) {
  if (!start) return '';
  const ms = Date.now() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

async function reload() {
  docksLoading.value = true;
  try {
    const { data } = await fetchGetDockBoard(
      props.warehouseId as any,
      props.taskGroup || undefined
    );
    if (data) docks.value = data;
  } finally {
    docksLoading.value = false;
  }
}

watch(() => [props.warehouseId, props.taskGroup], reload, { immediate: true });

// ─── 操作 ────────────────────────────────────────────────────────────

async function handleAssignDock(dockId: CommonType.IdType) {
  if (!props.selectedTask) return;
  const { error } = await fetchAssignDock({ yardTaskId: props.selectedTask.id, dockId });
  if (!error) { window.$message?.success('已分配目标道口，如资源不在道口会生成 YardGo 上口任务'); emit('assigned'); reload(); }
}

async function handleStart(id: CommonType.IdType) {
  const { error } = await fetchStartWork(id);
  if (!error) { window.$message?.success('开始作业'); emit('operated'); reload(); }
}

// ─── 完成作业 + 下口目的地选择 ─────────────────────────────────────────

const finishModalVisible = ref(false);
const finishingTaskId = ref<CommonType.IdType | null>(null);
const finishDestType = ref<'position' | 'dock' | null>(null);
const finishToPositionId = ref<CommonType.IdType | null>(null);
const finishToDockId = ref<CommonType.IdType | null>(null);
const freeSlotOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const freeDockOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

async function openFinishModal(taskId: CommonType.IdType) {
  finishingTaskId.value = taskId;
  finishDestType.value = null;
  finishToPositionId.value = null;
  finishToDockId.value = null;
  if (props.warehouseId) {
    const [slotRes, dockRes] = await Promise.all([
      fetchGetFreeYardSlots(props.warehouseId),
      fetchGetFreeDocks(props.warehouseId)
    ]);
    freeSlotOptions.value = (slotRes.data ?? []).map((s: any) => ({
      label: `${s.dockCode}${s.zoneCode ? `（${s.zoneCode}）` : ''}`,
      value: s.id
    }));
    freeDockOptions.value = (dockRes.data ?? []).map((d: any) => ({
      label: `${d.dockCode}${d.dockName ? ' - ' + d.dockName : ''}`,
      value: d.id
    }));
  }
  finishModalVisible.value = true;
}

async function confirmFinish() {
  if (!finishingTaskId.value) return;
  if (!finishDestType.value || (finishDestType.value === 'position' && !finishToPositionId.value) || (finishDestType.value === 'dock' && !finishToDockId.value)) {
    window.$message?.warning('请选择下口目的地');
    return;
  }
  const body: Record<string, any> = {};
  if (finishDestType.value === 'position' && finishToPositionId.value) {
    body.toPositionId = finishToPositionId.value;
  } else if (finishDestType.value === 'dock' && finishToDockId.value) {
    body.toDockId = finishToDockId.value;
  }
  const { error } = await fetchFinishWork(finishingTaskId.value, body);
  if (!error) {
    window.$message?.success('作业完成，已生成 YardGo 下口任务');
    finishModalVisible.value = false;
    emit('operated');
    reload();
  }
}

async function handleRelease(id: CommonType.IdType) {
  const { error } = await fetchRelease(id);
  if (!error) { window.$message?.success('放行成功'); emit('operated'); reload(); }
}

async function handlePause(id: CommonType.IdType) {
  const { error } = await fetchPauseWork(id);
  if (!error) { window.$message?.success('已暂停'); emit('operated'); reload(); }
}

async function handleResume(id: CommonType.IdType) {
  const { error } = await fetchResumeWork(id);
  if (!error) { window.$message?.success('已恢复'); emit('operated'); reload(); }
}

// ─── 道口抽屉 ──────────────────────────────────────────────────────────

const drawerVisible = ref(false);
const drawerDock = ref<Api.Yms.DockBoard | null>(null);

function openDrawer(dock: Api.Yms.DockBoard) {
  drawerDock.value = dock;
  drawerVisible.value = true;
}

async function handleCancelQueue(taskId: CommonType.IdType) {
  const { error } = await fetchAssignDock({ yardTaskId: taskId, dockId: null });
  if (!error) {
    window.$message?.success('已取消排队');
    drawerVisible.value = false;
    emit('operated');
    reload();
  }
}

async function handleCancelAssign(taskId: CommonType.IdType) {
  const { error } = await fetchAssignDock({ yardTaskId: taskId, dockId: null });
  if (!error) {
    window.$message?.success('已取消分配');
    drawerVisible.value = false;
    emit('operated');
    reload();
  }
}

async function handleStartInDrawer(taskId: CommonType.IdType) {
  const { error } = await fetchStartWork(taskId);
  if (!error) {
    window.$message?.success('已开始作业');
    drawerVisible.value = false;
    emit('operated');
    reload();
  }
}

async function handlePauseInDrawer(taskId: CommonType.IdType) {
  const { error } = await fetchPauseWork(taskId);
  if (!error) {
    window.$message?.success('已暂停'); drawerVisible.value = false; emit('operated'); reload();
  }
}

async function handleResumeInDrawer(taskId: CommonType.IdType) {
  const { error } = await fetchResumeWork(taskId);
  if (!error) {
    window.$message?.success('已恢复'); drawerVisible.value = false; emit('operated'); reload();
  }
}

async function handleReleaseInDrawer(taskId: CommonType.IdType) {
  const { error } = await fetchRelease(taskId);
  if (!error) {
    window.$message?.success('放行成功'); drawerVisible.value = false; emit('operated'); reload();
  }
}

const DRAWER_STATUS_TYPE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  DOCK_ASSIGNED: 'warning', ON_DOCK: 'warning', DOCK_WORKING: 'warning',
  DEVANNING: 'warning', LOADING: 'warning', OPERATION_PAUSED: 'error',
  OPERATION_FINISHED: 'success', RELEASED: 'success', QUEUED: 'info',
};
const DRAWER_STATUS_LABEL: Record<string, string> = {
  DOCK_ASSIGNED: '已分配', ON_DOCK: '已上口', DOCK_WORKING: '作业中',
  DEVANNING: '卸柜中', LOADING: '装车中', OPERATION_PAUSED: '作业暂停',
  OPERATION_FINISHED: '作业完成', RELEASED: '已放行', QUEUED: '排队中',
};

// ─── 拖拽分配 ──────────────────────────────────────────────────────────

const dragOverDockId = ref<CommonType.IdType | null>(null);

function onDragOver(e: DragEvent, dock: Api.Yms.DockBoard) {
  if (!canDropToDock(dock)) return;
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  dragOverDockId.value = dock.id;
}

function onDragLeave(e: DragEvent) {
  const rel = e.relatedTarget as HTMLElement | null;
  if (!rel || !(e.currentTarget as HTMLElement).contains(rel)) {
    dragOverDockId.value = null;
  }
}

async function onDrop(e: DragEvent, dock: Api.Yms.DockBoard) {
  e.preventDefault();
  dragOverDockId.value = null;
  if (!canDropToDock(dock)) return;
  const raw = e.dataTransfer?.getData('application/json');
  if (!raw) return;
  const task = JSON.parse(raw);
  const { error } = await fetchAssignDock({ yardTaskId: task.id, dockId: dock.id });
  if (!error) {
    window.$message?.success(`已将 ${task.containerNo || task.sourceOrderNo || task.yardTaskNo} 分配至 ${dock.dockCode}；如资源不在道口会生成 YardGo 上口任务`);
    emit('assigned');
    reload();
  }
}

defineExpose({ reload });
</script>

<template>
  <NSpin :show="docksLoading" class="h-full">
    <NEmpty v-if="!docks.length" description="暂无Dock数据" class="mt-60px" />

    <div v-for="(groupDocks, location) in dockGroups" :key="location" class="mb-20px">
      <div class="flex items-center gap-8px mb-10px">
        <div class="w-3px h-16px rounded bg-blue-500" />
        <span class="text-14px font-semibold text-gray-700">{{ location }}</span>
        <span class="text-12px text-gray-400">{{ groupDocks.length }} 个Dock</span>
      </div>

      <div class="dock-grid">
        <div
          v-for="dock in groupDocks"
          :key="dock.id"
          class="dock-card"
          :style="{ background: getDockMeta(dock).bg, borderColor: getDockMeta(dock).border }"
          :class="{
            'dock-selectable': canAssignToDock(dock),
            'dock-disabled': dock.dockStatus === 'MAINTENANCE'
              || dock.dockStatus === 'DISABLED' || dock.enabledFlag === 0,
            'dock-drag-over': dragOverDockId === dock.id,
          }"
          @click="canAssignToDock(dock)
            ? handleAssignDock(dock.id) : openDrawer(dock)"
          @dragover="onDragOver($event, dock)"
          @dragleave="onDragLeave($event)"
          @drop="onDrop($event, dock)"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between mb-4px">
            <span class="font-semibold text-13px">{{ dock.dockCode }}</span>
            <div class="flex items-center gap-4px">
              <span v-if="dock.dockType" class="text-10px text-gray-500">{{ DOCK_TYPE_LABEL[dock.dockType] ?? dock.dockType }}</span>
              <span v-if="dock.enableQueue"
                class="text-10px text-blue-500 border border-blue-200 rounded px-3px">队</span>
              <span class="text-11px" :style="{ color: getDockMeta(dock).border }">
                {{ dock.activeTask
                  ? (STATUS_LABEL[dock.activeTask.yardStatus] ?? '作业中')
                  : getDockMeta(dock).label }}
              </span>
            </div>
          </div>

          <!-- 空闲 -->
          <div v-if="!dock.activeTask && dock.dockStatus === 'IDLE' && dock.enabledFlag !== 0"
            class="text-center text-gray-400 text-12px py-10px">
            <span v-if="selectedTask" class="text-blue-500">点击分配</span>
            <span v-else>空闲</span>
          </div>

          <!-- 维护/停用 -->
          <div v-else-if="dock.dockStatus !== 'IDLE' && !dock.activeTask"
            class="text-center text-12px py-10px text-gray-400">
            {{ getDockMeta(dock).label }}
          </div>

          <!-- 作业中 -->
          <div v-else-if="dock.activeTask" class="active-task">
            <div class="font-mono font-semibold text-12px text-orange-700 truncate">
              {{ dock.activeTask.containerNo || dock.activeTask.sourceOrderNo }}
            </div>
            <div class="text-11px text-gray-500 mt-1px truncate">
              {{ TASK_TYPE_LABEL[dock.activeTask.taskType] }}
              <span v-if="dock.activeTask.dockStartTime" class="ml-4px text-orange-500">
                {{ formatElapsed(dock.activeTask.dockStartTime) }}
              </span>
            </div>
            <NProgress
              v-if="dock.activeTask.operationProgress != null"
              type="line"
              :percentage="dock.activeTask.operationProgress"
              :height="6" :border-radius="3" :show-indicator="false"
              class="mt-4px"
            />
            <div v-if="dock.activeTask.operationProgress != null"
              class="text-right text-11px text-gray-500 mt-1px">
              {{ dock.activeTask.operationProgress }}%
            </div>
            <!-- 快捷操作 -->
            <div class="mt-6px flex gap-4px flex-wrap" @click.stop>
              <NButton
                v-if="dock.activeTask.yardStatus === 'DOCK_ASSIGNED' && hasAuth('yms:yard:start')"
                size="tiny" type="primary"
                @click="handleStart(dock.activeTask!.id)">开始</NButton>
              <NButton
                v-if="['DEVANNING','LOADING','DOCK_WORKING'].includes(dock.activeTask.yardStatus) && hasAuth('yms:yard:start')"
                size="tiny"
                @click="handlePause(dock.activeTask!.id)">暂停</NButton>
              <NButton
                v-if="dock.activeTask.yardStatus === 'OPERATION_PAUSED' && hasAuth('yms:yard:start')"
                size="tiny" type="warning"
                @click="handleResume(dock.activeTask!.id)">恢复</NButton>
              <NButton
                v-if="['DEVANNING','LOADING','DOCK_WORKING','OPERATION_PAUSED'].includes(dock.activeTask.yardStatus) && hasAuth('yms:yard:finish')"
                size="tiny" type="success"
                @click="openFinishModal(dock.activeTask!.id)">完成</NButton>
              <NButton
                v-if="dock.activeTask.yardStatus === 'OPERATION_FINISHED' && hasAuth('yms:yard:release')"
                size="tiny" type="info"
                @click="handleRelease(dock.activeTask!.id)">放行</NButton>
            </div>
          </div>

          <!-- 排队 -->
          <!-- 调入中 -->
          <div v-if="dock.incomingTasks?.length" class="queue-list mt-6px">
            <div class="text-10px text-blue-500 mb-2px">YardGo调入 {{ dock.incomingTasks.length }}</div>
            <div v-for="(it, i) in dock.incomingTasks" :key="it.id"
              class="text-11px text-blue-700 font-mono py-1px">
              {{ i + 1 }}. {{ it.containerNo || it.sourceOrderNo }}
              <span class="text-10px text-gray-500">
                · {{ INTERNAL_TASK_STATUS_LABEL[it.openInternalTaskStatus || ''] || it.openInternalTaskStatus || '待处理' }}
              </span>
            </div>
          </div>

          <!-- 排队 -->
          <div v-if="dock.queuedTasks.length" class="queue-list mt-6px">
            <div class="text-10px text-gray-400 mb-2px">
              排队 {{ dock.queuedTasks.length }}<span v-if="dock.maxQueueCount">/{{ dock.maxQueueCount }}</span>
            </div>
            <div v-for="(qt, i) in dock.queuedTasks" :key="qt.id"
              class="text-11px text-gray-600 font-mono py-1px">
              {{ i + 1 }}. {{ qt.containerNo || qt.sourceOrderNo }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </NSpin>

  <!-- 道口详情抽屉 -->
  <NDrawer v-model:show="drawerVisible" :width="380" placement="right">
    <NDrawerContent :title="drawerDock ? `道口 ${drawerDock.dockCode}` : '道口详情'" closable>
      <template v-if="drawerDock">

        <!-- 道口基本信息 -->
        <div class="flex items-center gap-8px mb-16px flex-wrap">
          <NTag size="small" :type="drawerDock.dockStatus === 'IDLE' ? 'success' : drawerDock.dockStatus === 'OCCUPIED' ? 'warning' : 'default'">
            {{ drawerDock.dockStatus === 'IDLE' ? '空闲' : drawerDock.dockStatus === 'OCCUPIED' ? '占用中' : drawerDock.dockStatus }}
          </NTag>
          <span v-if="drawerDock.dockType" class="text-12px text-gray-500">
            {{ DOCK_TYPE_LABEL[drawerDock.dockType] ?? drawerDock.dockType }}
          </span>
          <span v-if="drawerDock.enableQueue" class="text-12px text-blue-500">支持排队</span>
        </div>

        <!-- 当前任务 -->
        <template v-if="drawerDock.activeTask">
          <div class="section-title">当前任务</div>
          <div class="task-detail-card">
            <div class="flex items-start justify-between mb-8px">
              <div>
                <div class="font-mono font-semibold text-14px text-orange-700">
                  {{ drawerDock.activeTask.containerNo || drawerDock.activeTask.sourceOrderNo || drawerDock.activeTask.yardTaskNo }}
                </div>
                <div class="text-12px text-gray-500 mt-2px">
                  {{ TASK_TYPE_LABEL[drawerDock.activeTask.taskType] || drawerDock.activeTask.taskType }}
                  <span v-if="drawerDock.activeTask.dockStartTime" class="ml-6px text-orange-500">
                    {{ formatElapsed(drawerDock.activeTask.dockStartTime) }}
                  </span>
                </div>
              </div>
              <NTag size="small" :type="DRAWER_STATUS_TYPE[drawerDock.activeTask.yardStatus] ?? 'default'">
                {{ DRAWER_STATUS_LABEL[drawerDock.activeTask.yardStatus] ?? drawerDock.activeTask.yardStatus }}
              </NTag>
            </div>
            <NProgress v-if="drawerDock.activeTask.operationProgress != null"
              type="line" :percentage="drawerDock.activeTask.operationProgress"
              :height="6" :border-radius="3" :show-indicator="false" class="mb-4px" />
            <div v-if="drawerDock.activeTask.operationProgress != null"
              class="text-right text-11px text-gray-400 mb-8px">
              进度 {{ drawerDock.activeTask.operationProgress }}%
            </div>
            <!-- 操作按钮 -->
            <div class="flex gap-8px flex-wrap">
              <NButton v-if="['DOCK_ASSIGNED','ON_DOCK'].includes(drawerDock.activeTask.yardStatus) && hasAuth('yms:yard:start')"
                type="primary" size="small" @click.stop="handleStartInDrawer(drawerDock!.activeTask!.id)">
                直接上口
              </NButton>
              <NButton v-if="['DEVANNING','LOADING','DOCK_WORKING'].includes(drawerDock.activeTask.yardStatus) && hasAuth('yms:yard:start')"
                size="small" @click.stop="handlePauseInDrawer(drawerDock!.activeTask!.id)">
                暂停
              </NButton>
              <NButton v-if="drawerDock.activeTask.yardStatus === 'OPERATION_PAUSED' && hasAuth('yms:yard:start')"
                type="warning" size="small" @click.stop="handleResumeInDrawer(drawerDock!.activeTask!.id)">
                恢复
              </NButton>
              <NButton v-if="['DEVANNING','LOADING','DOCK_WORKING','OPERATION_PAUSED'].includes(drawerDock.activeTask.yardStatus) && hasAuth('yms:yard:finish')"
                type="success" size="small"
                @click.stop="drawerVisible = false; openFinishModal(drawerDock!.activeTask!.id)">
                完成
              </NButton>
              <NButton v-if="drawerDock.activeTask.yardStatus === 'OPERATION_FINISHED' && hasAuth('yms:yard:release')"
                type="info" size="small" @click.stop="handleReleaseInDrawer(drawerDock!.activeTask!.id)">
                放行
              </NButton>
              <NPopconfirm v-if="['DOCK_ASSIGNED','ON_DOCK'].includes(drawerDock.activeTask.yardStatus)"
                @positive-click="handleCancelAssign(drawerDock!.activeTask!.id)">
                <template #trigger>
                  <NButton size="small" @click.stop>取消分配</NButton>
                </template>
                确认取消道口分配？任务将回到等待中
              </NPopconfirm>
            </div>
          </div>
        </template>

        <!-- 排队任务 -->
        <template v-if="drawerDock.incomingTasks?.length">
          <div class="section-title mt-16px">YardGo调入中（{{ drawerDock.incomingTasks.length }}）</div>
          <div v-for="(it, i) in drawerDock.incomingTasks" :key="it.id" class="task-detail-card mb-8px">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-12px text-gray-400 mr-6px">{{ i + 1 }}.</span>
                <span class="font-mono font-semibold text-13px">
                  {{ it.containerNo || it.sourceOrderNo || it.yardTaskNo }}
                </span>
                <div class="text-11px text-gray-400 mt-2px">
                  目标 {{ it.openInternalTaskTargetCode || drawerDock.dockCode }}
                  · {{ INTERNAL_TASK_STATUS_LABEL[it.openInternalTaskStatus || ''] || it.openInternalTaskStatus || '待处理' }}
                </div>
              </div>
              <NTag size="small" type="warning">上口中</NTag>
            </div>
          </div>
        </template>

        <template v-if="drawerDock.queuedTasks?.length">
          <div class="section-title mt-16px">排队任务（{{ drawerDock.queuedTasks.length }}）</div>
          <div v-for="(qt, i) in drawerDock.queuedTasks" :key="qt.id" class="task-detail-card mb-8px">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-12px text-gray-400 mr-6px">{{ i + 1 }}.</span>
                <span class="font-mono font-semibold text-13px">
                  {{ qt.containerNo || qt.sourceOrderNo || qt.yardTaskNo }}
                </span>
                <div class="text-11px text-gray-400 mt-2px">
                  {{ TASK_TYPE_LABEL[qt.taskType] || qt.taskType }}
                </div>
              </div>
              <NPopconfirm @positive-click="handleCancelQueue(qt.id)">
                <template #trigger>
                  <NButton size="tiny" type="error" ghost @click.stop>取消排队</NButton>
                </template>
                确认取消排队？任务将回到等待中
              </NPopconfirm>
            </div>
          </div>
        </template>

        <!-- 空闲 -->
        <div v-if="!drawerDock.activeTask && !drawerDock.incomingTasks?.length && !drawerDock.queuedTasks?.length"
          class="text-center text-gray-400 text-14px py-32px">
          道口当前空闲
        </div>

      </template>
    </NDrawerContent>
  </NDrawer>

  <!-- 完成作业 - 下口目的地选择 -->
  <NModal v-model:show="finishModalVisible" preset="dialog" title="完成作业 - 选择下口目的地" style="width: 420px"
    positive-text="确认完成" negative-text="取消"
    @positive-click="confirmFinish" @negative-click="finishModalVisible = false">
    <div class="py-8px text-13px text-gray-500 mb-12px">
      作业完成后如需从 Dock 下口到堆场位或其他道口，必须生成 YardGo 任务，请选择目的地。
    </div>
    <div class="flex gap-8px mb-12px">
      <NButton :type="finishDestType === 'position' ? 'primary' : 'default'" size="small"
        @click="finishDestType = finishDestType === 'position' ? null : 'position'; finishToDockId = null">
        移至堆场位
      </NButton>
      <NButton :type="finishDestType === 'dock' ? 'primary' : 'default'" size="small"
        @click="finishDestType = finishDestType === 'dock' ? null : 'dock'; finishToPositionId = null">
        移至道口
      </NButton>
    </div>
    <NSelect v-if="finishDestType === 'position'" v-model:value="finishToPositionId"
      :options="freeSlotOptions" placeholder="选择堆场位" filterable clearable />
    <NSelect v-if="finishDestType === 'dock'" v-model:value="finishToDockId"
      :options="freeDockOptions" placeholder="选择道口" filterable clearable />
  </NModal>
</template>

<style scoped>
.dock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 6px;
}
.dock-card {
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  padding: 7px 9px;
  min-height: 70px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.dock-card.dock-selectable { cursor: pointer; border-style: dashed !important; }
.dock-card.dock-selectable:hover { border-color: #2563eb !important; box-shadow: 0 0 0 2px #bfdbfe; }
.dock-card.dock-disabled { opacity: 0.5; pointer-events: none; }
.dock-card.dock-drag-over { border-color: #16a34a !important; box-shadow: 0 0 0 2px #bbf7d0; background: #f0fdf4 !important; border-style: dashed !important; }
.active-task { border-top: 1px solid #fed7aa; padding-top: 6px; margin-top: 4px; }
.queue-list { border-top: 1px dashed #e5e7eb; padding-top: 4px; }
.section-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.task-detail-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
</style>
