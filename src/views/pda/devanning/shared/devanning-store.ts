import { appendPdaOperLog } from '@/views/pda/shared/pda-oper-log';
import {
  DEFAULT_PALLET_SIZE,
  OPTIONAL_PHOTO_TYPES,
  REQUIRED_PHOTO_TYPES,
  type DevanningTaskStatus,
  type ExceptionStatus,
  type PalletStatus
} from './devanning-constants';

export type DevanningDestination = {
  id: string;
  destination: string;
  platform: string;
  locationCode: string;
  palletCount: number;
  boxCount: number;
  exceptionCount: number;
};

export type DevanningPhoto = {
  type: string;
  label: string;
  required: boolean;
  captured: boolean;
  capturedAt?: string;
};

export type DevanningPallet = {
  palletNo: string;
  destinationId: string;
  containerNo: string;
  devanningNo: string;
  customer: string;
  businessType: string;
  destination: string;
  platform: string;
  boxQty: number | null;
  sizeL: number;
  sizeW: number;
  sizeH: number;
  skuQty: number;
  mixedPallet: boolean;
  exceptionFlag: boolean;
  exceptionStatus: ExceptionStatus;
  remark: string;
  status: PalletStatus;
  printed: boolean;
  printedAt?: string;
  inboundLocation?: string;
  inboundAt?: string;
  photos: DevanningPhoto[];
  createdAt: string;
  operatorName: string;
};

export type DevanningTask = {
  id: string;
  containerNo: string;
  devanningNo: string;
  customer: string;
  businessType: string;
  containerType: string;
  dock: string;
  appointmentTime: string;
  destCount: number;
  expectedBoxQty: number;
  expectedPalletQty: number;
  status: DevanningTaskStatus;
  biz: 'transfer';
  destinations: DevanningDestination[];
  pallets: DevanningPallet[];
  startedAt?: string;
  finishedAt?: string;
  operatorName?: string;
  pendingExceptionCount: number;
};

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function buildPhotos(): DevanningPhoto[] {
  return [
    ...REQUIRED_PHOTO_TYPES.map(p => ({
      type: p.key,
      label: p.label,
      required: true,
      captured: false
    })),
    ...OPTIONAL_PHOTO_TYPES.map(p => ({
      type: p.key,
      label: p.label,
      required: false,
      captured: false
    }))
  ];
}

function seedDestinations(): DevanningDestination[] {
  return [
    { id: 'dest-1', destination: 'LAX9', platform: 'Amazon', locationCode: 'STG-LAX9-A01', palletCount: 0, boxCount: 0, exceptionCount: 0 },
    { id: 'dest-2', destination: 'ORD2', platform: 'Walmart', locationCode: 'STG-ORD2-B02', palletCount: 0, boxCount: 0, exceptionCount: 0 },
    { id: 'dest-3', destination: 'ONT8', platform: 'Amazon', locationCode: 'STG-ONT8-A03', palletCount: 0, boxCount: 0, exceptionCount: 0 }
  ];
}

const TASK_SEED: DevanningTask[] = [
  {
    id: 'dv-task-001',
    containerNo: 'MSCU1234567',
    devanningNo: 'DV-2026-0001',
    customer: '演示客户 A',
    businessType: '整送',
    containerType: '40HQ',
    dock: 'DOC-LA-001',
    appointmentTime: '2026-06-08 14:00:00',
    destCount: 3,
    expectedBoxQty: 320,
    expectedPalletQty: 12,
    status: 'PENDING',
    biz: 'transfer',
    destinations: seedDestinations(),
    pallets: [],
    pendingExceptionCount: 0
  },
  {
    id: 'dv-task-002',
    containerNo: 'OOLU1000137',
    devanningNo: 'DV-2026-0002',
    customer: '演示客户 B',
    businessType: '拆送',
    containerType: '40GP',
    dock: 'DOC-LA-002',
    appointmentTime: '2026-06-08 16:30:00',
    destCount: 2,
    expectedBoxQty: 180,
    expectedPalletQty: 8,
    status: 'DEVANNING',
    biz: 'transfer',
    destinations: seedDestinations().slice(0, 2),
    pallets: [],
    startedAt: '2026-06-08 09:15:00',
    operatorName: '原型管理员',
    pendingExceptionCount: 0
  },
  {
    id: 'dv-task-003',
    containerNo: 'HLCU9988776',
    devanningNo: 'DV-2026-0003',
    customer: '演示客户 C',
    businessType: '整送',
    containerType: '45HQ',
    dock: 'DOC-LA-003',
    appointmentTime: '2026-06-07 10:00:00',
    destCount: 3,
    expectedBoxQty: 420,
    expectedPalletQty: 15,
    status: 'COMPLETED',
    biz: 'transfer',
    destinations: seedDestinations(),
    pallets: [],
    startedAt: '2026-06-07 10:30:00',
    finishedAt: '2026-06-07 18:20:00',
    operatorName: '王拆柜',
    pendingExceptionCount: 0
  }
];

const taskStore = new Map<string, DevanningTask>();
let palletSeq = 1;

function cloneTask(task: DevanningTask): DevanningTask {
  return JSON.parse(JSON.stringify(task)) as DevanningTask;
}

function initStore() {
  if (taskStore.size) return;
  TASK_SEED.forEach(t => taskStore.set(t.id, cloneTask(t)));
}

function findTaskByContainer(containerNo: string) {
  const key = containerNo.trim().toUpperCase();
  return [...taskStore.values()].find(t => t.containerNo.toUpperCase() === key);
}

function findTask(id: string) {
  return taskStore.get(id);
}

function syncDestinationStats(task: DevanningTask) {
  task.destinations.forEach(dest => {
    const pallets = task.pallets.filter(p => p.destinationId === dest.id);
    dest.palletCount = pallets.length;
    dest.boxCount = pallets.reduce((s, p) => s + (p.boxQty || 0), 0);
    dest.exceptionCount = pallets.filter(p => p.exceptionStatus === 'PENDING' || p.exceptionStatus === 'SUPERVISOR_CONFIRM').length;
  });
  task.pendingExceptionCount = task.pallets.filter(
    p => p.exceptionStatus === 'PENDING' || p.exceptionStatus === 'SUPERVISOR_CONFIRM'
  ).length;
}

function nextPalletNo() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(palletSeq++).padStart(4, '0');
  return `LA-TR-${y}${m}${day}-${seq}`;
}

const PUSHED_DEVANNING_INSTRUCTIONS: Api.Pda.DevanningPushInstruction[] = [
  {
    instructionNo: 'DV-PUSH-2026-0608-01',
    taskId: 'dv-task-001',
    containerNo: 'MSCU1234567',
    devanningNo: 'DV-2026-0001',
    dock: 'DOC-LA-001',
    appointmentTime: '2026-06-08 14:00:00',
    pushedAt: '2026-06-08 08:30:00',
    pushedBy: '拆柜调度',
    priority: 'URGENT'
  },
  {
    instructionNo: 'DV-PUSH-2026-0608-02',
    taskId: 'dv-task-002',
    containerNo: 'OOLU1000137',
    devanningNo: 'DV-2026-0002',
    dock: 'DOC-LA-002',
    appointmentTime: '2026-06-08 16:30:00',
    pushedAt: '2026-06-08 09:00:00',
    pushedBy: '班长-李四',
    priority: 'NORMAL'
  }
];

export function getDevanningPushInstructions(biz: string): Api.Pda.DevanningPushInstruction[] {
  initStore();
  const validIds = new Set(
    [...taskStore.values()].filter(t => t.biz === biz && t.status !== 'COMPLETED').map(t => t.id)
  );
  return PUSHED_DEVANNING_INSTRUCTIONS.filter(item => validIds.has(item.taskId));
}

export function getDevanningTaskList(
  biz: string,
  options?: { keyword?: string | null; taskId?: string | null }
): Api.Pda.DevanningTaskListItem[] {
  initStore();
  const keyword = String(options?.keyword || '')
    .trim()
    .toLowerCase();
  const taskId = options?.taskId ? String(options.taskId) : '';

  let rows = [...taskStore.values()].filter(t => t.biz === biz && t.status !== 'COMPLETED');

  if (taskId) rows = rows.filter(t => t.id === taskId);
  if (keyword) {
    rows = rows.filter(
      t =>
        t.containerNo.toLowerCase().includes(keyword) ||
        t.devanningNo.toLowerCase().includes(keyword) ||
        t.dock.toLowerCase().includes(keyword)
    );
  }

  return rows.map(t => ({
      id: t.id,
      containerNo: t.containerNo,
      devanningNo: t.devanningNo,
      customer: t.customer,
      businessType: t.businessType,
      containerType: t.containerType,
      dock: t.dock,
      appointmentTime: t.appointmentTime,
      destCount: t.destCount,
      expectedBoxQty: t.expectedBoxQty,
      expectedPalletQty: t.expectedPalletQty,
      status: t.status,
      palletCount: t.pallets.length,
      pendingExceptionCount: t.pendingExceptionCount
    }));
}

export function getDevanningTaskDetail(taskId: string): DevanningTask | null {
  initStore();
  const task = findTask(taskId);
  return task ? cloneTask(task) : null;
}

export function scanDevanningContainer(containerNo: string, biz: string): Api.Pda.DevanningScanResult {
  initStore();
  const key = containerNo.trim();
  if (!key) return { ok: false, message: '请输入或扫描柜号' };

  const task = findTaskByContainer(key);
  if (!task) return { ok: false, message: `柜号 ${key} 不存在或未下发至 PDA` };
  if (task.biz !== biz) return { ok: false, message: '该柜号不属于转运业务拆柜任务' };
  if (task.status === 'COMPLETED') return { ok: false, message: '该柜已完成拆柜，不可重复操作' };
  if (task.status === 'PENDING_CONFIRM') return { ok: false, message: '该柜待复核确认，请联系主管' };

  return { ok: true, message: '柜号校验通过', taskId: task.id, task: toListItem(task) };
}

function toListItem(task: DevanningTask): Api.Pda.DevanningTaskListItem {
  return {
    id: task.id,
    containerNo: task.containerNo,
    devanningNo: task.devanningNo,
    customer: task.customer,
    businessType: task.businessType,
    containerType: task.containerType,
    dock: task.dock,
    appointmentTime: task.appointmentTime,
    destCount: task.destCount,
    expectedBoxQty: task.expectedBoxQty,
    expectedPalletQty: task.expectedPalletQty,
    status: task.status,
    palletCount: task.pallets.length,
    pendingExceptionCount: task.pendingExceptionCount
  };
}

export function startDevanningTask(taskId: string, operatorName = '原型管理员') {
  initStore();
  const task = findTask(taskId);
  if (!task) return { ok: false, message: '拆柜任务不存在' };
  if (task.status === 'COMPLETED') return { ok: false, message: '任务已完成' };
  task.status = 'DEVANNING';
  task.startedAt = task.startedAt || nowStr();
  task.operatorName = operatorName;
  appendPdaOperLog({ operType: '开始拆柜', operObject: task.containerNo, bizNo: task.devanningNo, operContent: 'PDA 开始拆柜' });
  return { ok: true, message: '已开始拆柜', task: cloneTask(task) };
}

export function createDevanningPallet(payload: Api.Pda.DevanningCreatePalletPayload) {
  initStore();
  const task = findTask(payload.taskId);
  if (!task) return { ok: false, message: '拆柜任务不存在' };
  const dest = task.destinations.find(d => d.id === payload.destinationId);
  if (!dest) return { ok: false, message: '目的地不存在' };

  const boxQty = Number(payload.boxQty);
  if (!boxQty || boxQty <= 0) return { ok: false, message: '请录入有效箱数' };

  const pallet: DevanningPallet = {
    palletNo: nextPalletNo(),
    destinationId: dest.id,
    containerNo: task.containerNo,
    devanningNo: task.devanningNo,
    customer: task.customer,
    businessType: task.businessType,
    destination: dest.destination,
    platform: dest.platform,
    boxQty,
    sizeL: payload.sizeL ?? DEFAULT_PALLET_SIZE.l,
    sizeW: payload.sizeW ?? DEFAULT_PALLET_SIZE.w,
    sizeH: payload.sizeH ?? DEFAULT_PALLET_SIZE.h,
    skuQty: Number(payload.skuQty || 0),
    mixedPallet: Boolean(payload.mixedPallet),
    exceptionFlag: Boolean(payload.exceptionFlag),
    exceptionStatus: payload.exceptionFlag ? 'PENDING' : 'NORMAL',
    remark: payload.remark || '',
    status: 'BOX_ENTERED',
    printed: false,
    photos: buildPhotos(),
    createdAt: nowStr(),
    operatorName: payload.operatorName || task.operatorName || '原型管理员'
  };

  task.pallets.unshift(pallet);
  if (task.status === 'PENDING') {
    task.status = 'DEVANNING';
    task.startedAt = task.startedAt || nowStr();
    task.operatorName = pallet.operatorName;
  }
  syncDestinationStats(task);
  appendPdaOperLog({ operType: '创建卡板', operObject: pallet.palletNo, bizNo: task.containerNo, operContent: `${dest.destination} · ${boxQty} 箱` });
  return { ok: true, message: '卡板已创建', task: cloneTask(task), palletNo: pallet.palletNo };
}

export function printDevanningPallet(taskId: string, palletNo: string) {
  initStore();
  const task = findTask(taskId);
  if (!task) return { ok: false, message: '任务不存在' };
  const pallet = task.pallets.find(p => p.palletNo === palletNo);
  if (!pallet) return { ok: false, message: '卡板不存在' };
  pallet.printed = true;
  pallet.printedAt = nowStr();
  pallet.status = 'PRINTED';
  appendPdaOperLog({ operType: '打印卡板标签', operObject: palletNo, bizNo: task.containerNo, operContent: '标签已打印' });
  return { ok: true, message: '标签打印成功', task: cloneTask(task), pallet: { ...pallet } };
}

export function inboundDevanningPallet(payload: Api.Pda.DevanningInboundPayload) {
  initStore();
  const task = findTask(payload.taskId);
  if (!task) return { ok: false, message: '任务不存在' };
  const pallet = task.pallets.find(p => p.palletNo === payload.palletNo);
  if (!pallet) return { ok: false, message: '卡板不存在' };
  if (!pallet.printed) return { ok: false, message: '该卡板尚未打印标签，请先打印' };
  if (!payload.locationCode?.trim()) return { ok: false, message: '请扫描入库库位' };

  pallet.inboundLocation = payload.locationCode.trim();
  pallet.inboundAt = nowStr();
  pallet.status = 'INBOUND';
  syncDestinationStats(task);
  appendPdaOperLog({
    operType: '卡板入库',
    operObject: pallet.palletNo,
    bizNo: pallet.inboundLocation,
    operContent: `${task.containerNo} 卡板入库`
  });
  return { ok: true, message: '入库绑定成功', task: cloneTask(task), pallet: { ...pallet } };
}

export function captureDevanningPhoto(payload: Api.Pda.DevanningPhotoPayload) {
  initStore();
  const task = findTask(payload.taskId);
  if (!task) return { ok: false, message: '任务不存在' };
  const pallet = task.pallets.find(p => p.palletNo === payload.palletNo);
  if (!pallet) return { ok: false, message: '卡板不存在' };
  if (pallet.status !== 'INBOUND' && pallet.status !== 'PHOTOED') {
    return { ok: false, message: '请先完成卡板扫描入库' };
  }

  const photo = pallet.photos.find(p => p.type === payload.photoType);
  if (!photo) return { ok: false, message: '照片类型无效' };
  photo.captured = true;
  photo.capturedAt = nowStr();

  const requiredDone = pallet.photos.filter(p => p.required).every(p => p.captured);
  if (requiredDone) pallet.status = 'PHOTOED';

  syncDestinationStats(task);
  return { ok: true, message: '照片已绑定', task: cloneTask(task), pallet: { ...pallet } };
}

export function getDevanningReport(taskId: string): Api.Pda.DevanningReport | null {
  initStore();
  const task = findTask(taskId);
  if (!task) return null;
  syncDestinationStats(task);

  const unprinted = task.pallets.filter(p => !p.printed).length;
  const uninbound = task.pallets.filter(p => !p.inboundLocation).length;
  const unphoto = task.pallets.filter(p => !p.photos.filter(x => x.required).every(x => x.captured)).length;

  return {
    taskId: task.id,
    containerNo: task.containerNo,
    devanningNo: task.devanningNo,
    customer: task.customer,
    businessType: task.businessType,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
    operatorName: task.operatorName,
    dock: task.dock,
    status: task.status,
    totalPalletQty: task.pallets.length,
    totalBoxQty: task.pallets.reduce((s, p) => s + (p.boxQty || 0), 0),
    destCount: task.destinations.length,
    exceptionCount: task.pendingExceptionCount,
    unprintedCount: unprinted,
    uninboundCount: uninbound,
    unphotoCount: unphoto,
    destinationSummary: task.destinations.map(d => {
      const pallets = task.pallets.filter(p => p.destinationId === d.id);
      return {
        destination: d.destination,
        platform: d.platform,
        palletCount: pallets.length,
        boxCount: pallets.reduce((s, p) => s + (p.boxQty || 0), 0),
        inboundCount: pallets.filter(p => p.inboundLocation).length,
        photoCount: pallets.filter(p => p.photos.filter(x => x.required).every(x => x.captured)).length,
        exceptionCount: pallets.filter(p => p.exceptionStatus === 'PENDING' || p.exceptionStatus === 'SUPERVISOR_CONFIRM').length
      };
    }),
    palletDetails: task.pallets.map(p => ({
      palletNo: p.palletNo,
      destination: p.destination,
      boxQty: p.boxQty,
      size: `${p.sizeL}×${p.sizeW}×${p.sizeH}`,
      status: p.status,
      photoDone: p.photos.filter(x => x.required).every(x => x.captured),
      printed: p.printed,
      inbound: Boolean(p.inboundLocation),
      exceptionStatus: p.exceptionStatus
    }))
  };
}

export function validateDevanningFinish(taskId: string): Api.Pda.DevanningFinishValidation {
  initStore();
  const task = findTask(taskId);
  if (!task) return { ok: false, reasons: ['拆柜任务不存在'] };

  const reasons: string[] = [];
  const noBox = task.pallets.filter(p => !p.boxQty || p.boxQty <= 0);
  if (noBox.length) reasons.push(`还有 ${noBox.length} 个卡板未录入箱数，不能完成拆柜`);

  const unprinted = task.pallets.filter(p => !p.printed);
  if (unprinted.length) reasons.push(`还有 ${unprinted.length} 个卡板未打印标签，不能完成拆柜`);

  const uninbound = task.pallets.filter(p => !p.inboundLocation);
  if (uninbound.length) reasons.push(`还有 ${uninbound.length} 个卡板未扫描入库，不能完成拆柜`);

  const unphoto = task.pallets.filter(p => !p.photos.filter(x => x.required).every(x => x.captured));
  if (unphoto.length) reasons.push(`还有 ${unphoto.length} 个卡板未拍照，不能完成拆柜`);

  const pendingEx = task.pallets.filter(p => p.exceptionStatus === 'PENDING' || p.exceptionStatus === 'SUPERVISOR_CONFIRM');
  if (pendingEx.length) reasons.push(`还有 ${pendingEx.length} 个异常待处理，不能完成拆柜`);

  if (!task.pallets.length) reasons.push('尚未创建任何卡板，不能完成拆柜');

  return {
    ok: reasons.length === 0,
    reasons,
    totalPalletQty: task.pallets.length,
    totalBoxQty: task.pallets.reduce((s, p) => s + (p.boxQty || 0), 0),
    expectedPalletQty: task.expectedPalletQty,
    expectedBoxQty: task.expectedBoxQty
  };
}

export function finishDevanningTask(payload: Api.Pda.DevanningFinishPayload) {
  initStore();
  const validation = validateDevanningFinish(payload.taskId);
  if (!validation.ok) return { ok: false, message: validation.reasons[0], reasons: validation.reasons };

  const task = findTask(payload.taskId);
  if (!task) return { ok: false, message: '任务不存在' };

  task.status = payload.reviewMode ? 'PENDING_CONFIRM' : 'COMPLETED';
  task.finishedAt = nowStr();
  task.pallets.forEach(p => {
    if (p.status === 'PHOTOED') p.status = 'DONE';
  });

  appendPdaOperLog({
    operType: '拆柜完成',
    operObject: task.containerNo,
    bizNo: task.devanningNo,
    operContent: `总板 ${validation.totalPalletQty} · 总箱 ${validation.totalBoxQty} · 已生成库存记录`
  });

  return {
    ok: true,
    message: task.status === 'PENDING_CONFIRM' ? '已提交待复核' : '拆柜已完成',
    task: cloneTask(task),
    report: getDevanningReport(task.id)
  };
}

export function uploadDevanningSitePhoto(payload: Api.Pda.DevanningSitePhotoPayload) {
  initStore();
  const containerNo = String(payload.containerNo || '').trim() || '—';
  const photoCount = Math.min(Math.max(Number(payload.photoCount) || 0, 0), 20);
  if (!photoCount) return { ok: false, message: '请先拍照' };

  appendPdaOperLog({
    operType: '拆柜拍照上传',
    operObject: containerNo,
    bizNo: payload.biz || 'transfer',
    operContent: `现场照片已上传 ${photoCount} 张`
  });
  return { ok: true, message: `已上传 ${photoCount} 张照片` };
}

const EXCEPTION_TYPE_LABEL: Record<string, string> = {
  DAMAGE: '破损',
  WET: '湿箱',
  UNREPAIRABLE: '无法修复'
};

export function reportDevanningException(payload: Api.Pda.DevanningExceptionPayload) {
  initStore();
  const remark = String(payload.remark || '').trim();
  if (!remark) return { ok: false, message: '请填写问题描述' };
  if (!payload.photoCaptured) return { ok: false, message: '请先拍摄异常照片' };
  if (!payload.exceptionType) return { ok: false, message: '请选择异常情况' };
  if (!payload.orderUnrecognized && !String(payload.orderNo || '').trim()) {
    return { ok: false, message: '请选择订单号或标记无法识别' };
  }

  const taskId = String(payload.taskId || '').trim();
  const task = taskId ? findTask(taskId) : undefined;
  const containerNo = task?.containerNo || String(payload.containerNo || '').trim() || '—';
  const bizNo = task?.devanningNo || containerNo;
  const typeLabel = EXCEPTION_TYPE_LABEL[payload.exceptionType] || payload.exceptionType;
  const orderPart = payload.orderUnrecognized
    ? '订单：无法识别'
    : `订单：${String(payload.orderNo || '').trim()}`;
  const recognizePart = payload.containerAutoRecognized ? '柜号自动识别' : '柜号手动填写';

  if (task) task.pendingExceptionCount += 1;

  appendPdaOperLog({
    operType: '拆柜异常上报',
    operObject: containerNo,
    bizNo,
    operContent: `${typeLabel} · ${orderPart} · ${recognizePart} · ${remark} · 已附照片`
  });

  return {
    ok: true,
    message: '异常已上报',
    task: task ? cloneTask(task) : undefined
  };
}
