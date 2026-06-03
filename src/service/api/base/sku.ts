import { request } from '@/service/request';

export function fetchGetSkuList(params?: Api.Base.MdmSkuSearchParams) {
  return request<Api.Base.MdmSkuList>({ url: '/base/sku/list', method: 'get', params });
}

export function fetchGetSkuDetail(id: CommonType.IdType) {
  return request<Api.Base.MdmSku>({ url: `/base/sku/${id}`, method: 'get' });
}

export function fetchCreateSku(data: Api.Base.MdmSkuOperateParams) {
  return request<null>({ url: '/base/sku', method: 'post', data });
}

export function fetchUpdateSku(data: Api.Base.MdmSkuOperateParams) {
  return request<null>({ url: '/base/sku', method: 'put', data });
}

export function fetchBatchDeleteSku(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/sku/${ids.join(',')}`, method: 'delete' });
}
