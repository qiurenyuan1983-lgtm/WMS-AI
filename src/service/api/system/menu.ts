import { request } from '@/service/request';

/** 获取菜单列表 */
export function fetchGetMenuList(params?: Api.System.MenuSearchParams, signal?: AbortSignal) {
  return request<Api.System.MenuList>({
    url: '/system/menu/list',
    method: 'get',
    params,
    signal
  });
}

/** 新增菜单 */
export function fetchCreateMenu(data: Api.System.MenuOperateParams) {
  return request<boolean>({
    url: '/system/menu',
    method: 'post',
    data
  });
}

/** 修改菜单 */
export function fetchUpdateMenu(data: Api.System.MenuOperateParams) {
  return request<boolean>({
    url: '/system/menu',
    method: 'put',
    data
  });
}

/** 删除菜单 */
export function fetchDeleteMenu(menuId: CommonType.IdType) {
  return request<boolean>({
    url: `/system/menu/${menuId}`,
    method: 'delete'
  });
}

/** 获取菜单树 */
export function fetchGetMenuTreeSelect() {
  return request<Api.System.MenuList>({
    url: 'system/menu/treeselect',
    method: 'get'
  });
}

/** 获取角色菜单权限 */
export function fetchGetRoleMenuTreeSelect(roleId: CommonType.IdType) {
  return request<Api.System.RoleMenuTreeSelect>({
    url: `/system/menu/roleMenuTreeselect/${roleId}`,
    method: 'get'
  });
}

/** 获取租户套餐关联菜单 */
export function fetchGetTenantPackageMenuTreeSelect(packageId: CommonType.IdType) {
  return request<Api.System.TenantPackageMenuTreeSelect>({
    url: `/system/menu/tenantPackageMenuTreeselect/${packageId}`,
    method: 'get'
  });
}

/** 级联删除菜单 */
export function fetchCascadeDeleteMenu(menuIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/system/menu/cascade/${menuIds.join(',')}`,
    method: 'delete'
  });
}

/** 批量更新同级菜单排序 */
export function fetchSortMenus(items: Array<{ menuId: CommonType.IdType; orderNum: number }>) {
  return request<boolean>({
    url: '/system/menu/sort',
    method: 'put',
    data: { items }
  });
}

/** 刷新菜单路由缓存 */
export function fetchRefreshMenuCache() {
  return request<boolean>({
    url: '/system/menu/refreshCache',
    method: 'post'
  });
}

/** 检查菜单是否可删除 */
export function fetchGetMenuDeletable(menuId: CommonType.IdType) {
  return request<Api.System.MenuDeletableResult>({
    url: `/system/menu/${menuId}/deletable`,
    method: 'get'
  });
}

/** 批量启用/停用菜单 */
export function fetchBatchUpdateMenuStatus(data: Api.System.MenuBatchStatusParams) {
  return request<boolean>({
    url: '/system/menu/batchStatus',
    method: 'put',
    data
  });
}

/** 导出菜单配置 */
export function fetchExportMenus(params?: Api.System.MenuExportParams) {
  return request<Api.System.Menu[]>({
    url: '/system/menu/export',
    method: 'get',
    params
  });
}

/** 导入菜单配置 */
export function fetchImportMenus(data: Api.System.MenuImportParams) {
  return request<Api.System.MenuImportResult>({
    url: '/system/menu/import',
    method: 'post',
    data
  });
}

/** 应用按钮权限模板 */
export function fetchApplyMenuButtonTemplate(data: Api.System.MenuButtonTemplateApplyParams) {
  return request<Api.System.MenuButtonTemplateApplyResult>({
    url: '/system/menu/buttonTemplate',
    method: 'post',
    data
  });
}
