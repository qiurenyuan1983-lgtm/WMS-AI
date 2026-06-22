/** TMS 车次状态 */
export type TmsTripStatus =
  | 'PENDING_DISPATCH'
  | 'PRE_TRIP'
  | 'PENDING_MANUAL'
  | 'CONFIRMED'
  | 'PENDING_CHECKIN'
  | 'CHECKED_IN'
  | 'QUEUING'
  | 'LOADING'
  | 'DEPARTED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'SIGNED'
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'EXCEPTION'
  | 'CANCELLED';

export const TMS_TRIP_STATUS_META: Record<TmsTripStatus, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING_DISPATCH: { label: '待排车', type: 'default' },
  PRE_TRIP: { label: '预车次', type: 'info' },
  PENDING_MANUAL: { label: '待人工确认', type: 'warning' },
  CONFIRMED: { label: '已确认', type: 'success' },
  PENDING_CHECKIN: { label: '待签到', type: 'warning' },
  CHECKED_IN: { label: '已签到', type: 'info' },
  QUEUING: { label: '排队中', type: 'info' },
  LOADING: { label: '装车中', type: 'primary' },
  DEPARTED: { label: '已发车', type: 'success' },
  IN_TRANSIT: { label: '运输中', type: 'info' },
  ARRIVED: { label: '已到达', type: 'info' },
  SIGNED: { label: '已签收', type: 'success' },
  PENDING_SETTLEMENT: { label: '待结算', type: 'warning' },
  SETTLED: { label: '已结算', type: 'success' },
  EXCEPTION: { label: '异常', type: 'error' },
  CANCELLED: { label: '已取消', type: 'default' }
};

export const TMS_ORDER_TYPE_OPTIONS = [
  { label: 'Amazon预约', value: 'AMAZON' },
  { label: 'LTL', value: 'LTL' },
  { label: '本地派送', value: 'LOCAL' },
  { label: '商业地址', value: 'COMMERCIAL' },
  { label: '快递', value: 'EXPRESS' }
];

export const TMS_DOCK_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  IDLE: { label: '空闲', type: 'success' },
  RESERVED: { label: '已预约', type: 'info' },
  CHECKED_IN: { label: '已签到', type: 'info' },
  QUEUING: { label: '排队中', type: 'warning' },
  LOADING: { label: '装车中', type: 'primary' },
  DEPARTED: { label: '已发车', type: 'default' },
  EXCEPTION: { label: '异常', type: 'error' },
  CLOSED: { label: '关闭', type: 'default' }
};

export const TMS_ROUTE = {
  home: 'tms_home',
  tripOrder: 'oms_outbound-order',
  dispatch: 'tms_dispatch',
  driver: 'tms_driver',
  vehicle: 'tms_vehicle',
  dockBoard: 'tms_dock-board',
  pod: 'tms_pod',
  freightSettlement: 'tms_freight-settlement',
  /** 供应商协同 */
  supplierTask: 'tms_supplier-task',
  supplier: 'tms_supplier-drayage',
  supplierQuote: 'tms_supplier-quote',
  supplierKpi: 'tms_supplier-kpi',
  exception: 'tms_exception',
  log: 'tms_log'
} as const;
