export const SUPPLIER_OP_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '已预约提柜', value: 'PICKUP_APPOINTED' },
  { label: '已提柜', value: 'PICKED_UP' },
  { label: '已到仓', value: 'ARRIVED_WAREHOUSE' },
  { label: '拆柜中', value: 'DEVANNING' },
  { label: '拆柜完成', value: 'DEVANNED' },
  { label: '已还柜', value: 'EMPTY_RETURNED' },
  { label: '已完成', value: 'COMPLETED' }
] as const;

export const SUPPLIER_OP_STATUS_LABEL: Record<string, string> = {
  PICKUP_APPOINTED: '已预约提柜',
  PICKED_UP: '已提柜',
  ARRIVED_WAREHOUSE: '已到仓',
  DEVANNING: '拆柜中',
  DEVANNED: '拆柜完成',
  EMPTY_RETURNED: '已还柜',
  COMPLETED: '已完成'
};

export const FEE_AUDIT_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'PENDING', type: 'warning' as const },
  { label: '已通过', value: 'APPROVED', type: 'success' as const },
  { label: '已驳回', value: 'REJECTED', type: 'error' as const }
];

export const FEE_AUDIT_STATUS_LABEL: Record<string, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回'
};

export const FEE_AUDIT_STATUS_TAG: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  NONE: 'default'
};

export const EXAM_STATUS_LABEL: Record<string, string> = {
  NONE: '无',
  EXAMINING: '查验中',
  EXAMINED: '查验完成'
};

export const ORDER_SOURCE_LABEL: Record<string, string> = {
  SELF: '自建单',
  MANUAL: '自建单',
  IMPORT: '自建单',
  API: 'API下单',
  PORTAL: '客户门户下单'
};

export function examStatusLabel(value?: string | null) {
  if (!value || value === 'NONE') return '无';
  return EXAM_STATUS_LABEL[value] || value;
}

export function examStatusTagType(value?: string | null): 'default' | 'warning' | 'success' {
  if (value === 'EXAMINING') return 'warning';
  if (value === 'EXAMINED') return 'success';
  return 'default';
}

export function orderSourceLabel(value?: string | null) {
  if (!value) return '-';
  return ORDER_SOURCE_LABEL[value] || value;
}
