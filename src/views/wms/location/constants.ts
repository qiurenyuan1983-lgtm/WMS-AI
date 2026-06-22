import type { TagProps } from 'naive-ui';

export type LocationViewMode = 'list' | 'map' | 'kanban';

export const LOCATION_VIEW_OPTIONS: Array<{ label: string; value: LocationViewMode; icon: string }> = [
  { label: '列表', value: 'list', icon: 'material-symbols:table-rows-outline' },
  { label: '地图', value: 'map', icon: 'material-symbols:grid-view-outline' },
  { label: '看板', value: 'kanban', icon: 'material-symbols:view-kanban-outline' }
];

export const KANBAN_STATUS_KEYS = [
  'EMPTY',
  'PARTIAL',
  'FULL',
  'LOCKED',
  'DISABLED',
  'MAINTENANCE',
  'ABNORMAL',
  'PRE_OCCUPIED',
  'PENDING_CLEAN'
] as const;

export const PLATFORM_OPTIONS: CommonType.Option[] = [
  { label: 'Amazon', value: 'AMAZON' },
  { label: 'Walmart', value: 'WALMART' },
  { label: 'TikTok Shop', value: 'TIKTOK' },
  { label: 'Shein', value: 'SHEIN' }
];

export const DESTINATION_OPTIONS: CommonType.Option[] = [
  { label: 'LAX9', value: 'LAX9' },
  { label: 'ONT8', value: 'ONT8' },
  { label: 'SBD1', value: 'SBD1' },
  { label: 'GYR3', value: 'GYR3' },
  { label: 'IND9', value: 'IND9' }
];

export function statusTagType(status?: string | null): TagProps['type'] {
  const map: Record<string, TagProps['type']> = {
    EMPTY: 'success',
    PARTIAL: 'info',
    FULL: 'warning',
    LOCKED: 'warning',
    DISABLED: 'default',
    MAINTENANCE: 'default',
    ABNORMAL: 'error',
    PRE_OCCUPIED: 'primary',
    PENDING_CLEAN: 'error'
  };
  return map[status || ''] || 'default';
}

export function occupancyPercent(row: Api.Wms.Location) {
  if (row.occupancyRate != null) return Math.round(row.occupancyRate * 100);
  const cap = row.capacity ?? 30;
  const qty = row.currentQty ?? 0;
  return cap > 0 ? Math.round((qty / cap) * 100) : 0;
}

export function parseLocationDestinationCodes(row: Pick<Api.Wms.Location, 'destinationCodes' | 'destinationCode'>) {
  if (row.destinationCodes?.length) return [...row.destinationCodes];
  if (!row.destinationCode) return [];
  return row.destinationCode.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
}

export function normalizeLocationDestinations(
  row: Partial<Api.Wms.Location>
): Pick<Api.Wms.Location, 'destinationLimit' | 'destinationCodes' | 'destinationCode' | 'destinationName'> {
  const limit = Math.max(1, row.destinationLimit ?? 1);
  let codes = parseLocationDestinationCodes(row as Api.Wms.Location);
  if (limit === 1) codes = codes.length ? [codes[0]] : [];
  else codes = codes.slice(0, limit);
  return {
    destinationLimit: limit,
    destinationCodes: codes,
    destinationCode: codes.join(',') || null,
    destinationName: codes.join(',') || null
  };
}

export function formatLocationDestinations(row: Api.Wms.Location) {
  const codes = parseLocationDestinationCodes(row);
  return codes.length ? codes.join('、') : '—';
}

const ABNORMAL_LOCATION_STATUSES = new Set(['LOCKED', 'DISABLED', 'MAINTENANCE', 'ABNORMAL']);

/** 库位管理列表 — 运营状态（非占用率） */
export function locationOperateStatusLabel(status?: string | null) {
  if (!status || !ABNORMAL_LOCATION_STATUSES.has(status)) return '正常';
  const map: Record<string, string> = {
    LOCKED: '锁定',
    DISABLED: '禁用',
    MAINTENANCE: '维修',
    ABNORMAL: '异常'
  };
  return map[status] || '正常';
}

export function locationOperateStatusType(status?: string | null): TagProps['type'] {
  if (!status || !ABNORMAL_LOCATION_STATUSES.has(status)) return 'info';
  const map: Record<string, TagProps['type']> = {
    LOCKED: 'warning',
    DISABLED: 'default',
    MAINTENANCE: 'default',
    ABNORMAL: 'error'
  };
  return map[status] || 'info';
}
