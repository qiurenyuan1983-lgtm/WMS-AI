export const ONLINE_STATUS_LABEL: Record<string, string> = {
  ONLINE: '在线',
  IDLE: '空闲',
  EXPIRING: '即将超时',
  ABNORMAL: '异常',
  FORCE_LOGOUT: '已强制下线',
  EXPIRED: '已过期'
};

export const ONLINE_STATUS_TAG: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
  ONLINE: 'success',
  IDLE: 'info',
  EXPIRING: 'warning',
  ABNORMAL: 'error',
  FORCE_LOGOUT: 'warning',
  EXPIRED: 'default'
};

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

export const RISK_LEVEL_TAG: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  NORMAL: 'success',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error'
};

export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  SYSTEM: '系统管理员',
  WMS: '仓储账号',
  OMS: '运营账号',
  TMS: '运输账号',
  DRIVER: '司机端',
  SUPPLIER: '供应商',
  CUSTOMER: '客户账号'
};

export const LOGIN_PORT_LABEL: Record<string, string> = {
  PC: 'PC',
  PDA: 'PDA',
  MOBILE: '移动端',
  API: 'API'
};

export const TAB_OPTIONS = [
  { label: '全部在线', value: 'ALL' },
  { label: 'PC端', value: 'PC' },
  { label: 'PDA端', value: 'PDA' },
  { label: '客户门户', value: 'CUSTOMER' },
  { label: '供应商门户', value: 'SUPPLIER' },
  { label: '司机端', value: 'DRIVER' },
  { label: '空闲会话', value: 'IDLE' },
  { label: '异常会话', value: 'ABNORMAL' }
] as const;

export const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => ({ value, label }));
export const LOGIN_PORT_OPTIONS = Object.entries(LOGIN_PORT_LABEL).map(([value, label]) => ({ value, label }));
export const ONLINE_STATUS_OPTIONS = Object.entries(ONLINE_STATUS_LABEL).map(([value, label]) => ({ value, label }));
export const RISK_LEVEL_OPTIONS = Object.entries(RISK_LEVEL_LABEL).map(([value, label]) => ({ value, label }));

export const DEPT_OPTIONS = [
  { label: '信息技术部', value: '信息技术部' },
  { label: '仓储运营部', value: '仓储运营部' },
  { label: '订单运营部', value: '订单运营部' },
  { label: '运输调度部', value: '运输调度部' },
  { label: '供应商协同部', value: '供应商协同部' },
  { label: '客户协同', value: '客户协同' }
];

export const WAREHOUSE_OPTIONS = [
  { label: 'LAX 一号仓', value: 'LAX 一号仓' },
  { label: 'ONT 中转仓', value: 'ONT 中转仓' },
  { label: 'DFW 干线仓', value: 'DFW 干线仓' },
  { label: '总部虚拟仓', value: '总部虚拟仓' }
];
