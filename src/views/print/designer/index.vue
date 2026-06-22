<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NButton,
  NCard,
  NFormItem,
  NSelect,
  NSlider,
  NSpace,
  NTag,
  useDialog
} from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import {
  fetchGetPrintTemplate,
  fetchPublishPrintTemplate,
  fetchSubmitPrintTemplateTest
} from '@/service/api/print';
import { useAuthStore } from '@/store/modules/auth';
import {
  DESIGNER_ACTIONS,
  DESIGNER_COMPONENTS,
  INVOICE_TEMPLATE_CATEGORIES,
  TEMPLATE_VERSION_LIFECYCLE
} from '../constants';
import DesignerCanvas from './modules/designer-canvas.vue';
import DesignerElementProps from './modules/designer-element-props.vue';
import DesignerFieldPalette from './modules/designer-field-palette.vue';
import DesignerImportModal from './modules/designer-import-modal.vue';
import DesignerPreviewModal from './modules/designer-preview-modal.vue';
import type { DesignerCanvasElement, PaperOrientation, PaperPresetKey } from './utils/paper-size';
import {
  createCanvasElement,
  DESIGNER_PAPER_PRESETS,
  getDefaultElementsForPalletLabel,
  resolvePaperDimensions
} from './utils/paper-size';
import { getDefaultElementsForBol } from './utils/bol-template-default';
import { estimateElementSize, isImageComponent } from './utils/field-display';
import { compressImageDataUrlForElement } from './utils/image-compress';
import {
  addTableCol,
  addTableRow,
  cellItemFromDrop,
  ensureTableConfig,
  getRangeAnchor,
  normalizeTableConfig,
  setCellSpan,
  type TableCellRange,
  type TableConfig
} from './utils/table-utils';
import {
  applyImportedElements,
  type TemplateImportMode,
  type TemplateImportResult
} from './utils/template-import-parser';

defineOptions({ name: 'PrintDesigner' });

const route = useRoute();
const router = useRouter();
const dialog = useDialog();
const authStore = useAuthStore();
const { record: typeRecord } = useDict('print_template_type');
const { record: invoiceSubtypeRecord } = useDict('print_invoice_subtype');

const templateId = computed(() => route.query.templateId as string | undefined);
const templateType = computed(() => route.query.type as string);
const invoiceSubtype = computed(() => route.query.invoiceSubtype as Api.Print.InvoiceSubtype | undefined);

const paperSize = ref<PaperPresetKey>('100x150mm');
const orientation = ref<PaperOrientation>('portrait');
const zoom = ref(1);
const versionStatus = ref<Api.Print.TemplateStatus>('draft');
const MAX_SELECTED = 2;

const canvasElements = ref<DesignerCanvasElement[]>([]);
const selectedIds = ref<string[]>([]);
const previewVisible = ref(false);
const importVisible = ref(false);
const publishing = ref(false);
const submittingTest = ref(false);
const templateVersion = ref(1);
const tableSelectedRange = ref<{ tableId: string } & TableCellRange | null>(null);

const paperOptions = DESIGNER_PAPER_PRESETS.map(p => ({ label: p.label, value: p.key }));

const invoiceCategory = computed(() =>
  INVOICE_TEMPLATE_CATEGORIES.find(c => c.key === invoiceSubtype.value)
);

const selectedElements = computed(() =>
  selectedIds.value
    .map(id => canvasElements.value.find(e => e.id === id))
    .filter((e): e is DesignerCanvasElement => Boolean(e))
);

const activeSelectedId = computed(() => selectedIds.value[selectedIds.value.length - 1] ?? null);

const dimensions = computed(() => resolvePaperDimensions(paperSize.value, orientation.value));

function protoMsg(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function goBack() {
  router.back();
}

function getDesignPayload() {
  return {
    elements: JSON.parse(JSON.stringify(canvasElements.value)),
    paperSize: paperSize.value,
    orientation: orientation.value
  };
}

async function saveDraft() {
  if (!templateId.value) {
    window.$message?.warning('请从模板列表进入设计器后再保存');
    return;
  }
  const { savePrintTemplateDesign } = await import('@/mock/data/print-center');
  savePrintTemplateDesign(templateId.value, getDesignPayload());
  window.$message?.success(`已保存 ${canvasElements.value.length} 个画布元素`);
}

function handlePublish() {
  if (!templateId.value) {
    window.$message?.warning('请从模板列表进入设计器后再发布');
    return;
  }
  if (!canvasElements.value.length) {
    window.$message?.warning('画布为空，请至少添加一个元素后再发布');
    return;
  }

  dialog.warning({
    title: '确认发布模板',
    content: '发布后将生成新版本并用于生产打印，当前画布布局会一并保存。是否继续？',
    positiveText: '发布',
    negativeText: '取消',
    onPositiveClick: async () => {
      publishing.value = true;
      const publisherName = authStore.userInfo.user?.nickName || authStore.userInfo.user?.userName || '系统管理员';
      const { data, error } = await fetchPublishPrintTemplate({
        templateId: templateId.value!,
        publisherName,
        ...getDesignPayload()
      });
      publishing.value = false;
      if (error || !data) return false;

      versionStatus.value = 'published';
      templateVersion.value = data.version;
      window.$message?.success(`模板已发布，当前版本 v${data.version}`);
      return true;
    }
  });
}

async function handleTestPrint() {
  if (!canvasElements.value.length) {
    window.$message?.warning('画布为空，请先添加元素后再测试打印');
    return;
  }
  const { openPalletLabelTestPrintWindow } = await import('./utils/preview-pallet-label');
  const ok = await openPalletLabelTestPrintWindow({
    elements: canvasElements.value,
    paperSize: paperSize.value,
    orientation: orientation.value,
    title: `测试打印 · ${templateId.value || '草稿'}`
  });
  if (ok) {
    window.$message?.success(
      `已打开测试打印（${dimensions.value.widthMm}×${dimensions.value.heightMm} mm），请在打印对话框确认`
    );
  }
}

function handleSubmitTest() {
  if (!templateId.value) {
    window.$message?.warning('请从模板列表进入设计器后再提交测试');
    return;
  }
  if (!canvasElements.value.length) {
    window.$message?.warning('画布为空，请至少添加一个元素后再提交测试');
    return;
  }

  dialog.info({
    title: '提交测试',
    content:
      '将保存当前画布设计，并把模板状态更新为「测试中」。请使用「测试打印」验证版式与字段后再申请发布。',
    positiveText: '提交测试',
    negativeText: '取消',
    onPositiveClick: async () => {
      submittingTest.value = true;
      const submitterName =
        authStore.userInfo.user?.nickName || authStore.userInfo.user?.userName || '系统管理员';
      const { data, error } = await fetchSubmitPrintTemplateTest({
        templateId: templateId.value!,
        submitterName,
        ...getDesignPayload()
      });
      submittingTest.value = false;
      if (error || !data) return false;

      versionStatus.value = 'testing';
      window.$message?.success('已提交测试，模板进入「测试中」状态');
      return true;
    }
  });
}

async function handleAction(key: string) {
  if (key === 'save') {
    await saveDraft();
    return;
  }
  if (key === 'preview') {
    previewVisible.value = true;
    return;
  }
  if (key === 'test') {
    await handleTestPrint();
    return;
  }
  if (key === 'submit') {
    handleSubmitTest();
    return;
  }
  if (key === 'publish') {
    handlePublish();
    return;
  }
  const item = DESIGNER_ACTIONS.find(a => a.key === key);
  protoMsg(item?.label || key);
}

function onAddElement(payload: { label: string; kind: 'field' | 'component'; x: number; y: number }) {
  const el = createCanvasElement(payload.label, payload.kind, payload.x, payload.y);
  canvasElements.value.push(el);
  selectedIds.value = [el.id];
}

function onSelectElement(id: string | null, multi = false) {
  if (!id) {
    selectedIds.value = [];
    tableSelectedRange.value = null;
    return;
  }
  if (multi) {
    const idx = selectedIds.value.indexOf(id);
    if (idx >= 0) {
      selectedIds.value = selectedIds.value.filter(item => item !== id);
      if (tableSelectedRange.value?.tableId === id) tableSelectedRange.value = null;
      return;
    }
    if (selectedIds.value.length < MAX_SELECTED) {
      selectedIds.value = [...selectedIds.value, id];
    } else {
      selectedIds.value = [selectedIds.value[0], id];
    }
    tableSelectedRange.value = null;
    return;
  }
  selectedIds.value = [id];
  if (tableSelectedRange.value?.tableId !== id) tableSelectedRange.value = null;
}

function onTableCellRangeSelect(tableId: string, range: TableCellRange) {
  selectedIds.value = [tableId];
  tableSelectedRange.value = { tableId, ...range };
}

function onTableCellDrop(
  tableId: string,
  row: number,
  col: number,
  label: string,
  kind: 'field' | 'component'
) {
  const table = canvasElements.value.find(e => e.id === tableId);
  if (!table) return;
  const config = ensureTableConfig(table);
  const cells = JSON.parse(JSON.stringify(config.cells)) as TableConfig['cells'];
  const anchor = cells[row][col];
  cells[row][col] = {
    ...cellItemFromDrop(label, kind),
    rowSpan: anchor.rowSpan ?? 1,
    colSpan: anchor.colSpan ?? 1,
    hidden: false
  };
  onUpdateElement(tableId, { tableConfig: normalizeTableConfig({ ...config, cells }) });
  tableSelectedRange.value = { tableId, startRow: row, startCol: col, endRow: row, endCol: col };
}

function updateTableConfig(tableId: string, config: TableConfig) {
  const normalized = normalizeTableConfig(config);
  onUpdateElement(tableId, { tableConfig: normalized });
  if (tableSelectedRange.value?.tableId === tableId) {
    const anchor = getRangeAnchor(tableSelectedRange.value);
    if (
      anchor.row >= normalized.rows ||
      anchor.col >= normalized.cols ||
      normalized.cells[anchor.row]?.[anchor.col]?.hidden
    ) {
      tableSelectedRange.value = null;
    } else {
      const cell = normalized.cells[anchor.row][anchor.col];
      tableSelectedRange.value = {
        tableId,
        startRow: anchor.row,
        startCol: anchor.col,
        endRow: anchor.row + (cell.rowSpan ?? 1) - 1,
        endCol: anchor.col + (cell.colSpan ?? 1) - 1
      };
    }
  }
}

function updateTableCell(tableId: string, row: number, col: number, patch: Partial<TableConfig['cells'][0][0]>) {
  const table = canvasElements.value.find(e => e.id === tableId);
  if (!table) return;
  const config = ensureTableConfig(table);
  const cells = JSON.parse(JSON.stringify(config.cells)) as TableConfig['cells'];
  cells[row][col] = { ...cells[row][col], ...patch };
  onUpdateElement(tableId, { tableConfig: normalizeTableConfig({ ...config, cells }) });
}

function clearTableCell(tableId: string, row: number, col: number) {
  updateTableCell(tableId, row, col, { type: 'empty', label: '', placeholder: '', text: '', bindField: undefined });
}

function addComponentFromPanel(label: string) {
  const dim = dimensions.value;
  const stack = canvasElements.value.length;
  const el = createCanvasElement(
    label,
    'component',
    Math.max(8, dim.widthPx / 2 - 60 + (stack % 3) * 16),
    Math.max(8, dim.heightPx / 2 - 24 + (stack % 3) * 16)
  );
  canvasElements.value.push(el);
  if (selectedIds.value.length < MAX_SELECTED) {
    selectedIds.value = [...selectedIds.value, el.id];
  } else {
    selectedIds.value = [selectedIds.value[0], el.id];
  }
}

const imageRecompressTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleImageRecompress(id: string) {
  const prev = imageRecompressTimers.get(id);
  if (prev) clearTimeout(prev);
  imageRecompressTimers.set(
    id,
    setTimeout(() => {
      imageRecompressTimers.delete(id);
      const el = canvasElements.value.find(e => e.id === id);
      if (!el?.imageSrc || !isImageComponent(el)) return;
      compressImageDataUrlForElement(el.imageSrc, el.width, el.height)
        .then(nextSrc => {
          const idx = canvasElements.value.findIndex(e => e.id === id);
          if (idx < 0) return;
          const current = canvasElements.value[idx];
          if (!current.imageSrc || !isImageComponent(current)) return;
          canvasElements.value[idx] = { ...current, imageSrc: nextSrc };
        })
        .catch(() => {
          /* 保留原图 */
        });
    }, 320)
  );
}

function onUpdateElement(id: string, patch: Partial<DesignerCanvasElement>) {
  const idx = canvasElements.value.findIndex(e => e.id === id);
  if (idx >= 0) {
    const current = canvasElements.value[idx];
    const next = { ...current, ...patch };
    if (patch.labelLayout && current.kind === 'field') {
      const size = estimateElementSize(current.label, current.kind, patch.labelLayout);
      next.width = size.width;
      next.height = size.height;
    }
    canvasElements.value[idx] = next;

    const sizeChanged =
      (patch.width != null && patch.width !== current.width) ||
      (patch.height != null && patch.height !== current.height);
    if (isImageComponent(current) && current.imageSrc && sizeChanged) {
      scheduleImageRecompress(id);
    }
  }
}

function deleteElement(id: string) {
  canvasElements.value = canvasElements.value.filter(e => e.id !== id);
  selectedIds.value = selectedIds.value.filter(item => item !== id);
}

function deleteSelected() {
  if (!selectedIds.value.length) return;
  const removeSet = new Set(selectedIds.value);
  canvasElements.value = canvasElements.value.filter(e => !removeSet.has(e.id));
  selectedIds.value = [];
}

function clearCanvas() {
  canvasElements.value = [];
  selectedIds.value = [];
  tableSelectedRange.value = null;
}

function loadExample() {
  if (templateType.value === 'bol') {
    paperSize.value = 'A4';
    orientation.value = 'landscape';
    const dim = resolvePaperDimensions('A4', 'landscape');
    canvasElements.value = getDefaultElementsForBol(dim.widthPx, dim.heightPx);
    selectedIds.value = [];
    tableSelectedRange.value = null;
    window.$message?.success('已加载 BOL 提单示例布局（A4 横向）');
    return;
  }
  canvasElements.value = getDefaultElementsForPalletLabel(dimensions.value.widthPx, dimensions.value.heightPx);
  selectedIds.value = [];
  window.$message?.success('已加载卡板贴示例布局');
}

function normalizeImportedElement(el: DesignerCanvasElement): DesignerCanvasElement {
  if (el.label === '表格') {
    return { ...el, tableConfig: ensureTableConfig(el) };
  }
  if (el.kind === 'component' && (el.label === '文本' || el.label === '标题') && el.placeholder === el.label) {
    return { ...el, placeholder: '' };
  }
  return el;
}

function onImportApply(payload: { result: TemplateImportResult; mode: TemplateImportMode }) {
  const normalized = payload.result.elements.map(normalizeImportedElement);
  canvasElements.value = applyImportedElements(canvasElements.value, normalized, payload.mode);
  paperSize.value = payload.result.paperSize;
  orientation.value = payload.result.orientation;
  selectedIds.value = [];
  tableSelectedRange.value = null;
  window.$message?.success(
    `[原型] 已${payload.mode === 'merge' ? '合并' : '导入'} ${normalized.length} 个组件`
  );
}

function exportDesignJson() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          version: 1,
          paperSize: paperSize.value,
          orientation: orientation.value,
          elements: canvasElements.value
        },
        null,
        2
      )
    ],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `print-template-${templateId.value || 'draft'}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.$message?.success('设计稿 JSON 已导出，可用于再次上传导入');
}

function onKeydown(e: KeyboardEvent) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.value.length) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    deleteSelected();
  }
}

watch(paperSize, (next, prev) => {
  if (prev && canvasElements.value.length) {
    window.$message?.warning('纸张尺寸已变更，请检查元素是否超出画布边界');
  }
});

async function loadTemplateMeta() {
  if (!templateId.value) return;
  const { data } = await fetchGetPrintTemplate(templateId.value);
  if (!data) return;
  versionStatus.value = data.status;
  templateVersion.value = data.version;
  if (data.paperSize) paperSize.value = data.paperSize as PaperPresetKey;
  if (data.orientation) orientation.value = data.orientation;
}

async function loadTemplateDesign() {
  if (!templateId.value) return;

  const { getPrintTemplateDesign } = await import('@/mock/data/print-center');
  const saved = getPrintTemplateDesign(templateId.value);
  if (saved) {
    paperSize.value = (saved.paperSize as PaperPresetKey) || paperSize.value;
    orientation.value = saved.orientation || orientation.value;
    canvasElements.value = JSON.parse(JSON.stringify(saved.elements)).map((el: DesignerCanvasElement) => {
      if (el.label === '表格' && !el.tableConfig) {
        return { ...el, tableConfig: ensureTableConfig(el) };
      }
      if (el.kind === 'component' && (el.label === '文本' || el.label === '标题') && el.placeholder === el.label) {
        return { ...el, placeholder: '' };
      }
      return el;
    });
    selectedIds.value = [];
    return;
  }

  if (templateType.value === 'pallet_label' || templateType.value === 'bol') {
    loadExample();
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  await loadTemplateMeta();
  await loadTemplateDesign();
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  imageRecompressTimers.forEach(timer => clearTimeout(timer));
  imageRecompressTimers.clear();
});
</script>

<template>
  <div class="designer-page min-h-500px flex flex-1 min-h-0 flex-col gap-12px overflow-hidden">
    <NCard size="small" :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <NSpace align="center">
          <NButton quaternary @click="goBack">返回</NButton>
          <span class="font-medium">模板设计器</span>
          <NTag v-if="templateType" size="small" type="info">
            {{ typeRecord[templateType]?.dictLabel || templateType }}
          </NTag>
          <NTag v-if="invoiceSubtype" size="small" type="warning">
            {{ invoiceSubtypeRecord[invoiceSubtype]?.dictLabel || invoiceCategory?.label }}
          </NTag>
          <NTag size="small" :type="versionStatus === 'published' ? 'success' : 'default'">
            {{ TEMPLATE_VERSION_LIFECYCLE.find(s => s.key === versionStatus)?.label }}
          </NTag>
          <NTag v-if="templateId" size="small" type="default">v{{ templateVersion }}</NTag>
          <span v-if="templateId" class="text-sm text-gray-500">ID: {{ templateId }}</span>
        </NSpace>
        <NSpace wrap>
          <NButton size="small" @click="loadExample">加载示例</NButton>
          <NButton size="small" type="primary" @click="importVisible = true">上传模板</NButton>
          <NButton size="small" @click="exportDesignJson">导出 JSON</NButton>
          <NButton size="small" @click="clearCanvas">清空画布</NButton>
          <NButton
            v-for="act in DESIGNER_ACTIONS"
            :key="act.key"
            size="small"
            :type="act.key === 'publish' ? 'primary' : 'default'"
            :loading="(act.key === 'publish' && publishing) || (act.key === 'submit' && submittingTest)"
            :disabled="(act.key === 'publish' && publishing) || (act.key === 'submit' && submittingTest)"
            @click="handleAction(act.key)"
          >
            {{ act.label }}
          </NButton>
        </NSpace>
      </div>
    </NCard>

    <div class="designer-body">
      <NCard
        title="字段库"
        size="small"
        class="designer-sidebar designer-sidebar--left flex min-h-0 flex-col overflow-hidden"
        content-class="designer-sidebar-content"
      >
        <div class="designer-sidebar-scroll">
          <DesignerFieldPalette />
        </div>
      </NCard>

      <NCard
        title="模板画布"
        size="small"
        class="designer-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        content-class="designer-main-content"
      >
        <div class="mb-12px flex flex-shrink-0 flex-wrap items-end gap-16px">
          <NFormItem label="纸张" label-placement="left" :show-feedback="false">
            <NSelect v-model:value="paperSize" :options="paperOptions" class="w-168px" size="small" />
          </NFormItem>
          <NFormItem label="方向" label-placement="left" :show-feedback="false">
            <NSelect
              v-model:value="orientation"
              :options="[
                { label: '纵向', value: 'portrait' },
                { label: '横向', value: 'landscape' }
              ]"
              class="w-100px"
              size="small"
            />
          </NFormItem>
          <NFormItem label="缩放" label-placement="left" :show-feedback="false" class="min-w-180px">
            <NSlider v-model:value="zoom" :min="0.5" :max="1.5" :step="0.1" />
          </NFormItem>
        </div>
        <DesignerCanvas
          :paper-size="paperSize"
          :orientation="orientation"
          :elements="canvasElements"
          :selected-ids="selectedIds"
          :active-selected-id="activeSelectedId"
          :table-selected-range="tableSelectedRange"
          :zoom="zoom"
          @select="onSelectElement"
          @add="onAddElement"
          @update="onUpdateElement"
          @delete="deleteSelected"
          @table-cell-range-select="onTableCellRangeSelect"
          @table-cell-drop="onTableCellDrop"
          @table-config-change="updateTableConfig"
        />
      </NCard>

      <NCard
        title="属性与样式"
        size="small"
        class="designer-sidebar designer-sidebar--right flex min-h-0 flex-col overflow-hidden"
        content-class="designer-sidebar-content"
      >
        <div class="designer-sidebar-scroll">
        <div class="add-component-block">
          <div class="text-sm font-medium mb-8px">添加组件</div>
          <div class="add-component-chips">
            <NButton
              v-for="c in DESIGNER_COMPONENTS"
              :key="c"
              size="tiny"
              secondary
              @click="addComponentFromPanel(c)"
            >
              {{ c }}
            </NButton>
          </div>
          <p class="text-xs text-gray-500 mt-8px mb-0">
            点击添加到画布；按住 Ctrl 多选最多 2 个元素可同时编辑属性
          </p>
        </div>

        <DesignerElementProps
          v-for="(el, idx) in selectedElements"
          :key="el.id"
          :element="el"
          :index="idx"
          :width-px="dimensions.widthPx"
          :height-px="dimensions.heightPx"
          :table-selected-range="
            tableSelectedRange?.tableId === el.id
              ? {
                  startRow: tableSelectedRange.startRow,
                  startCol: tableSelectedRange.startCol,
                  endRow: tableSelectedRange.endRow,
                  endCol: tableSelectedRange.endCol
                }
              : null
          "
          @update="patch => onUpdateElement(el.id, patch)"
          @delete="deleteElement(el.id)"
          @table-config-change="config => updateTableConfig(el.id, config)"
          @table-cell-clear="(row, col) => clearTableCell(el.id, row, col)"
          @table-cell-update="(row, col, patch) => updateTableCell(el.id, row, col, patch)"
        />

        <div v-if="!selectedElements.length" class="text-sm text-gray-500 py-16px text-center">
          选中画布元素后可编辑属性，或从上方添加组件
        </div>
        <div v-if="invoiceCategory" class="mt-16px rounded-6px bg-gray-100 p-8px text-xs dark:bg-gray-800">
          <div class="font-medium mb-4px">{{ invoiceCategory.label }} 费项参考</div>
          <div>{{ invoiceCategory.feeExamples.join(' · ') }}</div>
        </div>
        </div>
      </NCard>
    </div>

    <DesignerPreviewModal
      v-model:show="previewVisible"
      :elements="canvasElements"
      :paper-size="paperSize"
      :orientation="orientation"
    />

    <DesignerImportModal
      v-model:show="importVisible"
      :template-type="templateType"
      @apply="onImportApply"
    />
  </div>
</template>

<style scoped>
.designer-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.designer-body {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  align-items: stretch;
}

.designer-sidebar--left {
  width: 240px;
  flex-shrink: 0;
}

.designer-sidebar--right {
  width: 280px;
  flex-shrink: 0;
}

.designer-sidebar :deep(.n-card-header) {
  flex-shrink: 0;
}

.designer-sidebar.flex {
  display: flex;
  flex-direction: column;
}

.designer-main.flex {
  display: flex;
  flex-direction: column;
}

.designer-sidebar :deep(.designer-sidebar-content) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px !important;
}

.designer-sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.designer-main :deep(.n-card-header) {
  flex-shrink: 0;
}

.designer-main :deep(.designer-main-content) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.card-wrapper {
  flex-shrink: 0;
}

.add-component-block {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.add-component-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 768px) {
  .designer-body {
    flex-direction: column;
  }

  .designer-sidebar--left,
  .designer-sidebar--right {
    width: 100%;
    max-height: 240px;
  }
}
</style>
