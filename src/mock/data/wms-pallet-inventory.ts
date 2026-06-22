import { fuzzyIncludes } from '../fuzzy-search';
import { mockPage } from '../utils';
import { MOCK_WAREHOUSE } from './common';

const CUSTOMERS = ['演示客户 A', '演示客户 B', 'Pacific Goods Inc', 'Golden Bridge LLC'];
const PLATFORMS = ['Amazon', 'Walmart', 'Wayfair'];
const DESTINATIONS = ['ONT8', 'LGB8', 'SMF3', 'DFW6', 'ORD2', 'ATL2'];
const STATUSES: Api.Wms.PalletInventoryStatus[] = [
  'AVAILABLE',
  'HOLD',
  'LOCKED',
  'PENDING_OUTBOUND',
  'PICKING',
  'PENDING_LOAD',
  'LOADING',
  'OUTBOUND',
  'EXCEPTION',
  'VOIDED'
];
const ZONES = ['A区', 'B区', 'C区', 'E区', 'DOCK区'];

const PALLET_STATUS_LABEL: Record<Api.Wms.PalletInventoryStatus, string> = {
  AVAILABLE: '可用',
  HOLD: '暂扣',
  LOCKED: '锁定',
  PENDING_OUTBOUND: '待出库',
  PICKING: '拣货中',
  PENDING_LOAD: '待装车',
  LOADING: '装车中',
  OUTBOUND: '已出库',
  EXCEPTION: '异常',
  VOIDED: '已注销'
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function ageFromInbound(inboundTime: string) {
  const diff = Date.now() - new Date(inboundTime.replace(' ', 'T')).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

let pallets: Api.Wms.PalletInventoryRecord[] = Array.from({ length: 28 }, (_, i) => {
  const idx = i + 1;
  const status = STATUSES[i % STATUSES.length];
  const inboundTime = daysAgo(2 + (i % 45));
  const exception = status === 'EXCEPTION' || i % 13 === 0;
  return {
    id: 61000 + idx,
    palletNo: `PLT-2026-${String(idx).padStart(4, '0')}`,
    cargoOrderNo: `CO-2026-${String((i % 14) + 1).padStart(4, '0')}`,
    customerOrderNo: `FSHY25080${String(58700 + i).slice(-5)}`,
    containerNo: `MSCU${1234560 + (i % 8)}`,
    customerName: CUSTOMERS[i % CUSTOMERS.length],
    platformName: PLATFORMS[i % PLATFORMS.length],
    destination: DESTINATIONS[i % DESTINATIONS.length],
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneName: ZONES[i % ZONES.length],
    locationCode: `${1 + (i % 3)}/${String.fromCharCode(65 + (i % 5))}${String((i % 12) + 1).padStart(2, '0')}`,
    palletQty: 1,
    boxQty: 24 + (i % 8) * 6,
    skuQty: 8 + (i % 20),
    lengthCm: 120,
    widthCm: 100,
    heightCm: 150 + (i % 3) * 10,
    weight: 380 + i * 12,
    inventoryStatus: status,
    inboundTime,
    ageDays: ageFromInbound(inboundTime),
    exceptionFlag: exception,
    businessTypeName: i % 3 === 0 ? '卡车派送' : '整送'
  };
});

function filterPallets(params: Record<string, any> = {}) {
  let rows = [...pallets];
  const tab = params.tab as string | undefined;
  if (tab && tab !== 'all') {
    if (tab === 'AGE_WARNING') rows = rows.filter(r => r.ageDays >= 30);
    else rows = rows.filter(r => r.inventoryStatus === tab);
  }
  if (params.inventoryStatus) rows = rows.filter(r => r.inventoryStatus === params.inventoryStatus);
  if (params.exceptionFlag === true || params.exceptionFlag === 'true') rows = rows.filter(r => r.exceptionFlag);
  if (params.ageDaysMin != null) rows = rows.filter(r => r.ageDays >= Number(params.ageDaysMin));

  const fields: Array<keyof Api.Wms.PalletInventoryRecord | 'scanCode'> = [
    'palletNo',
    'cargoOrderNo',
    'containerNo',
    'customerName',
    'platformName',
    'destination',
    'warehouseName',
    'zoneName',
    'locationCode'
  ];
  const scan = String(params.scanCode ?? params.palletNo ?? '').trim();
  if (scan) rows = rows.filter(r => fuzzyIncludes(r.palletNo, scan) || fuzzyIncludes(r.cargoOrderNo, scan));
  if (params.cargoOrderNo) rows = rows.filter(r => fuzzyIncludes(r.cargoOrderNo, params.cargoOrderNo));
  if (params.containerNo) rows = rows.filter(r => fuzzyIncludes(r.containerNo, params.containerNo));
  if (params.customerName) rows = rows.filter(r => fuzzyIncludes(r.customerName, params.customerName));
  if (params.platformName) rows = rows.filter(r => fuzzyIncludes(r.platformName, params.platformName));
  if (params.destination) rows = rows.filter(r => fuzzyIncludes(r.destination, params.destination));
  if (params.warehouseName) rows = rows.filter(r => fuzzyIncludes(r.warehouseName, params.warehouseName));
  if (params.zoneName) rows = rows.filter(r => fuzzyIncludes(r.zoneName, params.zoneName));
  if (params.locationCode) rows = rows.filter(r => fuzzyIncludes(r.locationCode, params.locationCode));
  if (params.inboundTimeFrom) rows = rows.filter(r => r.inboundTime >= params.inboundTimeFrom);
  if (params.inboundTimeTo) rows = rows.filter(r => r.inboundTime <= `${params.inboundTimeTo} 23:59:59`);

  return rows;
}

export function getPalletInventoryStats(params?: Record<string, any>) {
  const rows = filterPallets({ ...params, tab: undefined });
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalCount: rows.length,
    availableCount: rows.filter(r => r.inventoryStatus === 'AVAILABLE').length,
    holdCount: rows.filter(r => r.inventoryStatus === 'HOLD').length,
    exceptionCount: rows.filter(r => r.exceptionFlag || r.inventoryStatus === 'EXCEPTION').length,
    pendingOutboundCount: rows.filter(r =>
      ['PENDING_OUTBOUND', 'PICKING', 'PENDING_LOAD', 'LOADING'].includes(r.inventoryStatus)
    ).length,
    lockedCount: rows.filter(r => r.inventoryStatus === 'LOCKED').length,
    todayInbound: rows.filter(r => r.inboundTime.startsWith(today)).length,
    todayOutbound: rows.filter(r => r.inventoryStatus === 'OUTBOUND' && r.inboundTime.startsWith(today)).length
  } satisfies Api.Wms.PalletInventoryStats;
}

export function getPalletInventoryList(params?: Record<string, any>) {
  return mockPage(filterPallets(params), params);
}

export function getPalletInventoryDetail(id: number): Api.Wms.PalletInventoryDetail | null {
  const row = pallets.find(p => p.id === id);
  if (!row) return null;
  return {
    ...row,
    orderInfo: {
      cargoOrderNo: row.cargoOrderNo,
      customerOrderNo: row.customerOrderNo,
      inboundOrderNo: `INB-2026-${String(row.id).slice(-4)}`,
      outboundOrderNo: row.inventoryStatus === 'OUTBOUND' ? `OUT-2026-${String(row.id).slice(-4)}` : null,
      tripNo: ['PENDING_OUTBOUND', 'PICKING', 'PENDING_LOAD', 'LOADING', 'OUTBOUND'].includes(row.inventoryStatus)
        ? `TRIP-2026-${String((row.id as number) % 99).padStart(3, '0')}`
        : null,
      devanningNo: `DV-2026-${String((row.id as number) % 20).padStart(4, '0')}`,
      containerNo: row.containerNo,
      appointmentNo: row.platformName === 'Amazon' ? `ISA-${8844000 + (row.id as number)}` : `APT-2026-${row.id}`,
      referenceId: `REF-${row.cargoOrderNo}`,
      poNumber: `PO-${20260000 + (row.id as number)}`
    },
    cargoItems: [
      {
        sku: 'SKU-A1001',
        fnsku: 'X001ABC123',
        boxQty: Math.floor(row.boxQty * 0.6),
        pcs: Math.floor(row.skuQty * 12),
        unitWeight: 12.5,
        unitSize: '60×40×40 cm',
        labelStatus: '已贴标',
        packStatus: '原箱',
        remark: null
      },
      {
        sku: 'SKU-B2002',
        fnsku: 'X002DEF456',
        boxQty: row.boxQty - Math.floor(row.boxQty * 0.6),
        pcs: Math.floor(row.skuQty * 8),
        unitWeight: 10.2,
        unitSize: '50×35×35 cm',
        labelStatus: '已贴标',
        packStatus: '加固',
        remark: null
      }
    ],
    locationInfo: {
      warehouseName: row.warehouseName,
      zoneName: row.zoneName || '—',
      locationCode: row.locationCode,
      locationType: row.zoneName?.includes('DOCK') ? 'DOCK' : '货架库位',
      capacity: 2,
      highValueZone: row.destination === 'ONT8',
      holdZone: row.inventoryStatus === 'HOLD',
      pendingOutboundZone: ['PENDING_OUTBOUND', 'PICKING', 'PENDING_LOAD'].includes(row.inventoryStatus),
      putawayTime: row.inboundTime,
      lastMoveTime: daysAgo(Math.max(0, row.ageDays - 2))
    },
    instructions: [
      {
        instructionNo: `INS-${row.id}-01`,
        instructionType: row.inventoryStatus === 'PICKING' ? 'PICK' : 'PUTAWAY',
        status: row.inventoryStatus === 'PICKING' ? '执行中' : '已完成',
        assignee: '张三',
        deadline: daysAgo(-1).slice(0, 10) + ' 18:00:00'
      }
    ],
    attachments: [
      { category: '入库照片', fileName: `inbound-${row.palletNo}.jpg`, uploadTime: row.inboundTime },
      { category: '卡板照片', fileName: `pallet-${row.palletNo}.jpg`, uploadTime: row.inboundTime },
      ...(row.exceptionFlag ? [{ category: '异常照片', fileName: `exc-${row.palletNo}.jpg`, uploadTime: daysAgo(1) }] : [])
    ],
    fees: [
      { feeType: '仓储费', amount: 45.5, currency: 'USD', status: '待结算' },
      { feeType: '操作费', amount: 12, currency: 'USD', status: '已确认' }
    ],
    transactions: [
      {
        time: row.inboundTime,
        actionType: 'PDA入库',
        beforeValue: '—',
        afterValue: '可用',
        operatorName: '李四',
        sourceModule: 'PDA入库',
        remark: '扫描上架完成'
      },
      ...(row.inventoryStatus !== 'AVAILABLE'
        ? [
            {
              time: daysAgo(1),
              actionType: '状态变更',
              beforeValue: '可用',
              afterValue: PALLET_STATUS_LABEL[row.inventoryStatus],
              operatorName: '王五',
              sourceModule: 'WMS库存',
              remark: null
            }
          ]
        : [])
    ]
  };
}

const ACTION_STATUS_MAP: Partial<Record<Api.Wms.PalletInventoryActionPayload['action'], Api.Wms.PalletInventoryStatus>> = {
  hold: 'HOLD',
  release: 'AVAILABLE',
  lock: 'LOCKED',
  unlock: 'AVAILABLE',
  pick_instruction: 'PENDING_OUTBOUND',
  void: 'VOIDED'
};

export function palletInventoryAction(payload: Api.Wms.PalletInventoryActionPayload) {
  const row = pallets.find(p => p.id === payload.palletId);
  if (!row) return { success: false, message: '卡板不存在' };
  if (payload.action === 'move' && payload.targetLocationCode?.trim()) {
    row.locationCode = payload.targetLocationCode.trim();
    return { success: true, message: `已移位至 ${row.locationCode}` };
  }
  if (payload.action === 'exception') {
    row.inventoryStatus = 'EXCEPTION';
    row.exceptionFlag = true;
    return { success: true, message: '已生成异常处理' };
  }
  const next = ACTION_STATUS_MAP[payload.action];
  if (next) {
    row.inventoryStatus = next;
    if (payload.action === 'hold') row.exceptionFlag = false;
    return { success: true, message: `操作成功，状态已更新为 ${PALLET_STATUS_LABEL[row.inventoryStatus]}` };
  }
  if (['pick_instruction', 'relabel_instruction', 'repack_instruction'].includes(payload.action)) {
    row.inventoryStatus = payload.action === 'pick_instruction' ? 'PENDING_OUTBOUND' : row.inventoryStatus;
    return { success: true, message: '指令已生成（原型）' };
  }
  if (payload.action === 'print_label') {
    return { success: true, message: `已发送卡板标签打印：${row.palletNo}` };
  }
  return { success: true, message: '操作已记录（原型）' };
}
