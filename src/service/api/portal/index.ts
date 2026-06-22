import { request } from '@/service/request';

export function fetchGetPortalContacts() {
  return request<Api.Portal.AssignedContact[]>({ url: '/portal/contacts', method: 'get' });
}

export function fetchGetPortalOrderOptions() {
  return request<Api.Portal.PortalOrderOption[]>({ url: '/portal/orders/options', method: 'get' });
}

export function fetchGetPortalOrderList(
  params?: CommonType.RecordNullable<{
    pageNum?: number;
    pageSize?: number;
    keyword?: string;
    orderChannel?: Api.Portal.PortalOrderChannel;
    status?: string;
    warehouseId?: number | string | null;
  }>
) {
  return request<Api.Portal.PortalOrderList>({ url: '/portal/orders/list', method: 'get', params });
}

export function fetchGetPortalOrderDetail(id: CommonType.IdType) {
  return request<Api.Portal.PortalOrderDetail>({ url: `/portal/orders/${id}`, method: 'get' });
}

export function fetchGetPortalWarehouses() {
  return request<Api.Portal.WarehouseOption[]>({ url: '/portal/warehouses', method: 'get' });
}

export function fetchGetPortalDashboardOverview(params?: { warehouseId?: number | string | null }) {
  return request<Api.Portal.DashboardOverview>({ url: '/portal/dashboard/overview', method: 'get', params });
}

export function fetchGetPortalContainers(params?: { warehouseId?: number | string | null }) {
  return request<Api.Portal.PortalContainerSummary[]>({ url: '/portal/containers', method: 'get', params });
}

export function fetchGetPortalContainerDetail(containerNo: string) {
  return request<Api.Portal.PortalContainerDetail>({ url: `/portal/containers/${containerNo}`, method: 'get' });
}

export function fetchGetPortalTransferInstructions(params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number }>) {
  return request<Common.PaginatingQueryRecord<Api.Portal.PortalTransferInstruction>>({
    url: '/portal/transfer/instructions',
    method: 'get',
    params
  });
}

export function fetchGetPortalTransferEligibleOrders() {
  return request<Array<{ orderNo: string; customerOrderNo: string; locationSummary: string; palletQty: number }>>({
    url: '/portal/transfer/eligible-orders',
    method: 'get'
  });
}

export function fetchSubmitPortalTransferInstruction(data: Api.Portal.SubmitTransferInstructionPayload) {
  return request<Api.Portal.SubmitTransferInstructionResult>({
    url: '/portal/transfer/instructions',
    method: 'post',
    data
  });
}

export function fetchGetPortalTransferOperationOptions() {
  return request<Array<{ value: string; label: string }>>({ url: '/portal/transfer/operation-options', method: 'get' });
}

export function fetchGetPortalAlertConfig() {
  return request<Api.Portal.AlertConfig>({ url: '/portal/settings/alert-config', method: 'get' });
}

export function fetchSavePortalAlertConfig(data: Partial<Api.Portal.AlertConfig>) {
  return request<Api.Portal.AlertConfig>({ url: '/portal/settings/alert-config', method: 'put', data });
}

export function fetchGetPortalConversations(params?: Record<string, unknown>) {
  return request<Api.Portal.PortalConversation[]>({ url: '/portal/conversation/list', method: 'get', params });
}

export function fetchGetPortalMessages(conversationId: string) {
  return request<Api.Portal.PortalMessage[]>({
    url: '/portal/message/list',
    method: 'get',
    params: { conversationId }
  });
}

export function fetchGetPortalBizContext(conversationId: string) {
  return request<Api.Portal.PortalBizContext | null>({
    url: '/portal/business/context',
    method: 'get',
    params: { conversationId }
  });
}

export function fetchCreatePortalConversation(data: Api.Portal.CreateConversationPayload) {
  return request<{ success: boolean; message: string; conversation?: Api.Portal.PortalConversation }>({
    url: '/portal/conversation/create',
    method: 'post',
    data
  });
}

export function fetchSendPortalMessage(conversationId: string, content: string) {
  return request<{ success: boolean; message: string }>({
    url: '/portal/message/send',
    method: 'post',
    data: { conversationId, content }
  });
}

export function fetchGetPortalExceptionList(params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number }>) {
  return request<Api.Portal.PortalExceptionList>({ url: '/portal/exception/list', method: 'get', params });
}

export function fetchGetPortalExceptionDetail(id: CommonType.IdType) {
  return request<Api.Portal.PortalExceptionDetail>({ url: `/portal/exception/${id}`, method: 'get' });
}

export function fetchSubmitPortalFeedback(data: Api.Portal.SubmitFeedbackPayload) {
  return request<{ success: boolean; message: string }>({ url: '/portal/exception/feedback', method: 'post', data });
}

export function fetchSubmitPortalOrder(data: Api.Portal.SubmitPortalOrderPayload) {
  return request<Api.Portal.SubmitPortalOrderResult>({ url: '/portal/order/submit', method: 'post', data });
}

export function fetchPortalExceptionAction(id: CommonType.IdType, data: Api.Portal.ExceptionActionPayload) {
  return request<{ success: boolean; message: string }>({
    url: `/portal/exception/${id}/action`,
    method: 'post',
    data
  });
}

export function fetchGetPortalFeeConfirmList(
  params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number; status?: Api.Portal.PortalFeeConfirmStatus }>
) {
  return request<Common.PaginatingQueryRecord<Api.Portal.PortalFeeConfirmItem>>({
    url: '/portal/fee-confirm/list',
    method: 'get',
    params
  });
}

export function fetchGetPortalFeeConfirmDetail(id: CommonType.IdType) {
  return request<Api.Portal.PortalFeeConfirmDetail>({ url: `/portal/fee-confirm/${id}`, method: 'get' });
}

export function fetchPortalFeeConfirmAction(
  id: CommonType.IdType,
  data: { action: 'confirm' | 'reject'; remark?: string }
) {
  return request<{ success: boolean; message: string }>({
    url: `/portal/fee-confirm/${id}/action`,
    method: 'post',
    data
  });
}

export function fetchGetPortalBillList(
  params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number; status?: Api.Portal.PortalBillStatus }>
) {
  return request<Common.PaginatingQueryRecord<Api.Portal.PortalBill>>({
    url: '/portal/bills/list',
    method: 'get',
    params
  });
}

export function fetchGetPortalBillDetail(billNo: string) {
  return request<Api.Portal.PortalBillDetail>({ url: `/portal/bills/${billNo}`, method: 'get' });
}

export function fetchGetPortalFileList(
  params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number; fileType?: string; keyword?: string }>
) {
  return request<Common.PaginatingQueryRecord<Api.Portal.PortalFile>>({
    url: '/portal/files/list',
    method: 'get',
    params
  });
}

export function fetchGetPortalFileTypeOptions() {
  return request<Array<{ value: string; label: string }>>({ url: '/portal/files/type-options', method: 'get' });
}

export function fetchUploadPortalFile(data: Api.Portal.UploadPortalFilePayload) {
  return request<{ success: boolean; message: string; file?: Api.Portal.PortalFile }>({
    url: '/portal/files/upload',
    method: 'post',
    data
  });
}

export function fetchGetPortalInventoryList(
  params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number; keyword?: string; lowStockOnly?: boolean }>
) {
  return request<Common.PaginatingQueryRecord<Api.Portal.PortalInventorySku>>({
    url: '/portal/inventory/list',
    method: 'get',
    params
  });
}

export function fetchGetPortalDropshipSkuOptions() {
  return request<Array<{ label: string; value: string; availableQty: number }>>({
    url: '/portal/dropship/sku-options',
    method: 'get'
  });
}

export function fetchGetPortalAsnList(params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number }>) {
  return request<Common.PaginatingQueryRecord<Api.Portal.PortalAsnRow>>({
    url: '/portal/asn/list',
    method: 'get',
    params
  });
}

export function fetchGetPortalShipmentList(params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number }>) {
  return request<Common.PaginatingQueryRecord<Api.Portal.PortalShipmentRow>>({
    url: '/portal/shipment/list',
    method: 'get',
    params
  });
}

export function fetchGetPortalInTransitList(params?: { warehouseId?: number | string | null }) {
  return request<Api.Portal.PortalInTransitDetail[]>({ url: '/portal/in-transit/list', method: 'get', params });
}

export function fetchGetPortalInTransitDetail(id: CommonType.IdType) {
  return request<Api.Portal.PortalInTransitDetail>({ url: `/portal/in-transit/${id}`, method: 'get' });
}

export function fetchGetPortalTransferInstructionDetail(id: CommonType.IdType) {
  return request<Api.Portal.PortalTransferInstructionDetail>({
    url: `/portal/transfer/instructions/${id}`,
    method: 'get'
  });
}
