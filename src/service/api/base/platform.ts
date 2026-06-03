import { request } from '@/service/request';

export function fetchGetPlatformList(params?: Api.Base.PlatformSearchParams) {
  return request<Api.Base.PlatformList>({ url: '/base/platform/list', method: 'get', params });
}
export function fetchGetPlatformDetail(id: CommonType.IdType) {
  return request<Api.Base.Platform>({ url: `/base/platform/${id}`, method: 'get' });
}
export function fetchCreatePlatform(data: Api.Base.PlatformOperateParams) {
  return request<null>({ url: '/base/platform', method: 'post', data });
}
export function fetchUpdatePlatform(data: Api.Base.PlatformOperateParams) {
  return request<null>({ url: '/base/platform', method: 'put', data });
}
export function fetchBatchDeletePlatform(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/platform/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportPlatform(params?: Api.Base.PlatformSearchParams) {
  return request<Blob>({ url: '/base/platform/export', method: 'post', params, responseType: 'blob' as any });
}
