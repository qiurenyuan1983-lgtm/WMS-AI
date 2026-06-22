import type { EnterpriseKpiKey } from '@/mock/data/enterprise-dashboard';

export type DashboardPerspective = 'manager' | 'inbound_lead' | 'outbound_lead' | 'finance' | 'warehouse_op';

export type DashboardSection =
  | 'kpi'
  | 'charts'
  | 'tasks'
  | 'alerts'
  | 'dock'
  | 'appointments'
  | 'logs'
  | 'ai';

export const DASHBOARD_PERSPECTIVE_OPTIONS: Array<{ label: string; value: DashboardPerspective }> = [
  { label: '\u7cfb\u7edf\u7ba1\u7406\u5458\uff08\u5168\u90e8\u6743\u9650\uff09', value: 'manager' },
  { label: '\u5165\u5e93\u4e3b\u7ba1\u89c6\u89d2', value: 'inbound_lead' },
  { label: '\u51fa\u5e93\u4e3b\u7ba1\u89c6\u89d2', value: 'outbound_lead' },
  { label: '\u8d22\u52a1\u89c6\u89d2', value: 'finance' },
  { label: '\u4ed3\u5e93\u64cd\u4f5c\u5458\u89c6\u89d2', value: 'warehouse_op' }
];

const ROLE_KPI_KEYS: Record<DashboardPerspective, EnterpriseKpiKey[]> = {
  manager: ['inbound', 'outbound', 'inventory', 'trip', 'exception', 'dock'],
  inbound_lead: ['inbound', 'inventory', 'exception'],
  outbound_lead: ['outbound', 'trip', 'exception', 'dock'],
  finance: ['inbound', 'outbound', 'inventory'],
  warehouse_op: ['inbound', 'outbound', 'inventory', 'dock']
};

const ROLE_SECTIONS: Record<DashboardPerspective, DashboardSection[]> = {
  manager: ['kpi', 'charts', 'tasks', 'alerts', 'dock', 'appointments', 'logs', 'ai'],
  inbound_lead: ['kpi', 'charts', 'tasks', 'alerts', 'appointments', 'logs', 'ai'],
  outbound_lead: ['kpi', 'charts', 'tasks', 'alerts', 'dock', 'appointments', 'logs', 'ai'],
  finance: ['kpi', 'charts', 'logs', 'ai'],
  warehouse_op: ['kpi', 'tasks', 'alerts', 'dock', 'appointments']
};

export function getVisibleKpiKeys(perspective: DashboardPerspective) {
  return ROLE_KPI_KEYS[perspective] || ROLE_KPI_KEYS.manager;
}

export function isSectionVisible(perspective: DashboardPerspective, section: DashboardSection) {
  return (ROLE_SECTIONS[perspective] || ROLE_SECTIONS.manager).includes(section);
}

export const TREND_DAY_OPTIONS = [
  { label: '\u8fd17\u5929', value: 7 },
  { label: '\u8fd130\u5929', value: 30 }
];

export const AUTO_REFRESH_MS = 60_000;
