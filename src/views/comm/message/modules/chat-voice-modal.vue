<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { NButton, NModal, NSpace } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  (e: 'confirm', payload: { durationSec: number; label: string }): void;
}>();

const recording = ref(false);
const durationSec = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startRecord() {
  if (recording.value) return;
  recording.value = true;
  durationSec.value = 0;
  timer = setInterval(() => {
    durationSec.value += 1;
    if (durationSec.value >= 60) stopRecord();
  }, 1000);
}

function stopRecord() {
  recording.value = false;
  clearTimer();
}

function reset() {
  stopRecord();
  durationSec.value = 0;
}

function handleSend() {
  if (durationSec.value <= 0) {
    window.$message?.warning('请先录制语音');
    return;
  }
  emit('confirm', {
    durationSec: durationSec.value,
    label: `语音 ${durationSec.value}"`
  });
  visible.value = false;
  reset();
}

watch(visible, open => {
  if (!open) reset();
});

onUnmounted(() => clearTimer());
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="发送语音" class="w-400px" :to="POPUP_TO_BODY">
    <div class="voice-panel">
      <div class="voice-wave" :class="{ 'voice-wave--active': recording }">
        <span v-for="i in 12" :key="i" class="voice-bar" />
      </div>
      <div class="voice-time">{{ durationSec }} 秒</div>
      <p class="voice-tip">{{ recording ? '正在录音，点击停止结束录制' : '点击开始录音，最长 60 秒' }}</p>
      <NSpace justify="center">
        <NButton v-if="!recording" type="primary" @click="startRecord">开始录音</NButton>
        <NButton v-else type="warning" @click="stopRecord">停止录音</NButton>
        <NButton :disabled="recording" @click="reset">重录</NButton>
      </NSpace>
    </div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :disabled="durationSec <= 0" @click="handleSend">发送语音</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.voice-panel {
  text-align: center;
  padding: 12px 0 4px;
}

.voice-wave {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 48px;
  margin-bottom: 12px;
}

.voice-bar {
  width: 4px;
  height: 12px;
  border-radius: 2px;
  background: #d1d5db;
}

.voice-wave--active .voice-bar {
  animation: voice-pulse 0.8s ease-in-out infinite alternate;
  background: #2563eb;
}

.voice-wave--active .voice-bar:nth-child(odd) {
  animation-delay: 0.15s;
}

@keyframes voice-pulse {
  from {
    height: 10px;
  }
  to {
    height: 36px;
  }
}

.voice-time {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.voice-tip {
  margin: 8px 0 16px;
  font-size: 12px;
  color: #6b7280;
}
</style>
