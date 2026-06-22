<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import ThemeBaseForm from './theme-base-form.vue';
import ThemeColorConfig from './theme-color-config.vue';
import ThemeBackgroundConfig from './theme-background-config.vue';
import ThemeComponentConfig from './theme-component-config.vue';
import ThemeScopeConfig from './theme-scope-config.vue';
import ThemePreviewPanel from './theme-preview-panel.vue';
import ThemeActionBar from './theme-action-bar.vue';
import type { ThemeEditorModel } from './types';

defineOptions({ name: 'ThemeEditorPanel' });

const props = withDefaults(
  defineProps<{
    creating?: boolean;
    saving?: boolean;
  }>(),
  { creating: false, saving: false }
);

interface Emits {
  (e: 'preview-fullscreen'): void;
  (e: 'save-draft'): void;
  (e: 'publish'): void;
  (e: 'restore'): void;
  (e: 'version'): void;
}

defineEmits<Emits>();

const model = defineModel<ThemeEditorModel>({ required: true });
const activeTab = ref('basic');

const breadcrumb = computed(() => {
  if (props.creating) return '新建主题';
  return model.value.themeCode || model.value.themeName || '未选择';
});

watch(
  () => model.value.visual.colors.primary,
  color => {
    model.value.visual.themeColor = color;
    model.value.visual.colors.buttonPrimary = color;
    model.value.visual.menu.highlightColor = color;
    model.value.visual.colors.selected = color;
  }
);
</script>

<template>
  <div class="theme-editor-panel">
    <div class="editor-header">
      <div class="header-main">
        <div class="editor-breadcrumb">
          <span class="crumb-muted">主题配置管理</span>
          <span class="crumb-sep">/</span>
          <span class="crumb-active">{{ breadcrumb }}</span>
          <NTag v-if="props.creating" size="small" type="info" class="ml-8px">新建</NTag>
        </div>
        <div class="editor-title">主题编辑 / 实时预览</div>
      </div>
      <NButton size="small" class="forest-glass-btn" @click="$emit('preview-fullscreen')">
        <template #icon>
          <icon-material-symbols-fullscreen class="text-icon" />
        </template>
        预览全屏
      </NButton>
    </div>

    <NTabs v-model:value="activeTab" type="line" animated size="small" class="editor-tabs">
      <NTabPane name="basic" tab="基础信息">
        <div class="tab-scroll">
          <ThemeBaseForm v-model="model" />
        </div>
      </NTabPane>
      <NTabPane name="colors" tab="颜色配置">
        <div class="tab-scroll">
          <ThemeColorConfig v-model="model" />
        </div>
      </NTabPane>
      <NTabPane name="background" tab="背景配置">
        <div class="tab-scroll">
          <ThemeBackgroundConfig v-model="model" />
        </div>
      </NTabPane>
      <NTabPane name="components" tab="菜单与组件配置">
        <div class="tab-scroll">
          <ThemeComponentConfig v-model="model" />
        </div>
      </NTabPane>
      <NTabPane name="scope" tab="应用范围">
        <div class="tab-scroll">
          <ThemeScopeConfig v-model="model" />
        </div>
      </NTabPane>
    </NTabs>

    <div class="editor-preview-area">
      <ThemePreviewPanel :visual="model.visual" />
    </div>

    <ThemeActionBar
      :saving="saving"
      @save-draft="$emit('save-draft')"
      @publish="$emit('publish')"
      @restore="$emit('restore')"
      @version="$emit('version')"
    />
  </div>
</template>

<style scoped lang="scss">
.theme-editor-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 12px 32px rgba(24, 144, 255, 0.08);
  border-radius: 14px;
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.editor-breadcrumb {
  font-size: 12px;
  line-height: 1.5;
}

.crumb-muted {
  color: #6b7a90;
}

.crumb-sep {
  margin: 0 6px;
  color: #b8c9dc;
}

.crumb-active {
  color: #1890ff;
  font-weight: 500;
}

.editor-title {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.editor-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.n-tabs-nav) {
    flex-shrink: 0;
  }

  :deep(.n-tab-pane) {
    padding-top: 12px;
  }

  :deep(.n-tabs-pane-wrapper) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.n-tabs-tab--active) {
    color: #1890ff;
    font-weight: 600;
  }

  :deep(.n-tabs-bar) {
    background-color: #1890ff;
  }
}

.tab-scroll {
  max-height: min(320px, 36vh);
  overflow: auto;
  padding-right: 4px;
}

.editor-preview-area {
  flex-shrink: 0;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dcebfa;
}
</style>
