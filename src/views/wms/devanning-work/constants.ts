export type DevanningWorkViewMode = 'list' | 'kanban';

export const DEVANNING_WORK_VIEW_OPTIONS: Array<{ label: string; value: DevanningWorkViewMode }> = [
  { label: '列表视图', value: 'list' },
  { label: '看板视图', value: 'kanban' }
];

export const KANBAN_STATUS_KEYS = [
  'UNPICKEDUP',
  'PICKEDUP',
  'ARRIVED',
  'DEVANNING',
  'DEVANNED',
  'EXCEPTION',
  'CANCELLED'
] as const;

export const KANBAN_STATUS_LABEL: Record<string, string> = {
  UNPICKEDUP: '未提柜',
  PICKEDUP: '已提柜',
  ARRIVED: '已到仓',
  DEVANNING: '拆柜中',
  DEVANNED: '已完成',
  EXCEPTION: '异常',
  CANCELLED: '已取消'
};

export const KANBAN_COLUMN_BG: Record<string, string> = {
  UNPICKEDUP: '#f8fafc',
  PICKEDUP: '#eff6ff',
  ARRIVED: '#fffbeb',
  DEVANNING: '#ecfeff',
  DEVANNED: '#f0fdf4',
  EXCEPTION: '#fef2f2',
  CANCELLED: '#f3f4f6'
};

export const KANBAN_STATUS_TAG: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  UNPICKEDUP: 'default',
  PICKEDUP: 'info',
  ARRIVED: 'warning',
  DEVANNING: 'info',
  DEVANNED: 'success',
  EXCEPTION: 'error',
  CANCELLED: 'default'
};
