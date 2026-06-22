import { MOCK_CONTAINER_ORDERS } from './oms-list-seed';
import { MOCK_OMS_SUPPLIERS } from './oms-supplier';
import { mockPage, nextId } from '../utils';

const SUPPLIER_OP_STATUSES = new Set([
  'PICKUP_APPOINTED',
  'PICKED_UP',
  'ARRIVED_WAREHOUSE',
  'DEVANNING',
  'DEVANNED',
  'EMPTY_RETURNED',
  'COMPLETED'
]);

const DRAYAGE_SUPPLIERS = MOCK_OMS_SUPPLIERS.filter(s => s.supplierType === 'DRAYAGE');

type FeeBundle = Api.Oms.SupplierContainerFeeBundle;

const feeStore = new Map<string, FeeBundle>();

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function initFeeStore() {
  if (feeStore.size) return;
  MOCK_CONTAINER_ORDERS.forEach((row, index) => {
    const r = row as Record<string, any>;
    if (!r.drayageVendorName && index % 3 !== 0) return;
    if (!SUPPLIER_OP_STATUSES.has(r.containerStatus)) return;
    const auditStatus = index % 5 === 0 ? 'PENDING' : index % 5 === 1 ? 'REJECTED' : index % 5 === 2 ? 'APPROVED' : 'PENDING';
    const pickupFee = 350 + (index % 4) * 50;
    const detentionFee = index % 4 === 0 ? 120 : 0;
    feeStore.set(String(r.id), {
      pickupFee,
      detentionFee,
      chassisFee: 80,
      portFee: 45,
      exceptionFee: index % 7 === 0 ? 200 : 0,
      emptyReturnFee: 60,
      otherFee: 0,
      feeRemark: index % 7 === 0 ? '码头等候产生异常费用' : null,
      feeTotal: pickupFee + detentionFee + 80 + 45 + (index % 7 === 0 ? 200 : 0) + 60,
      auditStatus,
      auditRemark: auditStatus === 'REJECTED' ? '异常费用需补充凭证' : null,
      auditTime: auditStatus === 'APPROVED' ? '2026-06-05 16:30:00' : null,
      auditorName: auditStatus === 'APPROVED' ? '财务-王敏' : null,
      submitTime: '2026-06-05 10:00:00',
      submitterName: r.drayageVendorName || '供应商操作员'
    });
  });
}

function ensureDrayageVendor(row: Record<string, any>, index: number) {
  if (!row.drayageVendorId) {
    const supplier = DRAYAGE_SUPPLIERS[index % DRAYAGE_SUPPLIERS.length];
    row.drayageVendorId = supplier.id;
    row.drayageVendorName = supplier.supplierName;
  }
}

function enrichOpRow(row: Record<string, any>, index: number) {
  ensureDrayageVendor(row, index);
  initFeeStore();
  const fee = feeStore.get(String(row.id));
  return {
    ...row,
    recommendedDwTime: row.recommendedDwTime ?? '2026/06/28-2026/06/30',
    feeAuditStatus: fee?.auditStatus || 'NONE',
    feeTotal: fee?.feeTotal ?? null,
    lastSupplierSyncTime: row.lastSupplierSyncTime ?? null
  };
}

function filterOpList(params?: Record<string, any>) {
  initFeeStore();
  let list = MOCK_CONTAINER_ORDERS.map((row, index) => enrichOpRow(row as Record<string, any>, index)).filter(row =>
    SUPPLIER_OP_STATUSES.has(row.containerStatus)
  );

  if (params?.drayageVendorId) {
    list = list.filter(row => String(row.drayageVendorId) === String(params.drayageVendorId));
  }
  if (params?.containerStatus) {
    list = list.filter(row => row.containerStatus === params.containerStatus);
  }
  if (params?.feeAuditStatus) {
    list = list.filter(row => (row.feeAuditStatus || 'NONE') === params.feeAuditStatus);
  }
  if (params?.containerNo) {
    const kw = String(params.containerNo).toLowerCase();
    list = list.filter(row => row.containerNo && String(row.containerNo).toLowerCase().includes(kw));
  }
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    list = list.filter(row =>
      [row.containerOrderNo, row.containerNo, row.customerName, row.drayageVendorName].some(
        v => v && String(v).toLowerCase().includes(kw)
      )
    );
  }
  return list;
}

export function getSupplierContainerOpList(params?: Record<string, any>) {
  return mockPage(filterOpList(params), params);
}

export function getSupplierContainerOpStatusCount(params?: Record<string, any>) {
  const list = filterOpList({ ...params, containerStatus: null, feeAuditStatus: null });
  const map: Record<string, number> = {};
  list.forEach(row => {
    const key = row.containerStatus || 'UNKNOWN';
    map[key] = (map[key] || 0) + 1;
  });
  return map;
}

export function getSupplierContainerOpDetail(id: CommonType.IdType) {
  initFeeStore();
  const row = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === String(id)) as Record<string, any> | undefined;
  if (!row) return null;
  const index = MOCK_CONTAINER_ORDERS.indexOf(row as (typeof MOCK_CONTAINER_ORDERS)[number]);
  ensureDrayageVendor(row, Math.max(0, index));
  const fee = feeStore.get(String(id)) || createEmptyFeeBundle();
  return {
    ...row,
    recommendedDwTime: row.recommendedDwTime ?? '2026/06/28-2026/06/30',
    traces: row.traces || [],
    supplierFee: fee
  };
}

function createEmptyFeeBundle(): FeeBundle {
  return {
    pickupFee: null,
    detentionFee: null,
    chassisFee: null,
    portFee: null,
    exceptionFee: null,
    emptyReturnFee: null,
    otherFee: null,
    feeRemark: null,
    feeTotal: null,
    auditStatus: 'NONE',
    auditRemark: null,
    auditTime: null,
    auditorName: null,
    submitTime: null,
    submitterName: null
  };
}

function calcFeeTotal(fee: FeeBundle) {
  return [fee.pickupFee, fee.detentionFee, fee.chassisFee, fee.portFee, fee.exceptionFee, fee.emptyReturnFee, fee.otherFee]
    .map(v => Number(v || 0))
    .reduce((sum, n) => sum + n, 0);
}

function appendTrace(row: Record<string, any>, statusFrom: string | null, statusTo: string, actionDesc: string, remark?: string | null) {
  const traces = Array.isArray(row.traces) ? [...row.traces] : [];
  traces.unshift({
    id: nextId(),
    statusFrom,
    statusTo,
    action: 'SUPPLIER_CONTAINER_OP',
    actionDesc,
    operatorName: '供应商操作',
    remark: remark || null,
    createTime: nowStr()
  });
  row.traces = traces;
}

function inferStatus(row: Record<string, any>) {
  if (row.emptyReturnTime) return 'EMPTY_RETURNED';
  if (row.devanningFinishTime) return 'DEVANNED';
  if (row.devanningStartTime) return 'DEVANNING';
  if (row.actualArrivalTime) return 'ARRIVED_WAREHOUSE';
  if (row.actualPickupTime) return 'PICKED_UP';
  if (row.pickupAppointmentTime) return 'PICKUP_APPOINTED';
  return row.containerStatus;
}

const TIME_FIELDS = [
  'pickupAppointmentNo',
  'pickupAppointmentTime',
  'actualPickupTime',
  'pickupRemark',
  'expectedArrivalTime',
  'requiredArrivalTime',
  'actualArrivalTime',
  'containerLocation',
  'arrivalRemark',
  'expectedDevanningTime',
  'devanningAppointmentTime',
  'devanningStartTime',
  'devanningFinishTime',
  'devanningMethod',
  'loadingType',
  'devanningRemark',
  'emptyReturnLocation',
  'emptyReturnAppointmentNo',
  'emptyReturnTime',
  'emptyReturnStatus',
  'emptyReturnRemark'
] as const;

const INFO_FIELDS = [
  'containerNo',
  'containerType',
  'sealNo',
  'vesselName',
  'voyageNo',
  'mblNo',
  'hblNo',
  'terminalName',
  'eta',
  'ata',
  'pickupLfd',
  'emptyReturnLfd',
  'terminalReleaseStatus',
  'remark'
] as const;

export function syncSupplierContainerOp(body: Record<string, any>) {
  const id = body.id;
  const row = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === String(id)) as Record<string, any> | undefined;
  if (!row) throw new Error('海柜订单不存在');

  const oldStatus = row.containerStatus;
  [...INFO_FIELDS, ...TIME_FIELDS].forEach(key => {
    if (body[key] !== undefined) row[key] = body[key];
  });

  const newStatus = inferStatus(row);
  if (newStatus && newStatus !== oldStatus) {
    row.containerStatus = newStatus;
    row.status = newStatus;
    appendTrace(row, oldStatus, newStatus, '供应商同步时间节点', body.syncRemark || null);
  } else if (body.syncRemark) {
    appendTrace(row, oldStatus, oldStatus, '供应商更新海柜信息', body.syncRemark);
  }

  row.lastSupplierSyncTime = nowStr();
  row.updateTime = nowStr();
  return getSupplierContainerOpDetail(id);
}

export function saveSupplierContainerFees(body: Record<string, any>) {
  const id = body.containerOrderId || body.id;
  const row = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === String(id));
  if (!row) throw new Error('海柜订单不存在');

  initFeeStore();
  const prev = feeStore.get(String(id)) || createEmptyFeeBundle();
  const next: FeeBundle = {
    ...prev,
    pickupFee: body.pickupFee ?? prev.pickupFee,
    detentionFee: body.detentionFee ?? prev.detentionFee,
    chassisFee: body.chassisFee ?? prev.chassisFee,
    portFee: body.portFee ?? prev.portFee,
    exceptionFee: body.exceptionFee ?? prev.exceptionFee,
    emptyReturnFee: body.emptyReturnFee ?? prev.emptyReturnFee,
    otherFee: body.otherFee ?? prev.otherFee,
    feeRemark: body.feeRemark ?? prev.feeRemark,
    feeTotal: calcFeeTotal({
      ...prev,
      ...body
    } as FeeBundle),
    auditStatus: 'PENDING',
    auditRemark: null,
    auditTime: null,
    auditorName: null,
    submitTime: nowStr(),
    submitterName: body.submitterName || '供应商操作员'
  };
  feeStore.set(String(id), next);

  const r = row as Record<string, any>;
  appendTrace(r, r.containerStatus, r.containerStatus, '供应商提交费用待审核', body.feeRemark || null);
  r.lastSupplierSyncTime = nowStr();
  return getSupplierContainerOpDetail(id);
}

export function auditSupplierContainerFees(body: Record<string, any>) {
  const id = body.containerOrderId || body.id;
  const row = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === String(id)) as Record<string, any> | undefined;
  if (!row) throw new Error('海柜订单不存在');

  initFeeStore();
  const fee = feeStore.get(String(id));
  if (!fee) throw new Error('费用记录不存在');

  const auditStatus = body.auditStatus as FeeBundle['auditStatus'];
  if (!auditStatus || !['APPROVED', 'REJECTED'].includes(auditStatus)) {
    throw new Error('无效的审核状态');
  }

  fee.auditStatus = auditStatus;
  fee.auditRemark = body.auditRemark || null;
  fee.auditTime = nowStr();
  fee.auditorName = body.auditorName || '财务审核';
  feeStore.set(String(id), fee);

  appendTrace(
    row,
    row.containerStatus,
    row.containerStatus,
    auditStatus === 'APPROVED' ? '费用审核通过' : '费用审核驳回',
    body.auditRemark || null
  );
  row.lastSupplierSyncTime = nowStr();
  return getSupplierContainerOpDetail(id);
}

export function updateContainerOrderMock(body: Record<string, any>) {
  return syncSupplierContainerOp(body);
}

export function updateContainerOrderStatusMock(id: CommonType.IdType, body: Record<string, any>) {
  const row = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === String(id)) as Record<string, any> | undefined;
  if (!row) throw new Error('海柜订单不存在');
  const oldStatus = row.containerStatus;
  const targetStatus = body.targetStatus;
  if (!targetStatus) throw new Error('目标状态不能为空');
  row.containerStatus = targetStatus;
  row.status = targetStatus;
  appendTrace(row, oldStatus, targetStatus, '状态变更', body.remark || null);
  row.updateTime = nowStr();
  return true;
}
