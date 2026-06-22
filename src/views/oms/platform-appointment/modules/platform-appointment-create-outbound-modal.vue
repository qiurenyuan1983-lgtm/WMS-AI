<script setup lang="ts">
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
  NTag
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import {
  fetchCreatePlatformAppointmentOutbound,
  fetchCreatePlatformAppointmentPreOutbound,
  fetchGetPlatformAppointmentInboundLines,
  fetchGetPlatformAppointmentPreOutboundLines
} from '@/service/api/oms/platform-appointment';
import SupplierQuoteRecommendField from '../../shared/modules/supplier-quote-recommend-field.vue';

defineOptions({ name: 'PlatformAppointmentCreateOutboundModal' });

const props = withDefaults(
  defineProps<{
    mode?: 'outbound' | 'pre-outbound';
    preOutboundFilter?: Api.Oms.PlatformAppointmentPreOutboundFilter | null;
  }>(),
  {
    mode: 'outbound',
    preOutboundFilter: null
  }
);

const visible = defineModel<boolean>('visible', { default: false });
const appointment = defineModel<Api.Oms.PlatformAppointment | null>('appointment', { default: null });

const emit = defineEmits<{
  success: [result: Api.Oms.PlatformAppointmentCreateOutboundResult | Api.Oms.PlatformAppointmentCreatePreOutboundResult];
}>();

const isPreOutbound = computed(() => props.mode === 'pre-outbound');
const modalTitle = computed(() => (isPreOutbound.value ? '创建预出单' : '创建出库单'));
const detailSectionTitle = computed(() => (isPreOutbound.value ? '预出明细' : '出库明细'));
const confirmText = computed(() => (isPreOutbound.value ? '确认预出单' : '确认出单'));

const loadingLines = ref(false);
const submitting = ref(false);
const detailLines = ref<Api.Oms.PlatformAppointmentInboundLine[]>([]);

const deliveryForm = reactive({
  destination: '',
  businessTypeId: null as CommonType.IdType | null,
  deliveryTruck: '',
  deliveryTag: '',
  palletQty: 0,
  shipDate: null as number | null,
  appointmentTime: null as number | null,
  appointmentStatus: 'CONFIRMED',
  appointmentType: 'SELF',
  loadingType: 'PALLET',
  transportType: 'FTL',
  deliveryCost: null as number | null,
  appointmentNo: '',
  followRecord: '',
  outboundType: 'DELIVERY',
  transferFlag: 0,
  transferWarehouseCode: '',
  remark: ''
});

const preOutboundSupplierId = ref<CommonType.IdType | null>(null);
const preOutboundSupplierQuoteId = ref<CommonType.IdType | null>(null);
const preOutboundRecommendedSupplierId = ref<CommonType.IdType | null>(null);

const supplierRecommendContext = computed(() => ({
  destination: deliveryForm.destination,
  warehouseName: null,
  transportType: deliveryForm.transportType,
  loadingType: deliveryForm.loadingType
}));

const detailLabel = computed(() => {
  if (isPreOutbound.value) {
    const inbounded = detailLines.value.filter(row => row.readiness === 'INBOUNDED').length;
    const pending = detailLines.value.filter(row => row.readiness !== 'INBOUNDED').length;
    return `货物 ${detailLines.value.length}（待入库 ${pending} / 已入库 ${inbounded}）`;
  }
  return `已入库 ${detailLines.value.length}`;
});

const detailTotals = computed(() =>
  detailLines.value.reduce(
    (total, row) => {
      total.pcs += Number(row.pieceQty || 0);
      total.cbm += Number(row.cbm || 0);
      total.weight += Number(row.weight || 0);
      return total;
    },
    { pcs: 0, cbm: 0, weight: 0 }
  )
);

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2);
}

function parseDateTime(value: string | null | undefined) {
  if (!value) return null;
  const ts = Date.parse(String(value).replace(' ', 'T'));
  return Number.isNaN(ts) ? null : ts;
}

function buildDestination(row: Api.Oms.PlatformAppointment) {
  return `${row.platformName} / ${row.warehouseCode}`;
}

function readinessLabel(readiness?: string) {
  return readiness === 'INBOUNDED' ? '已入库' : '待入库';
}

function readinessType(readiness?: string): NaiveUI.ThemeColor {
  return readiness === 'INBOUNDED' ? 'success' : 'warning';
}

function resetForm(row: Api.Oms.PlatformAppointment) {
  deliveryForm.destination = buildDestination(row);
  deliveryForm.appointmentNo = row.appointmentNo;
  deliveryForm.appointmentTime = parseDateTime(row.appointmentTime);
  deliveryForm.appointmentType = 'SELF';
  deliveryForm.appointmentStatus = 'CONFIRMED';
  deliveryForm.loadingType = 'PALLET';
  deliveryForm.transportType = 'FTL';
  deliveryForm.outboundType = 'DELIVERY';
  deliveryForm.transferFlag = 0;
  deliveryForm.palletQty = detailLines.value.length * 2;
  deliveryForm.remark = row.remark || '';
  deliveryForm.businessTypeId = null;
  deliveryForm.deliveryTruck = '';
  deliveryForm.deliveryTag = '';
  deliveryForm.shipDate = null;
  deliveryForm.deliveryCost = null;
  deliveryForm.followRecord = '';
  deliveryForm.transferWarehouseCode = '';
  preOutboundSupplierId.value = null;
  preOutboundSupplierQuoteId.value = null;
  preOutboundRecommendedSupplierId.value = null;
}

async function loadDetailLines() {
  if (!appointment.value?.id) {
    detailLines.value = [];
    return;
  }
  loadingLines.value = true;
  if (isPreOutbound.value && props.preOutboundFilter) {
    const { data, error } = await fetchGetPlatformAppointmentPreOutboundLines(
      appointment.value.id,
      props.preOutboundFilter
    );
    detailLines.value = error ? [] : data || [];
  } else {
    const { data, error } = await fetchGetPlatformAppointmentInboundLines(appointment.value.id);
    detailLines.value = error ? [] : data || [];
  }
  loadingLines.value = false;
  if (appointment.value) resetForm(appointment.value);
}

async function handleConfirm() {
  if (!appointment.value || submitting.value) return;
  if (!detailLines.value.length) {
    window.$message?.warning(isPreOutbound.value ? '暂无匹配货物，无法预出单' : '暂无已入库货物，无法出单');
    return;
  }
  submitting.value = true;
  const payload = {
    ...deliveryForm,
    preOutboundFilter: props.preOutboundFilter,
    supplierId: preOutboundSupplierId.value,
    supplierQuoteId: preOutboundSupplierQuoteId.value,
    recommendedSupplierId: preOutboundRecommendedSupplierId.value
  };
  const { data, error } = isPreOutbound.value
    ? await fetchCreatePlatformAppointmentPreOutbound(appointment.value.id, payload)
    : await fetchCreatePlatformAppointmentOutbound(appointment.value.id, payload);
  submitting.value = false;
  if (error || !data) return;
  if (isPreOutbound.value) {
    window.$message?.success(`预出单已生成：${(data as Api.Oms.PlatformAppointmentCreatePreOutboundResult).preOutboundNo}`);
  } else {
    window.$message?.success(`出库单已生成：${(data as Api.Oms.PlatformAppointmentCreateOutboundResult).outboundOrderNo}`);
  }
  appointment.value = data.appointment;
  emit('success', data);
  visible.value = false;
}

watch(visible, val => {
  if (val) loadDetailLines();
  else detailLines.value = [];
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="modalTitle"
    class="delivery-modal"
    style="width: min(980px, 72vw); max-width: calc(100vw - 96px)"
    :mask-closable="false"
  >
    <section v-if="appointment" class="delivery-section">
      <div class="section-title">基础信息</div>
      <NForm label-placement="left" :label-width="92">
        <div class="delivery-form-grid">
          <NFormItem label="目的地">
            <NInput v-model:value="deliveryForm.destination" readonly placeholder="平台 / 仓库代码" />
          </NFormItem>
          <NFormItem label="业务类型">
            <NSelect
              :to="POPUP_TO_BODY"
              v-model:value="deliveryForm.businessTypeId"
              :options="[]"
              clearable
              filterable
              placeholder="请选择业务类型"
            />
          </NFormItem>
          <NFormItem label="派送卡车">
            <NInput v-model:value="deliveryForm.deliveryTruck" placeholder="请输入派送卡车" />
          </NFormItem>
          <NFormItem label="派送标签">
            <NInput v-model:value="deliveryForm.deliveryTag" placeholder="请输入派送标签" />
          </NFormItem>
          <NFormItem label="卡板数量">
            <NInputNumber v-model:value="deliveryForm.palletQty" class="w-full" :min="0" />
          </NFormItem>
          <NFormItem label="发车日期">
            <NDatePicker
              :to="POPUP_TO_BODY"
              v-model:value="deliveryForm.shipDate"
              type="date"
              clearable
              class="w-full"
              placeholder="请选择日期"
            />
          </NFormItem>
          <NFormItem label="APPT">
            <NDatePicker
              :to="POPUP_TO_BODY"
              v-model:value="deliveryForm.appointmentTime"
              type="datetime"
              clearable
              class="w-full"
              placeholder="预约时间"
              disabled
            />
          </NFormItem>
          <NFormItem label="* 预约状态">
            <NRadioGroup v-model:value="deliveryForm.appointmentStatus">
              <NRadioButton value="UNCONFIRMED">未确认</NRadioButton>
              <NRadioButton value="CONFIRMED">已确认</NRadioButton>
              <NRadioButton value="EXPLODED">爆仓</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="* 装车类型">
            <NRadioGroup v-model:value="deliveryForm.loadingType">
              <NRadioButton value="PALLET">卡板</NRadioButton>
              <NRadioButton value="FLOOR">地板</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="* 运输类型">
            <NRadioGroup v-model:value="deliveryForm.transportType">
              <NRadioButton value="FTL">FTL</NRadioButton>
              <NRadioButton value="LTL">LTL</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="* 预约方">
            <NRadioGroup v-model:value="deliveryForm.appointmentType">
              <NRadioButton value="SELF">自有约</NRadioButton>
              <NRadioButton value="SUPPLIER" :disabled="!isPreOutbound">供应商约</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <SupplierQuoteRecommendField
            v-if="isPreOutbound"
            v-model:supplier-id="preOutboundSupplierId"
            v-model:supplier-quote-id="preOutboundSupplierQuoteId"
            v-model:recommended-supplier-id="preOutboundRecommendedSupplierId"
            v-model:delivery-cost="deliveryForm.deliveryCost"
            :context="supplierRecommendContext"
            label="推荐供应商"
          />
          <NFormItem label="派送成本">
            <NInputGroup>
              <NInputNumber v-model:value="deliveryForm.deliveryCost" class="w-full" :min="0" placeholder="请输入" />
              <NInputGroupLabel>USD</NInputGroupLabel>
            </NInputGroup>
          </NFormItem>
          <NFormItem label="预约号">
            <NInput v-model:value="deliveryForm.appointmentNo" readonly placeholder="预约号" />
          </NFormItem>
          <NFormItem label="备注">
            <NInput v-model:value="deliveryForm.remark" placeholder="请输入" />
          </NFormItem>
          <NFormItem label="跟进记录">
            <NInput v-model:value="deliveryForm.followRecord" placeholder="请输入跟进记录" />
          </NFormItem>
          <NFormItem label="* 出库类型">
            <NSelect
              :to="POPUP_TO_BODY"
              v-model:value="deliveryForm.outboundType"
              placeholder="请选择"
              :options="[
                { label: '派送出库', value: 'DELIVERY' },
                { label: '调拨出库', value: 'TRANSFER' }
              ]"
            />
          </NFormItem>
          <NFormItem label="* 是否转仓">
            <NRadioGroup v-model:value="deliveryForm.transferFlag">
              <NRadioButton :value="1">是</NRadioButton>
              <NRadioButton :value="0">否</NRadioButton>
            </NRadioGroup>
          </NFormItem>
        </div>
      </NForm>
    </section>

    <section class="delivery-section mt-16px">
      <div class="section-title">{{ detailSectionTitle }}</div>
      <div class="delivery-detail-body">
        <div class="detail-toolbar">
          <span class="detail-tab-label">{{ detailLabel }}</span>
          <div class="detail-total">
            合计: {{ detailTotals.pcs }} PCS, {{ formatNumber(detailTotals.cbm) }} CBM,
            {{ formatNumber(detailTotals.weight) }} lbs
          </div>
        </div>
        <div class="delivery-detail-table">
          <table>
            <thead>
              <tr>
                <th v-if="isPreOutbound">状态</th>
                <th>订单号</th>
                <th>柜号</th>
                <th>卡板号</th>
                <th>库位</th>
                <th>件重体</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in detailLines" :key="row.id">
                <td v-if="isPreOutbound">
                  <NTag size="small" :type="readinessType(row.readiness)">
                    {{ readinessLabel(row.readiness) }}
                  </NTag>
                </td>
                <td>{{ row.cargoOrderNo }}</td>
                <td>{{ row.containerNo || '--' }}</td>
                <td>{{ row.palletNo || '--' }}</td>
                <td>{{ row.storageLocation || '--' }}</td>
                <td>
                  <div>件数: {{ row.pieceQty }}</div>
                  <div>重量(lbs): {{ formatNumber(row.weight) }}</div>
                  <div>体积: {{ formatNumber(row.cbm) }}</div>
                </td>
              </tr>
              <tr v-if="!loadingLines && !detailLines.length">
                <td :colspan="isPreOutbound ? 6 : 5" class="empty-cell">
                  {{ isPreOutbound ? '暂无匹配货物' : '暂无已入库数据' }}
                </td>
              </tr>
              <tr v-if="loadingLines">
                <td :colspan="isPreOutbound ? 6 : 5" class="empty-cell">加载中...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="submitting" :disabled="!detailLines.length" @click="handleConfirm">
          {{ confirmText }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
:deep(.delivery-modal) {
  width: min(980px, 72vw) !important;
  max-width: calc(100vw - 96px);
}
.delivery-modal :deep(.n-card__content) {
  max-height: 72vh;
  overflow-y: auto;
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
.delivery-detail-body {
  padding: 12px 16px 14px;
}
.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}
.detail-tab-label {
  color: #303640;
  font-size: 14px;
  font-weight: 600;
}
.detail-total {
  color: #5f6673;
  font-size: 14px;
}
.delivery-detail-table {
  max-height: 220px;
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
}
.delivery-detail-table th,
.delivery-detail-table td {
  padding: 10px 8px;
}
.delivery-detail-table td {
  border-bottom: 1px solid #eef2f7;
  color: #5f6673;
}
.empty-cell {
  height: 90px;
  color: #9ca3af !important;
  text-align: center !important;
}
</style>
