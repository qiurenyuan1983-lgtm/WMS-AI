export type OrderPoolKey = 'ALL' | 'AMAZON' | 'PLATFORM' | 'LTL' | 'LOCAL' | 'EXPRESS';

export type OrderTabKey =
  | 'ALL'
  | 'PENDING_APPT'
  | 'PRE_TRIP'
  | 'PENDING_MANUAL'
  | 'PENDING_CARGO'
  | 'PENDING_CUSTOMER'
  | 'GENERATED'
  | 'ABNORMAL';

export const ORDER_POOL_OPTIONS: Array<{ key: OrderPoolKey; label: string; desc: string; shortLabel: string }> = [
  { key: 'ALL', label: '全部订单池', shortLabel: '全', desc: '亚马逊 / 平台预约 / LTL / 本地 / 快递汇总' },
  { key: 'AMAZON', label: '亚马逊订单池', shortLabel: '亚', desc: 'Amazon FBA ISA 预约订单' },
  { key: 'PLATFORM', label: '平台预约池', shortLabel: '平', desc: 'Walmart 等平台 ISA 预约订单' },
  { key: 'LTL', label: 'LTL 订单池', shortLabel: 'LTL', desc: '供应商匹配与自动下单' },
  { key: 'LOCAL', label: '本地/商业地址', shortLabel: '本', desc: '客户邮件确认后生成预车次' },
  { key: 'EXPRESS', label: '快递订单池', shortLabel: '快', desc: '人工生成订单与贴标' }
];

export const STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING_APPT: { label: '待预约', type: 'default' },
  PRE_TRIP: { label: '预出车次', type: 'info' },
  PENDING_MANUAL: { label: '待人工确认', type: 'warning' },
  PENDING_CARGO: { label: '待添加货物', type: 'info' },
  PENDING_CUSTOMER: { label: '待客户确认', type: 'default' },
  GENERATED: { label: '已生成订单', type: 'success' },
  ABNORMAL: { label: '异常', type: 'error' }
};

export const POOL_TYPE_TAG: Record<string, NaiveUI.ThemeColor> = {
  AMAZON: 'info',
  PLATFORM: 'info',
  LTL: 'success',
  LOCAL: 'warning',
  EXPRESS: 'error'
};

export const WORKFLOW_STEPS = [
  '识别订单类型',
  '生成预车次/预订单',
  '人工确认',
  '添加货物',
  '生成正式订单',
  '推送 WMS',
  '推送 TMS'
];

export type WorkbenchAction =
  | 'autoPreTrip'
  | 'manualConfirm'
  | 'addCargo'
  | 'generateOrder'
  | 'pushWms'
  | 'pushTms'
  | 'sendCustomerEmail'
  | 'confirmCustomer'
  | 'rematchSupplier'
  | 'markAbnormal'
  | 'cancel';
