<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchGetTransferInstructionList,
  fetchGetTransferOrderGroupList,
  fetchGetTransferWorkbenchStats
} from '@/service/api/wms/transfer-workbench';
import CreateInstructionModal from './modules/create-instruction-modal.vue';
import InstructionDetailPanel from './modules/instruction-detail-panel.vue';
import {
  DEPT_OPTIONS,
  formatRemainingMinutes,
  INSTRUCTION_CATEGORY_OPTIONS,
  INSTRUCTION_CATEGORY_LABEL,
  OPERATION_TYPE_LABEL,
  RISK_COLOR,
  STATUS_LABEL,
  STATUS_OPTIONS,
  STATUS_TAG
} from './constants';

defineOptions({ name: 'WmsTransferWorkbench' });

const appStore = useAppStore();
const viewMode = ref<'INSTRUCTION' | 'ORDER'>('INSTRUCTION');
const activeCategory = ref('ALL');
const stats = ref<Api.Wms.TransferWorkbenchStats | null>(null);
const selectedId = ref<CommonType.IdType | null>(null);
const createVisible = ref(false);
const mobileDetailVisible = ref(false);

const searchParams = ref<Api.Wms.TransferInstructionSearchParams>({
  pageNum: 1,
  pageSize: 10,
  orderNo: null,
  instructionNo: null,
  customerName: null,
  platform: null,
  destination: null,
  category: null,
  cargoNo: null,
  status: null,
  deptName: null,
  assigneeName: null,
  overdueOnly: false
});

const platformOptions = [
  { label: 'Amazon', value: 'Amazon' },
  { label: 'Walmart', value: 'Walmart' },
  { label: 'SHEIN', value: 'SHEIN' },
  { label: 'FedEx', value: 'FedEx' },
  { label: 'UPS', value: 'UPS' }
];

const kpiCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { key: 'total', label: '全部指令', value: s.total, color: '#2563eb' },
    { key: 'pending', label: '待执行', value: s.pending, color: '#64748b' },
    { key: 'inProgress', label: '执行中', value: s.inProgress, color: '#0284c7' },
    { key: 'pendingReview', label: '待复核', value: s.pendingReview, color: '#f0a020' },
    { key: 'overdue', label: '超时指令', value: s.overdue, color: '#d03050' },
    { key: 'exception', label: '异常指令', value: s.exception, color: '#dc2626' },
    { key: 'completedToday', label: '今日完成', value: s.completedToday, color: '#18a058' },
    { key: 'holdCargo', label: '暂扣货物', value: s.holdCargo, color: '#7c3aed' }
  ];
});

const categoryTabs = computed(() =>
  INSTRUCTION_CATEGORY_OPTIONS.map(tab => ({
    ...tab,
    count:
      tab.value === 'ALL'
        ? stats.value?.total || 0
        : tab.value === 'COMPLETED'
          ? stats.value?.completedToday || 0
          : stats.value?.categoryCounts?.[tab.value] || 0
  }))
);

function syncCategory() {
  searchParams.value.category = activeCategory.value === 'ALL' ? null : activeCategory.value;
}

async function loadStats() {
  const { data } = await fetchGetTransferWorkbenchStats();
  stats.value = data || null;
}

function handleSearch() {
  syncCategory();
  searchParams.value.pageNum = 1;
  refreshList();
  loadStats();
}

function handleReset() {
  activeCategory.value = 'ALL';
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    orderNo: null,
    instructionNo: null,
    customerName: null,
    platform: null,
    destination: null,
    category: null,
    cargoNo: null,
    status: null,
    deptName: null,
    assigneeName: null,
    overdueOnly: false
  };
  refreshList();
  loadStats();
}

function handleCategoryChange(val: string) {
  activeCategory.value = val;
  handleSearch();
}

function selectInstruction(row: Api.Wms.TransferInstruction) {
  selectedId.value = row.id;
  if (appStore.isMobile) mobileDetailVisible.value = true;
}

const {
  columns: instructionColumns,
  data: instructionData,
  getData: getInstructionData,
  getDataByPage: getInstructionDataByPage,
  loading: instructionLoading,
  mobilePagination: instructionPagination,
  scrollX: instructionScrollX
} = useNaivePaginatedTable({
  api: () => fetchGetTransferInstructionList(searchParams.value),
  transform: response => defaultTransform(response),
  immediate: false,
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page ?? 1;
    searchParams.value.pageSize = params.pageSize ?? 10;
  },
  columns: () => [
    {
      key: 'instructionNo',
      title: '指令号',
      width: 140,
      fixed: 'left',
      render: row => (
        <span class="cursor-pointer text-primary hover:underline" onClick={() => selectInstruction(row)}>
          {row.instructionNo}
        </span>
      )
    },
    { key: 'orderNo', title: '订单号', width: 140 },
    {
      key: 'category',
      title: '指令类型',
      width: 100,
      render: row => INSTRUCTION_CATEGORY_LABEL[row.category] || row.category
    },
    { key: 'customerName', title: '客户', width: 120, ellipsis: { tooltip: true } },
    { key: 'platform', title: '平台', width: 90 },
    { key: 'destination', title: '目的地', width: 90 },
    { key: 'cargoQty', title: '货物数量', width: 80, align: 'right' },
    { key: 'currentLocation', title: '当前库位', width: 100 },
    { key: 'targetLocation', title: '目标位置', width: 100, render: row => row.targetLocation || '—' },
    { key: 'operationRequirement', title: '操作要求', width: 160, ellipsis: { tooltip: true } },
    { key: 'deptName', title: '责任部门', width: 100 },
    { key: 'assigneeName', title: '指派人员', width: 90, render: row => row.assigneeName || '—' },
    { key: 'deadline', title: '最晚完成', width: 150 },
    {
      key: 'remainingMinutes',
      title: '剩余时间',
      width: 110,
      render: row => (
        <span style={{ color: RISK_COLOR[row.riskLevel] || '#333' }}>
          {formatRemainingMinutes(row.remainingMinutes)}
        </span>
      )
    },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: row => (
        <NTag type={STATUS_TAG[row.status] || 'default'} size="small">
          {STATUS_LABEL[row.status] || row.status}
        </NTag>
      )
    },
    {
      key: 'priority',
      title: '优先级',
      width: 80,
      render: row => (
        <NTag type={row.priority === 'URGENT' ? 'error' : row.priority === 'HIGH' ? 'warning' : 'default'} size="small">
          {row.priority}
        </NTag>
      )
    },
    {
      key: 'operate',
      title: '操作',
      width: 70,
      fixed: 'right',
      render: row => (
        <NButton size="small" secondary onClick={() => selectInstruction(row)}>
          查看
        </NButton>
      )
    }
  ]
});

const {
  columns: orderColumns,
  data: orderData,
  getData: getOrderData,
  getDataByPage: getOrderDataByPage,
  loading: orderLoading,
  mobilePagination: orderPagination,
  scrollX: orderScrollX
} = useNaivePaginatedTable({
  api: () => fetchGetTransferOrderGroupList(searchParams.value),
  transform: response => defaultTransform(response),
  immediate: false,
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page ?? 1;
    searchParams.value.pageSize = params.pageSize ?? 10;
  },
  columns: () => [
    { type: 'expand', renderExpand: (row: Api.Wms.TransferOrderGroup) => (
      <NDataTable
        size="small"
        columns={[
          { title: '指令号', key: 'instructionNo', width: 130 },
          { title: '类型', key: 'category', render: (r: Api.Wms.TransferInstruction) => INSTRUCTION_CATEGORY_LABEL[r.category] },
          { title: '操作', key: 'operationType', render: (r: Api.Wms.TransferInstruction) => OPERATION_TYPE_LABEL[r.operationType] || r.operationType },
          { title: '状态', key: 'status', render: (r: Api.Wms.TransferInstruction) => STATUS_LABEL[r.status] },
          { title: '剩余', key: 'remainingMinutes', render: (r: Api.Wms.TransferInstruction) => formatRemainingMinutes(r.remainingMinutes) },
          {
            title: '',
            key: 'act',
            render: (r: Api.Wms.TransferInstruction) => (
              <NButton text type="primary" size="small" onClick={() => selectInstruction(r)}>查看</NButton>
            )
          }
        ]}
        data={row.instructions}
        pagination={false}
      />
    ) },
    { key: 'orderNo', title: '订单号', width: 140, fixed: 'left' },
    { key: 'customerName', title: '客户', width: 120 },
    { key: 'platform', title: '平台', width: 90 },
    { key: 'destination', title: '目的地', width: 90 },
    { key: 'orderStatus', title: '订单状态', width: 100 },
    { key: 'instructionCount', title: '指令数', width: 70, align: 'right' },
    { key: 'pendingCount', title: '待处理', width: 70, align: 'right' },
    {
      key: 'holdFlag',
      title: '暂扣',
      width: 70,
      render: row => row.holdFlag ? <NTag type="warning" size="small">是</NTag> : '—'
    }
  ]
});

function switchViewMode(mode: 'INSTRUCTION' | 'ORDER') {
  viewMode.value = mode;
  searchParams.value.pageNum = 1;
  refreshList();
}

function refreshList() {
  syncCategory();
  if (viewMode.value === 'ORDER') getOrderDataByPage();
  else getInstructionDataByPage();
}

onMounted(() => {
  loadStats();
  getInstructionData();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-12px overflow-hidden">
    <!-- KPI -->
    <NGrid :cols="8" :x-gap="10" responsive="screen" item-responsive>
      <NGi v-for="card in kpiCards" :key="card.key" span="8 m:4 l:3 xl:1">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <div class="text-12px text-#6b7280">{{ card.label }}</div>
          <div class="mt-4px text-22px font-semibold" :style="{ color: card.color }">{{ card.value }}</div>
        </NCard>
      </NGi>
    </NGrid>

    <!-- 筛选 -->
    <CollapsibleSearchCard>
      <div class="mb-10px flex flex-wrap items-center justify-between gap-8px">
        <NSpace>
          <NButtonGroup>
            <NButton :type="viewMode === 'INSTRUCTION' ? 'primary' : 'default'" @click="switchViewMode('INSTRUCTION')">按指令查看</NButton>
            <NButton :type="viewMode === 'ORDER' ? 'primary' : 'default'" @click="switchViewMode('ORDER')">按订单查看</NButton>
          </NButtonGroup>
          <NButton type="primary" @click="createVisible = true">创建指令</NButton>
        </NSpace>
      </div>
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="订单号"><NInput v-model:value="searchParams.orderNo" clearable class="w-140px" /></NFormItem>
        <NFormItem label="指令号"><NInput v-model:value="searchParams.instructionNo" clearable class="w-140px" /></NFormItem>
        <NFormItem label="客户"><NInput v-model:value="searchParams.customerName" clearable class="w-120px" /></NFormItem>
        <NFormItem label="平台"><NSelect v-model:value="searchParams.platform" :options="platformOptions" clearable class="w-110px" /></NFormItem>
        <NFormItem label="目的地"><NInput v-model:value="searchParams.destination" clearable class="w-100px" /></NFormItem>
        <NFormItem label="货物编号"><NInput v-model:value="searchParams.cargoNo" clearable class="w-120px" /></NFormItem>
        <NFormItem label="状态"><NSelect v-model:value="searchParams.status" :options="STATUS_OPTIONS" clearable class="w-110px" /></NFormItem>
        <NFormItem label="责任部门"><NSelect v-model:value="searchParams.deptName" :options="DEPT_OPTIONS" clearable class="w-120px" /></NFormItem>
        <NFormItem label="指派人员"><NInput v-model:value="searchParams.assigneeName" clearable class="w-100px" /></NFormItem>
        <NFormItem label="超时">
          <NCheckbox v-model:checked="searchParams.overdueOnly">仅超时</NCheckbox>
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </CollapsibleSearchCard>

    <!-- 主区域 -->
    <div class="min-h-0 flex flex-1 gap-0 overflow-hidden">
      <NCard
        :bordered="false"
        size="small"
        class="card-wrapper min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden"
        content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div class="mb-10px flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
          <div
            v-for="tab in categoryTabs"
            :key="tab.value"
            class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
            :class="activeCategory === tab.value ? 'bg-primary text-white shadow-sm' : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'"
            @click="handleCategoryChange(tab.value)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold"
              :class="activeCategory === tab.value ? 'bg-white/25 text-white' : 'bg-#d0d3d9 text-#909399'"
            >{{ tab.count }}</span>
          </div>
        </div>

        <div class="min-h-0 flex flex-1 flex-col overflow-hidden">
          <DataTable
            v-if="viewMode === 'INSTRUCTION'"
            :columns="instructionColumns"
            :data="instructionData"
            :flex-height="!appStore.isMobile"
            :scroll-x="instructionScrollX"
            :loading="instructionLoading"
            remote
            :row-key="(row: Api.Wms.TransferInstruction) => row.id"
            :pagination="instructionPagination"
            :row-props="(row: Api.Wms.TransferInstruction) => ({ style: selectedId === row.id ? 'background:#eff6ff' : '', onClick: () => selectInstruction(row) })"
            class="h-full min-h-240px"
          />
          <DataTable
            v-else
            :columns="orderColumns"
            :data="orderData"
            :flex-height="!appStore.isMobile"
            :scroll-x="orderScrollX"
            :loading="orderLoading"
            remote
            :row-key="(row: Api.Wms.TransferOrderGroup) => row.orderNo"
            :pagination="orderPagination"
            class="h-full min-h-240px"
          />
        </div>
      </NCard>

      <div v-if="selectedId" class="h-full w-420px flex-shrink-0 overflow-hidden lt-xl:hidden">
        <InstructionDetailPanel
          :instruction-id="selectedId"
          @updated="() => { refreshList(); loadStats(); }"
          @close="selectedId = null"
        />
      </div>
    </div>

    <NDrawer v-model:show="mobileDetailVisible" :width="420" display-directive="show">
      <NDrawerContent title="指令详情" closable :native-scrollbar="false">
        <InstructionDetailPanel
          :instruction-id="selectedId"
          @updated="() => { refreshList(); loadStats(); }"
          @close="mobileDetailVisible = false"
        />
      </NDrawerContent>
    </NDrawer>

    <CreateInstructionModal v-model:visible="createVisible" @created="() => { refreshList(); loadStats(); }" />
  </div>
</template>

<style scoped>
:deep(.n-data-table-tr.bg-#eff6ff td) {
  background-color: #eff6ff !important;
}
</style>
