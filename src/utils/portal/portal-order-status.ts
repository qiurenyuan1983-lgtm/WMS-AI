/** 客户门户可见订单状态（不含预出车次等内部状态） */
export type PortalCustomerOrderStatus =
  | '待入库'
  | '拆柜中'
  | '已入库'
  | '已出单'
  | '待派送'
  | '运输中'
  | '已签收'
  | '已完成'
  | '异常处理中'
  | '已取消';

/** 不对客户展示的内部状态关键词 */
const INTERNAL_STATUS_KEYWORDS = ['预出车次', '预出单', 'PRE_TRIP'];

const BEFORE_INBOUND_FULFILLMENT = new Set([
  'PENDING_ACCEPT',
  'ACCEPTED',
  'IN_TRANSIT',
  'ARRIVED_PORT',
  'PICKED_UP',
  'ARRIVED_WAREHOUSE',
  'DEVANNING',
  'DEVANNED',
  'GENERATED'
]);

/**
 * 将 OMS 货单履约状态映射为客户门户状态。
 * 预出车次 / 已预出单：内部已排车次但尚未拆柜或入库，对客户仍展示仓储进度。
 */
export function mapCargoToPortalCustomerStatus(cargo: Record<string, any>): PortalCustomerOrderStatus {
  const fulfillment = String(cargo.fulfillmentStatus || cargo.orderStatus || '');

  if (BEFORE_INBOUND_FULFILLMENT.has(fulfillment)) {
    if (fulfillment === 'DEVANNING' || fulfillment === 'DEVANNED') return '拆柜中';
    return '待入库';
  }
  if (fulfillment === 'INBOUNDED') return '已入库';
  if (fulfillment === 'OUTBOUND_ORDERED') return '已出单';
  if (fulfillment === 'DELIVERY_APPOINTED') return '待派送';
  if (fulfillment === 'OUTBOUNDED' || fulfillment === 'DELIVERING') return '运输中';
  if (fulfillment === 'DELIVERED') return '已签收';
  if (fulfillment === 'POD_UPLOADED' || fulfillment === 'BILLED' || fulfillment === 'COMPLETED') return '已完成';
  if (fulfillment === 'EXCEPTION') return '异常处理中';
  if (fulfillment === 'CANCELLED') return '已取消';

  if (cargo.preOutboundStatus === 'PRE_CREATED') return '待入库';
  return '待入库';
}

/** 兜底：静态文案若含内部状态，转为客户可见状态 */
export function sanitizePortalCustomerStatus(status?: string | null): PortalCustomerOrderStatus {
  const text = String(status || '').trim();
  if (!text) return '待入库';
  if (INTERNAL_STATUS_KEYWORDS.some(keyword => text.includes(keyword))) return '待入库';
  if (text === 'PRE_TRIP') return '待入库';
  return text as PortalCustomerOrderStatus;
}
