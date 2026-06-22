import { DESIGNER_FIELD_GROUPS } from '../../constants';
import { createCanvasElement, resolvePaperDimensions, type DesignerCanvasElement, type PaperOrientation, type PaperPresetKey } from './paper-size';
import { createDefaultTableConfig, normalizeTableConfig, resizeTableConfig } from './table-utils';

export type TemplateImportMode = 'replace' | 'merge';

export type TemplateImportResult = {
  paperSize: PaperPresetKey;
  orientation: PaperOrientation;
  elements: DesignerCanvasElement[];
  backgroundImageSrc?: string;
  summary: string[];
};

type Rect = { x: number; y: number; width: number; height: number };

type AnalysisBitmap = {
  width: number;
  height: number;
  gray: Uint8Array;
};

const ALL_FIELDS = DESIGNER_FIELD_GROUPS.flatMap(g => g.fields);

const TEMPLATE_FIELD_PROFILES: Record<string, string[]> = {
  pallet_label: [
    '仓库名称',
    '客户名称',
    '订单号',
    '海柜号',
    '目的地',
    '卡板号',
    '库位号',
    '箱数',
    '高货值标识'
  ],
  bol: ['BOL号', '发货人', '收货人', '收货地址', '承运人', '起运地', '目的地', '件数', '重量', '签收日期'],
  invoice: ['发票编号', '客户名称', '服务项目', '数量', '单价', '金额', '总金额'],
  default: ['仓库名称', '客户名称', '订单号', '目的地', '卡板号', '箱数', '打印日期']
};

function mergeNearby(values: number[], gap: number): number[] {
  if (!values.length) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    if (sorted[i] - prev <= gap) merged[merged.length - 1] = Math.round((prev + sorted[i]) / 2);
    else merged.push(sorted[i]);
  }
  return merged;
}

function inferPaperFromAspect(ratio: number): { paperSize: PaperPresetKey; orientation: PaperOrientation } {
  const presets: Array<{ key: PaperPresetKey; portrait: number }> = [
    { key: '50x30mm', portrait: 50 / 30 },
    { key: '100x100mm', portrait: 1 },
    { key: '100x150mm', portrait: 100 / 150 },
    { key: 'A4', portrait: 210 / 297 }
  ];
  let best = presets[0];
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const p of presets) {
    const portraitDiff = Math.abs(ratio - p.portrait);
    const landscapeDiff = Math.abs(ratio - 1 / p.portrait);
    const diff = Math.min(portraitDiff, landscapeDiff);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }
  const orientation: PaperOrientation = ratio >= 1 ? 'landscape' : 'portrait';
  return { paperSize: best.key, orientation };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败'));
    };
    img.src = url;
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

function toAnalysisBitmap(img: HTMLImageElement, maxWidth = 720): AnalysisBitmap {
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法分析图片');
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return { width, height, gray };
}

function rowDarkRatio(bitmap: AnalysisBitmap, y: number, threshold = 185): number {
  let dark = 0;
  for (let x = 0; x < bitmap.width; x++) {
    if (bitmap.gray[y * bitmap.width + x] < threshold) dark++;
  }
  return dark / bitmap.width;
}

function colDarkRatio(bitmap: AnalysisBitmap, x: number, threshold = 185): number {
  let dark = 0;
  for (let y = 0; y < bitmap.height; y++) {
    if (bitmap.gray[y * bitmap.width + x] < threshold) dark++;
  }
  return dark / bitmap.height;
}

function findHorizontalLines(bitmap: AnalysisBitmap): number[] {
  const ys: number[] = [];
  for (let y = 2; y < bitmap.height - 2; y++) {
    const ratio = rowDarkRatio(bitmap, y);
    if (ratio > 0.52 && ratio < 0.98) ys.push(y);
  }
  return mergeNearby(ys, 4);
}

function findVerticalLines(bitmap: AnalysisBitmap): number[] {
  const xs: number[] = [];
  for (let x = 2; x < bitmap.width - 2; x++) {
    const ratio = colDarkRatio(bitmap, x);
    if (ratio > 0.52 && ratio < 0.98) xs.push(x);
  }
  return mergeNearby(xs, 4);
}

function bandInkRatio(bitmap: AnalysisBitmap, top: number, bottom: number, left = 0, right?: number): number {
  const r = right ?? bitmap.width;
  let dark = 0;
  let total = 0;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < r; x++) {
      if (bitmap.gray[y * bitmap.width + x] < 200) dark++;
      total++;
    }
  }
  return total ? dark / total : 0;
}

function scaleRect(rect: Rect, sx: number, sy: number): Rect {
  return {
    x: Math.round(rect.x * sx),
    y: Math.round(rect.y * sy),
    width: Math.max(20, Math.round(rect.width * sx)),
    height: Math.max(16, Math.round(rect.height * sy))
  };
}

function findTableRegion(hLines: number[], vLines: number[], bitmap: AnalysisBitmap): Rect | null {
  if (hLines.length < 3 || vLines.length < 3) return null;
  const top = hLines[0];
  const bottom = hLines[hLines.length - 1];
  const left = vLines[0];
  const right = vLines[vLines.length - 1];
  const height = bottom - top;
  const width = right - left;
  if (width < bitmap.width * 0.25 || height < bitmap.height * 0.12) return null;
  const innerInk = bandInkRatio(bitmap, top + 2, bottom - 2, left + 2, right - 2);
  if (innerInk < 0.03) return null;
  return { x: left, y: top, width, height };
}

function findQrRegion(bitmap: AnalysisBitmap): Rect | null {
  const minSize = Math.round(Math.min(bitmap.width, bitmap.height) * 0.12);
  const maxSize = Math.round(Math.min(bitmap.width, bitmap.height) * 0.34);
  const startX = Math.round(bitmap.width * 0.45);
  let best: { rect: Rect; score: number } | null = null;

  for (let size = minSize; size <= maxSize; size += 6) {
    for (let y = Math.round(bitmap.height * 0.08); y < bitmap.height * 0.72; y += 8) {
      for (let x = startX; x < bitmap.width - size - 4; x += 8) {
        const ink = bandInkRatio(bitmap, y, y + size, x, x + size);
        if (ink < 0.18 || ink > 0.72) continue;
        const score = Math.abs(ink - 0.42);
        if (!best || score < best.score) {
          best = { rect: { x, y, width: size, height: size }, score };
        }
      }
    }
  }
  return best?.rect ?? null;
}

function findTextBands(bitmap: AnalysisBitmap, hLines: number[], exclude: Rect[]): Rect[] {
  const bounds = [0, ...hLines, bitmap.height];
  const bands: Rect[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const top = bounds[i];
    const bottom = bounds[i + 1];
    const height = bottom - top;
    if (height < 8 || height > bitmap.height * 0.22) continue;
    const ink = bandInkRatio(bitmap, top, bottom);
    if (ink < 0.04 || ink > 0.42) continue;
    const rect = { x: Math.round(bitmap.width * 0.05), y: top, width: Math.round(bitmap.width * 0.55), height };
    if (exclude.some(r => overlaps(rect, r, 0.35))) continue;
    bands.push(rect);
  }
  return bands.sort((a, b) => a.y - b.y);
}

function findHorizontalRules(bitmap: AnalysisBitmap, hLines: number[]): Rect[] {
  return hLines
    .filter(y => {
      const ratio = rowDarkRatio(bitmap, y);
      return ratio > 0.62 && ratio < 0.95;
    })
    .slice(0, 6)
    .map(y => ({
      x: Math.round(bitmap.width * 0.06),
      y: y - 1,
      width: Math.round(bitmap.width * 0.88),
      height: 8
    }));
}

function findSignatureRegion(bitmap: AnalysisBitmap, hLines: number[]): Rect | null {
  const candidates = hLines
    .filter(y => y > bitmap.height * 0.62)
    .slice(-2);
  if (!candidates.length) return null;
  const y = candidates[0];
  return {
    x: Math.round(bitmap.width * 0.08),
    y: y + 6,
    width: Math.round(bitmap.width * 0.42),
    height: Math.max(28, Math.round(bitmap.height * 0.1))
  };
}

function overlaps(a: Rect, b: Rect, minRatio = 0.3): boolean {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  if (x2 <= x1 || y2 <= y1) return false;
  const inter = (x2 - x1) * (y2 - y1);
  const minArea = Math.min(a.width * a.height, b.width * b.height);
  return inter / minArea >= minRatio;
}

function fieldProfile(templateType?: string): string[] {
  if (!templateType) return TEMPLATE_FIELD_PROFILES.default;
  if (templateType.includes('pallet')) return TEMPLATE_FIELD_PROFILES.pallet_label;
  if (templateType.includes('bol')) return TEMPLATE_FIELD_PROFILES.bol;
  if (templateType.includes('invoice')) return TEMPLATE_FIELD_PROFILES.invoice;
  return TEMPLATE_FIELD_PROFILES.default;
}

function buildElementFromRect(
  label: string,
  kind: 'field' | 'component',
  rect: Rect,
  extra?: Partial<DesignerCanvasElement>
): DesignerCanvasElement {
  const el = createCanvasElement(label, kind, rect.x, rect.y);
  el.width = rect.width;
  el.height = rect.height;
  return { ...el, ...extra };
}

function buildTableFromRect(rect: Rect, hLines: number[], vLines: number[], tableRect: Rect): DesignerCanvasElement {
  const rows = Math.max(2, Math.min(12, hLines.filter(y => y >= tableRect.y && y <= tableRect.y + tableRect.height).length - 1));
  const cols = Math.max(2, Math.min(8, vLines.filter(x => x >= tableRect.x && x <= tableRect.x + tableRect.width).length - 1));
  const el = createCanvasElement('表格', 'component', rect.x, rect.y);
  el.width = rect.width;
  el.height = rect.height;
  const base = createDefaultTableConfig(rows, cols);
  el.tableConfig = normalizeTableConfig(resizeTableConfig(base, rows, cols));
  return el;
}

function parseJsonDesign(raw: string, templateType?: string): TemplateImportResult {
  const parsed = JSON.parse(raw) as {
    elements?: DesignerCanvasElement[];
    paperSize?: PaperPresetKey | string;
    orientation?: PaperOrientation;
    version?: number;
  };
  if (!Array.isArray(parsed.elements)) {
    throw new Error('JSON 中缺少 elements 数组');
  }
  const elements = JSON.parse(JSON.stringify(parsed.elements)) as DesignerCanvasElement[];
  const paperSize = (parsed.paperSize as PaperPresetKey) || '100x150mm';
  const orientation = parsed.orientation || 'portrait';
  return {
    paperSize,
    orientation,
    elements,
    summary: [`已导入设计稿 JSON，共 ${elements.length} 个元素`]
  };
}

async function parseImageTemplate(
  file: File,
  templateType?: string,
  keepBackground = true
): Promise<TemplateImportResult> {
  const img = await loadImageFromFile(file);
  const bitmap = toAnalysisBitmap(img);
  const aspect = img.naturalWidth / img.naturalHeight;
  const { paperSize, orientation } = inferPaperFromAspect(aspect);
  const canvas = resolvePaperDimensions(paperSize, orientation);
  const sx = canvas.widthPx / bitmap.width;
  const sy = canvas.heightPx / bitmap.height;

  const hLines = findHorizontalLines(bitmap);
  const vLines = findVerticalLines(bitmap);
  const tableRect = findTableRegion(hLines, vLines, bitmap);
  const qrRect = findQrRegion(bitmap);
  const signatureRect = findSignatureRegion(bitmap, hLines);
  const exclude: Rect[] = [];
  if (tableRect) exclude.push(tableRect);
  if (qrRect) exclude.push(qrRect);
  if (signatureRect) exclude.push(signatureRect);

  const textBands = findTextBands(bitmap, hLines, exclude);
  const rules = findHorizontalRules(bitmap, hLines).filter(r => !exclude.some(e => overlaps(r, e, 0.2)));

  const profile = fieldProfile(templateType);
  const elements: DesignerCanvasElement[] = [];
  const summary: string[] = [];

  textBands.forEach((band, idx) => {
    const rect = scaleRect(band, sx, sy);
    const label = profile[idx] || ALL_FIELDS[idx % ALL_FIELDS.length] || '订单号';
    if (!ALL_FIELDS.includes(label) && label !== '订单号') {
      elements.push(buildElementFromRect('动态字段', 'component', rect, { bindField: label, placeholder: `{${label}}` }));
    } else {
      elements.push(buildElementFromRect(label, 'field', rect, { showLabel: true }));
    }
  });
  if (textBands.length) summary.push(`识别文本区 ${textBands.length} 处，映射为字段/动态字段`);

  if (tableRect) {
    const rect = scaleRect(tableRect, sx, sy);
    const innerH = hLines.filter(y => y >= tableRect.y && y <= tableRect.y + tableRect.height);
    const innerV = vLines.filter(x => x >= tableRect.x && x <= tableRect.x + tableRect.width);
    elements.push(buildTableFromRect(rect, innerH, innerV, tableRect));
    summary.push(`识别表格 1 个（约 ${Math.max(2, innerH.length - 1)}×${Math.max(2, innerV.length - 1)}）`);
  }

  if (qrRect) {
    const rect = scaleRect(qrRect, sx, sy);
    elements.push(buildElementFromRect('二维码', 'component', rect, { bindField: '卡板号', showBindFieldLabel: true }));
    summary.push('识别二维码区 1 个');
  }

  if (signatureRect) {
    const rect = scaleRect(signatureRect, sx, sy);
    elements.push(buildElementFromRect('签名栏', 'component', rect, { showLabel: false }));
    summary.push('识别签名栏 1 个');
  }

  rules.slice(0, 3).forEach(rule => {
    elements.push(buildElementFromRect('横线', 'component', scaleRect(rule, sx, sy), { showLabel: false }));
  });
  if (rules.length) summary.push(`识别横线 ${Math.min(rules.length, 3)} 条`);

  if (!elements.length) {
    summary.push('未识别到明显结构，已按卡板贴示例布局生成');
    return {
      paperSize,
      orientation,
      elements: importFallbackLayout(canvas.widthPx, canvas.heightPx, templateType),
      backgroundImageSrc: keepBackground ? await fileToDataUrl(file) : undefined,
      summary
    };
  }

  let backgroundImageSrc: string | undefined;
  if (keepBackground) {
    backgroundImageSrc = await fileToDataUrl(file);
    const bg = buildElementFromRect('图片', 'component', { x: 0, y: 0, width: canvas.widthPx, height: canvas.heightPx }, {
      imageSrc: backgroundImageSrc,
      showLabel: false,
      visible: false
    });
    elements.unshift(bg);
    summary.push('参考图已作为隐藏底图导入，可在属性面板开启打印输出');
  }

  return { paperSize, orientation, elements, backgroundImageSrc, summary };
}

function importFallbackLayout(width: number, height: number, templateType?: string): DesignerCanvasElement[] {
  const profile = fieldProfile(templateType);
  return profile.map((label, idx) => {
    const y = height * (0.06 + idx * 0.08);
    return buildElementFromRect(label, 'field', {
      x: Math.round(width * 0.06),
      y: Math.round(y),
      width: Math.round(width * 0.55),
      height: 32
    });
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('图片转码失败'));
    reader.readAsDataURL(file);
  });
}

export async function parseTemplateImportFile(
  file: File,
  options?: { templateType?: string; keepBackground?: boolean }
): Promise<TemplateImportResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) {
    const raw = await readFileAsText(file);
    return parseJsonDesign(raw, options?.templateType);
  }
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/.test(name)) {
    return parseImageTemplate(file, options?.templateType, options?.keepBackground !== false);
  }
  throw new Error('仅支持 JSON 设计稿或图片模板（PNG/JPG/WebP）');
}

export function applyImportedElements(
  current: DesignerCanvasElement[],
  imported: DesignerCanvasElement[],
  mode: TemplateImportMode
): DesignerCanvasElement[] {
  if (mode === 'merge') {
    const offset = current.length;
    return [
      ...current,
      ...imported.map((el, idx) => ({
        ...el,
        id: `${el.id}-import-${offset + idx}`,
        x: el.x + 12 * (idx % 3),
        y: el.y + 12 * (idx % 3)
      }))
    ];
  }
  return imported;
}
