<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NAlert, NButton, NCard, NDescriptions, NDescriptionsItem,
  NForm, NFormItem, NInput, NInputNumber, NModal, NPopconfirm, NProgress,
  NSelect, NSpin, NTag, NTimeline, NTimelineItem
} from 'naive-ui';
import {
  fetchAssignDock, fetchCancelTask, fetchCheckIn, fetchClearException,
  fetchFinishWork, fetchGetDockBoard, fetchGetFreeDocks, fetchGetFreeYardSlots, fetchGetTaskLogs, fetchGetYardTaskDetail,
  fetchLeaveYard, fetchMarkException, fetchPauseWork, fetchRelease, fetchResumeWork,
  fetchStartWork, fetchSyncWmsReady, fetchUpdatePriority
} from '@/service/api/yms/dispatch';
import { useAuth } from '@/hooks/business/auth';
import { isLoadingTaskType, WMS_READY_META } from '../dispatch/modules/dispatch-meta';
import { YMS_ROUTE, ymsTo } from '../shared/yms-route';

defineOptions({ name: 'YmsDispatchDetail' });

const route = useRoute();
const router = useRouter();
const { hasAuth } = useAuth();

const TASK_TYPE_LABEL: Record<string, string> = {
  DEVANNING: '卸柜任务', DELIVERY_LOADING: '派送装车',
  TRANSFER_LOADING: '调拨装车', PICKUP_LOADING: '自提装车',
  RETURN_LOADING: '退货装车', OTHER: '其他'
};

const STATUS_META: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  CREATED:              { label: '已创建',     type: 'default' },
  PRE_ARRIVAL:          { label: '待到仓',     type: 'default' },
  ARRIVED:              { label: '已到仓',     type: 'info' },
  WAITING:              { label: '等待中',     type: 'info' },
  QUEUED:               { label: '排队中',     type: 'warning' },
  DOCK_ASSIGNED:        { label: '已分配Dock', type: 'warning' },
  DOCK_WORKING:         { label: '作业中',     type: 'warning' },
  DEVANNING:            { label: '卸柜中',     type: 'warning' },
  LOADING:              { label: '装车中',     type: 'warning' },
  OPERATION_PAUSED:     { label: '作业暂停',   type: 'error' },
  OPERATION_FINISHED:   { label: '作业完成',   type: 'success' },
  RELEASED:             { label: '已放行',     type: 'success' },
  LEFT_YARD:            { label: '已离园',     type: 'default' },
  CANCELLED:            { label: '已取消',     type: 'default' },
  EXCEPTION_PROCESSING: { label: '异常处理中', type: 'error' },
  EXCEPTION_CLOSED:     { label: '异常已关闭', type: 'default' },
};

// ─── Task ──────────────────────────────────────────────────────────────

const taskId = computed(() => route.query.id as string);
const task = ref<Api.Yms.YardTask | null>(null);
const loading = ref(false);
const logs = ref<Api.Yms.YardTaskLog[]>([]);

async function loadTask() {
  if (!taskId.value) return;
  loading.value = true;
  const { data } = await fetchGetYardTaskDetail(taskId.value);
  task.value = data;
  loading.value = false;
  fetchGetTaskLogs(taskId.value).then(r => { if (r.data) logs.value = r.data; });
}

// ─── 权限判断 ──────────────────────────────────────────────────────────

const TERMINAL = new Set(['LEFT_YARD', 'CANCELLED', 'EXCEPTION_CLOSED']);
const isTerminal = computed(() => TERMINAL.has(task.value?.yardStatus ?? ''));
const s = computed(() => task.value?.yardStatus ?? '');

const canCheckIn    = computed(() => ['CREATED', 'PRE_ARRIVAL'].includes(s.value));
const canAssignDock = computed(() => ['ARRIVED', 'WAITING'].includes(s.value));
const canUnassign   = computed(() => ['DOCK_ASSIGNED', 'QUEUED'].includes(s.value));
const canStart      = computed(() => s.value === 'DOCK_ASSIGNED');
const canPause      = computed(() => ['DOCK_WORKING', 'DEVANNING', 'LOADING'].includes(s.value));
const canResume     = computed(() => s.value === 'OPERATION_PAUSED');
const canFinish     = computed(() => ['DOCK_WORKING', 'DEVANNING', 'LOADING', 'OPERATION_PAUSED'].includes(s.value));
const canRelease    = computed(() => s.value === 'OPERATION_FINISHED');
const canLeave      = computed(() => s.value === 'RELEASED');
const canException  = computed(() => !isTerminal.value && s.value !== 'EXCEPTION_PROCESSING');
const canClearEx    = computed(() => s.value === 'EXCEPTION_PROCESSING');
const canCancel     = computed(() => !isTerminal.value);
const isLoadingTask = computed(() => isLoadingTaskType(task.value?.taskType));
const hasAnyAction  = computed(() => canCheckIn.value || canAssignDock.value || canUnassign.value ||
  canStart.value || canPause.value || canResume.value || canFinish.value || canRelease.value || canLeave.value ||
  canException.value || canClearEx.value || canCancel.value);

// ─── 分配 Dock 弹窗 ────────────────────────────────────────────────────

const dockModalVisible = ref(false);
const availableDocks = ref<{ label: string; value: CommonType.IdType; disabled: boolean }[]>([]);
const selectedDockId = ref<CommonType.IdType | null>(null);
const assigning = ref(false);

async function openAssignDock() {
  const taskGroup = task.value?.taskType === 'DEVANNING' ? 'DEVANNING' : 'LOADING';
  const { data } = await fetchGetDockBoard(task.value?.warehouseId, taskGroup);
  availableDocks.value = (data || [])
    .filter(d => d.dockStatus !== 'DISABLED' && d.dockStatus !== 'MAINTENANCE' && d.enabledFlag !== 0)
    .map(d => ({
      label: `${d.dockCode}${d.activeTask ? ' (占用中)' : d.queuedTasks.length ? ` (排队${d.queuedTasks.length})` : ' (空闲)'}`,
      value: d.id,
      disabled: false
    }));
  selectedDockId.value = task.value?.dockId ?? null;
  dockModalVisible.value = true;
}

async function confirmAssignDock() {
  if (!task.value) return;
  assigning.value = true;
  const { error } = await fetchAssignDock({ yardTaskId: task.value.id, dockId: selectedDockId.value });
  assigning.value = false;
  if (!error) {
    window.$message?.success(selectedDockId.value ? '分配成功' : '已取消Dock分配');
    dockModalVisible.value = false;
    await loadTask();
  }
}

// ─── 标记异常弹窗 ──────────────────────────────────────────────────────

const exceptionVisible = ref(false);
const exceptionReason = ref('');
const exceptionLoading = ref(false);

async function confirmException() {
  if (!task.value || !exceptionReason.value.trim()) return;
  exceptionLoading.value = true;
  const { error } = await fetchMarkException(task.value.id, exceptionReason.value.trim());
  exceptionLoading.value = false;
  if (!error) {
    window.$message?.success('已标记异常');
    exceptionVisible.value = false;
    exceptionReason.value = '';
    await loadTask();
  }
}

// ─── 取消任务弹窗 ──────────────────────────────────────────────────────

const cancelVisible = ref(false);
const cancelReason = ref('');
const cancelLoading = ref(false);

async function confirmCancel() {
  if (!task.value) return;
  cancelLoading.value = true;
  const { error } = await fetchCancelTask(task.value.id, cancelReason.value || undefined);
  cancelLoading.value = false;
  if (!error) {
    window.$message?.success('已取消任务');
    cancelVisible.value = false;
    cancelReason.value = '';
    await loadTask();
  }
}

// ─── 快捷操作 ──────────────────────────────────────────────────────────

async function doCheckIn() {
  const { error } = await fetchCheckIn(task.value!.id);
  if (!error) { window.$message?.success('签到成功'); await loadTask(); }
}

async function doStart() {
  const { error } = await fetchStartWork(task.value!.id);
  if (!error) { window.$message?.success('开始作业'); await loadTask(); }
}

async function doPause() {
  const { error } = await fetchPauseWork(task.value!.id);
  if (!error) { window.$message?.success('已暂停作业'); await loadTask(); }
}

async function doResume() {
  const { error } = await fetchResumeWork(task.value!.id);
  if (!error) { window.$message?.success('已恢复作业'); await loadTask(); }
}

const finishModalVisible = ref(false);
const finishDestType = ref<'position' | 'dock' | null>(null);
const finishToPositionId = ref<CommonType.IdType | null>(null);
const finishToDockId = ref<CommonType.IdType | null>(null);
const finishLoading = ref(false);
const freeSlotOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const freeDockOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

async function openFinishModal() {
  if (!task.value) return;
  finishDestType.value = null;
  finishToPositionId.value = null;
  finishToDockId.value = null;
  if (!task.value.warehouseId) return;
  const [slotRes, dockRes] = await Promise.all([
    fetchGetFreeYardSlots(task.value.warehouseId),
    fetchGetFreeDocks(task.value.warehouseId)
  ]);
  freeSlotOptions.value = (slotRes.data ?? []).map((s: any) => ({
    label: `${s.dockCode}${s.zoneCode ? ` (${s.zoneCode})` : ''}`,
    value: s.id
  }));
  freeDockOptions.value = (dockRes.data ?? []).map((d: any) => ({
    label: `${d.dockCode}${d.dockName ? ` - ${d.dockName}` : ''}`,
    value: d.id
  }));
  finishModalVisible.value = true;
}

async function doFinish() {
  if (!task.value) return;
  if (!finishDestType.value || (finishDestType.value === 'position' && !finishToPositionId.value) || (finishDestType.value === 'dock' && !finishToDockId.value)) {
    window.$message?.warning('请选择下口目的地');
    return;
  }
  const body: Record<string, any> = {};
  if (finishDestType.value === 'position') body.toPositionId = finishToPositionId.value;
  if (finishDestType.value === 'dock') body.toDockId = finishToDockId.value;
  finishLoading.value = true;
  const { error } = await fetchFinishWork(task.value.id, body);
  finishLoading.value = false;
  if (!error) {
    window.$message?.success('作业完成，已生成 YardGo 下口任务');
    finishModalVisible.value = false;
    await loadTask();
  }
}

async function doRelease() {
  const { error } = await fetchRelease(task.value!.id);
  if (!error) { window.$message?.success('放行成功'); await loadTask(); }
}

async function doLeave() {
  const { error } = await fetchLeaveYard(task.value!.id);
  if (!error) { window.$message?.success('已离园'); await loadTask(); }
}

async function doClearException() {
  const { error } = await fetchClearException(task.value!.id);
  if (!error) { window.$message?.success('异常已解除'); await loadTask(); }
}

const editPriority = ref(5);
const prioritySaving = ref(false);

async function doSavePriority() {
  if (!task.value) return;
  prioritySaving.value = true;
  const { error } = await fetchUpdatePriority({ yardTaskId: task.value.id, priority: editPriority.value });
  prioritySaving.value = false;
  if (!error) { window.$message?.success('优先级已更新'); await loadTask(); }
}

async function doMarkWmsReady(ready: boolean) {
  if (!task.value) return;
  const { error } = await fetchSyncWmsReady({
    yardTaskId: task.value.id,
    wmsReadyStatus: ready ? 'READY' : 'PENDING',
  });
  if (!error) {
    window.$message?.success(ready ? '已标记备货完成' : '已标记备货中');
    await loadTask();
  }
}

watch(task, t => { if (t) editPriority.value = t.priority ?? 5; }, { immediate: true });

// ─── 工具 ─────────────────────────────────────────────────────────────

function fmt(d: string | null) {
  if (!d) return '--';
  return d.slice(0, 16).replace('T', ' ');
}

onMounted(loadTask);
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-y-auto p-4px">

    <!-- 顶部导航 -->
    <div class="flex items-center gap-8px">
      <NButton size="small" quaternary @click="router.push(ymsTo(YMS_ROUTE.dispatch))">
        ← 返回调度
      </NButton>
      <span class="text-gray-400">/</span>
      <span class="text-gray-600 text-14px">任务详情</span>
    </div>

    <NSpin :show="loading">
      <div v-if="task" class="flex flex-col gap-12px">

        <!-- 任务标题行 -->
        <NCard :bordered="false" class="card-wrapper" content-style="padding: 16px 20px;">
          <div class="flex items-center justify-between flex-wrap gap-12px">
            <div class="flex items-center gap-12px">
              <span class="text-20px font-bold text-gray-800 font-mono">{{ task.yardTaskNo }}</span>
              <NTag :type="STATUS_META[task.yardStatus]?.type ?? 'default'" size="medium">
                {{ STATUS_META[task.yardStatus]?.label ?? task.yardStatus }}
              </NTag>
              <NTag v-if="task.exceptionFlag" type="error" size="small">异常</NTag>
              <NTag v-if="task.isReentry" type="warning" size="small">重入场</NTag>
              <span class="text-13px text-gray-400">{{ TASK_TYPE_LABEL[task.taskType] ?? task.taskType }}</span>
              <span v-if="task.visitNo > 1" class="text-12px text-orange-500">第{{ task.visitNo }}次</span>
            </div>
            <NButton size="small" @click="loadTask">刷新</NButton>
          </div>

          <!-- 异常提示 -->
          <NAlert v-if="task.exceptionFlag && task.exceptionReason" type="error" class="mt-10px">
            异常原因：{{ task.exceptionReason }}
          </NAlert>
        </NCard>

        <!-- 信息卡片区 -->
        <div class="grid grid-cols-1 gap-12px lg:grid-cols-3">

          <!-- 基本信息 -->
          <NCard title="基本信息" :bordered="false" class="card-wrapper">
            <NDescriptions :column="1" label-placement="left" :label-style="{ width: '88px', color: '#6b7280', fontSize: '13px' }">
              <NDescriptionsItem label="来源类型">{{ task.sourceOrderType || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="来源单号">{{ task.sourceOrderNo || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="柜号">{{ task.containerNo || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="车牌号">{{ task.truckNo || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="司机">{{ task.driverName || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="司机电话">{{ task.driverPhone || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="预计到仓">{{ fmt(task.etaYardTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="实际入场">{{ fmt(task.gateInTime) }}</NDescriptionsItem>
              <NDescriptionsItem v-if="isLoadingTask" label="WMS备货">
                <NTag :type="(WMS_READY_META[task.wmsReadyStatus ?? 'NOT_REQUIRED']?.type ?? 'default') as any" size="small">
                  {{ WMS_READY_META[task.wmsReadyStatus ?? 'NOT_REQUIRED']?.label ?? task.wmsReadyStatus }}
                </NTag>
                <span v-if="task.wmsReadyTime" class="ml-8px text-12px text-gray-400">{{ fmt(task.wmsReadyTime) }}</span>
              </NDescriptionsItem>
              <NDescriptionsItem label="优先级">{{ task.priority ?? 5 }}</NDescriptionsItem>
              <NDescriptionsItem label="放行时间">{{ fmt(task.releaseTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="离园时间">{{ fmt(task.gateOutTime) }}</NDescriptionsItem>
            </NDescriptions>
          </NCard>

          <!-- 作业信息 -->
          <NCard title="作业信息" :bordered="false" class="card-wrapper">
            <NDescriptions :column="1" label-placement="left" :label-style="{ width: '88px', color: '#6b7280', fontSize: '13px' }">
              <NDescriptionsItem label="Dock">
                <span class="font-semibold">{{ task.dockCode || '--' }}</span>
              </NDescriptionsItem>
              <NDescriptionsItem label="作业状态">{{ task.operationStatus || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="Dock进入">{{ fmt(task.dockStartTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="Dock完成">{{ fmt(task.dockFinishTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="作业开始">{{ fmt(task.operationStartTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="作业完成">{{ fmt(task.operationFinishTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="预计完成">{{ fmt(task.estimatedFinishTime) }}</NDescriptionsItem>
            </NDescriptions>

            <!-- 进度 -->
            <div v-if="task.operationProgress != null" class="mt-12px">
              <div class="flex justify-between text-12px text-gray-500 mb-4px">
                <span>作业进度</span>
                <span>{{ task.operationProgress }}%</span>
              </div>
              <NProgress
                type="line"
                :percentage="task.operationProgress"
                :height="10"
                :border-radius="5"
                :show-indicator="false"
              />
              <div class="flex justify-between text-12px text-gray-500 mt-4px">
                <span>已装/卸：{{ task.loadedQty ?? '--' }} / {{ task.totalQty ?? '--' }}</span>
                <span>托盘：{{ task.loadedPalletQty ?? '--' }} / {{ task.totalPalletQty ?? '--' }}</span>
              </div>
            </div>
          </NCard>

          <!-- 操作按钮 -->
          <NCard title="快捷操作" :bordered="false" class="card-wrapper">
            <div v-if="hasAnyAction" class="flex flex-col gap-8px">
              <NButton
                v-if="canCheckIn && hasAuth('yms:yard:checkin')"
                type="primary" block
                @click="doCheckIn"
              >
                签到/到仓确认
              </NButton>

              <NButton
                v-if="canAssignDock && hasAuth('yms:yard:assignDock')"
                type="info" block
                @click="openAssignDock"
              >
                {{ task.dockId ? '更换Dock' : '分配Dock' }}
              </NButton>

              <NButton
                v-if="canUnassign && hasAuth('yms:yard:assignDock')"
                block
                @click="openAssignDock"
              >
                修改Dock分配
              </NButton>

              <NButton
                v-if="canStart && hasAuth('yms:yard:start')"
                type="primary" block
                @click="doStart"
              >
                开始作业
              </NButton>

              <NButton
                v-if="canPause && hasAuth('yms:yard:start')"
                block
                @click="doPause"
              >
                暂停作业
              </NButton>

              <NButton
                v-if="canResume && hasAuth('yms:yard:start')"
                type="warning" block
                @click="doResume"
              >
                恢复作业
              </NButton>

              <NButton
                v-if="canFinish && hasAuth('yms:yard:finish')"
                type="success"
                block
                @click="openFinishModal"
              >
                完成作业
              </NButton>

              <NPopconfirm
                v-if="canRelease && hasAuth('yms:yard:release')"
                @positive-click="doRelease"
              >
                <template #trigger>
                  <NButton type="info" block>放行</NButton>
                </template>
                确认放行该车辆？
              </NPopconfirm>

              <NPopconfirm
                v-if="canLeave && hasAuth('yms:yard:release')"
                @positive-click="doLeave"
              >
                <template #trigger>
                  <NButton block>确认离园</NButton>
                </template>
                确认车辆已离园？
              </NPopconfirm>

              <NButton
                v-if="canClearEx && hasAuth('yms:yard:exception')"
                type="warning" block
                @click="doClearException"
              >
                解除异常
              </NButton>

              <div v-if="hasAuth('yms:yard:priority')" class="border-t border-gray-100 pt-8px flex items-center gap-8px">
                <span class="text-12px text-gray-500 flex-shrink-0">优先级</span>
                <NInputNumber v-model:value="editPriority" :min="1" :max="10" size="small" class="flex-1" />
                <NButton size="small" :loading="prioritySaving" @click="doSavePriority">保存</NButton>
              </div>

              <div v-if="isLoadingTask && hasAuth('yms:yard:wmsSync')" class="border-t border-gray-100 pt-8px flex flex-col gap-6px">
                <span class="text-12px text-gray-500">WMS 备货</span>
                <div class="flex gap-6px">
                  <NButton
                    size="small" block
                    :disabled="task.wmsReadyStatus === 'READY'"
                    @click="doMarkWmsReady(true)"
                  >标记已备齐</NButton>
                  <NButton
                    size="small" block secondary
                    :disabled="task.wmsReadyStatus === 'PENDING'"
                    @click="doMarkWmsReady(false)"
                  >标记备货中</NButton>
                </div>
              </div>

              <div class="border-t border-gray-100 pt-8px mt-4px flex flex-col gap-8px">
                <NButton
                  v-if="canException && hasAuth('yms:yard:exception')"
                  type="error" ghost block
                  @click="exceptionVisible = true"
                >
                  标记异常
                </NButton>

                <NButton
                  v-if="canCancel && hasAuth('yms:yard:create')"
                  ghost block
                  @click="cancelVisible = true"
                >
                  取消任务
                </NButton>
              </div>
            </div>

            <div v-else class="text-center text-gray-400 text-13px py-20px">
              {{ isTerminal ? '任务已终止' : '暂无可用操作' }}
            </div>
          </NCard>
        </div>

        <!-- 底部：时间线 + 附加信息 -->
        <div class="grid grid-cols-1 gap-12px lg:grid-cols-2">

          <!-- 操作日志时间线 -->
          <NCard title="操作记录" :bordered="false" class="card-wrapper">
            <NTimeline v-if="logs.length">
              <NTimelineItem
                v-for="log in logs"
                :key="log.id"
                :type="log.afterStatus && ['LEFT_YARD', 'OPERATION_FINISHED', 'RELEASED'].includes(log.afterStatus) ? 'success' : 'default'"
                :title="log.actionType"
                :time="log.actionTime ? log.actionTime.slice(0, 16).replace('T', ' ') : ''"
                :content="[
                  log.beforeStatus ? `${STATUS_META[log.beforeStatus]?.label ?? log.beforeStatus} → ${STATUS_META[log.afterStatus ?? '']?.label ?? log.afterStatus}` : '',
                  log.actionContent ?? '',
                  log.operatorName ? `操作人: ${log.operatorName}` : ''
                ].filter(Boolean).join('  |  ')"
              />
            </NTimeline>
            <div v-else class="text-center text-gray-400 text-13px py-20px">
              暂无操作记录
            </div>
          </NCard>

          <!-- 附加信息 -->
          <NCard title="附加信息" :bordered="false" class="card-wrapper">
            <NDescriptions :column="1" label-placement="left" :label-style="{ width: '100px', color: '#6b7280', fontSize: '13px' }">
              <NDescriptionsItem label="到访次数">第 {{ task.visitNo }} 次</NDescriptionsItem>
              <NDescriptionsItem label="拆柜轮次">{{ task.unloadRoundNo || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="重入场">
                <NTag v-if="task.isReentry" type="warning" size="small">是</NTag>
                <span v-else class="text-gray-400">否</span>
              </NDescriptionsItem>
              <NDescriptionsItem v-if="task.reentryReason" label="重入场原因">
                {{ task.reentryReason }}
              </NDescriptionsItem>
              <NDescriptionsItem label="来源">{{ task.source }}</NDescriptionsItem>
              <NDescriptionsItem label="备注">{{ task.remark || '--' }}</NDescriptionsItem>
              <NDescriptionsItem label="创建时间">{{ fmt(task.createTime) }}</NDescriptionsItem>
            </NDescriptions>
          </NCard>
        </div>

      </div>

      <div v-else-if="!loading" class="text-center text-gray-400 py-60px">
        任务不存在或已被删除
      </div>
    </NSpin>

    <!-- 分配Dock弹窗 -->
    <NModal v-model:show="dockModalVisible" preset="card" title="分配 Dock" style="width: 440px">
      <NForm label-placement="left" :label-width="80">
        <NFormItem label="选择Dock">
          <NSelect
            v-model:value="selectedDockId"
            :options="availableDocks"
            clearable
            placeholder="选择目标Dock，清空则取消分配"
            class="w-full"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="dockModalVisible = false">取消</NButton>
          <NButton type="primary" :loading="assigning" @click="confirmAssignDock">确认</NButton>
        </div>
      </template>
    </NModal>

    <!-- 完成作业 - 下口目的地选择 -->
    <NModal v-model:show="finishModalVisible" preset="card" title="完成作业 - 选择下口目的地" style="width: 460px">
      <NAlert type="info" :bordered="false" class="mb-12px">
        Dock 下口到堆场位或其他道口需要生成 YardGo 任务，请选择下口目的地。
      </NAlert>
      <div class="mb-12px flex gap-8px">
        <NButton
          :type="finishDestType === 'position' ? 'primary' : 'default'"
          @click="finishDestType = 'position'; finishToDockId = null"
        >
          移至堆场位
        </NButton>
        <NButton
          :type="finishDestType === 'dock' ? 'primary' : 'default'"
          @click="finishDestType = 'dock'; finishToPositionId = null"
        >
          移至道口
        </NButton>
      </div>
      <NSelect
        v-if="finishDestType === 'position'"
        v-model:value="finishToPositionId"
        :options="freeSlotOptions"
        placeholder="选择堆场位"
        filterable
        clearable
      />
      <NSelect
        v-if="finishDestType === 'dock'"
        v-model:value="finishToDockId"
        :options="freeDockOptions"
        placeholder="选择目标道口"
        filterable
        clearable
      />
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="finishModalVisible = false">取消</NButton>
          <NButton type="primary" :loading="finishLoading" @click="doFinish">确认完成</NButton>
        </div>
      </template>
    </NModal>

    <!-- 标记异常弹窗 -->
    <NModal v-model:show="exceptionVisible" preset="card" title="标记异常" style="width: 420px">
      <NForm label-placement="left" :label-width="72">
        <NFormItem label="异常原因" required>
          <NInput
            v-model:value="exceptionReason"
            type="textarea"
            placeholder="请填写异常原因"
            :rows="3"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="exceptionVisible = false">取消</NButton>
          <NButton
            type="error"
            :loading="exceptionLoading"
            :disabled="!exceptionReason.trim()"
            @click="confirmException"
          >
            确认标记
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- 取消任务弹窗 -->
    <NModal v-model:show="cancelVisible" preset="card" title="取消任务" style="width: 420px">
      <NForm label-placement="left" :label-width="72">
        <NFormItem label="取消原因">
          <NInput
            v-model:value="cancelReason"
            type="textarea"
            placeholder="选填"
            :rows="3"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="cancelVisible = false">返回</NButton>
          <NButton type="error" :loading="cancelLoading" @click="confirmCancel">确认取消</NButton>
        </div>
      </template>
    </NModal>

  </div>
</template>
