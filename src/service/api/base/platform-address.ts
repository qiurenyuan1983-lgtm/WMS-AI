import { request } from '@/service/request';

export function fetchGetPlatformAddressList(params?: Api.Base.PlatformAddressSearchParams) {
  return request<Api.Base.PlatformAddressList>({ url: '/base/platform-address/list', method: 'get', params });
}
export function fetchGetPlatformAddressDetail(id: CommonType.IdType) {
  return request<Api.Base.PlatformAddress>({ url: `/base/platform-address/${id}`, method: 'get' });
}
export function fetchCreatePlatformAddress(data: Api.Base.PlatformAddressOperateParams) {
  return request<null>({ url: '/base/platform-address', method: 'post', data });
}
export function fetchUpdatePlatformAddress(data: Api.Base.PlatformAddressOperateParams) {
  return request<null>({ url: '/base/platform-address', method: 'put', data });
}
export function fetchDisablePlatformAddress(id: CommonType.IdType) {
  return request<null>({ url: `/base/platform-address/${id}/disable`, method: 'put' });
}
export function fetchBatchDeletePlatformAddress(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/platform-address/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportPlatformAddress(params?: Api.Base.PlatformAddressSearchParams) {
  return request<Blob>({ url: '/base/platform-address/export', method: 'post', params, responseType: 'blob' as any });
}
export function fetchGetPlatformAddressChangeLogs(id: CommonType.IdType) {
  return request<Api.Base.PlatformAddressChangeLog[]>({ url: `/base/platform-address/${id}/change-log`, method: 'get' });
}
