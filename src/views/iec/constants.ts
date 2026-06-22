export const EMPLOYEE_STATUS_META: Record<
  Api.Iec.EmployeeStatus,
  { label: string; type: 'success' | 'warning' | 'error' | 'default' | 'info' }
> = {
  WORKING: { label: '工作中', type: 'success' },
  IDLE: { label: '空闲', type: 'info' },
  ERROR: { label: '异常', type: 'error' },
  PAUSED: { label: '暂停', type: 'warning' }
};

export const FLOW_STATUS_META: Record<
  Api.Iec.FlowStatus,
  { label: string; type: 'success' | 'warning' | 'default' }
> = {
  ENABLED: { label: '已启用', type: 'success' },
  DISABLED: { label: '已停用', type: 'warning' },
  DRAFT: { label: '草稿', type: 'default' }
};

export const TASK_STATUS_META: Record<
  Api.Iec.TaskStatus,
  { label: string; type: 'success' | 'warning' | 'error' | 'default' | 'info' }
> = {
  PENDING: { label: '等待执行', type: 'default' },
  RUNNING: { label: '执行中', type: 'info' },
  SUCCESS: { label: '成功', type: 'success' },
  FAILED: { label: '失败', type: 'error' },
  WAITING_MANUAL: { label: '等待人工', type: 'warning' },
  CANCELLED: { label: '已取消', type: 'default' }
};

export const TAKEOVER_STATUS_META: Record<
  Api.Iec.TakeoverStatus,
  { label: string; type: 'success' | 'warning' | 'error' | 'default' | 'info' }
> = {
  OPEN: { label: '待接管', type: 'warning' },
  IN_PROGRESS: { label: '处理中', type: 'info' },
  RESOLVED: { label: '已处理', type: 'success' },
  CLOSED: { label: '已关闭', type: 'default' }
};

export const CREDENTIAL_STATUS_META: Record<
  Api.Iec.CredentialStatus,
  { label: string; type: 'success' | 'warning' | 'error' }
> = {
  ACTIVE: { label: '正常', type: 'success' },
  EXPIRED: { label: '已过期', type: 'warning' },
  DISABLED: { label: '已禁用', type: 'error' }
};

export const LOG_STATUS_META: Record<
  Api.Iec.LogStatus,
  { label: string; type: 'success' | 'error' | 'default' }
> = {
  SUCCESS: { label: '成功', type: 'success' },
  FAILED: { label: '失败', type: 'error' },
  SKIPPED: { label: '跳过', type: 'default' }
};

export const RPA_NODE_PALETTE: Array<{ type: Api.Iec.RpaNodeType; label: string; icon: string }> = [
  { type: 'READ_ORDER', label: '读取订单', icon: 'mdi:file-document-outline' },
  { type: 'QUERY_INVENTORY', label: '查询库存', icon: 'mdi:package-variant' },
  { type: 'CONDITION', label: '判断条件', icon: 'mdi:source-branch' },
  { type: 'SEND_EMAIL', label: '发送邮件', icon: 'mdi:email-outline' },
  { type: 'OPEN_WEB', label: '打开网页', icon: 'mdi:web' },
  { type: 'FILL_FORM', label: '填写表单', icon: 'mdi:form-textbox' },
  { type: 'CLICK_BUTTON', label: '点击按钮', icon: 'mdi:gesture-tap-button' },
  { type: 'GET_RESULT', label: '获取结果', icon: 'mdi:download-outline' },
  { type: 'CREATE_TASK', label: '生成任务', icon: 'mdi:clipboard-plus-outline' },
  { type: 'MANUAL_CONFIRM', label: '人工确认', icon: 'mdi:account-check-outline' }
];

export const HIGH_RISK_ACTIONS = ['删除订单', '付款', '关闭严重异常', '扣减库存'];
