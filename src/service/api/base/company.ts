import { request } from '@/service/request';

export function fetchGetCompanyList(params?: Api.Base.MdmCompanySearchParams) {
  return request<Api.Base.MdmCompanyList>({ url: '/base/company/list', method: 'get', params });
}

export function fetchGetCompanyDetail(id: CommonType.IdType) {
  return request<Api.Base.MdmCompany>({ url: `/base/company/${id}`, method: 'get' });
}

export function fetchCreateCompany(data: Api.Base.MdmCompanyOperateParams) {
  return request<null>({ url: '/base/company', method: 'post', data });
}

export function fetchUpdateCompany(data: Api.Base.MdmCompanyOperateParams) {
  return request<null>({ url: '/base/company', method: 'put', data });
}

export function fetchBatchDeleteCompany(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/company/${ids.join(',')}`, method: 'delete' });
}
