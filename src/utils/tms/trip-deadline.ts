/** 车次装车时效：最晚完成 / 最晚开始装车 / 风险等级 */

export type TripDeadlineRiskLevel = 'NORMAL' | 'NEAR' | 'URGENT' | 'OVERDUE';

export type TripLoadingMethod = 'PALLET' | 'FLOOR' | 'MIXED';

export type TripDeadlineInput = {
  appointmentTime: string | null;
  originWarehouse?: string | null;
  destination?: string | null;
  palletQty?: number;
  cartonQty?: number;
  loadingMethod?: TripLoadingMethod | string | null;
  /** 覆盖默认缓冲（分钟） */
  trafficBufferMinutes?: number;
  exitCheckMinutes?: number;
  sealSignMinutes?: number;
  /** 指定参考时间，默认当前时间 */
  now?: Date;
};

export type TripDeadlineResult = {
  appointmentTime: string | null;
  distanceMiles: number;
  estimatedTravelMinutes: number;
  trafficBufferMinutes: number;
  exitCheckMinutes: number;
  sealSignMinutes: number;
  loadingMethod: TripLoadingMethod;
  estimatedLoadingMinutes: number;
  latestFinishTime: string | null;
  latestStartLoadingTime: string | null;
  remainingMinutes: number | null;
  deadlineRiskLevel: TripDeadlineRiskLevel;
};

export const TRIP_DEADLINE_BUFFER = {
  trafficBufferMinutes: 20,
  exitCheckMinutes: 15,
  sealSignMinutes: 10
} as const;

export const TRIP_DEADLINE_RISK_META: Record<
  TripDeadlineRiskLevel,
  {
    label: string;
    type: 'success' | 'warning' | 'error' | 'default';
    /** 倒计时文字色（浅色背景） */
    color: string;
    /** 标签底色 */
    tagBg: string;
    /** 标签文字色 */
    tagColor: string;
  }
> = {
  NORMAL: { label: '正常', type: 'success', color: '#047857', tagBg: '#d1fae5', tagColor: '#065f46' },
  NEAR: { label: '临近', type: 'warning', color: '#b45309', tagBg: '#fcd34d', tagColor: '#78350f' },
  URGENT: { label: '紧急', type: 'warning', color: '#c2410c', tagBg: '#ea580c', tagColor: '#ffffff' },
  OVERDUE: { label: '超时', type: 'error', color: '#b91c1c', tagBg: '#dc2626', tagColor: '#ffffff' }
};

type RouteLeg = { miles: number; driveMinutes: number };

const WAREHOUSE_COORD: Record<string, { lat: number; lng: number; label: string }> = {
  LA: { lat: 34.0522, lng: -118.2437, label: 'Los Angeles, CA' },
  DAL: { lat: 32.7767, lng: -96.797, label: 'Dallas, TX' },
  NJ: { lat: 40.7128, lng: -74.006, label: 'Newark, NJ' },
  SAV: { lat: 32.0809, lng: -81.0912, label: 'Savannah, GA' }
};

const DESTINATION_ROUTE: Array<{ pattern: RegExp; from: string; leg: RouteLeg }> = [
  { pattern: /ONT8|ONT/i, from: 'LA', leg: { miles: 48, driveMinutes: 72 } },
  { pattern: /LGB8|LGB|Long Beach/i, from: 'LA', leg: { miles: 28, driveMinutes: 45 } },
  { pattern: /SMF3|Sacramento/i, from: 'LA', leg: { miles: 385, driveMinutes: 360 } },
  { pattern: /XLX7|Charlotte|CLT/i, from: 'SAV', leg: { miles: 220, driveMinutes: 210 } },
  { pattern: /Phoenix/i, from: 'LA', leg: { miles: 370, driveMinutes: 330 } },
  { pattern: /Austin/i, from: 'DAL', leg: { miles: 195, driveMinutes: 195 } },
  { pattern: /Houston/i, from: 'DAL', leg: { miles: 239, driveMinutes: 230 } },
  { pattern: /Dallas/i, from: 'DAL', leg: { miles: 12, driveMinutes: 25 } },
  { pattern: /Brooklyn|NY/i, from: 'NJ', leg: { miles: 18, driveMinutes: 40 } },
  { pattern: /洛杉矶|长滩|旧金山|西雅图|芝加哥|波特兰/i, from: 'LA', leg: { miles: 35, driveMinutes: 55 } }
];

function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = String(value).trim().replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function resolveRoute(originWarehouse?: string | null, destination?: string | null): RouteLeg {
  const wh = String(originWarehouse || 'LA').toUpperCase();
  const dest = String(destination || '');
  const matched = DESTINATION_ROUTE.find(r => r.from === wh && r.pattern.test(dest));
  if (matched) return matched.leg;
  const fallback = DESTINATION_ROUTE.find(r => r.pattern.test(dest));
  if (fallback) return fallback.leg;
  return { miles: 65, driveMinutes: 90 };
}

export function resolveLoadingMethod(input: {
  orderType?: string | null;
  palletQty?: number;
  cartonQty?: number;
  loadingMethod?: string | null;
}): TripLoadingMethod {
  if (input.loadingMethod === 'PALLET' || input.loadingMethod === 'FLOOR' || input.loadingMethod === 'MIXED') {
    return input.loadingMethod;
  }
  const pallets = Number(input.palletQty || 0);
  const cartons = Number(input.cartonQty || 0);
  if (pallets >= 8 && cartons < pallets * 20) return 'PALLET';
  if (cartons > pallets * 30) return 'FLOOR';
  return 'MIXED';
}

export function estimateLoadingMinutes(
  palletQty: number,
  cartonQty: number,
  method: TripLoadingMethod
): number {
  const pallets = Math.max(0, palletQty);
  const cartons = Math.max(0, cartonQty);
  const setup = 12;
  const perPallet = method === 'PALLET' ? 4 : method === 'FLOOR' ? 2.5 : 3.2;
  const cartonBlocks = Math.ceil(cartons / 40);
  const cartonPart = method === 'FLOOR' ? cartonBlocks * 3 : cartonBlocks * 1.5;
  return Math.round(setup + pallets * perPallet + cartonPart);
}

export function computeTripDeadline(input: TripDeadlineInput): TripDeadlineResult {
  const now = input.now ?? new Date();
  const route = resolveRoute(input.originWarehouse, input.destination);
  const trafficBuffer = input.trafficBufferMinutes ?? TRIP_DEADLINE_BUFFER.trafficBufferMinutes;
  const exitCheck = input.exitCheckMinutes ?? TRIP_DEADLINE_BUFFER.exitCheckMinutes;
  const sealSign = input.sealSignMinutes ?? TRIP_DEADLINE_BUFFER.sealSignMinutes;
  const loadingMethod = resolveLoadingMethod({
    palletQty: input.palletQty,
    cartonQty: input.cartonQty,
    loadingMethod: input.loadingMethod
  });
  const estimatedLoadingMinutes = estimateLoadingMinutes(
    Number(input.palletQty || 0),
    Number(input.cartonQty || 0),
    loadingMethod
  );

  const appt = parseDateTime(input.appointmentTime);
  let latestFinishTime: string | null = null;
  let latestStartLoadingTime: string | null = null;
  let remainingMinutes: number | null = null;
  let deadlineRiskLevel: TripDeadlineRiskLevel = 'NORMAL';

  if (appt) {
    const finishMs =
      appt.getTime() -
      route.driveMinutes * 60_000 -
      trafficBuffer * 60_000 -
      exitCheck * 60_000 -
      sealSign * 60_000;
    const startMs = finishMs - estimatedLoadingMinutes * 60_000;
    const finishDate = new Date(finishMs);
    const startDate = new Date(startMs);
    latestFinishTime = formatDateTime(finishDate);
    latestStartLoadingTime = formatDateTime(startDate);
    remainingMinutes = Math.round((finishMs - now.getTime()) / 60_000);
    deadlineRiskLevel = resolveRiskLevel(remainingMinutes);
  }

  return {
    appointmentTime: input.appointmentTime,
    distanceMiles: route.miles,
    estimatedTravelMinutes: route.driveMinutes,
    trafficBufferMinutes: trafficBuffer,
    exitCheckMinutes: exitCheck,
    sealSignMinutes: sealSign,
    loadingMethod,
    estimatedLoadingMinutes,
    latestFinishTime,
    latestStartLoadingTime,
    remainingMinutes,
    deadlineRiskLevel
  };
}

export function resolveRiskLevel(remainingMinutes: number | null): TripDeadlineRiskLevel {
  if (remainingMinutes == null) return 'NORMAL';
  if (remainingMinutes <= 0) return 'OVERDUE';
  if (remainingMinutes <= 30) return 'URGENT';
  if (remainingMinutes <= 60) return 'NEAR';
  return 'NORMAL';
}

export function formatRemainingMinutes(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes <= 0) return `超时 ${Math.abs(minutes)} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `剩余 ${h}小时${m}分`;
  return `剩余 ${m} 分钟`;
}

/** 调度优先级分（0–100），用于 DOCK 自动安排排序 */
export function computeDispatchPriorityScore(
  deadline: Pick<TripDeadlineResult, 'deadlineRiskLevel' | 'remainingMinutes'>
): number {
  const weight: Record<TripDeadlineRiskLevel, number> = {
    OVERDUE: 100,
    URGENT: 85,
    NEAR: 60,
    NORMAL: 30
  };
  const base = weight[deadline.deadlineRiskLevel] ?? 30;
  const tighten =
    deadline.remainingMinutes != null ? Math.max(0, 60 - deadline.remainingMinutes) : 0;
  return Math.min(100, base + Math.round(tighten * 0.5));
}

/** DOCK 排期优先级：超时 > 紧急 > 临近 > 正常，同等级按剩余分钟升序 */
export function compareDeadlinePriority(a: TripDeadlineResult, b: TripDeadlineResult): number {
  const weight: Record<TripDeadlineRiskLevel, number> = {
    OVERDUE: 0,
    URGENT: 1,
    NEAR: 2,
    NORMAL: 3
  };
  const riskCmp = weight[a.deadlineRiskLevel] - weight[b.deadlineRiskLevel];
  if (riskCmp !== 0) return riskCmp;
  const ra = a.remainingMinutes ?? 9999;
  const rb = b.remainingMinutes ?? 9999;
  return ra - rb;
}

export function enrichTripDeadlineFields<T extends TripDeadlineInput>(row: T, now?: Date) {
  const deadline = computeTripDeadline({ ...row, now });
  return { ...row, ...deadline };
}

export function warehouseAddressLabel(code?: string | null): string {
  const key = String(code || 'LA').toUpperCase();
  return WAREHOUSE_COORD[key]?.label ?? key;
}
