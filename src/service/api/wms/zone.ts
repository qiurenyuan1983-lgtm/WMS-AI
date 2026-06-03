import { request } from '@/service/request';

export function fetchGetWmsZoneList(params?: Api.Wms.ZoneSearchParams) {
  return request<Api.Wms.ZoneList>({ url: '/wms/zone/list', method: 'get', params });
}

export function fetchGetWmsZoneOptions(params?: Api.Wms.ZoneSearchParams) {
  return request<Api.Wms.Zone[]>({ url: '/wms/zone/options', method: 'get', params });
}

export function fetchGetWmsZoneDetail(id: CommonType.IdType) {
  return request<Api.Wms.Zone>({ url: `/wms/zone/${id}`, method: 'get' });
}

export function fetchCreateWmsZone(data: Api.Wms.ZoneOperateParams) {
  return request<null>({ url: '/wms/zone', method: 'post', data });
}

export function fetchUpdateWmsZone(data: Api.Wms.ZoneOperateParams) {
  return request<null>({ url: '/wms/zone', method: 'put', data });
}

export function fetchBatchDeleteWmsZone(ids: CommonType.IdType[]) {
  return request<null>({ url: `/wms/zone/${ids.join(',')}`, method: 'delete' });
}

export function fetchChangeWmsZoneStatus(data: { id: CommonType.IdType; status: string }) {
  return request<null>({ url: '/wms/zone/changeStatus', method: 'put', data });
}
