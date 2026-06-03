import { request } from '@/service/request';

export function fetchGetContainerResourceList(params?: Api.Yms.ContainerResourceSearchParams) {
  return request<Api.Yms.ContainerResourceList>({ url: '/yms/container/list', method: 'get', params });
}

export function fetchGetContainerResourceDetail(id: CommonType.IdType) {
  return request<Api.Yms.ContainerResource>({ url: `/yms/container/${id}`, method: 'get' });
}

export function fetchCreateContainerResource(data: Api.Yms.ContainerResourceOperate) {
  return request<null>({ url: '/yms/container', method: 'post', data });
}

export function fetchUpdateContainerResource(data: Api.Yms.ContainerResourceOperate) {
  return request<null>({ url: '/yms/container', method: 'put', data });
}

export function fetchDeleteContainerResource(ids: string) {
  return request<null>({ url: `/yms/container/${ids}`, method: 'delete' });
}

export function fetchAssignContainerPosition(id: CommonType.IdType, positionId: CommonType.IdType) {
  return request<null>({ url: `/yms/container/${id}/assign-position`, method: 'post', params: { positionId } });
}

export function fetchMarkContainerArrived(id: CommonType.IdType, params?: {
  plateNo?: string;
  driverName?: string;
  driverPhone?: string;
}) {
  return request<null>({ url: `/yms/container/${id}/arrived`, method: 'post', params });
}

export function fetchCallContainerToDock(id: CommonType.IdType, dockId: CommonType.IdType) {
  return request<null>({ url: `/yms/container/${id}/call`, method: 'post', params: { dockId } });
}

export function fetchMarkContainerException(id: CommonType.IdType, reason: string) {
  return request<null>({ url: `/yms/container/${id}/exception`, method: 'post', params: { reason } });
}
