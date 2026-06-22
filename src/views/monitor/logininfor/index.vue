<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchBatchDeleteLoginInfor,
  fetchCleanLoginInfor,
  fetchExecuteLoginLogAction,
  fetchGetLoginInforList,
  fetchGetLoginLogStats
} from '@/service/api/monitor/login-infor';
import LoginLogDetailPanel from './modules/login-log-detail-panel.vue';
import {
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPE_OPTIONS,
  FAIL_REASON_LABEL,
  LOGIN_METHOD_LABEL,
  LOGIN_PORT_LABEL,
  LOGIN_STATUS_LABEL,
  LOGIN_STATUS_TAG,
  RISK_LEVEL_COLOR,
  RISK_LEVEL_LABEL,
  TAB_OPTIONS,
  WAREHOUSE_OPTIONS
} from './constants';

defineOptions({ name: 'LoginInforList' });

const appStore = useAppStore();
const { download } = useDownload();
const { hasAuth } = useAuth();

const stats = ref<Api.Monitor.LoginLogStats | null>(null);
const activeTab = ref<Api.Monitor.LoginLogTab>('ALL');
const selectedId = ref<CommonType.IdType | null>(null);
const detailVisible = ref(false);
const checkedRowKeys = ref<CommonType.IdType[]>([]);
const dateRange = ref<[string, string] | null>(null);

const searchParams = ref<Api.Monitor.LoginInforSearchParams>({
  pageNum: 1,
  pageSize: 10,
  userName: null,
  nickName: null,
  warehouseName: null,
  accountType: null,
  tabKey: 'ALL',
  params: {}
});

const kpiCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { key: 'todayLogin', label: '今日登录', value: s.todayLogin, color: '#2563eb', tab: 'ALL' },
    { key: 'success', label: '登录成功', value: s.success, color: '#18a058', tab: 'SUCCESS' },
    { key: 'failed', label: '登录失败', value: s.failed, color: '#d03050', tab: 'FAILED' },
    { key: 'abnormal', label: '异常登录', value: s.abnormal, color: '#f0a020', tab: 'ABNORMAL' },
    { key: 'locked', label: '锁定账号', value: s.locked, color: '#7c3aed', tab: 'LOCKED' },
    { key: 'onlineUsers', label: '在线用户', value: s.onlineUsers, color: '#0284c7', tab: 'ONLINE' }
  ];
});

const tabItems = computed(() =>
  TAB_OPTIONS.map(tab => ({
    ...tab,
    count: stats.value?.tabCounts?.[tab.value] ?? 0
  }))
);

async function loadStats() {
  const { data } = await fetchGetLoginLogStats();
  stats.value = data || null;
}

function syncTab() {
  searchParams.value.tabKey = activeTab.value;
}

function handleSearch() {
  syncTab();
  if (dateRange.value?.length === 2) {
    searchParams.value.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] };
  } else {
    searchParams.value.params = {};
  }
  searchParams.value.pageNum = 1;
  getDataByPage(1);
  loadStats();
}

function handleReset() {
  activeTab.value = 'ALL';
  dateRange.value = null;
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    userName: null,
    nickName: null,
    warehouseName: null,
    accountType: null,
    tabKey: 'ALL',
    params: {}
  };
  getDataByPage(1);
  loadStats();
}

function handleTabChange(val: string) {
  activeTab.value = val as Api.Monitor.LoginLogTab;
  handleSearch();
}

function handleKpiClick(tab: string) {
  activeTab.value = tab as Api.Monitor.LoginLogTab;
  handleSearch();
}

function selectRow(row: Api.Monitor.LoginInfor) {
  selectedId.value = row.infoId;
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
  selectedId.value = null;
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetLoginInforList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 10;
    },
    columns: () => [
      { type: 'selection', width: 48 },
      {
        key: 'logNo',
        title: '日志编号',
        width: 100,
        fixed: 'left',
        render: row => (
          <span class="cursor-pointer text-primary hover:underline" onClick={() => selectRow(row)}>
            {row.logNo}
          </span>
        )
      },
      { key: 'userName', title: '用户账号', width: 110 },
      { key: 'nickName', title: '用户姓名', width: 100, render: row => row.nickName || '—' },
      {
        key: 'accountType',
        title: '账号类型',
        width: 100,
        render: row => ACCOUNT_TYPE_LABEL[row.accountType || ''] || row.accountType || '—'
      },
      { key: 'deptName', title: '所属部门', width: 110, ellipsis: { tooltip: true } },
      { key: 'warehouseName', title: '所属仓库', width: 110, ellipsis: { tooltip: true } },
      {
        key: 'loginPort',
        title: '登录端口',
        width: 80,
        render: row => LOGIN_PORT_LABEL[row.loginPort || ''] || row.loginPort || '—'
      },
      {
        key: 'loginMethod',
        title: '登录方式',
        width: 100,
        render: row => LOGIN_METHOD_LABEL[row.loginMethod || ''] || row.loginMethod || '—'
      },
      { key: 'ipaddr', title: 'IP地址', width: 120 },
      { key: 'loginLocation', title: '登录地点', width: 110, ellipsis: { tooltip: true } },
      { key: 'deviceType', title: '设备类型', width: 90 },
      { key: 'loginTime', title: '登录时间', width: 155 },
      { key: 'logoutTime', title: '退出时间', width: 155, render: row => row.logoutTime || '—' },
      { key: 'onlineDuration', title: '在线时长', width: 90, render: row => row.onlineDuration || '—' },
      {
        key: 'loginStatus',
        title: '登录状态',
        width: 90,
        render: row => (
          <NTag size="small" type={LOGIN_STATUS_TAG[row.loginStatus] || 'default'}>
            {LOGIN_STATUS_LABEL[row.loginStatus] || row.loginStatus}
          </NTag>
        )
      },
      {
        key: 'failReason',
        title: '失败原因',
        width: 110,
        render: row =>
          row.failReason ? FAIL_REASON_LABEL[row.failReason] || row.failReason : '—'
      },
      {
        key: 'riskLevel',
        title: '风险等级',
        width: 90,
        render: row => (
          <span style={{ color: RISK_LEVEL_COLOR[row.riskLevel] || '#64748b', fontWeight: 500 }}>
            {RISK_LEVEL_LABEL[row.riskLevel] || row.riskLevel}
          </span>
        )
      },
      {
        key: 'operate',
        title: '操作',
        width: 120,
        fixed: 'right',
        render: row => {
          const options = [
            { label: '强制退出', key: 'FORCE_LOGOUT', disabled: !row.onlineFlag && row.loginStatus !== 'ONLINE' },
            { label: '锁定账号', key: 'LOCK_ACCOUNT', disabled: row.loginStatus === 'LOCKED' },
            { label: '解锁账号', key: 'UNLOCK_ACCOUNT', disabled: row.loginStatus !== 'LOCKED' },
            { label: '加入黑名单IP', key: 'BLACKLIST_IP' },
            { label: '加入白名单IP', key: 'WHITELIST_IP' },
            { label: '标记正常', key: 'MARK_NORMAL', disabled: !row.abnormalFlag && row.loginStatus !== 'ABNORMAL' }
          ];
          return (
            <div class="flex items-center gap-6px">
              <NButton text type="primary" size="small" onClick={() => selectRow(row)}>
                查看
              </NButton>
              <NDropdown
                trigger="click"
                options={options}
                onSelect={(key: string) => runRowAction(row, key as Api.Monitor.LoginLogActionType)}
              >
                <NButton text type="primary" size="small">
                  更多
                </NButton>
              </NDropdown>
            </div>
          );
        }
      }
    ]
  });

async function runRowAction(row: Api.Monitor.LoginInfor, action: Api.Monitor.LoginLogActionType) {
  const { error } = await fetchExecuteLoginLogAction({ infoIds: [row.infoId], action });
  if (error) return;
  window.$message?.success('操作成功');
  if (selectedId.value === row.infoId) selectedId.value = row.infoId;
  await getData();
  await loadStats();
}

async function runBatchAction(action: Api.Monitor.LoginLogActionType) {
  if (!checkedRowKeys.value.length) {
    window.$message?.warning('请先选择记录');
    return;
  }
  const { error } = await fetchExecuteLoginLogAction({ infoIds: checkedRowKeys.value, action });
  if (error) return;
  window.$message?.success('批量操作成功');
  checkedRowKeys.value = [];
  await getData();
  await loadStats();
}

function handleExport() {
  download('/monitor/logininfor/export', searchParams.value, `登录日志_${Date.now()}.xlsx`);
}

async function handleBatchDelete() {
  if (!checkedRowKeys.value.length) return;
  const { error } = await fetchBatchDeleteLoginInfor(checkedRowKeys.value);
  if (error) return;
  checkedRowKeys.value = [];
  window.$message?.success('删除成功');
  await getData();
  await loadStats();
}

async function handleClean() {
  window.$dialog?.error({
    title: '提示',
    content: '是否确认清空所有登录日志数据项?',
    positiveText: '确认清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchCleanLoginInfor();
      if (error) return;
      window.$message?.success('清空成功');
      selectedId.value = null;
      await getData();
      await loadStats();
    }
  });
}

function onDetailUpdated() {
  getData();
  loadStats();
}

onMounted(() => {
  loadStats();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-12px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <div class="text-16px font-medium">登录日志</div>
      <div class="mt-10px flex flex-wrap gap-10px">
        <div
          v-for="card in kpiCards"
          :key="card.key"
          class="min-w-120px cursor-pointer rounded-8px border border-#e5e7eb px-14px py-10px transition hover:shadow-sm"
          @click="handleKpiClick(card.tab)"
        >
          <div class="text-12px text-#6b7280">{{ card.label }}</div>
          <div class="text-22px font-semibold" :style="{ color: card.color }">{{ card.value }}</div>
        </div>
      </div>
    </NCard>

    <CollapsibleSearchCard>
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="用户账号">
          <NInput v-model:value="searchParams.userName" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="用户姓名">
          <NInput v-model:value="searchParams.nickName" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="所属仓库">
          <NSelect v-model:value="searchParams.warehouseName" :options="WAREHOUSE_OPTIONS" clearable class="w-130px" />
        </NFormItem>
        <NFormItem label="账号类型">
          <NSelect v-model:value="searchParams.accountType" :options="ACCOUNT_TYPE_OPTIONS" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="时间范围">
          <NDatePicker
            v-model:formatted-value="dateRange"
            type="datetimerange"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            class="w-340px"
          />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
            <NButton v-if="hasAuth('monitor:logininfor:export')" @click="handleExport">导出</NButton>
            <NButton @click="getData">刷新</NButton>
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
            <NButton size="small" :disabled="!checkedRowKeys.length" @click="runBatchAction('LOCK_ACCOUNT')">批量锁定</NButton>
            <NButton size="small" :disabled="!checkedRowKeys.length" @click="runBatchAction('FORCE_LOGOUT')">批量强制退出</NButton>
            <NButton size="small" :disabled="!checkedRowKeys.length" @click="runBatchAction('BLACKLIST_IP')">批量黑名单IP</NButton>
            <NButton v-if="hasAuth('monitor:logininfor:export')" size="small" :disabled="!checkedRowKeys.length" @click="handleExport">
              批量导出
            </NButton>
            <TableColumnSetting v-model:columns="columnChecks" />
            <NButton
              v-if="hasAuth('monitor:logininfor:remove')"
              size="small"
              type="error"
              ghost
              :disabled="!checkedRowKeys.length"
              @click="handleBatchDelete"
            >
              删除
            </NButton>
            <NButton v-if="hasAuth('monitor:logininfor:remove')" size="small" type="error" ghost @click="handleClean">清空</NButton>
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
          :row-key="row => row.infoId"
          :pagination="mobilePagination"
          class="min-h-0 flex-1"
          :row-props="row => ({ style: selectedId === row.infoId ? 'background:#eff6ff' : '' })"
        />
    </NCard>

    <NDrawer v-model:show="detailVisible" :width="appStore.isMobile ? 360 : 800" display-directive="show" class="max-w-90%">
      <NDrawerContent title="登录日志详情" closable :native-scrollbar="false" @close="closeDetail">
        <LoginLogDetailPanel :info-id="selectedId" @updated="onDetailUpdated" @close="closeDetail" />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
