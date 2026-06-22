<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NModal, NSpace, NSpin } from 'naive-ui';
import type { DesignerCanvasElement, PaperOrientation, PaperPresetKey } from '../utils/paper-size';
import { resolvePaperDimensions } from '../utils/paper-size';
import {
  buildPalletLabelPreviewHtmlAsync,
  getPreviewDisplayScale,
  getPreviewLabelPixelSize,
  openPalletLabelPreviewWindow,
  openPalletLabelTestPrintWindow
} from '../utils/preview-pallet-label';

const props = withDefaults(
  defineProps<{
    show: boolean;
    elements: DesignerCanvasElement[];
    paperSize: PaperPresetKey | string;
    orientation: PaperOrientation;
    title?: string;
    subtitle?: string;
  }>(),
  { title: '卡板贴预览', subtitle: '' }
);

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const dimensions = computed(() => resolvePaperDimensions(props.paperSize, props.orientation));

const displayScale = computed(() =>
  getPreviewDisplayScale(dimensions.value.widthMm, dimensions.value.heightMm, {
    maxWidth: 820,
    maxHeight: 580
  })
);

const labelPixelSize = computed(() =>
  getPreviewLabelPixelSize(dimensions.value.widthMm, dimensions.value.heightMm)
);

const scaledSize = computed(() => ({
  width: Math.ceil(labelPixelSize.value.widthPx * displayScale.value),
  height: Math.ceil(labelPixelSize.value.heightPx * displayScale.value)
}));

const previewHtml = ref('');
const previewLoading = ref(false);

async function loadPreviewHtml() {
  previewLoading.value = true;
  try {
    previewHtml.value = await buildPalletLabelPreviewHtmlAsync({
      elements: props.elements,
      paperSize: props.paperSize,
      orientation: props.orientation
    });
  } finally {
    previewLoading.value = false;
  }
}

watch(
  () => [props.show, props.elements, props.paperSize, props.orientation] as const,
  ([visible]) => {
    if (visible) loadPreviewHtml();
  },
  { deep: true }
);

function close() {
  emit('update:show', false);
}

function openInNewTab() {
  openPalletLabelPreviewWindow({
    elements: props.elements,
    paperSize: props.paperSize,
    orientation: props.orientation
  });
}

async function handleTestPrint() {
  if (!props.elements.length) {
    window.$message?.warning('画布为空，无法测试打印');
    return;
  }
  const ok = await openPalletLabelTestPrintWindow({
    elements: props.elements,
    paperSize: props.paperSize,
    orientation: props.orientation,
    title: props.title || '模板测试打印'
  });
  if (ok) window.$message?.success('已打开测试打印窗口');
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title"
    class="designer-preview-modal w-960px max-w-96vw"
    style="max-height: 92vh"
    :mask-closable="true"
    @update:show="emit('update:show', $event)"
  >
    <div class="preview-root">
      <p class="preview-hint">
        <template v-if="subtitle">{{ subtitle }} · </template>
        测试数据预览（{{ dimensions.widthMm }}×{{ dimensions.heightMm }} mm）
        · {{ elements.length ? `${elements.length} 个画布元素` : '默认 ANKER 高货值示例' }}
      </p>
      <div class="preview-scale">
        <NSpin :show="previewLoading">
          <div
            class="preview-scale-slot"
            :style="{ width: `${scaledSize.width}px`, height: `${scaledSize.height}px` }"
          >
            <div
              class="preview-scale-inner"
              :style="{
                width: `${labelPixelSize.widthPx}px`,
                height: `${labelPixelSize.heightPx}px`,
                transform: `scale(${displayScale})`
              }"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-if="previewHtml" v-html="previewHtml" />
            </div>
          </div>
        </NSpin>
      </div>
    </div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="close">关闭</NButton>
        <NButton @click="openInNewTab">新窗口预览</NButton>
        <NButton type="primary" @click="handleTestPrint">测试打印</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.preview-scale-slot {
  margin: 0 auto;
}

.preview-scale-inner {
  transform-origin: top left;
}
</style>

<style>
.designer-preview-modal .preview-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0 16px;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.designer-preview-modal .preview-hint {
  font-size: 13px;
  color: #6b7280;
  text-align: center;
  margin: 0;
}
.designer-preview-modal .preview-scale {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 28px 32px;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: auto;
  max-width: 100%;
  min-height: 420px;
  max-height: min(68vh, 640px);
  width: 100%;
}
.designer-preview-modal .pallet-label {
  position: relative;
  background: #fff;
  border: 2px solid #111;
  box-sizing: border-box;
  color: #111;
  overflow: hidden;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}
.designer-preview-modal .pallet-label--default {
  padding: 10mm 8mm;
  display: flex;
  flex-direction: column;
  gap: 3mm;
}
.designer-preview-modal .warehouse-title {
  font-size: 14pt;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 4mm;
  border-bottom: 1px solid #ddd;
  padding-bottom: 3mm;
}
.designer-preview-modal .field-row {
  font-size: 11pt;
  line-height: 1.45;
}
.designer-preview-modal .field-row .lbl {
  color: #374151;
}
.designer-preview-modal .field-row.pallet-no {
  font-size: 13pt;
  font-weight: 700;
  margin: 2mm 0;
}
.designer-preview-modal .qrcode-block {
  position: absolute;
  right: 8mm;
  top: 28mm;
  width: 28mm;
  height: 28mm;
}
.designer-preview-modal .alert-bar {
  margin-top: auto;
  padding: 3mm 4mm;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 10pt;
  font-weight: 600;
  text-align: center;
}
.designer-preview-modal .pallet-label--designed .el {
  position: absolute;
  box-sizing: border-box;
  line-height: 1.35;
  overflow: visible;
  white-space: nowrap;
}
.designer-preview-modal .pallet-label--designed .el .lbl {
  color: #4b5563;
}
.designer-preview-modal .pallet-label--designed .el-warehouse {
  font-weight: 700;
  font-size: 13pt !important;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 2mm;
}
.designer-preview-modal .pallet-label--designed .el-pallet-no {
  font-weight: 700;
}
.designer-preview-modal .pallet-label--designed .el-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-weight: 600;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.designer-preview-modal .qrcode-mock {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(90deg, #111 2px, transparent 2px) 0 0 / 8px 8px,
    linear-gradient(#111 2px, transparent 2px) 0 0 / 8px 8px;
  background-color: #fff;
  border: 1px solid #111;
}
.designer-preview-modal .el-qrcode {
  padding: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  white-space: normal;
}
.designer-preview-modal .el-qrcode .qrcode-img {
  width: 100%;
  height: auto;
  max-height: calc(100% - 10pt);
  object-fit: contain;
}
.designer-preview-modal .el-qrcode .qrcode-bind-label {
  font-size: 7pt;
  color: #6b7280;
}
.designer-preview-modal .el-barcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.designer-preview-modal .barcode-mock {
  width: 100%;
  height: 60%;
  background: repeating-linear-gradient(90deg, #111 0, #111 2px, transparent 2px, transparent 4px);
}
.designer-preview-modal .el-barcode span {
  font-size: 8pt;
  color: #666;
}
.designer-preview-modal .el--with-component-label {
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}
.designer-preview-modal .component-label {
  display: block;
  font-size: 0.82em;
  font-weight: 600;
  color: #374151;
  line-height: 1.2;
}
.designer-preview-modal .el-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  font-size: 10pt;
  color: #9ca3af;
  overflow: hidden;
}
.designer-preview-modal .el-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.designer-preview-modal .el-signature {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: #fff;
  border: 1px solid #d1d5db;
  overflow: hidden;
}
.designer-preview-modal .el-signature-line {
  display: block;
  width: 88%;
  border-bottom: 1px solid #9ca3af;
}
.designer-preview-modal .el-signature-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.designer-preview-modal .el-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
