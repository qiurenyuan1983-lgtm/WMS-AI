/**
 * WMS devanning detail drawer (reference OMS container-order-detail-drawer).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...codes) => codes.map(c => String.fromCharCode(c)).join('');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src/views/wms/devanning-order/modules/devanning-order-detail-drawer.vue');

const content = `<script setup lang="ts">
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
  { value: 'UNPICKEDUP', label: '${u(0x672a, 0x63d0, 0x67dc)}' },
  { value: 'PICKEDUP', label: '${u(0x5df2, 0x63d0, 0x67dc)}' },
  { value: 'ARRIVED', label: '${u(0x5df2, 0x5230, 0x4ed3)}' },
  { value: 'DEVANNING', label: '${u(0x62c6, 0x67dc, 0x4e2d)}' },
  { value: 'DEVANNED', label: '${u(0x62c6, 0x67dc, 0x5b8c, 0x6210)}' }
] as const;

const STATUS_LABEL: Record<string, string> = {
  UNPICKEDUP: '${u(0x672a, 0x63d0, 0x67dc)}',
  PICKEDUP: '${u(0x5df2, 0x63d0, 0x67dc)}',
  ARRIVED: '${u(0x5df2, 0x5230, 0x4ed3)}',
  DEVANNING: '${u(0x62c6, 0x67dc, 0x4e2d)}',
  DEVANNED: '${u(0x62c6, 0x67dc, 0x5b8c, 0x6210)}',
  EXCEPTION: '${u(0x5f02, 0x5e38)}',
  CANCELLED: '${u(0x53d6, 0x6d88)}'
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
  MANUAL: '${u(0x4eba, 0x5de5)}',
  FORKLIFT: '${u(0x53c9, 0x8f66)}',
  MACHINE: '${u(0x673a, 0x68b0)}'
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

const shipmentColumns = [
  { title: 'SO', key: 'so', width: 120 },
  { title: 'Shipment', key: 'shipment', width: 140 },
  { title: '${u(0x7bb1, 0x6570)}', key: 'boxQty', width: 80 },
  { title: '${u(0x91cd, 0x91cf)}', key: 'weight', width: 90 },
  { title: '${u(0x4f53, 0x79ef)}', key: 'cbm', width: 80 }
];

const palletColumns = [
  { title: '${u(0x6258, 0x76d8, 0x53f7)}', key: 'palletNo', width: 140 },
  { title: '${u(0x7bb1, 0x6570)}', key: 'boxQty', width: 80 },
  { title: '${u(0x91cd, 0x91cf)}', key: 'weight', width: 90 },
  { title: '${u(0x4f53, 0x79ef)}', key: 'cbm', width: 80 },
  { title: '${u(0x72b6, 0x6001)}', key: 'status', width: 100 }
];

const mockFiles = [
  { name: 'DO.pdf', type: 'DO', uploadTime: '2026-05-25 10:00:00' },
  { name: '${u(0x62c6, 0x67dc, 0x7167, 0x7247)}.jpg', type: '${u(0x7167, 0x7247)}', uploadTime: '2026-05-25 16:20:00' }
];

function allowAction(code: string) {
  return isMockMode() || hasAuth(code);
}

function valueText(v: unknown) {
  if (v === null || v === undefined || v === '') return '${u(0x2014)}';
  return String(v);
}

function fmtDt(v?: string | null) {
  if (!v) return '${u(0x2014)}';
  return String(v).replace('T', ' ').slice(0, 19);
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
    window.$message?.warning((res.error as Error)?.message || '${u(0x64cd, 0x4f5c, 0x5931, 0x8d25)}');
    return;
  }
  window.$message?.success(successMsg);
  await loadDetail();
  emit('updated');
}

function handleConfirmPickup() {
  if (!detail.value?.id) return;
  runAction(() => fetchConfirmPickupDevanningOrder(detail.value!.id), '${u(0x786e, 0x8ba4, 0x63d0, 0x67dc, 0x6210, 0x529f)}');
}
function handleConfirmArrival() {
  if (!detail.value?.id) return;
  runAction(() => fetchConfirmArrivalDevanningOrder(detail.value!.id), '${u(0x5230, 0x4ed3, 0x767b, 0x8bb0, 0x6210, 0x529f)}');
}
function handleStartDevanning() {
  if (!detail.value?.id) return;
  runAction(() => fetchStartDevanningOrder(detail.value!.id), '${u(0x5f00, 0x59cb, 0x62c6, 0x67dc, 0x6210, 0x529f)}');
}
function handleCompleteDevanning() {
  if (!detail.value?.id) return;
  runAction(() => fetchCompleteDevanningOrder(detail.value!.id), '${u(0x62c6, 0x67dc, 0x5b8c, 0x6210, 0x6210, 0x529f)}');
}
function handleMarkException() {
  if (!detail.value?.id) return;
  runAction(() => fetchMarkExceptionDevanningOrder(detail.value!.id), '${u(0x5df2, 0x5e38, 0x6807, 0x8bb0, 0x6210, 0x529f)}');
}
function handleClearException() {
  if (!detail.value?.id) return;
  runAction(() => fetchClearExceptionDevanningOrder(detail.value!.id), '${u(0x5df2, 0x5e38, 0x5df2, 0x9664, 0x6210, 0x529f)}');
}
function handleCancel() {
  if (!detail.value?.id) return;
  runAction(() => fetchCancelDevanningOrder(detail.value!.id), '${u(0x53d6, 0x6d88, 0x6210, 0x529f)}');
}

watch(visible, async val => {
  if (!val) return;
  activeTab.value = props.initialTab || 'basic';
  await loadDetail();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1360" class="max-w-98%">
    <NDrawerContent :title="'${u(0x62c6, 0x67dc, 0x8ba2, 0x5355, 0x8be6, 0x60c5)}'" :native-scrollbar="false" closable class="oms-detail-drawer">
      <NSpin :show="loading">
        <NEmpty v-if="!detail" description="${u(0x6682, 0x65e0, 0x8be6, 0x60c5)}" />
        <div v-else class="flex-col gap-16px">
          <div class="flex flex-wrap items-center justify-between gap-12px">
            <NSpace align="center">
              <span class="text-22px font-semibold">${u(0x62c6, 0x67dc, 0x8ba2, 0x5355, 0x8be6, 0x60c5)}</span>
              <span class="text-#4b5563">${u(0x62c6, 0x67dc, 0x5355, 0x53f7)}£º{{ detail.devanningNo || detail.orderNo }}</span>
              <span class="text-#4b5563">${u(0x67dc, 0x53f7)}£º{{ detail.containerNo }}</span>
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
              >${u(0x786e, 0x8ba4, 0x63d0, 0x67dc)}</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:confirmArrival') && detail.status === 'PICKEDUP'"
                :loading="actionLoading"
                @click="handleConfirmArrival"
              >${u(0x5230, 0x4ed3, 0x767b, 0x8bb0)}</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:startDevanning') && detail.status === 'ARRIVED'"
                :loading="actionLoading"
                @click="handleStartDevanning"
              >${u(0x5f00, 0x59cb, 0x62c6, 0x67dc)}</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:completeDevanning') && detail.status === 'DEVANNING'"
                type="primary"
                :loading="actionLoading"
                @click="handleCompleteDevanning"
              >${u(0x62c6, 0x67dc, 0x5b8c, 0x6210)}</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:markException') && !['DEVANNED', 'CANCELLED', 'EXCEPTION'].includes(detail.status)"
                :loading="actionLoading"
                @click="handleMarkException"
              >${u(0x6807, 0x8bb0, 0x5f02, 0x5e38)}</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:clearException') && detail.status === 'EXCEPTION'"
                :loading="actionLoading"
                @click="handleClearException"
              >${u(0x89e3, 0x9664, 0x5f02, 0x5e38)}</NButton>
              <NButton
                v-if="allowAction('wms:devanningOrder:cancel') && !['DEVANNED', 'CANCELLED'].includes(detail.status)"
                :loading="actionLoading"
                @click="handleCancel"
              >${u(0x53d6, 0x6d88)}</NButton>
            </NSpace>
          </div>

          <NCard size="small" :bordered="true">
            <NSteps :current="currentStep" size="small" status="process">
              <NStep v-for="item in STATUS_STEPS" :key="item.value" :title="item.label" />
            </NSteps>
          </NCard>

          <NTabs v-model:value="activeTab" type="line" animated>
            <NTabPane name="basic" tab="${u(0x57fa, 0x7840, 0x4fe1, 0x606f)}">
              <NGrid :cols="4" :x-gap="14" :y-gap="14" item-responsive responsive="screen" class="mt-8px">
                <NGridItem>
                  <NCard title="${u(0x7cfb, 0x7edf, 0x4fe1, 0x606f)}" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="${u(0x62c6, 0x67dc, 0x5355, 0x53f7)}">{{ detail.devanningNo }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x6765, 0x6e90, 0x5355, 0x53f7)}">{{ valueText(detail.sourceOrderNo) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x6765, 0x6e90, 0x7c7b, 0x578b)}">{{ valueText(detail.sourceOrderType) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x521b, 0x5efa, 0x65f6, 0x95f4)}">{{ fmtDt(detail.createTime) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="${u(0x4e1a, 0x52a1, 0x5f52, 0x5c5e)}" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="${u(0x5ba2, 0x6237)}">{{ valueText(detail.customerName) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x6e20, 0x9053)}">{{ valueText(detail.channelName) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x5ba2, 0x670d)}">{{ valueText(detail.customerServiceName) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x4ed3, 0x5e93)}">{{ valueText(detail.warehouseName) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="${u(0x62c6, 0x67dc, 0x4fe1, 0x606f)}" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="${u(0x67dc, 0x53f7)}">{{ detail.containerNo }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x62c6, 0x67dc, 0x65b9, 0x5f0f)}">{{ METHOD_LABEL[detail.devanningMethod] || detail.devanningMethod }}</NDescriptionsItem>
                      <NDescriptionsItem label="Dock">{{ valueText(detail.dockCode) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x603b, 0x7bb1, 0x6570)}">{{ valueText(detail.totalBoxQty) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x5df2, 0x5165, 0x5e93, 0x7bb1)}">{{ valueText(detail.inboundedBoxQty) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="${u(0x65f6, 0x95f4, 0x4e0e, 0x8fdb, 0x5ea6)}" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="ETA${u(0x5230, 0x4ed3)}">{{ fmtDt(detail.etaWarehouseTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x63d0, 0x67dc, 0x65f6, 0x95f4)}">{{ fmtDt(detail.pickupTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x5b9e, 0x9645, 0x5230, 0x4ed3)}">{{ fmtDt(detail.actualArrivalTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x62c6, 0x67dc, 0x5f00, 0x59cb)}">{{ fmtDt(detail.devanningStartTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x62c6, 0x67dc, 0x5b8c, 0x6210)}">{{ fmtDt(detail.devanningFinishTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="${u(0x5165, 0x5e93, 0x8fdb, 0x5ea6)}">
                        <NTag type="warning" size="small">{{ progressPercent }}%</NTag>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
              </NGrid>
            </NTabPane>

            <NTabPane name="cargo" tab="${u(0x8d27, 0x4ef6, 0x4fe1, 0x606f)}">
              <NCard size="small" class="mt-8px">
                <div class="mb-8px text-12px text-#9ca3af">${u(0x5173, 0x8054, 0x8d27, 0x4ef6, 0x660e, 0x7ec6, 0xff08, 0x539f, 0x578b, 0x5360, 0x4f4d, 0xff09)}</div>
                <NDataTable
                  :columns="shipmentColumns"
                  :data="detail.shipments || []"
                  :pagination="false"
                  size="small"
                />
              </NCard>
            </NTabPane>

            <NTabPane name="pallet" tab="${u(0x6258, 0x76d8, 0x4fe1, 0x606f)}">
              <NCard size="small" class="mt-8px">
                <NDataTable
                  :columns="palletColumns"
                  :data="detail.pallets || []"
                  :pagination="false"
                  size="small"
                />
              </NCard>
            </NTabPane>

            <NTabPane name="trace" tab="${u(0x65f6, 0x95f4, 0x8282, 0x70b9)}">
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

            <NTabPane name="exception" tab="${u(0x5f02, 0x5e38, 0x4fe1, 0x606f)}">
              <NDescriptions :column="3" label-placement="left" bordered class="mt-8px">
                <NDescriptionsItem label="${u(0x5f02, 0x5e38, 0x6807, 0x8bb0)}">
                  <NTag :type="detail.exceptionFlag ? 'error' : 'success'" size="small">{{ detail.exceptionFlag ? '${u(0x662f)}' : '${u(0x5426)}' }}</NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="${u(0x5f02, 0x5e38, 0x6b21, 0x6570)}">{{ detail.exceptionCount || 0 }}</NDescriptionsItem>
                <NDescriptionsItem label="${u(0x5907, 0x6ce8)}">{{ valueText(detail.remark) }}</NDescriptionsItem>
              </NDescriptions>
            </NTabPane>

            <NTabPane name="files" :tab="'${u(0x6587, 0x4ef6, 0x7ba1, 0x7406)} (' + (detail.attachmentCount || 0) + ')'">
              <NCard size="small" class="mt-8px">
                <NDataTable
                  :columns="[
                    { title: '${u(0x6587, 0x4ef6, 0x540d)}', key: 'name' },
                    { title: '${u(0x7c7b, 0x578b)}', key: 'type', width: 100 },
                    { title: '${u(0x4e0a, 0x4f20, 0x65f6, 0x95f4)}', key: 'uploadTime', width: 160 }
                  ]"
                  :data="mockFiles"
                  :pagination="false"
                  size="small"
                />
                <div class="mt-8px text-12px text-#9ca3af">* ${u(0x4e0e, 0x6d77, 0x67dc, 0x8ba2, 0x5355, 0x9644, 0x4ef6, 0x8054, 0x7528, 0x4e00, 0x81f4, 0xff08, 0x539f, 0x578b, 0x5360, 0x4f4d, 0xff09)}</div>
              </NCard>
            </NTabPane>
          </NTabs>
        </div>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, content, 'utf8');
console.log('wrote', out);
