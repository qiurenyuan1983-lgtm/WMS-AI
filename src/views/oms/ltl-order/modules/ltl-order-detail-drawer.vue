<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NModal,
  NRadio,
  NRadioGroup,
  NSpace,
  NSpin,
  NStep,
  NSteps,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import {
  fetchExecuteOrderWorkbenchAction,
  fetchGetOrderWorkbenchDetail
} from '@/service/api/oms/order-workbench';
import { buildLtlTripOrderNo } from '@/utils/oms/ltl-generate-trip-order';
import { STATUS_META } from '../../order-workbench/constants';
import { LTL_ORDER_METHOD_OPTIONS, LTL_WORKFLOW_STEPS, type LtlOrderAction } from '../constants';

defineOptions({ name: 'LtlOrderDetailDrawer' });

const props = defineProps<{
  orderId: CommonType.IdType | null;
}>();

const emit = defineEmits<{ refresh: [] }>();

const visible = defineModel<boolean>('visible', { default: false });
const { routerPushByKey } = useRouterPush();

const loading = ref(false);
const generateModalVisible = ref(false);
const generatePreview = ref<Api.Oms.LtlGenerateTripPreview | null>(null);
const actionLoading = ref(false);
const detail = ref<Api.Oms.OrderWorkbenchDetail | null>(null);
const orderMethod = ref<'API' | 'RPA' | 'MANUAL'>('API');
const selectedSupplierId = ref<number | null>(null);

const drawerTitle = computed(() => (detail.value?.orderNo ? `LTL订单详情 · ${detail.value.orderNo}` : 'LTL订单详情'));

/** 抽屉宽度：略小于全屏，避免双栏布局被裁切 */
const drawerWidth = computed(() => Math.min(Math.floor(window.innerWidth * 0.92), 1200));

const statusMeta = computed(() => {
  const s = detail.value?.status;
  return s ? STATUS_META[s] : null;
});

const ltl = computed(() => detail.value?.ltl ?? null);

const selectedSupplierPortal = computed(() => {
  const id = selectedSupplierId.value;
  return ltl.value?.supplierCandidates?.find(c => c.supplierId === id)?.orderPortalUrl ?? null;
});

const workflowCurrent = computed(() => {
  const step = detail.value?.workflowStep ?? 1;
  if (step <= 1) return 0;
  if (step === 2) return 1;
  if (step <= 4) return 2;
  return 3;
});

const supplierColumns: DataTableColumns<Api.Oms.LtlSupplierCandidate> = [
  {
    key: 'recommendTag',
    title: '推荐',
    width: 64,
    render: row =>
      row.recommendTag ? <NTag type="success" size="small">{row.recommendTag}</NTag> : '—'
  },
  { key: 'supplierName', title: '供应商', width: 130 },
  {
    key: 'serviceRating',
    title: '服务评分',
    width: 88,
    render: row => `${row.serviceRating}`
  },
  {
    key: 'onTimeRate',
    title: '准时率',
    width: 72,
    render: row => `${row.onTimeRate}%`
  },
  {
    key: 'quoteAmount',
    title: '报价(USD)',
    width: 100,
    align: 'right',
    render: row => `$${row.quoteAmount.toLocaleString()}`
  },
  {
    key: 'leadTimeDays',
    title: '时效',
    width: 72,
    render: row => `${row.leadTimeDays}天`
  },
  { key: 'serviceArea', title: '服务范围', width: 100, ellipsis: { tooltip: true } },
  {
    key: 'fees',
    title: '附加费',
    width: 140,
    render: row => `Liftgate $${row.liftgateFee} / 保险 $${row.insuranceFee}`
  },
  {
    key: 'totalAmount',
    title: '合计',
    width: 88,
    align: 'right',
    render: row => <span class="font-600">${row.totalAmount.toLocaleString()}</span>
  },
  {
    key: 'action',
    title: '操作',
    width: 80,
    fixed: 'right',
    render: row => (
      <NButton
        size="tiny"
        type={selectedSupplierId.value === row.supplierId ? 'primary' : 'default'}
        onClick={() => (selectedSupplierId.value = row.supplierId)}
      >
        选择
      </NButton>
    )
  }
];

async function loadDetail() {
  if (!props.orderId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetOrderWorkbenchDetail(props.orderId);
    detail.value = data ?? null;
    selectedSupplierId.value = data?.ltl?.selectedSupplierId ?? data?.ltl?.supplierCandidates?.[0]?.supplierId ?? null;
    orderMethod.value = data?.ltl?.orderMethod ?? 'API';
  } finally {
    loading.value = false;
  }
}

async function runAction(action: LtlOrderAction, extra?: Record<string, any>) {
  if (!props.orderId) return;
  actionLoading.value = true;
  try {
    const { data } = await fetchExecuteOrderWorkbenchAction(props.orderId, action, extra);
    window.$message?.[data?.success ? 'success' : 'warning'](data?.message ?? '操作完成');
    if (data?.success) {
      await loadDetail();
      emit('refresh');
    }
  } finally {
    actionLoading.value = false;
  }
}

async function handlePlaceOrder() {
  if (!selectedSupplierId.value) {
    window.$message?.warning('请先选择供应商');
    return;
  }
  if (!props.orderId) return;
  actionLoading.value = true;
  try {
    const { data } = await fetchExecuteOrderWorkbenchAction(props.orderId, 'placeSupplierOrder', {
      orderMethod: orderMethod.value,
      selectedSupplierId: selectedSupplierId.value
    });
    if (data?.success) {
      window.$message?.[data.portalUrl || orderMethod.value !== 'MANUAL' ? 'success' : 'warning'](data.message ?? '操作完成');
      if (orderMethod.value === 'MANUAL' && data.portalUrl) {
        window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
      }
      await loadDetail();
      emit('refresh');
    } else {
      window.$message?.warning(data?.message ?? '操作失败');
    }
  } finally {
    actionLoading.value = false;
  }
}

function showProtoInfo(msg: string) {
  window.$message?.info(msg);
}

function openGenerateOrderModal() {
  if (!detail.value) return;
  if (!detail.value.supplierName) {
    window.$message?.warning('请先匹配供应商并完成下单');
    return;
  }
  if (detail.value.generatedTripNo) {
    window.$message?.info(`已生成车次订单 ${detail.value.generatedTripNo}`);
    return;
  }
  if (!props.orderId) return;
  generatePreview.value = {
    tripNo: buildLtlTripOrderNo(props.orderId),
    orderNo: detail.value.orderNo,
    supplierName: detail.value.supplierName,
    palletQty: detail.value.palletQty
  };
  generateModalVisible.value = true;
}

async function confirmGenerateOrder() {
  if (!props.orderId) return;
  actionLoading.value = true;
  try {
    const { data } = await fetchExecuteOrderWorkbenchAction(props.orderId, 'generateOrder');
    if (data?.success) {
      window.$message?.success(data.message ?? '车次订单已生成');
      generateModalVisible.value = false;
      await loadDetail();
      emit('refresh');
    } else {
      window.$message?.warning(data?.message ?? '生成失败');
    }
  } finally {
    actionLoading.value = false;
  }
}

function goTripOrderList() {
  generateModalVisible.value = false;
  routerPushByKey('oms_outbound-order' as any);
}

watch(
  () => [visible.value, props.orderId] as const,
  ([show, id]) => {
    if (show && id) loadDetail();
    if (!show) detail.value = null;
  }
);
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="drawerWidth" class="ltl-order-drawer">
    <NDrawerContent :title="drawerTitle" :native-scrollbar="true" closable class="ltl-order-detail-drawer">
      <template #header-extra>
        <NSpace v-if="detail" :size="8" align="center">
          <NTag v-if="statusMeta" size="small" :type="statusMeta.type">{{ statusMeta.label }}</NTag>
          <NTag size="small" type="success" :bordered="false">LTL</NTag>
          <NButton size="small" :loading="loading" @click="loadDetail">刷新</NButton>
        </NSpace>
      </template>

      <NSpin :show="loading">
        <template v-if="detail">
          <NCard :bordered="false" class="card-wrapper mb-12px">
            <NSteps :current="workflowCurrent" size="small">
              <NStep v-for="step in LTL_WORKFLOW_STEPS" :key="step" :title="step" />
            </NSteps>
          </NCard>

          <div class="drawer-body">
            <div class="info-grid">
              <NCard title="订单基本信息" size="small" :bordered="false" class="card-wrapper">
                <NDescriptions :column="2" label-placement="left" bordered size="small">
                  <NDescriptionsItem label="订单号">{{ detail.orderNo }}</NDescriptionsItem>
                  <NDescriptionsItem label="订单类型">{{ detail.orderTypeLabel }}</NDescriptionsItem>
                  <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
                  <NDescriptionsItem label="创建时间">{{ detail.createTime }}</NDescriptionsItem>
                  <NDescriptionsItem label="起始仓">{{ ltl?.originWarehouse || 'LA' }}</NDescriptionsItem>
                  <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
                  <NDescriptionsItem label="板数">{{ detail.palletQty }} 板</NDescriptionsItem>
                  <NDescriptionsItem label="重量">{{ detail.weightLbs }} lbs</NDescriptionsItem>
                  <NDescriptionsItem label="体积">{{ detail.volumeCbm }} CBM</NDescriptionsItem>
                  <NDescriptionsItem label="订单来源">{{ ltl?.orderSourceLabel || '—' }}</NDescriptionsItem>
                  <NDescriptionsItem label="货物类型">{{ ltl?.cargoType || '—' }}</NDescriptionsItem>
                  <NDescriptionsItem label="时效要求">{{ ltl?.urgency === 'URGENT' ? '加急' : '普通' }}</NDescriptionsItem>
                  <NDescriptionsItem label="预订单号">{{ detail.preTripNo || '—' }}</NDescriptionsItem>
                </NDescriptions>
              </NCard>

              <NCard title="收货信息" size="small" :bordered="false" class="card-wrapper">
                <NDescriptions v-if="ltl?.consignee" :column="2" label-placement="left" bordered size="small">
                  <NDescriptionsItem label="收货公司">{{ ltl.consignee.companyName }}</NDescriptionsItem>
                  <NDescriptionsItem label="收货地址">{{ ltl.consignee.address }}</NDescriptionsItem>
                  <NDescriptionsItem label="联系人">{{ ltl.consignee.contactName }}</NDescriptionsItem>
                  <NDescriptionsItem label="电话">{{ ltl.consignee.contactPhone }}</NDescriptionsItem>
                  <NDescriptionsItem label="地址类型">{{ ltl.consignee.addressType }}</NDescriptionsItem>
                  <NDescriptionsItem label="预约收货">{{ ltl.consignee.needAppointment ? '是' : '否' }}</NDescriptionsItem>
                  <NDescriptionsItem label="Liftgate">{{ ltl.consignee.needLiftgate ? '是' : '否' }}</NDescriptionsItem>
                  <NDescriptionsItem label="收货时间">{{ ltl.consignee.receivingHours }}</NDescriptionsItem>
                </NDescriptions>
              </NCard>
            </div>

            <div class="summary-grid">
              <NCard title="货物明细" size="small" :bordered="false" class="card-wrapper">
                <NDataTable
                  v-if="detail.cargoItems.length"
                  size="small"
                  :columns="[
                    { key: 'palletNo', title: '卡板', width: 100 },
                    { key: 'cartonQty', title: '箱数', width: 64, align: 'center' },
                    { key: 'weightLbs', title: '重量(lbs)', width: 88, align: 'right' },
                    { key: 'volumeCbm', title: 'CBM', width: 72, align: 'right' }
                  ]"
                  :data="detail.cargoItems"
                  :row-key="(r: Api.Oms.OrderWorkbenchCargoItem) => r.id"
                />
                <div v-if="detail.cargoItems.length" class="mt-8px text-12px text-gray-600">
                  合计：{{ detail.cargoItems.reduce((s, i) => s + i.cartonQty, 0) }} 箱 /
                  {{ detail.weightLbs }} lbs / {{ detail.volumeCbm }} CBM
                </div>
                <NEmpty v-else description="暂无货物" class="py-16px" />
              </NCard>

              <NCard title="费用明细" size="small" :bordered="false" class="card-wrapper">
                <template v-if="ltl?.costBreakdown">
                  <div class="fee-row"><span>基础运费</span><span>${{ ltl.costBreakdown.linehaul.toLocaleString() }}</span></div>
                  <div class="fee-row"><span>Liftgate</span><span>${{ ltl.costBreakdown.liftgate }}</span></div>
                  <div class="fee-row"><span>保险费</span><span>${{ ltl.costBreakdown.insurance }}</span></div>
                  <div class="fee-row total"><span>总费用</span><span>${{ ltl.costBreakdown.total.toLocaleString() }}</span></div>
                </template>
                <NEmpty v-else description="待匹配供应商" class="py-12px" />
              </NCard>
            </div>

            <NCard title="供应商推荐" size="small" :bordered="false" class="card-wrapper">
              <p class="text-12px text-gray-500 mb-8px">
                系统根据起始仓、ZIP、板数、重量、服务范围、准时率与报价自动匹配最优供应商
              </p>
              <div class="table-scroll-wrap">
                <NDataTable
                  size="small"
                  :columns="supplierColumns"
                  :data="ltl?.supplierCandidates ?? []"
                  :row-key="(r: Api.Oms.LtlSupplierCandidate) => r.supplierId"
                  :scroll-x="960"
                />
              </div>
              <div class="mt-8px flex gap-8px flex-wrap">
                <NButton size="small" :loading="actionLoading" @click="runAction('autoMatchSupplier')">自动匹配供应商</NButton>
                <NButton size="small" :loading="actionLoading" @click="runAction('rematchSupplier')">重新匹配</NButton>
              </div>
            </NCard>

            <NCard title="供应商下单信息" size="small" :bordered="false" class="card-wrapper">
              <div class="mb-10px flex flex-wrap items-center gap-8px">
                <span class="text-13px text-gray-600">下单方式</span>
                <NRadioGroup v-model:value="orderMethod" size="small">
                  <NRadio v-for="opt in LTL_ORDER_METHOD_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</NRadio>
                </NRadioGroup>
              </div>
              <p v-if="orderMethod === 'MANUAL' && selectedSupplierPortal" class="text-12px text-gray-500 mb-10px break-all">
                人工下单将打开：
                <a :href="selectedSupplierPortal" target="_blank" rel="noopener noreferrer" class="text-primary">
                  {{ selectedSupplierPortal }}
                </a>
              </p>
              <NAlert v-if="ltl?.supplierOrderPlaced" type="success" :show-icon="true" class="mb-10px">
                {{ ltl.supplierOrderMessage }}
              </NAlert>
              <NButton type="primary" size="small" :loading="actionLoading" @click="handlePlaceOrder">
                {{ orderMethod === 'MANUAL' ? '人工下单' : '自动下单' }}
              </NButton>
            </NCard>

            <NCard title="下单返回信息" size="small" :bordered="false" class="card-wrapper">
              <NDescriptions :column="2" label-placement="left" bordered size="small">
                <NDescriptionsItem label="车次号">{{ detail.generatedTripNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="PRO号">{{ detail.supplierProNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="BOL号">{{ ltl?.bolNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="提货时间">{{ ltl?.pickupTime || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="预计送达">{{ ltl?.estimatedDelivery || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="供应商">{{ detail.supplierName || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="报价">{{ detail.supplierQuote || '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <div class="action-grid">
              <NCard title="订单状态流转" size="small" :bordered="false" class="card-wrapper">
                <NTimeline>
                  <NTimelineItem
                    v-for="(step, idx) in LTL_WORKFLOW_STEPS"
                    :key="step"
                    :type="idx < workflowCurrent ? 'success' : idx === workflowCurrent ? 'info' : 'default'"
                    :title="step"
                  >
                    <span v-if="idx === 0" class="text-12px text-gray-500">{{ detail.createTime }}</span>
                  </NTimelineItem>
                </NTimeline>
              </NCard>

              <NCard title="操作" size="small" :bordered="false" class="card-wrapper">
                <NSpace vertical :size="8">
                  <NButton type="primary" block :loading="actionLoading" @click="openGenerateOrderModal">生成订单</NButton>
                  <NButton v-if="detail.generatedTripNo" block @click="goTripOrderList">查看车次订单列表</NButton>
                  <NButton block :loading="actionLoading" @click="runAction('rematchSupplier')">重新匹配供应商</NButton>
                  <NButton block @click="showProtoInfo('原型：打开供应商报价页')">查看报价</NButton>
                  <NButton block @click="showProtoInfo('原型：查看 BOL 文件')">查看 BOL</NButton>
                  <NButton type="warning" block :loading="actionLoading" @click="runAction('markAbnormal')">标记异常</NButton>
                  <NButton type="error" secondary block :loading="actionLoading" @click="runAction('cancel')">取消订单</NButton>
                </NSpace>
              </NCard>
            </div>

            <NCard title="操作记录" size="small" :bordered="false" class="card-wrapper">
              <NDataTable
                size="small"
                :columns="[
                  { key: 'time', title: '时间', width: 150 },
                  { key: 'operator', title: '操作人', width: 100 },
                  { key: 'action', title: '操作', width: 160 },
                  { key: 'status', title: '状态', width: 80 }
                ]"
                :data="detail.logs"
                :row-key="(r: Api.Oms.OrderWorkbenchLog) => r.id"
              />
            </NCard>
          </div>
        </template>
        <NEmpty v-else-if="!loading" description="未找到 LTL 订单" class="py-80px" />
      </NSpin>
    </NDrawerContent>
  </NDrawer>

  <NModal
    v-model:show="generateModalVisible"
    preset="card"
    title="生成车次订单"
    :style="{ width: '480px' }"
    :mask-closable="false"
  >
    <p class="text-13px text-gray-500 mb-12px">请确认以下信息，确认后将写入车次订单列表。</p>
    <NDescriptions v-if="generatePreview" :column="1" bordered label-placement="left" size="small">
      <NDescriptionsItem label="车次号">
        <span class="font-600 text-primary">{{ generatePreview.tripNo }}</span>
      </NDescriptionsItem>
      <NDescriptionsItem label="订单号">{{ generatePreview.orderNo }}</NDescriptionsItem>
      <NDescriptionsItem label="供应商">{{ generatePreview.supplierName }}</NDescriptionsItem>
      <NDescriptionsItem label="板数">{{ generatePreview.palletQty }} 板</NDescriptionsItem>
    </NDescriptions>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="generateModalVisible = false">取消</NButton>
        <NButton type="primary" :loading="actionLoading" @click="confirmGenerateOrder">确认-生成订单</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.info-grid,
.summary-grid,
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

@media (max-width: 900px) {
  .info-grid,
  .summary-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }
}

.table-scroll-wrap {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--n-border-color);
  color: #374151;
}
.fee-row.total {
  font-weight: 700;
  font-size: 15px;
  color: #dc2626;
  border-bottom: none;
  margin-top: 4px;
}
</style>
