<script setup lang="tsx">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue';
import {
  NButton,
  NCheckbox,
  NDatePicker,
  NDropdown,
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
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import { fetchGetBusinessTypeList, fetchGetPlatformAddressList, fetchGetPlatformList } from '@/service/api/base';
import { fetchGetWarehouseList } from '@/service/api/base/warehouse';
import { fetchGetCargoOrderDetail, fetchUpdateCargoOrder } from '@/service/api/oms/cargo-order';
import {
  getBusinessTypeNameById,
  mapBusinessTypeOptions,
  resolveBusinessTypeId
} from '../container-order/utils/container-cargo-order';
import {
  fetchBatchCreatePoolOutboundOrder,
  fetchBatchCreatePoolPreOutbound,
  fetchCreatePoolOutboundOrder,
  fetchCreatePoolPreOutbound,
  fetchGetOutboundPoolList,
  fetchGetOutboundPoolStats
} from '@/service/api/oms/outbound-pool';
import SupplierQuoteRecommendField from '../shared/modules/supplier-quote-recommend-field.vue';

defineOptions({ name: 'OmsOutboundPool' });

const appStore = useAppStore();
const { record: addressTypeRecord } = useDict('oms_address_type');

const READINESS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  NOT_INBOUNDED: { label: '未入库', type: 'warning' },
  DEVANNING: { label: '拆柜中', type: 'info' },
  INBOUNDED: { label: '已入库', type: 'success' }
};

const APPOINTMENT_STATUS_META: Record<string, string> = {
  NOT_APPOINTED: '未预约',
  PENDING: '未预约',
  APPOINTED: '已预约',
  CONFIRMED: '已预约',
  PHONE: '电话预约',
  EMAIL: '邮件预约',
  PLATFORM: '平台预约'
};

const searchParams = ref<Api.Oms.OutboundPoolSearchParams>({ pageNum: 1, pageSize: 10 });
const checkedRowKeys = ref<CommonType.IdType[]>([]);
const warehouseOptions = ref<CommonType.Option[]>([]);
const businessTypeRows = ref<Api.Base.BusinessType[]>([]);
const businessTypeOptions = ref<CommonType.Option[]>([]);
const platformRows = ref<Api.Base.Platform[]>([]);
const platformAddressRows = ref<Api.Base.PlatformAddress[]>([]);
const searchCollapsed = ref(false);
const advancedVisible = ref(false);
const activeTag = ref<string>('');
const cachedOrders = ref<Api.Oms.NewCargoOrder[]>([]);

const stats = ref<Api.Oms.OutboundPoolStats>({
  totalCount: 0,
  notInboundedCount: 0,
  devanningCount: 0,
  inboundedCount: 0,
  overdueDeliveryLfdCount: 0,
  overdueDwCount: 0,
  inTransitCbm: 0,
  devanningCbm: 0,
  inboundedCbm: 0,
  totalCbm: 0
});

type AdvancedField = keyof Api.Oms.OutboundPoolSearchParams;
type AdvancedFilter = { id: number; field: AdvancedField | null; value: string | number | boolean | null };

const advancedFilters = ref<AdvancedFilter[]>([]);
const advancedFieldOptions: { label: string; value: AdvancedField }[] = [
  { label: '渠道', value: 'channelName' },
  { label: '业务类型', value: 'businessTypeName' },
  { label: '地址类型', value: 'addressType' },
  { label: '城市', value: 'city' },
  { label: '邮编', value: 'zipCode' },
  { label: '货件编码', value: 'shipmentCodes' },
  { label: '柜号', value: 'containerNo' }
];

const lifecycleTabs = computed(() => [
  { label: '全部', value: '', count: stats.value.totalCount },
  { label: '未入库', value: 'NOT_INBOUNDED', count: stats.value.notInboundedCount },
  { label: '拆柜中', value: 'DEVANNING', count: stats.value.devanningCount },
  { label: '已入库', value: 'INBOUNDED', count: stats.value.inboundedCount },
  { label: '超派送LFD', value: 'OVER_LFD', count: stats.value.overdueDeliveryLfdCount },
  { label: '超DW', value: 'OVER_DW', count: stats.value.overdueDwCount }
]);

const cachedActionMode = computed<'pre' | 'outbound'>(() =>
  cachedOrders.value.some(row => resolveReadiness(row) !== 'INBOUNDED') ? 'pre' : 'outbound'
);

const cachedActionText = computed(() => (cachedActionMode.value === 'pre' ? '创建预出单' : '生成车次订单'));
const cachedTotals = computed(() =>
  cachedOrders.value.reduce(
    (total, row) => {
      total.cbm += Number(row.actualCbm || row.declaredCbm || 0);
      total.weight += Number(row.actualWeight || row.declaredWeight || 0);
      total.palletQty += Number(row.actualPalletQty || row.declaredPalletQty || 0);
      total.cartonQty += Number(row.actualCartonQty || row.declaredCartonQty || 0);
      return total;
    },
    { cbm: 0, weight: 0, palletQty: 0, cartonQty: 0 }
  )
);
const visibleData = computed(() => {
  const cachedKeys = new Set(cachedOrders.value.map(getOrderKey));
  return data.value.filter(row => !cachedKeys.has(getOrderKey(row)));
});
const actionOrders = computed(() => (actionRow.value ? [actionRow.value] : cachedOrders.value));
const inboundedActionOrders = computed(() => actionOrders.value.filter(row => resolveReadiness(row) === 'INBOUNDED'));
const pendingInboundActionOrders = computed(() => actionOrders.value.filter(row => resolveReadiness(row) !== 'INBOUNDED'));
const actionDetailRows = computed(() => (actionDetailTab.value === 'INBOUNDED' ? inboundedActionOrders.value : pendingInboundActionOrders.value));
const actionTotals = computed(() =>
  actionDetailRows.value.reduce(
    (total, row) => {
      total.pcs += Number(row.actualPieceQty || row.declaredPieceQty || row.actualCartonQty || row.declaredCartonQty || 0);
      total.cbm += Number(row.actualCbm || row.declaredCbm || 0);
      total.weight += Number(row.actualWeight || row.declaredWeight || 0);
      return total;
    },
    { pcs: 0, cbm: 0, weight: 0 }
  )
);

function resolveReadiness(row: Api.Oms.NewCargoOrder): Api.Oms.OutboundReadiness {
  const actual = Number(row.actualCartonQty || 0);
  const declared = Number(row.declaredCartonQty || 0);
  if (row.fulfillmentStatus === 'INBOUNDED' && actual >= declared) return 'INBOUNDED';
  if (['DEVANNING', 'DEVANNED'].includes(row.fulfillmentStatus)) return 'DEVANNING';
  return 'NOT_INBOUNDED';
}

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2);
}

function formatDateTime(value: string | null | undefined) {
  return value || '--';
}

function getDisplayCbm(row: Api.Oms.NewCargoOrder) {
  return resolveReadiness(row) === 'INBOUNDED' ? row.actualCbm || row.declaredCbm : row.declaredCbm;
}

function getDisplayPalletQty(row: Api.Oms.NewCargoOrder) {
  const actual = row.actualPalletQty;
  const declared = row.declaredPalletQty;
  if (actual !== null && actual !== undefined) return `${actual} / ${declared ?? 0}`;
  return `-- / ${declared ?? 0}`;
}

function getDisplayWeight(row: Api.Oms.NewCargoOrder) {
  return row.actualWeight || row.declaredWeight || 0;
}

function getStorageAge(row: Api.Oms.NewCargoOrder) {
  if (!row.actualInboundTime) return '--';
  const inboundTime = new Date(row.actualInboundTime).getTime();
  if (Number.isNaN(inboundTime)) return '--';
  return Math.max(0, Math.floor((Date.now() - inboundTime) / 86400000));
}

function isPastTime(value: string | null | undefined) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time < Date.now();
}

function getAppointmentStatusLabel(value: string | null | undefined) {
  return value ? APPOINTMENT_STATUS_META[value] || value : '--';
}

function getTransferFlagLabel(value: number | null | undefined) {
  return value === 1 ? '是' : '否';
}

function resetQuickFlags() {
  searchParams.value.readiness = null;
  searchParams.value.overdueDeliveryLfd = null;
  searchParams.value.overdueDw = null;
}

async function loadStats() {
  const { data: result } = await fetchGetOutboundPoolStats(searchParams.value);
  if (result) stats.value = result;
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Oms.NewCargoOrderList, Api.Oms.NewCargoOrder>({
    api: () => fetchGetOutboundPoolList(searchParams.value),
    columns: () => [
      { type: 'selection', width: 48, fixed: 'left' },
      {
        key: 'cargoOrderNo',
        title: '订单号',
        minWidth: 170,
        fixed: 'left',
        render: row => (
          <div class="order-cell">
            <NButton text type="primary" onClick={() => openDetail(row)}>
              {row.cargoOrderNo}
            </NButton>
            {row.holdFlag === 1 ? <NTag size="small" type="error">扣</NTag> : null}
          </div>
        )
      },
      {
        key: 'readiness',
        title: '排车准备',
        width: 110,
        render: row => {
          const meta = READINESS_META[resolveReadiness(row)];
          return <NTag type={meta.type}>{meta.label}</NTag>;
        }
      },
      { key: 'createTime', title: '创建时间', width: 160, render: row => formatDateTime(row.createTime) },
      { key: 'customerName', title: '客户', minWidth: 150 },
      { key: 'containerNo', title: '柜号', minWidth: 130 },
      { key: 'shipmentCodes', title: '货件编码', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'platformName', title: '平台', width: 120, render: row => row.platformName || '--' },
      { key: 'addressType', title: '地址类型', width: 120, render: row => addressTypeRecord.value[row.addressType as string]?.dictLabel ?? row.addressType ?? '--' },
      { key: 'platformWarehouseCode', title: '仓库代码', width: 120 },
      { key: 'groupCode', title: '目的仓/分组', width: 130, ellipsis: { tooltip: true }, render: row => row.groupCode || '--' },
      { key: 'businessTypeName', title: '业务类型', width: 120, render: row => row.businessTypeName || '--' },
      { key: 'channelName', title: '产品渠道', minWidth: 120 },
      { key: 'orderTagName', title: '运单标签', width: 120, render: row => row.orderTagName || row.orderTag || '--' },
      { key: 'declaredCartonQty', title: '预报箱数', width: 100 },
      { key: 'actualCartonQty', title: '入库箱数', width: 100 },
      { key: 'displayCbm', title: 'CBM', width: 100, render: row => formatNumber(getDisplayCbm(row)) },
      { key: 'displayPalletQty', title: '卡板数量', width: 120, render: row => getDisplayPalletQty(row) },
      { key: 'displayWeight', title: '总重量kg', width: 110, render: row => formatNumber(getDisplayWeight(row)) },
      { key: 'storageLocation', title: '库位', width: 120, render: row => row.storageLocation || '--' },
      { key: 'storageAge', title: '库龄(天)', width: 100, render: row => getStorageAge(row) },
      { key: 'devanningFinishTime', title: '拆柜完成时间', width: 160, render: row => formatDateTime(row.devanningFinishTime) },
      {
        key: 'deliveryLfd',
        title: '派送LFD',
        width: 150,
        render: row => <span class={isPastTime(row.deliveryLfd) ? 'text-danger' : ''}>{formatDateTime(row.deliveryLfd)}</span>
      },
      {
        key: 'earliestDwTime',
        title: 'DW时间',
        width: 150,
        render: row => <span class={isPastTime(row.earliestDwTime) ? 'text-danger' : ''}>{formatDateTime(row.earliestDwTime)}</span>
      },
      { key: 'state', title: '州', width: 80 },
      { key: 'city', title: '城市', width: 120 },
      { key: 'zipCode', title: '邮编', width: 110 },
      { key: 'addressLine1', title: '地址行1', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'addressLine2', title: '地址行2', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'contactName', title: '联系人', width: 120 },
      { key: 'contactPhone', title: '联系电话', width: 140 },
      { key: 'contactEmail', title: '邮箱', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'customerServiceName', title: '客服人员', width: 120 },
      { key: 'appointmentStatus', title: '预约派送状态', width: 130, render: row => getAppointmentStatusLabel(row.appointmentStatus) },
      { key: 'followUpRemark', title: '跟进记录', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'dispatchRemark', title: '调度备注', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'remark', title: '备注', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'transferFlag', title: '是否转仓', width: 100, render: row => getTransferFlagLabel(row.transferFlag) },
      { key: 'transferWarehouseCode', title: '转仓地址', width: 130 },
      { key: 'parcelTrackingNo', title: '追踪编码', minWidth: 160, ellipsis: { tooltip: true } },
      {
        key: 'operate',
        title: '操作',
        width: 110,
        fixed: 'right',
        render: row => (
          <div class="row-actions">
            <NDropdown trigger="click" options={getRowOperateOptions(row)} onSelect={key => handleRowOperate(String(key), row)}>
              <NButton size="small">
                更多
              </NButton>
            </NDropdown>
          </div>
        )
      }
    ],
    transform: response => defaultTransform(response),
    onPaginationParamsChange: ({ page, pageSize }) => {
      searchParams.value.pageNum = page;
      searchParams.value.pageSize = pageSize;
    }
  });

const actionModalVisible = ref(false);
const actionMode = ref<'pre' | 'outbound'>('pre');
const actionRow = ref<Api.Oms.NewCargoOrder | null>(null);
const actionDetailTab = ref<'INBOUNDED' | 'PENDING'>('INBOUNDED');
const actionCheckedKeys = ref<CommonType.IdType[]>([]);
const detailModalVisible = ref(false);
const detailTab = ref<'PALLET' | 'SHIPMENT'>('PALLET');
const detailRow = ref<Api.Oms.NewCargoOrder | null>(null);
const detailShipments = ref<Api.Oms.CargoOrderShipmentItem[]>([]);
const palletRows = ref<
  Array<{
    palletNo?: string | null;
    palletWeight?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    cbm?: number | null;
    storageLocation?: string | null;
  }>
>([]);
const noteModalVisible = ref(false);
const noteMode = ref<'remark' | 'follow'>('remark');
const noteRow = ref<Api.Oms.NewCargoOrder | null>(null);
const actionForm = reactive<Api.Oms.OutboundCreateParams>({
  outboundDirection: 'DELIVERY',
  outboundWarehouseId: null,
  outboundWarehouseName: null,
  transferInWarehouseId: null,
  remark: null
});
const deliveryForm = reactive({
  destination: '',
  businessTypeId: null as CommonType.IdType | null,
  shipDate: null as number | null,
  appointmentTime: null as number | null,
  palletQty: 0,
  appointmentStatus: 'UNCONFIRMED',
  appointmentType: 'SELF',
  loadingType: 'PALLET',
  transportType: 'FTL',
  deliveryCost: null as number | null,
  appointmentNo: '',
  deliveryTruck: '',
  deliveryTag: '',
  followRecord: '',
  outboundType: null as string | null,
  transferFlag: 0,
  transferWarehouseCode: '' as string
});
const preOutboundSupplierId = ref<CommonType.IdType | null>(null);
const preOutboundSupplierQuoteId = ref<CommonType.IdType | null>(null);
const preOutboundRecommendedSupplierId = ref<CommonType.IdType | null>(null);

const supplierRecommendContext = computed(() => ({
  destination: deliveryForm.destination,
  warehouseName: actionForm.outboundWarehouseName,
  transportType: deliveryForm.transportType,
  loadingType: deliveryForm.loadingType
}));

const amazonPlatformId = computed(() => {
  const amazon = platformRows.value.find(
    item => item.code?.toUpperCase() === 'AMAZON' || item.nameEn?.toUpperCase().includes('AMAZON')
  );
  return amazon?.id ?? null;
});

const amazonTransferAddressOptions = computed(() =>
  platformAddressRows.value
    .filter(item => !amazonPlatformId.value || String(item.platformId) === String(amazonPlatformId.value))
    .map(item => ({
      label: `${item.addressCode} - ${item.nameEn || item.city || ''}`,
      value: item.addressCode
    }))
);

const deliveryBusinessTypeOptions = computed(() => {
  const options = [...businessTypeOptions.value];
  const row = actionRow.value ?? cachedOrders.value[0];
  const currentId = deliveryForm.businessTypeId;
  const currentName = row?.businessTypeName;
  if (currentId != null && currentId !== '' && !options.some(item => String(item.value) === String(currentId))) {
    const numId = Number(currentId);
    options.unshift({
      label: currentName || String(currentId),
      value: (Number.isNaN(numId) ? currentId : numId) as CommonType.IdType
    });
  }
  return options;
});

watch(
  () => deliveryForm.transferFlag,
  flag => {
    if (flag === 1) {
      if (!deliveryForm.outboundType) deliveryForm.outboundType = 'TRANSFER';
      return;
    }
    deliveryForm.transferWarehouseCode = '';
    if (deliveryForm.outboundType === 'TRANSFER') deliveryForm.outboundType = 'DELIVERY';
  }
);
const noteForm = reactive({
  content: ''
});
const rowRemarkMap = ref<Record<string, string>>({});
const rowFollowMap = ref<Record<string, string[]>>({});

const actionTitle = computed(() => (actionMode.value === 'pre' ? '创建预出单' : '生成车次订单'));
const noteTitle = computed(() => (noteMode.value === 'remark' ? '填写备注' : '填写跟进记录'));

function getRowOperateOptions(row: Api.Oms.NewCargoOrder) {
  return [
    { label: '详情', key: 'detail' },
    { label: '填写备注', key: 'remark' },
    { label: '填写跟进记录', key: 'follow' },
    { label: resolveReadiness(row) === 'INBOUNDED' ? '生成车次' : '预出单', key: 'create' }
  ];
}

function handleRowOperate(key: string, row: Api.Oms.NewCargoOrder) {
  if (key === 'detail') {
    openDetail(row);
    return;
  }
  if (key === 'create') {
    openCreate(row);
    return;
  }
  if (key === 'remark' || key === 'follow') openNote(row, key);
}

async function openDetail(row: Api.Oms.NewCargoOrder) {
  detailRow.value = row;
  detailTab.value = 'PALLET';
  detailShipments.value = row.shipments || [];
  palletRows.value = [];
  detailModalVisible.value = true;
  const { data: detail } = await fetchGetCargoOrderDetail(row.id);
  if (detail) {
    detailRow.value = detail;
    detailShipments.value = detail.shipments || [];
  }
}

function getOrderKey(row: Api.Oms.NewCargoOrder) {
  return String(row.id);
}

function addCheckedToCache() {
  const checkedSet = new Set(checkedRowKeys.value.map(String));
  const rows = visibleData.value.filter(row => checkedSet.has(getOrderKey(row)));
  if (!rows.length) {
    window.$message?.warning('请先勾选要加入缓存订单的货物');
    return;
  }
  const existing = new Set(cachedOrders.value.map(getOrderKey));
  const appendRows = rows.filter(row => !existing.has(getOrderKey(row)));
  cachedOrders.value = [...cachedOrders.value, ...appendRows];
  checkedRowKeys.value = [];
  window.$message?.success(`已加入缓存订单 ${appendRows.length} 条`);
}

function clearCachedOrders() {
  cachedOrders.value = [];
}

function openCachedCreate() {
  if (!cachedOrders.value.length) {
    window.$message?.warning('请先将货物加入缓存订单');
    return;
  }
  openCreate(null);
}

function syncDeliveryBusinessType(id?: CommonType.IdType | null, name?: string | null) {
  const resolved = resolveBusinessTypeId(businessTypeRows.value, id, name);
  if (resolved == null) {
    deliveryForm.businessTypeId = null;
    return;
  }
  const matched = businessTypeRows.value.find(item => String(item.id) === String(resolved));
  const rawId = matched?.id ?? resolved;
  const numId = Number(rawId);
  deliveryForm.businessTypeId = Number.isNaN(numId) ? rawId : numId;
}

function openCreate(row: Api.Oms.NewCargoOrder | null) {
  actionRow.value = row;
  actionMode.value = row ? (resolveReadiness(row) === 'INBOUNDED' ? 'outbound' : 'pre') : cachedActionMode.value;
  actionDetailTab.value = row && resolveReadiness(row) !== 'INBOUNDED' ? 'PENDING' : 'INBOUNDED';
  actionCheckedKeys.value = [];
  actionForm.cargoOrderId = row?.id ?? null;
  actionForm.cargoOrderIds = row ? undefined : cachedOrders.value.map(item => item.id);
  actionForm.outboundDirection = 'DELIVERY';
  actionForm.outboundWarehouseId = row?.inboundWarehouseId ?? cachedOrders.value[0]?.inboundWarehouseId ?? null;
  actionForm.outboundWarehouseName = row?.inboundWarehouseName ?? cachedOrders.value[0]?.inboundWarehouseName ?? null;
  actionForm.transferInWarehouseId = null;
  actionForm.remark = null;
  deliveryForm.destination = row?.groupCode || cachedOrders.value[0]?.groupCode || row?.platformWarehouseCode || cachedOrders.value[0]?.platformWarehouseCode || '';
  syncDeliveryBusinessType(
    row?.businessTypeId ?? cachedOrders.value[0]?.businessTypeId,
    row?.businessTypeName ?? cachedOrders.value[0]?.businessTypeName
  );
  deliveryForm.shipDate = null;
  deliveryForm.appointmentTime = null;
  deliveryForm.palletQty = Number(row?.actualPalletQty || row?.declaredPalletQty || cachedOrders.value.reduce((sum, item) => sum + Number(item.actualPalletQty || item.declaredPalletQty || 0), 0));
  deliveryForm.appointmentStatus = 'UNCONFIRMED';
  deliveryForm.appointmentType = 'SELF';
  deliveryForm.loadingType = 'PALLET';
  deliveryForm.transportType = 'FTL';
  deliveryForm.deliveryCost = null;
  deliveryForm.appointmentNo = '';
  deliveryForm.deliveryTruck = '';
  deliveryForm.deliveryTag = '';
  deliveryForm.followRecord = '';
  deliveryForm.outboundType = row?.transferFlag === 1 || cachedOrders.value[0]?.transferFlag === 1 ? 'TRANSFER' : 'DELIVERY';
  deliveryForm.transferFlag = Number(row?.transferFlag ?? cachedOrders.value[0]?.transferFlag ?? 0);
  deliveryForm.transferWarehouseCode = row?.transferWarehouseCode || cachedOrders.value[0]?.transferWarehouseCode || '';
  preOutboundSupplierId.value = null;
  preOutboundSupplierQuoteId.value = null;
  preOutboundRecommendedSupplierId.value = null;
  actionModalVisible.value = true;
}

function openNote(row: Api.Oms.NewCargoOrder, mode: 'remark' | 'follow') {
  noteRow.value = row;
  noteMode.value = mode;
  const key = getOrderKey(row);
  noteForm.content = mode === 'remark' ? rowRemarkMap.value[key] || row.remark || '' : '';
  noteModalVisible.value = true;
}

function handleWarehouseChange(value: CommonType.IdType | null, option: CommonType.Option | null) {
  actionForm.outboundWarehouseId = value;
  actionForm.outboundWarehouseName = option?.label?.toString() || null;
}

async function submitCreate() {
  const payload = { ...actionForm };
  if (actionRow.value) payload.cargoOrderId = actionRow.value.id;
  else payload.cargoOrderIds = cachedOrders.value.map(item => item.id);
  if (!payload.outboundWarehouseId) {
    window.$message?.warning('请选择出库仓库');
    return;
  }
  if (!deliveryForm.outboundType) {
    window.$message?.warning('请选择出库类型');
    return;
  }
  if (deliveryForm.transferFlag === 1 && !deliveryForm.transferWarehouseCode?.trim()) {
    window.$message?.warning('请选择转仓地址');
    return;
  }
  payload.outboundDirection = deliveryForm.outboundType;
  payload.transferFlag = deliveryForm.transferFlag;
  payload.transferWarehouseCode =
    deliveryForm.transferFlag === 1 ? deliveryForm.transferWarehouseCode.trim() : null;
  payload.deliveryMethod = getBusinessTypeNameById(businessTypeRows.value, deliveryForm.businessTypeId);
  payload.appointmentStatus = deliveryForm.appointmentStatus;
  payload.appointmentNo = deliveryForm.appointmentNo;
  payload.appointmentTime = deliveryForm.appointmentTime;
  payload.deliveryTruck = deliveryForm.deliveryTruck;
  payload.loadingType = deliveryForm.loadingType;
  payload.transportType = deliveryForm.transportType;
  payload.deliveryTag = deliveryForm.deliveryTag;
  payload.destination = deliveryForm.destination;
  payload.followRecord = deliveryForm.followRecord;
  payload.remark = actionForm.remark;
  payload.appointmentType = deliveryForm.appointmentType;
  payload.deliveryCost = deliveryForm.deliveryCost;
  if (actionMode.value === 'pre') {
    payload.supplierId = preOutboundSupplierId.value;
    payload.supplierQuoteId = preOutboundSupplierQuoteId.value;
    payload.recommendedSupplierId = preOutboundRecommendedSupplierId.value;
    if (actionRow.value) await fetchCreatePoolPreOutbound(payload);
    else await fetchBatchCreatePoolPreOutbound(payload);
  } else if (actionRow.value) {
    await fetchCreatePoolOutboundOrder(payload);
  } else {
    await fetchBatchCreatePoolOutboundOrder(payload);
  }
  window.$message?.success('操作成功');
  actionModalVisible.value = false;
  if (!actionRow.value) clearCachedOrders();
  await getData();
  await loadStats();
}

function removeActionOrder(row: Api.Oms.NewCargoOrder) {
  if (actionRow.value) return;
  cachedOrders.value = cachedOrders.value.filter(item => getOrderKey(item) !== getOrderKey(row));
  actionCheckedKeys.value = actionCheckedKeys.value.filter(key => String(key) !== getOrderKey(row));
  if (!cachedOrders.value.length) actionModalVisible.value = false;
}

function removeCheckedActionOrders() {
  if (actionRow.value || !actionCheckedKeys.value.length) return;
  const checkedSet = new Set(actionCheckedKeys.value.map(String));
  cachedOrders.value = cachedOrders.value.filter(row => !checkedSet.has(getOrderKey(row)));
  actionCheckedKeys.value = [];
  if (!cachedOrders.value.length) actionModalVisible.value = false;
}

function isActionRowChecked(row: Api.Oms.NewCargoOrder) {
  return actionCheckedKeys.value.map(String).includes(getOrderKey(row));
}

function toggleActionRowChecked(row: Api.Oms.NewCargoOrder, checked: boolean) {
  const key = row.id;
  if (checked) {
    if (!isActionRowChecked(row)) actionCheckedKeys.value = [...actionCheckedKeys.value, key];
  } else {
    actionCheckedKeys.value = actionCheckedKeys.value.filter(item => String(item) !== getOrderKey(row));
  }
}

async function submitNote() {
  if (!noteRow.value) return;
  if (!noteForm.content.trim()) {
    window.$message?.warning(noteMode.value === 'remark' ? '请输入备注' : '请输入跟进记录');
    return;
  }
  const key = getOrderKey(noteRow.value);
  if (noteMode.value === 'remark') {
    const remark = noteForm.content.trim();
    await fetchUpdateCargoOrder({ id: noteRow.value.id, remark });
    rowRemarkMap.value = { ...rowRemarkMap.value, [key]: remark };
    noteRow.value.remark = remark;
  } else {
    const current = rowFollowMap.value[key] || [];
    const followUpRemark = noteForm.content.trim();
    await fetchUpdateCargoOrder({ id: noteRow.value.id, followUpRemark });
    rowFollowMap.value = { ...rowFollowMap.value, [key]: [followUpRemark, ...current] };
    noteRow.value.followUpRemark = followUpRemark;
  }
  noteModalVisible.value = false;
  window.$message?.success('已记录');
  await getData();
}

function applyAdvancedFilters() {
  for (const field of advancedFieldOptions) {
    delete searchParams.value[field.value];
  }
  for (const item of advancedFilters.value) {
    if (item.field && item.value !== null && item.value !== '') {
      searchParams.value[item.field] = item.value as never;
    }
  }
}

function addAdvancedFilter() {
  advancedFilters.value.push({ id: Date.now(), field: null, value: null });
}

function removeAdvancedFilter(id: number) {
  advancedFilters.value = advancedFilters.value.filter(item => item.id !== id);
}

function handleSearch() {
  applyAdvancedFilters();
  searchParams.value.pageNum = 1;
  getDataByPage(1);
  loadStats();
}

function handleReset() {
  advancedFilters.value = [];
  activeTag.value = '';
  searchParams.value = { pageNum: 1, pageSize: searchParams.value.pageSize || 10 };
  getDataByPage(1);
  loadStats();
}

function handleTagChange(value: string) {
  activeTag.value = value;
  resetQuickFlags();
  if (value === 'OVER_LFD') searchParams.value.overdueDeliveryLfd = true;
  else if (value === 'OVER_DW') searchParams.value.overdueDw = true;
  else searchParams.value.readiness = (value || null) as Api.Oms.OutboundReadiness | null;
  handleSearch();
}

onMounted(async () => {
  const [warehouseRes, businessRes, platformRes, platformAddressRes] = await Promise.all([
    fetchGetWarehouseList({ pageNum: 1, pageSize: 200 }),
    fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformAddressList({ pageNum: 1, pageSize: 2000, status: '0', params: {} })
  ]);
  warehouseOptions.value = (warehouseRes.data?.rows || []).map(item => ({ label: item.warehouseName, value: item.id }));
  businessTypeRows.value = businessRes.data?.rows || [];
  businessTypeOptions.value = mapBusinessTypeOptions(businessTypeRows.value);
  platformRows.value = platformRes.data?.rows || [];
  platformAddressRows.value = platformAddressRes.data?.rows || [];
  await loadStats();
});

onActivated(() => {
  getData();
  loadStats();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <template #header>
        <NSpace align="center" :size="8" wrap>
          <NButton text @click="searchCollapsed = !searchCollapsed">
            {{ searchCollapsed ? '展开筛选' : '收起筛选' }}
          </NButton>
          <NButton text type="primary" @click="advancedVisible = true">高级筛选</NButton>
        </NSpace>
      </template>
      <template #header-extra>
        <NSpace :size="8">
          <NButton :disabled="!checkedRowKeys.length" @click="addCheckedToCache">加入缓存订单</NButton>
          <div v-if="cachedOrders.length" class="cache-stats">
            <span class="stat-item">
              <span class="stat-label">CBM</span>
              <span class="stat-value">{{ formatNumber(cachedTotals.cbm) }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">重量</span>
              <span class="stat-value">{{ formatNumber(cachedTotals.weight) }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">板数</span>
              <span class="stat-value">{{ cachedTotals.palletQty }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">箱数</span>
              <span class="stat-value">{{ cachedTotals.cartonQty }}</span>
            </span>
          </div>
          <NButton type="primary" :disabled="!cachedOrders.length" @click="openCachedCreate">生成车次订单</NButton>
          <NButton @click="handleReset">重置</NButton>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
        </NSpace>
      </template>

      <NForm v-if="!searchCollapsed" label-placement="left" :label-width="80">
        <div class="search-grid">
          <NFormItem label="关键词"><NInput v-model:value="searchParams.keyword" placeholder="运单号/货件/柜号" clearable /></NFormItem>
          <NFormItem label="客户"><NInput v-model:value="searchParams.customerName" placeholder="客户名称" clearable /></NFormItem>
          <NFormItem label="平台仓"><NInput v-model:value="searchParams.platformWarehouseCode" placeholder="平台仓代码" clearable /></NFormItem>
          <NFormItem label="目的仓/分组"><NInput v-model:value="searchParams.groupCode" placeholder="分组编码" clearable /></NFormItem>
          <NFormItem label="州/省"><NInput v-model:value="searchParams.state" placeholder="State" clearable /></NFormItem>
        </div>
      </NForm>
    </NCard>

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden outbound-table-card"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="flex min-h-0 flex-1 flex-col gap-12px overflow-hidden">
        <div class="table-toolbar">
          <div class="status-tabs">
            <button
              v-for="tab in lifecycleTabs"
              :key="tab.value"
              class="status-tab"
              :class="{ active: activeTag === tab.value }"
              @click="handleTagChange(tab.value)"
            >
              <span>{{ tab.label }}</span>
              <strong>{{ tab.count }}</strong>
            </button>
          </div>
          <div v-if="cachedOrders.length" class="cache-summary">
            <span>缓存订单 {{ cachedOrders.length }} 条</span>
            <span>{{ cachedActionText }}</span>
            <NButton text type="primary" @click="clearCachedOrders">清空</NButton>
          </div>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :loading="loading"
            :show-add="false"
            :show-delete="false"
            :show-export="false"
            @refresh="getData"
          />
        </div>

        <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
          <DataTable
            v-model:checked-row-keys="checkedRowKeys"
            :loading="loading"
            :columns="columns"
            :data="visibleData"
            :pagination="false"
            :flex-height="!appStore.isMobile"
            :scroll-x="scrollX"
            :row-key="(row: Api.Oms.NewCargoOrder) => row.id"
            class="h-full min-h-280px sm:min-h-0"
          />
        </div>
        <div class="table-footer">
          <div class="pagination-stats">
            <span class="stat-item">
              <span class="stat-label">在途CBM</span>
              <span class="stat-value">{{ formatNumber(stats.inTransitCbm) }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">拆柜CBM</span>
              <span class="stat-value">{{ formatNumber(stats.devanningCbm) }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">已入库CBM</span>
              <span class="stat-value">{{ formatNumber(stats.inboundedCbm) }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">总CBM</span>
              <span class="stat-value">{{ formatNumber(stats.totalCbm) }}</span>
            </span>
            <span class="stat-item danger">
              <span class="stat-label">超LFD</span>
              <span class="stat-value">{{ stats.overdueDeliveryLfdCount }}</span>
            </span>
            <span class="stat-item danger">
              <span class="stat-label">超DW</span>
              <span class="stat-value">{{ stats.overdueDwCount }}</span>
            </span>
          </div>
          <NPagination v-bind="mobilePagination" />
        </div>
      </div>
    </NCard>

    <NModal v-model:show="advancedVisible" preset="card" title="高级筛选" class="advanced-modal">
      <div class="advanced-list">
        <div v-for="item in advancedFilters" :key="item.id" class="advanced-row">
          <NSelect :to="POPUP_TO_BODY" v-model:value="item.field" :options="advancedFieldOptions" placeholder="选择字段" class="field-select" />
          <NInput
            :value="item.value === null ? null : String(item.value)"
            placeholder="请输入筛选值"
            clearable
            @update:value="value => (item.value = value)"
          />
          <NButton quaternary type="error" @click="removeAdvancedFilter(item.id)">删除</NButton>
        </div>
      </div>
      <NButton class="mt-12px" @click="addAdvancedFilter">添加筛选字段</NButton>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="advancedVisible = false">取消</NButton>
          <NButton
            type="primary"
            @click="
              advancedVisible = false;
              handleSearch();
            "
          >
            应用
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="actionModalVisible"
      preset="card"
      :title="actionTitle"
      class="delivery-modal"
      style="width: min(980px, 72vw); max-width: calc(100vw - 96px)"
    >
      <section class="delivery-section">
        <div class="section-title">基础信息</div>
        <NForm label-placement="left" :label-width="92">
          <div class="delivery-form-grid">
            <NFormItem label="目的地">
              <NInput v-model:value="deliveryForm.destination" placeholder="请输入目的地" />
            </NFormItem>
            <NFormItem label="业务类型">
              <NSelect
                :to="POPUP_TO_BODY"
                v-model:value="deliveryForm.businessTypeId"
                :options="deliveryBusinessTypeOptions"
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
              <NDatePicker :to="POPUP_TO_BODY" v-model:value="deliveryForm.shipDate" type="date" clearable class="w-full" placeholder="请选择日期" />
            </NFormItem>
            <NFormItem label="APPT">
              <NDatePicker :to="POPUP_TO_BODY" v-model:value="deliveryForm.appointmentTime" type="datetime" clearable class="w-full" placeholder="请选择日期" />
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
                <NRadioButton value="SUPPLIER">供应商约</NRadioButton>
              </NRadioGroup>
            </NFormItem>
            <SupplierQuoteRecommendField
              v-if="actionMode === 'pre'"
              v-model:supplier-id="preOutboundSupplierId"
              v-model:supplier-quote-id="preOutboundSupplierQuoteId"
              v-model:recommended-supplier-id="preOutboundRecommendedSupplierId"
              v-model:delivery-cost="deliveryForm.deliveryCost"
              :context="supplierRecommendContext"
              :enabled="actionMode === 'pre'"
              label="推荐供应商"
            />
            <NFormItem label="派送成本">
              <NInputGroup>
                <NInputNumber v-model:value="deliveryForm.deliveryCost" class="w-full" :min="0" placeholder="请输入" />
                <NInputGroupLabel>USD</NInputGroupLabel>
              </NInputGroup>
            </NFormItem>
            <NFormItem label="预约号">
              <NInputGroup>
                <NInput v-model:value="deliveryForm.appointmentNo" placeholder="请输入或选择预约" />
                <NButton>选择预约</NButton>
              </NInputGroup>
            </NFormItem>

            <NFormItem label="备注">
              <NInput v-model:value="actionForm.remark" placeholder="请输入" />
            </NFormItem>
            <NFormItem label="跟进记录">
              <NInput v-model:value="deliveryForm.followRecord" placeholder="请输入跟进记录" />
            </NFormItem>
            <NFormItem label="* 出库类型">
              <NSelect :to="POPUP_TO_BODY" v-model:value="deliveryForm.outboundType" placeholder="请选择" :options="[{ label: '派送出库', value: 'DELIVERY' }, { label: '调拨出库', value: 'TRANSFER' }]" />
            </NFormItem>
            <NFormItem label="* 是否转仓">
              <NRadioGroup v-model:value="deliveryForm.transferFlag">
                <NRadioButton :value="1">是</NRadioButton>
                <NRadioButton :value="0">否</NRadioButton>
              </NRadioGroup>
            </NFormItem>
            <NFormItem v-if="deliveryForm.transferFlag === 1" label="* 转仓地址">
              <NSelect
                :to="POPUP_TO_BODY"
                v-model:value="deliveryForm.transferWarehouseCode"
                :options="amazonTransferAddressOptions"
                clearable
                filterable
                placeholder="请选择亚马逊平台仓库"
              />
            </NFormItem>
          </div>
        </NForm>
      </section>

      <section class="delivery-section mt-16px">
        <div class="section-title">出库明细</div>
        <div class="delivery-detail-body">
          <NTabs v-model:value="actionDetailTab" type="card">
            <NTabPane name="INBOUNDED" :tab="`已入库 ${inboundedActionOrders.length}`" />
            <NTabPane name="PENDING" :tab="`待入库 ${pendingInboundActionOrders.length}`" />
          </NTabs>
          <div class="detail-toolbar">
            <NButton size="small" type="error" ghost :disabled="Boolean(actionRow) || !actionCheckedKeys.length" @click="removeCheckedActionOrders">
              批量删除
            </NButton>
            <div class="detail-total">
              合计: {{ actionTotals.pcs }} PCS, {{ formatNumber(actionTotals.cbm) }} CBM, {{ formatNumber(actionTotals.weight) }} lbs
            </div>
          </div>
          <div class="delivery-detail-table">
            <table>
              <thead>
                <tr>
                  <th class="check-col"></th>
                  <th>运单号</th>
                  <th>柜号</th>
                  <th>卡板号</th>
                  <th>库位</th>
                  <th>件重体</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in actionDetailRows" :key="row.id">
                  <td class="check-col">
                    <NCheckbox
                      :checked="isActionRowChecked(row)"
                      :disabled="Boolean(actionRow)"
                      @update:checked="checked => toggleActionRowChecked(row, checked)"
                    />
                  </td>
                  <td>{{ row.cargoOrderNo }}</td>
                  <td>{{ row.containerNo || '--' }}</td>
                  <td>{{ row.shipmentCodes || '--' }}</td>
                  <td>{{ row.platformWarehouseCode || '--' }}</td>
                  <td>
                    <div>件数: {{ row.actualPieceQty || row.declaredPieceQty || row.actualCartonQty || row.declaredCartonQty || 0 }}</div>
                    <div>重量(lbs): {{ formatNumber(row.actualWeight || row.declaredWeight) }}</div>
                    <div>体积: {{ formatNumber(row.actualCbm || row.declaredCbm) }}</div>
                  </td>
                  <td>
                    <NButton text type="error" :disabled="Boolean(actionRow)" @click="removeActionOrder(row)">删除</NButton>
                  </td>
                </tr>
                <tr v-if="!actionDetailRows.length">
                  <td colspan="7" class="empty-cell">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="actionModalVisible = false">取消</NButton>
          <NButton type="primary" @click="submitCreate">确认</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="detailModalVisible"
      preset="card"
      title="订单详情"
      class="detail-modal"
      style="width: min(980px, 72vw); max-width: calc(100vw - 96px)"
    >
      <div class="detail-head">
        <div>
          <strong>{{ detailRow?.cargoOrderNo }}</strong>
          <span>{{ detailRow?.customerName || '--' }}</span>
        </div>
        <NTag :type="detailRow ? READINESS_META[resolveReadiness(detailRow)].type : 'default'">
          {{ detailRow ? READINESS_META[resolveReadiness(detailRow)].label : '--' }}
        </NTag>
      </div>
      <NTabs v-model:value="detailTab" type="line">
        <NTabPane name="PALLET" tab="卡板数据">
          <div class="delivery-detail-table">
            <table>
              <thead>
                <tr>
                  <th>卡板号</th>
                  <th>卡板重量</th>
                  <th>长</th>
                  <th>宽</th>
                  <th>高</th>
                  <th>CBM</th>
                  <th>库位</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in palletRows" :key="item.palletNo || item.storageLocation || 'pallet'">
                  <td>{{ item.palletNo || '--' }}</td>
                  <td>{{ formatNumber(item.palletWeight) }}</td>
                  <td>{{ item.length ?? '--' }}</td>
                  <td>{{ item.width ?? '--' }}</td>
                  <td>{{ item.height ?? '--' }}</td>
                  <td>{{ formatNumber(item.cbm) }}</td>
                  <td>{{ item.storageLocation || '--' }}</td>
                </tr>
                <tr v-if="!palletRows.length">
                  <td colspan="7" class="empty-cell">卡板表未接入，数据源已预留</td>
                </tr>
              </tbody>
            </table>
          </div>
        </NTabPane>
        <NTabPane name="SHIPMENT" tab="货件层">
          <div class="delivery-detail-table">
            <table>
              <thead>
                <tr>
                  <th>货件编码</th>
                  <th>PO号</th>
                  <th>Mark/唛头</th>
                  <th>箱数</th>
                  <th>板数</th>
                  <th>重量</th>
                  <th>CBM</th>
                  <th>DW时间</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detailShipments" :key="item.id ?? item.shipmentNo ?? ''">
                  <td>{{ item.shipmentNo }}</td>
                  <td>{{ item.poNo || '--' }}</td>
                  <td>{{ item.shippingMark || '--' }}</td>
                  <td>{{ item.cartonQty ?? '--' }}</td>
                  <td>{{ item.palletQty ?? '--' }}</td>
                  <td>{{ formatNumber(item.weight) }}</td>
                  <td>{{ formatNumber(item.cbm) }}</td>
                  <td>{{ formatDateTime(item.dwTime) }}</td>
                  <td>{{ item.remark || '--' }}</td>
                </tr>
                <tr v-if="!detailShipments.length">
                  <td colspan="9" class="empty-cell">暂无货件数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </NTabPane>
      </NTabs>
    </NModal>

    <NModal v-model:show="noteModalVisible" preset="card" :title="noteTitle" class="action-modal">
      <NForm label-placement="left" :label-width="96">
        <NFormItem label="订单">
          <NInput :value="noteRow?.cargoOrderNo || ''" readonly />
        </NFormItem>
        <NFormItem :label="noteMode === 'remark' ? '备注' : '跟进记录'">
          <NInput
            v-model:value="noteForm.content"
            type="textarea"
            :placeholder="noteMode === 'remark' ? '请输入备注' : '请输入本次跟进记录'"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="noteModalVisible = false">取消</NButton>
          <NButton type="primary" @click="submitNote">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.outbound-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
}
.search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}
.outbound-table-card :deep(.n-card__content) {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}
.table-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
}
.status-tabs {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.status-tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  min-width: 72px;
  justify-content: center;
  gap: 5px;
  border: 0;
  border-radius: 16px;
  background: #f0f2f5;
  color: #606266;
  cursor: pointer;
  padding: 4px 9px;
  font-size: 12px;
}
.status-tab strong {
  display: inline-flex;
  min-width: 16px;
  justify-content: center;
  border-radius: 8px;
  background: #d0d3d9;
  color: #606266;
  padding: 0 4px;
  font-size: 11px;
  line-height: 16px;
}
.status-tab.active {
  background: #2563eb;
  box-shadow: 0 2px 6px rgb(37 99 235 / 24%);
  color: #fff;
}
.status-tab.active span {
  color: #fff;
}
.status-tab.active strong {
  background: rgb(255 255 255 / 26%);
  color: #fff;
}
.cache-summary {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 4px 8px;
  font-size: 12px;
}
.cache-stats {
  display: inline-flex;
  max-width: 520px;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  white-space: nowrap;
}
.table-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-top: 1px solid #edf0f5;
  padding-top: 12px;
}
.pagination-stats {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-wrap: nowrap;
  justify-content: flex-start;
  gap: 8px;
  overflow-x: auto;
  white-space: nowrap;
  font-size: 12px;
}
.table-footer :deep(.n-pagination) {
  flex-shrink: 0;
}
.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  padding: 2px 7px;
}
.stat-label {
  color: #6b7280;
}
.stat-value {
  color: #111827;
  font-weight: 600;
}
.stat-item.danger {
  border-color: #f3c6cf;
  background: #fff5f7;
}
.stat-item.danger .stat-label,
.stat-item.danger .stat-value {
  color: #d03050;
}
.table-toolbar :deep(.n-space) {
  flex-shrink: 0;
}
.text-danger {
  color: #d03050;
  font-weight: 600;
}
.order-cell,
.row-actions,
.advanced-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.advanced-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field-select {
  width: 180px;
  flex-shrink: 0;
}
.cache-order-panel {
  margin-bottom: 14px;
  border: 1px solid #edf0f5;
  border-radius: 6px;
  background: #f8fafc;
  padding: 12px;
}
.cache-order-title,
.cache-order-list {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cache-order-title {
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 600;
}
.cache-order-list {
  max-height: 96px;
  flex-wrap: wrap;
  overflow-y: auto;
}
.cache-order-item {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  padding: 3px 6px;
  color: #334155;
  font-size: 12px;
}
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
  margin-top: 12px;
  margin-bottom: 10px;
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
.check-col {
  width: 44px;
  text-align: center !important;
}
.empty-cell {
  height: 90px;
  color: #9ca3af !important;
  text-align: center !important;
}
.detail-modal :deep(.n-card__content) {
  max-height: 72vh;
  overflow-y: auto;
}
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.detail-head > div {
  display: flex;
  align-items: center;
  gap: 12px;
}
.detail-head span {
  color: #6b7280;
}
.advanced-modal,
.action-modal {
  width: min(620px, 92vw);
}
.w-full {
  width: 100%;
}
</style>
