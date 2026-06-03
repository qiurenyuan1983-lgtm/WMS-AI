import { request } from '@/service/request';

export function fetchGetTerminalList(params?: Api.Base.TerminalSearchParams) {
  return request<Api.Base.TerminalList>({ url: '/base/terminal/list', method: 'get', params });
}

export function fetchGetTerminalDetail(id: CommonType.IdType) {
  return request<Api.Base.Terminal>({ url: `/base/terminal/${id}`, method: 'get' });
}

export function fetchCreateTerminal(data: Api.Base.TerminalOperateParams) {
  return request<null>({ url: '/base/terminal', method: 'post', data });
}

export function fetchUpdateTerminal(data: Api.Base.TerminalOperateParams) {
  return request<null>({ url: '/base/terminal', method: 'put', data });
}

export function fetchBatchDeleteTerminal(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/terminal/${ids.join(',')}`, method: 'delete' });
}

export function fetchExportTerminal(params?: Api.Base.TerminalSearchParams) {
  return request<Blob>({ url: '/base/terminal/export', method: 'post', params, responseType: 'blob' as any });
}
