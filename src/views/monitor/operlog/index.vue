<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetOperLogList, fetchGetOperLogStats } from '@/service/api/monitor/oper-log';
import OperLogDetailPanel from './modules/oper-log-detail-panel.vue';
import {
  DEPT_OPTIONS,
  WAREHOUSE_OPTIONS,
  OPER_RESULT_LABEL,
  OPER_RESULT_TAG,
  RISK_LEVEL_LABEL,
  RISK_LEVEL_TAG,
  TAB_OPTIONS
} from './constants';

defineOptions({ name: 'OperLogList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const stats = ref<Api.Monitor.OperLogStats | null>(null);
const activeTab = ref<Api.Monitor.OperLogCategoryTab>('ALL');
const selectedId = ref<CommonType.IdType | null>(null);
const detailVisible = ref(false);
const dateRange = ref<[string, string] | null>(null);

const searchParams = ref<Api.Monitor.OperLogSearchParams>({
  pageNum: 1,
  pageSize: 10,
  operName: null,
  operNickName: null,
  deptName: null,
  warehouseName: null,
  tabKey: 'ALL',
  params: {}
});

const kpiCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { key: 'total', label: '今日操作', value: s.todayTotal, color: '#2563eb', tab: 'ALL' },
    { key: 'success', label: '成功操作', value: s.successCount, color: '#18a058', tab: 'ALL' },
    { key: 'failed', label: '失败操作', value: s.failedCount, color: '#d03050', tab: 'ABNORMAL' },
    { key: 'highRisk', label: '高风险操作', value: s.highRiskCount, color: '#dc2626', tab: 'ABNORMAL' },
    { key: 'dataChange', label: '数据变更', value: s.dataChangeCount, color: '#f0a020', tab: 'UPDATE' },
    { key: 'export', label: '导出/下载', value: s.exportCount, color: '#0284c7', tab: 'IMPORT_EXPORT' },
    { key: 'approve', label: '审批操作', value: s.approveCount, color: '#7c3aed', tab: 'APPROVE' },
    { key: 'abnormal', label: '异常操作', value: s.abnormalCount, color: '#d03050', tab: 'ABNORMAL' }
  ];
});

const tabItems = computed(() =>
  TAB_OPTIONS.map(tab => ({
    ...tab,
    count: stats.value?.tabCounts?.[tab.value] ?? 0
  }))
);

async function loadStats() {
  const { data } = await fetchGetOperLogStats();
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
    operName: null,
    operNickName: null,
    deptName: null,
    warehouseName: null,
    tabKey: 'ALL',
    params: {}
  };
  getDataByPage(1);
  loadStats();
}

function handleTabChange(val: string) {
  activeTab.value = val as Api.Monitor.OperLogCategoryTab;
  handleSearch();
}

function handleKpiClick(tab: string) {
  activeTab.value = tab as Api.Monitor.OperLogCategoryTab;
  handleSearch();
}

function selectRow(row: Api.Monitor.OperLog) {
  selectedId.value = row.operId;
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
  selectedId.value = null;
}

function handleExport() {
  download('/monitor/operlog/export', searchParams.value, `操作日志_${Date.now()}.xlsx`);
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetOperLogList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 10;
    },
    columns: () => [
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
      { key: 'operTime', title: '操作时间', width: 155 },
      { key: 'operName', title: '操作人', width: 100 },
      { key: 'operNickName', title: '姓名', width: 90 },
      { key: 'deptName', title: '所属部门', width: 110, ellipsis: { tooltip: true } },
      { key: 'warehouseName', title: '所属仓库', width: 110, ellipsis: { tooltip: true } },
      { key: 'operModule', title: '操作模块', width: 90 },
      { key: 'operPage', title: '操作页面', width: 110, ellipsis: { tooltip: true } },
      { key: 'operType', title: '操作类型', width: 100 },
      { key: 'operObject', title: '操作对象', width: 90 },
      { key: 'bizNo', title: '业务单号', width: 130, ellipsis: { tooltip: true } },
      { key: 'operContent', title: '操作内容', width: 180, ellipsis: { tooltip: true } },
      {
        key: 'operResult',
        title: '操作结果',
        width: 80,
        render: row => (
          <NTag size="small" type={OPER_RESULT_TAG[row.operResult || ''] || 'default'}>
            {OPER_RESULT_LABEL[row.operResult || ''] || row.operResult}
          </NTag>
        )
      },
      {
        key: 'riskLevel',
        title: '风险等级',
        width: 90,
        render: row => (
          <NTag size="small" type={RISK_LEVEL_TAG[row.riskLevel || ''] || 'default'}>
            {RISK_LEVEL_LABEL[row.riskLevel || ''] || row.riskLevel}
          </NTag>
        )
      },
      { key: 'operIp', title: 'IP地址', width: 120 },
      { key: 'deviceType', title: '设备类型', width: 80 },
      { key: 'costTime', title: '耗时(ms)', width: 80, align: 'right' },
      {
        key: 'operate',
        title: '操作',
        width: 80,
        fixed: 'right',
        render: row => (
          <NButton text type="primary" size="small" onClick={() => selectRow(row)}>
            查看
          </NButton>
        )
      }
    ]
  });

onMounted(() => loadStats());
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-12px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <div class="text-16px font-medium">操作日志</div>
      <div class="mt-10px flex flex-wrap gap-10px">
        <div
          v-for="card in kpiCards"
          :key="card.key"
          class="min-w-110px cursor-pointer rounded-8px border border-#e5e7eb px-12px py-8px transition hover:shadow-sm"
          @click="handleKpiClick(card.tab)"
        >
          <div class="text-12px text-#6b7280">{{ card.label }}</div>
          <div class="text-20px font-semibold" :style="{ color: card.color }">{{ card.value }}</div>
        </div>
      </div>
    </NCard>

    <CollapsibleSearchCard>
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="操作人账号"><NInput v-model:value="searchParams.operName" clearable class="w-120px" /></NFormItem>
        <NFormItem label="操作人姓名"><NInput v-model:value="searchParams.operNickName" clearable class="w-120px" /></NFormItem>
        <NFormItem label="所属部门"><NSelect v-model:value="searchParams.deptName" :options="DEPT_OPTIONS" clearable class="w-130px" /></NFormItem>
        <NFormItem label="所属仓库"><NSelect v-model:value="searchParams.warehouseName" :options="WAREHOUSE_OPTIONS" clearable class="w-130px" /></NFormItem>
        <NFormItem label="时间范围">
          <NDatePicker v-model:formatted-value="dateRange" type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss" clearable class="w-340px" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
            <NButton v-if="hasAuth('monitor:operlog:export')" @click="handleExport">导出</NButton>
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
        <TableColumnSetting v-model:columns="columnChecks" />
      </div>

      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        remote
        :row-key="row => row.operId"
        :pagination="mobilePagination"
        class="min-h-0 flex-1"
        :row-props="row => ({ style: selectedId === row.operId ? 'background:#eff6ff' : '' })"
      />
    </NCard>

    <NDrawer v-model:show="detailVisible" :width="appStore.isMobile ? 360 : 800" display-directive="show" class="max-w-90%">
      <NDrawerContent title="操作日志详情" closable :native-scrollbar="false" @close="closeDetail">
        <OperLogDetailPanel :oper-id="selectedId" @close="closeDetail" />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
