import { request } from '@/service/request';

const BASE = '/oms/platform-appointment';

export function fetchGetPlatformAppointmentList(params?: Api.Oms.PlatformAppointmentSearchParams) {
  return request<Api.Oms.PlatformAppointmentList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetPlatformAppointmentStatusCount(params?: Api.Oms.PlatformAppointmentSearchParams) {
  return request<Api.Oms.PlatformAppointmentStatusCount>({ url: `${BASE}/status-count`, method: 'get', params });
}

export function fetchGetPlatformAppointmentDetail(id: CommonType.IdType) {
  return request<Api.Oms.PlatformAppointment>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchGetPlatformAppointmentInboundLines(id: CommonType.IdType) {
  return request<Api.Oms.PlatformAppointmentInboundLine[]>({
    url: `${BASE}/${id}/inbound-lines`,
    method: 'get'
  });
}

export function fetchCreatePlatformAppointmentOutbound(
  id: CommonType.IdType,
  data?: Record<string, unknown>
) {
  return request<Api.Oms.PlatformAppointmentCreateOutboundResult>({
    url: `${BASE}/${id}/create-outbound`,
    method: 'post',
    data
  });
}

export function fetchGetPlatformAppointmentPreOutboundLines(
  id: CommonType.IdType,
  params: Api.Oms.PlatformAppointmentPreOutboundFilter
) {
  return request<Api.Oms.PlatformAppointmentInboundLine[]>({
    url: `${BASE}/${id}/pre-outbound-lines`,
    method: 'get',
    params
  });
}

export function fetchCreatePlatformAppointmentPreOutbound(
  id: CommonType.IdType,
  data?: Record<string, unknown>
) {
  return request<Api.Oms.PlatformAppointmentCreatePreOutboundResult>({
    url: `${BASE}/${id}/create-pre-outbound`,
    method: 'post',
    data
  });
}
