import type { PortalCustomerOrderStatus } from '@/utils/portal/portal-order-status';
import { PORTAL_ORDER_CHANNEL_META } from '@/utils/portal/portal-order-channel';

export { PORTAL_ORDER_CHANNEL_META, PORTAL_ORDER_CHANNEL_OPTIONS } from '@/utils/portal/portal-order-channel';

/** 客户门户订单状态（不含预出车次） */
export const PORTAL_ORDER_STATUS_META: Record<
  PortalCustomerOrderStatus,
  { label: string; type: 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' }
> = {
  待入库: { label: '待入库', type: 'default' },
  拆柜中: { label: '拆柜中', type: 'warning' },
  已入库: { label: '已入库', type: 'info' },
  已出单: { label: '已出单', type: 'primary' },
  待派送: { label: '待派送', type: 'warning' },
  运输中: { label: '运输中', type: 'info' },
  已签收: { label: '已签收', type: 'success' },
  已完成: { label: '已完成', type: 'success' },
  异常处理中: { label: '异常处理中', type: 'error' },
  已取消: { label: '已取消', type: 'default' }
};

export const PORTAL_COMM_CATEGORY_META: Record<
  Api.Portal.CommCategory,
  { label: string; color: string }
> = {
  ORDER: { label: '订单沟通', color: '#2080f0' },
  FEE: { label: '费用沟通', color: '#f0a020' },
  FILE: { label: '文件补充', color: '#18a058' },
  DELIVERY_TIME: { label: '派送时间确认', color: '#7c3aed' },
  EXCEPTION_REPLY: { label: '异常回复', color: '#d03050' },
  SYSTEM: { label: '系统通知', color: '#909399' }
};

export const PORTAL_COMM_INITIATE_OPTIONS: Array<{ value: Api.Portal.CommInitiateType; label: string }> = [
  { value: 'ORDER_INQUIRY', label: '订单咨询' },
  { value: 'APPOINTMENT_INQUIRY', label: '预约咨询' },
  { value: 'FEE_INQUIRY', label: '费用咨询' },
  { value: 'FILE_SUPPLEMENT', label: '文件补充' },
  { value: 'DELIVERY_TIME_CONFIRM', label: '派送时间确认' },
  { value: 'OTHER', label: '其他问题' }
];

export const PORTAL_EXCEPTION_STATUS_META: Record<
  Api.Portal.CustomerExceptionStatus,
  { label: string; type: 'default' | 'info' | 'warning' | 'success' | 'error' }
> = {
  PENDING_VIEW: { label: '待查看', type: 'info' },
  PENDING_CONFIRM: { label: '待确认', type: 'warning' },
  PROCESSING: { label: '处理中', type: 'info' },
  COMPLETED: { label: '已完成', type: 'success' },
  CLOSED: { label: '已关闭', type: 'default' }
};

export const PORTAL_FEE_STATUS_META: Record<
  Api.Portal.PortalFeeConfirmStatus,
  { label: string; type: 'default' | 'info' | 'warning' | 'success' | 'error' }
> = {
  PENDING: { label: '待确认', type: 'warning' },
  CONFIRMED: { label: '已确认', type: 'success' },
  REJECTED: { label: '已驳回', type: 'error' }
};

export const PORTAL_BILL_STATUS_META: Record<
  Api.Portal.PortalBillStatus,
  { label: string; type: 'default' | 'info' | 'warning' | 'success' | 'error' }
> = {
  PENDING_PAY: { label: '待付款', type: 'warning' },
  PAID: { label: '已付款', type: 'success' },
  OVERDUE: { label: '逾期', type: 'error' }
};

export const PORTAL_ASN_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING_ARRIVAL: { label: '待到仓', type: 'warning' },
  ARRIVED: { label: '已到仓', type: 'info' },
  PUTAWAY: { label: '上架中', type: 'primary' },
  COMPLETED: { label: '已完成', type: 'success' }
};

export const PORTAL_SHIPMENT_STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  PENDING_AUDIT: { label: '待审核', type: 'warning' },
  PENDING_PICK: { label: '待拣货', type: 'info' },
  PENDING_SHIP: { label: '待出库', type: 'primary' },
  SHIPPED: { label: '已发货', type: 'success' },
  COMPLETED: { label: '已完成', type: 'success' }
};
