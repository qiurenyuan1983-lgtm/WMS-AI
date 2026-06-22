import type { DesignerCanvasElement, DesignerElementKind } from './paper-size';
import { PALLET_LABEL_SAMPLE_DATA } from './field-display';

export const DECORATIVE_COMPONENT_LABELS = ['横线', '竖线', '方框', '页码', '日期'] as const;

export type DecorativeComponentLabel = (typeof DECORATIVE_COMPONENT_LABELS)[number];

export function isDecorativeComponent(el: DesignerCanvasElement): boolean {
  return (
    el.kind === 'component' &&
    (DECORATIVE_COMPONENT_LABELS as readonly string[]).includes(el.label)
  );
}

export function isDynamicFieldComponent(el: DesignerCanvasElement): boolean {
  return el.kind === 'component' && el.label === '动态字段';
}

export function isNumberSequenceComponent(el: DesignerCanvasElement): boolean {
  return el.kind === 'component' && el.label === '号码排列';
}

export function getNumberSequenceLines(el: DesignerCanvasElement): string[] {
  const start = Math.max(1, el.serialStart ?? 1);
  const count = Math.max(1, Math.min(99, el.serialCount ?? 10));
  return Array.from({ length: count }, (_, i) => String(start + i));
}

export function getNumberSequenceDisplay(el: DesignerCanvasElement): string {
  return getNumberSequenceLines(el).join('\n');
}

export function isTitleComponent(el: DesignerCanvasElement): boolean {
  return el.kind === 'component' && el.label === '标题';
}

export function getPageNumberDisplay(): string {
  return '1 / 1';
}

export function getDateComponentDisplay(el: DesignerCanvasElement): string {
  if (el.format === 'date') {
    return PALLET_LABEL_SAMPLE_DATA['打印日期'];
  }
  return PALLET_LABEL_SAMPLE_DATA['打印日期'];
}

export function getDynamicFieldDisplay(el: DesignerCanvasElement): string {
  const field = el.bindField || '订单号';
  return `{${field}}`;
}

export function getComponentDefaultSize(label: string): { width: number; height: number } | null {
  const map: Record<string, { width: number; height: number }> = {
    横线: { width: 200, height: 10 },
    竖线: { width: 10, height: 80 },
    方框: { width: 120, height: 72 },
    页码: { width: 72, height: 22 },
    号码排列: { width: 40, height: 140 },
    日期: { width: 108, height: 24 },
    动态字段: { width: 120, height: 32 },
    标题: { width: 180, height: 32 },
    合计金额: { width: 120, height: 28 },
    自定义说明: { width: 200, height: 36 }
  };
  return map[label] ?? null;
}

export function getComponentInitialPlaceholder(label: string, kind: DesignerElementKind): string {
  if (label === '文本' || label === '标题') return '';
  if (label === '动态字段') return '{订单号}';
  if (label === '自定义说明') return '请核对板数与箱数';
  if (label === '合计金额') return '—';
  if (label === '页码') return '1 / 1';
  if (label === '号码排列') return '1\n2\n3\n…';
  if (label === '日期') return PALLET_LABEL_SAMPLE_DATA['打印日期'];
  if (kind === 'field') return `{${label}}`;
  return label;
}

export function getComponentInitialBindField(label: string): string | undefined {
  if (label === '二维码') return '卡板号';
  if (label === '动态字段') return '订单号';
  return undefined;
}
