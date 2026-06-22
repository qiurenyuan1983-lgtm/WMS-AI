import type { DesignerCanvasElement, PaperOrientation, PaperPresetKey } from './paper-size';
import { resolvePaperDimensions } from './paper-size';
import {
  getDateComponentDisplay,
  getDynamicFieldDisplay,
  getNumberSequenceDisplay,
  getPageNumberDisplay,
  isDecorativeComponent,
  isDynamicFieldComponent,
  isNumberSequenceComponent
} from './component-registry';
import {
  getFieldSampleValue,
  PALLET_LABEL_SAMPLE_DATA,
  formatPreviewLine,
  isElementVisible,
  isPreviewVerticalLayout,
  shouldShowLabel
} from './field-display';
import { generateQrcodeDataUrl, getQrcodeBindField, resolveQrcodeContent } from './qrcode-render';
import { ensureTableConfig, type TableCellItem } from './table-utils';

export { PALLET_LABEL_SAMPLE_DATA };

let previewDataOverrides: Record<string, string> | undefined;

function resolveFieldValue(label: string, placeholder?: string, overrides?: Record<string, string>): string {
  if (overrides?.[label]) return overrides[label];
  return getFieldSampleValue(label, placeholder);
}

function sampleValueForElement(el: DesignerCanvasElement, overrides?: Record<string, string>): string {
  const data = overrides ?? previewDataOverrides;
  if (el.kind === 'component') {
    if (el.label === '文本' || el.label === '标题') return el.placeholder?.trim() || '';
    if (el.label === '动态字段') {
      const field = el.bindField || '订单号';
      return resolveFieldValue(field, `{${field}}`, data);
    }
    if (el.label === '页码') return getPageNumberDisplay();
    if (el.label === '号码排列') return getNumberSequenceDisplay(el);
    if (el.label === '日期') return getDateComponentDisplay(el);
    if (el.label === '自定义说明') return '请核对板数与箱数';
    if (el.label === '合计金额') return '—';
    return el.placeholder;
  }
  return resolveFieldValue(el.label, el.placeholder, data);
}

function isLogoLabel(label: string) {
  return label === '公司Logo' || label === '图片';
}

function previewComponentLabel(el: DesignerCanvasElement): string {
  if (!shouldShowLabel(el)) return '';
  return `<span class="component-label">${escapeHtml(el.label)}</span>`;
}

function withComponentLabelClass(el: DesignerCanvasElement, baseClass: string): string {
  return shouldShowLabel(el) ? `${baseClass} el--with-component-label` : baseClass;
}

function buildDecorativeElementHtml(el: DesignerCanvasElement, style: string): string {
  const label = previewComponentLabel(el);
  if (el.label === '横线') {
    const cls = withComponentLabelClass(el, 'el el-deco el-deco-h');
    return `<div class="${cls}" style="${style}">${label}<div class="deco-h-line"></div></div>`;
  }
  if (el.label === '竖线') {
    const cls = withComponentLabelClass(el, 'el el-deco el-deco-v');
    return `<div class="${cls}" style="${style}">${label}<div class="deco-v-line"></div></div>`;
  }
  if (el.label === '方框') {
    const cls = withComponentLabelClass(el, 'el el-deco el-deco-box');
    return `<div class="${cls}" style="${style}">${label}<div class="deco-box"></div></div>`;
  }
  if (el.label === '页码') {
    const cls = withComponentLabelClass(el, 'el el-deco el-deco-page');
    return `<div class="${cls}" style="${style}">${label}<span>${escapeHtml(getPageNumberDisplay())}</span></div>`;
  }
  if (el.label === '号码排列') {
    const cls = withComponentLabelClass(el, 'el el-deco el-deco-number-seq');
    const lines = getNumberSequenceDisplay(el)
      .split('\n')
      .map(n => `<div class="number-seq-line">${escapeHtml(n)}</div>`)
      .join('');
    return `<div class="${cls}" style="${style}">${label}<div class="number-seq">${lines}</div></div>`;
  }
  if (el.label === '日期') {
    const cls = withComponentLabelClass(el, 'el el-deco el-deco-date');
    return `<div class="${cls}" style="${style}">${label}<span>${escapeHtml(getDateComponentDisplay(el))}</span></div>`;
  }
  if (el.label === '动态字段') {
    const cls = withComponentLabelClass(el, 'el el-deco el-deco-dynamic');
    const field = el.bindField || '订单号';
    const value = escapeHtml(getFieldSampleValue(field, getDynamicFieldDisplay(el)));
    const line = shouldShowLabel(el) ? `${escapeHtml(el.label)}：${value}` : value;
    return `<div class="${cls}" style="${style}"><span class="dynamic-field-value">${line}</span></div>`;
  }
  return `<div class="el el-field" style="${style}">${escapeHtml(el.label)}</div>`;
}

function elementPositionStyle(el: DesignerCanvasElement, widthPx: number, heightPx: number): string {
  const leftPct = ((el.x / widthPx) * 100).toFixed(2);
  const topPct = ((el.y / heightPx) * 100).toFixed(2);
  const widthPct = Math.min(100, ((el.width / widthPx) * 100)).toFixed(2);
  const minHeightPct = ((el.height / heightPx) * 100).toFixed(2);
  return [
    `left:${leftPct}%`,
    `top:${topPct}%`,
    `width:${widthPct}%`,
    `min-width:max-content`,
    `min-height:${minHeightPct}%`,
    `font-size:${el.fontSize}pt`,
    `font-weight:${el.fontWeight}`,
    `text-align:${el.textAlign}`
  ].join(';');
}

async function buildQrcodeElementHtml(el: DesignerCanvasElement, widthPx: number, heightPx: number): Promise<string> {
  const style = elementPositionStyle(el, widthPx, heightPx);
  const field = getQrcodeBindField(el);
  const content = previewDataOverrides?.[field]
    ? previewDataOverrides[field]
    : resolveQrcodeContent(el, true);
  const dataUrl = await generateQrcodeDataUrl(content, el.width);
  const bindField = getQrcodeBindField(el);
  const labelHtml =
    el.showBindFieldLabel !== false ? `<span class="qrcode-bind-label">${bindField}</span>` : '';
  const cls = withComponentLabelClass(el, 'el el-qrcode');
  return `<div class="${cls}" style="${style}">${previewComponentLabel(el)}<img class="qrcode-img" src="${dataUrl}" alt="${bindField}" />${labelHtml}</div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTableCellHtml(cell: TableCellItem): string {
  if (cell.type === 'empty') return '&nbsp;';
  if (cell.type === 'text') return escapeHtml(cell.text || '');
  if (cell.type === 'qrcode') {
    const field = cell.bindField || '卡板号';
    return `<span class="table-cell-qrcode-mock"></span><span class="table-cell-sub">${escapeHtml(getFieldSampleValue(field, cell.placeholder))}</span>`;
  }
  if (cell.type === 'barcode') {
    return `<span class="table-cell-barcode-mock"></span><span class="table-cell-sub">${escapeHtml(sampleValueForCell(cell))}</span>`;
  }
  if (cell.type === 'field') {
    const value = getFieldSampleValue(cell.label, cell.placeholder);
    return `<span class="table-cell-label">${escapeHtml(cell.label)}</span><span class="table-cell-value">${escapeHtml(value)}</span>`;
  }
  return escapeHtml(cell.label || cell.placeholder || '');
}

function sampleValueForCell(cell: TableCellItem): string {
  if (cell.type === 'field') return getFieldSampleValue(cell.label, cell.placeholder);
  if (cell.placeholder) return getFieldSampleValue(cell.label, cell.placeholder);
  return cell.label;
}

function buildTableElementHtml(el: DesignerCanvasElement, widthPx: number, heightPx: number): string {
  const style = elementPositionStyle(el, widthPx, heightPx);
  const config = ensureTableConfig(el);
  const colWidths = config.colWidths ?? [];
  const rowHeights = config.rowHeights ?? [];
  const colgroupHtml =
    colWidths.length > 0
      ? `<colgroup>${colWidths.map(w => `<col style="width:${w}%">`).join('')}</colgroup>`
      : '';
  const rowsHtml = config.cells
    .map((row, rowIdx) => {
      const rowH = rowHeights[rowIdx];
      const rowStyle = rowH != null ? ` style="height:${rowH}%"` : '';
      const cellsHtml = row
        .map((cell, colIdx) => {
          if (cell.hidden) return '';
          const attrs: string[] = [];
          const rs = cell.rowSpan ?? 1;
          const cs = cell.colSpan ?? 1;
          if (rs > 1) attrs.push(`rowspan="${rs}"`);
          if (cs > 1) attrs.push(`colspan="${cs}"`);
          const thCls = rowIdx === 0 && config.showHeader && cell.type === 'text' ? 'table-th' : '';
          const cls = thCls ? ` class="${thCls}"` : '';
          const attrStr = attrs.length ? ` ${attrs.join(' ')}` : '';
          return `<td${cls}${attrStr}>${buildTableCellHtml(cell)}</td>`;
        })
        .join('');
      return `<tr${rowStyle}>${cellsHtml}</tr>`;
    })
    .join('');
  const tableClass = withComponentLabelClass(el, 'el el-table');
  const label = previewComponentLabel(el);
  return `<div class="${tableClass}" style="${style}">${label}<table class="designer-print-table">${colgroupHtml}<tbody>${rowsHtml}</tbody></table></div>`;
}

function buildElementHtml(el: DesignerCanvasElement, widthPx: number, heightPx: number): string {
  if (!isElementVisible(el)) return '';

  const style = elementPositionStyle(el, widthPx, heightPx);

  if (el.label === '表格') {
    return buildTableElementHtml(el, widthPx, heightPx);
  }

  if (el.label === '二维码') {
    const cls = withComponentLabelClass(el, 'el el-qrcode');
    return `<div class="${cls}" style="${style}">${previewComponentLabel(el)}<div class="qrcode-mock"></div></div>`;
  }
  if (el.label === '条形码') {
    const cls = withComponentLabelClass(el, 'el el-barcode');
    return `<div class="${cls}" style="${style}">${previewComponentLabel(el)}<div class="barcode-mock"></div><span>${sampleValueForElement(el)}</span></div>`;
  }
  if (isLogoLabel(el.label)) {
    const cls = withComponentLabelClass(el, 'el el-logo');
    const label = previewComponentLabel(el);
    if (el.imageSrc) {
      const src = el.imageSrc.replace(/"/g, '&quot;');
      return `<div class="${cls}" style="${style}">${label}<img class="el-logo-img" src="${src}" alt="" /></div>`;
    }
    return `<div class="${cls}" style="${style}">${label}${el.label === '图片' ? '图片' : 'LOGO'}</div>`;
  }
  if (el.label === '签名栏') {
    const cls = withComponentLabelClass(el, 'el el-signature');
    const label = previewComponentLabel(el);
    if (el.imageSrc) {
      const src = el.imageSrc.replace(/"/g, '&quot;');
      return `<div class="${cls}" style="${style}">${label}<img class="el-signature-img" src="${src}" alt="" /></div>`;
    }
    return `<div class="${cls} el-signature--empty" style="${style}">${label}<span class="el-signature-line"></span></div>`;
  }
  if (el.label === '文本' || el.label === '标题') {
    const cls = withComponentLabelClass(el, `el el-text${el.label === '标题' ? ' el-title' : ''}`);
    const text = escapeHtml(el.placeholder?.trim() || '');
    return `<div class="${cls}" style="${style}">${previewComponentLabel(el)}<span class="text-content">${text}</span></div>`;
  }
  if (isDecorativeComponent(el) || isDynamicFieldComponent(el) || isNumberSequenceComponent(el)) {
    return buildDecorativeElementHtml(el, style);
  }

  const value = sampleValueForElement(el);
  if (isPreviewVerticalLayout(el)) {
    return `<div class="el el-field el-field--vertical" style="${style}"><span class="field-label">${el.label}：</span><span class="field-value">${value}</span></div>`;
  }
  const line = formatPreviewLine(el, value);
  if (el.label === '仓库名称') {
    return `<div class="el el-warehouse" style="${style}">${line}</div>`;
  }
  if (el.label === '高货值标识' || el.label === 'HOLD标识' || el.label === 'MIX混货标识') {
    return `<div class="el el-alert" style="${style}">${line}</div>`;
  }
  if (el.label === '卡板号') {
    return `<div class="el el-pallet-no" style="${style}">${line}</div>`;
  }

  return `<div class="el el-field" style="${style}">${line}</div>`;
}

async function buildElementHtmlAsync(el: DesignerCanvasElement, widthPx: number, heightPx: number): Promise<string> {
  if (el.label === '二维码' && isElementVisible(el)) {
    return buildQrcodeElementHtml(el, widthPx, heightPx);
  }
  return buildElementHtml(el, widthPx, heightPx);
}

function buildDefaultPalletLabelHtml(widthMm: number, heightMm: number): string {
  return `
    <div class="pallet-label pallet-label--default" style="width:${widthMm}mm;height:${heightMm}mm">
      <div class="warehouse-title">FOREST WAREHOUSE</div>
      <div class="field-row"><span class="lbl">客户名称：</span>ANKER</div>
      <div class="field-row"><span class="lbl">订单号：</span>FSHY2508058785</div>
      <div class="field-row"><span class="lbl">海柜号：</span>FSCU1234567</div>
      <div class="field-row"><span class="lbl">目的地：</span>XLX7</div>
      <div class="field-row pallet-no"><span class="lbl">卡板号：</span>LA-20260603-0001</div>
      <div class="field-row"><span class="lbl">箱数：</span>48 CTNS</div>
      <div class="field-row"><span class="lbl">库位：</span>A09-01</div>
      <div class="qrcode-block"><div class="qrcode-mock"></div></div>
      <div class="alert-bar">高货值货物 / HIGH VALUE</div>
    </div>
  `;
}

export type PalletLabelPreviewOptions = {
  elements: DesignerCanvasElement[];
  paperSize: PaperPresetKey | string;
  orientation: PaperOrientation;
  dataOverrides?: Record<string, string>;
};

export function buildPalletLabelPreviewHtml(options: PalletLabelPreviewOptions): string {
  previewDataOverrides = options.dataOverrides;
  try {
    const dim = resolvePaperDimensions(options.paperSize, options.orientation);

    if (!options.elements.length) {
      return buildDefaultPalletLabelHtml(dim.widthMm, dim.heightMm);
    }

    const elementsHtml = options.elements
      .map(el => buildElementHtml(el, dim.widthPx, dim.heightPx))
      .join('');

    return `
    <div class="pallet-label pallet-label--designed" style="width:${dim.widthMm}mm;height:${dim.heightMm}mm">
      ${elementsHtml}
    </div>
  `;
  } finally {
    previewDataOverrides = undefined;
  }
}

export async function buildPalletLabelPreviewHtmlAsync(options: PalletLabelPreviewOptions): Promise<string> {
  previewDataOverrides = options.dataOverrides;
  try {
    const dim = resolvePaperDimensions(options.paperSize, options.orientation);

    if (!options.elements.length) {
      return buildDefaultPalletLabelHtml(dim.widthMm, dim.heightMm);
    }

    const parts = await Promise.all(
      options.elements.map(el => buildElementHtmlAsync(el, dim.widthPx, dim.heightPx))
    );

    return `
    <div class="pallet-label pallet-label--designed" style="width:${dim.widthMm}mm;height:${dim.heightMm}mm">
      ${parts.join('')}
    </div>
  `;
  } finally {
    previewDataOverrides = undefined;
  }
}

export const PALLET_LABEL_PREVIEW_STYLES = `
  .preview-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 8px 0 16px;
    font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
  .preview-hint {
    font-size: 13px;
    color: #6b7280;
    text-align: center;
    margin: 0;
  }
  .preview-scale {
    display: flex;
    justify-content: center;
    padding: 24px;
    background: #f3f4f6;
    border-radius: 8px;
    overflow: auto;
    max-width: 100%;
    min-height: 200px;
  }
  .pallet-label {
    position: relative;
    background: #fff;
    border: 2px solid #111;
    box-sizing: border-box;
    color: #111;
    overflow: visible;
    box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
  }
  .pallet-label--default {
    padding: 10mm 8mm;
    display: flex;
    flex-direction: column;
    gap: 3mm;
    overflow: hidden;
  }
  .warehouse-title {
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 4mm;
    border-bottom: 1px solid #ddd;
    padding-bottom: 3mm;
  }
  .field-row {
    font-size: 11pt;
    line-height: 1.45;
  }
  .field-row .lbl {
    color: #374151;
  }
  .field-row.pallet-no {
    font-size: 13pt;
    font-weight: 700;
    margin: 2mm 0;
  }
  .qrcode-block {
    position: absolute;
    right: 8mm;
    top: 28mm;
    width: 28mm;
    height: 28mm;
  }
  .alert-bar {
    margin-top: auto;
    padding: 3mm 4mm;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    font-size: 10pt;
    font-weight: 600;
    text-align: center;
  }
  .pallet-label--designed .el-field--vertical {
    display: flex;
    flex-direction: column;
    gap: 1px;
    white-space: normal;
  }
  .pallet-label--designed .el-field--vertical .field-label {
    color: #4b5563;
    font-weight: 600;
  }
  .pallet-label--designed .el {
    position: absolute;
    box-sizing: border-box;
    line-height: 1.35;
    overflow: visible;
    white-space: nowrap;
  }
  .pallet-label--designed .el .lbl {
    color: #4b5563;
  }
  .pallet-label--designed .el-warehouse {
    font-weight: 700;
    font-size: 13pt !important;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 2mm;
  }
  .pallet-label--designed .el-pallet-no {
    font-weight: 700;
  }
  .pallet-label--designed .el-alert {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    font-weight: 600;
    padding: 2px 4px;
    white-space: normal;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .qrcode-mock {
    width: 100%;
    height: 100%;
    background:
      linear-gradient(90deg, #111 2px, transparent 2px) 0 0 / 8px 8px,
      linear-gradient(#111 2px, transparent 2px) 0 0 / 8px 8px;
    background-color: #fff;
    border: 1px solid #111;
  }
  .el-qrcode {
    padding: 2px;
    white-space: normal;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .el-qrcode .qrcode-img {
    width: 100%;
    height: auto;
    max-height: calc(100% - 10pt);
    object-fit: contain;
    display: block;
  }
  .el-qrcode .qrcode-bind-label {
    font-size: 7pt;
    color: #6b7280;
    text-align: center;
    line-height: 1.2;
  }
  .el-barcode {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    white-space: normal;
  }
  .barcode-mock {
    width: 100%;
    height: 60%;
    background: repeating-linear-gradient(
      90deg,
      #111 0,
      #111 2px,
      transparent 2px,
      transparent 4px
    );
  }
  .el-barcode span {
    font-size: 8pt;
    color: #666;
  }
  .el--with-component-label {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
  }
  .component-label {
    display: block;
    font-size: 0.82em;
    font-weight: 600;
    color: #374151;
    line-height: 1.2;
    flex-shrink: 0;
  }
  .el-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    font-size: 10pt;
    color: #9ca3af;
    white-space: normal;
    overflow: hidden;
  }
  .el-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .el-signature {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: #fff;
    border: 1px solid #d1d5db;
    overflow: hidden;
    white-space: normal;
  }
  .el-signature--empty {
    padding-bottom: 8px;
  }
  .el-signature-line {
    display: block;
    width: 88%;
    height: 0;
    border-bottom: 1px solid #9ca3af;
  }
  .el-signature-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .el-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
  }
  .el-text .text-content {
    flex: 1;
    min-height: 0;
    line-height: 1.35;
  }
  .el-title .text-content {
    font-weight: 700;
  }
  .el-deco {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    white-space: normal;
  }
  .el-deco-h, .el-deco-v, .el-deco-box {
    padding: 2px;
  }
  .deco-h-line {
    width: 100%;
    border-top: 1px solid #374151;
  }
  .deco-v-line {
    height: 100%;
    border-left: 1px solid #374151;
  }
  .deco-box {
    width: 100%;
    height: 100%;
    border: 1px solid #374151;
    box-sizing: border-box;
  }
  .el-deco-dynamic .dynamic-field-value {
    font-family: ui-monospace, monospace;
  }
  .el-deco-number-seq {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
  }
  .number-seq {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    line-height: 1.35;
    font-variant-numeric: tabular-nums;
  }
  .number-seq-line {
    text-align: center;
  }
  .el-table {
    padding: 0;
    white-space: normal;
    overflow: hidden;
  }
  .designer-print-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: inherit;
  }
  .designer-print-table td {
    border: 1px solid #374151;
    padding: 2px 4px;
    vertical-align: middle;
    overflow: hidden;
    line-height: 1.3;
  }
  .designer-print-table .table-th {
    background: #f3f4f6;
    font-weight: 600;
  }
  .designer-print-table .table-cell-label {
    display: block;
    font-size: 0.85em;
    color: #4b5563;
  }
  .designer-print-table .table-cell-value {
    display: block;
    font-weight: 600;
  }
  .designer-print-table .table-cell-sub {
    display: block;
    font-size: 0.8em;
    color: #6b7280;
  }
  .table-cell-qrcode-mock {
    display: inline-block;
    width: 12mm;
    height: 12mm;
    background:
      linear-gradient(90deg, #111 1px, transparent 1px) 0 0 / 3px 3px,
      linear-gradient(#111 1px, transparent 1px) 0 0 / 3px 3px;
    border: 1px solid #111;
    vertical-align: middle;
  }
  .table-cell-barcode-mock {
    display: block;
    width: 100%;
    height: 8px;
    margin-bottom: 2px;
    background: repeating-linear-gradient(90deg, #111 0, #111 2px, transparent 2px, transparent 4px);
  }
`;

const MM_TO_PX = 96 / 25.4;

export function getPreviewDisplayScale(
  widthMm: number,
  heightMm?: number,
  box?: { maxWidth?: number; maxHeight?: number }
): number {
  const maxW = box?.maxWidth ?? 760;
  const maxH = box?.maxHeight ?? 560;
  const labelW = widthMm * MM_TO_PX;
  const labelH = (heightMm ?? widthMm * 1.5) * MM_TO_PX;
  const fitScale = Math.min(maxW / labelW, maxH / labelH);
  return Math.min(1.6, Math.max(0.72, fitScale));
}

export function getPreviewLabelPixelSize(widthMm: number, heightMm: number) {
  return {
    widthPx: widthMm * MM_TO_PX,
    heightPx: heightMm * MM_TO_PX
  };
}

export async function openPalletLabelPreviewWindow(options: {
  elements: DesignerCanvasElement[];
  paperSize: PaperPresetKey | string;
  orientation: PaperOrientation;
}): Promise<void> {
  const dim = resolvePaperDimensions(options.paperSize, options.orientation);
  const labelHtml = await buildPalletLabelPreviewHtmlAsync(options);
  const scale = getPreviewDisplayScale(dim.widthMm, dim.heightMm, { maxWidth: 900, maxHeight: 700 });
  const win = window.open('', '_blank');
  if (!win) {
    window.$message?.error('无法打开预览，请允许弹窗');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>卡板贴预览</title>
<style>
  body { margin: 0; padding: 32px; background: #e5e7eb; font-family: sans-serif; }
  h1 { text-align: center; font-size: 16px; color: #374151; margin-bottom: 24px; }
  .wrap { display: flex; justify-content: center; }
  .scale { transform: scale(${scale}); transform-origin: top center; }
  ${PALLET_LABEL_PREVIEW_STYLES}
</style>
</head><body>
  <h1>卡板贴打印预览（测试数据）</h1>
  <div class="wrap"><div class="scale">${labelHtml}</div></div>
</body></html>`);
  win.document.close();
}

/** 设计器测试打印：按纸张尺寸打开预览并唤起浏览器打印对话框 */
export async function openPalletLabelTestPrintWindow(options: {
  elements: DesignerCanvasElement[];
  paperSize: PaperPresetKey | string;
  orientation: PaperOrientation;
  title?: string;
}): Promise<boolean> {
  const dim = resolvePaperDimensions(options.paperSize, options.orientation);
  const labelHtml = await buildPalletLabelPreviewHtmlAsync(options);
  const win = window.open('', '_blank');
  if (!win) {
    window.$message?.error('无法打开测试打印，请允许弹窗');
    return false;
  }
  const docTitle = options.title || '模板测试打印';
  win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>${docTitle}</title>
<style>
  @page { size: ${dim.widthMm}mm ${dim.heightMm}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; padding: 16px; background: #e5e7eb; font-family: -apple-system, 'PingFang SC', sans-serif; }
  .test-print-hint {
    text-align: center;
    font-size: 14px;
    color: #374151;
    margin-bottom: 16px;
    line-height: 1.5;
  }
  .print-wrap { display: flex; justify-content: center; }
  ${PALLET_LABEL_PREVIEW_STYLES}
  @media print {
    body { padding: 0; background: #fff; }
    .test-print-hint { display: none; }
    .print-wrap { display: block; }
    .pallet-label {
      box-shadow: none;
      margin: 0 auto;
      page-break-after: always;
    }
    .pallet-label:last-child { page-break-after: auto; }
  }
</style>
</head><body>
  <p class="test-print-hint">
    测试打印 · ${dim.widthMm}×${dim.heightMm} mm<br />
    使用测试数据预览，请在打印对话框中确认打印机与份数
  </p>
  <div class="print-wrap">${labelHtml}</div>
  <script>window.onload = () => { setTimeout(() => window.print(), 320); };<\/script>
</body></html>`);
  win.document.close();
  return true;
}

/** 生产板贴打印：支持预览确认、多份输出、业务数据填充 */
export async function openPalletLabelProductionPrintWindow(options: {
  elements: DesignerCanvasElement[];
  paperSize: PaperPresetKey | string;
  orientation: PaperOrientation;
  dataOverrides?: Record<string, string>;
  copies?: number;
  previewMode?: boolean;
  title?: string;
  templateCode?: string;
  printerName?: string | null;
}): Promise<boolean> {
  const dim = resolvePaperDimensions(options.paperSize, options.orientation);
  const copies = Math.max(1, options.copies ?? 1);
  const labelHtml = await buildPalletLabelPreviewHtmlAsync({
    elements: options.elements,
    paperSize: options.paperSize,
    orientation: options.orientation,
    dataOverrides: options.dataOverrides
  });
  const labelsHtml = Array.from({ length: copies }, () => labelHtml).join('');
  const win = window.open('', '_blank');
  if (!win) {
    window.$message?.error('无法打开打印窗口，请允许弹窗');
    return false;
  }

  const docTitle = options.title || '板贴打印';
  const metaLine = [
    options.templateCode ? `模板 ${options.templateCode}` : null,
    `${dim.widthMm}×${dim.heightMm} mm`,
    `共 ${copies} 份`,
    options.printerName ? `打印机 ${options.printerName}` : null
  ]
    .filter(Boolean)
    .join(' · ');

  const autoPrint = options.previewMode === false;
  const hintText = options.previewMode
    ? '预览打印：请核对板贴内容后点击「确认打印」'
    : '正在准备打印…';

  win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>${docTitle}</title>
<style>
  @page { size: ${dim.widthMm}mm ${dim.heightMm}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; padding: 16px; background: #e5e7eb; font-family: -apple-system, 'PingFang SC', sans-serif; }
  .prod-print-bar {
    text-align: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
  }
  .prod-print-bar h2 { font-size: 16px; margin-bottom: 6px; color: #111827; }
  .prod-print-bar p { font-size: 13px; color: #6b7280; margin-bottom: 10px; }
  .prod-print-btn {
    padding: 8px 20px;
    font-size: 14px;
    border: none;
    border-radius: 6px;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
  }
  .prod-print-btn:hover { background: #1d4ed8; }
  .print-stack { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  ${PALLET_LABEL_PREVIEW_STYLES}
  @media print {
    body { padding: 0; background: #fff; }
    .prod-print-bar { display: none; }
    .print-stack { gap: 0; }
    .pallet-label {
      box-shadow: none;
      margin: 0 auto;
      page-break-after: always;
    }
    .pallet-label:last-child { page-break-after: auto; }
  }
</style>
</head><body>
  <div class="prod-print-bar no-print">
    <h2>${docTitle}</h2>
    <p>${hintText}<br />${metaLine}</p>
    <button class="prod-print-btn" type="button" onclick="handleConfirmPrint()">确认打印（${copies} 份）</button>
  </div>
  <div class="print-stack">${labelsHtml}</div>
  <script>
    function handleConfirmPrint() {
      const closeWindow = () => {
        try { window.close(); } catch (e) { /* ignore */ }
      };
      window.onafterprint = closeWindow;
      window.print();
      setTimeout(closeWindow, 1500);
    }
    ${autoPrint ? 'window.onload = () => { setTimeout(() => handleConfirmPrint(), 320); };' : ''}
  <\/script>
</body></html>`);
  win.document.close();
  return true;
}
