<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NModal,
  NSpace,
  NSpin,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import { fetchCompleteOutboundOrder, fetchGetOutboundOrderItems } from '@/service/api/oms/outbound-order';
import AttachmentManager from '../../components/attachment-manager.vue';

defineOptions({ name: 'OutboundOrderDetailModal' });

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

const STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  CREATED: { label: '已创建', type: 'default' },
  APPOINTMENT_CONFIRMED: { label: '已确认预约', type: 'info' },
  OUTBOUNDED: { label: '已出库', type: 'warning' },
  ARRIVED: { label: '已到达', type: 'info' },
  SIGNED: { label: '已签收', type: 'info' },
  POD_UPLOADED: { label: 'POD已上传', type: 'success' },
  COMPLETED: { label: '已完成', type: 'success' }
};

const DIRECTION_META: Record<string, string> = { DELIVERY: '派送', TRANSFER: '调拨' };

const isCompleted = computed(() => props.row?.outboundStatus === 'COMPLETED');

const itemColumns = [
  { key: 'cargoOrderNo', title: '运单号', minWidth: 160 },
  { key: 'actualCartonQty', title: '箱数', width: 80 },
  { key: 'actualPalletQty', title: '板数', width: 80 },
  { key: 'actualWeight', title: '重量(kg)', width: 100 },
  { key: 'actualCbm', title: 'CBM', width: 90 }
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
  <NModal
    v-model:show="visible"
    preset="card"
    :title="`出库单详情 — ${row?.outboundOrderNo || ''}`"
    style="width: 860px; max-width: 96vw"
    :segmented="{ content: true, footer: true }"
  >
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- ==================== 基础数据 ==================== -->
      <NTabPane name="basic" tab="基础数据">
        <NDescriptions :columns="2" label-placement="left" bordered size="small" class="mb-12px">
          <NDescriptionsItem label="出库单号">{{ getText(row?.outboundOrderNo) }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">
            <NTag v-if="row?.outboundStatus" :type="STATUS_META[row.outboundStatus]?.type || 'default'" size="small">
              {{ STATUS_META[row.outboundStatus]?.label || row.outboundStatus }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="出库方向">{{ DIRECTION_META[row?.outboundDirection || ''] || row?.outboundDirection || '--' }}</NDescriptionsItem>
          <NDescriptionsItem label="出库仓库">{{ getText(row?.outboundWarehouseName) }}</NDescriptionsItem>
          <NDescriptionsItem label="客户">{{ getText(row?.customerName) }}</NDescriptionsItem>
          <NDescriptionsItem label="柜号">{{ getText(row?.containerNo) }}</NDescriptionsItem>
          <NDescriptionsItem label="预出单号">{{ getText(row?.preOutboundNo) }}</NDescriptionsItem>
          <NDescriptionsItem label="货件编码">{{ getText(row?.shipmentCodes) }}</NDescriptionsItem>
          <NDescriptionsItem label="箱数">{{ getText(row?.actualCartonQty) }}</NDescriptionsItem>
          <NDescriptionsItem label="板数">{{ getText(row?.actualPalletQty) }}</NDescriptionsItem>
          <NDescriptionsItem label="重量(kg)">{{ getText(row?.actualWeight) }}</NDescriptionsItem>
          <NDescriptionsItem label="CBM">{{ getText(row?.actualCbm) }}</NDescriptionsItem>
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
          <NDescriptionsItem label="实际出库">{{ getText(row?.actualOutboundTime) }}</NDescriptionsItem>
          <NDescriptionsItem label="到达时间">{{ getText(row?.actualArrivalTime) }}</NDescriptionsItem>
          <NDescriptionsItem label="签收时间">{{ getText(row?.actualSignedTime) }}</NDescriptionsItem>
          <NDescriptionsItem label="POD上传">{{ getText(row?.podUploadTime) }}</NDescriptionsItem>
          <NDescriptionsItem label="完成时间">{{ getText(row?.completedTime) }}</NDescriptionsItem>
          <NDescriptionsItem label="备注">{{ getText(row?.remark) }}</NDescriptionsItem>
        </NDescriptions>
      </NTabPane>

      <!-- ==================== 货物信息 ==================== -->
      <NTabPane name="cargo" tab="货物信息">
        <NSpin :show="itemsLoading">
          <NDataTable :columns="itemColumns" :data="items" size="small" :bordered="false" />
          <div v-if="items.length > 0" class="items-summary">
            <span>合计：{{ items.length }} 票</span>
            <span>{{ itemTotals.cartons }} 箱</span>
            <span>{{ itemTotals.pallets }} 板</span>
            <span>{{ itemTotals.weight }} kg</span>
            <span>{{ itemTotals.cbm }} CBM</span>
          </div>
        </NSpin>
      </NTabPane>

      <!-- ==================== 文件管理 ==================== -->
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
        <NButton
          type="primary"
          :disabled="isCompleted"
          :loading="completing"
          @click="handleComplete"
        >
          出库完成
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.mb-12px {
  margin-bottom: 12px;
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
