<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NDrawer,
  NDrawerContent,
  NSpace,
  NSpin,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchCompleteOutboundOrder, fetchGetOutboundOrderItems } from '@/service/api/oms/outbound-order';
import { displayAppointmentNo } from '@/utils/oms/appointment-no';
import AttachmentManager from '../../components/attachment-manager.vue';
import OutboundAddCargoModal from './outbound-add-cargo-modal.vue';

defineOptions({ name: 'OutboundOrderDetailModal' });

const ADD_CARGO_ALLOWED = new Set([
  'PENDING_DISPATCH',
  'RECOMMENDED',
  'PENDING_DISPATCH_CONFIRM',
  'PENDING_SUPPLIER',
  'PENDING_DRIVER',
  'PENDING_CHECKIN',
  'PENDING_DOCK',
  'PENDING_LOADING',
  'LOADING'
]);

const props = defineProps<{
  row: Api.Oms.OutboundOrder | null;
  initTab?: 'basic' | 'cargo' | 'files';
}>();

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ (e: 'refreshed'): void }>();

const activeTab = ref<'basic' | 'cargo' | 'files'>('basic');
const itemsLoading = ref(false);
const items = ref<Api.Oms.OutboundOrderItem[]>([]);
const completing = ref(false);
const addCargoVisible = ref(false);

const STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING_DISPATCH: { label: '待排车', type: 'default' },
  RECOMMENDED: { label: '已推荐车次', type: 'info' },
  PENDING_DISPATCH_CONFIRM: { label: '待调度确认', type: 'info' },
  PENDING_SUPPLIER: { label: '待供应商接单', type: 'warning' },
  PENDING_DRIVER: { label: '待司机确认', type: 'warning' },
  PENDING_CHECKIN: { label: '待司机 Check In', type: 'warning' },
  PENDING_DOCK: { label: '待分配 DOCK', type: 'warning' },
  PENDING_LOADING: { label: '待装车', type: 'info' },
  LOADING: { label: '装车中', type: 'primary' },
  LOADED: { label: '装车完成', type: 'success' },
  DEPARTED: { label: '已发车', type: 'success' },
  IN_TRANSIT: { label: '派送中', type: 'info' },
  SIGNED: { label: '已签收', type: 'success' },
  COMPLETED: { label: '已完成', type: 'success' },
  CLOSED_EXCEPTION: { label: '异常关闭', type: 'error' },
  CREATED: { label: '已创建', type: 'default' },
  APPOINTMENT_CONFIRMED: { label: '已确认预约', type: 'info' },
  OUTBOUNDED: { label: '已装车', type: 'warning' },
  ARRIVED: { label: '已到达', type: 'info' },
  POD_UPLOADED: { label: 'POD已上传', type: 'success' }
};

const isCompleted = computed(() => props.row?.outboundStatus === 'COMPLETED');
const canAddCargo = computed(
  () => props.row != null && ADD_CARGO_ALLOWED.has(props.row.outboundStatus)
);

const itemColumns = [
  { key: 'cargoOrderNo', title: '运单号', minWidth: 150 },
  {
    key: 'appointmentNo',
    title: '预约号',
    width: 130,
    render: (row: Api.Oms.OutboundOrderItem) =>
      displayAppointmentNo(row.appointmentNo, { platformName: row.platformName }, '—')
  },
  { key: 'customerName', title: '客户', minWidth: 110, ellipsis: { tooltip: true } },
  { key: 'destination', title: '目的地', minWidth: 100, ellipsis: { tooltip: true } },
  { key: 'actualCartonQty', title: '箱数', width: 72, align: 'center' as const },
  { key: 'actualPalletQty', title: '板数', width: 72, align: 'center' as const },
  { key: 'actualWeight', title: '重量(kg)', width: 96 },
  { key: 'actualCbm', title: 'CBM', width: 80 }
];

const itemTotals = computed(() => ({
  cartons: items.value.reduce((s, i) => s + (Number(i.actualCartonQty) || 0), 0),
  pallets: items.value.reduce((s, i) => s + (Number(i.actualPalletQty) || 0), 0),
  weight: items.value.reduce((s, i) => s + (Number(i.actualWeight) || 0), 0).toFixed(2),
  cbm: items.value.reduce((s, i) => s + (Number(i.actualCbm) || 0), 0).toFixed(2)
}));

function getText(val: string | number | null | undefined) {
  if (val === null || val === undefined || val === '') return '--';
  return String(val);
}

async function loadItems() {
  if (!props.row?.id) return;
  itemsLoading.value = true;
  const { data } = await fetchGetOutboundOrderItems(props.row.id);
  items.value = data || [];
  itemsLoading.value = false;
}

async function handleComplete() {
  if (!props.row?.id) return;
  completing.value = true;
  const { error } = await fetchCompleteOutboundOrder(props.row.id);
  completing.value = false;
  if (!error) {
    window.$message?.success('出库完成');
    emit('refreshed');
    visible.value = false;
  }
}

function handleCargoAdded() {
  loadItems();
  emit('refreshed');
}

watch(visible, v => {
  if (v) {
    activeTab.value = props.initTab || 'basic';
    if (props.row?.id) loadItems();
  } else {
    items.value = [];
  }
});

watch(activeTab, tab => {
  if (tab === 'cargo' && items.value.length === 0 && props.row?.id) loadItems();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="860" :to="POPUP_TO_BODY">
    <NDrawerContent
      :title="row?.outboundOrderNo ? `车次订单详情 — ${row.outboundOrderNo}` : '车次订单详情'"
      closable
    >
      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="basic" tab="基础数据">
          <NDescriptions :columns="2" label-placement="left" bordered size="small" class="mb-12px">
            <NDescriptionsItem label="车次订单号">{{ getText(row?.outboundOrderNo) }}</NDescriptionsItem>
            <NDescriptionsItem label="状态">
              <NTag v-if="row?.outboundStatus" :type="STATUS_META[row.outboundStatus]?.type || 'default'" size="small">
                {{ STATUS_META[row.outboundStatus]?.label || row.outboundStatus }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="目的地">{{ getText((row as any)?.destination) }}</NDescriptionsItem>
            <NDescriptionsItem label="业务类型">{{ getText((row as any)?.businessType) }}</NDescriptionsItem>
            <NDescriptionsItem label="出库仓库">{{ getText(row?.outboundWarehouseName) }}</NDescriptionsItem>
            <NDescriptionsItem label="客户">{{ getText(row?.customerName) }}</NDescriptionsItem>
            <NDescriptionsItem label="订单数">{{ getText((row as any)?.cargoOrderCount) }}</NDescriptionsItem>
            <NDescriptionsItem label="ISA / 预约号">{{ getText((row as any)?.isaNo) }}</NDescriptionsItem>
            <NDescriptionsItem label="车型">{{ getText((row as any)?.vehicleType) }}</NDescriptionsItem>
            <NDescriptionsItem label="箱数">{{ getText(row?.actualCartonQty) }}</NDescriptionsItem>
            <NDescriptionsItem label="板数">{{ getText(row?.actualPalletQty) }}</NDescriptionsItem>
            <NDescriptionsItem label="重量(kg)">{{ getText(row?.actualWeight) }}</NDescriptionsItem>
            <NDescriptionsItem label="CBM">{{ getText(row?.actualCbm) }}</NDescriptionsItem>
          </NDescriptions>

          <NDivider title-placement="left">供应商与司机</NDivider>
          <NDescriptions :columns="2" label-placement="left" bordered size="small" class="mb-12px">
            <NDescriptionsItem label="供应商">{{ getText((row as any)?.supplierName) }}</NDescriptionsItem>
            <NDescriptionsItem label="司机">{{ getText((row as any)?.driverName) }}</NDescriptionsItem>
            <NDescriptionsItem label="司机电话">{{ getText((row as any)?.driverPhone) }}</NDescriptionsItem>
            <NDescriptionsItem label="车牌号">{{ getText((row as any)?.licensePlate) }}</NDescriptionsItem>
            <NDescriptionsItem label="车厢号">{{ getText((row as any)?.trailerNo) }}</NDescriptionsItem>
            <NDescriptionsItem label="分配 DOCK">{{ getText((row as any)?.dockNo) }}</NDescriptionsItem>
          </NDescriptions>

          <NDivider title-placement="left">预约 & 运输</NDivider>
          <NDescriptions :columns="2" label-placement="left" bordered size="small" class="mb-12px">
            <NDescriptionsItem label="预约状态">{{ getText(row?.appointmentStatus) }}</NDescriptionsItem>
            <NDescriptionsItem label="预约时间">{{ getText(row?.appointmentTime) }}</NDescriptionsItem>
            <NDescriptionsItem label="DW截止">{{ getText(row?.deliveryLfd) }}</NDescriptionsItem>
            <NDescriptionsItem label="承运商">{{ getText(row?.carrier) }}</NDescriptionsItem>
            <NDescriptionsItem label="运单号">{{ getText(row?.trackingNo) }}</NDescriptionsItem>
            <NDescriptionsItem label="POD状态">{{ getText(row?.podStatus) }}</NDescriptionsItem>
          </NDescriptions>

          <NDivider title-placement="left">收货地址</NDivider>
          <NDescriptions :columns="2" label-placement="left" bordered size="small" class="mb-12px">
            <NDescriptionsItem label="联系人">{{ getText(row?.contactName) }}</NDescriptionsItem>
            <NDescriptionsItem label="联系电话">{{ getText(row?.contactPhone) }}</NDescriptionsItem>
            <NDescriptionsItem label="地址">{{ [row?.addressLine1, row?.addressLine2].filter(Boolean).join(', ') || '--' }}</NDescriptionsItem>
            <NDescriptionsItem label="城市/州">{{ [row?.city, row?.state].filter(Boolean).join(', ') || '--' }}</NDescriptionsItem>
            <NDescriptionsItem label="邮编">{{ getText(row?.zipCode) }}</NDescriptionsItem>
            <NDescriptionsItem label="国家">{{ getText(row?.country) }}</NDescriptionsItem>
          </NDescriptions>

          <NDivider title-placement="left">时间节点</NDivider>
          <NDescriptions :columns="2" label-placement="left" bordered size="small">
            <NDescriptionsItem label="发车时间">{{ getText(row?.actualOutboundTime) }}</NDescriptionsItem>
            <NDescriptionsItem label="到达时间">{{ getText(row?.actualArrivalTime) }}</NDescriptionsItem>
            <NDescriptionsItem label="签收时间">{{ getText(row?.actualSignedTime) }}</NDescriptionsItem>
            <NDescriptionsItem label="POD上传">{{ getText(row?.podUploadTime) }}</NDescriptionsItem>
            <NDescriptionsItem label="完成时间">{{ getText(row?.completedTime) }}</NDescriptionsItem>
            <NDescriptionsItem label="备注">{{ getText(row?.remark) }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="cargo" tab="货物信息">
          <div class="mb-8px flex items-center justify-end">
            <NButton v-if="canAddCargo" type="primary" size="small" @click="addCargoVisible = true">添加货物</NButton>
          </div>
          <NSpin :show="itemsLoading">
            <NDataTable :columns="itemColumns" :data="items" size="small" :bordered="false" :scroll-x="900" />
            <div v-if="items.length > 0" class="items-summary">
              <span>合计：{{ items.length }} 票</span>
              <span>{{ itemTotals.cartons }} 箱</span>
              <span>{{ itemTotals.pallets }} 板</span>
              <span>{{ itemTotals.weight }} kg</span>
              <span>{{ itemTotals.cbm }} CBM</span>
            </div>
          </NSpin>
        </NTabPane>

        <NTabPane name="files" tab="文件管理">
          <AttachmentManager
            v-if="visible && activeTab === 'files'"
            target-kind="outbound"
            :target-id="row?.id"
            :include-container-attachments="false"
          />
        </NTabPane>
      </NTabs>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">关闭</NButton>
          <NButton type="primary" :disabled="isCompleted" :loading="completing" @click="handleComplete">
            确认发车
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>

  <OutboundAddCargoModal
    v-model:visible="addCargoVisible"
    :outbound-order-id="row?.id ?? null"
    @added="handleCargoAdded"
  />
</template>

<style scoped>
.mb-12px {
  margin-bottom: 12px;
}
.mb-8px {
  margin-bottom: 8px;
}
.items-summary {
  display: flex;
  gap: 24px;
  padding: 10px 4px 0;
  font-size: 13px;
  color: #606266;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
}
</style>
