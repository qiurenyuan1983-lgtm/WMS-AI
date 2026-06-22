export const PDA_GRADIENT = 'linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%)';

export const PDA_CARD_RADIUS = '12px';

export const PDA_BTN_MIN_H = '48px';

export const PDA_STATUS = {
  success: '#34c759',
  warning: '#ff9500',
  error: '#ff3b30',
  info: '#5ac8fa'
} as const;

export const TASK_TYPE_MAP: Record<string, string> = {
  putaway: '上库',
  move: '库位变更',
  count: '盘点',
  operation: '订单操作',
  exception: '异常处理',
  receive: '收货',
  merge: '合板',
  split: '拆板'
};

export const VALID_TASK_TYPES = Object.keys(TASK_TYPE_MAP);

export const EXCEPTION_REASONS = ['破损', '短少', '错货', '标签异常', '其他'] as const;
