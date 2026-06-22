<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NModal, NSpace, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import type { ParsedFileMessage } from '../utils/file-message';
import { downloadParsedFile } from '../utils/file-message';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  file: ParsedFileMessage | null;
}>();

const previewTitle = computed(() => {
  if (!props.file) return '文件预览';
  if (props.file.previewType === 'pdf') return 'PDF 文档预览';
  if (props.file.previewType === 'image') return '图片预览';
  if (props.file.previewType === 'doc') return '办公文档预览';
  return '文件预览';
});

function handleDownload() {
  if (!props.file) return;
  downloadParsedFile(props.file);
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="file?.fileName || '文件预览'"
    class="w-640px"
    :to="POPUP_TO_BODY"
    :mask-closable="true"
  >
    <template v-if="file">
      <div class="file-meta">
        <NTag size="small" type="info">{{ previewTitle }}</NTag>
        <span v-if="file.sizeLabel" class="file-meta-text">{{ file.sizeLabel }}</span>
        <span v-if="file.orderNo" class="file-meta-text">订单 {{ file.orderNo }}</span>
        <span v-if="file.source" class="file-meta-text">{{ file.source }}</span>
      </div>

      <div class="preview-shell" :class="`preview-shell--${file.previewType}`">
        <template v-if="file.previewType === 'pdf'">
          <div class="preview-page">
            <div class="preview-page-title">{{ file.fileName }}</div>
            <div class="preview-page-line">审批单编号：APPR-{{ file.orderNo || 'N/A' }}</div>
            <div class="preview-page-line">费用类型：拆柜费用</div>
            <div class="preview-page-line">审批状态：已通过</div>
            <div class="preview-page-line">生成时间：2026-06-04 16:20</div>
            <div class="preview-page-block">[原型] PDF 页面预览占位</div>
          </div>
        </template>
        <template v-else-if="file.previewType === 'image'">
          <div class="preview-image">
            <div class="preview-image-icon">🖼</div>
            <div class="preview-image-name">{{ file.fileName }}</div>
            <div class="preview-image-hint">[原型] 图片预览占位</div>
          </div>
        </template>
        <template v-else-if="file.previewType === 'doc'">
          <div class="preview-doc">
            <div class="preview-doc-icon">📄</div>
            <div class="preview-doc-name">{{ file.fileName }}</div>
            <div class="preview-doc-hint">[原型] 办公文档在线预览占位</div>
          </div>
        </template>
        <template v-else>
          <div class="preview-other">
            <div class="preview-other-icon">📎</div>
            <div>{{ file.fileName }}</div>
            <div class="preview-other-hint">该文件类型暂不支持在线预览，请下载后查看</div>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">关闭</NButton>
        <NButton type="primary" :disabled="!file" @click="handleDownload">下载文件</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.file-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.file-meta-text {
  font-size: 12px;
  color: #6b7280;
}

.preview-shell {
  min-height: 360px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  overflow: hidden;
}

.preview-shell--pdf {
  background: #525659;
  padding: 16px;
}

.preview-page {
  max-width: 520px;
  margin: 0 auto;
  background: #fff;
  border-radius: 4px;
  padding: 24px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
}

.preview-page-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
}

.preview-page-line {
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
}

.preview-page-block {
  margin-top: 20px;
  padding: 40px 16px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.preview-image,
.preview-doc,
.preview-other {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #374151;
}

.preview-image-icon,
.preview-doc-icon,
.preview-other-icon {
  font-size: 48px;
}

.preview-image-name,
.preview-doc-name {
  font-size: 15px;
  font-weight: 600;
}

.preview-image-hint,
.preview-doc-hint,
.preview-other-hint {
  font-size: 12px;
  color: #9ca3af;
}
</style>
