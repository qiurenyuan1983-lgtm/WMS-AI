import { request } from '@/service/request';

const BASE = '/oms/zoneRule';

export function fetchGetZoneRuleList(params?: Api.Oms.ZoneRuleSearchParams) {
  return request<Api.Oms.ZoneRuleList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetZoneRuleDetail(id: CommonType.IdType) {
  return request<Api.Oms.ZoneRule>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchCreateZoneRule(data: Api.Oms.ZoneRuleOperateParams) {
  return request<null>({ url: BASE, method: 'post', data });
}

export function fetchUpdateZoneRule(data: Api.Oms.ZoneRuleOperateParams & { id: CommonType.IdType }) {
  return request<null>({ url: BASE, method: 'put', data });
}

export function fetchDeleteZoneRule(ids: string) {
  return request<null>({ url: `${BASE}/${ids}`, method: 'delete' });
}

export function fetchAssignZoneRuleFallback(data: Api.Oms.ZoneRuleFallbackParams) {
  return request<null>({ url: `${BASE}/fallback`, method: 'post', data });
}
