export type DevanningTaskStatus = 'PENDING' | 'DEVANNING' | 'PENDING_CONFIRM' | 'COMPLETED';
export type PalletStatus = 'CREATED' | 'BOX_ENTERED' | 'PRINTED' | 'INBOUND' | 'PHOTOED' | 'DONE';
export type ExceptionStatus = 'NORMAL' | 'PENDING' | 'SUPERVISOR_CONFIRM' | 'RESOLVED';

export const TASK_STATUS_LABEL: Record<DevanningTaskStatus, string> = {
  PENDING: '待拆柜',
  DEVANNING: '拆柜中',
  PENDING_CONFIRM: '待确认',
  COMPLETED: '已完成'
};

export const PALLET_STATUS_LABEL: Record<PalletStatus, string> = {
  CREATED: '已创建',
  BOX_ENTERED: '已录箱数',
  PRINTED: '已打印标签',
  INBOUND: '已扫描入库',
  PHOTOED: '已拍照',
  DONE: '已完成'
};

export const EXCEPTION_STATUS_LABEL: Record<ExceptionStatus, string> = {
  NORMAL: '正常',
  PENDING: '异常待处理',
  SUPERVISOR_CONFIRM: '主管确认',
  RESOLVED: '已处理'
};

export const DEFAULT_PALLET_SIZE = { l: 40, w: 48, h: 72 };

export const INBOUND_LOCATION_OPTIONS = [
  { label: '转运暂存区', value: 'TRANSFER-STAGE' },
  { label: 'DOCK 暂存区', value: 'DOCK-STAGE' },
  { label: '待上架区', value: 'PUTAWAY-PENDING' },
  { label: '目的地暂存区', value: 'DEST-STAGE' }
];

export const REQUIRED_PHOTO_TYPES = [
  { key: 'PALLET_FRONT', label: '卡板正面照片' },
  { key: 'PALLET_LABEL', label: '卡板标签照片' },
  { key: 'CARGO_OVERALL', label: '货物整体照片' }
] as const;

export const DEVANNING_EXCEPTION_TYPES = [
  { value: 'DAMAGE', label: '破损' },
  { value: 'WET', label: '湿箱' },
  { value: 'UNREPAIRABLE', label: '无法修复' }
] as const;

export type DevanningExceptionType = (typeof DEVANNING_EXCEPTION_TYPES)[number]['value'];

export const DEVANNING_CONTAINER_ORDERS: Record<string, string[]> = {
  MSCU1234567: ['ORD-2026-0001', 'ORD-2026-0002', 'ORD-2026-0003'],
  OOLU1000137: ['CO-2026-0002']
};

export const OPTIONAL_PHOTO_TYPES = [
  { key: 'EXCEPTION', label: '异常照片' },
  { key: 'DAMAGE', label: '破损照片' },
  { key: 'WET', label: '湿货照片' },
  { key: 'MIXED', label: '混板照片' }
] as const;

export type DevanningStep =
  | 'entry'
  | 'list'
  | 'scan'
  | 'destinations'
  | 'create'
  | 'print'
  | 'inbound'
  | 'photo'
  | 'report'
  | 'detail';
