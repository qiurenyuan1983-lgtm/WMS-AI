export const RISK_LEVEL_LABEL: Record<string, string> = {
  NORMAL: '正常',
  LOW: '低风险',
  MEDIUM: '中风险',
  HIGH: '高风险'
};

export const RISK_LEVEL_COLOR: Record<string, string> = {
  NORMAL: '#18a058',
  LOW: '#2563eb',
  MEDIUM: '#f0a020',
  HIGH: '#d03050'
};

export const RISK_LEVEL_TAG: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
  NORMAL: 'success',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error'
};

export const INSTANCE_STATUS_LABEL: Record<string, string> = {
  RUNNING: '运行中',
  WARNING: '告警',
  OFFLINE: '离线'
};

export const INSTANCE_STATUS_TAG: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  RUNNING: 'success',
  WARNING: 'warning',
  OFFLINE: 'error'
};

export const ALERT_STATUS_LABEL: Record<string, string> = {
  PENDING: '待处理',
  ACKED: '已确认',
  RESOLVED: '已解决',
  IGNORED: '已忽略'
};

export const ALERT_STATUS_TAG: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING: 'error',
  ACKED: 'warning',
  RESOLVED: 'success',
  IGNORED: 'default'
};

export const HIGH_RISK_ACTIONS = ['FLUSHDB', 'FLUSHALL', 'RESTART', 'SET_MAXMEMORY'] as const;

export const ALERT_RULES = [
  '内存使用率超过 80%',
  '命中率低于 80%',
  '连接数超过阈值',
  'QPS 异常升高',
  'Redis 实例离线',
  '慢查询超过阈值',
  '大 Key 超过阈值',
  '热 Key 访问异常',
  'Key 数量异常增长',
  'evicted_keys 持续增加'
];
