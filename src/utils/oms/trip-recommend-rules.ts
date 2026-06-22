export type TripRecommendAppointmentType = 'FLOOR' | 'PALLET';
export type TripRecommendSummaryAppointmentType = TripRecommendAppointmentType | 'MIXED';

export const TRIP_RECOMMEND_MAX_WEIGHT_KG = 19000;
const FLOOR_CBM_VALUES = [90, 95];
const PALLET_CBM_VALUES = [55, 65];

export type TripRecommendOrderLike = {
  id: number;
  orderNo: string;
  customerOrderNo?: string | null;
  customerName: string;
  platform: string;
  destination: string;
  appointmentNo: string;
  appointmentType: TripRecommendAppointmentType;
  appointmentTime: string;
  containerNo?: string | null;
  palletQty: number;
  cartonQty: number;
  cbm: number;
  weightKg: number;
  inventoryStatus: string;
  cargoStatus: string;
  feeStatus: string;
  holdFlag: boolean;
  exceptionFlag: boolean;
  inventoryLocked: boolean;
  tripGenerated: boolean;
  operationStatus: string;
  warehouseName?: string | null;
  palletNo?: string | null;
  sku?: string | null;
  fbaShipmentId?: string | null;
  referenceId?: string | null;
  poNumber?: string | null;
  customerFeeConfirmed?: boolean;
  allowExecute?: boolean;
};

export type TripRecommendLoadPreview = {
  selectedOrderCount: number;
  selectedPalletQty: number;
  selectedCartonQty: number;
  selectedCbm: number;
  targetCbm: number;
  selectedWeightKg: number;
  maxWeightKg: number;
  loadRate: number;
  weightUsageRate: number;
  ruleStatus: 'OK' | 'UNDER' | 'OVER_CBM' | 'OVER_WEIGHT' | 'EMPTY';
  ruleStatusLabel: string;
};

function hashDestination(destination: string) {
  return destination.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export function resolveTargetCbm(destination: string, appointmentType: TripRecommendAppointmentType): number {
  const values = appointmentType === 'FLOOR' ? FLOOR_CBM_VALUES : PALLET_CBM_VALUES;
  return values[hashDestination(destination) % values.length];
}

export function resolveRecommendRuleLabel(destination: string, appointmentType: TripRecommendAppointmentType) {
  const cbm = resolveTargetCbm(destination, appointmentType);
  const typeLabel = appointmentType === 'FLOOR' ? 'Floor' : 'Pallet';
  return `${typeLabel} · ${destination} · 目标 ${cbm} CBM / ≤${TRIP_RECOMMEND_MAX_WEIGHT_KG} KG`;
}

export function isTripRecommendOperable(line: TripRecommendOrderLike, options?: { allowGenerated?: boolean }) {
  if (!options?.allowGenerated && line.tripGenerated) return false;
  if (!line.platform?.trim()) return false;
  if (!line.destination?.trim()) return false;
  if (!line.appointmentNo?.trim()) return false;
  if (!line.appointmentType) return false;
  if (!line.appointmentTime?.trim()) return false;
  if (line.inventoryStatus !== 'AVAILABLE') return false;
  if (line.cargoStatus !== 'NORMAL') return false;
  if (line.holdFlag) return false;
  if (line.exceptionFlag) return false;
  if (line.inventoryLocked) return false;
  if (!line.cbm || line.cbm <= 0) return false;
  if (!line.weightKg || line.weightKg <= 0) return false;
  if (!line.orderNo?.trim() || !line.customerName?.trim()) return false;
  if (!line.customerFeeConfirmed && !line.allowExecute) return false;
  return true;
}

export function computeTripRecommendLoadPreview(
  rows: TripRecommendOrderLike[],
  destination: string,
  appointmentType?: TripRecommendAppointmentType | null
): TripRecommendLoadPreview {
  const resolvedType = appointmentType ?? resolveSelectionAppointmentType(rows);
  const targetCbm = resolvedType ? resolveTargetCbm(destination, resolvedType) : 0;
  const maxWeightKg = TRIP_RECOMMEND_MAX_WEIGHT_KG;

  if (!rows.length) {
    return {
      selectedOrderCount: 0,
      selectedPalletQty: 0,
      selectedCartonQty: 0,
      selectedCbm: 0,
      targetCbm: 0,
      selectedWeightKg: 0,
      maxWeightKg,
      loadRate: 0,
      weightUsageRate: 0,
      ruleStatus: 'EMPTY',
      ruleStatusLabel: '请勾选订单'
    };
  }

  if (!resolvedType) {
    return {
      selectedOrderCount: rows.length,
      selectedPalletQty: rows.reduce((sum, row) => sum + row.palletQty, 0),
      selectedCartonQty: rows.reduce((sum, row) => sum + row.cartonQty, 0),
      selectedCbm: Number(rows.reduce((sum, row) => sum + row.cbm, 0).toFixed(2)),
      targetCbm: 0,
      selectedWeightKg: Number(rows.reduce((sum, row) => sum + row.weightKg, 0).toFixed(2)),
      maxWeightKg,
      loadRate: 0,
      weightUsageRate: 0,
      ruleStatus: 'OVER_CBM',
      ruleStatusLabel: '所选订单预约类型不一致，请按 Floor/Pallet 分别勾选'
    };
  }

  const selectedCbm = Number(rows.reduce((sum, row) => sum + row.cbm, 0).toFixed(2));
  const selectedWeightKg = Number(rows.reduce((sum, row) => sum + row.weightKg, 0).toFixed(2));
  const loadRate = targetCbm > 0 ? Number(((selectedCbm / targetCbm) * 100).toFixed(1)) : 0;
  const weightUsageRate =
    maxWeightKg > 0 ? Number(((selectedWeightKg / maxWeightKg) * 100).toFixed(1)) : 0;

  let ruleStatus: TripRecommendLoadPreview['ruleStatus'] = 'OK';
  let ruleStatusLabel = '符合装载规则';

  if (selectedWeightKg > maxWeightKg) {
    ruleStatus = 'OVER_WEIGHT';
    ruleStatusLabel = `超重：${selectedWeightKg} KG > ${maxWeightKg} KG`;
  } else if (selectedCbm > targetCbm) {
    ruleStatus = 'OVER_CBM';
    ruleStatusLabel = `超 CBM：${selectedCbm} > 目标 ${targetCbm} CBM`;
  } else if (selectedCbm < targetCbm * 0.5) {
    ruleStatus = 'UNDER';
    ruleStatusLabel = `装载偏低：${loadRate}%（建议 ≥50%）`;
  }

  return {
    selectedOrderCount: rows.length,
    selectedPalletQty: rows.reduce((sum, row) => sum + row.palletQty, 0),
    selectedCartonQty: rows.reduce((sum, row) => sum + row.cartonQty, 0),
    selectedCbm,
    targetCbm,
    selectedWeightKg,
    maxWeightKg,
    loadRate,
    weightUsageRate,
    ruleStatus,
    ruleStatusLabel
  };
}

export function pickDefaultSelectableOrders(
  rows: TripRecommendOrderLike[],
  destination: string,
  appointmentType: TripRecommendAppointmentType
) {
  const operable = rows.filter(row => isTripRecommendOperable(row) && !row.tripGenerated);
  const targetCbm = resolveTargetCbm(destination, appointmentType);
  const maxWeight = TRIP_RECOMMEND_MAX_WEIGHT_KG;
  const picked: TripRecommendOrderLike[] = [];
  let cbm = 0;
  let weight = 0;

  for (const row of operable) {
    if (cbm + row.cbm > targetCbm || weight + row.weightKg > maxWeight) continue;
    picked.push(row);
    cbm += row.cbm;
    weight += row.weightKg;
  }

  return picked.map(row => row.id);
}

/** 目的地合并视图：在最大可操作子组（平台+预约号+类型一致）内默认勾选 */
export function pickDefaultSelectableOrdersForDestination(rows: TripRecommendOrderLike[]) {
  const subgroupMap = new Map<string, TripRecommendOrderLike[]>();
  rows.forEach(row => {
    const key = `${row.platform}|${row.appointmentNo}|${row.appointmentType}`;
    const bucket = subgroupMap.get(key) || [];
    bucket.push(row);
    subgroupMap.set(key, bucket);
  });

  let bestOperable: TripRecommendOrderLike[] = [];
  subgroupMap.forEach(orders => {
    const operable = orders.filter(row => isTripRecommendOperable(row) && !row.tripGenerated);
    if (operable.length > bestOperable.length) bestOperable = operable;
  });

  if (!bestOperable.length) return [];
  const head = bestOperable[0];
  return pickDefaultSelectableOrders(bestOperable, head.destination, head.appointmentType);
}

export function resolveSelectionAppointmentType(
  rows: TripRecommendOrderLike[]
): TripRecommendAppointmentType | null {
  const types = new Set(rows.map(row => row.appointmentType));
  if (types.size !== 1) return null;
  return [...types][0];
}

export function buildSelectionGenerateContext(rows: TripRecommendOrderLike[]) {
  if (!rows.length) return null;
  const appointmentType = resolveSelectionAppointmentType(rows);
  if (!appointmentType) return null;
  const head = rows[0];
  return {
    platform: head.platform,
    destination: head.destination,
    appointmentNo: head.appointmentNo,
    appointmentType,
    appointmentTime: head.appointmentTime
  };
}

export type TripRecommendValidateResult = { ok: boolean; message?: string };

export function validateTripRecommendGenerate(
  rows: TripRecommendOrderLike[],
  context: {
    platform: string;
    destination: string;
    appointmentNo: string;
    appointmentType: TripRecommendAppointmentType;
    appointmentTime: string;
  }
): TripRecommendValidateResult {
  if (!rows.length) return { ok: false, message: '请先勾选订单' };
  if (!context.appointmentNo?.trim()) return { ok: false, message: '预约号无效' };
  if (!context.appointmentTime?.trim()) return { ok: false, message: '预约时间不存在' };

  const platforms = new Set(rows.map(row => row.platform));
  const destinations = new Set(rows.map(row => row.destination));
  const appointmentTypes = new Set(rows.map(row => row.appointmentType));
  const appointmentNos = new Set(rows.map(row => row.appointmentNo));

  if (platforms.size !== 1 || !platforms.has(context.platform)) {
    return { ok: false, message: '所选订单平台不一致' };
  }
  if (destinations.size !== 1 || !destinations.has(context.destination)) {
    return { ok: false, message: '所选订单目的地不一致' };
  }
  if (appointmentTypes.size !== 1 || !appointmentTypes.has(context.appointmentType)) {
    return { ok: false, message: '所选订单预约类型不一致' };
  }
  if (appointmentNos.size !== 1 || !appointmentNos.has(context.appointmentNo)) {
    return { ok: false, message: '所选订单预约号不一致' };
  }

  if (rows.some(row => row.tripGenerated)) {
    return { ok: false, message: '包含已生成车次的订单' };
  }
  if (rows.some(row => row.holdFlag)) {
    return { ok: false, message: '包含暂扣货物' };
  }
  if (rows.some(row => row.exceptionFlag)) {
    return { ok: false, message: '包含异常货物' };
  }
  if (rows.some(row => !isTripRecommendOperable(row))) {
    return { ok: false, message: '包含不可操作库存' };
  }
  if (rows.some(row => !row.customerFeeConfirmed && !row.allowExecute)) {
    return { ok: false, message: '客户费用未确认，不允许生成车次' };
  }

  const preview = computeTripRecommendLoadPreview(rows, context.destination, context.appointmentType);
  if (preview.ruleStatus === 'OVER_WEIGHT') {
    return { ok: false, message: preview.ruleStatusLabel };
  }
  if (preview.ruleStatus === 'OVER_CBM') {
    return { ok: false, message: preview.ruleStatusLabel };
  }

  return { ok: true };
}

export function resolveMatchableTripCount(
  operableOrders: TripRecommendOrderLike[],
  destination: string,
  appointmentType: TripRecommendAppointmentType
) {
  const targetCbm = resolveTargetCbm(destination, appointmentType);
  const maxWeight = TRIP_RECOMMEND_MAX_WEIGHT_KG;
  let remaining = [...operableOrders];
  let count = 0;

  while (remaining.length) {
    let cbm = 0;
    let weight = 0;
    const next: TripRecommendOrderLike[] = [];

    for (const row of remaining) {
      if (cbm + row.cbm <= targetCbm && weight + row.weightKg <= maxWeight) {
        cbm += row.cbm;
        weight += row.weightKg;
        next.push(row);
      }
    }

    if (!next.length) break;
    count += 1;
    const used = new Set(next.map(row => row.id));
    remaining = remaining.filter(row => !used.has(row.id));
  }

  return count;
}
