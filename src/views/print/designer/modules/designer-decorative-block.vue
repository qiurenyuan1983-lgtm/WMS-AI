<script setup lang="ts">
import { computed } from 'vue';
import type { DesignerCanvasElement } from '../utils/paper-size';
import {
  getDateComponentDisplay,
  getDynamicFieldDisplay,
  getNumberSequenceLines,
  getPageNumberDisplay,
  isDynamicFieldComponent,
  isNumberSequenceComponent
} from '../utils/component-registry';

const props = defineProps<{
  element: DesignerCanvasElement;
}>();

const isLineH = computed(() => props.element.label === '横线');
const isLineV = computed(() => props.element.label === '竖线');
const isBox = computed(() => props.element.label === '方框');
const isPage = computed(() => props.element.label === '页码');
const isDate = computed(() => props.element.label === '日期');
const isDynamic = computed(() => isDynamicFieldComponent(props.element));
const isNumberSeq = computed(() => isNumberSequenceComponent(props.element));
const numberLines = computed(() => (isNumberSeq.value ? getNumberSequenceLines(props.element) : []));
</script>

<template>
  <div
    class="deco-block"
    :class="{
      'deco-block--line-h': isLineH,
      'deco-block--line-v': isLineV,
      'deco-block--box': isBox,
      'deco-block--page': isPage,
      'deco-block--date': isDate,
      'deco-block--dynamic': isDynamic,
      'deco-block--number-seq': isNumberSeq
    }"
  >
    <div v-if="isLineH" class="deco-line-h" />
    <div v-else-if="isLineV" class="deco-line-v" />
    <div v-else-if="isBox" class="deco-box-frame" />
    <span v-else-if="isPage" class="deco-page-text">{{ getPageNumberDisplay() }}</span>
    <span v-else-if="isDate" class="deco-date-text">{{ getDateComponentDisplay(element) }}</span>
    <span v-else-if="isDynamic" class="deco-dynamic-text">{{ getDynamicFieldDisplay(element) }}</span>
    <div v-else-if="isNumberSeq" class="deco-number-seq">
      <div v-for="line in numberLines" :key="line" class="deco-number-seq__line">{{ line }}</div>
    </div>
  </div>
</template>

<style scoped>
.deco-block {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  pointer-events: none;
}

.deco-line-h {
  width: 100%;
  height: 0;
  border-top: 1px solid #374151;
}

.deco-line-v {
  width: 0;
  height: 100%;
  border-left: 1px solid #374151;
}

.deco-box-frame {
  width: 100%;
  height: 100%;
  border: 1px solid #374151;
  border-radius: 2px;
  box-sizing: border-box;
}

.deco-page-text,
.deco-date-text,
.deco-dynamic-text {
  font-size: 0.92em;
  color: inherit;
  white-space: nowrap;
}

.deco-dynamic-text {
  font-family: ui-monospace, monospace;
  color: #2563eb;
}

.deco-block--number-seq {
  align-items: stretch;
  justify-content: flex-start;
}

.deco-number-seq {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  line-height: 1.35;
  font-variant-numeric: tabular-nums;
}

.deco-number-seq__line {
  flex: 0 0 auto;
  text-align: center;
}
</style>
