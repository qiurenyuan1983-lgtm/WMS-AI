export function resolveOutboundReadiness(row: {
  fulfillmentStatus?: string | null;
  actualCartonQty?: number | null;
  declaredCartonQty?: number | null;
}): Api.Oms.OutboundReadiness {
  const actual = Number(row.actualCartonQty || 0);
  const declared = Number(row.declaredCartonQty || 0);
  if (row.fulfillmentStatus === 'INBOUNDED' && actual >= declared) return 'INBOUNDED';
  if (['DEVANNING', 'DEVANNED'].includes(row.fulfillmentStatus || '')) return 'DEVANNING';
  return 'NOT_INBOUNDED';
}

export const OUTBOUND_READINESS_META: Record<Api.Oms.OutboundReadiness, { label: string; type: NaiveUI.ThemeColor }> = {
  NOT_INBOUNDED: { label: '未入库', type: 'warning' },
  DEVANNING: { label: '拆柜中', type: 'info' },
  INBOUNDED: { label: '已入库', type: 'success' }
};

/** 预出单列表 Tag：待入库 + 拆柜中 */
export const PENDING_PRE_OUTBOUND_STATUSES = ['PENDING_INBOUND', 'DEVANNING'] as const;

export const MERGED_PRE_OUTBOUND_TAB = 'PENDING_GROUP';
