import { getSupplierContainerOpList } from './oms-supplier-container-op';
import { mockPage } from '../utils';

const CONTAINER_STATUS_TO_TASK: Record<string, Api.Tms.SupplierTaskStatus> = {
  PICKUP_APPOINTED: 'PENDING_ACCEPT',
  PICKED_UP: 'IN_TRANSIT',
  ARRIVED_WAREHOUSE: 'CHECKED_IN',
  DEVANNING: 'EXECUTING',
  DEVANNED: 'EXECUTING',
  EMPTY_RETURNED: 'COMPLETED',
  COMPLETED: 'COMPLETED'
};

const EXTRA_TASKS: Api.Tms.SupplierTaskRow[] = [
  {
    id: 90001,
    taskNo: 'ST-20260606-001',
    taskType: 'warehouse_load_checkin',
    supplierId: 12,
    supplierName: 'West Coast Linehaul LLC',
    driverId: 101,
    driverName: 'Mike Johnson',
    driverPhone: '+1 310-555-0101',
    vehicleNo: 'CA-TRK-8821',
    relatedContainerNo: null,
    relatedTripNo: 'TR-20260606-018',
    relatedOrderNo: 'OUT-20260606-112',
    appointmentNo: null,
    taskStatus: 'PENDING_ACCEPT',
    gpsStatus: 'OFF',
    checkinStatus: 'PENDING',
    bolUploadStatus: 'PENDING',
    podUploadStatus: 'PENDING',
    exceptionFlag: false,
    plannedTime: '2026-06-06 14:00:00',
    actualTime: null,
    eta: '2026-06-06 13:45:00',
    remark: null,
    sourceType: 'trip',
    sourceId: null
  },
  {
    id: 90002,
    taskNo: 'ST-20260606-002',
    taskType: 'delivery_appointment_checkin',
    supplierId: 12,
    supplierName: 'West Coast Linehaul LLC',
    driverId: 101,
    driverName: 'Mike Johnson',
    driverPhone: '+1 310-555-0101',
    vehicleNo: 'CA-TRK-8821',
    relatedContainerNo: null,
    relatedTripNo: 'TR-20260606-018',
    relatedOrderNo: 'OUT-20260606-112',
    appointmentNo: 'ISA-8844221',
    taskStatus: 'IN_TRANSIT',
    gpsStatus: 'TRACKING',
    checkinStatus: 'PENDING',
    bolUploadStatus: 'UPLOADED',
    podUploadStatus: 'PENDING',
    exceptionFlag: false,
    plannedTime: '2026-06-07 09:00:00',
    actualTime: null,
    eta: '2026-06-07 08:40:00',
    remark: 'LAX9 预约送仓',
    sourceType: 'trip',
    sourceId: null
  },
  {
    id: 90003,
    taskNo: 'ST-20260605-003',
    taskType: 'warehouse_load_checkin',
    supplierId: 15,
    supplierName: 'Pacific Drayage Co.',
    driverId: 205,
    driverName: 'Carlos Ruiz',
    driverPhone: '+1 562-555-0202',
    vehicleNo: 'CA-DRY-3309',
    relatedContainerNo: null,
    relatedTripNo: 'TR-20260605-006',
    relatedOrderNo: 'OUT-20260605-088',
    appointmentNo: null,
    taskStatus: 'EXCEPTION',
    gpsStatus: 'INTERRUPTED',
    checkinStatus: 'REJECTED',
    bolUploadStatus: 'PENDING',
    podUploadStatus: 'PENDING',
    exceptionFlag: true,
    plannedTime: '2026-06-05 16:00:00',
    actualTime: null,
    eta: null,
    remark: '车牌信息不匹配',
    sourceType: 'trip',
    sourceId: null
  },
  {
    id: 90004,
    taskNo: 'ST-20260604-004',
    taskType: 'customer_pickup',
    supplierId: 18,
    supplierName: 'SoCal LTL Express',
    driverId: 308,
    driverName: 'Amy Chen',
    driverPhone: '+1 714-555-0303',
    vehicleNo: 'CA-LTL-7712',
    relatedContainerNo: null,
    relatedTripNo: null,
    relatedOrderNo: 'CO-20260604-045',
    appointmentNo: 'PU-20260604',
    taskStatus: 'COMPLETED',
    gpsStatus: 'DEPARTED',
    checkinStatus: 'APPROVED',
    bolUploadStatus: 'APPROVED',
    podUploadStatus: 'UPLOADED',
    exceptionFlag: false,
    plannedTime: '2026-06-04 10:00:00',
    actualTime: '2026-06-04 10:18:00',
    eta: null,
    remark: null,
    sourceType: 'order',
    sourceId: null
  }
];

function mapContainerRowToTask(row: Record<string, any>): Api.Tms.SupplierTaskRow {
  const status = CONTAINER_STATUS_TO_TASK[row.containerStatus] || 'PENDING_ACCEPT';
  return {
    id: Number(row.id),
    taskNo: `ST-CNT-${row.containerOrderNo || row.id}`,
    taskType: 'container_pickup',
    supplierId: row.drayageVendorId ?? null,
    supplierName: row.drayageVendorName ?? null,
    driverId: null,
    driverName: row.driverName ?? null,
    driverPhone: row.driverPhone ?? null,
    vehicleNo: row.plateNo ?? null,
    relatedContainerNo: row.containerNo ?? null,
    relatedTripNo: null,
    relatedOrderNo: row.containerOrderNo ?? null,
    appointmentNo: row.pickupAppointmentNo ?? null,
    taskStatus: status,
    gpsStatus: status === 'IN_TRANSIT' ? 'TRACKING' : status === 'CHECKED_IN' ? 'IN_FENCE' : 'OFF',
    checkinStatus:
      status === 'CHECKED_IN' || status === 'COMPLETED'
        ? 'APPROVED'
        : status === 'IN_TRANSIT'
          ? 'PENDING'
          : 'PENDING',
    bolUploadStatus: 'PENDING',
    podUploadStatus: 'PENDING',
    exceptionFlag: false,
    plannedTime: row.pickupAppointmentTime ?? row.requiredArrivalTime ?? row.eta ?? null,
    actualTime: row.actualArrivalTime ?? row.actualPickupTime ?? null,
    eta: row.expectedArrivalTime ?? null,
    remark: row.terminalName ? `码头 ${row.terminalName}` : null,
    sourceType: 'container_order',
    sourceId: row.id
  };
}

function buildAllTasks(): Api.Tms.SupplierTaskRow[] {
  const containerResult = getSupplierContainerOpList({ pageNum: 1, pageSize: 500 });
  const containerTasks = (containerResult.rows || []).map((row: Record<string, any>) => mapContainerRowToTask(row));
  return [...containerTasks, ...EXTRA_TASKS];
}

function filterTasks(params?: Api.Tms.SupplierTaskSearchParams) {
  let list = buildAllTasks();

  if (params?.taskType) {
    list = list.filter(row => row.taskType === params.taskType);
  }
  if (params?.taskStatus) {
    list = list.filter(row => row.taskStatus === params.taskStatus);
  }
  if (params?.exceptionFlag === true) {
    list = list.filter(row => row.exceptionFlag);
  }
  if (params?.supplierName) {
    const kw = String(params.supplierName).toLowerCase();
    list = list.filter(row => row.supplierName && row.supplierName.toLowerCase().includes(kw));
  }
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    list = list.filter(row =>
      [
        row.taskNo,
        row.supplierName,
        row.driverName,
        row.vehicleNo,
        row.relatedContainerNo,
        row.relatedTripNo,
        row.relatedOrderNo,
        row.appointmentNo
      ].some(v => v && String(v).toLowerCase().includes(kw))
    );
  }
  return list;
}

export function getSupplierTaskList(params?: Api.Tms.SupplierTaskSearchParams) {
  return mockPage(filterTasks(params), params);
}

export function getSupplierTaskStatusCount(params?: Api.Tms.SupplierTaskSearchParams) {
  const list = filterTasks({ ...params, taskType: null, taskStatus: null });
  const typeMap: Record<string, number> = {};
  const statusMap: Record<string, number> = {};
  list.forEach(row => {
    typeMap[row.taskType] = (typeMap[row.taskType] || 0) + 1;
    statusMap[row.taskStatus] = (statusMap[row.taskStatus] || 0) + 1;
  });
  return { typeMap, statusMap, total: list.length };
}

export function getSupplierTaskSummary() {
  const list = buildAllTasks();
  return {
    todayTotal: list.length,
    pendingAccept: list.filter(r => r.taskStatus === 'PENDING_ACCEPT').length,
    inProgress: list.filter(r => ['ACCEPTED', 'IN_TRANSIT', 'ARRIVED', 'EXECUTING', 'WAITING'].includes(r.taskStatus)).length,
    checkedIn: list.filter(r => r.taskStatus === 'CHECKED_IN').length,
    exception: list.filter(r => r.exceptionFlag || r.taskStatus === 'EXCEPTION').length,
    pendingBol: list.filter(r => r.bolUploadStatus === 'PENDING').length,
    pendingPod: list.filter(r => r.podUploadStatus === 'PENDING').length
  };
}
