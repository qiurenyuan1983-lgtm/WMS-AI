/** 操作数据看板 — Mock 数据（纯前端原型） */

export type OpsDashboardTabKey =
  | 'mine'
  | 'warehouse'
  | 'inbound'
  | 'trip'
  | 'devanning'
  | 'inventory'
  | 'exception'
  | 'supplier'
  | 'finance'
  | 'customer'
  | 'custom'
  | 'config';

export type OpsTableRow = Record<string, string | number | boolean | null | undefined>;

const baseRows = {
  mine: [
    { id: 1, title: '审批 XLX7 车次 TRIP250604001', type: '审批', priority: '高', dueTime: '2026-06-04 14:00', status: '待处理', owner: '我' },
    { id: 2, title: '回复 Forest 客户 ISA 咨询', type: '消息', priority: '中', dueTime: '2026-06-04 12:00', status: '超时', owner: '我' },
    { id: 3, title: '确认 MSCU1234567 拆柜异常', type: '异常', priority: '高', dueTime: '2026-06-04 16:00', status: '处理中', owner: '我' },
    { id: 4, title: '审核 ABC Trucking 6月账单', type: '审批', priority: '中', dueTime: '2026-06-05 10:00', status: '待处理', owner: '我' },
    { id: 5, title: '分配 DOCK 05 装车任务', type: '任务', priority: '高', dueTime: '2026-06-04 11:30', status: '待处理', owner: '我' }
  ],
  warehouse: [
    { id: 1, metric: '今日到仓柜数', value: 18, target: 22, status: '进行中', owner: '门岗组', exception: '无' },
    { id: 2, metric: '今日拆柜完成', value: 42, target: 65, status: '低于目标', owner: '拆柜组', exception: '风险' },
    { id: 3, metric: '今日车次订单', value: 12, target: 15, status: '正常', owner: '调度组', exception: '无' },
    { id: 4, metric: 'DOCK 使用率', value: '78%', target: '85%', status: '正常', owner: '园区', exception: '无' }
  ],
  inbound: [
    { id: 1, containerNo: 'MSCU1234567', customer: '演示客户 A', eta: '2026-06-04', dock: 'D-03', cartonQty: 520, palletQty: 22, location: 'A09-01', devanningStatus: '拆柜中', putawayStatus: '待上架', owner: '张三', exception: '无' },
    { id: 2, containerNo: 'OOLU1000137', customer: '演示客户 B', eta: '2026-06-04', dock: 'D-05', cartonQty: 380, palletQty: 16, location: '--', devanningStatus: '待拆柜', putawayStatus: '--', owner: '李四', exception: '无' },
    { id: 3, containerNo: 'FSCU9988776', customer: 'ANKER', eta: '2026-06-03', dock: 'D-02', cartonQty: 640, palletQty: 28, location: 'B12-03', devanningStatus: '已完成', putawayStatus: '上架中', owner: '王五', exception: '少货1箱' }
  ],
  trip: [
    { id: 1, tripNo: 'TRIP250604001', destination: 'XLX7', isa: 'ISA-8844221', appointmentTime: '2026-06-05 10:00', customer: '演示客户 A', orderCount: 5, palletQty: 26, driver: 'John', supplier: 'ABC Trucking', dock: '05', loadingProgress: '0%', status: '待装车', exception: '无' },
    { id: 2, tripNo: 'TRIP250604002', destination: 'LGB8', isa: 'ISA-7722100', appointmentTime: '2026-06-05 14:00', customer: '演示客户 C', orderCount: 3, palletQty: 18, driver: 'Mike', supplier: 'FastLine', dock: '03', loadingProgress: '45%', status: '装车中', exception: '无' },
    { id: 3, tripNo: 'TRIP250604003', destination: '私人地址', isa: 'APT-556677', appointmentTime: '2026-06-06 09:00', customer: '演示客户 D', orderCount: 2, palletQty: 8, driver: 'Carlos', supplier: 'ABC Trucking', dock: '--', loadingProgress: '0%', status: '待 Check In', exception: '无' }
  ],
  devanning: [
    { id: 1, containerNo: 'MSCU1234567', customer: '演示客户 A', targetDate: '2026-06-04', dock: 'D-03', cartonQty: 520, palletQty: 22, progress: '65%', status: '拆柜中', labor: '班组A', owner: '张三', exception: '无' },
    { id: 2, containerNo: 'OOLU1000137', customer: '演示客户 B', targetDate: '2026-06-04', dock: 'D-05', cartonQty: 380, palletQty: 16, progress: '0%', status: '待拆柜', labor: '未分配', owner: '李四', exception: '超时未开始' },
    { id: 3, containerNo: 'TCLU5566778', customer: 'PopMart', targetDate: '2026-06-04', dock: 'D-01', cartonQty: 450, palletQty: 20, progress: '100%', status: '已完成', labor: '班组B', owner: '王五', exception: '无' }
  ],
  inventory: [
    { id: 1, palletNo: 'PLT-202606-001', customer: '演示客户 A', orderNo: 'CO-2026-0001', location: 'A09-01', destination: 'XLX7', cartonQty: 48, inboundDate: '2026-06-01', storageDays: 3, status: '正常' },
    { id: 2, palletNo: 'PLT-202606-018', customer: 'ANKER', orderNo: 'CO-2026-0012', location: 'B12-03', destination: 'LAX9', cartonQty: 36, inboundDate: '2026-05-28', storageDays: 7, status: 'HOLD' },
    { id: 3, palletNo: 'PLT-202606-033', customer: '演示客户 B', orderNo: 'CO-2026-0008', location: 'C03-02', destination: 'XLX7', cartonQty: 52, inboundDate: '2026-06-02', storageDays: 2, status: '高货值' }
  ],
  exception: [
    { id: 1, exceptionNo: 'EXC250601003', type: '少货', orderNo: 'FSHY2508058785', customer: 'Forest', status: '处理中', department: '入库组', owner: 'QC Lisa', overdue: '是', risk: '中' },
    { id: 2, exceptionNo: 'EXC250604001', type: '装错车', orderNo: 'TRIP250602009', customer: '演示客户 E', status: '待客户确认', department: '出库组', owner: '调度 Aaron', overdue: '否', risk: '高' },
    { id: 3, exceptionNo: 'EXC250604002', type: '破损', orderNo: 'CO-2026-0015', customer: 'PopMart', status: '待处理', department: 'QC', owner: '待分配', overdue: '是', risk: '低' }
  ],
  supplier: [
    { id: 1, supplierName: 'ABC Trucking', supplierType: '卡派', taskNo: 'TRIP250604001', status: '司机已到仓', driver: 'John', eta: '2026-06-04 10:00', podStatus: '待上传', billStatus: '未提交', exception: '无' },
    { id: 2, supplierName: 'Pacific Drayage', supplierType: '提柜', taskNo: 'CTN-2026-0002', status: '提柜中', driver: 'Tom', eta: '2026-06-04 15:00', podStatus: '--', billStatus: '待审核', exception: '无' },
    { id: 3, supplierName: '劳务队 A', supplierType: '拆柜装车', taskNo: 'DEV-20260604-08', status: '作业中', driver: '--', eta: '2026-06-04 18:00', podStatus: '--', billStatus: '待生成', exception: '人员不足' }
  ],
  finance: [
    { id: 1, billNo: 'INV250601008', party: 'ABC Trucking', feeType: '卡派运输', amount: 2850, approvalStatus: '待审核', invoiceStatus: '未开票', paymentStatus: '未付款', owner: '财务 Amy' },
    { id: 2, billNo: 'INV250604012', party: '演示客户 A', feeType: '仓储+拆柜', amount: 4200, approvalStatus: '已审核', invoiceStatus: '已开票', paymentStatus: '待收款', owner: '财务 Amy' },
    { id: 3, billNo: 'INV250604015', party: 'Pacific Drayage', feeType: '提柜', amount: 980, approvalStatus: '审批中', invoiceStatus: '未开票', paymentStatus: '未付款', owner: '财务 Bob' }
  ],
  customer: [
    { id: 1, customerName: 'Forest Zhang', orderNo: 'FSHY2508058785', issueType: 'ISA 预约', status: '待回复', department: '客服', lastReplyTime: '2026-06-04 10:32', overdue: '是' },
    { id: 2, customerName: 'ANKER', orderNo: 'CO-2026-0012', issueType: '账单争议', status: '处理中', department: '财务', lastReplyTime: '2026-06-03 16:00', overdue: '否' },
    { id: 3, customerName: 'PopMart', orderNo: 'CO-2026-0015', issueType: '特殊操作', status: '待确认', department: '仓库', lastReplyTime: '2026-06-04 09:00', overdue: '否' }
  ],
  custom: [
    { id: 1, viewName: 'Anker 今日入库看板', dataSource: '入库', owner: '我', shared: '部门', updateTime: '2026-06-04 08:00', status: '启用' },
    { id: 2, viewName: 'XLX7 车次进度看板', dataSource: '车次订单', owner: '调度 Aaron', shared: '全员', updateTime: '2026-06-03 17:30', status: '启用' },
    { id: 3, viewName: '超时异常看板', dataSource: '异常', owner: 'QC Lisa', shared: 'QC组', updateTime: '2026-06-02 11:00', status: '启用' }
  ]
};

export function getOpsDashboardTableRows(tab: OpsDashboardTabKey): OpsTableRow[] {
  if (tab === 'config') return [];
  return baseRows[tab as keyof typeof baseRows] || [];
}

export const OPS_DASHBOARD_ALERTS = {
  todos: [
    { id: 1, title: '分配 TRIP250604001 装车 DOCK', time: '11:30', level: 'warning' },
    { id: 2, title: '审批拆柜费用发票 INV250601008', time: '14:00', level: 'info' },
    { id: 3, title: '回复 Forest 客户消息', time: '已超时 2h', level: 'error' }
  ],
  timeouts: [
    { id: 1, title: 'OOLU1000137 超时未开始拆柜', detail: '计划 09:00 开始', level: 'error' },
    { id: 2, title: 'TRIP250604003 司机未 Check In', detail: '预约 09:00', level: 'warning' }
  ],
  exceptions: [
    { id: 1, title: 'XLX7 装车少 2 板', detail: 'EXC250601003', level: 'error' },
    { id: 2, title: 'PopMart 破损 1 箱', detail: 'EXC250604002', level: 'warning' }
  ],
  aiTips: [
    '今日拆柜完成率 65%，低于目标 7 柜，建议增派 D-05 劳务。',
    'XLX7 车次 TRIP250604001 预约 10:00，司机尚未 Check In，建议提前通知。',
    'B12 库区高架占用率 92%，建议优先安排尾板出库。'
  ]
};
