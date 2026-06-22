import type { ConditionRow } from './condition-row';
import { getTimeRangePreset, parseCustomTimeRange } from './condition-time-range';

function todayText() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function setNestedValue(target: Record<string, unknown>, field: string, value: unknown) {
  const parts = field.split('.');
  let cur: Record<string, unknown> = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cur[part] = value;
      return;
    }
    if (cur[part] == null || typeof cur[part] !== 'object') {
      cur[part] = {};
    }
    cur = cur[part] as Record<string, unknown>;
  });
}

function sampleValueForCondition(row: ConditionRow): unknown {
  const { op, value } = row;
  if (op === 'IS_NULL') return null;
  if (op === 'IS_NOT_NULL') return 'mock-value';

  if (op === 'IN') {
    const arr = Array.isArray(value) ? value : String(value ?? '').split(',').map(s => s.trim()).filter(Boolean);
    return arr[0] ?? 'mock-value';
  }

  if (typeof value === 'string' && getTimeRangePreset(value) === 'CUSTOM') {
    const range = parseCustomTimeRange(value);
    return range?.[0] || todayText();
  }
  if (typeof value === 'string' && getTimeRangePreset(value)) {
    return todayText();
  }

  if (Array.isArray(value)) return value[0] ?? 'mock-value';
  if (value != null && value !== '') return value;
  return 'mock-value';
}

/** 构造一条可命中当前条件组合的模拟上下文 */
export function buildPassingTestContext(conditions: ConditionRow[]) {
  const context: Record<string, unknown> = {};
  conditions
    .filter(row => row.field)
    .forEach(row => {
      setNestedValue(context, String(row.field), sampleValueForCondition(row));
    });
  return context;
}
