import { request } from '@/service/request';

export function fetchGetMonitorCacheInfo() {
  return request<Api.Monitor.CacheInfo>({ url: '/monitor/cache', method: 'get' });
}

export function fetchGetRedisCacheDashboard() {
  return request<Api.Monitor.RedisCacheDashboard>({ url: '/monitor/cache/dashboard', method: 'get' });
}

export function fetchGetRedisInstanceDetail(id: CommonType.IdType) {
  return request<Api.Monitor.RedisInstance>({ url: `/monitor/cache/instances/${id}`, method: 'get' });
}

export function fetchGetRedisKeyCategories() {
  return request<Api.Monitor.RedisKeyCategory[]>({ url: '/monitor/cache/keys/categories', method: 'get' });
}

export function fetchGetRedisBigKeyList(params?: Api.Common.CommonSearchParams) {
  return request({ url: '/monitor/cache/keys/big', method: 'get', params });
}

export function fetchGetRedisHotKeyList(params?: Api.Common.CommonSearchParams) {
  return request({ url: '/monitor/cache/keys/hot', method: 'get', params });
}

export function fetchGetRedisKeyExpiryStats() {
  return request<Api.Monitor.RedisKeyExpiryStats>({ url: '/monitor/cache/keys/expiry', method: 'get' });
}

export function fetchGetRedisSlowQueryList(params?: Api.Common.CommonSearchParams) {
  return request({ url: '/monitor/cache/slow-queries', method: 'get', params });
}

export function fetchGetRedisAlertList(params?: Api.Common.CommonSearchParams) {
  return request({ url: '/monitor/cache/alerts', method: 'get', params });
}

export function fetchGetRedisOpsLogList(params?: Api.Common.CommonSearchParams) {
  return request({ url: '/monitor/cache/ops-logs', method: 'get', params });
}

export function fetchExecuteRedisCacheAction(data: Api.Monitor.RedisCacheActionParams) {
  return request({ url: '/monitor/cache/action', method: 'post', data });
}
