import { request } from '@/service/request';

export function fetchGetWmsLocationList(params?: Api.Wms.LocationSearchParams) {
  return request<Api.Wms.LocationList>({ url: '/wms/location/list', method: 'get', params });
}

export function fetchGetWmsLocationOptions(params?: Api.Wms.LocationSearchParams) {
  return request<Api.Wms.Location[]>({ url: '/wms/location/options', method: 'get', params });
}

export function fetchGetWmsLocationDetail(id: CommonType.IdType) {
  return request<Api.Wms.Location>({ url: `/wms/location/${id}`, method: 'get' });
}

export function fetchCreateWmsLocation(data: Api.Wms.LocationOperateParams) {
  return request<null>({ url: '/wms/location', method: 'post', data });
}

export function fetchUpdateWmsLocation(data: Api.Wms.LocationOperateParams) {
  return request<null>({ url: '/wms/location', method: 'put', data });
}

export function fetchBatchDeleteWmsLocation(ids: CommonType.IdType[]) {
  return request<null>({ url: `/wms/location/${ids.join(',')}`, method: 'delete' });
}

export function fetchChangeWmsLocationStatus(data: Api.Wms.LocationBatchStatusParams) {
  return request<null>({ url: '/wms/location/changeStatus', method: 'put', data });
}
