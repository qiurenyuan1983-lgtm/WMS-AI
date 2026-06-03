import { request } from '@/service/request';

export function fetchGetStateProvinceList(params?: Api.Base.StateProvinceSearchParams) {
  return request<Api.Base.StateProvinceList>({
    url: '/base/state-province/list',
    method: 'get',
    params
  });
}

export function fetchGetStateProvinceDetail(id: CommonType.IdType) {
  return request<Api.Base.StateProvince>({
    url: `/base/state-province/${id}`,
    method: 'get'
  });
}

export function fetchCreateStateProvince(data: Api.Base.StateProvinceOperateParams) {
  return request<null>({ url: '/base/state-province', method: 'post', data });
}

export function fetchUpdateStateProvince(data: Api.Base.StateProvinceOperateParams) {
  return request<null>({ url: '/base/state-province', method: 'put', data });
}

export function fetchBatchDeleteStateProvince(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/state-province/${ids.join(',')}`, method: 'delete' });
}

export function fetchExportStateProvince(params?: Api.Base.StateProvinceSearchParams) {
  return request<Blob>({ url: '/base/state-province/export', method: 'post', params, responseType: 'blob' as any });
}
