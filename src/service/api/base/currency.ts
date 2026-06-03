import { request } from '@/service/request';

export function fetchGetCurrencyList(params?: Api.Base.CurrencySearchParams) {
  return request<Api.Base.CurrencyList>({ url: '/base/currency/list', method: 'get', params });
}
export function fetchGetCurrencyDetail(id: CommonType.IdType) {
  return request<Api.Base.Currency>({ url: `/base/currency/${id}`, method: 'get' });
}
export function fetchCreateCurrency(data: Api.Base.CurrencyOperateParams) {
  return request<null>({ url: '/base/currency', method: 'post', data });
}
export function fetchUpdateCurrency(data: Api.Base.CurrencyOperateParams) {
  return request<null>({ url: '/base/currency', method: 'put', data });
}
export function fetchBatchDeleteCurrency(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/currency/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportCurrency(params?: Api.Base.CurrencySearchParams) {
  return request<Blob>({ url: '/base/currency/export', method: 'post', params, responseType: 'blob' as any });
}
