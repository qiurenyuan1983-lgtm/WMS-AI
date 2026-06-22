import { buildBatchTripOrderNo, buildLtlTripOrderNo } from '@/utils/oms/ltl-generate-trip-order';
import { getBestLtlSupplier, getLtlSupplierPortalUrl, matchLtlSuppliers } from '@/utils/oms/ltl-supplier-match';
import { MOCK_CARGO_ORDERS } from './oms-list-seed';
import {
  buildWorkbenchOrdersFromCargo,
  excludeWorkbenchOrder,
  mapCargoToWorkbenchRow,
  markCargoTripGenerated,
  setWorkbenchOverlay,
  type OrderWorkbenchPool,
  type OrderWorkbenchRow,
  type OrderWorkbenchStatus,
  type WorkbenchOverlay
} from './oms-order-workbench-sync';
import { assertCargoOutboundEligible } from './oms-golden-path';
import { createMergedTripOrderFromWorkbenchOrders, createTripOrderFromLtlWorkbench } from './oms';
import { linkPlatformAppointmentToTrip } from './oms-platform-appointment';
import { MOCK_OMS_SUPPLIERS } from './oms-supplier';
import { MOCK_CARGO_ORDERS } from './oms-list-seed';
import { validateWorkbenchGenerateTrip } from '@/utils/oms/order-workbench-rules';
import { mockPage } from '../utils';

function resolveSupplierName(supplierId?: CommonType.IdType | null) {
  if (!supplierId) return null;
  return MOCK_OMS_SUPPLIERS.find(item => String(item.id) === String(supplierId))?.supplierName ?? null;
}

export type { OrderWorkbenchPool, OrderWorkbenchRow, OrderWorkbenchStatus };

export type OrderWorkbenchCargoItem = {
  id: number;
  palletNo: string;
  cargoName: string;
  cartonQty: number;
  palletQty: number;
  weightLbs: number;
  volumeCbm: number;
  locationCode: string;
  status: string;
};

export type OrderWorkbenchLog = {
  id: number;
  time: string;
  operator: string;
  action: string;
  status: string;
};

export type OrderWorkbenchDetail = OrderWorkbenchRow & {
  contactName: string | null;
  contactPhone: string | null;
  warehouseAddress: string | null;
  loadingMethod: string | null;
  vehicleType: string | null;
  driverName: string | null;
  plateNo: string | null;
  supplierQuote: string | null;
  supplierProNo: string | null;
  emailSentTime: string | null;
  emailConfirmTime: string | null;
  cargoItems: OrderWorkbenchCargoItem[];
  logs: OrderWorkbenchLog[];
  ltl?: Api.Oms.LtlOrderExtension | null;
  local?: Api.Oms.LocalOrderExtension | null;
};

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

function findCargoById(id: CommonType.IdType) {
  return MOCK_CARGO_ORDERS.find(c => String(c.id) === String(id)) as Record<string, any> | undefined;
}

function getWorkbenchOrders() {
  return buildWorkbenchOrdersFromCargo();
}

function patchOrder(id: CommonType.IdType, patch: WorkbenchOverlay): OrderWorkbenchRow {
  setWorkbenchOverlay(Number(id), patch);
  return mapCargoToWorkbenchRow(findCargoById(id)!);
}

function findOrder(id: CommonType.IdType): OrderWorkbenchRow | undefined {
  return getWorkbenchOrders().find(r => String(r.id) === String(id));
}


function buildCargo(row: OrderWorkbenchRow): OrderWorkbenchCargoItem[] {
  if (row.cargoCount <= 0) return [];
  return Array.from({ length: Math.min(row.cargoCount, 6) }, (_, i) => ({
    id: row.id * 100 + i,
    palletNo: `PLT-${row.orderNo.slice(-4)}-${String(i + 1).padStart(2, '0')}`,
    cargoName: `\u8d27\u7269\u660e\u7ec6 ${i + 1}`,
    cartonQty: row.pool === 'EXPRESS' ? Math.ceil(row.cartonQty / row.cargoCount) : 0,
    palletQty: row.pool === 'EXPRESS' ? 0 : 1,
    weightLbs: row.weightLbs ? Math.round(row.weightLbs / row.cargoCount) : 800,
    volumeCbm: row.volumeCbm ? Number((row.volumeCbm / row.cargoCount).toFixed(2)) : 8.5,
    locationCode: `A0${i + 1}-0${i + 1}`,
    status: row.status === 'GENERATED' ? '\u5df2\u5173\u8054' : '\u5f85\u5173\u8054'
  }));
}

function buildLogs(row: OrderWorkbenchRow): OrderWorkbenchLog[] {
  const logs: OrderWorkbenchLog[] = [
    { id: 1, time: row.createTime, operator: '\u7cfb\u7edf', action: '\u8ba2\u5355\u521b\u5efa', status: '\u6210\u529f' }
  ];
  if (row.preTripNo) {
    logs.unshift({
      id: 2,
      time: nowStr(),
      operator: '\u7cfb\u7edf',
      action: `\u81ea\u52a8\u751f\u6210\u9884\u8f66\u6b21 ${row.preTripNo}`,
      status: '\u6210\u529f'
    });
  }
  if (row.customerConfirmed) {
    logs.unshift({
      id: 3,
      time: '2026-05-15 18:22:00',
      operator: row.customerName,
      action: '\u5ba2\u6237\u90ae\u4ef6\u786e\u8ba4\u51fa\u5e93',
      status: '\u6210\u529f'
    });
  }
  if (row.status === 'GENERATED') {
    logs.unshift({
      id: 4,
      time: '2026-05-16 10:00:00',
      operator: '\u5f20\u4e09',
      action: '\u751f\u6210\u6b63\u5f0f OMS \u8ba2\u5355',
      status: '\u6210\u529f'
    });
  }
  return logs;
}

const ORDER_SOURCE_LABEL: Record<string, string> = {
  CUSTOMER: '\u5ba2\u6237\u4e0b\u5355',
  IMPORT: '\u5ba2\u670d\u5bfc\u5165',
  EMAIL: '\u90ae\u4ef6\u8bc6\u522b',
  API: 'API\u540c\u6b65',
  MANUAL: '\u4eba\u5de5\u521b\u5efa'
};

function buildLtlContext(row: OrderWorkbenchRow) {
  return {
    originWarehouse: row.originWarehouse || 'LA',
    destination: row.destination,
    zipCode: row.zipCode,
    palletQty: row.palletQty || 1,
    weightLbs: row.weightLbs || row.palletQty * 1200,
    volumeCbm: row.volumeCbm || row.palletQty * 8,
    cargoType: row.cargoType || '\u666e\u8d27',
    urgency: (row.urgency as 'NORMAL' | 'URGENT') || 'NORMAL'
  };
}

function buildLtlExtension(row: OrderWorkbenchRow): Api.Oms.LtlOrderExtension | null {
  if (row.pool !== 'LTL') return null;
  const ctx = buildLtlContext(row);
  const candidates = matchLtlSuppliers(ctx);
  const selected =
    candidates.find(c => c.supplierId === row.selectedSupplierId) ||
    candidates.find(c => c.supplierName === row.supplierName) ||
    candidates[0] ||
    null;

  return {
    originWarehouse: ctx.originWarehouse,
    orderSource: row.orderSource || 'CUSTOMER',
    orderSourceLabel: ORDER_SOURCE_LABEL[row.orderSource || 'CUSTOMER'] || '\u5ba2\u6237\u4e0b\u5355',
    cargoType: row.cargoType || '\u666e\u8d27',
    urgency: row.urgency || 'NORMAL',
    zipCode: row.zipCode || null,
    consignee: {
      companyName: row.customerName,
      address: row.destination,
      contactName: 'Receiving Dept',
      contactPhone: '+1 214-555-8800',
      addressType: '\u5546\u4e1a\u5730\u5740',
      needAppointment: false,
      needLiftgate: Boolean(row.remark?.includes('\u5c3e\u677f')),
      residential: false,
      limitedAccess: false,
      receivingHours: 'Mon-Fri 08:00-17:00'
    },
    supplierCandidates: candidates,
    selectedSupplierId: selected?.supplierId ?? null,
    costBreakdown: selected
      ? {
          linehaul: selected.quoteAmount,
          liftgate: selected.liftgateFee,
          insurance: selected.insuranceFee,
          other: 0,
          total: selected.totalAmount
        }
      : null,
    orderMethod: row.orderMethod ?? null,
    supplierOrderPlaced: Boolean(row.supplierOrderPlaced),
    bolNo: row.bolNo ?? null,
    pickupTime: row.pickupTime ?? row.appointmentTime,
    estimatedDelivery: row.estimatedDelivery ?? null,
    supplierOrderMessage: row.supplierOrderPlaced
      ? `\u5df2\u5728 ${row.supplierName} \u4e0b\u5355\u6210\u529f\uff0cPRO\u53f7\uff1a${row.supplierProNo || '1234567890'}`
      : null
  };
}

function buildLocalExtension(row: OrderWorkbenchRow): Api.Oms.LocalOrderExtension | null {
  if (row.pool !== 'LOCAL') return null;
  return {
    outboundMethod: '\u5361\u8f66\u51fa\u5e93',
    specialRequirements: row.remark,
    deliveryAddress: row.destination,
    deliveryContact: 'John Smith',
    deliveryPhone: '+1 213-555-8800',
    needAppointment: false,
    customerConfirmSummary: row.customerConfirmed
      ? `\u90ae\u4ef6\u786e\u8ba4\uff0c${row.customerName} / John Smith`
      : null,
    customerConfirmTime: row.customerConfirmed ? '2026-05-15 18:22:00' : null,
    emailRecords: [
      {
        id: 1,
        subject: '\u8d27\u7269\u5230\u4ed3\u901a\u77e5 / \u51fa\u5e93\u786e\u8ba4\u90ae\u4ef6',
        recipient: 'john.manager@abctrading.com',
        sentTime: row.emailSentTime || '2026-05-15 17:00:00',
        status: '\u5df2\u53d1\u9001'
      }
    ],
    preTrip: row.preTripNo
      ? {
          preTripNo: row.preTripNo,
          vehicleType: '26ft Truck',
          palletQty: row.palletQty,
          weightLbs: row.weightLbs || 0,
          volumeCbm: row.volumeCbm || 0,
          dockNo: row.dockNo || 'DOCK-03',
          estDepartTime: row.appointmentTime,
          estArrivalTime: '2026-05-16 18:00'
        }
      : null
  };
}

function toDetail(row: OrderWorkbenchRow): OrderWorkbenchDetail {
  const ltl = buildLtlExtension(row);
  const local = buildLocalExtension(row);
  const ltlBest = ltl?.supplierCandidates.find(c => c.recommended);
  return {
    ...row,
    contactName: row.pool === 'LOCAL' ? 'John Smith' : ltl?.consignee?.contactName ?? null,
    contactPhone: row.pool === 'LOCAL' ? '+1 213-555-8800' : ltl?.consignee?.contactPhone ?? null,
    warehouseAddress:
      row.pool === 'PLATFORM' ? `${row.destination} FBA Warehouse, CA` : row.pool === 'LOCAL' ? 'LA Warehouse, CA' : null,
    loadingMethod: row.appointmentType,
    vehicleType: row.pool === 'LOCAL' ? '26ft Truck' : row.pool === 'LTL' ? '53ft Trailer' : null,
    driverName: row.dockNo ? 'John Smith' : null,
    plateNo: row.dockNo ? 'CA-8K2910' : null,
    supplierQuote: ltlBest ? `$${ltlBest.totalAmount.toLocaleString()}` : row.supplierName ? '$2,850.00' : null,
    supplierProNo: row.supplierProNo || (row.supplierOrderPlaced ? '1234567890' : null),
    emailSentTime: row.pool === 'LOCAL' ? '2026-05-15 17:00:00' : null,
    emailConfirmTime: row.customerConfirmed ? '2026-05-15 18:22:00' : null,
    cargoItems: buildCargo(row),
    logs: buildLogs(row),
    ltl,
    local
  };
}

function filterOrders(params?: Record<string, any>) {
  let list = getWorkbenchOrders();
  const pool = params?.pool as string | undefined;
  if (pool === 'AMAZON') {
    list = list.filter(r => r.pool === 'PLATFORM' && r.platform === 'Amazon');
  } else if (pool && pool !== 'ALL') {
    list = list.filter(r => r.pool === pool);
  }
  if (params?.status) list = list.filter(r => r.status === params.status);
  if (params?.orderType) list = list.filter(r => r.orderTypeLabel.includes(String(params.orderType)));
  if (params?.customerName) {
    const k = String(params.customerName).toLowerCase();
    list = list.filter(r => r.customerName.toLowerCase().includes(k));
  }
  if (params?.platform) {
    const kw = String(params.platform).toLowerCase();
    list = list.filter(r => (r.platform || '').toLowerCase().includes(kw));
  }
  if (params?.destination) {
    const k = String(params.destination).toLowerCase();
    list = list.filter(r => r.destination.toLowerCase().includes(k));
  }
  if (params?.orderNo) {
    const k = String(params.orderNo).toLowerCase();
    list = list.filter(r => r.orderNo.toLowerCase().includes(k));
  }
  if (params?.isaNo) {
    const k = String(params.isaNo).toLowerCase();
    list = list.filter(r => r.isaNo?.toLowerCase().includes(k));
  }
  if (params?.dwTime) {
    const k = String(params.dwTime).toLowerCase();
    list = list.filter(r => r.dwTime?.toLowerCase().includes(k));
  }
  const tab = params?.tab as string | undefined;
  if (tab === 'ABNORMAL') list = list.filter(r => r.status === 'ABNORMAL');
  else if (tab === 'PENDING_APPT') list = list.filter(r => r.status === 'PENDING_APPT');
  else if (tab === 'PENDING_MANUAL') list = list.filter(r => r.status === 'PENDING_MANUAL');
  else if (tab === 'PRE_TRIP') list = list.filter(r => r.status === 'PRE_TRIP');
  else if (tab === 'PENDING_CARGO') list = list.filter(r => r.status === 'PENDING_CARGO');
  else if (tab === 'PENDING_CUSTOMER') list = list.filter(r => r.status === 'PENDING_CUSTOMER');
  return list;
}

export function getOrderWorkbenchStats() {
  const all = getWorkbenchOrders();
  return {
    pendingGenerate: all.filter(r => r.status === 'PENDING_APPT').length,
    preTrip: all.filter(r => r.status === 'PRE_TRIP').length,
    pendingManual: all.filter(r => r.status === 'PENDING_MANUAL').length,
    pendingCustomer: all.filter(r => r.status === 'PENDING_CUSTOMER').length,
    generated: all.filter(r => r.status === 'GENERATED').length,
    abnormal: all.filter(r => r.status === 'ABNORMAL').length,
    poolCounts: {
      ALL: all.length,
      AMAZON: all.filter(r => r.pool === 'PLATFORM' && r.platform === 'Amazon').length,
      PLATFORM: all.filter(r => r.pool === 'PLATFORM').length,
      LTL: all.filter(r => r.pool === 'LTL').length,
      LOCAL: all.filter(r => r.pool === 'LOCAL').length,
      EXPRESS: all.filter(r => r.pool === 'EXPRESS').length
    },
    tabCounts: {
      ALL: all.length,
      PENDING_APPT: all.filter(r => r.status === 'PENDING_APPT').length,
      PRE_TRIP: all.filter(r => r.status === 'PRE_TRIP').length,
      PENDING_MANUAL: all.filter(r => r.status === 'PENDING_MANUAL').length,
      PENDING_CARGO: all.filter(r => r.status === 'PENDING_CARGO').length,
      PENDING_CUSTOMER: all.filter(r => r.status === 'PENDING_CUSTOMER').length,
      GENERATED: all.filter(r => r.status === 'GENERATED').length,
      ABNORMAL: all.filter(r => r.status === 'ABNORMAL').length
    }
  };
}

export function getOrderWorkbenchList(params?: Record<string, any>) {
  return mockPage(filterOrders(params), params);
}

export function getOrderWorkbenchDetail(id: CommonType.IdType) {
  const row = findOrder(id);
  return row ? toDetail(row) : null;
}

export function executeOrderWorkbenchAction(
  id: CommonType.IdType,
  action: string,
  extra?: Record<string, any>
): Api.Oms.OrderWorkbenchActionResult {
  const row = findOrder(id);
  if (!row) return { success: false, message: '\u8ba2\u5355\u4e0d\u5b58\u5728' };

  switch (action) {
    case 'autoPreTrip': {
      const preTripNo =
        row.preTripNo || (row.pool === 'LTL' ? `PORD${Date.now().toString().slice(-8)}` : `PTRIP${Date.now().toString().slice(-8)}`);
      const dockNo = row.dockNo || (row.pool === 'PLATFORM' || row.pool === 'LOCAL' ? 'DOCK-03' : null);
      const updated = patchOrder(id, {
        preTripNo,
        dockNo,
        status: 'PRE_TRIP',
        workflowStep: Math.max(row.workflowStep, 2)
      });
      return { success: true, message: `\u5df2\u751f\u6210\u9884\u8f66\u6b21 ${preTripNo}`, row: updated };
    }

    case 'manualConfirm': {
      const updated = patchOrder(id, {
        status: 'PENDING_CARGO',
        workflowStep: Math.max(row.workflowStep, 4)
      });
      return { success: true, message: '\u4eba\u5de5\u786e\u8ba4\u5b8c\u6210', row: updated };
    }

    case 'addCargo': {
      const updated = patchOrder(id, {
        cargoCount: Math.max(row.cargoCount, row.palletQty || row.cartonQty || 1),
        status: row.status === 'PENDING_CARGO' ? 'PENDING_MANUAL' : row.status,
        workflowStep: Math.max(row.workflowStep, row.pool === 'LOCAL' ? 3 : 5)
      });
      return { success: true, message: '\u8d27\u7269\u5df2\u6dfb\u52a0\uff08\u539f\u578b\uff09', row: updated };
    }

    case 'generateOrder': {
      if (row.pool === 'LTL') {
        if (!row.supplierName) {
          return { success: false, message: '\u8bf7\u5148\u5339\u914d\u4f9b\u5e94\u5546\u5e76\u5b8c\u6210\u4e0b\u5355' };
        }
        if (row.generatedTripNo) {
          return {
            success: false,
            message: `\u8be5\u8ba2\u5355\u5df2\u751f\u6210\u8f66\u6b21 ${row.generatedTripNo}`,
            tripOrderPreview: {
              tripNo: row.generatedTripNo,
              orderNo: row.orderNo,
              supplierName: row.supplierName,
              palletQty: row.palletQty
            }
          };
        }
        const tripNo = buildLtlTripOrderNo(row.id);
        createTripOrderFromLtlWorkbench(row, tripNo);
        markCargoTripGenerated(id, tripNo);
        const preview = {
          tripNo,
          orderNo: row.orderNo,
          supplierName: row.supplierName,
          palletQty: row.palletQty
        };
        return {
          success: true,
          message: `\u5df2\u751f\u6210\u8f66\u6b21\u8ba2\u5355 ${tripNo}\uff0c\u53ef\u5728\u8f66\u6b21\u8ba2\u5355\u5217\u8868\u67e5\u770b`,
          row: { ...row, generatedTripNo: tripNo, status: 'GENERATED', workflowStep: 6 },
          tripOrderPreview: preview
        };
      }
      excludeWorkbenchOrder(id);
      return {
        success: true,
        message: '\u6b63\u5f0f OMS \u8ba2\u5355\u5df2\u751f\u6210',
        row: {
          ...row,
          status: 'GENERATED',
          workflowStep: row.pool === 'LOCAL' ? 4 : 6
        }
      };
    }

    case 'pushWms': {
      const updated = patchOrder(id, { workflowStep: Math.max(row.workflowStep, 7) });
      return { success: true, message: '\u5df2\u63a8\u9001 WMS \u751f\u6210\u5907\u8d27/\u88c5\u8f66\u4efb\u52a1', row: updated };
    }

    case 'pushTms':
      return { success: true, message: '\u5df2\u63a8\u9001 TMS \u751f\u6210\u8fd0\u8f93\u4efb\u52a1', row };

    case 'sendCustomerEmail':
      if (row.pool !== 'LOCAL') return { success: false, message: '\u4ec5\u672c\u5730/\u5546\u4e1a\u5730\u5740\u8ba2\u5355\u652f\u6301' };
      return {
        success: true,
        message: '\u5ba2\u6237\u786e\u8ba4\u90ae\u4ef6\u5df2\u53d1\u9001',
        row: patchOrder(id, { status: 'PENDING_CUSTOMER' })
      };

    case 'confirmCustomer': {
      const preTripNo = row.preTripNo || `PTRIP${Date.now().toString().slice(-8)}`;
      const updated = patchOrder(id, {
        customerConfirmed: true,
        preTripNo,
        dockNo: 'DOCK-03',
        status: 'PRE_TRIP',
        workflowStep: 2
      });
      return { success: true, message: '\u5ba2\u6237\u5df2\u786e\u8ba4\uff0c\u7cfb\u7edf\u751f\u6210\u9884\u8f66\u6b21', row: updated };
    }

    case 'autoMatchSupplier': {
      if (row.pool !== 'LTL') return { success: false, message: '\u4ec5 LTL \u8ba2\u5355\u652f\u6301' };
      const best = getBestLtlSupplier(buildLtlContext(row));
      if (!best) return { success: false, message: '\u672a\u627e\u5230\u53ef\u7528\u4f9b\u5e94\u5546' };
      const updated = patchOrder(id, {
        supplierName: best.supplierName,
        selectedSupplierId: best.supplierId,
        preTripNo: row.preTripNo || `PORD${Date.now().toString().slice(-8)}`,
        status: 'PRE_TRIP',
        workflowStep: Math.max(row.workflowStep, 2)
      });
      return { success: true, message: `\u5df2\u81ea\u52a8\u5339\u914d\u4f9b\u5e94\u5546\uff1a${best.supplierName}`, row: updated };
    }

    case 'placeSupplierOrder': {
      if (row.pool !== 'LTL') return { success: false, message: '\u4ec5 LTL \u8ba2\u5355\u652f\u6301' };
      const method = (extra?.orderMethod as 'API' | 'RPA' | 'MANUAL') || 'API';
      let supplierName = row.supplierName;
      let selectedSupplierId = row.selectedSupplierId;
      const supplierId = extra?.selectedSupplierId ?? row.selectedSupplierId;
      if (supplierId) {
        const candidates = matchLtlSuppliers(buildLtlContext(row));
        const picked = candidates.find(c => c.supplierId === Number(supplierId));
        if (!picked) return { success: false, message: '\u8bf7\u5148\u9009\u62e9\u6709\u6548\u4f9b\u5e94\u5546' };
        selectedSupplierId = picked.supplierId;
        supplierName = picked.supplierName;
      }
      if (!supplierName) return { success: false, message: '\u8bf7\u5148\u5339\u914d\u4f9b\u5e94\u5546' };
      const portalUrl = getLtlSupplierPortalUrl(selectedSupplierId);
      const supplierProNo =
        method !== 'MANUAL' ? row.supplierProNo || `${Math.floor(1000000000 + Math.random() * 9000000000)}` : row.supplierProNo;
      const updated = patchOrder(id, {
        selectedSupplierId,
        supplierName,
        orderMethod: method,
        supplierOrderPlaced: method !== 'MANUAL',
        supplierProNo: supplierProNo ?? null,
        bolNo: method !== 'MANUAL' ? row.bolNo || `BOL-${row.orderNo.slice(-6)}` : row.bolNo,
        pickupTime: method !== 'MANUAL' ? row.pickupTime || row.appointmentTime : row.pickupTime,
        estimatedDelivery: method !== 'MANUAL' ? row.estimatedDelivery || '2026-05-20' : row.estimatedDelivery,
        status: 'PENDING_MANUAL',
        workflowStep: Math.max(row.workflowStep, 4)
      });
      const msg =
        method === 'MANUAL'
          ? portalUrl
            ? `\u5df2\u6253\u5f00 ${supplierName} \u4e0b\u5355\u7f51\u9875\uff0c\u8bf7\u4eba\u5de5\u5b8c\u6210\u4e0b\u5355`
            : '\u8be5\u4f9b\u5e94\u5546\u672a\u914d\u7f6e\u4e0b\u5355\u7f51\u5740'
          : `\u5df2\u5728 ${supplierName} \u4e0b\u5355\u6210\u529f\uff0cPRO\u53f7\uff1a${updated.supplierProNo}`;
      return {
        success: method !== 'MANUAL' || Boolean(portalUrl),
        message: msg,
        row: updated,
        portalUrl: method === 'MANUAL' ? portalUrl : null
      };
    }

    case 'rematchSupplier': {
      if (row.pool !== 'LTL') return { success: false, message: '\u4ec5 LTL \u8ba2\u5355\u652f\u6301' };
      const list = matchLtlSuppliers(buildLtlContext(row));
      const currentIdx = list.findIndex(c => c.supplierId === row.selectedSupplierId);
      const next = list[(currentIdx + 1) % list.length] || list[0];
      if (!next) return { success: false, message: '\u65e0\u53ef\u7528\u4f9b\u5e94\u5546' };
      const updated = patchOrder(id, {
        supplierName: next.supplierName,
        selectedSupplierId: next.supplierId,
        supplierOrderPlaced: false,
        supplierProNo: null
      });
      return { success: true, message: `\u5df2\u91cd\u65b0\u5339\u914d\u4f9b\u5e94\u5546\uff1a${next.supplierName}`, row: updated };
    }

    case 'markAbnormal':
      return { success: true, message: '\u5df2\u6807\u8bb0\u5f02\u5e38', row: patchOrder(id, { status: 'ABNORMAL' }) };

    case 'cancel':
      excludeWorkbenchOrder(id);
      return { success: true, message: '\u8ba2\u5355\u5df2\u53d6\u6d88' };

    default:
      return { success: false, message: '\u672a\u77e5\u64cd\u4f5c' };
  }
}

export function batchOrderWorkbenchAction(ids: CommonType.IdType[], action: string) {
  const results = ids.map(id => executeOrderWorkbenchAction(id, action));
  const ok = results.filter(r => r.success).length;
  return { success: ok > 0, message: `\u6279\u91cf\u64cd\u4f5c\u5b8c\u6210\uff1a${ok}/${ids.length}`, count: ok };
}

export function batchGenerateTrip(
  ids: CommonType.IdType[],
  payload: Api.Oms.OrderWorkbenchBatchGenerateTripParams = {}
): Api.Oms.OrderWorkbenchBatchGenerateTripResult {
  if (!ids?.length) return { success: false, message: '\u8bf7\u9009\u62e9\u8ba2\u5355' };
  const rows = ids.map(id => findOrder(id)).filter(Boolean) as OrderWorkbenchRow[];
  if (rows.length !== ids.length) return { success: false, message: '\u90e8\u5206\u8ba2\u5355\u4e0d\u5b58\u5728' };

  const cargoById = new Map(
    MOCK_CARGO_ORDERS.map(cargo => [String(cargo.id), cargo as Record<string, any>])
  );
  const validation = validateWorkbenchGenerateTrip(rows, cargoById);
  if (!validation.ok) {
    return { success: false, message: validation.message || '\u751f\u6210\u8f66\u6b21\u5931\u8d25' };
  }

  try {
    assertCargoOutboundEligible(rows.map(row => row.id));
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : '\u8ba2\u5355\u4e0d\u53ef\u51fa\u5e93' };
  }

  const pool = rows[0].pool;
  const tripNo = buildBatchTripOrderNo(rows.map(row => row.id));
  const tripPatch = {
    supplierId: payload.supplierId ?? null,
    supplierQuoteId: payload.supplierQuoteId ?? null,
    deliveryCost: payload.deliveryCost ?? null,
    appointmentNo: payload.appointmentNo ?? null,
    appointmentTime: payload.appointmentTime ?? null,
    pickupTime: payload.pickupTime ?? null,
    loadingType: payload.loadingType ?? 'PALLET',
    supplierName:
      resolveSupplierName(payload.supplierId) ?? rows.find(row => row.supplierName)?.supplierName ?? null
  };

  createMergedTripOrderFromWorkbenchOrders(rows, tripNo, pool, tripPatch);

  if (payload.appointmentId) {
    linkPlatformAppointmentToTrip(payload.appointmentId, tripNo);
  }

  rows.forEach(row =>
    markCargoTripGenerated(row.id, tripNo, {
      appointmentNo: tripPatch.appointmentNo,
      appointmentTime: tripPatch.appointmentTime,
      pickupTime: tripPatch.pickupTime,
      loadingType: tripPatch.loadingType,
      deliveryCost: tripPatch.deliveryCost,
      supplierName: tripPatch.supplierName
    })
  );

  const totalPalletQty = rows.reduce((sum, row) => sum + (row.palletQty || 0), 0);
  return {
    success: true,
    message:
      rows.length === 1
        ? `\u5df2\u751f\u6210\u8f66\u6b21\u8ba2\u5355 ${tripNo}\uff0c\u53ef\u5728\u8f66\u6b21\u8ba2\u5355\u5217\u8868\u67e5\u770b`
        : `\u5df2\u5408\u5e76 ${rows.length} \u4e2a\u8ba2\u5355\u751f\u6210\u8f66\u6b21 ${tripNo}\uff0c\u53ef\u5728\u8f66\u6b21\u8ba2\u5355\u5217\u8868\u67e5\u770b`,
    tripNo,
    orderNos: rows.map(row => row.orderNo),
    count: rows.length,
    totalPalletQty,
    pool
  };
}
