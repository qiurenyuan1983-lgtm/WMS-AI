import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = { tenantId: '000000', companyId: MOCK_COMPANY.id, warehouseId: MOCK_WAREHOUSE.id, warehouseCode: MOCK_WAREHOUSE.warehouseCode, warehouseName: MOCK_WAREHOUSE.warehouseName, createTime: '2026-05-01 10:00:00' };

export const MOCK_CONTAINER_ORDERS = [
  { id: 70001, ...base, containerOrderNo: 'CTN-2026-0001', containerNo: 'MSCU1234567', status: 'INBOUNDED', shippingLine: 'MSC', vesselName: 'MSC OSCAR', eta: '2026-05-20', devanningMethod: 'FORKLIFT', loadingType: 'PALLET', totalBoxQty: 500, remark: '海柜订单演示' },
  { id: 70002, ...base, containerOrderNo: 'CTN-2026-0002', containerNo: 'OOLU7654321', status: 'ARRIVED_PORT', shippingLine: 'OOCL', vesselName: 'OOCL TOKYO', eta: '2026-05-28', devanningMethod: 'MANUAL', loadingType: 'FLOOR', totalBoxQty: 320, remark: null }
];

export const MOCK_CARGO_ORDERS = [
  { id: 80001, ...base, cargoOrderNo: 'CO-2026-0001', customerName: '演示客户 A', fulfillmentStatus: 'INBOUNDED', billingStatus: 'UNBILLED', addressType: 'PLATFORM_WH', parcelCarrier: 'UPS', totalBoxQty: 120, totalWeight: 1500, totalCbm: 12.8, remark: null },
  { id: 80002, ...base, cargoOrderNo: 'CO-2026-0002', customerName: '演示客户 B', fulfillmentStatus: 'OUTBOUND_ORDERED', billingStatus: 'BILLED', addressType: 'COMMERCIAL', parcelCarrier: 'FedEx', totalBoxQty: 60, totalWeight: 800, totalCbm: 6.2, remark: '加急出�?' }
];

export const MOCK_OUTBOUND_ORDERS = [
  { id: 90001, ...base, outboundOrderNo: 'OB-2026-0001', status: 'CREATED', direction: 'DELIVERY', customerName: '演示客户 A', totalBoxQty: 40, remark: null }
];

function countByField<T extends Record<string, any>>(rows: T[], field: keyof T) {
  return rows.reduce((acc, row) => { const k = String(row[field] ?? ''); if (k) acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>);
}

const CONTAINER_LIST_EXTRA: Record<number, { terminalReleaseStatus: string; examStatus: string }> = {
  70001: { terminalReleaseStatus: 'RELEASE', examStatus: 'NONE' },
  70002: { terminalReleaseStatus: 'HOLD', examStatus: 'EXAMINING' }
};

function enrichContainerOrderRow(row: (typeof MOCK_CONTAINER_ORDERS)[number]) {
  const extra = CONTAINER_LIST_EXTRA[row.id] || { terminalReleaseStatus: 'NONE', examStatus: 'NONE' };
  return {
    ...row,
    terminalReleaseStatus: (row as any).terminalReleaseStatus ?? extra.terminalReleaseStatus,
    examStatus: (row as any).examStatus ?? extra.examStatus,
    containerStatus: (row as any).containerStatus ?? row.status,
    containerOrderNo: row.containerOrderNo,
    totalCartonQty: row.totalBoxQty,
    attachmentCount: 2
  };
}

export function getContainerOrderList(params?: Record<string, any>) {
  return mockPage(MOCK_CONTAINER_ORDERS.map(enrichContainerOrderRow), params);
}
export function getCargoOrderList(params?: Record<string, any>) { return mockPage(MOCK_CARGO_ORDERS, params); }
export function getOutboundOrderList(params?: Record<string, any>) { return mockPage(MOCK_OUTBOUND_ORDERS, params); }
export function getContainerOrderStatusCount() { return countByField(MOCK_CONTAINER_ORDERS, 'status'); }
export function getCargoOrderStatusCount() { return countByField(MOCK_CARGO_ORDERS, 'fulfillmentStatus'); }
export function getOutboundPoolStats() { return { total: MOCK_CARGO_ORDERS.length, readyCount: 1, pendingCount: 1 }; }
