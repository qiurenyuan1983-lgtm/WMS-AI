import {
  getComponentDefaultSize,
  getComponentInitialBindField,
  getComponentInitialPlaceholder
} from './component-registry';
import { estimateElementSize } from './field-display';
import { createDefaultTableConfig, type TableConfig } from './table-utils';

export type PaperOrientation = 'portrait' | 'landscape';

export type PaperPresetKey = '100x150mm' | '50x30mm' | '100x100mm' | 'A4';

export type PaperPreset = {
  key: PaperPresetKey;
  label: string;
  widthMm: number;
  heightMm: number;
};

export const DESIGNER_PAPER_PRESETS: PaperPreset[] = [
  { key: '100x150mm', label: '100×150mm 标签', widthMm: 100, heightMm: 150 },
  { key: '50x30mm', label: '50×30mm 标签', widthMm: 50, heightMm: 30 },
  { key: '100x100mm', label: '100×100mm 箱贴', widthMm: 100, heightMm: 100 },
  { key: 'A4', label: 'A4', widthMm: 210, heightMm: 297 }
];

/** 屏幕显示缩放：1mm ≈ DISPLAY_SCALE px */
export const CANVAS_DISPLAY_SCALE = 2.8;

export function resolvePaperDimensions(
  paperKey: PaperPresetKey | string,
  orientation: PaperOrientation
): { widthMm: number; heightMm: number; widthPx: number; heightPx: number } {
  const preset = DESIGNER_PAPER_PRESETS.find(p => p.key === paperKey) ?? DESIGNER_PAPER_PRESETS[0];
  let widthMm = preset.widthMm;
  let heightMm = preset.heightMm;
  if (orientation === 'landscape') {
    [widthMm, heightMm] = [heightMm, widthMm];
  }
  return {
    widthMm,
    heightMm,
    widthPx: Math.round(widthMm * CANVAS_DISPLAY_SCALE),
    heightPx: Math.round(heightMm * CANVAS_DISPLAY_SCALE)
  };
}

export type DesignerElementKind = 'field' | 'component';

export type DesignerCanvasElement = {
  id: string;
  kind: DesignerElementKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  format: string | null;
  placeholder: string;
  /** 画布设计态：是否显示字段名（如「目的地」） */
  showLabel?: boolean;
  /** 字段名与占位符排列：上下 / 左右 */
  labelLayout?: 'vertical' | 'horizontal';
  /** 预览/打印：是否输出该字段 */
  visible?: boolean;
  /** 二维码：绑定的业务字段名（如「卡板号」） */
  bindField?: string;
  /** 二维码：是否在码图下方显示绑定字段名 */
  showBindFieldLabel?: boolean;
  /** 表格组件结构 */
  tableConfig?: TableConfig;
  /** 图片 / Logo 组件：base64 或 URL */
  imageSrc?: string;
  /** 号码排列：起始序号 */
  serialStart?: number;
  /** 号码排列：显示行数 */
  serialCount?: number;
};

export type { TableConfig };

let elementIdSeq = 1;

export function createCanvasElement(
  label: string,
  kind: DesignerElementKind,
  x: number,
  y: number
): DesignerCanvasElement {
  const customSize = getComponentDefaultSize(label);
  const size = customSize ?? estimateElementSize(label, kind, 'vertical');
  const isQrcode = label === '二维码';
  const isTable = label === '表格';
  const isTitle = label === '标题';
  const bindField = getComponentInitialBindField(label);
  return {
    id: `el-${Date.now()}-${elementIdSeq++}`,
    kind,
    label,
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: size.width,
    height: size.height,
    fontSize: isTitle ? 16 : 12,
    fontWeight: isTitle ? 'bold' : 'normal',
    textAlign: 'left',
    format: label === '日期' ? 'date' : null,
    placeholder: getComponentInitialPlaceholder(label, kind),
    showLabel: !['横线', '竖线', '方框'].includes(label),
    serialStart: label === '号码排列' ? 1 : undefined,
    serialCount: label === '号码排列' ? 10 : undefined,
    labelLayout: 'vertical',
    visible: true,
    bindField,
    showBindFieldLabel: isQrcode ? true : undefined,
    tableConfig: isTable ? createDefaultTableConfig(3, 3) : undefined
  };
}

export function getDefaultElementsForPalletLabel(
  canvasWidth: number,
  canvasHeight: number
): DesignerCanvasElement[] {
  const mk = (label: string, xPct: number, yPct: number) => {
    const el = createCanvasElement(label, 'field', canvasWidth * xPct, canvasHeight * yPct);
    if (label === '二维码') {
      el.width = 72;
      el.height = 72;
    }
    return el;
  };
  return [
    mk('仓库名称', 0.06, 0.04),
    mk('客户名称', 0.06, 0.12),
    mk('订单号', 0.06, 0.20),
    mk('海柜号', 0.06, 0.28),
    mk('目的地', 0.06, 0.36),
    mk('卡板号', 0.06, 0.44),
    mk('库位号', 0.06, 0.52),
    mk('箱数', 0.06, 0.60),
    mk('二维码', 0.62, 0.28),
    mk('高货值标识', 0.06, 0.78)
  ];
}
