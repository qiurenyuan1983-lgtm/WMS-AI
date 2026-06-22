import { buildBatchTripOrderNo } from '@/utils/oms/ltl-generate-trip-order';
import {
  computeTripRecommendLoadPreview,
  isTripRecommendOperable,
  pickDefaultSelectableOrdersForDestination,
  resolveMatchableTripCount,
  resolveRecommendRuleLabel,
  validateTripRecommendGenerate,
  buildSelectionGenerateContext,
  type TripRecommendAppointmentType,
  type TripRecommendOrderLike,
  type TripRecommendSummaryAppointmentType
} from '@/utils/oms/trip-recommend-rules';
import { markCargoTripGenerated } from './oms-order-workbench-sync';
import { createMergedTripOrderFromWorkbenchOrders } from './oms';
import { linkPlatformAppointmentByNo } from './oms-platform-appointment';
import { MOCK_CARGO_ORDERS } from './oms-list-seed';
import { getWorkbenchOverlay } from './oms-order-workbench-sync';
import { pushTripOutboundPlanFromRecommend } from './wms-outbound-mgmt';
import { mockPage } from '../utils';

export type TripRecommendSummaryRow = {
  id: string;
  platform: string;
  destination: string;
  appointmentNo: string;
  appointmentType: TripRecommendSummaryAppointmentType;
  appointmentTime: string;
  operableOrderCount: number;
  totalPalletQty: number;
  totalCartonQty: number;
  totalCbm: number;
  totalWeightKg: number;
  matchableTripCount: number;
  recommendRule: string;
  recommendStatus: 'READY' | 'PARTIAL' | 'BLOCKED' | 'GENERATED';
  recommendStatusLabel: string;
  tripGenerated: boolean;
  generatedTripNo?: string | null;
};

export type TripRecommendStats = {
  operableOrderCount: number;
  operablePalletQty: number;
  operableCbm: number;
  operableWeightKg: number;
  matchableTripCount: number;
  floorGenerable: number;
  palletGenerable: number;
  generatedTripCount: number;
  inoperableOrderCount: number;
};

const PLATFORM_POOL = new Set(['Amazon', 'Walmart', 'SHEIN', 'Target', 'Wayfair']);
const tripRecommendLogs: { id: number; time: string; operator: string; action: string; tripNo?: string }[] = [];
let logSeq = 1;

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function resolveAppointmentType(cargo: Record<string, any>, index: number): TripRecommendAppointmentType {
  const raw = String(cargo.loadingType || cargo.appointmentType || '').toUpperCase();
  if (raw === 'FLOOR' || raw.includes('FLOOR')) return 'FLOOR';
  if (raw === 'PALLET' || raw.includes('PALLET')) return 'PALLET';
  return index % 3 === 0 ? 'FLOOR' : 'PALLET';
}

function resolveInventoryStatus(cargo: Record<string, any>) {
  if (cargo.fulfillmentStatus === 'INBOUNDED') return 'AVAILABLE';
  if (['OUTBOUND_ORDERED', 'DELIVERY_APPOINTED'].includes(cargo.fulfillmentStatus)) return 'LOCKED';
  return 'UNAVAILABLE';
}

function resolveCargoStatus(cargo: Record<string, any>) {
  if (cargo.exceptionFlag) return 'ABNORMAL';
  if (cargo.holdFlag) return 'HOLD';
  return 'NORMAL';
}

function resolveFeeStatus(cargo: Record<string, any>) {
  if (cargo.holdFlag) return 'PENDING_CONFIRM';
  if (cargo.billingStatus === 'BILLED') return 'CONFIRMED';
  if (cargo.orderTag === 'VIP' || cargo.customerFeeConfirmed) return 'CONFIRMED';
  return indexFeeAllow(cargo) ? 'ALLOW_EXECUTE' : 'PENDING_CONFIRM';
}

function indexFeeAllow(cargo: Record<string, any>) {
  return Number(cargo.id) % 5 !== 0;
}

function buildLineFromCargo(cargo: Record<string, any>, index: number): TripRecommendOrderLike | null {
  const platform = String(cargo.platformName || cargo.platform || '').trim();
  if (!PLATFORM_POOL.has(platform)) return null;

  const destination = String(cargo.platformWarehouseCode || cargo.destination || '').trim();
  if (!destination) return null;

  const overlay = getWorkbenchOverlay(Number(cargo.id));
  const tripGenerated =
    Boolean(overlay?.generatedTripNo) ||
    Boolean(cargo.outboundBatchNo) ||
    ['OUTBOUND_ORDERED', 'DELIVERY_APPOINTED', 'OUTBOUNDED', 'DELIVERING', 'DELIVERED'].includes(
      cargo.fulfillmentStatus
    );

  const appointmentNo =
    cargo.appointmentNo ||
    (platform === 'Amazon' ? `ISA-2026-${String(cargo.id).slice(-4)}` : `APT-2026-${String(cargo.id).slice(-4)}`);
  const appointmentTime =
    cargo.deliveryAppointmentTime ||
    `2026-06-${String(5 + (index % 20)).padStart(2, '0')} ${String(8 + (index % 10)).padStart(2, '0')}:00:00`;
  const appointmentType = resolveAppointmentType(cargo, index);
  const shipment = (cargo.shipments as Record<string, any>[] | undefined)?.[0];

  const line: TripRecommendOrderLike = {
    id: Number(cargo.id),
    orderNo: cargo.cargoOrderNo,
    customerOrderNo: cargo.externalOrderNo || null,
    customerName: cargo.customerName,
    platform,
    destination,
    appointmentNo: String(appointmentNo),
    appointmentType,
    appointmentTime: String(appointmentTime),
    containerNo: cargo.containerNo || null,
    palletQty: Number(cargo.actualPalletQty || cargo.declaredPalletQty || 0),
    cartonQty: Number(cargo.actualCartonQty || cargo.declaredCartonQty || 0),
    cbm: Number(cargo.actualCbm || cargo.declaredCbm || 0),
    weightKg: Number(cargo.actualWeight || cargo.declaredWeight || 0),
    inventoryStatus: resolveInventoryStatus(cargo),
    cargoStatus: resolveCargoStatus(cargo),
    feeStatus: resolveFeeStatus(cargo),
    holdFlag: Boolean(cargo.holdFlag),
    exceptionFlag: Boolean(cargo.exceptionFlag),
    inventoryLocked: resolveInventoryStatus(cargo) === 'LOCKED',
    tripGenerated,
    operationStatus: tripGenerated ? 'TRIP_GENERATED' : 'READY',
    warehouseName: cargo.inboundWarehouseName || cargo.warehouseName || null,
    palletNo: `PLT-${String(cargo.id).slice(-4)}-01`,
    sku: shipment?.skuSummary || shipment?.skuCode || null,
    fbaShipmentId: shipment?.shipmentNo || null,
    referenceId: cargo.externalOrderNo || null,
    poNumber: shipment?.poNo || cargo.poNos || null,
    customerFeeConfirmed: resolveFeeStatus(cargo) === 'CONFIRMED',
    allowExecute: resolveFeeStatus(cargo) === 'ALLOW_EXECUTE'
  };

  return line;
}

function buildAllOrderLines(): TripRecommendOrderLike[] {
  return MOCK_CARGO_ORDERS.map((cargo, index) => buildLineFromCargo(cargo as Record<string, any>, index)).filter(
    (line): line is TripRecommendOrderLike => Boolean(line)
  );
}

function groupKey(line: Pick<TripRecommendOrderLike, 'destination'>) {
  return line.destination;
}

function joinUnique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function buildSummaryRows(lines: TripRecommendOrderLike[]): TripRecommendSummaryRow[] {
  const map = new Map<string, TripRecommendOrderLike[]>();
  lines.forEach(line => {
    const key = groupKey(line);
    const bucket = map.get(key) || [];
    bucket.push(line);
    map.set(key, bucket);
  });

  return [...map.entries()].map(([id, orders]) => {
    const head = orders[0];
    const pendingOrders = orders.filter(row => !row.tripGenerated);
    const generated = pendingOrders.length === 0 && orders.some(row => row.tripGenerated);
    const operableOrders = orders.filter(row => isTripRecommendOperable(row) && !row.tripGenerated);

    const floorOps = operableOrders.filter(row => row.appointmentType === 'FLOOR');
    const palletOps = operableOrders.filter(row => row.appointmentType === 'PALLET');
    const matchableTripCount =
      resolveMatchableTripCount(floorOps, head.destination, 'FLOOR') +
      resolveMatchableTripCount(palletOps, head.destination, 'PALLET');

    const appointmentTypes = joinUnique(operableOrders.map(row => row.appointmentType));
    const appointmentType: TripRecommendSummaryAppointmentType =
      appointmentTypes.length > 1 ? 'MIXED' : ((appointmentTypes[0] || head.appointmentType) as TripRecommendAppointmentType);

    const platforms = joinUnique(operableOrders.map(row => row.platform));
    const platform = platforms.length ? platforms.join(' / ') : head.platform;

    const appointmentNos = joinUnique(operableOrders.map(row => row.appointmentNo));
    const appointmentNo =
      appointmentNos.length > 1 ? `${appointmentNos.length}个预约` : appointmentNos[0] || head.appointmentNo;

    const appointmentTimes = joinUnique(operableOrders.map(row => row.appointmentTime)).sort();
    const appointmentTime =
      appointmentTimes.length > 1
        ? `${appointmentTimes[0]} ~ ${appointmentTimes[appointmentTimes.length - 1]}`
        : appointmentTimes[0] || head.appointmentTime;

    let recommendStatus: TripRecommendSummaryRow['recommendStatus'] = 'READY';
    let recommendStatusLabel = '可生成';

    if (generated) {
      recommendStatus = 'GENERATED';
      recommendStatusLabel = '已生成车次';
    } else if (!operableOrders.length) {
      recommendStatus = 'BLOCKED';
      recommendStatusLabel = '不可操作';
    } else if (matchableTripCount === 0) {
      recommendStatus = 'BLOCKED';
      recommendStatusLabel = '未达装载规则';
    } else if (operableOrders.length < pendingOrders.length) {
      recommendStatus = 'PARTIAL';
      recommendStatusLabel = '部分可操作';
    }

    const generatedTripNo =
      orders.find(row => row.tripGenerated)?.orderNo &&
      (getWorkbenchOverlay(orders.find(row => row.tripGenerated)!.id)?.generatedTripNo as string | undefined);

    const recommendRule =
      appointmentType === 'MIXED'
        ? `Floor/Pallet · ${head.destination} · 按预约类型分别排车`
        : resolveRecommendRuleLabel(head.destination, appointmentType);

    return {
      id,
      platform,
      destination: head.destination,
      appointmentNo,
      appointmentType,
      appointmentTime,
      operableOrderCount: operableOrders.length,
      totalPalletQty: operableOrders.reduce((sum, row) => sum + row.palletQty, 0),
      totalCartonQty: operableOrders.reduce((sum, row) => sum + row.cartonQty, 0),
      totalCbm: Number(operableOrders.reduce((sum, row) => sum + row.cbm, 0).toFixed(2)),
      totalWeightKg: Number(operableOrders.reduce((sum, row) => sum + row.weightKg, 0).toFixed(2)),
      matchableTripCount,
      recommendRule,
      recommendStatus,
      recommendStatusLabel,
      tripGenerated: generated,
      generatedTripNo: generatedTripNo || null
    };
  });
}

function matchKeyword(line: TripRecommendOrderLike, keyword?: string | null) {
  if (!keyword?.trim()) return true;
  const q = keyword.trim().toLowerCase();
  const fields = [
    line.destination,
    line.platform,
    line.appointmentNo,
    line.orderNo,
    line.customerName,
    line.containerNo,
    line.sku,
    line.palletNo,
    line.fbaShipmentId,
    line.referenceId,
    line.poNumber,
    line.customerOrderNo
  ];
  return fields.some(field => String(field || '').toLowerCase().includes(q));
}

function filterLines(lines: TripRecommendOrderLike[], params?: Record<string, any>) {
  const p = params || {};
  return lines.filter(line => {
    if (p.keyword && !matchKeyword(line, p.keyword)) return false;
    if (p.platform && line.platform !== p.platform) return false;
    if (p.destination && !line.destination.toLowerCase().includes(String(p.destination).toLowerCase())) return false;
    if (p.appointmentNo && !line.appointmentNo.toLowerCase().includes(String(p.appointmentNo).toLowerCase())) return false;
    if (p.appointmentType && line.appointmentType !== p.appointmentType) return false;
    if (p.customerName && !line.customerName.toLowerCase().includes(String(p.customerName).toLowerCase())) return false;
    if (p.warehouseName && !String(line.warehouseName || '').includes(String(p.warehouseName))) return false;
    if (p.inventoryStatus && line.inventoryStatus !== p.inventoryStatus) return false;
    if (p.cargoStatus && line.cargoStatus !== p.cargoStatus) return false;
    if (p.holdFlag === '1' && !line.holdFlag) return false;
    if (p.holdFlag === '0' && line.holdFlag) return false;
    if (p.exceptionFlag === '1' && !line.exceptionFlag) return false;
    if (p.exceptionFlag === '0' && line.exceptionFlag) return false;
    if (p.tripGenerated === '1' && !line.tripGenerated) return false;
    if (p.tripGenerated === '0' && line.tripGenerated) return false;
    if (p.appointmentTimeStart && line.appointmentTime < p.appointmentTimeStart) return false;
    if (p.appointmentTimeEnd && line.appointmentTime > p.appointmentTimeEnd) return false;
    return true;
  });
}

export function getTripRecommendStats(params?: Record<string, any>) {
  const lines = filterLines(buildAllOrderLines(), params);
  const operable = lines.filter(row => isTripRecommendOperable(row) && !row.tripGenerated);
  const inoperable = lines.filter(row => !isTripRecommendOperable(row) && !row.tripGenerated);
  const generated = lines.filter(row => row.tripGenerated);

  const summaries = buildSummaryRows(lines.filter(row => !row.tripGenerated || params?.showGenerated === '1' || params?.showGenerated === true));
  const pendingSummaries = summaries.filter(row => row.recommendStatus !== 'GENERATED');

  let floorGenerable = 0;
  let palletGenerable = 0;
  const destMap = new Map<string, TripRecommendOrderLike[]>();
  lines.forEach(line => {
    const bucket = destMap.get(line.destination) || [];
    bucket.push(line);
    destMap.set(line.destination, bucket);
  });
  destMap.forEach((orders, destination) => {
    const operable = orders.filter(row => isTripRecommendOperable(row) && !row.tripGenerated);
    if (resolveMatchableTripCount(operable.filter(row => row.appointmentType === 'FLOOR'), destination, 'FLOOR') > 0) {
      floorGenerable += 1;
    }
    if (resolveMatchableTripCount(operable.filter(row => row.appointmentType === 'PALLET'), destination, 'PALLET') > 0) {
      palletGenerable += 1;
    }
  });

  return {
    operableOrderCount: operable.length,
    operablePalletQty: operable.reduce((sum, row) => sum + row.palletQty, 0),
    operableCbm: Number(operable.reduce((sum, row) => sum + row.cbm, 0).toFixed(2)),
    operableWeightKg: Number(operable.reduce((sum, row) => sum + row.weightKg, 0).toFixed(2)),
    matchableTripCount: pendingSummaries.reduce((sum, row) => sum + row.matchableTripCount, 0),
    floorGenerable,
    palletGenerable,
    generatedTripCount: generated.length,
    inoperableOrderCount: inoperable.length
  } satisfies TripRecommendStats;
}

export function getTripRecommendSummaryList(params?: Record<string, any>) {
  const showGenerated = params?.showGenerated === '1' || params?.showGenerated === true;
  let lines = filterLines(buildAllOrderLines(), params);
  let summaries = buildSummaryRows(lines);

  if (!showGenerated) {
    summaries = summaries.filter(row => row.operableOrderCount > 0);
  }

  summaries.sort((a, b) => a.destination.localeCompare(b.destination) || String(a.appointmentTime).localeCompare(String(b.appointmentTime)));
  return mockPage(summaries, params);
}

export function getTripRecommendOrders(params?: Record<string, any>) {
  const groupId = String(params?.groupId || '');
  if (!groupId) return { rows: [], defaultSelectedIds: [] as number[], loadPreview: null };

  const lines = filterLines(buildAllOrderLines(), params).filter(row => groupKey(row) === groupId);
  if (!lines.length) return { rows: [], defaultSelectedIds: [], loadPreview: null };

  const defaultSelectedIds = pickDefaultSelectableOrdersForDestination(lines);
  const selected = lines.filter(row => defaultSelectedIds.includes(row.id));
  const head = lines[0];
  const loadPreview = computeTripRecommendLoadPreview(selected, head.destination);

  const platforms = joinUnique(lines.map(row => row.platform));
  const appointmentNos = joinUnique(lines.map(row => row.appointmentNo));
  const appointmentTypes = joinUnique(lines.map(row => row.appointmentType));
  const appointmentTimes = joinUnique(lines.map(row => row.appointmentTime)).sort();

  return {
    rows: lines,
    defaultSelectedIds,
    groupContext: {
      platform: platforms.join(' / '),
      destination: head.destination,
      appointmentNo: appointmentNos.length > 1 ? `${appointmentNos.length}个预约` : appointmentNos[0],
      appointmentType: (appointmentTypes.length > 1 ? 'MIXED' : appointmentTypes[0]) as TripRecommendSummaryAppointmentType,
      appointmentTime:
        appointmentTimes.length > 1
          ? `${appointmentTimes[0]} ~ ${appointmentTimes[appointmentTimes.length - 1]}`
          : appointmentTimes[0],
      recommendRule:
        appointmentTypes.length > 1
          ? `Floor/Pallet · ${head.destination} · 按预约类型分别排车`
          : resolveRecommendRuleLabel(head.destination, appointmentTypes[0] as TripRecommendAppointmentType)
    },
    loadPreview
  };
}

export function previewTripRecommendLoad(orderIds: number[], groupId: string) {
  const lines = buildAllOrderLines().filter(row => groupKey(row) === groupId);
  const head = lines[0];
  if (!head) return null;
  const selected = lines.filter(row => orderIds.map(Number).includes(row.id));
  return computeTripRecommendLoadPreview(selected, head.destination);
}

export function generateTripRecommend(payload: {
  groupId: string;
  orderIds: number[];
  operatorName?: string;
}) {
  const lines = buildAllOrderLines();
  const groupLines = lines.filter(row => groupKey(row) === payload.groupId);
  const head = groupLines[0];
  if (!head) return { success: false, message: '汇总记录不存在' };

  const selected = groupLines.filter(row => payload.orderIds.map(Number).includes(row.id));
  const context = buildSelectionGenerateContext(selected);
  if (!context) {
    return { success: false, message: '所选订单平台/预约号/预约类型不一致，请按同一组勾选后生成' };
  }

  const validation = validateTripRecommendGenerate(selected, context);

  if (!validation.ok) {
    return { success: false, message: validation.message || '校验失败' };
  }

  const tripNo = buildBatchTripOrderNo(payload.orderIds);
  const workbenchRows = selected.map(row => ({
    id: row.id,
    orderNo: row.orderNo,
    customerName: row.customerName,
    platform: row.platform,
    destination: row.destination,
    isaNo: row.appointmentNo,
    appointmentTime: row.appointmentTime,
    palletQty: row.palletQty,
    cartonQty: row.cartonQty,
    weightLbs: Math.round(row.weightKg * 2.20462),
    volumeCbm: row.cbm,
    supplierName: null
  }));

  createMergedTripOrderFromWorkbenchOrders(workbenchRows, tripNo, 'PLATFORM', {
    appointmentNo: context.appointmentNo,
    appointmentTime: context.appointmentTime,
    loadingType: context.appointmentType
  });

  selected.forEach(row => {
    markCargoTripGenerated(row.id, tripNo, {
      appointmentNo: context.appointmentNo,
      appointmentTime: context.appointmentTime,
      loadingType: context.appointmentType
    });
    const cargo = MOCK_CARGO_ORDERS.find(c => Number(c.id) === row.id) as Record<string, any> | undefined;
    if (cargo) {
      cargo.inventoryStatus = 'LOCKED';
      cargo.fulfillmentStatus = 'OUTBOUND_ORDERED';
    }
  });

  linkPlatformAppointmentByNo(context.appointmentNo, tripNo);

  pushTripOutboundPlanFromRecommend({
    tripNo,
    orderNos: selected.map(row => row.orderNo).join(', '),
    customerName: [...new Set(selected.map(row => row.customerName))].join(' / '),
    destination: context.destination,
    appointmentTime: context.appointmentTime,
    palletQty: selected.reduce((sum, row) => sum + row.palletQty, 0),
    cartonQty: selected.reduce((sum, row) => sum + row.cartonQty, 0),
    platform: context.platform,
    appointmentType: context.appointmentType
  });

  const operator = payload.operatorName || '系统';
  tripRecommendLogs.unshift({
    id: logSeq++,
    time: nowStr(),
    operator,
    action: `自动车次推荐生成车次 ${tripNo}，订单 ${selected.map(row => row.orderNo).join('、')}`,
    tripNo
  });

  const loadPreview = computeTripRecommendLoadPreview(selected, context.destination, context.appointmentType);

  return {
    success: true,
    message: `已生成车次 ${tripNo}，已推送 WMS 出库计划（待通知司机）`,
    tripNo,
    orderCount: selected.length,
    loadPreview
  };
}

export function getTripRecommendLogs() {
  return tripRecommendLogs.slice(0, 50);
}
