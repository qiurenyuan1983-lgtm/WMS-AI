<script setup lang="ts">
import type { DevanningStep } from '../shared/devanning-constants';

defineProps<{
  disabled?: boolean;
  activeStep?: DevanningStep;
}>();

const emit = defineEmits<{
  (e: 'action', step: DevanningStep): void;
}>();

const items: Array<{ key: DevanningStep; label: string; icon: string }> = [
  { key: 'scan', label: '扫码', icon: '📷' },
  { key: 'create', label: '建板', icon: '📦' },
  { key: 'print', label: '打印', icon: '🖨' },
  { key: 'photo', label: '拍照', icon: '📸' },
  { key: 'report', label: '完成', icon: '✓' }
];
</script>

<template>
  <nav class="dv-bottom-bar" aria-label="拆柜快捷操作">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="dv-bottom-btn"
      :class="{ active: activeStep === item.key }"
      :disabled="disabled"
      @click="emit('action', item.key)"
    >
      <span class="dv-bottom-icon">{{ item.icon }}</span>
      <span class="dv-bottom-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.dv-bottom-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
}

.dv-bottom-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 48px;
  padding: 4px 2px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  font-size: 11px;
  cursor: pointer;
}

.dv-bottom-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.dv-bottom-btn.active {
  background: rgba(255, 255, 255, 0.18);
}

.dv-bottom-icon {
  font-size: 16px;
  line-height: 1;
}

.dv-bottom-label {
  font-weight: 600;
}
</style>
