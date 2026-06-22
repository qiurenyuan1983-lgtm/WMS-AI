<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  NBadge,
  NButton,
  NButtonGroup,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopover,
  NProgress,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  fetchGetDevanningWorkTasks,
  fetchUpdateDevanningWorkDate,
  fetchUpdateDevanningWorkDock,
  fetchUpdateDevanningWorkExtraFee
} from '@/service/api/wms/devanning-work';
import { fetchGetYardDockList } from '@/service/api/yard/dock';
import DevanningOrderDetailDrawer from '@/views/wms/devanning-order/modules/devanning-order-detail-drawer.vue';
import { useDevanningWorkListView, type DevanningWorkDockDef } from './composables/use-devanning-work-list-view';
import { DEVANNING_WORK_VIEW_OPTIONS, type DevanningWorkViewMode } from './constants';
import DevanningWorkKanbanView from './modules/devanning-work-kanban-view.vue';
import { buildDevanningExecQuery } from './utils/resolve-exec-task';

defineOptions({ name: 'WmsDevanningWorkDockList' });

const router = useRouter();

const viewMode = ref<DevanningWorkViewMode>('list');
const loading = ref(false);
const rawTasks = ref<Api.Wms.DevanningWorkTask[]>([]);
const selectedId = ref<number | null>(null);
const dockOptions = ref<Array<{ label: string; value: string }>>([]);
const yardDockDefs = ref<DevanningWorkDockDef[]>([]);

const detailVisible = ref(false);
const detailOrderId = ref<CommonType.IdType | null>(null);

const dockModalVisible = ref(false);
const dockEditTaskId = ref<number | null>(null);
const dockEditValue = ref<string>('3010001');
const dockSaving = ref(false);
const dateModalVisible = ref(false);
const dateEditTaskId = ref<number | null>(null);
const dateEditValue = ref<number | null>(null);
const dateSaving = ref(false);
const extraFeeModalVisible = ref(false);
const extraFeeEditTaskId = ref<number | null>(null);
const extraFeeEditRemark = ref('');
const extraFeeEditAmount = ref<number | null>(null);
const extraFeeSaving = ref(false);
const expandedGroups = ref<string[]>([]);

const STATUS_TABS = [
  { value: 'ALL', label: '全部' },
  { value: 'UNPICKEDUP', label: '未提柜' },
  { value: 'PICKEDUP', label: '已提柜' },
  { value: 'ARRIVED', label: '已到仓' },
  { value: 'DEVANNING', label: '拆柜中' },
  { value: 'DEVANNED', label: '已完成' },
  { value: 'EXCEPTION', label: '异常' },
  { value: 'CANCELLED', label: '已取消' }
] as const;

const {
  keyword,
  activeStatusTab,
  filterDrawerVisible,
  groupBy,
  sortBy,
  sortOrder,
  filters,
  GROUP_OPTIONS,
  SORT_OPTIONS,
  DEVANNING_STATUS_FILTER_OPTIONS,
  activeFilterCount,
  groupByLabel,
  hasGrouping,
  sortLabel,
  resetFilters,
  resetView,
  processTasks,
  taskProgress
} = useDevanningWorkListView();

const viewState = computed(() => processTasks(rawTasks.value, yardDockDefs.value));
const tasks = computed(() => viewState.value.sorted);
const taskGroups = computed(() => viewState.value.groups);
const filterOptions = computed(() => viewState.value.filterOptions);

const statusCounts = computed(() => {
  const counts: Record<string, number> = { ALL: rawTasks.value.length };
  for (const tab of STATUS_TABS) {
    if (tab.value === 'ALL') continue;
    counts[tab.value] = rawTasks.value.filter(r => r.devanningStatus === tab.value).length;
  }
  return counts;
});

const todayDispatchCount = computed(() => rawTasks.value.filter(r => r.dispatchSynced).length);

const STATUS_TAG: Record<string, 'default' | 'warning' | 'success' | 'info' | 'error'> = {
  UNPICKEDUP: 'default',
  PICKEDUP: 'info',
  ARRIVED: 'warning',
  DEVANNING: 'info',
  DEVANNED: 'success',
  EXCEPTION: 'error',
  CANCELLED: 'default',
  NOT_STARTED: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success'
};

const PRIORITY_TAG: Record<string, 'error' | 'warning' | 'default'> = {
  A: 'error',
  B: 'warning',
  C: 'default'
};

async function loadDocks() {
  const { data } = await fetchGetYardDockList({ pageNum: 1, pageSize: 50 } as any);
  const rows = (data as any)?.rows || [];
  const devanningDocks = rows.filter((d: any) => d.dockType === 'DEVANNING' || d.dockCode?.includes('DOC'));
  yardDockDefs.value = devanningDocks.map((d: any) => ({
    dockCode: d.dockCode,
    dockName: d.dockName || d.dockCode
  }));
  dockOptions.value = devanningDocks.map((d: any) => ({
    label: `${d.dockName} (${d.dockCode})`,
    value: String(d.id)
  }));
  if (!dockOptions.value.length) {
    yardDockDefs.value = [
      { dockCode: 'DOC-LA-001', dockName: 'LA 拆柜口 1' },
      { dockCode: 'DOC-LA-002', dockName: 'LA 拆柜口 2' }
    ];
    dockOptions.value = [
      { label: 'LA 拆柜口 1 (DOC-LA-001)', value: '3010001' },
      { label: 'LA 拆柜口 2 (DOC-LA-002)', value: '3010002' }
    ];
  }
}

async function loadTasks() {
  loading.value = true;
  const { data } = await fetchGetDevanningWorkTasks({
    containerNo: keyword.value || undefined
  });
  loading.value = false;
  rawTasks.value = (data as any)?.rows || [];
}

function handleSearch() {
  loadTasks();
}

function handleReset() {
  resetView();
  loadTasks();
}

function applyFilterDrawer() {
  filterDrawerVisible.value = false;
}

function enterWork(row: Api.Wms.DevanningWorkTask) {
  selectedId.value = row.id;
  router.push({
    name: 'wms_devanning-work-exec',
    query: buildDevanningExecQuery(row)
  });
}

function enterSelected() {
  const row = tasks.value.find(t => t.id === selectedId.value) || tasks.value[0];
  if (!row) {
    window.$message?.warning('请先选择一条拆柜任务');
    return;
  }
  enterWork(row);
}

function handleRowAction(key: string, row: Api.Wms.DevanningWorkTask) {
  if (key === 'enter') enterWork(row);
  if (key === 'detail') openOrderDetail(row);
  if (key === 'dock') openDockModal(row);
  if (key === 'extra-fee') openExtraFeeModal(row);
  if (key === 'pallet') {
    enterWork(row);
    window.$message?.info('进入拆柜操作后可查看卡板记录');
  }
}

function handleKanbanSelect(row: Api.Wms.DevanningWorkTask) {
  selectedId.value = row.id;
}

function handleKanbanAction(key: string, row: Api.Wms.DevanningWorkTask) {
  handleRowAction(key, row);
}

function protoAction(label: string) {
  window.$message?.info(`[原型] ${label}`);
}

function startSelectedWork() {
  enterSelected();
}

function openOrderDetail(row: Api.Wms.DevanningWorkTask, e?: Event) {
  e?.stopPropagation();
  detailOrderId.value = row.id;
  detailVisible.value = true;
}

function openDockModal(row: Api.Wms.DevanningWorkTask, e?: Event) {
  e?.stopPropagation();
  dockEditTaskId.value = row.id;
  dockEditValue.value = String(row.dockId || '3010001');
  dockModalVisible.value = true;
}

async function confirmDockChange() {
  if (!dockEditTaskId.value) return false;
  dockSaving.value = true;
  const { data, error } = await fetchUpdateDevanningWorkDock(dockEditTaskId.value, dockEditValue.value);
  dockSaving.value = false;
  if (error || !data) return false;
  window.$message?.success('DOCK 已调整');
  await loadTasks();
  return true;
}

function openDateModal(row: Api.Wms.DevanningWorkTask, e?: Event) {
  e?.stopPropagation();
  if (row.devanningStatus === 'CANCELLED' || row.devanningStatus === 'DEVANNED') {
    window.$message?.warning('已完成或已取消的柜号不可调整拆柜日期');
    return;
  }
  dateEditTaskId.value = row.id;
  dateEditValue.value = row.devanningDate ? new Date(`${row.devanningDate}T08:00:00`).getTime() : Date.now();
  dateModalVisible.value = true;
}

async function confirmDateChange() {
  if (!dateEditTaskId.value || dateEditValue.value == null) return false;
  const d = new Date(dateEditValue.value);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dateSaving.value = true;
  const { data, error } = await fetchUpdateDevanningWorkDate(dateEditTaskId.value, dateStr);
  dateSaving.value = false;
  if (error || !data) return false;
  window.$message?.success(data.isTodayDevanning ? '拆柜日期已更新，已同步至拆柜调度' : '拆柜日期已更新');
  await loadTasks();
  return true;
}

function openExtraFeeModal(row: Api.Wms.DevanningWorkTask, e?: Event) {
  e?.stopPropagation();
  extraFeeEditTaskId.value = row.id;
  extraFeeEditRemark.value = row.extraOperationFeeRemark || '';
  extraFeeEditAmount.value = row.extraOperationFee > 0 ? row.extraOperationFee : null;
  extraFeeModalVisible.value = true;
}

async function confirmExtraFeeChange() {
  if (!extraFeeEditTaskId.value) return false;
  const remark = extraFeeEditRemark.value.trim();
  if (!remark) {
    window.$message?.warning('请填写原因备注');
    return false;
  }
  if (extraFeeEditAmount.value == null || extraFeeEditAmount.value < 0) {
    window.$message?.warning('请填写有效的费用金额');
    return false;
  }
  extraFeeSaving.value = true;
  const { data, error } = await fetchUpdateDevanningWorkExtraFee(extraFeeEditTaskId.value, {
    amount: extraFeeEditAmount.value,
    remark
  });
  extraFeeSaving.value = false;
  if (error || !data) return false;
  window.$message?.success('额外操作费已保存');
  await loadTasks();
  return true;
}

function formatMoney(val: number | null | undefined) {
  if (val == null) return '—';
  return `$${val}`;
}

function formatDateTime(val?: string | null) {
  if (!val) return '—';
  return String(val).replace('T', ' ').slice(0, 16);
}

function buildColumns(): DataTableColumns<Api.Wms.DevanningWorkTask> {
  return [
    {
      key: 'containerNo',
      title: '柜号',
      width: 132,
      fixed: 'left',
      render: row => (
        <NSpace size={4} align="center" wrap={false}>
          <span
            class="cursor-pointer text-primary hover:underline"
            onClick={(e: MouseEvent) => openOrderDetail(row, e)}
          >
            {row.containerNo}
          </span>
          {row.isTodayDevanning ? (
            <NTag size="small" type="success" bordered={false}>
              今日拆柜
            </NTag>
          ) : null}
        </NSpace>
      )
    },
    {
      key: 'expectedArrivalTime',
      title: '预计到仓时间',
      width: 158,
      render: row => formatDateTime(row.expectedArrivalTime)
    },
    {
      key: 'plannedDevanningTime',
      title: '预计拆柜时间',
      width: 158,
      render: row => formatDateTime(row.plannedDevanningTime)
    },
    {
      key: 'devanningDate',
      title: '拆柜日期',
      width: 130,
      render: row => (
        <NButton
          size="tiny"
          quaternary
          type={row.isTodayDevanning ? 'success' : 'primary'}
          disabled={row.devanningStatus === 'CANCELLED' || row.devanningStatus === 'DEVANNED'}
          onClick={(e: MouseEvent) => openDateModal(row, e)}
        >
          {row.devanningDate || '待排期'}
        </NButton>
      )
    },
    {
      key: 'devanningPriority',
      title: '拆柜优先级',
      width: 96,
      align: 'center',
      render: row => (
        <NTag size="small" type={PRIORITY_TAG[row.devanningPriorityLevel] || 'default'}>
          {row.devanningPriority}
        </NTag>
      )
    },
    {
      key: 'isaCbmLabel',
      title: 'ISA/CBM',
      width: 128,
      render: row => row.isaCbmLabel || `${row.isaTripQty}车 / ${row.totalCbm} CBM`
    },
    {
      key: 'devanningStatus',
      title: '拆柜状态',
      width: 96,
      render: row => (
        <NTag size="small" type={STATUS_TAG[row.devanningStatus] || 'default'}>
          {row.devanningStatusLabel}
        </NTag>
      )
    },
    {
      key: 'dockCode',
      title: 'DOCK',
      width: 124,
      render: row => (
        <NButton
          size="tiny"
          quaternary
          type="primary"
          onClick={(e: MouseEvent) => openDockModal(row, e)}
        >
          {row.dockCode || '待分配'}
        </NButton>
      )
    },
    {
      key: 'progressPercent',
      title: '进度',
      width: 156,
      render: row => {
        const percent = taskProgress(row);
        return (
          <div class="flex items-center gap-8px">
            <NProgress
              type="line"
              percentage={percent}
              show-indicator={false}
              status={percent >= 100 ? 'success' : 'default'}
              style={{ flex: 1, minWidth: '68px' }}
            />
            <span class="text-12px text-#6b7280 whitespace-nowrap">{percent}%</span>
          </div>
        );
      }
    },
    {
      key: 'totalPalletQty',
      title: '拆柜总板数',
      width: 96,
      align: 'center',
      render: row => row.totalPalletQty ?? '—'
    },
    {
      key: 'devanningGroups',
      title: '拆柜组别',
      width: 148,
      ellipsis: { tooltip: true },
      render: row => row.devanningGroups || '—'
    },
    {
      key: 'totalBoxQty',
      title: '总箱数',
      width: 80,
      align: 'center'
    },
    {
      key: 'devanningSupplier',
      title: '拆柜供应商',
      width: 148,
      ellipsis: { tooltip: true },
      render: row => row.devanningSupplier || '—'
    },
    {
      key: 'devanningFee',
      title: '拆柜费用',
      width: 92,
      align: 'right',
      render: row => formatMoney(row.devanningFee)
    },
    {
      key: 'extraOperationFee',
      title: '额外操作费',
      width: 108,
      align: 'right',
      render: row => (
        <NButton
          size="tiny"
          quaternary
          type={row.extraOperationFee > 0 ? 'primary' : 'default'}
          onClick={(e: MouseEvent) => openExtraFeeModal(row, e)}
        >
          {row.extraOperationFee > 0 ? formatMoney(row.extraOperationFee) : '填写'}
        </NButton>
      )
    },
    {
      key: 'extraOperationFeeRemark',
      title: '额外操作费原因备注',
      width: 180,
      ellipsis: { tooltip: true },
      render: row => row.extraOperationFeeRemark || '—'
    },
    {
      key: 'devanningStartTime',
      title: '开始拆柜时间',
      width: 158,
      render: row => row.devanningStartTime || '—'
    },
    {
      key: 'devanningFinishTime',
      title: '拆柜完成时间',
      width: 158,
      render: row => row.devanningFinishTime || '—'
    },
    {
      key: 'operate',
      title: '操作',
      width: 88,
      fixed: 'right',
      render: row => (
        <NDropdown
          trigger="click"
          options={[
            { label: '进入拆柜操作', key: 'enter' },
            { label: '查看订单详情', key: 'detail' },
            { label: '卡板记录', key: 'pallet' }
          ]}
          onSelect={(key: string) => handleRowAction(key, row)}
        >
          <NButton size="small" secondary onClick={(e: MouseEvent) => e.stopPropagation()}>
            更多
          </NButton>
        </NDropdown>
      )
    }
  ];
}

const columns = buildColumns();

onMounted(async () => {
  await loadDocks();
  await loadTasks();
});

watch(
  taskGroups,
  groups => {
    expandedGroups.value = groups.map(g => g.key);
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px p-16px">
    <NCard :bordered="false" size="small">
      <div class="mb-12px flex flex-wrap items-start justify-between gap-12px">
        <div>
          <h2 class="text-18px font-600 m-0">人工拆柜作业</h2>
          <p class="mt-4px text-13px text-#6b7280">展示全部状态柜号，支持列表 / 看板视图，可调整拆柜日期以同步拆柜调度</p>
        </div>
        <NButtonGroup size="small">
          <NButton
            v-for="opt in DEVANNING_WORK_VIEW_OPTIONS"
            :key="opt.value"
            :type="viewMode === opt.value ? 'primary' : 'default'"
            @click="viewMode = opt.value"
          >
            {{ opt.label }}
          </NButton>
        </NButtonGroup>
      </div>

      <!-- 搜索 / 筛选 / 分组 / 排列 -->
      <div class="flex flex-wrap items-center justify-between gap-12px border-t border-#f0f0f0 pt-12px">
        <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false" class="flex-1 min-w-0">
          <NFormItem label="搜索">
            <NInput
              v-model:value="keyword"
              clearable
              placeholder="柜号 / 拆柜单号 / 客户 / 供应商"
              class="w-280px"
              @keydown.enter="handleSearch"
            />
          </NFormItem>
          <NFormItem>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton class="ml-8px" @click="handleReset">重置</NButton>
          </NFormItem>
        </NForm></NCollapseItem></NCollapse>

        <NSpace :size="8" align="center" class="flex-shrink-0">
          <NBadge :value="activeFilterCount" :max="9" :show="activeFilterCount > 0">
            <NButton secondary size="small" @click="filterDrawerVisible = true">
              <template #icon><div class="i-mdi:filter-outline text-16px" /></template>
              筛选
            </NButton>
          </NBadge>

          <NPopover v-if="viewMode === 'list'" trigger="click" placement="bottom-end" :width="280">
            <template #trigger>
              <NButton secondary size="small">
                <template #icon><div class="i-mdi:group text-16px" /></template>
                分组
              </NButton>
            </template>
            <div class="py-4px">
              <div class="text-13px font-600 mb-4px text-#374151">分组方式</div>
              <p class="mb-8px text-12px text-#9ca3af">可多选，按下方顺序组合分组</p>
              <NCheckboxGroup v-model:value="groupBy" class="flex flex-col gap-8px">
                <NCheckbox v-for="opt in GROUP_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </NCheckbox>
              </NCheckboxGroup>
            </div>
          </NPopover>

          <NPopover trigger="click" placement="bottom-end" :width="260">
            <template #trigger>
              <NButton secondary size="small">
                <template #icon><div class="i-mdi:sort text-16px" /></template>
                排列
              </NButton>
            </template>
            <div class="py-4px">
              <div class="text-13px font-600 mb-8px text-#374151">排序字段</div>
              <NSelect v-model:value="sortBy" :options="SORT_OPTIONS" size="small" class="mb-12px" />
              <div class="text-13px font-600 mb-8px text-#374151">排序方向</div>
              <NRadioGroup v-model:value="sortOrder">
                <NSpace>
                  <NRadio value="asc">升序</NRadio>
                  <NRadio value="desc">降序</NRadio>
                </NSpace>
              </NRadioGroup>
            </div>
          </NPopover>
        </NSpace>
      </div>

      <div class="mt-10px flex flex-wrap gap-8px text-12px text-#6b7280">
        <NTag v-if="activeFilterCount" size="small" :bordered="false" type="info">已筛选 {{ activeFilterCount }} 项</NTag>
        <NTag v-if="viewMode === 'list'" size="small" :bordered="false">分组：{{ groupByLabel }}</NTag>
        <NTag v-else size="small" :bordered="false" type="info">看板按拆柜状态分列</NTag>
        <NTag size="small" :bordered="false">排列：{{ sortLabel }}</NTag>
        <NTag v-if="todayDispatchCount" size="small" :bordered="false" type="success">今日调度 {{ todayDispatchCount }} 柜</NTag>
        <span class="text-#9ca3af">共 {{ tasks.length }} 条</span>
      </div>

      <div class="mt-12px flex flex-wrap gap-8px border-t border-#f0f0f0 pt-12px">
        <NButton
          v-for="tab in STATUS_TABS"
          :key="tab.value"
          size="small"
          :type="activeStatusTab === tab.value ? 'primary' : 'default'"
          :secondary="activeStatusTab !== tab.value"
          @click="activeStatusTab = tab.value"
        >
          {{ tab.label }}（{{ statusCounts[tab.value] ?? 0 }}）
        </NButton>
      </div>
    </NCard>

    <NCard :bordered="false" size="small" class="sm:flex-1-hidden">
      <template #header-extra>
        <div class="flex flex-wrap gap-8px">
          <NButton secondary type="info" size="small" @click="protoAction('蓝牙连接')">蓝牙连接</NButton>
          <NButton secondary type="success" size="small" @click="protoAction('卡板记录')">卡板记录</NButton>
          <NButton type="success" ghost size="small" @click="startSelectedWork">开始拆柜</NButton>
          <NButton type="primary" size="small" @click="enterSelected">进入拆柜</NButton>
        </div>
      </template>

      <template v-if="viewMode === 'list'">
        <template v-if="!hasGrouping">
          <NDataTable
            :columns="columns"
            :data="tasks"
            :loading="loading"
            :row-key="row => row.id"
            size="small"
            :scroll-x="2500"
            :row-props="row => ({ onClick: () => { selectedId = row.id; } })"
            @row-dblclick="enterWork"
          />
        </template>

        <NCollapse v-else v-model:expanded-names="expandedGroups" class="devanning-group-collapse">
          <NCollapseItem
            v-for="group in taskGroups"
            :key="group.key"
            :name="group.key"
            :title="`${group.label}（${group.rows.length}）`"
          >
            <NEmpty v-if="!group.rows.length" description="该 DOCK 暂无任务" class="py-16px" />
            <NDataTable
              v-else
              :columns="columns"
              :data="group.rows"
              :loading="loading"
              :row-key="row => row.id"
              size="small"
              :scroll-x="2500"
              :row-props="row => ({ onClick: () => { selectedId = row.id; } })"
              @row-dblclick="enterWork"
            />
          </NCollapseItem>
        </NCollapse>
      </template>

      <DevanningWorkKanbanView
        v-else
        :tasks="tasks"
        :selected-id="selectedId"
        :task-progress="taskProgress"
        @select="handleKanbanSelect"
        @enter="enterWork"
        @detail="openOrderDetail"
        @date="openDateModal"
        @dock="openDockModal"
        @extra-fee="openExtraFeeModal"
        @action="handleKanbanAction"
      />

      <p class="mt-8px text-12px text-#9ca3af">
        <template v-if="viewMode === 'list'">
          单击柜号查看详情 · 点击拆柜日期可调整并同步调度 · 点击额外操作费可填写备注与金额 · 操作「更多」进入拆柜 · 双击行进入拆柜操作
        </template>
        <template v-else>
          看板按拆柜状态分列展示 · 单击卡片选中 · 双击或点击「进入拆柜」进入作业 · 柜号点击查看订单详情
        </template>
      </p>
    </NCard>

    <NDrawer v-model:show="filterDrawerVisible" :width="360" placement="right">
      <NDrawerContent title="筛选条件" closable>
        <NForm label-placement="left" label-width="96">
          <NFormItem label="拆柜状态">
            <NSelect
              v-model:value="filters.devanningStatus"
              :options="DEVANNING_STATUS_FILTER_OPTIONS"
              clearable
              placeholder="全部"
            />
          </NFormItem>
          <NFormItem label="拆柜日期">
            <NDatePicker
              v-model:formatted-value="filters.devanningDate"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="w-full"
              placeholder="选择日期"
            />
          </NFormItem>
          <NFormItem label="拆柜优先级">
            <NSelect
              v-model:value="filters.devanningPriorityLevel"
              :options="filterOptions.priorityOptions"
              clearable
              placeholder="全部"
            />
          </NFormItem>
          <NFormItem label="拆柜供应商">
            <NSelect
              v-model:value="filters.devanningSupplier"
              :options="filterOptions.supplierOptions"
              clearable
              filterable
              placeholder="全部"
            />
          </NFormItem>
          <NFormItem label="拆柜组别">
            <NSelect
              v-model:value="filters.devanningGroups"
              :options="filterOptions.groupOptions"
              clearable
              filterable
              placeholder="全部"
            />
          </NFormItem>
          <NFormItem label="DOCK">
            <NSelect
              v-model:value="filters.dockCode"
              :options="filterOptions.dockOptions"
              clearable
              filterable
              placeholder="全部 DOCK"
            />
          </NFormItem>
        </NForm>
        <div class="mt-24px flex gap-8px">
          <NButton @click="resetFilters">清空筛选</NButton>
          <NButton type="primary" @click="applyFilterDrawer">应用</NButton>
        </div>
      </NDrawerContent>
    </NDrawer>

    <DevanningOrderDetailDrawer v-model:visible="detailVisible" :order-id="detailOrderId" />

    <NModal
      v-model:show="dateModalVisible"
      preset="dialog"
      title="调整拆柜日期"
      positive-text="保存"
      negative-text="取消"
      :positive-button-props="{ loading: dateSaving }"
      @positive-click="confirmDateChange"
    >
      <p class="mb-12px text-13px text-#6b7280">
        调整为当日后，拆柜调度页将自动识别该柜并纳入排队安排。
      </p>
      <NForm label-placement="left" label-width="72" class="pt-8px">
        <NFormItem label="拆柜日期">
          <NDatePicker v-model:value="dateEditValue" type="date" class="w-full" />
        </NFormItem>
      </NForm>
    </NModal>

    <NModal
      v-model:show="dockModalVisible"
      preset="dialog"
      title="调整 DOCK"
      positive-text="保存"
      negative-text="取消"
      :positive-button-props="{ loading: dockSaving }"
      @positive-click="confirmDockChange"
    >
      <NForm label-placement="left" label-width="72" class="pt-8px">
        <NFormItem label="拆柜口">
          <NSelect v-model:value="dockEditValue" :options="dockOptions" class="w-full" />
        </NFormItem>
      </NForm>
    </NModal>

    <NModal
      v-model:show="extraFeeModalVisible"
      preset="dialog"
      title="额外操作费"
      positive-text="确认"
      negative-text="取消"
      :positive-button-props="{ loading: extraFeeSaving }"
      @positive-click="confirmExtraFeeChange"
    >
      <p class="mb-12px text-13px text-#6b7280">填写产生额外操作的原因备注及费用金额，确认后保存至拆柜任务。</p>
      <NForm label-placement="left" label-width="80" class="pt-8px">
        <NFormItem label="原因备注" required>
          <NInput
            v-model:value="extraFeeEditRemark"
            type="textarea"
            :rows="3"
            placeholder="如：超重货物人工搬运、夜间加班费等"
            maxlength="200"
            show-count
          />
        </NFormItem>
        <NFormItem label="费用金额" required>
          <NInputNumber
            v-model:value="extraFeeEditAmount"
            class="w-full"
            :min="0"
            :precision="2"
            placeholder="0.00"
          >
            <template #prefix>$</template>
          </NInputNumber>
        </NFormItem>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped>
.devanning-group-collapse :deep(.n-collapse-item__header) {
  font-weight: 600;
}
</style>
