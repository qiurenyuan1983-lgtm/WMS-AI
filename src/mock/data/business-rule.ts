import { matchBusinessRule, parseRuleActions } from '@/utils/oms/business-rule-evaluator';
import { registerOrderWorkbenchRuleProvider } from '@/utils/oms/order-workbench-rules';
import { MOCK_WAREHOUSE } from './common';

const whIds = JSON.stringify([MOCK_WAREHOUSE.id]);

function cond(logic: 'AND' | 'OR', conditions: Api.Oms.BusinessRuleCondition[]) {
  return JSON.stringify({ logic, conditions });
}

function acts(actions: Api.Oms.BusinessRuleAction[]) {
  return JSON.stringify(actions);
}

export const MOCK_BUSINESS_RULES: Api.Oms.BusinessRule[] = [
  {
    id: 910001,
    ruleCode: 'ORD-0001',
    ruleName: '亚马逊订单缺少 FBA Shipment ID 禁止进排车池',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'AMAZON',
    triggerEvent: 'ORDER_ENTER_OUTBOUND_POOL',
    conditionConfig: cond('AND', [
      { field: 'order.platform_code', op: 'EQ', value: 'Amazon' },
      { field: 'order.fba_shipment_id', op: 'IS_NULL' }
    ]),
    actionsConfig: acts([
      {
        level: 'BLOCK',
        type: 'FORBID_FLOW',
        message: '禁止订单进入待排车池：FBA Shipment ID 为空',
        notifyTargets: ['CS', 'DISPATCH'],
        params: { exceptionType: 'ORDER_DATA_MISSING', targetNode: 'OUTBOUND_POOL' }
      }
    ]),
    priorityTier: 'P0',
    priority: 100,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 128,
    hitSuccessRate: 0.96,
    exceptionCount: 5,
    remark: '订单资料完整性校验',
    createTime: '2026-05-01 09:00:00',
    updateTime: '2026-06-01 10:00:00'
  },
  {
    id: 910002,
    ruleCode: 'LOC-0001',
    ruleName: '高货值货物自动分配贵品区',
    category: 'LOCATION',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'PUTAWAY_RECOMMEND',
    conditionConfig: cond('OR', [
      { field: 'cargo.high_value_flag', op: 'EQ', value: '1' },
      { field: 'order.customer_name', op: 'EQ', value: 'Anker' }
    ]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'RECOMMEND_ZONE',
        message: '推荐库区：贵品区 A-VIP',
        params: { zoneCodes: ['A-VIP'], preferConsolidate: true, allowSplit: false }
      },
      {
        level: 'HINT',
        type: 'RECOMMEND_DOCK',
        message: '建议使用高货值专用 DOCK',
        params: { dockCode: 'DOC-VIP-01' }
      }
    ]),
    priorityTier: 'P1',
    priority: 90,
    conflictStrategy: 'ALL_NON_BLOCK',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 2,
    approverName: '仓库经理',
    creatorName: 'admin',
    hitCount: 456,
    hitSuccessRate: 0.88,
    exceptionCount: 12,
    remark: null,
    createTime: '2026-05-02 09:00:00',
    updateTime: '2026-06-02 14:00:00'
  },
  {
    id: 910003,
    ruleCode: 'OUT-0001',
    ruleName: '扫描卡板目的地与车次不一致禁止装车',
    category: 'OUTBOUND',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'LOAD_SCAN_PALLET',
    conditionConfig: cond('AND', [
      { field: 'load.pallet_destination', op: 'IS_NOT_NULL' },
      { field: 'trip.destination', op: 'IS_NOT_NULL' }
    ]),
    actionsConfig: acts([
      {
        level: 'BLOCK',
        type: 'FORBID_LOAD',
        message: '目的地不一致，禁止装车',
        notifyTargets: ['OUTBOUND_SUPERVISOR', 'QC'],
        params: { pdaAlert: 'RED', recordException: 'DESTINATION_MISMATCH' }
      }
    ]),
    priorityTier: 'P0',
    priority: 100,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '出库主管',
    creatorName: 'admin',
    hitCount: 67,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-05-03 09:00:00',
    updateTime: '2026-06-03 09:00:00'
  },
  {
    id: 910004,
    ruleCode: 'INB-0001',
    ruleName: '板贴未扫描禁止上架',
    category: 'INBOUND_DEVANNING',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'PUTAWAY_CONFIRM',
    conditionConfig: cond('AND', [{ field: 'pallet.label_scanned', op: 'EQ', value: '0' }]),
    actionsConfig: acts([
      {
        level: 'BLOCK',
        type: 'FORBID_PUTAWAY',
        message: '板贴未扫描，禁止上架',
        params: { requireScan: 'PALLET_LABEL' }
      }
    ]),
    priorityTier: 'P0',
    priority: 95,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '拆柜组长',
    creatorName: 'admin',
    hitCount: 210,
    hitSuccessRate: 0.99,
    exceptionCount: 2,
    remark: null,
    createTime: '2026-05-04 09:00:00',
    updateTime: '2026-06-04 09:00:00'
  },
  {
    id: 910005,
    ruleCode: 'DSP-0001',
    ruleName: '相同目的地与 ISA 自动合并车次',
    category: 'DISPATCH',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'AMAZON',
    triggerEvent: 'TRIP_AUTO_MERGE',
    conditionConfig: cond('AND', [
      { field: 'trip.same_destination', op: 'EQ', value: '1' },
      { field: 'trip.same_isa', op: 'EQ', value: '1' },
      { field: 'trip.total_pallets', op: 'LTE', value: '26' }
    ]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'MERGE_TRIP',
        message: '自动合并为一个车次',
        params: { vehicleType: '53FT', requireManualConfirm: false }
      }
    ]),
    priorityTier: 'P4',
    priority: 40,
    conflictStrategy: 'FIRST_MATCH',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '调度主管',
    creatorName: 'admin',
    hitCount: 89,
    hitSuccessRate: 0.92,
    exceptionCount: 7,
    remark: null,
    createTime: '2026-05-05 09:00:00',
    updateTime: '2026-06-05 09:00:00'
  },
  {
    id: 910006,
    ruleCode: 'ALT-0001',
    ruleName: '海柜到仓 2 小时未开始拆柜预警',
    category: 'EXCEPTION_ALERT',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'SLA_TIMER',
    conditionConfig: cond('AND', [
      { field: 'container.arrived_hours', op: 'GTE', value: '2' },
      { field: 'devanning.started', op: 'EQ', value: '0' }
    ]),
    actionsConfig: acts([
      {
        level: 'WARN',
        type: 'NOTIFY',
        message: '海柜已到仓超过 2 小时未开始拆柜',
        notifyTargets: ['DEVANNING_LEADER', 'WAREHOUSE_SUPERVISOR'],
        params: { alertOnly: true }
      }
    ]),
    priorityTier: 'P5',
    priority: 10,
    conflictStrategy: 'ALL_NON_BLOCK',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: null,
    creatorName: 'admin',
    hitCount: 34,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: '预警规则，不阻断流程',
    createTime: '2026-05-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910007,
    ruleCode: 'FEE-0001',
    ruleName: '40/45 尺海柜拆柜基础费',
    category: 'FEE_BILL',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'DEVANNING_COMPLETE',
    conditionConfig: cond('OR', [
      { field: 'container.container_type', op: 'EQ', value: '40HQ' },
      { field: 'container.container_type', op: 'EQ', value: '45HQ' }
    ]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'CALC_FEE',
        message: '生成拆柜应付费用',
        params: { baseFee: 180, bonus: 20, totalPayable: 200, currency: 'USD' }
      }
    ]),
    priorityTier: 'P3',
    priority: 50,
    conflictStrategy: 'FIRST_MATCH',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '财务',
    creatorName: 'admin',
    hitCount: 156,
    hitSuccessRate: 0.98,
    exceptionCount: 3,
    remark: null,
    createTime: '2026-05-07 09:00:00',
    updateTime: '2026-06-07 09:00:00'
  },
  {
    id: 910008,
    ruleCode: 'NTF-0001',
    ruleName: '拆柜超时升级通知链',
    category: 'NOTIFY_TASK',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'DEVANNING_SLA_BREACH',
    conditionConfig: cond('AND', [{ field: 'devanning.overdue_minutes', op: 'GTE', value: '30' }]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'NOTIFY_ESCALATE',
        message: '拆柜任务超时，按分钟升级通知',
        notifyTargets: ['DEVANNING_LEADER'],
        params: { escalateAtMinutes: [30, 60, 120], channels: ['IN_APP', 'WECHAT'] }
      }
    ]),
    priorityTier: 'P5',
    priority: 20,
    conflictStrategy: 'ALL_NON_BLOCK',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: null,
    creatorName: 'admin',
    hitCount: 22,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-05-08 09:00:00',
    updateTime: '2026-06-08 09:00:00'
  },
  {
    id: 910101,
    ruleCode: 'RUL-910101',
    ruleName: '已到仓海柜预计拆柜时段提醒',
    category: 'INBOUND_DEVANNING',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: null,
    conditionConfig: cond('AND', [
      { field: 'oms_container-order.containerStatus', op: 'IN', value: ['ARRIVED_WAREHOUSE'] },
      { field: 'oms_container-order.expectedDevanningTime', op: 'EQ', value: 'TODAY' }
    ]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'RECOMMEND_DOCK',
        message: '海柜已到仓且预计今日拆柜，请关注拆柜排期',
        notifyTargets: ['DEVANNING_LEADER', 'DISPATCH'],
        execMenuPage: 'wms_devanning-work',
        params: { execMenuPage: 'wms_devanning-work', dockCode: 'DOC-01' }
      }
    ]),
    priorityTier: 'P2',
    priority: 70,
    conflictStrategy: 'ALL_NON_BLOCK',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 34,
    hitSuccessRate: 0.91,
    exceptionCount: 2,
    remark: '无触发事件，仅按条件组合匹配',
    createTime: '2026-06-03 10:00:00',
    updateTime: '2026-06-03 10:00:00'
  },
  {
    id: 910201,
    ruleCode: 'ORD-WB-001',
    ruleName: '工作台排除：订单已标记取消',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_SYNC',
    conditionConfig: cond('AND', [{ field: 'oms_order-workbench.excluded', op: 'EQ', value: '1' }]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'EXCLUDE_WORKBENCH',
        message: '订单已从工作台移除',
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P0',
    priority: 100,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 12,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: '订单工作台同步规则',
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910202,
    ruleCode: 'ORD-WB-002',
    ruleName: '工作台排除：已生成车次',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_SYNC',
    conditionConfig: cond('OR', [
      { field: 'oms_order-workbench.status', op: 'EQ', value: 'GENERATED' },
      { field: 'oms_order-workbench.generated_trip_no', op: 'IS_NOT_NULL' },
      {
        field: 'oms_cargo-order.fulfillmentStatus',
        op: 'IN',
        value: ['OUTBOUND_ORDERED', 'DELIVERY_APPOINTED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED']
      }
    ]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'EXCLUDE_WORKBENCH',
        message: '已生成车次，不再展示于订单工作台',
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P0',
    priority: 95,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 86,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: '与订单管理车次状态同步',
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910203,
    ruleCode: 'ORD-WB-003',
    ruleName: '工作台入池：仅已入库订单',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_SYNC',
    conditionConfig: cond('AND', [{ field: 'oms_cargo-order.fulfillmentStatus', op: 'NEQ', value: 'INBOUNDED' }]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'REQUIRE_INBOUND',
        message: '未入库完成，不可进入订单工作台',
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P1',
    priority: 90,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 45,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: '履约状态门槛',
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910204,
    ruleCode: 'ORD-WB-010',
    ruleName: '订单池归类：快递订单池',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_CLASSIFY_POOL',
    conditionConfig: cond('AND', [
      { field: 'oms_cargo-order.parcelCarrierName', op: 'IS_NOT_NULL' },
      { field: 'oms_cargo-order.declaredCartonQty', op: 'GT', value: '0' },
      { field: 'oms_cargo-order.declaredPalletQty', op: 'LTE', value: '0' }
    ]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'ASSIGN_WORKBENCH_POOL',
        message: '归入快递订单池',
        params: { pool: 'EXPRESS' },
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P2',
    priority: 80,
    conflictStrategy: 'FIRST_MATCH',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 8,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910205,
    ruleCode: 'ORD-WB-011',
    ruleName: '订单池归类：LTL 订单池',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'LTL',
    triggerEvent: 'ORDER_WORKBENCH_CLASSIFY_POOL',
    conditionConfig: cond('AND', [{ field: 'oms_cargo-order.groupCode', op: 'IN', value: ['LTL-DAL', 'LTL'] }]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'ASSIGN_WORKBENCH_POOL',
        message: '归入 LTL 订单池',
        params: { pool: 'LTL' },
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P2',
    priority: 75,
    conflictStrategy: 'FIRST_MATCH',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 5,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910206,
    ruleCode: 'ORD-WB-012',
    ruleName: '订单池归类：本地/商业地址池',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_CLASSIFY_POOL',
    conditionConfig: cond('AND', [
      { field: 'oms_cargo-order.addressType', op: 'IN', value: ['COMMERCIAL', 'RESIDENTIAL', 'SELF_PICKUP'] }
    ]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'ASSIGN_WORKBENCH_POOL',
        message: '归入本地/商业地址订单池',
        params: { pool: 'LOCAL' },
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P2',
    priority: 70,
    conflictStrategy: 'FIRST_MATCH',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 16,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910207,
    ruleCode: 'ORD-WB-020',
    ruleName: '工作台状态：异常订单',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_MAP_STATUS',
    conditionConfig: cond('AND', [{ field: 'oms_cargo-order.exceptionFlag', op: 'EQ', value: '1' }]),
    actionsConfig: acts([
      {
        level: 'AUTO',
        type: 'SET_WORKBENCH_STATUS',
        message: '标记为异常订单',
        params: { status: 'ABNORMAL' },
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P1',
    priority: 85,
    conflictStrategy: 'FIRST_MATCH',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 3,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910208,
    ruleCode: 'ORD-WB-030',
    ruleName: '生成车次：暂扣订单禁止生成',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_GENERATE_TRIP',
    conditionConfig: cond('OR', [
      { field: 'oms_cargo-order.holdFlag', op: 'EQ', value: '1' },
      { field: 'oms_cargo-order.holdStatus', op: 'EQ', value: 'HOLDING' }
    ]),
    actionsConfig: acts([
      {
        level: 'BLOCK',
        type: 'FORBID_GENERATE_TRIP',
        message: '订单处于暂扣，禁止生成车次',
        notifyTargets: ['CS', 'DISPATCH'],
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P0',
    priority: 100,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 4,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910209,
    ruleCode: 'ORD-WB-031',
    ruleName: '生成车次：快递订单禁止生成',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: 'ORDER_WORKBENCH_GENERATE_TRIP',
    conditionConfig: cond('AND', [{ field: 'oms_order-workbench.pool', op: 'EQ', value: 'EXPRESS' }]),
    actionsConfig: acts([
      {
        level: 'BLOCK',
        type: 'FORBID_GENERATE_TRIP',
        message: '快递订单不支持生成车次',
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P0',
    priority: 95,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 2,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 910210,
    ruleCode: 'ORD-WB-032',
    ruleName: '生成车次：LTL 未匹配供应商禁止生成',
    category: 'ORDER',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerScope: 'ALL',
    bizTypeScope: 'LTL',
    triggerEvent: 'ORDER_WORKBENCH_GENERATE_TRIP',
    conditionConfig: cond('AND', [
      { field: 'oms_order-workbench.pool', op: 'EQ', value: 'LTL' },
      { field: 'oms_cargo-order.supplierName', op: 'IS_NULL' }
    ]),
    actionsConfig: acts([
      {
        level: 'BLOCK',
        type: 'FORBID_GENERATE_TRIP',
        message: 'LTL 订单请先在详情中匹配供应商',
        execMenuPage: 'oms_order-workbench'
      }
    ]),
    priorityTier: 'P0',
    priority: 90,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: '运营主管',
    creatorName: 'admin',
    hitCount: 6,
    hitSuccessRate: 1,
    exceptionCount: 0,
    remark: null,
    createTime: '2026-06-06 09:00:00',
    updateTime: '2026-06-06 09:00:00'
  }
];

let ruleSeq = 910211;

function matchRule(rule: Api.Oms.BusinessRule, context: Record<string, unknown>) {
  return matchBusinessRule(rule, context);
}

registerOrderWorkbenchRuleProvider(() => MOCK_BUSINESS_RULES);

export function listBusinessRules() {
  return MOCK_BUSINESS_RULES;
}

export function getBusinessRuleList(params?: Record<string, any>) {
  let rows = [...MOCK_BUSINESS_RULES];
  if (params?.category) rows = rows.filter(r => r.category === params.category);
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.priorityTier) rows = rows.filter(r => r.priorityTier === params.priorityTier);
  if (params?.triggerEvent) rows = rows.filter(r => r.triggerEvent === params.triggerEvent);
  if (params?.ruleName) {
    const k = String(params.ruleName).toLowerCase();
    rows = rows.filter(r => r.ruleName.toLowerCase().includes(k) || r.ruleCode.toLowerCase().includes(k));
  }
  if (params?.warehouseId) {
    rows = rows.filter(r => {
      try {
        const ids = JSON.parse(r.warehouseIds || '[]') as string[];
        return ids.includes(String(params.warehouseId));
      } catch {
        return true;
      }
    });
  }
  rows.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const pageNum = Number(params?.pageNum || 1);
  const pageSize = Number(params?.pageSize || 10);
  const start = (pageNum - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, pageNum, pageSize };
}

export function getBusinessRuleDetail(id: number | string) {
  return MOCK_BUSINESS_RULES.find(r => String(r.id) === String(id)) ?? null;
}

export function createBusinessRule(data: Api.Oms.BusinessRuleOperateParams) {
  const row: Api.Oms.BusinessRule = {
    id: ruleSeq++,
    ruleCode: data.ruleCode || `RUL-${ruleSeq}`,
    ruleName: data.ruleName,
    category: data.category,
    warehouseIds: data.warehouseIds,
    warehouseName: data.warehouseNames ?? null,
    customerScope: data.customerScope ?? 'ALL',
    bizTypeScope: data.bizTypeScope ?? 'ALL',
    triggerEvent: data.triggerEvent ?? null,
    conditionConfig: data.conditionConfig,
    actionsConfig: data.actionsConfig,
    priorityTier: data.priorityTier ?? 'P3',
    priority: data.priority ?? 50,
    conflictStrategy: data.conflictStrategy ?? 'FIRST_BLOCK_WINS',
    effectiveStart: data.effectiveStart ?? null,
    effectiveEnd: data.effectiveEnd ?? null,
    status: data.status ?? 'draft',
    version: 1,
    approverName: null,
    creatorName: 'admin',
    hitCount: 0,
    hitSuccessRate: null,
    exceptionCount: 0,
    remark: data.remark ?? null,
    createTime: '2026-06-03 12:00:00',
    updateTime: '2026-06-03 12:00:00'
  };
  MOCK_BUSINESS_RULES.unshift(row);
  return row;
}

export function updateBusinessRule(data: Api.Oms.BusinessRuleOperateParams) {
  const idx = MOCK_BUSINESS_RULES.findIndex(r => String(r.id) === String(data.id));
  if (idx < 0) return null;
  const prev = MOCK_BUSINESS_RULES[idx];
  MOCK_BUSINESS_RULES[idx] = {
    ...prev,
    ...data,
    warehouseName: data.warehouseNames ?? prev.warehouseName,
    version: (prev.version || 1) + 1,
    updateTime: '2026-06-03 12:00:00'
  } as Api.Oms.BusinessRule;
  return MOCK_BUSINESS_RULES[idx];
}

export function deleteBusinessRule(ids: string) {
  const set = new Set(ids.split(','));
  for (let i = MOCK_BUSINESS_RULES.length - 1; i >= 0; i--) {
    if (set.has(String(MOCK_BUSINESS_RULES[i].id))) MOCK_BUSINESS_RULES.splice(i, 1);
  }
  return true;
}

export function setBusinessRuleStatus(id: number | string, status: Api.Oms.BusinessRuleStatus) {
  const row = MOCK_BUSINESS_RULES.find(r => String(r.id) === String(id));
  if (!row) return null;
  row.status = status;
  row.updateTime = '2026-06-03 12:00:00';
  return row;
}

function buildDraftRule(params: Api.Oms.BusinessRuleTestParams): Api.Oms.BusinessRule {
  const draft = params.draft!;
  return {
    id: params.ruleId ?? 'draft',
    ruleCode: 'DRAFT',
    ruleName: draft.ruleName || '当前编辑规则',
    category: 'ORDER',
    warehouseIds: '[]',
    warehouseName: null,
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: draft.triggerEvent ?? null,
    conditionConfig: draft.conditionConfig,
    actionsConfig: draft.actionsConfig,
    priorityTier: 'P3',
    priority: draft.priority ?? 50,
    conflictStrategy: draft.conflictStrategy ?? 'FIRST_BLOCK_WINS',
    effectiveStart: null,
    effectiveEnd: null,
    status: 'enabled',
    version: 1,
    approverName: null,
    creatorName: 'admin',
    hitCount: 0,
    hitSuccessRate: null,
    exceptionCount: 0,
    remark: null,
    createTime: null,
    updateTime: null
  };
}

export function testBusinessRule(params: Api.Oms.BusinessRuleTestParams): Api.Oms.BusinessRuleTestResult {
  const context = params.context || {};
  let rules: Api.Oms.BusinessRule[];
  if (params.draft) {
    rules = [buildDraftRule(params)];
  } else {
    rules = MOCK_BUSINESS_RULES.filter(r => r.status === 'enabled');
    if (params.ruleId) rules = rules.filter(r => String(r.id) === String(params.ruleId));
  }
  if (params.triggerEvent) {
    rules = rules.filter(r => !r.triggerEvent || r.triggerEvent === params.triggerEvent);
  }
  rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const hitRules: Array<{ rule: Api.Oms.BusinessRule; details: Api.Oms.BusinessRuleTestResult['conditionDetails'] }> = [];
  for (const rule of rules) {
    const { matched, details } = matchRule(rule, context);
    if (matched) hitRules.push({ rule, details });
  }

  if (!hitRules.length) {
    const probeRule = rules[0];
    const probeDetails = probeRule ? matchRule(probeRule, context).details : [];
    return {
      matched: false,
      verified: false,
      message: '未命中任何规则',
      conditionDetails: probeDetails,
      ruleName: probeRule?.ruleName,
      ruleCode: probeRule?.ruleCode
    };
  }

  const primary = hitRules[0].rule;
  const allActions = hitRules.flatMap(h => JSON.parse(h.rule.actionsConfig || '[]') as Api.Oms.BusinessRuleAction[]);
  const blockAction = allActions.find(a => a.level === 'BLOCK');
  const finalDecision = blockAction?.level || allActions[0]?.level || 'HINT';

  const conflictNotes =
    hitRules.length > 1
      ? [`共命中 ${hitRules.length} 条规则，冲突策略：${primary.conflictStrategy}，最终决策：${finalDecision}`]
      : null;

  if (params.ruleId) {
    primary.hitCount = (primary.hitCount || 0) + 1;
  }

  const conditionDetails = hitRules[0].details;
  return {
    matched: true,
    verified: conditionDetails.every(item => item.hit),
    ruleId: primary.id,
    ruleCode: primary.ruleCode,
    ruleName: primary.ruleName,
    priorityTier: primary.priorityTier,
    finalDecision,
    actions: allActions,
    message: blockAction?.message || allActions[0]?.message || '规则命中',
    conditionDetails,
    conflictNotes
  };
}
