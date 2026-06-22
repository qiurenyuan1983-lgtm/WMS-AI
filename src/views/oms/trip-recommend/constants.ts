export const APPOINTMENT_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: 'Floor', value: 'FLOOR' },
  { label: 'Pallet', value: 'PALLET' }
];

export const PLATFORM_OPTIONS = [
  { label: '全部', value: '' },
  { label: 'Amazon', value: 'Amazon' },
  { label: 'Walmart', value: 'Walmart' },
  { label: 'SHEIN', value: 'SHEIN' },
  { label: 'Target', value: 'Target' },
  { label: 'Wayfair', value: 'Wayfair' }
];

export const INVENTORY_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '可用', value: 'AVAILABLE' },
  { label: '锁定', value: 'LOCKED' },
  { label: '不可用', value: 'UNAVAILABLE' }
];

export const CARGO_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '正常', value: 'NORMAL' },
  { label: '暂扣', value: 'HOLD' },
  { label: '异常', value: 'ABNORMAL' }
];

export const BOOL_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '是', value: '1' },
  { label: '否', value: '0' }
];

export const RECOMMEND_STATUS_META: Record<
  Api.Oms.TripRecommendSummaryRow['recommendStatus'],
  { label: string; type: NaiveUI.ThemeColor }
> = {
  READY: { label: '可生成', type: 'success' },
  PARTIAL: { label: '部分可操作', type: 'warning' },
  BLOCKED: { label: '不可操作', type: 'error' },
  GENERATED: { label: '已生成', type: 'default' }
};

export const FEE_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  CONFIRMED: { label: '已确认', type: 'success' },
  ALLOW_EXECUTE: { label: '允许执行', type: 'info' },
  PENDING_CONFIRM: { label: '待确认', type: 'warning' }
};

export const INVENTORY_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  AVAILABLE: { label: '可用', type: 'success' },
  LOCKED: { label: '锁定', type: 'warning' },
  UNAVAILABLE: { label: '不可用', type: 'default' }
};

export const SEARCH_PLACEHOLDER =
  '请输入目的地 / 平台 / 预约号 / 订单号 / 客户 / 卡板号';
