import QRCode from 'qrcode';
import type { DesignerCanvasElement } from './paper-size';
import { getFieldSampleValue } from './field-display';

export function getQrcodeBindField(el: DesignerCanvasElement): string {
  return el.bindField || el.placeholder?.replace(/^\{|\}$/g, '') || '卡板号';
}

/** 二维码编码内容：设计态用占位符，预览/打印用测试数据 */
export function resolveQrcodeContent(el: DesignerCanvasElement, useSampleData: boolean): string {
  const field = getQrcodeBindField(el);
  if (useSampleData) {
    return getFieldSampleValue(field, `{${field}}`);
  }
  return `{${field}}`;
}

export async function generateQrcodeDataUrl(content: string, sizePx: number): Promise<string> {
  return QRCode.toDataURL(content, {
    width: Math.max(48, Math.round(sizePx)),
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });
}

export function isQrcodeElement(el: DesignerCanvasElement): boolean {
  return el.label === '二维码';
}
