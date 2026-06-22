import { request } from '@/service/request';

const BASE = '/tms/supplier-task';

export function fetchGetSupplierTaskList(params?: Api.Tms.SupplierTaskSearchParams) {
  return request<Api.Tms.SupplierTaskList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetSupplierTaskStatusCount(params?: Api.Tms.SupplierTaskSearchParams) {
  return request<Api.Tms.SupplierTaskStatusCount>({ url: `${BASE}/status-count`, method: 'get', params });
}

export function fetchGetSupplierTaskSummary() {
  return request<Api.Tms.SupplierTaskSummary>({ url: `${BASE}/summary`, method: 'get' });
}
