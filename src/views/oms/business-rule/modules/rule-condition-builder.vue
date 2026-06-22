<script setup lang="ts">
import { NButton, NInput, NRadio, NRadioGroup, NSelect, NSpace } from 'naive-ui';
import {
  CONDITION_FIELDS_BY_MENU,
  CONDITION_MENU_OPTIONS,
  OP_OPTIONS,
  getFieldDef
} from '../constants';
import type { ConditionRow } from '../utils/condition-row';
import { isTimeFieldDef } from '../utils/condition-time-range';
import ConditionTimeRangeInput from './condition-time-range-input.vue';

const logic = defineModel<'AND' | 'OR'>('logic', { default: 'AND' });
const conditions = defineModel<ConditionRow[]>('conditions', { required: true });

defineProps<{ disabled?: boolean }>();

function isMultiValueOp(op: string) {
  return op === 'IN';
}

function isNullOp(op: string) {
  return ['IS_NULL', 'IS_NOT_NULL'].includes(op);
}

function fieldOptions(menu: string | null | undefined) {
  if (!menu) return [];
  return (CONDITION_FIELDS_BY_MENU[menu] || []).map(item => ({
    label: item.label,
    value: item.value
  }));
}

function statusOptions(row: ConditionRow) {
  return getFieldDef(row.menu, row.field)?.statuses || [];
}

function hasStatusOptions(row: ConditionRow) {
  return statusOptions(row).length > 0;
}

function isTimeField(row: ConditionRow) {
  return isTimeFieldDef(getFieldDef(row.menu, row.field));
}

function statusValue(row: ConditionRow): string[] {
  if (Array.isArray(row.value)) return row.value.map(String);
  if (row.value == null || row.value === '') return [];
  return [String(row.value)];
}

function addCondition() {
  conditions.value.push({ menu: null, op: 'IN', field: null, value: [] });
}

function removeCondition(index: number) {
  conditions.value.splice(index, 1);
  if (!conditions.value.length) addCondition();
}

function onMenuChange(row: ConditionRow, menu: string | null) {
  row.menu = menu;
  row.field = null;
  row.value = [];
  row.op = 'IN';
}

function onFieldChange(row: ConditionRow, field: string | null) {
  row.field = field;
  const def = getFieldDef(row.menu, field);
  if (def?.statuses?.length) {
    row.op = 'IN';
    row.value = [];
  } else if (isTimeFieldDef(def)) {
    row.op = 'EQ';
    row.value = null;
  } else {
    row.op = 'EQ';
    row.value = null;
  }
}

function onOpChange(row: ConditionRow, op: string) {
  row.op = op;
  if (isNullOp(op)) {
    row.value = null;
    return;
  }
  if (hasStatusOptions(row)) {
    row.value = isMultiValueOp(op) ? statusValue(row) : statusValue(row)[0] ?? null;
    return;
  }
  row.value = isMultiValueOp(op) ? [] : null;
}

function onStatusChange(row: ConditionRow, values: string[]) {
  row.value = values;
  if (values.length > 1 && row.op === 'EQ') row.op = 'IN';
  if (values.length <= 1 && row.op === 'IN') row.op = values.length === 1 ? 'EQ' : 'IN';
}
</script>

<template>
  <div>
    <NRadioGroup v-model:value="logic" :disabled="disabled" class="mb-12px">
      <NSpace>
        <NRadio value="AND">满足全部条件 (AND)</NRadio>
        <NRadio value="OR">满足任一条件 (OR)</NRadio>
      </NSpace>
    </NRadioGroup>
    <NSpace vertical :size="8">
      <div v-for="(row, index) in conditions" :key="index" class="flex flex-wrap items-center gap-8px">
        <NSelect
          :value="row.menu ?? null"
          :options="CONDITION_MENU_OPTIONS"
          filterable
          clearable
          :disabled="disabled"
          placeholder="菜单"
          class="w-160px"
          @update:value="v => onMenuChange(row, v as string | null)"
        />
        <NSelect
          :value="row.op"
          :options="OP_OPTIONS"
          :disabled="disabled"
          placeholder="判断"
          class="w-120px"
          @update:value="v => onOpChange(row, v as string)"
        />
        <NSelect
          :value="row.field"
          :options="fieldOptions(row.menu)"
          filterable
          clearable
          :disabled="disabled || !row.menu"
          placeholder="字段"
          class="w-180px"
          @update:value="v => onFieldChange(row, v as string | null)"
        />
        <NSelect
          v-if="hasStatusOptions(row) && !isNullOp(row.op)"
          :value="statusValue(row)"
          :options="statusOptions(row)"
          multiple
          filterable
          clearable
          :disabled="disabled"
          placeholder="状态（可多选）"
          class="min-w-220px flex-1"
          @update:value="v => onStatusChange(row, (v as string[]) || [])"
        />
        <ConditionTimeRangeInput
          v-else-if="isTimeField(row) && !isNullOp(row.op)"
          :value="row.value"
          :disabled="disabled"
          @update:value="v => { row.value = v; }"
        />
        <NInput
          v-else-if="!isNullOp(row.op)"
          :value="Array.isArray(row.value) ? row.value.join(',') : (row.value ?? '')"
          :disabled="disabled"
          placeholder="值，多值用逗号分隔"
          class="min-w-180px flex-1"
          @update:value="v => { row.value = isMultiValueOp(row.op) ? v.split(',').map(s => s.trim()).filter(Boolean) : v; }"
        />
        <span v-else class="text-12px text-gray-400 w-180px">无需填写状态</span>
        <NButton quaternary type="error" :disabled="disabled" @click="removeCondition(index)">删除</NButton>
      </div>
    </NSpace>
    <NButton size="small" secondary class="mt-8px" :disabled="disabled" @click="addCondition">添加条件</NButton>
  </div>
</template>
