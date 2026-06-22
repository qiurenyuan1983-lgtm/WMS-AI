export { STATUS_META, WORKFLOW_STEPS, POOL_TYPE_TAG } from '../order-workbench/constants';

export const PLATFORM_STATUS_TABS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_APPT', label: '待预约' },
  { key: 'PRE_TRIP', label: '预出车次' },
  { key: 'PENDING_MANUAL', label: '待人工确认' },
  { key: 'PENDING_CARGO', label: '待添加货物' },
  { key: 'GENERATED', label: '已生成订单' },
  { key: 'ABNORMAL', label: '异常订单' }
] as const;
