<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton, NDataTable, NDatePicker, NForm, NFormItem, NInput, NSelect, NTag
} from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchCheckIn, fetchGetYardTaskList } from '@/service/api/yms/dispatch';
import { useAuth } from '@/hooks/business/auth';
import { WMS_READY_META, getTaskDisplayNo } from './dispatch-meta';
import { YMS_ROUTE, ymsTo } from '../../shared/yms-route';

const props = withDefaults(defineProps<{
  warehouseId: CommonType.IdType | null;
  taskGroup: '' | 'DEVANNING' | 'LOADING';
  selectedTaskId?: CommonType.IdType | null;
  statusCounts?: Record<string, number>;
}>(), { selectedTaskId: null, statusCounts: () => ({}) });

const emit = defineEmits<{
  select: [task: Api.Yms.YardTask | null];
  operated: [];
}>();

const router = useRouter();
const { hasAuth } = useAuth();

// ─── 元数据 ──────────────────────────────────────────────────────────

const TASK_TYPE_SHORT: Record<string, string> = {
  DEVANNING: '拆柜', DELIVERY_LOADING: '派送',
  TRANSFER_LOADING: '调拨', PICKUP_LOADING: '自提',
  RETURN_LOADING: '退货', OTHER: '其他',
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
};

const INTERNAL_TASK_TYPE_META: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  DOCK_IN: { label: 'YardGo上口', type: 'warning' },
  DOCK_OUT: { label: 'YardGo下口', type: 'info' },
};

const INTERNAL_TASK_STATUS_LABEL: Record<string, string> = {
  PENDING: '待领取',
  ASSIGNED: '已分配',
  ACCEPTED: '已领取',
  IN_PROGRESS: '执行中',
};

function renderYardStatus(row: Api.Yms.YardTask) {
  if (row.openInternalTaskType) {
    const m = INTERNAL_TASK_TYPE_META[row.openInternalTaskType] ?? { label: row.openInternalTaskType, type: 'warning' };
    const status = row.openInternalTaskStatus ? INTERNAL_TASK_STATUS_LABEL[row.openInternalTaskStatus] ?? row.openInternalTaskStatus : '';
    const target = row.openInternalTaskTargetCode ? ` → ${row.openInternalTaskTargetCode}` : '';
    return (
      <NTag type={m.type as any} size="small">
        {m.label}{status ? ` · ${status}` : ''}{target}
      </NTag>
    );
  }
  const m = STATUS_META[row.yardStatus] || { label: row.yardStatus, type: 'default' };
  return <NTag type={m.type as any} size="small">{m.label}</NTag>;
}

// 状态快捷 Tab 定义
type StatusTab = { label: string; statuses: string[] };

const DEVANNING_STATUS_TABS: StatusTab[] = [
  { label: '全部',   statuses: [] },
  { label: '未到仓', statuses: ['CREATED', 'PRE_ARRIVAL'] },
  { label: '等待中', statuses: ['ARRIVED', 'WAITING', 'QUEUED'] },
  { label: '已上口', statuses: ['DOCK_ASSIGNED'] },
  { label: '拆柜中', statuses: ['DOCK_WORKING', 'DEVANNING', 'OPERATION_PAUSED'] },
  { label: '已下口', statuses: ['OPERATION_FINISHED', 'RELEASED'] },
];

const LOADING_STATUS_TABS: StatusTab[] = [
  { label: '全部',     statuses: [] },
  { label: '未到仓',   statuses: ['CREATED', 'PRE_ARRIVAL'] },
  { label: '到仓等候', statuses: ['ARRIVED', 'WAITING', 'QUEUED'] },
  { label: '已分配',   statuses: ['DOCK_ASSIGNED'] },
  { label: '装车中',   statuses: ['DOCK_WORKING', 'LOADING', 'OPERATION_PAUSED'] },
];

const statusTabs = computed<StatusTab[]>(() => {
  if (props.taskGroup === 'DEVANNING') return DEVANNING_STATUS_TABS;
  if (props.taskGroup === 'LOADING') return LOADING_STATUS_TABS;
  return [];
});

function tabCount(tab: StatusTab): number {
  if (!tab.statuses.length) return Object.values(props.statusCounts).reduce((a, b) => a + b, 0);
  return tab.statuses.reduce((sum, s) => sum + (props.statusCounts[s] ?? 0), 0);
}

// 装车子类型 Tab（仅装车页专用）
const LOADING_TABS = [
  { label: '全部装车', value: '' },
  { label: '派送',     value: 'DELIVERY_LOADING' },
  { label: '调拨',     value: 'TRANSFER_LOADING' },
  { label: '自提',     value: 'PICKUP_LOADING' },
  { label: '退货',     value: 'RETURN_LOADING' },
];

const TIME_FIELD_OPTIONS = [
  { label: '预计拆柜时间', value: 'eta_yard_time' },
  { label: '签到到仓',     value: 'gate_in_time' },
  { label: 'Dock开始',    value: 'dock_start_time' },
  { label: 'Dock完成',    value: 'dock_finish_time' },
  { label: '放行时间',     value: 'release_time' },
  { label: '创建时间',     value: 'create_time' },
];

// ─── 筛选状态 ────────────────────────────────────────────────────────

const filterStatuses = ref<string[]>([]);    // 当前激活的状态 tab 的 statuses 列表
const filterSubType  = ref('');
const filterTimeField = ref('eta_yard_time');

function todayRange(): [number, number] {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
  return [s, e];
}
const filterTimeRange = ref<[number, number] | null>(todayRange());
const keyword = ref('');
const pageNum = ref(1);
const pageSize = ref(10);

function selectStatusTab(tab: StatusTab) {
  filterStatuses.value = tab.statuses;
  pageNum.value = 1;
  reload();
}

function isTabActive(tab: StatusTab): boolean {
  if (!tab.statuses.length && !filterStatuses.value.length) return true;
  if (tab.statuses.length !== filterStatuses.value.length) return false;
  return tab.statuses.every(s => filterStatuses.value.includes(s));
}

// ─── 数据 ────────────────────────────────────────────────────────────

const taskList = ref<Api.Yms.YardTask[]>([]);
const taskTotal = ref(0);
const taskLoading = ref(false);

function formatTs(ts: number | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 00:00:00`;
}

function formatDate(d: string | null) {
  if (!d) return '--';
  return d.slice(0, 16).replace('T', ' ');
}

async function reload() {
  taskLoading.value = true;
  try {
    const [beginTs, endTs] = filterTimeRange.value ?? [null, null];
    const specificType = props.taskGroup === 'DEVANNING'
      ? 'DEVANNING'
      : (filterSubType.value || undefined);
    const group = !specificType && props.taskGroup === 'LOADING' ? 'LOADING' : undefined;

    const { data } = await fetchGetYardTaskList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      warehouseId: props.warehouseId,
      keyword: keyword.value || undefined,
      taskType: specificType,
      taskGroup: group,
      yardStatus: filterStatuses.value.length ? filterStatuses.value.join(',') : undefined,
      timeField: filterTimeField.value || undefined,
      beginTime: formatTs(beginTs),
      endTime: endTs ? formatTs(endTs)!.replace('00:00:00', '23:59:59') : null,
    } as Api.Yms.YardTaskSearchParams);
    taskList.value = data?.rows || [];
    taskTotal.value = data?.total || 0;
  } finally {
    taskLoading.value = false;
  }
}

watch(() => props.warehouseId, () => { pageNum.value = 1; reload(); });

function handleSearch() { pageNum.value = 1; reload(); }
function handleReset() {
  keyword.value = '';
  filterSubType.value = '';
  filterStatuses.value = [];
  filterTimeField.value = 'eta_yard_time';
  filterTimeRange.value = todayRange();
  pageNum.value = 1;
  reload();
}

async function handleCheckIn(id: CommonType.IdType) {
  const { error } = await fetchCheckIn(id);
  if (!error) { window.$message?.success('签到成功'); emit('operated'); reload(); }
}

// ─── 表格列 ─────────────────────────────────────────────────────────

const taskColumns = computed(() => {
  const isLoading = props.taskGroup === 'LOADING';
  const cols: any[] = [
  {
    key: isLoading ? 'yardTaskNo' : 'containerNo',
    title: isLoading ? '车次号' : '柜号',
    width: 116,
    ellipsis: { tooltip: true },
    render: (row: Api.Yms.YardTask) => (
      <span class="text-primary cursor-pointer hover:underline font-mono text-12px"
        onClick={() => router.push(ymsTo(YMS_ROUTE.dispatchDetail, { id: row.id }))}>
        {isLoading
          ? getTaskDisplayNo(row, 'LOADING')
          : getTaskDisplayNo(row, 'DEVANNING')}
      </span>
    )
  },
  {
    key: 'taskType', title: '类型', width: 48,
    render: (row: Api.Yms.YardTask) => (
      <span class="text-11px">{TASK_TYPE_SHORT[row.taskType] ?? row.taskType}</span>
    )
  },
  {
    key: 'priority', title: '优先级', width: 52, align: 'center' as const,
    render: (row: Api.Yms.YardTask) => (
      <span class="text-12px font-semibold">{row.priority ?? 5}</span>
    )
  },
  ];
  if (props.taskGroup === 'LOADING') {
    cols.push({
      key: 'wmsReadyStatus', title: 'WMS', width: 72,
      render: (row: Api.Yms.YardTask) => {
        const m = WMS_READY_META[row.wmsReadyStatus ?? 'NOT_REQUIRED'] ?? { label: row.wmsReadyStatus, type: 'default' };
        return <NTag type={m.type as any} size="small">{m.label}</NTag>;
      }
    });
  }
  cols.push(
  {
    key: 'sourceOrderNo', title: '来源单号', width: 100, ellipsis: { tooltip: true },
    render: (row: Api.Yms.YardTask) => row.sourceOrderNo || '--'
  },
  {
    key: 'yardStatus', title: '状态', width: 160,
    render: (row: Api.Yms.YardTask) => renderYardStatus(row)
  },
  {
    key: 'dockCode', title: 'Dock', width: 56,
    render: (row: Api.Yms.YardTask) => row.dockCode || '--'
  },
  );
  return cols;
});

const pagination = computed(() => ({
  page: pageNum.value,
  pageSize: pageSize.value,
  itemCount: taskTotal.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => { pageNum.value = page; reload(); },
  onUpdatePageSize: (size: number) => { pageSize.value = size; pageNum.value = 1; reload(); },
}));

function toggleSelect(id: CommonType.IdType) {
  const task = taskList.value.find(t => t.id === id) ?? null;
  emit('select', props.selectedTaskId === id ? null : task);
}

const DRAGGABLE_STATUSES = new Set([
  'CREATED', 'PRE_ARRIVAL', 'ARRIVED', 'WAITING', 'QUEUED', 'DOCK_ASSIGNED'
]);

function rowProps(row: Api.Yms.YardTask) {
  const draggable = DRAGGABLE_STATUSES.has(row.yardStatus);
  return {
    draggable: draggable || undefined,
    style: draggable ? 'cursor: grab' : undefined,
    class: row.id === props.selectedTaskId ? 'row-selected' : undefined,
    onClick: () => toggleSelect(row.id),
    onDragstart: draggable ? (e: DragEvent) => {
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', String(row.id));
      e.dataTransfer!.setData('application/json', JSON.stringify({
        id: row.id,
        yardTaskNo: row.yardTaskNo,
        containerNo: row.containerNo,
        sourceOrderNo: row.sourceOrderNo,
      }));
    } : undefined,
  };
}

defineExpose({ reload });
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">

    <!-- 状态快捷 Tab（拆柜/装车页显示） -->
    <div v-if="statusTabs.length" class="flex gap-4px mb-8px flex-wrap">
      <NButton
        v-for="tab in statusTabs"
        :key="tab.label"
        :type="isTabActive(tab) ? 'primary' : 'default'"
        size="small"
        @click="selectStatusTab(tab)"
      >
        {{ tab.label }}
        <span class="ml-3px text-11px opacity-75">({{ tabCount(tab) }})</span>
      </NButton>
    </div>

    <!-- 装车子类型 Tab（仅装车页显示） -->
    <div v-if="taskGroup === 'LOADING'" class="flex gap-4px mb-8px flex-wrap">
      <NButton
        v-for="tab in LOADING_TABS"
        :key="tab.value"
        :type="filterSubType === tab.value ? 'info' : 'default'"
        size="small"
        secondary
        @click="filterSubType = tab.value; pageNum = 1; reload()"
      >{{ tab.label }}</NButton>
    </div>

    <!-- 第一行：关键字 + 查询/重置 -->
    <NForm inline :show-feedback="false" size="small" class="mb-4px">
      <NFormItem>
        <NInput
          v-model:value="keyword"
          :placeholder="taskGroup === 'LOADING' ? '车次号/单号/司机' : '柜号/单号/司机'"
          clearable
          class="w-130px"
          @keydown.enter="handleSearch"
        />
      </NFormItem>
      <NFormItem>
        <NButton type="primary" @click="handleSearch">查询</NButton>
        <NButton class="ml-4px" @click="handleReset">重置</NButton>
      </NFormItem>
    </NForm>

    <!-- 第二行：时间筛选 -->
    <div class="flex gap-4px items-center mb-8px">
      <NSelect
        v-model:value="filterTimeField"
        :options="TIME_FIELD_OPTIONS"
        size="small"
        class="w-90px flex-shrink-0"
      />
      <NDatePicker
        v-model:value="filterTimeRange"
        type="daterange"
        size="small"
        clearable
        class="flex-1 min-w-0"
        @update:value="() => { pageNum = 1; reload(); }"
      />
    </div>

    <!-- 表格 -->
    <NDataTable
      :columns="taskColumns"
      :data="taskList"
      :loading="taskLoading"
      :pagination="pagination"
      :row-key="(row: Api.Yms.YardTask) => row.id"
      :row-props="rowProps"
      size="small"
      flex-height
      remote
      class="flex-1 min-h-0"
      @row-click="(row: Api.Yms.YardTask) => toggleSelect(row.id)"
    />
  </div>
</template>

<style scoped>
:deep(.row-selected td) { background-color: #eff6ff !important; }
</style>
