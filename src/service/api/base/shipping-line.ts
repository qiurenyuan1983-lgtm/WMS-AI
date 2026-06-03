import { request } from '@/service/request';

export function fetchGetShippingLineList(params?: Api.Base.ShippingLineSearchParams) {
  return request<Api.Base.ShippingLineList>({ url: '/base/shipping-line/list', method: 'get', params });
}
export function fetchGetShippingLineDetail(id: CommonType.IdType) {
  return request<Api.Base.ShippingLine>({ url: `/base/shipping-line/${id}`, method: 'get' });
}
export function fetchCreateShippingLine(data: Api.Base.ShippingLineOperateParams) {
  return request<null>({ url: '/base/shipping-line', method: 'post', data });
}
export function fetchUpdateShippingLine(data: Api.Base.ShippingLineOperateParams) {
  return request<null>({ url: '/base/shipping-line', method: 'put', data });
}
export function fetchBatchDeleteShippingLine(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/shipping-line/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportShippingLine(params?: Api.Base.ShippingLineSearchParams) {
  return request<Blob>({ url: '/base/shipping-line/export', method: 'post', params, responseType: 'blob' as any });
}
