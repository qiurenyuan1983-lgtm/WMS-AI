<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import {
  NButton, NCard, NDataTable, NDatePicker, NForm, NFormItem,
  NInput, NPopconfirm, NProgress, NSelect, NTag
} from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchCancelTask, fetchCheckIn, fetchGetDispatchStats,
  fetchGetYardTaskList, fetchLeaveYard, fetchRelease
} from '@/service/api/yms/dispatch';
import { useAuth } from '@/hooks/business/auth';
import { useTripDeadlineColumns } from '@/views/tms/composables/use-trip-deadline-columns';
import { WMS_READY_META } from '../dispatch/modules/dispatch-meta';
import { YMS_ROUTE, ymsTo } from '../shared/yms-route';

const loadingDeadlineCols = useTripDeadlineColumns<Api.Yms.YardTask>();

defineOptions({ name: 'YmsTask' });

const router = useRouter();
const { hasAuth } = useAuth();

// ─── 任务类型 Tab ────────────────────────────────────────────────────

type TypeTab = 'DEVANNING' | 'LOADING';
const activeTypeTab = ref<TypeTab>('DEVANNING');

const TYPE_TABS = [
  { label: '拆柜任务', value: 'DEVANNING' as TypeTab },
  { label: '装车任务', value: 'LOADING'   as TypeTab },
];

// ─── 状态 Tab 定义（拆柜/装车各自不同）──────────────────────────────

type StatusTabDef = { label: string; statuses: string[] };

const DEVANNING_STATUS_TABS: StatusTabDef[] = [
  { label: '全部',   statuses: [] },
  { label: '未到仓', statuses: ['CREATED', 'PRE_ARRIVAL'] },
  { label: '等待中', statuses: ['ARRIVED', 'WAITING', 'QUEUED'] },
  { label: '已上口', statuses: ['DOCK_ASSIGNED'] },
  { label: '拆柜中', statuses: ['DOCK_WORKING', 'DEVANNING', 'OPERATION_PAUSED'] },
  { label: '已下口', statuses: ['OPERATION_FINISHED', 'RELEASED'] },
  { label: '已离园', statuses: ['LEFT_YARD'] },
];

const LOADING_STATUS_TABS: StatusTabDef[] = [
  { label: '全部',     statuses: [] },
  { label: '未到仓',   statuses: ['CREATED', 'PRE_ARRIVAL'] },
  { label: '到仓等候', statuses: ['ARRIVED', 'WAITING', 'QUEUED'] },
  { label: '已分配',   statuses: ['DOCK_ASSIGNED'] },
  { label: '装车中',   statuses: ['DOCK_WORKING', 'LOADING', 'OPERATION_PAUSED'] },
  { label: '已离园',   statuses: ['RELEASED', 'LEFT_YARD'] },
];

const currentStatusTabs = computed<StatusTabDef[]>(() =>
  activeTypeTab.value === 'DEVANNING' ? DEVANNING_STATUS_TABS : LOADING_STATUS_TABS
);

// 装车子类型（装车 Tab 下专用）
const LOADING_SUB_TABS = [
  { label: '全部装车', value: '' },
  { label: '派送',     value: 'DELIVERY_LOADING' },
  { label: '调拨',     value: 'TRANSFER_LOADING' },
  { label: '自提',     value: 'PICKUP_LOADING' },
  { label: '退货',     value: 'RETURN_LOADING' },
];

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

// ─── 仓库 ───────────────────────────────────────────────────────────

const warehouseOptions = ref<{ label: string; value: any }[]>([{ label: '全部仓库', value: '' }]);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? (Array.isArray(data) ? data : []);
  warehouseOptions.value = [
    { label: '全部仓库', value: '' },
    ...rows.map((w: any) => ({ label: w.warehouseName, value: w.id })),
  ];
}

// ─── 统计 ────────────────────────────────────────────────────────────

const stats = ref<Api.Yms.DispatchStats>({
  totalTasks: 0, waitingTasks: 0, workingTasks: 0, devanningTasks: 0,
  loadingTasks: 0, finishedTasks: 0, inYardVehicles: 0, totalDocks: 0, occupiedDocks: 0,
});

async function loadStats() {
  const wid = filterWarehouse.value || undefined;
  const { data } = await fetchGetDispatchStats(wid as any, activeTypeTab.value);
  if (data) stats.value = data;
}

function tabCount(tab: StatusTabDef): number {
  const counts = stats.value.statusCounts ?? {};
  if (!tab.statuses.length) return Object.values(counts).reduce((a, b) => a + b, 0);
  return tab.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
}

// ─── 折叠 ────────────────────────────────────────────────────────────

const collapsed = ref(false);

// ─── 查询参数 ────────────────────────────────────────────────────────

const keyword = ref('');
const filterSubType = ref('');            // 装车子类型
const filterStatuses = ref<string[]>([]); // 状态 tab 选中的 statuses
const filterWarehouse = ref('');
const filterDateRange = ref<[number, number] | null>(null);
const pageNum = ref(1);
const pageSize = ref(10);
const checkedRowKeys = ref<CommonType.IdType[]>([]);

function isStatusTabActive(tab: StatusTabDef): boolean {
  if (!tab.statuses.length && !filterStatuses.value.length) return true;
  if (tab.statuses.length !== filterStatuses.value.length) return false;
  return tab.statuses.every(s => filterStatuses.value.includes(s));
}

function selectStatusTab(tab: StatusTabDef) {
  filterStatuses.value = tab.statuses;
  pageNum.value = 1;
  loadData();
}

// 切换主类型 Tab 时重置所有筛选
function switchTypeTab(tab: TypeTab) {
  activeTypeTab.value = tab;
  filterStatuses.value = [];
  filterSubType.value = '';
  filterDateRange.value = null;
  keyword.value = '';
  pageNum.value = 1;
  loadAll();
}

watch(filterWarehouse, () => { loadStats(); });

// ─── 统计展示配置 ────────────────────────────────────────────────────

const statItems = computed(() => {
  if (activeTypeTab.value === 'DEVANNING') {
    return [
      { label: '拆柜任务', val: stats.value.devanningTasks, color: '#8b5cf6' },
      { label: '等待中',   val: stats.value.waitingTasks,   color: '#f97316' },
      { label: '拆柜中',   val: stats.value.workingTasks,   color: '#3b82f6' },
      { label: '已完成',   val: stats.value.finishedTasks,  color: '#10b981' },
      { label: '在场车辆', val: stats.value.inYardVehicles, color: '#374151' },
    ];
  }
  return [
    { label: '装车任务', val: stats.value.loadingTasks,   color: '#06b6d4' },
    { label: '等待中',   val: stats.value.waitingTasks,   color: '#f97316' },
    { label: '装车中',   val: stats.value.workingTasks,   color: '#3b82f6' },
    { label: '已完成',   val: stats.value.finishedTasks,  color: '#10b981' },
    { label: '在场车辆', val: stats.value.inYardVehicles, color: '#374151' },
  ];
});

// ─── 数据加载 ────────────────────────────────────────────────────────

const taskList = ref<Api.Yms.YardTask[]>([]);
const taskTotal = ref(0);
const loading = ref(false);

function formatTs(ts: number | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 00:00:00`;
}

function formatDate(d: string | null) {
  if (!d) return '--';
  return d.slice(0, 16).replace('T', ' ');
}

async function loadData() {
  loading.value = true;
  try {
    const [beginTs, endTs] = filterDateRange.value ?? [null, null];
    const specificType = activeTypeTab.value === 'DEVANNING'
      ? 'DEVANNING'
      : (filterSubType.value || undefined);
    const group = !specificType && activeTypeTab.value === 'LOADING' ? 'LOADING' : undefined;

    const { data } = await fetchGetYardTaskList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      taskType: specificType,
      taskGroup: group,
      yardStatus: filterStatuses.value.length ? filterStatuses.value.join(',') : undefined,
      warehouseId: filterWarehouse.value || undefined,
      timeField: filterDateRange.value ? 'eta_yard_time' : undefined,
      beginTime: formatTs(beginTs),
      endTime: endTs ? formatTs(endTs)!.replace('00:00:00', '23:59:59') : null,
    } as Api.Yms.YardTaskSearchParams);
    taskList.value = data?.rows || [];
    taskTotal.value = data?.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadStats(), loadData()]);
}

function handleSearch() { pageNum.value = 1; loadData(); }
function handleReset() {
  keyword.value = '';
  filterSubType.value = '';
  filterStatuses.value = [];
  filterDateRange.value = null;
  pageNum.value = 1;
  loadAll();
}

// ─── 批量操作 ────────────────────────────────────────────────────────

async function handleBatchCheckIn() {
  await Promise.all(checkedRowKeys.value.map(id => fetchCheckIn(id)));
  window.$message?.success(`批量签到完成（${checkedRowKeys.value.length} 条）`);
  checkedRowKeys.value = [];
  loadData();
}

async function handleBatchRelease() {
  await Promise.all(checkedRowKeys.value.map(id => fetchRelease(id)));
  window.$message?.success(`批量放行完成（${checkedRowKeys.value.length} 条）`);
  checkedRowKeys.value = [];
  loadData();
}

async function handleCancel(id: CommonType.IdType) {
  const { error } = await fetchCancelTask(id);
  if (!error) { window.$message?.success('任务已取消'); loadData(); }
}

async function handleLeave(id: CommonType.IdType) {
  const { error } = await fetchLeaveYard(id);
  if (!error) { window.$message?.success('已离园'); loadData(); }
}

// ─── 表格列 ─────────────────────────────────────────────────────────

const TASK_TYPE_LABEL: Record<string, string> = {
  DEVANNING: '卸柜任务', DELIVERY_LOADING: '派送装车',
  TRANSFER_LOADING: '调拨装车', PICKUP_LOADING: '自提装车',
  RETURN_LOADING: '退货装车', OTHER: '其他',
};

const baseColumns = [
  { type: 'selection' as const, align: 'center' as const, width: 40 },
  {
    key: 'yardTaskNo', title: '任务号', width: 160, ellipsis: { tooltip: true },
    render: (row: Api.Yms.YardTask) => (
      <span class="text-primary cursor-pointer hover:underline"
        onClick={() => router.push(ymsTo(YMS_ROUTE.dispatchDetail, { id: row.id }))}>
        {row.yardTaskNo}
      </span>
    )
  },
  {
    key: 'taskType', title: '任务类型', width: 90,
    render: (row: Api.Yms.YardTask) => (
      <span class="text-12px">{TASK_TYPE_LABEL[row.taskType] ?? row.taskType}</span>
    )
  },
  {
    key: 'sourceOrderNo', title: '来源单号', width: 140, ellipsis: { tooltip: true },
    render: (row: Api.Yms.YardTask) => row.sourceOrderNo || '--'
  },
  {
    key: 'containerNo', title: '柜号/车牌', width: 130, ellipsis: { tooltip: true },
    render: (row: Api.Yms.YardTask) => row.containerNo || row.truckNo || '--'
  },
  {
    key: 'driver', title: '司机', width: 110,
    render: (row: Api.Yms.YardTask) => (
      <div>
        <div class="text-12px">{row.driverName || '--'}</div>
        <div class="text-11px text-gray-400">{row.driverPhone || ''}</div>
      </div>
    )
  },
  {
    key: 'yardStatus', title: '状态', width: 100,
    render: (row: Api.Yms.YardTask) => {
      const m = STATUS_META[row.yardStatus] || { label: row.yardStatus, type: 'default' };
      return <NTag type={m.type as any} size="small" round>{m.label}</NTag>;
    }
  },
  {
    key: 'wmsReadyStatus', title: 'WMS备货', width: 88,
    render: (row: Api.Yms.YardTask) => {
      if (row.taskType === 'DEVANNING') return <span class="text-gray-400 text-12px">--</span>;
      const m = WMS_READY_META[row.wmsReadyStatus ?? 'NOT_REQUIRED'] ?? { label: row.wmsReadyStatus, type: 'default' };
      return <NTag type={m.type as any} size="small">{m.label}</NTag>;
    }
  },
  {
    key: 'priority', title: '时效优先级', width: 80, align: 'center' as const,
    render: (row: Api.Yms.YardTask) => (
      <span class="text-12px font-semibold">{row.priority ?? 5}</span>
    )
  },
  {
    key: 'etaYardTime', title: '计划到仓', width: 120,
    render: (row: Api.Yms.YardTask) => formatDate(row.etaYardTime)
  },
  {
    key: 'gateInTime', title: '实际到仓', width: 120,
    render: (row: Api.Yms.YardTask) => formatDate(row.gateInTime)
  },
  {
    key: 'dockCode', title: 'Dock', width: 80, ellipsis: { tooltip: true },
    render: (row: Api.Yms.YardTask) => row.dockCode || '--'
  },
  {
    key: 'operationProgress', title: '作业进度', width: 110,
    render: (row: Api.Yms.YardTask) => {
      if (row.operationProgress == null) return <span class="text-gray-400 text-12px">--</span>;
      return (
        <div>
          <div class="text-11px text-right mb-2px text-gray-500">{row.operationProgress}%</div>
          <NProgress type="line" percentage={row.operationProgress}
            height={6} border-radius={3} show-indicator={false} />
        </div>
      );
    }
  },
  {
    key: 'visitNo', title: '到仓次数', width: 72, align: 'center' as const,
    render: (row: Api.Yms.YardTask) => row.visitNo ?? 1
  },
  {
    key: 'operate', title: '操作', width: 140, fixed: 'right' as const,
    render: (row: Api.Yms.YardTask) => {
      const btns = [
        <NButton key="detail" size="tiny" quaternary type="info"
          onClick={() => router.push(ymsTo(YMS_ROUTE.dispatchDetail, { id: row.id }))}>详情</NButton>
      ];
      if (['ARRIVED', 'WAITING'].includes(row.yardStatus) && hasAuth('yms:yard:checkin'))
        btns.push(
          <NButton key="checkin" size="tiny" quaternary type="primary"
            onClick={async () => { await fetchCheckIn(row.id); loadData(); }}>签到</NButton>
        );
      if (row.yardStatus === 'OPERATION_FINISHED' && hasAuth('yms:yard:release'))
        btns.push(
          <NButton key="release" size="tiny" quaternary type="success"
            onClick={async () => { await fetchRelease(row.id); loadData(); }}>放行</NButton>
        );
      if (row.yardStatus === 'RELEASED' && hasAuth('yms:yard:leave'))
        btns.push(
          <NButton key="leave" size="tiny" quaternary
            onClick={() => handleLeave(row.id)}>离园</NButton>
        );
      if (!['CANCELLED', 'LEFT_YARD', 'RELEASED', 'OPERATION_FINISHED'].includes(row.yardStatus)
        && hasAuth('yms:yard:cancel'))
        btns.push(
          <NPopconfirm key="cancel" onPositiveClick={() => handleCancel(row.id)}>
            {{ default: () => '确认取消此任务？', trigger: () => <NButton size="tiny" quaternary type="error">取消</NButton> }}
          </NPopconfirm>
        );
      return <div class="flex flex-wrap gap-2px">{btns}</div>;
    }
  },
];

const columns = computed(() => {
  if (activeTypeTab.value !== 'LOADING') return baseColumns;
  const insertAt = baseColumns.findIndex(c => 'key' in c && c.key === 'priority');
  const head = baseColumns.slice(0, insertAt >= 0 ? insertAt + 1 : 5);
  const tail = baseColumns.slice(insertAt >= 0 ? insertAt + 1 : 5);
  return [...head, ...loadingDeadlineCols, ...tail];
});

const pagination = computed(() => ({
  page: pageNum.value,
  pageSize: pageSize.value,
  itemCount: taskTotal.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  showQuickJumper: true,
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,
  onChange: (page: number) => { pageNum.value = page; loadData(); },
  onUpdatePageSize: (size: number) => { pageSize.value = size; pageNum.value = 1; loadData(); },
} as any));

onMounted(async () => {
  await loadWarehouses();
  await loadAll();
});
</script>

<template>
  <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">

    <!-- ── 顶部：统计 + 折叠搜索 ── -->
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">

      <!-- 主类型 Tab 切换 -->
      <div class="flex items-center gap-0 mb-12px border-b border-gray-100 pb-10px">
        <NButton
          v-for="tab in TYPE_TABS"
          :key="tab.value"
          :type="activeTypeTab === tab.value ? 'primary' : 'default'"
          size="small"
          class="mr-6px"
          @click="switchTypeTab(tab.value)"
        >{{ tab.label }}</NButton>

        <div class="ml-auto flex items-center gap-8px">
          <NSelect
            v-model:value="filterWarehouse"
            :options="warehouseOptions"
            size="small"
            class="w-160px"
            @update:value="loadAll"
          />
          <NButton text size="small" class="text-gray-500" @click="collapsed = !collapsed">
            {{ collapsed ? '展开筛选' : '收起筛选' }}
            <span :class="collapsed ? 'i-ic-round-keyboard-arrow-down' : 'i-ic-round-keyboard-arrow-up'"
              class="ml-2px text-16px" />
          </NButton>
        </div>
      </div>

      <!-- 统计数字 -->
      <div class="flex gap-24px flex-wrap mb-10px">
        <div v-for="item in statItems" :key="item.label" class="stat-item">
          <span class="stat-num" :style="{ color: item.color }">{{ item.val }}</span>
          <span class="stat-label">{{ item.label }}</span>
        </div>
      </div>

      <!-- 折叠区 -->
      <div v-show="!collapsed" class="pt-10px border-t border-gray-100">

        <!-- 状态快捷 Tag -->
        <div class="flex items-center gap-6px mb-10px flex-wrap">
          <NButton
            v-for="tab in currentStatusTabs"
            :key="tab.label"
            size="tiny"
            :type="isStatusTabActive(tab) ? 'primary' : 'default'"
            :secondary="!isStatusTabActive(tab)"
            @click="selectStatusTab(tab)"
          >
            {{ tab.label }}
            <span class="ml-3px opacity-75">({{ tabCount(tab) }})</span>
          </NButton>
        </div>

        <!-- 装车子类型 Tab -->
        <div v-if="activeTypeTab === 'LOADING'" class="flex gap-4px mb-8px flex-wrap">
          <NButton
            v-for="tab in LOADING_SUB_TABS"
            :key="tab.value"
            size="tiny"
            :type="filterSubType === tab.value ? 'info' : 'default'"
            :secondary="filterSubType !== tab.value"
            @click="filterSubType = tab.value; pageNum = 1; loadData()"
          >{{ tab.label }}</NButton>
        </div>

        <!-- 搜索表单 -->
        <NForm inline label-placement="left" :show-feedback="false" size="small" class="flex flex-wrap gap-y-8px">
          <NFormItem>
            <NInput
              v-model:value="keyword"
              placeholder="任务号/来源单号/车牌号/柜号/司机姓名"
              clearable
              class="w-260px"
              @keydown.enter="handleSearch"
            />
          </NFormItem>
          <NFormItem label="计划到仓" class="ml-8px">
            <NDatePicker
              v-model:value="filterDateRange"
              type="daterange"
              clearable
              class="w-220px"
            />
          </NFormItem>
          <NFormItem class="ml-8px">
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton class="ml-8px" @click="handleReset">重置</NButton>
          </NFormItem>
        </NForm>
      </div>
    </NCard>

    <!-- ── 按钮区 + 表格 ── -->
    <NCard
      :bordered="false"
      class="flex-1 card-wrapper overflow-hidden"
      :content-style="{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0, padding: '16px' }"
    >
      <div class="mb-12px flex items-center gap-8px flex-wrap flex-shrink-0">
        <NButton
          v-if="hasAuth('yms:yard:create')"
          type="primary"
          @click="router.push(ymsTo(YMS_ROUTE.dispatchCreate))"
        >新建任务</NButton>
        <NButton
          v-if="hasAuth('yms:yard:checkin')"
          :disabled="!checkedRowKeys.length"
          @click="handleBatchCheckIn"
        >批量签到</NButton>
        <NButton
          v-if="hasAuth('yms:yard:assignDock')"
          :disabled="!checkedRowKeys.length"
          @click="router.push(ymsTo(YMS_ROUTE.dispatch))"
        >分配Dock</NButton>
        <NButton
          v-if="hasAuth('yms:yard:release')"
          :disabled="!checkedRowKeys.length"
          @click="handleBatchRelease"
        >批量放行</NButton>
        <NButton @click="loadAll">刷新</NButton>
        <span class="ml-auto text-12px text-gray-400">已选 {{ checkedRowKeys.length }} 条</span>
      </div>

      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="taskList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: Api.Yms.YardTask) => row.id"
        size="small"
        flex-height
        remote
        :scroll-x="activeTypeTab === 'LOADING' ? 2100 : 1360"
        class="flex-1 min-h-0"
      />
    </NCard>
  </div>
</template>

<style scoped>
.stat-item  { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 52px; }
.stat-num   { font-size: 22px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 11px; color: #6b7280; }
</style>
