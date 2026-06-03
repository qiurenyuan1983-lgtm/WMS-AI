import { request } from '@/service/request';

export function fetchGetYardPositionList(params?: Api.Yms.YardPositionSearchParams) {
  return request<Api.Yms.YardPositionList>({ url: '/yms/yard-position/list', method: 'get', params });
}

export function fetchGetYardPositionsByZone(zoneId: CommonType.IdType) {
  return request<Api.Yms.YardPosition[]>({ url: `/yms/yard-position/zone/${zoneId}`, method: 'get' });
}

export function fetchGetFreeYardPositions(warehouseId: CommonType.IdType, positionType?: string) {
  return request<Api.Yms.YardPosition[]>({
    url: '/yms/yard-position/free',
    method: 'get',
    params: { warehouseId, positionType }
  });
}

export function fetchGetYardPositionDetail(id: CommonType.IdType) {
  return request<Api.Yms.YardPosition>({ url: `/yms/yard-position/${id}`, method: 'get' });
}

export function fetchCreateYardPosition(data: Api.Yms.YardPositionOperate) {
  return request<null>({ url: '/yms/yard-position', method: 'post', data });
}

export function fetchUpdateYardPosition(data: Api.Yms.YardPositionOperate) {
  return request<null>({ url: '/yms/yard-position', method: 'put', data });
}

export function fetchDeleteYardPosition(ids: string) {
  return request<null>({ url: `/yms/yard-position/${ids}`, method: 'delete' });
}

export function fetchReleaseYardPosition(id: CommonType.IdType) {
  return request<null>({ url: `/yms/yard-position/${id}/release`, method: 'post' });
}

export function fetchDisableYardPosition(id: CommonType.IdType) {
  return request<null>({ url: `/yms/yard-position/${id}/disable`, method: 'post' });
}

export function fetchEnableYardPosition(id: CommonType.IdType) {
  return request<null>({ url: `/yms/yard-position/${id}/enable`, method: 'post' });
}
