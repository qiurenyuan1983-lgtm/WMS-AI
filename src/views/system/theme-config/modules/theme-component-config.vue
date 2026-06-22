<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeEditorModel } from './types';

defineOptions({ name: 'ThemeComponentConfig' });

const model = defineModel<ThemeEditorModel>({ required: true });

const buttonRadiusPx = computed({
  get: () => {
    const map: Record<string, number> = { SMALL: 4, MEDIUM: 8, LARGE: 12 };
    return map[model.value.visual.components.buttonRadius] ?? 8;
  },
  set: (v: number) => {
    if (v <= 5) model.value.visual.components.buttonRadius = 'SMALL';
    else if (v <= 9) model.value.visual.components.buttonRadius = 'MEDIUM';
    else model.value.visual.components.buttonRadius = 'LARGE';
  }
});
</script>

<template>
  <div class="component-config">
    <div class="section-title">菜单与组件配置</div>
    <NForm label-placement="left" label-width="110" size="small">
      <NFormItem label="菜单样式">
        <NSelect
          v-model:value="model.visual.basic.themeStyle"
          :options="[
            { label: '水晶玻璃', value: 'GLASS' },
            { label: '简约', value: 'MINIMAL' },
            { label: '科技', value: 'TECH' }
          ]"
          class="w-200px"
        />
      </NFormItem>
      <NFormItem label="卡片样式">
        <NSelect
          v-model:value="model.visual.components.cardBg"
          :options="[
            { label: '玻璃卡片', value: 'GLASS' },
            { label: '白色', value: 'WHITE' },
            { label: '透明', value: 'TRANSPARENT' }
          ]"
          class="w-200px"
        />
      </NFormItem>
      <NFormItem label="表格表头颜色">
        <NColorPicker v-model:value="model.visual.colors.tableHeader" size="small" />
      </NFormItem>
      <NFormItem label="按钮圆角">
        <div class="slider-row">
          <NSlider v-model:value="buttonRadiusPx" :min="0" :max="16" :step="1" class="flex-1" />
          <span class="slider-value">{{ buttonRadiusPx }}px</span>
        </div>
      </NFormItem>
      <NFormItem label="弹窗样式">
        <NSelect
          v-model:value="model.visual.components.modalAnimation"
          :options="[
            { label: '居中弹窗', value: 'FADE' },
            { label: '缩放弹窗', value: 'ZOOM' },
            { label: '滑入弹窗', value: 'SLIDE' }
          ]"
          class="w-200px"
        />
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
  max-width: 360px;
}

.slider-value {
  font-size: 13px;
  color: #1890ff;
  min-width: 36px;
}
</style>
