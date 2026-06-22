<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NModal, NSpace } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  (e: 'confirm', payload: { fileName: string }): void;
}>();

const capturing = ref(false);
const previewReady = ref(false);
const previewName = ref('');

function startCapture() {
  capturing.value = true;
  window.setTimeout(() => {
    capturing.value = false;
    previewReady.value = true;
    previewName.value = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.png`;
  }, 600);
}

function handleSend() {
  if (!previewReady.value) {
    window.$message?.warning('请先截取屏幕');
    return;
  }
  emit('confirm', { fileName: previewName.value });
  visible.value = false;
  previewReady.value = false;
  previewName.value = '';
}

watch(visible, open => {
  if (!open) {
    previewReady.value = false;
    previewName.value = '';
    capturing.value = false;
  }
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="截图发送" class="w-520px" :to="POPUP_TO_BODY">
    <div class="screenshot-preview" :class="{ 'screenshot-preview--loading': capturing }">
      <template v-if="previewReady">
        <div class="screenshot-mock">
          <div class="screenshot-mock-title">聊天区域截图预览</div>
          <div class="screenshot-mock-body">已截取当前沟通窗口可见区域</div>
        </div>
        <div class="mt-8px text-12px text-#6b7280">{{ previewName }}</div>
      </template>
      <template v-else-if="capturing">
        <div class="text-#2563eb">正在截取屏幕…</div>
      </template>
      <template v-else>
        <div class="text-#6b7280 text-13px">点击下方按钮截取当前页面聊天区域</div>
      </template>
    </div>
    <NSpace class="mt-12px">
      <NButton :loading="capturing" @click="startCapture">截取屏幕</NButton>
      <NButton v-if="previewReady" @click="previewReady = false">重新截取</NButton>
    </NSpace>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :disabled="!previewReady" @click="handleSend">发送截图</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.screenshot-preview {
  min-height: 180px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #fafafa;
}

.screenshot-preview--loading {
  border-color: #2563eb;
  background: #eff6ff;
}

.screenshot-mock {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.screenshot-mock-title {
  padding: 8px 12px;
  background: #f3f4f6;
  font-size: 12px;
  font-weight: 600;
}

.screenshot-mock-body {
  padding: 24px 12px;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
}
</style>
