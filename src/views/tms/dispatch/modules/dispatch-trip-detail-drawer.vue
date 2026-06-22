<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NSpin,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetDispatchDetail } from '@/service/api/tms';
import TripDeadlineCountdown from '@/components/tms/TripDeadlineCountdown.vue';
import TripDeadlineRiskTag from '@/components/tms/TripDeadlineRiskTag.vue';
import { displayAppointmentNo } from '@/utils/oms/appointment-no';
import { DISPATCH_STATUS_META, PLAN_STATUS_META } from '../constants';

defineOptions({ name: 'DispatchTripDetailDrawer' });

const props = defineProps<{
  planId: number | null;
  orderId: number | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const detail = ref<Api.Tms.DispatchTripDetail | null>(null);
const activeTab = ref('basic');

const cargoColumns = [
  { key: 'cargoOrderNo', title: '订单号', width: 140 },
  {
    key: 'appointmentNo',
    title: '预约号',
    width: 120,
    render: (row: Api.Tms.TripCargoItem) =>
      displayAppointmentNo(row.appointmentNo, { orderType: row.orderType }, '—')
  },
  { key: 'customerName', title: '客户', minWidth: 100 },
  { key: 'destination', title: '目的地', width: 100 },
  {
    key: 'qty',
    title: '板/箱',
    width: 90,
    render: (row: Api.Tms.TripCargoItem) => `${row.palletQty}板 / ${row.cartonQty}箱`
  }
];

const orderColumns = [
  { key: 'orderNo', title: '订单号', width: 130 },
  { key: 'customerName', title: '客户', minWidth: 100 },
  { key: 'platform', title: '平台', width: 90 },
  { key: 'destination', title: '目的地', width: 100 },
  { key: 'palletQty', title: '板数', width: 64, align: 'center' as const },
  { key: 'cartonQty', title: '箱数', width: 64, align: 'center' as const }
];

function statusTag(status: string) {
  const meta = DISPATCH_STATUS_META[status as keyof typeof DISPATCH_STATUS_META]
    ?? PLAN_STATUS_META[status]
    ?? { label: status, type: 'default' as const };
  return meta;
}

async function loadDetail() {
  if (!props.planId && !props.orderId) return;
  loading.value = true;
  try {
    const { data } = await fetchGetDispatchDetail({
      planId: props.planId ?? undefined,
      orderId: props.orderId ?? undefined
    });
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [visible.value, props.planId, props.orderId],
  ([vis]) => {
    if (vis) {
      activeTab.value = 'basic';
      loadDetail();
    }
  }
);
</script>

<template>
  <NDrawer v-model:show="visible" :width="720" :to="POPUP_TO_BODY">
    <NDrawerContent
      :title="detail?.planNo ? `车次详情 · ${detail.planNo}` : detail?.tripNo ? `车次 · ${detail.tripNo}` : '车次详情'"
      closable
    >
      <NSpin :show="loading">
        <template v-if="detail">
          <div class="mb-12px">
            <NTag :type="statusTag(detail.status).type" size="small">{{ statusTag(detail.status).label }}</NTag>
            <NTag v-if="detail.tripNo" type="info" size="small" class="ml-8px">{{ detail.tripNo }}</NTag>
          </div>

          <NTabs v-model:value="activeTab" type="line" size="small">
            <NTabPane name="basic" tab="基础信息">
              <NDescriptions :column="2" bordered size="small" label-placement="left">
                <NDescriptionsItem label="方案号">{{ detail.planNo ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="车次号">{{ detail.tripNo ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
                <NDescriptionsItem label="起始仓">{{ detail.originWarehouse }}</NDescriptionsItem>
                <NDescriptionsItem label="客户">{{ detail.customerSummary }}</NDescriptionsItem>
                <NDescriptionsItem label="预约时间">{{ detail.appointmentTime ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="订单数">{{ detail.orderCount }}</NDescriptionsItem>
                <NDescriptionsItem label="板数/箱数">{{ detail.palletQty }} 板 / {{ detail.cartonQty }} 箱</NDescriptionsItem>
                <NDescriptionsItem label="路线">{{ detail.route ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="预计成本">
                  {{ detail.estimatedCost != null ? `$${detail.estimatedCost}` : '—' }}
                </NDescriptionsItem>
                <NDescriptionsItem label="满载率">
                  {{ detail.loadRate != null ? `${detail.loadRate}%` : '—' }}
                </NDescriptionsItem>
              </NDescriptions>
            </NTabPane>

            <NTabPane name="orders" tab="订单明细">
              <NDataTable :columns="orderColumns" :data="detail.orders" size="small" :scroll-x="600" />
            </NTabPane>

            <NTabPane name="cargo" tab="货物明细">
              <NDataTable :columns="cargoColumns" :data="detail.cargoItems" size="small" :scroll-x="580" />
            </NTabPane>

            <NTabPane name="plan" tab="调度方案">
              <NDescriptions :column="1" bordered size="small" label-placement="left">
                <NDescriptionsItem label="推荐车型">{{ detail.vehicleType ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="推荐供应商">{{ detail.carrierName ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="推荐 DOCK">{{ detail.dockNo ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="路线">{{ detail.route ?? '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NTabPane>

            <NTabPane name="dock" tab="DOCK信息">
              <NDescriptions :column="1" bordered size="small" label-placement="left">
                <NDescriptionsItem label="分配 DOCK">{{ detail.dockNo ?? '待分配' }}</NDescriptionsItem>
                <NDescriptionsItem label="装车时间">{{ detail.appointmentTime ?? '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NTabPane>

            <NTabPane name="resource" tab="司机/车辆/供应商">
              <NDescriptions :column="1" bordered size="small" label-placement="left">
                <NDescriptionsItem label="供应商">{{ detail.carrierName ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="司机">{{ detail.driverName ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="司机电话">{{ detail.driverPhone ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="车辆">{{ detail.plateNo ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="车型">{{ detail.vehicleType ?? '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NTabPane>

            <NTabPane name="deadline" tab="时效计算">
              <NDescriptions :column="1" bordered size="small" label-placement="left" class="mb-8px">
                <NDescriptionsItem label="距离">
                  {{ detail.deadline.distanceMiles != null ? `${detail.deadline.distanceMiles} mi` : '—' }}
                </NDescriptionsItem>
                <NDescriptionsItem label="预计行驶">
                  {{ detail.deadline.estimatedTravelMinutes != null ? `${detail.deadline.estimatedTravelMinutes} 分钟` : '—' }}
                </NDescriptionsItem>
                <NDescriptionsItem label="最晚完成">{{ detail.deadline.latestFinishTime ?? '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="剩余时间 / 风险">
                  <TripDeadlineCountdown
                    v-if="detail.deadline.latestFinishTime"
                    :appointment-time="detail.appointmentTime"
                    :origin-warehouse="detail.originWarehouse"
                    :destination="detail.destination"
                    :pallet-qty="detail.palletQty"
                    :carton-qty="detail.cartonQty"
                    :latest-finish-time="detail.deadline.latestFinishTime"
                    :latest-start-loading-time="detail.deadline.latestStartLoadingTime"
                    :remaining-minutes="detail.deadline.remainingMinutes"
                    :deadline-risk-level="detail.deadline.deadlineRiskLevel"
                  />
                  <TripDeadlineRiskTag
                    v-if="detail.deadline.deadlineRiskLevel"
                    :level="detail.deadline.deadlineRiskLevel"
                    size="small"
                    class="ml-8px"
                  />
                </NDescriptionsItem>
              </NDescriptions>
            </NTabPane>

            <NTabPane name="push" tab="推送记录">
              <NTimeline v-if="detail.pushRecords.length">
                <NTimelineItem
                  v-for="(rec, idx) in detail.pushRecords"
                  :key="idx"
                  :title="`${rec.type} · ${rec.result}`"
                  :time="rec.time"
                >
                  {{ rec.operator }}
                </NTimelineItem>
              </NTimeline>
              <span v-else class="text-gray-400 text-13px">暂无推送记录</span>
            </NTabPane>

            <NTabPane name="logs" tab="操作日志">
              <NTimeline v-if="detail.operationLogs.length">
                <NTimelineItem
                  v-for="log in detail.operationLogs"
                  :key="log.id"
                  :title="log.action"
                  :time="log.time"
                >
                  {{ log.operator }} · {{ log.detail }}
                </NTimelineItem>
              </NTimeline>
              <span v-else class="text-gray-400 text-13px">暂无操作日志</span>
            </NTabPane>
          </NTabs>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
