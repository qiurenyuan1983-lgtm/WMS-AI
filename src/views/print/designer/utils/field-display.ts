import type { DesignerCanvasElement, DesignerElementKind } from './paper-size';

/** 卡板贴预览 / 画布展示用测试数据 */
const PALLET_LABEL_ORDER_NO = 'CO-2026-0001';

export const PALLET_LABEL_SAMPLE_DATA: Record<string, string> = {
  仓库名称: 'FOREST WAREHOUSE',
  客户名称: 'ANKER',
  订单号: PALLET_LABEL_ORDER_NO,
  唛头号: PALLET_LABEL_ORDER_NO,
  海柜号: 'FSCU1234567',
  卡板号: 'LA-20260603-0001',
  'FBA Shipment ID': 'FBA18XXXXXX',
  FBX号: 'FBX-20260603',
  目的地: 'XLX7',
  库位号: 'A09-01',
  箱数: '48 CTNS',
  卡板尺寸: '40 × 48 × 72 cm',
  SKU数量: '126',
  板数: '1',
  入库日期: '2026-06-03',
  拆柜日期: '2026-06-02',
  操作人: '张三',
  高货值标识: '高货值货物 / HIGH VALUE',
  HOLD标识: 'HOLD',
  MIX混货标识: 'MIX 混货',
  特殊操作备注: '轻拿轻放',
  柜型: '40HC',
  DOCK号: 'DOCK-01',
  打印日期: '2026-06-03',
  BOL号: 'QXY8-260610-5931',
  提货日期: '06/10/2026 10:30 PDT',
  件数: '267',
  重量: '2937.00 KGS',
  发货人: 'Forest Shipping USA Inc.',
  收货人: 'POC2',
  收货地址: '4000 Hamner Ave, Ontario CA 91761'
};

export function getFieldSampleValue(label: string, placeholder?: string): string {
  if (PALLET_LABEL_SAMPLE_DATA[label]) {
    return PALLET_LABEL_SAMPLE_DATA[label];
  }
  const stripped = (placeholder || '').replace(/^\{|\}$/g, '');
  if (stripped && PALLET_LABEL_SAMPLE_DATA[stripped]) {
    return PALLET_LABEL_SAMPLE_DATA[stripped];
  }
  return stripped || label;
}

/** 预览态：字段名 + 测试数据 */
export function getPreviewFieldText(el: DesignerCanvasElement): string {
  if (el.label === '二维码' || el.label === '条形码') {
    return el.label;
  }
  if (el.kind === 'component') {
    if (el.label === '文本' || el.label === '标题') return el.placeholder?.trim() || '';
    return el.label;
  }
  if (el.label === '仓库名称') {
    return getFieldSampleValue(el.label, el.placeholder);
  }
  const value = getFieldSampleValue(el.label, el.placeholder);
  return `${el.label}：${value}`;
}

/** @deprecated 使用 getPreviewFieldText */
export const getFieldDisplayText = getPreviewFieldText;

/** 设计态画布：只显示字段库名称与绑定占位符，不填充业务数据 */
export function getCanvasFieldLabel(el: DesignerCanvasElement): string {
  return el.label;
}

export function getCanvasFieldBinding(el: DesignerCanvasElement): string {
  if (el.kind === 'component') {
    if (el.label === '文本') return el.placeholder?.trim() || '双击编辑文本';
    return el.label;
  }
  return el.placeholder || `{${el.label}}`;
}

export function isTextComponent(el: DesignerCanvasElement): boolean {
  return el.kind === 'component' && (el.label === '文本' || el.label === '标题');
}

export function isImageComponent(el: DesignerCanvasElement): boolean {
  return el.kind === 'component' && (el.label === '图片' || el.label === '公司Logo');
}

export function isSignatureComponent(el: DesignerCanvasElement): boolean {
  return el.kind === 'component' && el.label === '签名栏';
}

export const TEXT_COMPONENT_EMPTY_HINT = '双击编辑文本';

export function getTextComponentContent(el: DesignerCanvasElement): string {
  return el.placeholder ?? '';
}

export function getTextComponentDisplay(el: DesignerCanvasElement): string {
  const text = el.placeholder?.trim();
  return text || TEXT_COMPONENT_EMPTY_HINT;
}

export function hasTextComponentContent(el: DesignerCanvasElement): boolean {
  return Boolean(el.placeholder?.trim());
}

/** 设计态画布：组件内容（不含组件名） */
export function getCanvasComponentValue(el: DesignerCanvasElement): string {
  if (el.label === '文本') return getTextComponentContent(el);
  if (el.label === '图片' || el.label === '公司Logo') {
    return el.imageSrc ? '已上传图片' : '未上传';
  }
  if (el.label === '签名栏') return el.imageSrc ? '已签名' : '未签名';
  return el.placeholder || `{${el.label}}`;
}

export function isElementVisible(el: DesignerCanvasElement): boolean {
  return el.visible !== false;
}

export function shouldShowLabel(el: DesignerCanvasElement): boolean {
  return el.showLabel !== false;
}

export function getLabelLayout(el: DesignerCanvasElement): 'vertical' | 'horizontal' {
  return el.labelLayout === 'horizontal' ? 'horizontal' : 'vertical';
}

/** 预览/打印行文案（左右排列或单行） */
export function formatPreviewLine(el: DesignerCanvasElement, value: string): string {
  if (!shouldShowLabel(el)) return value;
  if (el.label === '仓库名称') return value;
  return `${el.label}：${value}`;
}

/** 预览垂直排列时是否拆成两行 */
export function isPreviewVerticalLayout(el: DesignerCanvasElement): boolean {
  return shouldShowLabel(el) && getLabelLayout(el) === 'vertical' && el.label !== '仓库名称';
}

export function estimateElementSize(
  label: string,
  kind: DesignerElementKind,
  labelLayout: 'vertical' | 'horizontal' = 'vertical'
): { width: number; height: number } {
  if (label === '二维码' || label === '条形码') {
    return { width: 72, height: 72 };
  }
  if (label === '公司Logo' || label === '图片') {
    return { width: 88, height: 44 };
  }
  if (label === '表格') {
    return { width: 280, height: 108 };
  }
  if (label === '签名栏') {
    return { width: 160, height: 56 };
  }
  if (label === '文本') {
    return { width: 140, height: 36 };
  }
  if (label === '标题') {
    return { width: 180, height: 32 };
  }
  if (label === '号码排列') {
    return { width: 40, height: 140 };
  }
  if (label === '高货值标识' || label === 'HOLD标识' || label === 'MIX混货标识') {
    return { width: 200, height: 32 };
  }
  if (label === '仓库名称') {
    return { width: 220, height: 32 };
  }
  const binding = `{${label}}`;
  if (labelLayout === 'horizontal') {
    const width = Math.min(260, Math.max(100, (label.length + binding.length) * 8 + 24));
    return { width, height: kind === 'field' ? 28 : 24 };
  }
  const width = Math.min(200, Math.max(72, Math.max(label.length, binding.length) * 8 + 20));
  return { width, height: kind === 'field' ? 40 : 28 };
}
