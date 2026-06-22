<script setup lang="ts">
import { ref, watch } from 'vue';
import { generateQrcodeDataUrl, resolveQrcodeContent } from '../utils/qrcode-render';
import type { DesignerCanvasElement } from '../utils/paper-size';

const props = defineProps<{
  element: DesignerCanvasElement;
  /** 设计态 false 显示 {字段}，预览 true 填充测试数据 */
  useSampleData?: boolean;
  /** 画布缩放 */
  zoom?: number;
}>();

const dataUrl = ref('');
const loading = ref(false);

async function refreshQr() {
  const showLabel = props.element.showBindFieldLabel !== false;
  const size = props.element.width * (props.zoom ?? 1);
  const labelHeight = showLabel && !props.useSampleData ? 14 : showLabel ? 12 : 0;
  const qrSize = Math.max(40, size - labelHeight - 4);
  const content = resolveQrcodeContent(props.element, props.useSampleData ?? false);

  loading.value = true;
  try {
    dataUrl.value = await generateQrcodeDataUrl(content, qrSize);
  } catch {
    dataUrl.value = '';
  } finally {
    loading.value = false;
  }
}

watch(
  () => [
    props.element.bindField,
    props.element.placeholder,
    props.element.width,
    props.element.height,
    props.element.showBindFieldLabel,
    props.useSampleData,
    props.zoom
  ],
  () => refreshQr(),
  { immediate: true }
);

function bindFieldLabel() {
  return props.element.bindField || '卡板号';
}
</script>

<template>
  <div class="qrcode-block-root" :class="{ 'qrcode-block-root--preview': useSampleData }">
    <img v-if="dataUrl" class="qrcode-img" :src="dataUrl" alt="二维码" draggable="false" />
    <div v-else-if="loading" class="qrcode-loading">生成中…</div>
    <div v-else class="qrcode-fallback" />
    <span
      v-if="element.showBindFieldLabel !== false"
      class="qrcode-field-label"
      :title="useSampleData ? resolveQrcodeContent(element, true) : undefined"
    >
      {{ bindFieldLabel() }}
    </span>
  </div>
</template>

<style scoped>
.qrcode-block-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 2px;
  pointer-events: none;
}

.qrcode-img {
  width: 100%;
  height: auto;
  max-height: calc(100% - 14px);
  object-fit: contain;
  display: block;
}

.qrcode-field-label {
  font-size: 0.65em;
  color: #6b7280;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.qrcode-block-root--preview .qrcode-field-label {
  font-size: 7pt;
}

.qrcode-loading,
.qrcode-fallback {
  width: 100%;
  aspect-ratio: 1;
  background:
    linear-gradient(90deg, #111 2px, transparent 2px) 0 0 / 8px 8px,
    linear-gradient(#111 2px, transparent 2px) 0 0 / 8px 8px;
  background-color: #fff;
  border: 1px solid #d1d5db;
}

.qrcode-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65em;
  color: #9ca3af;
  background: #f9fafb;
}
</style>
