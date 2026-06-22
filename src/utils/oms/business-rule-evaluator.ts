import { TIME_RANGE_PRESET_LABEL, parseCustomTimeRange } from '@/views/oms/business-rule/utils/condition-time-range';

export type BusinessRuleConditionDetail = {
  field: string;
  fieldValue: unknown;
  op: string;
  expectedValue: unknown;
  hit: boolean;
};

export function getRuleFieldValue(context: Record<string, unknown>, field: string) {
  const parts = field.split('.');
  let cur: unknown = context;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function parseDateText(value: unknown) {
  const text = String(value ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function resolvePresetRange(preset: string): [Date, Date] | null {
  const now = new Date();
  const today = startOfDay(now);
  const dayMs = 24 * 60 * 60 * 1000;
  if (preset === 'TODAY') return [today, endOfDay(today)];
  if (preset === 'TOMORROW') {
    const d = new Date(today.getTime() + dayMs);
    return [d, endOfDay(d)];
  }
  if (preset === 'YESTERDAY') {
    const d = new Date(today.getTime() - dayMs);
    return [d, endOfDay(d)];
  }
  if (preset === 'THIS_WEEK') {
    const day = today.getDay() || 7;
    const start = new Date(today.getTime() - (day - 1) * dayMs);
    const end = new Date(start.getTime() + 6 * dayMs);
    return [start, endOfDay(end)];
  }
  if (preset === 'LAST_WEEK') {
    const day = today.getDay() || 7;
    const thisWeekStart = new Date(today.getTime() - (day - 1) * dayMs);
    const start = new Date(thisWeekStart.getTime() - 7 * dayMs);
    const end = new Date(start.getTime() + 6 * dayMs);
    return [start, endOfDay(end)];
  }
  if (preset === 'THIS_MONTH') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return [start, endOfDay(end)];
  }
  if (preset === 'LAST_MONTH') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return [start, endOfDay(end)];
  }
  if (preset === 'LAST_7_DAYS') return [new Date(today.getTime() - 6 * dayMs), endOfDay(today)];
  if (preset === 'NEXT_7_DAYS') return [today, endOfDay(new Date(today.getTime() + 6 * dayMs))];
  if (preset === 'LAST_30_DAYS') return [new Date(today.getTime() - 29 * dayMs), endOfDay(today)];
  if (preset === 'NEXT_30_DAYS') return [today, endOfDay(new Date(today.getTime() + 29 * dayMs))];
  return null;
}

function evalTimeRange(fieldValue: unknown, expected: string) {
  const date = parseDateText(fieldValue);
  if (!date) return false;
  if (expected.startsWith('CUSTOM:')) {
    const range = parseCustomTimeRange(expected);
    if (!range) return false;
    const start = parseDateText(range[0]);
    const end = parseDateText(range[1]);
    if (!start || !end) return false;
    return date >= startOfDay(start) && date <= endOfDay(end);
  }
  const presetRange = resolvePresetRange(expected);
  if (!presetRange) return false;
  return date >= presetRange[0] && date <= presetRange[1];
}

export function evalRuleCondition(fieldValue: unknown, op: string, expected: unknown): boolean {
  if (op === 'IS_NULL') return fieldValue == null || fieldValue === '';
  if (op === 'IS_NOT_NULL') return fieldValue != null && fieldValue !== '';
  if (typeof expected === 'string' && (TIME_RANGE_PRESET_LABEL[expected] || expected.startsWith('CUSTOM:'))) {
    if (op === 'EQ' || op === 'IN') return evalTimeRange(fieldValue, expected);
  }
  if (op === 'EQ') return String(fieldValue ?? '') === String(expected ?? '');
  if (op === 'NEQ') return String(fieldValue ?? '') !== String(expected ?? '');
  if (op === 'GT') return Number(fieldValue) > Number(expected);
  if (op === 'GTE') return Number(fieldValue) >= Number(expected);
  if (op === 'LT') return Number(fieldValue) < Number(expected);
  if (op === 'LTE') return Number(fieldValue) <= Number(expected);
  if (op === 'IN') {
    const arr = Array.isArray(expected) ? expected : String(expected).split(',').map(s => s.trim());
    return arr.map(String).includes(String(fieldValue ?? ''));
  }
  return false;
}

export function matchBusinessRule(rule: Api.Oms.BusinessRule, context: Record<string, unknown>) {
  const config = JSON.parse(rule.conditionConfig || '{}') as Api.Oms.BusinessRuleConditionConfig;
  const conditions = config.conditions || [];
  const logic = config.logic || 'AND';
  const details: BusinessRuleConditionDetail[] = conditions.map(c => {
    const fieldValue = getRuleFieldValue(context, c.field);
    const hit = evalRuleCondition(fieldValue, c.op, c.value);
    return { field: c.field, fieldValue, op: c.op, expectedValue: c.value, hit };
  });
  const matched =
    logic === 'OR' ? details.some(d => d.hit) : details.length === 0 ? true : details.every(d => d.hit);
  return { matched, details };
}

export function parseRuleActions(rule: Api.Oms.BusinessRule) {
  return JSON.parse(rule.actionsConfig || '[]') as Api.Oms.BusinessRuleAction[];
}

export function evaluateBusinessRules(
  rules: Api.Oms.BusinessRule[],
  context: Record<string, unknown>,
  options?: { triggerEvent?: string | null; onlyEnabled?: boolean }
) {
  let list = [...rules];
  if (options?.onlyEnabled !== false) {
    list = list.filter(rule => rule.status === 'enabled');
  }
  if (options?.triggerEvent) {
    list = list.filter(rule => !rule.triggerEvent || rule.triggerEvent === options.triggerEvent);
  }
  list.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const hits: Array<{
    rule: Api.Oms.BusinessRule;
    details: BusinessRuleConditionDetail[];
    actions: Api.Oms.BusinessRuleAction[];
  }> = [];

  for (const rule of list) {
    const { matched, details } = matchBusinessRule(rule, context);
    if (matched) {
      hits.push({ rule, details, actions: parseRuleActions(rule) });
    }
  }

  const actions = hits.flatMap(item => item.actions);
  const blockAction = actions.find(action => action.level === 'BLOCK');
  return { hits, actions, blockAction, finalDecision: blockAction?.level || actions[0]?.level || null };
}
