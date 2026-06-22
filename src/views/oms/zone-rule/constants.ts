export const DELIVERY_METHOD_OPTIONS = [
  { label: '私仓', value: 'PRIVATE_WH' },
  { label: '卡车派送', value: 'TRUCK' },
  { label: '一件代发', value: 'DROPSHIP' },
  { label: '暂扣, 中转订单', value: 'HOLD_TRANSFER' },
  { label: '不限', value: 'ANY' }
];

export const PLATFORM_OPTIONS = [
  { label: '不限平台', value: 'ANY' },
  { label: '亚马逊 (AMZ)', value: 'AMAZON' },
  { label: 'Walmart', value: 'WALMART' },
  { label: 'Target', value: 'TARGET' }
];

/** 平台仓库代码 — 上架条件模糊搜索用 */
export const PLATFORM_CODE_OPTIONS: CommonType.Option[] = [
  { label: 'LAX9', value: 'LAX9' },
  { label: 'ONT8', value: 'ONT8' },
  { label: 'SBD2', value: 'SBD2' },
  { label: 'XLX7', value: 'XLX7' },
  { label: 'LGB8', value: 'LGB8' },
  { label: 'GYR3', value: 'GYR3' },
  { label: 'IND9', value: 'IND9' },
  { label: 'ORD2', value: 'ORD2' },
  { label: 'SMF3', value: 'SMF3' },
  { label: 'DFW6', value: 'DFW6' },
  { label: '亚马逊: 不限代码', value: '亚马逊: 不限代码' },
  { label: '亚马逊: SBD2', value: '亚马逊: SBD2' },
  { label: '亚马逊: XLX7', value: '亚马逊: XLX7' },
  { label: '亚马逊: ONT8', value: '亚马逊: ONT8' },
  { label: '亚马逊: LGB8', value: '亚马逊: LGB8' },
  { label: 'Walmart: LAX2', value: 'Walmart: LAX2' },
  { label: '不限平台 (不按平台过滤)', value: '不限平台 (不按平台过滤)' }
];

export const ZONE_TYPE_OPTIONS = [
  { label: '高架', value: '高架' },
  { label: '地面', value: '地面' },
  { label: '贵品', value: '贵品' },
  { label: '尾板', value: '尾板' }
];

export const STORAGE_METHOD_OPTIONS = [
  { label: '卡板', value: '卡板' },
  { label: '地板', value: '地板' }
];

export const ZONE_AREA_OPTIONS = [
  { label: 'A区', value: 'A区' },
  { label: 'B区', value: 'B区' },
  { label: 'C区', value: 'C区' },
  { label: 'D区', value: 'D区' },
  { label: 'E区', value: 'E区' },
  { label: 'F区', value: 'F区' },
  { label: 'H区', value: 'H区' },
  { label: 'I区', value: 'I区' },
  { label: 'J区', value: 'J区' },
  { label: 'X区', value: 'X区' }
];

export const TARGET_TYPE_OPTIONS = [
  { label: '按库区', value: 'ZONE' },
  { label: '按库位（库区+库位）', value: 'LOCATION' },
  { label: '按库区类型', value: 'ZONE_TYPE' },
  { label: '按存放方式', value: 'STORAGE_METHOD' }
];

export function getLocationCountForZone(zoneName: string) {
  if (zoneName === 'X区') return 48;
  if (zoneName === 'B区') return 26;
  return 40;
}

/** 生成库区下库位选项，如 B区 / B01 */
export function buildLocationOptions(zoneName: string, count?: number) {
  const total = count ?? getLocationCountForZone(zoneName);
  const prefix = zoneName.replace('区', '');
  return Array.from({ length: total }, (_, i) => {
    const code = `${prefix}${String(i + 1).padStart(2, '0')}`;
    return { label: `${zoneName} / ${code}`, value: `${zoneName}/${code}` };
  });
}

export function filterOptionsByKeyword(options: CommonType.Option[], keyword?: string | null) {
  const kw = keyword?.trim().toLowerCase();
  if (!kw) return options;
  return options.filter(opt => {
    const label = String(opt.label ?? '').toLowerCase();
    const value = String(opt.value ?? '').toLowerCase();
    return label.includes(kw) || value.includes(kw);
  });
}

export function filterPlatformCodeOption(pattern: string, option: CommonType.Option) {
  const kw = pattern.trim().toLowerCase();
  if (!kw) return true;
  const label = String(option.label ?? '').toLowerCase();
  const value = String(option.value ?? '').toLowerCase();
  return label.includes(kw) || value.includes(kw);
}

export function parseLocationTags(zoneName: string, locationNos?: string | null) {
  if (!locationNos?.trim()) return [] as string[];
  return locationNos.split(/[,，]/).map(s => s.trim()).filter(Boolean).map(code => {
    const normalized = code.includes('/') ? code : `${zoneName}/${code.replace(`${zoneName}`, '').trim()}`;
    if (normalized.includes('/')) return normalized;
    return `${zoneName}/${code}`;
  });
}

export function formatLocationTags(tags: string[]) {
  return tags.map(t => t.split('/').pop() || t).join(', ');
}

export function parsePlatformCodes(platformCode?: string | null) {
  if (!platformCode?.trim()) return [] as string[];
  return platformCode.split(/[,，]/).map(s => s.trim()).filter(Boolean);
}

export function formatPlatformCodes(codes?: string[] | null) {
  if (!codes?.length) return null;
  return codes.map(code => code.trim()).filter(Boolean).join(', ');
}

export function deliveryMethodLabel(value?: string | null) {
  return DELIVERY_METHOD_OPTIONS.find(o => o.value === value)?.label || value || '—';
}

export function platformLabel(value?: string | null) {
  return PLATFORM_OPTIONS.find(o => o.value === value)?.label || value || '—';
}

export function displayDash(value?: string | null) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}
