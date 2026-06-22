<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchExecuteOnlineSessionAction,
  fetchGetOnlineSessionStats,
  fetchGetOnlineUserList
} from '@/service/api/monitor/online';
import OnlineSessionDetailPanel from './modules/online-session-detail-panel.vue';
import {
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPE_OPTIONS,
  DEPT_OPTIONS,
  LOGIN_PORT_LABEL,
  LOGIN_PORT_OPTIONS,
  ONLINE_STATUS_LABEL,
  ONLINE_STATUS_OPTIONS,
  ONLINE_STATUS_TAG,
  RISK_LEVEL_LABEL,
  RISK_LEVEL_OPTIONS,
  RISK_LEVEL_TAG,
  TAB_OPTIONS,
  WAREHOUSE_OPTIONS
} from './constants';

defineOptions({ name: 'OnlineList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const stats = ref<Api.Monitor.OnlineSessionStats | null>(null);
const activeTab = ref<Api.Monitor.OnlineSessionTab>('ALL');
const selectedTokenId = ref<string | null>(null);
const detailVisible = ref(false);
const checkedRowKeys = ref<string[]>([]);

const searchParams = ref<Api.Monitor.OnlineUserSearchParams>({
  pageNum: 1,
  pageSize: 10,
  userName: null,
  nickName: null,
  accountType: null,
  deptName: null,
  warehouseName: null,
  loginPort: null,
  onlineStatus: null,
  ipaddr: null,
  deviceType: null,
  riskLevel: null,
  tabKey: 'ALL',
  params: {}
});

const kpiCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { key: 'total', label: '当前在线', value: s.totalOnline, color: '#2563eb', tab: 'ALL' },
    { key: 'pc', label: 'PC端在线', value: s.pcOnline, color: '#0284c7', tab: 'PC' },
    { key: 'pda', label: 'PDA端在线', value: s.pdaOnline, color: '#7c3aed', tab: 'PDA' },
    { key: 'customer', label: '客户门户', value: s.customerOnline, color: '#18a058', tab: 'CUSTOMER' },
    { key: 'supplier', label: '供应商门户', value: s.supplierOnline, color: '#f0a020', tab: 'SUPPLIER' },
    { key: 'driver', label: '司机端在线', value: s.driverOnline, color: '#64748b', tab: 'DRIVER' },
    { key: 'abnormal', label: '异常会话', value: s.abnormalSessions, color: '#d03050', tab: 'ABNORMAL' },
    { key: 'force', label: '今日强制下线', value: s.forceLogoutToday, color: '#dc2626', tab: 'ALL' }
  ];
});

const tabItems = computed(() =>
  TAB_OPTIONS.map(tab => ({
    ...tab,
    count: stats.value?.tabCounts?.[tab.value] ?? 0
  }))
);

async function loadStats() {
  const { data } = await fetchGetOnlineSessionStats();
  stats.value = data || null;
}

function syncTab() {
  searchParams.value.tabKey = activeTab.value;
}

function handleSearch() {
  syncTab();
  searchParams.value.pageNum = 1;
  getDataByPage(1);
  loadStats();
}

function handleReset() {
  activeTab.value = 'ALL';
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    userName: null,
    nickName: null,
    accountType: null,
    deptName: null,
    warehouseName: null,
    loginPort: null,
    onlineStatus: null,
    ipaddr: null,
    deviceType: null,
    riskLevel: null,
    tabKey: 'ALL',
    params: {}
  };
  getDataByPage(1);
  loadStats();
}

function handleTabChange(val: string) {
  activeTab.value = val as Api.Monitor.OnlineSessionTab;
  handleSearch();
}

function handleKpiClick(tab: string) {
  if (tab === 'ALL' && kpiCards.value.find(c => c.tab === tab && c.key === 'force')) return;
  activeTab.value = tab as Api.Monitor.OnlineSessionTab;
  handleSearch();
}

function selectRow(row: Api.Monitor.OnlineUser) {
  selectedTokenId.value = row.tokenId;
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
  selectedTokenId.value = null;
}

function handleExport() {
  download('/monitor/online/export', searchParams.value, `在线用户列表_${Date.now()}.xlsx`);
}

async function runRowAction(row: Api.Monitor.OnlineUser, action: Api.Monitor.OnlineSessionActionType) {
  const { error } = await fetchExecuteOnlineSessionAction({ tokenIds: [row.tokenId], action });
  if (error) return;
  window.$message?.success('操作成功');
  await getData();
  await loadStats();
}

async function runBatchAction(action: Api.Monitor.OnlineSessionActionType) {
  if (!checkedRowKeys.value.length) {
    window.$message?.warning('请先选择会话');
    return;
  }
  const { error } = await fetchExecuteOnlineSessionAction({ tokenIds: checkedRowKeys.value, action });
  if (error) return;
  checkedRowKeys.value = [];
  window.$message?.success('批量操作成功');
  await getData();
  await loadStats();
}

function onDetailUpdated() {
  getData();
  loadStats();
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetOnlineUserList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 10;
    },
    columns: () => [
      { type: 'selection', width: 48 },
      {
        key: 'sessionId',
        title: '会话ID',
        width: 90,
        fixed: 'left',
        render: row => (
          <span class="cursor-pointer text-primary hover:underline" onClick={() => selectRow(row)}>
            {row.sessionId}
          </span>
        )
      },
      { key: 'userName', title: '用户账号', width: 110 },
      { key: 'nickName', title: '用户姓名', width: 100 },
      {
        key: 'accountType',
        title: '账号类型',
        width: 100,
        render: row => ACCOUNT_TYPE_LABEL[row.accountType || ''] || row.accountType || '—'
      },
      { key: 'roleName', title: '角色', width: 100, ellipsis: { tooltip: true } },
      { key: 'deptName', title: '所属部门', width: 110, ellipsis: { tooltip: true } },
      { key: 'warehouseName', title: '所属仓库', width: 110, ellipsis: { tooltip: true } },
      {
        key: 'loginPort',
        title: '登录端口',
        width: 80,
        render: row => LOGIN_PORT_LABEL[row.loginPort || ''] || row.loginPort || '—'
      },
      { key: 'currentPage', title: '当前页面', width: 120, ellipsis: { tooltip: true } },
      { key: 'ipaddr', title: 'IP地址', width: 120 },
      { key: 'loginLocation', title: '登录地点', width: 110, ellipsis: { tooltip: true } },
      { key: 'deviceType', title: '设备类型', width: 90 },
      { key: 'loginTime', title: '登录时间', width: 155 },
      { key: 'onlineDuration', title: '在线时长', width: 90 },
      { key: 'lastActiveTime', title: '最后活跃', width: 155 },
      { key: 'idleDuration', title: '空闲时长', width: 90 },
      {
        key: 'onlineStatus',
        title: '在线状态',
        width: 90,
        render: row => (
          <NTag size="small" type={ONLINE_STATUS_TAG[row.onlineStatus] || 'default'}>
            {ONLINE_STATUS_LABEL[row.onlineStatus] || row.onlineStatus}
          </NTag>
        )
      },
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
      {
        key: 'operate',
        title: '操作',
        width: 130,
        fixed: 'right',
        render: row => {
          const options = [
            { label: '强制下线', key: 'FORCE_LOGOUT' },
            { label: '锁定账号', key: 'LOCK_ACCOUNT' },
            { label: '标记正常', key: 'MARK_NORMAL', disabled: !row.abnormalFlag },
            { label: '通知用户', key: 'NOTIFY_USER' }
          ];
          return (
            <div class="flex items-center gap-6px">
              <NButton text type="primary" size="small" onClick={() => selectRow(row)}>
                查看
              </NButton>
              {hasAuth('monitor:online:forceLogout') ? (
                <NDropdown
                  trigger="click"
                  options={options}
                  onSelect={(key: string) => runRowAction(row, key as Api.Monitor.OnlineSessionActionType)}
                >
                  <NButton text type="primary" size="small">
                    更多
                  </NButton>
                </NDropdown>
              ) : null}
            </div>
          );
        }
      }
    ]
  });

onMounted(() => {
  loadStats();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-12px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <div class="text-16px font-medium">在线用户列表</div>
      <div class="mt-10px flex flex-wrap gap-10px">
        <div
          v-for="card in kpiCards"
          :key="card.key"
          class="min-w-110px cursor-pointer rounded-8px border border-#e5e7eb px-12px py-8px transition hover:shadow-sm"
          @click="card.key !== 'force' && handleKpiClick(card.tab)"
        >
          <div class="text-12px text-#6b7280">{{ card.label }}</div>
          <div class="text-20px font-semibold" :style="{ color: card.color }">{{ card.value }}</div>
        </div>
      </div>
    </NCard>

    <CollapsibleSearchCard>
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="用户账号"><NInput v-model:value="searchParams.userName" clearable class="w-120px" /></NFormItem>
        <NFormItem label="用户姓名"><NInput v-model:value="searchParams.nickName" clearable class="w-120px" /></NFormItem>
        <NFormItem label="账号类型"><NSelect v-model:value="searchParams.accountType" :options="ACCOUNT_TYPE_OPTIONS" clearable class="w-120px" /></NFormItem>
        <NFormItem label="所属部门"><NSelect v-model:value="searchParams.deptName" :options="DEPT_OPTIONS" clearable class="w-130px" /></NFormItem>
        <NFormItem label="所属仓库"><NSelect v-model:value="searchParams.warehouseName" :options="WAREHOUSE_OPTIONS" clearable class="w-130px" /></NFormItem>
        <NFormItem label="登录端口"><NSelect v-model:value="searchParams.loginPort" :options="LOGIN_PORT_OPTIONS" clearable class="w-100px" /></NFormItem>
        <NFormItem label="在线状态"><NSelect v-model:value="searchParams.onlineStatus" :options="ONLINE_STATUS_OPTIONS" clearable class="w-110px" /></NFormItem>
        <NFormItem label="IP地址"><NInput v-model:value="searchParams.ipaddr" clearable class="w-130px" /></NFormItem>
        <NFormItem label="设备类型"><NInput v-model:value="searchParams.deviceType" clearable class="w-100px" /></NFormItem>
        <NFormItem label="风险等级"><NSelect v-model:value="searchParams.riskLevel" :options="RISK_LEVEL_OPTIONS" clearable class="w-100px" /></NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
            <NButton @click="getData">刷新</NButton>
            <NButton v-if="hasAuth('monitor:online:export')" @click="handleExport">导出</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </CollapsibleSearchCard>

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper min-h-0 flex flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="mb-10px flex flex-shrink-0 flex-wrap items-center justify-between gap-8px">
        <div class="flex flex-wrap gap-6px">
          <NButton
            v-for="tab in tabItems"
            :key="tab.value"
            :type="activeTab === tab.value ? 'primary' : 'default'"
            size="small"
            @click="handleTabChange(tab.value)"
          >
            {{ tab.label }}
            <span class="ml-4px opacity-70">({{ tab.count }})</span>
          </NButton>
        </div>
        <NSpace size="small">
          <NButton
            v-if="hasAuth('monitor:online:forceLogout')"
            size="small"
            :disabled="!checkedRowKeys.length"
            @click="runBatchAction('FORCE_LOGOUT')"
          >
            批量强制下线
          </NButton>
          <NButton size="small" :disabled="!checkedRowKeys.length" @click="runBatchAction('LOCK_ACCOUNT')">批量锁定账号</NButton>
          <NButton size="small" :disabled="!checkedRowKeys.length" @click="runBatchAction('NOTIFY_USER')">批量通知</NButton>
          <TableColumnSetting v-model:columns="columnChecks" />
        </NSpace>
      </div>

      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        remote
        :row-key="row => row.tokenId"
        :pagination="mobilePagination"
        class="min-h-0 flex-1"
        :row-props="row => ({ style: selectedTokenId === row.tokenId ? 'background:#eff6ff' : '' })"
      />
    </NCard>

    <NDrawer v-model:show="detailVisible" :width="appStore.isMobile ? 360 : 760" display-directive="show" class="max-w-90%">
      <NDrawerContent title="用户会话详情" closable :native-scrollbar="false" @close="closeDetail">
        <OnlineSessionDetailPanel :token-id="selectedTokenId" @updated="onDetailUpdated" @close="closeDetail" />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
