<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NDatePicker, NSelect } from 'naive-ui';
import {
  TIME_RANGE_PRESET_OPTIONS,
  formatCustomTimeRange,
  getTimeRangePreset,
  parseCustomTimeRange
} from '../utils/condition-time-range';

const props = defineProps<{
  value: string | string[] | null | undefined;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:value': [value: string | null];
}>();

const preset = ref<string | null>(null);
const customRange = ref<[string, string] | null>(null);

function syncFromValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    preset.value = 'CUSTOM';
    customRange.value = value.length >= 2 ? [String(value[0]), String(value[1])] : null;
    return;
  }
  const code = getTimeRangePreset(value);
  preset.value = code;
  customRange.value = typeof value === 'string' ? parseCustomTimeRange(value) : null;
}

watch(
  () => props.value,
  value => syncFromValue(value),
  { immediate: true }
);

const showDatePicker = computed(() => preset.value === 'CUSTOM');

function emitValue(nextPreset: string | null, range: [string, string] | null) {
  if (!nextPreset) {
    emit('update:value', null);
    return;
  }
  if (nextPreset === 'CUSTOM') {
    emit('update:value', formatCustomTimeRange(range));
    return;
  }
  emit('update:value', nextPreset);
}

function onPresetChange(code: string | null) {
  preset.value = code;
  if (code === 'CUSTOM') {
    customRange.value = null;
    emit('update:value', null);
    return;
  }
  customRange.value = null;
  emitValue(code, null);
}

function onRangeChange(range: [string, string] | null) {
  customRange.value = range;
  emitValue('CUSTOM', range);
}
</script>

<template>
  <div class="flex min-w-280px flex-1 flex-wrap items-center gap-8px">
    <NSelect
      :value="preset"
      :options="TIME_RANGE_PRESET_OPTIONS"
      filterable
      clearable
      :disabled="disabled"
      placeholder="选择时间段"
      class="min-w-160px flex-1"
      @update:value="v => onPresetChange(v as string | null)"
    />
    <NDatePicker
      v-if="showDatePicker"
      :formatted-value="customRange"
      type="daterange"
      clearable
      format="yyyy-MM-dd"
      value-format="yyyy-MM-dd"
      :disabled="disabled"
      placeholder="选择日期范围"
      class="min-w-240px flex-1"
      @update:formatted-value="v => onRangeChange(v as [string, string] | null)"
    />
  </div>
</template>
