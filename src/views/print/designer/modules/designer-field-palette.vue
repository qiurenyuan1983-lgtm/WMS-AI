<script setup lang="ts">
import { NCollapse, NCollapseItem } from 'naive-ui';
import { DESIGNER_COMPONENTS, DESIGNER_FIELD_GROUPS } from '../../constants';

defineProps<{
  disabled?: boolean;
}>();

function onDragStart(e: DragEvent, label: string, kind: 'field' | 'component') {
  if (!e.dataTransfer) return;
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('application/x-print-designer', JSON.stringify({ label, kind }));
  e.dataTransfer.setData('text/plain', label);
}
</script>

<template>
  <div class="field-palette">
    <NCollapse>
      <NCollapseItem v-for="g in DESIGNER_FIELD_GROUPS" :key="g.group" :title="g.group" :name="g.group">
        <div class="field-palette__list">
          <div
            v-for="f in g.fields"
            :key="f"
            class="field-chip"
            draggable="true"
            :class="{ 'field-chip--disabled': disabled }"
            @dragstart="onDragStart($event, f, 'field')"
          >
            <span class="field-chip__handle">⋮⋮</span>
            {{ f }}
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>
    <div class="mt-12px text-sm font-medium mb-8px">组件</div>
    <div class="field-palette__components">
      <div
        v-for="c in DESIGNER_COMPONENTS"
        :key="c"
        class="field-chip field-chip--component"
        draggable="true"
        :class="{ 'field-chip--disabled': disabled }"
        @dragstart="onDragStart($event, c, 'component')"
      >
        {{ c }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-palette {
  min-height: min-content;
}

.field-palette__list,
.field-palette__components {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-palette__components {
  flex-direction: row;
  flex-wrap: wrap;
}

.field-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
  background: var(--n-color);
  cursor: grab;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-chip:hover:not(.field-chip--disabled) {
  border-color: var(--n-primary-color);
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
}

.field-chip:active:not(.field-chip--disabled) {
  cursor: grabbing;
  opacity: 0.85;
}

.field-chip--component {
  width: auto;
  flex: 0 0 auto;
}

.field-chip--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-chip__handle {
  color: #9ca3af;
  font-size: 10px;
  letter-spacing: -2px;
}
</style>
