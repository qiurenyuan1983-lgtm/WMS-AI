import { request } from '@/service/request';

export function fetchGetContainerOrderList(params?: Api.Oms.ContainerOrderSearchParams) {
  return request<Api.Oms.ContainerOrderList>({ url: '/oms/container-order/list', method: 'get', params });
}

export function fetchGetContainerOrderDetail(id: CommonType.IdType) {
  return request<Api.Oms.ContainerOrder>({ url: `/oms/container-order/${id}`, method: 'get' });
}

export function fetchGetContainerOrderStatusCount(params?: Api.Oms.ContainerOrderSearchParams) {
  return request<Record<string, number>>({ url: '/oms/container-order/status-count', method: 'get', params });
}

export function fetchCreateContainerOrder(data: Api.Oms.ContainerOrderOperateParams) {
  return request<null>({ url: '/oms/container-order', method: 'post', data });
}

export function fetchCreateContainerOrderDraft(data: Api.Oms.ContainerOrderOperateParams) {
  return request<null>({ url: '/oms/container-order/draft', method: 'post', data });
}

export function fetchUpdateContainerOrder(data: Api.Oms.ContainerOrderOperateParams) {
  return request<null>({ url: '/oms/container-order', method: 'put', data });
}

export function fetchAddContainerCargoOrders(
  containerOrderId: CommonType.IdType,
  cargoOrders: Api.Oms.ContainerCargoOrderForm[]
) {
  return request<null>({
    url: `/oms/container-order/${containerOrderId}/cargo-orders`,
    method: 'post',
    data: { cargoOrders }
  });
}

export function fetchCreateLoosePalletOrder(
  containerOrderId: CommonType.IdType,
  data: Api.Oms.LoosePalletOrderOperateParams
) {
  return request<Api.Oms.NewCargoOrder>({
    url: `/oms/container-order/${containerOrderId}/loose-pallet-order`,
    method: 'post',
    data
  });
}

/** 海柜详情导入关联订单（multipart 上传请用 import modal 直传） */
export function getContainerCargoImportUrl(containerOrderId: CommonType.IdType) {
  return `/oms/container-order/${containerOrderId}/cargo-orders/import`;
}

export function getContainerCargoImportTemplateUrl() {
  return '/oms/container-order/cargo-orders/importTemplate';
}

/** 新增海柜时解析 Excel 为订单（不落库） */
export function getContainerCargoParseImportUrl() {
  return '/oms/container-order/cargo-orders/parse-import';
}

export function fetchUpdateContainerOrderStatus(id: CommonType.IdType, data: Api.Oms.ContainerOrderStatusParams) {
  return request<null>({ url: `/oms/container-order/${id}/status`, method: 'put', data });
}

export function fetchGetContainerOrderAttachments(id: CommonType.IdType) {
  return request<Api.Oms.BizAttachment[]>({ url: `/oms/container-order/${id}/attachments`, method: 'get' });
}

export function fetchUploadContainerOrderAttachment(id: CommonType.IdType, data: Api.Oms.BizAttachmentOperateParams) {
  return request<null>({ url: `/oms/container-order/${id}/attachment/upload`, method: 'post', data });
}

export function fetchUploadContainerOrderDo(id: CommonType.IdType, data: Api.Oms.BizAttachmentOperateParams) {
  return request<null>({ url: `/oms/container-order/${id}/do/upload`, method: 'post', data });
}

export function fetchDeleteContainerOrderAttachment(attachmentId: CommonType.IdType) {
  return request<null>({ url: `/oms/container-order/attachment/${attachmentId}`, method: 'delete' });
}

export function fetchBatchDeleteContainerOrder(ids: CommonType.IdType[]) {
  return request<null>({ url: `/oms/container-order/${ids.join(',')}`, method: 'delete' });
}
