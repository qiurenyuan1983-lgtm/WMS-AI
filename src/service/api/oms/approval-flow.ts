import { request } from '@/service/request';

const BASE = '/oms/approvalFlow';

export function fetchGetApprovalFlowList(params?: Api.Oms.ApprovalFlowSearchParams) {
  return request<Api.Oms.ApprovalFlowList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetApprovalFlowDetail(id: CommonType.IdType) {
  return request<Api.Oms.ApprovalFlow>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchCreateApprovalFlow(data: Api.Oms.ApprovalFlowOperateParams) {
  return request<Api.Oms.ApprovalFlow>({ url: BASE, method: 'post', data });
}

export function fetchUpdateApprovalFlow(data: Api.Oms.ApprovalFlowOperateParams) {
  return request<Api.Oms.ApprovalFlow>({ url: BASE, method: 'put', data });
}

export function fetchDeleteApprovalFlow(ids: string) {
  return request<null>({ url: `${BASE}/${ids}`, method: 'delete' });
}

export function fetchEnableApprovalFlow(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/enable`, method: 'put' });
}

export function fetchDisableApprovalFlow(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/disable`, method: 'put' });
}
