<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NSpace,
  NSpin,
  NStep,
  NSteps,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { isMockMode } from '@/mock';
import {
  fetchCancelDevanningOrder,
  fetchClearExceptionDevanningOrder,
  fetchCompleteDevanningOrder,
  fetchConfirmArrivalDevanningOrder,
  fetchConfirmPickupDevanningOrder,
  fetchGetDevanningOrderDetail,
  fetchMarkExceptionDevanningOrder,
  fetchSaveDevanningOrderFees,
  fetchStartDevanningOrder
} from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import CargoOrderDetailDrawer from '@/views/oms/cargo-order/modules/cargo-order-detail-drawer.vue';
import { useContainerCargoTableColumns } from '@/views/oms/container-order/composables/use-container-cargo-table-columns';
import { printPalletLabel, printPalletLabels } from '@/views/wms/devanning-work/utils/print-pallet-label';
import { allocateDeliveryFeeByCbm } from '@/utils/wms/allocate-delivery-fee-by-cbm';
import {
  fulfillmentStatusLabel,
  isCargoOrderDeliveryFeeEligible
} from '@/utils/wms/delivery-fee-eligibility';
import type { DataTableColumns } from 'naive-ui';

defineOptions({ name: 'WmsDevanningOrderDetailDrawer' });

interface Props {
  orderId?: CommonType.IdType | null;
  initialTab?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'updated'): void }>();
const visible = defineModel<boolean>('visible', { default: false });
const { hasAuth } = useAuth();

const STATUS_STEPS = [
  { value: 'UNPICKEDUP', label: '未提柜' },
  { value: 'PICKEDUP', label: '已提柜' },
  { value: 'ARRIVED', label: '已到仓' },
  { value: 'DEVANNING', label: '拆柜中' },
  { value: 'DEVANNED', label: '拆柜完成' }
] as const;

const STATUS_LABEL: Record<string, string> = {
  UNPICKEDUP: '未提柜',
  PICKEDUP: '已提柜',
  ARRIVED: '已到仓',
  DEVANNING: '拆柜中',
  DEVANNED: '拆柜完成',
  EXCEPTION: '异常',
  CANCELLED: '取消'
};

const STATUS_TAG: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  UNPICKEDUP: 'default',
  PICKEDUP: 'info',
  ARRIVED: 'warning',
  DEVANNING: 'warning',
  DEVANNED: 'success',
  EXCEPTION: 'error',
  CANCELLED: 'default'
};

const METHOD_LABEL: Record<string, string> = {
  MANUAL: '人工',
  FORKLIFT: '叉车',
  MACHINE: '机械'
};

const DESC_PROPS = {
  labelPlacement: 'left' as const,
  size: 'small' as const,
  labelStyle: { width: '96px', verticalAlign: 'top', paddingTop: '6px', whiteSpace: 'nowrap' as const },
  contentStyle: { verticalAlign: 'top', paddingBottom: '8px' }
};

const loading = ref(false);
const detail = ref<Record<string, any> | null>(null);
const activeTab = ref('basic');
const actionLoading = ref(false);
const feeSaving = ref(false);

type DeliveryFeeRow = Api.Wms.DevanningDeliveryFeeAllocation;

const feeForm = ref({
  pickupFee: null as number | null,
  exceptionFee: null as number | null,
  devanningFee: null as number | null,
  otherOperationFee: null as number | null,
  otherOperationFeeRemark: ''
});

const deliveryFeeRows = ref<DeliveryFeeRow[]>([]);
let deliveryFeeRowSeq = 1;

const deliveryFeeTotal = computed(() =>
  deliveryFeeRows.value.reduce((sum, row) => sum + (Number(row.allocatedFee) || 0), 0)
);

const cargoOrders = computed(() => (detail.value?.cargoOrders as Api.Oms.CargoOrder[] | undefined) ?? []);

const relatedOrderNos = computed(() => {
  const nos = cargoOrders.value.map(order => order.cargoOrderNo).filter(Boolean);
  return nos.length ? nos.join('、') : '—';
});

const dispatchedCargoOrders = computed(() =>
  cargoOrders.value.filter(order => isCargoOrderDeliveryFeeEligible(order.fulfillmentStatus))
);

const canManageDeliveryFee = computed(() => dispatchedCargoOrders.value.length > 0);

function findCargoOrder(orderNo?: string | null) {
  const key = orderNo?.trim();
  if (!key) return undefined;
  return cargoOrders.value.find(item => item.cargoOrderNo === key);
}

function isRowDeliveryFeeEligible(row: DeliveryFeeRow) {
  const orderNo = row.cargoOrderNo?.trim();
  if (!orderNo) return false;
  const cargo = findCargoOrder(orderNo);
  return cargo ? isCargoOrderDeliveryFeeEligible(cargo.fulfillmentStatus) : false;
}

const feeGrandTotal = computed(() =>
  [feeForm.value.pickupFee, feeForm.value.exceptionFee, feeForm.value.devanningFee, feeForm.value.otherOperationFee, deliveryFeeTotal.value]
    .reduce((sum, value) => sum + (Number(value) || 0), 0)
);

const currentStep = computed(() => {
  const idx = STATUS_STEPS.findIndex(s => s.value === detail.value?.status);
  if (idx < 0) return 0;
  return idx + 1;
});

const progressPercent = computed(() => detail.value?.progress ?? 0);

const cargoDetailVisible = ref(false);
const viewingCargoId = ref<CommonType.IdType>();

function getCargoBusinessTypeName(row: Api.Oms.CargoOrder) {
  return String((row as Api.Oms.CargoOrder & { businessTypeName?: string }).businessTypeName || '--');
}

function openCargoDetailDrawer(row: Api.Oms.CargoOrder) {
  if (!row.id) {
    window.$message?.warning('订单不存在');
    return;
  }
  viewingCargoId.value = row.id;
  cargoDetailVisible.value = true;
}

const cargoColumns = useContainerCargoTableColumns({
  mode: 'detail',
  getBusinessTypeName: getCargoBusinessTypeName,
  onViewDetail: row => openCargoDetailDrawer(row),
  hasAuth: () => false
});

const PALLET_STATUS_LABEL: Record<string, string> = {
  IN_STOCK: '在库',
  PRE_OUTBOUND: '预出库',
  OUTBOUND: '已出库'
};

function toPalletLabelInput(row: Record<string, any>) {
  return {
    palletNo: row.palletNo,
    groupCode: row.groupCode,
    boxQty: row.boxQty,
    weight: row.weight,
    cbm: row.cbm,
    containerNo: detail.value?.containerNo,
    devanningNo: detail.value?.devanningNo || detail.value?.orderNo
  };
}

function exportPalletLabel(row: Record<string, any>) {
  printPalletLabel(toPalletLabelInput(row));
  window.$message?.success(`已打开板贴：${row.palletNo}`);
}

function exportAllPalletLabels() {
  const rows = detail.value?.pallets || [];
  printPalletLabels(rows.map((row: Record<string, any>) => toPalletLabelInput(row)));
}

const palletColumns = computed<DataTableColumns<Record<string, any>>>(() => [
  { title: '托盘号', key: 'palletNo', width: 140 },
  { title: '柜号', key: 'containerNo', width: 130, render: row => valueText(row.containerNo || detail.value?.containerNo) },
  {
    title: '订单号',
    key: 'cargoOrderNos',
    width: 180,
    ellipsis: { tooltip: true },
    render: row => valueText(row.cargoOrderNos || row.cargoOrderNo)
  },
  { title: '目的地', key: 'groupCode', width: 110, render: row => valueText(row.groupCode) },
  {
    title: '实际入库库位',
    key: 'actualInboundLocation',
    width: 120,
    render: row => valueText(row.actualInboundLocation)
  },
  { title: '箱数', key: 'boxQty', width: 72 },
  { title: '重量(kg)', key: 'weight', width: 90 },
  { title: '体积(cbm)', key: 'cbm', width: 90 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: row => PALLET_STATUS_LABEL[row.status] || row.status || '—'
  },
  {
    title: '操作',
    key: 'actions',
    width: 110,
    fixed: 'right',
    render: row => (
      <NButton text type="primary" size="small" onClick={() => exportPalletLabel(row)}>
        导出板贴
      </NButton>
    )
  }
]);

const mockFiles = [
  { name: 'DO.pdf', type: 'DO', uploadTime: '2026-05-25 10:00:00' },
  { name: '拆柜照片.jpg', type: '照片', uploadTime: '2026-05-25 16:20:00' }
];

function allowAction(code: string) {
  return isMockMode() || hasAuth(code);
}

function valueText(v: unknown) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function fmtDt(v?: string | null) {
  if (!v) return '—';
  return String(v).replace('T', ' ').slice(0, 19);
}

function fmtFee(v?: number | null) {
  if (v === null || v === undefined) return '—';
  return `$${Number(v).toFixed(2)}`;
}

const EXAM_STATUS_LABEL: Record<string, string> = {
  NONE: '无',
  EXAMINING: '查验中',
  EXAMINED: '查验完成'
};

function examStatusLabel(value?: string | null) {
  if (!value || value === 'NONE') return '无';
  return EXAM_STATUS_LABEL[value] || value;
}

function syncFeeFormFromDetail(data: Record<string, any>) {
  feeForm.value = {
    pickupFee: data.pickupFee ?? null,
    exceptionFee: data.exceptionFee ?? null,
    devanningFee: data.devanningFee ?? null,
    otherOperationFee: data.extraOperationFee ?? data.otherOperationFee ?? null,
    otherOperationFeeRemark: data.extraOperationFeeRemark || ''
  };
  deliveryFeeRows.value = (data.deliveryFeeAllocations || [])
    .filter((row: DeliveryFeeRow) => !row.cargoOrderNo?.trim() || isRowDeliveryFeeEligible(row))
    .map((row: DeliveryFeeRow, index: number) => ({
      ...row,
      id: row.id ?? index + 1
    }));
  deliveryFeeRowSeq = deliveryFeeRows.value.length + 1;
}

async function loadDetail() {
  if (!props.orderId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data, error } = await fetchGetDevanningOrderDetail(props.orderId);
  loading.value = false;
  if (error || !data) {
    detail.value = null;
    return;
  }
  detail.value = data as Record<string, any>;
  syncFeeFormFromDetail(detail.value);
}

function addDeliveryFeeRow() {
  if (!canManageDeliveryFee.value) {
    window.$message?.warning('关联订单派送后才可录入派送费用');
    return;
  }
  deliveryFeeRows.value.push({
    id: deliveryFeeRowSeq++,
    tripOrderNo: '',
    tripTotalFee: null,
    cargoOrderNo: '',
    orderCbm: null,
    allocatedFee: null,
    allocationBasis: '',
    remark: ''
  });
}

function resolveRowOrderCbm(row: DeliveryFeeRow): number {
  const direct = Number(row.orderCbm);
  if (direct > 0) return direct;
  const orderNo = row.cargoOrderNo?.trim();
  if (!orderNo) return 0;
  const cargo = (detail.value?.cargoOrders as Api.Oms.CargoOrder[] | undefined)?.find(
    item => item.cargoOrderNo === orderNo
  );
  return Number(cargo?.expectedCbm ?? cargo?.declaredCbm) || 0;
}

function removeDeliveryFeeRow(index: number) {
  deliveryFeeRows.value.splice(index, 1);
}

function autoAllocateDeliveryFees() {
  if (!canManageDeliveryFee.value) {
    window.$message?.warning('关联订单派送后才可分摊派送费用');
    return;
  }
  const validRows = deliveryFeeRows.value.filter(row => row.tripOrderNo?.trim());
  if (!validRows.length) {
    window.$message?.warning('请先填写车次订单号');
    return;
  }
  const notDispatched = validRows.find(row => row.cargoOrderNo?.trim() && !isRowDeliveryFeeEligible(row));
  if (notDispatched) {
    const cargo = findCargoOrder(notDispatched.cargoOrderNo);
    window.$message?.warning(
      `订单 ${notDispatched.cargoOrderNo} 尚未派送（当前：${fulfillmentStatusLabel(cargo?.fulfillmentStatus)}），不可分摊派送费`
    );
    return;
  }
  const missingFeeTrip = validRows.find(row => !row.tripTotalFee || Number(row.tripTotalFee) <= 0);
  if (missingFeeTrip) {
    window.$message?.warning(`请先填写车次 ${missingFeeTrip.tripOrderNo} 的总费用`);
    return;
  }

  const prepared = deliveryFeeRows.value.map(row => {
    if (!row.tripOrderNo?.trim()) return row;
    const orderCbm = resolveRowOrderCbm(row);
    return { ...row, orderCbm: orderCbm > 0 ? orderCbm : row.orderCbm };
  });

  const missingCbm = prepared.filter(
    row => row.tripOrderNo?.trim() && (!row.orderCbm || Number(row.orderCbm) <= 0)
  );
  if (missingCbm.length) {
    window.$message?.warning('请填写订单号与订单 CBM，或确保订单号可匹配关联订单方数');
    return;
  }

  deliveryFeeRows.value = allocateDeliveryFeeByCbm(prepared);
  window.$message?.success('已按车次总 CBM 分摊派送费用');
}

async function saveFees() {
  if (!detail.value?.id) return;
  const notDispatched = deliveryFeeRows.value.find(
    row => row.tripOrderNo?.trim() && row.cargoOrderNo?.trim() && !isRowDeliveryFeeEligible(row)
  );
  if (notDispatched) {
    window.$message?.warning(`订单 ${notDispatched.cargoOrderNo} 尚未派送，不可保存派送费用`);
    return;
  }
  const invalidTrip = deliveryFeeRows.value.find(row => row.tripOrderNo?.trim() && row.allocatedFee == null);
  if (invalidTrip) {
    window.$message?.warning(`请填写车次 ${invalidTrip.tripOrderNo} 的分摊费用`);
    return;
  }
  feeSaving.value = true;
  const { data, error } = await fetchSaveDevanningOrderFees(detail.value.id, {
    pickupFee: feeForm.value.pickupFee,
    exceptionFee: feeForm.value.exceptionFee,
    devanningFee: feeForm.value.devanningFee,
    otherOperationFee: feeForm.value.otherOperationFee,
    otherOperationFeeRemark: feeForm.value.otherOperationFeeRemark || null,
    deliveryFeeAllocations: deliveryFeeRows.value
      .filter(row => row.tripOrderNo?.trim() && (!row.cargoOrderNo?.trim() || isRowDeliveryFeeEligible(row)))
      .map(row => ({
        ...row,
        tripOrderNo: row.tripOrderNo.trim(),
        allocationBasis: row.allocationBasis || null,
        remark: row.remark || null
      }))
  });
  feeSaving.value = false;
  if (error || !data) {
    window.$message?.warning('费用保存失败');
    return;
  }
  detail.value = data as Record<string, any>;
  syncFeeFormFromDetail(detail.value);
  window.$message?.success('费用已保存');
  emit('updated');
}

async function runAction(
  fn: () => Promise<{ error: unknown } | null>,
  successMsg: string
) {
  actionLoading.value = true;
  const res = await fn();
  actionLoading.value = false;
  if (res?.error) {
    window.$message?.warning((res.error as Error)?.message || '操作失败');
    return;
  }
  window.$message?.success(successMsg);
  await loadDetail();
  emit('updated');
}

function handleConfirmPickup() {
  if (!detail.value?.id) return;
  runAction(() => fetchConfirmPickupDevanningOrder(detail.value!.id), '确认提柜成功');
}
function handleConfirmArrival() {
  if (!detail.value?.id) return;
  runAction(() => fetchConfirmArrivalDevanningOrder(detail.value!.id), '到仓登记成功');
}
function handleStartDevanning() {
  if (!detail.value?.id) return;
  runAction(() => fetchStartDevanningOrder(detail.value!.id), '开始拆柜成功');
}
function handleCompleteDevanning() {
  if (!detail.value?.id) return;
  runAction(() => fetchCompleteDevanningOrder(detail.value!.id), '拆柜完成成功');
}
function handleMarkException() {
  if (!detail.value?.id) return;
  runAction(() => fetchMarkExceptionDevanningOrder(detail.value!.id), '已常标记成功');
}
function handleClearException() {
  if (!detail.value?.id) return;
  runAction(() => fetchClearExceptionDevanningOrder(detail.value!.id), '已常已除成功');
}
function handleCancel() {
  if (!detail.value?.id) return;
  runAction(() => fetchCancelDevanningOrder(detail.value!.id), '取消成功');
}

watch(visible, async val => {
  if (!val) return;
  activeTab.value = props.initialTab || 'basic';
  await loadDetail();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1360" class="max-w-98%">
    <NDrawerContent :title="'拆柜订单详情'" :native-scrollbar="false" closable class="oms-detail-drawer">
      <NSpin :show="loading">
        <NEmpty v-if="!detail" description="暂无详情" />
        <div v-else class="flex-col gap-16px">
          <div class="flex flex-wrap items-center justify-between gap-12px">
            <NSpace align="center">
              <span class="text-22px font-semibold">拆柜订单详情</span>
              <span class="text-#4b5563">拆柜单号：{{ detail.devanningNo || detail.orderNo }}</span>
              <span class="text-#4b5563">柜号：{{ detail.containerNo }}</span>
              <NTag v-if="detail.doAttachmentCount" type="primary" size="small">DO</NTag>
              <NTag :type="STATUS_TAG[detail.status] || 'default'" size="small">
                {{ STATUS_LABEL[detail.status] || detail.status }}
              </NTag>
            </NSpace>
            <NSpace>
              <NButton
                v-if="allowAction('wms:devanningOrder:confirmPickup') && detail.status === 'UNPICKEDUP'"
                :loading="actionLoading"
                @click="handleConfirmPickup"
              >确认提柜</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:confirmArrival') && detail.status === 'PICKEDUP'"
                :loading="actionLoading"
                @click="handleConfirmArrival"
              >到仓登记</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:startDevanning') && detail.status === 'ARRIVED'"
                :loading="actionLoading"
                @click="handleStartDevanning"
              >开始拆柜</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:completeDevanning') && detail.status === 'DEVANNING'"
                type="primary"
                :loading="actionLoading"
                @click="handleCompleteDevanning"
              >拆柜完成</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:markException') && !['DEVANNED', 'CANCELLED', 'EXCEPTION'].includes(detail.status)"
                :loading="actionLoading"
                @click="handleMarkException"
              >标记异常</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:clearException') && detail.status === 'EXCEPTION'"
                :loading="actionLoading"
                @click="handleClearException"
              >解除异常</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:cancel') && !['DEVANNED', 'CANCELLED'].includes(detail.status)"
                :loading="actionLoading"
                @click="handleCancel"
              >取消</NButton>
            </NSpace>
          </div>

          <NCard size="small" :bordered="true">
            <NSteps :current="currentStep" size="small" status="process">
              <NStep v-for="item in STATUS_STEPS" :key="item.value" :title="item.label" />
            </NSteps>
          </NCard>

          <NTabs v-model:value="activeTab" type="line" animated>
            <NTabPane name="basic" tab="基础信息">
              <NGrid :cols="4" :x-gap="14" :y-gap="14" item-responsive responsive="screen" class="mt-8px">
                <NGridItem>
                  <NCard title="系统信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="拆柜单号：">{{ detail.devanningNo }}</NDescriptionsItem>
                      <NDescriptionsItem label="来源单号">{{ valueText(detail.sourceOrderNo) }}</NDescriptionsItem>
                      <NDescriptionsItem label="来源类型">{{ valueText(detail.sourceOrderType) }}</NDescriptionsItem>
                      <NDescriptionsItem label="创建时间">{{ fmtDt(detail.createTime) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="业务归属" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="客户">{{ valueText(detail.customerName) }}</NDescriptionsItem>
                      <NDescriptionsItem label="渠道">{{ valueText(detail.channelName) }}</NDescriptionsItem>
                      <NDescriptionsItem label="客服">{{ valueText(detail.customerServiceName) }}</NDescriptionsItem>
                      <NDescriptionsItem label="仓库">{{ valueText(detail.warehouseName) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="拆柜信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="柜号：">{{ detail.containerNo }}</NDescriptionsItem>
                      <NDescriptionsItem label="海柜单号">{{ valueText(detail.sourceOrderNo) }}</NDescriptionsItem>
                      <NDescriptionsItem label="关联订单号">{{ relatedOrderNos }}</NDescriptionsItem>
                      <NDescriptionsItem label="拆柜方式">{{ METHOD_LABEL[detail.devanningMethod] || detail.devanningMethod }}</NDescriptionsItem>
                      <NDescriptionsItem label="Dock">{{ valueText(detail.dockCode) }}</NDescriptionsItem>
                      <NDescriptionsItem label="总箱数">{{ valueText(detail.totalBoxQty) }}</NDescriptionsItem>
                      <NDescriptionsItem label="总重量">{{ detail.totalWeight != null ? `${detail.totalWeight} KG` : '—' }}</NDescriptionsItem>
                      <NDescriptionsItem label="总体积">{{ detail.totalCbm != null ? `${detail.totalCbm} CBM` : '—' }}</NDescriptionsItem>
                      <NDescriptionsItem label="已入库箱">{{ valueText(detail.inboundedBoxQty) }}</NDescriptionsItem>
                      <NDescriptionsItem label="已入库板">{{ valueText(detail.inboundedPalletQty) }}</NDescriptionsItem>
                      <NDescriptionsItem label="查验状态">{{ examStatusLabel(detail.examStatus) }}</NDescriptionsItem>
                      <NDescriptionsItem label="预排车数">{{ valueText(detail.plannedTruckQty) }}</NDescriptionsItem>
                      <NDescriptionsItem label="预排方数">{{ detail.plannedCbm != null ? detail.plannedCbm : '—' }}</NDescriptionsItem>
                      <NDescriptionsItem label="附件">{{ detail.attachmentCount ? `${detail.attachmentCount}个` : '—' }}</NDescriptionsItem>
                      <NDescriptionsItem label="拆柜轮次">{{ valueText(detail.devanningRound) }}</NDescriptionsItem>
                      <NDescriptionsItem label="费用合计">{{ fmtFee(detail.feeTotal) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="时间与进度" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="ETA到仓">{{ fmtDt(detail.etaWarehouseTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="预计拆柜">{{ fmtDt(detail.plannedDevanningTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="提柜时间">{{ fmtDt(detail.pickupTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="实际到仓">{{ fmtDt(detail.actualArrivalTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="拆柜开始">{{ fmtDt(detail.devanningStartTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="拆柜完成">{{ fmtDt(detail.devanningFinishTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="入库进度">
                        <NTag type="warning" size="small">{{ progressPercent }}%</NTag>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
              </NGrid>
            </NTabPane>

            <NTabPane name="cargo" tab="关联订单">
              <NCard size="small" class="mt-8px">
                <div class="mb-8px text-12px text-#9ca3af">
                  与海柜订单详情一致，数据来自关联海柜 {{ detail.sourceOrderNo || '—' }}；点击订单号可查看详情
                </div>
                <NDataTable
                  v-if="(detail.cargoOrders || []).length"
                  :columns="cargoColumns"
                  :data="detail.cargoOrders || []"
                  :pagination="false"
                  :row-key="(row: Api.Oms.CargoOrder) => String(row.id)"
                  :scroll-x="4540"
                  size="small"
                />
                <NEmpty v-else description="未关联海柜订单或暂无订单" class="py-24px" />
              </NCard>
            </NTabPane>

            <NTabPane name="pallet" tab="托盘信息">
              <NCard size="small" class="mt-8px" title="柜号与订单">
                <template #header-extra>
                  <NButton
                    size="small"
                    type="primary"
                    :disabled="!(detail.pallets || []).length"
                    @click="exportAllPalletLabels"
                  >
                    批量导出板贴
                  </NButton>
                </template>
                <NDescriptions bordered :column="3" size="small" label-placement="left" class="mb-12px">
                  <NDescriptionsItem label="柜号">{{ valueText(detail.containerNo) }}</NDescriptionsItem>
                  <NDescriptionsItem label="海柜单号">{{ valueText(detail.sourceOrderNo) }}</NDescriptionsItem>
                  <NDescriptionsItem label="关联订单号">{{ relatedOrderNos }}</NDescriptionsItem>
                </NDescriptions>
                <NDataTable
                  :columns="palletColumns"
                  :data="detail.pallets || []"
                  :pagination="false"
                  :scroll-x="1080"
                  size="small"
                />
                <NEmpty v-if="!(detail.pallets || []).length" description="暂无托盘数据" class="py-24px" />
              </NCard>
            </NTabPane>

            <NTabPane name="trace" tab="时间节点">
              <NTimeline class="mt-12px">
                <NTimelineItem
                  v-for="trace in detail.traces || []"
                  :key="trace.id"
                  :title="trace.actionDesc || trace.action"
                  :content="(trace.statusFrom && trace.statusTo) ? (STATUS_LABEL[trace.statusFrom] || trace.statusFrom) + ' -> ' + (STATUS_LABEL[trace.statusTo] || trace.statusTo) : ''"
                  :time="trace.createTime"
                />
              </NTimeline>
            </NTabPane>

            <NTabPane name="fees" tab="费用录入">
              <NCard size="small" class="mt-8px" title="基础费用">
                <NForm label-placement="left" label-width="120" :show-feedback="false">
                  <div class="grid grid-cols-1 gap-12px md:grid-cols-2 xl:grid-cols-3">
                    <NFormItem label="提柜费用">
                      <NInputNumber v-model:value="feeForm.pickupFee" :min="0" :precision="2" class="w-full" placeholder="USD">
                        <template #suffix>$</template>
                      </NInputNumber>
                    </NFormItem>
                    <NFormItem label="异常费用">
                      <NInputNumber v-model:value="feeForm.exceptionFee" :min="0" :precision="2" class="w-full" placeholder="USD">
                        <template #suffix>$</template>
                      </NInputNumber>
                    </NFormItem>
                    <NFormItem label="拆柜费用">
                      <NInputNumber v-model:value="feeForm.devanningFee" :min="0" :precision="2" class="w-full" placeholder="USD">
                        <template #suffix>$</template>
                      </NInputNumber>
                    </NFormItem>
                    <NFormItem label="其他操作费用">
                      <NInputNumber v-model:value="feeForm.otherOperationFee" :min="0" :precision="2" class="w-full" placeholder="USD">
                        <template #suffix>$</template>
                      </NInputNumber>
                    </NFormItem>
                    <NFormItem label="其他费用备注" class="md:col-span-2 xl:col-span-2">
                      <NInput
                        v-model:value="feeForm.otherOperationFeeRemark"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 4 }"
                        placeholder="填写其他操作费用原因备注"
                      />
                    </NFormItem>
                  </div>
                </NForm>
              </NCard>

              <NCard size="small" class="mt-12px" title="派送费用（按车次 CBM 分摊至订单）">
                <template #header-extra>
                  <NSpace>
                    <NButton size="small" :disabled="!canManageDeliveryFee" @click="addDeliveryFeeRow">新增分摊行</NButton>
                    <NButton
                      size="small"
                      type="primary"
                      :disabled="!canManageDeliveryFee"
                      @click="autoAllocateDeliveryFees"
                    >
                      按 CBM 分摊
                    </NButton>
                  </NSpace>
                </template>
                <p v-if="!canManageDeliveryFee" class="mb-10px text-12px text-#d97706">
                  关联订单派送后才会产生派送费用；当前无已派送订单（需状态为派送中 / 已签收及之后）。
                </p>
                <p v-else class="mb-10px text-12px text-gray-500">
                  仅已派送订单可计费。同一车次填写相同「车次总费用」；每行填写订单号与订单 CBM，按 订单CBM ÷ 车次总CBM 分摊。
                  可计费订单：{{ dispatchedCargoOrders.map(o => o.cargoOrderNo).join('、') }}
                </p>
                <div v-if="canManageDeliveryFee && deliveryFeeRows.length" class="flex flex-col gap-10px">
                  <div
                    v-for="(row, index) in deliveryFeeRows"
                    :key="String(row.id ?? index)"
                    class="grid grid-cols-1 gap-10px border border-#e5e7eb rounded-8px p-12px md:grid-cols-8"
                  >
                    <NFormItem label="车次订单号" label-placement="top" class="md:col-span-2">
                      <NInput v-model:value="row.tripOrderNo" placeholder="如 TRIP250604001" />
                    </NFormItem>
                    <NFormItem label="车次总费用" label-placement="top">
                      <NInputNumber v-model:value="row.tripTotalFee" :min="0" :precision="2" class="w-full" />
                    </NFormItem>
                    <NFormItem label="订单号" label-placement="top" class="md:col-span-2">
                      <NInput v-model:value="row.cargoOrderNo" placeholder="如 CO-2026-0001" />
                    </NFormItem>
                    <NFormItem label="订单 CBM" label-placement="top">
                      <NInputNumber v-model:value="row.orderCbm" :min="0" :precision="3" class="w-full" />
                    </NFormItem>
                    <NFormItem label="分摊费用" label-placement="top">
                      <NInputNumber v-model:value="row.allocatedFee" :min="0" :precision="2" class="w-full" />
                    </NFormItem>
                    <NFormItem label="分摊依据" label-placement="top" class="md:col-span-8">
                      <NInput v-model:value="row.allocationBasis" placeholder="如 按CBM分摊 12.5/68.5 CBM" />
                    </NFormItem>
                    <div class="flex items-end justify-end md:col-span-6">
                      <NButton size="small" quaternary type="error" @click="removeDeliveryFeeRow(index)">删除</NButton>
                    </div>
                  </div>
                </div>
                <NEmpty
                  v-else-if="canManageDeliveryFee"
                  description="暂无派送费用分摊，可点击「新增分摊行」"
                  class="py-20px"
                />
                <NDivider v-if="canManageDeliveryFee" class="my-12px" />
                <NDescriptions v-if="canManageDeliveryFee" :column="3" label-placement="left" size="small">
                  <NDescriptionsItem label="派送费用小计">{{ fmtFee(deliveryFeeTotal) }}</NDescriptionsItem>
                  <NDescriptionsItem label="费用总计">{{ fmtFee(feeGrandTotal) }}</NDescriptionsItem>
                  <NDescriptionsItem label="已保存合计">{{ fmtFee(detail.feeTotal) }}</NDescriptionsItem>
                </NDescriptions>
              </NCard>

              <div class="mt-12px flex justify-end">
                <NButton type="primary" :loading="feeSaving" @click="saveFees">保存费用</NButton>
              </div>
            </NTabPane>

            <NTabPane name="exception" tab="异常信息">
              <NCard title="异常概况" size="small" class="mt-8px exception-info-card">
                <NDescriptions :column="1" v-bind="DESC_PROPS">
                  <NDescriptionsItem label="异常标记">
                    <NTag :type="detail.exceptionFlag ? 'error' : 'success'" size="small">{{ detail.exceptionFlag ? '是' : '否' }}</NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="异常次数">{{ detail.exceptionCount || 0 }}</NDescriptionsItem>
                  <NDescriptionsItem label="备注">{{ valueText(detail.remark) }}</NDescriptionsItem>
                </NDescriptions>
              </NCard>
            </NTabPane>

            <NTabPane name="files" :tab="'文件管理 (' + (detail.attachmentCount || 0) + ')'">
              <NCard size="small" class="mt-8px">
                <NDataTable
                  :columns="[
                    { title: '文件名', key: 'name' },
                    { title: '类型', key: 'type', width: 100 },
                    { title: '上传时间', key: 'uploadTime', width: 160 }
                  ]"
                  :data="mockFiles"
                  :pagination="false"
                  size="small"
                />
                <div class="mt-8px text-12px text-#9ca3af">* 与海柜订单附件联用一致（原型占位）</div>
              </NCard>
            </NTabPane>
          </NTabs>
        </div>
      </NSpin>
    </NDrawerContent>
  </NDrawer>

  <CargoOrderDetailDrawer v-model:visible="cargoDetailVisible" :order-id="viewingCargoId" />
</template>
