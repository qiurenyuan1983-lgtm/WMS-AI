import { MOCK_WAREHOUSE } from './common';
import { resolveMockZoneName } from './wms-location-seed';

type OccupancyLevel = Api.Wms.LocationVisualization['occupancyLevel'];

const DELIVERY_METHODS = ['卡派', '快递', '自提', 'FBA'];

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function calcOccupancyLevel(percent: number, loc: Api.Wms.Location): OccupancyLevel {
  if (loc.status === 'DISABLED' || loc.status === 'MAINTENANCE') return 'INVALID';
  if (percent <= 0) return 'EMPTY';
  if (percent < 50) return 'LOW';
  if (percent < 80) return 'MEDIUM';
  if (percent < 95) return 'HIGH';
  return 'CRITICAL';
}

function resolveRowCol(loc: Api.Wms.Location, index: number) {
  if (loc.rowNo) {
    return { rowNo: String(loc.rowNo).padStart(2, '0'), columnNo: null };
  }
  const tailMatch = loc.locationCode.match(/(\d+)\s*$/);
  if (tailMatch) {
    return { rowNo: tailMatch[1].padStart(2, '0'), columnNo: null };
  }
  const row = (index % 20) + 1;
  return { rowNo: String(row).padStart(2, '0'), columnNo: null };
}

function buildDestinationStats(loc: Api.Wms.Location) {
  if ((loc.currentQty ?? 0) <= 0) return [];
  const dest = loc.destinationCode || loc.platformCode || '未指定';
  return [{ groupDestination: dest, palletCount: loc.palletCount ?? Math.max(1, Math.ceil((loc.currentQty ?? 0) / 10)) }];
}

function toVisualizationLocation(loc: Api.Wms.Location, index: number, zones: Api.Wms.Zone[]): Api.Wms.LocationVisualization {
  const capacity = loc.capacity ?? 30;
  const currentQty = loc.currentQty ?? 0;
  const remainingCapacity = Math.max(0, capacity - currentQty);
  const occupancyPercent = capacity > 0 ? Math.round((currentQty / capacity) * 100) : 0;
  const { rowNo, columnNo } = resolveRowCol(loc, index);
  const zoneName = resolveMockZoneName(zones as any, loc.zoneId, loc.zoneName);
  const deliveryMethod = DELIVERY_METHODS[index % DELIVERY_METHODS.length];

  return {
    id: loc.id,
    zoneId: loc.zoneId!,
    zoneName,
    locationCode: loc.locationCode,
    rowNo,
    columnNo,
    capacity,
    currentQty,
    remainingCapacity,
    status: loc.status,
    occupancyPercent,
    occupancyLevel: calcOccupancyLevel(occupancyPercent, loc),
    destinationStats: buildDestinationStats(loc),
    platformCode: loc.platformCode ?? loc.destinationCode ?? null,
    platformName: loc.platformName ?? null,
    customerName: loc.customerName ?? null,
    deliveryMethod,
    purpose: loc.purpose ?? null,
    locked: Boolean(loc.locked) || loc.status === 'LOCKED',
    abnormal: loc.status === 'ABNORMAL',
    palletCount: loc.palletCount ?? (currentQty > 0 ? Math.max(1, Math.ceil(currentQty / 10)) : 0)
  };
}

function filterLocations(rows: Api.Wms.Location[], params?: Record<string, any>) {
  let list = [...rows];
  if (params?.warehouseId != null && params.warehouseId !== '') {
    list = list.filter(r => String(r.warehouseId) === String(params.warehouseId));
  }
  if (params?.zoneId != null && params.zoneId !== '') {
    list = list.filter(r => String(r.zoneId) === String(params.zoneId));
  }
  if (params?.platformCode) {
    const kw = String(params.platformCode).toLowerCase();
    list = list.filter(r => (r.platformCode || '').toLowerCase().includes(kw));
  }
  if (params?.destinationCode) {
    const kw = String(params.destinationCode).toLowerCase();
    list = list.filter(r => (r.destinationCode || '').toLowerCase().includes(kw));
  }
  if (params?.customerName) {
    const k = String(params.customerName).toLowerCase();
    list = list.filter(r => r.customerName?.toLowerCase().includes(k));
  }
  if (params?.status) list = list.filter(r => r.status === params.status);
  if (params?.onlyAvailable === true || params?.onlyAvailable === 'true' || params?.onlyAvailable === 'Y') {
    list = list.filter(r => (r.currentQty ?? 0) < (r.capacity ?? 30) && r.status !== 'DISABLED' && r.status !== 'LOCKED');
  }
  const keyword = String(params?.zoneKeyword || '').trim().toLowerCase();
  if (keyword) list = list.filter(r => r.zoneName?.toLowerCase().includes(keyword));
  return list;
}

function buildStats(locations: Api.Wms.LocationVisualization[]): Api.Wms.InventoryFloorPlanStats {
  const total = locations.length;
  const used = locations.filter(l => l.currentQty > 0).length;
  const empty = locations.filter(l => l.currentQty <= 0 && l.occupancyLevel !== 'INVALID').length;
  const totalCap = locations.reduce((s, l) => s + (l.capacity ?? 30), 0);
  const totalQty = locations.reduce((s, l) => s + l.currentQty, 0);
  return {
    totalLocations: total,
    usedLocations: used,
    emptyLocations: empty,
    occupancyRate: totalCap > 0 ? Math.round((totalQty / totalCap) * 1000) / 10 : 0,
    highOccupancyCount: locations.filter(l => l.occupancyPercent >= 80).length,
    abnormalCount: locations.filter(l => l.abnormal || l.status === 'ABNORMAL').length
  };
}

export function buildWmsInventoryVisualization(
  locations: Api.Wms.Location[],
  zones: Api.Wms.Zone[],
  params?: Record<string, any>
) {
  const filtered = filterLocations(locations, params);
  const zoneMap = new Map<string, Api.Wms.LocationVisualization[]>();

  filtered.forEach((loc, index) => {
    const viz = toVisualizationLocation(loc, index, zones);
    if (params?.deliveryMethod && viz.deliveryMethod !== params.deliveryMethod) return;
    const key = String(loc.zoneId);
    if (!zoneMap.has(key)) zoneMap.set(key, []);
    zoneMap.get(key)!.push(viz);
  });

  const zoneVisualizations: Api.Wms.ZoneVisualization[] = zones
    .map(zone => {
      const locs = zoneMap.get(String(zone.id)) || [];
      if (!locs.length && params?.zoneId && String(params.zoneId) !== String(zone.id)) return null;
      const totalCapacity = locs.reduce((s, l) => s + (l.capacity ?? 30), 0);
      const usedPalletCount = locs.reduce((s, l) => s + l.currentQty, 0);
      return {
        zoneId: zone.id,
        zoneName: zone.zoneName,
        zoneType: zone.zoneType,
        storageMethod: zone.storageMethod,
        status: zone.status,
        usedPalletCount,
        totalCapacity,
        locationCount: locs.length,
        occupancyPercent: totalCapacity > 0 ? Math.round((usedPalletCount / totalCapacity) * 100) : 0,
        locations: locs.sort((a, b) => a.locationCode.localeCompare(b.locationCode))
      };
    })
    .filter((z): z is Api.Wms.ZoneVisualization => Boolean(z && z.locationCount > 0));

  const allLocs = zoneVisualizations.flatMap(z => z.locations);
  const totalCapacity = allLocs.reduce((s, l) => s + (l.capacity ?? 30), 0);
  const usedPalletCount = allLocs.reduce((s, l) => s + l.currentQty, 0);

  return {
    warehouseId: params?.warehouseId ?? MOCK_WAREHOUSE.id,
    warehouseCode: MOCK_WAREHOUSE.warehouseCode,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    usedPalletCount,
    totalCapacity,
    locationCount: allLocs.length,
    occupancyPercent: totalCapacity > 0 ? Math.round((usedPalletCount / totalCapacity) * 100) : 0,
    zones: zoneVisualizations,
    refreshTime: nowStr(),
    stats: buildStats(allLocs)
  } satisfies Api.Wms.InventoryVisualization;
}

export const FLOOR_PLAN_OCCUPANCY_STYLES: Record<
  OccupancyLevel,
  { bg: string; border: string; label: string; text: string }
> = {
  EMPTY: { bg: '#d8f3dc', border: '#95d5b2', label: '空闲 0%', text: '#047857' },
  LOW: { bg: '#cfe8ff', border: '#6ea8fe', label: '低占用 1-49%', text: '#1d4ed8' },
  MEDIUM: { bg: '#fff3cd', border: '#ffc107', label: '中占用 50-79%', text: '#b45309' },
  HIGH: { bg: '#ffe5d0', border: '#fd7e14', label: '高占用 80-94%', text: '#c2410c' },
  CRITICAL: { bg: '#f8b4b4', border: '#dc3545', label: '满仓 95%+', text: '#b91c1c' },
  INVALID: { bg: '#e9ecef', border: '#adb5bd', label: '无效库位', text: '#6b7280' }
};
