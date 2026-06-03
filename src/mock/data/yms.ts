import { MOCK_WAREHOUSE } from './common';
import { getYardDockFree } from './yard';
import { mockPage } from '../utils';

const wh = {
  tenantId: '000000',
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseCode: MOCK_WAREHOUSE.warehouseCode,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-05-01 10:00:00'
};

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
    yardStatus: 'DOCK_WORKING',
    dockId: 3010002,
    dockCode: 'DOC-LA-002',
    gateInTime: '2026-05-28 08:30:00',
    dockStartTime: '2026-05-28 09:00:00'
  }),
  task({
    id: 100002,
    yardTaskNo: 'YT-2026-0002',
    taskType: 'DELIVERY_LOADING',
    yardStatus: 'WAITING',
    containerNo: null,
    truckNo: 'CA-TRK-002',
    remark: '院内搬运'
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
    rows = rows.filter(t => t.taskType === 'DEVANNING');
  }
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

export function getYmsDispatchStats(): Api.Yms.DispatchStats {
  const devanning = MOCK_YMS_DISPATCH.filter(t => t.taskType === 'DEVANNING').length;
  const loading = MOCK_YMS_DISPATCH.filter(t => t.taskType.includes('LOADING')).length;
  const working = MOCK_YMS_DISPATCH.filter(t =>
    ['DOCK_WORKING', 'DEVANNING', 'LOADING', 'OPERATION_PAUSED'].includes(t.yardStatus)
  ).length;
  const waiting = MOCK_YMS_DISPATCH.filter(t =>
    ['ARRIVED', 'WAITING', 'QUEUED', 'DOCK_ASSIGNED'].includes(t.yardStatus)
  ).length;
  const finished = MOCK_YMS_DISPATCH.filter(t =>
    ['OPERATION_FINISHED', 'RELEASED', 'LEFT_YARD'].includes(t.yardStatus)
  ).length;
  return {
    totalTasks: MOCK_YMS_DISPATCH.length,
    waitingTasks: waiting,
    workingTasks: working,
    devanningTasks: devanning,
    loadingTasks: loading,
    finishedTasks: finished,
    inYardVehicles: 3,
    totalDocks: 4,
    occupiedDocks: 1
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

export function getYmsDockBoard(): Api.Yms.DockBoard[] {
  const active = MOCK_YMS_DISPATCH.find(t => t.dockId === 3010002);
  return [
    {
      id: 3010001,
      dockCode: 'DOC-LA-001',
      dockName: 'LA 装车口 2',
      dockType: 'DEVANNING',
      dockLocation: '前院',
      gridRow: 1,
      gridCol: 1,
      dockStatus: 'IDLE',
      enableQueue: 1,
      maxQueueCount: 3,
      sortOrder: 1,
      enabledFlag: 1,
      activeTask: null,
      incomingTasks: [],
      queuedTasks: []
    },
    {
      id: 3010002,
      dockCode: 'DOC-LA-002',
      dockName: 'LA 装车口 2',
      dockType: 'LOADING',
      dockLocation: '前院',
      gridRow: 1,
      gridCol: 2,
      dockStatus: 'OCCUPIED',
      enableQueue: 1,
      maxQueueCount: 2,
      sortOrder: 2,
      enabledFlag: 1,
      activeTask: active ?? null,
      incomingTasks: [],
      queuedTasks: MOCK_YMS_DISPATCH.filter(t => t.yardStatus === 'WAITING').slice(0, 1)
    }
  ];
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
