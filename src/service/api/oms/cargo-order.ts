import { request } from '@/service/request';

const BASE = '/oms/cargo-order';

// =================== ä¸»å• ===================

export function fetchGetCargoOrderList(params?: Api.Oms.NewCargoOrderSearchParams) {
  return request<Api.Oms.NewCargoOrderList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetCargoOrderStatusCount(params?: Api.Oms.NewCargoOrderSearchParams) {
  return request<Record<string, number>>({ url: `${BASE}/status-count`, method: 'get', params });
}

export function fetchGetCargoOrderDetail(id: CommonType.IdType) {
  return request<Api.Oms.NewCargoOrder>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchCreateCargoOrder(data: Api.Oms.NewCargoOrderOperateParams) {
  return request<null>({ url: BASE, method: 'post', data });
}

export function fetchUpdateCargoOrder(data: Api.Oms.NewCargoOrderOperateParams) {
  return request<null>({ url: BASE, method: 'put', data });
}

export function fetchDeleteCargoOrder(ids: string) {
  return request<null>({ url: `${BASE}/${ids}`, method: 'delete' });
}

export function fetchExportCargoOrder(params?: Api.Oms.NewCargoOrderSearchParams) {
  return request<Blob>({ url: `${BASE}/export`, method: 'post', params, responseType: 'blob' as any });
}

// =================== è´§ä»¶ ===================

export function fetchGetShipmentList(cargoOrderId: CommonType.IdType) {
  return request<Api.Oms.CargoOrderShipmentItem[]>({ url: `${BASE}/${cargoOrderId}/shipments`, method: 'get' });
}

export function fetchSaveShipment(cargoOrderId: CommonType.IdType, data: Api.Oms.CargoOrderShipmentItem) {
  return request<null>({ url: `${BASE}/${cargoOrderId}/shipments`, method: 'post', data });
}

export function fetchDeleteShipment(shipmentId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/shipments/${shipmentId}`, method: 'delete' });
}

// =================== SKU ===================

export function fetchGetSkuItemList(cargoOrderId: CommonType.IdType) {
  return request<Api.Oms.CargoOrderSkuItem[]>({ url: `${BASE}/${cargoOrderId}/sku-items`, method: 'get' });
}

export function fetchSaveSkuItem(cargoOrderId: CommonType.IdType, data: Api.Oms.CargoOrderSkuItem) {
  return request<null>({ url: `${BASE}/${cargoOrderId}/sku-items`, method: 'post', data });
}

export function fetchDeleteSkuItem(skuItemId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/sku-items/${skuItemId}`, method: 'delete' });
}

// =================== èŠ‚ç‚¹è½¨è¿¹ ===================

export function fetchGetNodeTraceList(cargoOrderId: CommonType.IdType) {
  return request<Api.Oms.CargoOrderNodeTrace[]>({ url: `${BASE}/${cargoOrderId}/node-traces`, method: 'get' });
}

// =================== ä¸šåŠ¡åŠ¨ä½œ ===================

export function fetchAcceptCargoOrder(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/accept`, method: 'post', params: { remark } });
}

export function fetchMarkInTransit(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/in-transit`, method: 'post', params: { remark } });
}

export function fetchConfirmArrivedPort(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/arrived-port`, method: 'post', params: { remark } });
}

export function fetchConfirmPickedUp(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/picked-up`, method: 'post', params: { remark } });
}

export function fetchConfirmArrivedWarehouse(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/arrived-warehouse`, method: 'post', params: { remark } });
}

export function fetchStartDevanning(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/start-devanning`, method: 'post', params: { remark } });
}

export function fetchFinishDevanning(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/finish-devanning`, method: 'post', params: { remark } });
}

export function fetchConfirmInbounded(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/inbounded`, method: 'post', params: { remark } });
}

export function fetchCreateOutboundOrder(id: CommonType.IdType, outboundBatchNo?: string, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/outbound-order`, method: 'post', params: { outboundBatchNo, remark } });
}

export function fetchAppointDelivery(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/appoint-delivery`, method: 'post', params: { remark } });
}

export function fetchConfirmOutbounded(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/outbounded`, method: 'post', params: { remark } });
}

export function fetchMarkDelivering(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/delivering`, method: 'post', params: { remark } });
}

export function fetchConfirmDelivered(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/delivered`, method: 'post', params: { remark } });
}

export function fetchUploadPod(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/pod-uploaded`, method: 'post', params: { remark } });
}

export function fetchConfirmBilled(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/billed`, method: 'post', params: { remark } });
}

export function fetchCompleteCargoOrder(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/complete`, method: 'post', params: { remark } });
}

export function fetchCancelCargoOrder(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/cancel`, method: 'post', params: { remark } });
}

// =================== é¢„å‡ºå• ===================

export function fetchCreatePreOutbound(id: CommonType.IdType, preOutboundNo?: string, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/pre-outbound`, method: 'post', params: { preOutboundNo, remark } });
}

export function fetchConvertPreOutbound(id: CommonType.IdType, outboundBatchNo?: string, remark?: string) {
  return request<null>({
    url: `${BASE}/${id}/convert-pre-outbound`,
    method: 'post',
    params: { outboundBatchNo, remark }
  });
}

export function fetchCancelPreOutbound(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/cancel-pre-outbound`, method: 'post', params: { remark } });
}

// =================== ç‰¹æ®Šæ“ä½œ ===================

export function fetchChangeInboundWarehouse(
  id: CommonType.IdType,
  warehouseId: CommonType.IdType,
  warehouseName: string,
  remark?: string
) {
  return request<null>({
    url: `${BASE}/${id}/inbound-warehouse`,
    method: 'put',
    params: { warehouseId, warehouseName, remark }
  });
}

// =================== é™„ä»¶ / HOLD / æ‹†å• ===================

export function fetchGetCargoOrderAttachments(id: CommonType.IdType, includeContainerAttachments = true) {
  return request<Api.Oms.BizAttachment[]>({
    url: `${BASE}/${id}/attachments`,
    method: 'get',
    params: { includeContainerAttachments }
  });
}

export function fetchUploadCargoOrderAttachment(id: CommonType.IdType, data: Api.Oms.BizAttachmentOperateParams) {
  return request<null>({ url: `${BASE}/${id}/attachment/upload`, method: 'post', data });
}

export function fetchDeleteCargoOrderAttachment(attachmentId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/attachment/${attachmentId}`, method: 'delete' });
}

export function fetchHoldCargoOrder(id: CommonType.IdType, data: Api.Oms.CargoOrderHoldParams) {
  return request<null>({ url: `${BASE}/${id}/hold`, method: 'post', data });
}

export function fetchReleaseCargoOrderHold(id: CommonType.IdType, data: Api.Oms.CargoOrderReleaseParams) {
  return request<null>({ url: `${BASE}/${id}/release-hold`, method: 'post', data });
}

export function fetchSplitCargoOrder(id: CommonType.IdType, data: Api.Oms.CargoOrderSplitParams) {
  return request<null>({ url: `${BASE}/${id}/split`, method: 'post', data });
}

export function fetchMergeBackCargoOrder(data: Api.Oms.CargoOrderMergeBackParams) {
  return request<null>({ url: `${BASE}/merge-back`, method: 'post', data });
}

export function fetchCancelCargoOrderTransfer(id: CommonType.IdType, remark?: string) {
  return request<null>({ url: `${BASE}/${id}/cancel-transfer`, method: 'post', params: { remark } });
}

export function fetchModifyCargoOrderTransfer(id: CommonType.IdType, data: { transferWarehouseCode: string; remark?: string }) {
  return request<null>({ url: `${BASE}/${id}/transfer`, method: 'put', data });
}
