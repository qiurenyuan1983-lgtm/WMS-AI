<script setup lang="ts">
import type { ThemeEditorModel } from './types';

defineOptions({ name: 'ThemeScopeConfig' });

const model = defineModel<ThemeEditorModel>({ required: true });
</script>

<template>
  <div class="scope-config">
    <div class="section-title">应用范围</div>
    <div class="scope-grid">
      <NCheckbox v-model:checked="model.visual.scope.wholeSystem">全系统</NCheckbox>
      <NCheckbox v-model:checked="model.visual.scope.warehouseSpecific">指定仓库</NCheckbox>
      <NCheckbox v-model:checked="model.visual.scope.accountSpecific">指定账号</NCheckbox>
      <NCheckbox v-model:checked="model.visual.scope.supplierPortal">供应商门户</NCheckbox>
      <NCheckbox v-model:checked="model.visual.scope.pda">PDA</NCheckbox>
      <NCheckbox v-model:checked="model.visual.scope.driverApp">司机端</NCheckbox>
    </div>
  </div>
</template>

<style scoped lang="scss">
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.scope-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 24px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #dcebfa;
}

@media (max-width: 1366px) {
  .scope-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
