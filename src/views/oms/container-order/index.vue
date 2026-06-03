<script setup lang="tsx">
import { computed, onActivated, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NDatePicker, NDropdown, NModal, NSelect, NSpace, NTag } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import {
  fetchBatchDeleteContainerOrder,
  fetchGetContainerOrderList,
  fetchGetContainerOrderStatusCount,
  fetchUpdateContainerOrderStatus
} from '@/service/api/oms/container-order';
import { fetchGetBusinessTypeList, fetchGetChannelList, fetchGetShippingLineList, fetchGetWarehouseList } from '@/service/api/base';
import ContainerOrderOperateDrawer from './modules/container-order-operate-drawer.vue';
import ContainerOrderDetailDrawer from './modules/container-order-detail-drawer.vue';

defineOptions({ name: 'OmsContainerOrder' });

const appStore = useAppStore();
const router = useRouter();
const { hasAuth } = useAuth();
const { download } = useDownload();
const POPUP_TO_BODY = false;

const CONTAINER_STATUS_OPTIONS = [
  { label: '草稿', value: 'DRAFT', type: 'default' },
  { label: '待受理', value: 'PENDING_ACCEPT', type: 'warning' },
  { label: '在途', value: 'IN_TRANSIT', type: 'info' },
  { label: '已到港', value: 'ARRIVED_PORT', type: 'info' },
  { label: 'HOLD中', value: 'HOLDING', type: 'error' },
  { label: '查验中', value: 'EXAMINING', type: 'warning' },
  { label: '已可提', value: 'AVAILABLE_FOR_PICKUP', type: 'success' },
  { label: '已预约提柜', value: 'PICKUP_APPOINTED', type: 'info' },
  { label: '已提柜', value: 'PICKED_UP', type: 'success' },
  { label: '已到仓', value: 'ARRIVED_WAREHOUSE', type: 'success' },
  { label: '拆柜中', value: 'DEVANNING', type: 'warning' },
  { label: '拆柜完成', value: 'DEVANNED', type: 'success' },
  { label: '已还柜', value: 'EMPTY_RETURNED', type: 'success' },
  { label: '已完成', value: 'COMPLETED', type: 'success' },
  { label: '已取消', value: 'CANCELLED', type: 'default' }
];

const RELEASE_STATUS_OPTIONS = [
  { label: '\u65e0', value: 'NONE' },
  { label: 'HOLD', value: 'HOLD' },
  { label: 'release', value: 'RELEASE' }
];

const EXAM_STATUS_OPTIONS = [
  { label: '\u65e0', value: 'NONE' },
  { label: '\u67e5\u9a8c\u4e2d', value: 'EXAMINING' },
  { label: '\u67e5\u9a8c\u5b8c\u6210', value: 'EXAMINED' }
];

const RELEASE_STATUS_LABEL: Record<string, string> = {
  NONE: '\u65e0',
  HOLD: 'HOLD',
  RELEASE: 'release',
  UNKNOWN: '\u65e0',
  HOLDING: 'HOLD',
  RELEASED: 'release'
};

const EXAM_STATUS_LABEL: Record<string, string> = {
  NONE: '\u65e0',
  EXAMINING: '\u67e5\u9a8c\u4e2d',
  EXAMINED: '\u67e5\u9a8c\u5b8c\u6210'
};

function releaseStatusLabel(value?: string | null) {
  if (!value) return '\u65e0';
  return RELEASE_STATUS_LABEL[value] || value;
}

function releaseStatusTagType(value?: string | null): 'default' | 'success' | 'error' {
  if (value === 'RELEASE' || value === 'RELEASED') return 'success';
  if (value === 'HOLD' || value === 'HOLDING') return 'error';
  return 'default';
}

function examStatusLabel(value?: string | null) {
  if (!value || value === 'NONE') return '\u65e0';
  return EXAM_STATUS_LABEL[value] || value;
}

function examStatusTagType(value?: string | null): 'default' | 'warning' | 'success' {
  if (value === 'EXAMINING') return 'warning';
  if (value === 'EXAMINED') return 'success';
  return 'default';
}

const ORDER_SOURCE_LABELS: Record<string, string> = {
  SELF: '自建单',
  MANUAL: '自建单',
  IMPORT: '自建单',
  API: 'API下单',
  PORTAL: '客户门户下单'
};

const statusMap = Object.fromEntries(CONTAINER_STATUS_OPTIONS.map(item => [item.value, item]));
const activeLifecycle = ref('');
const channelNameMap = ref<Record<string, string>>({});
const channelOptions = computed(() =>
  Object.entries(channelNameMap.value).map(([id, name]) => ({ label: name, value: Number(id) }))
);
const businessTypeOptions = ref<CommonType.Option[]>([]);
const warehouseOptions = ref<CommonType.Option[]>([]);
const shippingLineOptions = ref<CommonType.Option[]>([]);

const { options: devanningMethodOptions } = useDict('oms_devanning_method');
const { options: loadingTypeOptions } = useDict('oms_loading_type');
const { options: holdTypeOptions } = useDict('oms_container_hold_type');
const { options: examTypeOptions } = useDict('oms_container_exam_type');

const HOLD_TYPE_FALLBACK = [
  { label: '海关Hold', value: 'CUSTOMS' },
  { label: '船公司Hold', value: 'CARRIER' },
  { label: '码头Hold', value: 'TERMINAL' },
  { label: '费用Hold', value: 'FEE' }
];
const EXAM_TYPE_FALLBACK = [
  { label: 'X-Ray', value: 'X_RAY' },
  { label: 'Tailgate', value: 'TAILGATE' },
  { label: 'Intensive', value: 'INTENSIVE' },
  { label: 'CES', value: 'CES' }
];
const DEVANNING_METHOD_FALLBACK = [
  { label: '人工拆柜', value: 'MANUAL' },
  { label: '叉车拆柜', value: 'FORKLIFT' },
  { label: '流水线拆柜', value: 'CONVEYOR' },
  { label: '混合拆柜', value: 'MIXED' }
];
const LOADING_TYPE_FILTER_OPTIONS = [
  { label: '散装', value: 'FLOOR' },
  { label: '卡板', value: 'PALLET' },
  { label: '混装', value: 'MIXED' }
];

const holdTypeFilterOptions = computed(() =>
  holdTypeOptions.value.length ? holdTypeOptions.value : HOLD_TYPE_FALLBACK
);
const examTypeFilterOptions = computed(() => (examTypeOptions.value.length ? examTypeOptions.value : EXAM_TYPE_FALLBACK));
const devanningMethodFilterOptions = computed(() =>
  devanningMethodOptions.value.length ? devanningMethodOptions.value : DEVANNING_METHOD_FALLBACK
);
const loadingTypeFilterOptions = computed(() =>
  loadingTypeOptions.value.length ? loadingTypeOptions.value : LOADING_TYPE_FILTER_OPTIONS
);
const containerStatusFilterOptions = computed(() =>
  CONTAINER_STATUS_OPTIONS.filter(item => item.value !== 'DRAFT').map(item => ({
    label: item.label,
    value: item.value
  }))
);
const statusCountMap = ref<Record<string, number>>({});
const searchCollapsed = ref(false);
const advancedVisible = ref(false);

const activeAdvancedCount = computed(() =>
  advancedFilters.value.filter(f => f.field && f.value !== null && f.value !== '' && !(Array.isArray(f.value) && f.value.length === 0)).length
);

type AdvancedField = keyof Api.Oms.ContainerOrderSearchParams;

type AdvancedFilter = {
  id: number;
  field: AdvancedField | null;
  value: string | number | string[] | null;
};

const advancedFilters = ref<AdvancedFilter[]>([]);

const BOOLEAN_OPTIONS = [
  { label: '是', value: 1 },
  { label: '否', value: 0 }
];

const ORDER_SOURCE_OPTIONS = [
  { label: '自建单', value: 'SELF' },
  { label: 'API下单', value: 'API' },
  { label: '客户门户下单', value: 'PORTAL' }
];

const CONTAINER_TYPE_OPTIONS = [
  { label: '20GP', value: '20GP' },
  { label: '40GP', value: '40GP' },
  { label: '40HQ', value: '40HQ' },
  { label: '45HQ', value: '45HQ' }
];

const DEVANNING_METHOD_LABELS: Record<string, string> = {
  MANUAL: '人工拆柜',
  FORKLIFT: '叉车拆柜',
  CONVEYOR: '流水线拆柜',
  MIXED: '混合拆柜'
};

const LOADING_TYPE_LABELS: Record<string, string> = {
  FLOOR: '散装',
  PALLET: '卡板',
  MIXED: '混装'
};

type AdvancedFieldOption = {
  label: string;
  value: AdvancedField;
  component?: 'select' | 'daterange';
  options?: CommonType.Option[] | (() => CommonType.Option[]);
  multiSelect?: boolean;
  endKey?: keyof Api.Oms.ContainerOrderSearchParams;
};

const ADVANCED_FIELD_OPTIONS: AdvancedFieldOption[] = [
  { label: '工作单号', value: 'containerOrderNo' },
  { label: '柜号', value: 'containerNo' },
  { label: '客户', value: 'customerName' },
  { label: '渠道', value: 'channelId', component: 'select', multiSelect: true, options: () => channelOptions.value },
  { label: '业务类型', value: 'businessTypeId', component: 'select', multiSelect: true, options: () => businessTypeOptions.value },
  { label: '入库仓库', value: 'warehouseId', component: 'select', multiSelect: true, options: () => warehouseOptions.value },
  { label: '船公司', value: 'shippingLineId', component: 'select', multiSelect: true, options: () => shippingLineOptions.value },
  { label: '海柜状态', value: 'containerStatus', component: 'select', multiSelect: true, options: () => containerStatusFilterOptions.value },
  { label: '负责人', value: 'ownerUserName' },
  { label: '客服', value: 'customerServiceName' },
  { label: '订单来源', value: 'orderSource', component: 'select', multiSelect: true, options: ORDER_SOURCE_OPTIONS },
  { label: '柜型', value: 'containerType', component: 'select', multiSelect: true, options: CONTAINER_TYPE_OPTIONS },
  { label: '封条号', value: 'sealNo' },
  { label: '船名', value: 'vesselName' },
  { label: '航次', value: 'voyageNo' },
  { label: '航线代码', value: 'routeCode' },
  { label: 'MBL', value: 'mblNo' },
  { label: 'HBL', value: 'hblNo' },
  { label: '卸货港', value: 'dischargePortName' },
  { label: '码头', value: 'terminalName' },
  { label: '码头释放', value: 'terminalReleaseStatus', component: 'select', multiSelect: true, options: RELEASE_STATUS_OPTIONS },
  { label: '查验状态', value: 'examStatus', component: 'select', multiSelect: true, options: EXAM_STATUS_OPTIONS },
  { label: '查验类型', value: 'examType', component: 'select', multiSelect: true, options: () => examTypeFilterOptions.value },
  { label: '查验备注', value: 'examRemark' },
  { label: '提柜供应商', value: 'drayageVendorName' },
  { label: '提柜预约号', value: 'pickupAppointmentNo' },
  { label: '提柜备注', value: 'pickupRemark' },
  { label: '海柜Location', value: 'containerLocation' },
  { label: '到仓备注', value: 'arrivalRemark' },
  { label: '拆柜单号', value: 'devanningNo' },
  { label: '拆柜方式', value: 'devanningMethod', component: 'select', multiSelect: true, options: () => devanningMethodFilterOptions.value },
  { label: '装载类型', value: 'loadingType', component: 'select', multiSelect: true, options: () => loadingTypeFilterOptions.value },
  { label: '拆柜备注', value: 'devanningRemark' },
  { label: '还柜地点', value: 'emptyReturnLocation' },
  { label: '海柜异常', value: 'containerExceptionFlag', component: 'select', multiSelect: true, options: BOOLEAN_OPTIONS },
  { label: '海柜异常类型', value: 'containerExceptionType' },
  { label: '下游异常', value: 'downstreamExceptionFlag', component: 'select', multiSelect: true, options: BOOLEAN_OPTIONS },
  { label: 'ETA', value: 'beginEta', component: 'daterange', endKey: 'endEta' },
  { label: 'ATA', value: 'beginAta', component: 'daterange', endKey: 'endAta' },
  { label: '提柜LFD', value: 'beginPickupLfd', component: 'daterange', endKey: 'endPickupLfd' },
  { label: '还柜LFD', value: 'beginEmptyReturnLfd', component: 'daterange', endKey: 'endEmptyReturnLfd' },
  { label: '实际提柜', value: 'beginActualPickupTime', component: 'daterange', endKey: 'endActualPickupTime' },
  { label: '预计到仓', value: 'beginExpectedArrivalTime', component: 'daterange', endKey: 'endExpectedArrivalTime' },
  { label: '实际到仓', value: 'beginActualArrivalTime', component: 'daterange', endKey: 'endActualArrivalTime' },
  { label: '预计拆柜', value: 'beginExpectedDevanningTime', component: 'daterange', endKey: 'endExpectedDevanningTime' },
  { label: '开始拆柜', value: 'beginDevanningStartTime', component: 'daterange', endKey: 'endDevanningStartTime' },
  { label: '拆柜完成', value: 'beginDevanningFinishTime', component: 'daterange', endKey: 'endDevanningFinishTime' },
  { label: '还柜时间', value: 'beginEmptyReturnTime', component: 'daterange', endKey: 'endEmptyReturnTime' }
];

const lifecycleTabs = computed(() => {
  const total = Object.values(statusCountMap.value).reduce((sum, n) => sum + n, 0);
  return [
    { label: '全部', value: '', type: 'default', count: total },
    ...CONTAINER_STATUS_OPTIONS.filter(item => item.value !== 'DRAFT').map(item => ({
      ...item,
      count: statusCountMap.value[item.value] || 0
    }))
  ];
});

const searchParams = ref<Api.Oms.ContainerOrderSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  containerOrderNo: null,
  containerNo: null,
  customerName: null,
  warehouseId: null,
  shippingLineId: null,
  containerStatus: null,
  terminalReleaseStatus: null,
  examStatus: null,
  containerExceptionFlag: null,
  downstreamExceptionFlag: null,
  params: {}
});

const detailVisible = ref(false);
const detailId = ref<CommonType.IdType | null>(null);
const detailInitialTab = ref('basic');

function dateOnly(value?: string | null) {
  return value ? String(value).slice(0, 10) : '-';
}

function getChannelName(row: Api.Oms.ContainerOrder) {
  return row.channelName || (row.channelId ? channelNameMap.value[String(row.channelId)] : '') || '-';
}

async function loadBaseNameMaps() {
  const [channelRes, businessRes, warehouseRes, shippingLineRes] = await Promise.all([
    fetchGetChannelList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetWarehouseList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetShippingLineList({ pageNum: 1, pageSize: 500, status: '0', params: {} })
  ]);
  channelNameMap.value = Object.fromEntries((channelRes.data?.rows || []).map(item => [String(item.id), item.channelName]));
  businessTypeOptions.value = (businessRes.data?.rows || []).map(item => ({
    label: item.businessTypeName,
    value: item.id
  }));
  warehouseOptions.value = (warehouseRes.data?.rows || []).map(item => ({
    label: item.warehouseName,
    value: item.id
  }));
  shippingLineOptions.value = (shippingLineRes.data?.rows || []).map(item => ({
    label: item.shippingLineName || item.shippingLineCode || item.nameAbbr || item.nameEn || item.code,
    value: item.id
  }));
}

function fieldMeta(field: AdvancedField | null) {
  return ADVANCED_FIELD_OPTIONS.find(item => item.value === field);
}

function resolveOptions(meta: AdvancedFieldOption | undefined): CommonType.Option[] {
  if (!meta?.options) return [];
  return typeof meta.options === 'function' ? meta.options() : meta.options;
}

function createBlankSearchParams(): Api.Oms.ContainerOrderSearchParams {
  return {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    containerOrderNo: null,
    containerNo: null,
    customerName: null,
    keyword: null,
    warehouseId: null,
    shippingLineId: null,
    containerStatus: activeLifecycle.value || null,
    terminalReleaseStatus: null,
    examStatus: null,
    containerExceptionFlag: null,
    downstreamExceptionFlag: null,
    params: {}
  };
}

function applyAdvancedFilters(params: Api.Oms.ContainerOrderSearchParams) {
  const basicFields = new Set(['containerOrderNo', 'containerNo', 'customerName', 'terminalReleaseStatus', 'examStatus', 'containerExceptionFlag', 'keyword', 'warehouseId', 'shippingLineId', 'containerStatus', 'downstreamExceptionFlag']);
  ADVANCED_FIELD_OPTIONS.forEach(option => {
    if (basicFields.has(option.value)) return;
    (params as Record<string, unknown>)[option.value] = null;
    if (option.endKey) (params as Record<string, unknown>)[option.endKey as string] = null;
  });
  advancedFilters.value.forEach(item => {
    if (!item.field) return;
    const meta = fieldMeta(item.field);
    if (meta?.component === 'daterange') {
      const range = item.value as string[] | null;
      (params as Record<string, unknown>)[item.field] = range?.[0] || null;
      if (meta.endKey) (params as Record<string, unknown>)[meta.endKey as string] = range?.[1] || null;
    } else if (meta?.multiSelect && Array.isArray(item.value) && item.value.length) {
      (params as Record<string, unknown>)[item.field] = (item.value as Array<string | number>).map(v => String(v)).join(',');
    } else if (item.value !== null && item.value !== '') {
      (params as Record<string, unknown>)[item.field] = item.value;
    }
  });
}

async function loadStatusCount() {
  const params = { ...searchParams.value, containerStatus: null };
  const { data: countData } = await fetchGetContainerOrderStatusCount(params);
  statusCountMap.value = countData || {};
}

function addAdvancedFilter() {
  advancedFilters.value.push({ id: Date.now(), field: null, value: null });
}

function openAdvancedModal() {
  advancedVisible.value = true;
}

function handleAdvancedApply() {
  advancedVisible.value = false;
  handleSearch();
}

function removeAdvancedFilter(id: number) {
  advancedFilters.value = advancedFilters.value.filter(item => item.id !== id);
}

function handleAdvancedFieldChange(item: AdvancedFilter, field: AdvancedField | null) {
  item.field = field;
  item.value = null;
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetContainerOrderList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48, fixed: 'left' },
      { key: 'containerOrderNo', title: '工作单号', align: 'center', width: 130, fixed: 'left' },
      {
        key: 'orderSource',
        title: '订单来源',
        align: 'center',
        width: 100,
        // @ts-ignore
        render: row =>
          // @ts-ignore
          ({ SELF: '自建单', MANUAL: '自建单', IMPORT: '自建单', API: 'API下单', PORTAL: '客户门户下单' })[
            row.orderSource || ''
          ] || row.orderSource || '-'
      },
      { key: 'companyName', title: '主体', align: 'center', width: 150, ellipsis: { tooltip: true } },
      {
        key: 'containerNo',
        title: '柜号',
        align: 'center',
        width: 130,
        render: row => (
          <div class="flex flex-col items-center gap-2px">
            {row.doAttachmentCount ? (
              <NTag type="primary" size="small" bordered={false}>
                DO
              </NTag>
            ) : null}
            <span>{row.containerNo || '-'}</span>
          </div>
        )
      },
      { key: 'customerName', title: '客户', align: 'center', width: 160, ellipsis: { tooltip: true } },
      {
        key: 'channelName',
        title: '渠道',
        align: 'center',
        width: 120,
        ellipsis: { tooltip: true },
        render: row => getChannelName(row)
      },
      { key: 'ownerUserName', title: '负责人', align: 'center', width: 110 },
      { key: 'customerServiceName', title: '客服', align: 'center', width: 110 },
      { key: 'shippingLineName', title: '船公司', align: 'center', width: 120 },
      { key: 'containerType', title: '柜型', align: 'center', width: 80 },
      { key: 'sealNo', title: '封条号', align: 'center', width: 120 },
      { key: 'vesselName', title: '船名', align: 'center', width: 130, ellipsis: { tooltip: true } },
      { key: 'voyageNo', title: '航次', align: 'center', width: 100 },
      { key: 'mblNo', title: 'MBL', align: 'center', width: 130, ellipsis: { tooltip: true } },
      { key: 'hblNo', title: 'HBL', align: 'center', width: 130, ellipsis: { tooltip: true } },
      { key: 'dischargePortName', title: '卸货港', align: 'center', width: 120 },
      { key: 'terminalName', title: '码头', align: 'center', width: 140, ellipsis: { tooltip: true } },
      { key: 'eta', title: 'ETA', align: 'center', width: 130 },
      { key: 'ata', title: 'ATA', align: 'center', width: 130 },
      {
        key: 'containerStatus',
        title: '海柜状态',
        align: 'center',
        width: 120,
        render: row => {
          const status = statusMap[row.containerStatus as keyof typeof statusMap];
          return (
            <NTag type={(status?.type || 'default') as any} size="small">
              {status?.label || row.containerStatus}
            </NTag>
          );
        }
      },
      {
        key: 'terminalReleaseStatus',
        title: '码头释放',
        align: 'center',
        width: 110,
        render: row => (
          <NTag type={releaseStatusTagType(row.terminalReleaseStatus)} size="small">
            {releaseStatusLabel(row.terminalReleaseStatus)}
          </NTag>
        )
      },
      {
        key: 'examStatus',
        title: '查验状态',
        align: 'center',
        width: 110,
        render: row => (
          <NTag type={examStatusTagType(row.examStatus || (row.examFlag ? 'EXAMINING' : 'NONE'))} size="small">
            {examStatusLabel(row.examStatus || (row.examFlag ? 'EXAMINING' : 'NONE'))}
          </NTag>
        )
      },
      { key: 'warehouseName', title: '入库仓库', align: 'center', width: 150, ellipsis: { tooltip: true } },
      { key: 'pickupLfd', title: '提柜LFD', align: 'center', width: 130, render: row => dateOnly(row.pickupLfd) },
      { key: 'emptyReturnLfd', title: '还柜LFD', align: 'center', width: 130, render: row => dateOnly(row.emptyReturnLfd) },
      { key: 'examType', title: '查验类型', align: 'center', width: 140, ellipsis: { tooltip: true } },
      { key: 'examRemark', title: '查验备注', align: 'center', width: 180, ellipsis: { tooltip: true } },
      { key: 'drayageVendorName', title: '提柜供应商', align: 'center', width: 150, ellipsis: { tooltip: true } },
      { key: 'pickupAppointmentNo', title: '提柜预约号', align: 'center', width: 140, ellipsis: { tooltip: true } },
      { key: 'pickupAppointmentTime', title: '提柜预约时间', align: 'center', width: 150 },
      { key: 'actualPickupTime', title: '实际提柜时间', align: 'center', width: 150 },
      { key: 'pickupRemark', title: '提柜备注', align: 'center', width: 180, ellipsis: { tooltip: true } },
      { key: 'expectedArrivalTime', title: '预计到仓', align: 'center', width: 150 },
      { key: 'actualArrivalTime', title: '实际到仓', align: 'center', width: 150 },
      { key: 'containerLocation', title: '海柜Location', align: 'center', width: 140, ellipsis: { tooltip: true } },
      { key: 'arrivalRemark', title: '到仓备注', align: 'center', width: 180, ellipsis: { tooltip: true } },
      { key: 'devanningNo', title: '拆柜单号', align: 'center', width: 140, ellipsis: { tooltip: true } },
      { key: 'expectedDevanningTime', title: '预计拆柜', align: 'center', width: 130, render: row => dateOnly(row.expectedDevanningTime) },
      { key: 'devanningStartTime', title: '开始拆柜', align: 'center', width: 150 },
      { key: 'devanningFinishTime', title: '拆柜完成', align: 'center', width: 150 },
      { key: 'devanningMethod', title: '拆柜方式', align: 'center', width: 120, render: row => DEVANNING_METHOD_LABELS[row.devanningMethod || ''] || row.devanningMethod || '-' },
      { key: 'loadingType', title: '装载类型', align: 'center', width: 110, render: row => LOADING_TYPE_LABELS[row.loadingType || ''] || row.loadingType || '-' },
      { key: 'devanningRemark', title: '拆柜备注', align: 'center', width: 180, ellipsis: { tooltip: true } },
      { key: 'emptyReturnLocation', title: '还柜地点', align: 'center', width: 150, ellipsis: { tooltip: true } },
      { key: 'emptyReturnTime', title: '还柜时间', align: 'center', width: 150 },
      {
        key: 'prePlanTruckQty',
        title: '预排车数',
        align: 'center',
        width: 100,
        render: row => (row.prePlanTruckQty != null ? row.prePlanTruckQty : '-')
      },
      {
        key: 'prePlanCbm',
        title: '预排方数',
        align: 'center',
        width: 100,
        render: row => (row.prePlanCbm != null ? Number(row.prePlanCbm).toFixed(3) : '-')
      },
      { key: 'totalCartonQty', title: '总箱数', align: 'center', width: 90 },
      { key: 'totalPalletQty', title: '总板数', align: 'center', width: 90 },
      { key: 'totalWeight', title: '总重量KG', align: 'center', width: 110 },
      { key: 'totalCbm', title: '总方数CBM', align: 'center', width: 120 },
      {
        key: 'containerExceptionFlag',
        title: '海柜异常',
        align: 'center',
        width: 100,
        render: row => row.containerExceptionFlag ? <NTag type="error" size="small">是 ({row.containerExceptionCount || 1})</NTag> : <NTag type="success" size="small">否</NTag>
      },
      {
        key: 'downstreamExceptionFlag',
        title: '下游异常',
        align: 'center',
        width: 100,
        render: row => row.downstreamExceptionFlag ? <NTag type="error" size="small">是 ({row.downstreamExceptionCount || 1})</NTag> : <NTag type="success" size="small">否</NTag>
      },
      {
        key: 'attachmentCount',
        title: '附件',
        align: 'center',
        width: 90,
        render: row => (
          <NButton text type="primary" onClick={() => handleView(row.id, 'files')}>
            附件 {row.attachmentCount || 0}
          </NButton>
        )
      },
      {
        key: 'doAttachmentCount',
        title: 'DO',
        align: 'center',
        width: 90,
        render: row =>
          row.doAttachmentCount
            ? <NButton text type="primary" onClick={() => handleView(row.id, 'files')}>DO {row.doAttachmentCount}</NButton>
            : <NTag size="small">未上传</NTag>
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 80,
        fixed: 'right',
        render: row => {
          const options: any[] = [];
          if (hasAuth('oms:containerOrder:query')) {
            options.push({ label: '查看详情', key: 'view' });
          }
          if (hasAuth('oms:containerOrder:query') || hasAuth('oms:containerOrder:attachmentUpload') || hasAuth('oms:containerOrder:uploadDo')) {
            options.push({ label: '文件管理', key: 'files' });
          }
          if (hasAuth('oms:containerOrder:query')) {
            options.push({ label: '查看轨迹', key: 'trace' });
            options.push({ label: '操作日志', key: 'log' });
          }
          if (hasAuth('oms:containerOrder:inboundPlan')) {
            options.push({ label: '入库计划', key: 'inboundPlan' });
          }
          if (hasAuth('oms:containerOrder:remove')) {
            if (options.length) options.push({ type: 'divider', key: 'd1' });
            options.push({ label: '删除', key: 'delete' });
          }
          if (!options.length) return null;
          function onSelect(key: string) {
            if (key === 'view') {
              handleView(row.id);
            } else if (key === 'files') {
              handleView(row.id, 'files');
            } else if (key === 'trace') {
              handleView(row.id, 'trace');
            } else if (key === 'log') {
              window.$message?.info('操作日志功能开发中，敬请期待');
            } else if (key === 'inboundPlan') {
              router.push({
                path: '/oms/inbound-plan',
                query: { containerOrderId: String(row.id), warehouseId: String(row.warehouseId) }
              });
            } else if (key === 'delete') {
              window.$dialog?.warning({
                title: '确认删除',
                content: '确认删除该海柜订单？关联货物订单也会一并删除。',
                positiveText: '确认',
                negativeText: '取消',
                onPositiveClick: () => handleDelete(row.id)
              });
            }
          }
          return (
            <NDropdown trigger="click" options={options} onSelect={onSelect}>
              <NButton size="small" secondary>更多</NButton>
            </NDropdown>
          );
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

// 手动更改状态
const statusModalVisible = ref(false);
const statusModalTarget = ref<string | null>(null);
const statusModalSubmitting = ref(false);
const STATUS_CHANGE_OPTIONS = CONTAINER_STATUS_OPTIONS.filter(
  s => !['DRAFT', 'DEVANNING', 'DEVANNED'].includes(s.value)
).map(s => ({ label: s.label, value: s.value }));

function openStatusModal() {
  if (checkedRowKeys.value.length !== 1) {
    window.$message?.warning('请选择一条海柜订单');
    return;
  }
  statusModalTarget.value = null;
  statusModalVisible.value = true;
}

async function handleStatusModalConfirm() {
  if (!statusModalTarget.value) {
    window.$message?.warning('请选择目标状态');
    return;
  }
  statusModalSubmitting.value = true;
  const { error } = await fetchUpdateContainerOrderStatus(checkedRowKeys.value[0], {
    targetStatus: statusModalTarget.value,
    remark: '手动更改状态'
  });
  statusModalSubmitting.value = false;
  if (!error) {
    statusModalVisible.value = false;
    getData();
    loadStatusCount();
  }
}

function handleView(id: CommonType.IdType, initialTab = 'basic') {
  detailId.value = id;
  detailInitialTab.value = initialTab;
  detailVisible.value = true;
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteContainerOrder([id]);
  if (error) return;
  onDeleted();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteContainerOrder(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleQuickStatus(targetStatus: string) {
  if (checkedRowKeys.value.length !== 1) {
    window.$message?.warning('请选择一条海柜订单');
    return;
  }
  const { error } = await fetchUpdateContainerOrderStatus(checkedRowKeys.value[0], { targetStatus });
  if (!error) {
    getData();
    loadStatusCount();
  }
}

function handleExport() {
  download('/oms/container-order/export', searchParams.value, `海柜订单_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  const params = {
    ...searchParams.value,
    pageNum: 1,
    containerStatus: activeLifecycle.value || null
  };
  applyAdvancedFilters(params);
  searchParams.value = params;
  getDataByPage();
  loadStatusCount();
}

function handleLifecycleChange(value: string) {
  activeLifecycle.value = value;
  searchParams.value.containerStatus = value || null;
  handleSearch();
}

function handleReset() {
  advancedFilters.value = [];
  advancedVisible.value = false;
  activeLifecycle.value = '';
  searchParams.value = createBlankSearchParams();
  getDataByPage();
  loadStatusCount();
}

onMounted(() => {
  loadBaseNameMaps();
  loadStatusCount();
});
onActivated(() => {
  getData();
  loadStatusCount();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">筛选条件</div>
          <div class="mt-4px text-12px text-#6b7280">生命周期用上方标签切换，高级搜索可按需追加字段</div>
        </div>
        <NSpace :size="8">
          <NButton quaternary @click="searchCollapsed = !searchCollapsed">
            {{ searchCollapsed ? '展开筛选' : '收起筛选' }}
          </NButton>
          <NButton @click="openAdvancedModal">
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
          <NFormItem label="关键词">
            <NInput v-model:value="searchParams.keyword" clearable placeholder="订单/柜号/客户/船名" class="w-220px" />
          </NFormItem>
          <NFormItem label="工作单号">
            <NInput v-model:value="searchParams.containerOrderNo" clearable placeholder="请输入" class="w-160px" />
          </NFormItem>
          <NFormItem label="柜号">
            <NInput v-model:value="searchParams.containerNo" clearable placeholder="请输入" class="w-150px" />
          </NFormItem>
          <NFormItem label="客户">
            <NInput v-model:value="searchParams.customerName" clearable placeholder="客户名称" class="w-150px" />
          </NFormItem>
          <NFormItem label="码头释放">
            <NSelect :to="POPUP_TO_BODY" v-model:value="searchParams.terminalReleaseStatus" :options="RELEASE_STATUS_OPTIONS" clearable placeholder="请选择" class="w-130px" />
          </NFormItem>
          <NFormItem label="海柜异常">
            <NSelect :to="POPUP_TO_BODY"
              v-model:value="searchParams.containerExceptionFlag"
              :options="BOOLEAN_OPTIONS"
              clearable
              placeholder="全部"
              class="w-100px"
            />
          </NFormItem>
        </NForm>

      </div>
    </NCard>

    <!-- 高级筛选弹窗 -->
    <NModal
      v-model:show="advancedVisible"
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
            <NInput v-else v-model:value="(item as any).value" clearable placeholder="请输入搜索值" class="w-240px" />
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

    <NCard
      title="海柜订单"
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header-extra>
        <NSpace :size="8">
          <NButton
            :disabled="checkedRowKeys.length !== 1"
            @click="openStatusModal"
          >
            更改状态
          </NButton>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-add="hasAuth('oms:containerOrder:add')"
            :show-delete="hasAuth('oms:containerOrder:remove')"
            :show-export="hasAuth('oms:containerOrder:export')"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @export="handleExport"
            @refresh="getData"
          />
        </NSpace>
      </template>
      <div class="flex min-h-0 flex-1 flex-col gap-12px overflow-hidden">
        <div class="mb-12px flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
          <div
            v-for="tab in lifecycleTabs"
            :key="tab.value"
            class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
            :class="activeLifecycle === tab.value
              ? 'bg-primary text-white shadow-sm'
              : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'"
            @click="handleLifecycleChange(tab.value)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold leading-14px"
              :class="activeLifecycle === tab.value
                ? 'bg-white/25 text-white'
                : tab.count > 0 ? 'bg-#ef4444 text-white' : 'bg-#d0d3d9 text-#909399'"
            >
              {{ tab.count }}
            </span>
          </div>
        </div>
        <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
          <DataTable
            v-model:checked-row-keys="checkedRowKeys"
            :columns="columns"
            :data="data"
            :flex-height="!appStore.isMobile"
            :scroll-x="scrollX"
            :loading="loading"
            remote
            :row-key="(row: Api.Oms.ContainerOrder) => row.id"
            :pagination="mobilePagination"
            class="h-full min-h-280px sm:min-h-0"
          />
        </div>
      </div>
    </NCard>

    <ContainerOrderOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getDataByPage"
    />
    <ContainerOrderDetailDrawer
      v-model:visible="detailVisible"
      :order-id="detailId"
      :initial-tab="detailInitialTab"
      @updated="getData"
    />

    <!-- 手动更改状态 -->
    <NModal
      v-model:show="statusModalVisible"
      preset="card"
      title="更改订单状态"
      class="w-380px"
      :mask-closable="false"
    >
      <NSelect
        v-model:value="statusModalTarget"
        :options="STATUS_CHANGE_OPTIONS"
        placeholder="请选择目标状态"
        filterable
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="statusModalVisible = false">取消</NButton>
          <NButton
            type="primary"
            :loading="statusModalSubmitting"
            :disabled="!statusModalTarget"
            @click="handleStatusModalConfirm"
          >
            确定
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
