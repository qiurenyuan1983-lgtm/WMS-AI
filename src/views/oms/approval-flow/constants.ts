export const APPROVAL_FLOW_CATEGORIES: Array<{ key: Api.Oms.ApprovalFlowCategory; label: string }> = [
  { key: 'FEE', label: '费用审批流' },
  { key: 'SUPPLIER_BILL', label: '供应商账单审批流' },
  { key: 'EXCEPTION_COMPENSATION', label: '异常赔付审批流' },
  { key: 'OPERATION_ADJUSTMENT', label: '操作调整审批流' },
  { key: 'PERMISSION_CHANGE', label: '权限变更审批流' },
  { key: 'PRICE_MODIFY', label: '价格修改审批流' },
  { key: 'DATA_DELETE', label: '删除数据审批流' },
  { key: 'TEMP_AUTH', label: '临时授权审批流' }
];

export const APPROVAL_NODE_TYPE_OPTIONS: CommonType.Option[] = [
  { label: '指定角色', value: 'ROLE' },
  { label: '指定用户', value: 'USER' },
  { label: '部门负责人', value: 'DEPT_HEAD' },
  { label: '直属上级', value: 'SUPERVISOR' }
];

export const APPROVAL_MODE_OPTIONS: CommonType.Option[] = [
  { label: '或签（任一通过）', value: 'ANY' },
  { label: '会签（全部通过）', value: 'ALL' }
];

export const TRIGGER_HINTS: Record<Api.Oms.ApprovalFlowCategory, string> = {
  FEE: '费用金额超过阈值、新增/修改费用项时触发',
  SUPPLIER_BILL: '供应商账单提交、账单金额变更时触发',
  EXCEPTION_COMPENSATION: '异常赔付申请、赔付金额超过阈值时触发',
  OPERATION_ADJUSTMENT: '库存调整、库位变更、单据状态回退等操作时触发',
  PERMISSION_CHANGE: '用户角色变更、菜单/按钮权限调整时触发',
  PRICE_MODIFY: '报价/费率/单价修改时触发',
  DATA_DELETE: '删除订单、账单、库存等关键数据时触发',
  TEMP_AUTH: '临时授权访问、跨仓操作、限时提权时触发'
};

export const ROLE_APPROVER_OPTIONS: CommonType.Option[] = [
  { label: '仓库主管', value: 'WAREHOUSE_SUPERVISOR' },
  { label: '仓库经理', value: 'WAREHOUSE_MANAGER' },
  { label: '运营主管', value: 'OPS_SUPERVISOR' },
  { label: '财务主管', value: 'FINANCE_SUPERVISOR' },
  { label: '系统管理员', value: 'SYS_ADMIN' }
];
