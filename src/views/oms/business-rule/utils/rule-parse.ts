import { ACTION_TYPE_OPTIONS, CONDITION_FIELD_OPTIONS, OP_OPTIONS, getFieldDef, getMenuLabel, inferMenuFromField } from '../constants';
import { formatTimeRangeDisplay, isTimeFieldDef } from './condition-time-range';

export function safeParse<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function fieldLabel(field: string) {
  const menu = inferMenuFromField(field);
  const def = getFieldDef(menu, field);
  if (def) return def.label;
  return CONDITION_FIELD_OPTIONS.find(o => o.value === field)?.label || field;
}

function valueLabel(field: string, value: unknown) {
  const menu = inferMenuFromField(field);
  const def = getFieldDef(menu, field);
  const formatOne = (val: string | number) => {
    if (isTimeFieldDef(def)) return formatTimeRangeDisplay(val);
    const hit = def?.statuses?.find(s => String(s.value) === String(val));
    return hit?.label || String(val);
  };
  if (Array.isArray(value)) return value.map(v => formatOne(v)).join('、');
  if (value == null || value === '') return '';
  return formatOne(value as string | number);
}

function opLabel(op: string) {
  return OP_OPTIONS.find(o => o.value === op)?.label || op;
}

export function renderConditionSummary(conditionConfig: string | null | undefined) {
  const config = safeParse<Api.Oms.BusinessRuleConditionConfig>(conditionConfig, { logic: 'AND', conditions: [] });
  if (!config.conditions?.length) return '全部匹配';
  return config.conditions
    .map(item => {
      const menu = getMenuLabel(inferMenuFromField(item.field));
      const prefix = menu ? `${menu}·` : '';
      const val = valueLabel(item.field, item.value);
      return `${prefix}${fieldLabel(item.field)} ${opLabel(item.op)}${val ? ` ${val}` : ''}`;
    })
    .join(` ${config.logic || 'AND'} `);
}

function actionTypeLabel(type: string) {
  return ACTION_TYPE_OPTIONS.find(item => item.value === type)?.label || type;
}

export function renderActionsSummary(actionsConfig: string | null | undefined) {
  const actions = safeParse<Api.Oms.BusinessRuleAction[]>(actionsConfig, []);
  if (!actions.length) return '—';
  return actions
    .map(a => {
      const menu = a.execMenuPage || (a.params?.execMenuPage as string) || '';
      const menuText = menu ? ` → ${getMenuLabel(menu)}` : '';
      return `[${a.level}] ${actionTypeLabel(a.type)}${menuText}${a.message ? `: ${a.message}` : ''}`;
    })
    .join('；');
}
