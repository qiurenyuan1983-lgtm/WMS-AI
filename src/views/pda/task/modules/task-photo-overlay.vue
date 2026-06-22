<script setup lang="ts">
import { ref } from 'vue';
import { NButton } from 'naive-ui';

defineOptions({ name: 'TaskPhotoOverlay' });

const visible = defineModel<boolean>('show', { default: false });

const emit = defineEmits<{
  confirm: [];
}>();

const ready = ref(false);

function mockUpload() {
  ready.value = true;
  window.$message?.success('[原型] 照片已拍摄');
}

function handleConfirm() {
  if (!ready.value) {
    window.$message?.warning('请先拍照');
    return;
  }
  emit('confirm');
  visible.value = false;
  ready.value = false;
}

function handleCancel() {
  visible.value = false;
  ready.value = false;
}
</script>

<template>
  <div v-if="visible" class="photo-overlay">
    <div class="photo-dialog">
      <h3 class="photo-title">拍照留证</h3>
      <div class="photo-preview">
        <span v-if="ready" class="photo-done">✓ 照片已就绪</span>
        <span v-else class="photo-placeholder">点击下方按钮模拟拍照</span>
      </div>
      <NButton type="primary" block size="large" class="photo-btn" @click="mockUpload">
        {{ ready ? '重新拍照' : '模拟拍照' }}
      </NButton>
      <div class="photo-actions">
        <NButton block size="large" @click="handleCancel">取消</NButton>
        <NButton block type="primary" size="large" :disabled="!ready" @click="handleConfirm">确认</NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 16px;
}

.photo-dialog {
  width: 100%;
  max-width: 300px;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  color: #1f2937;
}

.photo-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
}

.photo-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #f3f4f6;
  font-size: 13px;
  color: #6b7280;
}

.photo-done {
  color: #34c759;
  font-weight: 600;
}

.photo-btn {
  height: 48px;
  margin-bottom: 10px;
}

.photo-actions {
  display: flex;
  gap: 8px;
}
</style>
