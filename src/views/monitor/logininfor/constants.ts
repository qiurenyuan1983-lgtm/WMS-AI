export const LOGIN_STATUS_LABEL: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  ABNORMAL: '异常',
  LOCKED: '锁定',
  LOGGED_OUT: '已退出',
  ONLINE: '在线',
  FORCE_LOGOUT: '强制退出'
};

export const LOGIN_STATUS_TAG: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
  SUCCESS: 'success',
  FAILED: 'error',
  ABNORMAL: 'warning',
  LOCKED: 'error',
  LOGGED_OUT: 'default',
  ONLINE: 'info',
  FORCE_LOGOUT: 'warning'
};

export const FAIL_REASON_LABEL: Record<string, string> = {
  PASSWORD_ERROR: '密码错误',
  CAPTCHA_ERROR: '验证码错误',
  USER_NOT_FOUND: '账号不存在',
  USER_DISABLED: '账号停用',
  ACCOUNT_LOCKED: '账号锁定',
  IP_RESTRICTED: 'IP限制',
  DEVICE_RESTRICTED: '设备限制',
  PERMISSION_DENIED: '权限不足',
  SYSTEM_ERROR: '系统异常'
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

export const LOGIN_METHOD_LABEL: Record<string, string> = {
  PASSWORD: '密码登录',
  SMS: '短信验证码',
  SSO: '单点登录',
  SCAN: '扫码登录',
  TOKEN: '令牌登录'
};

export const TAB_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '异常登录', value: 'ABNORMAL' },
  { label: '账号锁定', value: 'LOCKED' },
  { label: '在线用户', value: 'ONLINE' },
  { label: '已退出', value: 'LOGGED_OUT' }
] as const;

export const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => ({ value, label }));
export const LOGIN_PORT_OPTIONS = Object.entries(LOGIN_PORT_LABEL).map(([value, label]) => ({ value, label }));
export const LOGIN_METHOD_OPTIONS = Object.entries(LOGIN_METHOD_LABEL).map(([value, label]) => ({ value, label }));
export const RISK_LEVEL_OPTIONS = Object.entries(RISK_LEVEL_LABEL).map(([value, label]) => ({ value, label }));
export const LOGIN_STATUS_OPTIONS = Object.entries(LOGIN_STATUS_LABEL).map(([value, label]) => ({ value, label }));

export const DEPT_OPTIONS = [
  { label: '信息技术部', value: '信息技术部' },
  { label: '仓储运营部', value: '仓储运营部' },
  { label: '订单运营部', value: '订单运营部' },
  { label: '运输调度部', value: '运输调度部' },
  { label: '供应商协同部', value: '供应商协同部' }
];

export const WAREHOUSE_OPTIONS = [
  { label: 'LAX 一号仓', value: 'LAX 一号仓' },
  { label: 'ONT 中转仓', value: 'ONT 中转仓' },
  { label: 'DFW 干线仓', value: 'DFW 干线仓' },
  { label: '总部虚拟仓', value: '总部虚拟仓' }
];
