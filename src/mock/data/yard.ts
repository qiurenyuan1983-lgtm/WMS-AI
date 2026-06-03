import { MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = { tenantId: '000000', warehouseId: MOCK_WAREHOUSE.id, warehouseCode: MOCK_WAREHOUSE.warehouseCode, warehouseName: MOCK_WAREHOUSE.warehouseName, status: '0', createTime: '2026-05-01 10:00:00' };

export const MOCK_YARD_ZONES = [
  { id: 2620001, ...base, zoneCode: 'CZ-A', zoneName: '海柳区 A', zoneType: 'CONTAINER', sortOrder: 1, remark: null },
  { id: 2620002, ...base, zoneCode: 'TZ-B', zoneName: '车带区 B', zoneType: 'TRUCK', sortOrder: 2, remark: null }
];

export const MOCK_YARD_DOCKS = [
  { id: 3010001, ...base, dockCode: 'DOC-LA-001', dockName: 'LA 拆柜口 1', locationType: 'DOCK', zoneId: 2620001, zoneCode: 'CZ-A', dockType: 'DEVANNING', dockLocation: 'FRONT_YARD_DOCK', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 1, remark: null },
  { id: 3010002, ...base, dockCode: 'DOC-LA-002', dockName: 'LA 拆柜口 2', locationType: 'DOCK', zoneId: 2620001, zoneCode: 'CZ-A', dockType: 'DEVANNING', dockLocation: 'FRONT_YARD_DOCK', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 2, remark: null },
  { id: 3010003, ...base, dockCode: 'PARK-LA-01', dockName: '等待位 01', locationType: 'PARKING', zoneId: 2620002, zoneCode: 'TZ-B', dockType: 'MIXED', dockLocation: 'FRONT_YARD_PARKING', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 3, remark: null }
];

export function getYardZoneList(params?: Record<string, any>) { return mockPage(MOCK_YARD_ZONES, params); }
export function getYardDockList(params?: Record<string, any>) { return mockPage(MOCK_YARD_DOCKS, params); }
export function getYardDockFree(warehouseId?: number | string) {
  return MOCK_YARD_DOCKS.filter(d => d.dockStatus === 'IDLE' && (!warehouseId || d.warehouseId === warehouseId));
}
