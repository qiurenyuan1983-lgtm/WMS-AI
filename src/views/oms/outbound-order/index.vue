<script setup lang="tsx">
import { computed, onActivated, onMounted, ref } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import {
  fetchCompleteOutboundOrder,
  fetchConfirmAppointment,
  fetchConfirmOutbounded,
  fetchConfirmSigned,
  fetchDeleteOutboundOrder,
  fetchGetOutboundOrderList,
  fetchGetOutboundOrderStatusCount
} from '@/service/api/oms/outbound-order';
import OmsListPage from '../components/oms-list-page.vue';
import OutboundOrderDetailModal from './modules/outbound-order-detail-modal.vue';

defineOptions({ name: 'OmsOutboundOrder' });

const appStore = useAppStore();

const STATUS_META: Record<string, { label: string; type: NaiveUI.ThemeColor }> = {
  CREATED: { label: '已创建', type: 'default' },
  APPOINTMENT_CONFIRMED: { label: '已确认预约', type: 'info' },
  OUTBOUNDED: { label: '已出库', type: 'warning' },
  ARRIVED: { label: '已到达', type: 'info' },
  SIGNED: { label: '已签收', type: 'info' },
  POD_UPLOADED: { label: 'POD已上传', type: 'success' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'default' }
};

const DIRECTION_OPTIONS = [
  { label: '派送', value: 'DELIVERY' },
  { label: '调拨', value: 'TRANSFER' }
];

const DIRECTION_META: Record<string, string> = {
  DELIVERY: '派送',
  TRANSFER: '调拨'
};

const DELETABLE = new Set(['CREATED', 'APPOINTMENT_CONFIRMED']);
const SIGNABLE = new Set(['OUTBOUNDED', 'ARRIVED']);

const searchCollapsed = ref(false);
const advancedVisible = ref(false);
const activeStatus = ref('');
const statusCountMap = ref<Record<string, number>>({});
const searchParams = ref<Api.Oms.OutboundOrderSearchParams>({ pageNum: 1, pageSize: 10, keywordField: 'outboundOrderNo' });
const keywordField = ref('outboundOrderNo');
const keywordValue = ref<string | null>(null);
const detailVisible = ref(false);
const currentRow = ref<Api.Oms.OutboundOrder | null>(null);
const detailInitTab = ref<'basic' | 'cargo' | 'files'>('basic');

const keywordFieldOptions = [
  { label: '出库单号', value: 'outboundOrderNo' },
  { label: '预出单号', value: 'preOutboundNo' },
  { label: '运单号', value: 'cargoOrderNo' },
  { label: '柜号', value: 'containerNo' },
  { label: '货件编码', value: 'shipmentCodes' }
];

const statusTabs = computed(() => {
  const total = Object.values(statusCountMap.value).reduce((sum, item) => sum + item, 0);
  return [
    { label: '全部', value: '', count: total },
    ...Object.entries(STATUS_META).map(([value, meta]) => ({ label: meta.label, value, count: statusCountMap.value[value] || 0 }))
  ];
});

type AdvancedField = keyof Api.Oms.OutboundOrderSearchParams;
type AdvancedFilter = { id: number; field: AdvancedField | null; value: string | null };

const advancedFilters = ref<AdvancedFilter[]>([]);
const advancedFieldOptions: { label: string; value: AdvancedField; component?: 'select'; options?: CommonType.Option[] }[] = [
  { label: '出库单号', value: 'outboundOrderNo' },
  { label: '预出单号', value: 'preOutboundNo' },
  { label: '运单号', value: 'cargoOrderNo' },
  { label: '柜号', value: 'containerNo' },
  { label: '货件编码', value: 'shipmentCodes' },
  { label: '客户', value: 'customerName' },
  { label: '出库仓库', value: 'outboundWarehouseName' },
  { label: '状态', value: 'outboundStatus', component: 'select', options: Object.entries(STATUS_META).map(([value, meta]) => ({ label: meta.label, value })) },
  { label: '方向', value: 'outboundDirection', component: 'select', options: DIRECTION_OPTIONS },
  { label: '预约状态', value: 'appointmentStatus', component: 'select', options: [{ label: '未预约', value: 'NONE' }, { label: '已预约', value: 'APPOINTED' }, { label: '已取消', value: 'CANCELLED' }] },
  { label: 'POD状态', value: 'podStatus', component: 'select', options: [{ label: '待回传', value: 'PENDING' }, { label: '已上传', value: 'UPLOADED' }, { label: '异常', value: 'EXCEPTION' }] }
];

const activeAdvancedCount = computed(() =>
  advancedFilters.value.filter(item => item.field && item.value !== null && item.value !== '').length
);

function openDetail(row: Api.Oms.OutboundOrder, tab: 'basic' | 'cargo' | 'files' = 'basic') {
  currentRow.value = row;
  detailInitTab.value = tab;
  detailVisible.value = true;
}

function syncKeywordSearch() {
  const value = keywordValue.value?.trim() || null;
  searchParams.value.keywordField = keywordField.value;
  searchParams.value.keyword = value;
  keywordFieldOptions.forEach(item => {
    (searchParams.value as Record<string, unknown>)[item.value] = item.value === keywordField.value ? value : undefined;
  });
}

function applyAdvancedFilters() {
  advancedFieldOptions.forEach(item => {
    if (!keywordFieldOptions.some(k => k.value === item.value)) {
      (searchParams.value as Record<string, unknown>)[item.value] = undefined;
    }
  });
  advancedFilters.value.forEach(item => {
    if (item.field && item.value !== null && item.value !== '') {
      (searchParams.value as Record<string, unknown>)[item.field] = item.value;
    }
  });
}

function addAdvancedFilter() {
  advancedFilters.value.push({ id: Date.now(), field: null, value: null });
}

function removeAdvancedFilter(id: number) {
  advancedFilters.value = advancedFilters.value.filter(item => item.id !== id);
}

async function loadStatusCount() {
  const { data: counts } = await fetchGetOutboundOrderStatusCount(searchParams.value);
  if (counts) statusCountMap.value = counts;
}

function getMoreOptions(row: Api.Oms.OutboundOrder) {
  return [
    { label: '详情', key: 'detail' },
    { label: '确认预约', key: 'confirm-appt', disabled: row.outboundStatus !== 'CREATED' || !row.appointmentTime },
    { label: '确认出库', key: 'confirm-outbounded', disabled: !['CREATED', 'APPOINTMENT_CONFIRMED'].includes(row.outboundStatus) },
    { label: '确认签收', key: 'confirm-signed', disabled: !SIGNABLE.has(row.outboundStatus) },
    { label: '上传POD', key: 'upload-pod' },
    { type: 'divider', key: 'div1' },
    { label: '删除', key: 'delete', disabled: !DELETABLE.has(row.outboundStatus) }
  ];
}

async function handleMore(key: string, row: Api.Oms.OutboundOrder) {
  if (key === 'detail') {
    openDetail(row);
  } else if (key === 'confirm-appt') {
    const { error } = await fetchConfirmAppointment(row.id);
    if (!error) window.$message?.success('预约已确认');
  } else if (key === 'confirm-signed') {
    const { error } = await fetchConfirmSigned(row.id);
    if (!error) window.$message?.success('签收已确认');
  } else if (key === 'confirm-outbounded') {
    const { error } = await fetchConfirmOutbounded(row.id);
    if (!error) window.$message?.success('出库已确认');
  } else if (key === 'upload-pod') {
    openDetail(row, 'files');
  } else if (key === 'delete') {
    const { error } = await fetchDeleteOutboundOrder(row.id);
    if (!error) window.$message?.success('已删除');
  }
  await getData();
  await loadStatusCount();
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } = useNaivePaginatedTable<
  Api.Oms.OutboundOrderList,
  Api.Oms.OutboundOrder
>({
  api: () => fetchGetOutboundOrderList(searchParams.value),
  columns: () => [
    { key: 'outboundOrderNo', title: '出库单号', minWidth: 175, fixed: 'left' },
    { key: 'cargoOrderNo', title: '运单号汇总', minWidth: 180, ellipsis: { tooltip: true } },
    { key: 'preOutboundNo', title: '预出单号', minWidth: 170, ellipsis: { tooltip: true } },
    {
      key: 'outboundStatus',
      title: '状态',
      width: 130,
      render: row => {
        const meta = STATUS_META[row.outboundStatus] || { label: row.outboundStatus, type: 'default' };
        return <NTag type={meta.type} size="small">{meta.label}</NTag>;
      }
    },
    { key: 'outboundDirection', title: '出库类型', width: 100, render: row => DIRECTION_META[row.outboundDirection] || row.outboundDirection },
    { key: 'outboundWarehouseName', title: '出库仓库', minWidth: 150, ellipsis: { tooltip: true } },
    { key: 'customerName', title: '客户', minWidth: 150, ellipsis: { tooltip: true } },
    { key: 'containerNo', title: '柜号', minWidth: 130 },
    { key: 'shipmentCodes', title: '货件编码', minWidth: 190, ellipsis: { tooltip: true } },
    { key: 'actualCartonQty', title: '箱数', width: 80 },
    { key: 'actualPalletQty', title: '板数', width: 80 },
    { key: 'actualCbm', title: 'CBM', width: 90 },
    { key: 'appointmentStatus', title: '预约状态', width: 110 },
    { key: 'podStatus', title: 'POD', width: 90 },
    { key: 'actualOutboundTime', title: '出库时间', width: 160 },
    { key: 'completedTime', title: '完成时间', width: 160 },
    {
      key: 'operate',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => (
        <NDropdown trigger="click" options={getMoreOptions(row)} onSelect={key => handleMore(String(key), row)}>
          <NButton size="small">更多</NButton>
        </NDropdown>
      )
    }
  ],
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page;
    searchParams.value.pageSize = pageSize;
  }
});

async function handleComplete(row: Api.Oms.OutboundOrder) {
  const { error } = await fetchCompleteOutboundOrder(row.id);
  if (!error) {
    window.$message?.success('出库完成');
    await getData();
    await loadStatusCount();
  }
}

function handleSearch() {
  syncKeywordSearch();
  searchParams.value.outboundStatus = activeStatus.value || searchParams.value.outboundStatus;
  applyAdvancedFilters();
  searchParams.value.pageNum = 1;
  getDataByPage(1);
  loadStatusCount();
}

function handleReset() {
  activeStatus.value = '';
  keywordField.value = 'outboundOrderNo';
  keywordValue.value = null;
  advancedFilters.value = [];
  searchParams.value = { pageNum: 1, pageSize: searchParams.value.pageSize || 10, keywordField: 'outboundOrderNo' };
  getDataByPage(1);
  loadStatusCount();
}

function handleStatusChange(value: string) {
  activeStatus.value = value;
  searchParams.value.outboundStatus = value || null;
  handleSearch();
}

function handleAdvancedApply() {
  advancedVisible.value = false;
  handleSearch();
}

onMounted(() => {
  getData();
  loadStatusCount();
});
onActivated(() => {
  getData();
  loadStatusCount();
});
</script>

<template>
  <OmsListPage
    content-title="出库订单"
    filter-description="可按单号快速搜索，也可用状态标签或高级筛选组合查询"
  >
    <template #filter-actions>
      <NButton quaternary @click="searchCollapsed = !searchCollapsed">
        {{ searchCollapsed ? '展开筛选' : '收起筛选' }}
      </NButton>
      <NButton @click="advancedVisible = true">
        高级筛选
        <NTag v-if="activeAdvancedCount > 0" type="primary" size="small" :bordered="false" class="ml-4px">
          {{ activeAdvancedCount }}
        </NTag>
      </NButton>
      <NButton type="primary" @click="handleSearch">查询</NButton>
      <NButton @click="handleReset">重置</NButton>
    </template>

    <template #filters>
      <div v-show="!searchCollapsed" class="mt-14px">
        <NForm inline label-placement="left" :show-feedback="false">
          <NFormItem label="单号搜索">
            <NInputGroup class="w-360px">
              <NSelect :to="POPUP_TO_BODY" v-model:value="keywordField" :options="keywordFieldOptions" class="w-120px" />
              <NInput
                v-model:value="keywordValue"
                clearable
                :placeholder="`请输入${keywordFieldOptions.find(item => item.value === keywordField)?.label || ''}`"
                @keyup.enter="handleSearch"
              />
            </NInputGroup>
          </NFormItem>
          <NFormItem label="客户">
            <NInput v-model:value="searchParams.customerName" clearable placeholder="客户名称" class="w-160px" />
          </NFormItem>
          <NFormItem label="出库仓">
            <NInput v-model:value="searchParams.outboundWarehouseName" clearable placeholder="出库仓库" class="w-160px" />
          </NFormItem>
          <NFormItem label="方向">
            <NSelect :to="POPUP_TO_BODY" v-model:value="searchParams.outboundDirection" clearable :options="DIRECTION_OPTIONS" class="w-130px" />
          </NFormItem>
        </NForm>
      </div>
    </template>

    <template #header-extra>
      <TableHeaderOperation
        v-model:columns="columnChecks"
        :loading="loading"
        :show-add="false"
        :show-delete="false"
        :show-export="false"
        @refresh="getData"
      />
    </template>

    <template #tabs>
      <div class="mb-12px flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
        <div
          v-for="tab in statusTabs"
          :key="tab.value"
          class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
          :class="activeStatus === tab.value ? 'bg-primary text-white shadow-sm' : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'"
          @click="handleStatusChange(tab.value)"
        >
          <span>{{ tab.label }}</span>
          <span
            class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold leading-14px"
            :class="activeStatus === tab.value ? 'bg-white/25 text-white' : tab.count > 0 ? 'bg-#ef4444 text-white' : 'bg-#d0d3d9 text-#909399'"
          >
            {{ tab.count }}
          </span>
        </div>
      </div>
    </template>

    <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
      <DataTable
        remote
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        class="h-full min-h-280px sm:min-h-0"
      />
    </div>

    <NModal v-model:show="advancedVisible" preset="card" title="高级筛选" style="width: 760px; max-width: 96vw">
      <div class="mb-12px flex items-center justify-between">
        <span class="text-12px text-#6b7280">可按任意字段组合筛选出库订单</span>
        <NButton size="small" type="primary" secondary @click="addAdvancedFilter">+ 添加字段</NButton>
      </div>
      <NSpace v-if="advancedFilters.length" vertical :size="10">
        <div v-for="item in advancedFilters" :key="item.id" class="flex flex-wrap items-center gap-8px rounded-6px bg-#f8fafc px-12px py-8px">
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="item.field"
            filterable
            clearable
            :options="advancedFieldOptions"
            class="w-180px"
            @update:value="item.value = null"
          />
          <NSelect
            v-if="advancedFieldOptions.find(o => o.value === item.field)?.component === 'select'"
            :to="POPUP_TO_BODY"
            v-model:value="item.value"
            clearable
            :options="advancedFieldOptions.find(o => o.value === item.field)?.options || []"
            class="w-240px"
          />
          <NInput v-else v-model:value="item.value" clearable placeholder="请输入筛选值" class="w-240px" />
          <NButton quaternary type="error" size="small" @click="removeAdvancedFilter(item.id)">删除</NButton>
        </div>
      </NSpace>
      <NEmpty v-else description="尚未添加筛选字段" />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="advancedVisible = false">取消</NButton>
          <NButton type="primary" @click="handleAdvancedApply">确认查询</NButton>
        </NSpace>
      </template>
    </NModal>

    <OutboundOrderDetailModal
      v-model:visible="detailVisible"
      :row="currentRow"
      :init-tab="detailInitTab"
      @refreshed="getData"
    />
  </OmsListPage>
</template>
