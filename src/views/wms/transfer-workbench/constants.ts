export const INSTRUCTION_CATEGORY_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '上架指令', value: 'PUTAWAY' },
  { label: '拣货指令', value: 'PICK' },
  { label: '操作指令', value: 'OPERATION' },
  { label: '暂扣/放行', value: 'HOLD_RELEASE' },
  { label: '换标/换箱', value: 'RELABEL_REBOX' },
  { label: '注销/改派', value: 'CANCEL_REASSIGN' },
  { label: '异常指令', value: 'EXCEPTION' },
  { label: '已完成', value: 'COMPLETED' }
] as const;

export const INSTRUCTION_CATEGORY_LABEL: Record<string, string> = {
  PUTAWAY: '上架指令',
  PICK: '拣货指令',
  OPERATION: '操作指令',
  HOLD_RELEASE: '暂扣/放行',
  RELABEL_REBOX: '换标/换箱',
  CANCEL_REASSIGN: '注销/改派',
  EXCEPTION: '异常指令'
};

export const OPERATION_TYPE_OPTIONS = [
  { label: '换标-FBA标签', value: 'RELABEL_FBA', category: 'RELABEL_REBOX' },
  { label: '换标-SKU标签', value: 'RELABEL_SKU', category: 'RELABEL_REBOX' },
  { label: '换标-箱唛', value: 'RELABEL_CARTON', category: 'RELABEL_REBOX' },
  { label: '换标-板贴', value: 'RELABEL_PALLET', category: 'RELABEL_REBOX' },
  { label: '换标-其他客户标签', value: 'RELABEL_OTHER', category: 'RELABEL_REBOX' },
  { label: '换箱', value: 'REBOX', category: 'RELABEL_REBOX' },
  { label: '拍照', value: 'PHOTO', category: 'OPERATION' },
  { label: '测量', value: 'MEASURE', category: 'OPERATION' },
  { label: '复核', value: 'REVIEW', category: 'OPERATION' },
  { label: '改板', value: 'RE_PALLET', category: 'OPERATION' },
  { label: '合板', value: 'MERGE_PALLET', category: 'OPERATION' },
  { label: '拆板', value: 'SPLIT_PALLET', category: 'OPERATION' },
  { label: '重新缠膜', value: 'REWRAP', category: 'OPERATION' },
  { label: '暂扣', value: 'HOLD', category: 'HOLD_RELEASE' },
  { label: '放行', value: 'RELEASE', category: 'HOLD_RELEASE' },
  { label: '注销', value: 'CANCEL', category: 'CANCEL_REASSIGN' },
  { label: '改派', value: 'REASSIGN', category: 'CANCEL_REASSIGN' },
  { label: '客户特殊操作', value: 'CUSTOM', category: 'OPERATION' },
  { label: '上架', value: 'PUTAWAY', category: 'PUTAWAY' },
  { label: '拣货', value: 'PICK', category: 'PICK' }
];

export const OPERATION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  OPERATION_TYPE_OPTIONS.map(o => [o.value, o.label])
);

export const STATUS_OPTIONS = [
  { label: '待执行', value: 'PENDING' },
  { label: '已接收', value: 'RECEIVED' },
  { label: '执行中', value: 'IN_PROGRESS' },
  { label: '待复核', value: 'PENDING_REVIEW' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已驳回', value: 'REJECTED' },
  { label: '已取消', value: 'CANCELLED' },
  { label: '异常', value: 'EXCEPTION' },
  { label: '超时', value: 'OVERDUE' }
];

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, o.label]));

export const STATUS_TAG: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PENDING: 'default',
  RECEIVED: 'info',
  IN_PROGRESS: 'info',
  PENDING_REVIEW: 'warning',
  COMPLETED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
  EXCEPTION: 'error',
  OVERDUE: 'error'
};

export const RISK_COLOR: Record<string, string> = {
  NORMAL: '#18a058',
  WARNING: '#f0a020',
  URGENT: '#f97316',
  OVERDUE: '#d03050'
};

export const RISK_LABEL: Record<string, string> = {
  NORMAL: '正常',
  WARNING: '临近',
  URGENT: '紧急',
  OVERDUE: '超时'
};

export const RELABEL_TYPE_OPTIONS = [
  { label: 'FBA标签', value: 'FBA标签' },
  { label: 'SKU标签', value: 'SKU标签' },
  { label: '箱唛', value: '箱唛' },
  { label: '板贴', value: '板贴' },
  { label: '其他客户标签', value: '其他客户标签' }
];

export const DEPT_OPTIONS = [
  { label: '上架组', value: '上架组' },
  { label: '拣货组', value: '拣货组' },
  { label: '库内作业组', value: '库内作业组' },
  { label: '质控组', value: '质控组' },
  { label: '异常处理组', value: '异常处理组' }
];

export const PRIORITY_OPTIONS = [
  { label: '低', value: 'LOW' },
  { label: '普通', value: 'NORMAL' },
  { label: '高', value: 'HIGH' },
  { label: '紧急', value: 'URGENT' }
];

export function formatRemainingMinutes(minutes: number) {
  if (minutes < 0) {
    const abs = Math.abs(minutes);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return h > 0 ? `超时 ${h}h${m}m` : `超时 ${m}m`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `剩余 ${h}h${m}m`;
  return `剩余 ${m}m`;
}
