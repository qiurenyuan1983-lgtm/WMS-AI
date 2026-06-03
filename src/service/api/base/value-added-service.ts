import { request } from '@/service/request';

export function fetchGetValueAddedServiceList(params?: Api.Base.ValueAddedServiceSearchParams) {
  return request<Api.Base.ValueAddedServiceList>({ url: '/base/vas/list', method: 'get', params });
}

export function fetchCreateValueAddedService(data: Api.Base.ValueAddedServiceOperateParams) {
  return request<null>({ url: '/base/vas', method: 'post', data });
}

export function fetchUpdateValueAddedService(data: Api.Base.ValueAddedServiceOperateParams) {
  return request<null>({ url: '/base/vas', method: 'put', data });
}

export function fetchBatchDeleteValueAddedService(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/vas/${ids.join(',')}`, method: 'delete' });
}

