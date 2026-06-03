<script setup lang="tsx">
import { computed, h, onActivated, onMounted, ref } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import { fetchGetBusinessTypeList, fetchGetChannelList, fetchGetPlatformList, fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchDeleteCargoOrder,
  fetchHoldCargoOrder,
  fetchReleaseCargoOrderHold,
  fetchGetCargoOrderDetail,
  fetchGetCargoOrderList,
  fetchGetCargoOrderStatusCount,
  fetchSplitCargoOrder,
  fetchMergeBackCargoOrder
} from '@/service/api/oms/cargo-order';
import CargoOrderDetailDrawer from './modules/cargo-order-detail-drawer.vue';
import { useCargoOrderTransfer } from '../container-order/composables/use-cargo-order-transfer';

defineOptions({ name: 'CargoOrderPage' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { cancelTransfer, modifyTransfer } = useCargoOrderTransfer(() => getData());
const POPUP_TO_BODY = false;

const { options: fulfillmentStatusOptions } = useDict('oms_cargo_fulfillment_status');
const { options: billingStatusOptions } = useDict('oms_cargo_billing_status');
const { options: parcelCarrierOptions } = useDict('oms_parcel_carrier');
const { options: addressTypeOptions } = useDict('oms_address_type');

const channelOptions = ref<CommonType.Option[]>([]);
const businessTypeOptions = ref<CommonType.Option[]>([]);
const platformOptions = ref<CommonType.Option[]>([]);
const warehouseOptions = ref<CommonType.Option[]>([]);

const ORDER_SOURCE_OPTIONS = [
  { label: '自建单', value: 'SELF' },
  { label: 'API下单', value: 'API' },
  { label: '客户门户下单', value: 'PORTAL' }
];

const OUTBOUND_ORDER_STATUS_OPTIONS = [
  { label: '未出单', value: 'NONE' },
  { label: '已出单', value: 'CREATED' },
  { label: '已取消', value: 'CANCELLED' }
];

const fulfillmentStatusFilterOptions = computed(() =>
  fulfillmentStatusOptions.value.length
    ? fulfillmentStatusOptions.value
    : FULFILLMENT_STATUS_LIST.map(item => ({ label: item.label, value: item.value }))
);

// ===================== 状态 Tab =====================

const FULFILLMENT_STATUS_LIST = [
  { label: '在途',     value: 'IN_TRANSIT',         type: 'info' },
  { label: '已到港',   value: 'ARRIVED_PORT',       type: 'warning' },
  { label: '已提柜',   value: 'PICKED_UP',          type: 'warning' },
  { label: '已到仓',   value: 'ARRIVED_WAREHOUSE',  type: 'warning' },
  { label: '拆柜中',   value: 'DEVANNING',          type: 'warning' },
  { label: '拆柜完成', value: 'DEVANNED',           type: 'warning' },
  { label: '已入库',   value: 'INBOUNDED',          type: 'success' },
  { label: '已出单',   value: 'OUTBOUND_ORDERED',   type: 'success' },
  { label: '已预约',   value: 'DELIVERY_APPOINTED', type: 'success' },
  { label: '已出库',   value: 'OUTBOUNDED',         type: 'success' },
  { label: '派送中',   value: 'DELIVERING',         type: 'info' },
  { label: '已签收',   value: 'DELIVERED',          type: 'success' },
  { label: 'POD回传',  value: 'POD_UPLOADED',       type: 'success' },
  { label: '已出账单', value: 'BILLED',             type: 'success' },
  { label: '已完成',   value: 'COMPLETED',          type: 'success' },
  { label: '异常中',   value: 'EXCEPTION',          type: 'error' },
  { label: '已取消',   value: 'CANCELLED',          type: 'default' }
] as const;

const activeStatus = ref('');
const statusCountMap = ref<Record<string, number>>({});

async function loadStatusCount() {
  const { data } = await fetchGetCargoOrderStatusCount(searchParams.value);
  if (data) statusCountMap.value = data;
}

const lifecycleTabs = computed(() => {
  const total = Object.values(statusCountMap.value).reduce((sum, n) => sum + n, 0);
  return [
    { label: '全部', value: '', count: total },
    ...FULFILLMENT_STATUS_LIST.map(item => ({ ...item, count: statusCountMap.value[item.value] || 0 }))
  ];
});

function handleStatusChange(val: string) {
  activeStatus.value = val;
  searchParams.value.fulfillmentStatus = val || undefined;
  getData();
}

// ===================== 搜索参数 =====================

const searchCollapsed = ref(false);

const ORDER_NO_FIELD_OPTIONS: { label: string; value: Api.Oms.CargoOrderKeywordField }[] = [
  { label: '订单号', value: 'cargoOrderNo' },
  { label: '唛头', value: 'mark' },
  { label: '货件编码', value: 'shipmentCode' },
  { label: 'PO号', value: 'poNo' },
  { label: '参考号', value: 'externalOrderNo' }
];

const orderNoField = ref<Api.Oms.CargoOrderKeywordField>('cargoOrderNo');
const orderNoKeyword = ref<string | null>(null);

const searchParams = ref<Api.Oms.NewCargoOrderSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keywordField: 'cargoOrderNo'
});
const checkedRowKeys = ref<CommonType.IdType[]>([]);

function syncOrderNoSearch() {
  const value = orderNoKeyword.value?.trim() || null;
  searchParams.value.keywordField = orderNoField.value;
  searchParams.value.keyword = value;
  searchParams.value.cargoOrderNo = orderNoField.value === 'cargoOrderNo' ? value : null;
  searchParams.value.externalOrderNo = orderNoField.value === 'externalOrderNo' ? value : null;
}

function handleSearch() {
  syncOrderNoSearch();
  searchParams.value.fulfillmentStatus = activeStatus.value || undefined;
  searchParams.value.pageNum = 1;
  applyAdvancedFilters();
  getData();
  loadStatusCount();
}

function handleReset() {
  advancedFilters.value = [];
  activeStatus.value = '';
  orderNoField.value = 'cargoOrderNo';
  orderNoKeyword.value = null;
  searchParams.value = { pageNum: 1, pageSize: searchParams.value.pageSize || 10, keywordField: 'cargoOrderNo' };
  getData();
  loadStatusCount();
}

// ===================== 高级筛选 =====================

type AdvancedField = keyof Api.Oms.NewCargoOrderSearchParams;

type AdvancedFilter = {
  id: number;
  field: AdvancedField | null;
  value: string | number | string[] | null;
};

type AdvancedFieldOption = {
  label: string;
  value: AdvancedField;
  component?: 'select' | 'daterange';
  options?: CommonType.Option[] | (() => CommonType.Option[]);
  multiSelect?: boolean;
  endKey?: keyof Api.Oms.NewCargoOrderSearchParams;
};

const advancedModalVisible = ref(false);
const advancedFilters = ref<AdvancedFilter[]>([]);

const BOOLEAN_OPTIONS = [{ label: '是', value: 1 }, { label: '否', value: 0 }];


const PRE_OUTBOUND_STATUS_OPTIONS = [
  { label: '无预出单', value: 'NONE' },
  { label: '已预出单', value: 'PRE_CREATED' },
  { label: '已转正式', value: 'CONVERTED' },
  { label: '已取消', value: 'CANCELLED' }
];

const POD_STATUS_OPTIONS = [
  { label: '待回传', value: 'PENDING' },
  { label: '已回传', value: 'UPLOADED' },
  { label: '异常', value: 'EXCEPTION' }
];

const ADVANCED_FIELD_OPTIONS: AdvancedFieldOption[] = [
  { label: '货物单号', value: 'cargoOrderNo' },
  { label: '外部单号', value: 'externalOrderNo' },
  { label: '客户', value: 'customerName' },
  { label: '收货方', value: 'consigneeName' as AdvancedField },
  { label: '订单来源', value: 'orderSource', component: 'select', multiSelect: true, options: ORDER_SOURCE_OPTIONS },
  { label: '渠道', value: 'channelId', component: 'select', multiSelect: true, options: () => channelOptions.value },
  { label: '业务类型', value: 'businessTypeId', component: 'select', multiSelect: true, options: () => businessTypeOptions.value },
  { label: '平台', value: 'platformId', component: 'select', multiSelect: true, options: () => platformOptions.value },
  { label: '入库仓库', value: 'inboundWarehouseId', component: 'select', multiSelect: true, options: () => warehouseOptions.value },
  { label: '履约状态', value: 'fulfillmentStatus', component: 'select', multiSelect: true, options: () => fulfillmentStatusFilterOptions.value },
  { label: '出单状态', value: 'outboundOrderStatus', component: 'select', multiSelect: true, options: OUTBOUND_ORDER_STATUS_OPTIONS },
  { label: '柜号', value: 'containerNo' },
  { label: '出单号', value: 'outboundBatchNo' },
  { label: '仓库代码', value: 'platformWarehouseCode' },
  { label: '目的仓/分组', value: 'groupCode' },
  { label: 'City', value: 'city' },
  { label: 'State', value: 'state' },
  { label: 'Zip Code', value: 'zipCode' },
  { label: '快递商', value: 'parcelCarrierName' as AdvancedField, component: 'select', multiSelect: true, options: () => parcelCarrierOptions.value },
  { label: '快递追踪号', value: 'parcelTrackingNo' as AdvancedField },
  { label: '地址类型', value: 'addressType', component: 'select', multiSelect: true, options: () => addressTypeOptions.value },
  { label: '账单状态', value: 'billingStatus', component: 'select', multiSelect: true, options: () => billingStatusOptions.value },
  { label: '预出单状态', value: 'preOutboundStatus', component: 'select', multiSelect: true, options: PRE_OUTBOUND_STATUS_OPTIONS },
  { label: 'POD状态', value: 'podStatus', component: 'select', multiSelect: true, options: POD_STATUS_OPTIONS },
  { label: '是否异常', value: 'exceptionFlag', component: 'select', multiSelect: true, options: BOOLEAN_OPTIONS },
  { label: '是否转仓', value: 'transferFlag', component: 'select', multiSelect: true, options: BOOLEAN_OPTIONS },
  { label: '最早DW时间', value: 'beginEarliestDwTime', component: 'daterange', endKey: 'endEarliestDwTime' },
  { label: 'ETA', value: 'beginEta', component: 'daterange', endKey: 'endEta' },
  { label: 'ATA', value: 'beginAta', component: 'daterange', endKey: 'endAta' },
  { label: '实际到仓', value: 'beginActualArrivalTime', component: 'daterange', endKey: 'endActualArrivalTime' },
  { label: '入库完成', value: 'beginActualInboundTime', component: 'daterange', endKey: 'endActualInboundTime' },
  { label: '派送预约', value: 'beginDeliveryAppointmentTime', component: 'daterange', endKey: 'endDeliveryAppointmentTime' },
  { label: '实际出库', value: 'beginActualOutboundTime', component: 'daterange', endKey: 'endActualOutboundTime' },
  { label: '签收时间', value: 'beginSignedTime', component: 'daterange', endKey: 'endSignedTime' },
  { label: '创建时间', value: 'beginCreateTime', component: 'daterange', endKey: 'endCreateTime' }
];

const activeAdvancedCount = computed(() =>
  advancedFilters.value.filter(f => f.field && f.value !== null && f.value !== '' && !(Array.isArray(f.value) && f.value.length === 0)).length
);

function fieldMeta(field: AdvancedField | null) {
  return ADVANCED_FIELD_OPTIONS.find(o => o.value === field);
}

function resolveOptions(meta: AdvancedFieldOption | undefined): CommonType.Option[] {
  if (!meta?.options) return [];
  return typeof meta.options === 'function' ? meta.options() : meta.options;
}

function addAdvancedFilter() {
  advancedFilters.value.push({ id: Date.now(), field: null, value: null });
}

function removeAdvancedFilter(id: number) {
  advancedFilters.value = advancedFilters.value.filter(item => item.id !== id);
}

function handleAdvancedFieldChange(item: AdvancedFilter, field: AdvancedField | null) {
  item.field = field;
  item.value = null;
}

function applyAdvancedFilters() {
  ADVANCED_FIELD_OPTIONS.forEach(option => {
    (searchParams.value as Record<string, unknown>)[option.value as string] = undefined;
    if (option.endKey) (searchParams.value as Record<string, unknown>)[option.endKey as string] = undefined;
  });
  advancedFilters.value.forEach(item => {
    if (!item.field) return;
    const meta = fieldMeta(item.field);
    if (meta?.component === 'daterange') {
      const range = item.value as string[] | null;
      (searchParams.value as Record<string, unknown>)[item.field as string] = range?.[0] || undefined;
      if (meta.endKey) (searchParams.value as Record<string, unknown>)[meta.endKey as string] = range?.[1] || undefined;
    } else if (meta?.multiSelect && Array.isArray(item.value) && item.value.length) {
      (searchParams.value as Record<string, unknown>)[item.field as string] = (item.value as Array<string | number>)
        .map(v => String(v))
        .join(',');
    } else if (item.value !== null && item.value !== '') {
      (searchParams.value as Record<string, unknown>)[item.field as string] = item.value;
    }
  });
}

function handleAdvancedApply() {
  advancedModalVisible.value = false;
  handleSearch();
}

function isCargoHolding(row: Pick<Api.Oms.NewCargoOrder, 'holdFlag' | 'holdStatus'>) {
  return row.holdStatus === 'HOLDING' || Boolean(row.holdFlag);
}

function cargoHoldLabel(row: Pick<Api.Oms.NewCargoOrder, 'holdFlag' | 'holdStatus'>) {
  if (isCargoHolding(row)) return '暂扣';
  if (row.holdStatus === 'RELEASED') return '已放行';
  return '正常';
}

function cargoHoldTagType(row: Pick<Api.Oms.NewCargoOrder, 'holdFlag' | 'holdStatus'>) {
  if (isCargoHolding(row)) return 'warning';
  if (row.holdStatus === 'RELEASED') return 'success';
  return 'default';
}

function renderCargoOrderNo(row: Api.Oms.NewCargoOrder) {
  return h(
    'span',
    {
      class: 'relative inline-flex items-start pr-12px text-primary hover:underline',
      onClick: () => handleView(row.id)
    },
    [
      h('span', row.cargoOrderNo),
      isCargoHolding(row)
        ? h('span', {
            class: 'absolute -right-4px -top-9px flex h-15px min-w-15px items-center justify-center rounded-full bg-#d03050 px-3px text-10px text-white font-semibold leading-15px shadow-sm',
            title: '暂扣'
          }, '扣')
        : null
    ]
  );
}

// ===================== 表格 =====================

const { columns, columnChecks, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetCargoOrderList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { type: 'selection', align: 'center', width: 48, fixed: 'left' },
    {
      key: 'cargoOrderNo', title: '订单号', width: 160, fixed: 'left',
      render: row => renderCargoOrderNo(row)
    },
    { key: 'shipmentCodes',        title: '货件编码汇总', width: 160, ellipsis: { tooltip: true } },
    { key: 'poNos',                title: 'PO汇总',      width: 140, ellipsis: { tooltip: true } },
    { key: 'externalOrderNo',      title: '参考号',       width: 130, ellipsis: { tooltip: true } },
    { key: 'marks',                title: '唛头号',       width: 120, ellipsis: { tooltip: true } },
    { key: 'platformWarehouseCode', title: '仓库代码',   width: 120, ellipsis: { tooltip: true } },
    { key: 'groupCode',             title: '目的仓/分组', width: 130, ellipsis: { tooltip: true } },
    { key: 'platformName',          title: '平台',        width: 110, ellipsis: { tooltip: true } },
    {
      key: 'addressType', title: '地址类型', width: 100,
      render: row => {
        const map: Record<string, string> = { PLATFORM_WH: '平台仓', PRIVATE: '私仓', COMMERCIAL: '商业地址' };
        return map[row.addressType as string] ?? row.addressType ?? '--';
      }
    },
    { key: 'businessTypeName', title: '业务类型', width: 110, ellipsis: { tooltip: true } },
    {
      key: 'holdFlag', title: 'HOLD', width: 80,
      render: row => h(NTag, { type: cargoHoldTagType(row), size: 'small' }, () => cargoHoldLabel(row))
    },
    { key: 'customerName',         title: '客户',    width: 130, ellipsis: { tooltip: true } },
    {
      key: 'attachmentCount', title: '附件', width: 90,
      render: row => h(NButton, { text: true, type: 'primary', onClick: () => handleView(row.id, false, 'files') }, () => `附件 ${row.attachmentCount || 0}`)
    },
    {
      key: 'podAttachmentCount', title: 'POD', width: 80,
      render: row => row.podAttachmentCount ? h(NButton, { text: true, type: 'primary', onClick: () => handleView(row.id, false, 'files') }, () => `POD ${row.podAttachmentCount}`) : '--'
    },
    { key: 'containerNo',          title: '柜号',    width: 130, ellipsis: { tooltip: true } },
    {
      key: 'fulfillmentStatus', title: '履约状态', width: 120,
      render: row => {
        const opt = fulfillmentStatusOptions.value.find(o => o.value === row.fulfillmentStatus);
        return h(NTag, { type: 'info', size: 'small' }, () => opt?.label ?? row.fulfillmentStatus);
      }
    },
    { key: 'remark',              title: '备注',     width: 140, ellipsis: { tooltip: true } },
    { key: 'followUpRemark',      title: '跟进记录', width: 140, ellipsis: { tooltip: true } },
    { key: 'deliveryLfd',         title: '派送LFD',  width: 110 },
    { key: 'earliestDwTime',      title: 'DW时间',   width: 130 },
    {
      key: 'storageAge', title: '库龄(天)', width: 80, align: 'right',
      render: row => {
        const base = (row as any).actualInboundTime || (row as any).actualArrivalTime;
        if (!base) return '--';
        const days = Math.floor((Date.now() - new Date(base as string).getTime()) / 86400000);
        return String(days);
      }
    },
    { key: 'declaredCartonQty',   title: '预报箱数', width: 90, align: 'right' },
    { key: 'declaredWeight',      title: '预报重量', width: 90, align: 'right' },
    { key: 'declaredCbm',         title: '预报体积', width: 90, align: 'right' },
    { key: 'outboundBatchNo',     title: '出库单号', width: 140, ellipsis: { tooltip: true } },
    { key: 'inboundWarehouseName', title: '入库仓库', width: 120, ellipsis: { tooltip: true } },
    {
      key: 'transferFlag', title: '是否转仓', width: 80,
      render: row => row.transferFlag
        ? h(NTag, { type: 'warning', size: 'small' }, () => '转仓')
        : h(NTag, { type: 'default', size: 'small' }, () => '否')
    },
    { key: 'transferWarehouseCode', title: '转仓仓库', width: 110, ellipsis: { tooltip: true } },
    { key: 'eta',                  title: 'ETA',       width: 110 },
    { key: 'actualPickupTime',     title: '提柜时间',  width: 130 },
    { key: 'actualArrivalTime',    title: '到仓时间',  width: 130 },
    { key: 'devanningFinishTime',  title: '拆柜完成',  width: 130 },
    {
      key: 'billingStatus', title: '账单状态', width: 100,
      render: row => {
        const map: Record<string, 'warning' | 'success' | 'default'> = { UNBILLED: 'warning', BILLED: 'success', VOIDED: 'default' };
        const labels: Record<string, string> = { UNBILLED: '未出账单', BILLED: '已出账单', VOIDED: '已作废' };
        return h(NTag, { type: map[row.billingStatus] ?? 'default', size: 'small' }, () => labels[row.billingStatus] ?? row.billingStatus);
      }
    },
    {
      key: 'exceptionFlag', title: '异常', width: 80,
      render: row => row.exceptionFlag ? h(NTag, { type: 'error', size: 'small' }, () => `异常(${row.exceptionCount})`) : null
    },
    { key: 'customerServiceName',  title: '客服',    width: 100 },
    {
      key: 'address', title: '收货方地址', width: 220, ellipsis: { tooltip: true },
      render: row => {
        const addr = [(row as any).addressLine1, (row as any).addressLine2].filter(Boolean).join(' ');
        const loc = [(row as any).city, (row as any).state, (row as any).zipCode].filter(Boolean).join(' ');
        return [addr, loc].filter(Boolean).join(', ') || '--';
      }
    },
    { key: 'contactName',          title: '收货人',   width: 100, ellipsis: { tooltip: true } },
    { key: 'contactPhone',         title: '收货电话', width: 130, ellipsis: { tooltip: true } },
    { key: 'contactEmail',         title: '收货邮箱', width: 160, ellipsis: { tooltip: true } },
    { key: 'customerRemark',       title: '客户备注', width: 140, ellipsis: { tooltip: true } },
    { key: 'internalRemark',       title: '内部备注', width: 140, ellipsis: { tooltip: true } },
    { key: 'operationRemark',      title: '操作备注', width: 140, ellipsis: { tooltip: true } },
    { key: 'actualCartonQty',      title: '实际箱数', width: 90, align: 'right' },
    { key: 'actualWeight',         title: '实际重量', width: 90, align: 'right' },
    { key: 'actualCbm',            title: '实际体积', width: 90, align: 'right' },
    { key: 'actualPalletQty',      title: '实际板数', width: 90, align: 'right' },
    {
      key: 'actions', title: '操作', width: 80, fixed: 'right',
      render: row => {
        const options: any[] = [];
        if (hasAuth('oms:cargoOrder:query'))  options.push({ label: '查看详情', key: 'view' });
        if (hasAuth('oms:cargoOrder:query') || hasAuth('oms:cargoOrder:attachmentUpload')) {
          options.push({ label: '文件管理', key: 'files' });
        }
        const holding = isCargoHolding(row);
        if (!holding && hasAuth('oms:cargoOrder:hold')) options.push({ label: '货物暂扣', key: 'hold' });
        if (holding && hasAuth('oms:cargoOrder:releaseHold')) options.push({ label: '货物放行', key: 'releaseHold' });
        if (hasAuth('oms:cargoOrder:split')) options.push({ label: '拆单', key: 'split' });
        if (hasAuth('oms:cargoOrder:mergeBack')) options.push({ label: '回并原单', key: 'mergeBack' });
        if (hasAuth('oms:cargoOrder:modifyTransfer')) options.push({ label: '修改转仓', key: 'modifyTransfer' });
        if (row.transferFlag && hasAuth('oms:cargoOrder:cancelTransfer')) {
          options.push({ label: '取消转仓', key: 'cancelTransfer' });
        }
        if (hasAuth('oms:cargoOrder:query')) {
          options.push({ label: '异常跟进', key: 'exception' });
          options.push({ label: '查看轨迹', key: 'trace' });
          options.push({ label: '操作日志', key: 'log' });
        }
        if (hasAuth('oms:cargoOrder:remove')) {
          if (options.length) options.push({ type: 'divider', key: 'd1' });
          options.push({ label: '删除', key: 'delete' });
        }
        if (!options.length) return null;
        const onSelect = (key: string) => {
          if (key === 'view') handleView(row.id);
          else if (key === 'files') handleView(row.id, false, 'files');
          else if (key === 'trace') handleView(row.id, false, 'node-trace');
          else if (key === 'exception') handleView(row.id, false, 'exception');
          else if (key === 'log') window.$message?.info('操作日志功能开发中，敬请期待');
          else if (key === 'hold') quickHold(row);
          else if (key === 'releaseHold') quickRelease(row);
          else if (key === 'split') quickSplit(row, 'INTERNAL');
          else if (key === 'mergeBack') quickMergeBack(row);
          else if (key === 'modifyTransfer') modifyTransfer(row);
          else if (key === 'cancelTransfer') cancelTransfer(row);
          else if (key === 'delete') {
            window.$dialog?.warning({
              title: '确认删除',
              content: `确认删除货物订单 ${row.cargoOrderNo}？`,
              positiveText: '确认',
              negativeText: '取消',
              onPositiveClick: async () => {
                const { error } = await fetchDeleteCargoOrder(String(row.id));
                if (!error) { window.$message?.success('删除成功'); getData(); }
              }
            });
          }
        };
        return h(NDropdown, { trigger: 'click', options, onSelect },
          () => h(NButton, { size: 'small', secondary: true }, () => '更多'));
      }
    }
  ]
});

// ===================== 详情抽屉 =====================

const detailDrawerVisible = ref(false);
const viewingId = ref<CommonType.IdType>();
const detailStartEdit = ref(false);
const detailInitialTab = ref('basic');
const splitModalVisible = ref(false);
const splitLoading = ref(false);
const splitTarget = ref<Api.Oms.NewCargoOrder | null>(null);
const splitSelectedShipmentIds = ref<CommonType.IdType[]>([]);
const splitForm = ref({
  splitSource: 'INTERNAL' as 'CUSTOMER' | 'INTERNAL',
  reason: '',
  customerVisibleFlag: 0,
  childSuffix: '-1',
  childRemark: ''
});

function handleView(id: CommonType.IdType, startEdit = false, initialTab = 'basic') {
  viewingId.value = id;
  detailStartEdit.value = startEdit;
  detailInitialTab.value = initialTab;
  detailDrawerVisible.value = true;
}

function quickHold(row: Api.Oms.NewCargoOrder) {
  window.$dialog?.warning({
    title: '货物暂扣',
    content: `确认暂扣 ${row.cargoOrderNo}？默认暂扣类型为 OPERATION_HOLD。`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchHoldCargoOrder(row.id, { holdType: 'OPERATION_HOLD', holdReason: '运营暂扣' });
      if (!error) { window.$message?.success('已暂扣'); getData(); }
    }
  });
}

function quickRelease(row: Api.Oms.NewCargoOrder) {
  window.$dialog?.success({
    title: '货物放行',
    content: `确认放行 ${row.cargoOrderNo}？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchReleaseCargoOrderHold(row.id, { releaseReason: '运营放行' });
      if (!error) { window.$message?.success('已放行'); getData(); }
    }
  });
}

async function quickSplit(row: Api.Oms.NewCargoOrder, splitSource: 'CUSTOMER' | 'INTERNAL') {
  splitLoading.value = true;
  const { data: detail } = await fetchGetCargoOrderDetail(row.id);
  splitLoading.value = false;
  if (!detail) return;
  splitTarget.value = detail;
  splitSelectedShipmentIds.value = [];
  splitForm.value = {
    splitSource,
    reason: '',
    customerVisibleFlag: splitSource === 'CUSTOMER' ? 1 : 0,
    childSuffix: '-1',
    childRemark: ''
  };
  splitModalVisible.value = true;
}

async function submitSplit() {
  if (!splitTarget.value) return;
  if (!splitSelectedShipmentIds.value.length) {
    window.$message?.warning('请选择要拆出去的货件');
    return;
  }
  if (!splitForm.value.reason.trim()) {
    window.$message?.warning('请填写拆单原因');
    return;
  }
  const selectedShipments = (splitTarget.value.shipments || []).filter(item =>
    splitSelectedShipmentIds.value.includes(item.id as CommonType.IdType)
  );
  const sumNumber = (values: Array<number | null | undefined>) => values.reduce<number>((sum, value) => sum + Number(value || 0), 0);
  const { error } = await fetchSplitCargoOrder(splitTarget.value.id, {
    splitSource: splitForm.value.splitSource,
    customerVisibleFlag: splitForm.value.customerVisibleFlag,
    splitRequestedBy: 'OPERATION',
    internalSplitReason: splitForm.value.splitSource === 'INTERNAL' ? splitForm.value.reason : null,
    customerSplitReason: splitForm.value.splitSource === 'CUSTOMER' ? splitForm.value.reason : null,
    splitMode: 'BY_SHIPMENT',
    remark: splitForm.value.childRemark,
    children: [
      {
        cargoOrderNoSuffix: splitForm.value.childSuffix || '-1',
        shipmentIds: splitSelectedShipmentIds.value,
        cartonQty: sumNumber(selectedShipments.map(item => item.cartonQty)),
        weight: sumNumber(selectedShipments.map(item => item.weight)),
        cbm: sumNumber(selectedShipments.map(item => item.cbm)),
        customerVisibleFlag: splitForm.value.customerVisibleFlag,
        remark: splitForm.value.childRemark
      }
    ]
  });
  if (error) return;
  window.$message?.success('拆单成功');
  splitModalVisible.value = false;
  getData();
}

function quickMergeBack(row: Api.Oms.NewCargoOrder) {
  const rootId = row.rootOrderId || row.parentOrderId || row.id;
  window.$dialog?.warning({
    title: '回并原单',
    content: `确认将 ${row.cargoOrderNo} 回并原单？系统会校验出库、POD、账单和 HOLD 状态。`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchMergeBackCargoOrder({
        rootCargoOrderId: rootId,
        childCargoOrderIds: [row.id],
        mergeBackReason: '业务调整回并原单',
        mergeBackType: row.splitSource === 'CUSTOMER' ? 'CUSTOMER_SPLIT_MERGE_BACK' : 'INTERNAL_SPLIT_MERGE_BACK'
      });
      if (!error) { window.$message?.success('已回并'); getData(); }
    }
  });
}

function handleImport() {
  window.$message?.info('请在海柜订单详情的「关联货物订单」Tab 中使用导入功能；或联系管理员配置独立导入入口。');
}

async function loadAdvancedFilterOptions() {
  const [channelRes, businessRes, platformRes, warehouseRes] = await Promise.all([
    fetchGetChannelList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetWarehouseList({ pageNum: 1, pageSize: 500, status: '0', params: {} })
  ]);
  channelOptions.value = (channelRes.data?.rows || []).map(item => ({ label: item.channelName, value: item.id }));
  businessTypeOptions.value = (businessRes.data?.rows || []).map(item => ({
    label: item.businessTypeName,
    value: item.id
  }));
  platformOptions.value = (platformRes.data?.rows || []).map(item => ({
    label: item.nameEn || item.code,
    value: item.id
  }));
  warehouseOptions.value = (warehouseRes.data?.rows || []).map(item => ({
    label: item.warehouseName,
    value: item.id
  }));
}

onMounted(() => {
  loadStatusCount();
  loadAdvancedFilterOptions();
});
onActivated(() => {
  getData();
  loadStatusCount();
});
getData();
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">

    <!-- 搜索栏 -->
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">筛选条件</div>
          <div class="mt-4px text-12px text-#6b7280">生命周期用下方标签切换，可按需追加高级搜索字段</div>
        </div>
        <NSpace :size="8">
          <NButton quaternary @click="searchCollapsed = !searchCollapsed">
            {{ searchCollapsed ? '展开筛选' : '收起筛选' }}
          </NButton>
          <NButton @click="advancedModalVisible = true">
            高级搜索
            <NTag v-if="activeAdvancedCount > 0" type="primary" size="small" :bordered="false" class="ml-4px">
              {{ activeAdvancedCount }}
            </NTag>
          </NButton>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton @click="handleReset">重置</NButton>
        </NSpace>
      </div>

      <div v-show="!searchCollapsed" class="mt-14px">
        <NForm inline label-placement="left" :show-feedback="false">
          <NFormItem label="单号搜索">
            <NInputGroup class="w-320px">
              <NSelect :to="POPUP_TO_BODY"
                v-model:value="orderNoField"
                :options="ORDER_NO_FIELD_OPTIONS"
                class="w-120px"
              />
              <NInput
                v-model:value="orderNoKeyword"
                clearable
                :placeholder="`请输入${ORDER_NO_FIELD_OPTIONS.find(item => item.value === orderNoField)?.label || ''}`"
                @keyup.enter="handleSearch"
              />
            </NInputGroup>
          </NFormItem>
          <NFormItem label="客户">
            <NInput v-model:value="searchParams.customerName" clearable placeholder="客户名称" class="w-150px" />
          </NFormItem>
          <NFormItem label="入库仓">
            <NInput
              v-model:value="(searchParams as any).inboundWarehouseName"
              clearable
              placeholder="入库仓名称"
              class="w-150px"
            />
          </NFormItem>
          <NFormItem label="收货方">
            <NInput
              v-model:value="(searchParams as any).consigneeName"
              clearable
              placeholder="收货方名称"
              class="w-150px"
            />
          </NFormItem>
        </NForm>
      </div>
    </NCard>

    <!-- 主内容区 -->
    <NCard
      :bordered="false"
      size="small"
      title="货物订单"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header-extra>
        <NSpace :size="8">
          <NButton v-if="hasAuth('oms:cargoOrder:import')" size="small" @click="handleImport">导入</NButton>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :loading="loading"
            :show-add="false"
            :show-delete="false"
            :show-export="false"
            @refresh="getData"
          />
        </NSpace>
      </template>

      <div class="flex min-h-0 flex-1 flex-col gap-12px overflow-hidden">
        <!-- 状态 Tab -->
        <div class="mb-12px flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
          <div
            v-for="tab in lifecycleTabs"
            :key="tab.value"
            class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
            :class="
              activeStatus === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'
            "
            @click="handleStatusChange(tab.value)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold leading-14px"
              :class="
                activeStatus === tab.value
                  ? 'bg-white/25 text-white'
                  : tab.count > 0
                    ? 'bg-#ef4444 text-white'
                    : 'bg-#d0d3d9 text-#909399'
              "
            >
              {{ tab.count }}
            </span>
          </div>
        </div>

        <!-- 数据表格 -->
        <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
          <DataTable
            v-model:checked-row-keys="checkedRowKeys"
            :loading="loading"
            :columns="columns"
            :data="data"
            :pagination="mobilePagination"
            :flex-height="!appStore.isMobile"
            :scroll-x="scrollX"
            :row-key="(row: Api.Oms.NewCargoOrder) => row.id"
            remote
            class="h-full min-h-280px sm:min-h-0"
          />
        </div>
      </div>
    </NCard>

    <!-- 高级筛选弹窗 -->
    <NModal
      v-model:show="advancedModalVisible"
      title="高级筛选"
      preset="card"
      style="width: 780px; max-width: 96vw"
    >
      <div>
        <div class="mb-12px flex items-center justify-between">
          <span class="text-12px text-#6b7280">可组合多个字段进行精确搜索，选择框支持多选</span>
          <NButton size="small" type="primary" secondary @click="addAdvancedFilter">+ 添加字段</NButton>
        </div>
        <NSpace v-if="advancedFilters.length" vertical :size="10">
          <div
            v-for="item in advancedFilters"
            :key="item.id"
            class="flex flex-wrap items-center gap-8px rounded-6px bg-#f8fafc px-12px py-8px"
          >
            <NSelect :to="POPUP_TO_BODY"
              :value="item.field"
              :options="ADVANCED_FIELD_OPTIONS"
              filterable
              clearable
              placeholder="选择字段"
              class="w-160px"
              @update:value="value => handleAdvancedFieldChange(item, value as AdvancedField | null)"
            />
            <span class="min-w-28px text-center text-12px text-#6b7280">
              {{ fieldMeta(item.field)?.component === 'daterange' ? '范围' : fieldMeta(item.field)?.multiSelect ? '包含' : fieldMeta(item.field)?.component === 'select' ? '等于' : '包含' }}
            </span>
            <NDatePicker :to="POPUP_TO_BODY"
              v-if="fieldMeta(item.field)?.component === 'daterange'"
              :formatted-value="item.value as [string, string] | null"
              type="daterange"
              clearable
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              class="w-280px"
              @update:formatted-value="v => { item.value = v as string[] | null }"
            />
            <NSelect :to="POPUP_TO_BODY"
              v-else-if="fieldMeta(item.field)?.component === 'select'"
              :value="item.value as string | string[] | null"
              :options="resolveOptions(fieldMeta(item.field))"
              :multiple="fieldMeta(item.field)?.multiSelect"
              filterable
              clearable
              placeholder="请选择"
              class="w-240px"
              @update:value="v => { item.value = v as string | string[] | null }"
            />
            <NInput
              v-else
              v-model:value="(item as any).value"
              clearable
              placeholder="请输入搜索值"
              class="w-240px"
            />
            <NButton quaternary type="error" size="small" @click="removeAdvancedFilter(item.id)">删除</NButton>
          </div>
        </NSpace>
        <NEmpty v-else size="small" description="点击「添加字段」开始组合筛选" class="py-24px" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="advancedFilters = []">清空条件</NButton>
          <NButton type="primary" @click="handleAdvancedApply">确认查询</NButton>
        </div>
      </template>
    </NModal>

    <NModal
      v-model:show="splitModalVisible"
      title="拆单"
      preset="card"
      style="width: 760px; max-width: 96vw"
      :mask-closable="false"
    >
      <NSpin :show="splitLoading">
        <NForm :model="splitForm" label-placement="left" :label-width="110">
          <NAlert type="info" class="mb-12px">
            原单会保留为主单，只把你勾选的货件拆到一个子单：{{ splitTarget?.cargoOrderNo }}{{ splitForm.childSuffix || '-1' }}
          </NAlert>
          <NGrid :cols="2" :x-gap="12">
            <NFormItem label="拆单类型">
              <NRadioGroup v-model:value="splitForm.splitSource">
                <NSpace>
                  <NRadio value="CUSTOMER" @click="splitForm.customerVisibleFlag = 1">客户拆单</NRadio>
                  <NRadio value="INTERNAL" @click="splitForm.customerVisibleFlag = 0">自行拆单</NRadio>
                </NSpace>
              </NRadioGroup>
            </NFormItem>
            <NFormItem label="子单后缀">
              <NInput v-model:value="splitForm.childSuffix" placeholder="-1" />
            </NFormItem>
          </NGrid>
          <NFormItem label="客户可见">
            <NSwitch v-model:value="splitForm.customerVisibleFlag" :checked-value="1" :unchecked-value="0" />
          </NFormItem>
          <NFormItem label="拆单原因">
            <NInput v-model:value="splitForm.reason" type="textarea" :rows="3" placeholder="请输入拆单原因" />
          </NFormItem>
          <NFormItem label="子单备注">
            <NInput v-model:value="splitForm.childRemark" type="textarea" :rows="2" placeholder="可选" />
          </NFormItem>
          <NFormItem label="选择货件">
            <NCheckboxGroup v-model:value="splitSelectedShipmentIds">
              <NSpace vertical class="w-full">
                <div
                  v-for="shipment in splitTarget?.shipments || []"
                  :key="shipment.id ?? shipment.shipmentNo ?? ''"
                  class="rounded-6px border border-#e5e7eb px-10px py-8px"
                >
                  <NCheckbox :value="shipment.id ?? shipment.shipmentNo ?? ''">
                    <div class="flex flex-wrap gap-x-16px gap-y-4px text-13px">
                      <span class="font-medium">{{ shipment.shipmentNo }}</span>
                      <span>PO：{{ shipment.poNo || '--' }}</span>
                      <span>箱数：{{ shipment.cartonQty ?? '--' }}</span>
                      <span>重量：{{ shipment.weight ?? '--' }}</span>
                      <span>体积：{{ shipment.cbm ?? '--' }}</span>
                      <span>DW：{{ shipment.dwTime || '--' }}</span>
                    </div>
                  </NCheckbox>
                </div>
              </NSpace>
            </NCheckboxGroup>
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="splitModalVisible = false">取消</NButton>
          <NButton type="primary" :loading="splitLoading" @click="submitSplit">确认拆单</NButton>
        </div>
      </template>
    </NModal>

    <!-- 详情抽屉 -->
    <CargoOrderDetailDrawer
      v-model:visible="detailDrawerVisible"
      :order-id="viewingId"
      :start-edit="detailStartEdit"
      :initial-tab="detailInitialTab"
      @refresh="getData"
    />
  </div>
</template>
