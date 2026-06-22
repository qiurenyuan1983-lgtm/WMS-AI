import {
  MOCK_ROLES,
  MOCK_USER_ACCOUNT_TYPE,
  MOCK_USER_ROLES,
  MOCK_USER_WAREHOUSES
} from './system';
import { getAllSystemMenuIds, getSystemMenuIdsByModules } from './system-menu-seed';

export { ACCOUNT_TYPE_OPTIONS, MOCK_ORG_SCOPE } from './user-workbench-constants';

export type UserWorkbenchRow = Api.System.User & {
  roleNames: string[];
  roleIds: CommonType.IdType[];
  postName: string;
  warehouseLabel: string;
  accountType: string;
  accountTypeLabel: string;
  lastLoginTime: string;
};

const DATA_SCOPE_LABEL: Record<string, string> = {
  '1': '全部数据',
  '2': '自定义数据',
  '3': '本部门数据',
  '4': '本部门及以下',
  '5': '仅本人数据'
};

let menuFlatCache: Api.System.Menu[] | null = null;
const summaryCache = new Map<string, UserPermissionSummary>();

async function getMenuFlatLazy() {
  if (menuFlatCache) return menuFlatCache;
  const { getMenuFlat } = await import('./system');
  menuFlatCache = getMenuFlat();
  return menuFlatCache;
}

export function invalidateUserPermissionSummary(userId?: CommonType.IdType) {
  if (userId == null) {
    summaryCache.clear();
    return;
  }
  summaryCache.delete(String(userId));
}

function countButtons(menuIds: number[], menuFlat: Api.System.Menu[]) {
  const idSet = new Set(menuIds);
  return menuFlat.filter(m => m.menuType === 'F' && idSet.has(Number(m.menuId))).length;
}

function countMenus(menuIds: number[], menuFlat: Api.System.Menu[]) {
  const idSet = new Set(menuIds);
  return menuFlat.filter(m => (m.menuType === 'M' || m.menuType === 'C') && idSet.has(Number(m.menuId))).length;
}

function getRoleMenuIds(roleId: CommonType.IdType, menuFlat: Api.System.Menu[]) {
  if (Number(roleId) === 1) return getAllSystemMenuIds(menuFlat);
  if (Number(roleId) === 2) return getSystemMenuIdsByModules(['system', 'base', 'wms'], menuFlat);
  if (Number(roleId) === 3) return getSystemMenuIdsByModules(['system', 'base', 'oms'], menuFlat);
  if (Number(roleId) === 4) return getSystemMenuIdsByModules(['system'], menuFlat);
  return [];
}

export interface UserPermissionSummary {
  roleCount: number;
  roleLabel: string;
  menuCount: number;
  buttonCount: number;
  dataScopeLabel: string;
  warehouseCount: number;
  warehouseLabel: string;
  customerLabel: string;
  supplierLabel: string;
  pdaLabel: string;
  securityLabel: string;
}

export function getUserPermissionSummary(userId: CommonType.IdType): UserPermissionSummary {
  const cacheKey = String(userId);
  const cached = summaryCache.get(cacheKey);
  if (cached) return cached;

  const roleIds = MOCK_USER_ROLES[Number(userId)] || [];
  const roles = roleIds.map(id => MOCK_ROLES.find(r => r.roleId === id)).filter(Boolean) as Api.System.Role[];
  const whIds = MOCK_USER_WAREHOUSES[Number(userId)] || [];
  const accountType = MOCK_USER_ACCOUNT_TYPE[Number(userId)] || 'INTERNAL';
  const dataScope = roles[0]?.dataScope || '5';

  // 同步路径：菜单树未加载时用角色数估算，避免阻塞 UI
  if (!menuFlatCache) {
    const fallback: UserPermissionSummary = {
      roleCount: roles.length,
      roleLabel: roles.length ? `已选 ${roles.length} 个角色` : '未分配',
      menuCount: roleIds.includes(1) ? 0 : roles.length * 12,
      buttonCount: roleIds.includes(1) ? 0 : roles.length * 24,
      dataScopeLabel: DATA_SCOPE_LABEL[dataScope] || '仅本人数据',
      warehouseCount: whIds.length,
      warehouseLabel: whIds.length ? `已授权 ${whIds.length} 个仓库` : '未授权',
      customerLabel: roleIds.includes(1) || roleIds.includes(3) ? '全部客户' : '部分客户',
      supplierLabel: roleIds.includes(1) || roleIds.includes(2) ? '全部供应商' : '部分供应商',
      pdaLabel: accountType === 'PDA' || roleIds.includes(1) ? '已授权' : '未授权',
      securityLabel: '已设置'
    };
    void getUserPermissionSummaryAsync(userId);
    return fallback;
  }

  return buildUserPermissionSummary(userId, menuFlatCache);
}

async function getUserPermissionSummaryAsync(userId: CommonType.IdType) {
  const menuFlat = await getMenuFlatLazy();
  const result = buildUserPermissionSummary(userId, menuFlat);
  summaryCache.set(String(userId), result);
  return result;
}

function buildUserPermissionSummary(userId: CommonType.IdType, menuFlat: Api.System.Menu[]): UserPermissionSummary {
  const cacheKey = String(userId);
  const roleIds = MOCK_USER_ROLES[Number(userId)] || [];
  const roles = roleIds.map(id => MOCK_ROLES.find(r => r.roleId === id)).filter(Boolean) as Api.System.Role[];
  const menuIdSet = new Set<number>();
  roles.forEach(role => getRoleMenuIds(role.roleId, menuFlat).forEach(id => menuIdSet.add(id)));
  const menuIds = [...menuIdSet];
  const whIds = MOCK_USER_WAREHOUSES[Number(userId)] || [];
  const accountType = MOCK_USER_ACCOUNT_TYPE[Number(userId)] || 'INTERNAL';
  const dataScope = roles[0]?.dataScope || '5';

  const result: UserPermissionSummary = {
    roleCount: roles.length,
    roleLabel: roles.length ? `已选 ${roles.length} 个角色` : '未分配',
    menuCount: countMenus(menuIds, menuFlat),
    buttonCount: countButtons(menuIds, menuFlat),
    dataScopeLabel: DATA_SCOPE_LABEL[dataScope] || '仅本人数据',
    warehouseCount: whIds.length,
    warehouseLabel: whIds.length ? `已授权 ${whIds.length} 个仓库` : '未授权',
    customerLabel: roleIds.includes(1) || roleIds.includes(3) ? '全部客户' : '部分客户',
    supplierLabel: roleIds.includes(1) || roleIds.includes(2) ? '全部供应商' : '部分供应商',
    pdaLabel: accountType === 'PDA' || roleIds.includes(1) ? '已授权' : '未授权',
    securityLabel: '已设置'
  };
  summaryCache.set(cacheKey, result);
  return result;
}

export async function loadUserPermissionSummary(userId: CommonType.IdType) {
  return getUserPermissionSummaryAsync(userId);
}

export type { AuditLogType, UserAuditLogRow } from './user-audit-logs';
export { getUserAuditLogs } from './user-audit-logs';
