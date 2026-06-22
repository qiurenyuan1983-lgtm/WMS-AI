<script setup lang="ts">
import type { ThemeEditorModel } from './types';

defineOptions({ name: 'ThemeColorConfig' });

const model = defineModel<ThemeEditorModel>({ required: true });

const colorFields: { key: keyof ThemeEditorModel['visual']['colors']; label: string; alpha?: boolean }[] = [
  { key: 'primary', label: '主色' },
  { key: 'secondary', label: '辅助色' },
  { key: 'background', label: '背景色' },
  { key: 'menuBg', label: '菜单色', alpha: true },
  { key: 'buttonPrimary', label: '按钮色' }
];
</script>

<template>
  <div class="color-config">
    <div class="section-title">颜色配置</div>
    <div class="color-grid">
      <div v-for="item in colorFields" :key="item.key" class="color-item">
        <div class="color-swatch" :style="{ background: model.visual.colors[item.key] }" />
        <div class="color-field">
          <div class="color-label">{{ item.label }}</div>
          <div class="color-input-row">
            <NInput
              :value="model.visual.colors[item.key]"
              size="small"
              class="hex-input"
              @update:value="(v: string) => (model.visual.colors[item.key] = v)"
            />
            <NColorPicker
              :value="model.visual.colors[item.key]"
              :show-alpha="item.alpha"
              size="small"
              @update:value="(v: string) => (model.visual.colors[item.key] = v)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2d3d;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 1200px) {
  .color-grid {
    grid-template-columns: 1fr;
  }
}

.color-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid #dcebfa;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.color-field {
  flex: 1;
  min-width: 0;
}

.color-label {
  font-size: 12px;
  color: #6b7a90;
  margin-bottom: 6px;
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hex-input {
  flex: 1;
}
</style>
