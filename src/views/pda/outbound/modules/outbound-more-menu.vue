<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

defineOptions({ name: 'OutboundMoreMenu' });

const emit = defineEmits<{
  photoUpload: [];
  exception: [];
}>();

const menuOpen = ref(false);

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

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.ob-more-wrap')) closeMenu();
}

onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));
</script>

<template>
  <div class="ob-more-wrap">
    <button
      type="button"
      class="ob-more-btn"
      :class="{ active: menuOpen }"
      aria-label="更多操作"
      @click.stop="toggleMenu"
    >
      更多
    </button>
    <div v-if="menuOpen" class="ob-more-menu" @click.stop>
      <button type="button" class="ob-more-item" @click="handlePhotoUpload">
        <span class="ob-more-icon" aria-hidden="true">📷</span>
        <span>拍照上传</span>
      </button>
      <button type="button" class="ob-more-item" @click="handleException">
        <span class="ob-more-icon" aria-hidden="true">⚠️</span>
        <span>异常反馈</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ob-more-wrap {
  position: relative;
  flex-shrink: 0;
}

.ob-more-btn {
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

.ob-more-btn.active {
  background: rgba(255, 255, 255, 0.28);
}

.ob-more-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  min-width: 148px;
  padding: 6px 0;
  border-radius: 10px;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

.ob-more-item {
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

.ob-more-item:active {
  background: #f3f4f6;
}

.ob-more-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
}
</style>
