<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NDropdown, NProgress, NTag } from 'naive-ui';
import {
  KANBAN_COLUMN_BG,
  KANBAN_STATUS_KEYS,
  KANBAN_STATUS_LABEL,
  KANBAN_STATUS_TAG
} from '../constants';

const props = defineProps<{
  tasks: Api.Wms.DevanningWorkTask[];
  selectedId?: number | null;
  taskProgress: (row: Api.Wms.DevanningWorkTask) => number;
}>();

const emit = defineEmits<{
  (e: 'select', row: Api.Wms.DevanningWorkTask): void;
  (e: 'enter', row: Api.Wms.DevanningWorkTask): void;
  (e: 'detail', row: Api.Wms.DevanningWorkTask, event?: Event): void;
  (e: 'date', row: Api.Wms.DevanningWorkTask, event?: Event): void;
  (e: 'dock', row: Api.Wms.DevanningWorkTask, event?: Event): void;
  (e: 'extra-fee', row: Api.Wms.DevanningWorkTask, event?: Event): void;
  (e: 'action', key: string, row: Api.Wms.DevanningWorkTask): void;
}>();

const PRIORITY_TAG: Record<string, 'error' | 'warning' | 'default'> = {
  A: 'error',
  B: 'warning',
  C: 'default'
};

const columns = computed(() =>
  KANBAN_STATUS_KEYS.map(status => ({
    status,
    label: KANBAN_STATUS_LABEL[status] || status,
    tagType: KANBAN_STATUS_TAG[status] || 'default',
    bg: KANBAN_COLUMN_BG[status] || '#fafafa',
    items: props.tasks.filter(row => row.devanningStatus === status)
  }))
);

function formatMoney(val: number | null | undefined) {
  if (val == null || val <= 0) return null;
  return `$${val}`;
}

function formatDateTime(val?: string | null) {
  if (!val) return '—';
  return String(val).replace('T', ' ').slice(0, 16);
}

function handleCardAction(key: string, row: Api.Wms.DevanningWorkTask) {
  emit('action', key, row);
}
</script>

<template>
  <div class="kanban-board">
    <div v-for="col in columns" :key="col.status" class="kanban-col">
      <div class="kanban-head">
        <span>{{ col.label }}</span>
        <NTag size="tiny" :type="col.tagType">{{ col.items.length }}</NTag>
      </div>
      <div class="kanban-body">
        <div
          v-for="task in col.items"
          :key="task.id"
          class="kanban-card"
          :class="{ 'kanban-card--selected': selectedId === task.id }"
          :style="{ background: col.bg }"
          @click="emit('select', task)"
          @dblclick="emit('enter', task)"
        >
          <div class="flex items-start justify-between gap-8px">
            <div class="min-w-0 flex-1">
              <div
                class="cursor-pointer truncate font-600 text-primary hover:underline"
                @click.stop="emit('detail', task, $event)"
              >
                {{ task.containerNo }}
              </div>
              <div class="mt-2px truncate text-11px text-#9ca3af">{{ task.devanningNo }}</div>
            </div>
            <NTag v-if="task.isTodayDevanning" size="tiny" type="success" :bordered="false">今日</NTag>
          </div>

          <div class="mt-8px flex flex-wrap gap-4px">
            <NTag size="tiny" :type="PRIORITY_TAG[task.devanningPriorityLevel] || 'default'">
              {{ task.devanningPriority }}
            </NTag>
            <NTag v-if="task.dockCode" size="tiny" type="info" :bordered="false">{{ task.dockCode }}</NTag>
          </div>

          <div class="mt-8px text-12px text-#4b5563">
            <div class="truncate">{{ task.customerName || '—' }}</div>
            <div class="mt-2px truncate text-#9ca3af">{{ task.devanningSupplier || '未分配供应商' }}</div>
            <div class="mt-4px truncate text-#6b7280">预计拆柜 {{ formatDateTime(task.plannedDevanningTime) }}</div>
          </div>

          <div class="mt-8px flex items-center justify-between text-12px">
            <NButton
              size="tiny"
              quaternary
              type="primary"
              :disabled="task.devanningStatus === 'CANCELLED' || task.devanningStatus === 'DEVANNED'"
              @click.stop="emit('date', task, $event)"
            >
              {{ task.devanningDate || '待排期' }}
            </NButton>
            <span class="text-#9ca3af">{{ task.isaCbmLabel || `${task.isaTripQty}车` }}</span>
          </div>

          <div class="mt-8px flex items-center gap-8px">
            <NProgress
              class="flex-1"
              type="line"
              :percentage="taskProgress(task)"
              :show-indicator="false"
              :height="4"
              :status="taskProgress(task) >= 100 ? 'success' : 'default'"
            />
            <span class="text-11px text-#6b7280 whitespace-nowrap">{{ taskProgress(task) }}%</span>
          </div>

          <div
            v-if="formatMoney(task.extraOperationFee)"
            class="mt-6px truncate text-11px text-#6b7280"
            @click.stop="emit('extra-fee', task, $event)"
          >
            额外费 {{ formatMoney(task.extraOperationFee) }}
            <span v-if="task.extraOperationFeeRemark">· {{ task.extraOperationFeeRemark }}</span>
          </div>

          <div class="mt-10px flex flex-wrap gap-4px">
            <NButton size="tiny" type="primary" @click.stop="emit('enter', task)">进入拆柜</NButton>
            <NDropdown
              trigger="click"
              :options="[
                { label: '查看订单详情', key: 'detail' },
                { label: '调整 DOCK', key: 'dock' },
                { label: '额外操作费', key: 'extra-fee' },
                { label: '卡板记录', key: 'pallet' }
              ]"
              @select="(key: string) => handleCardAction(key, task)"
            >
              <NButton size="tiny" secondary @click.stop>更多</NButton>
            </NDropdown>
          </div>
        </div>
        <div v-if="!col.items.length" class="kanban-empty">暂无任务</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  min-height: 420px;
}

.kanban-col {
  flex: 0 0 248px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 360px);
  min-height: 360px;
  background: rgb(var(--container-bg-color));
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
}

.kanban-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.kanban-body {
  flex: 1;
  overflow: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: rgb(var(--primary-color));
  }
}

.kanban-card--selected {
  border-color: rgb(var(--primary-color));
  box-shadow: 0 0 0 1px rgb(var(--primary-color) / 0.25);
}

.kanban-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}
</style>
