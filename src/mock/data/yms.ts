import {
  computeDispatchPriorityScore,
  computeTripDeadline,
  enrichTripDeadlineFields
} from '@/utils/tms/trip-deadline';
import { MOCK_WAREHOUSE } from './common';
import { getYardDockFree } from './yard';
import { mockPage } from '../utils';
import { buildDevanningDispatchDockBoard, getDevanningDispatchTasks } from './devanning-work';

const wh = {
  tenantId: '000000',
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseCode: MOCK_WAREHOUSE.warehouseCode,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-05-01 10:00:00'
};

const LOADING_DEST_BY_ID: Record<number, string> = {
  100002: 'ONT8',
  100004: 'LGB8'
};

function formatYmsDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function enrichLoadingTask(row: Api.Yms.YardTask): Api.Yms.YardTask {
  if (!row.taskType.includes('LOADING')) return row;
  const finishOffsets = [22, 48, -8, 65];
  const finishInMin = finishOffsets[Number(row.id) % finishOffsets.length];
  const destination = LOADING_DEST_BY_ID[Number(row.id)] ?? 'ONT8';
  const palletQty = row.totalPalletQty ?? 8;
  const probe = computeTripDeadline({
    appointmentTime: '2099-06-06 20:00:00',
    originWarehouse: 'LA',
    destination,
    palletQty,
    cartonQty: palletQty * 12
  });
  const routeMinutes =
    probe.estimatedTravelMinutes +
    probe.trafficBufferMinutes +
    probe.exitCheckMinutes +
    probe.sealSignMinutes;
  const appointmentTime = formatYmsDateTime(new Date(Date.now() + (finishInMin + routeMinutes) * 60_000));
  const deadline = enrichTripDeadlineFields({
    appointmentTime,
    originWarehouse: 'LA',
    destination,
    palletQty,
    cartonQty: palletQty * 12
  });
  return {
    ...row,
    appointmentTime,
    destination,
    originWarehouse: 'LA',
    distanceMiles: deadline.distanceMiles,
    estimatedTravelMinutes: deadline.estimatedTravelMinutes,
    latestStartLoadingTime: deadline.latestStartLoadingTime,
    latestFinishTime: deadline.latestFinishTime,
    remainingMinutes: deadline.remainingMinutes,
    deadlineRiskLevel: deadline.deadlineRiskLevel,
    priority: computeDispatchPriorityScore(deadline)
  };
}

function task(partial: Partial<Api.Yms.YardTask> & Pick<Api.Yms.YardTask, 'id' | 'yardTaskNo' | 'taskType' | 'yardStatus'>): Api.Yms.YardTask {
  return {
    sourceOrderType: 'CONTAINER_ORDER',
    sourceOrderId: 9100001,
    sourceOrderNo: 'CO202605220001',
    containerNo: 'MSCU1234567',
    wmsReadyStatus: 'READY',
    wmsReadyTime: '2026-05-28 08:00:00',
    priority: 1,
    truckNo: 'CA-TRK-001',
    driverName: '王师付',
    driverPhone: '13800001111',
    etaYardTime: '2026-05-28 09:00:00',
    gateInTime: null,
    dockStartTime: null,
    dockFinishTime: null,
    releaseTime: null,
    gateOutTime: null,
    dockId: null,
    dockCode: null,
    operationTaskId: null,
    operationStatus: null,
    operationProgress: null,
    operationStartTime: null,
    operationFinishTime: null,
    estimatedFinishTime: null,
    loadedQty: null,
    totalQty: null,
    loadedPalletQty: null,
    totalPalletQty: null,
    openInternalTaskId: null,
    openInternalTaskNo: null,
    openInternalTaskType: null,
    openInternalTaskStatus: null,
    openInternalTaskTargetCode: null,
    visitNo: 1,
    unloadRoundNo: 1,
    isReentry: 0,
    reentryReason: null,
    parentTaskId: null,
    exceptionFlag: 0,
    exceptionReason: null,
    source: 'OMS',
    remark: null,
    ...wh,
    ...partial
  };
}

export const MOCK_YMS_DISPATCH: Api.Yms.YardTask[] = [
  task({
    id: 100001,
    yardTaskNo: 'YT-2026-0001',
    taskType: 'DEVANNING',
    yardStatus: 'DEVANNING',
    dockId: 3010001,
    dockCode: 'DOC-LA-001',
    gateInTime: '2026-05-28 08:30:00',
    dockStartTime: '2026-05-28 09:00:00',
    operationProgress: 35
  }),
  task({
    id: 100002,
    yardTaskNo: 'YT-2026-0002',
    taskType: 'DELIVERY_LOADING',
    yardStatus: 'LOADING',
    dockId: 3010002,
    dockCode: 'DOC-LA-002',
    containerNo: null,
    truckNo: 'CA-TRK-002',
    gateInTime: '2026-05-28 08:45:00',
    dockStartTime: '2026-05-28 09:10:00',
    operationProgress: 45,
    remark: '派送装车'
  }),
  task({
    id: 100003,
    yardTaskNo: 'YT-2026-0003',
    taskType: 'DEVANNING',
    yardStatus: 'ARRIVED',
    containerNo: 'EGLU7654321'
  }),
  task({
    id: 100004,
    yardTaskNo: 'YT-2026-0004',
    taskType: 'TRANSFER_LOADING',
    yardStatus: 'PRE_ARRIVAL',
    containerNo: null
  })
];

export const MOCK_YMS_TRAILERS = [
  {
    id: 101001,
    ...wh,
    trailerNo: 'TR-001',
    licensePlate: 'CA-ABC123',
    status: 'ARRIVED',
    vehicleSource: 'OWN_TRAILER',
    driverName: '王师付',
    driverPhone: '13800002222',
    remark: null
  }
];

export const MOCK_YMS_CONTAINERS = [
  {
    id: 102001,
    ...wh,
    containerNo: 'MSCU1234567',
    containerSize: '40HQ',
    status: 'ARRIVED',
    positionCode: 'C-01-01',
    remark: null
  }
];

export const MOCK_YMS_INTERNAL_TASKS: Api.Yms.InternalTask[] = [
  {
    id: 103001,
    ...wh,
    taskNo: 'IT-2026-0001',
    taskType: 'CONTAINER_MOVE',
    taskStatus: 'PENDING',
    fromPositionCode: 'C-01-01',
    toPositionCode: 'C-02-03',
    toDockCode: null,
    assigneeName: null,
    remark: 'ԺŲ'
  } as Api.Yms.InternalTask
];

export function getYmsDispatchList(params?: Record<string, any>) {
  let rows = [...MOCK_YMS_DISPATCH];
  if (params?.taskType) {
    rows = rows.filter(t => t.taskType === params.taskType);
  }
  if (params?.taskGroup === 'LOADING') {
    rows = rows.filter(t => t.taskType.includes('LOADING'));
  }
  if (params?.taskGroup === 'DEVANNING') {
    rows = getDevanningDispatchTasks();
  }
  rows = rows.map(enrichLoadingTask);
  if (params?.yardStatus) {
    const statuses = String(params.yardStatus).split(',');
    rows = rows.filter(t => statuses.includes(t.yardStatus));
  }
  return mockPage(rows, params);
}

export function getYmsTrailerList(params?: Record<string, any>) {
  return mockPage(MOCK_YMS_TRAILERS, params);
}

export function getYmsContainerList(params?: Record<string, any>) {
  return mockPage(MOCK_YMS_CONTAINERS, params);
}

export function getYmsInternalTaskList(params?: Record<string, any>) {
  return mockPage(MOCK_YMS_INTERNAL_TASKS, params);
}

function filterTasksByGroup(taskGroup?: string) {
  if (taskGroup === 'LOADING') {
    return MOCK_YMS_DISPATCH.filter(t => t.taskType.includes('LOADING'));
  }
  if (taskGroup === 'DEVANNING') {
    return getDevanningDispatchTasks();
  }
  return MOCK_YMS_DISPATCH;
}

export function getYmsDispatchStats(params?: Record<string, any>): Api.Yms.DispatchStats {
  const rows = filterTasksByGroup(params?.taskGroup);
  const devanning = getDevanningDispatchTasks().length;
  const loading = MOCK_YMS_DISPATCH.filter(t => t.taskType.includes('LOADING')).length;
  const working = rows.filter(t =>
    ['DOCK_WORKING', 'DEVANNING', 'LOADING', 'OPERATION_PAUSED'].includes(t.yardStatus)
  ).length;
  const waiting = rows.filter(t =>
    ['ARRIVED', 'WAITING', 'QUEUED', 'DOCK_ASSIGNED'].includes(t.yardStatus)
  ).length;
  const finished = rows.filter(t =>
    ['OPERATION_FINISHED', 'RELEASED', 'LEFT_YARD'].includes(t.yardStatus)
  ).length;
  const totalDocks = params?.taskGroup === 'LOADING' ? 2 : params?.taskGroup === 'DEVANNING' ? 2 : 4;
  const occupiedDocks = params?.taskGroup === 'LOADING' ? 1 : params?.taskGroup === 'DEVANNING' ? 1 : 2;
  return {
    totalTasks: rows.length,
    waitingTasks: waiting,
    workingTasks: working,
    devanningTasks: devanning,
    loadingTasks: loading,
    finishedTasks: finished,
    inYardVehicles: 3,
    totalDocks,
    occupiedDocks
  };
}

export function getYmsOverview(): Api.Yms.Overview {
  const stats = getYmsDispatchStats();
  return {
    todayCheckIns: 8,
    inYardCount: 5,
    waitDevanningCount: 2,
    waitLoadingCount: 1,
    totalDocks: stats.totalDocks,
    occupiedDocks: stats.occupiedDocks,
    freeDocks: stats.totalDocks - stats.occupiedDocks,
    exceptionCount: 0,
    dispatchStats: stats,
    recentEvents: [
      { eventTime: '2026-05-28 09:15:00', eventType: 'CHECK_IN', message: '车辆 CA-TRK-001 签到入场', refId: 100001 },
      { eventTime: '2026-05-28 09:00:00', eventType: 'TASK', message: '任务 YT-2026-0001 开始作业', refId: 100001 }
    ],
    hourlyTrends: [
      { hour: 8, checkInCount: 2 },
      { hour: 9, checkInCount: 3 },
      { hour: 10, checkInCount: 3 }
    ],
    timeoutWaitingCount: 0
  };
}

const DEVANNING_DOCK_BOARD: Api.Yms.DockBoard[] = [
  {
    id: 3010001,
    dockCode: 'DOC-LA-001',
    dockName: 'LA 拆柜口 1',
    dockType: 'DEVANNING',
    dockLocation: '前院',
    gridRow: 1,
    gridCol: 1,
    dockStatus: 'OCCUPIED',
    enableQueue: 1,
    maxQueueCount: 3,
    sortOrder: 1,
    enabledFlag: 1,
    activeTask: MOCK_YMS_DISPATCH.find(t => t.id === 100001) ?? null,
    incomingTasks: [],
    queuedTasks: MOCK_YMS_DISPATCH.filter(t => t.taskType === 'DEVANNING' && t.yardStatus === 'ARRIVED')
  },
  {
    id: 3010005,
    dockCode: 'DOC-LA-005',
    dockName: 'LA 拆柜口 2',
    dockType: 'CONTAINER_DOCK',
    dockLocation: '前院',
    gridRow: 1,
    gridCol: 2,
    dockStatus: 'IDLE',
    enableQueue: 1,
    maxQueueCount: 2,
    sortOrder: 2,
    enabledFlag: 1,
    activeTask: null,
    incomingTasks: [],
    queuedTasks: []
  }
];

const LOADING_DOCK_BOARD: Api.Yms.DockBoard[] = [
  {
    id: 3010002,
    dockCode: 'DOC-LA-002',
    dockName: 'LA 装车口 1',
    dockType: 'TRUCK_DOCK',
    dockLocation: '前院',
    gridRow: 1,
    gridCol: 1,
    dockStatus: 'OCCUPIED',
    enableQueue: 1,
    maxQueueCount: 2,
    sortOrder: 1,
    enabledFlag: 1,
    activeTask: MOCK_YMS_DISPATCH.find(t => t.id === 100002) ?? null,
    incomingTasks: [],
    queuedTasks: []
  },
  {
    id: 3010003,
    dockCode: 'DOC-LA-003',
    dockName: 'LA 装车口 2',
    dockType: 'TRUCK_DOCK',
    dockLocation: '前院',
    gridRow: 1,
    gridCol: 2,
    dockStatus: 'IDLE',
    enableQueue: 1,
    maxQueueCount: 3,
    sortOrder: 2,
    enabledFlag: 1,
    activeTask: null,
    incomingTasks: [],
    queuedTasks: MOCK_YMS_DISPATCH.filter(t => t.taskType.includes('LOADING') && t.yardStatus === 'PRE_ARRIVAL')
  }
];

export function getYmsDockBoard(params?: Record<string, any>): Api.Yms.DockBoard[] {
  if (params?.taskGroup === 'LOADING') return LOADING_DOCK_BOARD;
  if (params?.taskGroup === 'DEVANNING') return buildDevanningDispatchDockBoard();
  return [...buildDevanningDispatchDockBoard(), ...LOADING_DOCK_BOARD];
}

export function getYmsInternalTaskBoard(): Api.Yms.InternalTaskBoardColumn[] {
  const pending = MOCK_YMS_INTERNAL_TASKS.filter(t => t.taskStatus === 'PENDING');
  return [
    { status: 'PENDING', statusLabel: '待接单', count: pending.length, tasks: pending },
    { status: 'ACCEPTED', statusLabel: '已接单', count: 0, tasks: [] },
    { status: 'IN_PROGRESS', statusLabel: 'ִ', count: 0, tasks: [] },
    { status: 'FAILED', statusLabel: 'ʧ', count: 0, tasks: [] }
  ];
}

export function getYmsFreeYardSlots() {
  return getYardDockFree(MOCK_WAREHOUSE.id).map(d => ({
    id: d.id,
    positionCode: d.dockCode,
    zoneCode: d.zoneCode
  }));
}
