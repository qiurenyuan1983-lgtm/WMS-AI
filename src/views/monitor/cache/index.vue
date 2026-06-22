<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchExecuteRedisCacheAction,
  fetchGetRedisAlertList,
  fetchGetRedisBigKeyList,
  fetchGetRedisCacheDashboard,
  fetchGetRedisHotKeyList,
  fetchGetRedisKeyCategories,
  fetchGetRedisKeyExpiryStats,
  fetchGetRedisOpsLogList,
  fetchGetRedisSlowQueryList
} from '@/service/api/monitor/cache';
import PerformanceCharts from './modules/performance-charts.vue';
import InstanceDetailDrawer from './modules/instance-detail-drawer.vue';
import {
  ALERT_RULES,
  ALERT_STATUS_LABEL,
  ALERT_STATUS_TAG,
  HIGH_RISK_ACTIONS,
  INSTANCE_STATUS_LABEL,
  INSTANCE_STATUS_TAG,
  RISK_LEVEL_COLOR,
  RISK_LEVEL_LABEL,
  RISK_LEVEL_TAG
} from './constants';

defineOptions({ name: 'MonitorCache' });

const { hasAuth } = useAuth();
const { download } = useDownload();

const loading = ref(false);
const dashboard = ref<Api.Monitor.RedisCacheDashboard | null>(null);
const keyCategories = ref<Api.Monitor.RedisKeyCategory[]>([]);
const keyExpiry = ref<Api.Monitor.RedisKeyExpiryStats | null>(null);
const activeTab = ref('keys');
const keySubTab = ref('category');
const instanceDrawerVisible = ref(false);
const selectedInstanceId = ref<CommonType.IdType | null>(null);
const actionPrefix = ref('wms:cache:temp:*');
const actionTtl = ref(3600);

const canAdmin = computed(() => hasAuth('monitor:cache:admin') || hasAuth('monitor:cache:super') || hasAuth('monitor:cache:remove'));
const canDev = computed(() => hasAuth('monitor:cache:view') || canAdmin.value);

const kpiCards = computed(() => {
  const o = dashboard.value?.overview;
  if (!o) return [];
  const statusColor = o.redisStatus === 'RUNNING' ? '#18a058' : o.redisStatus === 'WARNING' ? '#f0a020' : '#d03050';
  return [
    { key: 'status', label: 'Redis状态', value: o.redisStatusLabel, color: statusColor },
    { key: 'uptime', label: '运行时长', value: o.uptimeLabel, color: '#2563eb' },
    { key: 'memory', label: '内存使用率', value: `${o.memoryUsagePercent}%`, color: o.memoryUsagePercent > 80 ? '#d03050' : '#f0a020' },
    { key: 'hit', label: '缓存命中率', value: `${o.hitRate}%`, color: o.hitRate < 80 ? '#d03050' : '#18a058' },
    { key: 'conn', label: '当前连接数', value: o.connections, color: '#0284c7' },
    { key: 'qps', label: 'QPS', value: o.qps, color: '#7c3aed' },
    { key: 'keys', label: 'Key总数', value: o.keyCount.toLocaleString(), color: '#64748b' },
    { key: 'slow', label: '慢查询数', value: o.slowQueryCount, color: o.slowQueryCount > 0 ? '#d03050' : '#18a058' }
  ];
});

async function loadDashboard() {
  loading.value = true;
  const { data, error } = await fetchGetRedisCacheDashboard();
  loading.value = false;
  if (!error && data) dashboard.value = data;
}

async function loadKeyData() {
  const [catRes, expRes] = await Promise.all([fetchGetRedisKeyCategories(), fetchGetRedisKeyExpiryStats()]);
  if (!catRes.error) keyCategories.value = catRes.data || [];
  if (!expRes.error) keyExpiry.value = expRes.data || null;
}

async function refreshAll() {
  await loadDashboard();
  await loadKeyData();
  await reloadTables();
}

async function reloadTables() {
  await Promise.all([
    getBigKeyData(),
    getHotKeyData(),
    getSlowData(),
    getAlertData(),
    getOpsData()
  ]);
}

async function runAction(action: Api.Monitor.RedisCacheActionType, extra?: Partial<Api.Monitor.RedisCacheActionParams>) {
  const { data, error } = await fetchExecuteRedisCacheAction({ action, ...extra });
  if (error) return;
  const result = data as { ok?: boolean; msg?: string };
  if (result?.ok === false) {
    window.$message?.warning(result.msg || '操作已记录但未执行');
  } else {
    window.$message?.success(result?.msg || '操作成功');
  }
  await refreshAll();
}

function openInstance(row: Api.Monitor.RedisInstance) {
  selectedInstanceId.value = row.id;
  instanceDrawerVisible.value = true;
}

function handleExport() {
  download('/monitor/cache/export', {}, `Redis缓存监控报告_${Date.now()}.xlsx`);
}

const { columns: bigKeyColumns, data: bigKeyData, getData: getBigKeyData, loading: bigKeyLoading } = useNaivePaginatedTable({
  api: () => fetchGetRedisBigKeyList({ pageNum: 1, pageSize: 10 }),
  transform: response => defaultTransform(response),
  immediate: false,
  columns: () => [
    { key: 'keyName', title: 'Key名称', width: 220, ellipsis: { tooltip: true } },
    { key: 'keyType', title: '类型', width: 70 },
    { key: 'memoryHuman', title: '内存占用', width: 90 },
    { key: 'elementCount', title: '元素数量', width: 90, align: 'right' },
    { key: 'ttlSeconds', title: 'TTL', width: 80, render: row => (row.ttlSeconds < 0 ? '永不过期' : `${row.ttlSeconds}s`) },
    { key: 'businessModule', title: '业务模块', width: 100 },
    {
      key: 'riskLevel',
      title: '风险等级',
      width: 90,
      render: row => (
        <NTag size="small" type={RISK_LEVEL_TAG[row.riskLevel] || 'default'}>
          {RISK_LEVEL_LABEL[row.riskLevel] || row.riskLevel}
        </NTag>
      )
    }
  ]
});

const { columns: hotKeyColumns, data: hotKeyData, getData: getHotKeyData, loading: hotKeyLoading } = useNaivePaginatedTable({
  api: () => fetchGetRedisHotKeyList({ pageNum: 1, pageSize: 10 }),
  transform: response => defaultTransform(response),
  immediate: false,
  columns: () => [
    { key: 'keyName', title: 'Key名称', width: 220, ellipsis: { tooltip: true } },
    { key: 'accessCount', title: '访问次数', width: 100, align: 'right' },
    { key: 'qps', title: 'QPS', width: 80, align: 'right' },
    { key: 'businessModule', title: '业务模块', width: 100 },
    {
      key: 'riskLevel',
      title: '风险等级',
      width: 90,
      render: row => (
        <NTag size="small" type={RISK_LEVEL_TAG[row.riskLevel] || 'default'}>
          {RISK_LEVEL_LABEL[row.riskLevel] || row.riskLevel}
        </NTag>
      )
    }
  ]
});

const { columns: slowColumns, data: slowData, getData: getSlowData, loading: slowLoading } = useNaivePaginatedTable({
  api: () => fetchGetRedisSlowQueryList({ pageNum: 1, pageSize: 10 }),
  transform: response => defaultTransform(response),
  immediate: false,
  columns: () => [
    { key: 'queryId', title: '查询ID', width: 110 },
    { key: 'executeTime', title: '执行时间', width: 155 },
    { key: 'durationMs', title: '耗时(ms)', width: 90, align: 'right' },
    { key: 'command', title: '命令', width: 90 },
    { key: 'keyName', title: 'Key', width: 180, ellipsis: { tooltip: true } },
    { key: 'clientIp', title: '客户端IP', width: 120 },
    { key: 'sourceService', title: '来源服务', width: 100 },
    {
      key: 'riskLevel',
      title: '风险等级',
      width: 90,
      render: row => (
        <NTag size="small" type={RISK_LEVEL_TAG[row.riskLevel] || 'default'}>
          {RISK_LEVEL_LABEL[row.riskLevel] || row.riskLevel}
        </NTag>
      )
    },
    { key: 'suggestion', title: '建议处理', width: 200, ellipsis: { tooltip: true } }
  ]
});

const { columns: alertColumns, data: alertData, getData: getAlertData, loading: alertLoading } = useNaivePaginatedTable({
  api: () => fetchGetRedisAlertList({ pageNum: 1, pageSize: 10 }),
  transform: response => defaultTransform(response),
  immediate: false,
  columns: () => [
    { key: 'alertNo', title: '告警编号', width: 150 },
    { key: 'alertType', title: '告警类型', width: 130 },
    { key: 'instanceName', title: '实例', width: 140 },
    { key: 'content', title: '告警内容', width: 180, ellipsis: { tooltip: true } },
    {
      key: 'riskLevel',
      title: '风险等级',
      width: 90,
      render: row => (
        <span style={{ color: RISK_LEVEL_COLOR[row.riskLevel], fontWeight: 500 }}>
          {RISK_LEVEL_LABEL[row.riskLevel] || row.riskLevel}
        </span>
      )
    },
    { key: 'triggerTime', title: '触发时间', width: 155 },
    { key: 'currentValue', title: '当前值', width: 90 },
    { key: 'threshold', title: '阈值', width: 80 },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: row => (
        <NTag size="small" type={ALERT_STATUS_TAG[row.status] || 'default'}>
          {ALERT_STATUS_LABEL[row.status] || row.status}
        </NTag>
      )
    }
  ]
});

const { columns: opsColumns, data: opsData, getData: getOpsData, loading: opsLoading } = useNaivePaginatedTable({
  api: () => fetchGetRedisOpsLogList({ pageNum: 1, pageSize: 10 }),
  transform: response => defaultTransform(response),
  immediate: false,
  columns: () => [
    { key: 'operateTime', title: '操作时间', width: 155 },
    { key: 'operatorName', title: '操作人', width: 100 },
    { key: 'operateType', title: '操作类型', width: 130 },
    { key: 'operateTarget', title: '操作对象', width: 180, ellipsis: { tooltip: true } },
    { key: 'beforeValue', title: '操作前值', width: 120, ellipsis: { tooltip: true } },
    { key: 'afterValue', title: '操作后值', width: 120, ellipsis: { tooltip: true } },
    { key: 'result', title: '结果', width: 80 },
    { key: 'ipaddr', title: 'IP地址', width: 120 },
    {
      key: 'riskLevel',
      title: '风险等级',
      width: 90,
      render: row => RISK_LEVEL_LABEL[row.riskLevel] || row.riskLevel
    }
  ]
});

const instanceColumns = [
  { key: 'instanceName', title: '实例名称', width: 150 },
  { key: 'env', title: '环境', width: 70 },
  { key: 'host', title: 'IP/端口', width: 140, render: (row: Api.Monitor.RedisInstance) => `${row.host}:${row.port}` },
  { key: 'mode', title: '模式', width: 70 },
  { key: 'role', title: '角色', width: 80 },
  {
    key: 'status',
    title: '状态',
    width: 80,
    render: (row: Api.Monitor.RedisInstance) => (
      <NTag size="small" type={INSTANCE_STATUS_TAG[row.status] || 'default'}>
        {INSTANCE_STATUS_LABEL[row.status] || row.status}
      </NTag>
    )
  },
  { key: 'memoryUsedHuman', title: '内存', width: 90 },
  { key: 'hitRate', title: '命中率', width: 80, render: (row: Api.Monitor.RedisInstance) => `${row.hitRate}%` },
  { key: 'connections', title: '连接数', width: 70, align: 'right' as const },
  { key: 'qps', title: 'QPS', width: 70, align: 'right' as const },
  { key: 'lastCheckTime', title: '最近检查', width: 155 },
  {
    key: 'operate',
    title: '操作',
    width: 160,
    fixed: 'right' as const,
    render: (row: Api.Monitor.RedisInstance) => (
      <div class="flex gap-6px">
        <NButton text type="primary" size="small" onClick={() => openInstance(row)}>
          查看详情
        </NButton>
        <NButton text type="primary" size="small" disabled={!canAdmin.value} onClick={() => runAction('REFRESH', { instanceId: row.id })}>
          刷新
        </NButton>
      </div>
    )
  }
];

const categoryColumns = [
  { key: 'prefix', title: 'Key前缀', width: 160 },
  { key: 'businessModule', title: '业务模块', width: 120 },
  { key: 'keyCount', title: '数量', width: 90, align: 'right' as const },
  { key: 'memoryHuman', title: '内存占用', width: 100 },
  { key: 'avgTtlSeconds', title: '平均TTL', width: 100, render: (row: Api.Monitor.RedisKeyCategory) => (row.avgTtlSeconds < 0 ? '永不过期' : `${row.avgTtlSeconds}s`) }
];

onMounted(async () => {
  await refreshAll();
});
</script>

<template>
  <div class="min-h-500px flex flex-col gap-12px overflow-y-auto lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper control-panel">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">Redis缓存监控</div>
          <div class="mt-4px text-12px text-#6b7280">监控 Redis 服务状态、内存、命中率、Key、慢查询与告警</div>
        </div>
        <NSpace>
          <NButton type="primary" :loading="loading" @click="refreshAll">刷新监控</NButton>
          <NButton v-if="canAdmin" @click="handleExport">导出报告</NButton>
          <NButton v-if="canAdmin" @click="runAction('CLEAR_SLOW_LOG')">清理慢查询日志</NButton>
          <NTooltip v-for="action in HIGH_RISK_ACTIONS" :key="action">
            <template #trigger>
              <NButton disabled size="small">{{ action }}</NButton>
            </template>
            第一阶段仅展示，不允许真实执行
          </NTooltip>
        </NSpace>
      </div>
    </NCard>

    <NSpin :show="loading">
      <NCard :bordered="false" size="small" class="card-wrapper">
        <div class="flex flex-wrap gap-10px">
          <div
            v-for="card in kpiCards"
            :key="card.key"
            class="min-w-120px flex-1 rounded-8px border border-#e5e7eb px-14px py-10px"
          >
            <div class="text-12px text-#6b7280">{{ card.label }}</div>
            <div class="text-20px font-semibold" :style="{ color: card.color }">{{ card.value }}</div>
          </div>
        </div>
      </NCard>

      <NCard title="Redis实例列表" :bordered="false" size="small" class="card-wrapper">
        <NDataTable
          :columns="instanceColumns"
          :data="dashboard?.instances || []"
          size="small"
          :scroll-x="1200"
        />
      </NCard>

      <PerformanceCharts v-if="dashboard?.trends?.length" :trends="dashboard.trends" />

      <NCard :bordered="false" size="small" class="card-wrapper">
        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="keys" tab="Key监控">
            <NTabs v-model:value="keySubTab" type="segment" size="small" class="mb-12px mt-8px">
              <NTabPane name="category" tab="Key分类统计" />
              <NTabPane name="big" tab="大Key" />
              <NTabPane name="hot" tab="热Key" />
              <NTabPane name="expiry" tab="过期Key" />
            </NTabs>
            <NDataTable v-if="keySubTab === 'category'" :columns="categoryColumns" :data="keyCategories" size="small" />
            <NDataTable v-else-if="keySubTab === 'big'" :columns="bigKeyColumns" :data="bigKeyData" :loading="bigKeyLoading" size="small" />
            <NDataTable v-else-if="keySubTab === 'hot'" :columns="hotKeyColumns" :data="hotKeyData" :loading="hotKeyLoading" size="small" />
            <div v-else class="mt-8px">
              <div class="mb-12px flex flex-wrap gap-16px">
                <NStatistic label="永不过期Key" :value="keyExpiry?.neverExpireCount || 0" />
                <NStatistic label="即将过期Key" :value="keyExpiry?.expiringSoonCount || 0" />
              </div>
              <NDataTable
                :columns="[
                  { key: 'keyName', title: 'Key名称' },
                  { key: 'ttlSeconds', title: '剩余TTL(s)' },
                  { key: 'businessModule', title: '业务模块' }
                ]"
                :data="keyExpiry?.expiringSoonKeys || []"
                size="small"
              />
            </div>
            <div v-if="canAdmin && keySubTab !== 'category'" class="mt-12px flex flex-wrap items-center gap-8px">
              <NInput v-model:value="actionPrefix" placeholder="Key前缀，如 wms:cache:temp:*" class="w-240px" />
              <NInputNumber v-model:value="actionTtl" :min="60" class="w-120px" />
              <NButton size="small" @click="runAction('SET_TTL', { target: actionPrefix, ttlSeconds: actionTtl })">设置Key TTL</NButton>
              <NButton size="small" type="warning" @click="runAction('CLEAR_PREFIX', { target: actionPrefix })">清理指定前缀Key</NButton>
            </div>
          </NTabPane>

          <NTabPane v-if="canDev" name="slow" tab="慢查询监控">
            <NAlert type="warning" class="mb-12px mt-8px">
              常见风险命令：KEYS、HGETALL 大 Hash、LRANGE 大 List、SMEMBERS 大 Set
            </NAlert>
            <NDataTable :columns="slowColumns" :data="slowData" :loading="slowLoading" size="small" :scroll-x="1100" />
          </NTabPane>

          <NTabPane name="alerts" tab="告警记录">
            <NAlert type="info" class="mb-12px mt-8px" title="告警规则">
              <div class="flex flex-wrap gap-8px">
                <NTag v-for="rule in ALERT_RULES" :key="rule" size="small">{{ rule }}</NTag>
              </div>
            </NAlert>
            <NDataTable :columns="alertColumns" :data="alertData" :loading="alertLoading" size="small" :scroll-x="1200" />
          </NTabPane>

          <NTabPane name="ops" tab="操作日志">
            <NDataTable :columns="opsColumns" :data="opsData" :loading="opsLoading" size="small" :scroll-x="1100" />
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpin>

    <InstanceDetailDrawer v-model:visible="instanceDrawerVisible" :instance-id="selectedInstanceId" />
  </div>
</template>

<style scoped>
.control-panel {
  background: linear-gradient(to right, rgba(37, 99, 235, 0.05), rgba(37, 99, 235, 0.01));
}
</style>
