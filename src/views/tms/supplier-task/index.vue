<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NGi, NGrid, NStatistic, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import {
  fetchGetSupplierTaskList,
  fetchGetSupplierTaskStatusCount,
  fetchGetSupplierTaskSummary
} from '@/service/api/tms/supplier-task';
import ContainerTaskDrawer from './modules/container-task-drawer.vue';
import {
  BOL_STATUS_LABEL,
  CHECKIN_STATUS_LABEL,
  GPS_STATUS_LABEL,
  GPS_STATUS_TAG,
  SUPPLIER_TASK_STATUS_LABEL,
  SUPPLIER_TASK_STATUS_TAG,
  SUPPLIER_TASK_TYPE_LABEL,
  SUPPLIER_TASK_TYPE_OPTIONS
} from './constants';

defineOptions({ name: 'TmsSupplierTask' });

const appStore = useAppStore();
const summary = ref<Api.Tms.SupplierTaskSummary>({
  todayTotal: 0,
  pendingAccept: 0,
  inProgress: 0,
  checkedIn: 0,
  exception: 0,
  pendingBol: 0,
  pendingPod: 0
});
const statusCount = ref<Api.Tms.SupplierTaskStatusCount>({ typeMap: {}, statusMap: {}, total: 0 });
const activeTaskType = ref('');

const searchParams = ref<Api.Tms.SupplierTaskSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  taskType: null,
  taskStatus: null,
  supplierName: null,
  exceptionFlag: null
});

const containerDrawerVisible = ref(false);
const containerSourceId = ref<CommonType.IdType | null>(null);
const containerDrawerTab = ref('info');

const kpiCards = computed(() => [
  { key: 'todayTotal', label: '今日任务', color: '#2563eb' },
  { key: 'pendingAccept', label: '待接单', color: '#f59e0b' },
  { key: 'inProgress', label: '进行中', color: '#0ea5e9' },
  { key: 'checkedIn', label: '已到仓', color: '#16a34a' },
  { key: 'exception', label: '异常中', color: '#ef4444' },
  { key: 'pendingBol', label: '待上传 BOL', color: '#8b5cf6' },
  { key: 'pendingPod', label: '待上传 POD', color: '#a855f7' }
]);

const typeTabs = computed(() => {
  const map = statusCount.value.typeMap || {};
  const total = statusCount.value.total || 0;
  return SUPPLIER_TASK_TYPE_OPTIONS.map(item => ({
    ...item,
    count: item.value ? map[item.value] || 0 : total
  }));
});

async function loadSummary() {
  const { data } = await fetchGetSupplierTaskSummary();
  if (data) summary.value = data;
}

async function loadStatusCount() {
  const { data } = await fetchGetSupplierTaskStatusCount({
    ...searchParams.value,
    taskType: null,
    taskStatus: null
  });
  statusCount.value = data || { typeMap: {}, statusMap: {}, total: 0 };
}

function openContainerDrawer(sourceId: CommonType.IdType, tab = 'info') {
  containerSourceId.value = sourceId;
  containerDrawerTab.value = tab;
  containerDrawerVisible.value = true;
}

function openTaskDetail(row: Api.Tms.SupplierTaskRow) {
  if (row.taskType === 'container_pickup' && row.sourceId) {
    openContainerDrawer(row.sourceId);
    return;
  }
  window.$message?.info(`[原型] 查看任务 ${row.taskNo}`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
  loadStatusCount();
}

function handleReset() {
  activeTaskType.value = '';
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    keyword: null,
    taskType: null,
    taskStatus: null,
    supplierName: null,
    exceptionFlag: null
  };
  getDataByPage();
  loadStatusCount();
}

function handleTypeChange(value: string) {
  activeTaskType.value = value;
  searchParams.value.taskType = (value || null) as Api.Tms.SupplierTaskSearchParams['taskType'];
  handleSearch();
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetSupplierTaskList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        key: 'taskNo',
        title: '任务号',
        width: 150,
        fixed: 'left',
        render: row => (
          <span class="cursor-pointer text-primary hover:underline" onClick={() => openTaskDetail(row)}>
            {row.taskNo}
          </span>
        )
      },
      {
        key: 'taskType',
        title: '任务类型',
        width: 110,
        render: row => (
          <NTag size="small" type="info">
            {SUPPLIER_TASK_TYPE_LABEL[row.taskType] || row.taskType}
          </NTag>
        )
      },
      { key: 'supplierName', title: '供应商', width: 150, ellipsis: { tooltip: true }, render: row => row.supplierName || '—' },
      { key: 'driverName', title: '司机', width: 90, render: row => row.driverName || '—' },
      { key: 'vehicleNo', title: '车牌号', width: 110, render: row => row.vehicleNo || '—' },
      {
        key: 'relatedRef',
        title: '柜号/车次/订单',
        width: 150,
        ellipsis: { tooltip: true },
        render: row => row.relatedContainerNo || row.relatedTripNo || row.relatedOrderNo || '—'
      },
      {
        key: 'taskStatus',
        title: '当前状态',
        width: 100,
        render: row => (
          <NTag size="small" type={SUPPLIER_TASK_STATUS_TAG[row.taskStatus] || 'default'}>
            {SUPPLIER_TASK_STATUS_LABEL[row.taskStatus] || row.taskStatus}
          </NTag>
        )
      },
      {
        key: 'gpsStatus',
        title: 'GPS',
        width: 88,
        render: row => (
          <NTag size="small" type={GPS_STATUS_TAG[row.gpsStatus] || 'default'}>
            {GPS_STATUS_LABEL[row.gpsStatus] || row.gpsStatus}
          </NTag>
        )
      },
      {
        key: 'checkinStatus',
        title: 'Check In',
        width: 100,
        render: row => CHECKIN_STATUS_LABEL[row.checkinStatus] || row.checkinStatus
      },
      {
        key: 'bolUploadStatus',
        title: 'BOL',
        width: 80,
        render: row => BOL_STATUS_LABEL[row.bolUploadStatus] || row.bolUploadStatus
      },
      {
        key: 'exceptionFlag',
        title: '异常',
        width: 72,
        align: 'center',
        render: row =>
          row.exceptionFlag ? (
            <NTag size="small" type="error">
              是
            </NTag>
          ) : (
            '—'
          )
      },
      { key: 'eta', title: 'ETA', width: 140, render: row => row.eta || '—' },
      {
        key: 'operate',
        title: '操作',
        width: 160,
        fixed: 'right',
        align: 'center',
        render: row => (
          <div class="flex justify-center gap-6px">
            <NButton size="small" secondary onClick={() => openTaskDetail(row)}>
              详情
            </NButton>
            {row.taskType === 'container_pickup' && row.sourceId ? (
              <NButton size="small" type="warning" secondary onClick={() => openContainerDrawer(row.sourceId!, 'fees')}>
                费用
              </NButton>
            ) : null}
          </div>
        )
      }
    ]
  });

onMounted(() => {
  loadSummary();
  loadStatusCount();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="mb-8px">
        <div class="text-16px font-medium">供应商执行任务中心</div>
        <div class="mt-4px text-12px text-#6b7280">
          统一查看派给供应商的执行任务，含海柜提柜、到仓装货、预约送仓等；海柜任务支持录入与费用管理
        </div>
      </div>
      <NGrid :cols="24" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
        <NGi v-for="card in kpiCards" :key="card.key" span="24 s:12 m:8 l:6 xl:3">
          <NStatistic :label="card.label" :value="summary[card.key as keyof Api.Tms.SupplierTaskSummary]">
            <template #prefix>
              <span class="inline-block h-8px w-8px rounded-full" :style="{ background: card.color }" />
            </template>
          </NStatistic>
        </NGi>
      </NGrid>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <NForm inline label-placement="left" :show-feedback="false">
            <NFormItem label="关键词">
              <NInput
                v-model:value="searchParams.keyword"
                clearable
                placeholder="任务号/供应商/司机/柜号/车次"
                class="w-220px"
              />
            </NFormItem>
            <NFormItem label="供应商">
              <NInput v-model:value="searchParams.supplierName" clearable placeholder="供应商名称" class="w-160px" />
            </NFormItem>
            <NFormItem label="仅异常">
              <NSwitch
                :value="searchParams.exceptionFlag === true"
                @update:value="v => { searchParams.exceptionFlag = v ? true : null; }"
              />
            </NFormItem>
            <NFormItem>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton class="ml-8px" @click="handleReset">重置</NButton>
            </NFormItem>
          </NForm>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard
      title="任务列表"
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="true"
          :loading="loading"
          :show-add="false"
          :show-delete="false"
          :show-export="false"
          @refresh="() => { getData(); loadSummary(); loadStatusCount(); }"
        />
      </template>

      <div class="flex min-h-0 flex-1 flex-col gap-12px overflow-hidden">
        <div class="flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
          <div
            v-for="tab in typeTabs"
            :key="tab.value"
            class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
            :class="activeTaskType === tab.value
              ? 'bg-primary text-white shadow-sm'
              : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'"
            @click="handleTypeChange(tab.value)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold leading-14px"
              :class="activeTaskType === tab.value
                ? 'bg-white/25 text-white'
                : tab.count > 0 ? 'bg-#ef4444 text-white' : 'bg-#d0d3d9 text-#909399'"
            >
              {{ tab.count }}
            </span>
          </div>
        </div>
        <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
          <DataTable
            :columns="columns"
            :data="data"
            :flex-height="!appStore.isMobile"
            :scroll-x="scrollX"
            :loading="loading"
            remote
            :row-key="(row: Api.Tms.SupplierTaskRow) => row.id"
            :pagination="mobilePagination"
            class="h-full min-h-280px sm:min-h-0"
          />
        </div>
      </div>
    </NCard>

    <ContainerTaskDrawer
      v-model:visible="containerDrawerVisible"
      :order-id="containerSourceId ?? undefined"
      :initial-tab="containerDrawerTab"
      @updated="() => { getData(); loadSummary(); loadStatusCount(); }"
    />
  </div>
</template>
