import type { DesignerCanvasElement } from './paper-size';
import { createCanvasElement } from './paper-size';
import { emptyCell, normalizeTableConfig, type TableCellItem, type TableConfig } from './table-utils';

const BOL_TABLE_HEADERS = ['No.', 'Container', 'Job NO.', 'operation', 'CTNS', 'PLT', 'SH ID/MARK', 'Refer ID', 'KGS'];

const BOL_SAMPLE_ROW = [
  '',
  'ZCSU6902532',
  'QXY8-260610-5931',
  'Tessa',
  '267',
  '9',
  'FBA19C99C8H8',
  '324ZG3TF',
  '2937.00'
];

export function createBolCargoTableConfig(dataRows = 12): TableConfig {
  const rows = dataRows + 1;
  const cols = BOL_TABLE_HEADERS.length;
  const cells: TableCellItem[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: TableCellItem[] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0) {
        row.push({
          type: 'text',
          label: '',
          text: BOL_TABLE_HEADERS[c],
          rowSpan: 1,
          colSpan: 1,
          hidden: false
        });
      } else if (r === 1) {
        const sample = BOL_SAMPLE_ROW[c];
        if (c === 0) {
          row.push({ type: 'text', label: '', text: '1', rowSpan: 1, colSpan: 1, hidden: false });
        } else if (c === 3) {
          row.push({ type: 'field', label: '操作人', placeholder: '{操作人}', rowSpan: 1, colSpan: 1, hidden: false });
        } else if (c === 4) {
          row.push({ type: 'field', label: '件数', placeholder: '{件数}', rowSpan: 1, colSpan: 1, hidden: false });
        } else if (c === 5) {
          row.push({ type: 'field', label: '板数', placeholder: '{板数}', rowSpan: 1, colSpan: 1, hidden: false });
        } else if (c === 8) {
          row.push({ type: 'field', label: '重量', placeholder: '{重量}', rowSpan: 1, colSpan: 1, hidden: false });
        } else if (sample) {
          row.push({ type: 'text', label: '', text: sample, rowSpan: 1, colSpan: 1, hidden: false });
        } else {
          row.push(emptyCell());
        }
      } else {
        row.push(emptyCell());
      }
    }
    cells.push(row);
  }

  return normalizeTableConfig({
    rows,
    cols,
    cells,
    showHeader: true,
    colWidths: [5, 13, 14, 10, 8, 7, 17, 12, 14],
    rowHeights: Array.from({ length: rows }, (_, i) => (i === 0 ? 8 : (100 - 8) / (rows - 1)))
  });
}

function mkText(
  w: number,
  h: number,
  text: string,
  xPct: number,
  yPct: number,
  widthPct: number,
  heightPx: number,
  extra?: Partial<DesignerCanvasElement>
): DesignerCanvasElement {
  const el = createCanvasElement('文本', 'component', w * xPct, h * yPct);
  el.width = Math.round(w * widthPct);
  el.height = heightPx;
  el.placeholder = text;
  el.showLabel = false;
  el.fontSize = extra?.fontSize ?? 10;
  return { ...el, ...extra };
}

function mkTitle(w: number, h: number, text: string, yPct: number): DesignerCanvasElement {
  const el = createCanvasElement('标题', 'component', w * 0.18, h * yPct);
  el.width = Math.round(w * 0.64);
  el.height = 32;
  el.placeholder = text;
  el.showLabel = false;
  el.fontSize = 18;
  el.fontWeight = 'bold';
  el.textAlign = 'center';
  return el;
}

function mkField(
  w: number,
  h: number,
  label: string,
  xPct: number,
  yPct: number,
  widthPct: number,
  extra?: Partial<DesignerCanvasElement>
): DesignerCanvasElement {
  const el = createCanvasElement(label, 'field', w * xPct, h * yPct);
  el.width = Math.round(w * widthPct);
  el.height = 26;
  el.showLabel = true;
  el.labelLayout = 'horizontal';
  el.fontSize = 10;
  return { ...el, ...extra };
}

/** BOL 提单示例布局（对齐标准出库 BOL 样张结构） */
export function getDefaultElementsForBol(canvasWidth: number, canvasHeight: number): DesignerCanvasElement[] {
  const w = canvasWidth;
  const h = canvasHeight;

  const shipFrom = mkText(
    w,
    h,
    'SHIP FROM:\nForest Shipping USA Inc.\n5125 Schaefer Ave,\nChino, CA 91710',
    0.03,
    0.09,
    0.44,
    68,
    { fontSize: 10, fontWeight: 'bold' }
  );

  const shipTo = mkText(
    w,
    h,
    'SHIP TO:\nPOC2\n4000 Hamner Ave\nOntario CA 91761',
    0.03,
    0.22,
    0.44,
    68,
    { fontSize: 10, fontWeight: 'bold' }
  );

  const bolNo = mkField(w, h, 'BOL号', 0.5, 0.09, 0.46, {
    placeholder: 'QXY8-260610-5931'
  });

  const shipDate = mkField(w, h, '提货日期', 0.5, 0.15, 0.46, {
    placeholder: '06/10/2026 10:30 PDT'
  });

  const trailer = mkField(w, h, '海柜号', 0.5, 0.21, 0.22, {
    placeholder: '亚马逊柜子'
  });

  const dock = mkField(w, h, 'DOCK号', 0.74, 0.21, 0.22);

  const seal = mkText(w, h, 'SEAL NO.: Forest', 0.5, 0.27, 0.22, 24, { fontSize: 10 });
  const weight = mkField(w, h, '重量', 0.74, 0.27, 0.22, { showLabel: true });

  const hline = createCanvasElement('横线', 'component', w * 0.03, h * 0.34);
  hline.width = Math.round(w * 0.94);
  hline.height = 10;
  hline.showLabel = false;

  const billTo = mkText(
    w,
    h,
    'THIRD PARTY FREIGHT CHARGES BILL TO:',
    0.03,
    0.355,
    0.5,
    22,
    { fontSize: 10, fontWeight: 'bold' }
  );

  const table = createCanvasElement('表格', 'component', w * 0.02, h * 0.39);
  table.width = Math.round(w * 0.96);
  table.height = Math.round(h * 0.58);
  table.showLabel = false;
  table.tableConfig = createBolCargoTableConfig(11);

  return [
    mkTitle(w, h, 'BILL OF LADING', 0.02),
    shipFrom,
    shipTo,
    bolNo,
    shipDate,
    trailer,
    dock,
    seal,
    weight,
    hline,
    billTo,
    table
  ];
}
