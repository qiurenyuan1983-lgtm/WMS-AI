import { request } from '@/service/request';

export function fetchGetOrgScopeCompanies() {
  return request<Api.System.OrgCompanyOption[]>({ url: '/system/org-scope/companies', method: 'get' });
}

export function fetchGetOrgScopeWarehouses(companyId?: CommonType.IdType | null) {
  return request<Api.System.OrgWarehouseOption[]>({ url: '/system/org-scope/warehouses', method: 'get', params: { companyId } });
}

export function fetchGetCurrentOrgScope() {
  return request<Api.System.OrgScopeCurrent>({ url: '/system/org-scope/current', method: 'get' });
}

export function fetchUpdateCurrentOrgScope(data: Api.System.OrgScopeCurrentOperateParams) {
  return request<null>({ url: '/system/org-scope/current', method: 'put', data });
}

export function fetchGetRoleOrgScope(roleId: CommonType.IdType) {
  return request<Api.System.RoleOrgScope>({ url: `/system/org-scope/role/${roleId}`, method: 'get' });
}

export function fetchUpdateRoleOrgScope(data: Api.System.RoleOrgScopeOperateParams) {
  return request<null>({ url: '/system/org-scope/role', method: 'put', data });
}

