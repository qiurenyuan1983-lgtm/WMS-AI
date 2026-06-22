import {
  resolveCargoOperationStatus,
  resolveContainerOperationStatus,
  resolveOutboundOperationStatus
} from '@/utils/oms/operation-status';
import { filterContainerOrderList, fuzzyIncludes, fuzzyIncludesAny, hasFuzzyKeyword, fuzzyKeyword } from '../fuzzy-search';
import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';
import { MOCK_CARGO_ORDERS, MOCK_CONTAINER_ORDERS } from './oms-list-seed';
import { assertCargoOutboundEligible, syncOutboundComplete } from './oms-golden-path';

export { MOCK_CARGO_ORDERS, MOCK_CONTAINER_ORDERS };

const base = { tenantId: '000000', companyId: MOCK_COMPANY.id, warehouseId: MOCK_WAREHOUSE.id, warehouseCode: MOCK_WAREHOUSE.warehouseCode, warehouseName: MOCK_WAREHOUSE.warehouseName, createTime: '2026-05-01 10:00:00' };

const OUTBOUND_ORDER_SEED = [
  {
    id: 90001,
    ...base,
    outboundOrderNo: 'TRIP250604001',
    outboundStatus: 'PENDING_LOADING',
    outboundDirection: 'DELIVERY',
    customerName: '???? A / ???? B',
    cargoOrderCount: 5,
    actualCartonQty: 120,
    actualPalletQty: 26,
    actualWeight: 8500,
    actualCbm: 42.5,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-05 10:00',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: 'XLX7',
    isaNo: 'ISA-8844221',
    businessType: 'Amazon',
    vehicleType: '53?',
    supplierName: 'ABC Trucking',
    driverName: 'John',
    driverPhone: '+1 626-555-0100',
    licensePlate: '8ABC123',
    trailerNo: 'TRL-5521',
    dockNo: '05',
    hasException: false,
    operatorName: '?? Aaron',
    createTime: '2026-06-04 08:30:00',
    remark: null
  },
  {
    id: 90002,
    ...base,
    outboundOrderNo: 'TRIP250604002',
    outboundStatus: 'LOADING',
    outboundDirection: 'DELIVERY',
    customerName: '???? C',
    cargoOrderCount: 3,
    actualCartonQty: 86,
    actualPalletQty: 18,
    actualWeight: 5200,
    actualCbm: 28.2,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-05 14:00',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: 'LGB8',
    isaNo: 'ISA-7722100',
    businessType: 'Amazon',
    vehicleType: '26?',
    supplierName: 'FastLine Logistics',
    driverName: 'Mike',
    driverPhone: '+1 909-555-0200',
    licensePlate: '7XYZ789',
    trailerNo: 'TRL-3310',
    dockNo: '03',
    hasException: false,
    operatorName: '?? Aaron',
    createTime: '2026-06-04 09:15:00',
    remark: null
  },
  {
    id: 90003,
    ...base,
    outboundOrderNo: 'TRIP250604003',
    outboundStatus: 'PENDING_CHECKIN',
    outboundDirection: 'DELIVERY',
    customerName: '???? D',
    cargoOrderCount: 2,
    actualCartonQty: 45,
    actualPalletQty: 8,
    actualWeight: 2100,
    actualCbm: 12.6,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-06 09:00',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: '????-???',
    isaNo: 'APT-556677',
    businessType: '????',
    vehicleType: 'Box Truck',
    supplierName: 'ABC Trucking',
    driverName: 'Carlos',
    driverPhone: '+1 213-555-0300',
    licensePlate: '6DEF456',
    trailerNo: null,
    dockNo: null,
    hasException: false,
    operatorName: '?? Amy',
    createTime: '2026-06-04 10:00:00',
    remark: null
  },
  {
    id: 90004,
    ...base,
    outboundOrderNo: 'TRIP250603018',
    outboundStatus: 'DEPARTED',
    outboundDirection: 'DELIVERY',
    customerName: '???? A',
    cargoOrderCount: 4,
    actualCartonQty: 98,
    actualPalletQty: 22,
    actualWeight: 6800,
    actualCbm: 36.8,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-04 08:00',
    actualOutboundTime: '2026-06-04 09:45:00',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: 'ONT8',
    isaNo: 'ISA-6611002',
    businessType: 'Amazon',
    vehicleType: '53?',
    supplierName: 'Pacific Haul',
    driverName: 'David',
    driverPhone: '+1 562-555-0400',
    licensePlate: '9GHI321',
    trailerNo: 'TRL-8899',
    dockNo: '07',
    hasException: false,
    operatorName: '?? Aaron',
    createTime: '2026-06-03 14:20:00',
    remark: null
  },
  {
    id: 90005,
    ...base,
    outboundOrderNo: 'TRIP250603015',
    outboundStatus: 'COMPLETED',
    outboundDirection: 'DELIVERY',
    customerName: '???? B',
    cargoOrderCount: 6,
    actualCartonQty: 150,
    actualPalletQty: 30,
    actualWeight: 9200,
    actualCbm: 48.5,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-03 10:00',
    actualOutboundTime: '2026-06-03 11:20:00',
    actualSignedTime: '2026-06-03 16:40:00',
    completedTime: '2026-06-03 17:00:00',
    podStatus: 'UPLOADED',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: 'XLX7',
    isaNo: 'ISA-5500118',
    businessType: 'Amazon',
    vehicleType: '53?',
    supplierName: 'ABC Trucking',
    driverName: 'John',
    driverPhone: '+1 626-555-0100',
    licensePlate: '8ABC123',
    trailerNo: 'TRL-5521',
    dockNo: '05',
    hasException: false,
    operatorName: '?? Aaron',
    createTime: '2026-06-02 16:00:00',
    remark: null
  },
  {
    id: 90006,
    ...base,
    outboundOrderNo: 'TRIP250602009',
    outboundStatus: 'CLOSED_EXCEPTION',
    outboundDirection: 'DELIVERY',
    customerName: '???? E',
    cargoOrderCount: 2,
    actualCartonQty: 52,
    actualPalletQty: 10,
    actualWeight: 2800,
    actualCbm: 15.2,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-02 13:00',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: 'XLX7',
    isaNo: 'ISA-4400991',
    businessType: 'FBX',
    vehicleType: '26?',
    supplierName: 'FastLine Logistics',
    driverName: 'Tom',
    driverPhone: '+1 714-555-0500',
    licensePlate: '5JKL654',
    trailerNo: 'TRL-2201',
    dockNo: '02',
    hasException: true,
    operatorName: 'QC Lisa',
    createTime: '2026-06-01 11:30:00',
    remark: '??? 2 ??????'
  },
  {
    id: 90007,
    ...base,
    outboundOrderNo: 'TRIP250604004',
    outboundStatus: 'PENDING_SUPPLIER',
    outboundDirection: 'DELIVERY',
    customerName: '???? F',
    cargoOrderCount: 1,
    actualCartonQty: 32,
    actualPalletQty: 6,
    actualWeight: 1500,
    actualCbm: 8.4,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-07 11:00',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: 'SMF3',
    isaNo: 'ISA-9988776',
    businessType: 'Amazon',
    vehicleType: '26?',
    supplierName: null,
    driverName: null,
    driverPhone: null,
    licensePlate: null,
    trailerNo: null,
    dockNo: null,
    hasException: false,
    operatorName: '?? Aaron',
    createTime: '2026-06-04 11:00:00',
    remark: null
  },
  {
    id: 90008,
    ...base,
    outboundOrderNo: 'TRIP250604005',
    outboundStatus: 'PENDING_DOCK',
    outboundDirection: 'DELIVERY',
    customerName: '???? G',
    cargoOrderCount: 3,
    actualCartonQty: 68,
    actualPalletQty: 14,
    actualWeight: 4100,
    actualCbm: 22.1,
    appointmentStatus: 'APPOINTED',
    appointmentTime: '2026-06-05 16:00',
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: 'LAX9',
    isaNo: 'ISA-1122334',
    businessType: 'LTL',
    vehicleType: '53?',
    supplierName: 'Pacific Haul',
    driverName: 'Kevin',
    driverPhone: '+1 818-555-0600',
    licensePlate: '4MNO987',
    trailerNo: 'TRL-7788',
    dockNo: null,
    hasException: false,
    operatorName: '?? Aaron',
    createTime: '2026-06-04 13:45:00',
    remark: null
  }
];

/** 可追加的车次订单列表（LTL 生成订单写入此处） */
export let MOCK_OUTBOUND_ORDERS = [...OUTBOUND_ORDER_SEED];
let outboundOrderIdSeq = 90099;

const OUTBOUND_ADD_CARGO_ALLOWED = new Set([
  'PENDING_DISPATCH',
  'RECOMMENDED',
  'PENDING_DISPATCH_CONFIRM',
  'PENDING_SUPPLIER',
  'PENDING_DRIVER',
  'PENDING_CHECKIN',
  'PENDING_DOCK',
  'PENDING_LOADING',
  'LOADING'
]);

const OUTBOUND_CARGO_ELIGIBLE_STATUS = new Set(['INBOUNDED', 'OUTBOUND_ORDERED', 'DELIVERY_APPOINTED']);

export type OutboundOrderItemRow = {
  id: number;
  outboundOrderId: number;
  outboundOrderNo: string;
  cargoOrderId: number;
  cargoOrderNo: string;
  customerName: string;
  destination: string;
  appointmentNo: string | null;
  platformName: string | null;
  actualCartonQty: number;
  actualPalletQty: number;
  actualWeight: number;
  actualCbm: number;
};

let outboundItemIdSeq = 50000;
const outboundOrderItemsStore = new Map<number, OutboundOrderItemRow[]>();

function cargoDestination(cargo: (typeof MOCK_CARGO_ORDERS)[number]) {
  const r = cargo as Record<string, any>;
  return String(r.platformWarehouseCode || r.city || r.destination || '').trim();
}

function estimateOutboundDeliveryFee(cargo: (typeof MOCK_CARGO_ORDERS)[number]) {
  const pallets = Number(cargo.actualPalletQty) || 1;
  const dest = cargoDestination(cargo);
  const baseRate = ['ONT8', 'LGB8', 'SBD1'].includes(dest) ? 85 : 95;
  const transferSurcharge = cargo.transferFlag ? 120 : 0;
  return Number((pallets * baseRate + transferSurcharge).toFixed(2));
}

function matchOutboundDestination(outboundDest: string | null | undefined, cargo: (typeof MOCK_CARGO_ORDERS)[number]) {
  const dest = String(outboundDest ?? '').trim();
  const cargoDest = cargoDestination(cargo);
  if (!dest || !cargoDest) return true;
  if (dest === cargoDest) return true;
  // 原型：FBA 仓码不一致时仍允许添加，便于演示选单
  const fbaWarehouseCodes = new Set(['ONT8', 'LAX9', 'LGB8', 'SMF3', 'ORD2', 'DFW6', 'ATL2', 'SBD1', 'XLX7', 'CLT2']);
  if (fbaWarehouseCodes.has(dest) || fbaWarehouseCodes.has(cargoDest)) return true;
  return dest.includes(cargoDest) || cargoDest.includes(dest);
}

function cargoToOutboundItem(
  outbound: (typeof MOCK_OUTBOUND_ORDERS)[number],
  cargo: (typeof MOCK_CARGO_ORDERS)[number]
): OutboundOrderItemRow {
  const r = cargo as Record<string, any>;
  return {
    id: ++outboundItemIdSeq,
    outboundOrderId: outbound.id,
    outboundOrderNo: outbound.outboundOrderNo,
    cargoOrderId: cargo.id,
    cargoOrderNo: cargo.cargoOrderNo,
    customerName: cargo.customerName,
    destination: cargoDestination(cargo),
    appointmentNo: (r.appointmentNo as string | null) ?? null,
    platformName: (r.platformName as string | null) ?? null,
    actualCartonQty: Number(cargo.actualCartonQty) || 0,
    actualPalletQty: Number(cargo.actualPalletQty) || 0,
    actualWeight: Number(cargo.actualWeight) || 0,
    actualCbm: Number(cargo.actualCbm) || 0
  };
}

function getAssignedOutboundCargoIds(): Set<number> {
  const ids = new Set<number>();
  outboundOrderItemsStore.forEach(items => items.forEach(item => ids.add(item.cargoOrderId)));
  return ids;
}

function syncOutboundTotals(outboundId: number) {
  const order = MOCK_OUTBOUND_ORDERS.find(o => o.id === outboundId);
  const items = outboundOrderItemsStore.get(outboundId) ?? [];
  if (!order) return;
  order.cargoOrderCount = items.length;
  order.actualCartonQty = items.reduce((sum, item) => sum + item.actualCartonQty, 0);
  order.actualPalletQty = items.reduce((sum, item) => sum + item.actualPalletQty, 0);
  order.actualWeight = items.reduce((sum, item) => sum + item.actualWeight, 0);
  order.actualCbm = Number(items.reduce((sum, item) => sum + item.actualCbm, 0).toFixed(2));
}

function initOutboundOrderItemsStore() {
  const eligible = MOCK_CARGO_ORDERS.filter(c => OUTBOUND_CARGO_ELIGIBLE_STATUS.has(c.fulfillmentStatus));
  const trip1 = MOCK_OUTBOUND_ORDERS.find(o => o.id === 90001);
  const trip2 = MOCK_OUTBOUND_ORDERS.find(o => o.id === 90002);
  if (trip1) {
    const matched = eligible.filter(c => matchOutboundDestination(trip1.destination, c)).slice(0, 2);
    if (matched.length) {
      outboundOrderItemsStore.set(trip1.id, matched.map(c => cargoToOutboundItem(trip1, c)));
      syncOutboundTotals(trip1.id);
    }
  }
  if (trip2) {
    const assigned = getAssignedOutboundCargoIds();
    const matched = eligible.filter(c => !assigned.has(c.id) && matchOutboundDestination(trip2.destination, c)).slice(0, 1);
    if (matched.length) {
      outboundOrderItemsStore.set(trip2.id, matched.map(c => cargoToOutboundItem(trip2, c)));
      syncOutboundTotals(trip2.id);
    }
  }
}

initOutboundOrderItemsStore();

export function getOutboundOrderItems(outboundId: number) {
  return outboundOrderItemsStore.get(outboundId) ?? [];
}

export function getOutboundAvailableOrders(outboundId: number, params: Record<string, any> = {}) {
  const outbound = MOCK_OUTBOUND_ORDERS.find(o => o.id === outboundId);
  if (!outbound) return mockPage([], params);
  const assignedIds = getAssignedOutboundCargoIds();
  const keyword = String(params.keyword ?? '').trim();
  let rows = MOCK_CARGO_ORDERS.filter(
    cargo =>
      OUTBOUND_CARGO_ELIGIBLE_STATUS.has(cargo.fulfillmentStatus) &&
      !assignedIds.has(cargo.id) &&
      matchOutboundDestination(outbound.destination, cargo)
  ).map(cargo => {
    const r = cargo as Record<string, any>;
    return {
      id: cargo.id,
      cargoOrderNo: cargo.cargoOrderNo,
      customerName: cargo.customerName,
      destination: cargoDestination(cargo),
      appointmentNo: (r.appointmentNo as string | null) ?? null,
      platformName: (r.platformName as string | null) ?? null,
      transferWarehouseCode: cargo.transferFlag ? cargo.transferWarehouseCode : null,
      deliveryFee: estimateOutboundDeliveryFee(cargo),
      actualCartonQty: Number(cargo.actualCartonQty) || 0,
      actualPalletQty: Number(cargo.actualPalletQty) || 0
    };
  });
  if (keyword) {
    rows = rows.filter(
      row =>
        fuzzyIncludes(row.cargoOrderNo, keyword) ||
        fuzzyIncludes(row.customerName, keyword) ||
        fuzzyIncludes(row.destination, keyword) ||
        fuzzyIncludes(row.appointmentNo, keyword) ||
        fuzzyIncludes(row.transferWarehouseCode, keyword)
    );
  }
  return mockPage(rows, params);
}

export function addOutboundCargo(outboundId: number, orderIds: number[]) {
  const outbound = MOCK_OUTBOUND_ORDERS.find(o => o.id === outboundId);
  if (!outbound) return { success: false, message: '车次订单不存在', addedCount: 0 };
  if (!OUTBOUND_ADD_CARGO_ALLOWED.has(outbound.outboundStatus)) {
    return { success: false, message: '当前车次状态不可添加货物', addedCount: 0 };
  }
  const ids = [...new Set(orderIds.map(Number).filter(Boolean))];
  if (!ids.length) return { success: false, message: '请选择要添加的订单', addedCount: 0 };

  const assignedIds = getAssignedOutboundCargoIds();
  const items = outboundOrderItemsStore.get(outboundId) ?? [];
  const addedNos: string[] = [];

  ids.forEach(orderId => {
    if (assignedIds.has(orderId)) return;
    const cargo = MOCK_CARGO_ORDERS.find(
      c =>
        c.id === orderId &&
        OUTBOUND_CARGO_ELIGIBLE_STATUS.has(c.fulfillmentStatus) &&
        matchOutboundDestination(outbound.destination, c)
    );
    if (!cargo) return;
    items.push(cargoToOutboundItem(outbound, cargo));
    assignedIds.add(orderId);
    addedNos.push(cargo.cargoOrderNo);
  });

  if (!addedNos.length) return { success: false, message: '未找到可添加的订单', addedCount: 0 };

  outboundOrderItemsStore.set(outboundId, items);
  syncOutboundTotals(outboundId);
  return {
    success: true,
    message: `已添加 ${addedNos.length} 个订单`,
    addedCount: addedNos.length
  };
}

export type LtlWorkbenchOrderLike = {
  id: number;
  orderNo: string;
  customerName: string;
  destination: string;
  isaNo?: string | null;
  appointmentTime?: string | null;
  palletQty: number;
  cartonQty: number;
  weightLbs?: number | null;
  volumeCbm?: number | null;
  supplierName?: string | null;
  supplierProNo?: string | null;
  remark?: string | null;
};

export type WorkbenchTripPool = 'LTL' | 'PLATFORM' | 'LOCAL';

export type WorkbenchTripCreateOptions = {
  supplierId?: CommonType.IdType | null;
  supplierName?: string | null;
  supplierQuoteId?: CommonType.IdType | null;
  deliveryCost?: number | null;
  appointmentNo?: string | null;
  appointmentTime?: string | null;
  pickupTime?: string | null;
  loadingType?: 'PALLET' | 'FLOOR' | null;
};

export type WorkbenchOrderLike = LtlWorkbenchOrderLike & {
  platform?: string | null;
};

function resolveMergedBusinessType(pool: WorkbenchTripPool, rows: WorkbenchOrderLike[]) {
  if (pool === 'LTL') return 'LTL';
  if (pool === 'LOCAL') return '本地配送';
  return rows[0]?.platform || 'Amazon';
}

function resolveMergedDestination(rows: WorkbenchOrderLike[]) {
  const destinations = [...new Set(rows.map(row => row.destination).filter(Boolean))];
  return destinations.length === 1 ? destinations[0] : destinations.join(' / ');
}

/** 工作台多订单合并生成一条车次订单 */
export function createMergedTripOrderFromWorkbenchOrders(
  rows: WorkbenchOrderLike[],
  tripNo: string,
  pool: WorkbenchTripPool,
  options?: WorkbenchTripCreateOptions
) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const orderNos = rows.map(row => row.orderNo).join('、');
  const poolLabel = pool === 'LTL' ? 'LTL' : pool === 'PLATFORM' ? '平台预约' : '本地/商业地址';
  const suppliers = [...new Set(rows.map(row => row.supplierName).filter(Boolean))];
  const customers = [...new Set(rows.map(row => row.customerName))].join(' / ');
  const isaNos = [...new Set(rows.map(row => row.isaNo).filter(Boolean))];
  const appointmentTimes = rows.map(row => row.appointmentTime).filter(Boolean) as string[];
  const resolvedAppointmentTime = options?.appointmentTime ?? (appointmentTimes.sort()[0] ?? null);
  const resolvedIsaNo = options?.appointmentNo ?? (isaNos.length === 1 ? isaNos[0] : isaNos.join(' / ') || null);
  const resolvedSupplier =
    options?.supplierName ?? (pool === 'LTL' ? suppliers.join(' / ') || null : options?.supplierName ?? null);

  const newOrder = {
    id: ++outboundOrderIdSeq,
    ...base,
    outboundOrderNo: tripNo,
    outboundStatus: 'PENDING_DISPATCH',
    outboundDirection: 'DELIVERY' as const,
    customerName: customers,
    cargoOrderCount: rows.length,
    actualCartonQty: rows.reduce((sum, row) => sum + (row.cartonQty || 0), 0),
    actualPalletQty: rows.reduce((sum, row) => sum + (row.palletQty || 0), 0),
    actualWeight: rows.reduce((sum, row) => sum + (row.weightLbs || 0), 0) || null,
    actualCbm: rows.reduce((sum, row) => sum + (row.volumeCbm || 0), 0) || null,
    appointmentStatus: resolvedAppointmentTime || resolvedIsaNo ? 'APPOINTED' : 'NONE',
    appointmentTime: resolvedAppointmentTime,
    outboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
    destination: resolveMergedDestination(rows),
    isaNo: resolvedIsaNo,
    businessType: resolveMergedBusinessType(pool, rows),
    vehicleType: pool === 'LTL' ? '53ft Trailer' : '26ft Box Truck',
    supplierName: resolvedSupplier,
    loadingType: options?.loadingType ?? 'PALLET',
    deliveryCost: options?.deliveryCost ?? null,
    pickupTime: options?.pickupTime ?? null,
    driverName: null,
    driverPhone: null,
    licensePlate: null,
    trailerNo: null,
    dockNo: null,
    hasException: false,
    operatorName: '系统',
    createTime: now,
    remark: `${poolLabel} 合并订单：${orderNos}`
  };
  MOCK_OUTBOUND_ORDERS = [newOrder, ...MOCK_OUTBOUND_ORDERS];

  const cargoRows = rows
    .map(row => MOCK_CARGO_ORDERS.find(c => c.id === row.id || c.cargoOrderNo === row.orderNo))
    .filter(Boolean) as (typeof MOCK_CARGO_ORDERS)[number][];
  if (cargoRows.length) {
    const items = cargoRows.map(cargo => cargoToOutboundItem(newOrder, cargo));
    outboundOrderItemsStore.set(newOrder.id, items);
    syncOutboundTotals(newOrder.id);
  }

  return newOrder;
}

/** LTL 工作台确认生成车次订单 */
export function createTripOrderFromLtlWorkbench(row: LtlWorkbenchOrderLike, tripNo: string) {
  return createMergedTripOrderFromWorkbenchOrders([row], tripNo, 'LTL');
}

function countByField<T extends Record<string, any>>(rows: T[], field: keyof T) {
  return rows.reduce((acc, row) => { const k = String(row[field] ?? ''); if (k) acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>);
}

function enrichContainerOrderRow(row: (typeof MOCK_CONTAINER_ORDERS)[number]) {
  const r = row as Record<string, any>;
  const enriched = {
    ...row,
    terminalReleaseStatus: r.terminalReleaseStatus ?? 'NONE',
    examStatus: r.examStatus ?? 'NONE',
    containerStatus: r.containerStatus ?? r.status,
    containerOrderNo: row.containerOrderNo,
    totalCartonQty: r.totalCartonQty ?? r.totalBoxQty ?? 0,
    attachmentCount: r.attachmentCount ?? 0,
    doAttachmentCount: r.doAttachmentCount ?? 0
  } as Record<string, any>;
  enriched.operationStatus = resolveContainerOperationStatus(enriched);
  return enriched;
}

function enrichCargoOrderRow(row: (typeof MOCK_CARGO_ORDERS)[number]) {
  const r = row as Record<string, any>;
  const enriched = {
    ...row,
    preOutboundStatus: r.preOutboundStatus ?? 'NONE',
    outboundOrderStatus: r.outboundOrderStatus ?? 'NONE',
    orderStatus: r.orderStatus ?? r.fulfillmentStatus,
    appointmentStatus: r.appointmentStatus ?? 'NONE',
    podStatus: r.podStatus ?? 'PENDING',
    exceptionFlag: r.exceptionFlag ?? 0,
    exceptionCount: r.exceptionCount ?? 0,
    shipments: r.shipments ?? [],
    nodeTraces: r.nodeTraces ?? []
  } as Record<string, any>;
  enriched.operationStatus = resolveCargoOperationStatus(enriched);
  return enriched;
}

function enrichOutboundOrderRow(row: (typeof MOCK_OUTBOUND_ORDERS)[number]) {
  const enriched = { ...row } as Record<string, any>;
  enriched.operationStatus = resolveOutboundOperationStatus(enriched.outboundStatus);
  return enriched;
}

export function getContainerOrderList(params?: Record<string, any>) {
  const rows = filterContainerOrderList(MOCK_CONTAINER_ORDERS.map(enrichContainerOrderRow), params);
  return mockPage(rows, params);
}

function filterCargoOrderList(rows: ReturnType<typeof enrichCargoOrderRow>[], params?: Record<string, any>) {
  let list = rows;
  if (params?.orderSubType) {
    list = list.filter(row => (row.orderSubType ?? 'STANDARD') === params.orderSubType);
  }
  if (params?.operationStatus) {
    list = list.filter(row => row.operationStatus === params.operationStatus);
  } else if (params?.fulfillmentStatus) {
    list = list.filter(row => row.fulfillmentStatus === params.fulfillmentStatus);
  }
  if (params?.cargoOrderNo) {
    list = list.filter(row => fuzzyIncludes(row.cargoOrderNo, params.cargoOrderNo));
  }
  if (params?.containerNo) {
    list = list.filter(row => fuzzyIncludes(row.containerNo, params.containerNo));
  }
  if (params?.carriageNo) {
    list = list.filter(row => fuzzyIncludes(row.carriageNo, params.carriageNo));
  }
  if (params?.customerName) {
    list = list.filter(row => fuzzyIncludesAny([row.customerName, row.peerCustomerName], params.customerName));
  }
  if (params?.appointmentNo) {
    list = list.filter(row => fuzzyIncludes((row as Record<string, any>).appointmentNo, params.appointmentNo));
  }
  if (params?.platformId) {
    const ids = String(params.platformId).split(',').map(v => v.trim()).filter(Boolean);
    if (ids.length) {
      list = list.filter(row => ids.includes(String((row as Record<string, any>).platformId ?? '')));
    }
  }
  if (params?.warehouseOrTransferCode) {
    const kw = fuzzyKeyword(params.warehouseOrTransferCode);
    list = list.filter(row =>
      fuzzyIncludesAny(
        [
          (row as Record<string, any>).platformWarehouseCode,
          (row as Record<string, any>).transferOutboundWarehouseCode,
          (row as Record<string, any>).transferWarehouseCode
        ],
        kw
      )
    );
  }
  if (params?.timelinessLevel) {
    const levels = String(params.timelinessLevel).split(',').map(v => v.trim()).filter(Boolean);
    if (levels.length) {
      list = list.filter(row => levels.includes(String((row as Record<string, any>).timelinessLevel ?? '')));
    }
  }
  if (params?.holdStatus) {
    const statuses = String(params.holdStatus).split(',').map(v => v.trim()).filter(Boolean);
    if (statuses.length) {
      list = list.filter(row => {
        const r = row as Record<string, any>;
        const holding = r.holdStatus === 'HOLDING' || Boolean(r.holdFlag);
        const released = r.holdStatus === 'RELEASED';
        const normal = !holding && !released;
        return statuses.some(status => {
          if (status === 'HOLDING') return holding;
          if (status === 'RELEASED') return released;
          if (status === 'NORMAL') return normal;
          return r.holdStatus === status;
        });
      });
    }
  }
  if (hasFuzzyKeyword(params?.keyword)) {
    const kw = fuzzyKeyword(params?.keyword);
    list = list.filter(row =>
      fuzzyIncludesAny(
        [
          row.cargoOrderNo,
          row.containerNo,
          row.carriageNo,
          row.customerName,
          row.peerCustomerName,
          row.externalOrderNo,
          (row as Record<string, any>).appointmentNo
        ],
        kw
      )
    );
  }
  return list;
}

export function getCargoOrderList(params?: Record<string, any>) {
  const rows = MOCK_CARGO_ORDERS.map(enrichCargoOrderRow);
  return mockPage(filterCargoOrderList(rows, params), params);
}
export function getOutboundOrderList(params?: Record<string, any>) {
  let rows = MOCK_OUTBOUND_ORDERS.map(enrichOutboundOrderRow);
  if (params?.operationStatus) {
    rows = rows.filter(row => row.operationStatus === params.operationStatus);
  } else if (params?.outboundStatus) {
    rows = rows.filter(row => row.outboundStatus === params.outboundStatus);
  }
  return mockPage(rows, params);
}
export function getOutboundOrderStatusCount() {
  return countByField(MOCK_OUTBOUND_ORDERS.map(enrichOutboundOrderRow), 'operationStatus');
}
export function getContainerOrderStatusCount(params?: Record<string, any>) {
  const rest = { ...params, containerStatus: null };
  const rows = filterContainerOrderList(MOCK_CONTAINER_ORDERS.map(enrichContainerOrderRow), rest);
  return countByField(rows, 'containerStatus');
}
export function getCargoOrderStatusCount() {
  return countByField(MOCK_CARGO_ORDERS.map(enrichCargoOrderRow), 'operationStatus');
}

function resolveOutboundReadiness(row: (typeof MOCK_CARGO_ORDERS)[number]): 'INBOUNDED' | 'DEVANNING' | 'NOT_INBOUNDED' {
  const actual = Number(row.actualCartonQty || 0);
  const declared = Number(row.declaredCartonQty || 0);
  if (row.fulfillmentStatus === 'INBOUNDED' && actual >= declared) return 'INBOUNDED';
  if (['DEVANNING', 'DEVANNED', 'ARRIVED_WAREHOUSE'].includes(String(row.fulfillmentStatus))) return 'DEVANNING';
  return 'NOT_INBOUNDED';
}

function isPastTime(value: string | null | undefined) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time < Date.now();
}

export function getOutboundPoolStats(params?: Record<string, any>) {
  const rows = filterCargoOrderList(MOCK_CARGO_ORDERS.map(enrichCargoOrderRow), params);
  let notInboundedCount = 0;
  let devanningCount = 0;
  let inboundedCount = 0;
  let overdueDeliveryLfdCount = 0;
  let overdueDwCount = 0;
  let inTransitCbm = 0;
  let devanningCbm = 0;
  let inboundedCbm = 0;

  rows.forEach(row => {
    const readiness = resolveOutboundReadiness(row);
    const cbm = Number(row.actualCbm || row.declaredCbm || 0);
    if (readiness === 'INBOUNDED') {
      inboundedCount += 1;
      inboundedCbm += cbm;
    } else if (readiness === 'DEVANNING') {
      devanningCount += 1;
      devanningCbm += cbm;
    } else {
      notInboundedCount += 1;
      inTransitCbm += cbm;
    }
    if (isPastTime((row as Record<string, any>).deliveryLfd)) overdueDeliveryLfdCount += 1;
    if (isPastTime((row as Record<string, any>).earliestDwTime)) overdueDwCount += 1;
  });

  const totalCbm = inTransitCbm + devanningCbm + inboundedCbm;
  return {
    totalCount: rows.length,
    notInboundedCount,
    devanningCount,
    inboundedCount,
    overdueDeliveryLfdCount,
    overdueDwCount,
    inTransitCbm: Number(inTransitCbm.toFixed(2)),
    devanningCbm: Number(devanningCbm.toFixed(2)),
    inboundedCbm: Number(inboundedCbm.toFixed(2)),
    totalCbm: Number(totalCbm.toFixed(2))
  };
}

let preOutboundIdSeq = 82000;
let preOutboundNoSeq = 1200;
const preOutboundStore: Array<Record<string, any>> = [];

function normalizePoolCargoIds(params: Record<string, any>) {
  if (params.cargoOrderId) return [Number(params.cargoOrderId)];
  return (params.cargoOrderIds || []).map(Number).filter(Boolean);
}

function buildTripNoFromSeq(seq: number) {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `TRIP${y}${m}${day}${String(seq).slice(-3)}`;
}

function createTripFromCargoOrders(cargoRows: (typeof MOCK_CARGO_ORDERS)[number][], params: Record<string, any>) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newId = ++outboundOrderIdSeq;
  const tripNo = buildTripNoFromSeq(newId);
  const customers = [...new Set(cargoRows.map(row => row.customerName))].join(' / ');
  const destinations = [...new Set(cargoRows.map(row => cargoDestination(row)).filter(Boolean))];

  const newOrder = {
    id: newId,
    ...base,
    outboundOrderNo: tripNo,
    outboundStatus: 'PENDING_DISPATCH',
    outboundDirection: (params.outboundDirection || 'DELIVERY') as 'DELIVERY' | 'TRANSFER',
    customerName: customers,
    cargoOrderCount: cargoRows.length,
    actualCartonQty: cargoRows.reduce((sum, row) => sum + Number(row.actualCartonQty || 0), 0),
    actualPalletQty: cargoRows.reduce((sum, row) => sum + Number(row.actualPalletQty || 0), 0),
    actualWeight: cargoRows.reduce((sum, row) => sum + Number(row.actualWeight || 0), 0),
    actualCbm: Number(cargoRows.reduce((sum, row) => sum + Number(row.actualCbm || 0), 0).toFixed(2)),
    appointmentStatus: params.appointmentNo ? 'APPOINTED' : 'NONE',
    appointmentTime: params.appointmentTime || null,
    outboundWarehouseName: params.outboundWarehouseName || MOCK_WAREHOUSE.warehouseName,
    destination: params.destination || (destinations.length === 1 ? destinations[0] : destinations.join(' / ')),
    isaNo: params.appointmentNo || null,
    businessType: params.deliveryMethod || cargoRows[0]?.businessTypeName || '整送',
    vehicleType: params.transportType === 'LTL' ? '53ft Trailer' : '26ft Box Truck',
    supplierName: null,
    driverName: null,
    driverPhone: null,
    licensePlate: null,
    trailerNo: null,
    dockNo: null,
    hasException: false,
    operatorName: '系统',
    createTime: now,
    remark: params.remark || `出库池生成 · ${cargoRows.map(r => r.cargoOrderNo).join('、')}`
  };

  MOCK_OUTBOUND_ORDERS = [newOrder, ...MOCK_OUTBOUND_ORDERS];
  const items = cargoRows.map(cargo => cargoToOutboundItem(newOrder, cargo));
  outboundOrderItemsStore.set(newOrder.id, items);
  syncOutboundTotals(newOrder.id);

  cargoRows.forEach(cargo => {
    const c = cargo as Record<string, any>;
    c.fulfillmentStatus = 'OUTBOUND_ORDERED';
    c.orderStatus = 'OUTBOUND_ORDERED';
    c.outboundOrderStatus = 'CREATED';
    c.outboundBatchNo = tripNo;
  });

  return newOrder;
}

export function createPoolPreOutbound(params: Record<string, any>) {
  const ids = normalizePoolCargoIds(params);
  assertCargoOutboundEligible(ids);
  const cargoRows = ids
    .map(id => MOCK_CARGO_ORDERS.find(c => c.id === id))
    .filter(Boolean) as (typeof MOCK_CARGO_ORDERS)[number][];
  if (!cargoRows.length) throw new Error('未找到可出单的订单');

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const created = cargoRows.map(cargo => {
    const preOutboundNo = `POB-2026-${String(++preOutboundNoSeq).slice(-4)}`;
    const row = {
      id: ++preOutboundIdSeq,
      cargoOrderId: cargo.id,
      cargoOrderNo: cargo.cargoOrderNo,
      preOutboundNo,
      preOutboundStatus: 'PRE_CREATED',
      outboundDirection: params.outboundDirection || 'DELIVERY',
      outboundWarehouseId: params.outboundWarehouseId ?? MOCK_WAREHOUSE.id,
      outboundWarehouseName: params.outboundWarehouseName ?? MOCK_WAREHOUSE.warehouseName,
      customerName: cargo.customerName,
      containerNo: cargo.containerNo,
      shipmentCodes: cargo.shipmentCodes,
      declaredCartonQty: cargo.declaredCartonQty,
      declaredPalletQty: cargo.declaredPalletQty,
      declaredWeight: cargo.declaredWeight,
      declaredCbm: cargo.declaredCbm,
      actualCartonQty: cargo.actualCartonQty,
      actualPalletQty: cargo.actualPalletQty,
      actualWeight: cargo.actualWeight,
      actualCbm: cargo.actualCbm,
      appointmentNo: params.appointmentNo || null,
      appointmentTime: params.appointmentTime || null,
      destination: params.destination || cargoDestination(cargo),
      deliveryMethod: params.deliveryMethod || null,
      remark: params.remark || null,
      createTime: now,
      updateTime: now
    };
    preOutboundStore.unshift(row);
    const c = cargo as Record<string, any>;
    c.preOutboundStatus = 'PRE_CREATED';
    c.preOutboundNo = preOutboundNo;
    return row;
  });

  return created.length === 1 ? created[0] : created;
}

export function createPoolOutboundOrder(params: Record<string, any>) {
  const ids = normalizePoolCargoIds(params);
  assertCargoOutboundEligible(ids);
  const cargoRows = ids
    .map(id => MOCK_CARGO_ORDERS.find(c => c.id === id))
    .filter(Boolean) as (typeof MOCK_CARGO_ORDERS)[number][];
  if (!cargoRows.length) throw new Error('未找到可生成车次的订单');
  return createTripFromCargoOrders(cargoRows, params);
}

export function batchCreatePoolPreOutbound(params: Record<string, any>) {
  createPoolPreOutbound(params);
  return null;
}

export function batchCreatePoolOutboundOrder(params: Record<string, any>) {
  createPoolOutboundOrder(params);
  return null;
}

export function completeOutboundTrip(outboundOrderNo: string, cargoOrderIds: number[]) {
  if (cargoOrderIds.length) syncOutboundComplete(cargoOrderIds);
  const order = MOCK_OUTBOUND_ORDERS.find(o => o.outboundOrderNo === outboundOrderNo);
  if (order) order.outboundStatus = 'OUTBOUNDED';
  return order ?? null;
}
