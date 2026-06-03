import { request } from '@/service/request';

export function fetchGetBusinessTypeList(params?: Api.Base.BusinessTypeSearchParams) {
  return request<Api.Base.BusinessTypeList>({ url: '/base/business-type/list', method: 'get', params });
}

export function fetchCreateBusinessType(data: Api.Base.BusinessTypeOperateParams) {
  return request<null>({ url: '/base/business-type', method: 'post', data });
}

export function fetchUpdateBusinessType(data: Api.Base.BusinessTypeOperateParams) {
  return request<null>({ url: '/base/business-type', method: 'put', data });
}

export function fetchBatchDeleteBusinessType(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/business-type/${ids.join(',')}`, method: 'delete' });
}

