import { request } from '@/service/request';

export function fetchGetDevanningOrderList(params?: Api.Wms.DevanningOrderSearchParams) {
  return request<Api.Wms.DevanningOrderList>({
    url: '/wms/devanning-order/list',
    method: 'get',
    params
  });
}

export function fetchGetDevanningOrderStatusCount(params?: Api.Wms.DevanningOrderSearchParams) {
  return request<Record<string, number>>({
    url: '/wms/devanning-order/status-count',
    method: 'get',
    params
  });
}

export function fetchGetDevanningOrderDetail(id: CommonType.IdType) {
  return request<Api.Wms.DevanningOrder>({
    url: `/wms/devanning-order/${id}`,
    method: 'get'
  });
}

export function fetchCreateDevanningOrder(data: Api.Wms.DevanningOrderOperateParams) {
  return request<null>({ url: '/wms/devanning-order', method: 'post', data });
}

export function fetchUpdateDevanningOrder(data: Api.Wms.DevanningOrderOperateParams) {
  return request<null>({ url: '/wms/devanning-order', method: 'put', data });
}

export function fetchBatchDeleteDevanningOrder(ids: CommonType.IdType[]) {
  return request<null>({ url: `/wms/devanning-order/${ids.join(',')}`, method: 'delete' });
}

export function fetchConfirmPickupDevanningOrder(id: CommonType.IdType, data?: { pickupTime?: string; remark?: string }) {
  return request<null>({ url: `/wms/devanning-order/${id}/confirm-pickup`, method: 'put', data });
}

export function fetchConfirmArrivalDevanningOrder(id: CommonType.IdType, data?: { actualArrivalTime?: string; remark?: string }) {
  return request<null>({ url: `/wms/devanning-order/${id}/confirm-arrival`, method: 'put', data });
}

export function fetchStartDevanningOrder(id: CommonType.IdType, data?: { devanningStartTime?: string; remark?: string }) {
  return request<null>({ url: `/wms/devanning-order/${id}/start-devanning`, method: 'put', data });
}

export function fetchCompleteDevanningOrder(id: CommonType.IdType, data?: { devanningFinishTime?: string; remark?: string }) {
  return request<null>({ url: `/wms/devanning-order/${id}/complete-devanning`, method: 'put', data });
}

export function fetchMarkExceptionDevanningOrder(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `/wms/devanning-order/${id}/mark-exception`, method: 'put', data: { remark } });
}

export function fetchClearExceptionDevanningOrder(id: CommonType.IdType) {
  return request<null>({ url: `/wms/devanning-order/${id}/clear-exception`, method: 'put' });
}

export function fetchCancelDevanningOrder(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `/wms/devanning-order/${id}/cancel`, method: 'put', data: { remark } });
}

export function fetchSaveDevanningOrderFees(id: CommonType.IdType, data: Api.Wms.DevanningOrderFeePayload) {
  return request<Api.Wms.DevanningOrder>({
    url: `/wms/devanning-order/${id}/fees`,
    method: 'put',
    data
  });
}
