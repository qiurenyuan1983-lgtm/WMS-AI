/** 车次出库计划 · 流程 Tab */
export const TRIP_PLAN_FLOW_TABS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_NOTIFY', label: '待通知司机' },
  { key: 'NOTIFIED', label: '已通知司机' },
  { key: 'PENDING_CHECKIN', label: '待Check-in' },
  { key: 'CHECKED_IN', label: '已Check-in' },
  { key: 'WAITING_DOCK', label: '等待DOCK' },
  { key: 'DOCK_ASSIGNED', label: '已分配DOCK' },
  { key: 'OVERTIME_RISK', label: '超时风险' }
] as const;

export type TripPlanFlowTab = (typeof TRIP_PLAN_FLOW_TABS)[number]['key'];

/** 车次操作状态 */
export const TRIP_OP_STATUS_META: Record<
  string,
  { label: string; type: NaiveUI.ThemeColor; color?: string }
> = {
  NOT_STARTED: { label: '未开始', type: 'default', color: '#9ca3af' },
  PREPPING: { label: '备货中', type: 'info', color: '#2563eb' },
  PREP_DONE: { label: '备货完成', type: 'success', color: '#16a34a' },
  PENDING_LOAD: { label: '待装车', type: 'default', color: '#7c3aed' },
  LOADING: { label: '装车中', type: 'warning', color: '#ea580c' },
  LOAD_DONE: { label: '装车完成', type: 'info', color: '#0891b2' },
  DEPARTED: { label: '已发车', type: 'success', color: '#15803d' },
  EXCEPTION: { label: '异常', type: 'error', color: '#dc2626' }
};

export const NOTIFY_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING: { label: '待通知', type: 'default' },
  NOTIFIED: { label: '已通知', type: 'info' },
  CONFIRMED: { label: '司机已确认', type: 'success' }
};

export const CHECKIN_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING: { label: '待Check-in', type: 'warning' },
  CHECKED_IN: { label: '已Check-in', type: 'success' },
  EXCEPTION: { label: '异常', type: 'error' }
};

export const DOCK_ASSIGN_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  NONE: { label: '未分配', type: 'default' },
  WAITING: { label: '等待DOCK', type: 'warning' },
  ASSIGNED: { label: '已分配', type: 'success' }
};

export const OUTBOUND_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PLANNED: { label: '已计划', type: 'default' },
  READY: { label: '可出库', type: 'info' },
  OUTBOUNDING: { label: '出库中', type: 'warning' },
  COMPLETED: { label: '出库完成', type: 'success' }
};

export const CHECKIN_METHOD_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  ONSITE: { label: '现场Check-in', type: 'info' },
  APP: { label: 'APP Check-in', type: 'success' },
  SELF_PICKUP: { label: '自提预约', type: 'warning' }
};

export const DOCK_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  IDLE: { label: '空闲', type: 'success' },
  RESERVED: { label: '已预约', type: 'info' },
  WAITING: { label: '等待车辆', type: 'warning' },
  LOADING: { label: '装车中', type: 'primary' },
  PAUSED: { label: '暂停', type: 'default' },
  MAINTENANCE: { label: '维修', type: 'warning' },
  DISABLED: { label: '禁用', type: 'error' }
};

export const CARGO_READY_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  NOT_READY: { label: '未备齐', type: 'error' },
  PREPPING: { label: '备货中', type: 'info' },
  READY: { label: '已备齐', type: 'success' }
};
