import { request } from '@/service/request';

export function fetchGetOnlineSessionStats() {
  return request<Api.Monitor.OnlineSessionStats>({ url: '/monitor/online/stats', method: 'get' });
}

export function fetchGetOnlineUserList(params?: Api.Monitor.OnlineUserSearchParams) {
  return request<Api.Monitor.OnlineUserList>({ url: '/monitor/online/list', method: 'get', params });
}

export function fetchGetOnlineSessionDetail(tokenId: string) {
  return request<Api.Monitor.OnlineUser>({ url: `/monitor/online/sessions/${tokenId}`, method: 'get' });
}

export function fetchExecuteOnlineSessionAction(data: Api.Monitor.OnlineSessionActionParams) {
  return request<Api.Monitor.OnlineUser[]>({ url: '/monitor/online/action', method: 'put', data });
}

export function fetchForceLogout(tokenId: string) {
  return request<boolean>({ url: `/monitor/online/${tokenId}`, method: 'delete' });
}

export function fetchKickOutCurrentDevice(tokenId: string) {
  return request<boolean>({ url: `/monitor/online/myself/${tokenId}`, method: 'delete' });
}

export function fetchGetOnlineDeviceList(params?: Api.Monitor.OnlineUserSearchParams) {
  return request<Api.Monitor.OnlineUserList>({ url: '/monitor/online', method: 'get', params });
}
