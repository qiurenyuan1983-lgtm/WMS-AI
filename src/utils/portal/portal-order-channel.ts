/** 客户门户订单业务渠道（与海柜内货件类型一致） */
export type PortalOrderChannel =
  | 'AMAZON'
  | 'COMMERCIAL_PLATFORM'
  | 'PRIVATE_ADDRESS'
  | 'DROPSHIP'
  | 'TRANSFER';

export const PORTAL_ORDER_CHANNEL_OPTIONS: Array<{ value: PortalOrderChannel; label: string; desc: string }> = [
  { value: 'AMAZON', label: '亚马逊', desc: 'FBA / 亚马逊平台仓预约派送' },
  { value: 'COMMERCIAL_PLATFORM', label: '商业平台', desc: 'Walmart / Target 等平台仓' },
  { value: 'PRIVATE_ADDRESS', label: '私人/商业地址', desc: '住宅或商业地址卡派/LTL' },
  { value: 'DROPSHIP', label: '一件代发', desc: '从在库库存直发终端客户' },
  { value: 'TRANSFER', label: '中转业务', desc: '暂扣、换标、库内操作与二次出库' }
];

export const PORTAL_ORDER_CHANNEL_META: Record<
  PortalOrderChannel,
  { label: string; type: NaiveUI.ThemeColor }
> = {
  AMAZON: { label: '亚马逊', type: 'warning' },
  COMMERCIAL_PLATFORM: { label: '商业平台', type: 'info' },
  PRIVATE_ADDRESS: { label: '私人/商业地址', type: 'primary' },
  DROPSHIP: { label: '一件代发', type: 'success' },
  TRANSFER: { label: '中转业务', type: 'default' }
};
