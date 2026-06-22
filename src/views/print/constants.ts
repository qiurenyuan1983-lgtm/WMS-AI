/** 打印中心 — 与系统方案 / PRD 对齐的常量定义 */

export type PrintInvoiceSubtype = Api.Print.InvoiceSubtype;

export const PRINT_MENU_CODE = '4000';

/** 卡板贴模板 — 可选目的地（FBA/平台仓代码） */
export const PALLET_LABEL_DESTINATION_OPTIONS = [
  'XLX7',
  'LAX9',
  'ONT8',
  'ORD2',
  'FTW1',
  'SMF3',
  'MDW2',
  'PHX3'
].map(value => ({ label: value, value }));

/** 卡板贴模板 — 可选平台 */
export const PALLET_LABEL_PLATFORM_OPTIONS = [
  'Amazon',
  'Amazon FBA',
  'Walmart',
  'Walmart WFS',
  'Target',
  'Wayfair',
  'Shopify'
].map(value => ({ label: value, value }));

export const PALLET_SCOPE_TYPE_OPTIONS: Array<{ label: string; value: Api.Print.PalletScopeType }> = [
  { label: '全部', value: 'all' },
  { label: '按目的地', value: 'destination' },
  { label: '按平台', value: 'platform' }
];

/** 拆柜作业 — 目的地分组（与打印规则 groupCodes 对齐） */
export const DEVANNING_GROUP_OPTIONS = [
  'FedEx-LAX',
  'UPS-ORD',
  'FBA-ONT',
  '同行散板',
  'XLX7',
  'LAX9',
  'ONT8'
].map(value => ({ label: value, value }));

export const PRINT_RULE_TRIGGER_OPTIONS: Array<{
  label: string;
  value: Api.Print.PrintRuleTrigger;
  docTypes: Api.Print.DocType[];
}> = [
  { label: '拆柜录入板贴完成', value: 'DEVANNING_PALLET_COMPLETE', docTypes: ['pallet_label'] },
  { label: '拆柜完成', value: 'DEVANNING_COMPLETE', docTypes: ['devanning', 'invoice'] },
  { label: '装车完成', value: 'OUTBOUND_LOAD_COMPLETE', docTypes: ['bol', 'custom'] },
  { label: '批量卡板贴', value: 'BATCH_PALLET_LABEL', docTypes: ['pallet_label'] },
  { label: '手工补打', value: 'MANUAL_REPRINT', docTypes: ['pallet_label', 'bol', 'location', 'carton'] }
];

export const PRINT_RULE_MODE_OPTIONS: Array<{ label: string; value: Api.Print.PrintRuleMode }> = [
  { label: '预览后打印', value: 'preview' },
  { label: '直接打印', value: 'direct' }
];

export function formatPalletScopeLabel(
  scopeType?: Api.Print.PalletScopeType | null,
  scopeValues?: string[] | null
): string {
  if (!scopeType || scopeType === 'all' || !scopeValues?.length) return '全部';
  const prefix = scopeType === 'destination' ? '目的地' : '平台';
  return `${prefix}：${scopeValues.join('、')}`;
}

export const TEMPLATE_VERSION_LIFECYCLE = [
  { key: 'draft', label: '草稿', desc: '设计器保存，未进入测试' },
  { key: 'testing', label: '测试中', desc: '测试数据预览、试打印' },
  { key: 'pending_approval', label: '待审批', desc: '仓库经理/财务审批' },
  { key: 'published', label: '已发布', desc: '生产环境可用' },
  { key: 'disabled', label: '已停用', desc: '暂停使用，保留历史' },
  { key: 'archived', label: '已归档', desc: '只读，不可回滚为当前版' }
] as const;

export const INVOICE_TEMPLATE_CATEGORIES: Array<{
  key: PrintInvoiceSubtype;
  label: string;
  desc: string;
  feeExamples: string[];
}> = [
  {
    key: 'sea_container',
    label: '海柜费用发票',
    desc: '提柜、还柜、滞箱、滞港、仓储等',
    feeExamples: ['提柜费', '还柜费', '底盘费', '滞箱费', '滞港费', '仓储费']
  },
  {
    key: 'truck_delivery',
    label: '卡车派送费用发票',
    desc: 'LTL/FTL、Amazon 预约派送等',
    feeExamples: ['运输费', '等待费', '预约费', '附加费']
  },
  {
    key: 'devanning',
    label: '拆柜费用发票',
    desc: '海柜拆柜、专家拆、拒收、直拆直装等',
    feeExamples: ['基础费', '箱数附加费', 'SKU附加费', '通宵附加费']
  },
  {
    key: 'loading',
    label: '装车费用发票',
    desc: '卡板装车、地板装车、转运装车等',
    feeExamples: ['基础费', '劳务费', '奖金', '附加费']
  },
  {
    key: 'custom_fee',
    label: '自定义费用发票',
    desc: '客户定制费项与说明',
    feeExamples: ['特殊操作费', '客户约定费项']
  }
];

export const BATCH_PRINT_SCENES: Array<{
  key: string;
  label: string;
  sourceLabel: string;
  sourcePlaceholder: string;
  dataRule: string;
  docType: Api.Print.DocType;
}> = [
  {
    key: 'container_pallet',
    label: '海柜批量卡板贴',
    sourceLabel: '海柜号',
    sourcePlaceholder: 'FSCU1234567',
    dataRule: '读取该海柜全部卡板 → 按客户/规则匹配模板',
    docType: 'pallet_label'
  },
  {
    key: 'trip_loading',
    label: '车次批量装车单',
    sourceLabel: '车次号',
    sourcePlaceholder: 'TRIP-20260603-001',
    dataRule: '读取车次下全部装车单据',
    docType: 'custom'
  },
  {
    key: 'multi_order_pallet',
    label: '多订单批量卡板贴',
    sourceLabel: '订单号',
    sourcePlaceholder: '多个订单号，逗号分隔',
    dataRule: '按订单关联卡板批量生成',
    docType: 'pallet_label'
  },
  {
    key: 'multi_devanning',
    label: '多海柜批量拆柜单',
    sourceLabel: '海柜号',
    sourcePlaceholder: '多个海柜号，逗号分隔',
    dataRule: '按拆柜完成状态生成拆柜单',
    docType: 'devanning'
  },
  {
    key: 'multi_invoice',
    label: '批量费用发票',
    sourceLabel: '发票批次/单号',
    sourcePlaceholder: 'INV-BATCH-202606 或逗号分隔单号',
    dataRule: '按发票类型分组匹配模板与打印机',
    docType: 'invoice'
  },
  {
    key: 'multi_location',
    label: '批量库位标签',
    sourceLabel: '库位号',
    sourcePlaceholder: 'A09-01,A09-02 或库区编码',
    dataRule: '按库位列表生成标签',
    docType: 'location'
  }
];

export const PRINT_ROLE_PERMISSIONS: Array<{
  role: string;
  roleCode: string;
  permissions: string[];
}> = [
  {
    role: '操作员',
    roleCode: 'OPERATOR',
    permissions: ['打印卡板贴', '打印拆柜单', '查看本人打印记录']
  },
  {
    role: '仓库主管',
    roleCode: 'WH_SUPERVISOR',
    permissions: ['打印报表', '重新打印', '审核异常打印', '批量打印（现场）']
  },
  {
    role: '仓库经理',
    roleCode: 'WH_MANAGER',
    permissions: ['管理仓库模板', '提交模板审批', '发布本仓库模板', '打印机绑定']
  },
  {
    role: '财务',
    roleCode: 'FINANCE',
    permissions: ['打印/管理费用发票', '审批发票模板', '导出发票 PDF']
  },
  {
    role: '系统管理员',
    roleCode: 'ADMIN',
    permissions: ['全部模板', '全部打印机', '打印规则', '权限配置', '版本回滚']
  },
  {
    role: '供应商',
    roleCode: 'SUPPLIER',
    permissions: ['查看授权发票', '下载 PDF']
  },
  {
    role: '客户',
    roleCode: 'CUSTOMER',
    permissions: ['查看授权账单', '下载 PDF']
  }
];

export const DESIGNER_FIELD_GROUPS: Array<{ group: string; fields: string[] }> = [
  {
    group: '基础信息',
    fields: ['仓库名称', '客户名称', '订单号', '操作人', '打印日期']
  },
  {
    group: '海柜/拆柜',
    fields: ['海柜号', '柜型', '拆柜日期', 'DOCK号', '箱数', '板数', 'SKU数量']
  },
  {
    group: 'BOL/运输',
    fields: [
      'BOL号',
      '发货人',
      '收货人',
      '收货地址',
      '承运人',
      '起运地',
      '目的地',
      '货物描述',
      '件数',
      '重量',
      '体积',
      '车次号',
      '车牌号',
      '司机',
      '提货日期',
      '签收日期'
    ]
  },
  {
    group: '卡板/库位',
    fields: ['卡板号', '库位号', '目的地', 'FBA Shipment ID', 'FBX号', '箱数', '卡板尺寸']
  },
  {
    group: '标识/警示',
    fields: ['高货值标识', 'HOLD标识', 'MIX混货标识', '特殊操作备注']
  },
  {
    group: '码图',
    fields: ['二维码', '条形码']
  },
  {
    group: '费用/发票',
    fields: ['发票编号', '服务项目', '数量', '单价', '金额', '税费', '总金额', '付款条款']
  }
];

/** 二维码可绑定的业务字段（不含码图本身） */
export const QRCODE_BIND_FIELD_OPTIONS = Array.from(
  new Set(
    DESIGNER_FIELD_GROUPS.flatMap(g => g.fields).filter(f => f !== '二维码' && f !== '条形码')
  )
).map(field => ({ label: field, value: field }));

export const DESIGNER_COMPONENTS = [
  '文本', '标题', '动态字段', '表格', '图片', '公司Logo', '二维码', '条形码',
  '横线', '竖线', '方框', '签名栏', '日期', '页码', '号码排列', '合计金额', '自定义说明'
] as const;

export const DESIGNER_ACTIONS = [
  { key: 'save', label: '保存草稿' },
  { key: 'preview', label: '预览' },
  { key: 'test', label: '测试打印' },
  { key: 'submit', label: '提交测试' },
  { key: 'publish', label: '发布' }
] as const;
