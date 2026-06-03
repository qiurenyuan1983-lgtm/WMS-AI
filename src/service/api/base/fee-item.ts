import { request } from '@/service/request';

export function fetchGetFeeItemList(params?: Api.Base.FeeItemSearchParams) {
  return request<Api.Base.FeeItemList>({ url: '/base/fee-item/list', method: 'get', params });
}

export function fetchGetFeeItemDetail(id: CommonType.IdType) {
  return request<Api.Base.FeeItem>({ url: `/base/fee-item/${id}`, method: 'get' });
}

export function fetchCreateFeeItem(data: Api.Base.FeeItemOperateParams) {
  return request<null>({ url: '/base/fee-item', method: 'post', data });
}

export function fetchUpdateFeeItem(data: Api.Base.FeeItemOperateParams) {
  return request<null>({ url: '/base/fee-item', method: 'put', data });
}

export function fetchBatchDeleteFeeItem(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/fee-item/${ids.join(',')}`, method: 'delete' });
}
