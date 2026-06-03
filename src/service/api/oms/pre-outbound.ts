import { request } from '@/service/request';

const BASE = '/oms/pre-outbound';

export function fetchGetPreOutboundList(params?: Api.Oms.PreOutboundSearchParams) {
  return request<Api.Oms.PreOutboundList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetPreOutboundDetail(id: CommonType.IdType) {
  return request<Api.Oms.PreOutbound>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchGetPreOutboundItems(id: CommonType.IdType) {
  return request<Api.Oms.PreOutboundItem[]>({ url: `${BASE}/${id}/items`, method: 'get' });
}

export function fetchAddPreOutboundItems(id: CommonType.IdType, cargoOrderIds: CommonType.IdType[]) {
  return request<null>({ url: `${BASE}/${id}/items`, method: 'post', data: { cargoOrderIds } });
}

export function fetchRemovePreOutboundItem(id: CommonType.IdType, itemId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/items/${itemId}`, method: 'delete' });
}

export function fetchUpdatePreOutboundOrder(id: CommonType.IdType, data: Api.Oms.PreOutboundUpdateParams) {
  return request<null>({ url: `${BASE}/${id}`, method: 'put', data });
}

export function fetchConvertPreOutboundOrder(id: CommonType.IdType, data: Api.Oms.OutboundCreateParams) {
  return request<Api.Oms.OutboundOrder>({ url: `${BASE}/${id}/convert`, method: 'post', data });
}

export function fetchDeletePreOutboundOrder(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}`, method: 'delete' });
}

export function fetchExportPreOutbound(params?: Api.Oms.PreOutboundSearchParams) {
  return request<Blob>({ url: `${BASE}/export`, method: 'post', params, responseType: 'blob' as any });
}
