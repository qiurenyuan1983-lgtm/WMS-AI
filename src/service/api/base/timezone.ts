import { request } from '@/service/request';

export function fetchGetTimezoneList(params?: Api.Base.TimezoneSearchParams) {
  return request<Api.Base.TimezoneList>({ url: '/base/timezone/list', method: 'get', params });
}
export function fetchGetTimezoneDetail(id: CommonType.IdType) {
  return request<Api.Base.Timezone>({ url: `/base/timezone/${id}`, method: 'get' });
}
export function fetchCreateTimezone(data: Api.Base.TimezoneOperateParams) {
  return request<null>({ url: '/base/timezone', method: 'post', data });
}
export function fetchUpdateTimezone(data: Api.Base.TimezoneOperateParams) {
  return request<null>({ url: '/base/timezone', method: 'put', data });
}
export function fetchBatchDeleteTimezone(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/timezone/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportTimezone(params?: Api.Base.TimezoneSearchParams) {
  return request<Blob>({ url: '/base/timezone/export', method: 'post', params, responseType: 'blob' as any });
}
