<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NGrid,
  NGridItem,
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
  fetchStartDevanningOrder
} from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import CargoOrderDetailDrawer from '@/views/oms/cargo-order/modules/cargo-order-detail-drawer.vue';
import { useContainerCargoTableColumns } from '@/views/oms/container-order/composables/use-container-cargo-table-columns';

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
    window.$message?.warning('货物订单不存在');
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

const palletColumns = [
  { title: '托盘号', key: 'palletNo', width: 140 },
  { title: '箱数', key: 'boxQty', width: 80 },
  { title: '重量', key: 'weight', width: 90 },
  { title: '体积', key: 'cbm', width: 80 },
  { title: '状态', key: 'status', width: 100 }
];

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

const EXAM_STATUS_LABEL: Record<string, string> = {
  NONE: '无',
  EXAMINING: '查验中',
  EXAMINED: '查验完成'
};

function examStatusLabel(value?: string | null) {
  if (!value || value === 'NONE') return '无';
  return EXAM_STATUS_LABEL[value] || value;
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

            <NTabPane name="cargo" tab="关联货物订单">
              <NCard size="small" class="mt-8px">
                <div class="mb-8px text-12px text-#9ca3af">
                  与海柜订单详情一致，数据来自关联海柜 {{ detail.sourceOrderNo || '—' }}；点击货物订单号可查看详情
                </div>
                <NDataTable
                  v-if="(detail.cargoOrders || []).length"
                  :columns="cargoColumns"
                  :data="detail.cargoOrders || []"
                  :pagination="false"
                  :row-key="(row: Api.Oms.CargoOrder) => String(row.id)"
                  :scroll-x="4300"
                  size="small"
                />
                <NEmpty v-else description="未关联海柜订单或暂无货物订单" class="py-24px" />
              </NCard>
            </NTabPane>

            <NTabPane name="pallet" tab="托盘信息">
              <NCard size="small" class="mt-8px">
                <NDataTable
                  :columns="palletColumns"
                  :data="detail.pallets || []"
                  :pagination="false"
                  size="small"
                />
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

            <NTabPane name="exception" tab="异常信息">
              <NDescriptions :column="3" label-placement="left" bordered class="mt-8px">
                <NDescriptionsItem label="异常标记">
                  <NTag :type="detail.exceptionFlag ? 'error' : 'success'" size="small">{{ detail.exceptionFlag ? '是' : '否' }}</NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="异常次数">{{ detail.exceptionCount || 0 }}</NDescriptionsItem>
                <NDescriptionsItem label="备注">{{ valueText(detail.remark) }}</NDescriptionsItem>
              </NDescriptions>
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
