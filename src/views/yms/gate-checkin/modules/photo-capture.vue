<script setup lang="ts">
interface PhotoItem {
  previewUrl: string;
  ossUrl: string | null;
  uploading: boolean;
}

const props = defineProps<{
  photos: PhotoItem[];
  label?: string;
  tip?: string;
}>();

const emit = defineEmits<{
  (e: 'add', files: FileList): void;
  (e: 'remove', idx: number): void;
}>();

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) emit('add', input.files);
  input.value = '';
}
</script>

<template>
  <div class="mt-12px">
    <div class="text-13px text-gray-400 mb-8px">{{ label ?? '现场拍照（可选）' }}</div>
    <div class="flex flex-wrap gap-8px">
      <!-- 已选照片 -->
      <div
        v-for="(photo, idx) in photos"
        :key="idx"
        class="relative w-80px h-80px rounded-8px overflow-hidden bg-gray-100 flex-shrink-0"
      >
        <img :src="photo.previewUrl" class="w-full h-full object-cover" />
        <!-- 上传中 -->
        <div
          v-if="photo.uploading"
          class="absolute inset-0 bg-black/40 flex items-center justify-center"
        >
          <div class="i-mdi:loading animate-spin text-white text-20px" />
        </div>
        <!-- 删除 -->
        <button
          v-else
          class="absolute top-2px right-2px w-18px h-18px bg-black/50 rounded-full flex items-center justify-center text-white text-10px leading-none"
          type="button"
          @click="emit('remove', idx)"
        >
          ✕
        </button>
      </div>

      <!-- 添加按钮（最多6张） -->
      <label
        v-if="photos.length < 6"
        class="w-80px h-80px rounded-8px border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2px cursor-pointer bg-white hover:bg-gray-50 flex-shrink-0"
      >
        <div class="i-mdi:camera-plus-outline text-24px text-gray-400" />
        <span class="text-11px text-gray-400">拍照</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          class="hidden"
          @change="onFileChange"
        />
      </label>
    </div>
    <p v-if="tip" class="text-11px text-gray-400 mt-4px">{{ tip }}</p>
  </div>
</template>
