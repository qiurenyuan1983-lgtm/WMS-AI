import { MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = {
  tenantId: '000000',
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-06-01 10:00:00'
};

export const MOCK_INBOUND_ORDERS = [
  {
    id: 71001,
    ...base,
    inboundNo: 'IN-2026-0001',
    palletNo: 'PLT-IN-2026-001',
    containerNo: 'MSCU1234567',
    groupCode: 'FedEx-LAX',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    boxQty: 40,
    weight: 520,
    recommendLocation: 'A-02-03',
    status: 'PENDING',
    createTime: '2026-06-01 10:00:00'
  },
  {
    id: 71002,
    ...base,
    inboundNo: 'IN-2026-0001',
    palletNo: 'PLT-IN-2026-002',
    containerNo: 'MSCU1234567',
    groupCode: 'FedEx-LAX',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    boxQty: 35,
    weight: 455,
    recommendLocation: 'A-02-03',
    status: 'PENDING',
    createTime: '2026-06-01 10:05:00'
  },
  {
    id: 71003,
    ...base,
    inboundNo: 'IN-2026-0001',
    palletNo: 'PLT-IN-2026-003',
    containerNo: 'MSCU1234567',
    groupCode: 'UPS-ORD',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    boxQty: 45,
    weight: 580,
    recommendLocation: 'A-02-04',
    status: 'PENDING',
    createTime: '2026-06-01 10:10:00'
  },
  {
    id: 71004,
    ...base,
    inboundNo: 'IN-2026-0002',
    palletNo: 'PLT-IN-2026-004',
    containerNo: 'OOLU7654321',
    groupCode: 'UPS-ORD',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    boxQty: 28,
    weight: 360,
    recommendLocation: 'B-01-02',
    status: 'PENDING',
    createTime: '2026-06-02 09:00:00'
  },
  {
    id: 71005,
    ...base,
    inboundNo: 'IN-2026-0002',
    palletNo: 'PLT-IN-2026-005',
    containerNo: 'OOLU7654321',
    groupCode: 'UPS-ORD',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    boxQty: 32,
    weight: 410,
    recommendLocation: 'B-01-02',
    status: 'COMPLETED',
    createTime: '2026-06-02 09:30:00'
  }
];

export const MOCK_PUTAWAY_TASKS = [
  {
    id: 72001,
    ...base,
    taskNo: 'PT-2026-0001',
    containerNo: 'MSCU1234567',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    palletQty: 3,
    palletNos: 'PLT-IN-2026-001, PLT-IN-2026-002, PLT-IN-2026-003',
    recommendLocation: 'A-02-03',
    putawayMode: 'BATCH',
    status: 'PENDING',
    createTime: '2026-06-01 14:00:00'
  },
  {
    id: 72002,
    ...base,
    taskNo: 'PT-2026-0002',
    containerNo: 'OOLU7654321',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    palletQty: 2,
    palletNos: 'PLT-IN-2026-004, PLT-IN-2026-005',
    recommendLocation: 'B-01-02',
    putawayMode: 'BATCH',
    status: 'ASSIGNED',
    createTime: '2026-06-02 15:00:00'
  },
  {
    id: 72003,
    ...base,
    taskNo: 'PT-2026-0003',
    containerNo: 'MSCU1234567',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    palletQty: 1,
    palletNos: 'PLT-IN-2026-006',
    recommendLocation: 'A-03-01',
    putawayMode: 'SINGLE',
    status: 'IN_PROGRESS',
    createTime: '2026-06-03 08:00:00'
  }
];

/** PDA \u6279\u91cf\u4e0a\u67b6\u660e\u7ec6\uff08\u6309 taskNo \u67e5\uff09 */
export const MOCK_PUTAWAY_TASK_LINES: Record<string, Array<{ palletNo: string; boxQty: number; recommendLocation: string; status: string }>> = {
  'PT-2026-0001': [
    { palletNo: 'PLT-IN-2026-001', boxQty: 40, recommendLocation: 'A-02-03', status: 'PENDING' },
    { palletNo: 'PLT-IN-2026-002', boxQty: 35, recommendLocation: 'A-02-03', status: 'PENDING' },
    { palletNo: 'PLT-IN-2026-003', boxQty: 45, recommendLocation: 'A-02-04', status: 'PENDING' }
  ],
  'PT-2026-0002': [
    { palletNo: 'PLT-IN-2026-004', boxQty: 28, recommendLocation: 'B-01-02', status: 'PENDING' },
    { palletNo: 'PLT-IN-2026-005', boxQty: 32, recommendLocation: 'B-01-02', status: 'PENDING' }
  ],
  'PT-2026-0003': [
    { palletNo: 'PLT-IN-2026-006', boxQty: 50, recommendLocation: 'A-03-01', status: 'PENDING' }
  ]
};

export const MOCK_OPERATION_ORDERS = [
  {
    id: 73001,
    ...base,
    orderNo: 'OP-2026-0001',
    containerNo: 'MSCU1234567',
    cargoOrderNo: 'CO-2026-0001',
    containerWorkOrderNo: 'CTN-2026-0001',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    operationType: 'RELABEL',
    qty: 200,
    status: 'CREATED',
    createTime: '2026-06-01 11:00:00'
  },
  {
    id: 73002,
    ...base,
    orderNo: 'OP-2026-0002',
    containerNo: 'OOLU7654321',
    cargoOrderNo: 'CO-2026-0002',
    containerWorkOrderNo: 'CTN-2026-0002',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    operationType: 'PHOTO',
    qty: 50,
    status: 'IN_PROGRESS',
    createTime: '2026-06-02 10:00:00'
  }
];

export const MOCK_VAS_TASKS = [
  {
    id: 74001,
    ...base,
    taskNo: 'VAS-2026-0001',
    operationOrderNo: 'OP-2026-0001',
    cargoOrderNo: 'CO-2026-0001',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    serviceType: 'LABEL',
    qty: 100,
    status: 'PENDING',
    createTime: '2026-06-01 12:00:00'
  },
  {
    id: 74002,
    ...base,
    taskNo: 'VAS-2026-0002',
    operationOrderNo: 'OP-2026-0002',
    cargoOrderNo: 'CO-2026-0002',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    serviceType: 'REPACK',
    qty: 30,
    status: 'WORKING',
    createTime: '2026-06-02 11:00:00'
  }
];

export const MOCK_STOCK_PREP_ORDERS = [
  {
    id: 75001,
    ...base,
    orderNo: 'SP-2026-0001',
    outboundOrderNo: 'OB-2026-0001',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    palletQty: 6,
    status: 'CREATED',
    createTime: '2026-06-01 15:00:00'
  },
  {
    id: 75002,
    ...base,
    orderNo: 'SP-2026-0002',
    outboundOrderNo: 'OB-2026-0002',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    palletQty: 2,
    status: 'PREPARING',
    createTime: '2026-06-02 14:00:00'
  }
];

export const MOCK_WMS_OUTBOUND_ORDERS = [
  {
    id: 76001,
    ...base,
    outboundOrderNo: 'WOB-2026-0001',
    customerName: '\u6f14\u793a\u5ba2\u6237 A',
    outboundType: 'DELIVERY',
    direction: 'DELIVERY',
    palletQty: 12,
    boxQty: 480,
    status: 'CREATED',
    createTime: '2026-06-01 10:00:00'
  },
  {
    id: 76002,
    ...base,
    outboundOrderNo: 'WOB-2026-0002',
    customerName: '\u6f14\u793a\u5ba2\u6237 B',
    outboundType: 'TRANSFER',
    direction: 'TRANSFER',
    palletQty: 6,
    boxQty: 220,
    status: 'DISPATCHED',
    createTime: '2026-06-02 14:30:00'
  },
  {
    id: 76003,
    ...base,
    outboundOrderNo: 'WOB-2026-0003',
    customerName: '\u6f14\u793a\u5ba2\u6237 C',
    outboundType: 'DELIVERY',
    direction: 'DELIVERY',
    palletQty: 8,
    boxQty: 300,
    status: 'OUTBOUNDED',
    createTime: '2026-06-03 09:00:00'
  }
];

export const MOCK_DEVANNING_DETAIL = {
  id: 60401,
  containerNo: 'MSCU1234567',
  blNo: 'BL202605001',
  customerName: '\u6f14\u793a\u5ba2\u6237 A',
  eta: '2026-05-28',
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  expectedBoxQty: 500,
  receivedBoxQty: 320,
  palletizedQty: 280,
  progress: 64
};

export const MOCK_DEVANNING_SHIPMENTS = [
  { so: 'SO-001', shipment: 'SHP-001', boxQty: 120, weight: 1500, cbm: 12.5 },
  { so: 'SO-002', shipment: 'SHP-002', boxQty: 80, weight: 900, cbm: 8.2 }
];

export const MOCK_DEVANNING_PALLETS_WORK = [
  { palletNo: 'PLT-001', boxQty: 40, weight: 500, cbm: 4.2, status: 'IN_STOCK' },
  { palletNo: 'PLT-002', boxQty: 35, weight: 420, cbm: 3.5, status: 'PRE_OUTBOUND' }
];

const LIST_MAP: Record<string, any[]> = {
  'inbound-order': MOCK_INBOUND_ORDERS,
  'putaway-task': MOCK_PUTAWAY_TASKS,
  'operation-order': MOCK_OPERATION_ORDERS,
  'vas-task': MOCK_VAS_TASKS,
  'stock-prep-order': MOCK_STOCK_PREP_ORDERS,
  'outbound-order': MOCK_WMS_OUTBOUND_ORDERS
};

export function getWmsPrototypeList(mockKey: string, params?: Record<string, any>) {
  let rows = LIST_MAP[mockKey] || [];
  if (mockKey === 'inbound-order') {
    rows = rows.filter(r => r.status !== 'COMPLETED');
  }
  if (params?.status) {
    rows = rows.filter(r => r.status === params.status);
  }
  return mockPage(rows, params);
}
