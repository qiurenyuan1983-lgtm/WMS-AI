import { mockPage, nextId } from '../utils';

const CUSTOMERS = ['Anker Innovations', 'SHEIN', 'PopMart US', 'Robotime Corp', 'LuckyImport LLC'];
const PLATFORMS = ['Amazon', 'Walmart', 'SHEIN', 'FedEx', 'UPS'];
const DESTINATIONS = ['LAX9', 'ONT8', 'DFW6', 'ORD2', 'SJC7', 'FedEx-LAX', 'UPS-ORD'];
const DEPTS = ['上架组', '拣货组', '库内作业组', '质控组', '异常处理组'];
const ASSIGNEES = ['张三', '李四', '王五', '赵六', '陈七', null];

const ORDER_SEED = Array.from({ length: 12 }, (_, i) => {
  const orderNo = `CO-2026-T${String(i + 1).padStart(4, '0')}`;
  return {
    orderNo,
    customerName: CUSTOMERS[i % CUSTOMERS.length],
    platform: PLATFORMS[i % PLATFORMS.length],
    destination: DESTINATIONS[i % DESTINATIONS.length],
    orderStatus: i % 4 === 0 ? '可用库存' : i % 4 === 1 ? '待拣货' : i % 4 === 2 ? '已上架' : '拣货中',
    currentLocation: `A-${String((i % 8) + 1).padStart(2, '0')}-${String((i % 12) + 1).padStart(2, '0')}`,
    cargoLines: [
      {
        id: 91000 + i * 10 + 1,
        cargoNo: `PLT-${orderNo}-01`,
        sku: `SKU-${1000 + i}`,
        qty: 12 + i,
        unit: '箱',
        currentLocation: `A-${String((i % 8) + 1).padStart(2, '0')}-01`,
        targetLocation: `B-${String((i % 6) + 1).padStart(2, '0')}-01`,
        holdFlag: i % 5 === 0
      },
      {
        id: 91000 + i * 10 + 2,
        cargoNo: `PLT-${orderNo}-02`,
        sku: `SKU-${2000 + i}`,
        qty: 8 + i,
        unit: '箱',
        currentLocation: `A-${String((i % 8) + 1).padStart(2, '0')}-02`,
        targetLocation: null,
        holdFlag: false
      }
    ]
  };
});

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 3600000).toISOString().slice(0, 19).replace('T', ' ');
}

function calcRisk(deadline: string): { remainingMinutes: number; riskLevel: Api.Wms.TransferRiskLevel; overdueFlag: boolean } {
  const diff = new Date(deadline.replace(' ', 'T')).getTime() - Date.now();
  const remainingMinutes = Math.floor(diff / 60000);
  if (remainingMinutes < 0) return { remainingMinutes, riskLevel: 'OVERDUE', overdueFlag: true };
  if (remainingMinutes < 120) return { remainingMinutes, riskLevel: 'URGENT', overdueFlag: false };
  if (remainingMinutes < 480) return { remainingMinutes, riskLevel: 'WARNING', overdueFlag: false };
  return { remainingMinutes, riskLevel: 'NORMAL', overdueFlag: false };
}

function defaultRoute(holdFlag: boolean, reassignFlag: boolean): Api.Wms.TransferRouteStep[] {
  if (holdFlag) {
    return [
      { code: 'PUTAWAY_DONE', label: '已上架', status: 'DONE', time: '2026-06-05 10:00:00' },
      { code: 'HOLDING', label: '暂扣中', status: 'CURRENT', time: '2026-06-06 09:00:00' },
      { code: 'PENDING_RELEASE', label: '待放行', status: 'PENDING' },
      { code: 'RELEASED', label: '放行完成', status: 'PENDING' },
      { code: 'AVAILABLE', label: '可用库存', status: 'PENDING' }
    ];
  }
  if (reassignFlag) {
    return [
      { code: 'AVAILABLE', label: '可用库存', status: 'DONE' },
      { code: 'REASSIGNING', label: '改派中', status: 'CURRENT', time: '2026-06-06 11:00:00' },
      { code: 'DEST_UPDATE', label: '更新目的地', status: 'PENDING' },
      { code: 'RELABEL', label: '如需换标', status: 'PENDING' },
      { code: 'RELABEL_DONE', label: '换标完成', status: 'PENDING' },
      { code: 'PICK_REGEN', label: '重新生成拣货指令', status: 'PENDING' }
    ];
  }
  return [
    { code: 'PENDING_PUTAWAY', label: '待上架', status: 'DONE' },
    { code: 'PUTAWAY_DONE', label: '已上架', status: 'DONE', time: '2026-06-04 14:00:00' },
    { code: 'AVAILABLE', label: '可用库存', status: 'CURRENT' },
    { code: 'PENDING_PICK', label: '待拣货', status: 'PENDING' },
    { code: 'PICKING', label: '拣货中', status: 'PENDING' },
    { code: 'PENDING_LOAD', label: '待装车', status: 'PENDING' },
    { code: 'LOADING', label: '装车中', status: 'PENDING' },
    { code: 'OUTBOUND', label: '已出库', status: 'PENDING' }
  ];
}

type SeedDef = {
  category: Api.Wms.TransferInstructionCategory;
  operationType: string;
  status: Api.Wms.TransferInstructionStatus;
  hoursToDeadline: number;
  requirement: string;
  priority?: Api.Wms.TransferInstruction['priority'];
  holdFlag?: boolean;
  reassignFlag?: boolean;
  relabelTypes?: string[];
};

const INSTRUCTION_DEFS: SeedDef[] = [
  { category: 'PUTAWAY', operationType: 'PUTAWAY', status: 'PENDING', hoursToDeadline: 6, requirement: '按系统推荐库位上架' },
  { category: 'PICK', operationType: 'PICK', status: 'RECEIVED', hoursToDeadline: 4, requirement: '按车次波次拣货' },
  { category: 'OPERATION', operationType: 'PHOTO', status: 'IN_PROGRESS', hoursToDeadline: 2, requirement: '拍摄外箱及标签照片各2张' },
  { category: 'HOLD_RELEASE', operationType: 'HOLD', status: 'PENDING_REVIEW', hoursToDeadline: -1, requirement: '客户要求暂扣，禁止出库装车', holdFlag: true },
  { category: 'RELABEL_REBOX', operationType: 'RELABEL_FBA', status: 'PENDING', hoursToDeadline: 8, requirement: '更换FBA标签', relabelTypes: ['FBA标签'] },
  { category: 'RELABEL_REBOX', operationType: 'REBOX', status: 'IN_PROGRESS', hoursToDeadline: 3, requirement: '原箱破损，换箱并补贴新箱唛' },
  { category: 'CANCEL_REASSIGN', operationType: 'REASSIGN', status: 'PENDING', hoursToDeadline: 5, requirement: '目的地改派至 ONT8', reassignFlag: true },
  { category: 'EXCEPTION', operationType: 'CUSTOM', status: 'EXCEPTION', hoursToDeadline: -2, requirement: '库位差异，需主管复核' },
  { category: 'OPERATION', operationType: 'MERGE_PALLET', status: 'COMPLETED', hoursToDeadline: 24, requirement: '两板合并为一板' },
  { category: 'HOLD_RELEASE', operationType: 'RELEASE', status: 'PENDING', hoursToDeadline: 1, requirement: '财务放行审核通过，解除库存锁定', holdFlag: true },
  { category: 'OPERATION', operationType: 'MEASURE', status: 'PENDING_REVIEW', hoursToDeadline: 6, requirement: '测量外箱三边及重量' },
  { category: 'PICK', operationType: 'PICK', status: 'OVERDUE', hoursToDeadline: -3, requirement: '紧急拣货出库' },
  { category: 'OPERATION', operationType: 'RELABEL_SKU', status: 'PENDING', hoursToDeadline: 10, requirement: '更换SKU标签', relabelTypes: ['SKU标签'] },
  { category: 'OPERATION', operationType: 'REWRAP', status: 'RECEIVED', hoursToDeadline: 7, requirement: '缠绕膜加固' },
  { category: 'CANCEL_REASSIGN', operationType: 'CANCEL', status: 'CANCELLED', hoursToDeadline: 12, requirement: '客户取消订单' },
  { category: 'PUTAWAY', operationType: 'PUTAWAY', status: 'COMPLETED', hoursToDeadline: 48, requirement: '上架至推荐库位' },
  { category: 'OPERATION', operationType: 'RELABEL_CARTON', status: 'IN_PROGRESS', hoursToDeadline: 1.5, requirement: '更换箱唛', relabelTypes: ['箱唛'] },
  { category: 'OPERATION', operationType: 'RELABEL_PALLET', status: 'PENDING', hoursToDeadline: 9, requirement: '打印并补贴板贴', relabelTypes: ['板贴'] },
  { category: 'EXCEPTION', operationType: 'REVIEW', status: 'PENDING_REVIEW', hoursToDeadline: 0.5, requirement: '质控复核标签信息' },
  { category: 'OPERATION', operationType: 'SPLIT_PALLET', status: 'PENDING', hoursToDeadline: 11, requirement: '一板拆为两板' }
];

const MOCK_INSTRUCTIONS: Api.Wms.TransferInstruction[] = [];

INSTRUCTION_DEFS.forEach((def, index) => {
  const order = ORDER_SEED[index % ORDER_SEED.length];
  const base = new Date();
  const deadline = addHours(base, def.hoursToDeadline);
  const risk = calcRisk(deadline);
  const status = risk.overdueFlag && def.status === 'PENDING' ? 'OVERDUE' : def.status;
  const id = 92000 + index + 1;
  MOCK_INSTRUCTIONS.push({
    id,
    instructionNo: `TI-2026-${String(index + 1).padStart(5, '0')}`,
    orderNo: order.orderNo,
    category: def.category,
    operationType: def.operationType,
    customerName: order.customerName,
    platform: order.platform,
    destination: order.destination,
    cargoQty: order.cargoLines.reduce((s, c) => s + c.qty, 0),
    currentLocation: order.currentLocation,
    targetLocation: order.cargoLines[0]?.targetLocation || null,
    operationRequirement: def.requirement,
    deptName: DEPTS[index % DEPTS.length],
    assigneeName: ASSIGNEES[index % ASSIGNEES.length],
    deadline,
    remainingMinutes: risk.remainingMinutes,
    riskLevel: risk.riskLevel,
    status,
    priority: def.priority || (risk.riskLevel === 'URGENT' ? 'URGENT' : index % 3 === 0 ? 'HIGH' : 'NORMAL'),
    overdueFlag: risk.overdueFlag || status === 'OVERDUE',
    holdFlag: def.holdFlag || false,
    orderStatus: order.orderStatus,
    routeSteps: defaultRoute(!!def.holdFlag, !!def.reassignFlag),
    cargoLines: order.cargoLines.map(c => ({ ...c })),
    relabelTypes: def.relabelTypes || null,
    attachments: index % 4 === 0 ? [{ id: id * 10, fileName: '作业照片.jpg', fileType: 'image/jpeg', uploadTime: '2026-06-06 10:00:00', uploaderName: '张三' }] : [],
    logs: [
      { id: id * 100 + 1, action: '创建指令', operatorName: '系统', remark: null, createTime: '2026-06-06 08:00:00' },
      ...(status !== 'PENDING' ? [{ id: id * 100 + 2, action: '派发', operatorName: '调度员', remark: null, createTime: '2026-06-06 08:30:00' }] : [])
    ],
    createTime: '2026-06-06 08:00:00',
    receivedTime: ['RECEIVED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED'].includes(status) ? '2026-06-06 09:00:00' : null,
    startTime: ['IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED'].includes(status) ? '2026-06-06 09:30:00' : null,
    submitTime: ['PENDING_REVIEW', 'COMPLETED'].includes(status) ? '2026-06-06 11:00:00' : null,
    completeTime: status === 'COMPLETED' ? '2026-06-06 12:00:00' : null,
    executorName: status !== 'PENDING' ? ASSIGNEES[index % ASSIGNEES.length] : null,
    reviewResult: status === 'COMPLETED' ? '通过' : null
  });
});

function filterInstructions(params?: Record<string, any>) {
  let list = [...MOCK_INSTRUCTIONS];
  const category = params?.category;
  if (category && category !== 'ALL' && category !== 'COMPLETED') {
    list = list.filter(r => r.category === category);
  }
  if (category === 'COMPLETED') {
    list = list.filter(r => r.status === 'COMPLETED');
  }
  if (params?.status) list = list.filter(r => r.status === params.status);
  if (params?.orderNo) {
    const kw = String(params.orderNo).toLowerCase();
    list = list.filter(r => r.orderNo.toLowerCase().includes(kw));
  }
  if (params?.instructionNo) {
    const kw = String(params.instructionNo).toLowerCase();
    list = list.filter(r => r.instructionNo.toLowerCase().includes(kw));
  }
  if (params?.customerName) {
    const kw = String(params.customerName).toLowerCase();
    list = list.filter(r => r.customerName.toLowerCase().includes(kw));
  }
  if (params?.platform) {
    const kw = String(params.platform).toLowerCase();
    list = list.filter(r => (r.platform || '').toLowerCase().includes(kw));
  }
  if (params?.destination) {
    const kw = String(params.destination).toLowerCase();
    list = list.filter(r => r.destination.toLowerCase().includes(kw));
  }
  if (params?.deptName) {
    const kw = String(params.deptName).toLowerCase();
    list = list.filter(r => (r.deptName || '').toLowerCase().includes(kw));
  }
  if (params?.assigneeName) {
    const kw = String(params.assigneeName).toLowerCase();
    list = list.filter(r => (r.assigneeName || '').toLowerCase().includes(kw));
  }
  if (params?.overdueOnly) list = list.filter(r => r.overdueFlag || r.status === 'OVERDUE');
  if (params?.cargoNo) {
    const kw = String(params.cargoNo).toLowerCase();
    list = list.filter(r => r.cargoLines?.some(c => c.cargoNo.toLowerCase().includes(kw)));
  }
  return list.map(r => {
    const risk = calcRisk(r.deadline);
    return { ...r, remainingMinutes: risk.remainingMinutes, riskLevel: risk.riskLevel, overdueFlag: risk.overdueFlag };
  });
}

export function getTransferWorkbenchStats() {
  const list = filterInstructions();
  const today = new Date().toISOString().slice(0, 10);
  const categoryCounts: Record<string, number> = {};
  list.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });
  return {
    total: list.length,
    pending: list.filter(r => r.status === 'PENDING').length,
    inProgress: list.filter(r => ['RECEIVED', 'IN_PROGRESS'].includes(r.status)).length,
    pendingReview: list.filter(r => r.status === 'PENDING_REVIEW').length,
    overdue: list.filter(r => r.overdueFlag || r.status === 'OVERDUE').length,
    exception: list.filter(r => r.status === 'EXCEPTION').length,
    completedToday: list.filter(r => r.status === 'COMPLETED' && r.completeTime?.startsWith(today)).length,
    holdCargo: list.filter(r => r.holdFlag).length,
    categoryCounts
  };
}

export function getTransferInstructionList(params?: Record<string, any>) {
  return mockPage(filterInstructions(params), params);
}

export function getTransferOrderGroupList(params?: Record<string, any>) {
  const instructions = filterInstructions(params);
  const map = new Map<string, Api.Wms.TransferOrderGroup>();
  instructions.forEach(inst => {
    const existing = map.get(inst.orderNo);
    if (!existing) {
      map.set(inst.orderNo, {
        orderNo: inst.orderNo,
        customerName: inst.customerName,
        platform: inst.platform,
        destination: inst.destination,
        orderStatus: inst.orderStatus || '—',
        instructionCount: 1,
        pendingCount: ['PENDING', 'RECEIVED', 'IN_PROGRESS', 'OVERDUE'].includes(inst.status) ? 1 : 0,
        holdFlag: !!inst.holdFlag,
        instructions: [inst]
      });
      return;
    }
    existing.instructionCount += 1;
    if (['PENDING', 'RECEIVED', 'IN_PROGRESS', 'OVERDUE'].includes(inst.status)) existing.pendingCount += 1;
    if (inst.holdFlag) existing.holdFlag = true;
    existing.instructions.push(inst);
  });
  return mockPage(Array.from(map.values()), params);
}

export function getTransferInstructionDetail(id: CommonType.IdType) {
  const row = MOCK_INSTRUCTIONS.find(r => String(r.id) === String(id));
  if (!row) return null;
  const risk = calcRisk(row.deadline);
  return { ...row, remainingMinutes: risk.remainingMinutes, riskLevel: risk.riskLevel, overdueFlag: risk.overdueFlag };
}

export function lookupTransferOrder(orderNo: string) {
  const order = ORDER_SEED.find(o => o.orderNo === orderNo || o.orderNo.includes(orderNo));
  if (!order) return null;
  return order as Api.Wms.TransferOrderLookup;
}

export function createTransferInstruction(body: Record<string, any>) {
  const order = lookupTransferOrder(body.orderNo);
  if (!order) throw new Error('订单号不存在');
  const id = nextId();
  const index = MOCK_INSTRUCTIONS.length + 1;
  const deadline = body.deadline || addHours(new Date(), 8);
  const risk = calcRisk(deadline);
  const row: Api.Wms.TransferInstruction = {
    id,
    instructionNo: `TI-2026-${String(index).padStart(5, '0')}`,
    orderNo: order.orderNo,
    category: body.category,
    operationType: body.operationType,
    customerName: order.customerName,
    platform: order.platform,
    destination: order.destination,
    cargoQty: order.cargoLines.reduce((s, c) => s + c.qty, 0),
    currentLocation: order.currentLocation,
    targetLocation: body.targetLocation || order.cargoLines[0]?.targetLocation || null,
    operationRequirement: body.operationRequirement || '—',
    deptName: body.deptName || DEPTS[0],
    assigneeName: body.assigneeName || null,
    deadline,
    remainingMinutes: risk.remainingMinutes,
    riskLevel: risk.riskLevel,
    status: 'PENDING',
    priority: body.priority || 'NORMAL',
    overdueFlag: false,
    holdFlag: body.operationType === 'HOLD',
    orderStatus: order.orderStatus,
    routeSteps: defaultRoute(body.operationType === 'HOLD', body.operationType === 'REASSIGN'),
    cargoLines: order.cargoLines.map(c => ({ ...c })),
    relabelTypes: body.relabelTypes || null,
    attachments: [],
    logs: [{ id: nextId(), action: '创建指令', operatorName: '操作员', remark: body.operationRequirement, createTime: nowStr() }],
    createTime: nowStr()
  };
  MOCK_INSTRUCTIONS.unshift(row);
  if (body.operationType === 'RELEASE') {
    MOCK_INSTRUCTIONS.filter(i => i.orderNo === order.orderNo && i.operationType === 'HOLD').forEach(h => {
      h.holdFlag = false;
      h.logs = [...(h.logs || []), { id: nextId(), action: '关联放行', operatorName: '系统', remark: '库存锁定解除', createTime: nowStr() }];
    });
  }
  return row;
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

const ACTION_STATUS: Record<string, Api.Wms.TransferInstructionStatus> = {
  DISPATCH: 'RECEIVED',
  RECEIVE: 'RECEIVED',
  START: 'IN_PROGRESS',
  SUBMIT: 'PENDING_REVIEW',
  COMPLETE: 'COMPLETED',
  REJECT: 'REJECTED',
  CANCEL: 'CANCELLED'
};

const ACTION_LABEL: Record<string, string> = {
  DISPATCH: '派发',
  RECEIVE: '接收',
  START: '开始执行',
  SUBMIT: '提交结果',
  COMPLETE: '完成',
  REJECT: '驳回',
  CANCEL: '取消'
};

export function executeTransferInstructionAction(body: Record<string, any>) {
  const row = MOCK_INSTRUCTIONS.find(r => String(r.id) === String(body.instructionId));
  if (!row) throw new Error('指令不存在');
  const action = body.action as string;
  const nextStatus = ACTION_STATUS[action];
  if (!nextStatus) throw new Error('无效操作');
  row.status = nextStatus;
  const t = nowStr();
  if (action === 'RECEIVE' || action === 'DISPATCH') row.receivedTime = t;
  if (action === 'START') row.startTime = t;
  if (action === 'SUBMIT') row.submitTime = t;
  if (action === 'COMPLETE') {
    row.completeTime = t;
    row.reviewResult = body.reviewResult || '通过';
    row.reviewRemark = body.remark || null;
  }
  if (action === 'REJECT') row.reviewRemark = body.remark || null;
  row.logs = [...(row.logs || []), { id: nextId(), action: ACTION_LABEL[action] || action, operatorName: '操作员', remark: body.remark, createTime: t }];
  const risk = calcRisk(row.deadline);
  row.remainingMinutes = risk.remainingMinutes;
  row.riskLevel = risk.riskLevel;
  row.overdueFlag = risk.overdueFlag;
  return getTransferInstructionDetail(row.id);
}

