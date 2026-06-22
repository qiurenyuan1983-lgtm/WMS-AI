import { request } from '@/service/request';

export function fetchGetTransferWorkbenchStats() {
  return request<Api.Wms.TransferWorkbenchStats>({ url: '/wms/transfer-workbench/stats', method: 'get' });
}

export function fetchGetTransferInstructionList(params?: Api.Wms.TransferInstructionSearchParams) {
  return request<Api.Wms.TransferInstructionList>({ url: '/wms/transfer-workbench/instructions', method: 'get', params });
}

export function fetchGetTransferOrderGroupList(params?: Api.Wms.TransferInstructionSearchParams) {
  return request<Api.Wms.TransferOrderGroupList>({ url: '/wms/transfer-workbench/orders', method: 'get', params });
}

export function fetchGetTransferInstructionDetail(id: CommonType.IdType) {
  return request<Api.Wms.TransferInstruction>({ url: `/wms/transfer-workbench/instructions/${id}`, method: 'get' });
}

export function fetchLookupTransferOrder(orderNo: string) {
  return request<Api.Wms.TransferOrderLookup>({
    url: '/wms/transfer-workbench/order-lookup',
    method: 'get',
    params: { orderNo }
  });
}

export function fetchCreateTransferInstruction(data: Api.Wms.TransferInstructionCreateParams) {
  return request<Api.Wms.TransferInstruction>({ url: '/wms/transfer-workbench/instructions', method: 'post', data });
}

export function fetchExecuteTransferInstructionAction(data: Api.Wms.TransferInstructionActionParams) {
  return request<Api.Wms.TransferInstruction>({ url: '/wms/transfer-workbench/instructions/action', method: 'put', data });
}
