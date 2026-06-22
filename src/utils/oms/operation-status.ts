/** 海柜管理 · 操作状态 */
export type ContainerOperationStatus =
  | 'PICKED_UP'
  | 'ARRIVED_WAREHOUSE'
  | 'DOCK_SCHEDULED'
  | 'PENDING_DOCK'
  | 'DEVANNING'
  | 'DEVANNED';

/** 订单管理 / 订单平台 · 操作状态 */
export type CargoOperationStatus = 'INBOUNDED' | 'TRIP_GENERATED' | 'SUPPLIER_DISPATCHED';

/** 出库管理 · 操作状态 */
export type OutboundOperationStatus = 'REGISTERED' | 'OUTBOUNDING' | 'OUTBOUND_COMPLETED';

export const CONTAINER_OPERATION_STATUS_META: Record<
  ContainerOperationStatus,
  { label: string; type: NaiveUI.ThemeColor }
> = {
  PICKED_UP: { label: '已提柜', type: 'warning' },
  ARRIVED_WAREHOUSE: { label: '已到仓', type: 'success' },
  DOCK_SCHEDULED: { label: '安排DOCK', type: 'info' },
  PENDING_DOCK: { label: '待上DOCK', type: 'warning' },
  DEVANNING: { label: '拆柜中', type: 'warning' },
  DEVANNED: { label: '拆柜完成', type: 'success' }
};

export const CARGO_OPERATION_STATUS_META: Record<
  CargoOperationStatus,
  { label: string; type: NaiveUI.ThemeColor }
> = {
  INBOUNDED: { label: '已入库', type: 'success' },
  TRIP_GENERATED: { label: '已生成车次', type: 'info' },
  SUPPLIER_DISPATCHED: { label: '已安排派送供应商', type: 'success' }
};

export const OUTBOUND_OPERATION_STATUS_META: Record<
  OutboundOperationStatus,
  { label: string; type: NaiveUI.ThemeColor }
> = {
  REGISTERED: { label: '已登记', type: 'default' },
  OUTBOUNDING: { label: '出库中', type: 'warning' },
  OUTBOUND_COMPLETED: { label: '出库完成', type: 'success' }
};

export const CARGO_OPERATION_STATUS_LIST = Object.entries(CARGO_OPERATION_STATUS_META).map(([value, meta]) => ({
  value: value as CargoOperationStatus,
  ...meta
}));

export const CONTAINER_OPERATION_STATUS_LIST = Object.entries(CONTAINER_OPERATION_STATUS_META).map(([value, meta]) => ({
  value: value as ContainerOperationStatus,
  ...meta
}));

export const OUTBOUND_OPERATION_STATUS_LIST = Object.entries(OUTBOUND_OPERATION_STATUS_META).map(([value, meta]) => ({
  value: value as OutboundOperationStatus,
  ...meta
}));

export function resolveContainerOperationStatus(row: Record<string, any>): ContainerOperationStatus | null {
  const status = String(row.containerStatus || row.status || '');
  if (status === 'DEVANNING') return 'DEVANNING';
  if (status === 'DEVANNED') return 'DEVANNED';
  if (status === 'PICKED_UP') return 'PICKED_UP';
  if (status === 'ARRIVED_WAREHOUSE') {
    if (row.devanningDockNo) {
      return row.devanningDockReady ? 'PENDING_DOCK' : 'DOCK_SCHEDULED';
    }
    return 'ARRIVED_WAREHOUSE';
  }
  if (['PICKUP_APPOINTED', 'AVAILABLE_FOR_PICKUP'].includes(status)) return 'PICKED_UP';
  return null;
}

export function resolveCargoOperationStatus(row: Record<string, any>): CargoOperationStatus {
  const fulfillment = String(row.fulfillmentStatus || row.orderStatus || '');
  if (
    ['OUTBOUND_ORDERED', 'GENERATED'].includes(fulfillment) ||
    row.outboundBatchNo ||
    row.outboundOrderStatus === 'CREATED'
  ) {
    return 'TRIP_GENERATED';
  }
  if (
    ['DELIVERY_APPOINTED', 'DELIVERING', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED', 'BILLED', 'POD_UPLOADED'].includes(
      fulfillment
    ) ||
    row.supplierName
  ) {
    return 'SUPPLIER_DISPATCHED';
  }
  return 'INBOUNDED';
}

export function resolveOutboundOperationStatus(outboundStatus: string | null | undefined): OutboundOperationStatus {
  const status = String(outboundStatus || '');
  if (['COMPLETED', 'SIGNED', 'POD_UPLOADED', 'DELIVERED', 'CLOSED'].includes(status)) {
    return 'OUTBOUND_COMPLETED';
  }
  if (['LOADING', 'LOADED', 'DEPARTED', 'IN_TRANSIT', 'OUTBOUNDED', 'ARRIVED'].includes(status)) {
    return 'OUTBOUNDING';
  }
  return 'REGISTERED';
}

export function containerOperationStatusLabel(status: string | null | undefined) {
  if (!status) return '—';
  return CONTAINER_OPERATION_STATUS_META[status as ContainerOperationStatus]?.label ?? status;
}

export function cargoOperationStatusLabel(status: string | null | undefined) {
  if (!status) return '—';
  return CARGO_OPERATION_STATUS_META[status as CargoOperationStatus]?.label ?? status;
}

export function outboundOperationStatusLabel(status: string | null | undefined) {
  if (!status) return '—';
  return OUTBOUND_OPERATION_STATUS_META[status as OutboundOperationStatus]?.label ?? status;
}
