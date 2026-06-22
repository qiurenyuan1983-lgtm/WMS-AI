import { request } from '@/service/request';

const BASE = '/tms/supplier/container-op';

export function fetchGetSupplierContainerOpList(params?: Api.Oms.SupplierContainerOpSearchParams) {
  return request<Api.Oms.SupplierContainerOpList>({
    url: `${BASE}/list`,
    method: 'get',
    params
  });
}

export function fetchGetSupplierContainerOpStatusCount(params?: Api.Oms.SupplierContainerOpSearchParams) {
  return request<Record<string, number>>({
    url: `${BASE}/status-count`,
    method: 'get',
    params
  });
}

export function fetchGetSupplierContainerOpDetail(id: CommonType.IdType) {
  return request<Api.Oms.SupplierContainerOpDetail>({
    url: `${BASE}/${id}`,
    method: 'get'
  });
}

export function fetchSyncSupplierContainerOp(data: Api.Oms.SupplierContainerOpSyncParams) {
  return request<Api.Oms.SupplierContainerOpDetail>({
    url: `${BASE}/sync`,
    method: 'put',
    data
  });
}

export function fetchSaveSupplierContainerFees(data: Api.Oms.SupplierContainerFeeSaveParams) {
  return request<Api.Oms.SupplierContainerOpDetail>({
    url: `${BASE}/fees`,
    method: 'put',
    data
  });
}

export function fetchAuditSupplierContainerFees(data: Api.Oms.SupplierContainerFeeAuditParams) {
  return request<Api.Oms.SupplierContainerOpDetail>({
    url: `${BASE}/fees/audit`,
    method: 'put',
    data
  });
}
