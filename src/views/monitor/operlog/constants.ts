export const OPER_RESULT_LABEL: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失败'
};

export const OPER_RESULT_TAG: Record<string, 'success' | 'error' | 'default' | 'warning' | 'info'> = {
  SUCCESS: 'success',
  FAILED: 'error'
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

export const RISK_LEVEL_TAG: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  NORMAL: 'success',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error'
};

export const FAIL_REASON_LABEL: Record<string, string> = {
  PERMISSION_DENIED: '权限不足',
  PARAM_ERROR: '参数错误',
  SYSTEM_ERROR: '系统异常',
  STATUS_NOT_ALLOWED: '状态不允许',
  INVENTORY_NOT_ENOUGH: '库存不足'
};

export const OPER_CATEGORY_LABEL: Record<string, string> = {
  CREATE: '新增',
  UPDATE: '编辑',
  DELETE: '删除',
  APPROVE: '审批',
  IMPORT_EXPORT: '导入/导出',
  PRINT: '打印',
  DISPATCH: '派单',
  INVENTORY: '库存变更',
  PERMISSION: '权限变更',
  FEE: '费用变更',
  ABNORMAL: '异常操作'
};

export const TAB_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '新增', value: 'CREATE' },
  { label: '编辑', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
  { label: '审批', value: 'APPROVE' },
  { label: '导入/导出', value: 'IMPORT_EXPORT' },
  { label: '打印', value: 'PRINT' },
  { label: '派单', value: 'DISPATCH' },
  { label: '库存变更', value: 'INVENTORY' },
  { label: '权限变更', value: 'PERMISSION' },
  { label: '费用变更', value: 'FEE' },
  { label: '异常操作', value: 'ABNORMAL' }
] as const;

export const MODULE_OPTIONS = [
  { label: 'WMS', value: 'WMS' },
  { label: 'OMS', value: 'OMS' },
  { label: 'TMS', value: 'TMS' },
  { label: '系统管理', value: '系统管理' },
  { label: '系统监控', value: '系统监控' }
];

export const DEPT_OPTIONS = [
  { label: '信息技术部', value: '信息技术部' },
  { label: '仓储运营部', value: '仓储运营部' },
  { label: '订单运营部', value: '订单运营部' },
  { label: '运输调度部', value: '运输调度部' },
  { label: '财务部', value: '财务部' }
];

export const WAREHOUSE_OPTIONS = [
  { label: 'LAX 一号仓', value: 'LAX 一号仓' },
  { label: 'ONT 中转仓', value: 'ONT 中转仓' },
  { label: 'DFW 干线仓', value: 'DFW 干线仓' },
  { label: '总部虚拟仓', value: '总部虚拟仓' }
];

export const RESULT_OPTIONS = Object.entries(OPER_RESULT_LABEL).map(([value, label]) => ({ value, label }));
export const RISK_LEVEL_OPTIONS = Object.entries(RISK_LEVEL_LABEL).map(([value, label]) => ({ value, label }));

export const HIGH_RISK_OPERATIONS = [
  '删除订单',
  '注销货物',
  '库存扣减',
  '费用修改',
  '权限变更',
  '角色授权',
  '账号停用',
  '强制下线',
  '批量导入',
  '批量删除',
  '清理缓存',
  '修改系统配置',
  '修改审批流',
  '修改计费规则'
];
