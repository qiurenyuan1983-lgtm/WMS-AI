<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NGi, NGrid, NSpace, NTag, NTimeline, NTimelineItem } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetTmsOverview } from '@/service/api/tms';
import { TMS_ROUTE } from '../constants';

defineOptions({ name: 'TmsHome' });

const { routerPushByKey } = useRouterPush();
const loading = ref(false);
const overview = ref<Api.Tms.Overview>({
  pendingDispatch: 0,
  pendingManual: 0,
  inTransit: 0,
  signed: 0,
  exception: 0,
  pendingSettlement: 0,
  todayDepart: 0,
  dockLoading: 0,
  recentLogs: []
});

const kpiCards = [
  { key: 'pendingDispatch', label: '待排车', color: '#6b7280', route: TMS_ROUTE.tripOrder },
  { key: 'pendingManual', label: '待人工确认', color: '#f59e0b', route: TMS_ROUTE.dispatch },
  { key: 'inTransit', label: '运输中', color: '#2563eb', route: TMS_ROUTE.tripOrder },
  { key: 'signed', label: '已签收', color: '#10b981', route: TMS_ROUTE.pod },
  { key: 'exception', label: '运输异常', color: '#ef4444', route: TMS_ROUTE.exception },
  { key: 'pendingSettlement', label: '待结算', color: '#8b5cf6', route: TMS_ROUTE.freightSettlement },
  { key: 'todayDepart', label: '今日发车', color: '#06b6d4', route: TMS_ROUTE.dockBoard },
  { key: 'dockLoading', label: '装车中 DOCK', color: '#0ea5e9', route: TMS_ROUTE.dockBoard }
] as const;

const workflowSteps = [
  {
    step: 1,
    title: 'OMS 车次订单',
    desc: '在 OMS 车次订单列表管理推送车次、筛选待排车/异常、查看详情',
    route: TMS_ROUTE.tripOrder,
    points: ['车次号 / OMS 订单', '目的地 / 预约时间', '板数 / 承运商', '派车 / 推送 WMS']
  },
  {
    step: 2,
    title: '调度工作台',
    desc: '自动排车、人工确认司机/车辆/DOCK',
    route: TMS_ROUTE.dispatch,
    points: ['自动排车推荐', '合并 / 拆分车次', '分配供应商', '确认调度推送']
  },
  {
    step: 3,
    title: '司机管理',
    desc: '司机档案、签到、任务与 GPS 状态',
    route: TMS_ROUTE.driver,
    points: ['接单 / 到仓', 'Check-in 记录', '当前车次', '准时率 KPI']
  },
  {
    step: 4,
    title: '车辆管理',
    desc: '车型容量、保险年检、可用状态',
    route: TMS_ROUTE.vehicle,
    points: ['53尺 / 26尺', '绑定司机', '维修停用', '当前任务']
  },
  {
    step: 5,
    title: 'DOCK 实时看板',
    desc: '装车口排队、装车进度、异常监控',
    route: TMS_ROUTE.dockBoard,
    points: ['排队 / 装车中', '装车进度', '司机未到', '货未齐异常']
  },
  {
    step: 6,
    title: '运输执行',
    desc: '发车、在途跟踪、到达签收',
    route: TMS_ROUTE.tripOrder,
    points: ['司机发车确认', '在途 GPS', '到达通知', '异常上报']
  },
  {
    step: 7,
    title: '运费结算',
    desc: '计费规则、审核对账、付款',
    route: TMS_ROUTE.freightSettlement,
    points: ['基础运费', '附加费', '供应商账单', '发票对账']
  },
  {
    step: 8,
    title: '供应商管理',
    desc: '承运商档案、报价、账号、车队与 KPI',
    route: TMS_ROUTE.supplier,
    points: ['提柜 / 卡派 / LTL', '报价与账单', '车辆司机设备', '绩效看板']
  }
];

async function loadOverview() {
  loading.value = true;
  try {
    const { data } = await fetchGetTmsOverview();
    if (data) overview.value = data;
  } finally {
    loading.value = false;
  }
}

function go(routeKey: string) {
  routerPushByKey(routeKey as any);
}

onMounted(loadOverview);
</script>

<template>
  <div class="tms-home h-full flex flex-col gap-12px overflow-auto p-4px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between flex-wrap gap-12px mb-16px">
        <div>
          <h2 class="text-18px font-semibold text-gray-800 m-0">TMS 运输管理总览</h2>
          <p class="text-13px text-gray-500 mt-4px mb-0">
            OMS 订单 → 车次调度 → 装车执行 → POD 签收 → 运费结算 → 供应商管理
          </p>
        </div>
        <NButton size="small" :loading="loading" @click="loadOverview">刷新</NButton>
      </div>

      <div class="kpi-grid">
        <div
          v-for="card in kpiCards"
          :key="card.key"
          class="kpi-card"
          @click="go(card.route)"
        >
          <span class="kpi-num" :style="{ color: card.color }">{{ overview[card.key] }}</span>
          <span class="kpi-label">{{ card.label }}</span>
        </div>
      </div>
    </NCard>

    <NCard title="TMS 核心操作流" :bordered="false" class="card-wrapper">
      <NGrid :cols="4" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
        <NGi v-for="step in workflowSteps" :key="step.step" span="4 m:2 l:1">
          <div class="flow-card">
            <div class="flow-head">
              <span class="flow-step">{{ step.step }}</span>
              <span class="flow-title">{{ step.title }}</span>
            </div>
            <p class="flow-desc">{{ step.desc }}</p>
            <ul class="flow-points">
              <li v-for="p in step.points" :key="p">{{ p }}</li>
            </ul>
            <NButton size="small" type="primary" ghost block @click="go(step.route)">进入模块</NButton>
          </div>
        </NGi>
      </NGrid>
    </NCard>

    <NCard title="最近操作日志" :bordered="false" class="card-wrapper">
      <div class="flex justify-between items-center mb-12px">
        <span class="text-13px text-gray-500">跨模块业务轨迹</span>
        <NButton text type="primary" size="small" @click="go(TMS_ROUTE.log)">查看全部</NButton>
      </div>
      <NTimeline v-if="overview.recentLogs?.length">
        <NTimelineItem
          v-for="log in overview.recentLogs"
          :key="log.id"
          :title="`${log.module} · ${log.action}`"
          :time="log.createTime"
        >
          <NSpace size="small">
            <NTag v-if="log.tripNo" size="small" :bordered="false">{{ log.tripNo }}</NTag>
            <span class="text-13px text-gray-600">{{ log.detail }}</span>
            <span class="text-12px text-gray-400">{{ log.operator }}</span>
          </NSpace>
        </NTimelineItem>
      </NTimeline>
    </NCard>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
.kpi-card {
  padding: 16px;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.kpi-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
.kpi-num { display: block; font-size: 28px; font-weight: 700; line-height: 1.2; }
.kpi-label { font-size: 13px; color: #6b7280; }
.flow-card {
  height: 100%;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.flow-head { display: flex; align-items: center; gap: 8px; }
.flow-step {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1e3a5f;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.flow-title { font-size: 14px; font-weight: 600; color: #1f2937; }
.flow-desc { font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5; }
.flow-points {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #4b5563;
  flex: 1;
  line-height: 1.6;
}
</style>
