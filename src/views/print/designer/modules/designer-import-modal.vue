<script setup lang="ts">
import { ref } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { NButton, NCheckbox, NModal, NRadio, NRadioGroup, NSpace, NUpload, NUploadDragger } from 'naive-ui';
import {
  parseTemplateImportFile,
  type TemplateImportMode,
  type TemplateImportResult
} from '../utils/template-import-parser';

const props = defineProps<{
  templateType?: string;
}>();

const show = defineModel<boolean>('show', { default: false });

const emit = defineEmits<{
  apply: [payload: { result: TemplateImportResult; mode: TemplateImportMode }];
}>();

const importing = ref(false);
const keepBackground = ref(true);
const importMode = ref<TemplateImportMode>('replace');
const previewResult = ref<TemplateImportResult | null>(null);
const previewName = ref('');
const errorText = ref('');

async function handleBeforeUpload(data: { file: UploadFileInfo }) {
  const file = data.file.file;
  if (!file) return false;
  importing.value = true;
  errorText.value = '';
  previewResult.value = null;
  previewName.value = file.name;
  try {
    previewResult.value = await parseTemplateImportFile(file, {
      templateType: props.templateType,
      keepBackground: keepBackground.value
    });
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '模板识别失败';
  } finally {
    importing.value = false;
  }
  return false;
}

function handleApply() {
  if (!previewResult.value) return;
  emit('apply', { result: previewResult.value, mode: importMode.value });
  show.value = false;
  previewResult.value = null;
  previewName.value = '';
  errorText.value = '';
}

function handleClose() {
  show.value = false;
  previewResult.value = null;
  previewName.value = '';
  errorText.value = '';
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    title="上传模板 · 智能识别"
    class="w-560px"
    :mask-closable="!importing"
    @close="handleClose"
  >
    <p class="text-sm text-gray-500 mb-12px">
      上传已有模板样图或导出的 JSON 设计稿，系统将根据版式自动识别字段区、表格、二维码、签名栏等并生成可编辑组件。
    </p>

    <NUpload
      accept=".json,image/*"
      :max="1"
      :show-file-list="false"
      :disabled="importing"
      @before-upload="handleBeforeUpload"
    >
      <NUploadDragger>
        <div class="py-16px text-center">
          <div class="text-sm font-medium">点击或拖拽上传</div>
          <div class="text-xs text-gray-500 mt-6px">支持 PNG / JPG / WebP / JSON</div>
        </div>
      </NUploadDragger>
    </NUpload>

    <div class="mt-12px flex items-center justify-between">
      <NCheckbox v-model:checked="keepBackground">保留参考图作为底图（默认不打印）</NCheckbox>
    </div>

    <div v-if="importing" class="mt-12px text-sm text-primary">正在分析版式结构…</div>
    <div v-if="errorText" class="mt-12px text-sm text-error">{{ errorText }}</div>

    <div v-if="previewResult" class="import-preview mt-16px">
      <div class="text-sm font-medium mb-8px">识别结果 · {{ previewName }}</div>
      <ul class="import-preview__list">
        <li v-for="(line, idx) in previewResult.summary" :key="idx">{{ line }}</li>
      </ul>
      <div class="text-xs text-gray-500 mt-8px">
        纸张 {{ previewResult.paperSize }} ·
        {{ previewResult.orientation === 'landscape' ? '横向' : '纵向' }} ·
        共 {{ previewResult.elements.length }} 个组件
      </div>

      <div class="mt-12px">
        <div class="text-sm mb-6px">导入方式</div>
        <NRadioGroup v-model:value="importMode">
          <NSpace>
            <NRadio value="replace">替换当前画布</NRadio>
            <NRadio value="merge">合并到当前画布</NRadio>
          </NSpace>
        </NRadioGroup>
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :disabled="!previewResult || importing" @click="handleApply">
          应用到画布
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.import-preview {
  padding: 12px;
  border: 1px dashed var(--n-border-color);
  border-radius: 8px;
  background: var(--n-color-modal);
}

.import-preview__list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--n-text-color-2);
}

.import-preview__list li + li {
  margin-top: 4px;
}
</style>
