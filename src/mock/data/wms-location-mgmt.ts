import { normalizeLocationDestinations } from '@/views/wms/location/constants';
import { MOCK_WAREHOUSE } from './common';
import { nextId } from '../utils';

const SPECIAL_STATUSES = ['LOCKED', 'DISABLED', 'MAINTENANCE', 'ABNORMAL', 'PRE_OCCUPIED', 'PENDING_CLEAN'] as const;

const PURPOSE_BY_ZONE: Record<string, string> = {
  'F\u533a': 'FBA',
  'K\u533a': 'FBA',
  'P\u533a': 'FBA',
  'U\u533a': 'FBA',
  'H\u533a': 'PREMIUM',
  'C\u533a': 'PRIVATE',
  'N\u533a': 'PRIVATE',
  'T\u533a': 'PRIVATE',
  'E\u533a': 'EXPRESS',
  'FedEx\u533a': 'EXPRESS',
  'L\u533a': 'EXPRESS',
  'Q\u533a': 'EXPRESS',
  'V\u533a': 'EXPRESS',
  'J\u533a': 'TAIL',
  'I\u533a': 'HOLD'
};

const PLATFORMS = [
  { code: 'AMAZON', name: 'Amazon' },
  { code: 'WALMART', name: 'Walmart' },
  { code: 'TIKTOK', name: 'TikTok Shop' }
];

const CUSTOMERS = ['Anker', '\u6f14\u793a\u5ba2\u6237 A', 'PopMart', 'Robotime'];
const DESTINATIONS = ['LAX9', 'ONT8', 'SBD1', 'GYR3', 'IND9'];

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function calcOccupancyStatus(row: Api.Wms.Location): string {
  if (row.locked) return 'LOCKED';
  const manual = row.status;
  if (manual && SPECIAL_STATUSES.includes(manual as (typeof SPECIAL_STATUSES)[number])) return manual;
  const cap = row.capacity ?? 30;
  const qty = row.currentQty ?? 0;
  if (qty <= 0) return 'EMPTY';
  if (qty >= cap) return 'FULL';
  return 'PARTIAL';
}

export function enrichWmsLocation(row: Api.Wms.Location, index: number): Api.Wms.Location {
  const capacity = row.capacity ?? 8;
  const rawQty = row.currentQty ?? 0;
  const currentQty = Math.min(rawQty, capacity);
  const remainingCapacity = Math.max(0, capacity - currentQty);
  const palletCount = currentQty > 0 ? Math.max(1, Math.ceil(currentQty / 10)) : 0;
  const occupancyRate = capacity > 0 ? Math.min(1, currentQty / capacity) : 0;

  let status = row.status;
  if (status === 'NORMAL') status = calcOccupancyStatus({ ...row, capacity, currentQty });
  if (index % 137 === 0) status = 'LOCKED';
  else if (index % 113 === 0) status = 'DISABLED';
  else if (index % 97 === 0) status = 'MAINTENANCE';
  else if (index % 89 === 0) status = 'ABNORMAL';
  else if (index % 79 === 0) status = 'PRE_OCCUPIED';
  else if (index % 67 === 0) status = 'PENDING_CLEAN';
  else if (!SPECIAL_STATUSES.includes(status as any)) status = calcOccupancyStatus({ ...row, capacity, currentQty, status });

  const purpose = row.purpose || PURPOSE_BY_ZONE[row.zoneName || ''] || 'GENERAL';
  const platform = index % 5 === 0 ? PLATFORMS[index % PLATFORMS.length] : null;
  const customer = index % 4 === 0 ? CUSTOMERS[index % CUSTOMERS.length] : null;
  const destinationLimit = row.destinationLimit ?? (purpose === 'FBA' ? (index % 5 === 0 ? 2 : index % 11 === 0 ? 3 : 1) : 1);
  const seedDestinations =
    purpose === 'FBA'
      ? Array.from({ length: Math.min(destinationLimit, 2 + (index % 2)) }, (_, i) => DESTINATIONS[(index + i) % DESTINATIONS.length])
      : [];
  const fallbackDestinationCode =
    destinationLimit === 1 && seedDestinations[0] ? seedDestinations[0] : null;
  const destinationFields = normalizeLocationDestinations({
    destinationLimit,
    destinationCodes:
      row.destinationCodes
      ?? (row.destinationCode ? undefined : (seedDestinations.length ? seedDestinations : undefined)),
    destinationCode: row.destinationCode ?? fallbackDestinationCode,
    destinationName: row.destinationName ?? null
  });

  return {
    ...row,
    capacity,
    currentQty,
    remainingCapacity,
    palletCount,
    occupancyRate,
    status,
    locked: status === 'LOCKED' || Boolean(row.locked),
    purpose,
    platformCode: row.platformCode ?? platform?.code ?? null,
    platformName: row.platformName ?? platform?.name ?? null,
    customerName: row.customerName ?? customer,
    ...destinationFields,
    warehouseName: row.warehouseName ?? MOCK_WAREHOUSE.warehouseName,
    warehouseCode: row.warehouseCode ?? MOCK_WAREHOUSE.warehouseCode,
    createTime: row.createTime ?? '2026-01-15 09:00:00',
    updateTime: row.updateTime ?? nowStr()
  };
}

export function enrichWmsLocations(rows: Api.Wms.Location[]) {
  return rows.map((row, index) => enrichWmsLocation(row, index));
}

export function getWmsLocationStats(rows: Api.Wms.Location[], params?: Record<string, any>): Api.Wms.LocationStats {
  let list = [...rows];
  if (params?.warehouseId != null && params.warehouseId !== '') {
    list = list.filter(r => String(r.warehouseId) === String(params.warehouseId));
  }
  if (params?.zoneId != null && params.zoneId !== '') {
    list = list.filter(r => String(r.zoneId) === String(params.zoneId));
  }
  const count = (s: string) => list.filter(r => r.status === s).length;
  const totalQty = list.reduce((sum, r) => sum + (r.currentQty ?? 0), 0);
  const totalCap = list.reduce((sum, r) => sum + (r.capacity ?? 30), 0);
  return {
    total: list.length,
    empty: count('EMPTY'),
    partial: count('PARTIAL'),
    full: count('FULL'),
    locked: count('LOCKED'),
    disabled: count('DISABLED'),
    maintenance: count('MAINTENANCE'),
    abnormal: count('ABNORMAL'),
    preOccupied: count('PRE_OCCUPIED'),
    pendingClean: count('PENDING_CLEAN'),
    utilizationRate: totalCap > 0 ? Math.round((totalQty / totalCap) * 1000) / 10 : 0
  };
}

const MOCK_LOCATION_LOGS: Api.Wms.LocationOperationLog[] = [];

function ensureLogs(location: Api.Wms.Location) {
  const exists = MOCK_LOCATION_LOGS.some(l => String(l.locationId) === String(location.id));
  if (exists) return;
  MOCK_LOCATION_LOGS.push(
    {
      id: nextId(),
      locationId: location.id,
      locationCode: location.locationCode,
      actionType: '\u521b\u5efa\u5e93\u4f4d',
      operator: 'admin',
      content: '\u521d\u59cb\u5316\u5e93\u4f4d\u6863\u6848',
      beforeValue: null,
      afterValue: location.locationCode,
      operateTime: location.createTime || nowStr()
    },
    {
      id: nextId(),
      locationId: location.id,
      locationCode: location.locationCode,
      actionType: '\u72b6\u6001\u53d8\u66f4',
      operator: 'wms_mgr',
      content: `\u72b6\u6001\u8c03\u6574\u4e3a ${location.status}`,
      beforeValue: 'EMPTY',
      afterValue: location.status || 'EMPTY',
      operateTime: location.updateTime || nowStr()
    }
  );
}

export function getWmsLocationOperationLogs(locationId: CommonType.IdType) {
  return MOCK_LOCATION_LOGS.filter(l => String(l.locationId) === String(locationId)).sort((a, b) =>
    a.operateTime < b.operateTime ? 1 : -1
  );
}

export function getWmsLocationInventory(locationId: CommonType.IdType, pallets: Api.Wms.Pallet[]) {
  return pallets
    .filter(p => String(p.locationId) === String(locationId))
    .map(p => ({
      id: p.id,
      palletNo: p.palletNo,
      cargoOrderNo: p.cargoOrderNo ?? null,
      customerName: p.businessTypeName ?? null,
      boxQty: p.totalBoxQty ?? null,
      weight: p.weight ?? null,
      cbm: p.cbm ?? null,
      palletStatus: p.palletStatus ?? null
    }));
}

export function createWmsLocation(data: Api.Wms.LocationOperateParams, rows: Api.Wms.Location[]) {
  const id = nextId();
  const row = enrichWmsLocation(
    {
      id,
      tenantId: '000000',
      companyId: data.companyId ?? 4000001,
      warehouseId: data.warehouseId!,
      warehouseCode: data.warehouseCode ?? MOCK_WAREHOUSE.warehouseCode,
      warehouseName: data.warehouseName ?? MOCK_WAREHOUSE.warehouseName,
      zoneId: data.zoneId ?? null,
      zoneName: data.zoneName ?? null,
      locationCode: data.locationCode!,
      rowNo: data.rowNo ?? null,
      columnNo: data.columnNo ?? null,
      capacity: data.capacity ?? 30,
      currentQty: 0,
      remainingCapacity: data.capacity ?? 30,
      status: data.status ?? 'EMPTY',
      purpose: data.purpose ?? 'GENERAL',
      customerName: data.customerName ?? null,
      platformCode: data.platformCode ?? null,
      platformName: data.platformName ?? null,
      destinationCode: data.destinationCode ?? null,
      destinationName: data.destinationName ?? null,
      destinationLimit: data.destinationLimit ?? 1,
      destinationCodes: data.destinationCodes ?? null,
      locked: data.locked ?? false,
      remark: data.remark ?? null,
      createTime: nowStr(),
      updateTime: nowStr()
    } as Api.Wms.Location,
    rows.length
  );
  rows.unshift(row);
  ensureLogs(row);
  return row;
}

export function updateWmsLocation(data: Api.Wms.LocationOperateParams, rows: Api.Wms.Location[]) {
  const idx = rows.findIndex(r => String(r.id) === String(data.id));
  if (idx < 0) return null;
  const prev = rows[idx];
  const next = enrichWmsLocation({ ...prev, ...data, updateTime: nowStr() } as Api.Wms.Location, idx);
  rows[idx] = next;
  MOCK_LOCATION_LOGS.unshift({
    id: nextId(),
    locationId: next.id,
    locationCode: next.locationCode,
    actionType: '\u7f16\u8f91\u5e93\u4f4d',
    operator: 'admin',
    content: '\u66f4\u65b0\u5e93\u4f4d\u6863\u6848',
    beforeValue: prev.locationCode,
    afterValue: next.locationCode,
    operateTime: nowStr()
  });
  return next;
}

export function changeWmsLocationStatus(rows: Api.Wms.Location[], ids: CommonType.IdType[], status: string) {
  ids.forEach(id => {
    const row = rows.find(r => String(r.id) === String(id));
    if (!row) return;
    row.status = status;
    row.locked = status === 'LOCKED';
    row.updateTime = nowStr();
    MOCK_LOCATION_LOGS.unshift({
      id: nextId(),
      locationId: row.id,
      locationCode: row.locationCode,
      actionType: '\u72b6\u6001\u53d8\u66f4',
      operator: 'admin',
      content: `\u6279\u91cf\u8c03\u6574\u72b6\u6001\u4e3a ${status}`,
      beforeValue: null,
      afterValue: status,
      operateTime: nowStr()
    });
  });
  return true;
}

export function batchBindWmsLocations(rows: Api.Wms.Location[], params: Api.Wms.LocationBatchBindParams) {
  params.ids.forEach(id => {
    const row = rows.find(r => String(r.id) === String(id));
    if (!row) return;
    if (params.customerName != null) row.customerName = params.customerName;
    if (params.platformCode != null) row.platformCode = params.platformCode;
    if (params.platformName != null) row.platformName = params.platformName;
    if (params.destinationCode != null) {
      const dest = normalizeLocationDestinations({
        ...row,
        destinationCode: params.destinationCode,
        destinationName: params.destinationName ?? params.destinationCode
      });
      Object.assign(row, dest);
    }
    if (params.purpose != null) row.purpose = params.purpose;
    row.updateTime = nowStr();
  });
  return true;
}

export function batchSetWmsLocationCapacity(rows: Api.Wms.Location[], params: Api.Wms.LocationBatchCapacityParams) {
  params.ids.forEach(id => {
    const row = rows.find(r => String(r.id) === String(id));
    if (!row) return;
    row.capacity = params.capacity;
    row.remainingCapacity = Math.max(0, params.capacity - (row.currentQty ?? 0));
    row.occupancyRate = params.capacity > 0 ? (row.currentQty ?? 0) / params.capacity : 0;
    if (!SPECIAL_STATUSES.includes(row.status as any)) {
      row.status = calcOccupancyStatus(row);
    }
    row.updateTime = nowStr();
  });
  return true;
}

export function batchGenerateWmsLocations(
  rows: Api.Wms.Location[],
  params: Api.Wms.LocationBatchGenerateParams,
  zoneName: string
) {
  const created: Api.Wms.Location[] = [];
  for (let r = params.rowFrom; r <= params.rowTo; r += 1) {
    const code = `${params.prefix}${String(r).padStart(2, '0')}`;
    if (rows.some(item => item.locationCode === code)) continue;
    const row = createWmsLocation(
      {
        companyId: 4000001,
        warehouseId: params.warehouseId,
        zoneId: params.zoneId,
        zoneName,
        locationCode: code,
        rowNo: String(r),
        columnNo: null,
        capacity: params.capacity ?? 30,
        purpose: params.purpose ?? 'GENERAL',
        status: params.status ?? 'EMPTY'
      },
      rows
    );
    created.push(row);
  }
  return created;
}

export function deleteWmsLocations(rows: Api.Wms.Location[], ids: string) {
  const idSet = new Set(ids.split(','));
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (idSet.has(String(rows[i].id))) rows.splice(i, 1);
  }
}

export function initWmsLocationLogs(rows: Api.Wms.Location[]) {
  rows.slice(0, 30).forEach(ensureLogs);
}

export function filterWmsLocationsExtended(rows: Api.Wms.Location[], params?: Record<string, any>) {
  let list = [...rows];
  if (params?.warehouseId != null && params.warehouseId !== '') {
    list = list.filter(row => String(row.warehouseId) === String(params.warehouseId));
  }
  if (params?.zoneId != null && params.zoneId !== '') {
    list = list.filter(row => String(row.zoneId) === String(params.zoneId));
  }
  const keyword = String(params?.keyword || params?.locationCode || '').trim().toLowerCase();
  if (keyword) {
    list = list.filter(
      row =>
        row.locationCode?.toLowerCase().includes(keyword) ||
        row.zoneName?.toLowerCase().includes(keyword) ||
        row.customerName?.toLowerCase().includes(keyword) ||
        row.platformName?.toLowerCase().includes(keyword)
    );
  }
  if (params?.status) list = list.filter(row => row.status === params.status);
  if (params?.purpose) list = list.filter(row => row.purpose === params.purpose);
  if (params?.platformCode) {
    const kw = String(params.platformCode).toLowerCase();
    list = list.filter(row => (row.platformCode || '').toLowerCase().includes(kw));
  }
  if (params?.customerName) {
    const k = String(params.customerName).toLowerCase();
    list = list.filter(row => row.customerName?.toLowerCase().includes(k));
  }
  return list;
}

export const LOCATION_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  EMPTY: { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857' },
  PARTIAL: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
  FULL: { bg: '#fff7ed', border: '#fdba74', text: '#c2410c' },
  LOCKED: { bg: '#fef3c7', border: '#fcd34d', text: '#b45309' },
  DISABLED: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
  MAINTENANCE: { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9' },
  ABNORMAL: { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
  PRE_OCCUPIED: { bg: '#eef2ff', border: '#a5b4fc', text: '#4338ca' },
  PENDING_CLEAN: { bg: '#fdf2f8', border: '#f9a8d4', text: '#be185d' }
};
