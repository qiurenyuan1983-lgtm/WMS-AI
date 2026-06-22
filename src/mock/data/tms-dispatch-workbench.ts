import { mockPage } from '../utils';
import {
  compareDeadlinePriority,
  computeDispatchPriorityScore,
  enrichTripDeadlineFields
} from '@/utils/tms/trip-deadline';
import { VEHICLE_CAPACITY } from '@/views/tms/dispatch/constants';

export type WorkbenchPoolOrder = Api.Tms.DispatchPoolOrder;
export type WorkbenchPlan = Api.Tms.DispatchPlan;
export type WorkbenchLog = Api.Tms.DispatchLog;

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/** 相对当前时间的预约时间（小时偏移，便于演示时效风险） */
function apptFromNow(hours: number, minutes = 0): string {
  const d = new Date();
  d.setHours(d.getHours() + hours, d.getMinutes() + minutes, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

let dispatchLogs: WorkbenchLog[] = [
  {
    id: 1,
    time: apptFromNow(-2) + ':00',
    operator: 'OMS推送',
    action: '接收待排车订单',
    target: 'SO2506060028',
    detail: 'Amazon SMF3 · 9板 · 待排车',
    level: 'info'
  },
  {
    id: 2,
    time: apptFromNow(-1, -25) + ':00',
    operator: '调度员 Aaron',
    action: '自动排车',
    target: 'PLAN-250606-01',
    detail: '合并同目的地 2 单 · 推荐 XPO · DOCK-04',
    level: 'success'
  },
  {
    id: 3,
    time: apptFromNow(-1, -10) + ':00',
    operator: '调度员 Aaron',
    action: '人工确认',
    target: 'PLAN-250606-03',
    detail: '车次 TR250606009 已确认，待推送 WMS',
    level: 'success'
  },
  {
    id: 4,
    time: apptFromNow(-0, -45) + ':00',
    operator: 'OMS推送',
    action: '接收待排车订单',
    target: 'SO2506061035',
    detail: 'Walmart ORD2 · 12板 · 库存已齐',
    level: 'info'
  },
  {
    id: 5,
    time: apptFromNow(-0, -30) + ':00',
    operator: '调度员 Tom',
    action: '推送WMS',
    target: 'PLAN-250606-05',
    detail: 'WMS 已生成出库单、备货任务、拣货指令、装车任务',
    level: 'success'
  },
  {
    id: 6,
    time: apptFromNow(-0, -20) + ':00',
    operator: '调度员 Tom',
    action: '分配司机',
    target: 'PLAN-250606-06',
    detail: '司机 = 陈师傅',
    level: 'info'
  },
  {
    id: 7,
    time: apptFromNow(-0, -15) + ':00',
    operator: '调度员 Tom',
    action: '推送司机',
    target: 'PLAN-250606-06',
    detail: '司机 陈师傅 已收到任务',
    level: 'success'
  },
  {
    id: 8,
    time: apptFromNow(-0, -5) + ':00',
    operator: 'OMS推送',
    action: '接收待排车订单',
    target: 'SO2506061040',
    detail: 'Amazon XLX7 · 8板 · 跨仓转运 SAV→XLX7',
    level: 'warning'
  }
];

let logSeq = 100;

function appendLog(
  action: string,
  target: string,
  detail: string,
  level: WorkbenchLog['level'] = 'info',
  operator = '调度员'
) {
  dispatchLogs.unshift({
    id: ++logSeq,
    time: nowStr(),
    operator,
    action,
    target,
    detail,
    level
  });
}

function enrichPoolOrder(row: WorkbenchPoolOrder): WorkbenchPoolOrder {
  const enriched = enrichTripDeadlineFields({
    appointmentTime: row.appointmentTime,
    originWarehouse: row.originWarehouse,
    destination: row.destination,
    palletQty: row.palletQty,
    cartonQty: row.cartonQty
  });
  return {
    ...row,
    ...enriched,
    dispatchPriorityScore: computeDispatchPriorityScore(enriched)
  };
}

function enrichPlan(plan: WorkbenchPlan): WorkbenchPlan {
  const orders = dispatchPoolOrders.filter(o => plan.orderIds.includes(o.id));
  const first = orders[0];
  const enriched = enrichTripDeadlineFields({
    appointmentTime: plan.appointmentTime,
    originWarehouse: first?.originWarehouse ?? 'LA',
    destination: plan.destination,
    palletQty: plan.palletQty,
    cartonQty: plan.cartonQty
  });
  const cap = VEHICLE_CAPACITY[plan.vehicleType] ?? 20;
  const loadRate = Math.min(100, Math.round((plan.palletQty / cap) * 100));
  return {
    ...plan,
    ...enriched,
    loadRate,
    dispatchPriorityScore: computeDispatchPriorityScore(enriched),
    score: Math.min(99, Math.round(plan.score || computeDispatchPriorityScore(enriched)))
  };
}

let dispatchPoolOrders: WorkbenchPoolOrder[] = [
  {
    id: 1001,
    orderNo: 'CO-2026-1021',
    omsOrderNo: 'SO2506060021',
    tripNo: null,
    customerName: 'Anker Innovations',
    platform: 'Amazon',
    destination: 'ONT8',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(2),
    palletQty: 6,
    cartonQty: 60,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'LA→ONT',
    distanceMiles: 42,
    estimatedTravelMinutes: 55,
    trafficBufferMinutes: 15,
    exitCheckMinutes: 10,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 30,
    latestFinishTime: '2026-05-16 09:30',
    latestStartLoadingTime: '2026-05-16 08:45',
    remainingMinutes: 45,
    deadlineRiskLevel: 'URGENT'
  },
  {
    id: 1002,
    orderNo: 'CO-2026-1022',
    omsOrderNo: 'SO2506060022',
    tripNo: null,
    customerName: 'Anker Innovations',
    platform: 'Amazon',
    destination: 'ONT8',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(4),
    palletQty: 4,
    cartonQty: 40,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'LA→ONT',
    distanceMiles: 42,
    estimatedTravelMinutes: 55,
    trafficBufferMinutes: 15,
    exitCheckMinutes: 10,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 20,
    latestFinishTime: '2026-05-16 10:30',
    latestStartLoadingTime: '2026-05-16 09:50',
    remainingMinutes: 90,
    deadlineRiskLevel: 'NEAR'
  },
  {
    id: 1003,
    orderNo: 'CO-2026-1023',
    omsOrderNo: 'SO2506060023',
    tripNo: null,
    customerName: 'SHEIN',
    platform: 'LTL',
    destination: 'Dallas TX',
    originWarehouse: 'DAL',
    appointmentTime: apptFromNow(10),
    palletQty: 8,
    cartonQty: 64,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'DAL→TX',
    distanceMiles: 0,
    estimatedTravelMinutes: 0,
    trafficBufferMinutes: 0,
    exitCheckMinutes: 0,
    sealSignMinutes: 0,
    loadingMethod: '',
    estimatedLoadingMinutes: 0,
    latestFinishTime: null,
    latestStartLoadingTime: null,
    remainingMinutes: null,
    deadlineRiskLevel: 'NORMAL'
  },
  {
    id: 1004,
    orderNo: 'CO-2026-1024',
    omsOrderNo: 'SO2506060024',
    tripNo: null,
    customerName: 'PopMart',
    platform: 'Amazon',
    destination: 'LGB8',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(6),
    palletQty: 5,
    cartonQty: 0,
    status: 'RECOMMENDED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 4,
    routeDirection: 'LA→LGB',
    distanceMiles: 28,
    estimatedTravelMinutes: 38,
    trafficBufferMinutes: 12,
    exitCheckMinutes: 8,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 25,
    latestFinishTime: '2026-05-16 12:20',
    latestStartLoadingTime: '2026-05-16 11:40',
    remainingMinutes: 120,
    deadlineRiskLevel: 'NORMAL'
  },
  {
    id: 1005,
    orderNo: 'CO-2026-1025',
    omsOrderNo: 'SO2506060025',
    tripNo: null,
    customerName: 'Robotime',
    platform: '商业地址',
    destination: 'Phoenix AZ',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(28),
    palletQty: 7,
    cartonQty: 56,
    status: 'PENDING_DISPATCH',
    holdFlag: true,
    exceptionFlag: false,
    cargoReady: false,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'LA→PHX',
    distanceMiles: 370,
    estimatedTravelMinutes: 330,
    trafficBufferMinutes: 30,
    exitCheckMinutes: 10,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 35,
    latestFinishTime: '2026-05-17 07:00',
    latestStartLoadingTime: '2026-05-17 05:50',
    remainingMinutes: 480,
    deadlineRiskLevel: 'NORMAL'
  },
  {
    id: 1006,
    orderNo: 'CO-2026-1026',
    omsOrderNo: 'SO2506060026',
    tripNo: null,
    customerName: 'ABC Corp',
    platform: '本地派送',
    destination: 'Brooklyn NY',
    originWarehouse: 'NJ',
    appointmentTime: apptFromNow(5),
    palletQty: 5,
    cartonQty: 40,
    status: 'RECOMMENDED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 2,
    routeDirection: 'NJ→NY',
    distanceMiles: 12,
    estimatedTravelMinutes: 35,
    trafficBufferMinutes: 10,
    exitCheckMinutes: 8,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 22,
    latestFinishTime: '2026-05-16 10:50',
    latestStartLoadingTime: '2026-05-16 10:10',
    remainingMinutes: 75,
    deadlineRiskLevel: 'NEAR'
  },
  {
    id: 1007,
    orderNo: 'CO-2026-1027',
    omsOrderNo: 'SO2506060027',
    tripNo: null,
    customerName: 'SHEIN',
    platform: 'LTL',
    destination: 'Houston TX',
    originWarehouse: 'DAL',
    appointmentTime: apptFromNow(12),
    palletQty: 6,
    cartonQty: 48,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: true,
    cargoReady: false,
    inventoryAvailable: false,
    planId: null,
    routeDirection: 'DAL→HOU',
    distanceMiles: 0,
    estimatedTravelMinutes: 0,
    trafficBufferMinutes: 0,
    exitCheckMinutes: 0,
    sealSignMinutes: 0,
    loadingMethod: '',
    estimatedLoadingMinutes: 0,
    latestFinishTime: null,
    latestStartLoadingTime: null,
    remainingMinutes: null,
    deadlineRiskLevel: 'NORMAL'
  },
  {
    id: 1008,
    orderNo: 'CO-2026-1028',
    omsOrderNo: 'SO2506060028',
    tripNo: 'TR250606009',
    customerName: 'PopMart',
    platform: 'Amazon',
    destination: 'SMF3',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(1, 30),
    palletQty: 9,
    cartonQty: 0,
    status: 'CONFIRMED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 3,
    routeDirection: 'LA→SMF',
    distanceMiles: 380,
    estimatedTravelMinutes: 360,
    trafficBufferMinutes: 25,
    exitCheckMinutes: 10,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 40,
    latestFinishTime: '2026-05-16 08:10',
    latestStartLoadingTime: '2026-05-16 07:20',
    remainingMinutes: 30,
    deadlineRiskLevel: 'URGENT'
  },
  {
    id: 1009,
    orderNo: 'CO-2026-1035',
    omsOrderNo: 'SO2506061035',
    tripNo: null,
    customerName: '演示客户 B',
    platform: 'Walmart',
    destination: 'ORD2',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(7),
    palletQty: 12,
    cartonQty: 96,
    status: 'WMS_PUSHED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 5,
    routeDirection: 'LA→ORD'
  },
  {
    id: 1010,
    orderNo: 'CO-2026-1036',
    omsOrderNo: 'SO2506061036',
    tripNo: null,
    customerName: 'ANKER',
    platform: 'Amazon',
    destination: 'LAX9',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(8),
    palletQty: 6,
    cartonQty: 48,
    status: 'WMS_PUSHED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 5,
    routeDirection: 'LA→LAX'
  },
  {
    id: 1011,
    orderNo: 'CO-2026-1037',
    omsOrderNo: 'SO2506061037',
    tripNo: 'TR250606012',
    customerName: 'SHEIN',
    platform: 'LTL',
    destination: 'Houston TX',
    originWarehouse: 'DAL',
    appointmentTime: apptFromNow(9),
    palletQty: 10,
    cartonQty: 80,
    status: 'DRIVER_PUSHED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 6,
    routeDirection: 'DAL→HOU'
  },
  {
    id: 1012,
    orderNo: 'CO-2026-1038',
    omsOrderNo: 'SO2506061038',
    tripNo: null,
    customerName: 'PopMart',
    platform: 'Amazon',
    destination: 'LGB8',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(6, 30),
    palletQty: 4,
    cartonQty: 32,
    status: 'RECOMMENDED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 4,
    routeDirection: 'LA→LGB'
  },
  {
    id: 1013,
    orderNo: 'CO-2026-1039',
    omsOrderNo: 'SO2506061039',
    tripNo: null,
    customerName: 'Robotime',
    platform: 'Amazon',
    destination: 'XLX7',
    originWarehouse: 'SAV',
    appointmentTime: apptFromNow(3),
    palletQty: 8,
    cartonQty: 64,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'SAV→XLX7'
  },
  {
    id: 1014,
    orderNo: 'CO-2026-1040',
    omsOrderNo: 'SO2506061040',
    tripNo: null,
    customerName: '演示客户 A',
    platform: 'Amazon',
    destination: 'XLX7',
    originWarehouse: 'SAV',
    appointmentTime: apptFromNow(3, 30),
    palletQty: 6,
    cartonQty: 48,
    status: 'RECOMMENDED',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 8,
    routeDirection: 'SAV→XLX7'
  },
  {
    id: 1015,
    orderNo: 'CO-2026-1041',
    omsOrderNo: 'SO2506061041',
    tripNo: null,
    customerName: 'Costco Wholesale',
    platform: '商业地址',
    destination: 'Los Angeles CA',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(5, 30),
    palletQty: 3,
    cartonQty: 24,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'LA本地'
  },
  {
    id: 1016,
    orderNo: 'CO-2026-1042',
    omsOrderNo: 'SO2506061042',
    tripNo: null,
    customerName: 'Wayfair',
    platform: '本地派送',
    destination: 'Newark NJ',
    originWarehouse: 'NJ',
    appointmentTime: apptFromNow(4, 30),
    palletQty: 4,
    cartonQty: 36,
    status: 'PENDING_MANUAL',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 7,
    routeDirection: 'NJ本地'
  },
  {
    id: 1017,
    orderNo: 'CO-2026-1043',
    omsOrderNo: 'SO2506061043',
    tripNo: null,
    customerName: 'IKEA Supply',
    platform: '本地派送',
    destination: 'Newark NJ',
    originWarehouse: 'NJ',
    appointmentTime: apptFromNow(5),
    palletQty: 5,
    cartonQty: 40,
    status: 'PENDING_MANUAL',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: 7,
    routeDirection: 'NJ本地'
  },
  {
    id: 1018,
    orderNo: 'CO-2026-1044',
    omsOrderNo: 'SO2506061044',
    tripNo: null,
    customerName: 'Austin Foods',
    platform: 'LTL',
    destination: 'Austin TX',
    originWarehouse: 'DAL',
    appointmentTime: apptFromNow(14),
    palletQty: 7,
    cartonQty: 56,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'DAL→AUS'
  },
  {
    id: 1019,
    orderNo: 'CO-2026-1045',
    omsOrderNo: 'SO2506061045',
    tripNo: null,
    customerName: 'PopMart',
    platform: 'Amazon',
    destination: 'FTW1',
    originWarehouse: 'DAL',
    appointmentTime: apptFromNow(16),
    palletQty: 9,
    cartonQty: 72,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: false,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'DAL→FTW'
  },
  {
    id: 1020,
    orderNo: 'CO-2026-1046',
    omsOrderNo: 'SO2506061046',
    tripNo: null,
    customerName: '演示客户 B',
    platform: 'Amazon',
    destination: 'ONT8',
    originWarehouse: 'LA',
    appointmentTime: apptFromNow(1),
    palletQty: 5,
    cartonQty: 40,
    status: 'PENDING_DISPATCH',
    holdFlag: false,
    exceptionFlag: false,
    cargoReady: true,
    inventoryAvailable: true,
    planId: null,
    routeDirection: 'LA→ONT'
  }
].map(enrichPoolOrder);

let dispatchPlans: WorkbenchPlan[] = [
  {
    id: 1,
    planNo: 'PLAN-250606-01',
    tripNo: null,
    destination: 'ONT8',
    route: 'LA → ONT8 (I-10)',
    orderCount: 2,
    palletQty: 10,
    cartonQty: 100,
    appointmentTime: apptFromNow(2),
    vehicleType: '26尺',
    carrierName: 'XPO Logistics',
    dockNo: 'DOCK-04',
    driverName: '刘师傅',
    plateNo: 'CA77221',
    estimatedCost: 680,
    loadRate: 71,
    onTimeRisk: 'URGENT',
    score: 94,
    status: 'RECOMMENDED',
    orderIds: [1001, 1002],
    confirmed: false,
    wmsPushed: false,
    driverPushed: false,
    distanceMiles: 42,
    estimatedTravelMinutes: 55,
    trafficBufferMinutes: 15,
    exitCheckMinutes: 10,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 50,
    latestFinishTime: '2026-05-16 09:30',
    latestStartLoadingTime: '2026-05-16 08:45',
    remainingMinutes: 45,
    deadlineRiskLevel: 'URGENT'
  },
  {
    id: 2,
    planNo: 'PLAN-250606-02',
    tripNo: null,
    destination: 'Brooklyn NY',
    route: 'NJ → Brooklyn (I-278)',
    orderCount: 1,
    palletQty: 5,
    cartonQty: 40,
    appointmentTime: apptFromNow(5),
    vehicleType: 'Box Truck',
    carrierName: 'Local Carrier',
    dockNo: 'DOCK-02',
    driverName: '',
    plateNo: '',
    estimatedCost: 420,
    loadRate: 50,
    onTimeRisk: 'NEAR',
    score: 86,
    status: 'RECOMMENDED',
    orderIds: [1006],
    confirmed: false,
    wmsPushed: false,
    driverPushed: false,
    distanceMiles: 12,
    estimatedTravelMinutes: 35,
    trafficBufferMinutes: 10,
    exitCheckMinutes: 8,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 22,
    latestFinishTime: '2026-05-16 10:50',
    latestStartLoadingTime: '2026-05-16 10:10',
    remainingMinutes: 75,
    deadlineRiskLevel: 'NEAR'
  },
  {
    id: 3,
    planNo: 'PLAN-250606-03',
    tripNo: 'TR250606009',
    destination: 'SMF3',
    route: 'LA → SMF3 (I-5)',
    orderCount: 1,
    palletQty: 9,
    cartonQty: 0,
    appointmentTime: apptFromNow(1, 30),
    vehicleType: '53尺',
    carrierName: 'FedEx Freight',
    dockNo: 'DOCK-05',
    driverName: '王师傅',
    plateNo: 'GA55667',
    estimatedCost: 1250,
    loadRate: 35,
    onTimeRisk: 'URGENT',
    score: 91,
    status: 'CONFIRMED',
    orderIds: [1008],
    confirmed: true,
    wmsPushed: false,
    driverPushed: false,
    distanceMiles: 380,
    estimatedTravelMinutes: 360,
    trafficBufferMinutes: 25,
    exitCheckMinutes: 10,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 40,
    latestFinishTime: '2026-05-16 08:10',
    latestStartLoadingTime: '2026-05-16 07:20',
    remainingMinutes: 30,
    deadlineRiskLevel: 'URGENT'
  },
  {
    id: 4,
    planNo: 'PLAN-250606-04',
    tripNo: null,
    destination: 'LGB8',
    route: 'LA → LGB8 (I-710)',
    orderCount: 2,
    palletQty: 9,
    cartonQty: 32,
    appointmentTime: apptFromNow(6),
    vehicleType: '26尺',
    carrierName: 'FedEx Freight',
    dockNo: 'DOCK-03',
    driverName: '',
    plateNo: '',
    estimatedCost: 585,
    loadRate: 64,
    onTimeRisk: 'NORMAL',
    score: 88,
    status: 'RECOMMENDED',
    orderIds: [1004, 1012],
    confirmed: false,
    wmsPushed: false,
    driverPushed: false,
    distanceMiles: 28,
    estimatedTravelMinutes: 45,
    trafficBufferMinutes: 12,
    exitCheckMinutes: 8,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 45
  },
  {
    id: 5,
    planNo: 'PLAN-250606-05',
    tripNo: 'TR250606011',
    destination: 'ORD2',
    route: 'LA → ORD2 (I-15/I-80)',
    orderCount: 2,
    palletQty: 18,
    cartonQty: 144,
    appointmentTime: apptFromNow(7),
    vehicleType: '53尺',
    carrierName: 'XPO Logistics',
    dockNo: 'DOCK-01',
    driverName: '张师傅',
    plateNo: 'IL88231',
    estimatedCost: 2180,
    loadRate: 69,
    onTimeRisk: 'NORMAL',
    score: 90,
    status: 'WMS_PUSHED',
    orderIds: [1009, 1010],
    confirmed: true,
    wmsPushed: true,
    driverPushed: false,
    distanceMiles: 65,
    estimatedTravelMinutes: 90,
    trafficBufferMinutes: 20,
    exitCheckMinutes: 15,
    sealSignMinutes: 10,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 55
  },
  {
    id: 6,
    planNo: 'PLAN-250606-06',
    tripNo: 'TR250606012',
    destination: 'Houston TX',
    route: 'DAL → Houston (I-45)',
    orderCount: 1,
    palletQty: 10,
    cartonQty: 80,
    appointmentTime: apptFromNow(9),
    vehicleType: '53尺',
    carrierName: 'XPO Logistics',
    dockNo: 'DOCK-02',
    driverName: '陈师傅',
    plateNo: 'TX55102',
    estimatedCost: 980,
    loadRate: 38,
    onTimeRisk: 'NORMAL',
    score: 85,
    status: 'DRIVER_PUSHED',
    orderIds: [1011],
    confirmed: true,
    wmsPushed: true,
    driverPushed: true,
    distanceMiles: 239,
    estimatedTravelMinutes: 230,
    trafficBufferMinutes: 20,
    exitCheckMinutes: 15,
    sealSignMinutes: 10,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 40
  },
  {
    id: 7,
    planNo: 'PLAN-250606-07',
    tripNo: null,
    destination: 'Newark NJ',
    route: 'NJ → Newark 本地派送',
    orderCount: 2,
    palletQty: 9,
    cartonQty: 76,
    appointmentTime: apptFromNow(4, 30),
    vehicleType: 'Box Truck',
    carrierName: 'Local Carrier',
    dockNo: 'DOCK-06',
    driverName: '',
    plateNo: '',
    estimatedCost: 520,
    loadRate: 90,
    onTimeRisk: 'NEAR',
    score: 82,
    status: 'PENDING_MANUAL',
    orderIds: [1016, 1017],
    confirmed: false,
    wmsPushed: false,
    driverPushed: false,
    distanceMiles: 18,
    estimatedTravelMinutes: 40,
    trafficBufferMinutes: 10,
    exitCheckMinutes: 8,
    sealSignMinutes: 5,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 35
  },
  {
    id: 8,
    planNo: 'PLAN-250606-08',
    tripNo: null,
    destination: 'XLX7',
    route: 'SAV → XLX7 (I-77)',
    orderCount: 1,
    palletQty: 6,
    cartonQty: 48,
    appointmentTime: apptFromNow(3, 30),
    vehicleType: '26尺',
    carrierName: 'FedEx Freight',
    dockNo: 'DOCK-07',
    driverName: '',
    plateNo: '',
    estimatedCost: 890,
    loadRate: 43,
    onTimeRisk: 'URGENT',
    score: 92,
    status: 'RECOMMENDED',
    orderIds: [1014],
    confirmed: false,
    wmsPushed: false,
    driverPushed: false,
    distanceMiles: 220,
    estimatedTravelMinutes: 210,
    trafficBufferMinutes: 20,
    exitCheckMinutes: 15,
    sealSignMinutes: 10,
    loadingMethod: '托盘装车',
    estimatedLoadingMinutes: 32
  }
].map(enrichPlan);

let planSeq = 20;
let tripSeq = 900;

function sortPool(rows: WorkbenchPoolOrder[]) {
  return [...rows].sort((a, b) => compareDeadlinePriority(a, b));
}

function pickVehicleType(palletQty: number) {
  if (palletQty <= 6) return 'Sprinter';
  if (palletQty <= 14) return '26尺';
  return '53尺';
}

function pickSupplier(destination: string) {
  if (destination.includes('TX') || destination === 'Dallas TX') return 'XPO Logistics';
  if (['ONT8', 'LGB8', 'SMF3'].some(d => destination.includes(d))) return 'FedEx Freight';
  return 'Local Carrier';
}

function pickDock() {
  const docks = ['DOCK-01', 'DOCK-02', 'DOCK-03', 'DOCK-04', 'DOCK-05'];
  return docks[Math.floor(Math.random() * docks.length)];
}

function buildPlanFromOrders(orders: WorkbenchPoolOrder[]): WorkbenchPlan {
  const palletQty = orders.reduce((s, o) => s + o.palletQty, 0);
  const cartonQty = orders.reduce((s, o) => s + o.cartonQty, 0);
  const destination = orders[0].destination;
  const route = orders[0].routeDirection
    ? `${orders[0].originWarehouse} → ${destination} (${orders[0].routeDirection})`
    : `${orders[0].originWarehouse} → ${destination}`;
  const vehicleType = pickVehicleType(palletQty);
  const cap = VEHICLE_CAPACITY[vehicleType] ?? 20;
  const carrierName = pickSupplier(destination);
  const appointmentTime = orders.map(o => o.appointmentTime).sort()[0];
  const costBase = palletQty * 65 + orders.length * 40;

  const plan: WorkbenchPlan = {
    id: ++planSeq,
    planNo: `PLAN-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(planSeq).padStart(2, '0')}`,
    tripNo: null,
    destination,
    route,
    orderCount: orders.length,
    palletQty,
    cartonQty,
    appointmentTime,
    vehicleType,
    carrierName,
    dockNo: pickDock(),
    driverName: '',
    plateNo: '',
    estimatedCost: costBase,
    loadRate: Math.min(100, Math.round((palletQty / cap) * 100)),
    onTimeRisk: orders.some(o => o.deadlineRiskLevel === 'URGENT' || o.deadlineRiskLevel === 'OVERDUE')
      ? 'URGENT'
      : orders.some(o => o.deadlineRiskLevel === 'NEAR')
        ? 'NEAR'
        : 'NORMAL',
    score: 0,
    status: 'RECOMMENDED',
    orderIds: orders.map(o => o.id),
    confirmed: false,
    wmsPushed: false,
    driverPushed: false,
    distanceMiles: orders[0].distanceMiles,
    estimatedTravelMinutes: orders[0].estimatedTravelMinutes,
    trafficBufferMinutes: orders[0].trafficBufferMinutes,
    exitCheckMinutes: orders[0].exitCheckMinutes,
    sealSignMinutes: orders[0].sealSignMinutes,
    loadingMethod: orders[0].loadingMethod,
    estimatedLoadingMinutes: orders.reduce((s, o) => s + (o.estimatedLoadingMinutes || 0), 0),
    latestFinishTime: orders.map(o => o.latestFinishTime).filter(Boolean).sort()[0] ?? null,
    latestStartLoadingTime: orders.map(o => o.latestStartLoadingTime).filter(Boolean).sort()[0] ?? null,
    remainingMinutes: orders.map(o => o.remainingMinutes).filter(v => v != null).sort((a, b) => (a ?? 0) - (b ?? 0))[0] ?? null,
    deadlineRiskLevel: orders.some(o => o.deadlineRiskLevel === 'OVERDUE')
      ? 'OVERDUE'
      : orders.some(o => o.deadlineRiskLevel === 'URGENT')
        ? 'URGENT'
        : orders.some(o => o.deadlineRiskLevel === 'NEAR')
          ? 'NEAR'
          : 'NORMAL'
  };
  return enrichPlan({ ...plan, score: computeDispatchPriorityScore(plan) });
}

export function getDispatchWorkbenchPool(params: Record<string, any> = {}) {
  const keyword = String(params.keyword ?? '').trim().toLowerCase();
  let rows = dispatchPoolOrders.filter(o => !['COMPLETED', 'CANCELLED', 'DEPARTED'].includes(o.status));
  if (keyword) {
    rows = rows.filter(
      o =>
        o.orderNo.toLowerCase().includes(keyword) ||
        o.omsOrderNo.toLowerCase().includes(keyword) ||
        o.customerName.toLowerCase().includes(keyword) ||
        o.destination.toLowerCase().includes(keyword)
    );
  }
  return mockPage(sortPool(rows.map(enrichPoolOrder)), params);
}

export function getDispatchWorkbenchPlans() {
  return dispatchPlans.map(enrichPlan).sort((a, b) => compareDeadlinePriority(a, b));
}

export function getDispatchWorkbenchLogs() {
  return dispatchLogs.slice(0, 50);
}

export function getDispatchWorkbenchDetail(payload: { planId?: number; orderId?: number }) {
  const plan = payload.planId ? dispatchPlans.find(p => p.id === payload.planId) : undefined;
  const order = payload.orderId ? dispatchPoolOrders.find(o => o.id === payload.orderId) : undefined;
  const targetPlan = plan ?? (order?.planId ? dispatchPlans.find(p => p.id === order.planId) : undefined);
  const orders = targetPlan
    ? dispatchPoolOrders.filter(o => targetPlan.orderIds.includes(o.id))
    : order
      ? [order]
      : [];

  const enrichedPlan = targetPlan ? enrichPlan(targetPlan) : null;
  const status = enrichedPlan?.status ?? order?.status ?? 'PENDING_DISPATCH';

  return {
    id: enrichedPlan?.id ?? order?.id ?? 0,
    sourceType: (enrichedPlan ? 'plan' : 'order') as 'plan' | 'order',
    tripNo: enrichedPlan?.tripNo ?? order?.tripNo ?? null,
    planNo: enrichedPlan?.planNo ?? null,
    status,
    statusLabel: status,
    destination: enrichedPlan?.destination ?? order?.destination ?? '',
    originWarehouse: orders[0]?.originWarehouse ?? 'LA',
    appointmentTime: enrichedPlan?.appointmentTime ?? order?.appointmentTime ?? null,
    customerSummary: [...new Set(orders.map(o => o.customerName))].join(' / '),
    orderCount: orders.length,
    palletQty: orders.reduce((s, o) => s + o.palletQty, 0),
    cartonQty: orders.reduce((s, o) => s + o.cartonQty, 0),
    vehicleType: enrichedPlan?.vehicleType ?? null,
    dockNo: enrichedPlan?.dockNo || null,
    driverName: enrichedPlan?.driverName || null,
    driverPhone: enrichedPlan?.driverName ? '+1 626-555-0101' : null,
    plateNo: enrichedPlan?.plateNo || null,
    carrierName: enrichedPlan?.carrierName || null,
    route: enrichedPlan?.route ?? null,
    estimatedCost: enrichedPlan?.estimatedCost ?? null,
    loadRate: enrichedPlan?.loadRate ?? null,
    deadline: enrichedPlan ?? orders[0] ?? {},
    orders: orders.map(enrichPoolOrder),
    cargoItems: orders.map((o, i) => ({
      id: i + 1,
      cargoOrderId: o.id,
      cargoOrderNo: o.orderNo,
      customerName: o.customerName,
      destination: o.destination,
      appointmentNo: o.platform === 'Amazon' ? `ISA-${8844000 + o.id}` : null,
      orderType: o.platform === 'Amazon' ? 'AMAZON' : null,
      palletQty: o.palletQty,
      cartonQty: o.cartonQty
    })),
    pushRecords: [
      ...(enrichedPlan?.wmsPushed
        ? [{ type: 'WMS', time: nowStr(), operator: '调度员', result: '已生成出库单/备货/拣货/装车任务' }]
        : []),
      ...(enrichedPlan?.driverPushed
        ? [{ type: '司机端', time: nowStr(), operator: '调度员', result: '司机端任务已下发' }]
        : [])
    ],
    operationLogs: dispatchLogs.filter(l => l.target.includes(enrichedPlan?.planNo ?? order?.orderNo ?? '')).slice(0, 10)
  } satisfies Api.Tms.DispatchTripDetail;
}

export function autoDispatchWorkbench() {
  const eligible = dispatchPoolOrders.filter(
    o => o.status === 'PENDING_DISPATCH' && !o.holdFlag && !o.exceptionFlag && o.cargoReady && o.inventoryAvailable
  );
  if (!eligible.length) {
    return { success: false, message: '没有可参与自动排车的订单（暂扣/异常/未备齐已排除）', plans: [] };
  }

  const sorted = sortPool(eligible);
  const grouped = new Map<string, WorkbenchPoolOrder[]>();
  sorted.forEach(order => {
    const key = `${order.originWarehouse}|${order.destination}|${order.routeDirection ?? ''}`;
    const list = grouped.get(key) ?? [];
    list.push(order);
    grouped.set(key, list);
  });

  const newPlans: WorkbenchPlan[] = [];
  grouped.forEach(group => {
    let batch: WorkbenchPoolOrder[] = [];
    group.forEach(order => {
      const vehicleType = pickVehicleType(batch.reduce((s, o) => s + o.palletQty, 0) + order.palletQty);
      const cap = VEHICLE_CAPACITY[vehicleType] ?? 20;
      const nextPallets = batch.reduce((s, o) => s + o.palletQty, 0) + order.palletQty;
      if (batch.length && nextPallets > cap) {
        const plan = buildPlanFromOrders(batch);
        newPlans.push(plan);
        batch.forEach(o => {
          o.status = 'RECOMMENDED';
          o.planId = plan.id;
        });
        batch = [order];
      } else {
        batch.push(order);
      }
    });
    if (batch.length) {
      const plan = buildPlanFromOrders(batch);
      newPlans.push(plan);
      batch.forEach(o => {
        o.status = 'RECOMMENDED';
        o.planId = plan.id;
      });
    }
  });

  dispatchPlans = [...newPlans, ...dispatchPlans.filter(p => !['DRAFT', 'RECOMMENDED'].includes(p.status))];
  appendLog('自动排车', newPlans.map(p => p.planNo).join('、'), `生成 ${newPlans.length} 个推荐方案，待人工确认`, 'success');

  return {
    success: true,
    message: `已自动排车 ${newPlans.length} 个方案（按预约紧急度/同目的地合并/车型容量匹配）`,
    plans: newPlans.map(enrichPlan)
  };
}

export function confirmDispatchWorkbench(planId: number) {
  const plan = dispatchPlans.find(p => p.id === planId);
  if (!plan) return { success: false, message: '方案不存在' };
  plan.status = 'CONFIRMED';
  plan.confirmed = true;
  plan.tripNo = plan.tripNo ?? `TR${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(++tripSeq).padStart(3, '0')}`;
  dispatchPoolOrders
    .filter(o => plan.orderIds.includes(o.id))
    .forEach(o => {
      o.status = 'CONFIRMED';
      o.tripNo = plan.tripNo;
    });
  appendLog('人工确认', plan.planNo, `车次 ${plan.tripNo} 已确认，可推送 WMS/司机`, 'success');
  return { success: true, message: '调度方案已确认', plan: enrichPlan(plan) };
}

function getActivePlan(planId?: number) {
  if (!planId) return null;
  return dispatchPlans.find(p => p.id === planId) ?? null;
}

export function manualCreateTripWorkbench(orderIds: number[]) {
  const orders = dispatchPoolOrders.filter(o => orderIds.includes(o.id) && o.status === 'PENDING_DISPATCH');
  if (!orders.length) return { success: false, message: '请选择待排车订单' };
  const plan = buildPlanFromOrders(orders);
  plan.status = 'PENDING_MANUAL';
  dispatchPlans.unshift(plan);
  orders.forEach(o => {
    o.status = 'PENDING_MANUAL';
    o.planId = plan.id;
  });
  appendLog('手动建车次', plan.planNo, `包含 ${orders.length} 单`, 'info');
  return { success: true, message: '已手动创建车次方案', plan: enrichPlan(plan) };
}

export function mergeDispatchWorkbench(planId: number, orderIds: number[]) {
  const plan = getActivePlan(planId);
  const extra = dispatchPoolOrders.filter(o => orderIds.includes(o.id));
  if (!plan || !extra.length) return { success: false, message: '请选择有效方案与订单' };
  extra.forEach(o => {
    if (!plan.orderIds.includes(o.id)) plan.orderIds.push(o.id);
    o.planId = plan.id;
    o.status = 'RECOMMENDED';
  });
  const orders = dispatchPoolOrders.filter(o => plan.orderIds.includes(o.id));
  const rebuilt = buildPlanFromOrders(orders);
  Object.assign(plan, { ...rebuilt, id: plan.id, planNo: plan.planNo, status: plan.status });
  appendLog('合并车次', plan.planNo, `并入 ${extra.length} 单`, 'info');
  return { success: true, message: '已合并车次', plan: enrichPlan(plan) };
}

export function splitDispatchWorkbench(planId: number, orderIds: number[]) {
  const plan = getActivePlan(planId);
  if (!plan || !orderIds.length) return { success: false, message: '请选择要拆分的订单' };
  const remainIds = plan.orderIds.filter(id => !orderIds.includes(id));
  const splitOrders = dispatchPoolOrders.filter(o => orderIds.includes(o.id));
  if (!remainIds.length || !splitOrders.length) return { success: false, message: '拆分后至少保留一单' };

  plan.orderIds = remainIds;
  const remain = dispatchPoolOrders.filter(o => remainIds.includes(o.id));
  Object.assign(plan, { ...buildPlanFromOrders(remain), id: plan.id, planNo: plan.planNo });

  const newPlan = buildPlanFromOrders(splitOrders);
  newPlan.status = plan.status;
  dispatchPlans.unshift(newPlan);
  splitOrders.forEach(o => {
    o.planId = newPlan.id;
  });

  appendLog('拆分车次', plan.planNo, `拆出 ${newPlan.planNo}`, 'warning');
  return { success: true, message: '已拆分车次', plans: [enrichPlan(plan), enrichPlan(newPlan)] };
}

export function assignDispatchWorkbench(
  planId: number,
  type: 'dock' | 'driver' | 'vehicle' | 'supplier',
  value: string
) {
  const plan = getActivePlan(planId);
  if (!plan) return { success: false, message: '请先选择调度方案' };
  const labelMap = { dock: 'DOCK', driver: '司机', vehicle: '车辆', supplier: '供应商' };
  if (type === 'dock') {
    plan.dockNo = value;
    plan.status = 'DOCK_ASSIGNED';
  } else if (type === 'driver') {
    plan.driverName = value;
    plan.status = 'DRIVER_ASSIGNED';
  } else if (type === 'vehicle') {
    plan.plateNo = value;
    plan.status = 'VEHICLE_ASSIGNED';
  } else {
    plan.carrierName = value;
    plan.status = 'SUPPLIER_ASSIGNED';
  }
  dispatchPoolOrders.filter(o => plan.orderIds.includes(o.id)).forEach(o => {
    o.status = plan.status as WorkbenchPoolOrder['status'];
  });
  appendLog(`分配${labelMap[type]}`, plan.planNo, `${labelMap[type]} = ${value}`, 'info');
  return { success: true, message: `已分配${labelMap[type]}`, plan: enrichPlan(plan) };
}

function validatePushWms(plan: WorkbenchPlan) {
  const orders = dispatchPoolOrders.filter(o => plan.orderIds.includes(o.id));
  if (!plan.confirmed) return '请先人工确认调度方案';
  if (orders.some(o => o.holdFlag)) return '存在暂扣订单，不可推送 WMS';
  if (orders.some(o => o.exceptionFlag)) return '存在异常订单，不可推送 WMS';
  if (orders.some(o => !o.inventoryAvailable)) return '库存不可用';
  if (!plan.appointmentTime) return '预约时间不完整';
  if (!plan.destination) return '目的地不明确';
  return null;
}

export function pushWmsWorkbench(planId: number) {
  const plan = getActivePlan(planId);
  if (!plan) return { success: false, message: '方案不存在' };
  const err = validatePushWms(plan);
  if (err) return { success: false, message: err };
  plan.wmsPushed = true;
  plan.status = 'WMS_PUSHED';
  dispatchPoolOrders.filter(o => plan.orderIds.includes(o.id)).forEach(o => {
    o.status = 'WMS_PUSHED';
  });
  appendLog('推送WMS', plan.planNo, 'WMS 已生成出库单、备货任务、拣货指令、装车任务', 'success');
  return { success: true, message: '已推送 WMS，车次状态：已推送WMS', plan: enrichPlan(plan) };
}

function validatePushDriver(plan: WorkbenchPlan) {
  if (!plan.wmsPushed) return '请先推送 WMS';
  if (!plan.driverName) return '未分配司机';
  if (!plan.plateNo) return '未分配车辆';
  if (!plan.appointmentTime) return '缺少装车时间';
  if (!plan.destination) return '缺少目的地地址';
  return null;
}

export function pushDriverWorkbench(planId: number) {
  const plan = getActivePlan(planId);
  if (!plan) return { success: false, message: '方案不存在' };
  const err = validatePushDriver(plan);
  if (err) return { success: false, message: err };
  plan.driverPushed = true;
  plan.status = 'DRIVER_PUSHED';
  dispatchPoolOrders.filter(o => plan.orderIds.includes(o.id)).forEach(o => {
    o.status = 'DRIVER_PUSHED';
  });
  appendLog('推送司机', plan.planNo, `司机 ${plan.driverName} 已收到任务`, 'success');
  return { success: true, message: '已推送司机端，等待司机接单与 Check-in', plan: enrichPlan(plan) };
}

/** 兼容旧 tms.ts 导出 */
export function getDispatchPoolLegacy(params: Record<string, any>) {
  return getDispatchWorkbenchPool(params);
}

export function getDispatchPlansLegacy() {
  return getDispatchWorkbenchPlans();
}

export function autoDispatchLegacy() {
  return autoDispatchWorkbench();
}

export function confirmDispatchLegacy(planId: number) {
  return confirmDispatchWorkbench(planId);
}
