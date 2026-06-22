import { request } from '@/service/request';

export function fetchGetLoginLogStats() {
  return request<Api.Monitor.LoginLogStats>({ url: '/monitor/logininfor/stats', method: 'get' });
}

export function fetchGetLoginInforList(params?: Api.Monitor.LoginInforSearchParams) {
  return request<Api.Monitor.LoginInforList>({
    url: '/monitor/logininfor/list',
    method: 'get',
    params
  });
}

export function fetchGetLoginInforDetail(infoId: CommonType.IdType) {
  return request<Api.Monitor.LoginInfor>({ url: `/monitor/logininfor/${infoId}`, method: 'get' });
}

export function fetchExecuteLoginLogAction(data: Api.Monitor.LoginLogActionParams) {
  return request<Api.Monitor.LoginInfor[]>({ url: '/monitor/logininfor/action', method: 'put', data });
}

export function fetchBatchDeleteLoginInfor(infoIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/monitor/logininfor/${infoIds.join(',')}`,
    method: 'delete'
  });
}

export function fetchUnlockLoginInfor(username: string) {
  return request<boolean>({
    url: `/monitor/logininfor/unlock/${username}`,
    method: 'get'
  });
}

export function fetchCleanLoginInfor() {
  return request<boolean>({
    url: '/monitor/logininfor/clean',
    method: 'delete'
  });
}
