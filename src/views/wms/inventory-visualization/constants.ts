export type FloorPlanViewMode = 'map' | 'list' | 'kanban';

export const FLOOR_PLAN_VIEW_OPTIONS: Array<{ label: string; value: FloorPlanViewMode }> = [
  { label: '平面图视图', value: 'map' },
  { label: '列表视图', value: 'list' },
  { label: '看板视图', value: 'kanban' }
];

export const PLATFORM_FILTER_OPTIONS: CommonType.Option[] = [
  { label: '全部', value: '' },
  { label: 'Amazon', value: 'AMAZON' },
  { label: 'Walmart', value: 'WALMART' },
  { label: 'TikTok Shop', value: 'TIKTOK' }
];

export const DELIVERY_FILTER_OPTIONS: CommonType.Option[] = [
  { label: '全部', value: '' },
  { label: '卡派', value: '卡派' },
  { label: '快递', value: '快递' },
  { label: 'FBA', value: 'FBA' },
  { label: '自提', value: '自提' }
];

export const DESTINATION_FILTER_OPTIONS: CommonType.Option[] = [
  { label: '全部', value: '' },
  { label: 'LAX9', value: 'LAX9' },
  { label: 'ONT8', value: 'ONT8' },
  { label: 'SBD1', value: 'SBD1' },
  { label: 'GYR3', value: 'GYR3' }
];

export function buildZoneGrid(zone: Api.Wms.ZoneVisualization) {
  const rowMap = new Map<string, Api.Wms.LocationVisualization[]>();
  zone.locations.forEach(loc => {
    const row = loc.rowNo || '01';
    if (!rowMap.has(row)) rowMap.set(row, []);
    rowMap.get(row)!.push(loc);
  });
  const rows = [...rowMap.keys()].sort();
  rows.forEach(r => {
    rowMap.get(r)!.sort((a, b) => a.locationCode.localeCompare(b.locationCode));
  });
  return { rows, rowMap };
}
