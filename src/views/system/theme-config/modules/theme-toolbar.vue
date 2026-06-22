<script setup lang="ts">
defineOptions({ name: 'ThemeToolbar' });

interface Emits {
  (e: 'add'): void;
  (e: 'import'): void;
  (e: 'export'): void;
  (e: 'set-default'): void;
  (e: 'batch-enable'): void;
}

defineEmits<Emits>();
</script>

<template>
  <div class="theme-toolbar">
    <div>
      <div class="forest-page-title">
        <span class="forest-icon-badge">
          <icon-material-symbols-palette-outline />
        </span>
        主题配置管理
      </div>
      <div class="forest-page-desc">统一配置登录页、后台框架、门户与 PDA 等视觉主题（不含操作数据看板）</div>
    </div>
    <div class="toolbar-actions">
      <NButton type="primary" class="forest-primary-btn" @click="$emit('add')">
        <template #icon>
          <icon-material-symbols-add class="text-icon" />
        </template>
        新增主题
      </NButton>
      <NButton class="forest-glass-btn" @click="$emit('import')">导入主题</NButton>
      <NButton class="forest-glass-btn" @click="$emit('export')">导出主题</NButton>
      <NButton class="forest-glass-btn" @click="$emit('set-default')">设置默认</NButton>
      <NButton class="forest-glass-btn" @click="$emit('batch-enable')">批量启用</NButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.theme-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
