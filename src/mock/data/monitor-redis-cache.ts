import { mockPage } from '../utils';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return `${h}:00`;
});

export const MOCK_REDIS_OVERVIEW: Api.Monitor.RedisCacheOverview = {
  redisStatus: 'RUNNING',
  redisStatusLabel: '运行中',
  memoryUsagePercent: 72.4,
  memoryUsedHuman: '3.62GB',
  memoryMaxHuman: '5.00GB',
  hitRate: 94.6,
  connections: 128,
  qps: 3250,
  keyCount: 128450,
  slowQueryCount: 12,
  uptimeDays: 45,
  uptimeLabel: '45天3小时',
  evictedKeys: 18
};

export const MOCK_REDIS_INSTANCES: Api.Monitor.RedisInstance[] = [
  {
    id: 1,
    instanceName: 'redis-prod-master',
    env: '生产',
    host: '10.10.1.21',
    port: 6379,
    mode: '主从',
    role: 'Master',
    status: 'RUNNING',
    memoryUsedHuman: '2.1GB',
    memoryUsagePercent: 68.5,
    hitRate: 95.2,
    connections: 86,
    qps: 2180,
    lastCheckTime: '2026-06-06 14:30:00',
    redisVersion: '7.2.4',
    maxMemoryHuman: '4GB',
    aofEnabled: true,
    rdbStatus: 'ok'
  },
  {
    id: 2,
    instanceName: 'redis-prod-slave',
    env: '生产',
    host: '10.10.1.22',
    port: 6379,
    mode: '主从',
    role: 'Slave',
    status: 'RUNNING',
    memoryUsedHuman: '2.0GB',
    memoryUsagePercent: 65.1,
    hitRate: 95.0,
    connections: 24,
    qps: 680,
    lastCheckTime: '2026-06-06 14:30:00',
    redisVersion: '7.2.4',
    maxMemoryHuman: '4GB',
    aofEnabled: true,
    rdbStatus: 'ok'
  },
  {
    id: 3,
    instanceName: 'redis-staging',
    env: '预发',
    host: '10.20.1.15',
    port: 6379,
    mode: '单机',
    role: 'Standalone',
    status: 'WARNING',
    memoryUsedHuman: '820MB',
    memoryUsagePercent: 82.3,
    hitRate: 88.4,
    connections: 12,
    qps: 320,
    lastCheckTime: '2026-06-06 14:29:50',
    redisVersion: '7.0.12',
    maxMemoryHuman: '1GB',
    aofEnabled: false,
    rdbStatus: 'ok'
  },
  {
    id: 4,
    instanceName: 'redis-dev',
    env: '开发',
    host: '127.0.0.1',
    port: 6380,
    mode: '单机',
    role: 'Standalone',
    status: 'OFFLINE',
    memoryUsedHuman: '—',
    memoryUsagePercent: 0,
    hitRate: 0,
    connections: 0,
    qps: 0,
    lastCheckTime: '2026-06-06 13:10:00',
    redisVersion: '6.2.14',
    maxMemoryHuman: '512MB',
    aofEnabled: false,
    rdbStatus: 'err'
  }
];

export const MOCK_REDIS_TRENDS: Api.Monitor.RedisTrendPoint[] = HOURS.map((time, i) => ({
  time,
  memoryPercent: 62 + Math.sin(i / 4) * 8 + (i > 18 ? 6 : 0),
  hitRate: 92 + Math.cos(i / 5) * 2,
  connections: 90 + Math.round(Math.sin(i / 3) * 25),
  qps: 2400 + Math.round(Math.cos(i / 2) * 900)
}));

export const MOCK_KEY_CATEGORIES: Api.Monitor.RedisKeyCategory[] = [
  { prefix: 'wms:inventory:', businessModule: 'WMS库存', keyCount: 32450, memoryHuman: '980MB', avgTtlSeconds: 86400 },
  { prefix: 'wms:location:', businessModule: 'WMS库位', keyCount: 18200, memoryHuman: '420MB', avgTtlSeconds: 43200 },
  { prefix: 'oms:order:', businessModule: 'OMS订单', keyCount: 25680, memoryHuman: '760MB', avgTtlSeconds: 172800 },
  { prefix: 'sys:dict:', businessModule: '系统字典', keyCount: 8600, memoryHuman: '120MB', avgTtlSeconds: -1 },
  { prefix: 'session:', businessModule: '用户会话', keyCount: 12400, memoryHuman: '210MB', avgTtlSeconds: 7200 },
  { prefix: 'auth:token:', businessModule: '认证令牌', keyCount: 9800, memoryHuman: '180MB', avgTtlSeconds: 3600 }
];

export const MOCK_BIG_KEYS: Api.Monitor.RedisBigKey[] = [
  { id: 1, keyName: 'wms:inventory:snapshot:20260606', keyType: 'Hash', memoryHuman: '128MB', elementCount: 52000, ttlSeconds: 86400, businessModule: 'WMS库存', riskLevel: 'HIGH', instanceName: 'redis-prod-master' },
  { id: 2, keyName: 'oms:order:pool:amazon', keyType: 'ZSet', memoryHuman: '86MB', elementCount: 18200, ttlSeconds: 172800, businessModule: 'OMS订单', riskLevel: 'MEDIUM', instanceName: 'redis-prod-master' },
  { id: 3, keyName: 'sys:dict:all', keyType: 'Hash', memoryHuman: '64MB', elementCount: 8600, ttlSeconds: -1, businessModule: '系统字典', riskLevel: 'MEDIUM', instanceName: 'redis-prod-master' },
  { id: 4, keyName: 'wms:devanning:task:list', keyType: 'List', memoryHuman: '42MB', elementCount: 9800, ttlSeconds: 43200, businessModule: 'WMS拆柜', riskLevel: 'LOW', instanceName: 'redis-staging' }
];

export const MOCK_HOT_KEYS: Api.Monitor.RedisHotKey[] = [
  { id: 1, keyName: 'session:online:users', accessCount: 128000, qps: 420, businessModule: '用户会话', riskLevel: 'MEDIUM', instanceName: 'redis-prod-master' },
  { id: 2, keyName: 'wms:inventory:available', accessCount: 96000, qps: 310, businessModule: 'WMS库存', riskLevel: 'LOW', instanceName: 'redis-prod-master' },
  { id: 3, keyName: 'auth:token:blacklist', accessCount: 52000, qps: 180, businessModule: '认证令牌', riskLevel: 'LOW', instanceName: 'redis-prod-master' },
  { id: 4, keyName: 'oms:order:status:count', accessCount: 88000, qps: 260, businessModule: 'OMS订单', riskLevel: 'HIGH', instanceName: 'redis-prod-master' }
];

export const MOCK_KEY_EXPIRY: Api.Monitor.RedisKeyExpiryStats = {
  neverExpireCount: 18600,
  expiringSoonCount: 4280,
  expiringSoonKeys: [
    { keyName: 'session:temp:import:8821', ttlSeconds: 120, businessModule: '用户会话' },
    { keyName: 'wms:lock:putaway:A-12', ttlSeconds: 45, businessModule: 'WMS库存' },
    { keyName: 'oms:cart:draft:user_102', ttlSeconds: 300, businessModule: 'OMS订单' },
    { keyName: 'auth:captcha:login:5566', ttlSeconds: 90, businessModule: '认证令牌' }
  ]
};

export const MOCK_SLOW_QUERIES: Api.Monitor.RedisSlowQuery[] = [
  { id: 1, queryId: 'SQ-10021', executeTime: '2026-06-06 14:18:22', durationMs: 1280, command: 'KEYS', keyName: 'wms:inventory:*', clientIp: '10.10.2.18', sourceService: 'wms-job', riskLevel: 'HIGH', suggestion: '改用 SCAN 替代 KEYS，避免阻塞 Redis', instanceName: 'redis-prod-master' },
  { id: 2, queryId: 'SQ-10020', executeTime: '2026-06-06 13:55:10', durationMs: 860, command: 'HGETALL', keyName: 'wms:inventory:snapshot:20260606', clientIp: '10.10.2.12', sourceService: 'wms-api', riskLevel: 'HIGH', suggestion: '大 Hash 建议分页 HSCAN 获取', instanceName: 'redis-prod-master' },
  { id: 3, queryId: 'SQ-10019', executeTime: '2026-06-06 13:40:05', durationMs: 520, command: 'LRANGE', keyName: 'wms:devanning:task:list', clientIp: '10.10.2.15', sourceService: 'wms-api', riskLevel: 'MEDIUM', suggestion: '限制 LRANGE 范围，避免一次拉取大 List', instanceName: 'redis-staging' },
  { id: 4, queryId: 'SQ-10018', executeTime: '2026-06-06 12:22:33', durationMs: 410, command: 'SMEMBERS', keyName: 'oms:order:tags:amazon', clientIp: '10.10.3.8', sourceService: 'oms-api', riskLevel: 'MEDIUM', suggestion: '大 Set 使用 SSCAN 分批读取', instanceName: 'redis-prod-master' }
];

export const MOCK_REDIS_ALERTS: Api.Monitor.RedisAlert[] = [
  { id: 1, alertNo: 'ALM-20260606-001', alertType: '内存使用率过高', instanceName: 'redis-staging', content: '内存使用率超过 80%', riskLevel: 'HIGH', triggerTime: '2026-06-06 14:10:00', currentValue: '82.3%', threshold: '80%', status: 'PENDING' },
  { id: 2, alertNo: 'ALM-20260606-002', alertType: '命中率偏低', instanceName: 'redis-staging', content: '缓存命中率低于 80%', riskLevel: 'MEDIUM', triggerTime: '2026-06-06 13:48:00', currentValue: '78.6%', threshold: '80%', status: 'ACKED' },
  { id: 3, alertNo: 'ALM-20260606-003', alertType: '慢查询超阈值', instanceName: 'redis-prod-master', content: '检测到 KEYS 慢查询', riskLevel: 'HIGH', triggerTime: '2026-06-06 14:18:30', currentValue: '1280ms', threshold: '500ms', status: 'PENDING' },
  { id: 4, alertNo: 'ALM-20260605-018', alertType: '实例离线', instanceName: 'redis-dev', content: 'Redis 实例心跳丢失', riskLevel: 'HIGH', triggerTime: '2026-06-06 13:10:00', currentValue: '离线', threshold: '在线', status: 'RESOLVED' },
  { id: 5, alertNo: 'ALM-20260605-015', alertType: '大Key超阈值', instanceName: 'redis-prod-master', content: '检测到大 Key 超过 100MB', riskLevel: 'MEDIUM', triggerTime: '2026-06-06 08:20:00', currentValue: '128MB', threshold: '100MB', status: 'ACKED' }
];

export let MOCK_REDIS_OPS_LOGS: Api.Monitor.RedisOpsLog[] = [
  { id: 1, operateTime: '2026-06-06 14:25:00', operatorName: 'admin', operateType: '刷新监控', operateTarget: 'redis-prod-master', beforeValue: '—', afterValue: '已刷新', result: '成功', ipaddr: '192.168.1.10', riskLevel: 'NORMAL' },
  { id: 2, operateTime: '2026-06-06 13:50:12', operatorName: 'sysadmin', operateType: '设置Key TTL', operateTarget: 'session:temp:import:8821', beforeValue: 'TTL -1', afterValue: 'TTL 7200', result: '成功', ipaddr: '192.168.1.12', riskLevel: 'LOW' },
  { id: 3, operateTime: '2026-06-06 12:10:33', operatorName: 'dev01', operateType: '清理慢查询日志', operateTarget: 'redis-prod-master', beforeValue: '18条', afterValue: '0条', result: '成功', ipaddr: '10.10.3.5', riskLevel: 'LOW' },
  { id: 4, operateTime: '2026-06-06 10:05:18', operatorName: 'admin', operateType: '清理指定前缀Key', operateTarget: 'wms:cache:temp:*', beforeValue: '1260 keys', afterValue: '0 keys', result: '成功', ipaddr: '192.168.1.10', riskLevel: 'MEDIUM' }
];

export const MOCK_ALERT_RULES = [
  '内存使用率超过 80%',
  '命中率低于 80%',
  '连接数超过阈值',
  'QPS 异常升高',
  'Redis 实例离线',
  '慢查询超过阈值',
  '大 Key 超过阈值',
  '热 Key 访问异常',
  'Key 数量异常增长',
  'evicted_keys 持续增加'
];

export function getRedisCacheDashboard(): Api.Monitor.RedisCacheDashboard {
  return {
    overview: MOCK_REDIS_OVERVIEW,
    instances: MOCK_REDIS_INSTANCES,
    trends: MOCK_REDIS_TRENDS,
    commandStats: [
      { name: 'GET', value: 128000 },
      { name: 'SET', value: 42000 },
      { name: 'HGET', value: 36000 },
      { name: 'HSET', value: 18000 },
      { name: 'DEL', value: 8200 },
      { name: 'EXPIRE', value: 5600 },
      { name: 'KEYS', value: 12 },
      { name: 'SCAN', value: 980 }
    ]
  };
}

export function getRedisCacheInfoLegacy(): Api.Monitor.CacheInfo {
  const dash = getRedisCacheDashboard();
  const master = MOCK_REDIS_INSTANCES[0];
  return {
    info: {
      redis_version: master.redisVersion || '7.2.4',
      redis_mode: 'standalone',
      tcp_port: master.port,
      connected_clients: dash.overview.connections,
      uptime_in_days: dash.overview.uptimeDays,
      used_memory_human: dash.overview.memoryUsedHuman,
      used_cpu_user_children: '0.82',
      maxmemory_human: dash.overview.memoryMaxHuman,
      aof_enabled: '1',
      rdb_last_bgsave_status: 'ok',
      instantaneous_input_kbps: 128.5,
      instantaneous_output_kbps: 96.2
    },
    dbSize: dash.overview.keyCount,
    commandStats: dash.commandStats
  };
}

export function getRedisInstanceDetail(id: CommonType.IdType) {
  return MOCK_REDIS_INSTANCES.find(i => String(i.id) === String(id)) || null;
}

export function getRedisKeyCategories() {
  return MOCK_KEY_CATEGORIES;
}

export function getRedisBigKeyList(params?: Record<string, any>) {
  return mockPage(MOCK_BIG_KEYS, params);
}

export function getRedisHotKeyList(params?: Record<string, any>) {
  return mockPage(MOCK_HOT_KEYS, params);
}

export function getRedisKeyExpiryStats() {
  return MOCK_KEY_EXPIRY;
}

export function getRedisSlowQueryList(params?: Record<string, any>) {
  return mockPage(MOCK_SLOW_QUERIES, params);
}

export function getRedisAlertList(params?: Record<string, any>) {
  return mockPage(MOCK_REDIS_ALERTS, params);
}

export function getRedisOpsLogList(params?: Record<string, any>) {
  return mockPage(MOCK_REDIS_OPS_LOGS, params);
}

const ACTION_LABEL: Record<string, string> = {
  REFRESH: '刷新监控',
  SET_TTL: '设置Key TTL',
  CLEAR_PREFIX: '清理指定前缀Key',
  CLEAR_SLOW_LOG: '清理慢查询日志',
  EXPORT_REPORT: '导出报告',
  SET_ALERT_RULE: '设置告警规则',
  FLUSHDB: 'FLUSHDB',
  FLUSHALL: 'FLUSHALL',
  RESTART: '重启Redis',
  SET_MAXMEMORY: '修改maxmemory'
};

const HIGH_RISK = new Set(['FLUSHDB', 'FLUSHALL', 'RESTART', 'SET_MAXMEMORY']);

export function executeRedisCacheAction(body: Api.Monitor.RedisCacheActionParams) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const instance = MOCK_REDIS_INSTANCES.find(i => String(i.id) === String(body.instanceId));
  const target = body.target || instance?.instanceName || '全部实例';
  const riskLevel: Api.Monitor.RedisRiskLevel = HIGH_RISK.has(body.action) ? 'HIGH' : body.action === 'CLEAR_PREFIX' ? 'MEDIUM' : 'LOW';

  if (HIGH_RISK.has(body.action)) {
    MOCK_REDIS_OPS_LOGS.unshift({
      id: MOCK_REDIS_OPS_LOGS.length + 1,
      operateTime: now,
      operatorName: 'admin',
      operateType: ACTION_LABEL[body.action] || body.action,
      operateTarget: target,
      beforeValue: '—',
      afterValue: '第一阶段仅展示，未执行',
      result: '已拦截',
      ipaddr: '192.168.1.10',
      riskLevel: 'HIGH'
    });
    return { ok: false, msg: '高风险操作第一阶段仅展示，不允许真实执行', logged: true };
  }

  MOCK_REDIS_OPS_LOGS.unshift({
    id: MOCK_REDIS_OPS_LOGS.length + 1,
    operateTime: now,
    operatorName: 'admin',
    operateType: ACTION_LABEL[body.action] || body.action,
    operateTarget: target,
    beforeValue: body.action === 'SET_TTL' ? 'TTL -1' : '—',
    afterValue: body.action === 'SET_TTL' ? `TTL ${body.ttlSeconds ?? 3600}` : '已完成',
    result: '成功',
    ipaddr: '192.168.1.10',
    riskLevel
  });

  if (body.action === 'REFRESH' && instance) {
    instance.lastCheckTime = now;
  }
  if (body.action === 'CLEAR_SLOW_LOG') {
    MOCK_REDIS_OVERVIEW.slowQueryCount = 0;
  }

  return { ok: true, msg: '操作成功', dashboard: getRedisCacheDashboard() };
}
