import { PORT_OPTIONS, ROLE_OPTIONS, WAREHOUSE_OPTIONS } from '@/views/system/theme-config/shared/theme-visual-config';

export { PORT_OPTIONS, WAREHOUSE_OPTIONS, ROLE_OPTIONS };

export const TENANT_OPTIONS = [
  { label: '演示租户', value: '000000' },
  { label: 'Demo Logistics', value: '100001' },
  { label: 'Trial Tenant', value: '100002' }
];

export const PERM_TYPE_OPTIONS = [
  { label: '菜单权限', value: 'menu' },
  { label: '按钮权限', value: 'button' },
  { label: '接口权限', value: 'api' }
];

export const OPEN_MODE_OPTIONS = [
  { label: '当前窗口', value: 'self' },
  { label: '新窗口', value: 'blank' },
  { label: '内嵌 iframe', value: 'iframe' }
];

const PORT_LABEL = Object.fromEntries(PORT_OPTIONS.map(o => [o.value, o.label]));

export function formatApplicablePorts(value?: string | null) {
  if (!value) return '-';
  return value
    .split(',')
    .filter(Boolean)
    .map(v => PORT_LABEL[v] || v)
    .join('、');
}

export function splitCsv(value?: string | null) {
  return String(value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function joinCsv(values?: string[] | null) {
  return (values || []).filter(Boolean).join(',');
}

export type ButtonPermTemplateItem = {
  menuName: string;
  permName: string;
  perms: string;
  orderNum: number;
  highRisk?: boolean;
  needConfirm?: boolean;
  auditLog?: boolean;
};

export type ButtonPermTemplate = {
  key: string;
  label: string;
  /** 页面菜单 i18nKey，如 route.wms_transfer-workbench */
  routeKey: string;
  buttons: ButtonPermTemplateItem[];
};

/** 业务按钮权限模板（原型演示） */
export const BUTTON_PERM_TEMPLATES: ButtonPermTemplate[] = [
  {
    key: 'wms_instruction',
    label: 'WMS 指令中心（中转工作台）',
    routeKey: 'route.wms_transfer-workbench',
    buttons: [
      { menuName: '查看', permName: '查看', perms: 'wms:instruction:view', orderNum: 1 },
      { menuName: '新增指令', permName: '新增指令', perms: 'wms:instruction:add', orderNum: 2 },
      { menuName: '编辑指令', permName: '编辑指令', perms: 'wms:instruction:edit', orderNum: 3, auditLog: true },
      { menuName: '指派指令', permName: '指派指令', perms: 'wms:instruction:assign', orderNum: 4, auditLog: true },
      { menuName: '执行指令', permName: '执行指令', perms: 'wms:instruction:execute', orderNum: 5, highRisk: true, needConfirm: true, auditLog: true },
      { menuName: '暂扣货物', permName: '暂扣货物', perms: 'wms:instruction:hold', orderNum: 6, highRisk: true, needConfirm: true, auditLog: true },
      { menuName: '暂扣放行', permName: '暂扣放行', perms: 'wms:instruction:release', orderNum: 7, highRisk: true, needConfirm: true, auditLog: true },
      { menuName: '换标业务', permName: '换标业务', perms: 'wms:instruction:relabel', orderNum: 8, auditLog: true },
      { menuName: '换箱业务', permName: '换箱业务', perms: 'wms:instruction:rebox', orderNum: 9, auditLog: true },
      { menuName: '注销货物', permName: '注销货物', perms: 'wms:instruction:cancelGoods', orderNum: 10, highRisk: true, needConfirm: true, auditLog: true },
      { menuName: '改派业务', permName: '改派业务', perms: 'wms:instruction:redirect', orderNum: 11, highRisk: true, needConfirm: true, auditLog: true },
      { menuName: '导出', permName: '导出', perms: 'wms:instruction:export', orderNum: 12, auditLog: true },
      { menuName: '查看日志', permName: '查看日志', perms: 'wms:instruction:viewLog', orderNum: 13 }
    ]
  }
];

export function findTemplateByRouteKey(routeKey: string) {
  return BUTTON_PERM_TEMPLATES.find(item => item.routeKey === routeKey);
}
