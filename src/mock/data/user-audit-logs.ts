export type AuditLogType = 'login' | 'operation' | 'permission' | 'password';

export interface UserAuditLogRow {
  id: number;
  logType: AuditLogType;
  time: string;
  operator: string;
  target: string;
  actionType: string;
  content: string;
  beforeValue: string;
  afterValue: string;
  ip: string;
  userId?: CommonType.IdType;
}

export const MOCK_USER_AUDIT_LOGS: UserAuditLogRow[] = [
  {
    id: 1,
    logType: 'operation',
    time: '2026-06-03 14:28:11',
    operator: 'admin',
    target: 'wms_mgr',
    actionType: '修改用户',
    content: '更新用户基础信息',
    beforeValue: '仓库管理员',
    afterValue: '仓库经理',
    ip: '192.168.1.10',
    userId: 2
  },
  {
    id: 2,
    logType: 'operation',
    time: '2026-06-03 13:55:02',
    operator: 'admin',
    target: 'inbound01',
    actionType: '分配角色',
    content: '批量分配 WMS 仓储经理角色',
    beforeValue: '无',
    afterValue: 'WMS 仓储经理',
    ip: '192.168.1.10',
    userId: 3
  },
  {
    id: 3,
    logType: 'permission',
    time: '2026-06-03 11:20:33',
    operator: 'admin',
    target: 'oms01',
    actionType: '菜单权限',
    content: '授权 OMS 运营菜单',
    beforeValue: '12 个菜单',
    afterValue: '24 个菜单',
    ip: '192.168.1.10',
    userId: 4
  },
  {
    id: 4,
    logType: 'login',
    time: '2026-06-03 09:01:18',
    operator: 'admin',
    target: 'admin',
    actionType: '登录成功',
    content: 'PC 端登录',
    beforeValue: '-',
    afterValue: '-',
    ip: '127.0.0.1',
    userId: 1
  },
  {
    id: 5,
    logType: 'password',
    time: '2026-06-02 16:40:00',
    operator: 'admin',
    target: 'demo',
    actionType: '重置密码',
    content: '管理员重置用户密码',
    beforeValue: '******',
    afterValue: '******',
    ip: '192.168.1.10',
    userId: 5
  },
  {
    id: 6,
    logType: 'login',
    time: '2026-06-02 08:30:45',
    operator: 'wms_mgr',
    target: 'wms_mgr',
    actionType: '登录成功',
    content: 'PC 端登录',
    beforeValue: '-',
    afterValue: '-',
    ip: '10.0.0.21',
    userId: 2
  }
];

export function getUserAuditLogs(params?: {
  logType?: AuditLogType;
  userId?: CommonType.IdType | null;
  pageNum?: number;
  pageSize?: number;
}) {
  let rows = [...MOCK_USER_AUDIT_LOGS];
  if (params?.logType) rows = rows.filter(r => r.logType === params.logType);
  if (params?.userId != null && params.userId !== '') {
    rows = rows.filter(r => String(r.userId) === String(params.userId));
  }
  rows.sort((a, b) => (a.time < b.time ? 1 : -1));
  const pageNum = Number(params?.pageNum || 1);
  const pageSize = Number(params?.pageSize || 10);
  const start = (pageNum - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length };
}
