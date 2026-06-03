import { request } from '@/service/request';

export function fetchGetYardDockList(params?: Api.Yard.DockSearchParams) {
  return request<Api.Yard.DockList>({ url: '/yard/dock/list', method: 'get', params });
}

export function fetchGetYardDockDetail(id: CommonType.IdType) {
  return request<Api.Yard.Dock>({ url: `/yard/dock/${id}`, method: 'get' });
}

export function fetchCreateYardDock(data: Api.Yard.DockOperateParams) {
  return request<null>({ url: '/yard/dock', method: 'post', data });
}

export function fetchUpdateYardDock(data: Api.Yard.DockOperateParams) {
  return request<null>({ url: '/yard/dock', method: 'put', data });
}

export function fetchBatchDeleteYardDock(ids: CommonType.IdType[]) {
  return request<null>({ url: `/yard/dock/${ids.join(',')}`, method: 'delete' });
}

export function fetchExportYardDock(params?: Api.Yard.DockSearchParams) {
  return request<Blob>({ url: '/yard/dock/export', method: 'post', params, responseType: 'blob' as any });
}
