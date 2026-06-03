import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';
import * as wmsPrototypeData from './wms-prototype';
import { buildCargoOrdersForContainer } from './oms-container-cargo';

const base = {
  tenantId: '000000',
  companyId: MOCK_COMPANY.id,
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseCode: MOCK_WAREHOUSE.warehouseCode,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-05-01 10:00:00'
};

export const MOCK_WMS_ZONES = [
  { id: 60001, ...base, zoneName: 'FedEx??', storageMethod: 'FLOOR', zoneType: 'EXPRESS', allowMixedStorage: 1, maxMixedQty: 50, status: 'ENABLED', remark: '????????????' },
  { id: 60002, ...base, zoneName: 'A??', storageMethod: 'RACK', zoneType: 'PRIVATE', allowMixedStorage: 0, maxMixedQty: null, status: 'ENABLED', remark: null },
  { id: 60003, ...base, zoneName: '???????', storageMethod: 'FLOOR', zoneType: 'EXCEPTION', allowMixedStorage: 1, maxMixedQty: 20, status: 'ENABLED', remark: '?????????' }
];

export const MOCK_WMS_LOCATIONS = [
  { id: 60101, ...base, zoneId: 60001, zoneName: 'FedEx??', locationCode: 'A-01-01', rowNo: '01', columnNo: '01', capacity: 100, currentQty: 45, remainingCapacity: 55, status: 'NORMAL', remark: null },
  { id: 60102, ...base, zoneId: 60001, zoneName: 'FedEx??', locationCode: 'A-01-02', rowNo: '01', columnNo: '02', capacity: 100, currentQty: 80, remainingCapacity: 20, status: 'NORMAL', remark: null },
  { id: 60103, ...base, zoneId: 60002, zoneName: 'A??', locationCode: 'B-02-01', rowNo: '02', columnNo: '01', capacity: 50, currentQty: 0, remainingCapacity: 50, status: 'NORMAL', remark: null }
];

export const MOCK_WMS_INVENTORY = [
  { id: 60201, ...base, customerId: 70001, customerName: '?????? A', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', shipmentId: 90001, shipmentCode: 'SHP-001', totalBoxQty: 120, availableBoxQty: 80, lockedBoxQty: 40, exceptionBoxQty: 0, totalWeight: 1500.5, totalCbm: 12.8, inventoryStatus: 'IN_STOCK', firstInboundTime: '2026-05-10 08:00:00', lastInboundTime: '2026-05-15 14:30:00', lastTransactionTime: '2026-05-20 09:00:00', version: 1, remark: null },
  { id: 60202, ...base, customerId: 70002, customerName: '?????? B', cargoOrderId: 80002, cargoOrderNo: 'CO-2026-0002', shipmentId: 90002, shipmentCode: 'SHP-002', totalBoxQty: 60, availableBoxQty: 60, lockedBoxQty: 0, exceptionBoxQty: 5, totalWeight: 800, totalCbm: 6.2, inventoryStatus: 'PARTIAL_OUT', firstInboundTime: '2026-05-12 10:00:00', lastInboundTime: '2026-05-18 16:00:00', lastTransactionTime: '2026-05-22 11:00:00', version: 2, remark: '??????????' }
];

export const MOCK_WMS_PALLETS = [
  { id: 60301, ...base, palletNo: 'PLT-2026-0001', palletType: 'NORMAL', palletStatus: 'IN_STOCK', locationId: 60101, locationCode: 'A-01-01', zoneId: 60001, zoneName: 'FedEx??', boxQty: 40, weight: 500, cbm: 4.2, cargoOrderNo: 'CO-2026-0001', remark: null },
  { id: 60302, ...base, palletNo: 'PLT-2026-0002', palletType: 'NORMAL', palletStatus: 'PRE_OUTBOUND', locationId: 60102, locationCode: 'A-01-02', zoneId: 60001, zoneName: 'FedEx??', boxQty: 35, weight: 420, cbm: 3.5, cargoOrderNo: 'CO-2026-0001', remark: '??????????' }
];

export const MOCK_WMS_DEVANNING_ORDERS = [
  {
    ...base,
    id: 60401,
    orderNo: 'DV-2026-0001',
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderNo: 'CTN-2026-0001',
    containerNo: 'MSCU1234567',
    devanningMethod: 'FORKLIFT',
    status: 'DEVANNING',
    plannedPickupTime: '2026-05-25 08:00:00',
    actualPickupTime: '2026-05-25 09:30:00',
    plannedArrivalTime: '2026-05-25 14:00:00',
    actualArrivalTime: '2026-05-25 15:00:00',
    remark: '?ùù?????????',
    customerName: '?????? A',
    channelName: '??????',
    customerServiceName: '???????',
    totalBoxQty: 500,
    inboundedBoxQty: 320,
    dockCode: 'DOC-LA-001',
    devanningStartTime: '2026-05-25 15:30:00',
    devanningFinishTime: null,
    plannedDevanningTime: '2026-05-25 16:00:00',
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1,
    devanningNo: 'DV-2026-0001',
    pickupTime: '2026-05-25 09:30:00',
    etaWarehouseTime: '2026-05-25 14:00:00'
  },
  {
    ...base,
    id: 60402,
    orderNo: 'DV-2026-0002',
    sourceOrderType: 'MANUAL',
    sourceOrderNo: null,
    containerNo: 'OOLU7654321',
    devanningMethod: 'MANUAL',
    status: 'ARRIVED',
    plannedPickupTime: '2026-05-28 08:00:00',
    actualPickupTime: null,
    plannedArrivalTime: '2026-05-28 16:00:00',
    actualArrivalTime: '2026-05-28 17:00:00',
    remark: null,
    customerName: '?????? B',
    channelName: 'FCL',
    customerServiceName: '???????',
    totalBoxQty: 320,
    inboundedBoxQty: 0,
    dockCode: null,
    devanningFinishTime: null,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1,
    devanningNo: 'DV-2026-0002',
    pickupTime: null,
    etaWarehouseTime: '2026-05-28 16:00:00'
  },
  {
    ...base,
    id: 60403,
    orderNo: 'DV-2026-0003',
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderNo: 'CTN-2026-0002',
    containerNo: 'EGLU8888888',
    devanningMethod: 'FORKLIFT',
    status: 'PICKEDUP',
    plannedPickupTime: '2026-06-01 08:00:00',
    actualPickupTime: '2026-06-01 11:00:00',
    plannedArrivalTime: '2026-06-02 08:00:00',
    actualArrivalTime: null,
    remark: null,
    customerName: '?????? C',
    channelName: 'FCL',
    customerServiceName: '???????',
    totalBoxQty: 280,
    inboundedBoxQty: 0,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1,
    devanningNo: 'DV-2026-0003',
    pickupTime: '2026-06-01 11:00:00',
    etaWarehouseTime: '2026-06-02 08:00:00'
  },
  {
    ...base,
    id: 60404,
    orderNo: 'DV-2026-0004',
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderNo: 'CTN-2026-0003',
    containerNo: 'HLCU5566778',
    devanningMethod: 'MANUAL',
    status: 'UNPICKEDUP',
    plannedPickupTime: '2026-06-05 08:00:00',
    actualPickupTime: null,
    plannedArrivalTime: '2026-06-06 10:00:00',
    actualArrivalTime: null,
    remark: '??????????',
    customerName: '?????? D',
    channelName: '??????',
    customerServiceName: '???????',
    totalBoxQty: 400,
    inboundedBoxQty: 0,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1,
    devanningNo: 'DV-2026-0004',
    pickupTime: null,
    etaWarehouseTime: '2026-06-06 10:00:00'
  },
  {
    ...base,
    id: 60405,
    orderNo: 'DV-2026-0005',
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderNo: 'CTN-2026-0004',
    containerNo: 'TEMU9988776',
    devanningMethod: 'FORKLIFT',
    status: 'DEVANNED',
    plannedPickupTime: '2026-05-20 08:00:00',
    actualPickupTime: '2026-05-20 09:00:00',
    plannedArrivalTime: '2026-05-20 14:00:00',
    actualArrivalTime: '2026-05-20 15:00:00',
    devanningStartTime: '2026-05-20 15:30:00',
    devanningFinishTime: '2026-05-21 18:00:00',
    remark: '?????????',
    customerName: '?????? A',
    channelName: 'FCL',
    customerServiceName: '???????',
    totalBoxQty: 360,
    inboundedBoxQty: 360,
    dockCode: 'DOC-LA-002',
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 2,
    devanningNo: 'DV-2026-0005',
    pickupTime: '2026-05-20 09:00:00',
    etaWarehouseTime: '2026-05-20 14:00:00'
  },
  {
    ...base,
    id: 60406,
    orderNo: 'DV-2026-0006',
    sourceOrderType: 'MANUAL',
    sourceOrderNo: null,
    containerNo: 'CMAU3344556',
    devanningMethod: 'MANUAL',
    status: 'EXCEPTION',
    plannedPickupTime: '2026-05-22 08:00:00',
    actualPickupTime: '2026-05-22 10:00:00',
    plannedArrivalTime: '2026-05-22 16:00:00',
    actualArrivalTime: '2026-05-22 17:30:00',
    remark: '????????????',
    customerName: '?????? B',
    channelName: '??????',
    customerServiceName: '???????',
    totalBoxQty: 200,
    inboundedBoxQty: 50,
    exceptionFlag: 1,
    exceptionCount: 2,
    version: 1,
    devanningNo: 'DV-2026-0006',
    pickupTime: '2026-05-22 10:00:00',
    etaWarehouseTime: '2026-05-22 16:00:00'
  },
  {
    ...base,
    id: 60407,
    orderNo: 'DV-2026-0007',
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderNo: 'CTN-2026-0005',
    containerNo: 'ONEU1122334',
    devanningMethod: 'FORKLIFT',
    status: 'CANCELLED',
    plannedPickupTime: '2026-05-18 08:00:00',
    actualPickupTime: null,
    plannedArrivalTime: '2026-05-19 10:00:00',
    actualArrivalTime: null,
    remark: '??????????',
    customerName: '?????? C',
    channelName: 'FCL',
    customerServiceName: '???????',
    totalBoxQty: 150,
    inboundedBoxQty: 0,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1,
    devanningNo: 'DV-2026-0007',
    pickupTime: null,
    etaWarehouseTime: '2026-05-19 10:00:00'
  }
];

const DEVANNING_EXTRA: Record<number, Record<string, unknown>> = {
  60401: {
    totalWeight: 12500, totalCbm: 68.5, inboundedPalletQty: 28, examStatus: 'NONE', terminalReleaseStatus: 'RELEASE',
    plannedTruckQty: 3, plannedCbm: 65.2, devanningRound: 1, attachmentCount: 2,
    timelinessLevel: 'A', devanningRemark: '?????????????', devanningFee: 350,
    operationStatus: 'ORDER_PRINTED', devanningSupplier: 'LA ????', devanningTeam: 'A ?'
  },
  60402: {
    totalWeight: 8000, totalCbm: 42.3, inboundedPalletQty: 0, examStatus: 'EXAMINING', terminalReleaseStatus: 'HOLD',
    plannedTruckQty: 2, plannedCbm: 40, devanningRound: 1, attachmentCount: 1,
    timelinessLevel: 'B', devanningRemark: '???????', devanningFee: 280,
    operationStatus: 'ORDER_PRINTED', devanningSupplier: 'West Coast Devanning', devanningTeam: 'B ?'
  },
  60403: {
    totalWeight: 7000, totalCbm: 36.8, inboundedPalletQty: 0, examStatus: 'NONE', terminalReleaseStatus: 'RELEASE',
    plannedTruckQty: 2, plannedCbm: 35, devanningRound: 1, attachmentCount: 2,
    timelinessLevel: 'A', devanningRemark: null, devanningFee: 320,
    operationStatus: 'NOT_PRINTED', devanningSupplier: 'LA ????', devanningTeam: 'A ?'
  },
  60404: {
    totalWeight: 10000, totalCbm: 52, inboundedPalletQty: 0, examStatus: 'EXAMINING', terminalReleaseStatus: 'HOLD',
    plannedTruckQty: 3, plannedCbm: 50, devanningRound: 1, attachmentCount: 1,
    timelinessLevel: 'C', devanningRemark: '??? Dock', devanningFee: 260,
    operationStatus: 'NOT_PRINTED', devanningSupplier: 'Harbor Devanning Co.', devanningTeam: 'C ?'
  },
  60405: {
    totalWeight: 9000, totalCbm: 48.6, inboundedPalletQty: 30, examStatus: 'EXAMINED', terminalReleaseStatus: 'RELEASE',
    plannedTruckQty: 2, plannedCbm: 46, devanningRound: 1, attachmentCount: 3,
    timelinessLevel: 'B', devanningRemark: '????????', devanningFee: 310,
    operationStatus: 'ORDER_PRINTED', devanningSupplier: 'LA ????', devanningTeam: 'B ?', devanningProgressPercent: 100
  },
  60406: {
    totalWeight: 5000, totalCbm: 26.4, inboundedPalletQty: 4, examStatus: 'NONE', terminalReleaseStatus: 'RELEASE',
    plannedTruckQty: 1, plannedCbm: 24, devanningRound: 2, attachmentCount: 1,
    timelinessLevel: 'B', devanningRemark: '????', devanningFee: 180,
    operationStatus: 'ORDER_PRINTED', devanningSupplier: 'Inland Devanning', devanningTeam: 'A ?', devanningProgressPercent: 35
  },
  60407: {
    totalWeight: 3750, totalCbm: 19.5, inboundedPalletQty: 0, examStatus: 'NONE', terminalReleaseStatus: 'NONE',
    plannedTruckQty: 1, plannedCbm: 18, devanningRound: 1, attachmentCount: 0,
    timelinessLevel: 'C', devanningRemark: null, devanningFee: 150,
    operationStatus: 'NOT_PRINTED', devanningSupplier: null, devanningTeam: null, devanningProgressPercent: 0
  }
};

function enrichDevanningRow(row: (typeof MOCK_WMS_DEVANNING_ORDERS)[number]) {
  const extra = DEVANNING_EXTRA[row.id] || {};
  const boxQty = Number(row.totalBoxQty || 0);
  const inbounded = Number(row.inboundedBoxQty || 0);
  const explicitProgress = (row as any).devanningProgressPercent ?? extra.devanningProgressPercent;
  let devanningProgressPercent: number;
  if (explicitProgress != null) {
    devanningProgressPercent = Number(explicitProgress);
  } else if (row.status === 'DEVANNED') {
    devanningProgressPercent = 100;
  } else if (boxQty > 0) {
    devanningProgressPercent = Math.min(100, Math.round((inbounded / boxQty) * 100));
  } else {
    devanningProgressPercent = 0;
  }
  return {
    ...row,
    totalWeight: (row as any).totalWeight ?? extra.totalWeight ?? Math.round(boxQty * 25),
    totalCbm: (row as any).totalCbm ?? extra.totalCbm ?? Number((boxQty * 0.08).toFixed(2)),
    inboundedPalletQty: (row as any).inboundedPalletQty ?? extra.inboundedPalletQty ?? (inbounded ? Math.floor(inbounded / 12) : 0),
    examStatus: (row as any).examStatus ?? extra.examStatus ?? 'NONE',
    terminalReleaseStatus: (row as any).terminalReleaseStatus ?? extra.terminalReleaseStatus ?? 'NONE',
    plannedTruckQty: (row as any).plannedTruckQty ?? extra.plannedTruckQty ?? 2,
    plannedCbm: (row as any).plannedCbm ?? extra.plannedCbm ?? Number((boxQty * 0.07).toFixed(2)),
    devanningRound: (row as any).devanningRound ?? extra.devanningRound ?? 1,
    attachmentCount: (row as any).attachmentCount ?? extra.attachmentCount ?? (row.sourceOrderType === 'CONTAINER_ORDER' ? 2 : 0),
    timelinessLevel: (row as any).timelinessLevel ?? extra.timelinessLevel ?? 'B',
    devanningRemark: (row as any).devanningRemark ?? extra.devanningRemark ?? null,
    devanningFee: (row as any).devanningFee ?? extra.devanningFee ?? null,
    operationStatus: (row as any).operationStatus ?? extra.operationStatus ?? 'NOT_PRINTED',
    devanningSupplier: (row as any).devanningSupplier ?? extra.devanningSupplier ?? null,
    devanningTeam: (row as any).devanningTeam ?? extra.devanningTeam ?? null,
    devanningProgressPercent
  };
}

export function getWmsZoneList(params?: Record<string, any>) { return mockPage(MOCK_WMS_ZONES, params); }
export function getWmsLocationList(params?: Record<string, any>) { return mockPage(MOCK_WMS_LOCATIONS, params); }
export function getWmsInventoryList(params?: Record<string, any>) { return mockPage(MOCK_WMS_INVENTORY, params); }
export function getWmsPalletList(params?: Record<string, any>) { return mockPage(MOCK_WMS_PALLETS, params); }
function filterDevanningOrders(rows: typeof MOCK_WMS_DEVANNING_ORDERS, params?: Record<string, any>) {
  let list = rows;
  const keyword = String(params?.keyword || '').trim();
  if (keyword) {
    const k = keyword.toLowerCase();
    list = list.filter(row =>
      [row.devanningNo, row.orderNo, row.containerNo, row.customerName, row.sourceOrderNo].some(
        v => v && String(v).toLowerCase().includes(k)
      )
    );
  }
  if (params?.warehouseId != null && params.warehouseId !== '') {
    list = list.filter(row => String(row.warehouseId) === String(params.warehouseId));
  }
  if (params?.status) {
    list = list.filter(row => row.status === params.status);
  }
  return list;
}

function countDevanningByStatus(rows: typeof MOCK_WMS_DEVANNING_ORDERS) {
  return rows.reduce(
    (acc, row) => {
      const k = String(row.status ?? '');
      if (k) acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

export function getWmsDevanningOrderList(params?: Record<string, any>) {
  return mockPage(filterDevanningOrders(MOCK_WMS_DEVANNING_ORDERS, params).map(enrichDevanningRow), params);
}

export function getWmsDevanningOrderStatusCount(params?: Record<string, any>) {
  const rest = { ...params };
  delete rest.status;
  delete rest.pageNum;
  delete rest.pageSize;
  return countDevanningByStatus(filterDevanningOrders(MOCK_WMS_DEVANNING_ORDERS, rest));
}

const SOURCE_ORDER_NO_TO_CONTAINER_ID: Record<string, number> = {
  'CTN-2026-0001': 70001,
  'CTN-2026-0002': 70002
};

function resolveContainerOrderId(row: Record<string, any>) {
  if (row.sourceOrderId != null && row.sourceOrderId !== '') return row.sourceOrderId;
  if (row.sourceOrderNo && SOURCE_ORDER_NO_TO_CONTAINER_ID[row.sourceOrderNo]) {
    return SOURCE_ORDER_NO_TO_CONTAINER_ID[row.sourceOrderNo];
  }
  return null;
}

function buildDevanningTraces(row: Record<string, any>) {
  const all = [
    { id: 1, action: 'CREATE', actionDesc: '\u521b\u5efa\u62c6\u67dc\u8ba2\u5355', statusFrom: 'UNPICKEDUP', statusTo: 'UNPICKEDUP', operatorName: 'admin', createTime: '2026-05-20 09:00:00' },
    { id: 2, action: 'PICKUP', actionDesc: '\u786e\u8ba4\u63d0\u67dc', statusFrom: 'UNPICKEDUP', statusTo: 'PICKEDUP', operatorName: 'admin', createTime: row.pickupTime || '2026-05-25 09:30:00' },
    { id: 3, action: 'ARRIVAL', actionDesc: '\u5230\u4ed3\u767b\u8bb0', statusFrom: 'PICKEDUP', statusTo: 'ARRIVED', operatorName: 'admin', createTime: row.actualArrivalTime || '2026-05-25 15:00:00' },
    { id: 4, action: 'START', actionDesc: '\u5f00\u59cb\u62c6\u67dc', statusFrom: 'ARRIVED', statusTo: 'DEVANNING', operatorName: 'admin', createTime: row.devanningStartTime || '2026-05-25 15:30:00' },
    { id: 5, action: 'FINISH', actionDesc: '\u62c6\u67dc\u5b8c\u6210', statusFrom: 'DEVANNING', statusTo: 'DEVANNED', operatorName: 'admin', createTime: row.devanningFinishTime || '2026-05-26 10:00:00' }
  ];
  const order = ['UNPICKEDUP', 'PICKEDUP', 'ARRIVED', 'DEVANNING', 'DEVANNED', 'EXCEPTION', 'CANCELLED'];
  const idx = order.indexOf(String(row.status));
  if (row.status === 'EXCEPTION') return all.slice(0, 4).concat([{ id: 99, action: 'EXCEPTION', actionDesc: '\u6807\u8bb0\u5f02\u5e38', statusFrom: row.status, statusTo: 'EXCEPTION', operatorName: 'admin', createTime: '2026-05-26 11:00:00' }]);
  if (row.status === 'CANCELLED') return [all[0], { id: 98, action: 'CANCEL', actionDesc: '\u8ba2\u5355\u53d6\u6d88', statusFrom: 'UNPICKEDUP', statusTo: 'CANCELLED', operatorName: 'admin', createTime: '2026-05-22 12:00:00' }];
  return all.slice(0, Math.max(1, idx + 1));
}

export function getWmsDevanningOrderDetail(id: number | string) {
  const row = MOCK_WMS_DEVANNING_ORDERS.find(d => String(d.id) === String(id));
  if (!row) return null;
  const enriched = enrichDevanningRow(row);
  const sourceOrderId = resolveContainerOrderId(enriched);
  const cargoOrders = sourceOrderId ? buildCargoOrdersForContainer(sourceOrderId) : [];
  const progress =
    enriched.totalBoxQty && enriched.inboundedBoxQty
      ? Math.round((Number(enriched.inboundedBoxQty) / Number(enriched.totalBoxQty)) * 100)
      : wmsPrototypeData.MOCK_DEVANNING_DETAIL.progress;
  return {
    ...enriched,
    warehouseName: enriched.warehouseName || wmsPrototypeData.MOCK_DEVANNING_DETAIL.warehouseName,
    sourceOrderId,
    blNo: 'BL202605001',
    eta: enriched.etaWarehouseTime?.slice(0, 10) || wmsPrototypeData.MOCK_DEVANNING_DETAIL.eta,
    progress,
    attachmentCount: enriched.attachmentCount ?? 2,
    doAttachmentCount: enriched.sourceOrderType === 'CONTAINER_ORDER' ? 1 : 0,
    cargoOrders,
    shipments: wmsPrototypeData.MOCK_DEVANNING_SHIPMENTS,
    pallets: wmsPrototypeData.MOCK_DEVANNING_PALLETS_WORK,
    traces: buildDevanningTraces(enriched)
  };
}

const DEVANNING_NOW = '2026-06-01 12:00:00';

/** Mock ??????????????????????? */
export function applyDevanningAction(id: number | string, action: string): { ok: boolean; msg: string } {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => String(d.id) === String(id));
  if (!order) return { ok: false, msg: '\u8ba2\u5355\u4e0d\u5b58\u5728' };

  let changed = false;
  switch (action) {
    case 'confirm-pickup':
      if (order.status !== 'UNPICKEDUP') return { ok: false, msg: '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u786e\u8ba4\u63d0\u67dc' };
      order.status = 'PICKEDUP';
      order.pickupTime = order.pickupTime || DEVANNING_NOW;
      order.actualPickupTime = order.actualPickupTime || DEVANNING_NOW;
      changed = true;
      break;
    case 'confirm-arrival':
      if (order.status !== 'PICKEDUP') return { ok: false, msg: '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u5230\u4ed3\u767b\u8bb0' };
      order.status = 'ARRIVED';
      order.actualArrivalTime = order.actualArrivalTime || DEVANNING_NOW;
      changed = true;
      break;
    case 'start-devanning':
      if (order.status !== 'ARRIVED') return { ok: false, msg: '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u5f00\u59cb\u62c6\u67dc' };
      order.status = 'DEVANNING';
      order.devanningStartTime = order.devanningStartTime || DEVANNING_NOW;
      changed = true;
      break;
    case 'complete-devanning':
      if (order.status !== 'DEVANNING') return { ok: false, msg: '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u5b8c\u6210\u62c6\u67dc' };
      order.status = 'DEVANNED';
      order.devanningFinishTime = order.devanningFinishTime || DEVANNING_NOW;
      changed = true;
      break;
    case 'mark-exception':
      if (['DEVANNED', 'CANCELLED', 'EXCEPTION'].includes(order.status)) {
        return { ok: false, msg: '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u6807\u8bb0\u5f02\u5e38' };
      }
      order.status = 'EXCEPTION';
      order.exceptionFlag = 1;
      order.exceptionCount = (order.exceptionCount || 0) + 1;
      changed = true;
      break;
    case 'clear-exception':
      if (order.status !== 'EXCEPTION') return { ok: false, msg: '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u89e3\u9664\u5f02\u5e38' };
      order.status = 'ARRIVED';
      order.exceptionFlag = 0;
      changed = true;
      break;
    case 'cancel':
      if (['DEVANNED', 'CANCELLED'].includes(order.status)) {
        return { ok: false, msg: '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u53d6\u6d88' };
      }
      order.status = 'CANCELLED';
      changed = true;
      break;
    default:
      return { ok: false, msg: '\u672a\u77e5\u64cd\u4f5c' };
  }
  if (changed) order.version = (order.version || 0) + 1;
  return { ok: changed, msg: changed ? 'ok' : '\u72b6\u6001\u672a\u53d8\u66f4' };
}

export function getWmsInventoryStats() {
  return { totalInventoryCount: 2, totalBoxQty: 180, availableBoxQty: 140, lockedBoxQty: 40, exceptionBoxQty: 5, totalPalletCount: 2, inStockPalletCount: 1 };
}

export function getWmsInventoryVisualization() {
  return {
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zones: MOCK_WMS_ZONES.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.zoneName,
      zoneType: zone.zoneType,
      storageMethod: zone.storageMethod,
      locations: MOCK_WMS_LOCATIONS.filter(loc => loc.zoneId === zone.id).map(loc => ({
        locationId: loc.id,
        locationCode: loc.locationCode,
        status: loc.status,
        capacity: loc.capacity,
        currentQty: loc.currentQty,
        occupancyRate: loc.capacity ? Math.round((loc.currentQty / loc.capacity) * 100) : 0
      }))
    }))
  };
}
