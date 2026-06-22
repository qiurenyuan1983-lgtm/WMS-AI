/** TMS 调度工作台状态 */
export type DispatchWorkbenchStatus =
  | 'PENDING_DISPATCH'
  | 'RECOMMENDED'
  | 'PENDING_MANUAL'
  | 'CONFIRMED'
  | 'DOCK_ASSIGNED'
  | 'DRIVER_ASSIGNED'
  | 'VEHICLE_ASSIGNED'
  | 'SUPPLIER_ASSIGNED'
  | 'WMS_PUSHED'
  | 'DRIVER_PUSHED'
  | 'DRIVER_ACCEPTED'
  | 'CHECKED_IN'
  | 'LOADING'
  | 'DEPARTED'
  | 'COMPLETED'
  | 'EXCEPTION'
  | 'CANCELLED';

export const DISPATCH_STATUS_META: Record<
  DispatchWorkbenchStatus,
  { label: string; type: NaiveUI.ThemeColor }
> = {
  PENDING_DISPATCH: { label: '待排车', type: 'default' },
  RECOMMENDED: { label: '已推荐', type: 'info' },
  PENDING_MANUAL: { label: '待人工确认', type: 'warning' },
  CONFIRMED: { label: '已确认', type: 'success' },
  DOCK_ASSIGNED: { label: '已分配DOCK', type: 'info' },
  DRIVER_ASSIGNED: { label: '已分配司机', type: 'info' },
  VEHICLE_ASSIGNED: { label: '已分配车辆', type: 'info' },
  SUPPLIER_ASSIGNED: { label: '已分配供应商', type: 'info' },
  WMS_PUSHED: { label: '已推送WMS', type: 'primary' },
  DRIVER_PUSHED: { label: '已推送司机', type: 'primary' },
  DRIVER_ACCEPTED: { label: '司机已接单', type: 'success' },
  CHECKED_IN: { label: '司机已Check-in', type: 'success' },
  LOADING: { label: '装车中', type: 'primary' },
  DEPARTED: { label: '已发车', type: 'success' },
  COMPLETED: { label: '已完成', type: 'success' },
  EXCEPTION: { label: '异常', type: 'error' },
  CANCELLED: { label: '已取消', type: 'default' }
};

export const PLAN_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  DRAFT: { label: '草稿', type: 'default' },
  RECOMMENDED: { label: '已推荐', type: 'info' },
  PENDING_MANUAL: { label: '待人工确认', type: 'warning' },
  CONFIRMED: { label: '已确认', type: 'success' },
  WMS_PUSHED: { label: '已推送WMS', type: 'primary' },
  DRIVER_PUSHED: { label: '已推送司机', type: 'primary' },
  CANCELLED: { label: '已取消', type: 'default' }
};

export const VEHICLE_CAPACITY: Record<string, number> = {
  '53尺': 26,
  '53ft Trailer': 26,
  '26尺': 14,
  '26ft Box Truck': 14,
  'Box Truck': 10,
  Sprinter: 6
};
