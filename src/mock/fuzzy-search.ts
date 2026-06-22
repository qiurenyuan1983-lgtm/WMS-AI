/** Mock 列表模糊搜索工具（不区分大小写，包含即匹配） */

export function fuzzyKeyword(value?: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function hasFuzzyKeyword(value?: unknown): boolean {
  return fuzzyKeyword(value).length > 0;
}

export function fuzzyIncludes(haystack: unknown, needle?: unknown): boolean {
  const kw = fuzzyKeyword(needle);
  if (!kw) return true;
  if (haystack == null || haystack === '') return false;
  return String(haystack).toLowerCase().includes(kw);
}

export function fuzzyIncludesAny(haystacks: unknown[], needle?: unknown): boolean {
  const kw = fuzzyKeyword(needle);
  if (!kw) return true;
  return haystacks.some(h => fuzzyIncludes(h, kw));
}

/** 支持逗号分隔多值；fuzzy=false 时精确匹配（用于状态/枚举/ID） */
export function matchMultiValue(rowValue: unknown, paramValue: unknown, fuzzy = true): boolean {
  const pv = String(paramValue ?? '').trim();
  if (!pv) return true;
  if (pv.includes(',')) {
    const parts = pv.split(',').map(s => s.trim()).filter(Boolean);
    return parts.some(part => (fuzzy ? fuzzyIncludes(rowValue, part) : String(rowValue ?? '') === part));
  }
  return fuzzy ? fuzzyIncludes(rowValue, pv) : String(rowValue ?? '') === pv;
}

export function matchDateRange(value?: string | null, begin?: string | null, end?: string | null): boolean {
  if (!begin && !end) return true;
  if (!value) return false;
  const day = String(value).slice(0, 10);
  const b = begin ? String(begin).slice(0, 10) : null;
  const e = end ? String(end).slice(0, 10) : null;
  if (b && day < b) return false;
  if (e && day > e) return false;
  return true;
}

const CONTAINER_ORDER_KEYWORD_FIELDS = [
  'containerOrderNo',
  'containerNo',
  'customerName',
  'companyName',
  'channelName',
  'businessTypeName',
  'warehouseName',
  'shippingLineName',
  'ownerUserName',
  'customerServiceName',
  'sealNo',
  'vesselName',
  'voyageNo',
  'routeCode',
  'mblNo',
  'hblNo',
  'dischargePortName',
  'terminalName',
  'examRemark',
  'drayageVendorName',
  'pickupAppointmentNo',
  'pickupRemark',
  'containerLocation',
  'arrivalRemark',
  'devanningRemark',
  'emptyReturnLocation',
  'containerExceptionType',
  'devanningNo',
  'devanningOrderNo'
] as const;

const CONTAINER_ORDER_TEXT_FIELDS = [
  'containerOrderNo',
  'containerNo',
  'customerName',
  'ownerUserName',
  'customerServiceName',
  'sealNo',
  'vesselName',
  'voyageNo',
  'routeCode',
  'mblNo',
  'hblNo',
  'dischargePortName',
  'terminalName',
  'examRemark',
  'drayageVendorName',
  'pickupAppointmentNo',
  'pickupRemark',
  'containerLocation',
  'arrivalRemark',
  'devanningRemark',
  'emptyReturnLocation',
  'containerExceptionType',
  'shippingLineName'
] as const;

const CONTAINER_ORDER_ENUM_FIELDS = [
  'containerStatus',
  'terminalReleaseStatus',
  'examStatus',
  'examType',
  'orderSource',
  'containerType',
  'devanningMethod',
  'loadingType',
  'containerExceptionFlag',
  'downstreamExceptionFlag'
] as const;

const CONTAINER_ORDER_ID_FIELDS = [
  'warehouseId',
  'channelId',
  'businessTypeId',
  'shippingLineId',
  'companyId',
  'customerId'
] as const;

const CONTAINER_ORDER_DATE_RANGES: Array<[string, string, string]> = [
  ['eta', 'beginEta', 'endEta'],
  ['ata', 'beginAta', 'endAta'],
  ['pickupLfd', 'beginPickupLfd', 'endPickupLfd'],
  ['emptyReturnLfd', 'beginEmptyReturnLfd', 'endEmptyReturnLfd'],
  ['actualPickupTime', 'beginActualPickupTime', 'endActualPickupTime'],
  ['expectedArrivalTime', 'beginExpectedArrivalTime', 'endExpectedArrivalTime'],
  ['actualArrivalTime', 'beginActualArrivalTime', 'endActualArrivalTime'],
  ['expectedDevanningTime', 'beginExpectedDevanningTime', 'endExpectedDevanningTime'],
  ['devanningStartTime', 'beginDevanningStartTime', 'endDevanningStartTime'],
  ['devanningFinishTime', 'beginDevanningFinishTime', 'endDevanningFinishTime'],
  ['emptyReturnTime', 'beginEmptyReturnTime', 'endEmptyReturnTime']
];

export function filterContainerOrderList<T extends Record<string, any>>(rows: T[], params?: Record<string, any>): T[] {
  let list = rows;
  const p = params || {};

  if (hasFuzzyKeyword(p.keyword)) {
    const kw = fuzzyKeyword(p.keyword);
    list = list.filter(row => fuzzyIncludesAny(CONTAINER_ORDER_KEYWORD_FIELDS.map(f => row[f]), kw));
  }

  CONTAINER_ORDER_TEXT_FIELDS.forEach(field => {
    if (p[field]) list = list.filter(row => fuzzyIncludes(row[field], p[field]));
  });

  CONTAINER_ORDER_ENUM_FIELDS.forEach(field => {
    if (p[field] != null && p[field] !== '') {
      list = list.filter(row => matchMultiValue(row[field], p[field], false));
    }
  });

  CONTAINER_ORDER_ID_FIELDS.forEach(field => {
    if (p[field] != null && p[field] !== '') {
      list = list.filter(row => matchMultiValue(String(row[field] ?? ''), p[field], false));
    }
  });

  CONTAINER_ORDER_DATE_RANGES.forEach(([field, begin, end]) => {
    if (p[begin] || p[end]) {
      list = list.filter(row => matchDateRange(row[field], p[begin], p[end]));
    }
  });

  return list;
}
