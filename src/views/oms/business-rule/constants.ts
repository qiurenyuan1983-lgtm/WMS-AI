export const RULE_CATEGORIES: Array<{ key: Api.Oms.BusinessRuleCategory; label: string }> = [
  { key: 'ORDER', label: '订单规则' },
  { key: 'INBOUND_DEVANNING', label: '入库与拆柜' },
  { key: 'LOCATION', label: '库位推荐' },
  { key: 'DISPATCH', label: '调度与车次' },
  { key: 'OUTBOUND', label: '出库与装车' },
  { key: 'EXCEPTION_ALERT', label: '异常与预警' },
  { key: 'FEE_BILL', label: '费用与账单' },
  { key: 'NOTIFY_TASK', label: '通知与任务' }
];

export const TRIGGER_EVENTS: Record<Api.Oms.BusinessRuleCategory, CommonType.Option[]> = {
  ORDER: [
    { label: '创建订单', value: 'ORDER_CREATE' },
    { label: '提交订单', value: 'ORDER_SUBMIT' },
    { label: '进入待排车池', value: 'ORDER_ENTER_OUTBOUND_POOL' },
    { label: '订单工作台同步', value: 'ORDER_WORKBENCH_SYNC' },
    { label: '订单池归类', value: 'ORDER_WORKBENCH_CLASSIFY_POOL' },
    { label: '工作台状态映射', value: 'ORDER_WORKBENCH_MAP_STATUS' },
    { label: '工作台生成车次', value: 'ORDER_WORKBENCH_GENERATE_TRIP' }
  ],
  INBOUND_DEVANNING: [
    { label: '车辆到仓', value: 'VEHICLE_ARRIVED' },
    { label: '海柜已到仓', value: 'CONTAINER_ARRIVED' },
    { label: '拆柜完成', value: 'DEVANNING_COMPLETE' },
    { label: '上架确认', value: 'PUTAWAY_CONFIRM' },
    { label: '库位推荐', value: 'PUTAWAY_RECOMMEND' }
  ],
  LOCATION: [
    { label: '库位推荐', value: 'PUTAWAY_RECOMMEND' },
    { label: '拆柜完成', value: 'DEVANNING_COMPLETE' }
  ],
  DISPATCH: [
    { label: '自动合并车次', value: 'TRIP_AUTO_MERGE' },
    { label: '生成车次', value: 'TRIP_CREATE' }
  ],
  OUTBOUND: [
    { label: '扫描装车', value: 'LOAD_SCAN_PALLET' },
    { label: '确认装车完成', value: 'LOAD_COMPLETE' },
    { label: '放行出场', value: 'GATE_RELEASE' }
  ],
  EXCEPTION_ALERT: [
    { label: 'SLA 定时扫描', value: 'SLA_TIMER' },
    { label: '收货差异', value: 'RECEIVE_DIFF' }
  ],
  FEE_BILL: [
    { label: '拆柜完成', value: 'DEVANNING_COMPLETE' },
    { label: '生成账单', value: 'BILL_GENERATE' }
  ],
  NOTIFY_TASK: [
    { label: '拆柜 SLA 超时', value: 'DEVANNING_SLA_BREACH' },
    { label: '通用超时', value: 'GENERIC_SLA_BREACH' }
  ]
};

export const ACTION_TYPE_OPTIONS: CommonType.Option[] = [
  { label: '禁止流转', value: 'FORBID_FLOW' },
  { label: '禁止装车', value: 'FORBID_LOAD' },
  { label: '禁止上架', value: 'FORBID_PUTAWAY' },
  { label: '推荐库区', value: 'RECOMMEND_ZONE' },
  { label: '推荐 DOCK', value: 'RECOMMEND_DOCK' },
  { label: '禁止进入区域', value: 'FORBID_ZONE' },
  { label: '自动合并车次', value: 'MERGE_TRIP' },
  { label: '计算费用', value: 'CALC_FEE' },
  { label: '通知', value: 'NOTIFY' },
  { label: '升级通知', value: 'NOTIFY_ESCALATE' },
  { label: '创建任务', value: 'CREATE_TASK' },
  { label: '排除工作台订单', value: 'EXCLUDE_WORKBENCH' },
  { label: '要求已入库', value: 'REQUIRE_INBOUND' },
  { label: '分配订单池', value: 'ASSIGN_WORKBENCH_POOL' },
  { label: '设置工作台状态', value: 'SET_WORKBENCH_STATUS' },
  { label: '禁止生成车次', value: 'FORBID_GENERATE_TRIP' }
];

export const CUSTOMER_SCOPE_OPTIONS: CommonType.Option[] = [
  { label: '全部客户', value: 'ALL' },
  { label: '演示客户 A', value: '演示客户 A' },
  { label: '演示客户 B', value: '演示客户 B' },
  { label: '演示客户 C', value: '演示客户 C' },
  { label: '演示客户 D', value: '演示客户 D' },
  { label: 'Anker Innovations', value: 'Anker' },
  { label: 'Pacific Goods Inc', value: 'Pacific Goods Inc' }
];

export const BIZ_TYPE_SCOPE_OPTIONS: CommonType.Option[] = [
  { label: '全部业务', value: 'ALL' },
  { label: '整送', value: '整送' },
  { label: '拆送', value: '拆送' },
  { label: '中转', value: '中转' },
  { label: '仓储', value: '仓储' },
  { label: '同行散板', value: '同行散板' },
  { label: '亚马逊 FBA', value: 'AMAZON' },
  { label: '卡车 LTL', value: 'LTL' }
];

export type { ConditionFieldDef } from './utils/system-menu-fields';
import {
  getFieldDef as resolveFieldDef,
  getMenuLabel,
  getSystemConditionMenuConfig,
  inferMenuFromField as resolveMenuFromField
} from './utils/system-menu-fields';

const { menuOptions, fieldsByMenu } = getSystemConditionMenuConfig();

/** 与系统菜单「字段显示」权限一致的菜单与字段 */
export const CONDITION_MENU_OPTIONS: CommonType.Option[] = menuOptions;
export const CONDITION_FIELDS_BY_MENU = fieldsByMenu;

export const CONDITION_FIELD_OPTIONS: CommonType.Option[] = Object.values(CONDITION_FIELDS_BY_MENU)
  .flat()
  .map(item => ({ label: item.label, value: item.value }));

export { getMenuLabel };
export const inferMenuFromField = resolveMenuFromField;
export const getFieldDef = resolveFieldDef;

export const TRIGGER_EVENT_LABEL: Record<string, string> = Object.values(TRIGGER_EVENTS)
  .flat()
  .reduce<Record<string, string>>((acc, item) => {
    acc[String(item.value)] = String(item.label);
    return acc;
  }, {});

export const OP_OPTIONS: CommonType.Option[] = [
  { label: '等于', value: 'EQ' },
  { label: '不等于', value: 'NEQ' },
  { label: '包含于', value: 'IN' },
  { label: '为空', value: 'IS_NULL' },
  { label: '不为空', value: 'IS_NOT_NULL' },
  { label: '大于', value: 'GT' },
  { label: '大于等于', value: 'GTE' },
  { label: '小于', value: 'LT' },
  { label: '小于等于', value: 'LTE' }
];

export const NOTIFY_TARGET_OPTIONS: CommonType.Option[] = [
  { label: '客服', value: 'CS' },
  { label: '调度', value: 'DISPATCH' },
  { label: '出库主管', value: 'OUTBOUND_SUPERVISOR' },
  { label: 'QC', value: 'QC' },
  { label: '拆柜组长', value: 'DEVANNING_LEADER' },
  { label: '仓库主管', value: 'WAREHOUSE_SUPERVISOR' },
  { label: '仓库经理', value: 'WAREHOUSE_MANAGER' }
];
