import { request } from '@/service/request';

export function fetchGetYardInventoryList(params?: Api.Yms.YardInventorySearchParams) {
  return request<Api.Yms.YardInventoryList>({ url: '/yms/yard-inventory/list', method: 'get', params });
}

export function fetchGetYardInventoryDetail(id: CommonType.IdType) {
  return request<Api.Yms.YardInventoryTask>({ url: `/yms/yard-inventory/${id}`, method: 'get' });
}

export function fetchCreateYardInventory(data: Api.Yms.YardInventoryCreate) {
  return request<Api.Yms.YardInventoryTask>({ url: '/yms/yard-inventory', method: 'post', data });
}

export function fetchStartYardInventory(id: CommonType.IdType) {
  return request<null>({ url: `/yms/yard-inventory/${id}/start`, method: 'post' });
}

export function fetchScanYardInventoryItem(data: Api.Yms.YardInventoryScan) {
  return request<Api.Yms.YardInventoryItem>({ url: '/yms/yard-inventory/scan', method: 'post', data });
}

export function fetchCompleteYardInventory(id: CommonType.IdType) {
  return request<Api.Yms.YardInventoryTask>({ url: `/yms/yard-inventory/${id}/complete`, method: 'post' });
}

export function fetchConfirmYardInventoryDiff(id: CommonType.IdType) {
  return request<null>({ url: `/yms/yard-inventory/${id}/confirm-diff`, method: 'post' });
}
