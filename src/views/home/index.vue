<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NGi,
  NGrid,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import {
  getEnterpriseDashboardData,
  type EnterpriseAbnormalAlert,
  type EnterpriseAiSuggestion,
  type EnterpriseDashboardData,
  type EnterpriseDockStatus,
  type EnterpriseKpiCard
} from '@/mock/data/enterprise-dashboard';
import { useRouterPush } from '@/hooks/common/router';
import {
  AUTO_REFRESH_MS,
  DASHBOARD_PERSPECTIVE_OPTIONS,
  getVisibleKpiKeys,
  isSectionVisible,
  TREND_DAY_OPTIONS,
  type DashboardPerspective
} from './enterprise-dashboard-config';
import TrendChart from './modules/enterprise/trend-chart.vue';
import ZoneBarChart from './modules/enterprise/zone-bar-chart.vue';
import OrderPieChart from './modules/enterprise/order-pie-chart.vue';

defineOptions({ name: 'Home' });

const { routerPushByKey } = useRouterPush();

const loading = ref(false);
const perspective = ref<DashboardPerspective>('manager');
const trendDays = ref(7);
const dashboard = ref<EnterpriseDashboardData | null>(null);
const lastRefreshLabel = ref('');

const dockModalVisible = ref(false);
const selectedDock = ref<EnterpriseDockStatus | null>(null);
const alertDrawerVisible = ref(false);
const selectedAlert = ref<EnterpriseAbnormalAlert | null>(null);
const expandedAiIds = ref<Set<number>>(new Set());

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const visibleKpis = computed(() => {
  const keys = new Set(getVisibleKpiKeys(perspective.value));
  return (dashboard.value?.kpis || []).filter(k => keys.has(k.key));
});

const show = (section: Parameters<typeof isSectionVisible>[1]) =>
  isSectionVisible(perspective.value, section);

const logColumns = [
  { key: 'time', title: '\u65f6\u95f4', width: 90 },
  { key: 'module', title: '\u6a21\u5757', width: 90 },
  { key: 'action', title: '\u64cd\u4f5c\u5185\u5bb9', ellipsis: { tooltip: true } },
  { key: 'operator', title: '\u64cd\u4f5c\u4eba', width: 100 },
  {
    key: 'status',
    title: '\u72b6\u6001',
    width: 72,
    render: (row: { status: string }) => <NTag size="small" type="success">{row.status}</NTag>
  }
];

function formatKpiValue(kpi: EnterpriseKpiCard) {
  if (typeof kpi.value === 'number') return kpi.value.toLocaleString();
  return kpi.value;
}

function trendTagType(kpi: EnterpriseKpiCard) {
  if (kpi.key === 'exception') return kpi.trend > 0 ? 'error' : 'success';
  return kpi.trend >= 0 ? 'success' : 'warning';
}

function trendPrefix(kpi: EnterpriseKpiCard) {
  if (kpi.key === 'exception') return kpi.trend > 0 ? '\u2191' : '\u2193';
  return kpi.trend >= 0 ? '\u2191' : '\u2193';
}

function dockStatusType(status: EnterpriseDockStatus['status']): NaiveUI.ThemeColor {
  const map: Record<EnterpriseDockStatus['status'], NaiveUI.ThemeColor> = {
    loading: 'info',
    checked_in: 'success',
    idle: 'default',
    abnormal: 'error'
  };
  return map[status];
}

function alertSeverityType(severity: EnterpriseAbnormalAlert['severity']): NaiveUI.ThemeColor {
  const map: Record<EnterpriseAbnormalAlert['severity'], NaiveUI.ThemeColor> = {
    severe: 'error',
    high: 'warning',
    medium: 'info'
  };
  return map[severity];
}

function aiCardClass(type: EnterpriseAiSuggestion['type']) {
  return `ai-card ai-card--${type}`;
}

async function loadDashboard(showToast = false) {
  loading.value = true;
  await new Promise(r => setTimeout(r, 280));
  dashboard.value = getEnterpriseDashboardData({ trendDays: trendDays.value });
  lastRefreshLabel.value = dashboard.value.refreshTime || '';
  loading.value = false;
  if (showToast) window.$message?.success('\u770b\u677f\u6570\u636e\u5df2\u5237\u65b0');
}

function handleKpiClick(kpi: EnterpriseKpiCard) {
  if (!kpi.routeKey) return;
  routerPushByKey(kpi.routeKey);
}

function handleTaskClick(routeKey?: App.Global.RouteKey) {
  if (routeKey) routerPushByKey(routeKey);
  else window.$message?.info('[\u539f\u578b] \u8df3\u8f6c\u4efb\u52a1\u5217\u8868');
}

function openDock(dock: EnterpriseDockStatus) {
  selectedDock.value = dock;
  dockModalVisible.value = true;
}

function openAlert(alert: EnterpriseAbnormalAlert) {
  selectedAlert.value = alert;
  alertDrawerVisible.value = true;
}

function toggleAiExpand(item: EnterpriseAiSuggestion) {
  const next = new Set(expandedAiIds.value);
  if (next.has(item.id)) next.delete(item.id);
  else next.add(item.id);
  expandedAiIds.value = next;
}

function handleAlertAction() {
  if (selectedAlert.value?.routeKey) routerPushByKey(selectedAlert.value.routeKey);
  alertDrawerVisible.value = false;
}

function onTrendDaysChange() {
  loadDashboard();
}

function showLogsMore() {
  window.$message?.info('[\u539f\u578b] \u64cd\u4f5c\u65e5\u5fd7\u5217\u8868');
}

function showAiCenter() {
  window.$message?.info('[\u539f\u578b] AI \u5efa\u8bae\u4e2d\u5fc3');
}

onMounted(() => {
  loadDashboard();
  refreshTimer = setInterval(() => loadDashboard(), AUTO_REFRESH_MS);
});

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <div class="enterprise-dashboard min-h-full flex flex-col gap-12px pb-8px">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="page-title">FOREST AI WMS</span>
          <NTag type="info" size="small" :bordered="false">操作数据看板</NTag>
        </div>
        <NSpace align="center" wrap>
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="perspective"
            :options="DASHBOARD_PERSPECTIVE_OPTIONS"
            size="small"
            class="w-220px"
          />
          <span v-if="lastRefreshLabel" class="refresh-label">刷新：{{ lastRefreshLabel }}</span>
          <NButton size="small" :loading="loading" @click="loadDashboard(true)">手动刷新</NButton>
          <NTag size="tiny" :bordered="false" type="default">60s 自动刷新</NTag>
        </NSpace>
      </div>
    </NCard>

    <NSpin :show="loading">
      <template v-if="dashboard">
        <NGrid v-if="show('kpi')" :x-gap="12" :y-gap="12" cols="2 s:3 m:6" responsive="screen" class="mb-12px">
          <NGi v-for="kpi in visibleKpis" :key="kpi.key">
            <div class="kpi-card" @click="handleKpiClick(kpi)">
              <div class="kpi-icon" :style="{ color: kpi.color, background: `${kpi.color}14` }">
                <component :is="`icon-${kpi.icon}`" class="text-22px" />
              </div>
              <div class="kpi-body">
                <div class="kpi-label">{{ kpi.label }}</div>
                <div class="kpi-value">
                  {{ formatKpiValue(kpi) }}
                  <span v-if="kpi.unit" class="kpi-unit">{{ kpi.unit }}</span>
                </div>
                <div class="kpi-trend">
                  <NTag :type="trendTagType(kpi)" size="tiny" :bordered="false">
                    {{ kpi.trendLabel }} {{ trendPrefix(kpi) }} {{ Math.abs(kpi.trend) }}{{ kpi.key === 'exception' ? '' : '%' }}
                  </NTag>
                  <span class="kpi-yesterday">昨日 {{ kpi.yesterday }}</span>
                </div>
              </div>
            </div>
          </NGi>
        </NGrid>

        <NGrid v-if="show('charts')" :x-gap="12" :y-gap="12" cols="1 m:3" responsive="screen" class="mb-12px">
          <NGi>
            <NCard :bordered="false" size="small" class="panel-card">
              <template #header>
                <div class="panel-head">
                  <span>近7天入库/出库趋势</span>
                  <NSelect
                    :to="POPUP_TO_BODY"
                    v-model:value="trendDays"
                    :options="TREND_DAY_OPTIONS"
                    size="tiny"
                    class="w-100px"
                    @update:value="onTrendDaysChange"
                  />
                </div>
              </template>
              <TrendChart :data="dashboard.trend" />
            </NCard>
          </NGi>
          <NGi>
            <NCard :bordered="false" size="small" title="库区利用率" class="panel-card">
              <ZoneBarChart :data="dashboard.zoneUtilization" />
            </NCard>
          </NGi>
          <NGi>
            <NCard :bordered="false" size="small" title="订单结构" class="panel-card">
              <OrderPieChart :data="dashboard.orderStructure" :total="dashboard.orderTotal" />
            </NCard>
          </NGi>
        </NGrid>

        <NGrid :x-gap="12" :y-gap="12" cols="1 m:3" responsive="screen" class="mb-12px">
          <NGi v-if="show('tasks')">
            <NCard :bordered="false" size="small" title="待处理任务" class="panel-card">
              <div
                v-for="task in dashboard.pendingTasks"
                :key="task.key"
                class="task-row"
                @click="handleTaskClick(task.routeKey)"
              >
                <span class="task-label">{{ task.label }}</span>
                <NSpace align="center" :size="8">
                  <span class="task-count">{{ task.count }}</span>
                  <NTag :type="task.delta >= 0 ? 'warning' : 'success'" size="tiny" :bordered="false">
                    {{ task.delta >= 0 ? '+' : '' }}{{ task.delta }}
                  </NTag>
                </NSpace>
              </div>
            </NCard>
          </NGi>
          <NGi v-if="show('alerts')">
            <NCard :bordered="false" size="small" class="panel-card">
              <template #header>
                <div class="panel-head">
                  <span>异常预警</span>
                  <NButton text type="primary" size="tiny" @click="routerPushByKey('wms_trip-exception')">查看更多 &gt;</NButton>
                </div>
              </template>
              <div
                v-for="alert in dashboard.abnormalAlerts"
                :key="alert.id"
                class="alert-row"
                @click="openAlert(alert)"
              >
                <div class="alert-main">
                  <span>{{ alert.title }}</span>
                  <NTag :type="alertSeverityType(alert.severity)" size="tiny">{{ alert.severityLabel }}</NTag>
                </div>
                <div class="alert-meta">
                  <span>{{ alert.count }} 条</span>
                  <span>{{ alert.elapsed }}</span>
                </div>
              </div>
            </NCard>
          </NGi>
          <NGi v-if="show('dock')">
            <NCard :bordered="false" size="small" class="panel-card">
              <template #header>
                <div class="panel-head">
                  <span>司机/DOCK实时状态</span>
                  <NButton text type="primary" size="tiny" @click="routerPushByKey('wms_driver-checkin')">查看更多 &gt;</NButton>
                </div>
              </template>
              <div class="dock-grid">
                <div
                  v-for="dock in dashboard.dockStatuses"
                  :key="dock.id"
                  class="dock-card"
                  @click="openDock(dock)"
                >
                  <div class="dock-head">
                    <span class="font-600">{{ dock.dockNo }}</span>
                    <NTag :type="dockStatusType(dock.status)" size="tiny">{{ dock.statusLabel }}</NTag>
                  </div>
                  <div class="dock-meta">司机：{{ dock.driver }}</div>
                  <div class="dock-meta">车牌：{{ dock.plateNo }}</div>
                </div>
              </div>
            </NCard>
          </NGi>
        </NGrid>

        <NGrid :x-gap="12" :y-gap="12" cols="1 m:3" responsive="screen">
          <NGi v-if="show('appointments')">
            <NCard :bordered="false" size="small" title="今日预约" class="panel-card">
              <div class="appointment-date mb-10px text-13px text-#6b7280">{{ dashboard.appointmentDate }}</div>
              <div class="appointment-list">
                <div v-for="slot in dashboard.appointmentSlots" :key="slot.time" class="appointment-row">
                  <span class="appointment-time">{{ slot.time }}</span>
                  <div class="appointment-bar-wrap">
                    <div class="appointment-bar" :style="{ width: `${Math.min(100, slot.tripCount * 6)}%` }" />
                  </div>
                  <span class="appointment-count">{{ slot.tripCount }} 车次</span>
                </div>
              </div>
            </NCard>
          </NGi>
          <NGi v-if="show('logs')">
            <NCard :bordered="false" size="small" class="panel-card">
              <template #header>
                <div class="panel-head">
                  <span>最新操作记录</span>
                  <NButton text type="primary" size="tiny" @click="showLogsMore">查看更多 &gt;</NButton>
                </div>
              </template>
              <NDataTable :columns="logColumns" :data="dashboard.operationLogs" size="small" :max-height="220" />
            </NCard>
          </NGi>
          <NGi v-if="show('ai')">
            <NCard :bordered="false" size="small" class="panel-card">
              <template #header>
                <div class="panel-head">
                  <span>AI运营建议</span>
                  <NButton text type="primary" size="tiny" @click="showAiCenter">查看建议 &gt;</NButton>
                </div>
              </template>
              <div class="ai-list">
                <div
                  v-for="item in dashboard.aiSuggestions"
                  :key="item.id"
                  :class="aiCardClass(item.type)"
                  @click="toggleAiExpand(item)"
                >
                  <div class="ai-title">{{ item.title }}</div>
                  <div class="ai-detail">{{ item.detail }}</div>
                  <NCollapse v-if="expandedAiIds.has(item.id)" class="ai-expand">
                    <NCollapseItem title="详细分析" name="detail">
                      {{ item.expanded }}
                    </NCollapseItem>
                  </NCollapse>
                </div>
              </div>
            </NCard>
          </NGi>
        </NGrid>
      </template>
      <NEmpty v-else description="加载中..." class="py-80px" />
    </NSpin>

    <NModal v-model:show="dockModalVisible" preset="card" :title="`DOCK 详情 · ${selectedDock?.dockNo || ''}`" class="w-420px">
      <template v-if="selectedDock">
        <NSpace vertical :size="10">
          <div><strong>状态：</strong> {{ selectedDock.statusLabel }}</div>
          <div><strong>司机：</strong> {{ selectedDock.driver }}</div>
          <div><strong>车牌：</strong> {{ selectedDock.plateNo }}</div>
          <div class="text-12px text-#6b7280">原型模式：可扩展为装车进度、车次列表、异常处理入口。</div>
        </NSpace>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="dockModalVisible = false">关闭</NButton>
          <NButton type="primary" @click="routerPushByKey('wms_driver-checkin'); dockModalVisible = false">进入 DOCK 管理</NButton>
        </NSpace>
      </template>
    </NModal>

    <NDrawer v-model:show="alertDrawerVisible" :width="400" placement="right">
      <NDrawerContent v-if="selectedAlert" closable :title="`异常预警 · ${selectedAlert.title}`">
        <NSpace vertical :size="12">
          <NTag :type="alertSeverityType(selectedAlert.severity)">{{ selectedAlert.severityLabel }}</NTag>
          <div>异常条数：<strong>{{ selectedAlert.count }}</strong></div>
          <div>发生时间：{{ selectedAlert.elapsed }}</div>
          <NTimeline>
            <NTimelineItem title="系统检测" :content="`检测到 ${selectedAlert.count} 条${selectedAlert.title}`" />
            <NTimelineItem title="待处理" content="已推送至责任人，请及时处理" />
          </NTimeline>
        </NSpace>
        <template #footer>
          <NSpace>
            <NButton @click="alertDrawerVisible = false">关闭</NButton>
            <NButton type="primary" @click="handleAlertAction">查看异常列表</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped lang="scss">
.enterprise-dashboard {
  background: transparent;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e3a5f;
}

.refresh-label {
  font-size: 12px;
  color: #9ca3af;
}

.kpi-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid var(--n-border-color);
  background: rgb(var(--container-bg-color));
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.06);
    transform: translateY(-1px);
  }
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-label {
  font-size: 12px;
  color: #6b7280;
}

.kpi-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2px;
}

.kpi-unit {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  margin-left: 4px;
}

.kpi-trend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.kpi-yesterday {
  font-size: 11px;
  color: #9ca3af;
}

.panel-card {
  height: 100%;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.task-row,
.alert-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    opacity: 0.85;
  }
}

.task-label {
  font-size: 13px;
}

.task-count {
  font-size: 18px;
  font-weight: 700;
}

.alert-main {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.alert-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.alert-row {
  flex-direction: column;
  align-items: flex-start;
}

.dock-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dock-card {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgb(var(--primary-color));
  }
}

.dock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.dock-meta {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
}

.appointment-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.appointment-time {
  width: 44px;
  font-size: 12px;
  color: #6b7280;
}

.appointment-bar-wrap {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.appointment-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  border-radius: 4px;
}

.appointment-count {
  width: 56px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
}

.ai-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid;
  cursor: pointer;

  &--info {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  &--success {
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  &--warning {
    background: #fff7ed;
    border-color: #fed7aa;
  }
}

.ai-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.ai-detail {
  font-size: 12px;
  color: #4b5563;
  line-height: 1.5;
}

.ai-expand {
  margin-top: 8px;
}
</style>
