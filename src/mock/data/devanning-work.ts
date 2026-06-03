import { MOCK_WMS_DEVANNING_ORDERS } from './wms';
import { buildInboundPlanItemsFromContainer, buildCargoOrdersForContainer } from './oms-container-cargo';

/** dockId -> dockCode */
export const DOCK_ID_CODE: Record<string, string> = {
  '3010001': 'DOC-LA-001',
  '3010002': 'DOC-LA-002'
};

export type DevanningWorkTask = {
  id: number;
  devanningNo: string;
  containerNo: string;
  orderType: string;
  totalBoxQty: number;
  markedBoxQty: number;
  workStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  workStatusLabel: string;
  devanningStartTime: string | null;
  devanningFinishTime: string | null;
  dockId: number;
  dockCode: string;
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
};

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

const orderReceiveState = new Map<string, number>();
const orderPalletizedState = new Map<string, number>();
const palletStore = new Map<number, WorkPallet[]>();
const scannedBoxCodes = new Map<number, Set<string>>();
let palletIdSeq = 90000;

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
        createTime: '2026-06-01 14:20:00'
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
        createTime: '2026-05-28 10:00:00'
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
  }
  return palletStore.get(taskId)!;
}

export function getDevanningWorkTasks(params?: Record<string, any>) {
  const dockId = String(params?.dockId ?? '3010001');
  const dockCode = DOCK_ID_CODE[dockId] || 'DOC-LA-001';
  const keyword = String(params?.containerNo || params?.keyword || '').trim().toLowerCase();

  let rows: DevanningWorkTask[] = MOCK_WMS_DEVANNING_ORDERS.filter(o => {
    const code = (o as any).dockCode || 'DOC-LA-001';
    return code === dockCode || String(code).includes('DOC-LA');
  }).map(o => {
    const row = o as any;
    const ws = mapWorkStatus(String(o.status));
    return {
      id: Number(row.id),
      devanningNo: row.devanningNo || row.orderNo,
      containerNo: row.containerNo,
      orderType: '海运',
      totalBoxQty: Number(row.totalBoxQty || 0),
      markedBoxQty: Number(row.inboundedBoxQty || 0),
      workStatus: ws,
      workStatusLabel: workStatusLabel(ws),
      devanningStartTime: row.devanningStartTime || null,
      devanningFinishTime: row.devanningFinishTime || null,
      dockId: Number(dockId),
      dockCode: row.dockCode || dockCode,
      sourceOrderId: row.sourceOrderId ?? 70001,
      customerName: row.customerName
    };
  });

  if (keyword) {
    rows = rows.filter(
      r =>
        r.containerNo.toLowerCase().includes(keyword) ||
        r.devanningNo.toLowerCase().includes(keyword)
    );
  }
  return { rows, total: rows.length };
}

export function getDevanningWorkSession(taskId: number | string, dockId?: number | string) {
  const id = Number(taskId);
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === id) as any;
  if (!order) return null;

  const containerOrderId = order.sourceOrderId ?? 70001;
  const planItems = buildInboundPlanItemsFromContainer(containerOrderId, 81001);
  const cargoOrders = buildCargoOrdersForContainer(containerOrderId);
  ensurePallets(id);

  const groupMap = new Map<string, WorkGroup>();

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
          orders: []
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
    pallets: allPallets.map(normalizePallet)
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
  return getDevanningWorkSession(taskId);
}
