<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NInput, NTag, useMessage } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import {
  fetchAcceptInternalTask,
  fetchCompleteInternalTask,
  fetchFailInternalTask,
  fetchGetInternalTaskBoard,
  fetchGetInternalTaskDetail,
  fetchStartInternalTask
} from '@/service/api/yms/internal-task';

defineOptions({ name: 'YmsH5TaskExecute' });

const route = useRoute();
const router = useRouter();
const message = useMessage();

const task = ref<Api.Yms.InternalTask | null>(null);
const taskList = ref<Api.Yms.InternalTask[]>([]);
const loading = ref(true);
const listLoading = ref(false);
const acting = ref(false);
const failReason = ref('');
const showFailInput = ref(false);
const photoUrls = ref<string | null>(null);

const taskId = computed(() => route.query.taskId as string | undefined);
const warehouseId = computed(() => route.query.warehouseId as string | undefined);
const tenantId = computed(() => route.query.tenantId as string | undefined);

const TYPE_LABEL: Record<string, string> = {
  DOCK_IN: 'YardGo上口/换口',
  DOCK_OUT: 'YardGo下口',
  CONTAINER_TO_DOCK: '海柜上口',
  CONTAINER_OFF_DOCK: '海柜下口',
  TRAILER_TO_DOCK: '干柜/车厢上口',
  TRAILER_OFF_DOCK: '干柜/车厢下口',
  CONTAINER_MOVE: '院内挪柜',
  TRAILER_MOVE: '院内挪车厢',
  EMPTY_CONTAINER_RETURN: '空柜还柜',
  YARD_INVENTORY_SCAN: '园区盘点'
};

const STATUS_LABEL: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  PENDING:    { label: '待领取', color: 'default' },
  ASSIGNED:   { label: '已分配', color: 'info' },
  ACCEPTED:   { label: '已领取', color: 'warning' },
  IN_PROGRESS: { label: '执行中', color: 'info' },
  COMPLETED:  { label: '已完成', color: 'success' },
  FAILED:     { label: '失败', color: 'error' },
  CANCELLED:  { label: '已取消', color: 'default' }
};

const canAccept = computed(() => ['PENDING', 'ASSIGNED'].includes(task.value?.taskStatus ?? ''));
const canStart = computed(() => task.value?.taskStatus === 'ACCEPTED');
const canComplete = computed(() => task.value?.taskStatus === 'IN_PROGRESS');
const isTerminal = computed(() =>
  ['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.value?.taskStatus ?? '')
);

async function load() {
  task.value = null;
  if (!taskId.value) {
    loading.value = false;
    await loadTaskList();
    return;
  }
  loading.value = true;
  const { data } = await fetchGetInternalTaskDetail(taskId.value as any);
  task.value = data ?? null;
  loading.value = false;
}

async function loadTaskList() {
  if (!warehouseId.value) {
    taskList.value = [];
    return;
  }
  listLoading.value = true;
  try {
    const { data } = await fetchGetInternalTaskBoard(warehouseId.value as any);
    taskList.value = (data ?? []).flatMap(item => item.tasks ?? []);
  } finally {
    listLoading.value = false;
  }
}

function openTask(item: Api.Yms.InternalTask) {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      taskId: String(item.id),
      warehouseId: item.warehouseId ? String(item.warehouseId) : warehouseId.value,
      tenantId: item.tenantId ?? tenantId.value
    }
  });
}

async function act(fn: () => Promise<{ error: any }>, successMsg: string) {
  acting.value = true;
  try {
    const { error } = await fn();
    if (!error) {
      message.success(successMsg);
      await load();
    }
  } finally {
    acting.value = false;
  }
}

async function handleAccept() {
  await act(() => fetchAcceptInternalTask(task.value!.id), '已领取');
}

async function handleStart() {
  await act(() => fetchStartInternalTask(task.value!.id), '已开始执行');
}

async function handleComplete() {
  await act(() => fetchCompleteInternalTask(task.value!.id, { photoUrls: photoUrls.value }), '任务已完成');
}

async function handleFail() {
  if (!failReason.value.trim()) {
    message.warning('请填写失败原因');
    return;
  }
  await act(() => fetchFailInternalTask(task.value!.id, failReason.value.trim()), '已上报失败');
  showFailInput.value = false;
}

onMounted(load);
watch(() => route.query.taskId, load);
</script>

<template>
  <div class="h5-task min-h-screen bg-gray-50 flex flex-col">

    <!-- 顶部栏 -->
    <div class="bg-blue-600 text-white px-16px py-12px flex items-center justify-between">
      <span class="text-16px font-semibold">院内任务</span>
      <NButton v-if="!isTerminal && task" size="small" secondary @click="load">刷新</NButton>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center text-gray-400 text-14px">
      加载中...
    </div>

    <!-- 仓库任务入口 -->
    <div v-else-if="!taskId" class="flex-1 px-12px py-12px">
      <div class="bg-white rounded-12px shadow-sm p-16px mb-12px">
        <div class="text-16px font-semibold text-gray-800 mb-6px">YardGo 待领取任务</div>
        <div class="text-12px text-gray-400">
          仓库ID：{{ warehouseId ?? '-' }}　租户ID：{{ tenantId ?? '-' }}
        </div>
      </div>

      <div v-if="!warehouseId" class="bg-white rounded-12px shadow-sm p-24px text-center text-gray-400">
        未指定仓库，请使用带 warehouseId 和 tenantId 的 YardGo 二维码。
      </div>

      <div v-else-if="listLoading" class="bg-white rounded-12px shadow-sm p-24px text-center text-gray-400">
        任务加载中...
      </div>

      <div v-else-if="taskList.length" class="flex flex-col gap-10px">
        <div
          v-for="item in taskList"
          :key="item.id"
          class="bg-white rounded-12px shadow-sm p-14px active:bg-gray-50"
          @click="openTask(item)"
        >
          <div class="mb-8px flex items-center justify-between">
            <div class="font-semibold text-gray-800">{{ item.objectNo ?? item.taskNo }}</div>
            <NTag :type="STATUS_LABEL[item.taskStatus]?.color ?? 'default'" size="small">
              {{ STATUS_LABEL[item.taskStatus]?.label ?? item.taskStatus }}
            </NTag>
          </div>
          <div class="mb-6px text-13px text-gray-500">{{ TYPE_LABEL[item.internalTaskType] ?? item.internalTaskType }}</div>
          <div class="text-13px text-gray-600">
            {{ item.fromPositionCode ?? '-' }} → {{ item.toDockCode ?? item.toPositionCode ?? '-' }}
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-12px shadow-sm p-24px text-center text-gray-400">
        当前仓库暂无待处理 YardGo 任务
      </div>
    </div>

    <!-- 无任务 -->
    <div v-else-if="!task" class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-8px">
      <span class="text-32px">📋</span>
      <span>任务不存在或已删除</span>
    </div>

    <!-- 任务内容 -->
    <template v-else>

      <!-- 任务基本信息卡 -->
      <div class="bg-white mx-12px mt-12px rounded-12px shadow-sm overflow-hidden">
        <div class="px-16px py-12px border-b border-gray-100 flex items-center justify-between">
          <span class="text-15px font-semibold text-gray-800">
            {{ TYPE_LABEL[task.internalTaskType] ?? task.internalTaskType }}
          </span>
          <NTag
            :type="STATUS_LABEL[task.taskStatus]?.color ?? 'default'"
            size="medium"
          >
            {{ STATUS_LABEL[task.taskStatus]?.label ?? task.taskStatus }}
          </NTag>
        </div>

        <div class="px-16px py-12px grid grid-cols-2 gap-y-10px gap-x-8px text-14px">
          <div>
            <span class="text-gray-400 text-12px block mb-2px">任务号</span>
            <span class="font-medium text-gray-700">{{ task.taskNo }}</span>
          </div>
          <div>
            <span class="text-gray-400 text-12px block mb-2px">对象</span>
            <span class="font-medium text-gray-700">{{ task.objectNo ?? '-' }}</span>
          </div>
          <div class="col-span-2">
            <span class="text-gray-400 text-12px block mb-2px">路线</span>
            <div class="flex items-center gap-6px">
              <span class="bg-gray-100 rounded-4px px-8px py-2px text-gray-700">
                {{ task.fromPositionCode ?? '-' }}
              </span>
              <span class="text-gray-400">→</span>
              <span class="bg-blue-50 rounded-4px px-8px py-2px text-blue-700 font-medium">
                {{ task.toDockCode ?? task.toPositionCode ?? '-' }}
              </span>
            </div>
          </div>
          <div v-if="task.executorName">
            <span class="text-gray-400 text-12px block mb-2px">执行人</span>
            <span class="text-gray-700">{{ task.executorName }}</span>
          </div>
          <div v-if="task.deadlineTime">
            <span class="text-gray-400 text-12px block mb-2px">截止时间</span>
            <span class="text-orange-500">{{ task.deadlineTime }}</span>
          </div>
        </div>

        <div v-if="task.remark" class="px-16px pb-12px text-13px text-gray-400">
          备注：{{ task.remark }}
        </div>
      </div>

      <!-- 失败原因输入 -->
      <div v-if="showFailInput" class="bg-white mx-12px mt-12px rounded-12px shadow-sm p-16px">
        <p class="text-14px text-gray-600 mb-8px">请填写失败原因：</p>
        <NInput
          v-model:value="failReason"
          type="textarea"
          placeholder="如：设备故障、路线受阻等"
          :rows="2"
        />
        <div class="flex gap-8px mt-10px">
          <NButton class="flex-1" @click="showFailInput = false">取消</NButton>
          <NButton type="error" class="flex-1" :loading="acting" @click="handleFail">确认上报</NButton>
        </div>
      </div>

      <!-- 操作按钮区 -->
      <div v-if="!isTerminal" class="px-12px mt-16px flex flex-col gap-10px">

        <NButton
          v-if="canAccept"
          type="primary"
          size="large"
          block
          :loading="acting"
          @click="handleAccept"
        >
          接单
        </NButton>

        <NButton
          v-if="canStart"
          type="primary"
          size="large"
          block
          :loading="acting"
          @click="handleStart"
        >
          开始执行
        </NButton>

        <NButton
          v-if="canComplete"
          type="success"
          size="large"
          block
          :loading="acting"
          @click="handleComplete"
        >
          完成任务
        </NButton>

        <NButton
          v-if="canComplete || canStart || canAccept"
          type="error"
          size="large"
          block
          secondary
          :loading="acting"
          @click="showFailInput = true"
        >
          上报失败
        </NButton>
      </div>

      <!-- 已完成/失败提示 -->
      <div v-if="isTerminal" class="mx-12px mt-16px bg-white rounded-12px shadow-sm p-16px text-center">
        <div class="text-32px mb-8px">
          {{ task.taskStatus === 'COMPLETED' ? '✅' : task.taskStatus === 'CANCELLED' ? '🚫' : '❌' }}
        </div>
        <p class="text-15px font-semibold text-gray-700">
          {{ STATUS_LABEL[task.taskStatus]?.label ?? task.taskStatus }}
        </p>
        <p v-if="task.failReason" class="text-13px text-gray-400 mt-4px">{{ task.failReason }}</p>
      </div>

    </template>

  </div>
</template>

<style scoped>
.h5-task { font-size: 14px; }
</style>
