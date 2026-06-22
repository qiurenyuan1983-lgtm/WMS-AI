<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { sessionStg } from '@/utils/storage';

defineOptions({ name: 'DevanningMoreMenu' });

const emit = defineEmits<{
  photoUpload: [];
  exception: [];
}>();

const menuOpen = ref(false);
const printerConnected = ref(sessionStg.get('pdaBluetoothConnected') === 'Y');

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handlePhotoUpload() {
  closeMenu();
  emit('photoUpload');
}

function handleException() {
  closeMenu();
  emit('exception');
}

function togglePrinter() {
  printerConnected.value = !printerConnected.value;
  sessionStg.set('pdaBluetoothConnected', printerConnected.value ? 'Y' : 'N');
  window.$message?.success(printerConnected.value ? '打印机已连接' : '打印机已断开');
  closeMenu();
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.dv-more-wrap')) closeMenu();
}

onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));

defineExpose({ printerConnected });
</script>

<template>
  <div class="dv-more-wrap">
    <span v-if="printerConnected" class="dv-printer-badge" title="打印机已连接" aria-hidden="true">📶</span>
    <button
      type="button"
      class="dv-more-btn"
      :class="{ active: menuOpen }"
      aria-label="更多操作"
      @click.stop="toggleMenu"
    >
      更多
    </button>
    <div v-if="menuOpen" class="dv-more-menu" @click.stop>
      <button type="button" class="dv-more-item" @click="handlePhotoUpload">
        <span class="dv-more-icon" aria-hidden="true">📷</span>
        <span>拍照上传</span>
      </button>
      <button type="button" class="dv-more-item" @click="handleException">
        <span class="dv-more-icon" aria-hidden="true">⚠️</span>
        <span>异常问题</span>
      </button>
      <div class="dv-more-divider" />
      <button type="button" class="dv-more-item" @click="togglePrinter">
        <span class="dv-more-icon" aria-hidden="true">📶</span>
        <span>{{ printerConnected ? '断开打印机' : '连接打印机' }}</span>
        <span v-if="printerConnected" class="dv-more-on">ON</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dv-more-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.dv-printer-badge {
  font-size: 14px;
  line-height: 1;
  opacity: 0.95;
}

.dv-more-btn {
  min-height: 32px;
  padding: 4px 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dv-more-btn.active {
  background: rgba(255, 255, 255, 0.28);
}

.dv-more-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  min-width: 168px;
  padding: 6px 0;
  border-radius: 10px;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

.dv-more-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.dv-more-item:active {
  background: #f3f4f6;
}

.dv-more-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
}

.dv-more-divider {
  height: 1px;
  margin: 4px 10px;
  background: #e5e7eb;
}

.dv-more-on {
  margin-left: auto;
  padding: 1px 6px;
  border-radius: 4px;
  background: #dcfce7;
  color: #166534;
  font-size: 10px;
  font-weight: 700;
}
</style>
