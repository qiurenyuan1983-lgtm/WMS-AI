<script setup lang="ts">
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { computed, h, ref, watch } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { jsonClone } from '@sa/utils';
import {
  fetchGetBusinessTypeList,
  fetchGetChannelList,
  fetchGetPortList,
  fetchGetShippingLineList,
  fetchGetShippingRouteList,
  fetchGetTerminalList,
  fetchGetVesselList
} from '@/service/api/base';
import { fetchGetYardDockList } from '@/service/api/yard/dock';
import {
  fetchGetContainerOrderDetail,
  fetchUpdateContainerOrder,
  fetchUpdateContainerOrderStatus
} from '@/service/api/oms/container-order';
import { fetchHoldCargoOrder, fetchReleaseCargoOrderHold } from '@/service/api/oms/cargo-order';
import AttachmentManager from '../../components/attachment-manager.vue';
import CargoOrderDetailDrawer from '../../cargo-order/modules/cargo-order-detail-drawer.vue';
import ContainerCargoOrderAddDrawer from './container-cargo-order-add-drawer.vue';
import ContainerCargoOrderImportModal from './container-cargo-order-import-modal.vue';
import { useCargoOrderTransfer } from '../composables/use-cargo-order-transfer';
import { normalizeCargoOrderFromVo, normalizeDatePickerDate, normalizeDatePickerDateTime, type ContainerCargoDefaults } from '../utils/container-cargo-order';
import { useContainerCargoTableColumns } from '../composables/use-container-cargo-table-columns';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useDownload } from '@/hooks/business/download';
import { getContainerCargoImportTemplateUrl } from '@/service/api/oms/container-order';

defineOptions({ name: 'ContainerOrderDetailDrawer' });

interface Props {
  orderId?: CommonType.IdType | null;
  initialTab?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'updated'): void }>();
const visible = defineModel<boolean>('visible', { default: false });
const { hasAuth } = useAuth();
const { download } = useDownload();
const { cancelTransfer, modifyTransfer } = useCargoOrderTransfer(() => loadDetail().then(() => emit('updated')));

const loading = ref(false);
const detail = ref<Api.Oms.ContainerOrder | null>(null);
const activeTab = ref('basic');
const editMode = ref(true);
const privilegedEditMode = ref(false);
const cargoAddDrawerVisible = ref(false);
const cargoImportVisible = ref(false);
const cargoDetailVisible = ref(false);
const viewingCargoId = ref<CommonType.IdType>();
const cargoDetailStartEdit = ref(false);
const cargoDetailInitialTab = ref('basic');
const editModel = ref<any>(null);
const channelNameMap = ref<Record<string, string>>({});
const businessTypeNameMap = ref<Record<string, string>>({});
const shippingLineRows = ref<Api.Base.ShippingLine[]>([]);
const shippingRouteRows = ref<Api.Base.ShippingRoute[]>([]);
const vesselRows = ref<Api.Base.Vessel[]>([]);
const portRows = ref<Api.Base.Port[]>([]);
const terminalRows = ref<Api.Base.Terminal[]>([]);
const yardDockRows = ref<Api.Yard.Dock[]>([]);

const YES_NO_OPTIONS = [
  { label: '否', value: 0 },
  { label: '是', value: 1 }
];

/** 详情抽屉描述列表：标签顶对齐，内容区撑满 */
const DESC_PROPS = {
  labelPlacement: 'left' as const,
  size: 'small' as const,
  labelStyle: { width: '88px', verticalAlign: 'top', paddingTop: '6px', whiteSpace: 'nowrap' as const },
  contentStyle: { verticalAlign: 'top', width: '100%', paddingBottom: '8px', overflow: 'visible' as const }
};

/** 描述列表内表单控件统一宽度（90%，右侧留边距） */
const FIELD_CLS = 'oms-desc-field';

const DEVANNING_METHOD_OPTIONS = [
  { label: '人工拆柜', value: 'MANUAL' },
  { label: '叉车拆柜', value: 'FORKLIFT' },
  { label: '流水线拆柜', value: 'CONVEYOR' },
  { label: '混合拆柜', value: 'MIXED' }
];

/** 字典接口异常或缓存未刷新时的兜底（与 oms_container_hold_type 初始数据一致） */
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

function releaseStatusLabel(value?: string | null) {
  if (!value) return '\u65e0';
  return RELEASE_STATUS_LABEL[value] || value;
}

function normalizeReleaseStatus(value?: string | null) {
  if (!value || value === 'UNKNOWN') return 'NONE';
  if (value === 'RELEASED') return 'RELEASE';
  if (value === 'HOLDING') return 'HOLD';
  return value;
}

function normalizeExamStatus(row: { examStatus?: string | null; examFlag?: number | null }) {
  if (row.examStatus) return row.examStatus;
  if (row.examFlag) return 'EXAMINING';
  return 'NONE';
}

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

const HOLD_TYPE_FALLBACK_RECORD = Object.fromEntries(HOLD_TYPE_FALLBACK.map(item => [item.value, item.label]));
const EXAM_TYPE_FALLBACK_RECORD = Object.fromEntries(EXAM_TYPE_FALLBACK.map(item => [item.value, item.label]));

const {
  options: holdTypeOptionsFromDict,
  record: holdTypeRecordFromDict,
  reload: reloadHoldTypeDict
} = useDict('oms_container_hold_type');
const {
  options: examTypeOptionsFromDict,
  record: examTypeRecordFromDict,
  reload: reloadExamTypeDict
} = useDict('oms_container_exam_type');

/** 字典优先：字典管理新增项会自动出现；仅当接口无数据时用兜底 */
const holdTypeOptions = computed(() =>
  holdTypeOptionsFromDict.value.length ? holdTypeOptionsFromDict.value : HOLD_TYPE_FALLBACK
);
const examTypeOptions = computed(() =>
  examTypeOptionsFromDict.value.length ? examTypeOptionsFromDict.value : EXAM_TYPE_FALLBACK
);
const holdTypeRecord = computed(() => ({ ...HOLD_TYPE_FALLBACK_RECORD, ...holdTypeRecordFromDict.value }));
const examTypeRecord = computed(() => ({ ...EXAM_TYPE_FALLBACK_RECORD, ...examTypeRecordFromDict.value }));

async function reloadHoldExamDicts() {
  await Promise.all([reloadHoldTypeDict(), reloadExamTypeDict()]);
}

const ORDER_SOURCE_OPTIONS = [
  { label: '自建单', value: 'SELF' },
  { label: 'API下单', value: 'API' },
  { label: '客户门户下单', value: 'PORTAL' }
];

const ORDER_SOURCE_LABELS: Record<string, string> = {
  SELF: '自建单',
  MANUAL: '自建单',
  IMPORT: '自建单',
  API: 'API下单',
  PORTAL: '客户门户下单'
};

const LOADING_TYPE_OPTIONS = [
  { label: '散装', value: 'FLOOR' },
  { label: '卡板', value: 'PALLET' },
  { label: '混装', value: 'MIXED' }
];

const codeLabelMaps = computed(() => ({
  devanningMethod: Object.fromEntries(DEVANNING_METHOD_OPTIONS.map(item => [item.value, item.label])),
  loadingType: Object.fromEntries(LOADING_TYPE_OPTIONS.map(item => [item.value, item.label]))
}));

type IdSelectOption = { label: string; value: CommonType.IdType };

/** 当前值不在下拉列表时补一条，避免 NSelect 直接显示 ID */
function withCurrentIdOption(
  options: IdSelectOption[],
  id: CommonType.IdType | null | undefined,
  label: string | null | undefined
): IdSelectOption[] {
  if (id == null || id === '') return options;
  if (options.some(item => String(item.value) === String(id))) return options;
  const text = label?.trim() || String(id);
  return [{ label: text, value: id }, ...options];
}

const shippingLineOptions = computed(() => {
  const base = shippingLineRows.value.map(item => ({
    label: [item.nameAbbr, item.nameEn, item.code].filter(Boolean).join(' / '),
    value: item.id
  }));
  const m = editModel.value;
  const d = detail.value;
  return withCurrentIdOption(base, m?.shippingLineId ?? d?.shippingLineId, m?.shippingLineName ?? d?.shippingLineName);
});

const vesselOptions = computed(() =>
  vesselRows.value.map(item => ({
    label: [item.vesselName, item.vesselNameEn, item.shippingLineName].filter(Boolean).join(' / '),
    value: item.vesselName
  }))
);

const shippingRouteOptions = computed(() =>
  shippingRouteRows.value.map(item => ({
    label: [item.routeCode, item.routeName, item.shippingLineName].filter(Boolean).join(' / '),
    value: item.routeCode
  }))
);

const portOptions = computed(() => {
  const base = portRows.value.map(item => ({
    label: [item.portCode, item.nameEn].filter(Boolean).join(' / '),
    value: item.id
  }));
  const m = editModel.value;
  const d = detail.value;
  return withCurrentIdOption(base, m?.dischargePortId ?? d?.dischargePortId, m?.dischargePortName ?? d?.dischargePortName);
});

const terminalOptions = computed(() => {
  const base = terminalRows.value.map(item => ({
    label: [item.terminalCode, item.terminalName, item.portName].filter(Boolean).join(' / '),
    value: item.id
  }));
  const m = editModel.value;
  const d = detail.value;
  return withCurrentIdOption(base, m?.terminalId ?? d?.terminalId, m?.terminalName ?? d?.terminalName);
});

const yardDockOptions = computed(() => {
  const warehouseId = editModel.value?.warehouseId ?? detail.value?.warehouseId;
  const rows = warehouseId
    ? yardDockRows.value.filter(item => String(item.warehouseId) === String(warehouseId))
    : yardDockRows.value;
  return rows.map(item => ({
    label: [item.dockName, item.dockCode, item.warehouseName].filter(Boolean).join(' / '),
    value: item.dockName
  }));
});

const STATUS_OPTIONS = [
  { label: '待受理', value: 'PENDING_ACCEPT', type: 'warning' },
  { label: '在途', value: 'IN_TRANSIT', type: 'info' },
  { label: '已到港', value: 'ARRIVED_PORT', type: 'info' },
  { label: '已提柜', value: 'PICKED_UP', type: 'success' },
  { label: '已到仓', value: 'ARRIVED_WAREHOUSE', type: 'success' },
  { label: '拆柜中', value: 'DEVANNING', type: 'warning' },
  { label: '拆柜完成', value: 'DEVANNED', type: 'success' },
  { label: '已还柜', value: 'EMPTY_RETURNED', type: 'success' },
  { label: '已完成', value: 'COMPLETED', type: 'success' }
] as const;

const statusMap = Object.fromEntries(STATUS_OPTIONS.map(item => [item.value, item])) as Record<string, (typeof STATUS_OPTIONS)[number]>;

const currentStep = computed(() => {
  const index = STATUS_OPTIONS.findIndex(item => item.value === detail.value?.containerStatus);
  return index >= 0 ? index + 1 : 1;
});

function openCargoDetailDrawer(row: Api.Oms.CargoOrder, startEdit = false, initialTab = 'basic') {
  if (!row.id) {
    window.$message?.warning('货物订单不存在');
    return;
  }
  viewingCargoId.value = row.id;
  cargoDetailStartEdit.value = startEdit;
  cargoDetailInitialTab.value = initialTab;
  cargoDetailVisible.value = true;
}

async function onCargoDetailRefresh() {
  await loadDetail();
  emit('updated');
}

const PRE_OUTBOUND_LABELS: Record<string, string> = {
  NONE: '无预出单', PRE_CREATED: '已预出单', CONVERTED: '已转正式', CANCELLED: '已取消'
};

function isCargoHolding(row: Pick<Api.Oms.CargoOrder, 'holdFlag' | 'holdStatus'>) {
  return row.holdStatus === 'HOLDING' || Boolean(row.holdFlag);
}

function cargoHoldLabel(row: Pick<Api.Oms.CargoOrder, 'holdFlag' | 'holdStatus'>) {
  if (isCargoHolding(row)) return '暂扣';
  if (row.holdStatus === 'RELEASED') return '已放行';
  return '正常';
}

function cargoHoldTagType(row: Pick<Api.Oms.CargoOrder, 'holdFlag' | 'holdStatus'>) {
  if (isCargoHolding(row)) return 'warning';
  if (row.holdStatus === 'RELEASED') return 'success';
  return 'default';
}

function getCargoBusinessTypeName(row: Api.Oms.CargoOrder) {
  return String((row.businessTypeId ? businessTypeNameMap.value[String(row.businessTypeId)] : '') || row.businessTypeId || '--');
}

const cargoColumns = useContainerCargoTableColumns({
  mode: 'detail',
  getBusinessTypeName: getCargoBusinessTypeName,
  onViewDetail: row => openCargoDetailDrawer(row),
  isCargoHolding,
  cargoHoldLabel,
  cargoHoldTagType,
  hasAuth,
  onHold: quickHoldCargo,
  onReleaseHold: quickReleaseCargo,
  onModifyTransfer: modifyTransfer,
  onCancelTransfer: cancelTransfer
});

const exceptionColumns = [
  {
    title: '异常号',
    key: 'exceptionNo',
    width: 180,
    render: (row: Record<string, unknown>) =>
      h(NButton, { text: true, type: 'primary', disabled: true }, { default: () => row.exceptionNo as string })
  },
  { title: '异常类型', key: 'exceptionType', minWidth: 120 },
  { title: '异常情况', key: 'exceptionDesc', minWidth: 200 },
  { title: '创建时间', key: 'createTime', width: 160 }
];

function handleComingSoon() {
  window.$message?.info('功能开发中，敬请期待');
}

function orderSourceLabel(value?: string | null) {
  return (value && ORDER_SOURCE_LABELS[value]) || valueText(value);
}

const cargoDefaults = computed<ContainerCargoDefaults>(() => {
  const row = detail.value;
  if (!row) return {};
  return {
    customerId: row.customerId,
    customerName: row.customerName,
    channelId: row.channelId,
    businessTypeId: row.businessTypeId,
    customerServiceId: row.customerServiceId,
    customerServiceName: row.customerServiceName,
    inboundWarehouseId: row.warehouseId,
    inboundWarehouseName: row.inboundWarehouseName
  };
});

function openAddCargoDrawer() {
  cargoAddDrawerVisible.value = true;
}

function handleDownloadCargoTemplate() {
  download(getContainerCargoImportTemplateUrl(), {}, `海柜关联货物订单导入模板_${Date.now()}.xlsx`);
}

async function onCargoAdded() {
  await loadDetail();
  emit('updated');
}

function quickHoldCargo(row: Api.Oms.CargoOrder) {
  window.$dialog?.warning({
    title: '货物暂扣',
    content: `确认暂扣 ${row.cargoOrderNo}？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchHoldCargoOrder(row.id, { holdType: 'OPERATION_HOLD', holdReason: '运营暂扣' });
      if (!error) {
        window.$message?.success('已暂扣');
        await loadDetail();
      }
    }
  });
}

function quickReleaseCargo(row: Api.Oms.CargoOrder) {
  window.$dialog?.success({
    title: '货物放行',
    content: `确认放行 ${row.cargoOrderNo}？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchReleaseCargoOrderHold(row.id, { releaseReason: '运营放行' });
      if (!error) {
        window.$message?.success('已放行');
        await loadDetail();
      }
    }
  });
}

function statusLabel(value?: string | null) {
  return value ? statusMap[value]?.label || value : '-';
}

function statusType(value?: string | null) {
  return (value ? statusMap[value]?.type : 'default') || 'default';
}

function boolText(value?: number | null) {
  return value ? '是' : '否';
}

function splitCodes(value?: string | null) {
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
}

function dictLabels(record: Record<string, any>, value?: string | null) {
  const codes = splitCodes(value);
  if (!codes.length) return '--';
  return codes.map(code => record[code] || code).join('、');
}

function valueText(value: unknown) {
  return value === null || value === undefined || value === '' ? '--' : String(value);
}

function dateOnly(value?: string | null) {
  return value ? String(value).slice(0, 10) : '--';
}

function toDateValue(value?: string | null) {
  return normalizeDatePickerDate(value);
}

function createEditModel(data: Api.Oms.ContainerOrder): Api.Oms.ContainerOrderOperateParams {
  return {
    ...(jsonClone(data) as Api.Oms.ContainerOrderOperateParams),
    eta: normalizeDatePickerDateTime(data.eta),
    ata: normalizeDatePickerDateTime(data.ata),
    pickupLfd: normalizeDatePickerDate(data.pickupLfd),
    availableTime: normalizeDatePickerDateTime(data.availableTime),
    actualPickupTime: normalizeDatePickerDateTime(data.actualPickupTime),
    requiredArrivalTime: normalizeDatePickerDateTime(data.requiredArrivalTime),
    expectedArrivalTime: normalizeDatePickerDateTime(data.expectedArrivalTime),
    actualArrivalTime: normalizeDatePickerDateTime(data.actualArrivalTime),
    expectedDevanningTime: normalizeDatePickerDate(data.expectedDevanningTime),
    emptyReturnLfd: normalizeDatePickerDate(data.emptyReturnLfd),
    emptyReturnTime: normalizeDatePickerDateTime(data.emptyReturnTime),
    cargoOrders: (data.cargoOrders || []).map(item => normalizeCargoOrderFromVo(item))
  };
}

function getContainerChannelName() {
  const row = detail.value;
  return row?.channelName || (row?.channelId ? channelNameMap.value[String(row.channelId)] : '') || '--';
}

function optionLabel(type: 'devanningMethod' | 'loadingType', value?: string | null) {
  return value ? codeLabelMaps.value[type][value] || value : '--';
}

function handleShippingLineChange(value: CommonType.IdType | null) {
  if (!editModel.value) return;
  const line = shippingLineRows.value.find(item => String(item.id) === String(value));
  editModel.value.shippingLineName = line ? line.nameAbbr || line.nameEn : null;
}

function fillShippingLineFromId(id?: CommonType.IdType | null, name?: string | null) {
  if (!editModel.value || (!id && !name)) return;
  editModel.value.shippingLineId = id || null;
  const line = shippingLineRows.value.find(item => String(item.id) === String(id));
  editModel.value.shippingLineName = line ? line.nameAbbr || line.nameEn : name || null;
}

function handleVesselChange(value: string | null) {
  if (!editModel.value) return;
  const vessel = vesselRows.value.find(item => item.vesselName === value || item.vesselNameEn === value);
  if (!vessel) return;
  editModel.value.vesselName = vessel.vesselName;
  fillShippingLineFromId(vessel.shippingLineId, vessel.shippingLineName);
}

function handleShippingRouteChange(value: string | null) {
  if (!editModel.value) return;
  const route = shippingRouteRows.value.find(item => item.routeCode === value);
  if (!route) return;
  editModel.value.routeCode = route.routeCode;
  fillShippingLineFromId(route.shippingLineId, route.shippingLineName);
  if (route.destinationPortId || route.destinationPortName) {
    editModel.value.dischargePortId = route.destinationPortId || null;
    editModel.value.dischargePortName = route.destinationPortName || route.destinationPortCode || null;
  }
}

function handlePortChange(value: CommonType.IdType | null) {
  if (!editModel.value) return;
  const port = portRows.value.find(item => String(item.id) === String(value));
  editModel.value.dischargePortName = port ? port.nameEn || port.portCode : null;
}

function handleTerminalChange(value: CommonType.IdType | null) {
  if (!editModel.value) return;
  const terminal = terminalRows.value.find(item => String(item.id) === String(value));
  editModel.value.terminalName = terminal ? terminal.terminalName : null;
  if (terminal?.portId) {
    editModel.value.dischargePortId = terminal.portId;
    editModel.value.dischargePortName = terminal.portName || terminal.portCode || editModel.value.dischargePortName;
  }
}

async function loadBaseNameMaps() {
  const [channelResult, businessTypeResult, shippingLineResult, shippingRouteResult, vesselResult, portResult, terminalResult, yardDockResult] =
    await Promise.all([
      fetchGetChannelList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({ data: null })),
      fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({ data: null })),
      fetchGetShippingLineList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({ data: null })),
      fetchGetShippingRouteList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({ data: null })),
      fetchGetVesselList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({ data: null })),
      fetchGetPortList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({ data: null })),
      fetchGetTerminalList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({ data: null })),
      fetchGetYardDockList({ pageNum: 1, pageSize: 500, enabledFlag: 1, params: {} }).catch(() => ({ data: null }))
    ]);
  channelNameMap.value = Object.fromEntries((channelResult.data?.rows || []).map(item => [String(item.id), item.channelName]));
  businessTypeNameMap.value = Object.fromEntries(
    (businessTypeResult.data?.rows || []).map(item => [String(item.id), item.businessTypeName])
  );
  shippingLineRows.value = shippingLineResult.data?.rows || [];
  shippingRouteRows.value = shippingRouteResult.data?.rows || [];
  vesselRows.value = vesselResult.data?.rows || [];
  portRows.value = portResult.data?.rows || [];
  terminalRows.value = terminalResult.data?.rows || [];
  yardDockRows.value = yardDockResult.data?.rows || [];
}

async function loadDetail() {
  if (!props.orderId) return;
  loading.value = true;
  try {
    const { data } = await fetchGetContainerOrderDetail(props.orderId);
    detail.value = data || null;
    editModel.value = data ? createEditModel(data) : null;
  } finally {
    loading.value = false;
  }
}

async function updateStatus(targetStatus: string) {
  if (!detail.value?.id) return;
  const { error } = await fetchUpdateContainerOrderStatus(detail.value.id, { targetStatus });
  if (error) return;
  await loadDetail();
  emit('updated');
}

function togglePrivilegedEdit() {
  privilegedEditMode.value = !privilegedEditMode.value;
}

function resetEdit() {
  editModel.value = detail.value ? createEditModel(detail.value) : null;
}

async function saveEdit() {
  if (!editModel.value) return;
  const { error } = await fetchUpdateContainerOrder(editModel.value);
  if (error) return;
  window.$message?.success('修改成功');
  await loadDetail();
  emit('updated');
}

watch(visible, async () => {
  if (!visible.value) return;
  activeTab.value = props.initialTab || 'basic';
  privilegedEditMode.value = false;
  editMode.value = true;
  await reloadHoldExamDicts();
  await loadBaseNameMaps();
  await loadDetail();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1360" class="max-w-98%">
    <NDrawerContent title="海柜订单详情" :native-scrollbar="false" closable class="oms-detail-drawer">
      <NSpin :show="loading">
        <NEmpty v-if="!detail" description="暂无详情" />
        <div v-else class="flex-col gap-16px">
          <div class="flex flex-wrap items-center justify-between gap-12px">
            <NSpace align="center">
              <span class="text-22px font-semibold">海柜订单详情</span>
              <span class="text-#4b5563">工作单号：{{ detail.containerOrderNo }}</span>
              <span class="flex items-center gap-6px text-#4b5563">
                <NTag v-if="detail.doAttachmentCount" type="primary" size="small">DO</NTag>
                柜号：{{ detail.containerNo }}
              </span>
              <NTag :type="statusType(detail.containerStatus) as any">{{ statusLabel(detail.containerStatus) }}</NTag>
            </NSpace>
            <NSpace>
              <NButton @click="resetEdit">重置</NButton>
              <NButton type="primary" @click="saveEdit">保存</NButton>
              <NButton :type="privilegedEditMode ? 'warning' : 'default'" @click="togglePrivilegedEdit">
                {{ privilegedEditMode ? '退出高级编辑' : '高级编辑' }}
              </NButton>
              <NButton @click="updateStatus('ARRIVED_WAREHOUSE')">更新到仓</NButton>
              <NButton @click="updateStatus('DEVANNING')">开始拆柜</NButton>
              <NButton type="primary" @click="updateStatus('DEVANNED')">拆柜完成</NButton>
            </NSpace>
          </div>

          <NCard size="small" :bordered="true">
            <NSteps :current="currentStep" size="small" status="process">
              <NStep v-for="item in STATUS_OPTIONS" :key="item.value" :title="item.label" />
            </NSteps>
          </NCard>

          <NTabs v-model:value="activeTab" type="line" animated>
            <NTabPane name="basic" tab="基础信息">
              <NForm :model="editModel || {}" label-placement="left" :label-width="96">
                <NGrid :cols="4" :x-gap="14" :y-gap="14" item-responsive responsive="screen">
                <NGridItem>
                  <NCard title="系统信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="工作单号">{{ detail.containerOrderNo }}</NDescriptionsItem>
                      <NDescriptionsItem label="订单来源">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                        v-if="editMode && editModel"
                        v-model:value="editModel.orderSource"
                        size="small"
                        :options="ORDER_SOURCE_OPTIONS"
                      />
                      <template v-else>{{ orderSourceLabel(detail.orderSource) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="创建时间">{{ valueText(detail.createTime) }}</NDescriptionsItem>
                      <NDescriptionsItem label="更新时间">{{ valueText(detail.updateTime) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="业务归属" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="客户">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.customerName" size="small" />
                        <template v-else>{{ detail.customerName }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="渠道">{{ getContainerChannelName() }}</NDescriptionsItem>
                      <NDescriptionsItem label="负责人">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.ownerUserName" size="small" />
                        <template v-else>{{ valueText(detail.ownerUserName) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="客服">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.customerServiceName" size="small" />
                        <template v-else>{{ valueText(detail.customerServiceName) }}</template>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="柜子信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="柜号">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.containerNo" size="small" />
                        <template v-else>{{ detail.containerNo }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="柜型">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.containerType"
                          size="small"
                          :options="[
                            { label: '20GP', value: '20GP' },
                            { label: '40GP', value: '40GP' },
                            { label: '40HQ', value: '40HQ' },
                            { label: '45HQ', value: '45HQ' }
                          ]"
                        />
                        <template v-else>{{ detail.containerType }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="封条号">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.sealNo" size="small" />
                        <template v-else>{{ valueText(detail.sealNo) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="箱体状况">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.internalRemark" size="small" />
                        <template v-else>{{ valueText(detail.internalRemark) }}</template>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="船公司信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="船公司">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.shippingLineId"
                          size="small"
                          filterable
                          clearable
                          :options="shippingLineOptions"
                          @update:value="handleShippingLineChange"
                        />
                        <template v-else>{{ valueText(detail.shippingLineName) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="船名">
                        <NAutoComplete
                          :class="FIELD_CLS"
                          :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.vesselName"
                          size="small"
                          clearable
                          :options="vesselOptions"
                          placeholder="输入或选择船名"
                          @select="handleVesselChange"
                        />
                        <template v-else>{{ valueText(detail.vesselName) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="航次">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.voyageNo" size="small" />
                        <template v-else>{{ valueText(detail.voyageNo) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="航线代码">
                        <NAutoComplete
                          :class="FIELD_CLS"
                          :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.routeCode"
                          size="small"
                          clearable
                          :options="shippingRouteOptions"
                          placeholder="输入或选择航线代码"
                          @select="handleShippingRouteChange"
                        />
                        <template v-else>{{ valueText(detail.routeCode) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="MBL">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.mblNo" size="small" />
                        <template v-else>{{ valueText(detail.mblNo) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="HBL">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.hblNo" size="small" />
                        <template v-else>{{ valueText(detail.hblNo) }}</template>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem :span="4">
                  <NCard title="港口与释放" size="small">
                    <NDescriptions :column="4" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="卸货港">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.dischargePortId"
                          size="small"
                          filterable
                          clearable
                          :options="portOptions"
                          @update:value="handlePortChange"
                        />
                        <template v-else>{{ valueText(detail.dischargePortName) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="码头">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.terminalId"
                          size="small"
                          filterable
                          clearable
                          :options="terminalOptions"
                          @update:value="handleTerminalChange"
                        />
                        <template v-else>{{ valueText(detail.terminalName) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="ETA">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.eta"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.eta) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="ATA">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.ata"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.ata) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="提柜LFD">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.pickupLfd"
                          type="date"
                          value-format="yyyy-MM-dd"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ dateOnly(detail.pickupLfd) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="Available时间">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.availableTime"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.availableTime) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="码头释放">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.terminalReleaseStatus"
                          size="small"
                          :options="RELEASE_STATUS_OPTIONS"
                        />
                        <template v-else>{{ releaseStatusLabel(normalizeReleaseStatus(detail.terminalReleaseStatus)) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="查验状态">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.examStatus"
                          size="small"
                          :options="EXAM_STATUS_OPTIONS"
                        />
                        <template v-else>{{ EXAM_STATUS_OPTIONS.find(o => o.value === normalizeExamStatus(detail))?.label || '\u65e0' }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="查验类型">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.examType"
                          size="small"
                          clearable
                          filterable
                          :options="examTypeOptions"
                        />
                        <template v-else>{{ examTypeRecord[detail.examType || ''] || valueText(detail.examType) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="查验备注">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.examRemark" size="small" />
                        <template v-else>{{ valueText(detail.examRemark) }}</template>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="提柜信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="提柜地点">{{ valueText(detail.terminalName || detail.dischargePortName) }}</NDescriptionsItem>
                      <NDescriptionsItem label="提柜供应商">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.drayageVendorName" size="small" placeholder="提柜公司/拖车行" />
                        <template v-else>{{ valueText(detail.drayageVendorName) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="提柜预约号">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.pickupAppointmentNo" size="small" />
                        <template v-else>{{ valueText(detail.pickupAppointmentNo) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="提柜时间">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.actualPickupTime"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.actualPickupTime || detail.pickupAppointmentTime) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="备注">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.pickupRemark" size="small" />
                        <template v-else>{{ valueText(detail.pickupRemark) }}</template>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="入库仓与Location" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="入库仓库">{{ detail.inboundWarehouseName || detail.warehouseName || detail.warehouseId }}</NDescriptionsItem>
                      <NDescriptionsItem label="要求到仓时间">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.requiredArrivalTime"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.requiredArrivalTime) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="入库预约时间">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.expectedArrivalTime"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.expectedArrivalTime) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="实际到仓">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.actualArrivalTime"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.actualArrivalTime) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="海柜Location">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.containerLocation"
                          size="small"
                          filterable
                          clearable
                          tag
                          :options="yardDockOptions"
                          placeholder="请选择月台名称"
                        />
                        <template v-else>{{ valueText(detail.containerLocation) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="备注">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.arrivalRemark" size="small" />
                        <template v-else>{{ valueText(detail.arrivalRemark) }}</template>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="拆柜信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="拆柜单号">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.devanningNo" size="small" />
                        <template v-else>{{ valueText(detail.devanningNo || detail.devanningOrderNo) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="预计拆柜时间">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.expectedDevanningTime"
                          type="date"
                          value-format="yyyy-MM-dd"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ dateOnly(detail.expectedDevanningTime) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="拆柜方式">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.devanningMethod"
                          size="small"
                          clearable
                          :options="DEVANNING_METHOD_OPTIONS"
                        />
                        <template v-else>{{ optionLabel('devanningMethod', detail.devanningMethod) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="装载类型">
                        <NSelect :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:value="editModel.loadingType"
                          size="small"
                          clearable
                          :options="LOADING_TYPE_OPTIONS"
                        />
                        <template v-else>{{ optionLabel('loadingType', detail.loadingType) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="拆柜完成时间">{{ valueText(detail.devanningFinishTime) }}</NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                <NGridItem>
                  <NCard title="还柜信息" size="small">
                    <NDescriptions :column="1" v-bind="DESC_PROPS">
                      <NDescriptionsItem label="还柜地点">
                        <NInput :class="FIELD_CLS" v-if="editMode && editModel" v-model:value="editModel.emptyReturnLocation" size="small" />
                        <template v-else>{{ valueText(detail.emptyReturnLocation) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="还柜方式">{{ valueText(detail.emptyReturnStatus) }}</NDescriptionsItem>
                      <NDescriptionsItem label="还柜LFD">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.emptyReturnLfd"
                          type="date"
                          value-format="yyyy-MM-dd"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ dateOnly(detail.emptyReturnLfd) }}</template>
                      </NDescriptionsItem>
                      <NDescriptionsItem label="还柜时间">
                        <NDatePicker :class="FIELD_CLS" :to="POPUP_TO_BODY"
                          v-if="editMode && editModel"
                          v-model:formatted-value="editModel.emptyReturnTime"
                          type="datetime"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          size="small"
                          clearable
                        />
                        <template v-else>{{ valueText(detail.emptyReturnTime) }}</template>
                      </NDescriptionsItem>
                    </NDescriptions>
                  </NCard>
                </NGridItem>
                </NGrid>
              </NForm>
            </NTabPane>

            <NTabPane name="cargo" tab="关联货物订单">
              <NCard size="small">
                <template #header>
                  <NSpace>
                    <NButton type="primary" @click="openAddCargoDrawer">新增货物订单</NButton>
                    <NButton v-if="hasAuth('oms:containerOrder:importCargo')" @click="cargoImportVisible = true">
                      导入货物订单
                    </NButton>
                    <NButton
                      v-if="hasAuth('oms:containerOrder:importCargo')"
                      secondary
                      @click="handleDownloadCargoTemplate"
                    >
                      下载模板
                    </NButton>
                  </NSpace>
                </template>
                <div class="mb-8px text-12px text-#9ca3af">点击货物订单号或「查看详情」打开货物订单详情；在「货件/SKU」页可直接编辑货件行并保存</div>
                <NDataTable
                  :columns="cargoColumns"
                  :data="detail.cargoOrders || []"
                  :pagination="false"
                  :row-key="(row: Api.Oms.CargoOrder) => row.id"
                  :scroll-x="4300"
                  size="small"
                />
              </NCard>
            </NTabPane>

            <NTabPane name="trace" tab="时间节点">
              <NTimeline>
                <NTimelineItem
                  v-for="trace in detail.traces || []"
                  :key="trace.id"
                  :title="trace.actionDesc || trace.action"
                  :content="`${statusLabel(trace.statusFrom)} -> ${statusLabel(trace.statusTo)}${trace.operatorName ? `，${trace.operatorName}` : ''}`"
                  :time="trace.createTime"
                />
              </NTimeline>
            </NTabPane>

            <NTabPane name="exception" tab="异常信息">
              <NDescriptions :column="4" label-placement="left" bordered class="mb-16px">
                <NDescriptionsItem label="海柜异常">
                  <NTag :type="detail.containerExceptionFlag ? 'error' : 'success'" size="small">{{ boolText(detail.containerExceptionFlag) }}</NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="海柜异常数">{{ detail.containerExceptionCount || 0 }}</NDescriptionsItem>
                <NDescriptionsItem label="海柜异常类型">{{ valueText(detail.containerExceptionType) }}</NDescriptionsItem>
                <NDescriptionsItem label="下游异常">
                  <NTag :type="detail.downstreamExceptionFlag ? 'error' : 'success'" size="small">{{ boolText(detail.downstreamExceptionFlag) }}</NTag>
                </NDescriptionsItem>
              </NDescriptions>
              <NDataTable
                :columns="exceptionColumns"
                :data="[]"
                :pagination="false"
                size="small"
              />
              <div class="mt-8px text-12px text-#9ca3af">* 异常工单详情功能待异常板块上线后完善</div>
            </NTabPane>

            <NTabPane name="files" :tab="`文件管理 (${detail.attachmentCount || 0})`">
              <AttachmentManager target-kind="container" :target-id="detail.id" @changed="loadDetail" />
            </NTabPane>
          </NTabs>
        </div>
      </NSpin>
    </NDrawerContent>
  </NDrawer>

  <CargoOrderDetailDrawer
    v-model:visible="cargoDetailVisible"
    :order-id="viewingCargoId"
    :start-edit="cargoDetailStartEdit"
    :initial-tab="cargoDetailInitialTab"
    @refresh="onCargoDetailRefresh"
  />

  <ContainerCargoOrderAddDrawer
    v-model:visible="cargoAddDrawerVisible"
    :container-order-id="detail?.id"
    :defaults="cargoDefaults"
    @submitted="onCargoAdded"
  />

  <ContainerCargoOrderImportModal
    v-model:visible="cargoImportVisible"
    :container-order-id="detail?.id"
    @submitted="onCargoAdded"
  />
</template>

<style scoped>
/* 描述列表内表单控件 90% 宽，右侧留边距 */
.oms-detail-drawer :deep(.n-descriptions-table) {
  table-layout: fixed;
  width: 100%;
}

.oms-detail-drawer :deep(.n-descriptions-table-content) {
  width: 100%;
}

.oms-detail-drawer :deep(.oms-desc-field) {
  display: block;
  width: 90%;
  max-width: 90%;
}

.oms-detail-drawer :deep(.oms-desc-field .n-base-selection),
.oms-detail-drawer :deep(.oms-desc-field.n-date-picker) {
  width: 100%;
}
</style>
