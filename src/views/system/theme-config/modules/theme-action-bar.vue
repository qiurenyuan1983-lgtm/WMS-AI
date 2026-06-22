<script setup lang="ts">
defineOptions({ name: 'ThemeActionBar' });

interface Props {
  saving?: boolean;
}

interface Emits {
  (e: 'save-draft'): void;
  (e: 'publish'): void;
  (e: 'restore'): void;
  (e: 'version'): void;
}

withDefaults(defineProps<Props>(), { saving: false });
defineEmits<Emits>();
</script>

<template>
  <div class="theme-action-bar">
    <NButton class="action-btn glass" :loading="saving" @click="$emit('save-draft')">保存草稿</NButton>
    <NButton type="primary" class="action-btn publish" :loading="saving" @click="$emit('publish')">
      <template #icon>
        <icon-material-symbols-send class="text-icon" />
      </template>
      发布主题
    </NButton>
    <NButton class="action-btn glass" @click="$emit('restore')">恢复默认</NButton>
    <NButton class="action-btn glass" @click="$emit('version')">
      <template #icon>
        <icon-material-symbols-history class="text-icon" />
      </template>
      版本记录
    </NButton>
  </div>
</template>

<style scoped lang="scss">
.theme-action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
  padding-top: 14px;
  margin-top: 12px;
  border-top: 1px solid #dcebfa;
  flex-shrink: 0;
}

.action-btn {
  height: 44px;
  min-width: 112px;
  border-radius: 10px;
  font-size: 14px;

  &.glass {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #dcebfa;
    color: #1f2d3d;
  }

  &.publish {
    min-width: 136px;
    padding: 0 20px;
    font-weight: 600;
    background: linear-gradient(135deg, #1890ff 0%, #58b8ff 100%) !important;
    border: none !important;
    box-shadow: 0 8px 20px rgba(24, 144, 255, 0.28);
  }
}
</style>
