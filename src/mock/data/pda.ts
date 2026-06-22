import {
  PDA_BUSINESS_GROUPS,
  PDA_PERFORMANCE,
  applyModuleBadges,
  getBusinessGroup,
  getBusinessPendingTotal,
  isValidBusinessKey,
  resolveTaskType,
  type BusinessKey
} from '@/views/pda/shared/business-config';
import {
  OUTBOUND_TRIP_POOL,
  PDA_WRONG_PALLET_NO,
  createOutboundTrip,
  getAllPallets,
  type OutboundPallet,
  type OutboundTrip
} from '@/views/pda/shared/outbound-mock';
import { appendPdaOperLog } from '@/views/pda/shared/pda-oper-log';

const INBOUND_PALLET_POOL: Api.Pda.InboundPalletInfo[] = [
  {
    palletLabelNo: 'PLT-LBL-2026-001',
    destination: '美西二号仓 · A区',
    recommendLocation: 'A-01-03',
    boxCount: 48,
    customer: '演示客户 A'
  },
  {
    palletLabelNo: 'PLT-LBL-2026-002',
    destination: '美西二号仓 · B区',
    recommendLocation: 'B-02-08',
    boxCount: 36,
    customer: '演示客户 B'
  },
  {
    palletLabelNo: 'PLT-LBL-2026-003',
    destination: '美西二号仓 · C区',
    recommendLocation: 'C-03-12',
    boxCount: 52,
    customer: '演示客户 C'
  }
];

const activeTrips = new Map<string, OutboundTrip>();

const TASK_POOL: Record<string, Api.Pda.TaskDetail> = {
  'TASK-2026-001': {
    taskId: 'TASK-2026-001',
    taskType: 'putaway',
    biz: 'transit',
    customer: '演示客户 A',
    palletNo: 'PLT-001',
    currentLocation: 'A-01-01',
    targetLocation: 'A-02-03',
    status: 'PENDING'
  },
  'TASK-2026-002': {
    taskId: 'TASK-2026-002',
    taskType: 'move',
    biz: 'transfer',
    customer: '演示客户 B',
    palletNo: 'PLT-002',
    currentLocation: 'B-01-05',
    targetLocation: 'B-02-01',
    status: 'PENDING'
  }
};

function cloneBusinessGroups(): Api.Pda.BusinessGroupSummary[] {
  return PDA_BUSINESS_GROUPS.map(g => ({
    key: g.key,
    label: g.label,
    desc: g.desc,
    accent: g.accent,
    icon: g.icon,
    pendingTotal: getBusinessPendingTotal(g),
    modules: g.modules.map(m => ({
      key: m.key,
      label: m.label,
      badge: m.badge,
      icon: m.icon,
      route: m.route,
      query: m.query ? { ...m.query } : undefined
    }))
  }));
}

export function getPdaHomeSummary(): Api.Pda.HomeSummary {
  return {
    displayName: '原型管理员',
    warehouseName: '美西二号仓',
    notifyCount: 4,
    businessGroups: cloneBusinessGroups(),
    performance: { ...PDA_PERFORMANCE }
  };
}

export function getPdaBusinessModules(biz: string): Api.Pda.BusinessGroupSummary | null {
  if (!isValidBusinessKey(biz)) return null;
  const group = getBusinessGroup(biz);
  if (!group) return null;
  return {
    key: group.key,
    label: group.label,
    desc: group.desc,
    accent: group.accent,
    icon: group.icon,
    pendingTotal: getBusinessPendingTotal(group),
    modules: group.modules.map(m => ({
      key: m.key,
      label: m.label,
      badge: m.badge,
      icon: m.icon,
      route: m.route,
      query: m.query ? { ...m.query } : undefined
    }))
  };
}

export function scanInboundPallet(labelNo: string, _biz: string): Api.Pda.InboundPalletInfo | null {
  const found = INBOUND_PALLET_POOL.find(p => p.palletLabelNo === labelNo);
  if (found) return { ...found };
  const fuzzy = INBOUND_PALLET_POOL.find(p => labelNo.includes(p.palletLabelNo) || p.palletLabelNo.includes(labelNo));
  return fuzzy ? { ...fuzzy, palletLabelNo: labelNo } : null;
}

export function confirmInbound(payload: Api.Pda.InboundConfirmPayload) {
  appendPdaOperLog({
    operType: '入库确认',
    operObject: payload.palletLabelNo,
    bizNo: payload.locationCode,
    operContent: `业务线 ${payload.biz}：${payload.palletLabelNo} → ${payload.locationCode}`
  });
  return { success: true, message: '入库成功' };
}

/** 推送给当前 PDA 作业员的出库车次任务（非全量待出库车次） */
const PUSHED_OUTBOUND_TRIP_TASKS: Array<{
  taskNo: string;
  tripNo: string;
  pushedAt: string;
  pushedBy: string;
  taskStatus: Api.Pda.OutboundTripTaskStatus;
}> = [
  {
    taskNo: 'OUT-PUSH-2026-0603-01',
    tripNo: 'TR-2026-0603-01',
    pushedAt: '2026-06-06 09:15:00',
    pushedBy: '出库调度',
    taskStatus: 'PUSHED'
  },
  {
    taskNo: 'OUT-PUSH-2026-0603-02',
    tripNo: 'TR-2026-0603-02',
    pushedAt: '2026-06-06 09:42:00',
    pushedBy: '出库调度',
    taskStatus: 'PUSHED'
  },
  {
    taskNo: 'OUT-PUSH-2026-0603-03',
    tripNo: 'TR-2026-0603-03',
    pushedAt: '2026-06-06 10:05:00',
    pushedBy: '班长-张三',
    taskStatus: 'PUSHED'
  }
];

export function getOutboundTripList(_biz: string): Api.Pda.OutboundTripListItem[] {
  return PUSHED_OUTBOUND_TRIP_TASKS.map(push => {
    const pool = OUTBOUND_TRIP_POOL.find(t => t.tripNo === push.tripNo);
    const enriched = createOutboundTrip(push.tripNo);
    const palletCount = enriched ? getAllPallets(enriched).length : 0;
    return {
      taskId: push.taskNo,
      taskNo: push.taskNo,
      tripNo: push.tripNo,
      dockNo: pool?.dockNo ?? '—',
      carriageNo: pool?.carriageNo ?? '—',
      palletCount,
      destination: enriched?.destination,
      appointmentTime: enriched?.appointmentTime,
      latestFinishTime: enriched?.latestFinishTime,
      deadlineRiskLevel: enriched?.deadlineRiskLevel,
      pushedAt: push.pushedAt,
      pushedBy: push.pushedBy,
      taskStatus: push.taskStatus
    };
  });
}

export function getOrCreateActiveTrip(tripNo: string): OutboundTrip | undefined {
  if (activeTrips.has(tripNo)) return activeTrips.get(tripNo);
  const trip = createOutboundTrip(tripNo);
  if (trip) {
    const pallets = getAllPallets(trip);
    if (pallets[0]) pallets[0].hold = true;
    if (pallets[1]) pallets[1].hold = false;
    activeTrips.set(tripNo, trip);
  }
  return trip;
}

export type LoadScanResult = Api.Pda.OutboundLoadResult['result'];

export function evaluateOutboundLoad(tripNo: string, palletNo: string): {
  result: LoadScanResult;
  message: string;
  pallet?: OutboundPallet;
} {
  if (palletNo === PDA_WRONG_PALLET_NO) {
    return { result: 'wrong', message: '该托盘不属于当前车次，禁止装车' };
  }
  const trip = getOrCreateActiveTrip(tripNo);
  if (!trip) return { result: 'wrong', message: '车次不存在' };
  const pallet = getAllPallets(trip).find(p => p.palletNo === palletNo);
  if (!pallet) return { result: 'wrong', message: '该托盘不属于当前车次，禁止装车' };
  if (pallet.hold) return { result: 'hold', message: 'HOLD 货物，禁止装车', pallet };
  if (pallet.loadScanned || pallet.loaded) return { result: 'duplicate', message: '该托盘已扫描，请勿重复扫描', pallet };
  return { result: 'success', message: '允许装车', pallet };
}

export function confirmOutboundLoad(payload: Api.Pda.OutboundLoadPayload): Api.Pda.OutboundLoadResult {
  const evalResult = evaluateOutboundLoad(payload.tripNo, payload.palletNo);
  const trip = getOrCreateActiveTrip(payload.tripNo);
  const totalCount = trip ? getAllPallets(trip).length : 0;
  let loadedCount = trip ? getAllPallets(trip).filter(p => p.loadScanned || p.loaded).length : 0;

  if (evalResult.result === 'success' && evalResult.pallet) {
    evalResult.pallet.loadScanned = true;
    evalResult.pallet.scanned = true;
    loadedCount += 1;
    appendPdaOperLog({
      operType: '装车扫描',
      operObject: payload.palletNo,
      bizNo: payload.tripNo,
      operContent: `车次 ${payload.tripNo} 装车扫描 ${payload.palletNo}`
    });
  }

  return {
    result: evalResult.result,
    message: evalResult.message,
    loadedCount,
    totalCount
  };
}

const OUTBOUND_EXCEPTION_TYPE_LABEL: Record<string, string> = {
  DAMAGE: '破损',
  WET: '湿箱',
  UNREPAIRABLE: '无法修复'
};

export function uploadOutboundSitePhoto(payload: Api.Pda.OutboundSitePhotoPayload): Api.Pda.OutboundActionResult {
  const photoCount = Math.min(Math.max(Number(payload.photoCount) || 0, 0), 20);
  if (!photoCount) return { ok: false, message: '请先拍照' };
  const tripNo = String(payload.tripNo || '').trim() || '—';
  const containerNo = String(payload.containerNo || '').trim() || '—';
  appendPdaOperLog({
    operType: '出库拍照上传',
    operObject: tripNo,
    bizNo: containerNo,
    operContent: `现场照片已上传 ${photoCount} 张`
  });
  return { ok: true, message: `已上传 ${photoCount} 张照片` };
}

export function reportOutboundException(payload: Api.Pda.OutboundExceptionPayload): Api.Pda.OutboundActionResult {
  const remark = String(payload.remark || '').trim();
  if (!remark) return { ok: false, message: '请填写问题描述' };
  if (!payload.photoCaptured) return { ok: false, message: '请先拍摄异常照片' };
  if (!payload.exceptionType) return { ok: false, message: '请选择异常情况' };
  if (!payload.orderUnrecognized && !String(payload.orderNo || '').trim()) {
    return { ok: false, message: '请选择订单号或标记无法识别' };
  }

  const tripNo = String(payload.tripNo || '').trim() || '—';
  const containerNo = String(payload.containerNo || '').trim() || '—';
  const typeLabel = OUTBOUND_EXCEPTION_TYPE_LABEL[payload.exceptionType] || payload.exceptionType;
  const orderPart = payload.orderUnrecognized
    ? '订单：无法识别'
    : `订单：${String(payload.orderNo || '').trim()}`;
  const recognizePart = payload.containerAutoRecognized ? '柜号自动识别' : '柜号手动填写';

  appendPdaOperLog({
    operType: '出库异常反馈',
    operObject: tripNo,
    bizNo: containerNo,
    operContent: `${typeLabel} · ${orderPart} · ${recognizePart} · ${remark} · 已附照片`
  });
  return { ok: true, message: '异常已反馈' };
}

export function finishOutbound(payload: Api.Pda.OutboundFinishPayload) {
  appendPdaOperLog({
    operType: '确认发车',
    operObject: payload.tripNo,
    bizNo: payload.biz,
    operContent: `车次 ${payload.tripNo} 发车完成，照片 ${payload.photoCount ?? 0} 张`
  });
  activeTrips.delete(payload.tripNo);
  return { success: true, message: '发车完成' };
}

export function getPdaTask(taskId: string, biz?: string, taskType?: string): Api.Pda.TaskDetail {
  const existing = TASK_POOL[taskId];
  if (existing) {
    return {
      ...existing,
      biz: biz || existing.biz,
      taskType: taskType ? resolveTaskType(taskType) : existing.taskType
    };
  }
  const resolvedType = resolveTaskType(taskType || 'exception');
  const resolvedBiz = (biz && isValidBusinessKey(biz) ? biz : 'transfer') as BusinessKey;
  return {
    taskId: taskId || 'TASK-2026-001',
    taskType: resolvedType,
    biz: resolvedBiz,
    customer: '演示客户 A',
    palletNo: 'PLT-001',
    currentLocation: 'A-01-01',
    targetLocation: resolvedType === 'count' ? 'A-01-01' : 'A-02-03',
    status: 'PENDING'
  };
}

export function pdaTaskAction(
  taskId: string,
  payload: Api.Pda.TaskActionPayload
): Api.Pda.TaskActionResult {
  const task = getPdaTask(taskId);
  const actionLabels: Record<string, string> = {
    scan: '扫描',
    confirm: '确认',
    exception: '异常上报',
    photo: '拍照留证',
    finish: '完成任务'
  };
  const label = actionLabels[payload.action] || payload.action;
  let content = `任务 ${taskId} ${label}`;
  if (payload.scanCode) content += `，扫码 ${payload.scanCode}`;
  if (payload.exceptionReason) content += `，原因：${payload.exceptionReason}`;

  appendPdaOperLog({
    operType: label,
    operObject: taskId,
    bizNo: task.palletNo,
    operContent: content,
    operResult: payload.action === 'exception' ? 'SUCCESS' : 'SUCCESS'
  });

  if (payload.action === 'finish') {
    task.status = 'DONE';
  } else if (payload.action === 'exception') {
    task.status = 'EXCEPTION';
  } else if (payload.action === 'confirm') {
    task.status = 'CONFIRMED';
  }

  return {
    success: true,
    message: `${label}成功`,
    task: { ...task }
  };
}

/** 初始化时同步 badge（供页面刷新用） */
export function syncPdaModuleBadgesFromConfig() {
  PDA_BUSINESS_GROUPS.forEach(g => {
    const badges: Record<string, number> = {};
    g.modules.forEach(m => {
      badges[m.key] = m.badge;
    });
    applyModuleBadges(g.key, badges);
  });
}
