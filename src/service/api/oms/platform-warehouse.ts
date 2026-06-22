import { request } from '@/service/request';

const BASE = '/oms/platformWarehouse';

export function fetchGetPlatformList(params?: Api.Oms.PlatformSearchParams) {
  return request<Api.Oms.PlatformList>({ url: `${BASE}/platforms`, method: 'get', params });
}

export function fetchCreatePlatform(data: Api.Oms.PlatformOperateParams) {
  return request<Api.Oms.PlatformEntity>({ url: `${BASE}/platform`, method: 'post', data });
}

export function fetchUpdatePlatform(data: Api.Oms.PlatformOperateParams & { id: CommonType.IdType }) {
  return request<null>({ url: `${BASE}/platform`, method: 'put', data });
}

export function fetchDeletePlatform(ids: string) {
  return request<null>({ url: `${BASE}/platform/${ids}`, method: 'delete' });
}

export function fetchGetPlatformWarehouseList(params?: Api.Oms.PlatformWarehouseSearchParams) {
  return request<Api.Oms.PlatformWarehouseList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchCreatePlatformWarehouse(data: Api.Oms.PlatformWarehouseOperateParams) {
  return request<Api.Oms.PlatformWarehouse>({ url: BASE, method: 'post', data });
}

export function fetchUpdatePlatformWarehouse(
  data: Api.Oms.PlatformWarehouseOperateParams & { id: CommonType.IdType }
) {
  return request<null>({ url: BASE, method: 'put', data });
}

export function fetchUpdatePlatformWarehouseStatus(id: CommonType.IdType, status: string) {
  return request<null>({ url: `${BASE}/${id}/status`, method: 'put', data: { status } });
}

export function fetchDeletePlatformWarehouse(ids: string) {
  return request<null>({ url: `${BASE}/${ids}`, method: 'delete' });
}
