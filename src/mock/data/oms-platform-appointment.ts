import { MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

export type PlatformAppointmentStatus = 'UNUSED' | 'USED' | 'DELIVERED' | 'CANCELLED';

export type PlatformAppointmentRow = {
  id: number;
  platformName: string;
  warehouseCode: string;
  appointmentNo: string;
  appointmentTime: string;
  createTime: string;
  appointmentType: string;
  status: PlatformAppointmentStatus;
  remark: string | null;
  tagCodes: string[];
  existingCargoCbm: number;
  outboundOrderNo: string | null;
  preOutboundNo: string | null;
};

export type PlatformAppointmentInboundLine = {
  id: number;
  cargoOrderNo: string;
  containerNo: string;
  palletNo: string;
  storageLocation: string;
  pieceQty: number;
  weight: number;
  cbm: number;
  readiness?: 'INBOUNDED' | 'PENDING';
};

type PreOutboundCargoSource = PlatformAppointmentInboundLine & {
  expectedArrivalTime: number;
  eta: number;
  pickupAppointmentTime: number;
  availableTime: number;
  pickupTime: number;
  actualArrivalTime: number;
  readiness: 'INBOUNDED' | 'PENDING';
};

const TIME_FIELD_KEY: Record<string, keyof PreOutboundCargoSource> = {
  EXPECTED_ARRIVAL: 'expectedArrivalTime',
  ETA: 'eta',
  PICKUP_APPOINTMENT: 'pickupAppointmentTime',
  AVAILABLE: 'availableTime',
  PICKUP: 'pickupTime',
  ACTUAL_ARRIVAL: 'actualArrivalTime'
};

const MOCK_PLATFORM_APPOINTMENTS: PlatformAppointmentRow[] = [
  {
    id: 95001,
    platformName: 'Amazon FBA',
    warehouseCode: 'LAX9',
    appointmentNo: 'ISA-2026-0601-001',
    appointmentTime: '2026-06-05 09:00:00',
    createTime: '2026-06-01 10:20:00',
    appointmentType: 'FBA_DELIVERY',
    status: 'UNUSED',
    remark: '客户要求上午送仓',
    tagCodes: ['PUSH_APPOINTMENT'],
    existingCargoCbm: 18.6,
    outboundOrderNo: null,
    preOutboundNo: null
  },
  {
    id: 95002,
    platformName: 'Amazon FBA',
    warehouseCode: 'ONT8',
    appointmentNo: 'ISA-2026-0602-002',
    appointmentTime: '2026-06-06 14:30:00',
    createTime: '2026-06-02 11:05:00',
    appointmentType: 'FBA_DELIVERY',
    status: 'USED',
    remark: null,
    tagCodes: [],
    existingCargoCbm: 32.4,
    outboundOrderNo: 'OB-2026-0102',
    preOutboundNo: null
  },
  {
    id: 95003,
    platformName: 'Walmart WFS',
    warehouseCode: 'LAX2T',
    appointmentNo: 'APT-2026-0603-003',
    appointmentTime: '2026-06-07 08:00:00',
    createTime: '2026-06-03 09:15:00',
    appointmentType: 'TRANSFER',
    status: 'DELIVERED',
    remark: '已交仓完成',
    tagCodes: [],
    existingCargoCbm: 0,
    outboundOrderNo: 'OB-2026-0098',
    preOutboundNo: 'POB-2026-0098'
  },
  {
    id: 95004,
    platformName: 'Wayfair',
    warehouseCode: 'WF-CA-01',
    appointmentNo: 'APT-2026-0604-004',
    appointmentTime: '2026-06-08 16:00:00',
    createTime: '2026-06-03 15:40:00',
    appointmentType: 'FBA_DELIVERY',
    status: 'UNUSED',
    remark: '待确认装车',
    tagCodes: ['DELETE_APPOINTMENT'],
    existingCargoCbm: 12.2,
    outboundOrderNo: null,
    preOutboundNo: null
  },
  {
    id: 95005,
    platformName: 'Amazon FBA',
    warehouseCode: 'SBD1',
    appointmentNo: 'ISA-2026-0605-005',
    appointmentTime: '2026-06-09 10:30:00',
    createTime: '2026-06-04 08:50:00',
    appointmentType: 'EMPTY_PICKUP',
    status: 'CANCELLED',
    remark: '平台取消',
    tagCodes: ['PLATFORM_DELETE'],
    existingCargoCbm: 0,
    outboundOrderNo: null,
    preOutboundNo: null
  },
  {
    id: 95006,
    platformName: 'Target FDC',
    warehouseCode: 'TGT-LA-02',
    appointmentNo: 'APT-2026-0610-006',
    appointmentTime: '2026-06-10 13:00:00',
    createTime: '2026-06-04 16:22:00',
    appointmentType: 'TRANSFER',
    status: 'USED',
    remark: null,
    tagCodes: ['PUSH_APPOINTMENT', 'DELETE_APPOINTMENT'],
    existingCargoCbm: 25.8,
    outboundOrderNo: 'OB-2026-0116',
    preOutboundNo: 'POB-2026-0116'
  },
  {
    id: 95007,
    platformName: 'Amazon FBA',
    warehouseCode: MOCK_WAREHOUSE.warehouseCode,
    appointmentNo: 'ISA-2026-0611-007',
    appointmentTime: '2026-06-11 09:30:00',
    createTime: '2026-06-05 09:00:00',
    appointmentType: 'FBA_DELIVERY',
    status: 'UNUSED',
    remark: '大货中转批次',
    tagCodes: [],
    existingCargoCbm: 41.5,
    outboundOrderNo: null,
    preOutboundNo: null
  },
  {
    id: 95008,
    platformName: 'Walmart WFS',
    warehouseCode: 'LGB8',
    appointmentNo: 'APT-2026-0612-008',
    appointmentTime: '2026-06-12 11:00:00',
    createTime: '2026-06-05 14:18:00',
    appointmentType: 'FBA_DELIVERY',
    status: 'DELIVERED',
    remark: null,
    tagCodes: [],
    existingCargoCbm: 0,
    outboundOrderNo: 'OB-2026-0099',
    preOutboundNo: null
  }
];

let outboundOrderSeq = 9200;
let preOutboundOrderSeq = 8100;

function toTs(value: string) {
  return Date.parse(value.replace(' ', 'T'));
}

function buildInboundLines(row: PlatformAppointmentRow): PlatformAppointmentInboundLine[] {
  if (row.existingCargoCbm <= 0) return [];
  const wh = row.warehouseCode;
  return [
    {
      id: Number(`${row.id}01`),
      cargoOrderNo: `CO-2026-${String(row.id).slice(-4)}`,
      containerNo: 'MSCU1234567',
      palletNo: `PLT-LBL-${wh}-001`,
      storageLocation: `A-01-${String(row.id).slice(-2)}`,
      pieceQty: 48,
      weight: 620,
      cbm: Number((row.existingCargoCbm * 0.55).toFixed(2)),
      readiness: 'INBOUNDED'
    },
    {
      id: Number(`${row.id}02`),
      cargoOrderNo: `CO-2026-${String(row.id).slice(-3)}A`,
      containerNo: 'MSCU1234567',
      palletNo: `PLT-LBL-${wh}-002`,
      storageLocation: `A-02-${String(row.id).slice(-2)}`,
      pieceQty: 36,
      weight: 480,
      cbm: Number((row.existingCargoCbm * 0.45).toFixed(2)),
      readiness: 'INBOUNDED'
    }
  ];
}

function buildPreOutboundPool(row: PlatformAppointmentRow): PreOutboundCargoSource[] {
  const wh = row.warehouseCode;
  const id = row.id;
  return [
    {
      id: Number(`${id}11`),
      cargoOrderNo: `CO-PRE-${id}-1`,
      containerNo: 'MSCU1234567',
      palletNo: '--',
      storageLocation: '--',
      pieceQty: 40,
      weight: 520,
      cbm: 8.2,
      readiness: 'PENDING',
      expectedArrivalTime: toTs('2026-06-03 10:00:00'),
      eta: toTs('2026-06-02 18:00:00'),
      pickupAppointmentTime: toTs('2026-06-04 08:00:00'),
      availableTime: toTs('2026-06-04 12:00:00'),
      pickupTime: toTs('2026-06-04 14:00:00'),
      actualArrivalTime: toTs('2026-06-05 09:00:00')
    },
    {
      id: Number(`${id}12`),
      cargoOrderNo: `CO-PRE-${id}-2`,
      containerNo: 'OOLU1000137',
      palletNo: '--',
      storageLocation: '--',
      pieceQty: 32,
      weight: 410,
      cbm: 6.5,
      readiness: 'PENDING',
      expectedArrivalTime: toTs('2026-06-06 11:00:00'),
      eta: toTs('2026-06-05 20:00:00'),
      pickupAppointmentTime: toTs('2026-06-07 09:00:00'),
      availableTime: toTs('2026-06-07 13:00:00'),
      pickupTime: toTs('2026-06-07 15:30:00'),
      actualArrivalTime: toTs('2026-06-08 08:00:00')
    },
    {
      id: Number(`${id}13`),
      cargoOrderNo: `CO-PRE-${id}-3`,
      containerNo: 'MSCU1234567',
      palletNo: `PLT-LBL-${wh}-003`,
      storageLocation: `B-01-${String(id).slice(-2)}`,
      pieceQty: 28,
      weight: 360,
      cbm: 5.1,
      readiness: 'INBOUNDED',
      expectedArrivalTime: toTs('2026-06-01 09:00:00'),
      eta: toTs('2026-05-31 16:00:00'),
      pickupAppointmentTime: toTs('2026-06-02 08:00:00'),
      availableTime: toTs('2026-06-02 11:00:00'),
      pickupTime: toTs('2026-06-02 13:00:00'),
      actualArrivalTime: toTs('2026-06-03 07:30:00')
    },
    {
      id: Number(`${id}14`),
      cargoOrderNo: `CO-PRE-${id}-4`,
      containerNo: 'OOLU1000137',
      palletNo: `PLT-LBL-${wh}-004`,
      storageLocation: `B-02-${String(id).slice(-2)}`,
      pieceQty: 24,
      weight: 300,
      cbm: 4.2,
      readiness: 'INBOUNDED',
      expectedArrivalTime: toTs('2026-06-04 15:00:00'),
      eta: toTs('2026-06-03 22:00:00'),
      pickupAppointmentTime: toTs('2026-06-05 10:00:00'),
      availableTime: toTs('2026-06-05 14:00:00'),
      pickupTime: toTs('2026-06-05 16:00:00'),
      actualArrivalTime: toTs('2026-06-06 09:00:00')
    }
  ];
}

function stripPreOutboundMeta(line: PreOutboundCargoSource): PlatformAppointmentInboundLine {
  const {
    expectedArrivalTime: _a,
    eta: _b,
    pickupAppointmentTime: _c,
    availableTime: _d,
    pickupTime: _e,
    actualArrivalTime: _f,
    ...rest
  } = line;
  return rest;
}

export function getPlatformAppointmentInboundLines(id: number | string) {
  const row = getPlatformAppointmentDetail(id);
  if (!row) return [];
  return buildInboundLines(row);
}

export function getPlatformAppointmentPreOutboundLines(
  id: number | string,
  params?: Record<string, unknown>
) {
  const row = getPlatformAppointmentDetail(id);
  if (!row) return [];

  const timeField = String(params?.timeField || 'ETA');
  const timeStart = Number(params?.timeStart);
  const timeEnd = Number(params?.timeEnd);
  const includeInbounded =
    params?.includeInbounded === true ||
    params?.includeInbounded === 'true' ||
    params?.includeInbounded === 1 ||
    params?.includeInbounded === '1';

  if (!timeStart || !timeEnd) return [];

  const fieldKey = TIME_FIELD_KEY[timeField] || 'eta';
  let lines = buildPreOutboundPool(row).filter(line => {
    const value = Number(line[fieldKey]);
    return value >= timeStart && value <= timeEnd;
  });

  if (!includeInbounded) {
    lines = lines.filter(line => line.readiness !== 'INBOUNDED');
  }

  return lines.map(stripPreOutboundMeta);
}

export function createPlatformAppointmentPreOutbound(
  id: number | string,
  _payload?: Record<string, unknown>
) {
  const row = MOCK_PLATFORM_APPOINTMENTS.find(item => String(item.id) === String(id));
  if (!row) throw new Error('\u9884\u7ea6\u4e0d\u5b58\u5728');
  if (row.status === 'CANCELLED' || row.status === 'DELIVERED') {
    throw new Error('\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u751f\u6210\u9884\u51fa\u5355');
  }
  if (row.preOutboundNo) throw new Error('\u5df2\u5173\u8054\u9884\u51fa\u5355');

  const preOutboundNo = `POB-2026-${String(++preOutboundOrderSeq).slice(-4)}`;
  row.preOutboundNo = preOutboundNo;
  return {
    preOutboundNo,
    appointment: { ...row }
  };
}

export function createPlatformAppointmentOutbound(
  id: number | string,
  _payload?: Record<string, unknown>
) {
  const row = MOCK_PLATFORM_APPOINTMENTS.find(item => String(item.id) === String(id));
  if (!row) throw new Error('\u9884\u7ea6\u4e0d\u5b58\u5728');
  if (row.status === 'CANCELLED' || row.status === 'DELIVERED') {
    throw new Error('\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u751f\u6210\u51fa\u5e93\u5355');
  }
  if (row.outboundOrderNo) throw new Error('\u5df2\u5173\u8054\u51fa\u5e93\u5355');

  const outboundOrderNo = `OB-2026-${String(++outboundOrderSeq).slice(-4)}`;
  row.outboundOrderNo = outboundOrderNo;
  row.status = 'USED';
  return {
    outboundOrderNo,
    appointment: { ...row }
  };
}

function filterRows(params?: Record<string, any>) {
  let rows = [...MOCK_PLATFORM_APPOINTMENTS];
  const keyword = String(params?.keyword || '').trim().toLowerCase();
  const status = String(params?.status || '').trim();
  const platformName = String(params?.platformName || '').trim();
  const warehouseCode = String(params?.warehouseCode || '').trim();
  const appointmentType = String(params?.appointmentType || '').trim();

  if (keyword) {
    rows = rows.filter(
      row =>
        row.platformName.toLowerCase().includes(keyword) ||
        row.warehouseCode.toLowerCase().includes(keyword) ||
        row.appointmentNo.toLowerCase().includes(keyword) ||
        String(row.outboundOrderNo || '').toLowerCase().includes(keyword) ||
        String(row.preOutboundNo || '').toLowerCase().includes(keyword)
    );
  }
  if (platformName) {
    rows = rows.filter(row => row.platformName.includes(platformName));
  }
  if (warehouseCode) {
    rows = rows.filter(row => row.warehouseCode.toLowerCase().includes(warehouseCode.toLowerCase()));
  }
  if (appointmentType) {
    rows = rows.filter(row => row.appointmentType === appointmentType);
  }
  if (status) {
    rows = rows.filter(row => row.status === status);
  }
  return rows;
}

export function getPlatformAppointmentList(params?: Record<string, any>) {
  return mockPage(filterRows(params), params);
}

export function getPlatformAppointmentStatusCount(params?: Record<string, any>) {
  const { status: _status, ...rest } = params || {};
  const rows = filterRows(rest);
  const counts: Record<string, number> = {
    UNUSED: 0,
    USED: 0,
    DELIVERED: 0,
    CANCELLED: 0
  };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }
  return { total: rows.length, ...counts };
}

export function getPlatformAppointmentDetail(id: number | string) {
  return MOCK_PLATFORM_APPOINTMENTS.find(row => String(row.id) === String(id)) || null;
}

export function linkPlatformAppointmentToTrip(appointmentId: number | string, tripNo: string) {
  const row = MOCK_PLATFORM_APPOINTMENTS.find(item => String(item.id) === String(appointmentId));
  if (!row || row.status === 'CANCELLED' || row.status === 'DELIVERED') return null;
  row.outboundOrderNo = tripNo;
  row.status = 'USED';
  return row;
}

export function linkPlatformAppointmentByNo(appointmentNo: string, tripNo: string) {
  const row = MOCK_PLATFORM_APPOINTMENTS.find(item => item.appointmentNo === appointmentNo);
  if (!row) return null;
  return linkPlatformAppointmentToTrip(row.id, tripNo);
}

let platformAppointmentIdSeq = 95008;
let platformAppointmentNoSeq = 0;

function formatNow() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function nextAppointmentNo(platformName?: string) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  platformAppointmentNoSeq += 1;
  const seq = String(platformAppointmentNoSeq).padStart(3, '0');
  const isAmazon = (platformName ?? '').toLowerCase().includes('amazon');
  return isAmazon ? `ISA-${ymd}-${seq}` : `APT-${ymd}-${seq}`;
}

export function createPlatformAppointment(payload: Record<string, unknown>) {
  const platformName = String(payload.platformName || '');
  const appointmentNo = String(payload.appointmentNo || '').trim() || nextAppointmentNo(platformName);
  const row: PlatformAppointmentRow = {
    id: ++platformAppointmentIdSeq,
    platformName: String(payload.platformName || ''),
    warehouseCode: String(payload.warehouseCode || '').toUpperCase(),
    appointmentNo,
    appointmentTime: String(payload.appointmentTime || ''),
    createTime: formatNow(),
    appointmentType: String(payload.appointmentType || 'FBA_DELIVERY'),
    status: 'UNUSED',
    remark: payload.remark ? String(payload.remark) : null,
    tagCodes: Array.isArray(payload.tagCodes) ? (payload.tagCodes as string[]) : [],
    existingCargoCbm: Number(payload.existingCargoCbm) || 0,
    outboundOrderNo: null,
    preOutboundNo: null
  };
  if (!row.platformName || !row.warehouseCode || !row.appointmentTime) {
    throw new Error('请完善平台、仓库代码与预约时间');
  }
  MOCK_PLATFORM_APPOINTMENTS.unshift(row);
  return row;
}
