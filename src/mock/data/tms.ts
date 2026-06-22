import { fuzzyIncludes } from '../fuzzy-search';
import { mockPage } from '../utils';
import * as dispatchWorkbench from './tms-dispatch-workbench';
import {
  compareDeadlinePriority,
  computeDispatchPriorityScore,
  computeTripDeadline,
  enrichTripDeadlineFields
} from '@/utils/tms/trip-deadline';

export type TmsTripStatus =
  | 'PENDING_DISPATCH'
  | 'PRE_TRIP'
  | 'PENDING_MANUAL'
  | 'CONFIRMED'
  | 'PENDING_CHECKIN'
  | 'CHECKED_IN'
  | 'QUEUING'
  | 'LOADING'
  | 'DEPARTED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'SIGNED'
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'EXCEPTION'
  | 'CANCELLED';

export type TmsTripOrder = {
  id: number;
  tripNo: string;
  omsOrderNo: string;
  orderType: string;
  orderTypeLabel: string;
  customerName: string;
  originWarehouse: string;
  destination: string;
  appointmentTime: string | null;
  palletQty: number;
  cartonQty: number;
  carrierName: string | null;
  driverName: string | null;
  plateNo: string | null;
  dockNo: string | null;
  vehicleType: string | null;
  status: TmsTripStatus;
  hasException: boolean;
  createTime: string;
  remark: string | null;
};

export type TmsTripLog = {
  id: number;
  time: string;
  operator: string;
  action: string;
  status: string;
};

export type TmsTripCargoItem = {
  id: number;
  cargoOrderId: number;
  cargoOrderNo: string;
  customerName: string;
  destination: string;
  appointmentNo: string | null;
  orderType?: string | null;
  palletQty: number;
  cartonQty: number;
};

export type TmsAvailableCargoOrder = {
  id: number;
  cargoOrderNo: string;
  customerName: string;
  destination: string;
  appointmentNo: string | null;
  originWarehouse: string;
  orderType: string;
  orderTypeLabel: string;
  palletQty: number;
  cartonQty: number;
};

export type TmsTripDetail = TmsTripOrder & {
  isaNo: string | null;
  weightLbs: number | null;
  supplierName: string | null;
  loadingProgress: string | null;
  contactName: string | null;
  contactPhone: string | null;
  cargoItems: TmsTripCargoItem[];
  logs: TmsTripLog[];
};

export type TmsDriver = {
  id: number;
  driverName: string;
  phone: string;
  supplierName: string;
  licenseNo: string;
  status: string;
  statusLabel: string;
  currentTripNo: string | null;
  gpsOnline: boolean;
  checkinTime: string | null;
  onTimeRate: number;
  exceptionRate: number;
};

export type TmsVehicle = {
  id: number;
  plateNo: string;
  vehicleType: string;
  maxPallet: number;
  maxWeightLbs: number;
  supplierName: string;
  status: string;
  statusLabel: string;
  insuranceExpiry: string;
  registrationExpiry: string;
  currentDriver: string | null;
  currentTripNo: string | null;
};

export type TmsDockSlot = {
  id: number;
  dockNo: string;
  status: string;
  tripNo: string | null;
  driverName: string | null;
  plateNo: string | null;
  destination: string | null;
  palletQty: number;
  loadedPallet: number;
  exceptionNote: string | null;
  etaDepart: string | null;
};

export type TmsPodRecord = {
  id: number;
  tripNo: string;
  omsOrderNo: string;
  destination: string;
  deliveredTime: string | null;
  receiver: string | null;
  uploadSource: string;
  auditStatus: string;
  auditStatusLabel: string;
  fileName: string | null;
  createTime: string;
};

export type TmsFreightRecord = {
  id: number;
  tripNo: string;
  supplierName: string;
  linehaul: number;
  accessorial: number;
  insurance: number;
  otherFee: number;
  totalFee: number;
  payStatus: string;
  payStatusLabel: string;
  invoiceNo: string | null;
};

export type TmsSupplier = {
  id: number;
  supplierName: string;
  supplierType: string;
  contactName: string;
  phone: string;
  email: string;
  serviceArea: string;
  onTimeRate: number;
  exceptionRate: number;
  status: string;
};

export type TmsException = {
  id: number;
  tripNo: string;
  exceptionType: string;
  severity: string;
  description: string;
  status: string;
  statusLabel: string;
  createTime: string;
  handler: string | null;
};

export type TmsLog = {
  id: number;
  module: string;
  tripNo: string | null;
  operator: string;
  action: string;
  detail: string;
  createTime: string;
};

export type TmsOverview = {
  pendingDispatch: number;
  pendingManual: number;
  inTransit: number;
  signed: number;
  exception: number;
  pendingSettlement: number;
  todayDepart: number;
  dockLoading: number;
  recentLogs: TmsLog[];
};

export type TmsDispatchPlan = {
  id: number;
  planNo: string;
  destination: string;
  orderCount: number;
  palletQty: number;
  appointmentTime: string;
  vehicleType: string;
  carrierName: string;
  dockNo: string;
  driverName: string;
  plateNo: string;
  score: number;
  status: string;
};

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const ACTIVE_DEADLINE_STATUSES: TmsTripStatus[] = [
  'PENDING_DISPATCH',
  'PRE_TRIP',
  'PENDING_MANUAL',
  'CONFIRMED',
  'PENDING_CHECKIN',
  'CHECKED_IN',
  'QUEUING',
  'LOADING',
  'DEPARTED',
  'IN_TRANSIT',
  'ARRIVED',
  'EXCEPTION'
];

function formatDemoDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 活跃车次使用相对当前时间的预约，便于演示风险等级 */
function resolveDemoAppointment(row: TmsTripOrder): string | null {
  if (!row.appointmentTime) return null;
  if (!ACTIVE_DEADLINE_STATUSES.includes(row.status)) return row.appointmentTime;
  const finishOffsets = [20, 45, 75, -12, 8, 55, 90, 35, 28, 62, 5, 48];
  const finishInMin = finishOffsets[row.id % finishOffsets.length];
  const probe = computeTripDeadline({ ...row, appointmentTime: '2099-06-06 20:00:00' });
  const routeMinutes =
    probe.estimatedTravelMinutes +
    probe.trafficBufferMinutes +
    probe.exitCheckMinutes +
    probe.sealSignMinutes;
  const apptMs = Date.now() + (finishInMin + routeMinutes) * 60_000;
  return formatDemoDateTime(new Date(apptMs));
}

function enrichTripRow(row: TmsTripOrder) {
  const appointmentTime = resolveDemoAppointment(row);
  const enriched = enrichTripDeadlineFields({ ...row, appointmentTime });
  return {
    ...enriched,
    appointmentTime,
    dispatchPriorityScore: computeDispatchPriorityScore(enriched)
  };
}

function findTripByNo(tripNo: string | null | undefined) {
  if (!tripNo) return undefined;
  return tripOrders.find(r => r.tripNo === tripNo);
}

function enrichDockSlot(slot: TmsDockSlot) {
  const trip = findTripByNo(slot.tripNo);
  if (!trip) return { ...slot };
  const deadline = enrichTripRow(trip);
  return {
    ...slot,
    appointmentTime: deadline.appointmentTime,
    originWarehouse: trip.originWarehouse,
    destination: slot.destination ?? trip.destination,
    cartonQty: trip.cartonQty,
    distanceMiles: deadline.distanceMiles,
    estimatedTravelMinutes: deadline.estimatedTravelMinutes,
    trafficBufferMinutes: deadline.trafficBufferMinutes,
    exitCheckMinutes: deadline.exitCheckMinutes,
    sealSignMinutes: deadline.sealSignMinutes,
    loadingMethod: deadline.loadingMethod,
    estimatedLoadingMinutes: deadline.estimatedLoadingMinutes,
    latestFinishTime: deadline.latestFinishTime,
    latestStartLoadingTime: deadline.latestStartLoadingTime,
    remainingMinutes: deadline.remainingMinutes,
    deadlineRiskLevel: deadline.deadlineRiskLevel
  };
}

function enrichDispatchPlan(plan: TmsDispatchPlan) {
  const trip =
    tripOrders.find(
      r =>
        r.destination === plan.destination &&
        ['PENDING_DISPATCH', 'PRE_TRIP', 'PENDING_MANUAL', 'CONFIRMED'].includes(r.status)
    ) ?? tripOrders.find(r => r.destination === plan.destination);
  const deadline = enrichTripDeadlineFields({
    appointmentTime: resolveDemoAppointment(trip ?? { ...tripOrders[0], appointmentTime: plan.appointmentTime }),
    originWarehouse: trip?.originWarehouse ?? 'LA',
    destination: plan.destination,
    palletQty: plan.palletQty,
    cartonQty: trip?.cartonQty ?? plan.palletQty * 10
  });
  return {
    ...plan,
    ...deadline,
    appointmentTime: trip ? resolveDemoAppointment(trip) : plan.appointmentTime,
    dispatchPriorityScore: computeDispatchPriorityScore(deadline),
    score: computeDispatchPriorityScore(deadline)
  };
}

function deadlineSortKey(row: {
  remainingMinutes?: number | null;
  deadlineRiskLevel?: string;
}) {
  return {
    deadlineRiskLevel: (row.deadlineRiskLevel ?? 'NORMAL') as 'NORMAL' | 'NEAR' | 'URGENT' | 'OVERDUE',
    remainingMinutes: row.remainingMinutes ?? null,
    appointmentTime: null,
    distanceMiles: 0,
    estimatedTravelMinutes: 0,
    trafficBufferMinutes: 0,
    exitCheckMinutes: 0,
    sealSignMinutes: 0,
    loadingMethod: 'MIXED' as const,
    estimatedLoadingMinutes: 0,
    latestFinishTime: null,
    latestStartLoadingTime: null
  };
}

function sortByDeadline<T extends { remainingMinutes?: number | null; deadlineRiskLevel?: string }>(
  rows: T[]
) {
  return [...rows].sort((a, b) => compareDeadlinePriority(deadlineSortKey(a), deadlineSortKey(b)));
}

let tripOrders: TmsTripOrder[] = [
  {
    id: 1,
    tripNo: 'TR2505160001',
    omsOrderNo: 'SO2505160001',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon\u9884\u7ea6',
    customerName: 'Anker Innovations',
    originWarehouse: 'LA',
    destination: 'ONT8',
    appointmentTime: '2026-05-16 10:00',
    palletQty: 12,
    cartonQty: 120,
    carrierName: 'FedEx Freight',
    driverName: '\u5f20\u5e08\u5085',
    plateNo: 'CA12345',
    dockNo: 'DOCK-03',
    vehicleType: '53\u5c3a',
    status: 'LOADING',
    hasException: false,
    createTime: '2026-05-15 14:20:00',
    remark: null
  },
  {
    id: 2,
    tripNo: 'TR2505160002',
    omsOrderNo: 'SO2505160008',
    orderType: 'LTL',
    orderTypeLabel: 'LTL',
    customerName: 'SHEIN',
    originWarehouse: 'DAL',
    destination: 'Dallas TX',
    appointmentTime: '2026-05-16 14:00',
    palletQty: 8,
    cartonQty: 64,
    carrierName: 'XPO Logistics',
    driverName: null,
    plateNo: null,
    dockNo: null,
    vehicleType: '26\u5c3a',
    status: 'PENDING_DISPATCH',
    hasException: false,
    createTime: '2026-05-15 16:10:00',
    remark: null
  },
  {
    id: 3,
    tripNo: 'TR2505160003',
    omsOrderNo: 'SO2505160012',
    orderType: 'LOCAL',
    orderTypeLabel: '\u672c\u5730\u6d3e\u9001',
    customerName: 'ABC Corp',
    originWarehouse: 'NJ',
    destination: 'CA 91710',
    appointmentTime: '2026-05-17 09:00',
    palletQty: 6,
    cartonQty: 48,
    carrierName: 'Local Carrier',
    driverName: '\u674e\u5e08\u5085',
    plateNo: 'NJ88776',
    dockNo: 'DOCK-01',
    vehicleType: 'Box Truck',
    status: 'PENDING_MANUAL',
    hasException: false,
    createTime: '2026-05-15 17:30:00',
    remark: '\u9ad8\u8d27\u503c\u9700\u4eba\u5de5\u786e\u8ba4'
  },
  {
    id: 4,
    tripNo: 'TR2505150099',
    omsOrderNo: 'SO2505150020',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon\u9884\u7ea6',
    customerName: 'PopMart',
    originWarehouse: 'SAV',
    destination: 'XLX7',
    appointmentTime: '2026-05-15 08:00',
    palletQty: 20,
    cartonQty: 0,
    carrierName: 'FedEx Freight',
    driverName: '\u738b\u5e08\u5085',
    plateNo: 'GA55667',
    dockNo: 'DOCK-05',
    vehicleType: '53\u5c3a',
    status: 'IN_TRANSIT',
    hasException: false,
    createTime: '2026-05-14 10:00:00',
    remark: null
  },
  {
    id: 5,
    tripNo: 'TR2505140088',
    omsOrderNo: 'SO2505140015',
    orderType: 'COMMERCIAL',
    orderTypeLabel: '\u5546\u4e1a\u5730\u5740',
    customerName: 'Robotime',
    originWarehouse: 'LA',
    destination: '\u6d1b\u6749\u77f6\u79c1\u4eba\u5730\u5740',
    appointmentTime: '2026-05-14 15:00',
    palletQty: 4,
    cartonQty: 32,
    carrierName: 'Local Carrier',
    driverName: '\u8d75\u5e08\u5085',
    plateNo: 'CA99881',
    dockNo: 'DOCK-02',
    vehicleType: 'Sprinter',
    status: 'SIGNED',
    hasException: false,
    createTime: '2026-05-13 11:20:00',
    remark: null
  },
  {
    id: 6,
    tripNo: 'TR2505130077',
    omsOrderNo: 'SO2505130009',
    orderType: 'EXPRESS',
    orderTypeLabel: '\u5feb\u9012',
    customerName: 'Anker Innovations',
    originWarehouse: 'LA',
    destination: 'LGB8',
    appointmentTime: '2026-05-13 11:00',
    palletQty: 2,
    cartonQty: 16,
    carrierName: 'UPS Freight',
    driverName: '\u5f20\u5e08\u5085',
    plateNo: 'CA12345',
    dockNo: 'DOCK-04',
    vehicleType: 'Sprinter',
    status: 'PENDING_SETTLEMENT',
    hasException: false,
    createTime: '2026-05-12 09:00:00',
    remark: null
  },
  {
    id: 7,
    tripNo: 'TR2505120066',
    omsOrderNo: 'SO2505120003',
    orderType: 'LTL',
    orderTypeLabel: 'LTL',
    customerName: 'SHEIN',
    originWarehouse: 'DAL',
    destination: 'Houston TX',
    appointmentTime: '2026-05-12 16:00',
    palletQty: 10,
    cartonQty: 80,
    carrierName: 'Estes Express',
    driverName: '\u9648\u5e08\u5085',
    plateNo: 'TX33445',
    dockNo: 'DOCK-06',
    vehicleType: '26\u5c3a',
    status: 'EXCEPTION',
    hasException: true,
    createTime: '2026-05-11 14:00:00',
    remark: '\u5c11\u677f\u5f02\u5e38'
  },
  {
    id: 8,
    tripNo: 'TR2505110055',
    omsOrderNo: 'SO2505110001',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon\u9884\u7ea6',
    customerName: 'Anker Innovations',
    originWarehouse: 'LA',
    destination: 'SMF3',
    appointmentTime: '2026-05-11 07:00',
    palletQty: 14,
    cartonQty: 0,
    carrierName: 'XPO Logistics',
    driverName: '\u738b\u5e08\u5085',
    plateNo: 'GA55667',
    dockNo: 'DOCK-03',
    vehicleType: '53\u5c3a',
    status: 'SETTLED',
    hasException: false,
    createTime: '2026-05-10 08:00:00',
    remark: null
  },
  {
    id: 9,
    tripNo: 'TR2505160004',
    omsOrderNo: 'SO2505160018',
    orderType: 'LOCAL',
    orderTypeLabel: '\u672c\u5730\u6d3e\u9001',
    customerName: 'ABC Corp',
    originWarehouse: 'NJ',
    destination: 'Brooklyn NY',
    appointmentTime: '2026-05-16 11:30',
    palletQty: 5,
    cartonQty: 40,
    carrierName: null,
    driverName: null,
    plateNo: null,
    dockNo: null,
    vehicleType: null,
    status: 'PRE_TRIP',
    hasException: false,
    createTime: '2026-05-15 18:00:00',
    remark: '\u7cfb\u7edf\u81ea\u52a8\u6392\u8f66\u9884\u8f66\u6b21'
  },
  {
    id: 10,
    tripNo: 'TR2505160005',
    omsOrderNo: 'SO2505160022',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon\u9884\u7ea6',
    customerName: 'PopMart',
    originWarehouse: 'SAV',
    destination: 'CLT2',
    appointmentTime: '2026-05-16 13:00',
    palletQty: 18,
    cartonQty: 0,
    carrierName: 'FedEx Freight',
    driverName: '\u674e\u5e08\u5085',
    plateNo: 'NJ88776',
    dockNo: 'DOCK-05',
    vehicleType: '53\u5c3a',
    status: 'CONFIRMED',
    hasException: false,
    createTime: '2026-05-15 19:10:00',
    remark: null
  },
  {
    id: 11,
    tripNo: 'TR2505160006',
    omsOrderNo: 'SO2505160025',
    orderType: 'LTL',
    orderTypeLabel: 'LTL',
    customerName: 'Robotime',
    originWarehouse: 'LA',
    destination: 'Phoenix AZ',
    appointmentTime: '2026-05-17 08:00',
    palletQty: 9,
    cartonQty: 72,
    carrierName: 'XPO Logistics',
    driverName: '\u8d75\u5e08\u5085',
    plateNo: 'CA99881',
    dockNo: 'DOCK-01',
    vehicleType: '26\u5c3a',
    status: 'CHECKED_IN',
    hasException: false,
    createTime: '2026-05-15 20:00:00',
    remark: null
  },
  {
    id: 12,
    tripNo: 'TR2505160007',
    omsOrderNo: 'SO2505160030',
    orderType: 'COMMERCIAL',
    orderTypeLabel: '\u5546\u4e1a\u5730\u5740',
    customerName: 'SHEIN',
    originWarehouse: 'DAL',
    destination: 'Austin TX',
    appointmentTime: '2026-05-16 16:30',
    palletQty: 7,
    cartonQty: 56,
    carrierName: 'Local Carrier',
    driverName: '\u5f20\u5e08\u5085',
    plateNo: 'CA12345',
    dockNo: 'DOCK-02',
    vehicleType: 'Box Truck',
    status: 'QUEUING',
    hasException: false,
    createTime: '2026-05-15 21:00:00',
    remark: null
  }
];

const ADD_CARGO_ALLOWED_STATUSES: TmsTripStatus[] = [
  'PENDING_DISPATCH',
  'PRE_TRIP',
  'PENDING_MANUAL',
  'CONFIRMED',
  'PENDING_CHECKIN',
  'CHECKED_IN',
  'QUEUING',
  'LOADING'
];

const availableCargoPool: TmsAvailableCargoOrder[] = [
  {
    id: 80001,
    cargoOrderNo: 'CO-2026-0001',
    customerName: 'Anker Innovations',
    destination: 'ONT8',
    appointmentNo: 'ISA-8844101',
    originWarehouse: 'LA',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon预约',
    palletQty: 6,
    cartonQty: 60
  },
  {
    id: 80002,
    cargoOrderNo: 'CO-2026-0002',
    customerName: '演示客户 B',
    destination: 'ONT8',
    appointmentNo: 'ISA-8844102',
    originWarehouse: 'LA',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon预约',
    palletQty: 6,
    cartonQty: 60
  },
  {
    id: 80003,
    cargoOrderNo: 'CO-2026-0003',
    customerName: 'PopMart',
    destination: 'LGB8',
    appointmentNo: 'ISA-8844103',
    originWarehouse: 'LA',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon预约',
    palletQty: 4,
    cartonQty: 32
  },
  {
    id: 80004,
    cargoOrderNo: 'CO-2026-0004',
    customerName: 'Robotime',
    destination: 'SMF3',
    appointmentNo: 'ISA-8844104',
    originWarehouse: 'LA',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon预约',
    palletQty: 5,
    cartonQty: 40
  },
  {
    id: 80005,
    cargoOrderNo: 'CO-2026-0005',
    customerName: 'SHEIN',
    destination: 'Dallas TX',
    appointmentNo: 'APT-2026-0105',
    originWarehouse: 'DAL',
    orderType: 'LTL',
    orderTypeLabel: 'LTL',
    palletQty: 8,
    cartonQty: 64
  },
  {
    id: 80006,
    cargoOrderNo: 'CO-2026-0006',
    customerName: 'SHEIN',
    destination: 'Houston TX',
    appointmentNo: 'APT-2026-0106',
    originWarehouse: 'DAL',
    orderType: 'LTL',
    orderTypeLabel: 'LTL',
    palletQty: 5,
    cartonQty: 40
  },
  {
    id: 80007,
    cargoOrderNo: 'CO-2026-0007',
    customerName: 'ABC Corp',
    destination: 'CA 91710',
    appointmentNo: 'APT-2026-0107',
    originWarehouse: 'NJ',
    orderType: 'LOCAL',
    orderTypeLabel: '本地派送',
    palletQty: 3,
    cartonQty: 24
  },
  {
    id: 80008,
    cargoOrderNo: 'CO-2026-0008',
    customerName: 'ABC Corp',
    destination: 'CA 91710',
    appointmentNo: 'APT-2026-0108',
    originWarehouse: 'NJ',
    orderType: 'LOCAL',
    orderTypeLabel: '本地派送',
    palletQty: 3,
    cartonQty: 24
  },
  {
    id: 80009,
    cargoOrderNo: 'CO-2026-0009',
    customerName: 'PopMart',
    destination: 'Brooklyn NY',
    appointmentNo: 'APT-2026-0109',
    originWarehouse: 'NJ',
    orderType: 'LOCAL',
    orderTypeLabel: '本地派送',
    palletQty: 4,
    cartonQty: 32
  },
  {
    id: 80010,
    cargoOrderNo: 'CO-2026-0010',
    customerName: 'Anker Innovations',
    destination: 'Phoenix AZ',
    appointmentNo: 'APT-2026-0110',
    originWarehouse: 'LA',
    orderType: 'LTL',
    orderTypeLabel: 'LTL',
    palletQty: 7,
    cartonQty: 56
  },
  {
    id: 80011,
    cargoOrderNo: 'CO-2026-0011',
    customerName: 'Robotime',
    destination: '洛杉矶私人地址',
    appointmentNo: 'APT-2026-0111',
    originWarehouse: 'LA',
    orderType: 'COMMERCIAL',
    orderTypeLabel: '商业地址',
    palletQty: 2,
    cartonQty: 16
  },
  {
    id: 80012,
    cargoOrderNo: 'CO-2026-0012',
    customerName: 'SHEIN',
    destination: 'Austin TX',
    appointmentNo: 'APT-2026-0112',
    originWarehouse: 'DAL',
    orderType: 'LTL',
    orderTypeLabel: 'LTL',
    palletQty: 6,
    cartonQty: 48
  },
  {
    id: 80013,
    cargoOrderNo: 'CO-2026-0013',
    customerName: 'PopMart',
    destination: 'CLT2',
    appointmentNo: 'ISA-8844113',
    originWarehouse: 'SAV',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon预约',
    palletQty: 9,
    cartonQty: 0
  },
  {
    id: 80014,
    cargoOrderNo: 'CO-2026-0014',
    customerName: 'Anker Innovations',
    destination: 'XLX7',
    appointmentNo: 'ISA-8844114',
    originWarehouse: 'SAV',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon预约',
    palletQty: 10,
    cartonQty: 0
  },
  {
    id: 80015,
    cargoOrderNo: 'CO-2026-0015',
    customerName: 'Robotime',
    destination: 'ONT8',
    appointmentNo: 'ISA-8844115',
    originWarehouse: 'LA',
    orderType: 'AMAZON',
    orderTypeLabel: 'Amazon预约',
    palletQty: 3,
    cartonQty: 30
  }
];

let tripCargoItemSeq = 100;
const tripCargoStore = new Map<number, TmsTripCargoItem[]>();
const tripExtraLogs = new Map<number, TmsTripLog[]>();

function poolOrderToCargoItem(order: TmsAvailableCargoOrder): TmsTripCargoItem {
  return {
    id: ++tripCargoItemSeq,
    cargoOrderId: order.id,
    cargoOrderNo: order.cargoOrderNo,
    customerName: order.customerName,
    destination: order.destination,
    appointmentNo: order.appointmentNo,
    orderType: order.orderType,
    palletQty: order.palletQty,
    cartonQty: order.cartonQty
  };
}

function initTripCargoStore() {
  const assign = (tripId: number, orderIds: number[]) => {
    const items = orderIds
      .map(id => availableCargoPool.find(o => o.id === id))
      .filter((o): o is TmsAvailableCargoOrder => Boolean(o))
      .map(poolOrderToCargoItem);
    tripCargoStore.set(tripId, items);
  };
  assign(1, [80001, 80002]);
  assign(2, [80005]);
  assign(3, [80007, 80008]);
}

initTripCargoStore();

function getAssignedCargoOrderIds(): Set<number> {
  const ids = new Set<number>();
  tripCargoStore.forEach(items => items.forEach(item => ids.add(item.cargoOrderId)));
  return ids;
}

function syncTripCargoTotals(tripId: number) {
  const trip = tripOrders.find(r => r.id === tripId);
  const items = tripCargoStore.get(tripId) ?? [];
  if (!trip) return;
  trip.palletQty = items.reduce((sum, item) => sum + item.palletQty, 0);
  trip.cartonQty = items.reduce((sum, item) => sum + item.cartonQty, 0);
}

function appendTripLog(tripId: number, action: string, status: string, operator = 'TMS操作员') {
  const logs = tripExtraLogs.get(tripId) ?? [];
  logs.unshift({
    id: logs.length + 100,
    time: nowStr(),
    operator,
    action,
    status
  });
  tripExtraLogs.set(tripId, logs);
}

const drivers: TmsDriver[] = [
  {
    id: 1,
    driverName: '\u5f20\u5e08\u5085',
    phone: '+1 626-555-0101',
    supplierName: 'FedEx Freight',
    licenseNo: 'DL-CA-882910',
    status: 'LOADING',
    statusLabel: '\u88c5\u8f66\u4e2d',
    currentTripNo: 'TR2505160001',
    gpsOnline: true,
    checkinTime: '2026-05-16 08:45',
    onTimeRate: 96,
    exceptionRate: 2
  },
  {
    id: 2,
    driverName: '\u674e\u5e08\u5085',
    phone: '+1 201-555-0202',
    supplierName: 'Local Carrier',
    licenseNo: 'DL-NJ-771203',
    status: 'CONFIRMED',
    statusLabel: '\u5df2\u63a5\u5355',
    currentTripNo: 'TR2505160005',
    gpsOnline: true,
    checkinTime: null,
    onTimeRate: 92,
    exceptionRate: 4
  },
  {
    id: 3,
    driverName: '\u738b\u5e08\u5085',
    phone: '+1 404-555-0303',
    supplierName: 'XPO Logistics',
    licenseNo: 'DL-GA-665501',
    status: 'IN_TRANSIT',
    statusLabel: '\u8fd0\u8f93\u4e2d',
    currentTripNo: 'TR2505150099',
    gpsOnline: true,
    checkinTime: '2026-05-15 06:30',
    onTimeRate: 94,
    exceptionRate: 3
  },
  {
    id: 4,
    driverName: '\u8d75\u5e08\u5085',
    phone: '+1 310-555-0404',
    supplierName: 'Local Carrier',
    licenseNo: 'DL-CA-554412',
    status: 'CHECKED_IN',
    statusLabel: '\u5230\u4ed3',
    currentTripNo: 'TR2505160006',
    gpsOnline: true,
    checkinTime: '2026-05-16 07:50',
    onTimeRate: 90,
    exceptionRate: 5
  },
  {
    id: 5,
    driverName: '\u9648\u5e08\u5085',
    phone: '+1 713-555-0505',
    supplierName: 'Estes Express',
    licenseNo: 'DL-TX-443301',
    status: 'EXCEPTION',
    statusLabel: '\u5f02\u5e38',
    currentTripNo: 'TR2505120066',
    gpsOnline: false,
    checkinTime: '2026-05-12 14:00',
    onTimeRate: 88,
    exceptionRate: 8
  },
  {
    id: 6,
    driverName: '\u5218\u5e08\u5085',
    phone: '+1 818-555-0606',
    supplierName: 'FedEx Freight',
    licenseNo: 'DL-CA-332201',
    status: 'IDLE',
    statusLabel: '\u7a7a\u95f2',
    currentTripNo: null,
    gpsOnline: true,
    checkinTime: null,
    onTimeRate: 95,
    exceptionRate: 1
  }
];

const vehicles: TmsVehicle[] = [
  {
    id: 1,
    plateNo: 'CA12345',
    vehicleType: '53\u5c3a',
    maxPallet: 26,
    maxWeightLbs: 44000,
    supplierName: 'FedEx Freight',
    status: 'IN_USE',
    statusLabel: '\u4f7f\u7528\u4e2d',
    insuranceExpiry: '2026-12-31',
    registrationExpiry: '2026-08-15',
    currentDriver: '\u5f20\u5e08\u5085',
    currentTripNo: 'TR2505160001'
  },
  {
    id: 2,
    plateNo: 'NJ88776',
    vehicleType: '26\u5c3a',
    maxPallet: 12,
    maxWeightLbs: 26000,
    supplierName: 'Local Carrier',
    status: 'RESERVED',
    statusLabel: '\u5df2\u9884\u7ea6',
    insuranceExpiry: '2026-10-20',
    registrationExpiry: '2026-06-30',
    currentDriver: '\u674e\u5e08\u5085',
    currentTripNo: 'TR2505160005'
  },
  {
    id: 3,
    plateNo: 'GA55667',
    vehicleType: '53\u5c3a',
    maxPallet: 26,
    maxWeightLbs: 44000,
    supplierName: 'XPO Logistics',
    status: 'IN_TRANSIT',
    statusLabel: '\u8fd0\u8f93\u4e2d',
    insuranceExpiry: '2027-01-10',
    registrationExpiry: '2026-11-01',
    currentDriver: '\u738b\u5e08\u5085',
    currentTripNo: 'TR2505150099'
  },
  {
    id: 4,
    plateNo: 'CA99881',
    vehicleType: 'Box Truck',
    maxPallet: 8,
    maxWeightLbs: 12000,
    supplierName: 'Local Carrier',
    status: 'CHECKED_IN',
    statusLabel: '\u5230\u4ed3',
    insuranceExpiry: '2026-09-18',
    registrationExpiry: '2026-07-22',
    currentDriver: '\u8d75\u5e08\u5085',
    currentTripNo: 'TR2505160006'
  },
  {
    id: 5,
    plateNo: 'TX33445',
    vehicleType: '26\u5c3a',
    maxPallet: 12,
    maxWeightLbs: 26000,
    supplierName: 'Estes Express',
    status: 'MAINTENANCE',
    statusLabel: '\u7ef4\u4fee',
    insuranceExpiry: '2026-05-01',
    registrationExpiry: '2026-04-30',
    currentDriver: null,
    currentTripNo: null
  },
  {
    id: 6,
    plateNo: 'CA77221',
    vehicleType: 'Sprinter',
    maxPallet: 4,
    maxWeightLbs: 6000,
    supplierName: 'UPS Freight',
    status: 'AVAILABLE',
    statusLabel: '\u53ef\u7528',
    insuranceExpiry: '2026-12-01',
    registrationExpiry: '2026-10-10',
    currentDriver: null,
    currentTripNo: null
  }
];

let dockSlots: TmsDockSlot[] = [
  {
    id: 1,
    dockNo: 'DOCK-01',
    status: 'CHECKED_IN',
    tripNo: 'TR2505160006',
    driverName: '\u8d75\u5e08\u5085',
    plateNo: 'CA99881',
    destination: 'Phoenix AZ',
    palletQty: 9,
    loadedPallet: 0,
    exceptionNote: null,
    etaDepart: '2026-05-17 09:00'
  },
  {
    id: 2,
    dockNo: 'DOCK-02',
    status: 'QUEUING',
    tripNo: 'TR2505160007',
    driverName: '\u5f20\u5e08\u5085',
    plateNo: 'CA12345',
    destination: 'Austin TX',
    palletQty: 7,
    loadedPallet: 0,
    exceptionNote: null,
    etaDepart: '2026-05-16 17:00'
  },
  {
    id: 3,
    dockNo: 'DOCK-03',
    status: 'LOADING',
    tripNo: 'TR2505160001',
    driverName: '\u5f20\u5e08\u5085',
    plateNo: 'CA12345',
    destination: 'ONT8',
    palletQty: 12,
    loadedPallet: 8,
    exceptionNote: null,
    etaDepart: '2026-05-16 11:00'
  },
  {
    id: 4,
    dockNo: 'DOCK-04',
    status: 'IDLE',
    tripNo: null,
    driverName: null,
    plateNo: null,
    destination: null,
    palletQty: 0,
    loadedPallet: 0,
    exceptionNote: null,
    etaDepart: null
  },
  {
    id: 5,
    dockNo: 'DOCK-05',
    status: 'RESERVED',
    tripNo: 'TR2505160005',
    driverName: '\u674e\u5e08\u5085',
    plateNo: 'NJ88776',
    destination: 'CLT2',
    palletQty: 18,
    loadedPallet: 0,
    exceptionNote: null,
    etaDepart: '2026-05-16 14:30'
  },
  {
    id: 6,
    dockNo: 'DOCK-06',
    status: 'EXCEPTION',
    tripNo: 'TR2505120066',
    driverName: '\u9648\u5e08\u5085',
    plateNo: 'TX33445',
    destination: 'Houston TX',
    palletQty: 10,
    loadedPallet: 7,
    exceptionNote: '\u5c11\u677f',
    etaDepart: null
  }
];

const podRecords: TmsPodRecord[] = [
  {
    id: 1,
    tripNo: 'TR2505140088',
    omsOrderNo: 'SO2505140015',
    destination: '\u6d1b\u6749\u77f6\u79c1\u4eba\u5730\u5740',
    deliveredTime: '2026-05-14 18:20',
    receiver: 'John Smith',
    uploadSource: '\u53f8\u673a\u7aef',
    auditStatus: 'APPROVED',
    auditStatusLabel: '\u5df2\u901a\u8fc7',
    fileName: 'POD_TR2505140088.jpg',
    createTime: '2026-05-14 18:25'
  },
  {
    id: 2,
    tripNo: 'TR2505130077',
    omsOrderNo: 'SO2505130009',
    destination: 'LGB8',
    deliveredTime: '2026-05-13 15:10',
    receiver: 'Amazon Receiving',
    uploadSource: 'API\u56de\u4f20',
    auditStatus: 'PENDING',
    auditStatusLabel: '\u5f85\u5ba1\u6838',
    fileName: 'POD_TR2505130077.pdf',
    createTime: '2026-05-13 15:12'
  },
  {
    id: 3,
    tripNo: 'TR2505120066',
    omsOrderNo: 'SO2505120003',
    destination: 'Houston TX',
    deliveredTime: null,
    receiver: null,
    uploadSource: '\u4f9b\u5e94\u5546\u95e8\u6237',
    auditStatus: 'REJECTED',
    auditStatusLabel: '\u9a73\u56de',
    fileName: 'POD_partial.jpg',
    createTime: '2026-05-12 20:00'
  }
];

const freightRecords: TmsFreightRecord[] = [
  {
    id: 1,
    tripNo: 'TR2505110055',
    supplierName: 'XPO Logistics',
    linehaul: 1850,
    accessorial: 120,
    insurance: 45,
    otherFee: 0,
    totalFee: 2015,
    payStatus: 'PAID',
    payStatusLabel: '\u5df2\u4ed8\u6b3e',
    invoiceNo: 'INV-XPO-20250511'
  },
  {
    id: 2,
    tripNo: 'TR2505130077',
    supplierName: 'UPS Freight',
    linehaul: 420,
    accessorial: 35,
    insurance: 12,
    otherFee: 0,
    totalFee: 467,
    payStatus: 'RECONCILED',
    payStatusLabel: '\u5df2\u5bf9\u8d26',
    invoiceNo: 'INV-UPS-20250513'
  },
  {
    id: 3,
    tripNo: 'TR2505140088',
    supplierName: 'Local Carrier',
    linehaul: 680,
    accessorial: 80,
    insurance: 20,
    otherFee: 50,
    totalFee: 830,
    payStatus: 'AUDITED',
    payStatusLabel: '\u5df2\u5ba1\u6838',
    invoiceNo: null
  },
  {
    id: 4,
    tripNo: 'TR2505160001',
    supplierName: 'FedEx Freight',
    linehaul: 0,
    accessorial: 0,
    insurance: 0,
    otherFee: 0,
    totalFee: 0,
    payStatus: 'PENDING',
    payStatusLabel: '\u672a\u5ba1\u6838',
    invoiceNo: null
  }
];

const tmsSuppliers: TmsSupplier[] = [
  {
    id: 1,
    supplierName: 'FedEx Freight',
    supplierType: 'LTL\u627f\u8fd0\u5546',
    contactName: 'Mike Johnson',
    phone: '+1 800-555-1001',
    email: 'ops@fedexfreight.mock',
    serviceArea: 'CA, NV, AZ, TX',
    onTimeRate: 94,
    exceptionRate: 3,
    status: 'ACTIVE'
  },
  {
    id: 2,
    supplierName: 'XPO Logistics',
    supplierType: 'LTL\u627f\u8fd0\u5546',
    contactName: 'Sarah Lee',
    phone: '+1 800-555-1002',
    email: 'dispatch@xpo.mock',
    serviceArea: 'Nationwide',
    onTimeRate: 92,
    exceptionRate: 4,
    status: 'ACTIVE'
  },
  {
    id: 3,
    supplierName: 'Local Carrier',
    supplierType: '\u672c\u5730\u6d3e\u9001\u4f9b\u5e94\u5546',
    contactName: '\u674e\u7ecf\u7406',
    phone: '+1 626-555-2001',
    email: 'la.local@carrier.mock',
    serviceArea: 'LA Metro, OC, IE',
    onTimeRate: 90,
    exceptionRate: 6,
    status: 'ACTIVE'
  },
  {
    id: 4,
    supplierName: 'Estes Express',
    supplierType: 'LTL\u627f\u8fd0\u5546',
    contactName: 'Tom Brown',
    phone: '+1 800-555-1004',
    email: 'billing@estes.mock',
    serviceArea: 'South, Midwest',
    onTimeRate: 91,
    exceptionRate: 5,
    status: 'ACTIVE'
  }
];

const exceptions: TmsException[] = [
  {
    id: 1,
    tripNo: 'TR2505120066',
    exceptionType: '\u5c11\u677f',
    severity: 'HIGH',
    description: '\u5b9e\u9645\u88c5\u8f667\u677f\uff0c\u8ba2\u5355\u898110\u677f',
    status: 'OPEN',
    statusLabel: '\u5904\u7406\u4e2d',
    createTime: '2026-05-12 16:30',
    handler: '\u8c03\u5ea6\u5458A'
  },
  {
    id: 2,
    tripNo: 'TR2505160001',
    exceptionType: '\u8d27\u672a\u9f50',
    severity: 'MEDIUM',
    description: 'WMS\u62a5\u544a2\u677f\u8d27\u7269\u672a\u5230\u4f4d',
    status: 'OPEN',
    statusLabel: '\u5904\u7406\u4e2d',
    createTime: '2026-05-16 09:40',
    handler: '\u4ed3\u5e93\u4e3b\u7ba1'
  },
  {
    id: 3,
    tripNo: 'TR2505150099',
    exceptionType: '\u53f8\u673a\u672a\u5230',
    severity: 'LOW',
    description: '\u53f8\u673a\u8fdf\u523030\u5206\u949f\uff0c\u5df2\u8054\u7cfb',
    status: 'CLOSED',
    statusLabel: '\u5df2\u5173\u95ed',
    createTime: '2026-05-15 07:45',
    handler: '\u8c03\u5ea6\u5458B'
  }
];

let dispatchPlans: TmsDispatchPlan[] = [
  {
    id: 1,
    planNo: 'PLAN-250516-01',
    destination: 'Dallas TX',
    orderCount: 2,
    palletQty: 8,
    appointmentTime: '2026-05-16 14:00',
    vehicleType: '26\u5c3a',
    carrierName: 'XPO Logistics',
    dockNo: 'DOCK-04',
    driverName: '\u5218\u5e08\u5085',
    plateNo: 'CA77221',
    score: 94,
    status: 'DRAFT'
  },
  {
    id: 2,
    planNo: 'PLAN-250516-02',
    destination: 'Brooklyn NY',
    orderCount: 1,
    palletQty: 5,
    appointmentTime: '2026-05-16 11:30',
    vehicleType: 'Box Truck',
    carrierName: 'Local Carrier',
    dockNo: 'DOCK-04',
    driverName: '\u5218\u5e08\u5085',
    plateNo: 'CA77221',
    score: 88,
    status: 'DRAFT'
  }
];

const tmsLogs: TmsLog[] = [
  {
    id: 1,
    module: '\u8f66\u6b21\u8ba2\u5355',
    tripNo: 'TR2505160001',
    operator: 'OMS\u63a8\u9001',
    action: '\u751f\u6210\u8f66\u6b21',
    detail: 'SO2505160001 \u2192 TR2505160001',
    createTime: '2026-05-15 14:20'
  },
  {
    id: 2,
    module: '\u8c03\u5ea6\u5de5\u4f5c\u53f0',
    tripNo: 'TR2505160005',
    operator: '\u8c03\u5ea6\u5458A',
    action: '\u786e\u8ba4\u8c03\u5ea6',
    detail: '\u5206\u914d DOCK-05 / \u674e\u5e08\u5085 / NJ88776',
    createTime: '2026-05-15 19:30'
  },
  {
    id: 3,
    module: 'DOCK\u770b\u677f',
    tripNo: 'TR2505160001',
    operator: 'WMS',
    action: '\u88c5\u8f66\u8fdb\u5ea6',
    detail: '8/12 \u677f\u5df2\u88c5\u8f66',
    createTime: '2026-05-16 09:55'
  },
  {
    id: 4,
    module: 'POD\u56de\u4f20',
    tripNo: 'TR2505140088',
    operator: '\u8d75\u5e08\u5085',
    action: 'POD\u4e0a\u4f20',
    detail: 'POD_TR2505140088.jpg',
    createTime: '2026-05-14 18:25'
  },
  {
    id: 5,
    module: '\u8fd0\u8d39\u7ed3\u7b97',
    tripNo: 'TR2505110055',
    operator: '\u8d22\u52a1',
    action: '\u5ba1\u6838\u901a\u8fc7',
    detail: '\u603b\u8d39\u7528 $2015',
    createTime: '2026-05-12 10:00'
  }
];

function filterTripOrders(params: Record<string, any>) {
  let rows = [...tripOrders];
  const status = params.status as string | undefined;
  const keyword = (params.keyword as string | undefined)?.trim();
  const orderType = params.orderType as string | undefined;
  const originWarehouse = params.originWarehouse as string | undefined;

  if (status === 'PENDING_DISPATCH_GROUP') {
    rows = rows.filter(r => ['PENDING_DISPATCH', 'PRE_TRIP', 'PENDING_MANUAL'].includes(r.status));
  } else if (status) {
    rows = rows.filter(r => r.status === status);
  }
  if (orderType) rows = rows.filter(r => r.orderType === orderType);
  if (originWarehouse) rows = rows.filter(r => r.originWarehouse === originWarehouse);
  if (keyword) {
    const kw = keyword.toLowerCase();
    rows = rows.filter(
      r =>
        r.tripNo.toLowerCase().includes(kw) ||
        r.omsOrderNo.toLowerCase().includes(kw) ||
        r.destination.toLowerCase().includes(kw) ||
        (r.customerName && r.customerName.toLowerCase().includes(kw))
    );
  }
  return rows.map(enrichTripRow);
}

export function getTmsOverview(): TmsOverview {
  return {
    pendingDispatch: tripOrders.filter(r => ['PENDING_DISPATCH', 'PRE_TRIP'].includes(r.status)).length,
    pendingManual: tripOrders.filter(r => r.status === 'PENDING_MANUAL').length,
    inTransit: tripOrders.filter(r => ['IN_TRANSIT', 'DEPARTED', 'ARRIVED'].includes(r.status)).length,
    signed: tripOrders.filter(r => r.status === 'SIGNED').length,
    exception: tripOrders.filter(r => r.status === 'EXCEPTION' || r.hasException).length,
    pendingSettlement: tripOrders.filter(r => r.status === 'PENDING_SETTLEMENT').length,
    todayDepart: tripOrders.filter(r => ['DEPARTED', 'LOADING', 'IN_TRANSIT'].includes(r.status)).length,
    dockLoading: dockSlots.filter(d => d.status === 'LOADING').length,
    recentLogs: tmsLogs.slice(0, 8)
  };
}

export function getTripOrderList(params: Record<string, any>) {
  return mockPage(filterTripOrders(params), params);
}

export function getTripOrderStatusCount() {
  const counts: Record<string, number> = {};
  tripOrders.forEach(r => {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  });
  counts.ALL = tripOrders.length;
  counts.PENDING_DISPATCH_GROUP = tripOrders.filter(r =>
    ['PENDING_DISPATCH', 'PRE_TRIP', 'PENDING_MANUAL'].includes(r.status)
  ).length;
  counts.ACTIVE = tripOrders.filter(r =>
    ['CONFIRMED', 'PENDING_CHECKIN', 'CHECKED_IN', 'QUEUING', 'LOADING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED'].includes(
      r.status
    )
  ).length;
  return counts;
}

export function getTripOrderDetail(id: number): TmsTripDetail | null {
  const row = tripOrders.find(r => r.id === id);
  if (!row) return null;
  const enriched = enrichTripRow(row);
  const cargoItems = tripCargoStore.get(id) ?? [];
  const baseLogs: TmsTripLog[] = [
    { id: 1, time: row.createTime, operator: 'OMS', action: '推送车次', status: '待排车' },
    {
      id: 2,
      time: nowStr(),
      operator: '系统',
      action: '状态更新',
      status: row.status
    }
  ];
  const extraLogs = tripExtraLogs.get(id) ?? [];
  return {
    ...enriched,
    isaNo: row.orderType === 'AMAZON' ? `ISA${row.tripNo.slice(2)}` : null,
    weightLbs: row.palletQty * 800,
    supplierName: row.carrierName,
    loadingProgress: row.status === 'LOADING' ? `${Math.min(cargoItems.length, row.palletQty)}/${row.palletQty}` : null,
    contactName: '张经理',
    contactPhone: '+1 626-555-0001',
    cargoItems,
    logs: [...extraLogs, ...baseLogs]
  };
}

export function getTripAvailableOrders(tripId: number, params: Record<string, any> = {}) {
  const trip = tripOrders.find(r => r.id === tripId);
  if (!trip) return mockPage([], params);
  const assignedIds = getAssignedCargoOrderIds();
  const keyword = String(params.keyword ?? '').trim();
  let rows = availableCargoPool.filter(
    order => order.originWarehouse === trip.originWarehouse && !assignedIds.has(order.id)
  );
  if (keyword) {
    rows = rows.filter(
      order =>
        fuzzyIncludes(order.cargoOrderNo, keyword) ||
        fuzzyIncludes(order.customerName, keyword) ||
        fuzzyIncludes(order.destination, keyword) ||
        fuzzyIncludes(order.appointmentNo, keyword)
    );
  }
  return mockPage(rows, params);
}

export function addTripCargo(tripId: number, orderIds: number[]) {
  const trip = tripOrders.find(r => r.id === tripId);
  if (!trip) return { success: false, message: '车次不存在', addedCount: 0 };
  if (!ADD_CARGO_ALLOWED_STATUSES.includes(trip.status)) {
    return { success: false, message: '当前车次状态不可添加货物', addedCount: 0 };
  }
  const ids = [...new Set(orderIds.map(Number).filter(Boolean))];
  if (!ids.length) return { success: false, message: '请选择要添加的订单', addedCount: 0 };

  const assignedIds = getAssignedCargoOrderIds();
  const items = tripCargoStore.get(tripId) ?? [];
  const addedNos: string[] = [];

  ids.forEach(orderId => {
    if (assignedIds.has(orderId)) return;
    const poolOrder = availableCargoPool.find(o => o.id === orderId && o.originWarehouse === trip.originWarehouse);
    if (!poolOrder) return;
    const cargoItem = poolOrderToCargoItem(poolOrder);
    items.push(cargoItem);
    assignedIds.add(orderId);
    addedNos.push(poolOrder.cargoOrderNo);
  });

  if (!addedNos.length) return { success: false, message: '未找到可添加的订单', addedCount: 0 };

  tripCargoStore.set(tripId, items);
  syncTripCargoTotals(tripId);
  appendTripLog(tripId, `添加货物 ${addedNos.join('、')}`, trip.status);

  const detail = getTripOrderDetail(tripId);
  return {
    success: true,
    message: `已添加 ${addedNos.length} 个订单`,
    addedCount: addedNos.length,
    data: detail ?? undefined
  };
}

export function tripOrderAction(id: number, action: string) {
  const row = tripOrders.find(r => r.id === id);
  if (!row) return { success: false, message: '\u8f66\u6b21\u4e0d\u5b58\u5728' };
  const actionMap: Record<string, TmsTripStatus> = {
    dispatch: 'PENDING_MANUAL',
    confirm: 'CONFIRMED',
    pushWms: 'PENDING_CHECKIN',
    pushDriver: 'PENDING_CHECKIN',
    checkin: 'CHECKED_IN',
    queue: 'QUEUING',
    depart: 'DEPARTED',
    sign: 'SIGNED',
    settle: 'PENDING_SETTLEMENT'
  };
  if (actionMap[action]) row.status = actionMap[action];
  return { success: true, message: '\u64cd\u4f5c\u6210\u529f', data: row };
}

export function getDispatchPool(params: Record<string, any>) {
  return dispatchWorkbench.getDispatchWorkbenchPool(params);
}

export function getDispatchPlans() {
  return dispatchWorkbench.getDispatchWorkbenchPlans();
}

export function getOverdueDispatchTrips() {
  return sortByDeadline(
    tripOrders
      .filter(r => ['PENDING_DISPATCH', 'PRE_TRIP', 'PENDING_MANUAL', 'CONFIRMED', 'LOADING', 'QUEUING'].includes(r.status))
      .map(enrichTripRow)
      .filter(r => r.deadlineRiskLevel === 'OVERDUE' || r.deadlineRiskLevel === 'URGENT')
  );
}

export function autoDispatch() {
  return dispatchWorkbench.autoDispatchWorkbench();
}

export function confirmDispatch(planId: number) {
  return dispatchWorkbench.confirmDispatchWorkbench(planId);
}

export function getDriverList(params: Record<string, any>) {
  let rows = [...drivers];
  const status = params.status as string | undefined;
  const keyword = (params.keyword as string | undefined)?.trim();
  if (status) rows = rows.filter(r => r.status === status);
  if (keyword) {
    const kw = keyword.toLowerCase();
    rows = rows.filter(
      r =>
        r.driverName.toLowerCase().includes(kw) ||
        r.phone.toLowerCase().includes(kw) ||
        (r.currentTripNo && r.currentTripNo.toLowerCase().includes(kw))
    );
  }
  return mockPage(rows, params);
}

export function getVehicleList(params: Record<string, any>) {
  let rows = [...vehicles];
  const status = params.status as string | undefined;
  const keyword = (params.keyword as string | undefined)?.trim();
  if (status) rows = rows.filter(r => r.status === status);
  if (keyword) {
    const kw = keyword.toLowerCase();
    rows = rows.filter(r => r.plateNo.toLowerCase().includes(kw) || r.vehicleType.toLowerCase().includes(kw));
  }
  return mockPage(rows, params);
}

export function getDockBoard() {
  const enriched = dockSlots.map(enrichDockSlot);
  const active = sortByDeadline(enriched.filter(s => s.tripNo));
  const idle = enriched.filter(s => !s.tripNo);
  return [...active, ...idle];
}

export function getPodList(params: Record<string, any>) {
  let rows = [...podRecords];
  const auditStatus = params.auditStatus as string | undefined;
  if (auditStatus) rows = rows.filter(r => r.auditStatus === auditStatus);
  return mockPage(rows, params);
}

export function getFreightList(params: Record<string, any>) {
  let rows = [...freightRecords];
  const payStatus = params.payStatus as string | undefined;
  if (payStatus) rows = rows.filter(r => r.payStatus === payStatus);
  return mockPage(rows, params);
}

export function getTmsSupplierList(params: Record<string, any>) {
  return mockPage([...tmsSuppliers], params);
}

export function getTmsExceptionList(params: Record<string, any>) {
  let rows = [...exceptions];
  const status = params.status as string | undefined;
  if (status) rows = rows.filter(r => r.status === status);
  return mockPage(rows, params);
}

export function getTmsLogList(params: Record<string, any>) {
  let rows = [...tmsLogs];
  const module = params.module as string | undefined;
  if (module) rows = rows.filter(r => r.module === module);
  return mockPage(rows, params);
}
