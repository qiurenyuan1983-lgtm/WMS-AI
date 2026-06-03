/**
 * Merge legacy devanning mock rows with new list/detail fields (do not drop old keys).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const wmsPath = path.join(root, 'src/mock/data/wms.ts');

/** Legacy rows from first prototype (line 167 transcript) */
const LEGACY = [
  {
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
    remark: '\u62c6\u67dc\u8fdb\u884c\u4e2d'
  },
  {
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
    remark: null
  }
];

/** Extra fields added for list columns / API shape */
const ENRICH_BY_ID = {
  60401: {
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    channelName: '\u6574\u67dc\u6d77\u8fd0',
    customerServiceName: '\u5c0f\u738b',
    totalBoxQty: 500,
    inboundedBoxQty: 320,
    dockCode: 'DOC-LA-001',
    devanningStartTime: '2026-05-25 15:30:00',
    devanningFinishTime: null,
    plannedDevanningTime: '2026-05-25 16:00:00',
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1
  },
  60402: {
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    channelName: 'FCL',
    customerServiceName: '\u5c0f\u674e',
    totalBoxQty: 320,
    inboundedBoxQty: 0,
    dockCode: null,
    devanningFinishTime: null,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1
  }
};

/** Additional demo rows (new ids, do not replace legacy) */
const EXTRA = [
  {
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
    customerName: '\u6f14\u793a\u5ba2\u6237 C',
    channelName: 'FCL',
    customerServiceName: '\u5c0f\u674e',
    totalBoxQty: 280,
    inboundedBoxQty: 0,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1
  },
  {
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
    remark: '\u7b49\u5f85\u63d0\u67dc',
    customerName: '\u6f14\u793a\u5ba2\u6237 D',
    channelName: '\u6574\u67dc\u6d77\u8fd0',
    customerServiceName: '\u5c0f\u738b',
    totalBoxQty: 400,
    inboundedBoxQty: 0,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1
  },
  {
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
    remark: '\u62c6\u67dc\u5b8c\u6210',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    channelName: 'FCL',
    customerServiceName: '\u5c0f\u738b',
    totalBoxQty: 360,
    inboundedBoxQty: 360,
    dockCode: 'DOC-LA-002',
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 2
  },
  {
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
    remark: '\u67dc\u95e8\u5f02\u5e38',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    channelName: '\u6574\u67dc\u6d77\u8fd0',
    customerServiceName: '\u5c0f\u674e',
    totalBoxQty: 200,
    inboundedBoxQty: 50,
    exceptionFlag: 1,
    exceptionCount: 2,
    version: 1
  },
  {
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
    remark: '\u5ba2\u6237\u53d6\u6d88',
    customerName: '\u6f14\u793a\u5ba2\u6237 C',
    channelName: 'FCL',
    customerServiceName: '\u5c0f\u674e',
    totalBoxQty: 150,
    inboundedBoxQty: 0,
    exceptionFlag: 0,
    exceptionCount: 0,
    version: 1
  }
];

function mergeRow(row, enrich = {}) {
  const devanningNo = row.devanningNo || row.orderNo;
  const pickupTime = row.pickupTime ?? row.actualPickupTime ?? null;
  const etaWarehouseTime = row.etaWarehouseTime ?? row.plannedArrivalTime ?? null;
  const actualArrivalTime = row.actualArrivalTime ?? null;
  return {
    ...row,
    ...enrich,
    devanningNo,
    pickupTime,
    etaWarehouseTime,
    actualArrivalTime
  };
}

const merged = [
  ...LEGACY.map(r => mergeRow(r, ENRICH_BY_ID[r.id] || {})),
  ...EXTRA.map(r => mergeRow(r))
];

function formatRow(row) {
  const lines = Object.entries(row).map(([k, v]) => {
    if (v === null) return `    ${k}: null`;
    if (typeof v === 'number') return `    ${k}: ${v}`;
    return `    ${k}: '${v}'`;
  });
  return `  {\n    ...base,\n${lines.join(',\n')}\n  }`;
}

const block = `export const MOCK_WMS_DEVANNING_ORDERS = [\n${merged.map(formatRow).join(',\n')}\n];`;

let content = fs.readFileSync(wmsPath, 'utf8');
const start = content.indexOf('export const MOCK_WMS_DEVANNING_ORDERS');
const end = content.indexOf('export function getWmsZoneList');
if (start < 0 || end < 0) throw new Error('MOCK_WMS_DEVANNING_ORDERS block not found');
content = content.slice(0, start) + block + '\n\n' + content.slice(end);
fs.writeFileSync(wmsPath, content, 'utf8');
console.log(`merged ${merged.length} devanning orders (legacy ${LEGACY.length} + extra ${EXTRA.length})`);
