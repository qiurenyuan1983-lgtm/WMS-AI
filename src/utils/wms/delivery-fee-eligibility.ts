/** 订单已派送及之后的状态，才允许产生/分摊派送费用 */
export const POST_DISPATCH_FULFILLMENT_STATUSES = [
  'DELIVERING',
  'DELIVERED',
  'POD_UPLOADED',
  'BILLED',
  'COMPLETED'
] as const;

export type PostDispatchFulfillmentStatus = (typeof POST_DISPATCH_FULFILLMENT_STATUSES)[number];

const STATUS_LABEL: Record<string, string> = {
  DELIVERING: '派送中',
  DELIVERED: '已签收',
  POD_UPLOADED: 'POD回传',
  BILLED: '已出账单',
  COMPLETED: '已完成'
};

export function isCargoOrderDeliveryFeeEligible(fulfillmentStatus?: string | null): boolean {
  if (!fulfillmentStatus) return false;
  return POST_DISPATCH_FULFILLMENT_STATUSES.includes(fulfillmentStatus as PostDispatchFulfillmentStatus);
}

export function fulfillmentStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return STATUS_LABEL[status] || status;
}
