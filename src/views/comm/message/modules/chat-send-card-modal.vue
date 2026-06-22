<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAutoComplete, NButton, NFormItem, NModal, NSelect, NSpace, NTabPane, NTabs } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetCommOrderDetail, fetchSearchCommOrders } from '@/service/api/comm';

type CardType = 'card_order' | 'card_trip' | 'card_container' | 'card_exception' | 'card_bill';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  (
    e: 'confirm',
    payload: {
      type: CardType;
      cardPayload: Record<string, string>;
    }
  ): void;
}>();

const cardType = ref<CardType>('card_order');
const orderKeyword = ref('');
const orderOptions = ref<Api.Comm.CommOrderOption[]>([]);
const selectedOrderNo = ref('');
const orderNoError = ref('');
const selectedBizKey = ref<string | null>(null);

const MOCK_TRIP_CARDS = [
  { key: 'trip-001', tripNo: 'TRIP250604001', destination: 'XLX7', appointmentTime: '2026-06-05 10:00', palletQty: '26', status: '待装车' },
  { key: 'trip-002', tripNo: 'TRIP250603018', destination: 'ONT8', appointmentTime: '2026-06-06 14:00', palletQty: '12', status: '装车中' }
];

const MOCK_CONTAINER_CARDS = [
  { key: 'ctn-001', containerNo: 'CTN-2026-0008', vessel: 'COSCO FAITH', destination: 'SMF3', eta: '2026-06-08', status: '拆柜中' },
  { key: 'ctn-002', containerNo: 'CTN-2026-0012', vessel: 'EVER GOLDEN', destination: 'LAX9', eta: '2026-06-10', status: '已到港' }
];

const MOCK_EXCEPTION_CARDS = [
  { key: 'exc-001', exceptionNo: 'EXC250601003', type: '少货', orderNo: 'FSHY2508058785', status: '处理中' },
  { key: 'exc-002', exceptionNo: 'EXC250602001', type: '破损', orderNo: 'CO-2026-0001', status: '待确认' }
];

const MOCK_BILL_CARDS = [
  { key: 'bill-001', billNo: 'BILL250605001', customer: 'Forest', amount: '$1,280.00', status: '待确认' },
  { key: 'bill-002', billNo: 'BILL250604008', customer: 'Anker Innovations', amount: '$3,560.00', status: '已确认' }
];

const cardTypeOptions = [
  { label: '订单卡片', value: 'card_order' },
  { label: '车次卡片', value: 'card_trip' },
  { label: '海柜卡片', value: 'card_container' },
  { label: '异常卡片', value: 'card_exception' },
  { label: '账单卡片', value: 'card_bill' }
];

const autocompleteOptions = computed(() =>
  orderOptions.value.map(row => ({
    label: `${row.orderNo} · ${row.customerName} · ${row.destination}`,
    value: row.orderNo
  }))
);

const selectedOrder = computed(() => {
  if (!selectedOrderNo.value) return null;
  return orderOptions.value.find(row => row.orderNo === selectedOrderNo.value) ?? null;
});

const orderPreview = ref<Api.Comm.CommOrderDetail | null>(null);

const bizSelectOptions = computed(() => {
  if (cardType.value === 'card_trip') {
    return MOCK_TRIP_CARDS.map(item => ({ label: `${item.tripNo} · ${item.destination}`, value: item.key }));
  }
  if (cardType.value === 'card_container') {
    return MOCK_CONTAINER_CARDS.map(item => ({ label: `${item.containerNo} · ${item.destination}`, value: item.key }));
  }
  if (cardType.value === 'card_exception') {
    return MOCK_EXCEPTION_CARDS.map(item => ({ label: `${item.exceptionNo} · ${item.type}`, value: item.key }));
  }
  if (cardType.value === 'card_bill') {
    return MOCK_BILL_CARDS.map(item => ({ label: `${item.billNo} · ${item.customer}`, value: item.key }));
  }
  return [];
});

const previewRows = computed(() => {
  if (cardType.value === 'card_order' && orderPreview.value) {
    const detail = orderPreview.value;
    return [
      ['orderNo', detail.orderNo],
      ['customer', detail.customerName],
      ['destination', detail.destination],
      ['status', detail.status],
      ['pallets', String(detail.palletQty)]
    ] as const;
  }
  const biz = getSelectedBizRecord();
  if (!biz) return [];
  if (cardType.value === 'card_trip') {
    return [
      ['tripNo', biz.tripNo],
      ['destination', biz.destination],
      ['appointmentTime', biz.appointmentTime],
      ['palletQty', biz.palletQty],
      ['status', biz.status]
    ] as const;
  }
  if (cardType.value === 'card_container') {
    return [
      ['containerNo', biz.containerNo],
      ['vessel', biz.vessel],
      ['destination', biz.destination],
      ['eta', biz.eta],
      ['status', biz.status]
    ] as const;
  }
  if (cardType.value === 'card_exception') {
    return [
      ['exceptionNo', biz.exceptionNo],
      ['type', biz.type],
      ['orderNo', biz.orderNo],
      ['status', biz.status]
    ] as const;
  }
  if (cardType.value === 'card_bill') {
    return [
      ['billNo', biz.billNo],
      ['customer', biz.customer],
      ['amount', biz.amount],
      ['status', biz.status]
    ] as const;
  }
  return [];
});

const fieldLabelMap: Record<string, string> = {
  orderNo: '订单号',
  customer: '客户',
  destination: '目的地',
  status: '状态',
  pallets: '板数',
  tripNo: '车次号',
  appointmentTime: '预约时间',
  palletQty: '板数',
  containerNo: '海柜号',
  vessel: '船名',
  eta: '预计到港',
  exceptionNo: '异常号',
  type: '类型',
  billNo: '账单号',
  amount: '金额'
};

async function searchOrders(keyword?: string) {
  const { data } = await fetchSearchCommOrders(keyword);
  orderOptions.value = data ?? [];
}

async function loadOrderPreview(orderNo: string) {
  const { data } = await fetchGetCommOrderDetail(orderNo);
  orderPreview.value = data ?? null;
}

function getSelectedBizRecord() {
  if (!selectedBizKey.value) return null;
  if (cardType.value === 'card_trip') return MOCK_TRIP_CARDS.find(item => item.key === selectedBizKey.value) ?? null;
  if (cardType.value === 'card_container') return MOCK_CONTAINER_CARDS.find(item => item.key === selectedBizKey.value) ?? null;
  if (cardType.value === 'card_exception') return MOCK_EXCEPTION_CARDS.find(item => item.key === selectedBizKey.value) ?? null;
  if (cardType.value === 'card_bill') return MOCK_BILL_CARDS.find(item => item.key === selectedBizKey.value) ?? null;
  return null;
}

function handleSelectOrder(value: string) {
  selectedOrderNo.value = value;
  orderKeyword.value = value;
  orderNoError.value = '';
  loadOrderPreview(value);
}

watch(orderKeyword, async val => {
  orderNoError.value = '';
  if (!val) {
    selectedOrderNo.value = '';
    orderPreview.value = null;
  } else if (selectedOrderNo.value && val !== selectedOrderNo.value) {
    selectedOrderNo.value = '';
    orderPreview.value = null;
  }
  await searchOrders(val);
  if (selectedOrderNo.value) await loadOrderPreview(selectedOrderNo.value);
});

watch(cardType, () => {
  selectedBizKey.value = null;
  orderNoError.value = '';
});

watch(visible, async open => {
  if (!open) return;
  cardType.value = 'card_order';
  orderKeyword.value = '';
  selectedOrderNo.value = '';
  orderPreview.value = null;
  selectedBizKey.value = null;
  orderNoError.value = '';
  await searchOrders();
});

function buildCardPayload(): Record<string, string> | null {
  if (cardType.value === 'card_order') {
    if (!orderPreview.value) return null;
    const detail = orderPreview.value;
    return {
      orderNo: detail.orderNo,
      customer: detail.customerName,
      destination: detail.destination,
      status: detail.status,
      pallets: String(detail.palletQty)
    };
  }
  const biz = getSelectedBizRecord();
  if (!biz) return null;
  const payload: Record<string, string> = {};
  previewRows.value.forEach(([key, value]) => {
    payload[key] = value;
  });
  return payload;
}

function handleConfirm() {
  if (cardType.value === 'card_order' && !orderPreview.value) {
    orderNoError.value = '请先选择订单';
    window.$message?.warning('请先选择要发送的订单');
    return;
  }
  if (cardType.value !== 'card_order' && !selectedBizKey.value) {
    window.$message?.warning('请先选择业务卡片');
    return;
  }
  const cardPayload = buildCardPayload();
  if (!cardPayload) return;
  emit('confirm', { type: cardType.value, cardPayload });
  visible.value = false;
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="发送业务卡片" class="w-560px" :to="POPUP_TO_BODY" :mask-closable="false">
    <NTabs v-model:value="cardType" type="line" size="small" class="mb-12px">
      <NTabPane v-for="item in cardTypeOptions" :key="item.value" :name="item.value" :tab="item.label" />
    </NTabs>

    <template v-if="cardType === 'card_order'">
      <NFormItem label="关联订单" required :validation-status="orderNoError ? 'error' : undefined" :feedback="orderNoError">
        <NAutoComplete
          v-model:value="orderKeyword"
          :options="autocompleteOptions"
          clearable
          placeholder="模糊搜索订单号 / 客户 / 目的地"
          @select="handleSelectOrder"
          @update:value="val => searchOrders(val)"
        />
      </NFormItem>
    </template>
    <template v-else>
      <NFormItem label="选择业务" required>
        <NSelect v-model:value="selectedBizKey" :options="bizSelectOptions" clearable placeholder="请选择要发送的卡片" />
      </NFormItem>
    </template>

    <div v-if="previewRows.length" class="card-preview">
      <div class="card-preview-title">{{ cardTypeOptions.find(item => item.value === cardType)?.label }}</div>
      <div v-for="([key, value], index) in previewRows" :key="`${key}-${index}`" class="card-preview-line">
        <span class="card-preview-key">{{ fieldLabelMap[key] || key }}：</span>{{ value }}
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" @click="handleConfirm">发送卡片</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.card-preview {
  margin-top: 4px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.card-preview-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}

.card-preview-line {
  font-size: 13px;
  margin-bottom: 4px;
  color: #374151;
}

.card-preview-key {
  color: #6b7280;
}
</style>
