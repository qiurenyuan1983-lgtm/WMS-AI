import { request } from '@/service/request';

export function fetchGetVesselList(params?: Api.Base.VesselSearchParams) {
  return request<Api.Base.VesselList>({ url: '/base/vessel/list', method: 'get', params });
}

export function fetchGetVesselOptions(params?: Api.Base.VesselSearchParams) {
  return request<Api.Base.Vessel[]>({ url: '/base/vessel/options', method: 'get', params });
}

export function fetchGetVesselDetail(id: CommonType.IdType) {
  return request<Api.Base.Vessel>({ url: `/base/vessel/${id}`, method: 'get' });
}

export function fetchCreateVessel(data: Api.Base.VesselOperateParams) {
  return request<null>({ url: '/base/vessel', method: 'post', data });
}

export function fetchUpdateVessel(data: Api.Base.VesselOperateParams) {
  return request<null>({ url: '/base/vessel', method: 'put', data });
}

export function fetchUpdateVesselStatus(id: CommonType.IdType, status: string) {
  return request<null>({ url: `/base/vessel/${id}/status`, method: 'put', params: { status } });
}

export function fetchBatchDeleteVessel(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/vessel/${ids.join(',')}`, method: 'delete' });
}

export function fetchExportVessel(params?: Api.Base.VesselSearchParams) {
  return request<Blob>({ url: '/base/vessel/export', method: 'post', params, responseType: 'blob' as any });
}
