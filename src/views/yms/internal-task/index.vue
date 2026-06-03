<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NEmpty, NPopconfirm, NTag } from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchAcceptInternalTask,
  fetchCancelInternalTask,
  fetchCompleteInternalTask,
  fetchFailInternalTask,
  fetchGetInternalTaskBoard,
  fetchStartInternalTask
} from '@/service/api/yms/internal-task';
import GatePhotoUpload from '../gate/modules/gate-photo-upload.vue';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useClipboard } from '@vueuse/core';

defineOptions({ name: 'YmsInternalTaskBoard' });

const { hasAuth } = useAuth();
const { record: taskTypeRecord } = useDict('yms_internal_task_type');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const selectedWarehouseId = ref<CommonType.IdType | null>(null);
const selectedTaskType = ref<string | null>(null);
const loading = ref(false);
const board = ref<Api.Yms.InternalTaskBoardColumn[]>([]);

const taskTypeOptions = computed(() =>
  Object.entries(taskTypeRecord.value).map(([value, item]) => ({
    label: item.dictLabel,
    value
  }))
);

const COLUMN_COLOR: Record<string, string> = {
  PENDING: '#f0f0f0',
  ACCEPTED: '#fff7e6',
  IN_PROGRESS: '#e6f7ff',
  FAILED: '#fff1f0'
};

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
  if (warehouseOptions.value.length) {
    selectedWarehouseId.value = warehouseOptions.value[0].value;
  }
}

async function loadBoard() {
  loading.value = true;
  const { data } = await fetchGetInternalTaskBoard(
    selectedWarehouseId.value,
    selectedTaskType.value ?? undefined
  );
  board.value = data ?? [];
  loading.value = false;
}

function taskTypeLabel(type: string) {
  return taskTypeRecord.value[type]?.dictLabel ?? type;
}

function renderRoute(task: Api.Yms.InternalTask) {
  const from = task.fromPositionCode ?? '-';
  const to = task.toDockCode ?? task.toPositionCode ?? '-';
  return `${from} → ${to}`;
}

const completeVisible = ref(false);
const completeTarget = ref<Api.Yms.InternalTask | null>(null);
const completePhotoUrls = ref<string | null>(null);

function openComplete(task: Api.Yms.InternalTask) {
  completeTarget.value = task;
  completePhotoUrls.value = null;
  completeVisible.value = true;
}

async function handleComplete() {
  if (!completeTarget.value) return;
  const { error } = await fetchCompleteInternalTask(completeTarget.value.id, {
    photoUrls: completePhotoUrls.value
  });
  if (!error) {
    window.$message?.success('已完成');
    completeVisible.value = false;
    loadBoard();
  }
}

async function handleAction(fn: () => Promise<{ error: any }>, msg: string) {
  const { error } = await fn();
  if (!error) {
    window.$message?.success(msg);
    loadBoard();
  }
}

// 复制执行链接（供 YardGo 司机在移动端打开）
const { copy } = useClipboard();

function copyTaskLink(task: Api.Yms.InternalTask) {
  const url = new URL('/h5/yard/task', window.location.origin);
  url.searchParams.set('taskId', String(task.id));
  if (task.warehouseId) {
    url.searchParams.set('warehouseId', String(task.warehouseId));
  }
  if (task.tenantId) {
    url.searchParams.set('tenantId', task.tenantId);
  }
  copy(url.toString());
  window.$message?.success('执行链接已复制');
}

onMounted(async () => {
  await loadWarehouses();
  await loadBoard();
});
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center gap-12px">
        <NSelect
          v-model:value="selectedWarehouseId"
          :options="warehouseOptions"
          class="w-180px"
          placeholder="仓库"
          filterable
          @update:value="loadBoard"
        />
        <NSelect
          v-model:value="selectedTaskType"
          :options="taskTypeOptions"
          class="w-160px"
          clearable
          placeholder="任务类型"
          @update:value="loadBoard"
        />
        <NButton type="primary" :loading="loading" @click="loadBoard">刷新</NButton>
      </div>
    </NCard>

    <div v-loading="loading" class="flex flex-1 gap-12px overflow-x-auto pb-8px">
      <div
        v-for="col in board"
        :key="col.status"
        class="kanban-col min-w-260px flex-col-stretch"
      >
        <div class="mb-8px flex items-center justify-between px-4px">
          <span class="font-medium">{{ col.statusLabel }}</span>
          <NTag size="small" round>{{ col.count }}</NTag>
        </div>

        <div class="flex flex-col gap-8px overflow-y-auto" style="max-height: calc(100vh - 220px)">
          <NCard
            v-for="task in col.tasks"
            :key="task.id"
            size="small"
            :style="{ background: COLUMN_COLOR[col.status] ?? '#fafafa' }"
          >
            <div class="mb-4px text-12px text-gray-500">{{ task.taskNo }}</div>
            <div class="mb-6px font-medium">
              <NTag size="small" type="info">{{ taskTypeLabel(task.internalTaskType) }}</NTag>
              <span class="ml-6px">{{ task.objectNo ?? '-' }}</span>
            </div>
            <div class="mb-6px text-13px">{{ renderRoute(task) }}</div>
            <div v-if="task.executorName" class="mb-6px text-12px text-gray-600">
              执行人：{{ task.executorName }}
            </div>
            <div v-if="task.failReason" class="mb-6px text-12px text-red-500">{{ task.failReason }}</div>

            <div class="flex flex-wrap gap-4px">
              <NButton
                v-if="['PENDING','ACCEPTED','IN_PROGRESS'].includes(task.taskStatus)"
                size="tiny"
                secondary
                @click="copyTaskLink(task)"
              >
                复制链接
              </NButton>
              <NButton
                v-if="hasAuth('yms:internalTask:operate') && task.taskStatus === 'PENDING'"
                size="tiny"
                type="primary"
                @click="handleAction(() => fetchAcceptInternalTask(task.id), '已领取')"
              >
                领取
              </NButton>
              <NButton
                v-if="hasAuth('yms:internalTask:operate') && task.taskStatus === 'ACCEPTED'"
                size="tiny"
                type="warning"
                @click="handleAction(() => fetchStartInternalTask(task.id), '已开始执行')"
              >
                开始
              </NButton>
              <NButton
                v-if="hasAuth('yms:internalTask:complete') && task.taskStatus === 'IN_PROGRESS'"
                size="tiny"
                type="success"
                @click="openComplete(task)"
              >
                完成
              </NButton>
              <NPopconfirm
                v-if="hasAuth('yms:internalTask:operate') && ['PENDING','ACCEPTED','IN_PROGRESS'].includes(task.taskStatus)"
                @positive-click="handleAction(() => fetchFailInternalTask(task.id, '执行异常'), '已标记失败')"
              >
                <template #trigger>
                  <NButton size="tiny" type="error">异常</NButton>
                </template>
                确认标记为异常？
              </NPopconfirm>
              <NPopconfirm
                v-if="hasAuth('yms:internalTask:cancel') && ['PENDING','ACCEPTED'].includes(task.taskStatus)"
                @positive-click="handleAction(() => fetchCancelInternalTask(task.id), '已取消')"
              >
                <template #trigger>
                  <NButton size="tiny" quaternary>取消</NButton>
                </template>
                确认取消任务？
              </NPopconfirm>
            </div>
          </NCard>

          <NEmpty v-if="!col.tasks.length" description="暂无任务" class="py-24px" />
        </div>
      </div>
    </div>

    <NModal v-model:show="completeVisible" preset="card" title="完成任务" class="w-420px">
      <NForm label-placement="top">
        <NFormItem label="现场照片（可选）">
          <GatePhotoUpload v-model="completePhotoUrls" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton @click="completeVisible = false">取消</NButton>
        <NButton type="primary" class="ml-8px" @click="handleComplete">确认完成</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.kanban-col {
  flex: 1;
  min-height: 200px;
}
</style>
