export type SupplierTaskType =
  | 'container_pickup'
  | 'warehouse_load_checkin'
  | 'delivery_appointment_checkin'
  | 'customer_pickup'
  | 'return_flow';

export type SupplierTaskStatus =
  | 'PENDING_DISPATCH'
  | 'PENDING_ACCEPT'
  | 'ACCEPTED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'EXCEPTION'
  | 'CLOSED';

export const SUPPLIER_TASK_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '海柜提柜', value: 'container_pickup' },
  { label: '到仓装货', value: 'warehouse_load_checkin' },
  { label: '预约送仓', value: 'delivery_appointment_checkin' },
  { label: '客户提货', value: 'customer_pickup' },
  { label: '返程/拒收', value: 'return_flow' }
] as const;

export const SUPPLIER_TASK_TYPE_LABEL: Record<SupplierTaskType, string> = {
  container_pickup: '海柜提柜',
  warehouse_load_checkin: '到仓装货',
  delivery_appointment_checkin: '预约送仓',
  customer_pickup: '客户提货',
  return_flow: '返程/拒收'
};

export const SUPPLIER_TASK_STATUS_LABEL: Record<SupplierTaskStatus, string> = {
  PENDING_DISPATCH: '待下发',
  PENDING_ACCEPT: '待接单',
  ACCEPTED: '已接单',
  IN_TRANSIT: '在途',
  ARRIVED: '已到仓',
  CHECKED_IN: '已 Check In',
  WAITING: '等待中',
  EXECUTING: '执行中',
  COMPLETED: '已完成',
  EXCEPTION: '异常中',
  CLOSED: '已关闭'
};

export const SUPPLIER_TASK_STATUS_TAG: Record<SupplierTaskStatus, NaiveUI.ThemeColor> = {
  PENDING_DISPATCH: 'default',
  PENDING_ACCEPT: 'warning',
  ACCEPTED: 'info',
  IN_TRANSIT: 'primary',
  ARRIVED: 'info',
  CHECKED_IN: 'success',
  WAITING: 'warning',
  EXECUTING: 'primary',
  COMPLETED: 'success',
  EXCEPTION: 'error',
  CLOSED: 'default'
};

export const GPS_STATUS_LABEL: Record<string, string> = {
  OFF: '未开启',
  TRACKING: '追踪中',
  WEAK: '信号弱',
  IN_FENCE: '已进入围栏',
  DEPARTED: '已离场',
  INTERRUPTED: '中断'
};

export const GPS_STATUS_TAG: Record<string, NaiveUI.ThemeColor> = {
  OFF: 'default',
  TRACKING: 'success',
  WEAK: 'warning',
  IN_FENCE: 'info',
  DEPARTED: 'default',
  INTERRUPTED: 'error'
};

export const CHECKIN_STATUS_LABEL: Record<string, string> = {
  PENDING: '待签到',
  SUBMITTED: '已签到',
  REVIEWING: '审核中',
  APPROVED: '通过',
  REJECTED: '驳回',
  WAITING_AREA: '等待区',
  DOCK_ASSIGNED: '已分配 DOCK'
};

export const BOL_STATUS_LABEL: Record<string, string> = {
  PENDING: '待上传',
  UPLOADED: '已上传',
  REVIEWING: '待审核',
  APPROVED: '已通过',
  REJECTED: '驳回'
};

export {
  SUPPLIER_OP_STATUS_OPTIONS,
  SUPPLIER_OP_STATUS_LABEL,
  FEE_AUDIT_STATUS_OPTIONS,
  FEE_AUDIT_STATUS_LABEL,
  FEE_AUDIT_STATUS_TAG,
  examStatusLabel,
  examStatusTagType,
  orderSourceLabel
} from './container-op-constants';
