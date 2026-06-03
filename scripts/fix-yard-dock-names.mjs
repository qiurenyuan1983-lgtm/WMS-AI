import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...c) => c.map(x => String.fromCharCode(x)).join('');
const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/mock/data/yard.ts');

const content = `import { MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = { tenantId: '000000', warehouseId: MOCK_WAREHOUSE.id, warehouseCode: MOCK_WAREHOUSE.warehouseCode, warehouseName: MOCK_WAREHOUSE.warehouseName, status: '0', createTime: '2026-05-01 10:00:00' };

export const MOCK_YARD_ZONES = [
  { id: 2620001, ...base, zoneCode: 'CZ-A', zoneName: '${u(0x6d77, 0x67f3, 0x533a)} A', zoneType: 'CONTAINER', sortOrder: 1, remark: null },
  { id: 2620002, ...base, zoneCode: 'TZ-B', zoneName: '${u(0x8f66, 0x5e26, 0x533a)} B', zoneType: 'TRUCK', sortOrder: 2, remark: null }
];

export const MOCK_YARD_DOCKS = [
  { id: 3010001, ...base, dockCode: 'DOC-LA-001', dockName: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 1', locationType: 'DOCK', zoneId: 2620001, zoneCode: 'CZ-A', dockType: 'DEVANNING', dockLocation: 'FRONT_YARD_DOCK', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 1, remark: null },
  { id: 3010002, ...base, dockCode: 'DOC-LA-002', dockName: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 2', locationType: 'DOCK', zoneId: 2620001, zoneCode: 'CZ-A', dockType: 'DEVANNING', dockLocation: 'FRONT_YARD_DOCK', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 2, remark: null },
  { id: 3010003, ...base, dockCode: 'PARK-LA-01', dockName: '${u(0x7b49, 0x5f85, 0x4f4d)} 01', locationType: 'PARKING', zoneId: 2620002, zoneCode: 'TZ-B', dockType: 'MIXED', dockLocation: 'FRONT_YARD_PARKING', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 3, remark: null }
];

export function getYardZoneList(params?: Record<string, any>) { return mockPage(MOCK_YARD_ZONES, params); }
export function getYardDockList(params?: Record<string, any>) { return mockPage(MOCK_YARD_DOCKS, params); }
export function getYardDockFree(warehouseId?: number | string) {
  return MOCK_YARD_DOCKS.filter(d => d.dockStatus === 'IDLE' && (!warehouseId || d.warehouseId === warehouseId));
}
`;

fs.writeFileSync(p, content, 'utf8');
console.log('fixed yard.ts');
