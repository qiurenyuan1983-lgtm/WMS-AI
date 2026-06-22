<script setup lang="ts">
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { displayAppointmentNo } from '@/utils/oms/appointment-no';
import { CARGO_OPERATION_STATUS_META, type CargoOperationStatus } from '@/utils/oms/operation-status';
import { resolveShippingMarkFromOrder } from '@/utils/oms/shipping-mark';
import { computed, h, ref, watch } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { jsonClone } from '@sa/utils';
import {
  fetchDeleteShipment,
  fetchDeleteSkuItem,
  fetchGetCargoOrderDetail,
  fetchSaveShipment,
  fetchSaveSkuItem,
  fetchUpdateCargoOrder
} from '@/service/api/oms/cargo-order';
import { fetchGetPlatformAddressList, fetchGetPlatformList, fetchGetBusinessTypeList } from '@/service/api/base';
import { fetchGetUserList } from '@/service/api/system/user';
import CargoOrderShipmentSkuPanel from './cargo-order-shipment-sku-panel.vue';
import type { ShipmentEditableModel } from '../../container-order/modules/container-cargo-order-shipment-table.vue';
import {
  isByPallet,
  isTruckDeliveryBusinessType,
  mapBusinessTypeOptions,
  normalizeDatePickerDate,
  normalizeDatePickerDateTime,
  validateContainerCargoOrder
} from '../../container-order/utils/container-cargo-order';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import AttachmentManager from '../../components/attachment-manager.vue';
import {
  LOOSE_PALLET_DELIVERY_MODE_LABEL,
  toPalletLabelPrintRows
} from '../../container-order/utils/loose-pallet-order';
import { printPalletLabel, printPalletLabels } from '@/views/wms/devanning-work/utils/print-pallet-label';

defineOptions({ name: 'CargoOrderDetailDrawer' });

interface Props {
  orderId?: CommonType.IdType;
  startEdit?: boolean;
  initialTab?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'refresh'): void }>();

const visible = defineModel<boolean>('visible', { default: false });
const { hasAuth } = useAuth();
const { options: addressTypeOptions, record: addressTypeRecord } = useDict('oms_address_type');
const { options: parcelCarrierOptions } = useDict('oms_parcel_carrier');
const { options: timelinessLevelOptions, record: timelinessLevelRecord } = useDict('oms_timeliness_level');

const loading = ref(false);
const shipmentEditModel = ref<ShipmentEditableModel>({ forecastQtyUnit: 'BY_CARTON', shipments: [] });
const originalShipmentIds = ref<Set<string>>(new Set());
const originalSkuIds = ref<Set<string>>(new Set());
const detail = ref<Api.Oms.NewCargoOrder | null>(null);
const activeTab = ref('basic');
const editMode = ref(true);
const privilegedEditMode = ref(false);
const editModel = ref<Partial<Api.Oms.NewCargoOrder> | null>(null);
const platformOptions = ref<CommonType.Option[]>([]);
const platformRows = ref<Api.Base.Platform[]>([]);
const platformAddressRows = ref<Api.Base.PlatformAddress[]>([]);
const userRows = ref<Api.System.User[]>([]);
const businessTypeRows = ref<Api.Base.BusinessType[]>([]);
const businessTypeOptions = ref<CommonType.Option[]>([]);

const ORDER_SOURCE_LABELS: Record<string, string> = {
  SELF: '自建单',
  MANUAL: '自建单',
  IMPORT: '自建单',
  API: 'API下单',
  PORTAL: '客户门户下单'
};

function orderSourceLabel(value?: string | null) {
  return (value && ORDER_SOURCE_LABELS[value]) || value || '--';
}

const isLoosePalletOrder = computed(() => detail.value?.orderSubType === 'LOOSE_PALLET');

const loosePalletLabels = computed(() => detail.value?.loosePalletLabels || []);

function printAllLoosePalletLabels() {
  const rows = toPalletLabelPrintRows(loosePalletLabels.value, {
    cargoOrderNo: detail.value?.cargoOrderNo,
    carriageNo: detail.value?.carriageNo,
    groupCode: detail.value?.groupCode
  });
  printPalletLabels(rows);
}

function printSingleLoosePalletLabel(row: Api.Oms.LoosePalletLabelItem) {
  const [printRow] = toPalletLabelPrintRows([row], {
    cargoOrderNo: detail.value?.cargoOrderNo,
    carriageNo: detail.value?.carriageNo,
    groupCode: detail.value?.groupCode
  });
  if (printRow) printPalletLabel(printRow);
}

const isDetailTruckDelivery = computed(() => {
  const id = editModel.value?.businessTypeId ?? detail.value?.businessTypeId;
  const row = businessTypeRows.value.find(item => String(item.id) === String(id));
  return isTruckDeliveryBusinessType({
    businessTypeCode: row?.businessTypeCode,
    businessTypeName: row?.businessTypeName || editModel.value?.businessTypeName || detail.value?.businessTypeName || null
  });
});

let loadSeq = 0;

function createEditModel(data: Api.Oms.NewCargoOrder): Api.Oms.NewCargoOrder {
  const model = jsonClone(data) as Api.Oms.NewCargoOrder;
  model.deliveryLfd = normalizeDatePickerDate(data.deliveryLfd);
  if (model.businessTypeId != null && model.businessTypeId !== '') {
    const normalized = Number(model.businessTypeId);
    model.businessTypeId = Number.isNaN(normalized) ? model.businessTypeId : normalized;
  }
  if (model.shipments?.length) {
    model.shipments = model.shipments.map(shipment => ({
      ...shipment,
      dwTime: normalizeDatePickerDateTime(shipment.dwTime)
    }));
  }
  return model;
}

async function loadPlatformOptions() {
  try {
    const [platformRes, addressRes, userRes, businessRes] = await Promise.all([
      fetchGetPlatformList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
      fetchGetPlatformAddressList({ pageNum: 1, pageSize: 1000, status: '0', params: {} }),
      fetchGetUserList({ pageNum: 1, pageSize: 1000, status: '0', params: {} }),
      fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} })
    ]);
    platformRows.value = platformRes.data?.rows || [];
    platformAddressRows.value = addressRes.data?.rows || [];
    userRows.value = userRes.data?.rows || [];
    platformOptions.value = platformRows.value.map(item => ({ label: item.nameEn || item.code, value: item.id }));
    businessTypeRows.value = businessRes.data?.rows || [];
    businessTypeOptions.value = mapBusinessTypeOptions(businessTypeRows.value);
  } catch {
    // 下拉数据加载失败不阻断详情展示
  }
}

async function loadDetail(orderId: CommonType.IdType) {
  const seq = ++loadSeq;
  loading.value = true;
  try {
    const { data, error } = await fetchGetCargoOrderDetail(orderId);
    if (seq !== loadSeq) return;
    if (error || !data) {
      detail.value = null;
      editModel.value = null;
      window.$message?.error('加载订单详情失败');
      return;
    }
    detail.value = data;
    editModel.value = createEditModel(data);
    try {
      syncShipmentEditFromDetail();
    } catch {
      shipmentEditModel.value = { forecastQtyUnit: data.forecastQtyUnit || 'BY_CARTON', shipments: [] };
    }
    activeTab.value = props.initialTab || 'basic';
    privilegedEditMode.value = Boolean(props.startEdit && data);
    await loadPlatformOptions();
  } catch {
    if (seq !== loadSeq) return;
    detail.value = null;
    editModel.value = null;
    window.$message?.error('加载订单详情失败');
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

watch(
  () => [visible.value, props.orderId] as const,
  async ([vis, orderId]) => {
    if (vis && orderId) {
      editMode.value = true;
      await loadDetail(orderId);
      return;
    }
    if (!vis) {
      privilegedEditMode.value = false;
      editMode.value = true;
      loading.value = false;
      detail.value = null;
      editModel.value = null;
    }
  },
  { immediate: true }
);

watch(
  () => [visible.value, props.initialTab] as const,
  ([vis, tab]) => {
    if (vis) activeTab.value = tab || 'basic';
  }
);

function togglePrivilegedEdit() {
  privilegedEditMode.value = !privilegedEditMode.value;
}

function resetEdit() {
  if (!detail.value) return;
  editModel.value = createEditModel(detail.value);
  syncShipmentEditFromDetail();
}

async function saveEdit() {
  if (!editModel.value || !detail.value?.id) return;
  const orderId = detail.value.id;
  const basicMessage = validateContainerCargoOrder(editModel.value as Api.Oms.ContainerCargoOrderForm, { requireShipments: false });
  if (basicMessage) {
    window.$message?.warning(basicMessage);
    return;
  }
  if (canEditShipment.value && hasShipmentEdits()) {
    const shipmentMessage = validateShipmentEdit();
    if (shipmentMessage) {
      window.$message?.warning(shipmentMessage);
      return;
    }
    const skuMessage = validateSkuEdit();
    if (skuMessage) {
      window.$message?.warning(skuMessage);
      return;
    }
  }

  const skuSnapshot = snapshotSkuByShipmentNo();
  loading.value = true;
  try {
    const { error } = await fetchUpdateCargoOrder({ ...editModel.value, id: orderId } as Api.Oms.NewCargoOrderOperateParams);
    if (error) return;

    if (canEditShipment.value && hasShipmentEdits()) {
      const shipmentOk = await persistShipments(orderId);
      if (!shipmentOk) return;

      const { data: refreshed, error: reloadError } = await fetchGetCargoOrderDetail(orderId);
      if (reloadError || !refreshed) {
        window.$message?.error('货件保存后刷新失败');
        return;
      }
      mergeShipmentSkuAfterReload(refreshed, skuSnapshot);

      const skuOk = await persistSkuItems(orderId);
      if (!skuOk) return;
    }

    window.$message?.success('保存成功');
    await loadDetail(orderId);
    emit('refresh');
  } finally {
    loading.value = false;
  }
}

function handleComingSoon() {
  window.$message?.info('功能开发中，敬请期待');
}

const canEditShipment = computed(() => hasAuth('oms:cargoOrder:edit'));

const selectedPlatformAddresses = computed(() =>
  platformAddressRows.value.filter(item => !editModel.value?.platformId || item.platformId === editModel.value.platformId)
);

const warehouseCodeOptions = computed(() => {
  const keyword = editModel.value?.platformWarehouseCode?.trim().toLowerCase() || '';
  return selectedPlatformAddresses.value
    .filter(item => {
      if (!keyword) return true;
      return [item.addressCode, item.nameEn, item.city, item.stateCode].some(value => value?.toLowerCase().includes(keyword));
    })
    .slice(0, 30)
    .map(item => ({ label: `${item.addressCode} - ${item.nameEn}`, value: item.addressCode }));
});

const businessTypeSelectOptions = computed(() => {
  const options = [...businessTypeOptions.value];
  const currentId = editModel.value?.businessTypeId ?? detail.value?.businessTypeId;
  const currentName = editModel.value?.businessTypeName ?? detail.value?.businessTypeName;
  if (currentId != null && currentId !== '' && !options.some(item => String(item.value) === String(currentId))) {
    options.unshift({ label: currentName || String(currentId), value: currentId as CommonType.IdType });
  }
  return options;
});

const customerServiceOptions = computed(() => {
  const keyword = editModel.value?.customerServiceName?.trim().toLowerCase() || '';
  return userRows.value
    .filter(item => {
      if (!keyword) return true;
      return [item.nickName, item.userName, item.phonenumber].some(value => value?.toLowerCase().includes(keyword));
    })
    .slice(0, 30)
    .map(item => ({
      label: `${item.nickName || item.userName} (${item.userName})`,
      value: item.nickName || item.userName,
      userId: item.userId
    }));
});

function handleCustomerServiceSelect(value: string) {
  if (!editModel.value) return;
  const user = userRows.value.find(item => (item.nickName || item.userName) === value);
  editModel.value.customerServiceId = user?.userId ?? null;
  editModel.value.customerServiceName = value;
}

function handleCustomerServiceInput(value: string) {
  if (!editModel.value) return;
  const user = userRows.value.find(item => item.nickName === value || item.userName === value);
  editModel.value.customerServiceId = user?.userId ?? null;
}

function handlePlatformChange(value: CommonType.IdType | null) {
  if (!editModel.value) return;
  const platform = platformRows.value.find(item => item.id === value);
  editModel.value.platformName = platform ? platform.nameEn || platform.code : null;
  const matchedAddresses = platformAddressRows.value.filter(item => item.platformId === value);
  if (!editModel.value.platformWarehouseCode && matchedAddresses.length === 1) {
    applyPlatformAddress(matchedAddresses[0].addressCode);
  }
}

function handleBusinessTypeChange(value: CommonType.IdType | null) {
  if (!editModel.value) return;
  const businessType = businessTypeRows.value.find(item => String(item.id) === String(value));
  editModel.value.businessTypeName = businessType?.businessTypeName || null;
  if (!isTruckDeliveryBusinessType({ businessTypeCode: businessType?.businessTypeCode, businessTypeName: businessType?.businessTypeName })) {
    editModel.value.addressType = null;
    handleAddressTypeChange(null);
  }
}

function handleAddressTypeChange(value: string | null) {
  if (!editModel.value || value === 'PLATFORM_WH') return;
  editModel.value.platformId = null;
  editModel.value.platformName = null;
  editModel.value.platformWarehouseCode = null;
}

function applyPlatformAddress(addressCode: string | null) {
  if (!editModel.value) return;
  editModel.value.platformWarehouseCode = addressCode;
  const address = platformAddressRows.value.find(
    item => item.addressCode === addressCode && (!editModel.value?.platformId || item.platformId === editModel.value.platformId)
  );
  if (!address) return;
  editModel.value.platformId = address.platformId;
  editModel.value.platformName = address.platformName || editModel.value.platformName;
  editModel.value.consigneeName = editModel.value.consigneeName || address.nameEn;
  editModel.value.addressLine1 = editModel.value.addressLine1 || address.addressLine1;
  editModel.value.addressLine2 = editModel.value.addressLine2 || address.addressLine2;
  editModel.value.city = editModel.value.city || address.city;
  editModel.value.state = editModel.value.state || address.stateCode;
  editModel.value.zipCode = editModel.value.zipCode || address.zipCode;
  editModel.value.country = editModel.value.country || address.countryCode;
  editModel.value.contactName = editModel.value.contactName || address.contactName;
  editModel.value.contactPhone = editModel.value.contactPhone || address.contactPhone;
}

function syncShipmentEditFromDetail() {
  const d = detail.value;
  if (!d) {
    shipmentEditModel.value = { forecastQtyUnit: 'BY_CARTON', shipments: [] };
    originalShipmentIds.value = new Set();
    originalSkuIds.value = new Set();
    return;
  }
  const unit = d.forecastQtyUnit || 'BY_CARTON';
  shipmentEditModel.value = {
    forecastQtyUnit: unit,
    shipments: jsonClone(d.shipments?.length ? d.shipments : [{ shipmentNo: '', poNo: null, shippingMark: null, cartonQty: null, palletQty: null, weight: null, cbm: null, dwTime: null, remark: null, skuItems: [] }]).map(
      shipment => ({
        ...shipment,
        dwTime: normalizeDatePickerDateTime(shipment.dwTime),
        skuItems: jsonClone(shipment.skuItems || [])
      })
    )
  };
  originalShipmentIds.value = new Set(
    (d.shipments || []).map(s => (s.id != null ? String(s.id) : '')).filter(Boolean)
  );
  const skuIds = new Set<string>();
  (d.shipments || []).forEach(shipment => {
    (shipment.skuItems || []).forEach(sku => {
      if (sku.id != null) skuIds.add(String(sku.id));
    });
  });
  originalSkuIds.value = skuIds;
}

function hasShipmentEdits() {
  return (shipmentEditModel.value.shipments || []).some(s => s.shipmentNo?.trim());
}

function snapshotSkuByShipmentNo() {
  const map = new Map<string, Api.Oms.CargoOrderSkuItem[]>();
  for (const shipment of shipmentEditModel.value.shipments || []) {
    const code = shipment.shipmentNo?.trim();
    if (!code) continue;
    map.set(code, jsonClone(shipment.skuItems || []));
  }
  return map;
}

function mergeShipmentSkuAfterReload(
  data: Api.Oms.NewCargoOrder,
  skuSnapshot: Map<string, Api.Oms.CargoOrderSkuItem[]>
) {
  const unit = data.forecastQtyUnit || shipmentEditModel.value.forecastQtyUnit || 'BY_CARTON';
  shipmentEditModel.value = {
    forecastQtyUnit: unit,
    shipments: jsonClone(data.shipments?.length ? data.shipments : []).map(shipment => ({
      ...shipment,
      dwTime: normalizeDatePickerDateTime(shipment.dwTime),
      skuItems: jsonClone(skuSnapshot.get(shipment.shipmentNo?.trim() || '') || shipment.skuItems || [])
    }))
  };
  originalShipmentIds.value = new Set(
    (data.shipments || []).map(s => (s.id != null ? String(s.id) : '')).filter(Boolean)
  );
}

function validateShipmentEdit(): string | null {
  const list = (shipmentEditModel.value.shipments || []).filter(s => s.shipmentNo?.trim());
  if (!list.length) return '至少需要一条货件';
  const codes = new Set<string>();
  const byPallet = isByPallet(shipmentEditModel.value as Api.Oms.ContainerCargoOrderForm);
  for (const s of list) {
    const code = s.shipmentNo?.trim() || '';
    if (codes.has(code)) return `货件编码重复：${code}`;
    codes.add(code);
    if (byPallet) {
      if (s.palletQty == null || Number(s.palletQty) <= 0) return `货件 ${code} 板数须大于 0`;
    } else if (s.cartonQty == null || Number(s.cartonQty) <= 0) {
      return `货件 ${code} 箱数须大于 0`;
    }
    if (s.weight == null || Number(s.weight) <= 0) return `货件 ${code} 重量须大于 0`;
    if (s.cbm == null || Number(s.cbm) <= 0) return `货件 ${code} 体积须大于 0`;
  }
  return null;
}

async function persistShipments(orderId: CommonType.IdType): Promise<boolean> {
  const list = (shipmentEditModel.value.shipments || []).filter(s => s.shipmentNo?.trim());
  const orderMark = resolveShippingMarkFromOrder({
    cargoOrderNo: detail.value?.cargoOrderNo,
    externalOrderNo: detail.value?.externalOrderNo
  });
  const keptIds = new Set<string>();
  for (const row of list) {
    const payload: Api.Oms.CargoOrderShipmentItem = {
      ...row,
      id: row.id ?? null,
      shipmentNo: row.shipmentNo?.trim() || '',
      poNo: row.poNo?.trim() || null,
      shippingMark: orderMark || row.shippingMark?.trim() || null,
      cartonQty: row.cartonQty ?? null,
      palletQty: row.palletQty ?? null,
      weight: row.weight ?? null,
      cbm: row.cbm ?? null,
      dwTime: row.dwTime ?? null,
      remark: row.remark?.trim() || null
    };
    const { error } = await fetchSaveShipment(orderId, payload);
    if (error) return false;
    if (payload.id != null) keptIds.add(String(payload.id));
  }
  for (const id of originalShipmentIds.value) {
    if (!keptIds.has(id)) {
      const { error } = await fetchDeleteShipment(id);
      if (error) return false;
    }
  }
  return true;
}

function validateSkuEdit(): string | null {
  for (const shipment of shipmentEditModel.value.shipments || []) {
    if (!shipment.shipmentNo?.trim()) continue;
    for (const sku of shipment.skuItems || []) {
      if (!sku.sku?.trim() && hasSkuRowContent(sku)) {
        return `货件 ${shipment.shipmentNo} 存在未填 SKU 编码的行`;
      }
    }
  }
  return null;
}

function hasSkuRowContent(sku: Api.Oms.CargoOrderSkuItem) {
  return Boolean(
    sku.fnsku?.trim()
    || sku.productName?.trim()
    || sku.qty != null
    || sku.cartonQty != null
    || sku.weight != null
    || sku.cbm != null
    || sku.remark?.trim()
  );
}

async function persistSkuItems(orderId: CommonType.IdType): Promise<boolean> {
  const keptIds = new Set<string>();
  for (const shipment of shipmentEditModel.value.shipments || []) {
    if (!shipment.id) continue;
    for (const row of shipment.skuItems || []) {
      if (!row.sku?.trim()) continue;
      const payload: Api.Oms.CargoOrderSkuItem = {
        ...row,
        id: row.id ?? null,
        shipmentId: shipment.id,
        shipmentNo: shipment.shipmentNo?.trim() || null,
        poNo: row.poNo?.trim() || shipment.poNo?.trim() || null,
        shippingMark: row.shippingMark?.trim() || shipment.shippingMark?.trim() || null,
        sku: row.sku.trim(),
        fnsku: row.fnsku?.trim() || null,
        productName: row.productName?.trim() || null,
        qty: row.qty ?? null,
        cartonQty: row.cartonQty ?? null,
        weight: row.weight ?? null,
        cbm: row.cbm ?? null,
        remark: row.remark?.trim() || null
      };
      const { error } = await fetchSaveSkuItem(orderId, payload);
      if (error) return false;
      if (payload.id != null) keptIds.add(String(payload.id));
    }
  }
  for (const id of originalSkuIds.value) {
    if (!keptIds.has(id)) {
      const { error } = await fetchDeleteSkuItem(id);
      if (error) return false;
    }
  }
  return true;
}

const FULFILLMENT_STEPS = [
  { code: 'PENDING_ACCEPT',    label: '待受理' },
  { code: 'ACCEPTED',          label: '已受理' },
  { code: 'IN_TRANSIT',        label: '在途' },
  { code: 'ARRIVED_PORT',      label: '已到港' },
  { code: 'PICKED_UP',         label: '已提柜' },
  { code: 'ARRIVED_WAREHOUSE', label: '已到仓' },
  { code: 'DEVANNING',         label: '拆柜中' },
  { code: 'DEVANNED',          label: '拆柜完成' },
  { code: 'INBOUNDED',         label: '已入库' },
  { code: 'OUTBOUND_ORDERED',  label: '已出单' },
  { code: 'DELIVERY_APPOINTED',label: '已预约' },
  { code: 'OUTBOUNDED',        label: '已出库' },
  { code: 'DELIVERING',        label: '派送中' },
  { code: 'DELIVERED',         label: '已签收' },
  { code: 'POD_UPLOADED',      label: 'POD回传' },
  { code: 'BILLED',            label: '已出账单' },
  { code: 'COMPLETED',         label: '已完成' }
];

const currentStepIndex = computed(() => {
  if (!detail.value) return -1;
  return FULFILLMENT_STEPS.findIndex(s => s.code === detail.value!.fulfillmentStatus);
});


const nodeTraceColumns = [
  { key: 'actualTime',    title: '时间',    width: 150 },
  { key: 'nodeName',      title: '节点',   width: 120 },
  { key: 'nodeStatus',    title: '状态',   width: 80 },
  { key: 'action',        title: '动作',   width: 140 },
  { key: 'sourceType',    title: '来源',   width: 80 },
  { key: 'sourceOrderNo', title: '来源单号', width: 150, ellipsis: { tooltip: true } },
  { key: 'operatorName',  title: '操作人', width: 100 },
  { key: 'remark',        title: '备注',   width: 150, ellipsis: { tooltip: true } }
];

function preOutboundStatusTag(status: string) {
  const map: Record<string, { type: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
    NONE:        { type: 'default',  label: '无预出单' },
    PRE_CREATED: { type: 'warning',  label: '已预出单' },
    CONVERTED:   { type: 'success',  label: '已转正式' },
    CANCELLED:   { type: 'error',    label: '已取消' }
  };
  return map[status] ?? { type: 'default', label: status };
}

function billingStatusTag(status: string) {
  const map: Record<string, { type: 'default' | 'warning' | 'success'; label: string }> = {
    UNBILLED: { type: 'warning', label: '未出账单' },
    BILLED:   { type: 'success', label: '已出账单' },
    VOIDED:   { type: 'default', label: '已作废' }
  };
  return map[status] ?? { type: 'default', label: status };
}

function isHolding() {
  return detail.value?.holdStatus === 'HOLDING' || Boolean(detail.value?.holdFlag);
}

function holdLabel() {
  if (isHolding()) return '暂扣';
  if (detail.value?.holdStatus === 'RELEASED') return '已放行';
  return '正常';
}

function holdTagType() {
  if (isHolding()) return 'warning';
  if (detail.value?.holdStatus === 'RELEASED') return 'success';
  return 'default';
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1200" class="max-w-98%">
    <NDrawerContent title="订单详情" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NEmpty v-if="!loading && !detail" description="暂无详情或加载失败" />
        <template v-else-if="detail">
          <!-- 头部：订单号 + 状态标签 + 操作按钮 -->
          <div class="mb-12px flex flex-wrap items-center justify-between gap-12px">
            <NSpace align="center">
              <span class="relative inline-flex items-start pr-14px text-18px font-semibold">
                {{ detail.cargoOrderNo }}
                <span
                  v-if="isHolding()"
                  class="absolute -right-5px -top-8px flex h-16px min-w-16px items-center justify-center rounded-full bg-#d03050 px-3px text-10px text-white font-semibold leading-16px shadow-sm"
                  title="暂扣"
                >扣</span>
              </span>
              <NTag type="info" size="small">{{ FULFILLMENT_STEPS.find(s => s.code === detail?.fulfillmentStatus)?.label ?? detail?.fulfillmentStatus }}</NTag>
              <NTag v-if="isLoosePalletOrder" type="warning" size="small">散板订单</NTag>
              <NTag v-if="isHolding()" type="warning" size="small">暂扣</NTag>
              <NTag v-if="detail.exceptionFlag" type="error" size="small">异常({{ detail.exceptionCount }})</NTag>
            </NSpace>
            <NSpace>
              <NButton @click="resetEdit">重置</NButton>
              <NButton type="primary" @click="saveEdit">保存</NButton>
              <NButton :type="privilegedEditMode ? 'warning' : 'default'" @click="togglePrivilegedEdit">
                {{ privilegedEditMode ? '退出高级编辑' : '高级编辑' }}
              </NButton>
            </NSpace>
          </div>

          <!-- 进度条 -->
          <div class="mb-16px overflow-x-auto rounded-8px bg-#f8fafc px-16px py-12px">
            <div class="flex items-start" style="min-width: max-content">
              <template v-for="(step, idx) in FULFILLMENT_STEPS" :key="step.code">
                <div
                  v-if="idx > 0"
                  class="mt-5px h-1.5px w-28px flex-shrink-0 transition-colors"
                  :class="idx <= currentStepIndex ? 'bg-primary' : 'bg-#d0d3d9'"
                />
                <div class="flex flex-shrink-0 flex-col items-center gap-5px">
                  <div
                    class="flex h-12px w-12px items-center justify-center rounded-full transition-all"
                    :class="
                      idx < currentStepIndex
                        ? 'bg-primary'
                        : idx === currentStepIndex
                          ? 'bg-primary ring-3 ring-primary/30'
                          : 'border border-#d0d3d9 bg-white'
                    "
                  >
                    <svg v-if="idx < currentStepIndex" viewBox="0 0 10 10" class="h-7px w-7px" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <span
                    class="text-10px whitespace-nowrap leading-none transition-colors"
                    :class="
                      idx === currentStepIndex
                        ? 'text-primary font-semibold'
                        : idx < currentStepIndex
                          ? 'text-primary opacity-70'
                          : 'text-#909399'
                    "
                  >{{ step.label }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- 标签页 -->
          <NTabs v-model:value="activeTab" type="line" animated>

            <!-- ===== 基础信息 ===== -->
            <NTabPane name="basic" tab="基础信息">
              <NForm :model="editModel || {}" label-placement="left">

                <!-- 订单信息 -->
                <NDescriptions bordered :column="4" label-placement="left">
                  <template #header>订单信息</template>
                  <NDescriptionsItem label="订单号">{{ detail.cargoOrderNo }}</NDescriptionsItem>
                  <NDescriptionsItem label="订单来源">
                    <NSelect :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).orderSource"
                      size="small"
                      clearable
                      :options="[
                        { label: '自建单', value: 'SELF' },
                        { label: 'API下单', value: 'API' },
                        { label: '客户门户下单', value: 'PORTAL' }
                      ]"
                    />
                    <template v-else>{{ orderSourceLabel(detail.orderSource) }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="HOLD">
                    <NTag :type="holdTagType()" size="small">{{ holdLabel() }}</NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isLoosePalletOrder ? '仓库代码' : 'FBA/SKU'" :span="2">
                    {{ isLoosePalletOrder ? (detail.platformWarehouseCode || '--') : (detail.shipmentCodes || '--') }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="PO汇总">{{ detail.poNos || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="唛头号">{{ detail.marks || '--' }}</NDescriptionsItem>
                </NDescriptions>

                <NDivider class="my-12px" />

                <!-- 客户与派送 -->
                <NDescriptions bordered :column="4" label-placement="left">
                  <template #header>客户与派送</template>
                  <NDescriptionsItem label="客户">{{ detail.customerName || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="业务类型">
                    <NSelect :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).businessTypeId"
                      size="small"
                      clearable
                      filterable
                      :options="businessTypeSelectOptions"
                      placeholder="请选择业务类型"
                      @update:value="handleBusinessTypeChange"
                    />
                    <template v-else>{{ detail.businessTypeName || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="渠道">{{ detail.channelName || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="客服">
                    <NAutoComplete
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).customerServiceName"
                      size="small"
                      clearable
                      :options="customerServiceOptions"
                      placeholder="输入或选择客服姓名"
                      @select="handleCustomerServiceSelect"
                      @update:value="handleCustomerServiceInput"
                    />
                    <template v-else>{{ detail.customerServiceName || '--' }}</template>
                  </NDescriptionsItem>
                </NDescriptions>

                <NDivider class="my-12px" />

                <!-- 收货地址 -->
                <NDescriptions bordered :column="4" label-placement="left">
                  <template #header>收货地址</template>
                  <NDescriptionsItem :label="isDetailTruckDelivery ? '* 地址类型' : '地址类型'">
                    <NSelect :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).addressType"
                      size="small"
                      clearable
                      :options="addressTypeOptions"
                      @update:value="handleAddressTypeChange"
                    />
                    <template v-else>{{ addressTypeRecord[detail.addressType as string]?.dictLabel ?? detail.addressType ?? '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isDetailTruckDelivery && (editModel as any)?.addressType === 'PLATFORM_WH' ? '* 平台' : '平台'">
                    <NSelect :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).platformId"
                      size="small"
                      filterable
                      clearable
                      :options="platformOptions"
                      :disabled="(editModel as any).addressType !== 'PLATFORM_WH'"
                      @update:value="handlePlatformChange"
                    />
                    <template v-else>{{ detail.platformName || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isDetailTruckDelivery && (editModel as any)?.addressType === 'PLATFORM_WH' ? '* 仓库代码' : '仓库代码'">
                    <NAutoComplete
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).platformWarehouseCode"
                      size="small"
                      clearable
                      :options="warehouseCodeOptions"
                      :disabled="(editModel as any).addressType !== 'PLATFORM_WH'"
                      placeholder="输入或选择仓库代码"
                      @select="applyPlatformAddress"
                    />
                    <template v-else>{{ detail.platformWarehouseCode || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isDetailTruckDelivery ? '* 收货方' : '收货方'">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).consigneeName" size="small" />
                    <template v-else>{{ detail.consigneeName || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="收货人/联系人">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).contactName" size="small" />
                    <template v-else>{{ detail.contactName || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isDetailTruckDelivery ? '* Address Line1' : 'Address Line1'" :span="2">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).addressLine1" size="small" />
                    <template v-else>{{ detail.addressLine1 || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="Address Line2" :span="2">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).addressLine2" size="small" />
                    <template v-else>{{ detail.addressLine2 || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isDetailTruckDelivery ? '* City' : 'City'">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).city" size="small" />
                    <template v-else>{{ detail.city || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isDetailTruckDelivery ? '* State' : 'State'">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).state" size="small" />
                    <template v-else>{{ detail.state || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem :label="isDetailTruckDelivery ? '* Zip Code' : 'Zip Code'">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).zipCode" size="small" />
                    <template v-else>{{ detail.zipCode || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="Country">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).country" size="small" />
                    <template v-else>{{ detail.country || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="收货电话">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).contactPhone" size="small" />
                    <template v-else>{{ detail.contactPhone || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="收货邮箱" :span="3">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).contactEmail" size="small" />
                    <template v-else>{{ detail.contactEmail || '--' }}</template>
                  </NDescriptionsItem>
                </NDescriptions>

                <NDivider class="my-12px" />

                <!-- 海柜与仓储 -->
                <NDescriptions bordered :column="4" label-placement="left">
                  <template #header>海柜与仓储</template>
                  <NDescriptionsItem label="柜号">{{ detail.containerNo || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="入库仓">{{ detail.inboundWarehouseName || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="ETA">{{ detail.eta || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="ATA">{{ detail.ata || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="DW时间">{{ detail.earliestDwTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="提柜时间">{{ detail.actualPickupTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="到仓时间">{{ detail.actualArrivalTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="拆柜完成">{{ detail.devanningFinishTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="入库完成">{{ detail.actualInboundTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="时效等级">
                    <NSelect
                      :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).timelinessLevel"
                      size="small"
                      clearable
                      :options="timelinessLevelOptions"
                      placeholder="请选择时效等级"
                    />
                    <NTag
                      v-else-if="detail.timelinessLevel"
                      size="small"
                      :type="detail.timelinessLevel === 'T' ? 'error' : detail.timelinessLevel === 'K' ? 'warning' : 'default'"
                    >
                      {{ timelinessLevelRecord[detail.timelinessLevel as string]?.dictLabel || detail.timelinessLevel }}
                    </NTag>
                    <template v-else>--</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="是否转仓">
                    <NSelect :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).transferFlag"
                      size="small"
                      :options="[{ label: '需要转仓', value: 1 }, { label: '不转仓', value: 0 }]"
                    />
                    <NTag v-else :type="detail.transferFlag ? 'warning' : 'default'" size="small">
                      {{ detail.transferFlag ? '需要转仓' : '不转仓' }}
                    </NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="转仓仓库">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).transferWarehouseCode" size="small" />
                    <template v-else>{{ detail.transferWarehouseCode || '--' }}</template>
                  </NDescriptionsItem>
                </NDescriptions>

                <NDivider class="my-12px" />

                <!-- 货量信息 -->
                <div class="grid grid-cols-2 gap-16px">
                  <NDescriptions bordered :column="2" label-placement="left">
                    <template #header>预报货量</template>
                    <NDescriptionsItem label="* 下单计量">
                      <NSelect :to="POPUP_TO_BODY"
                        v-if="editMode && editModel"
                        v-model:value="(editModel as any).forecastQtyUnit"
                        size="small"
                        :options="[{ label: '按箱', value: 'BY_CARTON' }, { label: '按板', value: 'BY_PALLET' }]"
                      />
                      <template v-else>{{ detail.forecastQtyUnit === 'BY_PALLET' ? '按板' : '按箱' }}</template>
                    </NDescriptionsItem>
                    <NDescriptionsItem v-if="(editModel as any)?.forecastQtyUnit !== 'BY_PALLET' && detail.forecastQtyUnit !== 'BY_PALLET'" label="* 预报箱数">
                      <NInputNumber v-if="editMode && editModel" v-model:value="(editModel as any).declaredCartonQty" size="small" :min="0" class="w-full" />
                      <template v-else>{{ detail.declaredCartonQty ?? '--' }}</template>
                    </NDescriptionsItem>
                    <NDescriptionsItem v-else label="* 预报板数">
                      <NInputNumber v-if="editMode && editModel" v-model:value="(editModel as any).declaredPalletQty" size="small" :min="0" class="w-full" />
                      <template v-else>{{ detail.declaredPalletQty ?? '--' }}</template>
                    </NDescriptionsItem>
                    <NDescriptionsItem label="* 预报件数">
                      <NInputNumber v-if="editMode && editModel" v-model:value="(editModel as any).declaredPieceQty" size="small" :min="0" class="w-full" />
                      <template v-else>{{ detail.declaredPieceQty ?? '--' }}</template>
                    </NDescriptionsItem>
                    <NDescriptionsItem label="* 预报重量(kg)">
                      <NInputNumber v-if="editMode && editModel" v-model:value="(editModel as any).declaredWeight" size="small" :min="0" :precision="3" class="w-full" />
                      <template v-else>{{ detail.declaredWeight ?? '--' }}</template>
                    </NDescriptionsItem>
                    <NDescriptionsItem label="* 预报体积(m³)">
                      <NInputNumber v-if="editMode && editModel" v-model:value="(editModel as any).declaredCbm" size="small" :min="0" :precision="3" class="w-full" />
                      <template v-else>{{ detail.declaredCbm ?? '--' }}</template>
                    </NDescriptionsItem>
                  </NDescriptions>
                  <NDescriptions bordered :column="2" label-placement="left">
                    <template #header>实际货量（WMS回写，只读）</template>
                    <NDescriptionsItem label="实际箱数">{{ detail.actualCartonQty ?? '--' }}</NDescriptionsItem>
                    <NDescriptionsItem label="实际板数">{{ detail.actualPalletQty ?? '--' }}</NDescriptionsItem>
                    <NDescriptionsItem label="实际件数">{{ detail.actualPieceQty ?? '--' }}</NDescriptionsItem>
                    <NDescriptionsItem label="实际重量(kg)">{{ detail.actualWeight ?? '--' }}</NDescriptionsItem>
                    <NDescriptionsItem label="实际体积(m³)">{{ detail.actualCbm ?? '--' }}</NDescriptionsItem>
                  </NDescriptions>
                </div>

                <NDivider class="my-12px" />

                <!-- 操作状态与时间 -->
                <NDescriptions bordered :column="4" label-placement="left">
                  <template #header>操作状态与时间</template>
                  <NDescriptionsItem label="操作状态">
                    <NTag
                      size="small"
                      :type="CARGO_OPERATION_STATUS_META[(detail?.operationStatus as CargoOperationStatus)]?.type || 'default'"
                    >
                      {{ CARGO_OPERATION_STATUS_META[(detail?.operationStatus as CargoOperationStatus)]?.label ?? detail?.operationStatus ?? '—' }}
                    </NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="预出单状态">
                    <NTag :type="preOutboundStatusTag(detail.preOutboundStatus).type" size="small">
                      {{ preOutboundStatusTag(detail.preOutboundStatus).label }}
                    </NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="预出单号">{{ detail.preOutboundNo || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="出单号">{{ detail.outboundBatchNo || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="派送LFD">
                    <NDatePicker :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:formatted-value="(editModel as any).deliveryLfd"
                      type="date"
                      value-format="yyyy-MM-dd"
                      size="small"
                      class="w-full"
                      clearable
                    />
                    <template v-else>{{ detail.deliveryLfd || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="预约号">
                    {{ displayAppointmentNo(detail.appointmentNo, { platformName: detail.platformName }) }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="派送预约时间">{{ detail.deliveryAppointmentTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="实际出库">{{ detail.actualOutboundTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="签收时间">{{ detail.signedTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="快递商">
                    <NSelect :to="POPUP_TO_BODY"
                      v-if="editMode && editModel"
                      v-model:value="(editModel as any).parcelCarrierName"
                      size="small"
                      filterable
                      clearable
                      tag
                      :options="parcelCarrierOptions"
                      placeholder="选择或输入快递商"
                    />
                    <template v-else>{{ detail.parcelCarrierName || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="快递追踪号">{{ detail.parcelTrackingNo || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="POD状态">{{ detail.podStatus || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="POD上传时间">{{ detail.podUploadTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="账单状态">
                    <NTag :type="billingStatusTag(detail.billingStatus).type" size="small">
                      {{ billingStatusTag(detail.billingStatus).label }}
                    </NTag>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="出账时间">{{ detail.billingTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="完成时间">{{ detail.completedTime || '--' }}</NDescriptionsItem>
                </NDescriptions>

                <NDivider class="my-12px" />

                <!-- 备注与跟进 -->
                <NDescriptions bordered :column="3" label-placement="left">
                  <template #header>备注与跟进</template>
                  <NDescriptionsItem label="客户备注">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).customerRemark" type="textarea" size="small" :rows="2" />
                    <template v-else>{{ detail.customerRemark || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="内部备注">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).internalRemark" type="textarea" size="small" :rows="2" />
                    <template v-else>{{ detail.internalRemark || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="操作备注">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).operationRemark" type="textarea" size="small" :rows="2" />
                    <template v-else>{{ detail.operationRemark || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="备注">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).remark" type="textarea" size="small" :rows="2" />
                    <template v-else>{{ detail.remark || '--' }}</template>
                  </NDescriptionsItem>
                  <NDescriptionsItem label="跟进记录" :span="2">
                    <NInput v-if="editMode && editModel" v-model:value="(editModel as any).followUpRemark" type="textarea" size="small" :rows="2" />
                    <template v-else>{{ detail.followUpRemark || '--' }}</template>
                  </NDescriptionsItem>
                </NDescriptions>

              </NForm>
            </NTabPane>

            <!-- ===== 货件/SKU ===== -->
            <NTabPane v-if="isLoosePalletOrder" name="loose-pallet" tab="散板信息">
              <NCard size="small" class="mt-8px" title="散板下单信息">
                <NDescriptions bordered :column="3" label-placement="left" size="small">
                  <NDescriptionsItem label="订单类型">同行散板</NDescriptionsItem>
                  <NDescriptionsItem label="同行客户">{{ detail.peerCustomerName || detail.customerName || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="卡板数量">{{ detail.declaredPalletQty ?? '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="收货方式">
                    {{ LOOSE_PALLET_DELIVERY_MODE_LABEL[(detail.deliveryMode as any)] || detail.deliveryMode || '--' }}
                  </NDescriptionsItem>
                  <NDescriptionsItem label="预约送货时间">{{ detail.deliveryAppointmentTime || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="车厢号">{{ detail.carriageNo || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="仓库代码">{{ detail.platformWarehouseCode || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="目的仓/分组">{{ detail.groupCode || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="联系人">{{ detail.contactName || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="联系电话">{{ detail.contactPhone || '--' }}</NDescriptionsItem>
                  <NDescriptionsItem label="收货地址" :span="3">
                    {{ [detail.addressLine1, detail.city, detail.state, detail.zipCode].filter(Boolean).join(', ') || '--' }}
                  </NDescriptionsItem>
                </NDescriptions>
              </NCard>
              <NCard size="small" class="mt-12px" title="板贴打印">
                <template #header-extra>
                  <NButton size="small" type="primary" :disabled="!loosePalletLabels.length" @click="printAllLoosePalletLabels">
                    批量打印板贴
                  </NButton>
                </template>
                <NDataTable
                  :columns="[
                    { title: '板贴号', key: 'palletNo', width: 180 },
                    { title: '目的地', key: 'groupCode', width: 140 },
                    {
                      title: '操作',
                      key: 'actions',
                      width: 100,
                      render: (row: Api.Oms.LoosePalletLabelItem) =>
                        h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => printSingleLoosePalletLabel(row) }, () => '打印')
                    }
                  ]"
                  :data="loosePalletLabels"
                  :pagination="false"
                  size="small"
                />
                <NEmpty v-if="!loosePalletLabels.length" description="暂无板贴数据" class="py-20px" />
              </NCard>
            </NTabPane>

            <NTabPane name="shipments" tab="货件/SKU" lazy>
              <CargoOrderShipmentSkuPanel
                v-if="canEditShipment"
                v-model="shipmentEditModel"
                editable
              />
              <CargoOrderShipmentSkuPanel
                v-else
                :shipments="detail.shipments || []"
              />
            </NTabPane>

            <!-- ===== 异常跟进 ===== -->
            <NTabPane name="exception" tab="异常跟进">
              <div class="mb-8px flex gap-8px">
                <NButton type="warning" size="small" @click="handleComingSoon">新增异常</NButton>
                <NButton size="small" @click="handleComingSoon">关闭异常</NButton>
              </div>
              <NAlert v-if="detail.exceptionFlag" type="error" class="mb-8px">
                当前存在 {{ detail.exceptionCount }} 条未关闭异常
              </NAlert>
              <NAlert v-else type="success" class="mb-8px">无未关闭异常</NAlert>
              <p class="text-12px text-gray-400">异常详情表（对接异常模块后展示）</p>
            </NTabPane>

            <!-- ===== 节点轨迹 ===== -->
            <NTabPane name="node-trace" tab="节点轨迹">
              <div class="mb-16px overflow-x-auto">
                <NSteps :current="currentStepIndex + 1" size="small" class="min-w-1600px">
                  <NStep
                    v-for="(step, idx) in FULFILLMENT_STEPS"
                    :key="step.code"
                    :title="step.label"
                    :status="idx < currentStepIndex ? 'finish' : idx === currentStepIndex ? 'process' : 'wait'"
                  />
                </NSteps>
              </div>
              <NDataTable
                :columns="nodeTraceColumns"
                :data="detail.nodeTraces"
                :bordered="true"
                size="small"
                scroll-x="1000"
              />
            </NTabPane>

            <!-- ===== 操作日志 ===== -->
            <NTabPane name="change-log" tab="操作日志">
              <p class="text-12px text-gray-400">操作日志（对接变更日志模块后展示）</p>
            </NTabPane>

            <NTabPane name="files" :tab="`文件管理 (${detail.attachmentCount || 0})`">
              <AttachmentManager target-kind="cargo" :target-id="detail.id" include-container-attachments @changed="emit('refresh')" />
            </NTabPane>

          </NTabs>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
