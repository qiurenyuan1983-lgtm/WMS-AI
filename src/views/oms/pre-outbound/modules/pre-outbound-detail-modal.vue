<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputGroup,
  NInputGroupLabel,
  NInputNumber,
  NModal,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { useAuth } from '@/hooks/business/auth';
import {
  fetchConvertPreOutboundOrder,
  fetchGetPreOutboundItems,
  fetchRemovePreOutboundItem,
  fetchUpdatePreOutboundOrder
} from '@/service/api/oms/pre-outbound';
import PreOutboundAddCargoDrawer from './pre-outbound-add-cargo-drawer.vue';
import { OUTBOUND_READINESS_META, resolveOutboundReadiness } from '../utils/outbound-readiness';

defineOptions({ name: 'PreOutboundDetailModal' });

const props = defineProps<{
  row: Api.Oms.PreOutbound | null;
  mode: 'detail' | 'convert';
}>();

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ (e: 'saved'): void; (e: 'converted'): void }>();

const { hasAuth } = useAuth();
const saving = ref(false);
const converting = ref(false);
const detailLoading = ref(false);
const removingItemId = ref<CommonType.IdType | null>(null);
const addDrawerVisible = ref(false);
const activeTab = ref<'BASIC' | 'DETAIL'>('BASIC');
const detailReadinessTab = ref<Api.Oms.OutboundReadiness>('NOT_INBOUNDED');
const preOutboundItems = ref<Api.Oms.PreOutboundItem[]>([]);
const palletDetailRows = ref<PalletDetailRow[]>([]);

const STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING_INBOUND: { label: '待入库', type: 'warning' },
  DEVANNING: { label: '拆柜中', type: 'info' },
  READY_TO_CONVERT: { label: '可转出库', type: 'success' },
  CONVERTED: { label: '已转出库', type: 'success' },
  CANCELLED: { label: '已取消', type: 'default' }
};

const LOADING_TYPE_META: Record<string, string> = {
  PALLET: '卡板',
  FLOOR: '地板'
};

const OUTBOUND_TYPE_OPTIONS = [
  { label: '派送出库', value: 'DELIVERY' },
  { label: '调拨出库', value: 'TRANSFER' }
];

/** 出库明细行：已入库为卡板维度，未入库/拆柜中为订单维度 */
type PalletDetailRow = {
  id: string;
  itemId: CommonType.IdType;
  cargoOrderId: CommonType.IdType;
  readiness: Api.Oms.OutboundReadiness;
  rowLevel: 'ORDER' | 'PALLET';
  cargoOrderNo: string;
  containerNo: string;
  palletNo: string;
  location: string;
  declaredCartonQty: number;
  actualCartonQty: number;
  poNo: string;
  shipmentCode: string;
  actualWeight: number;
  actualCbm: number;
  isMock: boolean;
};

const editForm = reactive({
  appointmentNo: '',
  appointmentTime: null as number | null,
  deliveryTruck: '',
  loadingType: 'PALLET',
  transportType: 'FTL',
  deliveryTag: '',
  followRecord: '',
  remark: '',
  outboundType: 'DELIVERY' as Api.Oms.OutboundDirection,
  appointmentStatus: 'UNCONFIRMED',
  appointmentType: 'SELF',
  shipDate: null as number | null,
  deliveryCost: null as number | null,
  transferFlag: 0
});

const convertForm = reactive<Api.Oms.OutboundCreateParams>({
  outboundDirection: 'DELIVERY',
  outboundWarehouseId: null,
  outboundWarehouseName: null,
  transferInWarehouseId: null,
  remark: null
});

const isTerminal = computed(() =>
  ['CONVERTED', 'CANCELLED'].includes(props.row?.preOutboundStatus || '')
);

const canEdit = computed(() => hasAuth('oms:preOutbound:edit') && !isTerminal.value);
const canConvert = computed(() =>
  hasAuth('oms:preOutbound:convert') && props.row?.preOutboundStatus === 'READY_TO_CONVERT'
);

const statusMeta = computed(() => {
  const status = props.row?.preOutboundStatus || '';
  return STATUS_META[status] || { label: status || '--', type: 'default' as const };
});

const modalTitle = computed(() => (props.mode === 'convert' ? '转出库订单' : '预出单详情'));

const isPalletDimensionTab = computed(() => detailReadinessTab.value === 'INBOUNDED');

const detailTotals = computed(() =>
  currentPalletRows.value.reduce(
    (total, row) => {
      if (row.rowLevel === 'PALLET') total.palletQty += 1;
      else total.orderQty += 1;
      total.pcs += Number(row.actualCartonQty || 0);
      total.cbm += Number(row.actualCbm || 0);
      total.weight += Number(row.actualWeight || 0);
      return total;
    },
    { palletQty: 0, orderQty: 0, pcs: 0, cbm: 0, weight: 0 }
  )
);

const readinessTabs = computed(() => {
  const counts = { NOT_INBOUNDED: 0, DEVANNING: 0, INBOUNDED: 0 } as Record<Api.Oms.OutboundReadiness, number>;
  palletDetailRows.value.forEach(row => {
    counts[row.readiness] = (counts[row.readiness] || 0) + 1;
  });
  return (['NOT_INBOUNDED', 'DEVANNING', 'INBOUNDED'] as Api.Oms.OutboundReadiness[]).map(value => ({
    value,
    label: OUTBOUND_READINESS_META[value].label,
    count: counts[value] || 0
  }));
});

const currentPalletRows = computed(() =>
  palletDetailRows.value.filter(row => row.readiness === detailReadinessTab.value)
);

const excludedCargoOrderIds = computed(() => preOutboundItems.value.map(item => item.cargoOrderId));

const usingMockPallet = computed(
  () => isPalletDimensionTab.value && currentPalletRows.value.some(row => row.isMock)
);

function val(v: unknown) {
  if (v === null || v === undefined || v === '') return '--';
  return String(v);
}

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2);
}

function buildMockPalletNo(index: number) {
  const prefix = props.row?.preOutboundNo?.replace(/^POB/, 'PLT-') || 'PLT';
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

function splitEvenly(total: number, count: number) {
  if (count <= 0) return [total];
  const base = total / count;
  return Array.from({ length: count }, () => base);
}

function appendPalletRows(
  rows: PalletDetailRow[],
  options: {
    itemId: CommonType.IdType;
    cargoOrderId: CommonType.IdType;
    readiness: Api.Oms.OutboundReadiness;
    cargoOrderNo: string;
    containerNo: string;
    location: string;
    poNo: string;
    shipmentCode: string;
    declaredCartonQty: number;
    actualCartonQty: number;
    palletCount: number;
    actualWeight: number;
    actualCbm: number;
    startIndex: number;
  }
) {
  const { palletCount, actualCartonQty, actualWeight, actualCbm, startIndex, ...base } = options;
  const cartons = splitEvenly(actualCartonQty, palletCount);
  const weights = splitEvenly(actualWeight, palletCount);
  const cbms = splitEvenly(actualCbm, palletCount);

  for (let i = 0; i < palletCount; i += 1) {
    const index = startIndex + i;
    rows.push({
      id: `${base.itemId}-${index}`,
      itemId: base.itemId,
      cargoOrderId: base.cargoOrderId,
      readiness: base.readiness,
      rowLevel: 'PALLET',
      cargoOrderNo: base.cargoOrderNo,
      containerNo: base.containerNo,
      palletNo: buildMockPalletNo(index),
      location: base.location,
      declaredCartonQty: base.declaredCartonQty,
      actualCartonQty: cartons[i],
      poNo: base.poNo,
      shipmentCode: base.shipmentCode,
      actualWeight: weights[i],
      actualCbm: cbms[i],
      isMock: true
    });
  }
  return startIndex + palletCount;
}

function buildOrderLevelRow(item: Api.Oms.PreOutboundItem, readiness: Api.Oms.OutboundReadiness): PalletDetailRow {
  return {
    id: String(item.id),
    itemId: item.id,
    cargoOrderId: item.cargoOrderId,
    readiness,
    rowLevel: 'ORDER',
    cargoOrderNo: item.cargoOrderNo,
    containerNo: item.containerNo || '--',
    palletNo: '',
    location: '',
    declaredCartonQty: Number(item.declaredCartonQty || 0),
    actualCartonQty: Number(item.actualCartonQty || 0),
    poNo: item.poNos || '--',
    shipmentCode: item.shipmentCodes || '--',
    actualWeight: Number(item.actualWeight || 0),
    actualCbm: Number(item.actualCbm || 0),
    isMock: false
  };
}

function buildPalletRowsFromItems(items: Api.Oms.PreOutboundItem[]): PalletDetailRow[] {
  const rows: PalletDetailRow[] = [];
  let nextIndex = 1;
  items.forEach(item => {
    const readiness = (item.readiness ||
      resolveOutboundReadiness({
        fulfillmentStatus: item.fulfillmentStatus,
        actualCartonQty: item.actualCartonQty,
        declaredCartonQty: item.declaredCartonQty
      })) as Api.Oms.OutboundReadiness;

    if (readiness !== 'INBOUNDED') {
      rows.push(buildOrderLevelRow(item, readiness));
      return;
    }

    const shipmentCodes = (item.shipmentCodes || '--').split(',').map(code => code.trim()).filter(Boolean);
    const poList = (item.poNos || '--').split(',').map(code => code.trim()).filter(Boolean);
    const palletCount = Math.max(1, Number(item.actualPalletQty || item.declaredPalletQty || 1));
    const location = item.platformWarehouseCode || props.row?.outboundWarehouseName || '--';
    const actualCartonQty = Number(item.actualCartonQty || 0);
    const actualWeight = Number(item.actualWeight || 0);
    const actualCbm = Number(item.actualCbm || 0);
    const declaredCartonQty = Number(item.declaredCartonQty || 0);

    if (shipmentCodes.length) {
      const palletsPerShipment = Math.max(1, Math.floor(palletCount / shipmentCodes.length));
      shipmentCodes.forEach((code, index) => {
        nextIndex = appendPalletRows(rows, {
          itemId: item.id,
          cargoOrderId: item.cargoOrderId,
          readiness,
          cargoOrderNo: item.cargoOrderNo,
          containerNo: item.containerNo || '--',
          location,
          poNo: poList[index] || poList[0] || '--',
          shipmentCode: code,
          declaredCartonQty: declaredCartonQty / shipmentCodes.length,
          actualCartonQty: actualCartonQty / shipmentCodes.length,
          palletCount: index === shipmentCodes.length - 1 ? palletCount - (nextIndex - 1) : palletsPerShipment,
          actualWeight: actualWeight / shipmentCodes.length,
          actualCbm: actualCbm / shipmentCodes.length,
          startIndex: nextIndex
        });
      });
      return;
    }

    nextIndex = appendPalletRows(rows, {
      itemId: item.id,
      cargoOrderId: item.cargoOrderId,
      readiness,
      cargoOrderNo: item.cargoOrderNo,
      containerNo: item.containerNo || '--',
      location,
      poNo: poList[0] || '--',
      shipmentCode: '--',
      declaredCartonQty,
      actualCartonQty,
      palletCount,
      actualWeight,
      actualCbm,
      startIndex: nextIndex
    });
  });
  return rows;
}

async function loadDetailItems() {
  if (!props.row?.id) {
    preOutboundItems.value = [];
    palletDetailRows.value = [];
    return;
  }
  detailLoading.value = true;
  try {
    const { data } = await fetchGetPreOutboundItems(props.row.id);
    preOutboundItems.value = data || [];
    palletDetailRows.value = buildPalletRowsFromItems(preOutboundItems.value);
    if (!currentPalletRows.value.length) {
      const firstNonEmpty = readinessTabs.value.find(tab => tab.count > 0);
      if (firstNonEmpty) detailReadinessTab.value = firstNonEmpty.value;
    }
  } finally {
    detailLoading.value = false;
  }
}

async function handleRemoveItem(itemId: CommonType.IdType) {
  if (!props.row?.id || !canEdit.value) return;
  removingItemId.value = itemId;
  try {
    const { error } = await fetchRemovePreOutboundItem(props.row.id, itemId);
    if (error) return;
    window.$message?.success('已移出预出单，货物返回出单工作台');
    await loadDetailItems();
    emit('saved');
  } finally {
    removingItemId.value = null;
  }
}

async function handleItemsAdded() {
  await loadDetailItems();
  emit('saved');
}

function syncFormFromRow(row: Api.Oms.PreOutbound) {
  editForm.appointmentNo = row.appointmentNo || '';
  editForm.appointmentTime = row.appointmentTime ? new Date(row.appointmentTime).getTime() : null;
  editForm.deliveryTruck = row.deliveryTruck || '';
  editForm.loadingType = row.loadingType || 'PALLET';
  editForm.transportType = row.transportType || 'FTL';
  editForm.deliveryTag = row.deliveryTag || '';
  editForm.followRecord = row.followRecord || '';
  editForm.remark = row.remark || '';
  editForm.outboundType = row.outboundDirection;
  editForm.transferFlag = row.outboundDirection === 'TRANSFER' ? 1 : 0;
  convertForm.outboundDirection = row.outboundDirection;
  convertForm.outboundWarehouseId = row.outboundWarehouseId ?? null;
  convertForm.outboundWarehouseName = row.outboundWarehouseName ?? null;
  convertForm.remark = row.remark ?? null;
}

watch(
  () => [visible.value, props.row?.id] as const,
  ([vis, id]) => {
    if (vis && props.row && id != null) {
      activeTab.value = 'BASIC';
      syncFormFromRow(props.row);
      loadDetailItems();
    }
  }
);

function buildUpdatePayload(): Api.Oms.PreOutboundUpdateParams {
  return {
    outboundDirection: editForm.outboundType,
    appointmentNo: editForm.appointmentNo?.trim() || null,
    appointmentTime: editForm.appointmentTime,
    deliveryTruck: editForm.deliveryTruck?.trim() || null,
    loadingType: editForm.loadingType,
    transportType: editForm.transportType,
    deliveryTag: editForm.deliveryTag?.trim() || null,
    followRecord: editForm.followRecord?.trim() || null,
    remark: editForm.remark?.trim() || null
  };
}

function buildConvertPayload(): Api.Oms.OutboundCreateParams {
  return {
    ...convertForm,
    deliveryMethod: props.row?.deliveryMethod ?? null,
    destination: props.row?.destination || props.row?.outboundWarehouseName || null,
    appointmentStatus: editForm.appointmentStatus,
    appointmentNo: editForm.appointmentNo?.trim() || null,
    appointmentTime: editForm.appointmentTime,
    deliveryTruck: editForm.deliveryTruck?.trim() || null,
    loadingType: editForm.loadingType,
    transportType: editForm.transportType,
    deliveryTag: editForm.deliveryTag?.trim() || null,
    followRecord: editForm.followRecord?.trim() || null,
    remark: editForm.remark?.trim() || null,
    outboundDirection: editForm.outboundType
  };
}

async function submitSave() {
  if (!props.row?.id || !canEdit.value) return;
  saving.value = true;
  try {
    const { error } = await fetchUpdatePreOutboundOrder(props.row.id, buildUpdatePayload());
    if (error) return;
    window.$message?.success('保存成功');
    emit('saved');
  } finally {
    saving.value = false;
  }
}

async function submitConvert() {
  if (!props.row?.id || !canConvert.value) return;
  if (!convertForm.outboundWarehouseId) {
    window.$message?.warning('出库仓库缺失，无法转出库');
    return;
  }
  converting.value = true;
  try {
    if (canEdit.value) {
      const { error: saveError } = await fetchUpdatePreOutboundOrder(props.row.id, buildUpdatePayload());
      if (saveError) return;
    }
    const { error } = await fetchConvertPreOutboundOrder(props.row.id, buildConvertPayload());
    if (error) return;
    window.$message?.success('已转为出库订单');
    visible.value = false;
    emit('converted');
  } finally {
    converting.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    class="delivery-modal"
    style="width: min(980px, 72vw); max-width: calc(100vw - 96px)"
    :title="modalTitle"
  >
    <div v-if="row" class="modal-body">
      <div class="modal-head">
        <div class="modal-head-left">
          <span class="pre-no">{{ row.preOutboundNo }}</span>
          <NTag :type="statusMeta.type" size="small">{{ statusMeta.label }}</NTag>
        </div>
      </div>

      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="BASIC" tab="基础信息">
          <section class="delivery-section">
            <div class="section-title">基础信息</div>
            <NForm label-placement="left" :label-width="92">
              <div class="delivery-form-grid">
                <NFormItem label="预出单号" class="readonly-field">
                  <NInput :value="row.preOutboundNo" disabled />
                </NFormItem>
                <NFormItem label="订单号" class="readonly-field">
                  <NInput :value="val(row.cargoOrderNo)" disabled />
                </NFormItem>
                <NFormItem label="客户" class="readonly-field">
                  <NInput :value="val(row.customerName)" disabled />
                </NFormItem>
                <NFormItem label="柜号" class="readonly-field">
                  <NInput :value="val(row.containerNo)" disabled />
                </NFormItem>
                <NFormItem label="出库仓库" class="readonly-field">
                  <NInput :value="val(row.outboundWarehouseName)" disabled />
                </NFormItem>
                <NFormItem label="业务类型" class="readonly-field">
                  <NInput :value="val(row.deliveryMethod)" disabled />
                </NFormItem>
                <NFormItem label="目的地" class="readonly-field">
                  <NInput :value="val(row.destination || row.outboundWarehouseName)" disabled />
                </NFormItem>
                <NFormItem label="出库类型">
                  <NSelect
                    :to="POPUP_TO_BODY"
                    v-model:value="editForm.outboundType"
                    :options="OUTBOUND_TYPE_OPTIONS"
                    :disabled="!canEdit"
                    placeholder="请选择出库类型"
                  />
                </NFormItem>
                <NFormItem label="预约号">
                  <NInput v-model:value="editForm.appointmentNo" :disabled="!canEdit" placeholder="请输入预约号" />
                </NFormItem>
                <NFormItem label="APPT">
                  <NDatePicker
                    :to="POPUP_TO_BODY"
                    v-model:value="editForm.appointmentTime"
                    type="datetime"
                    clearable
                    class="w-full"
                    :disabled="!canEdit"
                    placeholder="请选择预约时间"
                  />
                </NFormItem>
                <NFormItem label="派送卡车">
                  <NInput v-model:value="editForm.deliveryTruck" :disabled="!canEdit" placeholder="请输入派送卡车" />
                </NFormItem>
                <NFormItem label="派送标签">
                  <NInput v-model:value="editForm.deliveryTag" :disabled="!canEdit" placeholder="请输入派送标签" />
                </NFormItem>
                <NFormItem label="装车类型">
                  <NRadioGroup v-model:value="editForm.loadingType" :disabled="!canEdit">
                    <NRadioButton value="PALLET">{{ LOADING_TYPE_META.PALLET }}</NRadioButton>
                    <NRadioButton value="FLOOR">{{ LOADING_TYPE_META.FLOOR }}</NRadioButton>
                  </NRadioGroup>
                </NFormItem>
                <NFormItem label="运输类型">
                  <NRadioGroup v-model:value="editForm.transportType" :disabled="!canEdit">
                    <NRadioButton value="FTL">FTL</NRadioButton>
                    <NRadioButton value="LTL">LTL</NRadioButton>
                  </NRadioGroup>
                </NFormItem>
                <NFormItem label="跟进记录">
                  <NInput v-model:value="editForm.followRecord" :disabled="!canEdit" placeholder="请输入跟进记录" />
                </NFormItem>
                <NFormItem label="备注">
                  <NInput v-model:value="editForm.remark" :disabled="!canEdit" placeholder="请输入备注" />
                </NFormItem>
              </div>
            </NForm>
          </section>

          <section v-if="mode === 'convert'" class="delivery-section mt-16px">
            <div class="section-title">转出库补充</div>
            <NForm label-placement="left" :label-width="92">
              <div class="delivery-form-grid">
                <NFormItem label="预约状态">
                  <NRadioGroup v-model:value="editForm.appointmentStatus" :disabled="!canConvert">
                    <NRadioButton value="UNCONFIRMED">未确认</NRadioButton>
                    <NRadioButton value="CONFIRMED">已确认</NRadioButton>
                    <NRadioButton value="EXPLODED">爆仓</NRadioButton>
                  </NRadioGroup>
                </NFormItem>
                <NFormItem label="预约方">
                  <NRadioGroup v-model:value="editForm.appointmentType" :disabled="!canConvert">
                    <NRadioButton value="SELF">自有约</NRadioButton>
                    <NRadioButton value="SUPPLIER">供应商约</NRadioButton>
                  </NRadioGroup>
                </NFormItem>
                <NFormItem label="发车日期">
                  <NDatePicker
                    :to="POPUP_TO_BODY"
                    v-model:value="editForm.shipDate"
                    type="date"
                    clearable
                    class="w-full"
                    :disabled="!canConvert"
                    placeholder="请选择发车日期"
                  />
                </NFormItem>
                <NFormItem label="派送成本">
                  <NInputGroup>
                    <NInputNumber v-model:value="editForm.deliveryCost" class="w-full" :min="0" :disabled="!canConvert" placeholder="请输入" />
                    <NInputGroupLabel>USD</NInputGroupLabel>
                  </NInputGroup>
                </NFormItem>
                <NFormItem label="是否转仓">
                  <NRadioGroup v-model:value="editForm.transferFlag" :disabled="!canConvert">
                    <NRadioButton :value="1">是</NRadioButton>
                    <NRadioButton :value="0">否</NRadioButton>
                  </NRadioGroup>
                </NFormItem>
              </div>
            </NForm>
          </section>
        </NTabPane>

        <NTabPane name="DETAIL" tab="出库明细">
          <section class="delivery-section">
            <div class="delivery-detail-body">
              <NTabs v-model:value="detailReadinessTab" type="card">
                <NTabPane
                  v-for="tab in readinessTabs"
                  :key="tab.value"
                  :name="tab.value"
                  :tab="`${tab.label} ${tab.count}`"
                />
              </NTabs>
              <div class="detail-toolbar">
                <NSpace>
                  <NButton v-if="canEdit" size="small" type="primary" @click="addDrawerVisible = true">新增货物信息</NButton>
                  <NTag v-if="usingMockPallet" size="small" type="warning">卡板号为模拟数据，待打板功能接入</NTag>
                </NSpace>
                <span class="detail-total">
                  <template v-if="isPalletDimensionTab">
                    合计: {{ detailTotals.palletQty }} 板,
                  </template>
                  <template v-else>合计: {{ detailTotals.orderQty }} 票,</template>
                  {{ detailTotals.pcs }} PCS,
                  {{ formatNumber(detailTotals.cbm) }} CBM,
                  {{ formatNumber(detailTotals.weight) }} lbs
                </span>
              </div>
              <NSpin :show="detailLoading">
                <div class="delivery-detail-table">
                  <table>
                    <thead>
                      <tr>
                        <th>订单号</th>
                        <th>柜号</th>
                        <th v-if="isPalletDimensionTab">卡板号</th>
                        <th v-if="isPalletDimensionTab">库位</th>
                        <th>预计箱数</th>
                        <th>入库箱数</th>
                        <th>件重体</th>
                        <th>追踪编码</th>
                        <th>货件编码</th>
                        <th v-if="canEdit">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in currentPalletRows" :key="item.id">
                        <td>{{ item.cargoOrderNo }}</td>
                        <td>{{ item.containerNo }}</td>
                        <td v-if="isPalletDimensionTab">
                          <span>{{ item.palletNo || '--' }}</span>
                          <NTag v-if="item.isMock" size="tiny" type="warning" class="mock-tag">模拟</NTag>
                        </td>
                        <td v-if="isPalletDimensionTab">{{ item.location || '--' }}</td>
                        <td>{{ formatNumber(item.declaredCartonQty) }}</td>
                        <td>{{ formatNumber(item.actualCartonQty) }}</td>
                        <td>
                          <div>件数: {{ formatNumber(item.actualCartonQty) }}</div>
                          <div>重量(lbs): {{ formatNumber(item.actualWeight) }}</div>
                          <div>体积: {{ formatNumber(item.actualCbm) }}</div>
                        </td>
                        <td>{{ item.poNo }}</td>
                        <td>{{ item.shipmentCode }}</td>
                        <td v-if="canEdit">
                          <NButton
                            text
                            type="error"
                            :loading="removingItemId === item.itemId"
                            @click="handleRemoveItem(item.itemId)"
                          >
                            删除
                          </NButton>
                        </td>
                      </tr>
                      <tr v-if="!currentPalletRows.length && !detailLoading">
                        <td :colspan="canEdit ? (isPalletDimensionTab ? 10 : 8) : isPalletDimensionTab ? 9 : 7" class="empty-cell">
                          暂无明细数据
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </NSpin>
            </div>
          </section>
        </NTabPane>
      </NTabs>

      <PreOutboundAddCargoDrawer
        v-model:visible="addDrawerVisible"
        :pre-outbound-id="row?.id ?? null"
        :excluded-cargo-order-ids="excludedCargoOrderIds"
        @added="handleItemsAdded"
      />
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">关闭</NButton>
        <NButton v-if="canEdit" type="primary" secondary :loading="saving" @click="submitSave">保存</NButton>
        <NButton
          v-if="mode === 'convert' && canConvert"
          type="primary"
          :loading="converting"
          @click="submitConvert"
        >
          确认转出库
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.delivery-modal :deep(.n-card__content) {
  max-height: 72vh;
  overflow-y: auto;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.modal-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pre-no {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.delivery-section {
  overflow: hidden;
  border: 1px solid #dfe5ef;
  border-radius: 4px;
  background: #fff;
}
.section-title {
  border-bottom: 1px solid #dfe5ef;
  background: #f8fafc;
  padding: 12px 18px;
  color: #303640;
  font-size: 15px;
  font-weight: 600;
}
.delivery-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px 16px;
  padding: 14px 16px 10px;
}
.delivery-form-grid :deep(.n-form-item) {
  margin-bottom: 4px;
}
.readonly-field :deep(.n-input.n-input--disabled .n-input-wrapper) {
  background-color: #f5f7fa;
  border-radius: 4px;
}
.readonly-field :deep(.n-input.n-input--disabled .n-input__border),
.readonly-field :deep(.n-input.n-input--disabled .n-input__state-border) {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
.readonly-field :deep(.n-input.n-input--disabled .n-input__input-el) {
  color: #909399;
  cursor: not-allowed;
}
.delivery-detail-body {
  padding: 12px 16px 14px;
}
.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.detail-total {
  color: #5f6673;
  font-size: 14px;
}
.delivery-detail-table {
  max-height: 360px;
  overflow: auto;
}
.delivery-detail-table table {
  width: 100%;
  border-collapse: collapse;
}
.delivery-detail-table th {
  border-bottom: 1px solid #e8edf5;
  color: #8a909b;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}
.delivery-detail-table th,
.delivery-detail-table td {
  padding: 10px 8px;
}
.delivery-detail-table td {
  border-bottom: 1px solid #eef2f7;
  color: #5f6673;
  vertical-align: top;
}
.mock-tag {
  margin-left: 6px;
}
.empty-cell {
  height: 90px;
  color: #9ca3af !important;
  text-align: center !important;
}
.w-full {
  width: 100%;
}
.mt-16px {
  margin-top: 16px;
}
</style>
