<script setup lang="ts">
import { ref, watch } from 'vue';

defineOptions({ name: 'TouchBoxQtyKeypad' });

const props = defineProps<{
  max?: number;
  disabled?: boolean;
}>();

const model = defineModel<number | null>({ default: null });

const draft = ref('');

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

function syncDraftFromModel() {
  draft.value = model.value != null && model.value > 0 ? String(model.value) : '';
}

function emitModel() {
  if (!draft.value) {
    model.value = null;
    return;
  }
  const num = Number(draft.value);
  model.value = num > 0 ? num : null;
}

function appendDigit(digit: string) {
  if (props.disabled) return;
  const next = `${draft.value}${digit}`.replace(/^0+(?=\d)/, '');
  const num = Number(next);
  if (props.max != null && props.max > 0 && num > props.max) {
    draft.value = String(props.max);
  } else {
    draft.value = next;
  }
  emitModel();
}

function handleBackspace() {
  if (props.disabled) return;
  draft.value = draft.value.slice(0, -1);
  emitModel();
}

function handleClear() {
  if (props.disabled) return;
  draft.value = '';
  model.value = null;
}

watch(
  () => model.value,
  () => syncDraftFromModel(),
  { immediate: true }
);
</script>

<template>
  <div class="inline-keypad" :class="{ 'inline-keypad-disabled': disabled }">
    <div class="keypad-grid">
      <button
        v-for="key in keys.slice(0, 9)"
        :key="key"
        type="button"
        class="keypad-key"
        :disabled="disabled"
        @click="appendDigit(key)"
      >
        {{ key }}
      </button>
      <button type="button" class="keypad-key keypad-key-muted" :disabled="disabled" @click="handleBackspace">
        删
      </button>
      <button type="button" class="keypad-key" :disabled="disabled" @click="appendDigit('0')">0</button>
      <button type="button" class="keypad-key keypad-key-muted" :disabled="disabled" @click="handleClear">
        清
      </button>
    </div>
  </div>
</template>

<style scoped>
.inline-keypad {
  margin-top: 8px;
}

.inline-keypad-disabled {
  opacity: 0.55;
  pointer-events: none;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.keypad-key {
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  color: #111827;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
}

.keypad-key:active:not(:disabled) {
  background: #e5e7eb;
}

.keypad-key-muted {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}
</style>
