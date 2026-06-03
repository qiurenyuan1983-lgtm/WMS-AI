import { request } from '@/service/request';

export function fetchGetTrailerResourceList(params?: Api.Yms.TrailerResourceSearchParams) {
  return request<Api.Yms.TrailerResourceList>({ url: '/yms/trailer/list', method: 'get', params });
}

export function fetchGetTrailerResourceDetail(id: CommonType.IdType) {
  return request<Api.Yms.TrailerResource>({ url: `/yms/trailer/${id}`, method: 'get' });
}

export function fetchCreateTrailerResource(data: Api.Yms.TrailerResourceOperate) {
  return request<null>({ url: '/yms/trailer', method: 'post', data });
}

export function fetchUpdateTrailerResource(data: Api.Yms.TrailerResourceOperate) {
  return request<null>({ url: '/yms/trailer', method: 'put', data });
}

export function fetchDeleteTrailerResource(ids: string) {
  return request<null>({ url: `/yms/trailer/${ids}`, method: 'delete' });
}

export function fetchAssignTrailerPosition(id: CommonType.IdType, positionId: CommonType.IdType) {
  return request<null>({ url: `/yms/trailer/${id}/assign-position`, method: 'post', params: { positionId } });
}

export function fetchMarkTrailerArrived(id: CommonType.IdType) {
  return request<null>({ url: `/yms/trailer/${id}/arrived`, method: 'post' });
}

export function fetchMarkTrailerWmsReady(id: CommonType.IdType) {
  return request<null>({ url: `/yms/trailer/${id}/wms-ready`, method: 'post' });
}

export function fetchCallTrailerToDock(id: CommonType.IdType, dockId: CommonType.IdType) {
  return request<null>({ url: `/yms/trailer/${id}/call`, method: 'post', params: { dockId } });
}

export function fetchMarkTrailerException(id: CommonType.IdType, reason: string) {
  return request<null>({ url: `/yms/trailer/${id}/exception`, method: 'post', params: { reason } });
}
