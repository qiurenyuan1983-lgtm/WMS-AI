<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NSpace,
  NSpin,
  NStep,
  NSteps,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import {
  fetchExecuteOrderWorkbenchAction,
  fetchGetOrderWorkbenchDetail
} from '@/service/api/oms/order-workbench';
import { STATUS_META } from '../order-workbench/constants';
import {
  LOCAL_OPERATION_GUIDE,
  LOCAL_WORKFLOW_STEPS,
  type LocalOrderAction
} from '../local-order/constants';

defineOptions({ name: 'OmsLocalOrderDetail' });

const route = useRoute();
const { routerPushByKey } = useRouterPush();

const loading = ref(false);
const actionLoading = ref(false);
const detail = ref<Api.Oms.OrderWorkbenchDetail | null>(null);

const orderId = computed(() => route.query.id as string | undefined);
const local = computed(() => detail.value?.local ?? null);

const statusMeta = computed(() => {
  if (detail.value?.customerConfirmed) {
    return { label: '客户已确认', type: 'success' as const };
  }
  const s = detail.value?.status;
  return s ? STATUS_META[s] : null;
});

const workflowCurrent = computed(() => Math.max(0, (detail.value?.workflowStep ?? 1) - 1));

const showAlert = computed(
  () => detail.value?.customerConfirmed && detail.value?.preTripNo && (detail.value?.cargoCount ?? 0) === 0
);

const emailColumns = [
  { key: 'subject', title: '邮件主题', ellipsis: { tooltip: true } },
  { key: 'recipient', title: '收件人', width: 200 },
  { key: 'sentTime', title: '发送时间', width: 150 },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (row: Api.Oms.LocalEmailRecord) => h(NTag, { size: 'small', type: 'success' }, { default: () => row.status })
  }
];

async function loadDetail() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    const { data } = await fetchGetOrderWorkbenchDetail(orderId.value);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

async function runAction(action: LocalOrderAction) {
  if (!orderId.value) return;
  actionLoading.value = true;
  try {
    const { data } = await fetchExecuteOrderWorkbenchAction(orderId.value, action);
    window.$message?.[data?.success ? 'success' : 'warning'](data?.message ?? '操作完成');
    if (data?.success) await loadDetail();
  } finally {
    actionLoading.value = false;
  }
}

function goList() {
  routerPushByKey('oms_local-order' as any);
}

onMounted(loadDetail);
</script>

<template>
  <div class="local-detail-page h-full overflow-auto">
    <NSpin :show="loading">
      <template v-if="detail">
        <div class="page-head">
          <div>
            <div class="breadcrumb text-12px text-gray-500 mb-4px">
              首页 / OMS系统 / 本地/商业地址 / 本地/商业地址订单详情
            </div>
            <div class="flex items-center gap-10px flex-wrap">
              <h1 class="text-20px font-bold m-0">{{ detail.orderNo }}</h1>
              <NTag v-if="statusMeta" :type="statusMeta.type">{{ statusMeta.label }}</NTag>
              <NTag type="warning" :bordered="false">商业地址</NTag>
            </div>
          </div>
          <NSpace>
            <NButton size="small" @click="loadDetail">刷新</NButton>
            <NButton size="small" @click="goList">返回列表</NButton>
          </NSpace>
        </div>

        <NCard :bordered="false" class="card-wrapper mb-12px">
          <NSteps :current="workflowCurrent" size="small">
            <NStep v-for="step in LOCAL_WORKFLOW_STEPS" :key="step" :title="step" />
          </NSteps>
          <NAlert v-if="showAlert" type="info" class="mt-12px" :show-icon="true">
            客户已确认出库，系统自动生成预车次 {{ detail.preTripNo }}，请添加货物。
          </NAlert>
        </NCard>

        <div class="main-grid">
          <div class="left-col">
            <NCard title="客户与订单信息" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NDescriptions :column="2" label-placement="left" bordered size="small">
                <NDescriptionsItem label="订单号">{{ detail.orderNo }}</NDescriptionsItem>
                <NDescriptionsItem label="订单类型">{{ detail.orderTypeLabel }}</NDescriptionsItem>
                <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
                <NDescriptionsItem label="联系人">{{ detail.contactName || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="联系电话">{{ detail.contactPhone || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="创建时间">{{ detail.createTime }}</NDescriptionsItem>
                <NDescriptionsItem label="客户确认时间">{{ local?.customerConfirmTime || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="出库方式">{{ local?.outboundMethod || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="特殊要求" :span="2">{{ local?.specialRequirements || '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <NCard title="收货地址信息" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NDescriptions v-if="local" :column="2" label-placement="left" bordered size="small">
                <NDescriptionsItem label="收货地址" :span="2">{{ local.deliveryAddress }}</NDescriptionsItem>
                <NDescriptionsItem label="联系人">{{ local.deliveryContact }}</NDescriptionsItem>
                <NDescriptionsItem label="电话">{{ local.deliveryPhone }}</NDescriptionsItem>
                <NDescriptionsItem label="是否预约">{{ local.needAppointment ? '是' : '否' }}</NDescriptionsItem>
                <NDescriptionsItem label="预约时间">{{ detail.appointmentTime || '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <NCard title="客户确认记录" size="small" :bordered="false" class="card-wrapper mb-12px">
              <p v-if="local?.customerConfirmSummary" class="text-13px text-gray-700 m-0">
                {{ local.customerConfirmSummary }}
                <span v-if="local.customerConfirmTime" class="text-gray-500">（{{ local.customerConfirmTime }}）</span>
              </p>
              <NEmpty v-else description="待客户确认" class="py-12px" />
            </NCard>

            <NCard title="邮件发送记录" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NDataTable
                v-if="local?.emailRecords?.length"
                size="small"
                :columns="emailColumns"
                :data="local.emailRecords"
                :row-key="(r: Api.Oms.LocalEmailRecord) => r.id"
              />
              <NEmpty v-else description="暂无邮件记录" class="py-12px" />
            </NCard>

            <NCard title="预车次信息（系统生成）" size="small" :bordered="false" class="card-wrapper mb-12px">
              <template #header-extra>
                <NButton size="tiny" :loading="actionLoading" @click="runAction('autoPreTrip')">重新生成预车次</NButton>
              </template>
              <NDescriptions v-if="local?.preTrip" :column="2" label-placement="left" bordered size="small">
                <NDescriptionsItem label="预车次号">{{ local.preTrip.preTripNo }}</NDescriptionsItem>
                <NDescriptionsItem label="推荐车型">{{ local.preTrip.vehicleType }}</NDescriptionsItem>
                <NDescriptionsItem label="预计板数">{{ local.preTrip.palletQty }} 板</NDescriptionsItem>
                <NDescriptionsItem label="重量">{{ local.preTrip.weightLbs }} lbs</NDescriptionsItem>
                <NDescriptionsItem label="体积">{{ local.preTrip.volumeCbm }} CBM</NDescriptionsItem>
                <NDescriptionsItem label="推荐 DOCK">{{ local.preTrip.dockNo }}</NDescriptionsItem>
                <NDescriptionsItem label="预计发车">{{ local.preTrip.estDepartTime || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="预计到达">{{ local.preTrip.estArrivalTime || '—' }}</NDescriptionsItem>
              </NDescriptions>
              <NEmpty v-else description="待生成预车次" class="py-12px" />
            </NCard>

            <NCard title="货物明细（待添加）" size="small" :bordered="false" class="card-wrapper">
              <NDataTable
                v-if="detail.cargoItems.length"
                size="small"
                :columns="[
                  { key: 'palletNo', title: '卡板号', width: 110 },
                  { key: 'cargoName', title: 'SKU/品名', ellipsis: { tooltip: true } },
                  { key: 'cartonQty', title: '箱数', width: 64, align: 'center' },
                  { key: 'palletQty', title: '板数', width: 64, align: 'center' },
                  { key: 'weightLbs', title: '重量', width: 80, align: 'right' },
                  { key: 'volumeCbm', title: '体积', width: 72, align: 'right' },
                  { key: 'locationCode', title: '库位', width: 80 }
                ]"
                :data="detail.cargoItems"
                :row-key="(r: Api.Oms.OrderWorkbenchCargoItem) => r.id"
              />
              <NEmpty v-else description="暂无货物，请点击「添加货物」" class="py-24px" />
            </NCard>
          </div>

          <div class="right-col">
            <NCard title="操作流程指南" size="small" :bordered="false" class="card-wrapper mb-12px">
              <ol class="guide-list">
                <li v-for="(tip, idx) in LOCAL_OPERATION_GUIDE" :key="idx">
                  <span class="guide-step">{{ idx + 1 }}</span>
                  {{ tip }}
                </li>
              </ol>
            </NCard>

            <NCard title="操作" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NSpace vertical :size="8">
                <NButton type="success" block :loading="actionLoading" @click="runAction('addCargo')">添加货物</NButton>
                <NButton type="primary" block :loading="actionLoading" @click="runAction('generateOrder')">生成正式订单</NButton>
                <NButton block :loading="actionLoading" @click="runAction('autoPreTrip')">重新生成预车次</NButton>
                <NButton block :loading="actionLoading" @click="runAction('sendCustomerEmail')">发送确认邮件</NButton>
                <NButton type="warning" block :loading="actionLoading" @click="runAction('markAbnormal')">标记异常</NButton>
                <NButton type="error" secondary block :loading="actionLoading" @click="runAction('cancel')">取消订单</NButton>
              </NSpace>
            </NCard>

            <NCard title="操作日志" size="small" :bordered="false" class="card-wrapper">
              <NTimeline>
                <NTimelineItem
                  v-for="log in detail.logs"
                  :key="log.id"
                  :title="log.action"
                  :time="log.time"
                >
                  <span class="text-12px text-gray-600">{{ log.operator }} · {{ log.status }}</span>
                </NTimelineItem>
              </NTimeline>
            </NCard>
          </div>
        </div>
      </template>
      <NEmpty v-else-if="!loading" description="未找到订单" class="py-80px" />
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.local-detail-page {
  padding: 12px;
}
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.main-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 12px;
  align-items: start;
}
@media (max-width: 1280px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
.guide-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.7;
}
.guide-list li {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}
.guide-step {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
