/** LTL 供应商匹配上下文 */
export type LtlMatchContext = {
  originWarehouse: string;
  destination: string;
  zipCode?: string | null;
  palletQty: number;
  weightLbs: number;
  volumeCbm: number;
  cargoType?: string;
  urgency?: 'NORMAL' | 'URGENT';
};

export type LtlSupplierCandidate = {
  supplierId: number;
  supplierName: string;
  orderPortalUrl: string | null;
  recommendTag: string | null;
  serviceRating: number;
  onTimeRate: number;
  quoteAmount: number;
  leadTimeDays: number;
  serviceArea: string;
  liftgateFee: number;
  insuranceFee: number;
  totalAmount: number;
  hasApi: boolean;
  exceptionRate: number;
  matchScore: number;
  matchReason: string;
  recommended: boolean;
};

type LtlCarrierProfile = {
  supplierId: number;
  supplierName: string;
  orderPortalUrl: string;
  serviceRating: number;
  onTimeRate: number;
  exceptionRate: number;
  baseRatePerPallet: number;
  liftgateFee: number;
  insuranceFee: number;
  leadTimeDays: number;
  serviceAreas: string[];
  warehouses: string[];
  hasApi: boolean;
  palletRange: [number, number];
  maxWeightLbs: number;
};

const CARRIERS: LtlCarrierProfile[] = [
  {
    supplierId: 800101,
    supplierName: 'FedEx Freight',
    orderPortalUrl: 'https://www.fedex.com/en-us/shipping/freight/ltl.html',
    serviceRating: 4.8,
    onTimeRate: 96,
    exceptionRate: 2,
    baseRatePerPallet: 210,
    liftgateFee: 75,
    insuranceFee: 20,
    leadTimeDays: 3,
    serviceAreas: ['TX', 'CA', 'AZ', 'NV', 'OK'],
    warehouses: ['LA', 'DAL', 'NJ', 'SAV'],
    hasApi: true,
    palletRange: [1, 12],
    maxWeightLbs: 20000
  },
  {
    supplierId: 800102,
    supplierName: 'US Xpress',
    orderPortalUrl: 'https://www.usxpress.com/',
    serviceRating: 4.5,
    onTimeRate: 92,
    exceptionRate: 4,
    baseRatePerPallet: 230,
    liftgateFee: 80,
    insuranceFee: 25,
    leadTimeDays: 4,
    serviceAreas: ['TX', 'LA', 'MS', 'AL', 'GA'],
    warehouses: ['LA', 'DAL', 'SAV'],
    hasApi: true,
    palletRange: [1, 12],
    maxWeightLbs: 18000
  },
  {
    supplierId: 800103,
    supplierName: 'R+L Carriers',
    orderPortalUrl: 'https://www.rlcarriers.com/freight/shipping/quote',
    serviceRating: 4.3,
    onTimeRate: 89,
    exceptionRate: 5,
    baseRatePerPallet: 215,
    liftgateFee: 70,
    insuranceFee: 18,
    leadTimeDays: 5,
    serviceAreas: ['TX', 'CA', 'Midwest', 'Southeast'],
    warehouses: ['LA', 'DAL', 'NJ'],
    hasApi: false,
    palletRange: [1, 10],
    maxWeightLbs: 16000
  },
  {
    supplierId: 800104,
    supplierName: 'Estes Express',
    orderPortalUrl: 'https://www.estes-express.com/myestes/shipment/create',
    serviceRating: 4.6,
    onTimeRate: 94,
    exceptionRate: 3,
    baseRatePerPallet: 240,
    liftgateFee: 85,
    insuranceFee: 22,
    leadTimeDays: 3,
    serviceAreas: ['TX', 'CA', 'Southeast', 'Northeast'],
    warehouses: ['LA', 'DAL', 'NJ', 'SAV'],
    hasApi: true,
    palletRange: [1, 8],
    maxWeightLbs: 15000
  }
];

function extractState(destination: string) {
  const m = destination.match(/\b([A-Z]{2})\b/);
  return m?.[1] ?? '';
}

function scoreCarrier(carrier: LtlCarrierProfile, ctx: LtlMatchContext) {
  let score = 0;
  const reasons: string[] = [];
  const state = extractState(ctx.destination);

  if (carrier.warehouses.includes(ctx.originWarehouse)) {
    score += 30;
    reasons.push(`起始仓 ${ctx.originWarehouse} 覆盖`);
  } else {
    return { score: -1, reason: '' };
  }

  if (state && carrier.serviceAreas.some(a => a === state || a.includes(state))) {
    score += 40;
    reasons.push(`服务范围覆盖 ${state}`);
  } else if (carrier.serviceAreas.length) {
    score += 10;
    reasons.push('部分区域覆盖');
  }

  if (ctx.palletQty >= carrier.palletRange[0] && ctx.palletQty <= carrier.palletRange[1]) {
    score += 20;
    reasons.push(`板数 ${ctx.palletQty} 适配`);
  } else {
    score -= 15;
  }

  if (ctx.weightLbs <= carrier.maxWeightLbs) {
    score += 10;
  } else {
    score -= 30;
  }

  score += Math.round(carrier.onTimeRate * 0.3);
  score -= carrier.exceptionRate * 2;
  if (carrier.hasApi) {
    score += 15;
    reasons.push('支持 API 下单');
  }

  const linehaul = carrier.baseRatePerPallet * ctx.palletQty;
  const total = linehaul + carrier.liftgateFee + carrier.insuranceFee;
  const priceScore = Math.max(0, 50 - Math.round(total / 50));
  score += priceScore;
  reasons.push(`综合报价 $${total}`);

  if (ctx.urgency === 'URGENT' && carrier.leadTimeDays <= 3) {
    score += 10;
    reasons.push('加急时效满足');
  }

  return { score, reason: reasons.join(' · '), linehaul, total };
}

/** 按板数/重量/目的地等匹配 LTL 供应商并排序 */
export function matchLtlSuppliers(ctx: LtlMatchContext): LtlSupplierCandidate[] {
  const candidates = CARRIERS.map(carrier => {
    const { score, reason, linehaul, total } = scoreCarrier(carrier, ctx);
    if (score < 0) return null;
    return {
      supplierId: carrier.supplierId,
      supplierName: carrier.supplierName,
      orderPortalUrl: carrier.orderPortalUrl,
      recommendTag: null as string | null,
      serviceRating: carrier.serviceRating,
      onTimeRate: carrier.onTimeRate,
      quoteAmount: linehaul!,
      leadTimeDays: carrier.leadTimeDays,
      serviceArea: carrier.serviceAreas.join(' / '),
      liftgateFee: carrier.liftgateFee,
      insuranceFee: carrier.insuranceFee,
      totalAmount: total!,
      hasApi: carrier.hasApi,
      exceptionRate: carrier.exceptionRate,
      matchScore: score,
      matchReason: reason,
      recommended: false
    };
  }).filter((c): c is LtlSupplierCandidate => Boolean(c));

  candidates.sort((a, b) => b.matchScore - a.matchScore || a.totalAmount - b.totalAmount);
  if (candidates.length) {
    candidates[0].recommended = true;
    candidates[0].recommendTag = '\u4f18';
  }
  return candidates;
}

export function getBestLtlSupplier(ctx: LtlMatchContext) {
  const list = matchLtlSuppliers(ctx);
  return list[0] ?? null;
}

/** 根据供应商 ID 获取 LTL 下单门户网址 */
export function getLtlSupplierPortalUrl(supplierId: number | null | undefined) {
  if (supplierId == null) return null;
  return CARRIERS.find(c => c.supplierId === supplierId)?.orderPortalUrl ?? null;
}
