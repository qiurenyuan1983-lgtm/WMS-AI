import { request } from '@/service/request';

export function fetchGetWmsInventoryList(params?: Api.Wms.InventorySearchParams) {
  return request<Api.Wms.InventoryList>({ url: '/wms/inventory/list', method: 'get', params });
}

export function fetchGetWmsInventoryStats(params?: Api.Wms.InventorySearchParams) {
  return request<Api.Wms.InventoryStats>({ url: '/wms/inventory/stats', method: 'get', params });
}

export function fetchGetWmsInventoryDetail(id: CommonType.IdType) {
  return request<Api.Wms.Inventory>({ url: `/wms/inventory/${id}`, method: 'get' });
}

export function fetchGetWmsPalletList(params?: Api.Wms.PalletSearchParams) {
  return request<Api.Wms.PalletList>({ url: '/wms/inventory/pallets', method: 'get', params });
}

export function fetchGetWmsPalletItems(palletId: CommonType.IdType) {
  return request<Api.Wms.PalletItem[]>({ url: `/wms/inventory/pallets/${palletId}/items`, method: 'get' });
}

export function fetchMoveWmsPalletLocation(data: Api.Wms.PalletMoveParams) {
  return request<null>({ url: '/wms/inventory/pallets/moveLocation', method: 'put', data });
}

export function fetchOutboundWmsPallet(data: Api.Wms.PalletOutboundParams) {
  return request<null>({ url: '/wms/inventory/pallets/outbound', method: 'put', data });
}

export function fetchGetWmsInventoryLockList(params?: Api.Wms.InventoryLockSearchParams) {
  return request<Api.Wms.InventoryLockList>({ url: '/wms/inventory/locks', method: 'get', params });
}

export function fetchGetWmsInventoryTransactionList(params?: Api.Wms.InventoryTransactionSearchParams) {
  return request<Api.Wms.InventoryTransactionList>({ url: '/wms/inventory/transactions', method: 'get', params });
}

export function fetchReceiveWmsInventory(data: Api.Wms.InventoryReceiveParams) {
  return request<null>({ url: '/wms/inventory/receive', method: 'post', data });
}

export function fetchLockWmsInventory(data: Api.Wms.InventoryLockOperateParams) {
  return request<null>({ url: '/wms/inventory/lock', method: 'post', data });
}

export function fetchAdjustWmsInventory(data: Api.Wms.InventoryAdjustParams) {
  return request<null>({ url: '/wms/inventory/adjust', method: 'post', data });
}

export function fetchGetWmsInventoryVisualization(params: Api.Wms.InventoryVisualizationParams) {
  return request<Api.Wms.InventoryVisualization>({ url: '/wms/inventory/visualization', method: 'get', params });
}
