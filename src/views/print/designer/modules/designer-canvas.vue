<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DesignerCanvasElement, PaperOrientation, PaperPresetKey } from '../utils/paper-size';
import { CANVAS_DISPLAY_SCALE, resolvePaperDimensions } from '../utils/paper-size';
import {
  getCanvasComponentValue,
  getCanvasFieldBinding,
  getCanvasFieldLabel,
  getLabelLayout,
  getTextComponentContent,
  getTextComponentDisplay,
  hasTextComponentContent,
  isTextComponent,
  shouldShowLabel
} from '../utils/field-display';
import {
  isDecorativeComponent,
  isDynamicFieldComponent,
  isNumberSequenceComponent
} from '../utils/component-registry';
import DesignerDecorativeBlock from './designer-decorative-block.vue';
import DesignerQrcodeBlock from './designer-qrcode-block.vue';
import DesignerSignatureBlock from './designer-signature-block.vue';
import DesignerTableBlock from './designer-table-block.vue';

const props = defineProps<{
  paperSize: PaperPresetKey | string;
  orientation: PaperOrientation;
  elements: DesignerCanvasElement[];
  selectedIds: string[];
  activeSelectedId: string | null;
  tableSelectedRange: ({ tableId: string } & import('../utils/table-utils').TableCellRange) | null;
  zoom: number;
}>();

const emit = defineEmits<{
  select: [id: string | null, multi?: boolean];
  add: [payload: { label: string; kind: 'field' | 'component'; x: number; y: number }];
  update: [id: string, patch: Partial<DesignerCanvasElement>];
  delete: [id: string];
  'table-cell-range-select': [tableId: string, range: import('../utils/table-utils').TableCellRange];
  'table-cell-drop': [tableId: string, row: number, col: number, label: string, kind: 'field' | 'component'];
  'table-config-change': [tableId: string, config: import('../utils/table-utils').TableConfig];
}>();

const canvasRef = ref<HTMLElement | null>(null);
const isDragOver = ref(false);
const editingTextId = ref<string | null>(null);
const textEditRef = ref<HTMLTextAreaElement | null>(null);
const textEditDraft = ref('');

const dimensions = computed(() => resolvePaperDimensions(props.paperSize, props.orientation));

const stageStyle = computed(() => ({
  width: `${dimensions.value.widthPx * props.zoom}px`,
  height: `${dimensions.value.heightPx * props.zoom}px`
}));

const paperLabel = computed(
  () => `${dimensions.value.widthMm} × ${dimensions.value.heightMm} mm · 缩放 ${Math.round(props.zoom * 100)}%`
);

function canvasPointFromEvent(e: DragEvent | MouseEvent) {
  const el = canvasRef.value;
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / props.zoom;
  const y = (e.clientY - rect.top) / props.zoom;
  return {
    x: Math.max(0, Math.min(x, dimensions.value.widthPx - 8)),
    y: Math.max(0, Math.min(y, dimensions.value.heightPx - 8))
  };
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  isDragOver.value = true;
}

function onDragLeave() {
  isDragOver.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
  const raw = e.dataTransfer?.getData('application/x-print-designer');
  if (!raw) return;
  try {
    const { label, kind } = JSON.parse(raw) as { label: string; kind: 'field' | 'component' };
    const { x, y } = canvasPointFromEvent(e);
    emit('add', { label, kind, x, y });
  } catch {
    /* ignore */
  }
}

function onCanvasClick(e: MouseEvent) {
  if (e.target === canvasRef.value) {
    cancelTextEdit();
    emit('select', null);
  }
}

const MIN_ELEMENT_WIDTH = 20;
const MIN_ELEMENT_HEIGHT = 16;

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type ResizeHandle = (typeof RESIZE_HANDLES)[number];

/** 画布内拖动元素 */
const moving = ref<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null);

const resizing = ref<{
  id: string;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
} | null>(null);

const resizePreview = ref<{ width: number; height: number } | null>(null);

function clampSize(width: number, height: number) {
  return {
    width: Math.max(MIN_ELEMENT_WIDTH, Math.round(width)),
    height: Math.max(MIN_ELEMENT_HEIGHT, Math.round(height))
  };
}

function applyResizePatch(
  handle: ResizeHandle,
  originX: number,
  originY: number,
  originW: number,
  originH: number,
  dx: number,
  dy: number
) {
  let x = originX;
  let y = originY;
  let width = originW;
  let height = originH;

  if (handle.includes('e')) width = originW + dx;
  if (handle.includes('w')) {
    width = originW - dx;
    x = originX + dx;
  }
  if (handle.includes('s')) height = originH + dy;
  if (handle.includes('n')) {
    height = originH - dy;
    y = originY + dy;
  }

  const sized = clampSize(width, height);
  if (width < MIN_ELEMENT_WIDTH) {
    if (handle.includes('w')) x = originX + originW - MIN_ELEMENT_WIDTH;
    width = MIN_ELEMENT_WIDTH;
  }
  if (height < MIN_ELEMENT_HEIGHT) {
    if (handle.includes('n')) y = originY + originH - MIN_ELEMENT_HEIGHT;
    height = MIN_ELEMENT_HEIGHT;
  }

  const maxX = dimensions.value.widthPx - width;
  const maxY = dimensions.value.heightPx - height;
  x = Math.max(0, Math.min(x, maxX));
  y = Math.max(0, Math.min(y, maxY));

  if (x + width > dimensions.value.widthPx) width = dimensions.value.widthPx - x;
  if (y + height > dimensions.value.heightPx) height = dimensions.value.heightPx - y;

  return { x: Math.round(x), y: Math.round(y), ...clampSize(width, height) };
}

function onElementMouseDown(e: MouseEvent, el: DesignerCanvasElement) {
  if (resizing.value) return;
  e.stopPropagation();
  const multi = e.ctrlKey || e.metaKey || e.shiftKey;
  emit('select', el.id, multi);
  moving.value = {
    id: el.id,
    startX: e.clientX,
    startY: e.clientY,
    originX: el.x,
    originY: el.y
  };
}

function onResizeMouseDown(e: MouseEvent, el: DesignerCanvasElement, handle: ResizeHandle) {
  e.stopPropagation();
  e.preventDefault();
  emit('select', el.id, false);
  moving.value = null;
  resizing.value = {
    id: el.id,
    handle,
    startX: e.clientX,
    startY: e.clientY,
    originX: el.x,
    originY: el.y,
    originW: el.width,
    originH: el.height
  };
  resizePreview.value = { width: el.width, height: el.height };
}

function onWindowMouseMove(e: MouseEvent) {
  if (resizing.value) {
    const dx = (e.clientX - resizing.value.startX) / props.zoom;
    const dy = (e.clientY - resizing.value.startY) / props.zoom;
    const patch = applyResizePatch(
      resizing.value.handle,
      resizing.value.originX,
      resizing.value.originY,
      resizing.value.originW,
      resizing.value.originH,
      dx,
      dy
    );
    resizePreview.value = { width: patch.width, height: patch.height };
    emit('update', resizing.value.id, patch);
    return;
  }
  if (!moving.value) return;
  const dx = (e.clientX - moving.value.startX) / props.zoom;
  const dy = (e.clientY - moving.value.startY) / props.zoom;
  const el = props.elements.find(item => item.id === moving.value!.id);
  if (!el) return;
  const maxX = dimensions.value.widthPx - el.width;
  const maxY = dimensions.value.heightPx - el.height;
  emit('update', moving.value.id, {
    x: Math.max(0, Math.min(moving.value.originX + dx, maxX)),
    y: Math.max(0, Math.min(moving.value.originY + dy, maxY))
  });
}

function onWindowMouseUp() {
  moving.value = null;
  resizing.value = null;
  resizePreview.value = null;
}

onMounted(() => {
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onWindowMouseMove);
  window.removeEventListener('mouseup', onWindowMouseUp);
});

watch(
  () => [props.paperSize, props.orientation],
  () => emit('select', null, false)
);

function elementStyle(el: DesignerCanvasElement) {
  return {
    left: `${el.x * props.zoom}px`,
    top: `${el.y * props.zoom}px`,
    width: `${el.width * props.zoom}px`,
    height: `${el.height * props.zoom}px`,
    fontSize: `${el.fontSize * props.zoom}px`,
    fontWeight: el.fontWeight,
    textAlign: el.textAlign
  };
}

function elementSizeText(el: DesignerCanvasElement) {
  const preview = resizing.value?.id === el.id && resizePreview.value ? resizePreview.value : null;
  const w = preview?.width ?? el.width;
  const h = preview?.height ?? el.height;
  return `${Math.round(w)}×${Math.round(h)} px · ${el.fontSize} pt`;
}

function displayText(el: DesignerCanvasElement) {
  return getCanvasFieldLabel(el);
}

function bindingText(el: DesignerCanvasElement) {
  return getCanvasFieldBinding(el);
}

function isQrcodeField(label: string) {
  return label === '二维码';
}

function isBarcodeField(label: string) {
  return label === '条形码';
}

function isCodeField(label: string) {
  return isQrcodeField(label) || isBarcodeField(label);
}

function isLogoField(label: string) {
  return label === '公司Logo' || label === '图片';
}

function isTableField(label: string) {
  return label === '表格';
}

function isSignatureField(label: string) {
  return label === '签名栏';
}

function onTableDragStart(e: MouseEvent, el: DesignerCanvasElement) {
  onElementMouseDown(e, el);
}

function onSignatureDragStart(e: MouseEvent, el: DesignerCanvasElement) {
  onElementMouseDown(e, el);
}

function onTextMouseDown(e: MouseEvent, el: DesignerCanvasElement) {
  e.stopPropagation();
  const multi = e.ctrlKey || e.metaKey || e.shiftKey;
  emit('select', el.id, multi);
}

function onTextDblClick(e: MouseEvent, el: DesignerCanvasElement) {
  e.stopPropagation();
  moving.value = null;
  editingTextId.value = el.id;
  textEditDraft.value = getTextComponentContent(el);
  emit('select', el.id, false);
  nextTick(() => {
    textEditRef.value?.focus();
    textEditRef.value?.select();
  });
}

function commitTextEdit(el: DesignerCanvasElement) {
  if (editingTextId.value !== el.id) return;
  editingTextId.value = null;
  emit('update', el.id, { placeholder: textEditDraft.value });
}

function cancelTextEdit() {
  editingTextId.value = null;
}

function onTextEditKeydown(e: KeyboardEvent, el: DesignerCanvasElement) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    commitTextEdit(el);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelTextEdit();
  }
}
</script>

<template>
  <div class="designer-canvas-root">
    <div class="mb-8px flex items-center justify-between text-xs text-gray-500">
      <span>{{ paperLabel }}（1mm ≈ {{ CANVAS_DISPLAY_SCALE }}px）</span>
      <span>拖入字段；Ctrl+点击多选（最多2个）；拖动移动；拖边框调整宽高</span>
    </div>
    <div class="canvas-scroll">
      <div
        class="canvas-stage"
        :class="{ 'canvas-stage--drag-over': isDragOver }"
        :style="stageStyle"
      >
        <div
          ref="canvasRef"
          class="canvas-paper"
          :style="stageStyle"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @click="onCanvasClick"
        >
          <div class="canvas-paper__ruler canvas-paper__ruler--top" />
          <div class="canvas-paper__ruler canvas-paper__ruler--left" />

          <div
            v-for="el in elements"
            :key="el.id"
            class="canvas-element"
            :class="{
              'canvas-element--selected': selectedIds.includes(el.id),
              'canvas-element--active': activeSelectedId === el.id,
              'canvas-element--code': isCodeField(el.label),
              'canvas-element--qrcode': isQrcodeField(el.label),
              'canvas-element--table': isTableField(el.label),
              'canvas-element--signature': isSignatureField(el.label),
              'canvas-element--image': isLogoField(el.label),
              'canvas-element--text': isTextComponent(el),
              'canvas-element--deco':
                isDecorativeComponent(el) || isDynamicFieldComponent(el) || isNumberSequenceComponent(el),
              'canvas-element--hidden': el.visible === false,
              'canvas-element--horizontal': el.kind === 'field' && getLabelLayout(el) === 'horizontal'
            }"
            :style="elementStyle(el)"
            @mousedown="onElementMouseDown($event, el)"
          >
            <template v-if="isQrcodeField(el.label)">
              <span v-if="shouldShowLabel(el)" class="element-label">{{ el.label }}</span>
              <DesignerQrcodeBlock :element="el" :zoom="zoom" use-sample-data />
              <span v-if="el.visible === false" class="element-hidden-tag">已关闭打印</span>
            </template>
            <template v-else-if="isBarcodeField(el.label)">
              <span v-if="shouldShowLabel(el)" class="element-label">{{ el.label }}</span>
              <span class="code-placeholder">条形码</span>
            </template>
            <template v-else-if="isSignatureField(el.label)">
              <span v-if="shouldShowLabel(el)" class="element-label element-label--inline">{{ el.label }}</span>
              <DesignerSignatureBlock
                :element="el"
                :zoom="zoom"
                @signature-change="src => emit('update', el.id, { imageSrc: src })"
                @signature-drag-start="onSignatureDragStart($event, el)"
              />
            </template>
            <template v-else-if="isTableField(el.label)">
              <DesignerTableBlock
                :element="el"
                :zoom="zoom"
                :selected-range="
                  tableSelectedRange?.tableId === el.id
                    ? {
                        startRow: tableSelectedRange.startRow,
                        startCol: tableSelectedRange.startCol,
                        endRow: tableSelectedRange.endRow,
                        endCol: tableSelectedRange.endCol
                      }
                    : null
                "
                @cell-range-select="range => emit('table-cell-range-select', el.id, range)"
                @cell-drop="(row, col, label, kind) => emit('table-cell-drop', el.id, row, col, label, kind)"
                @table-config-change="config => emit('table-config-change', el.id, config)"
                @table-drag-start="onTableDragStart($event, el)"
              />
            </template>
            <template v-else-if="isLogoField(el.label)">
              <span v-if="shouldShowLabel(el)" class="element-label">{{ el.label }}</span>
              <img v-if="el.imageSrc" :src="el.imageSrc" class="element-image" alt="" />
              <span v-else class="element-image-placeholder">未上传</span>
            </template>
            <template
              v-else-if="isDecorativeComponent(el) || isDynamicFieldComponent(el) || isNumberSequenceComponent(el)"
            >
              <span v-if="shouldShowLabel(el)" class="element-label">{{ el.label }}</span>
              <DesignerDecorativeBlock :element="el" />
            </template>
            <template v-else-if="isTextComponent(el)">
              <span v-if="shouldShowLabel(el)" class="element-label">{{ el.label }}</span>
              <span
                v-if="editingTextId !== el.id"
                class="element-text-content"
                :class="{ 'element-text-content--empty': !hasTextComponentContent(el) }"
                @mousedown.stop="onTextMouseDown($event, el)"
                @dblclick.stop="onTextDblClick($event, el)"
              >
                {{ getTextComponentDisplay(el) }}
              </span>
              <textarea
                v-else
                ref="textEditRef"
                v-model="textEditDraft"
                class="element-text-editor"
                :style="{ textAlign: el.textAlign }"
                @mousedown.stop
                @dblclick.stop
                @blur="commitTextEdit(el)"
                @keydown="onTextEditKeydown($event, el)"
              />
            </template>
            <template v-else-if="el.kind === 'field'">
              <span v-if="shouldShowLabel(el)" class="element-label">{{ displayText(el) }}</span>
              <span class="element-binding">{{ bindingText(el) }}</span>
              <span v-if="el.visible === false" class="element-hidden-tag">已关闭打印</span>
            </template>
            <template v-else>
              <span v-if="shouldShowLabel(el)" class="element-label">{{ el.label }}</span>
              <span class="element-binding">{{ getCanvasComponentValue(el) }}</span>
            </template>

            <template v-if="activeSelectedId === el.id">
              <span class="element-size-badge">{{ elementSizeText(el) }}</span>
              <span
                v-for="handle in RESIZE_HANDLES"
                :key="handle"
                class="resize-handle"
                :class="`resize-handle--${handle}`"
                @mousedown="onResizeMouseDown($event, el, handle)"
              />
            </template>
          </div>

          <div v-if="!elements.length" class="canvas-empty">
            拖拽字段到此处，或点击「加载示例」
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.designer-canvas-root {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.canvas-scroll {
  flex: 1;
  overflow: auto;
  padding: 12px;
  background: var(--n-color-modal);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.canvas-stage {
  margin: 0 auto;
  box-shadow: 0 4px 20px rgb(0 0 0 / 12%);
  transition: outline 0.15s;
}

.canvas-stage--drag-over {
  outline: 2px dashed var(--n-primary-color);
  outline-offset: 4px;
}

.canvas-paper {
  position: relative;
  background: #fff;
  color: #111;
  box-sizing: border-box;
  user-select: none;
  overflow: visible;
}

.canvas-paper__ruler--top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: repeating-linear-gradient(
    90deg,
    #e5e7eb 0,
    #e5e7eb 1px,
    transparent 1px,
    transparent calc(2.8mm * 10)
  );
  pointer-events: none;
  opacity: 0.6;
}

.canvas-paper__ruler--left {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 1px;
  background: repeating-linear-gradient(
    180deg,
    #e5e7eb 0,
    #e5e7eb 1px,
    transparent 1px,
    transparent calc(2.8mm * 10)
  );
  pointer-events: none;
  opacity: 0.6;
}

.canvas-element {
  position: absolute;
  padding: 3px 6px;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  cursor: move;
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
  box-sizing: border-box;
  overflow: hidden;
  color: #111;
  background: rgb(248 250 252 / 90%);
}

.canvas-element:hover {
  border-color: #93c5fd;
  background: rgb(59 130 246 / 6%);
}

.canvas-element--selected {
  border-color: var(--n-primary-color);
  background: rgb(59 130 246 / 10%);
  box-shadow: 0 0 0 1px var(--n-primary-color);
  overflow: visible;
}

.canvas-element--active.canvas-element--selected {
  box-shadow: 0 0 0 2px var(--n-primary-color);
}

.canvas-element--code {
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.canvas-element--table {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.canvas-element--table :deep(.table-block) {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.canvas-element--deco {
  padding: 2px 4px;
  justify-content: center;
}

.canvas-element--signature {
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.canvas-element--image {
  padding: 2px;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.element-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.element-image-placeholder {
  font-size: 0.75em;
  color: #9ca3af;
}

.canvas-element--qrcode {
  padding: 2px;
  background: #fff;
}

.canvas-element--qrcode .element-hidden-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  background: rgb(254 242 242 / 90%);
}

.code-placeholder {
  font-size: 0.75em;
  color: #6b7280;
}

.canvas-element--hidden {
  opacity: 0.45;
  border-style: dotted;
  background: #fef2f2;
}

.canvas-element--horizontal {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.canvas-element--horizontal .element-hidden-tag {
  margin-top: 0;
  margin-left: 4px;
}

.element-hidden-tag {
  font-size: 0.7em;
  color: #dc2626;
  margin-top: 2px;
}

.element-empty-hint {
  font-size: 0.75em;
  color: #9ca3af;
}

.element-label {
  font-size: 0.85em;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.element-label--inline {
  position: absolute;
  top: 1px;
  left: 4px;
  z-index: 2;
  font-size: 8px;
  padding: 0 3px;
  border-radius: 2px;
  background: rgb(255 255 255 / 88%);
  pointer-events: none;
}

.element-binding {
  font-size: 0.8em;
  color: #2563eb;
  font-family: ui-monospace, monospace;
}

.element-component {
  font-size: 0.9em;
  color: #4b5563;
}

.canvas-element--text {
  justify-content: flex-start;
}

.element-text-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  font-size: 1em;
  color: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: text;
  overflow: auto;
}

.element-text-content--empty {
  color: #9ca3af;
  font-style: italic;
}

.element-text-editor {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: inherit;
  line-height: inherit;
  box-shadow: inset 0 0 0 1px var(--n-primary-color);
  border-radius: 2px;
}

.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 13px;
  pointer-events: none;
}

.element-size-badge {
  position: absolute;
  top: -22px;
  left: 0;
  z-index: 3;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--n-primary-color);
  color: #fff;
  font-size: 10px;
  line-height: 18px;
  white-space: nowrap;
  pointer-events: none;
  font-family: ui-monospace, monospace;
}

.resize-handle {
  position: absolute;
  z-index: 4;
  background: #fff;
  border: 1px solid var(--n-primary-color);
  box-sizing: border-box;
}

.resize-handle--nw,
.resize-handle--ne,
.resize-handle--se,
.resize-handle--sw {
  width: 8px;
  height: 8px;
}

.resize-handle--n,
.resize-handle--s {
  left: 50%;
  width: 10px;
  height: 6px;
  margin-left: -5px;
  cursor: ns-resize;
}

.resize-handle--e,
.resize-handle--w {
  top: 50%;
  width: 6px;
  height: 10px;
  margin-top: -5px;
  cursor: ew-resize;
}

.resize-handle--nw { top: -4px; left: -4px; cursor: nwse-resize; }
.resize-handle--ne { top: -4px; right: -4px; cursor: nesw-resize; }
.resize-handle--se { right: -4px; bottom: -4px; cursor: nwse-resize; }
.resize-handle--sw { bottom: -4px; left: -4px; cursor: nesw-resize; }
.resize-handle--n { top: -3px; }
.resize-handle--s { bottom: -3px; }
.resize-handle--e { right: -3px; }
.resize-handle--w { left: -3px; }
</style>
