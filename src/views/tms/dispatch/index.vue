<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NCollapse, NCollapseItem, NDataTable, NGi, NGrid, NSpace, NTag, NTimeline, NTimelineItem } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  fetchAutoDispatch,
  fetchConfirmDispatch,
  fetchDispatchManualCreate,
  fetchDispatchMerge,
  fetchDispatchPushDriver,
  fetchDispatchPushWms,
  fetchDispatchSplit,
  fetchGetDispatchLogs,
  fetchGetDispatchPlans,
  fetchGetDispatchPool
} from '@/service/api/tms';
import TripDeadlineRiskTag from '@/components/tms/TripDeadlineRiskTag.vue';
import { renderDeadlinePriorityTag } from '@/views/tms/composables/use-trip-deadline-columns';
import { DISPATCH_STATUS_META, PLAN_STATUS_META } from './constants';
import DispatchAssignModal from './modules/dispatch-assign-modal.vue';
import DispatchTripDetailDrawer from './modules/dispatch-trip-detail-drawer.vue';

defineOptions({ name: 'TmsDispatch' });

const poolLoading = ref(false);
const planLoading = ref(false);
const logLoading = ref(false);
const poolRows = ref<Api.Tms.DispatchPoolOrder[]>([]);
const plans = ref<Api.Tms.DispatchPlan[]>([]);
const logs = ref<Api.Tms.DispatchLog[]>([]);
const autoLoading = ref(false);
const actionLoading = ref(false);

const checkedPoolKeys = ref<number[]>([]);
const checkedPlanKeys = ref<number[]>([]);
const selectedPlanId = ref<number | null>(null);

const detailVisible = ref(false);
const detailPlanId = ref<number | null>(null);
const detailOrderId = ref<number | null>(null);

const assignVisible = ref(false);
const assignType = ref<'dock' | 'driver' | 'vehicle' | 'supplier' | null>(null);

const activePlan = computed(() => {
  const id = selectedPlanId.value ?? checkedPlanKeys.value[0] ?? null;
  return id ? plans.value.find(p => p.id === id) ?? null : null;
});

const overduePool = computed(() =>
  poolRows.value.filter(r => r.deadlineRiskLevel === 'OVERDUE' || r.deadlineRiskLevel === 'URGENT')
);

function renderStatus(status: string) {
  const meta = DISPATCH_STATUS_META[status as keyof typeof DISPATCH_STATUS_META]
    ?? PLAN_STATUS_META[status]
    ?? { label: status, type: 'default' as const };
  return <NTag size="small" type={meta.type}>{meta.label}</NTag>;
}

const poolColumns: DataTableColumns<Api.Tms.DispatchPoolOrder> = [
  { type: 'selection' },
  { key: 'orderNo', title: '订单号', width: 130, fixed: 'left' },
  { key: 'customerName', title: '客户', width: 120, ellipsis: { tooltip: true } },
  { key: 'platform', title: '平台', width: 88 },
  { key: 'destination', title: '目的地', width: 100, ellipsis: { tooltip: true } },
  { key: 'appointmentTime', title: '预约时间', width: 148 },
  { key: 'palletQty', title: '板数', width: 64, align: 'center' },
  { key: 'cartonQty', title: '箱数', width: 64, align: 'center' },
  {
    key: 'distanceMiles',
    title: '距离',
    width: 72,
    align: 'center',
    render: row => (row.distanceMiles != null ? `${row.distanceMiles}mi` : '—')
  },
  {
    key: 'estimatedTravelMinutes',
    title: '预计行驶',
    width: 88,
    align: 'center',
    render: row => (row.estimatedTravelMinutes ? `${row.estimatedTravelMinutes}分` : '—')
  },
  { key: 'latestFinishTime', title: '最晚完成时间', width: 158 },
  {
    key: 'dispatchPriorityScore',
    title: '时效优先级',
    width: 100,
    align: 'center',
    render: row => renderDeadlinePriorityTag(row.dispatchPriorityScore)
  },
  {
    key: 'status',
    title: '状态',
    width: 120,
    render: row => renderStatus(row.status)
  },
  {
    key: 'flags',
    title: '标记',
    width: 88,
    render: row => (
      <NSpace size={4}>
        {row.holdFlag ? <NTag type="warning" size="tiny">暂扣</NTag> : null}
        {row.exceptionFlag ? <NTag type="error" size="tiny">异常</NTag> : null}
        {!row.cargoReady ? <NTag size="tiny">未备齐</NTag> : null}
      </NSpace>
    )
  },
  {
    key: 'action',
    title: '操作',
    width: 72,
    fixed: 'right',
    render: row => (
      <NButton size="tiny" quaternary type="primary" onClick={() => openDetail({ orderId: row.id })}>
        详情
      </NButton>
    )
  }
];

const planColumns: DataTableColumns<Api.Tms.DispatchPlan> = [
  { type: 'selection', multiple: false },
  { key: 'planNo', title: '方案号', width: 140, fixed: 'left' },
  { key: 'destination', title: '目的地', width: 100 },
  { key: 'route', title: '路线', width: 160, ellipsis: { tooltip: true } },
  { key: 'orderCount', title: '订单数', width: 72, align: 'center' },
  { key: 'palletQty', title: '板数', width: 64, align: 'center' },
  { key: 'cartonQty', title: '箱数', width: 64, align: 'center' },
  { key: 'vehicleType', title: '推荐车型', width: 96 },
  { key: 'dockNo', title: '推荐DOCK', width: 96 },
  { key: 'carrierName', title: '推荐供应商', width: 120, ellipsis: { tooltip: true } },
  { key: 'appointmentTime', title: '预约时间', width: 148 },
  { key: 'latestFinishTime', title: '最晚完成时间', width: 158 },
  {
    key: 'estimatedCost',
    title: '预计成本',
    width: 88,
    render: row => `$${row.estimatedCost}`
  },
  {
    key: 'loadRate',
    title: '满载率',
    width: 80,
    align: 'center',
    render: row => `${row.loadRate}%`
  },
  {
    key: 'onTimeRisk',
    title: '准时率风险',
    width: 100,
    render: row => <TripDeadlineRiskTag level={row.onTimeRisk} size="small" />
  },
  {
    key: 'score',
    title: '推荐评分',
    width: 88,
    align: 'center',
    render: row => <NTag type="success" size="small">{row.score}</NTag>
  },
  {
    key: 'status',
    title: '状态',
    width: 110,
    render: row => renderStatus(row.status)
  },
  {
    key: 'action',
    title: '操作',
    width: 160,
    fixed: 'right',
    render: row => (
      <NSpace size="small">
        <NButton size="tiny" quaternary type="primary" onClick={() => openDetail({ planId: row.id })}>
          详情
        </NButton>
        <NButton
          size="tiny"
          type="primary"
          disabled={row.confirmed}
          onClick={() => confirmPlan(row.id)}
        >
          确认
        </NButton>
      </NSpace>
    )
  }
];

function openDetail(payload: { planId?: number; orderId?: number }) {
  detailPlanId.value = payload.planId ?? null;
  detailOrderId.value = payload.orderId ?? null;
  detailVisible.value = true;
}

function onPlanRowClick(row: Api.Tms.DispatchPlan) {
  selectedPlanId.value = row.id;
  checkedPlanKeys.value = [row.id];
}

async function refreshAll() {
  await Promise.all([loadPool(), loadPlans(), loadLogs()]);
}

async function loadPool() {
  poolLoading.value = true;
  try {
    const { data } = await fetchGetDispatchPool({ pageNum: 1, pageSize: 100 });
    poolRows.value = data?.rows ?? [];
  } finally {
    poolLoading.value = false;
  }
}

async function loadPlans() {
  planLoading.value = true;
  try {
    const { data } = await fetchGetDispatchPlans();
    plans.value = data ?? [];
  } finally {
    planLoading.value = false;
  }
}

async function loadLogs() {
  logLoading.value = true;
  try {
    const { data } = await fetchGetDispatchLogs();
    logs.value = data ?? [];
  } finally {
    logLoading.value = false;
  }
}

function requirePlan(): number | null {
  const id = activePlan.value?.id ?? null;
  if (!id) window.$message?.warning('请先在右侧选择调度方案');
  return id;
}

async function handleAutoDispatch() {
  autoLoading.value = true;
  try {
    const { data } = await fetchAutoDispatch();
    if (data?.success === false) {
      window.$message?.warning(data.message);
      return;
    }
    window.$message?.success(data?.message ?? '自动排车完成');
    await refreshAll();
  } finally {
    autoLoading.value = false;
  }
}

async function confirmPlan(id: number) {
  const { data, error } = await fetchConfirmDispatch(id);
  if (error) return;
  window.$message?.success(data?.message ?? '调度已确认');
  await refreshAll();
}

async function handleManualCreate() {
  if (!checkedPoolKeys.value.length) {
    window.$message?.warning('请在左侧选择待排车订单');
    return;
  }
  actionLoading.value = true;
  try {
    const { data, error } = await fetchDispatchManualCreate(checkedPoolKeys.value);
    if (error) return;
    window.$message?.success(data?.message ?? '已创建车次');
    checkedPoolKeys.value = [];
    await refreshAll();
  } finally {
    actionLoading.value = false;
  }
}

async function handleMerge() {
  const planId = requirePlan();
  if (!planId) return;
  if (!checkedPoolKeys.value.length) {
    window.$message?.warning('请选择要并入的订单');
    return;
  }
  actionLoading.value = true;
  try {
    const { data, error } = await fetchDispatchMerge(planId, checkedPoolKeys.value);
    if (error) return;
    window.$message?.success(data?.message ?? '已合并');
    await refreshAll();
  } finally {
    actionLoading.value = false;
  }
}

async function handleSplit() {
  const planId = requirePlan();
  if (!planId) return;
  if (!checkedPoolKeys.value.length) {
    window.$message?.warning('请选择要从方案中拆出的订单');
    return;
  }
  actionLoading.value = true;
  try {
    const { data, error } = await fetchDispatchSplit(planId, checkedPoolKeys.value);
    if (error) return;
    window.$message?.success(data?.message ?? '已拆分');
    await refreshAll();
  } finally {
    actionLoading.value = false;
  }
}

function openAssign(type: 'dock' | 'driver' | 'vehicle' | 'supplier') {
  if (!requirePlan()) return;
  assignType.value = type;
  assignVisible.value = true;
}

async function handlePushWms() {
  const planId = requirePlan();
  if (!planId) return;
  actionLoading.value = true;
  try {
    const { data, error } = await fetchDispatchPushWms(planId);
    if (error) return;
    if (data?.success === false) {
      window.$message?.warning(data.message);
      return;
    }
    window.$message?.success(data?.message ?? '已推送 WMS');
    await refreshAll();
  } finally {
    actionLoading.value = false;
  }
}

async function handlePushDriver() {
  const planId = requirePlan();
  if (!planId) return;
  actionLoading.value = true;
  try {
    const { data, error } = await fetchDispatchPushDriver(planId);
    if (error) return;
    if (data?.success === false) {
      window.$message?.warning(data.message);
      return;
    }
    window.$message?.success(data?.message ?? '已推送司机');
    await refreshAll();
  } finally {
    actionLoading.value = false;
  }
}

const logLevelType: Record<string, NaiveUI.ThemeColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error'
};

onMounted(() => refreshAll());
</script>

<template>
  <div class="h-full flex flex-col gap-10px overflow-hidden">
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="flex items-center justify-between flex-wrap gap-8px mb-10px">
        <div>
          <span class="text-16px font-semibold">调度工作台</span>
          <span class="text-13px text-gray-500 ml-8px">OMS 待排车 · 自动排车 · 人工确认 · 推送 WMS/司机</span>
        </div>
        <NSpace>
          <NButton :loading="autoLoading" type="primary" @click="handleAutoDispatch">自动排车</NButton>
          <NButton @click="refreshAll">刷新</NButton>
        </NSpace>
      </div>

      <div v-if="overduePool.length" class="mb-10px text-13px text-red-600">
        紧急/超时订单 {{ overduePool.length }} 单，请优先排车
      </div>

      <div class="flex flex-wrap gap-6px">
        <NButton size="small" :loading="actionLoading" @click="handleManualCreate">手动建车次</NButton>
        <NButton size="small" :loading="actionLoading" @click="handleMerge">合并车次</NButton>
        <NButton size="small" :loading="actionLoading" @click="handleSplit">拆分车次</NButton>
        <NButton size="small" @click="openAssign('dock')">分配DOCK</NButton>
        <NButton size="small" @click="openAssign('driver')">分配司机</NButton>
        <NButton size="small" @click="openAssign('vehicle')">分配车辆</NButton>
        <NButton size="small" @click="openAssign('supplier')">分配供应商</NButton>
        <NButton size="small" type="info" :loading="actionLoading" @click="handlePushWms">推送WMS</NButton>
        <NButton size="small" type="info" :loading="actionLoading" @click="handlePushDriver">推送司机</NButton>
      </div>
      <div v-if="activePlan" class="mt-8px text-12px text-gray-500">
        当前方案：{{ activePlan.planNo }} · {{ activePlan.destination }} · {{ activePlan.orderCount }} 单 ·
        {{ activePlan.palletQty }} 板
      </div>
    </NCard>

    <NGrid :cols="2" :x-gap="10" class="flex-1 min-h-0 overflow-hidden" item-responsive responsive="screen">
      <NGi span="2 l:1" class="h-full min-h-0 flex flex-col">
        <NCard
          title="待排车订单池"
          size="small"
          :bordered="false"
          class="card-wrapper flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <NDataTable
            v-model:checked-row-keys="checkedPoolKeys"
            :columns="poolColumns"
            :data="poolRows"
            :loading="poolLoading"
            :row-key="(r: Api.Tms.DispatchPoolOrder) => r.id"
            size="small"
            :scroll-x="1680"
            flex-height
            class="flex-1"
            :row-props="(row: Api.Tms.DispatchPoolOrder) => ({
              style: 'cursor: pointer',
              onClick: () => openDetail({ orderId: row.id })
            })"
          />
        </NCard>
      </NGi>
      <NGi span="2 l:1" class="h-full min-h-0 flex flex-col">
        <NCard
          title="推荐调度方案"
          size="small"
          :bordered="false"
          class="card-wrapper flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <NDataTable
            v-model:checked-row-keys="checkedPlanKeys"
            :columns="planColumns"
            :data="plans"
            :loading="planLoading"
            :row-key="(r: Api.Tms.DispatchPlan) => r.id"
            size="small"
            :scroll-x="1900"
            flex-height
            class="flex-1"
            :row-props="(row: Api.Tms.DispatchPlan) => ({
              style: 'cursor: pointer',
              onClick: () => onPlanRowClick(row)
            })"
            @update:checked-row-keys="(keys: Array<string | number>) => {
              selectedPlanId = keys.length ? Number(keys[0]) : null;
            }"
          />
        </NCard>
      </NGi>
    </NGrid>

    <NCollapse class="flex-shrink-0">
      <NCollapseItem title="调度日志" name="logs">
        <NSpin :show="logLoading">
          <NTimeline v-if="logs.length" class="max-h-160px overflow-y-auto px-4px">
            <NTimelineItem v-for="log in logs" :key="log.id" :time="log.time" :title="log.action">
              <NTag :type="logLevelType[log.level] ?? 'default'" size="tiny" class="mr-6px">{{ log.target }}</NTag>
              {{ log.operator }} · {{ log.detail }}
            </NTimelineItem>
          </NTimeline>
          <span v-else class="text-gray-400 text-13px">暂无调度日志</span>
        </NSpin>
      </NCollapseItem>
    </NCollapse>

    <DispatchTripDetailDrawer
      v-model:visible="detailVisible"
      :plan-id="detailPlanId"
      :order-id="detailOrderId"
    />
    <DispatchAssignModal
      v-model:visible="assignVisible"
      :plan-id="activePlan?.id ?? null"
      :assign-type="assignType"
      @assigned="refreshAll"
    />
  </div>
</template>
