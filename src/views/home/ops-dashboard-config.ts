import type { DataTableColumns } from 'naive-ui';
import type { OpsDashboardTabKey, OpsTableRow } from '@/mock/data/ops-dashboard';

export type OpsDashboardCard = { key: string; label: string; value: string | number; type?: NaiveUI.ThemeColor; hint?: string };

export type OpsDashboardTabDef = {
  key: OpsDashboardTabKey;
  label: string;
  /** 账号视角下可见的角色标识，空则全员可见 */
  roles?: string[];
  cards: OpsDashboardCard[];
  quickActions: string[];
  subViews: string[];
  columns: DataTableColumns<OpsTableRow>;
};

function cols(entries: Array<{ key: string; title: string; width?: number; minWidth?: number }>): DataTableColumns<OpsTableRow> {
  return entries.map(c => ({ ...c, ellipsis: c.minWidth ? { tooltip: true } : undefined }));
}

export const OPS_PERSPECTIVE_OPTIONS = [
  { label: '我的权限（仓库经理）', value: 'manager', roles: ['mine', 'warehouse', 'inbound', 'trip', 'devanning', 'inventory', 'exception', 'supplier', 'finance', 'customer', 'custom', 'config'] },
  { label: '入库主管视角', value: 'inbound_lead', roles: ['mine', 'warehouse', 'inbound', 'devanning', 'inventory', 'exception'] },
  { label: '出库主管视角', value: 'outbound_lead', roles: ['mine', 'trip', 'exception', 'supplier'] },
  { label: '财务视角', value: 'finance', roles: ['mine', 'finance', 'exception', 'supplier'] },
  { label: '客户账号视角', value: 'customer', roles: ['mine', 'trip', 'exception', 'finance', 'customer'] },
  { label: '供应商账号视角', value: 'supplier', roles: ['mine', 'supplier', 'trip', 'finance'] }
];

export const OPS_DASHBOARD_TABS: OpsDashboardTabDef[] = [
  {
    key: 'mine',
    label: '我的看板',
    cards: [
      { key: 'todo', label: '我的待办', value: 12, type: 'warning' },
      { key: 'overdue', label: '我的超时', value: 3, type: 'error' },
      { key: 'approval', label: '待审批', value: 5, type: 'info' },
      { key: 'message', label: '待回复消息', value: 8, type: 'default' },
      { key: 'done', label: '今日完成', value: 26, type: 'success' }
    ],
    quickActions: ['处理待办', '查看消息', '我的审批', '创建异常'],
    subViews: ['全部', '待办', '超时', '今日完成'],
    columns: cols([
      { key: 'title', title: '事项', minWidth: 220 },
      { key: 'type', title: '类型', width: 80 },
      { key: 'priority', title: '优先级', width: 80 },
      { key: 'dueTime', title: '截止时间', width: 158 },
      { key: 'status', title: '状态', width: 90 },
      { key: 'owner', title: '责任人', width: 80 }
    ])
  },
  {
    key: 'warehouse',
    label: '仓库运营',
    cards: [
      { key: 'arrival', label: '今日到仓柜数', value: 18 },
      { key: 'devanningDone', label: '今日拆柜完成', value: 42 },
      { key: 'tripCount', label: '今日车次订单', value: 12 },
      { key: 'loadingDone', label: '今日装车完成', value: 8 },
      { key: 'dockUsage', label: 'DOCK 使用率', value: '78%' },
      { key: 'exception', label: '异常数量', value: 5, type: 'error' }
    ],
    quickActions: ['园区总览', '拆柜调度', '装车看板', '导出报表'],
    subViews: ['今日运营', 'DOCK 占用', '人员效率', '任务完成率'],
    columns: cols([
      { key: 'metric', title: '指标', minWidth: 160 },
      { key: 'value', title: '当前值', width: 100 },
      { key: 'target', title: '目标', width: 100 },
      { key: 'status', title: '状态', width: 100 },
      { key: 'owner', title: '责任组', width: 100 },
      { key: 'exception', title: '异常', width: 80 }
    ])
  },
  {
    key: 'inbound',
    label: '入库数据',
    cards: [
      { key: 'pendingReceive', label: '待收货', value: 6 },
      { key: 'received', label: '已收货', value: 12 },
      { key: 'pendingDevanning', label: '待拆柜', value: 8 },
      { key: 'pendingPutaway', label: '待上架', value: 15 },
      { key: 'putawaying', label: '上架中', value: 7 },
      { key: 'inboundExc', label: '入库异常', value: 2, type: 'error' }
    ],
    quickActions: ['打印卡板贴', '创建入库异常', '查看库存', '查看拆柜进度'],
    subViews: ['全部', '待收货', '拆柜中', '待上架', '异常'],
    columns: cols([
      { key: 'containerNo', title: '柜号', width: 140 },
      { key: 'customer', title: '客户', minWidth: 120 },
      { key: 'eta', title: 'ETA', width: 110 },
      { key: 'dock', title: 'DOCK', width: 72 },
      { key: 'cartonQty', title: '箱数', width: 72 },
      { key: 'palletQty', title: '板数', width: 72 },
      { key: 'location', title: '库位', width: 100 },
      { key: 'devanningStatus', title: '拆柜状态', width: 100 },
      { key: 'putawayStatus', title: '上架状态', width: 100 },
      { key: 'owner', title: '责任人', width: 80 },
      { key: 'exception', title: '异常', width: 90 }
    ])
  },
  {
    key: 'trip',
    label: '车次订单',
    cards: [
      { key: 'pendingPool', label: '待排车订单', value: 24 },
      { key: 'tripCreated', label: '已生成车次', value: 12 },
      { key: 'pendingDriver', label: '待司机确认', value: 3 },
      { key: 'checkedIn', label: '司机已 Check In', value: 2 },
      { key: 'loading', label: '装车中', value: 4 },
      { key: 'departed', label: '已发车', value: 6 }
    ],
    quickActions: ['创建车次', '分配 DOCK', '打印装车单', '通知司机', '确认发车'],
    subViews: ['今日车次', '待装车', '司机已到仓', 'XLX7', '装车异常', '已发车'],
    columns: cols([
      { key: 'tripNo', title: '车次订单号', width: 160 },
      { key: 'destination', title: '目的地', width: 110 },
      { key: 'isa', title: 'ISA', width: 130 },
      { key: 'appointmentTime', title: '预约时间', width: 158 },
      { key: 'customer', title: '客户', minWidth: 120 },
      { key: 'orderCount', title: '订单数', width: 72 },
      { key: 'palletQty', title: '板数', width: 72 },
      { key: 'driver', title: '司机', width: 90 },
      { key: 'supplier', title: '供应商', minWidth: 120 },
      { key: 'dock', title: 'DOCK', width: 72 },
      { key: 'loadingProgress', title: '装车进度', width: 90 },
      { key: 'status', title: '状态', width: 110 },
      { key: 'exception', title: '异常', width: 72 }
    ])
  },
  {
    key: 'devanning',
    label: '拆柜进度',
    cards: [
      { key: 'target', label: '今日目标', value: '65柜', hint: '目标' },
      { key: 'done', label: '已完成', value: '42柜', type: 'success' },
      { key: 'doing', label: '进行中', value: '11柜', type: 'info' },
      { key: 'pending', label: '待拆柜', value: '12柜' },
      { key: 'risk', label: '预计完成', value: '58柜', hint: '低于目标 7 柜', type: 'warning' },
      { key: 'exc', label: '拆柜异常', value: 3, type: 'error' }
    ],
    quickActions: ['拆柜调度', '分配 DOCK', '调整劳务', '创建异常'],
    subViews: ['今日目标', '进行中', '待拆柜', '超时', '异常'],
    columns: cols([
      { key: 'containerNo', title: '柜号', width: 140 },
      { key: 'customer', title: '客户', minWidth: 110 },
      { key: 'targetDate', title: '拆柜日期', width: 110 },
      { key: 'dock', title: 'DOCK', width: 72 },
      { key: 'cartonQty', title: '箱数', width: 72 },
      { key: 'palletQty', title: '板数', width: 72 },
      { key: 'progress', title: '进度', width: 80 },
      { key: 'status', title: '状态', width: 100 },
      { key: 'labor', title: '劳务', width: 90 },
      { key: 'owner', title: '责任人', width: 80 },
      { key: 'exception', title: '异常', width: 100 }
    ])
  },
  {
    key: 'inventory',
    label: '库存库位',
    cards: [
      { key: 'totalPallet', label: '总库存板数', value: 1286 },
      { key: 'emptyLoc', label: '空库位', value: 342 },
      { key: 'highRack', label: '高架占用率', value: '87%' },
      { key: 'floorRack', label: '地面占用率', value: '72%' },
      { key: 'tailPallet', label: '尾板数量', value: 48 },
      { key: 'hold', label: 'HOLD 库存', value: 12, type: 'warning' }
    ],
    quickActions: ['仓库库存', '库位可视化', '打印库位标签', '创建盘点'],
    subViews: ['全部', '尾板', 'HOLD', '高货值', '异常库存'],
    columns: cols([
      { key: 'palletNo', title: '卡板号', width: 150 },
      { key: 'customer', title: '客户', minWidth: 110 },
      { key: 'orderNo', title: '订单号', width: 140 },
      { key: 'location', title: '库位', width: 100 },
      { key: 'destination', title: '目的地', width: 100 },
      { key: 'cartonQty', title: '箱数', width: 72 },
      { key: 'inboundDate', title: '入库日期', width: 110 },
      { key: 'storageDays', title: '库存天数', width: 90 },
      { key: 'status', title: '状态', width: 90 }
    ])
  },
  {
    key: 'exception',
    label: '异常处理',
    cards: [
      { key: 'pending', label: '待处理', value: 8, type: 'error' },
      { key: 'processing', label: '处理中', value: 5, type: 'warning' },
      { key: 'customerConfirm', label: '待客户确认', value: 3 },
      { key: 'financeConfirm', label: '待财务确认', value: 2 },
      { key: 'closed', label: '已关闭', value: 42, type: 'success' },
      { key: 'overdue', label: '超时异常', value: 4, type: 'error' }
    ],
    quickActions: ['创建异常', '上传图片', '通知客户', '关闭异常'],
    subViews: ['全部', '少货', '破损', '装错车', '超时', '待确认'],
    columns: cols([
      { key: 'exceptionNo', title: '异常号', width: 140 },
      { key: 'type', title: '类型', width: 90 },
      { key: 'orderNo', title: '关联单号', width: 150 },
      { key: 'customer', title: '客户', minWidth: 110 },
      { key: 'status', title: '状态', width: 110 },
      { key: 'department', title: '责任部门', width: 100 },
      { key: 'owner', title: '责任人', width: 90 },
      { key: 'overdue', title: '超时', width: 72 },
      { key: 'risk', title: '风险', width: 72 }
    ])
  },
  {
    key: 'supplier',
    label: '供应商任务',
    cards: [
      { key: 'pendingAccept', label: '待接单', value: 4 },
      { key: 'accepted', label: '已接单', value: 8 },
      { key: 'driverPending', label: '司机待确认', value: 2 },
      { key: 'atWarehouse', label: '司机已到仓', value: 3 },
      { key: 'podPending', label: '待上传 POD', value: 5 },
      { key: 'supplierExc', label: '供应商异常', value: 1, type: 'error' }
    ],
    quickActions: ['通知供应商', '上传 BOL', '确认到仓', '审核账单'],
    subViews: ['全部', '提柜', '卡派', '拆柜劳务', '待 POD'],
    columns: cols([
      { key: 'supplierName', title: '供应商', minWidth: 130 },
      { key: 'supplierType', title: '类型', width: 90 },
      { key: 'taskNo', title: '任务号', width: 150 },
      { key: 'status', title: '状态', width: 110 },
      { key: 'driver', title: '司机', width: 90 },
      { key: 'eta', title: 'ETA', width: 158 },
      { key: 'podStatus', title: 'POD', width: 90 },
      { key: 'billStatus', title: '账单', width: 90 },
      { key: 'exception', title: '异常', width: 90 }
    ])
  },
  {
    key: 'finance',
    label: '财务费用',
    cards: [
      { key: 'pendingBill', label: '待生成账单', value: 6 },
      { key: 'pendingAudit', label: '待审核', value: 8, type: 'warning' },
      { key: 'pendingPay', label: '待付款', value: 12 },
      { key: 'pendingReceive', label: '待收款', value: 5 },
      { key: 'approving', label: '审批中', value: 3, type: 'info' },
      { key: 'feeExc', label: '费用异常', value: 2, type: 'error' }
    ],
    quickActions: ['生成账单', '审批账单', '打印发票', '导出费用'],
    subViews: ['全部', '待审核', '待付款', '待收款', '异常'],
    columns: cols([
      { key: 'billNo', title: '账单号', width: 140 },
      { key: 'party', title: '客户/供应商', minWidth: 130 },
      { key: 'feeType', title: '费用类型', width: 110 },
      { key: 'amount', title: '金额', width: 90 },
      { key: 'approvalStatus', title: '审批状态', width: 100 },
      { key: 'invoiceStatus', title: '发票状态', width: 100 },
      { key: 'paymentStatus', title: '付款状态', width: 100 },
      { key: 'owner', title: '责任人', width: 90 }
    ])
  },
  {
    key: 'customer',
    label: '客户服务',
    cards: [
      { key: 'pendingReply', label: '待回复', value: 8, type: 'warning' },
      { key: 'excFeedback', label: '异常反馈', value: 3, type: 'error' },
      { key: 'billDispute', label: '账单争议', value: 2 },
      { key: 'specialReq', label: '特殊操作', value: 4 },
      { key: 'overdueReply', label: '超时未回复', value: 5, type: 'error' },
      { key: 'complaint', label: '客户投诉', value: 1, type: 'error' }
    ],
    quickActions: ['回复客户', '发送订单卡片', '创建待办', '升级异常'],
    subViews: ['全部', '待回复', '超时', '投诉', '账单争议'],
    columns: cols([
      { key: 'customerName', title: '客户', minWidth: 120 },
      { key: 'orderNo', title: '订单号', width: 150 },
      { key: 'issueType', title: '问题类型', width: 110 },
      { key: 'status', title: '状态', width: 100 },
      { key: 'department', title: '责任部门', width: 100 },
      { key: 'lastReplyTime', title: '最后回复', width: 158 },
      { key: 'overdue', title: '超时', width: 72 }
    ])
  },
  {
    key: 'custom',
    label: '自定义',
    cards: [
      { key: 'myViews', label: '我的视图', value: 5 },
      { key: 'sharedViews', label: '共享视图', value: 8 },
      { key: 'charts', label: '图表视图', value: 3 },
      { key: 'savedFilters', label: '保存筛选', value: 12 }
    ],
    quickActions: ['新建视图', '复制视图', '共享给部门', '导入模板'],
    subViews: ['我的', '部门共享', 'Anker', 'XLX7', '异常'],
    columns: cols([
      { key: 'viewName', title: '视图名称', minWidth: 180 },
      { key: 'dataSource', title: '数据源', width: 100 },
      { key: 'owner', title: '创建人', width: 100 },
      { key: 'shared', title: '共享范围', width: 90 },
      { key: 'updateTime', title: '更新时间', width: 158 },
      { key: 'status', title: '状态', width: 80 }
    ])
  },
  {
    key: 'config',
    label: '配置',
    roles: ['manager'],
    cards: [],
    quickActions: [],
    subViews: [],
    columns: []
  }
];

export function getVisibleTabs(perspective: string) {
  const opt = OPS_PERSPECTIVE_OPTIONS.find(o => o.value === perspective);
  const roleKeys = new Set(opt?.roles || OPS_PERSPECTIVE_OPTIONS[0].roles);
  return OPS_DASHBOARD_TABS.filter(t => roleKeys.has(t.key));
}

export function getTabDef(key: OpsDashboardTabKey) {
  return OPS_DASHBOARD_TABS.find(t => t.key === key);
}

/** 顶部汇总卡片（随 Tab 轻微变化时的通用行） */
export const OPS_SUMMARY_CARDS = [
  { key: 'tasks', label: '今日任务', value: 128 },
  { key: 'done', label: '已完成', value: 86, type: 'success' as const },
  { key: 'doing', label: '进行中', value: 24, type: 'info' as const },
  { key: 'overdue', label: '超时', value: 8, type: 'warning' as const },
  { key: 'exc', label: '异常', value: 5, type: 'error' as const }
];
