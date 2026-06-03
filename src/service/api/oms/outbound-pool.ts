import { request } from '@/service/request';

const BASE = '/oms/outbound-pool';

export function fetchGetOutboundPoolList(params?: Api.Oms.OutboundPoolSearchParams) {
  return request<Api.Oms.NewCargoOrderList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetOutboundPoolStats(params?: Api.Oms.OutboundPoolSearchParams) {
  return request<Api.Oms.OutboundPoolStats>({ url: `${BASE}/stats`, method: 'get', params });
}

export function fetchCreatePoolPreOutbound(data: Api.Oms.OutboundCreateParams) {
  return request<Api.Oms.PreOutbound>({ url: `${BASE}/create-pre-outbound`, method: 'post', data });
}

export function fetchCreatePoolOutboundOrder(data: Api.Oms.OutboundCreateParams) {
  return request<Api.Oms.OutboundOrder>({ url: `${BASE}/create-outbound-order`, method: 'post', data });
}

export function fetchBatchCreatePoolPreOutbound(data: Api.Oms.OutboundCreateParams) {
  return request<null>({ url: `${BASE}/batch-create-pre-outbound`, method: 'post', data });
}

export function fetchBatchCreatePoolOutboundOrder(data: Api.Oms.OutboundCreateParams) {
  return request<null>({ url: `${BASE}/batch-create-outbound-order`, method: 'post', data });
}
