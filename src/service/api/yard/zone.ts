import { request } from '@/service/request';

export function fetchGetYardZoneList(params?: Api.Yard.ZoneSearchParams) {
  return request<Api.Yard.ZoneList>({ url: '/yard/zone/list', method: 'get', params });
}

export function fetchGetYardZonesByWarehouse(warehouseId: CommonType.IdType) {
  return request<Api.Yard.Zone[]>({ url: `/yard/zone/warehouse/${warehouseId}`, method: 'get' });
}

export function fetchGetYardZoneDetail(id: CommonType.IdType) {
  return request<Api.Yard.Zone>({ url: `/yard/zone/${id}`, method: 'get' });
}

export function fetchCreateYardZone(data: Api.Yard.ZoneOperateParams) {
  return request<null>({ url: '/yard/zone', method: 'post', data });
}

export function fetchUpdateYardZone(data: Api.Yard.ZoneOperateParams) {
  return request<null>({ url: '/yard/zone', method: 'put', data });
}

export function fetchBatchDeleteYardZone(ids: CommonType.IdType[]) {
  return request<null>({ url: `/yard/zone/${ids.join(',')}`, method: 'delete' });
}
