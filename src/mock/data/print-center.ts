import { getDefaultElementsForBol } from '@/views/print/designer/utils/bol-template-default';
import {
  getDefaultElementsForPalletLabel,
  resolvePaperDimensions,
  type DesignerCanvasElement,
  type PaperOrientation
} from '@/views/print/designer/utils/paper-size';
import { MOCK_WAREHOUSE } from './common';
import { nextId } from '../utils';

export type PrintTemplateDesignLayout = {
  elements: DesignerCanvasElement[];
  paperSize: string;
  orientation: PaperOrientation;
  updatedAt: string;
};

const TEMPLATE_DESIGN_LAYOUTS = new Map<string, PrintTemplateDesignLayout>();

function buildDefaultPalletDesign(paperSize: string, orientation: PaperOrientation): PrintTemplateDesignLayout {
  const dim = resolvePaperDimensions(paperSize, orientation);
  return {
    elements: getDefaultElementsForPalletLabel(dim.widthPx, dim.heightPx),
    paperSize,
    orientation,
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
}

function buildDefaultBolDesign(): PrintTemplateDesignLayout {
  const paperSize = 'A4';
  const orientation: PaperOrientation = 'landscape';
  const dim = resolvePaperDimensions(paperSize, orientation);
  return {
    elements: getDefaultElementsForBol(dim.widthPx, dim.heightPx),
    paperSize,
    orientation,
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
}

function seedPalletTemplateDesigns() {
  MOCK_PRINT_TEMPLATES.filter(t => t.templateType === 'pallet_label').forEach(tpl => {
    const key = String(tpl.id);
    if (TEMPLATE_DESIGN_LAYOUTS.has(key)) return;
    TEMPLATE_DESIGN_LAYOUTS.set(
      key,
      buildDefaultPalletDesign(tpl.paperSize || '100x150mm', tpl.orientation || 'portrait')
    );
  });
}

function seedBolTemplateDesigns() {
  MOCK_PRINT_TEMPLATES.filter(t => t.templateType === 'bol').forEach(tpl => {
    const key = String(tpl.id);
    if (TEMPLATE_DESIGN_LAYOUTS.has(key)) return;
    TEMPLATE_DESIGN_LAYOUTS.set(key, buildDefaultBolDesign());
  });
}

export function getPrintTemplateDesign(templateId: CommonType.IdType): PrintTemplateDesignLayout | null {
  return TEMPLATE_DESIGN_LAYOUTS.get(String(templateId)) ?? null;
}

export function savePrintTemplateDesign(
  templateId: CommonType.IdType,
  layout: Pick<PrintTemplateDesignLayout, 'elements' | 'paperSize' | 'orientation'>
) {
  TEMPLATE_DESIGN_LAYOUTS.set(String(templateId), {
    ...layout,
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  });
  return true;
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function getPrintTemplate(id: CommonType.IdType): Api.Print.PrintTemplate | null {
  return MOCK_PRINT_TEMPLATES.find(t => String(t.id) === String(id)) ?? null;
}

export function publishPrintTemplate(payload: {
  templateId: CommonType.IdType;
  elements: DesignerCanvasElement[];
  paperSize: string;
  orientation: PaperOrientation;
  publisherName?: string | null;
}): Api.Print.PrintTemplate | null {
  const row = getPrintTemplate(payload.templateId);
  if (!row) return null;

  savePrintTemplateDesign(payload.templateId, {
    elements: payload.elements,
    paperSize: payload.paperSize,
    orientation: payload.orientation
  });

  const now = nowText();
  const publisher = payload.publisherName || '系统管理员';
  const oldVersion = row.version;

  const currentVer = MOCK_TEMPLATE_VERSIONS.find(
    v => v.templateCode === row.templateCode && v.version === oldVersion
  );
  if (currentVer) {
    currentVer.status = 'archived';
    currentVer.updateTime = now;
  }

  const newVersion = oldVersion + 1;
  row.version = newVersion;
  row.status = 'published';
  row.paperSize = payload.paperSize;
  row.orientation = payload.orientation;
  row.publisherName = publisher;
  row.publishTime = now;
  row.updateTime = now;

  MOCK_TEMPLATE_VERSIONS.push({
    id: Number(`${row.id}${newVersion}`),
    templateCode: row.templateCode,
    templateName: row.templateName,
    templateType: row.templateType,
    version: newVersion,
    status: 'published',
    publisherName: publisher,
    effectiveTime: now,
    warehouseNames: row.warehouseName,
    customerNames: row.customerName,
    useCount: row.useCount,
    createTime: row.createTime,
    updateTime: now
  });

  return row;
}

export function submitPrintTemplateTest(payload: {
  templateId: CommonType.IdType;
  elements: DesignerCanvasElement[];
  paperSize: string;
  orientation: PaperOrientation;
  submitterName?: string | null;
}): Api.Print.PrintTemplate | null {
  const row = getPrintTemplate(payload.templateId);
  if (!row) return null;

  savePrintTemplateDesign(payload.templateId, {
    elements: payload.elements,
    paperSize: payload.paperSize,
    orientation: payload.orientation
  });

  const now = nowText();
  row.status = 'testing';
  row.paperSize = payload.paperSize;
  row.orientation = payload.orientation;
  row.updateTime = now;

  const currentVer = MOCK_TEMPLATE_VERSIONS.find(
    v => v.templateCode === row.templateCode && v.version === row.version
  );
  if (currentVer) {
    currentVer.status = 'testing';
    currentVer.updateTime = now;
  }

  return row;
}

function paginate<T>(rows: T[], params?: Record<string, any>) {
  const pageNum = Number(params?.pageNum || 1);
  const pageSize = Number(params?.pageSize || 10);
  const start = (pageNum - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, pageNum, pageSize };
}

export const MOCK_PRINT_TEMPLATES: Api.Print.PrintTemplate[] = [
  {
    id: 920001,
    templateCode: 'PLT-ANK-HV',
    templateName: 'Anker 高货值卡板贴',
    templateType: 'pallet_label',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: 'ANKER',
    paperSize: '100x150mm',
    orientation: 'portrait',
    version: 3,
    status: 'published',
    useCount: 2840,
    publisherName: '仓库经理',
    publishTime: '2026-05-20 14:00:00',
    remark: '含高货值/HOLD 双语警示',
    palletScopeType: 'destination',
    palletScopeValues: ['XLX7', 'LAX9'],
    createTime: '2026-03-01 10:00:00',
    updateTime: '2026-05-20 14:00:00'
  },
  {
    id: 920002,
    templateCode: 'PLT-STD',
    templateName: '标准卡板贴（FOREST）',
    templateType: 'pallet_label',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: '100x150mm',
    orientation: 'portrait',
    version: 5,
    status: 'published',
    useCount: 5620,
    publisherName: '系统管理员',
    publishTime: '2026-04-10 09:00:00',
    remark: null,
    palletScopeType: 'platform',
    palletScopeValues: ['Amazon', 'Amazon FBA'],
    createTime: '2026-01-15 08:00:00',
    updateTime: '2026-04-10 09:00:00'
  },
  {
    id: 920003,
    templateCode: 'DEV-40HC',
    templateName: '40/45尺海柜拆柜单',
    templateType: 'devanning',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 2,
    status: 'published',
    useCount: 890,
    publisherName: '仓库主管',
    publishTime: '2026-05-01 11:00:00',
    remark: '含 QC/主管签名栏',
    createTime: '2026-02-01 10:00:00',
    updateTime: '2026-05-01 11:00:00'
  },
  {
    id: 920013,
    templateCode: 'BOL-STD',
    templateName: '标准 BOL 提单（出库）',
    templateType: 'bol',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 2,
    status: 'published',
    useCount: 456,
    publisherName: '运输主管',
    publishTime: '2026-05-15 10:00:00',
    remark: '含发货人/收货人/承运人签名栏',
    createTime: '2026-03-10 09:00:00',
    updateTime: '2026-05-15 10:00:00'
  },
  {
    id: 920014,
    templateCode: 'BOL-LTL',
    templateName: 'LTL 拼车 BOL 模板',
    templateType: 'bol',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 1,
    status: 'draft',
    useCount: 0,
    publisherName: null,
    publishTime: null,
    remark: '草稿，待设计器完善',
    createTime: '2026-06-02 14:00:00',
    updateTime: '2026-06-02 14:00:00'
  },
  {
    id: 920004,
    templateCode: 'RPT-INV-M',
    templateName: '月度库存报表',
    templateType: 'report',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'landscape',
    version: 1,
    status: 'published',
    useCount: 45,
    publisherName: '仓库经理',
    publishTime: '2026-05-15 16:00:00',
    remark: '含合计行与页眉页脚',
    createTime: '2026-05-10 10:00:00',
    updateTime: '2026-05-15 16:00:00'
  },
  {
    id: 920005,
    templateCode: 'INV-SEA-STD',
    templateName: '海柜费用发票（标准）',
    templateType: 'invoice',
    invoiceSubtype: 'sea_container',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 4,
    status: 'published',
    useCount: 320,
    publisherName: '财务',
    publishTime: '2026-04-20 10:00:00',
    remark: '提柜/还柜/滞箱/仓储',
    createTime: '2026-01-20 09:00:00',
    updateTime: '2026-04-20 10:00:00'
  },
  {
    id: 920006,
    templateCode: 'INV-TRK-FTL',
    templateName: '卡车派送费用发票（FTL）',
    templateType: 'invoice',
    invoiceSubtype: 'truck_delivery',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 2,
    status: 'published',
    useCount: 156,
    publisherName: '财务',
    publishTime: '2026-05-05 14:00:00',
    remark: null,
    createTime: '2026-03-01 09:00:00',
    updateTime: '2026-05-05 14:00:00'
  },
  {
    id: 920010,
    templateCode: 'INV-DEV-40HC',
    templateName: '40/45尺拆柜费用发票',
    templateType: 'invoice',
    invoiceSubtype: 'devanning',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 2,
    status: 'published',
    useCount: 98,
    publisherName: '财务',
    publishTime: '2026-05-10 10:00:00',
    remark: '箱数/SKU/通宵附加费',
    createTime: '2026-04-01 09:00:00',
    updateTime: '2026-05-10 10:00:00'
  },
  {
    id: 920011,
    templateCode: 'INV-LOAD-FLOOR',
    templateName: '地板装车费用发票',
    templateType: 'invoice',
    invoiceSubtype: 'loading',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 1,
    status: 'published',
    useCount: 67,
    publisherName: '财务',
    publishTime: '2026-05-20 11:00:00',
    remark: '计费单位 CBM',
    createTime: '2026-05-01 09:00:00',
    updateTime: '2026-05-20 11:00:00'
  },
  {
    id: 920012,
    templateCode: 'INV-CUS-ANK',
    templateName: 'Anker 定制费用发票',
    templateType: 'invoice',
    invoiceSubtype: 'custom_fee',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: 'ANKER',
    paperSize: 'A4',
    orientation: 'portrait',
    version: 1,
    status: 'testing',
    useCount: 5,
    publisherName: null,
    publishTime: null,
    remark: '客户约定费项',
    createTime: '2026-05-28 14:00:00',
    updateTime: '2026-05-28 14:00:00'
  },
  {
    id: 920007,
    templateCode: 'CTN-FBA',
    templateName: 'FBA 箱贴模板',
    templateType: 'carton',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: 'Amazon 卖家',
    paperSize: '100x100mm',
    orientation: 'portrait',
    version: 1,
    status: 'testing',
    useCount: 12,
    publisherName: null,
    publishTime: null,
    remark: '测试中',
    createTime: '2026-05-28 10:00:00',
    updateTime: '2026-05-28 10:00:00'
  },
  {
    id: 920008,
    templateCode: 'LOC-STD',
    templateName: '库位标签（标准）',
    templateType: 'location',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: '50x30mm',
    orientation: 'landscape',
    version: 2,
    status: 'published',
    useCount: 1200,
    publisherName: '仓库经理',
    publishTime: '2026-04-01 09:00:00',
    remark: '含条形码',
    createTime: '2026-02-15 08:00:00',
    updateTime: '2026-04-01 09:00:00'
  },
  {
    id: 920009,
    templateCode: 'CUS-LOAD',
    templateName: '车次装车单模板',
    templateType: 'custom',
    invoiceSubtype: null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: 'A4',
    orientation: 'portrait',
    version: 1,
    status: 'draft',
    useCount: 0,
    publisherName: null,
    publishTime: null,
    remark: '草稿',
    createTime: '2026-06-01 11:00:00',
    updateTime: '2026-06-01 11:00:00'
  }
];

seedPalletTemplateDesigns();
seedBolTemplateDesigns();

export const MOCK_PRINT_TASKS: Api.Print.PrintTask[] = [
  {
    id: 921001,
    taskNo: 'PT-20260603-0001',
    docType: 'pallet_label',
    sourceNo: 'LA-20260603-0001',
    templateName: 'Anker 高货值卡板贴',
    printQty: 2,
    printerName: '贵品区标签打印机',
    creatorName: '张三',
    status: 'pending',
    failReason: null,
    reprintCount: 0,
    createTime: '2026-06-03 08:30:00',
    updateTime: '2026-06-03 08:30:00'
  },
  {
    id: 921002,
    taskNo: 'PT-20260603-0002',
    docType: 'devanning',
    sourceNo: 'FSCU1234567',
    templateName: '40/45尺海柜拆柜单',
    printQty: 1,
    printerName: 'DOCK-01 标签机',
    creatorName: '李四',
    status: 'printing',
    failReason: null,
    reprintCount: 0,
    createTime: '2026-06-03 09:00:00',
    updateTime: '2026-06-03 09:05:00'
  },
  {
    id: 921003,
    taskNo: 'PT-20260603-0003',
    docType: 'invoice',
    sourceNo: 'INV-2026-0528-001',
    templateName: '海柜费用发票（标准）',
    printQty: 1,
    printerName: '办公室 A4 打印机',
    creatorName: '王五',
    status: 'completed',
    failReason: null,
    reprintCount: 0,
    createTime: '2026-06-03 07:45:00',
    updateTime: '2026-06-03 07:46:00'
  },
  {
    id: 921004,
    taskNo: 'PT-20260603-0004',
    docType: 'pallet_label',
    sourceNo: 'LA-20260603-0012',
    templateName: '标准卡板贴（FOREST）',
    printQty: 1,
    printerName: '出库区标签机',
    creatorName: '赵六',
    status: 'failed',
    failReason: '设备离线',
    reprintCount: 1,
    createTime: '2026-06-03 08:00:00',
    updateTime: '2026-06-03 08:10:00'
  },
  {
    id: 921005,
    taskNo: 'PT-20260603-0005',
    docType: 'location',
    sourceNo: 'A09-01',
    templateName: '库位标签（标准）',
    printQty: 5,
    printerName: '入库区标签机',
    creatorName: '张三',
    status: 'pending',
    failReason: null,
    reprintCount: 0,
    createTime: '2026-06-03 09:15:00',
    updateTime: '2026-06-03 09:15:00'
  }
];

export const MOCK_PRINT_RECORDS: Api.Print.PrintRecord[] = [
  {
    id: 922001,
    printTime: '2026-06-03 09:10:00',
    printUser: '李四',
    templateName: '40/45尺海柜拆柜单',
    docType: 'devanning',
    sourceNo: 'FSCU1234567',
    printQty: 1,
    printerName: 'DOCK-01 标签机',
    isReprint: false,
    reprintReason: null,
    result: 'success',
    pdfUrl: '/mock/pdf/devanning-001.pdf',
    createTime: '2026-06-03 09:10:00',
    updateTime: '2026-06-03 09:10:00'
  },
  {
    id: 922002,
    printTime: '2026-06-03 08:55:00',
    printUser: '王五',
    templateName: '海柜费用发票（标准）',
    docType: 'invoice',
    sourceNo: 'INV-2026-0528-001',
    printQty: 1,
    printerName: '办公室 A4 打印机',
    isReprint: false,
    reprintReason: null,
    result: 'success',
    pdfUrl: '/mock/pdf/invoice-001.pdf',
    createTime: '2026-06-03 08:55:00',
    updateTime: '2026-06-03 08:55:00'
  },
  {
    id: 922003,
    printTime: '2026-06-03 08:10:00',
    printUser: '赵六',
    templateName: '标准卡板贴（FOREST）',
    docType: 'pallet_label',
    sourceNo: 'LA-20260603-0012',
    printQty: 1,
    printerName: '出库区标签机',
    isReprint: true,
    reprintReason: '首次打印失败，设备离线后重打',
    result: 'failed',
    pdfUrl: null,
    createTime: '2026-06-03 08:10:00',
    updateTime: '2026-06-03 08:10:00'
  }
];

export const MOCK_PRINTERS: Api.Print.Printer[] = [
  {
    id: 923001,
    printerCode: 'PR-LBL-VIP',
    printerName: '贵品区标签打印机',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneName: '贵品区',
    deviceType: 'label',
    ipAddress: '192.168.10.21',
    defaultPaper: '100x150mm',
    onlineStatus: 'online',
    defaultTemplateName: 'Anker 高货值卡板贴',
    lastPrintTime: '2026-06-03 08:30:00',
    bindScene: '贵品区卡板贴',
    abnormalStatus: null,
    createTime: '2026-01-01 00:00:00',
    updateTime: '2026-06-03 08:30:00'
  },
  {
    id: 923002,
    printerCode: 'PR-DOCK-01',
    printerName: 'DOCK-01 标签机',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneName: 'DOCK-01',
    deviceType: 'label',
    ipAddress: '192.168.10.31',
    defaultPaper: '100x150mm',
    onlineStatus: 'online',
    defaultTemplateName: '标准卡板贴（FOREST）',
    lastPrintTime: '2026-06-03 09:10:00',
    bindScene: '拆柜 DOCK 绑定',
    abnormalStatus: null,
    createTime: '2026-01-01 00:00:00',
    updateTime: '2026-06-03 09:10:00'
  },
  {
    id: 923003,
    printerCode: 'PR-A4-OFFICE',
    printerName: '办公室 A4 打印机',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneName: '办公室',
    deviceType: 'a4',
    ipAddress: '192.168.10.50',
    defaultPaper: 'A4',
    onlineStatus: 'online',
    defaultTemplateName: '海柜费用发票（标准）',
    lastPrintTime: '2026-06-03 08:55:00',
    bindScene: '发票打印',
    abnormalStatus: null,
    createTime: '2026-01-01 00:00:00',
    updateTime: '2026-06-03 08:55:00'
  },
  {
    id: 923004,
    printerCode: 'PR-OUT-LBL',
    printerName: '出库区标签机',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneName: '出库区',
    deviceType: 'label',
    ipAddress: '192.168.10.41',
    defaultPaper: '100x150mm',
    onlineStatus: 'offline',
    defaultTemplateName: '标准卡板贴（FOREST）',
    lastPrintTime: '2026-06-02 18:00:00',
    bindScene: '车次装车单',
    abnormalStatus: '设备离线超过 12 小时',
    createTime: '2026-01-01 00:00:00',
    updateTime: '2026-06-03 07:00:00'
  },
  {
    id: 923005,
    printerCode: 'PR-IN-LBL',
    printerName: '入库区标签机',
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneName: '入库区',
    deviceType: 'thermal',
    ipAddress: '192.168.10.11',
    defaultPaper: '50x30mm',
    onlineStatus: 'online',
    defaultTemplateName: '库位标签（标准）',
    lastPrintTime: '2026-06-03 07:30:00',
    bindScene: '库位标签',
    abnormalStatus: null,
    createTime: '2026-01-01 00:00:00',
    updateTime: '2026-06-03 07:30:00'
  }
];

export const MOCK_TEMPLATE_VERSIONS: Api.Print.TemplateVersion[] = MOCK_PRINT_TEMPLATES.flatMap(t =>
  [1, 2, 3].slice(0, t.version).map(v => ({
    id: Number(`${t.id}${v}`),
    templateCode: t.templateCode,
    templateName: t.templateName,
    templateType: t.templateType,
    version: v,
    status: v === t.version ? t.status : 'archived',
    publisherName: t.publisherName,
    effectiveTime: v === t.version ? t.publishTime : `2026-0${v}-01 00:00:00`,
    warehouseNames: t.warehouseName,
    customerNames: t.customerName,
    useCount: v === t.version ? t.useCount : Math.floor(t.useCount / (4 - v)),
    createTime: t.createTime,
    updateTime: t.updateTime
  }))
);

export const MOCK_PRINT_RULES: Api.Print.PrintRule[] = [
  {
    id: 924001,
    ruleCode: 'PRT-001',
    ruleName: 'Anker 高货值卡板贴自动选模板',
    docType: 'pallet_label',
    triggerEvent: 'DEVANNING_PALLET_COMPLETE',
    conditionSummary: '客户=ANKER 且 货物类型=高货值',
    templateId: 920001,
    templateCode: 'PLT-ANK-HV',
    templateName: 'Anker 高货值卡板贴',
    paperSize: '100x150mm',
    printQty: 2,
    printMode: 'preview',
    printerId: 923001,
    printerName: '贵品区标签打印机',
    groupCodes: null,
    palletScopeType: 'destination',
    palletScopeValues: ['XLX7', 'LAX9'],
    priority: 100,
    status: 'enabled',
    hitCount: 420,
    createTime: '2026-04-01 10:00:00',
    updateTime: '2026-06-01 09:00:00'
  },
  {
    id: 924004,
    ruleCode: 'PRT-004',
    ruleName: '拆柜板贴 · PLT-STD · 预览4份',
    docType: 'pallet_label',
    triggerEvent: 'DEVANNING_PALLET_COMPLETE',
    conditionSummary: '触发=拆柜录入板贴完成；目的地分组=FedEx-LAX/UPS-ORD/FBA-ONT/同行散板',
    templateId: 920002,
    templateCode: 'PLT-STD',
    templateName: '标准卡板贴（FOREST）',
    paperSize: '100x150mm',
    printQty: 4,
    printMode: 'preview',
    printerId: 923002,
    printerName: 'DOCK-01 标签机',
    groupCodes: ['FedEx-LAX', 'UPS-ORD', 'FBA-ONT', '同行散板'],
    palletScopeType: 'platform',
    palletScopeValues: ['Amazon', 'Amazon FBA'],
    priority: 50,
    status: 'enabled',
    hitCount: 1286,
    createTime: '2026-06-01 10:00:00',
    updateTime: '2026-06-06 09:00:00'
  },
  {
    id: 924002,
    ruleCode: 'PRT-002',
    ruleName: '40/45尺拆柜完成自动生成发票',
    docType: 'invoice',
    triggerEvent: 'DEVANNING_COMPLETE',
    conditionSummary: '柜型=40HC/45HC 且 拆柜状态=已完成',
    templateId: 920005,
    templateCode: 'INV-SEA-STD',
    templateName: '海柜费用发票（标准）',
    paperSize: 'A4',
    printQty: 1,
    printMode: 'direct',
    printerId: 923003,
    printerName: '办公室 A4 打印机',
    groupCodes: null,
    palletScopeType: null,
    palletScopeValues: null,
    priority: 90,
    status: 'enabled',
    hitCount: 86,
    createTime: '2026-04-15 11:00:00',
    updateTime: '2026-05-20 14:00:00'
  },
  {
    id: 924003,
    ruleCode: 'PRT-003',
    ruleName: '地板装车费用发票模板',
    docType: 'invoice',
    triggerEvent: 'OUTBOUND_LOAD_COMPLETE',
    conditionSummary: '装车类型=地板装车',
    templateId: 920011,
    templateCode: 'INV-LOAD-FLOOR',
    templateName: '地板装车费用发票',
    paperSize: 'A4',
    printQty: 1,
    printMode: 'direct',
    printerId: 923003,
    printerName: '办公室 A4 打印机',
    groupCodes: null,
    palletScopeType: null,
    palletScopeValues: null,
    priority: 80,
    status: 'enabled',
    hitCount: 34,
    createTime: '2026-05-01 09:00:00',
    updateTime: '2026-05-28 16:00:00'
  }
];

export function getPrintTemplateList(params?: Record<string, any>) {
  let rows = [...MOCK_PRINT_TEMPLATES];
  if (params?.templateType) rows = rows.filter(r => r.templateType === params.templateType);
  if (params?.invoiceSubtype) rows = rows.filter(r => r.invoiceSubtype === params.invoiceSubtype);
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.templateName) {
    const k = String(params.templateName).toLowerCase();
    rows = rows.filter(r => r.templateName.toLowerCase().includes(k) || r.templateCode.toLowerCase().includes(k));
  }
  if (params?.customerName) {
    const k = String(params.customerName).toLowerCase();
    rows = rows.filter(r => (r.customerName || '').toLowerCase().includes(k));
  }
  if (params?.palletScopeType) {
    rows = rows.filter(r => (r.palletScopeType || 'all') === params.palletScopeType);
  }
  if (params?.palletScopeValue) {
    const v = String(params.palletScopeValue);
    rows = rows.filter(r => {
      const type = r.palletScopeType || 'all';
      if (type === 'all' || !r.palletScopeValues?.length) return v === '全部';
      return r.palletScopeValues.includes(v);
    });
  }
  return paginate(rows, params);
}

export function updatePrintTemplateScope(
  id: CommonType.IdType,
  patch: Pick<Api.Print.PrintTemplate, 'templateName' | 'palletScopeType' | 'palletScopeValues'>
) {
  const row = MOCK_PRINT_TEMPLATES.find(r => r.id === id);
  if (!row) return false;
  Object.assign(row, patch, { updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ') });
  return true;
}

export function createPrintTemplate(data: {
  templateName: string;
  templateType: Api.Print.TemplateType;
  invoiceSubtype?: Api.Print.InvoiceSubtype | null;
  palletScopeType?: Api.Print.PalletScopeType;
  palletScopeValues?: string[];
}) {
  const id = nextId();
  const prefixMap: Record<string, string> = {
    pallet_label: 'PLT',
    devanning: 'DEV',
    bol: 'BOL',
    report: 'RPT',
    invoice: 'INV',
    carton: 'CTN',
    location: 'LOC',
    custom: 'CUS'
  };
  const prefix = prefixMap[data.templateType] || 'TPL';
  const row: Api.Print.PrintTemplate = {
    id,
    templateCode: `${prefix}-${String(id).slice(-4)}`,
    templateName: data.templateName,
    templateType: data.templateType,
    invoiceSubtype: data.invoiceSubtype ?? null,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    customerName: null,
    paperSize: '100x150mm',
    orientation: 'portrait',
    version: 1,
    status: 'draft',
    useCount: 0,
    publisherName: null,
    publishTime: null,
    remark: null,
    palletScopeType: data.palletScopeType ?? 'all',
    palletScopeValues: data.palletScopeValues ?? [],
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  MOCK_PRINT_TEMPLATES.unshift(row);
  if (data.templateType === 'pallet_label') {
    TEMPLATE_DESIGN_LAYOUTS.set(String(id), buildDefaultPalletDesign(row.paperSize || '100x150mm', row.orientation || 'portrait'));
  }
  if (data.templateType === 'bol') {
    TEMPLATE_DESIGN_LAYOUTS.set(String(id), buildDefaultBolDesign());
  }
  return row;
}

export function getPrintTaskList(params?: Record<string, any>) {
  let rows = [...MOCK_PRINT_TASKS];
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.docType) rows = rows.filter(r => r.docType === params.docType);
  if (params?.taskNo) {
    const k = String(params.taskNo).toLowerCase();
    rows = rows.filter(r => r.taskNo.toLowerCase().includes(k));
  }
  if (params?.sourceNo) {
    const k = String(params.sourceNo).toLowerCase();
    rows = rows.filter(r => r.sourceNo.toLowerCase().includes(k));
  }
  rows.sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)));
  return paginate(rows, params);
}

export function getPrintRecordList(params?: Record<string, any>) {
  let rows = [...MOCK_PRINT_RECORDS];
  if (params?.docType) rows = rows.filter(r => r.docType === params.docType);
  if (params?.result) rows = rows.filter(r => r.result === params.result);
  if (params?.printUser) {
    const k = String(params.printUser).toLowerCase();
    rows = rows.filter(r => r.printUser.toLowerCase().includes(k));
  }
  if (params?.sourceNo) {
    const k = String(params.sourceNo).toLowerCase();
    rows = rows.filter(r => r.sourceNo.toLowerCase().includes(k));
  }
  rows.sort((a, b) => String(b.printTime).localeCompare(String(a.printTime)));
  return paginate(rows, params);
}

export function getPrintPrinterList(params?: Record<string, any>) {
  let rows = [...MOCK_PRINTERS];
  if (params?.onlineStatus) rows = rows.filter(r => r.onlineStatus === params.onlineStatus);
  if (params?.deviceType) rows = rows.filter(r => r.deviceType === params.deviceType);
  if (params?.warehouseName) {
    const k = String(params.warehouseName).toLowerCase();
    rows = rows.filter(r => r.warehouseName.toLowerCase().includes(k));
  }
  if (params?.printerName) {
    const k = String(params.printerName).toLowerCase();
    rows = rows.filter(r => r.printerName.toLowerCase().includes(k));
  }
  return paginate(rows, params);
}

export function getPrintTemplateVersionList(params?: Record<string, any>) {
  let rows = [...MOCK_TEMPLATE_VERSIONS];
  if (params?.templateType) rows = rows.filter(r => r.templateType === params.templateType);
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.templateName) {
    const k = String(params.templateName).toLowerCase();
    rows = rows.filter(r => r.templateName.toLowerCase().includes(k));
  }
  rows.sort((a, b) => {
    const cmp = a.templateCode.localeCompare(b.templateCode);
    return cmp !== 0 ? cmp : b.version - a.version;
  });
  return paginate(rows, params);
}

function buildRuleConditionSummary(payload: Api.Print.SavePrintRulePayload, template?: Api.Print.PrintTemplate | null) {
  const triggerLabel =
    payload.triggerEvent === 'DEVANNING_PALLET_COMPLETE'
      ? '拆柜录入板贴完成'
      : payload.triggerEvent;
  const parts = [`触发=${triggerLabel}`];
  if (payload.groupCodes?.length) {
    parts.push(`目的地分组=${payload.groupCodes.join('/')}`);
  }
  if (template && payload.palletScopeType !== 'all' && payload.palletScopeValues?.length) {
    const prefix = payload.palletScopeType === 'destination' ? '模板目的地' : '模板平台';
    parts.push(`${prefix}=${payload.palletScopeValues.join('/')}`);
  }
  return parts.join('；');
}

export function savePrintRule(payload: Api.Print.SavePrintRulePayload): Api.Print.PrintRule {
  const template = getPrintTemplate(payload.templateId);
  const printer = MOCK_PRINTERS.find(p => String(p.id) === String(payload.printerId)) ?? null;
  const now = nowText();
  const summary = buildRuleConditionSummary(payload, template);

  if (payload.id) {
    const row = MOCK_PRINT_RULES.find(r => String(r.id) === String(payload.id));
    if (!row) throw new Error('规则不存在');
    Object.assign(row, {
      ruleName: payload.ruleName,
      docType: payload.docType,
      triggerEvent: payload.triggerEvent,
      conditionSummary: summary,
      templateId: payload.templateId,
      templateCode: template?.templateCode || row.templateCode,
      templateName: template?.templateName || row.templateName,
      paperSize: template?.paperSize || row.paperSize,
      printQty: payload.printQty,
      printMode: payload.printMode,
      printerId: payload.printerId,
      printerName: printer?.printerName || null,
      groupCodes: payload.groupCodes.length ? [...payload.groupCodes] : null,
      palletScopeType: payload.palletScopeType,
      palletScopeValues: payload.palletScopeValues.length ? [...payload.palletScopeValues] : null,
      priority: payload.priority,
      status: payload.status,
      updateTime: now
    });
    return row;
  }

  const id = nextId();
  const row: Api.Print.PrintRule = {
    id,
    ruleCode: `PRT-${String(id).slice(-3)}`,
    ruleName: payload.ruleName,
    docType: payload.docType,
    triggerEvent: payload.triggerEvent,
    conditionSummary: summary,
    templateId: payload.templateId,
    templateCode: template?.templateCode || '',
    templateName: template?.templateName || '',
    paperSize: template?.paperSize || '100x150mm',
    printQty: payload.printQty,
    printMode: payload.printMode,
    printerId: payload.printerId,
    printerName: printer?.printerName || null,
    groupCodes: payload.groupCodes.length ? [...payload.groupCodes] : null,
    palletScopeType: payload.palletScopeType,
    palletScopeValues: payload.palletScopeValues.length ? [...payload.palletScopeValues] : null,
    priority: payload.priority,
    status: payload.status,
    hitCount: 0,
    createTime: now,
    updateTime: now
  };
  MOCK_PRINT_RULES.unshift(row);
  return row;
}

export function matchPrintRule(context: Api.Print.PrintRuleMatchContext): Api.Print.PrintRuleMatchResult | null {
  const candidates = MOCK_PRINT_RULES.filter(
    r =>
      r.status === 'enabled' &&
      r.docType === context.docType &&
      r.triggerEvent === context.triggerEvent
  ).sort((a, b) => b.priority - a.priority);

  for (const rule of candidates) {
    if (rule.groupCodes?.length) {
      const group = context.groupCode || '';
      if (!rule.groupCodes.includes(group)) continue;
    }
    if (rule.id === 924001 && !context.highValue) continue;
    if (rule.id === 924001 && context.customerName && context.customerName !== 'ANKER') continue;

    const template = getPrintTemplate(rule.templateId);
    if (!template || template.status !== 'published') continue;

    if (rule.palletScopeType && rule.palletScopeType !== 'all' && rule.palletScopeValues?.length) {
      if (rule.palletScopeType === 'platform' && context.platformName) {
        if (!rule.palletScopeValues.includes(context.platformName)) continue;
      }
      if (rule.palletScopeType === 'destination' && context.groupCode) {
        if (!rule.palletScopeValues.includes(context.groupCode)) continue;
      }
    }

    rule.hitCount += 1;
    rule.updateTime = nowText();
    const printer = rule.printerId
      ? MOCK_PRINTERS.find(p => String(p.id) === String(rule.printerId)) ?? null
      : null;
    return { rule, template, printer };
  }
  return null;
}

export function getPrintRuleList(params?: Record<string, any>) {
  let rows = [...MOCK_PRINT_RULES];
  if (params?.docType) rows = rows.filter(r => r.docType === params.docType);
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.ruleName) {
    const k = String(params.ruleName).toLowerCase();
    rows = rows.filter(r => r.ruleName.toLowerCase().includes(k));
  }
  rows.sort((a, b) => b.priority - a.priority);
  return paginate(rows, params);
}

export function getPrintWorkbench(): Api.Print.WorkbenchStats {
  const pendingToday = MOCK_PRINT_TASKS.filter(t => t.status === 'pending' || t.status === 'printing').length;
  const printedToday = MOCK_PRINT_TASKS.filter(t => t.status === 'completed').length;
  const failedToday = MOCK_PRINT_TASKS.filter(t => t.status === 'failed').length;
  const onlinePrinters = MOCK_PRINTERS.filter(p => p.onlineStatus === 'online').length;
  return {
    pendingToday,
    printedToday,
    failedToday,
    onlinePrinters,
    totalPrinters: MOCK_PRINTERS.length,
    recentTemplates: MOCK_PRINT_TEMPLATES.filter(t => t.status === 'published')
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5)
      .map(t => ({ id: t.id, name: t.templateName, type: t.templateType, useCount: t.useCount })),
    recentRecords: MOCK_PRINT_RECORDS.slice(0, 5),
    printerStatus: MOCK_PRINTERS.map(p => ({
      name: p.printerName,
      onlineStatus: p.onlineStatus,
      warehouseName: p.warehouseName
    })),
    alerts: [
      { level: 'error', message: '出库区标签机离线，3 个卡板贴任务待处理', time: '2026-06-03 08:15:00' },
      { level: 'warning', message: 'FBA 箱贴模板处于测试中，尚未发布', time: '2026-06-02 17:00:00' }
    ]
  };
}
