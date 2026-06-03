import { request } from '@/service/request';

const RULE_BASE = '/oms/cargoGroupingRule';
const FIELD_BASE = '/oms/cargoGroupingFieldMeta';

export function fetchGetCargoGroupingRuleList(params?: Api.Oms.CargoGroupingRuleSearchParams) {
  return request<Api.Oms.CargoGroupingRuleList>({ url: `${RULE_BASE}/list`, method: 'get', params });
}

export function fetchGetCargoGroupingRuleDetail(id: CommonType.IdType) {
  return request<Api.Oms.CargoGroupingRule>({ url: `${RULE_BASE}/${id}`, method: 'get' });
}

export function fetchCreateCargoGroupingRule(data: Api.Oms.CargoGroupingRuleOperateParams) {
  return request<null>({ url: RULE_BASE, method: 'post', data });
}

export function fetchUpdateCargoGroupingRule(data: Api.Oms.CargoGroupingRuleOperateParams) {
  return request<null>({ url: RULE_BASE, method: 'put', data });
}

export function fetchDeleteCargoGroupingRule(ids: string) {
  return request<null>({ url: `${RULE_BASE}/${ids}`, method: 'delete' });
}

export function fetchEnableCargoGroupingRule(id: CommonType.IdType) {
  return request<null>({ url: `${RULE_BASE}/${id}/enable`, method: 'post' });
}

export function fetchDisableCargoGroupingRule(id: CommonType.IdType) {
  return request<null>({ url: `${RULE_BASE}/${id}/disable`, method: 'post' });
}

export function fetchCopyCargoGroupingRule(id: CommonType.IdType) {
  return request<CommonType.IdType>({ url: `${RULE_BASE}/${id}/copy`, method: 'post' });
}

export function fetchUpdateCargoGroupingRulePriority(data: Api.Oms.CargoGroupingRulePriorityParams[]) {
  return request<null>({ url: `${RULE_BASE}/priority/batch`, method: 'put', data });
}

export function fetchTestCargoGroupingRule(data: Api.Oms.CargoGroupingRuleTestParams) {
  return request<Api.Oms.CargoGroupingRuleTestResult>({ url: `${RULE_BASE}/test`, method: 'post', data });
}

export function fetchGetCargoGroupingFieldMetaList(params?: Api.Oms.CargoGroupingFieldMetaSearchParams) {
  return request<Api.Oms.CargoGroupingFieldMeta[]>({ url: `${FIELD_BASE}/list`, method: 'get', params });
}

export function fetchGetCargoGroupingFieldMetaAdminList(params?: Api.Oms.CargoGroupingFieldMetaSearchParams) {
  return request<Api.Oms.CargoGroupingFieldMeta[]>({ url: `${FIELD_BASE}/admin/list`, method: 'get', params });
}
