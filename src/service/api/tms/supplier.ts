import { request } from '@/service/request';

const BASE = '/tms/supplier';

export function fetchGetSupplierList(params?: Api.Oms.SupplierSearchParams) {
  return request<Api.Oms.SupplierList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetSupplierDetail(id: CommonType.IdType) {
  return request<Api.Oms.Supplier>({ url: `${BASE}/${id}`, method: 'get' });
}

export function fetchGetSupplierQuoteList(params?: Api.Oms.SupplierQuoteSearchParams) {
  return request<Api.Oms.SupplierQuoteList>({ url: `${BASE}/quote/list`, method: 'get', params });
}

export function fetchRecommendSupplierByQuote(params?: Api.Oms.SupplierQuoteRecommendParams) {
  return request<Api.Oms.SupplierQuoteRecommendResult>({
    url: `${BASE}/quote/recommend`,
    method: 'get',
    params
  });
}

export function fetchGetSupplierAccountList(params?: Api.Oms.SupplierAccountSearchParams) {
  return request<Api.Oms.SupplierAccountList>({ url: `${BASE}/account/list`, method: 'get', params });
}

export function fetchGetSupplierBillList(params?: Api.Oms.SupplierBillSearchParams) {
  return request<Api.Oms.SupplierBillList>({ url: `${BASE}/bill/list`, method: 'get', params });
}

export function fetchGetSupplierVehicleList(params?: Api.Oms.SupplierFleetSearchParams) {
  return request<Api.Oms.SupplierVehicleList>({ url: `${BASE}/vehicle/list`, method: 'get', params });
}

export function fetchGetSupplierDriverList(params?: Api.Oms.SupplierFleetSearchParams) {
  return request<Api.Oms.SupplierDriverList>({ url: `${BASE}/driver/list`, method: 'get', params });
}

export function fetchGetSupplierEquipmentList(params?: Api.Oms.SupplierFleetSearchParams) {
  return request<Api.Oms.SupplierEquipmentList>({ url: `${BASE}/equipment/list`, method: 'get', params });
}

export function fetchGetSupplierKpiList(params?: Api.Oms.SupplierKpiSearchParams) {
  return request<Api.Oms.SupplierKpiList>({ url: `${BASE}/kpi/list`, method: 'get', params });
}

export function fetchGetSupplierKpiSummary() {
  return request<Api.Oms.SupplierKpiSummary>({ url: `${BASE}/kpi/summary`, method: 'get' });
}
