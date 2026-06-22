import { request } from '@/service/request';

export function fetchGetOperLogStats() {
  return request<Api.Monitor.OperLogStats>({ url: '/monitor/operlog/stats', method: 'get' });
}

export function fetchGetOperLogList(params?: Api.Monitor.OperLogSearchParams) {
  return request<Api.Monitor.OperLogList>({ url: '/monitor/operlog/list', method: 'get', params });
}

export function fetchGetOperLogDetail(operId: CommonType.IdType) {
  return request<Api.Monitor.OperLog>({ url: `/monitor/operlog/${operId}`, method: 'get' });
}

export function fetchBatchDeleteOperLog(operIds: CommonType.IdType[]) {
  return request<boolean>({ url: `/monitor/operlog/${operIds.join(',')}`, method: 'delete' });
}

export function fetchCleanOperLog() {
  return request<boolean>({ url: '/monitor/operlog/clean', method: 'delete' });
}
