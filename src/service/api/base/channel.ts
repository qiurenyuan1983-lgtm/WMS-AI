import { request } from '@/service/request';

export function fetchGetChannelList(params?: Api.Base.ChannelSearchParams) {
  return request<Api.Base.ChannelList>({ url: '/base/channel/list', method: 'get', params });
}

export function fetchCreateChannel(data: Api.Base.ChannelOperateParams) {
  return request<null>({ url: '/base/channel', method: 'post', data });
}

export function fetchUpdateChannel(data: Api.Base.ChannelOperateParams) {
  return request<null>({ url: '/base/channel', method: 'put', data });
}

export function fetchBatchDeleteChannel(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/channel/${ids.join(',')}`, method: 'delete' });
}

