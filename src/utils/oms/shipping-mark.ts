/** 客户门户推送单号（客户订单号）最大长度 */
export const PORTAL_ORDER_PUSH_MAX_LENGTH = 20;

type OrderNoCarrier = {
  cargoOrderNo?: string | null;
  externalOrderNo?: string | null;
};

/** 用于唛头/打印的系统订单号（优先系统运单号） */
export function resolveOrderNoForShippingMark(order: OrderNoCarrier): string {
  return order.cargoOrderNo?.trim() || order.externalOrderNo?.trim() || '';
}

/** 唛头号与订单号保持一致 */
export function resolveShippingMarkFromOrder(order: OrderNoCarrier): string | null {
  const orderNo = resolveOrderNoForShippingMark(order);
  return orderNo || null;
}

export function syncShipmentMarksFromOrder<T extends { shippingMark?: string | null; shipmentNo?: string | null }>(
  shipments: T[] | null | undefined,
  orderNo: string
) {
  const mark = orderNo.trim();
  if (!mark) return;
  (shipments || []).forEach(item => {
    if (item.shipmentNo?.trim()) {
      item.shippingMark = mark;
    }
  });
}

export function applyShippingMarkRule<T extends OrderNoCarrier & { marks?: string | null; shipments?: Array<{ shippingMark?: string | null; shipmentNo?: string | null }> }>(
  cargo: T
) {
  const orderNo = resolveOrderNoForShippingMark(cargo);
  if (!orderNo) return cargo;
  syncShipmentMarksFromOrder(cargo.shipments, orderNo);
  cargo.marks = orderNo;
  return cargo;
}

export function validatePortalOrderPushNo(value?: string | null): string | null {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '请输入客户订单号';
  if (trimmed.length > PORTAL_ORDER_PUSH_MAX_LENGTH) {
    return `客户订单号不能超过 ${PORTAL_ORDER_PUSH_MAX_LENGTH} 个字符`;
  }
  return null;
}
