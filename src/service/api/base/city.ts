import { request } from '@/service/request';

export function fetchGetCityList(params?: Api.Base.CitySearchParams) {
  return request<Api.Base.CityList>({ url: '/base/city/list', method: 'get', params });
}
export function fetchGetCityDetail(id: CommonType.IdType) {
  return request<Api.Base.City>({ url: `/base/city/${id}`, method: 'get' });
}
export function fetchCreateCity(data: Api.Base.CityOperateParams) {
  return request<null>({ url: '/base/city', method: 'post', data });
}
export function fetchUpdateCity(data: Api.Base.CityOperateParams) {
  return request<null>({ url: '/base/city', method: 'put', data });
}
export function fetchBatchDeleteCity(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/city/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportCity(params?: Api.Base.CitySearchParams) {
  return request<Blob>({ url: '/base/city/export', method: 'post', params, responseType: 'blob' as any });
}
