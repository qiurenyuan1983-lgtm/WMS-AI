import type { DesignerCanvasElement } from './paper-size';

export type TableCellItem = {
  type: 'empty' | 'text' | 'field' | 'qrcode' | 'barcode' | 'component';
  label: string;
  placeholder?: string;
  bindField?: string;
  text?: string;
  rowSpan?: number;
  colSpan?: number;
  /** 被合并覆盖的格子，渲染时跳过 */
  hidden?: boolean;
};

export type TableConfig = {
  rows: number;
  cols: number;
  cells: TableCellItem[][];
  showHeader?: boolean;
  /** 各列宽度占比，合计 100 */
  colWidths?: number[];
  /** 各行高度占比，合计 100 */
  rowHeights?: number[];
};

export const TABLE_MIN_COL_PCT = 6;
export const TABLE_MIN_ROW_PCT = 8;

function equalSplit(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor((10000 / count)) / 100;
  const arr = Array.from({ length: count }, () => base);
  arr[0] = Math.round((arr[0] + (100 - arr.reduce((s, v) => s + v, 0))) * 100) / 100;
  return arr;
}

function renormalizeTo100(values: number[]): number[] {
  if (!values.length) return [];
  const sum = values.reduce((a, b) => a + b, 0) || 1;
  const scaled = values.map(v => (v / sum) * 100);
  const rounded = scaled.map(v => Math.round(v * 100) / 100);
  rounded[0] = Math.round((rounded[0] + (100 - rounded.reduce((s, v) => s + v, 0))) * 100) / 100;
  return rounded;
}

function normalizeTableSizes(config: TableConfig): Pick<TableConfig, 'colWidths' | 'rowHeights'> {
  let colWidths = [...(config.colWidths ?? equalSplit(config.cols))];
  let rowHeights = [...(config.rowHeights ?? equalSplit(config.rows))];

  while (colWidths.length < config.cols) {
    const extra = 100 / config.cols;
    colWidths = renormalizeTo100([...colWidths, extra]);
  }
  if (colWidths.length > config.cols) colWidths = colWidths.slice(0, config.cols);

  while (rowHeights.length < config.rows) {
    const extra = 100 / config.rows;
    rowHeights = renormalizeTo100([...rowHeights, extra]);
  }
  if (rowHeights.length > config.rows) rowHeights = rowHeights.slice(0, config.rows);

  return {
    colWidths: renormalizeTo100(colWidths),
    rowHeights: renormalizeTo100(rowHeights)
  };
}

export function getColBoundaryPercents(colWidths: number[]): number[] {
  const boundaries: number[] = [];
  let acc = 0;
  for (let i = 0; i < colWidths.length - 1; i++) {
    acc += colWidths[i];
    boundaries.push(acc);
  }
  return boundaries;
}

export function getRowBoundaryPercents(rowHeights: number[]): number[] {
  return getColBoundaryPercents(rowHeights);
}

export function adjustColBoundary(
  colWidths: number[],
  boundaryIndex: number,
  deltaPct: number
): number[] {
  const next = [...colWidths];
  const i = boundaryIndex;
  if (i < 0 || i >= next.length - 1) return next;
  const pairSum = next[i] + next[i + 1];
  const left = Math.max(TABLE_MIN_COL_PCT, Math.min(pairSum - TABLE_MIN_COL_PCT, next[i] + deltaPct));
  next[i] = Math.round(left * 100) / 100;
  next[i + 1] = Math.round((pairSum - left) * 100) / 100;
  return renormalizeTo100(next);
}

export function adjustRowBoundary(
  rowHeights: number[],
  boundaryIndex: number,
  deltaPct: number
): number[] {
  return adjustColBoundary(rowHeights, boundaryIndex, deltaPct);
}

export type TableCellRange = {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
};

export function normalizeCellRange(range: TableCellRange) {
  return {
    minRow: Math.min(range.startRow, range.endRow),
    maxRow: Math.max(range.startRow, range.endRow),
    minCol: Math.min(range.startCol, range.endCol),
    maxCol: Math.max(range.startCol, range.endCol)
  };
}

export function isCellInRange(
  config: TableConfig,
  row: number,
  col: number,
  range: TableCellRange | null | undefined
): boolean {
  if (!range) return false;
  if (isCellHidden(config, row, col)) return false;
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
}

export function countCellsInRange(config: TableConfig, range: TableCellRange): number {
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  let count = 0;
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (!isCellHidden(config, r, c)) count++;
    }
  }
  return count;
}

export function getRangeAnchor(range: TableCellRange) {
  const { minRow, minCol } = normalizeCellRange(range);
  return { row: minRow, col: minCol };
}

const MAX_ROWS = 20;
const MAX_COLS = 12;

export function isTableElement(el: DesignerCanvasElement): boolean {
  return el.label === '表格';
}

export function emptyCell(): TableCellItem {
  return { type: 'empty', label: '', rowSpan: 1, colSpan: 1, hidden: false };
}

function normalizeCell(cell: TableCellItem): TableCellItem {
  return {
    ...cell,
    rowSpan: Math.max(1, cell.rowSpan ?? 1),
    colSpan: Math.max(1, cell.colSpan ?? 1),
    hidden: Boolean(cell.hidden)
  };
}

/** 根据 rowSpan/colSpan 重算 hidden 标记 */
export function normalizeTableConfig(config: TableConfig): TableConfig {
  const rows = config.rows;
  const cols = config.cols;
  const cells: TableCellItem[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: TableCellItem[] = [];
    for (let c = 0; c < cols; c++) {
      const prev = config.cells[r]?.[c];
      row.push(normalizeCell(prev ? { ...prev, hidden: false } : emptyCell()));
    }
    cells.push(row);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      const rs = cell.rowSpan ?? 1;
      const cs = cell.colSpan ?? 1;
      for (let dr = 0; dr < rs; dr++) {
        for (let dc = 0; dc < cs; dc++) {
          if (dr === 0 && dc === 0) continue;
          const tr = r + dr;
          const tc = c + dc;
          if (tr < rows && tc < cols) {
            cells[tr][tc] = { ...emptyCell(), hidden: true };
          }
        }
      }
    }
  }

  const sizes = normalizeTableSizes({ ...config, rows, cols, cells });
  return { ...config, rows, cols, cells, ...sizes };
}

export function createDefaultTableConfig(rows = 3, cols = 3): TableConfig {
  const headerLabels = ['字段', '值', '备注', '说明', '数量'];
  const cells: TableCellItem[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: TableCellItem[] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0) {
        row.push({
          type: 'text',
          label: '',
          text: headerLabels[c] ?? `列${c + 1}`,
          rowSpan: 1,
          colSpan: 1,
          hidden: false
        });
      } else {
        row.push(emptyCell());
      }
    }
    cells.push(row);
  }
  return normalizeTableConfig({ rows, cols, cells, showHeader: true });
}

export function resizeTableConfig(config: TableConfig, rows: number, cols: number): TableConfig {
  const nextRows = Math.max(1, Math.min(MAX_ROWS, rows));
  const nextCols = Math.max(1, Math.min(MAX_COLS, cols));
  const cells: TableCellItem[][] = [];
  for (let r = 0; r < nextRows; r++) {
    const row: TableCellItem[] = [];
    for (let c = 0; c < nextCols; c++) {
      const prev = config.cells[r]?.[c];
      row.push(prev ? normalizeCell({ ...prev }) : emptyCell());
    }
    cells.push(row);
  }
  return normalizeTableConfig({ ...config, rows: nextRows, cols: nextCols, cells });
}

export function addTableRow(config: TableConfig, afterRow: number): TableConfig {
  if (config.rows >= MAX_ROWS) return config;
  const insertAt = Math.min(afterRow + 1, config.rows);
  const newRow = Array.from({ length: config.cols }, () => emptyCell());
  const cells = config.cells.map(row => row.map(c => ({ ...c })));
  cells.splice(insertAt, 0, newRow);
  const sizes = normalizeTableSizes(config);
  const rowHeights = [...sizes.rowHeights];
  const split = rowHeights[Math.min(afterRow, rowHeights.length - 1)] / 2;
  rowHeights[Math.min(afterRow, rowHeights.length - 1)] = split;
  rowHeights.splice(insertAt, 0, split);
  return normalizeTableConfig({ ...config, rows: config.rows + 1, cells, rowHeights });
}

export function addTableCol(config: TableConfig, afterCol: number): TableConfig {
  if (config.cols >= MAX_COLS) return config;
  const insertAt = Math.min(afterCol + 1, config.cols);
  const cells = config.cells.map((row, r) => {
    const next = row.map(c => ({ ...c }));
    next.splice(insertAt, 0, r === 0 && config.showHeader ? { type: 'text', label: '', text: `列${insertAt + 1}`, rowSpan: 1, colSpan: 1, hidden: false } : emptyCell());
    return next;
  });
  const sizes = normalizeTableSizes(config);
  const colWidths = [...sizes.colWidths];
  const split = colWidths[Math.min(afterCol, colWidths.length - 1)] / 2;
  colWidths[Math.min(afterCol, colWidths.length - 1)] = split;
  colWidths.splice(insertAt, 0, split);
  return normalizeTableConfig({ ...config, cols: config.cols + 1, cells, colWidths });
}

export function deleteTableRow(config: TableConfig, rowIndex: number): TableConfig {
  if (config.rows <= 1) return config;
  const cells = config.cells.filter((_, idx) => idx !== rowIndex).map(row => row.map(c => ({ ...c })));
  const sizes = normalizeTableSizes(config);
  const rowHeights = sizes.rowHeights.filter((_, idx) => idx !== rowIndex);
  const removed = sizes.rowHeights[rowIndex] ?? 0;
  const neighbor = rowIndex > 0 ? rowIndex - 1 : 0;
  if (rowHeights[neighbor] != null) rowHeights[neighbor] += removed;
  return normalizeTableConfig({ ...config, rows: config.rows - 1, cells, rowHeights });
}

export function deleteTableCol(config: TableConfig, colIndex: number): TableConfig {
  if (config.cols <= 1) return config;
  const cells = config.cells.map(row => row.filter((_, idx) => idx !== colIndex).map(c => ({ ...c })));
  const sizes = normalizeTableSizes(config);
  const colWidths = sizes.colWidths.filter((_, idx) => idx !== colIndex);
  const removed = sizes.colWidths[colIndex] ?? 0;
  const neighbor = colIndex > 0 ? colIndex - 1 : 0;
  if (colWidths[neighbor] != null) colWidths[neighbor] += removed;
  return normalizeTableConfig({ ...config, cols: config.cols - 1, cells, colWidths });
}

function canMergeRect(config: TableConfig, r: number, c: number, rowSpan: number, colSpan: number): boolean {
  if (r + rowSpan > config.rows || c + colSpan > config.cols) return false;
  for (let dr = 0; dr < rowSpan; dr++) {
    for (let dc = 0; dc < colSpan; dc++) {
      const cell = config.cells[r + dr]?.[c + dc];
      if (!cell) return false;
      if (dr === 0 && dc === 0) continue;
      if (cell.hidden) continue;
      if ((cell.rowSpan ?? 1) > 1 || (cell.colSpan ?? 1) > 1) return false;
    }
  }
  return true;
}

export function mergeCellRight(config: TableConfig, row: number, col: number): TableConfig {
  const cell = config.cells[row]?.[col];
  if (!cell || cell.hidden) return config;
  const cs = cell.colSpan ?? 1;
  const nextCol = col + cs;
  if (nextCol >= config.cols) return config;
  const target = config.cells[row][nextCol];
  if (target.hidden) return config;
  const newSpan = cs + (target.colSpan ?? 1);
  if (!canMergeRect(config, row, col, cell.rowSpan ?? 1, newSpan)) return config;
  const cells = config.cells.map(r => r.map(c => ({ ...c })));
  cells[row][col] = { ...cells[row][col], colSpan: newSpan };
  return normalizeTableConfig({ ...config, cells });
}

export function mergeCellDown(config: TableConfig, row: number, col: number): TableConfig {
  const cell = config.cells[row]?.[col];
  if (!cell || cell.hidden) return config;
  const rs = cell.rowSpan ?? 1;
  const cs = cell.colSpan ?? 1;
  const nextRow = row + rs;
  if (nextRow >= config.rows) return config;
  const target = config.cells[nextRow]?.[col];
  if (!target || target.hidden) return config;
  const newRowSpan = rs + (target.rowSpan ?? 1);
  if (!canMergeRect(config, row, col, newRowSpan, cs)) return config;
  const cells = config.cells.map(r => r.map(c => ({ ...c })));
  cells[row][col] = { ...cells[row][col], rowSpan: newRowSpan };
  return normalizeTableConfig({ ...config, cells });
}

export function setCellSpan(config: TableConfig, row: number, col: number, rowSpan: number, colSpan: number): TableConfig {
  const rs = Math.max(1, Math.min(rowSpan, config.rows - row));
  const cs = Math.max(1, Math.min(colSpan, config.cols - col));
  if (!canMergeRect(config, row, col, rs, cs)) return config;
  const cells = config.cells.map(r => r.map(c => ({ ...c })));
  cells[row][col] = { ...cells[row][col], rowSpan: rs, colSpan: cs };
  return normalizeTableConfig({ ...config, cells });
}

export function mergeCellRange(config: TableConfig, range: TableCellRange): TableConfig {
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  const rowSpan = maxRow - minRow + 1;
  const colSpan = maxCol - minCol + 1;
  if (rowSpan === 1 && colSpan === 1) return config;
  return setCellSpan(config, minRow, minCol, rowSpan, colSpan);
}

export function unmergeCell(config: TableConfig, row: number, col: number): TableConfig {
  const cell = config.cells[row]?.[col];
  if (!cell) return config;
  const cells = config.cells.map(r => r.map(c => ({ ...c })));
  cells[row][col] = { ...cells[row][col], rowSpan: 1, colSpan: 1 };
  return normalizeTableConfig({ ...config, cells });
}

export function isCellHidden(config: TableConfig, row: number, col: number): boolean {
  return Boolean(config.cells[row]?.[col]?.hidden);
}

export function cellItemFromDrop(label: string, kind: 'field' | 'component'): TableCellItem {
  const base = { rowSpan: 1, colSpan: 1, hidden: false as const };
  if (label === '表格') {
    return { type: 'text', label: '', text: '嵌套表格', ...base };
  }
  if (label === '二维码') {
    return { type: 'qrcode', label, bindField: '卡板号', placeholder: '{卡板号}', ...base };
  }
  if (label === '条形码') {
    return { type: 'barcode', label, placeholder: `{${label}}`, ...base };
  }
  if (label === '横线') {
    return { type: 'text', label: '', text: '────────', ...base };
  }
  if (label === '竖线') {
    return { type: 'text', label: '', text: '│', ...base };
  }
  if (label === '方框') {
    return { type: 'text', label: '', text: '□', ...base };
  }
  if (label === '页码') {
    return { type: 'text', label: '', text: '1 / 1', ...base };
  }
  if (label === '号码排列') {
    return { type: 'text', label: '号码排列', text: '1\n2\n3', ...base };
  }
  if (label === '日期') {
    return { type: 'text', label: '', text: '2026-06-03', ...base };
  }
  if (label === '文本' || label === '标题') {
    return { type: 'text', label: '', text: label === '标题' ? '标题文字' : '', ...base };
  }
  if (label === '动态字段') {
    return { type: 'field', label: '动态字段', placeholder: '{订单号}', bindField: '订单号', ...base };
  }
  if (kind === 'field') {
    return { type: 'field', label, placeholder: `{${label}}`, ...base };
  }
  return { type: 'component', label, placeholder: label, ...base };
}

export function getTableCellDisplay(cell: TableCellItem): { primary: string; secondary: string } {
  if (cell.type === 'empty') {
    return { primary: '拖入字段/组件', secondary: '' };
  }
  if (cell.type === 'text') {
    return { primary: cell.text || '文本', secondary: '' };
  }
  if (cell.type === 'qrcode') {
    return { primary: '二维码', secondary: cell.bindField ? `{${cell.bindField}}` : cell.placeholder || '' };
  }
  if (cell.type === 'barcode') {
    return { primary: '条形码', secondary: cell.placeholder || `{${cell.label}}` };
  }
  if (cell.type === 'field') {
    return { primary: cell.label, secondary: cell.placeholder || `{${cell.label}}` };
  }
  return { primary: cell.label, secondary: cell.placeholder || '' };
}

export function ensureTableConfig(el: DesignerCanvasElement): TableConfig {
  if (el.tableConfig) return normalizeTableConfig(el.tableConfig);
  return createDefaultTableConfig(3, 3);
}

export type TableContextAction =
  | 'insert-row'
  | 'insert-col'
  | 'delete-row'
  | 'delete-col'
  | 'merge-right'
  | 'merge-down'
  | 'merge-range'
  | 'unmerge';

export function applyTableContextAction(
  config: TableConfig,
  action: TableContextAction,
  row: number,
  col: number,
  range?: TableCellRange | null
): TableConfig {
  switch (action) {
    case 'insert-row':
      return addTableRow(config, row);
    case 'insert-col':
      return addTableCol(config, col);
    case 'delete-row':
      return deleteTableRow(config, row);
    case 'delete-col':
      return deleteTableCol(config, col);
    case 'merge-right':
      return mergeCellRight(config, row, col);
    case 'merge-down':
      return mergeCellDown(config, row, col);
    case 'merge-range':
      return range ? mergeCellRange(config, range) : config;
    case 'unmerge':
      return unmergeCell(config, row, col);
    default:
      return config;
  }
}
