import { request } from '@/service/request';

export function fetchGetOrderWorkbenchStats() {
  return request<Api.Oms.OrderWorkbenchStats>({ url: '/oms/order-workbench/stats', method: 'get' });
}

export function fetchGetOrderWorkbenchList(params: Api.Oms.OrderWorkbenchSearchParams) {
  return request<Api.Oms.OrderWorkbenchList>({ url: '/oms/order-workbench/list', method: 'get', params });
}

export function fetchGetOrderWorkbenchDetail(id: CommonType.IdType) {
  return request<Api.Oms.OrderWorkbenchDetail>({ url: `/oms/order-workbench/${id}`, method: 'get' });
}

export function fetchExecuteOrderWorkbenchAction(id: CommonType.IdType, action: string, extra?: Record<string, any>) {
  return request<Api.Oms.OrderWorkbenchActionResult>({
    url: `/oms/order-workbench/${id}/action`,
    method: 'post',
    data: { action, ...extra }
  });
}

export function fetchBatchOrderWorkbenchAction(ids: CommonType.IdType[], action: string) {
  return request<Api.Oms.OrderWorkbenchBatchResult>({
    url: '/oms/order-workbench/batch-action',
    method: 'post',
    data: { ids, action }
  });
}

export function fetchBatchGenerateWorkbenchTrip(
  ids: CommonType.IdType[],
  params?: Api.Oms.OrderWorkbenchBatchGenerateTripParams
) {
  return request<Api.Oms.OrderWorkbenchBatchGenerateTripResult>({
    url: '/oms/order-workbench/batch-generate-trip',
    method: 'post',
    data: { ids, ...params }
  });
}
