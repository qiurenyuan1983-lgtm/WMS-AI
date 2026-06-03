import { request } from '@/service/request';

export function fetchGetExchangeRateList(params?: Api.Base.ExchangeRateSearchParams) {
  return request<Api.Base.ExchangeRateList>({ url: '/base/exchange-rate/list', method: 'get', params });
}
export function fetchGetExchangeRateDetail(id: CommonType.IdType) {
  return request<Api.Base.ExchangeRate>({ url: `/base/exchange-rate/${id}`, method: 'get' });
}
/** 查询货币对历史汇率（只读） */
export function fetchGetExchangeRateHistory(fromCurrency: string, toCurrency: string) {
  return request<Api.Base.ExchangeRate[]>({ url: '/base/exchange-rate/history', method: 'get', params: { fromCurrency, toCurrency } });
}
export function fetchCreateExchangeRate(data: Api.Base.ExchangeRateOperateParams) {
  return request<null>({ url: '/base/exchange-rate', method: 'post', data });
}
export function fetchUpdateExchangeRate(data: Api.Base.ExchangeRateEditParams) {
  return request<null>({ url: '/base/exchange-rate', method: 'put', data });
}
/** 作废当前有效汇率 */
export function fetchVoidExchangeRate(id: CommonType.IdType) {
  return request<null>({ url: `/base/exchange-rate/${id}/void`, method: 'put' });
}
