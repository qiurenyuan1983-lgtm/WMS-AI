import { request } from '@/service/request';

export function fetchGetShippingRouteList(params?: Api.Base.ShippingRouteSearchParams) {
  return request<Api.Base.ShippingRouteList>({ url: '/base/shipping-route/list', method: 'get', params });
}

export function fetchGetShippingRouteDetail(id: CommonType.IdType) {
  return request<Api.Base.ShippingRoute>({ url: `/base/shipping-route/${id}`, method: 'get' });
}

export function fetchCreateShippingRoute(data: Api.Base.ShippingRouteOperateParams) {
  return request<null>({ url: '/base/shipping-route', method: 'post', data });
}

export function fetchUpdateShippingRoute(data: Api.Base.ShippingRouteOperateParams) {
  return request<null>({ url: '/base/shipping-route', method: 'put', data });
}

export function fetchBatchDeleteShippingRoute(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/shipping-route/${ids.join(',')}`, method: 'delete' });
}

export function fetchExportShippingRoute(params?: Api.Base.ShippingRouteSearchParams) {
  return request<Blob>({ url: '/base/shipping-route/export', method: 'post', params, responseType: 'blob' as any });
}
