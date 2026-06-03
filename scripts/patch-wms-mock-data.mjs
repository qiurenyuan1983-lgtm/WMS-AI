import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// DEPRECATED: overwrites entire wms.ts. Use merge-devanning-mock.mjs to merge legacy + new fields.
// Fix devanning mock list fields
const wmsPath = path.join(root, 'src/mock/data/wms.ts');
const wmsContent = `import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = {
  tenantId: '000000',
  companyId: MOCK_COMPANY.id,
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseCode: MOCK_WAREHOUSE.warehouseCode,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-05-01 10:00:00'
};

export const MOCK_WMS_ZONES = [
  { id: 60001, ...base, zoneName: 'FedEx\u533a', storageMethod: 'FLOOR', zoneType: 'EXPRESS', allowMixedStorage: 1, maxMixedQty: 50, status: 'ENABLED', remark: '\u5feb\u9012\u6682\u5b58\u533a' },
  { id: 60002, ...base, zoneName: 'A\u533a', storageMethod: 'RACK', zoneType: 'PRIVATE', allowMixedStorage: 0, maxMixedQty: null, status: 'ENABLED', remark: null },
  { id: 60003, ...base, zoneName: '\u5f02\u5e38\u6682\u5b58\u533a', storageMethod: 'FLOOR', zoneType: 'EXCEPTION', allowMixedStorage: 1, maxMixedQty: 20, status: 'ENABLED', remark: '\u5f02\u5e38\u4ef6\u6682\u5b58' }
];

export const MOCK_WMS_LOCATIONS = [
  { id: 60101, ...base, zoneId: 60001, zoneName: 'FedEx\u533a', locationCode: 'A-01-01', rowNo: '01', columnNo: '01', capacity: 100, currentQty: 45, remainingCapacity: 55, status: 'NORMAL', remark: null },
  { id: 60102, ...base, zoneId: 60001, zoneName: 'FedEx\u533a', locationCode: 'A-01-02', rowNo: '01', columnNo: '02', capacity: 100, currentQty: 80, remainingCapacity: 20, status: 'NORMAL', remark: null },
  { id: 60103, ...base, zoneId: 60002, zoneName: 'A\u533a', locationCode: 'B-02-01', rowNo: '02', columnNo: '01', capacity: 50, currentQty: 0, remainingCapacity: 50, status: 'NORMAL', remark: null }
];

export const MOCK_WMS_INVENTORY = [
  { id: 60201, ...base, customerId: 70001, customerName: '\u6f14\u793a\u5ba2\u6237 A', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', shipmentId: 90001, shipmentCode: 'SHP-001', totalBoxQty: 120, availableBoxQty: 80, lockedBoxQty: 40, exceptionBoxQty: 0, totalWeight: 1500.5, totalCbm: 12.8, inventoryStatus: 'IN_STOCK', firstInboundTime: '2026-05-10 08:00:00', lastInboundTime: '2026-05-15 14:30:00', lastTransactionTime: '2026-05-20 09:00:00', version: 1, remark: null },
  { id: 60202, ...base, customerId: 70002, customerName: '\u6f14\u793a\u5ba2\u6237 B', cargoOrderId: 80002, cargoOrderNo: 'CO-2026-0002', shipmentId: 90002, shipmentCode: 'SHP-002', totalBoxQty: 60, availableBoxQty: 60, lockedBoxQty: 0, exceptionBoxQty: 5, totalWeight: 800, totalCbm: 6.2, inventoryStatus: 'PARTIAL_OUT', firstInboundTime: '2026-05-12 10:00:00', lastInboundTime: '2026-05-18 16:00:00', lastTransactionTime: '2026-05-22 11:00:00', version: 2, remark: '\u90e8\u5206\u5df2\u51fa\u5e93' }
];

export const MOCK_WMS_PALLETS = [
  { id: 60301, ...base, palletNo: 'PLT-2026-0001', palletType: 'NORMAL', palletStatus: 'IN_STOCK', locationId: 60101, locationCode: 'A-01-01', zoneId: 60001, zoneName: 'FedEx\u533a', boxQty: 40, weight: 500, cbm: 4.2, cargoOrderNo: 'CO-2026-0001', remark: null },
  { id: 60302, ...base, palletNo: 'PLT-2026-0002', palletType: 'NORMAL', palletStatus: 'PRE_OUTBOUND', locationId: 60102, locationCode: 'A-01-02', zoneId: 60001, zoneName: 'FedEx\u533a', boxQty: 35, weight: 420, cbm: 3.5, cargoOrderNo: 'CO-2026-0001', remark: '\u5df2\u51fa\u5355\u5f85\u51fa\u5e93' }
];

export const MOCK_WMS_DEVANNING_ORDERS = [
  {
    id: 60401,
    ...base,
    devanningNo: 'DV-2026-0001',
    orderNo: 'DV-2026-0001',
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderNo: 'CTN-2026-0001',
    containerNo: 'MSCU1234567',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    channelName: '\u6574\u67dc\u6d77\u8fd0',
    customerServiceName: '\u5c0f\u738b',
    etaWarehouseTime: '2026-05-28 14:00:00',
    pickupTime: '2026-05-25 09:30:00',
    actualArrivalTime: '2026-05-25 15:00:00',
    devanningMethod: 'FORKLIFT',
    status: 'DEVANNING',
    totalBoxQty: 500,
    inboundedBoxQty: 320,
    dockCode: 'DOC-LA-001',
    devanningFinishTime: null,
    remark: '\u62c6\u67dc\u8fdb\u884c\u4e2d'
  },
  {
    id: 60402,
    ...base,
    devanningNo: 'DV-2026-0002',
    orderNo: 'DV-2026-0002',
    sourceOrderType: 'MANUAL',
    sourceOrderNo: null,
    containerNo: 'OOLU7654321',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    channelName: 'FCL',
    customerServiceName: '\u5c0f\u674e',
    etaWarehouseTime: '2026-05-30 10:00:00',
    pickupTime: null,
    actualArrivalTime: '2026-05-28 17:00:00',
    devanningMethod: 'MANUAL',
    status: 'ARRIVED',
    totalBoxQty: 320,
    inboundedBoxQty: 0,
    dockCode: null,
    devanningFinishTime: null,
    remark: null
  },
  {
    id: 60403,
    ...base,
    devanningNo: 'DV-2026-0003',
    orderNo: 'DV-2026-0003',
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderNo: 'CTN-2026-0002',
    containerNo: 'EGLU8888888',
    customerName: '\u6f14\u793a\u5ba2\u6237 C',
    channelName: 'FCL',
    customerServiceName: '\u5c0f\u674e',
    etaWarehouseTime: '2026-06-02 08:00:00',
    pickupTime: '2026-06-01 11:00:00',
    actualArrivalTime: null,
    devanningMethod: 'FORKLIFT',
    status: 'PICKEDUP',
    totalBoxQty: 280,
    inboundedBoxQty: 0,
    dockCode: null,
    devanningFinishTime: null,
    remark: null
  }
];

export function getWmsZoneList(params?: Record<string, any>) { return mockPage(MOCK_WMS_ZONES, params); }
export function getWmsLocationList(params?: Record<string, any>) { return mockPage(MOCK_WMS_LOCATIONS, params); }
export function getWmsInventoryList(params?: Record<string, any>) { return mockPage(MOCK_WMS_INVENTORY, params); }
export function getWmsPalletList(params?: Record<string, any>) { return mockPage(MOCK_WMS_PALLETS, params); }
export function getWmsDevanningOrderList(params?: Record<string, any>) { return mockPage(MOCK_WMS_DEVANNING_ORDERS, params); }

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
`;

fs.writeFileSync(wmsPath, wmsContent, 'utf8');
console.log('patched wms.ts devanning mock');
