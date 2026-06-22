import { request } from '@/service/request';

const BASE = '/oms/outbound-order';

export function fetchGetOutboundOrderList(params?: Api.Oms.OutboundOrderSearchParams) {
  return request<Api.Oms.OutboundOrderList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetOutboundOrderStatusCount(params?: Api.Oms.OutboundOrderSearchParams) {
  return request<Record<string, number>>({ url: `${BASE}/status/count`, method: 'get', params });
}

export function fetchGetOutboundOrderDetail(id: CommonType.IdType) {
  return request<Api.Oms.OutboundOrder>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchUpdateOutboundOrder(data: Api.Oms.OutboundOrder) {
  return request<null>({ url: BASE, method: 'put', data });
}

export function fetchDeleteOutboundOrder(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}`, method: 'delete' });
}

export function fetchCompleteOutboundOrder(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/complete`, method: 'post', params: { remark } });
}

export function fetchConfirmAppointment(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/confirm-appointment`, method: 'post' });
}

export function fetchConfirmOutbounded(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/confirm-outbounded`, method: 'post' });
}

export function fetchConfirmSigned(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/confirm-signed`, method: 'post' });
}

export function fetchGetOutboundOrderItems(id: CommonType.IdType) {
  return request<Api.Oms.OutboundOrderItem[]>({ url: `${BASE}/${id}/items`, method: 'get' });
}

export function fetchGetOutboundAvailableOrders(
  id: CommonType.IdType,
  params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number; keyword?: string }>
) {
  return request<Api.Oms.OutboundAvailableOrderList>({
    url: `${BASE}/${id}/available-orders`,
    method: 'get',
    params
  });
}

export function fetchAddOutboundCargo(id: CommonType.IdType, orderIds: number[]) {
  return request<Api.Oms.AddOutboundCargoResult>({
    url: `${BASE}/${id}/add-cargo`,
    method: 'post',
    data: { orderIds }
  });
}

export function fetchGetOutboundOrderAttachments(id: CommonType.IdType) {
  return request<Api.Oms.BizAttachment[]>({ url: `${BASE}/${id}/attachments`, method: 'get' });
}

export function fetchUploadOutboundOrderAttachment(id: CommonType.IdType, data: Api.Oms.BizAttachmentOperateParams) {
  return request<null>({ url: `${BASE}/${id}/attachment/upload`, method: 'post', data });
}

export function fetchDeleteOutboundOrderAttachment(attachmentId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/attachment/${attachmentId}`, method: 'delete' });
}

export function fetchExportOutboundOrder(params?: Api.Oms.OutboundOrderSearchParams) {
  return request<Blob>({ url: `${BASE}/export`, method: 'post', params, responseType: 'blob' as any });
}
