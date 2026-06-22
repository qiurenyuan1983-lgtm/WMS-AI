<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { NDropdown } from 'naive-ui';
import type { DesignerCanvasElement } from '../utils/paper-size';
import {
  adjustColBoundary,
  adjustRowBoundary,
  applyTableContextAction,
  countCellsInRange,
  ensureTableConfig,
  getColBoundaryPercents,
  getRowBoundaryPercents,
  getTableCellDisplay,
  isCellHidden,
  isCellInRange,
  normalizeCellRange,
  type TableCellItem,
  type TableCellRange,
  type TableContextAction
} from '../utils/table-utils';

const props = defineProps<{
  element: DesignerCanvasElement;
  zoom: number;
  selectedRange?: TableCellRange | null;
}>();

const emit = defineEmits<{
  'cell-range-select': [range: TableCellRange];
  'cell-drop': [row: number, col: number, label: string, kind: 'field' | 'component'];
  'table-drag-start': [e: MouseEvent];
  'table-config-change': [config: ReturnType<typeof ensureTableConfig>];
}>();

const tableConfig = computed(() => ensureTableConfig(props.element));
const dragOver = ref({ row: -1, col: -1 });
const menuShow = ref(false);
const menuPos = ref({ x: 0, y: 0 });
const menuAnchor = ref({ row: 0, col: 0 });
const selecting = ref(false);
const localRange = ref<TableCellRange | null>(null);
const bodyRef = ref<HTMLElement | null>(null);
const resizing = ref<'col' | 'row' | null>(null);
const resizeBoundaryIndex = ref(0);
const resizeStartClient = ref({ x: 0, y: 0 });
const resizeStartColWidths = ref<number[]>([]);
const resizeStartRowHeights = ref<number[]>([]);

const activeRange = computed(() => (selecting.value ? localRange.value : props.selectedRange));
const colWidths = computed(() => tableConfig.value.colWidths ?? []);
const rowHeights = computed(() => tableConfig.value.rowHeights ?? []);
const colBoundaryPcts = computed(() => getColBoundaryPercents(colWidths.value));
const rowBoundaryPcts = computed(() => getRowBoundaryPercents(rowHeights.value));

function setDragOver(row: number, col: number) {
  dragOver.value = { row, col };
}

function clearDragOver() {
  dragOver.value = { row: -1, col: -1 };
}

function isCellInSelection(row: number, col: number) {
  return isCellInRange(tableConfig.value, row, col, activeRange.value);
}

function isCellDragOver(row: number, col: number) {
  return dragOver.value.row === row && dragOver.value.col === col;
}

function emitRange(range: TableCellRange) {
  localRange.value = range;
  emit('cell-range-select', range);
}

function onCellMouseDown(e: MouseEvent, row: number, col: number) {
  if (e.button !== 0) return;
  e.stopPropagation();
  if (isCellHidden(tableConfig.value, row, col)) return;
  selecting.value = true;
  emitRange({ startRow: row, startCol: col, endRow: row, endCol: col });
}

function onCellMouseEnter(row: number, col: number) {
  if (!selecting.value || !localRange.value) return;
  if (isCellHidden(tableConfig.value, row, col)) return;
  emitRange({
    startRow: localRange.value.startRow,
    startCol: localRange.value.startCol,
    endRow: row,
    endCol: col
  });
}

function onWindowMouseUp() {
  selecting.value = false;
  endResize();
}

function onColResizeStart(e: MouseEvent, boundaryIndex: number) {
  e.preventDefault();
  e.stopPropagation();
  resizing.value = 'col';
  resizeBoundaryIndex.value = boundaryIndex;
  resizeStartClient.value = { x: e.clientX, y: e.clientY };
  resizeStartColWidths.value = [...colWidths.value];
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', onResizeEnd);
}

function onRowResizeStart(e: MouseEvent, boundaryIndex: number) {
  e.preventDefault();
  e.stopPropagation();
  resizing.value = 'row';
  resizeBoundaryIndex.value = boundaryIndex;
  resizeStartClient.value = { x: e.clientX, y: e.clientY };
  resizeStartRowHeights.value = [...rowHeights.value];
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', onResizeEnd);
}

function onResizeMove(e: MouseEvent) {
  if (!resizing.value || !bodyRef.value) return;
  const rect = bodyRef.value.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  if (resizing.value === 'col') {
    const deltaPct = ((e.clientX - resizeStartClient.value.x) / rect.width) * 100;
    const nextWidths = adjustColBoundary(
      resizeStartColWidths.value,
      resizeBoundaryIndex.value,
      deltaPct
    );
    emit('table-config-change', { ...tableConfig.value, colWidths: nextWidths });
  } else {
    const deltaPct = ((e.clientY - resizeStartClient.value.y) / rect.height) * 100;
    const nextHeights = adjustRowBoundary(
      resizeStartRowHeights.value,
      resizeBoundaryIndex.value,
      deltaPct
    );
    emit('table-config-change', { ...tableConfig.value, rowHeights: nextHeights });
  }
}

function endResize() {
  if (!resizing.value) return;
  resizing.value = null;
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', onResizeEnd);
}

function onResizeEnd() {
  endResize();
}

function onCellDragOver(e: DragEvent, row: number, col: number) {
  if (isCellHidden(tableConfig.value, row, col)) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  setDragOver(row, col);
}

function onCellDragLeave(e: DragEvent, row: number, col: number) {
  e.stopPropagation();
  if (dragOver.value.row === row && dragOver.value.col === col) clearDragOver();
}

function onCellDrop(e: DragEvent, row: number, col: number) {
  if (isCellHidden(tableConfig.value, row, col)) return;
  e.preventDefault();
  e.stopPropagation();
  clearDragOver();
  const raw = e.dataTransfer?.getData('application/x-print-designer');
  if (!raw) return;
  try {
    const { label, kind } = JSON.parse(raw) as { label: string; kind: 'field' | 'component' };
    emit('cell-drop', row, col, label, kind);
  } catch {
    /* ignore */
  }
}

function onCellContextMenu(e: MouseEvent, row: number, col: number) {
  if (isCellHidden(tableConfig.value, row, col)) return;
  e.preventDefault();
  e.stopPropagation();
  menuAnchor.value = { row, col };
  menuPos.value = { x: e.clientX, y: e.clientY };
  menuShow.value = true;
  if (!isCellInSelection(row, col)) {
    emitRange({ startRow: row, startCol: col, endRow: row, endCol: col });
  }
}

function onHandleMouseDown(e: MouseEvent) {
  e.stopPropagation();
  emit('table-drag-start', e);
}

function cellClass(cell: TableCellItem, row: number, col: number) {
  const inSel = isCellInSelection(row, col);
  const { minRow, minCol, maxRow, maxCol } = activeRange.value
    ? normalizeCellRange(activeRange.value)
    : { minRow: -1, minCol: -1, maxRow: -1, maxCol: -1 };
  return {
    'table-cell--empty': cell.type === 'empty',
    'table-cell--header': row === 0 && tableConfig.value.showHeader && cell.type === 'text',
    'table-cell--selected': inSel,
    'table-cell--range-origin': inSel && row === minRow && col === minCol,
    'table-cell--range-edge': inSel && (row === minRow || row === maxRow || col === minCol || col === maxCol),
    'table-cell--drag-over': isCellDragOver(row, col),
    'table-cell--code': cell.type === 'qrcode' || cell.type === 'barcode',
    'table-cell--merged': (cell.rowSpan ?? 1) > 1 || (cell.colSpan ?? 1) > 1
  };
}

const selectionCount = computed(() => {
  if (!activeRange.value) return 0;
  return countCellsInRange(tableConfig.value, activeRange.value);
});

const menuOptions = computed(() => {
  const { row, col } = menuAnchor.value;
  const cfg = tableConfig.value;
  const cell = cfg.cells[row]?.[col];
  const rs = cell?.rowSpan ?? 1;
  const cs = cell?.colSpan ?? 1;
  const canMergeRight = col + cs < cfg.cols && !isCellHidden(cfg, row, col + cs);
  const canMergeDown = row + rs < cfg.rows && !isCellHidden(cfg, row + rs, col);
  const canUnmerge = rs > 1 || cs > 1;
  const canMergeRange = selectionCount.value > 1;

  return [
    { label: '在下方插入行', key: 'insert-row' },
    { label: '在右侧插入列', key: 'insert-col' },
    { type: 'divider', key: 'd1' },
    {
      label: '删除当前行',
      key: 'delete-row',
      disabled: cfg.rows <= 1
    },
    {
      label: '删除当前列',
      key: 'delete-col',
      disabled: cfg.cols <= 1
    },
    { type: 'divider', key: 'd2' },
    {
      label: canMergeRange ? `合并选中区域 (${selectionCount.value} 格)` : '合并选中区域',
      key: 'merge-range',
      disabled: !canMergeRange
    },
    { label: '向右合并', key: 'merge-right', disabled: !canMergeRight },
    { label: '向下合并', key: 'merge-down', disabled: !canMergeDown },
    { label: '拆分单元格', key: 'unmerge', disabled: !canUnmerge }
  ];
});

function onMenuSelect(key: string) {
  menuShow.value = false;
  const action = key as TableContextAction;
  const { row, col } = menuAnchor.value;
  const range = activeRange.value ?? props.selectedRange;
  const next = applyTableContextAction(tableConfig.value, action, row, col, range);
  emit('table-config-change', next);
}

function onMenuClickOutside() {
  menuShow.value = false;
}

onMounted(() => window.addEventListener('mouseup', onWindowMouseUp));
onBeforeUnmount(() => {
  window.removeEventListener('mouseup', onWindowMouseUp);
  endResize();
});
</script>

<template>
  <div class="table-block" @mousedown.stop>
    <div class="table-block__handle" @mousedown="onHandleMouseDown">
      表格 · 拖此移动 · 拖动边界调行列 · 按住拖动多选 · 右键编辑结构
    </div>
    <div ref="bodyRef" class="table-block__body" :class="{ 'table-block__body--resizing': resizing }">
      <table class="table-block__grid" cellspacing="0" cellpadding="0">
        <colgroup>
          <col v-for="(w, colIdx) in colWidths" :key="`col-${colIdx}`" :style="{ width: `${w}%` }" />
        </colgroup>
        <tbody>
          <tr
            v-for="(row, rowIdx) in tableConfig.cells"
            :key="rowIdx"
            :style="{ height: `${rowHeights[rowIdx] ?? 100 / tableConfig.rows}%` }"
          >
          <template v-for="(cell, colIdx) in row" :key="`${rowIdx}-${colIdx}`">
            <td
              v-if="!cell.hidden"
              class="table-cell"
              :class="cellClass(cell, rowIdx, colIdx)"
              :rowspan="cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : undefined"
              :colspan="cell.colSpan && cell.colSpan > 1 ? cell.colSpan : undefined"
              @mousedown="onCellMouseDown($event, rowIdx, colIdx)"
              @mouseenter="onCellMouseEnter(rowIdx, colIdx)"
              @contextmenu="onCellContextMenu($event, rowIdx, colIdx)"
              @dragover="onCellDragOver($event, rowIdx, colIdx)"
              @dragleave="onCellDragLeave($event, rowIdx, colIdx)"
              @drop="onCellDrop($event, rowIdx, colIdx)"
            >
              <template v-if="cell.type === 'qrcode'">
                <span class="table-cell__code-mock" />
                <span class="table-cell__secondary">{{ getTableCellDisplay(cell).secondary }}</span>
              </template>
              <template v-else-if="cell.type === 'barcode'">
                <span class="table-cell__barcode-mock" />
                <span class="table-cell__secondary">{{ getTableCellDisplay(cell).secondary }}</span>
              </template>
              <template v-else>
                <span class="table-cell__primary">{{ getTableCellDisplay(cell).primary }}</span>
                <span v-if="getTableCellDisplay(cell).secondary" class="table-cell__secondary">
                  {{ getTableCellDisplay(cell).secondary }}
                </span>
              </template>
              <span
                v-if="(cell.rowSpan ?? 1) > 1 || (cell.colSpan ?? 1) > 1"
                class="table-cell__merge-badge"
              >
                {{ cell.rowSpan ?? 1 }}×{{ cell.colSpan ?? 1 }}
              </span>
            </td>
          </template>
          </tr>
        </tbody>
      </table>

      <div
        v-for="(left, boundaryIdx) in colBoundaryPcts"
        :key="`col-resize-${boundaryIdx}`"
        class="table-resize table-resize--col"
        :style="{ left: `calc(${left}% - 3px)` }"
        @mousedown="onColResizeStart($event, boundaryIdx)"
      />
      <div
        v-for="(top, boundaryIdx) in rowBoundaryPcts"
        :key="`row-resize-${boundaryIdx}`"
        class="table-resize table-resize--row"
        :style="{ top: `calc(${top}% - 3px)` }"
        @mousedown="onRowResizeStart($event, boundaryIdx)"
      />
    </div>

    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :show="menuShow"
      :x="menuPos.x"
      :y="menuPos.y"
      :options="menuOptions"
      @select="onMenuSelect"
      @clickoutside="onMenuClickOutside"
    />
  </div>
</template>

<style scoped>
.table-block {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.table-block__handle {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 9px;
  color: #6b7280;
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
  cursor: grab;
  user-select: none;
}

.table-block__handle:active {
  cursor: grabbing;
}

.table-block__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-block__body--resizing {
  user-select: none;
}

.table-block__body--resizing .table-resize--col {
  cursor: col-resize;
}

.table-block__body--resizing .table-resize--row {
  cursor: row-resize;
}

.table-resize {
  position: absolute;
  z-index: 4;
  background: transparent;
}

.table-resize--col {
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
}

.table-resize--col:hover,
.table-block__body--resizing .table-resize--col {
  background: rgb(59 130 246 / 25%);
}

.table-resize--row {
  left: 0;
  right: 0;
  height: 6px;
  cursor: row-resize;
}

.table-resize--row:hover,
.table-block__body--resizing .table-resize--row {
  background: rgb(59 130 246 / 25%);
}

.table-block__grid {
  width: 100%;
  height: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: inherit;
  user-select: none;
}

.table-cell {
  position: relative;
  border: 1px solid #9ca3af;
  padding: 3px 4px;
  vertical-align: middle;
  text-align: left;
  overflow: hidden;
  cursor: cell;
  background: #fff;
  transition: background 0.08s;
}

.table-cell--header {
  background: #f9fafb;
  font-weight: 600;
}

.table-cell--empty {
  color: #9ca3af;
  font-size: 0.85em;
  font-style: italic;
}

.table-cell--empty .table-cell__primary {
  color: #9ca3af;
}

.table-cell--selected {
  background: rgb(59 130 246 / 12%);
}

.table-cell--range-origin.table-cell--selected {
  box-shadow: inset 0 0 0 2px var(--n-primary-color);
  background: rgb(59 130 246 / 18%);
}

.table-cell--range-edge.table-cell--selected:not(.table-cell--range-origin) {
  box-shadow: inset 0 0 0 1px rgb(59 130 246 / 55%);
}

.table-cell--drag-over {
  background: rgb(59 130 246 / 22%);
  box-shadow: inset 0 0 0 2px var(--n-primary-color);
}

.table-cell--code {
  text-align: center;
}

.table-cell--merged {
  background: #fafafa;
}

.table-cell--merged.table-cell--selected {
  background: rgb(59 130 246 / 10%);
}

.table-cell__primary {
  display: block;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.92em;
  pointer-events: none;
}

.table-cell__secondary {
  display: block;
  margin-top: 1px;
  font-size: 0.78em;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.table-cell__merge-badge {
  position: absolute;
  top: 1px;
  right: 2px;
  font-size: 8px;
  color: #9ca3af;
  line-height: 1;
  pointer-events: none;
}

.table-cell__code-mock {
  display: inline-block;
  width: 28px;
  height: 28px;
  background:
    linear-gradient(90deg, #111 1px, transparent 1px) 0 0 / 5px 5px,
    linear-gradient(#111 1px, transparent 1px) 0 0 / 5px 5px;
  background-color: #fff;
  border: 1px solid #111;
  vertical-align: middle;
  pointer-events: none;
}

.table-cell__barcode-mock {
  display: block;
  width: 100%;
  height: 14px;
  margin-bottom: 2px;
  background: repeating-linear-gradient(90deg, #111 0, #111 2px, transparent 2px, transparent 4px);
  pointer-events: none;
}
</style>
