<script setup lang="ts">
import type { ThemeEditorModel } from './types';

defineOptions({ name: 'ThemeBackgroundConfig' });

const model = defineModel<ThemeEditorModel>({ required: true });
</script>

<template>
  <div class="bg-config">
    <div class="section-title">背景配置</div>
    <NForm label-placement="left" label-width="96" size="small">
      <NFormItem label="背景类型">
        <NSelect
          v-model:value="model.visual.background.type"
          :options="[
            { label: '渐变', value: 'GRADIENT' },
            { label: '纯色', value: 'SOLID' },
            { label: '图片', value: 'IMAGE' }
          ]"
          class="w-200px"
        />
      </NFormItem>
      <NFormItem label="透明度">
        <div class="slider-row">
          <NSlider v-model:value="model.visual.background.opacity" :min="0" :max="100" class="flex-1" />
          <span class="slider-value">{{ model.visual.background.opacity }}%</span>
        </div>
      </NFormItem>
      <NFormItem label="毛玻璃效果">
        <NSwitch v-model:value="model.visual.basic.glassEffect" />
      </NFormItem>
      <NFormItem label="背景颜色">
        <NColorPicker v-model:value="model.visual.background.color" />
      </NFormItem>
    </NForm>
  </div>
</template>

<style scoped lang="scss">
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 360px;
}

.slider-value {
  font-size: 13px;
  color: #1890ff;
  min-width: 40px;
}
</style>
