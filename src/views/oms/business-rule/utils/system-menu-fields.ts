import zhCN from '@/locales/langs/zh-cn';
import { getPageListFields } from '@/constants/page-list-fields';
import { buildSystemMenuFlat } from '@/mock/data/system-menu-seed';
import { inferFieldValueType } from './condition-time-range';

export type ConditionFieldDef = {
  label: string;
  value: string;
  /** 有选项时走「状态」多选；无选项时走自定义值输入 */
  statuses?: CommonType.Option[];
  /** 时间类字段走时间段选择 */
  valueType?: 'text' | 'datetime';
};

const YES_NO_OPTIONS: CommonType.Option[] = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
];

const CONTAINER_STATUS_OPTIONS: CommonType.Option[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '待受理', value: 'PENDING_ACCEPT' },
  { label: '在途', value: 'IN_TRANSIT' },
  { label: '已到港', value: 'ARRIVED_PORT' },
  { label: 'HOLD中', value: 'HOLDING' },
  { label: '查验中', value: 'EXAMINING' },
  { label: '已可提', value: 'AVAILABLE_FOR_PICKUP' },
  { label: '已预约提柜', value: 'PICKUP_APPOINTED' },
  { label: '已提柜', value: 'PICKED_UP' },
  { label: '已到仓', value: 'ARRIVED_WAREHOUSE' },
  { label: '拆柜中', value: 'DEVANNING' },
  { label: '拆柜完成', value: 'DEVANNED' },
  { label: '已还柜', value: 'EMPTY_RETURNED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' }
];

const TERMINAL_RELEASE_OPTIONS: CommonType.Option[] = [
  { label: '无', value: 'NONE' },
  { label: 'HOLD', value: 'HOLD' },
  { label: 'release', value: 'RELEASE' }
];

const EXAM_STATUS_OPTIONS: CommonType.Option[] = [
  { label: '无', value: 'NONE' },
  { label: '查验中', value: 'EXAMINING' },
  { label: '查验完成', value: 'EXAMINED' }
];

const ORDER_SOURCE_OPTIONS: CommonType.Option[] = [
  { label: '自建单', value: 'SELF' },
  { label: 'API下单', value: 'API' },
  { label: '客户门户下单', value: 'PORTAL' }
];

const CONTAINER_TYPE_OPTIONS: CommonType.Option[] = [
  { label: '20GP', value: '20GP' },
  { label: '40GP', value: '40GP' },
  { label: '40HQ', value: '40HQ' },
  { label: '45HQ', value: '45HQ' }
];

const GENERIC_STATUS_OPTIONS: CommonType.Option[] = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
];

const CUSTOMER_STATUS_OPTIONS: CommonType.Option[] = [
  { label: '演示客户 A', value: '演示客户 A' },
  { label: '演示客户 B', value: '演示客户 B' },
  { label: '演示客户 C', value: '演示客户 C' },
  { label: '演示客户 D', value: '演示客户 D' },
  { label: 'Anker Innovations', value: 'Anker' },
  { label: 'Pacific Goods Inc', value: 'Pacific Goods Inc' }
];

const ROUTE_STATUS_OVERRIDES: Record<string, Record<string, CommonType.Option[]>> = {
  'oms_container-order': {
    containerStatus: CONTAINER_STATUS_OPTIONS,
    terminalReleaseStatus: TERMINAL_RELEASE_OPTIONS,
    examStatus: EXAM_STATUS_OPTIONS,
    orderSource: ORDER_SOURCE_OPTIONS,
    containerType: CONTAINER_TYPE_OPTIONS,
    containerExceptionFlag: YES_NO_OPTIONS,
    downstreamExceptionFlag: YES_NO_OPTIONS
  },
  'oms_cargo-order': {
    fulfillmentStatus: [
      { label: '已入库', value: 'INBOUNDED' },
      { label: '已出单', value: 'OUTBOUND_ORDERED' },
      { label: '已出库', value: 'OUTBOUNDED' },
      { label: '已签收', value: 'DELIVERED' },
      { label: '已完成', value: 'COMPLETED' }
    ],
    preOutboundStatus: [
      { label: '无', value: 'NONE' },
      { label: '预出单', value: 'PRE_CREATED' },
      { label: '已转换', value: 'CONVERTED' }
    ],
    outboundOrderStatus: [
      { label: '无', value: 'NONE' },
      { label: '已出单', value: 'CREATED' }
    ],
    addressType: [
      { label: '平台仓', value: 'PLATFORM_WH' },
      { label: '商业地址', value: 'COMMERCIAL' },
      { label: '住宅', value: 'RESIDENTIAL' },
      { label: '自提', value: 'SELF_PICKUP' }
    ],
    exceptionFlag: YES_NO_OPTIONS,
    holdFlag: YES_NO_OPTIONS,
    holdStatus: [
      { label: '正常', value: 'NORMAL' },
      { label: '暂扣中', value: 'HOLDING' }
    ]
  },
  'oms_order-workbench': {
    excluded: YES_NO_OPTIONS,
    status: [
      { label: '待预约', value: 'PENDING_APPT' },
      { label: '预出车次', value: 'PRE_TRIP' },
      { label: '待人工确认', value: 'PENDING_MANUAL' },
      { label: '异常', value: 'ABNORMAL' },
      { label: '已生成', value: 'GENERATED' }
    ],
    pool: [
      { label: '平台预约', value: 'PLATFORM' },
      { label: 'LTL', value: 'LTL' },
      { label: '本地', value: 'LOCAL' },
      { label: '快递', value: 'EXPRESS' }
    ]
  }
};

/** 历史规则字段（旧版 domain.field），仅用于展示与编辑兼容 */
export const LEGACY_MENU_LABELS: Record<string, string> = {
  container: '海柜',
  order: '订单',
  cargo: '货物',
  devanning: '拆柜',
  load: '装车',
  trip: '车次',
  pallet: '板贴'
};

export const LEGACY_FIELD_DEFS: Record<string, ConditionFieldDef> = {
  'container.status': { label: '海柜状态', value: 'container.status', statuses: CONTAINER_STATUS_OPTIONS },
  'container.container_type': {
    label: '柜型',
    value: 'container.container_type',
    statuses: [
      { label: '20GP', value: '20GP' },
      { label: '40GP', value: '40GP' },
      { label: '40HQ', value: '40HQ' },
      { label: '45HQ', value: '45HQ' }
    ]
  },
  'container.arrived_hours': { label: '到仓时长(小时)', value: 'container.arrived_hours' },
  'order.platform_code': {
    label: '平台',
    value: 'order.platform_code',
    statuses: [
      { label: 'Amazon', value: 'Amazon' },
      { label: 'Walmart', value: 'Walmart' },
      { label: 'Target', value: 'Target' }
    ]
  },
  'order.fba_shipment_id': { label: 'FBA Shipment ID', value: 'order.fba_shipment_id' },
  'order.customer_name': { label: '客户名称', value: 'order.customer_name', statuses: CUSTOMER_STATUS_OPTIONS },
  'cargo.high_value_flag': { label: '高货值标记', value: 'cargo.high_value_flag', statuses: YES_NO_OPTIONS },
  'devanning.started': { label: '是否已开始拆柜', value: 'devanning.started', statuses: YES_NO_OPTIONS },
  'devanning.overdue_minutes': { label: '超时分钟数', value: 'devanning.overdue_minutes' },
  'load.pallet_destination': { label: '卡板目的地', value: 'load.pallet_destination' },
  'trip.destination': { label: '车次目的地', value: 'trip.destination' },
  'trip.same_destination': { label: '同目的地', value: 'trip.same_destination', statuses: YES_NO_OPTIONS },
  'trip.same_isa': { label: '同 ISA', value: 'trip.same_isa', statuses: YES_NO_OPTIONS },
  'trip.total_pallets': { label: '总板数', value: 'trip.total_pallets' },
  'pallet.label_scanned': { label: '板贴已扫描', value: 'pallet.label_scanned', statuses: YES_NO_OPTIONS }
};

function routeMenuLabel(routeKey: string) {
  const routes = zhCN.route as Record<string, string>;
  return routes[routeKey] || routeKey;
}

function resolveFieldStatuses(routeKey: string, fieldKey: string): CommonType.Option[] | undefined {
  const override = ROUTE_STATUS_OVERRIDES[routeKey]?.[fieldKey];
  if (override) return override;
  if (fieldKey === 'status') return GENERIC_STATUS_OPTIONS;
  if (/flag$/i.test(fieldKey) || fieldKey.toLowerCase().includes('hold')) return YES_NO_OPTIONS;
  if (fieldKey === 'customerName') return CUSTOMER_STATUS_OPTIONS;
  return undefined;
}

function buildFromSystemMenu() {
  const flat = buildSystemMenuFlat();
  const menuOptions: CommonType.Option[] = [];
  const fieldsByMenu: Record<string, ConditionFieldDef[]> = {};

  const leafMenus = flat
    .filter(menu => menu.menuType === 'C' && menu.visible === '0')
    .sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0));

  for (const menu of leafMenus) {
    const routeKey = String(menu.menuName).replace(/^route\./, '');
    menuOptions.push({ label: routeMenuLabel(routeKey), value: routeKey });

    fieldsByMenu[routeKey] = getPageListFields(routeKey).map(field => ({
      label: field.label,
      value: `${routeKey}.${field.key}`,
      statuses: resolveFieldStatuses(routeKey, field.key),
      valueType: inferFieldValueType(field.key, field.label)
    }));
  }

  return { menuOptions, fieldsByMenu };
}

let cached: ReturnType<typeof buildFromSystemMenu> | null = null;

export function getSystemConditionMenuConfig() {
  if (!cached) cached = buildFromSystemMenu();
  return cached;
}

export function getMenuLabel(menu: string | null | undefined) {
  if (!menu) return '';
  const { menuOptions } = getSystemConditionMenuConfig();
  return menuOptions.find(item => item.value === menu)?.label || LEGACY_MENU_LABELS[menu] || routeMenuLabel(menu) || menu;
}

export function inferMenuFromField(field?: string | null) {
  if (!field) return null;
  const dot = field.lastIndexOf('.');
  if (dot <= 0) return null;
  const prefix = field.slice(0, dot);
  const { fieldsByMenu } = getSystemConditionMenuConfig();
  if (fieldsByMenu[prefix]) return prefix;
  if (LEGACY_MENU_LABELS[prefix]) return prefix;
  return prefix;
}

export function getFieldDef(menu: string | null | undefined, field: string | null | undefined) {
  if (!field) return undefined;
  if (menu) {
    const { fieldsByMenu } = getSystemConditionMenuConfig();
    const hit = fieldsByMenu[menu]?.find(item => item.value === field);
    if (hit) return hit;
  }
  return LEGACY_FIELD_DEFS[field];
}
