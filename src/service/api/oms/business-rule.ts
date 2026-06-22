import { request } from '@/service/request';

const BASE = '/oms/businessRule';

export function fetchGetBusinessRuleList(params?: Api.Oms.BusinessRuleSearchParams) {
  return request<Api.Oms.BusinessRuleList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetBusinessRuleDetail(id: CommonType.IdType) {
  return request<Api.Oms.BusinessRule>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchCreateBusinessRule(data: Api.Oms.BusinessRuleOperateParams) {
  return request<Api.Oms.BusinessRule>({ url: BASE, method: 'post', data });
}

export function fetchUpdateBusinessRule(data: Api.Oms.BusinessRuleOperateParams) {
  return request<Api.Oms.BusinessRule>({ url: BASE, method: 'put', data });
}

export function fetchDeleteBusinessRule(ids: string) {
  return request<null>({ url: `${BASE}/${ids}`, method: 'delete' });
}

export function fetchEnableBusinessRule(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/enable`, method: 'put' });
}

export function fetchDisableBusinessRule(id: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${id}/disable`, method: 'put' });
}

export function fetchTestBusinessRule(data: Api.Oms.BusinessRuleTestParams) {
  return request<Api.Oms.BusinessRuleTestResult>({ url: `${BASE}/test`, method: 'post', data });
}
