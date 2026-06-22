<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInputGroup,
  NInputGroupLabel,
  NInputNumber,
  NModal,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetPlatformAppointmentList } from '@/service/api/oms/platform-appointment';
import SupplierQuoteRecommendField from '@/views/oms/shared/modules/supplier-quote-recommend-field.vue';
import { buildBatchTripOrderNo } from '@/utils/oms/ltl-generate-trip-order';

defineOptions({ name: 'WorkbenchGenerateTripModal' });

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  loading?: boolean;
  rows: Api.Oms.OrderWorkbenchRow[];
}>();

const emit = defineEmits<{ confirm: [payload: Api.Oms.OrderWorkbenchBatchGenerateTripParams] }>();

const LBS_TO_KG = 0.453592;

function rowWeightKg(row: Api.Oms.OrderWorkbenchRow) {
  const lbs = Number(row.weightLbs || 0);
  if (lbs > 0) return lbs * LBS_TO_KG;
  return Number(row.palletQty || 0) * 450;
}

const detailTotals = computed(() =>
  props.rows.reduce(
    (total, row) => {
      total.weightKg += rowWeightKg(row);
      total.cbm += Number(row.volumeCbm || 0);
      total.palletQty += Number(row.palletQty || 0);
      return total;
    },
    { weightKg: 0, cbm: 0, palletQty: 0 }
  )
);

const formattedDetailTotals = computed(() => ({
  weightKg: detailTotals.value.weightKg.toFixed(1),
  cbm: detailTotals.value.cbm.toFixed(2),
  palletQty: detailTotals.value.palletQty
}));

const supplierId = ref<CommonType.IdType | null>(null);
const supplierQuoteId = ref<CommonType.IdType | null>(null);
const recommendedSupplierId = ref<CommonType.IdType | null>(null);
const deliveryCost = ref<number | null>(null);
const appointmentId = ref<number | null>(null);
const loadingType = ref<'PALLET' | 'FLOOR'>('PALLET');
const pickupTime = ref<number | null>(null);
const appointmentTime = ref<number | null>(null);
const appointmentRows = ref<Api.Oms.PlatformAppointment[]>([]);

const tripNo = computed(() =>
  props.rows.length ? buildBatchTripOrderNo(props.rows.map(row => row.id)) : '—'
);

const appointmentOptions = computed(() =>
  appointmentRows.value.map(row => ({
    label: `${row.appointmentNo} · ${row.warehouseCode} · ${row.appointmentTime}`,
    value: row.id,
    row
  }))
);

const supplierContext = computed(() => {
  const first = props.rows[0];
  return {
    destination: first?.destination ?? null,
    warehouseName: first?.destination ?? null,
    transportType: first?.pool === 'LTL' ? 'LTL' : 'FTL',
    loadingType: loadingType.value
  };
});

const detailColumns: DataTableColumns<Api.Oms.OrderWorkbenchRow> = [
  { title: '订单号', key: 'orderNo', width: 130, ellipsis: { tooltip: true } },
  { title: '客户', key: 'customerName', width: 110, ellipsis: { tooltip: true } },
  { title: '目的地', key: 'destination', width: 90, ellipsis: { tooltip: true } },
  { title: 'ISA/预约', key: 'isaNo', width: 120, render: row => row.isaNo || '—' },
  { title: '板数', key: 'palletQty', width: 56, align: 'center' },
  {
    title: '重量(KG)',
    key: 'weightKg',
    width: 88,
    align: 'right',
    render: row => {
      const lbs = Number(row.weightLbs || 0);
      const kg = lbs > 0 ? lbs * 0.453592 : Number(row.palletQty || 0) * 450;
      return kg.toFixed(1);
    }
  },
  {
    title: 'CBM',
    key: 'volumeCbm',
    width: 72,
    align: 'right',
    render: row => Number(row.volumeCbm || 0).toFixed(2)
  }
];

function resolveLoadingType(appt: Api.Oms.PlatformAppointment): 'PALLET' | 'FLOOR' {
  if (appt.appointmentNo.startsWith('ISA')) return 'PALLET';
  if (appt.appointmentType === 'TRANSFER') return 'FLOOR';
  return 'PALLET';
}

function applyAppointment(appt: Api.Oms.PlatformAppointment | undefined) {
  if (!appt) return;
  loadingType.value = resolveLoadingType(appt);
  appointmentTime.value = Date.parse(appt.appointmentTime.replace(' ', 'T'));
}

async function loadAppointments() {
  const destinations = [...new Set(props.rows.map(row => row.destination).filter(Boolean))];
  const { data } = await fetchGetPlatformAppointmentList({
    pageNum: 1,
    pageSize: 50,
    status: 'UNUSED'
  });
  const rows = data?.rows ?? [];
  appointmentRows.value = rows.filter(row => {
    if (!destinations.length) return true;
    return destinations.some(dest => row.warehouseCode.includes(dest) || dest.includes(row.warehouseCode));
  });
  if (!appointmentRows.value.length) appointmentRows.value = rows.slice(0, 8);

  const matchedIsa = props.rows.find(row => row.isaNo)?.isaNo;
  const preset = appointmentRows.value.find(row => row.appointmentNo === matchedIsa) ?? appointmentRows.value[0];
  if (preset) {
    appointmentId.value = Number(preset.id);
    applyAppointment(preset);
  }
}

function resetForm() {
  supplierId.value = null;
  supplierQuoteId.value = null;
  recommendedSupplierId.value = null;
  deliveryCost.value = null;
  appointmentId.value = null;
  loadingType.value = 'PALLET';
  pickupTime.value = null;
  appointmentTime.value = null;
  appointmentRows.value = [];
}

watch(visible, async show => {
  if (!show) {
    resetForm();
    return;
  }
  await loadAppointments();
});

watch(appointmentId, id => {
  const appt = appointmentRows.value.find(row => Number(row.id) === Number(id));
  applyAppointment(appt);
});

function formatDateTimeValue(value: number | null) {
  if (!value) return null;
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildConfirmPayload(): Api.Oms.OrderWorkbenchBatchGenerateTripParams {
  const appt = appointmentRows.value.find(row => Number(row.id) === Number(appointmentId.value));
  return {
    supplierId: supplierId.value,
    supplierQuoteId: supplierQuoteId.value,
    deliveryCost: deliveryCost.value,
    appointmentId: appointmentId.value,
    appointmentNo: appt?.appointmentNo ?? null,
    loadingType: loadingType.value,
    pickupTime: formatDateTimeValue(pickupTime.value),
    appointmentTime: formatDateTimeValue(appointmentTime.value)
  };
}

function handleConfirm() {
  emit('confirm', buildConfirmPayload());
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="生成车次订单"
    class="workbench-trip-modal w-1120px max-w-96vw"
    :mask-closable="!loading"
    :closable="!loading"
  >
    <div class="trip-modal-body">
      <div class="trip-no-bar">
        车次号：<span class="trip-no">{{ tripNo }}</span>
        <span class="trip-meta">共 {{ rows.length }} 笔订单</span>
      </div>

      <NForm label-placement="left" label-width="88" :show-feedback="false" class="trip-form">
        <div class="trip-form-grid">
          <SupplierQuoteRecommendField
            v-model:supplier-id="supplierId"
            v-model:supplier-quote-id="supplierQuoteId"
            v-model:recommended-supplier-id="recommendedSupplierId"
            v-model:delivery-cost="deliveryCost"
            :context="supplierContext"
            label="供应商"
          />
          <NFormItem label="预约号">
            <NSelect
              :to="POPUP_TO_BODY"
              v-model:value="appointmentId"
              :options="appointmentOptions"
              filterable
              placeholder="选择预约号"
            />
          </NFormItem>
          <NFormItem label="Floor/Pallet">
            <NRadioGroup v-model:value="loadingType" class="loading-type-group">
              <NRadioButton value="PALLET">Pallet</NRadioButton>
              <NRadioButton value="FLOOR">Floor</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="报价(USD)">
            <NInputGroup>
              <NInputNumber v-model:value="deliveryCost" class="w-full" :min="0" placeholder="自动匹配" />
              <NInputGroupLabel>USD</NInputGroupLabel>
            </NInputGroup>
          </NFormItem>
          <NFormItem label="提货时间">
            <NDatePicker
              :to="POPUP_TO_BODY"
              v-model:value="pickupTime"
              type="datetime"
              clearable
              class="w-full"
              placeholder="选择提货时间"
            />
          </NFormItem>
          <NFormItem label="预约时间">
            <NDatePicker
              :to="POPUP_TO_BODY"
              v-model:value="appointmentTime"
              type="datetime"
              clearable
              class="w-full"
              placeholder="选择预约时间"
            />
          </NFormItem>
        </div>
      </NForm>

      <div class="detail-section">
        <div class="detail-header">
          <div class="detail-title">车次订单详情</div>
          <div class="detail-summary">
            <span>总重量 <strong>{{ formattedDetailTotals.weightKg }}</strong> KG</span>
            <span>总 CBM <strong>{{ formattedDetailTotals.cbm }}</strong></span>
            <span>总卡板 <strong>{{ formattedDetailTotals.palletQty }}</strong> 板</span>
          </div>
        </div>
        <NDataTable
          :columns="detailColumns"
          :data="rows"
          :row-key="(row: Api.Oms.OrderWorkbenchRow) => row.id"
          size="small"
          :max-height="280"
          :scroll-x="760"
        />
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="loading" @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="loading" :disabled="!rows.length" @click="handleConfirm">
          确认生成
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.trip-no-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
}

.trip-no {
  font-weight: 700;
  color: rgb(var(--primary-color));
}

.trip-meta {
  color: #6b7280;
}

.trip-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.detail-section {
  margin-top: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
}

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: #4b5563;

  strong {
    color: #111827;
    font-weight: 700;
  }
}

.loading-type-group :deep(.n-radio-button.n-radio-button--checked) {
  border-color: #16a34a !important;
  color: #16a34a !important;
  box-shadow: 0 0 0 1px #16a34a inset;
  background: rgb(22 163 74 / 0.06);
}

@media (max-width: 768px) {
  .trip-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
