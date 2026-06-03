import { request } from '@/service/request';

export function fetchGetWarehouseList(params?: Api.Base.MdmWarehouseSearchParams) {
  return request<Api.Base.MdmWarehouseList>({ url: '/base/warehouse/list', method: 'get', params });
}

export function fetchGetWarehouseDetail(id: CommonType.IdType) {
  return request<Api.Base.MdmWarehouse>({ url: `/base/warehouse/${id}`, method: 'get' });
}

export function fetchCreateWarehouse(data: Api.Base.MdmWarehouseOperateParams) {
  return request<null>({ url: '/base/warehouse', method: 'post', data });
}

export function fetchUpdateWarehouse(data: Api.Base.MdmWarehouseOperateParams) {
  return request<null>({ url: '/base/warehouse', method: 'put', data });
}

export function fetchBatchDeleteWarehouse(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/warehouse/${ids.join(',')}`, method: 'delete' });
}
