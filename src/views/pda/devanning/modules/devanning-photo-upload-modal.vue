<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NModal } from 'naive-ui';

defineOptions({ name: 'DevanningPhotoUploadModal' });

const MAX_PHOTOS = 20;

const visible = defineModel<boolean>('show', { default: false });

const emit = defineEmits<{
  confirm: [photoCount: number];
}>();

type CapturedPhoto = {
  id: string;
  label: string;
  previewUrl: string;
};

const photos = ref<CapturedPhoto[]>([]);
const previewPhoto = ref<CapturedPhoto | null>(null);
const previewVisible = ref(false);
let photoSeq = 1;

function buildMockPreviewUrl(label: string, index: number) {
  const hues = [210, 160, 30, 280, 350, 120, 15, 190];
  const hue = hues[(index - 1) % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
    <rect fill="hsl(${hue},70%,88%)" width="480" height="480"/>
    <rect x="40" y="40" width="400" height="320" rx="12" fill="hsl(${hue},55%,75%)"/>
    <circle cx="240" cy="200" r="48" fill="hsl(${hue},45%,55%)" opacity="0.35"/>
    <text x="240" y="400" text-anchor="middle" font-size="32" fill="hsl(${hue},50%,30%)" font-family="sans-serif">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const photoCount = computed(() => photos.value.length);
const canCapture = computed(() => photoCount.value < MAX_PHOTOS);
const canUpload = computed(() => photoCount.value > 0);

watch(visible, val => {
  if (!val) {
    photos.value = [];
    photoSeq = 1;
    previewPhoto.value = null;
    previewVisible.value = false;
  }
});

function mockCapture() {
  if (!canCapture.value) {
    window.$message?.warning(`最多拍摄 ${MAX_PHOTOS} 张`);
    return;
  }
  const index = photoCount.value + 1;
  photos.value.push({
    id: `photo-${photoSeq++}`,
    label: `照片 ${index}`,
    previewUrl: buildMockPreviewUrl(`照片 ${index}`, index)
  });
  window.$message?.success(`[原型] 已拍摄 ${index}/${MAX_PHOTOS}`);
}

function removePhoto(id: string) {
  photos.value = photos.value.filter(p => p.id !== id);
  if (previewPhoto.value?.id === id) {
    previewPhoto.value = null;
    previewVisible.value = false;
  }
}

function openPhotoPreview(photo: CapturedPhoto) {
  previewPhoto.value = photo;
  previewVisible.value = true;
}

function closePhotoPreview() {
  previewVisible.value = false;
}

function handleConfirm() {
  if (!canUpload.value) {
    window.$message?.warning('请先拍照');
    return;
  }
  emit('confirm', photoCount.value);
  visible.value = false;
}

function handleCancel() {
  visible.value = false;
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="拍照上传" :style="{ width: '92%', maxWidth: '320px' }">
    <p class="modal-hint">拍摄现场照片并上传留档，最多 {{ MAX_PHOTOS }} 张</p>

    <div class="photo-counter">
      <span>已拍 {{ photoCount }}/{{ MAX_PHOTOS }}</span>
      <span v-if="photoCount >= MAX_PHOTOS" class="photo-limit">已达上限</span>
    </div>

    <div class="photo-preview">
      <p v-if="!photoCount" class="photo-placeholder">点击下方按钮模拟拍照</p>
      <ul v-else class="photo-grid">
        <li v-for="photo in photos" :key="photo.id" class="photo-thumb">
          <button type="button" class="photo-thumb-btn" @click="openPhotoPreview(photo)">
            <img :src="photo.previewUrl" :alt="photo.label" class="photo-thumb-img" />
            <span class="photo-thumb-label">{{ photo.label }}</span>
          </button>
          <button
            type="button"
            class="photo-remove"
            aria-label="删除照片"
            @click.stop="removePhoto(photo.id)"
          >
            ×
          </button>
        </li>
      </ul>
    </div>

    <NButton type="primary" block size="large" class="photo-btn" :disabled="!canCapture" @click="mockCapture">
      {{ canCapture ? '模拟拍照' : '已达 20 张上限' }}
    </NButton>

    <template #footer>
      <NButton block size="large" @click="handleCancel">取消</NButton>
      <NButton block type="primary" size="large" :disabled="!canUpload" @click="handleConfirm">
        确认上传{{ photoCount ? `（${photoCount} 张）` : '' }}
      </NButton>
    </template>
  </NModal>

  <NModal
    v-model:show="previewVisible"
    preset="card"
    :title="previewPhoto?.label || '查看图片'"
    :style="{ width: '92%', maxWidth: '340px' }"
    @after-leave="previewPhoto = null"
  >
    <div v-if="previewPhoto" class="photo-viewer">
      <img :src="previewPhoto.previewUrl" :alt="previewPhoto.label" class="photo-viewer-img" />
      <p class="photo-viewer-hint">[原型] 模拟现场照片预览</p>
    </div>
    <template #footer>
      <NButton block size="large" @click="closePhotoPreview">关闭</NButton>
    </template>
  </NModal>
</template>

<style scoped>
.modal-hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
}

.photo-counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.photo-limit {
  color: #dc2626;
  font-size: 11px;
}

.photo-preview {
  min-height: 140px;
  max-height: 220px;
  margin-bottom: 12px;
  padding: 10px;
  overflow-y: auto;
  border-radius: 8px;
  background: #f3f4f6;
}

.photo-placeholder {
  margin: 0;
  padding: 40px 8px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.photo-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: #e5e7eb;
}

.photo-thumb-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.photo-thumb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-thumb-label {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 3px 4px;
  background: rgba(0, 0, 0, 0.42);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
}

.photo-viewer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-viewer-img {
  width: 100%;
  border-radius: 8px;
  background: #f3f4f6;
}

.photo-viewer-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.photo-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}

.photo-btn {
  min-height: 48px;
}
</style>
