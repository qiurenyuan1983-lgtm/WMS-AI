import { MOCK_WMS_DEVANNING_ORDERS, enrichDevanningRow } from './wms';
import { syncDevanningComplete } from './oms-golden-path';
import { buildInboundPlanItemsFromContainer, buildCargoOrdersForContainer } from './oms-container-cargo';

/** dockId -> dockCode */
export const DOCK_ID_CODE: Record<string, string> = {
  '3010001': 'DOC-LA-001',
  '3010002': 'DOC-LA-002',
  '3010005': 'DOC-LA-005'
};

export type DevanningWorkTask = {
  id: number;
  devanningNo: string;
  containerNo: string;
  expectedArrivalTime: string | null;
  plannedDevanningTime: string | null;
  devanningDate: string | null;
  isTodayDevanning: boolean;
  dispatchSynced: boolean;
  devanningPriority: string;
  devanningPriorityLevel: string;
  isaTripQty: number;
  totalCbm: number;
  isaCbmLabel: string;
  devanningStatus: string;
  devanningStatusLabel: string;
  workStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  workStatusLabel: string;
  dockId: number;
  dockCode: string | null;
  progressPercent: number;
  markedBoxQty: number;
  totalPalletQty: number;
  devanningGroups: string;
  totalBoxQty: number;
  devanningSupplier: string | null;
  devanningFee: number | null;
  extraOperationFee: number;
  extraOperationFeeRemark: string | null;
  devanningStartTime: string | null;
  devanningFinishTime: string | null;
  sourceOrderId: number | null;
  customerName: string | null;
};

export type WorkOrder = {
  cargoOrderId: number;
  cargoOrderNo: string;
  customerName: string;
  forecastQtyUnit: 'BY_CARTON' | 'BY_PALLET';
  qtyUnitLabel: string;
  expectedQty: number;
  receivedQty: number;
  palletizedQty: number;
  pendingPalletizeQty: number;
};

export type WorkGroup = {
  groupCode: string;
  totalExpectedQty: number;
  totalReceivedQty: number;
  orders: WorkOrder[];
  recommendedLocations: string[];
};

export type WorkPalletItem = {
  cargoOrderId: number;
  cargoOrderNo: string;
  customerName: string;
  receiveQty: number;
  receiveUnitLabel: string;
  boxQty: number;
};

export type WorkPallet = {
  id: number;
  palletNo: string;
  groupCode: string;
  /** 卡板明细（一对多订单） */
  items: WorkPalletItem[];
  orderCount: number;
  /** 卡板上的箱数合计 */
  boxQty: number;
  /** 收货量合计（展示用，明细见 items） */
  receiveQty: number;
  receiveUnitLabel: string;
  status: 'DONE';
  statusLabel: string;
  createTime: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightKg?: number;
  /** 扫码入库后绑定的实际库位 */
  actualInboundLocation?: string | null;
};

export type BoxScanLog = {
  id: number;
  scanCode: string;
  groupCode: string;
  cargoOrderId: number;
  cargoOrderNo: string;
  customerName: string;
  qty: number;
  scanTime: string;
  shippingMark?: string | null;
};

export type DevanningWorkSession = {
  taskId: number;
  devanningNo: string;
  containerNo: string;
  dockId: number;
  dockCode: string;
  customerName: string;
  status: string;
  devanningStartTime: string | null;
  devanningFinishTime: string | null;
  totalBoxQty: number;
  markedBoxQty: number;
  groups: WorkGroup[];
  /** 收货自动生成的卡板，均为已完成 */
  pallets: WorkPallet[];
  boxScans: BoxScanLog[];
};

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

const orderReceiveState = new Map<string, number>();
const orderPalletizedState = new Map<string, number>();
const palletStore = new Map<number, WorkPallet[]>();
const scannedBoxCodes = new Map<number, Set<string>>();
const boxScanLogStore = new Map<number, BoxScanLog[]>();
let boxScanIdSeq = 80000;
let palletIdSeq = 90000;

function ensureBoxScanLogs(taskId: number): BoxScanLog[] {
  if (!boxScanLogStore.has(taskId)) boxScanLogStore.set(taskId, []);
  return boxScanLogStore.get(taskId)!;
}

function appendBoxScanLog(
  taskId: number,
  entry: Omit<BoxScanLog, 'id' | 'scanTime'> & { scanTime?: string }
) {
  const logs = ensureBoxScanLogs(taskId);
  logs.unshift({
    ...entry,
    id: ++boxScanIdSeq,
    scanTime: entry.scanTime || nowStr()
  });
}

function seedDemoBoxScans(taskId: number) {
  if (ensureBoxScanLogs(taskId).length > 0) return;

  const customer = '演示客户 A';
  const demoLogs: BoxScanLog[] = [
    { id: ++boxScanIdSeq, scanCode: 'MK-A01-018', groupCode: 'FedEx-LAX', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', customerName: customer, qty: 1, scanTime: '2026-06-03 10:28:11', shippingMark: 'CO-2026-0001' },
    { id: ++boxScanIdSeq, scanCode: 'MK-A01-017', groupCode: 'FedEx-LAX', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', customerName: customer, qty: 1, scanTime: '2026-06-03 10:27:42', shippingMark: 'CO-2026-0001' },
    { id: ++boxScanIdSeq, scanCode: 'MK-A01-016', groupCode: 'FedEx-LAX', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', customerName: customer, qty: 1, scanTime: '2026-06-03 10:27:05', shippingMark: 'CO-2026-0001' },
    { id: ++boxScanIdSeq, scanCode: 'MK-A02-008', groupCode: 'FedEx-LAX', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', customerName: customer, qty: 1, scanTime: '2026-06-03 10:25:33', shippingMark: 'CO-2026-0001' },
    { id: ++boxScanIdSeq, scanCode: 'MK-A02-007', groupCode: 'FedEx-LAX', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', customerName: customer, qty: 1, scanTime: '2026-06-03 10:24:58', shippingMark: 'CO-2026-0001' },
    { id: ++boxScanIdSeq, scanCode: 'MK-B01-012', groupCode: 'UPS-ORD', cargoOrderId: 80003, cargoOrderNo: 'CO-2026-0003', customerName: customer, qty: 1, scanTime: '2026-06-03 10:22:16', shippingMark: 'CO-2026-0003' },
    { id: ++boxScanIdSeq, scanCode: 'MK-B01-011', groupCode: 'UPS-ORD', cargoOrderId: 80003, cargoOrderNo: 'CO-2026-0003', customerName: customer, qty: 1, scanTime: '2026-06-03 10:21:44', shippingMark: 'CO-2026-0003' },
    { id: ++boxScanIdSeq, scanCode: 'MK-B02-006', groupCode: 'UPS-ORD', cargoOrderId: 80003, cargoOrderNo: 'CO-2026-0003', customerName: customer, qty: 1, scanTime: '2026-06-03 10:20:09', shippingMark: 'CO-2026-0003' },
    { id: ++boxScanIdSeq, scanCode: 'MK-B02-005', groupCode: 'UPS-ORD', cargoOrderId: 80003, cargoOrderNo: 'CO-2026-0003', customerName: customer, qty: 1, scanTime: '2026-06-03 10:19:27', shippingMark: 'CO-2026-0003' },
    { id: ++boxScanIdSeq, scanCode: 'MK-A01-015', groupCode: 'FedEx-LAX', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', customerName: customer, qty: 1, scanTime: '2026-06-03 10:18:03', shippingMark: 'CO-2026-0001' },
    { id: ++boxScanIdSeq, scanCode: 'MK-B01-010', groupCode: 'UPS-ORD', cargoOrderId: 80003, cargoOrderNo: 'CO-2026-0003', customerName: customer, qty: 1, scanTime: '2026-06-03 10:16:51', shippingMark: 'CO-2026-0003' },
    { id: ++boxScanIdSeq, scanCode: 'MK-A02-006', groupCode: 'FedEx-LAX', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', customerName: customer, qty: 1, scanTime: '2026-06-03 10:15:22', shippingMark: 'CO-2026-0001' }
  ];

  boxScanLogStore.set(taskId, demoLogs);
  const scanned = ensureScannedSet(taskId);
  demoLogs.forEach(log => scanned.add(log.scanCode.toUpperCase()));
}

/** 扫码收货满 N 箱自动打板 */
const PALLET_AUTO_BOX_CHUNK = 20;

type ScanMatch = {
  groupCode: string;
  cargoOrderId: number;
  cargoOrderNo: string;
  shippingMark?: string;
  shipmentNo?: string;
  unit: 'BY_CARTON' | 'BY_PALLET';
};

function mapWorkStatus(status: string): DevanningWorkTask['workStatus'] {
  if (status === 'DEVANNING') return 'IN_PROGRESS';
  if (status === 'DEVANNED' || status === 'CANCELLED') return 'COMPLETED';
  if (status === 'UNPICKEDUP') return 'NOT_STARTED';
  return 'IN_PROGRESS';
}

function workStatusLabel(ws: DevanningWorkTask['workStatus']) {
  const m: Record<DevanningWorkTask['workStatus'], string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成'
  };
  return m[ws];
}

function orderKey(taskId: number, groupCode: string, cargoOrderId: number) {
  return `${taskId}:${groupCode}:${cargoOrderId}`;
}

function calcProgressPercent(marked: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((marked / total) * 100));
}

function getTaskLiveMarkedQty(taskId: number, fallback: number): number {
  const prefix = `${taskId}:`;
  let sum = 0;
  for (const [key, qty] of orderReceiveState) {
    if (key.startsWith(prefix)) sum += qty;
  }
  return sum > 0 ? sum : fallback;
}

const SOURCE_ORDER_NO_TO_CONTAINER_ID: Record<string, number> = {
  'CTN-2026-0001': 70001,
  'CTN-2026-0002': 70002,
  'CTN-2026-0003': 70003
};

const DEVANNING_STATUS_LABEL: Record<string, string> = {
  UNPICKEDUP: '未提柜',
  PICKEDUP: '已提柜',
  ARRIVED: '已到仓',
  DEVANNING: '拆柜中',
  DEVANNED: '拆柜完成',
  EXCEPTION: '异常',
  CANCELLED: '已取消'
};

function resolveContainerOrderId(row: Record<string, any>): number {
  if (row.sourceOrderId != null && row.sourceOrderId !== '') return Number(row.sourceOrderId);
  if (row.sourceOrderNo && SOURCE_ORDER_NO_TO_CONTAINER_ID[row.sourceOrderNo]) {
    return SOURCE_ORDER_NO_TO_CONTAINER_ID[row.sourceOrderNo];
  }
  return 70001;
}

function resolveDockIdByCode(dockCode: string | null | undefined): number {
  if (!dockCode) return 3010001;
  for (const [id, code] of Object.entries(DOCK_ID_CODE)) {
    if (code === dockCode) return Number(id);
  }
  return 3010001;
}

function formatDateOnly(dt: string | null | undefined): string | null {
  if (!dt) return null;
  return dt.slice(0, 10);
}

function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function resolvePlannedDevanningTime(row: Record<string, any>): string | null {
  return row.plannedDevanningTime || row.etaWarehouseTime || row.plannedArrivalTime || null;
}

function isScheduledOnDate(row: Record<string, any>, dateStr: string): boolean {
  const planned = resolvePlannedDevanningTime(row);
  return formatDateOnly(planned) === dateStr;
}

const SCHEDULABLE_STATUSES = new Set(['UNPICKEDUP', 'PICKEDUP', 'ARRIVED', 'DEVANNING', 'EXCEPTION']);

function mapWmsStatusToYardStatus(status: string): Api.Yms.YardTask['yardStatus'] {
  const map: Record<string, Api.Yms.YardTask['yardStatus']> = {
    UNPICKEDUP: 'PRE_ARRIVAL',
    PICKEDUP: 'PRE_ARRIVAL',
    ARRIVED: 'ARRIVED',
    DEVANNING: 'DEVANNING',
    DEVANNED: 'OPERATION_FINISHED',
    EXCEPTION: 'EXCEPTION_PROCESSING',
    CANCELLED: 'CANCELLED'
  };
  return map[status] || 'PRE_ARRIVAL';
}

function orderToYardTask(row: Record<string, any>): Api.Yms.YardTask {
  const enriched = enrichDevanningRow(row as (typeof MOCK_WMS_DEVANNING_ORDERS)[number]);
  const totalBoxQty = Number(row.totalBoxQty || 0);
  const inboundedBoxQty = Number(row.inboundedBoxQty || 0);
  const progress =
    row.status === 'DEVANNING' && totalBoxQty > 0
      ? Math.min(100, Math.round((inboundedBoxQty / totalBoxQty) * 100))
      : null;
  const dockId = row.dockCode ? resolveDockIdByCode(row.dockCode) : null;
  const priorityLevel = String(enriched.timelinessLevel || 'B');
  const priority = priorityLevel === 'A' ? 1 : priorityLevel === 'B' ? 2 : 3;

  return {
    id: 900000 + Number(row.id),
    yardTaskNo: `YT-WMS-${row.devanningNo || row.orderNo}`,
    taskType: 'DEVANNING',
    yardStatus: mapWmsStatusToYardStatus(String(row.status)),
    sourceOrderType: row.sourceOrderType || 'CONTAINER_ORDER',
    sourceOrderId: Number(row.id),
    sourceOrderNo: row.orderNo,
    containerNo: row.containerNo,
    wmsReadyStatus: ['ARRIVED', 'DEVANNING', 'DEVANNED'].includes(String(row.status)) ? 'READY' : 'PENDING',
    wmsReadyTime: row.actualArrivalTime || row.etaWarehouseTime || null,
    priority,
    truckNo: null,
    driverName: null,
    driverPhone: null,
    etaYardTime: row.etaWarehouseTime || row.plannedArrivalTime || resolvePlannedDevanningTime(row),
    gateInTime: row.actualArrivalTime || null,
    dockStartTime: row.devanningStartTime || null,
    dockFinishTime: row.devanningFinishTime || null,
    releaseTime: null,
    gateOutTime: null,
    dockId,
    dockCode: row.dockCode || null,
    operationTaskId: row.status === 'DEVANNING' ? Number(row.id) : null,
    operationStatus: row.status === 'DEVANNING' ? 'IN_PROGRESS' : null,
    operationProgress: progress,
    operationStartTime: row.devanningStartTime || null,
    operationFinishTime: row.devanningFinishTime || null,
    estimatedFinishTime: resolvePlannedDevanningTime(row),
    loadedQty: inboundedBoxQty || null,
    totalQty: totalBoxQty || null,
    loadedPalletQty: null,
    totalPalletQty: null,
    openInternalTaskId: null,
    openInternalTaskNo: null,
    openInternalTaskType: null,
    openInternalTaskStatus: null,
    openInternalTaskTargetCode: null,
    visitNo: 1,
    unloadRoundNo: 1,
    isReentry: 0,
    reentryReason: null,
    parentTaskId: null,
    exceptionFlag: Number(row.exceptionFlag || 0),
    exceptionReason: row.status === 'EXCEPTION' ? row.remark : null,
    source: 'WMS',
    remark: row.remark || null,
    tenantId: '000000',
    warehouseId: 1,
    warehouseCode: 'WH-LA-01',
    warehouseName: 'LA 仓',
    createTime: row.createTime || '2026-05-01 10:00:00'
  };
}

function priorityLabel(level: string | null | undefined): string {
  const m: Record<string, string> = { A: '高', B: '中', C: '低' };
  return level ? m[level] || level : '中';
}

function getGroupSummary(containerOrderId: number) {
  const planItems = buildInboundPlanItemsFromContainer(containerOrderId, 81001);
  const groups = [...new Set(planItems.map(i => i.groupCode || '未分组'))];
  const totalPalletQty = planItems.reduce((s, i) => s + Number(i.palletQty || 0), 0);
  return {
    labels: groups.length ? groups.join('、') : '—',
    totalPalletQty: totalPalletQty || 0
  };
}

function buildWorkTaskFromOrder(row: Record<string, any>, dockIdOverride?: number): DevanningWorkTask {
  const enriched = enrichDevanningRow(row as (typeof MOCK_WMS_DEVANNING_ORDERS)[number]);
  const ws = mapWorkStatus(String(row.status));
  const totalBoxQty = Number(row.totalBoxQty || 0);
  const markedBoxQty = getTaskLiveMarkedQty(Number(row.id), Number(row.inboundedBoxQty || 0));
  const containerOrderId = resolveContainerOrderId(row);
  const groupSummary = getGroupSummary(containerOrderId);
  const dockCode = row.dockCode || null;
  const dockId = dockIdOverride ?? resolveDockIdByCode(dockCode);
  const priorityLevel = String(enriched.timelinessLevel || 'B');
  const isaTripQty = Number(enriched.plannedTruckQty || 0);
  const totalCbm = Number(enriched.totalCbm || 0);
  const devanningStatus = String(row.status || 'ARRIVED');
  const plannedDevanningTime = resolvePlannedDevanningTime(row);
  const devanningDate = formatDateOnly(plannedDevanningTime);
  const today = todayDateStr();
  const isTodayDevanning = devanningDate === today;
  const dispatchSynced = isTodayDevanning && SCHEDULABLE_STATUSES.has(devanningStatus);

  return {
    id: Number(row.id),
    devanningNo: row.devanningNo || row.orderNo,
    containerNo: row.containerNo,
    expectedArrivalTime: row.etaWarehouseTime || row.plannedArrivalTime || null,
    plannedDevanningTime,
    devanningDate,
    isTodayDevanning,
    dispatchSynced,
    devanningPriority: priorityLabel(priorityLevel),
    devanningPriorityLevel: priorityLevel,
    isaTripQty,
    totalCbm,
    isaCbmLabel: `${isaTripQty}车 / ${totalCbm} CBM`,
    devanningStatus,
    devanningStatusLabel: DEVANNING_STATUS_LABEL[devanningStatus] || devanningStatus,
    workStatus: ws,
    workStatusLabel: workStatusLabel(ws),
    dockId,
    dockCode,
    progressPercent: calcProgressPercent(markedBoxQty, totalBoxQty),
    markedBoxQty,
    totalPalletQty: groupSummary.totalPalletQty,
    devanningGroups: enriched.devanningTeam || '—',
    totalBoxQty,
    devanningSupplier: enriched.devanningSupplier || null,
    devanningFee: enriched.devanningFee != null ? Number(enriched.devanningFee) : null,
    extraOperationFee: Number(enriched.extraOperationFee || 0),
    extraOperationFeeRemark: enriched.extraOperationFeeRemark || null,
    devanningStartTime: row.devanningStartTime || null,
    devanningFinishTime: row.devanningFinishTime || null,
    sourceOrderId: containerOrderId,
    customerName: row.customerName || null
  };
}

export function updateDevanningWorkDock(taskId: number | string, dockId: number | string) {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId)) as any;
  if (!order) throw new Error('拆柜任务不存在');
  const dockCode = DOCK_ID_CODE[String(dockId)] || 'DOC-LA-001';
  order.dockCode = dockCode;
  return buildWorkTaskFromOrder(order, Number(dockId));
}

export function updateDevanningWorkDate(taskId: number | string, devanningDate: string) {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId)) as any;
  if (!order) throw new Error('拆柜任务不存在');
  const datePart = formatDateOnly(devanningDate) || devanningDate;
  order.plannedDevanningTime = `${datePart} 08:00:00`;
  return buildWorkTaskFromOrder(order);
}

export function updateDevanningWorkExtraFee(
  taskId: number | string,
  payload: { amount: number; remark: string }
) {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId)) as any;
  if (!order) throw new Error('\u62c6\u67dc\u4efb\u52a1\u4e0d\u5b58\u5728');
  order.extraOperationFee = payload.amount;
  order.extraOperationFeeRemark = payload.remark.trim();
  return buildWorkTaskFromOrder(order);
}

/** 当日拆柜 + 进行中任务，供 YMS 拆柜调度识别 */
export function getDevanningDispatchTasks(): Api.Yms.YardTask[] {
  const today = todayDateStr();
  return MOCK_WMS_DEVANNING_ORDERS.filter(o => {
    if (o.status === 'CANCELLED' || o.status === 'DEVANNED') return false;
    if (o.status === 'DEVANNING') return true;
    return isScheduledOnDate(o as any, today);
  }).map(o => orderToYardTask(o as any));
}

const DEVANNING_DOCK_DEFS: Array<Pick<Api.Yms.DockBoard, 'id' | 'dockCode' | 'dockName' | 'dockType' | 'dockLocation' | 'gridRow' | 'gridCol' | 'sortOrder'>> = [
  { id: 3010001, dockCode: 'DOC-LA-001', dockName: 'LA 拆柜口 1', dockType: 'DEVANNING', dockLocation: '前院', gridRow: 1, gridCol: 1, sortOrder: 1 },
  { id: 3010005, dockCode: 'DOC-LA-005', dockName: 'LA 拆柜口 2', dockType: 'CONTAINER_DOCK', dockLocation: '前院', gridRow: 1, gridCol: 2, sortOrder: 2 }
];

function resolveDockForOrder(order: Record<string, any>, defaultDockCode: string): string {
  return order.dockCode || defaultDockCode;
}

/** 根据 WMS 拆柜订单动态生成拆柜 Dock 看板 */
export function buildDevanningDispatchDockBoard(): Api.Yms.DockBoard[] {
  const today = todayDateStr();
  const orders = MOCK_WMS_DEVANNING_ORDERS.filter(o => o.status !== 'CANCELLED');

  return DEVANNING_DOCK_DEFS.map(def => {
    const dockOrders = orders.filter(o => resolveDockForOrder(o as any, 'DOC-LA-001') === def.dockCode);
    const activeOrder = dockOrders.find(o => o.status === 'DEVANNING');
    const queuedOrders = dockOrders.filter(
      o =>
        o.status !== 'DEVANNING' &&
        isScheduledOnDate(o as any, today) &&
        ['ARRIVED', 'PICKEDUP', 'UNPICKEDUP', 'EXCEPTION'].includes(String(o.status))
    );

    return {
      ...def,
      dockStatus: activeOrder ? 'OCCUPIED' : queuedOrders.length ? 'QUEUED' : 'IDLE',
      enableQueue: 1,
      maxQueueCount: 3,
      enabledFlag: 1,
      activeTask: activeOrder ? orderToYardTask(activeOrder as any) : null,
      incomingTasks: dockOrders
        .filter(
          o =>
            ['UNPICKEDUP', 'PICKEDUP'].includes(String(o.status)) &&
            isScheduledOnDate(o as any, today)
        )
        .map(o => orderToYardTask(o as any)),
      queuedTasks: queuedOrders.map(o => orderToYardTask(o as any))
    };
  });
}

function qtyUnitLabel(unit: 'BY_CARTON' | 'BY_PALLET') {
  return unit === 'BY_PALLET' ? '板' : '箱';
}

function normalizePallet(p: WorkPallet): WorkPallet {
  const items =
    p.items?.length > 0
      ? p.items
      : [
          {
            cargoOrderId: (p as any).cargoOrderId ?? 0,
            cargoOrderNo: (p as any).cargoOrderNo ?? '-',
            customerName: '',
            receiveQty: p.receiveQty,
            receiveUnitLabel: p.receiveUnitLabel,
            boxQty: p.boxQty
          }
        ];
  const boxQty = items.reduce((s, i) => s + i.boxQty, 0);
  return {
    ...p,
    items,
    orderCount: items.length,
    boxQty,
    receiveQty: items.reduce((s, i) => s + i.receiveQty, 0),
    receiveUnitLabel: p.receiveUnitLabel || '箱',
    status: 'DONE',
    statusLabel: '已完成'
  };
}

function ensurePallets(taskId: number): WorkPallet[] {
  if (!palletStore.has(taskId)) {
    palletStore.set(taskId, [
      normalizePallet({
        id: ++palletIdSeq,
        palletNo: 'PLT-DV-001',
        groupCode: 'FedEx-LAX',
        items: [
          {
            cargoOrderId: 80001,
            cargoOrderNo: 'CO-2026-0001',
            customerName: '\u6f14\u793a\u5ba2\u6237 A',
            receiveQty: 40,
            receiveUnitLabel: '\u7bb1',
            boxQty: 40
          }
        ],
        orderCount: 1,
        boxQty: 40,
        receiveQty: 40,
        receiveUnitLabel: '\u7bb1',
        status: 'DONE',
        statusLabel: '\u5df2\u5b8c\u6210',
        createTime: '2026-06-01 14:20:00',
        actualInboundLocation: 'B\u533a/B05'
      }),
      normalizePallet({
        id: ++palletIdSeq,
        palletNo: 'PLT-DV-002',
        groupCode: 'UPS-ORD',
        items: [
          {
            cargoOrderId: 80001,
            cargoOrderNo: 'CO-2026-0001',
            customerName: '\u6f14\u793a\u5ba2\u6237 A',
            receiveQty: 20,
            receiveUnitLabel: '\u7bb1',
            boxQty: 20
          },
          {
            cargoOrderId: 80003,
            cargoOrderNo: 'CO-2026-0003',
            customerName: '\u6f14\u793a\u5ba2\u6237 A',
            receiveQty: 1,
            receiveUnitLabel: '\u677f',
            boxQty: 15
          }
        ],
        orderCount: 2,
        boxQty: 35,
        receiveQty: 21,
        receiveUnitLabel: '\u7bb1',
        status: 'DONE',
        statusLabel: '\u5df2\u5b8c\u6210',
        createTime: '2026-05-28 10:00:00',
        actualInboundLocation: 'B\u533a/B08'
      })
    ]);
    const k1 = orderKey(taskId, 'FedEx-LAX', 80001);
    const k2 = orderKey(taskId, 'UPS-ORD', 80001);
    const k3 = orderKey(taskId, 'UPS-ORD', 80003);
    orderReceiveState.set(k1, 40);
    orderReceiveState.set(k2, 20);
    orderReceiveState.set(k3, 1);
    orderPalletizedState.set(k1, 40);
    orderPalletizedState.set(k2, 20);
    orderPalletizedState.set(k3, 1);
    seedDemoBoxScans(taskId);
  }
  return palletStore.get(taskId)!;
}

const GROUP_INBOUND_LOC: Record<string, string> = {
  'FedEx-LAX': 'B\u533a/B05',
  'UPS-ORD': 'B\u533a/B08',
  LAX9: 'B\u533a/B03',
  ONT8: 'B\u533a/B12'
};

export type DevanningOrderPalletDetail = {
  palletNo: string;
  groupCode: string;
  boxQty: number;
  weight: number;
  cbm: number;
  status: string;
  containerNo: string;
  cargoOrderNo: string;
  cargoOrderNos: string;
  actualInboundLocation: string | null;
};

function mapWorkPalletToDetail(
  pallet: WorkPallet,
  containerNo: string,
  index: number
): DevanningOrderPalletDetail {
  const orderNos = [...new Set(pallet.items.map(item => item.cargoOrderNo).filter(no => no && no !== '-'))];
  const weights = [500, 420, 360, 280];
  const cbms = [4.2, 3.5, 2.8, 2.1];
  const actualInboundLocation =
    pallet.actualInboundLocation?.trim() || GROUP_INBOUND_LOC[pallet.groupCode] || null;
  return {
    palletNo: pallet.palletNo,
    groupCode: pallet.groupCode,
    boxQty: pallet.boxQty,
    weight: pallet.weightKg ?? weights[index % weights.length],
    cbm: cbms[index % cbms.length],
    status: actualInboundLocation ? 'IN_STOCK' : 'PRE_OUTBOUND',
    containerNo,
    cargoOrderNo: orderNos[0] || '—',
    cargoOrderNos: orderNos.join('\u3001') || '—',
    actualInboundLocation
  };
}

function buildFallbackDetailPallets(
  containerNo: string,
  cargoOrders: Array<{ cargoOrderNo?: string | null }>
): DevanningOrderPalletDetail[] {
  const orderNos = cargoOrders.map(order => order.cargoOrderNo).filter(Boolean) as string[];
  const orderSummary = orderNos.join('\u3001') || '—';
  const primary = orderNos[0] || '—';
  const secondary = orderNos[1] || primary;
  return [
    {
      palletNo: 'PLT-2026-0001',
      groupCode: 'FedEx-LAX',
      boxQty: 40,
      weight: 500,
      cbm: 4.2,
      status: 'IN_STOCK',
      containerNo,
      cargoOrderNo: primary,
      cargoOrderNos: orderSummary,
      actualInboundLocation: 'B\u533a/B05'
    },
    {
      palletNo: 'PLT-2026-0002',
      groupCode: 'UPS-ORD',
      boxQty: 35,
      weight: 420,
      cbm: 3.5,
      status: 'PRE_OUTBOUND',
      containerNo,
      cargoOrderNo: secondary,
      cargoOrderNos: orderNos.length > 1 ? `${primary}\u3001${secondary}` : orderSummary,
      actualInboundLocation: null
    },
    {
      palletNo: 'PLT-2026-0003',
      groupCode: 'FedEx-LAX',
      boxQty: 28,
      weight: 360,
      cbm: 2.8,
      status: 'IN_STOCK',
      containerNo,
      cargoOrderNo: primary,
      cargoOrderNos: orderSummary,
      actualInboundLocation: 'B\u533a/B06'
    }
  ];
}

/** 拆柜订单详情 — 托盘列表（含柜号、订单号、实际入库库位） */
export function buildDevanningDetailPallets(
  orderId: number | string,
  containerNo: string,
  cargoOrders: Array<{ cargoOrderNo?: string | null }> = []
): DevanningOrderPalletDetail[] {
  const taskId = Number(orderId);
  if (!Number.isFinite(taskId)) {
    return buildFallbackDetailPallets(containerNo, cargoOrders);
  }
  const order = MOCK_WMS_DEVANNING_ORDERS.find(row => Number(row.id) === taskId);
  const useWorkPallets =
    palletStore.has(taskId) ||
    (order != null && ['DEVANNING', 'DEVANNED'].includes(String(order.status)));
  if (useWorkPallets) {
    return ensurePallets(taskId).map((pallet, index) => mapWorkPalletToDetail(pallet, containerNo, index));
  }
  return buildFallbackDetailPallets(containerNo, cargoOrders);
}

export function getDevanningWorkTasks(params?: Record<string, any>) {
  const keyword = String(params?.containerNo || params?.keyword || '').trim().toLowerCase();
  const statusFilter = params?.devanningStatus ? String(params.devanningStatus) : null;
  const dockId = params?.dockId;

  let rows: DevanningWorkTask[] = MOCK_WMS_DEVANNING_ORDERS.map(o => buildWorkTaskFromOrder(o as any));

  if (dockId != null && dockId !== '') {
    rows = rows.filter(r => String(r.dockId) === String(dockId));
  }

  if (statusFilter && statusFilter !== 'ALL') {
    rows = rows.filter(r => r.devanningStatus === statusFilter);
  }

  if (keyword) {
    rows = rows.filter(
      r =>
        r.containerNo.toLowerCase().includes(keyword) ||
        r.devanningNo.toLowerCase().includes(keyword) ||
        (r.customerName || '').toLowerCase().includes(keyword)
    );
  }
  return { rows, total: rows.length };
}

export function getDevanningWorkSession(taskId: number | string, dockId?: number | string) {
  const id = Number(taskId);
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === id) as any;
  if (!order) return null;

  ensurePallets(id);
  seedDemoBoxScans(id);

  const containerOrderId =
    order.sourceOrderId ??
    (order.sourceOrderNo ? SOURCE_ORDER_NO_TO_CONTAINER_ID[order.sourceOrderNo] : null) ??
    70001;
  const planItems = buildInboundPlanItemsFromContainer(containerOrderId, 81001);
  const cargoOrders = buildCargoOrdersForContainer(containerOrderId);

  const groupMap = new Map<string, WorkGroup>();

  function collectRecommendedLocations(groupCode: string) {
    const locations = planItems
      .filter(item => (item.groupCode || '未分组') === groupCode && item.preLocation)
      .map(item => String(item.preLocation));
    return [...new Set(locations)].sort();
  }

  for (const co of cargoOrders) {
    const unit = (co.forecastQtyUnit || 'BY_CARTON') as 'BY_CARTON' | 'BY_PALLET';
    const groupCodes = new Set<string>();
    for (const item of planItems) {
      if (Number(item.cargoOrderId) === Number(co.id)) {
        groupCodes.add(item.groupCode || '未分组');
      }
    }

    for (const groupCode of groupCodes) {
      const itemsInGroup = planItems.filter(
        i => Number(i.cargoOrderId) === Number(co.id) && (i.groupCode || '未分组') === groupCode
      );
      const expectedQty =
        unit === 'BY_PALLET'
          ? itemsInGroup.reduce((s, i) => s + Number(i.palletQty || 0), 0)
          : itemsInGroup.reduce((s, i) => s + Number(i.cartonQty || 0), 0);

      const oKey = orderKey(id, groupCode, Number(co.id));
      const receivedQty = orderReceiveState.get(oKey) || 0;
      const palletizedQty = orderPalletizedState.get(oKey) || 0;
      const pendingPalletizeQty = Math.max(0, receivedQty - palletizedQty);

      if (!groupMap.has(groupCode)) {
        groupMap.set(groupCode, {
          groupCode,
          totalExpectedQty: 0,
          totalReceivedQty: 0,
          orders: [],
          recommendedLocations: collectRecommendedLocations(groupCode)
        });
      }
      const g = groupMap.get(groupCode)!;
      g.orders.push({
        cargoOrderId: Number(co.id),
        cargoOrderNo: co.cargoOrderNo,
        customerName: co.customerName,
        forecastQtyUnit: unit,
        qtyUnitLabel: qtyUnitLabel(unit),
        expectedQty,
        receivedQty,
        palletizedQty,
        pendingPalletizeQty
      });
      g.totalExpectedQty += expectedQty;
      g.totalReceivedQty += receivedQty;
    }
  }

  const groups = Array.from(groupMap.values());
  const marked = groups.reduce((s, g) => s + g.totalReceivedQty, 0);
  const allPallets = ensurePallets(id);

  return {
    taskId: id,
    devanningNo: order.devanningNo || order.orderNo,
    containerNo: order.containerNo,
    dockId: Number(dockId ?? 3010001),
    dockCode: order.dockCode || 'DOC-LA-001',
    customerName: order.customerName || cargoOrders[0]?.customerName,
    status: String(order.status || 'ARRIVED'),
    devanningStartTime: order.devanningStartTime || null,
    devanningFinishTime: order.devanningFinishTime || null,
    totalBoxQty: Number(order.totalBoxQty || 0),
    markedBoxQty: marked,
    groups,
    pallets: allPallets.map(normalizePallet),
    boxScans: [...ensureBoxScanLogs(id)]
  } as DevanningWorkSession;
}

function resolvePalletBoxQty(
  containerOrderId: number,
  groupCode: string,
  cargoOrderId: number,
  unit: 'BY_CARTON' | 'BY_PALLET',
  receiveQty: number
) {
  if (unit === 'BY_CARTON') return receiveQty;
  const planItems = buildInboundPlanItemsFromContainer(containerOrderId, 81001);
  const items = planItems.filter(
    i => Number(i.cargoOrderId) === cargoOrderId && (i.groupCode || '未分组') === groupCode
  );
  const totalCarton = items.reduce((s, i) => s + Number(i.cartonQty || 0), 0);
  const totalPallet = items.reduce((s, i) => s + Number(i.palletQty || 0), 0);
  if (totalPallet > 0) return Math.max(1, Math.round((totalCarton / totalPallet) * receiveQty));
  return receiveQty * 20;
}

function buildPalletItem(
  containerOrderId: number,
  groupCode: string,
  cargoOrderId: number,
  qty: number,
  ord: WorkOrder
): WorkPalletItem {
  return {
    cargoOrderId,
    cargoOrderNo: ord.cargoOrderNo,
    customerName: ord.customerName,
    receiveQty: qty,
    receiveUnitLabel: ord.qtyUnitLabel,
    boxQty: resolvePalletBoxQty(
      containerOrderId,
      groupCode,
      cargoOrderId,
      ord.forecastQtyUnit,
      qty
    )
  };
}

function pushPalletRecord(
  tid: number,
  payload: { groupCode: string; items: WorkPalletItem[]; palletNo?: string }
) {
  const pallets = ensurePallets(tid);
  const newId = ++palletIdSeq;
  const items = payload.items;
  pallets.push(
    normalizePallet({
      id: newId,
      palletNo: payload.palletNo || `PLT-DV-${String(tid)}-${String(newId).slice(-4)}`,
      groupCode: payload.groupCode,
      items,
      orderCount: items.length,
      boxQty: items.reduce((s, i) => s + i.boxQty, 0),
      receiveQty: items.reduce((s, i) => s + i.receiveQty, 0),
      receiveUnitLabel: '\u7bb1',
      status: 'DONE',
      statusLabel: '\u5df2\u5b8c\u6210',
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
  );
  return newId;
}

function createPalletRecord(
  tid: number,
  payload: { groupCode: string; cargoOrderId: number; qty: number; palletNo?: string },
  ord: WorkOrder,
  containerOrderId: number
) {
  const item = buildPalletItem(
    containerOrderId,
    payload.groupCode,
    payload.cargoOrderId,
    payload.qty,
    ord
  );
  return pushPalletRecord(tid, {
    groupCode: payload.groupCode,
    palletNo: payload.palletNo,
    items: [item]
  });
}

function appendPalletOnReceive(
  tid: number,
  payload: { groupCode: string; cargoOrderId: number; qty: number; palletNo?: string },
  ord: WorkOrder,
  containerOrderId: number
) {
  const key = orderKey(tid, payload.groupCode, payload.cargoOrderId);
  createPalletRecord(tid, payload, ord, containerOrderId);
  orderReceiveState.set(key, (orderReceiveState.get(key) || 0) + payload.qty);
  orderPalletizedState.set(key, (orderPalletizedState.get(key) || 0) + payload.qty);
}

function flushPendingPalletize(
  tid: number,
  groupCode: string,
  cargoOrderId: number,
  ord: WorkOrder,
  containerOrderId: number
) {
  const key = orderKey(tid, groupCode, cargoOrderId);
  const received = orderReceiveState.get(key) || 0;
  const palletized = orderPalletizedState.get(key) || 0;
  let pending = received - palletized;
  while (pending > 0) {
    const chunk =
      pending >= PALLET_AUTO_BOX_CHUNK
        ? PALLET_AUTO_BOX_CHUNK
        : received >= ord.expectedQty
          ? pending
          : 0;
    if (chunk <= 0) break;
    createPalletRecord(tid, { groupCode, cargoOrderId, qty: chunk }, ord, containerOrderId);
    orderPalletizedState.set(key, (orderPalletizedState.get(key) || 0) + chunk);
    pending -= chunk;
  }
}

function resolveScanTarget(
  taskId: number,
  scanCode: string,
  preferredGroupCode?: string
): ScanMatch | null {
  const devanningOrder = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === taskId) as any;
  if (!devanningOrder) return null;
  const containerOrderId = devanningOrder.sourceOrderId ?? 70001;
  const planItems = buildInboundPlanItemsFromContainer(containerOrderId, 81001);
  const cargoOrders = buildCargoOrdersForContainer(containerOrderId);
  const code = scanCode.trim().toUpperCase();
  if (!code) return null;

  const toMatch = (item: (typeof planItems)[0]): ScanMatch | null => {
    const groupCode = item.groupCode || '未分组';
    if (preferredGroupCode && groupCode !== preferredGroupCode) return null;
    const co = cargoOrders.find(c => Number(c.id) === Number(item.cargoOrderId));
    return {
      groupCode,
      cargoOrderId: Number(item.cargoOrderId),
      cargoOrderNo: item.cargoOrderNo,
      shippingMark: item.shippingMark,
      shipmentNo: item.shipmentNo,
      unit: (co?.forecastQtyUnit || 'BY_CARTON') as 'BY_CARTON' | 'BY_PALLET'
    };
  };

  for (const item of planItems) {
    const mark = String(item.shippingMark || '').toUpperCase();
    if (mark && (code === mark || code.startsWith(`${mark}-`))) {
      const hit = toMatch(item);
      if (hit) return hit;
    }
  }

  for (const item of planItems) {
    const fields = [item.shipmentNo, item.cargoOrderNo, item.poNo].map(f =>
      String(f || '').toUpperCase()
    );
    if (fields.includes(code)) {
      const hit = toMatch(item);
      if (hit) return hit;
    }
  }

  return null;
}

function ensureScannedSet(taskId: number) {
  if (!scannedBoxCodes.has(taskId)) scannedBoxCodes.set(taskId, new Set());
  return scannedBoxCodes.get(taskId)!;
}

function isUniqueBoxBarcode(scanCode: string, match: ScanMatch) {
  const code = scanCode.trim().toUpperCase();
  const mark = String(match.shippingMark || '').toUpperCase();
  return mark && code.startsWith(`${mark}-`) && code.length > mark.length + 1;
}

export function resolveDevanningScan(taskId: number | string, scanCode: string) {
  const tid = Number(taskId);
  const code = String(scanCode || '').trim();
  if (!code) throw new Error('请扫描或输入条码');

  if (/^PLT-/i.test(code)) {
    const session = getDevanningWorkSession(tid);
    const groupCode = session?.groups[0]?.groupCode || '';
    const ord = session?.groups[0]?.orders.find(o => o.receivedQty < o.expectedQty);
    return {
      groupCode,
      cargoOrderId: ord?.cargoOrderId ?? 0,
      cargoOrderNo: ord?.cargoOrderNo ?? '-',
      customerName: ord?.customerName ?? '',
      qtyUnitLabel: ord?.qtyUnitLabel ?? '板',
      scanCode: code,
      isPallet: true,
      qty: 1,
      remark: `卡板 ${code}`
    };
  }

  const match = resolveScanTarget(tid, code);
  if (!match) {
    throw new Error(`未识别条码：${code}，请扫描唛头/货件号/订单号或箱唛`);
  }

  const session = getDevanningWorkSession(tid);
  const group = session?.groups.find(g => g.groupCode === match.groupCode);
  const ord = group?.orders.find(o => o.cargoOrderId === match.cargoOrderId);
  if (!ord) throw new Error('未找到对应订单');

  const remark = match.shippingMark
    ? `唛头 ${match.shippingMark}${match.shipmentNo ? ` / ${match.shipmentNo}` : ''}`
    : code;

  return {
    groupCode: match.groupCode,
    cargoOrderId: match.cargoOrderId,
    cargoOrderNo: match.cargoOrderNo,
    customerName: ord.customerName,
    qtyUnitLabel: ord.qtyUnitLabel,
    shippingMark: match.shippingMark,
    shipmentNo: match.shipmentNo,
    scanCode: code,
    isPallet: false,
    qty: match.unit === 'BY_PALLET' ? 1 : 1,
    remark
  };
}

export function receiveByOrder(
  taskId: number | string,
  payload: { groupCode: string; cargoOrderId: number; qty: number }
) {
  const tid = Number(taskId);
  const key = orderKey(tid, payload.groupCode, payload.cargoOrderId);
  const devanningOrder = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === tid) as any;
  const containerOrderId = devanningOrder?.sourceOrderId ?? 70001;
  const session = getDevanningWorkSession(tid);
  const group = session?.groups.find(g => g.groupCode === payload.groupCode);
  const ord = group?.orders.find(o => o.cargoOrderId === payload.cargoOrderId);
  if (!ord) return null;
  const next = (orderReceiveState.get(key) || 0) + payload.qty;
  if (next > ord.expectedQty) {
    throw new Error(`收货数量不能超过预报 ${ord.expectedQty} ${ord.qtyUnitLabel}`);
  }
  appendPalletOnReceive(tid, payload, ord, Number(containerOrderId));
  return getDevanningWorkSession(tid);
}

/** 收货已含自动打板，保留接口供兼容 */
export function createWorkPallet(
  taskId: number | string,
  payload: { groupCode: string; cargoOrderId: number; boxQty: number; palletNo?: string }
) {
  const tid = Number(taskId);
  const session = getDevanningWorkSession(tid);
  const group = session?.groups.find(g => g.groupCode === payload.groupCode);
  const ord = group?.orders.find(o => o.cargoOrderId === payload.cargoOrderId);
  if (!ord) return null;
  return receiveByOrder(tid, {
    groupCode: payload.groupCode,
    cargoOrderId: payload.cargoOrderId,
    qty: Math.min(payload.boxQty, ord.expectedQty - ord.receivedQty)
  });
}

export function deleteWorkPallet(taskId: number | string, palletId: number) {
  const tid = Number(taskId);
  const pallets = ensurePallets(tid);
  const idx = pallets.findIndex(p => p.id === palletId);
  if (idx < 0) throw new Error('\u5361\u677f\u8bb0\u5f55\u4e0d\u5b58\u5728');
  const p = normalizePallet(pallets[idx]);
  for (const item of p.items) {
    const key = orderKey(tid, p.groupCode, item.cargoOrderId);
    orderReceiveState.set(
      key,
      Math.max(0, (orderReceiveState.get(key) || 0) - item.receiveQty)
    );
    orderPalletizedState.set(
      key,
      Math.max(0, (orderPalletizedState.get(key) || 0) - item.receiveQty)
    );
  }
  pallets.splice(idx, 1);
  return getDevanningWorkSession(tid);
}

export function palletizeSelection(
  taskId: number | string,
  payload: {
    groupCode: string;
    items: Array<{ cargoOrderId: number; qty: number }>;
    palletNo?: string;
  }
) {
  const tid = Number(taskId);
  const devanningOrder = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === tid) as any;
  if (!devanningOrder) return null;
  const containerOrderId = Number(devanningOrder.sourceOrderId ?? 70001);
  const session = getDevanningWorkSession(tid);
  const group = session?.groups.find(g => g.groupCode === payload.groupCode);
  if (!group) throw new Error('\u5206\u7ec4\u4e0d\u5b58\u5728');

  const merged = new Map<number, number>();
  for (const line of payload.items) {
    merged.set(line.cargoOrderId, (merged.get(line.cargoOrderId) || 0) + line.qty);
  }

  const palletItems: WorkPalletItem[] = [];
  for (const [cargoOrderId, qty] of merged.entries()) {
    const ord = group.orders.find(o => o.cargoOrderId === cargoOrderId);
    if (!ord) throw new Error('\u672a\u627e\u5230\u5bf9\u5e94\u8ba2\u5355');
    const key = orderKey(tid, payload.groupCode, cargoOrderId);
    const next = (orderReceiveState.get(key) || 0) + qty;
    if (next > ord.expectedQty) {
      throw new Error(
        `\u6536\u8d27\u6570\u91cf\u4e0d\u80fd\u8d85\u8fc7\u9884\u62a5 ${ord.expectedQty} ${ord.qtyUnitLabel}`
      );
    }
    palletItems.push(
      buildPalletItem(containerOrderId, payload.groupCode, cargoOrderId, qty, ord)
    );
    orderReceiveState.set(key, next);
    orderPalletizedState.set(key, (orderPalletizedState.get(key) || 0) + qty);
  }

  if (!palletItems.length) throw new Error('\u65e0\u6536\u8d27\u660e\u7ec6');

  pushPalletRecord(tid, {
    groupCode: payload.groupCode,
    palletNo: payload.palletNo,
    items: palletItems
  });
  return getDevanningWorkSession(tid);
}

/** 人工拆柜：按目的地分组录入尺寸重量后生成板贴 */
export function createGroupPalletLabel(
  taskId: number | string,
  payload: {
    groupCode: string;
    qty: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
  }
) {
  const tid = Number(taskId);
  const devanningOrder = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === tid) as any;
  if (!devanningOrder) throw new Error('\u4efb\u52a1\u4e0d\u5b58\u5728');
  if (devanningOrder.devanningFinishTime || devanningOrder.status === 'DEVANNED') {
    throw new Error('\u62c6\u67dc\u5df2\u5b8c\u6210');
  }
  if (!devanningOrder.devanningStartTime && devanningOrder.status !== 'DEVANNING') {
    devanningOrder.devanningStartTime = nowStr();
    devanningOrder.status = 'DEVANNING';
  }

  const containerOrderId = Number(devanningOrder.sourceOrderId ?? 70001);
  const session = getDevanningWorkSession(tid);
  const group = session?.groups.find(g => g.groupCode === payload.groupCode);
  if (!group) throw new Error('\u5206\u7ec4\u4e0d\u5b58\u5728');

  let targetOrd: WorkOrder | null = null;
  for (const ord of group.orders) {
    const key = orderKey(tid, payload.groupCode, ord.cargoOrderId);
    const received = orderReceiveState.get(key) || 0;
    if (received < ord.expectedQty) {
      targetOrd = ord;
      break;
    }
  }
  targetOrd = targetOrd || group.orders[0];
  if (!targetOrd) throw new Error('\u65e0\u53ef\u6536\u8d27\u8ba2\u5355');

  const key = orderKey(tid, payload.groupCode, targetOrd.cargoOrderId);
  const received = orderReceiveState.get(key) || 0;
  const remain = targetOrd.expectedQty - received;
  if (payload.qty <= 0) throw new Error('\u8bf7\u8f93\u5165\u6709\u6548\u6570\u91cf');
  if (payload.qty > remain) {
    throw new Error(
      `\u6570\u91cf\u4e0d\u80fd\u8d85\u8fc7\u5269\u4f59 ${remain} ${targetOrd.qtyUnitLabel}`
    );
  }

  const item = buildPalletItem(
    containerOrderId,
    payload.groupCode,
    targetOrd.cargoOrderId,
    payload.qty,
    targetOrd
  );

  const pallets = ensurePallets(tid);
  const newId = ++palletIdSeq;
  const palletNo = `PLT-LBL-${String(tid).slice(-4)}-${String(newId).slice(-4)}`;
  const pallet = normalizePallet({
    id: newId,
    palletNo,
    groupCode: payload.groupCode,
    items: [item],
    orderCount: 1,
    boxQty: item.boxQty,
    receiveQty: item.receiveQty,
    receiveUnitLabel: item.receiveUnitLabel,
    status: 'DONE',
    statusLabel: '\u5df2\u5b8c\u6210',
    createTime: nowStr(),
    lengthCm: payload.lengthCm,
    widthCm: payload.widthCm,
    heightCm: payload.heightCm,
    weightKg: payload.weightKg
  });
  pallets.push(pallet);

  orderReceiveState.set(key, received + payload.qty);
  orderPalletizedState.set(key, (orderPalletizedState.get(key) || 0) + payload.qty);

  return {
    session: getDevanningWorkSession(tid),
    pallet
  };
}

export function receiveByBox(
  taskId: number | string,
  payload: { scanCode: string; qty?: number; groupCode?: string }
) {
  const tid = Number(taskId);
  const scanCode = String(payload.scanCode || '').trim();
  if (!scanCode) throw new Error('请扫描或输入条码');

  const devanningOrder = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === tid) as any;
  if (!devanningOrder) return null;
  if (devanningOrder.devanningFinishTime || devanningOrder.status === 'DEVANNED') {
    throw new Error('拆柜已完成，无法收货');
  }
  if (!devanningOrder.devanningStartTime && devanningOrder.status !== 'DEVANNING') {
    throw new Error('请先开始拆柜');
  }

  const containerOrderId = Number(devanningOrder.sourceOrderId ?? 70001);
  const match = resolveScanTarget(tid, scanCode, payload.groupCode);
  if (!match) {
    throw new Error(`未识别条码：${scanCode}，请扫描唛头/货件号/订单号或箱唛`);
  }

  if (isUniqueBoxBarcode(scanCode, match)) {
    const scanned = ensureScannedSet(tid);
    const codeKey = scanCode.toUpperCase();
    if (scanned.has(codeKey)) throw new Error(`该箱已扫过：${scanCode}`);
    scanned.add(codeKey);
  }

  const session = getDevanningWorkSession(tid);
  const group = session?.groups.find(g => g.groupCode === match.groupCode);
  const ord = group?.orders.find(o => o.cargoOrderId === match.cargoOrderId);
  if (!ord) throw new Error('未找到对应订单');

  const qty = Math.max(1, Number(payload.qty) || 1);
  const receiveUnit = match.unit === 'BY_PALLET' ? 1 : qty;
  const key = orderKey(tid, match.groupCode, match.cargoOrderId);
  const next = (orderReceiveState.get(key) || 0) + receiveUnit;
  if (next > ord.expectedQty) {
    throw new Error(`收货数量不能超过预报 ${ord.expectedQty} ${ord.qtyUnitLabel}`);
  }

  orderReceiveState.set(key, next);
  if (match.unit === 'BY_CARTON') {
    flushPendingPalletize(tid, match.groupCode, match.cargoOrderId, ord, containerOrderId);
  } else {
    createPalletRecord(
      tid,
      { groupCode: match.groupCode, cargoOrderId: match.cargoOrderId, qty: receiveUnit },
      ord,
      containerOrderId
    );
    orderPalletizedState.set(key, (orderPalletizedState.get(key) || 0) + receiveUnit);
  }

  appendBoxScanLog(tid, {
    scanCode,
    groupCode: match.groupCode,
    cargoOrderId: match.cargoOrderId,
    cargoOrderNo: match.cargoOrderNo,
    customerName: ord.customerName,
    qty: match.unit === 'BY_PALLET' ? receiveUnit : qty,
    shippingMark: match.shippingMark || null
  });

  return getDevanningWorkSession(tid);
}

export function receiveByPallet(
  taskId: number | string,
  payload: { palletNo: string; groupCode?: string; boxQty?: number }
) {
  const tid = Number(taskId);
  const palletNo = String(payload.palletNo || '').trim();
  if (!palletNo) throw new Error('请扫描卡板条码');

  const devanningOrder = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === tid) as any;
  if (!devanningOrder) return null;
  if (devanningOrder.devanningFinishTime || devanningOrder.status === 'DEVANNED') {
    throw new Error('拆柜已完成，无法收货');
  }

  const pallets = ensurePallets(tid);
  if (pallets.some(p => p.palletNo.toUpperCase() === palletNo.toUpperCase())) {
    throw new Error(`卡板 ${palletNo} 已登记`);
  }

  const session = getDevanningWorkSession(tid);
  const groupCode = payload.groupCode || session?.groups[0]?.groupCode;
  const group = session?.groups.find(g => g.groupCode === groupCode);
  const ord = group?.orders.find(o => o.receivedQty < o.expectedQty);
  if (!ord || !groupCode) throw new Error('该分组无可收货订单');

  const containerOrderId = Number(devanningOrder.sourceOrderId ?? 70001);
  const qty =
    Number(payload.boxQty) ||
    (ord.forecastQtyUnit === 'BY_PALLET' ? 1 : Math.min(PALLET_AUTO_BOX_CHUNK, ord.expectedQty - ord.receivedQty));

  const key = orderKey(tid, groupCode, ord.cargoOrderId);
  const next = (orderReceiveState.get(key) || 0) + qty;
  if (next > ord.expectedQty) {
    throw new Error(`收货数量不能超过预报 ${ord.expectedQty} ${ord.qtyUnitLabel}`);
  }

  createPalletRecord(
    tid,
    { groupCode, cargoOrderId: ord.cargoOrderId, qty, palletNo },
    ord,
    containerOrderId
  );
  orderReceiveState.set(key, next);
  orderPalletizedState.set(key, (orderPalletizedState.get(key) || 0) + qty);

  appendBoxScanLog(tid, {
    scanCode: palletNo,
    groupCode,
    cargoOrderId: ord.cargoOrderId,
    cargoOrderNo: ord.cargoOrderNo,
    customerName: ord.customerName,
    qty
  });

  return getDevanningWorkSession(tid);
}

export function startDevanningWork(taskId: number | string) {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId)) as any;
  if (!order) throw new Error('拆柜任务不存在');
  if (order.devanningFinishTime || order.status === 'DEVANNED') {
    throw new Error('拆柜已完成');
  }
  if (!order.devanningStartTime) {
    order.devanningStartTime = nowStr();
  }
  if (order.status !== 'DEVANNING' && order.status !== 'DEVANNED') {
    order.status = 'DEVANNING';
  }
  return getDevanningWorkSession(taskId);
}

export function completeDevanningWork(taskId: number | string) {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId)) as any;
  if (!order) throw new Error('拆柜任务不存在');
  if (!order.devanningStartTime) {
    throw new Error('请先开始拆柜');
  }
  if (order.devanningFinishTime || order.status === 'DEVANNED') {
    throw new Error('拆柜已完成');
  }
  order.status = 'DEVANNED';
  order.devanningFinishTime = nowStr();
  syncDevanningComplete(taskId);
  return getDevanningWorkSession(taskId);
}
