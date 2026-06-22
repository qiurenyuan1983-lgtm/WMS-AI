<script setup lang="ts">
import type { PdaScanFeedbackType } from '@/views/pda/shared/pda-scan-feedback';

defineOptions({ name: 'PdaScanFeedbackBar' });

defineProps<{
  type: PdaScanFeedbackType;
  text: string;
}>();
</script>

<template>
  <p v-if="type && text" class="pda-scan-feedback" :class="`is-${type}`" role="status">
    {{ text }}
  </p>
</template>

<style scoped>
.pda-scan-feedback {
  margin: 0 0 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.pda-scan-feedback.is-success {
  background: #ecfdf5;
  color: #34c759;
}

.pda-scan-feedback.is-error {
  background: #fef2f2;
  color: #ff3b30;
}

.pda-scan-feedback.is-warn {
  background: #fff7e6;
  color: #ff9500;
}
</style>
