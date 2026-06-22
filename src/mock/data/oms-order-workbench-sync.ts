import { resolveCargoOperationStatus } from '@/utils/oms/operation-status';
import {
  isTripGeneratedCargo,
  isWorkbenchEligibleCargo,
  resolveWorkbenchInitialStatus,
  resolveWorkbenchOrderTypeLabel,
  resolveWorkbenchPool,
  shouldIncludeInWorkbenchList,
  type OrderWorkbenchPool,
  type OrderWorkbenchStatus,
  type WorkbenchOverlay
} from '@/utils/oms/order-workbench-rules';
import { syncContainerAfterCargoOutbound } from './oms-golden-path';
import { MOCK_CARGO_ORDERS } from './oms-list-seed';

export type OrderWorkbenchRow = {
  id: number;
  orderNo: string;
  pool: OrderWorkbenchPool;
  orderTypeLabel: string;
  customerName: string;
  platform: string | null;
  destination: string;
  isaNo: string | null;
  dwTime: string | null;
  appointmentTime: string | null;
  appointmentType: string | null;
  palletQty: number;
  cartonQty: number;
  weightLbs: number | null;
  weightKg: number | null;
  volumeCbm: number | null;
  palletSize: string | null;
  status: OrderWorkbenchStatus;
  preTripNo: string | null;
  dockNo: string | null;
  supplierName: string | null;
  supplierProNo?: string | null;
  customerConfirmed: boolean;
  cargoCount: number;
  workflowStep: number;
  createTime: string;
  remark: string | null;
  originWarehouse?: string | null;
  orderSource?: string | null;
  cargoType?: string | null;
  urgency?: string | null;
  zipCode?: string | null;
  selectedSupplierId?: number | null;
  orderMethod?: 'API' | 'RPA' | 'MANUAL' | null;
  supplierOrderPlaced?: boolean;
  bolNo?: string | null;
  pickupTime?: string | null;
  estimatedDelivery?: string | null;
  generatedTripNo?: string | null;
  operationStatus?: string | null;
  timelinessLevel?: string | null;
};

export type { OrderWorkbenchPool, OrderWorkbenchStatus, WorkbenchOverlay };

const workbenchOverlays = new Map<number, WorkbenchOverlay>();

export function getWorkbenchOverlay(cargoId: number) {
  return workbenchOverlays.get(cargoId);
}

export function setWorkbenchOverlay(cargoId: number, patch: WorkbenchOverlay) {
  workbenchOverlays.set(cargoId, { ...workbenchOverlays.get(cargoId), ...patch });
}

export function excludeWorkbenchOrder(cargoId: number) {
  setWorkbenchOverlay(cargoId, { excluded: true });
}

export { isTripGeneratedCargo, isWorkbenchEligibleCargo, shouldIncludeInWorkbenchList };

export type TripGeneratedPatch = {
  appointmentNo?: string | null;
  appointmentTime?: string | null;
  pickupTime?: string | null;
  loadingType?: string | null;
  deliveryCost?: number | null;
  supplierName?: string | null;
};

export function markCargoTripGenerated(
  cargoId: CommonType.IdType,
  tripNo: string,
  patch?: TripGeneratedPatch
) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const cargo = MOCK_CARGO_ORDERS.find(c => String(c.id) === String(cargoId)) as Record<string, any> | undefined;
  if (cargo) {
    cargo.outboundOrderStatus = 'CREATED';
    cargo.fulfillmentStatus = 'OUTBOUND_ORDERED';
    cargo.orderStatus = 'OUTBOUND_ORDERED';
    cargo.preOutboundStatus = 'CONVERTED';
    cargo.outboundBatchNo = tripNo;
    cargo.outboundOrderTime = now;
    cargo.appointmentStatus = patch?.appointmentTime ? 'APPOINTED' : cargo.appointmentStatus ?? 'APPOINTED';
    if (patch?.appointmentNo) cargo.appointmentNo = patch.appointmentNo;
    if (patch?.appointmentTime) cargo.deliveryAppointmentTime = patch.appointmentTime;
    if (patch?.pickupTime) cargo.pickupTime = patch.pickupTime;
    if (patch?.loadingType) cargo.loadingType = patch.loadingType;
    if (patch?.deliveryCost != null) cargo.deliveryCost = patch.deliveryCost;
    if (patch?.supplierName) cargo.supplierName = patch.supplierName;
    syncContainerAfterCargoOutbound(Number(cargo.containerOrderId));
  }
  setWorkbenchOverlay(Number(cargoId), {
    status: 'GENERATED',
    generatedTripNo: tripNo,
    appointmentTime: patch?.appointmentTime ?? undefined,
    pickupTime: patch?.pickupTime ?? undefined
  });
}

function resolveDestination(cargo: Record<string, any>): string {
  if (cargo.platformWarehouseCode) return String(cargo.platformWarehouseCode);
  const parts = [cargo.addressLine1, cargo.city, cargo.state, cargo.zipCode].filter(Boolean);
  return parts.join(', ') || '—';
}

const LBS_TO_KG = 0.453592;

function resolveWeightKg(cargo: Record<string, any>): number | null {
  const weight = Number(cargo.actualWeight ?? cargo.declaredWeight ?? 0);
  if (!weight) return null;
  const unit = String(cargo.weightUnit || 'KG').toUpperCase();
  if (unit === 'KG') return Number(weight.toFixed(1));
  if (unit === 'LBS' || unit === 'LB') return Number((weight * LBS_TO_KG).toFixed(1));
  return Number(weight.toFixed(1));
}

function resolvePalletSize(cargo: Record<string, any>): string | null {
  const lengthCm = Number(cargo.palletLengthCm ?? 0);
  const widthCm = Number(cargo.palletWidthCm ?? 0);
  const heightCm = Number(cargo.palletHeightCm ?? 0);
  if (!lengthCm || !widthCm || !heightCm) return null;
  return `${lengthCm}×${widthCm}×${heightCm} cm`;
}

function resolvePlatform(cargo: Record<string, any>, pool: OrderWorkbenchPool): string | null {
  if (pool === 'EXPRESS') return cargo.parcelCarrierName || cargo.platformName || null;
  if (pool === 'LOCAL') return cargo.platformName === '同行散板' ? 'Local' : 'Local';
  return cargo.platformName || null;
}

export function mapCargoToWorkbenchRow(cargo: Record<string, any>): OrderWorkbenchRow {
  const overlay = workbenchOverlays.get(Number(cargo.id));
  const pool = resolveWorkbenchPool(cargo, overlay);
  const platform = resolvePlatform(cargo, pool);
  const palletQty = Number(cargo.actualPalletQty ?? cargo.declaredPalletQty ?? 0);
  const cartonQty = Number(cargo.actualCartonQty ?? cargo.declaredCartonQty ?? 0);
  const apptNo = cargo.appointmentNo ? String(cargo.appointmentNo) : null;

  return {
    id: Number(cargo.id),
    orderNo: String(cargo.cargoOrderNo),
    pool,
    orderTypeLabel: (overlay?.orderTypeLabel as string | undefined) ?? resolveWorkbenchOrderTypeLabel(pool, platform),
    customerName: String(cargo.customerName || cargo.peerCustomerName || '—'),
    platform,
    destination: (overlay?.destination as string | undefined) ?? resolveDestination(cargo),
    isaNo: (overlay?.isaNo as string | undefined) ?? apptNo,
    dwTime: (overlay?.dwTime as string | undefined) ?? (cargo.earliestDwTime ? String(cargo.earliestDwTime) : null),
    appointmentTime: (overlay?.appointmentTime as string | undefined) ?? cargo.deliveryAppointmentTime ?? null,
    appointmentType: pool === 'PLATFORM' || pool === 'LOCAL' ? '卡板约' : null,
    palletQty,
    cartonQty,
    weightLbs: Number(cargo.actualWeight ?? cargo.declaredWeight ?? 0) || null,
    weightKg: (overlay?.weightKg as number | undefined) ?? resolveWeightKg(cargo),
    volumeCbm: Number(cargo.actualCbm ?? cargo.declaredCbm ?? 0) || null,
    palletSize: (overlay?.palletSize as string | undefined) ?? resolvePalletSize(cargo),
    status: resolveWorkbenchInitialStatus(cargo, pool, overlay),
    preTripNo:
      (overlay?.preTripNo as string | undefined) ??
      (cargo.preOutboundStatus === 'PRE_CREATED' ? cargo.outboundBatchNo : null) ??
      null,
    dockNo: (overlay?.dockNo as string | undefined) ?? null,
    supplierName: (overlay?.supplierName as string | undefined) ?? null,
    supplierProNo: (overlay?.supplierProNo as string | undefined) ?? null,
    customerConfirmed:
      (overlay?.customerConfirmed as boolean | undefined) ?? (pool === 'LOCAL' && Boolean(cargo.deliveryAppointmentTime)),
    cargoCount: (overlay?.cargoCount as number | undefined) ?? (palletQty || cartonQty ? Math.max(palletQty, cartonQty) : 0),
    workflowStep: (overlay?.workflowStep as number | undefined) ?? 1,
    createTime: String(cargo.createTime || ''),
    remark: (overlay?.remark as string | undefined) ?? (cargo.remark ? String(cargo.remark) : null),
    originWarehouse: cargo.inboundWarehouseName ? String(cargo.inboundWarehouseName).slice(0, 3).toUpperCase() : null,
    orderSource: cargo.orderSource ? String(cargo.orderSource) : null,
    cargoType: cargo.businessTypeName ? String(cargo.businessTypeName) : null,
    urgency: 'NORMAL',
    zipCode: cargo.zipCode ? String(cargo.zipCode) : null,
    selectedSupplierId: (overlay?.selectedSupplierId as number | undefined) ?? null,
    orderMethod: (overlay?.orderMethod as 'API' | 'RPA' | 'MANUAL' | null | undefined) ?? null,
    supplierOrderPlaced: (overlay?.supplierOrderPlaced as boolean | undefined) ?? false,
    bolNo: (overlay?.bolNo as string | undefined) ?? null,
    pickupTime: (overlay?.pickupTime as string | undefined) ?? null,
    estimatedDelivery: (overlay?.estimatedDelivery as string | undefined) ?? null,
    generatedTripNo: (overlay?.generatedTripNo as string | undefined) ?? null,
    operationStatus: (overlay?.operationStatus as string | undefined) ?? resolveCargoOperationStatus(cargo),
    timelinessLevel: (overlay?.timelinessLevel as string | undefined) ?? (cargo.timelinessLevel ? String(cargo.timelinessLevel) : null)
  };
}

/** 从订单管理 Mock 同步，已生成车次的不进入工作台列表 */
export function buildWorkbenchOrdersFromCargo(): OrderWorkbenchRow[] {
  return MOCK_CARGO_ORDERS.filter(cargo => {
    const overlay = workbenchOverlays.get(Number(cargo.id));
    return shouldIncludeInWorkbenchList(cargo as Record<string, any>, overlay);
  })
    .map(cargo => mapCargoToWorkbenchRow(cargo as Record<string, any>))
    .filter(row => row.status !== 'GENERATED');
}
