import { request } from '@/service/request';

export function fetchGetPortList(params?: Api.Base.PortSearchParams) {
  return request<Api.Base.PortList>({ url: '/base/port/list', method: 'get', params });
}
export function fetchGetPortDetail(id: CommonType.IdType) {
  return request<Api.Base.Port>({ url: `/base/port/${id}`, method: 'get' });
}
export function fetchCreatePort(data: Api.Base.PortOperateParams) {
  return request<null>({ url: '/base/port', method: 'post', data });
}
export function fetchUpdatePort(data: Api.Base.PortOperateParams) {
  return request<null>({ url: '/base/port', method: 'put', data });
}
export function fetchBatchDeletePort(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/port/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportPort(params?: Api.Base.PortSearchParams) {
  return request<Blob>({ url: '/base/port/export', method: 'post', params, responseType: 'blob' as any });
}
