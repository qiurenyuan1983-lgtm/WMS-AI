import { request } from '@/service/request';

export function fetchGetWmsLocationList(params?: Api.Wms.LocationSearchParams) {
  return request<Api.Wms.LocationList>({ url: '/wms/location/list', method: 'get', params });
}

export function fetchGetWmsLocationStats(params?: Pick<Api.Wms.LocationSearchParams, 'warehouseId' | 'zoneId'>) {
  return request<Api.Wms.LocationStats>({ url: '/wms/location/stats', method: 'get', params });
}

export function fetchGetWmsLocationOptions(params?: Api.Wms.LocationSearchParams) {
  return request<Api.Wms.Location[]>({ url: '/wms/location/options', method: 'get', params });
}

export function fetchGetWmsLocationDetail(id: CommonType.IdType) {
  return request<Api.Wms.Location>({ url: `/wms/location/${id}`, method: 'get' });
}

export function fetchGetWmsLocationInventory(id: CommonType.IdType) {
  return request<Api.Wms.LocationInventoryItem[]>({ url: `/wms/location/${id}/inventory`, method: 'get' });
}

export function fetchGetWmsLocationOperationLogs(id: CommonType.IdType) {
  return request<Api.Wms.LocationOperationLog[]>({ url: `/wms/location/${id}/operationLogs`, method: 'get' });
}

export function fetchCreateWmsLocation(data: Api.Wms.LocationOperateParams) {
  return request<Api.Wms.Location>({ url: '/wms/location', method: 'post', data });
}

export function fetchUpdateWmsLocation(data: Api.Wms.LocationOperateParams) {
  return request<Api.Wms.Location>({ url: '/wms/location', method: 'put', data });
}

export function fetchBatchDeleteWmsLocation(ids: CommonType.IdType[]) {
  return request<null>({ url: `/wms/location/${ids.join(',')}`, method: 'delete' });
}

export function fetchChangeWmsLocationStatus(data: Api.Wms.LocationBatchStatusParams) {
  return request<null>({ url: '/wms/location/changeStatus', method: 'put', data });
}

export function fetchBatchGenerateWmsLocations(data: Api.Wms.LocationBatchGenerateParams) {
  return request<Api.Wms.Location[]>({ url: '/wms/location/batchGenerate', method: 'post', data });
}

export function fetchBatchBindWmsLocations(data: Api.Wms.LocationBatchBindParams) {
  return request<null>({ url: '/wms/location/batchBind', method: 'put', data });
}

export function fetchBatchSetWmsLocationCapacity(data: Api.Wms.LocationBatchCapacityParams) {
  return request<null>({ url: '/wms/location/batchCapacity', method: 'put', data });
}
