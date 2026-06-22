import { getFieldDef, inferMenuFromField } from '../constants';

export type ConditionRow = {
  menu?: string | null;
  op: string;
  field: string | null;
  value: string | string[] | null;
};

export function normalizeConditionRow(row: ConditionRow): ConditionRow {
  const menu = row.menu || inferMenuFromField(row.field);
  const def = getFieldDef(menu, row.field);
  let value = row.value;
  if (def?.statuses?.length) {
    if (Array.isArray(value)) {
      value = value.map(String);
    } else if (typeof value === 'string' && value.includes(',')) {
      value = value.split(',').map(s => s.trim()).filter(Boolean);
    } else if (value != null && value !== '') {
      value = [String(value)];
    } else {
      value = [];
    }
  }
  return {
    menu,
    op: row.op || (def?.statuses?.length ? 'IN' : 'EQ'),
    field: row.field,
    value
  };
}
