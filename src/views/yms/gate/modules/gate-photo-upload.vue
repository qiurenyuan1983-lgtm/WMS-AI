<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';
import { fetchUploadFile } from '@/service/api/system/oss';

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  max?: number;
}>(), { max: 3 });

const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>();

const fileList = ref<UploadFileInfo[]>([]);

function parseUrls(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

watch(() => props.modelValue, val => {
  const urls = parseUrls(val);
  fileList.value = urls.map((url, i) => ({ id: String(i), name: `photo-${i + 1}`, status: 'finished', url }));
}, { immediate: true });

function emitUrls(urls: string[]) {
  emit('update:modelValue', urls.length ? JSON.stringify(urls) : null);
}

async function customRequest({ file, onFinish, onError }: UploadCustomRequestOptions) {
  if (!file.file) {
    onError();
    return;
  }
  const { data, error } = await fetchUploadFile(file.file);
  if (error || !data?.url) {
    onError();
    return;
  }
  file.url = data.url;
  const urls = [...parseUrls(props.modelValue), data.url];
  emitUrls(urls);
  onFinish();
}

function handleRemove({ file }: { file: UploadFileInfo }) {
  const urls = parseUrls(props.modelValue).filter(u => u !== file.url);
  emitUrls(urls);
}
</script>

<template>
  <NUpload
    v-model:file-list="fileList"
    :max="max"
    list-type="image-card"
    accept="image/*"
    :custom-request="customRequest"
    @remove="handleRemove"
  >
    上传照片
  </NUpload>
</template>
