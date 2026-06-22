import type { ConditionFieldDef } from './system-menu-fields';

export const TIME_RANGE_PRESET_OPTIONS: CommonType.Option[] = [
  { label: '今天', value: 'TODAY' },
  { label: '明天', value: 'TOMORROW' },
  { label: '昨天', value: 'YESTERDAY' },
  { label: '本周', value: 'THIS_WEEK' },
  { label: '上周', value: 'LAST_WEEK' },
  { label: '本月', value: 'THIS_MONTH' },
  { label: '上月', value: 'LAST_MONTH' },
  { label: '过去 7 天内', value: 'LAST_7_DAYS' },
  { label: '未来 7 天内', value: 'NEXT_7_DAYS' },
  { label: '过去 30 天内', value: 'LAST_30_DAYS' },
  { label: '未来 30 天内', value: 'NEXT_30_DAYS' },
  { label: '具体日期', value: 'CUSTOM' }
];

export const TIME_RANGE_PRESET_LABEL: Record<string, string> = TIME_RANGE_PRESET_OPTIONS.reduce(
  (acc, item) => {
    acc[String(item.value)] = String(item.label);
    return acc;
  },
  {} as Record<string, string>
);

export function inferFieldValueType(key: string, label: string): 'datetime' | 'text' {
  if (/time$|lfd$|^eta$|^ata$/i.test(key)) return 'datetime';
  if (key === 'createTime' || key === 'updateTime') return 'datetime';
  if (/时间|LFD/.test(label) || label === 'ETA' || label === 'ATA') return 'datetime';
  return 'text';
}

export function isTimeFieldDef(def?: ConditionFieldDef | null) {
  return def?.valueType === 'datetime';
}

export function parseCustomTimeRange(value: string): [string, string] | null {
  if (!value.startsWith('CUSTOM:')) return null;
  const body = value.slice('CUSTOM:'.length);
  const [start, end] = body.split(',');
  if (!start?.trim() || !end?.trim()) return null;
  return [start.trim(), end.trim()];
}

export function formatCustomTimeRange(range: [string, string] | null | undefined): string | null {
  if (!range?.[0] || !range?.[1]) return null;
  return `CUSTOM:${range[0]},${range[1]}`;
}

export function getTimeRangePreset(value: unknown): string | null {
  if (value == null || value === '') return null;
  const text = String(value);
  if (text.startsWith('CUSTOM:')) return 'CUSTOM';
  if (TIME_RANGE_PRESET_LABEL[text]) return text;
  return null;
}

export function formatTimeRangeDisplay(value: unknown): string {
  if (value == null || value === '') return '';
  const text = String(value);
  if (text.startsWith('CUSTOM:')) {
    const range = parseCustomTimeRange(text);
    return range ? `${range[0]} ~ ${range[1]}` : text;
  }
  return TIME_RANGE_PRESET_LABEL[text] || text;
}
