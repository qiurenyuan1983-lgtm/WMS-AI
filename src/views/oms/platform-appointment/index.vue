<script setup lang="tsx">
import { computed, onActivated, onMounted, ref } from 'vue';
import { NButton, NDropdown, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchGetPlatformAppointmentList,
  fetchGetPlatformAppointmentStatusCount
} from '@/service/api/oms/platform-appointment';
import OmsListPage from '../components/oms-list-page.vue';
import PlatformAppointmentDetailDrawer from './modules/platform-appointment-detail-drawer.vue';
import PlatformAppointmentCreateOutboundModal from './modules/platform-appointment-create-outbound-modal.vue';
import PlatformAppointmentPreOutboundFilterModal from './modules/platform-appointment-pre-outbound-filter-modal.vue';
import PlatformAppointmentOperateModal from './modules/platform-appointment-operate-modal.vue';
import { displayAppointmentNo } from '@/utils/oms/appointment-no';

defineOptions({ name: 'OmsPlatformAppointment' });

const STATUS_ORDER = ['UNUSED', 'USED', 'DELIVERED', 'CANCELLED'] as const;

const STATUS_TAG: Record<string, NaiveUI.ThemeColor> = {
  UNUSED: 'warning',
  USED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'default'
};

const { record: statusRecord } = useDict('oms_platform_appointment_status');
const { record: typeRecord } = useDict('oms_platform_appointment_type');
const { record: tagRecord } = useDict('oms_platform_appointment_tag');

const searchParams = ref<Api.Oms.PlatformAppointmentSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  platformName: null,
  warehouseCode: null,
  appointmentType: null,
  status: null
});

const activeTag = ref('');
const statusCountMap = ref<Api.Oms.PlatformAppointmentStatusCount>({
  total: 0,
  UNUSED: 0,
  USED: 0,
  DELIVERED: 0,
  CANCELLED: 0
});

const detailVisible = ref(false);
const currentRow = ref<Api.Oms.PlatformAppointment | null>(null);
const createOutboundVisible = ref(false);
const createOutboundRow = ref<Api.Oms.PlatformAppointment | null>(null);
const createOrderMode = ref<'outbound' | 'pre-outbound'>('outbound');
const preOutboundFilter = ref<Api.Oms.PlatformAppointmentPreOutboundFilter | null>(null);
const preOutboundFilterVisible = ref(false);
const preOutboundFilterRow = ref<Api.Oms.PlatformAppointment | null>(null);
const createVisible = ref(false);

const typeOptions = computed(() =>
  Object.entries(typeRecord.value).map(([value, item]) => ({
    label: item.dictLabel,
    value
  }))
);

const statusTabs = computed(() => [
  { label: '全部', value: '', count: statusCountMap.value.total },
  ...STATUS_ORDER.map(value => ({
    label: statusRecord.value[value]?.dictLabel || value,
    value,
    count: statusCountMap.value[value] || 0
  }))
]);

function getText(value: unknown) {
  if (value === null || value === undefined || value === '') return '--';
  return String(value);
}

function statusLabel(code: string) {
  return statusRecord.value[code]?.dictLabel || code || '--';
}

function typeLabel(code: string) {
  return typeRecord.value[code]?.dictLabel || code || '--';
}

function tagLabel(code: string) {
  return tagRecord.value[code]?.dictLabel || code;
}

function tagType(code: string): NaiveUI.ThemeColor {
  return (tagRecord.value[code]?.listClass as NaiveUI.ThemeColor) || 'default';
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Oms.PlatformAppointmentList, Api.Oms.PlatformAppointment>({
    api: () => fetchGetPlatformAppointmentList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: ({ page, pageSize }) => {
      searchParams.value.pageNum = page;
      searchParams.value.pageSize = pageSize;
    },
    columns: () => [
      { key: 'platformName', title: '平台', minWidth: 130, fixed: 'left' },
      { key: 'warehouseCode', title: '仓库代码', width: 110 },
      {
        key: 'appointmentNo',
        title: '预约号',
        minWidth: 170,
        render: row => displayAppointmentNo(row.appointmentNo, { platformName: row.platformName })
      },
      { key: 'appointmentTime', title: '预约时间', width: 170, render: row => getText(row.appointmentTime) },
      { key: 'createTime', title: '创建时间', width: 170, render: row => getText(row.createTime) },
      {
        key: 'appointmentType',
        title: '类型',
        width: 110,
        render: row => (
          <NTag size="small" type={(typeRecord.value[row.appointmentType]?.listClass as NaiveUI.ThemeColor) || 'default'}>
            {typeLabel(row.appointmentType)}
          </NTag>
        )
      },
      {
        key: 'status',
        title: '状态',
        width: 100,
        render: row => (
          <NTag size="small" type={STATUS_TAG[row.status] || 'default'}>
            {statusLabel(row.status)}
          </NTag>
        )
      },
      {
        key: 'outboundOrderNo',
        title: '出库单号',
        minWidth: 140,
        render: row => getText(row.outboundOrderNo)
      },
      {
        key: 'preOutboundNo',
        title: '预出单号',
        minWidth: 140,
        render: row => getText(row.preOutboundNo)
      },
      { key: 'remark', title: '备注', minWidth: 160, ellipsis: { tooltip: true }, render: row => getText(row.remark) },
      {
        key: 'tagCodes',
        title: '标签',
        minWidth: 180,
        render: row => {
          const tags = row.tagCodes || [];
          if (!tags.length) return '--';
          return (
            <div class="flex flex-wrap gap-4px">
              {tags.map(code => (
                <NTag key={code} size="small" type={tagType(code)}>
                  {tagLabel(code)}
                </NTag>
              ))}
            </div>
          );
        }
      },
      {
        key: 'existingCargoCbm',
        title: '现有货物CBM',
        width: 120,
        align: 'center',
        render: row => Number(row.existingCargoCbm || 0).toFixed(2)
      },
      {
        key: 'operate',
        title: '操作',
        width: 90,
        fixed: 'right',
        render: row => (
          <NDropdown trigger="click" options={getOperateOptions(row)} onSelect={key => handleOperate(String(key), row)}>
            <NButton size="small">更多</NButton>
          </NDropdown>
        )
      }
    ]
  });

function getOperateOptions(row: Api.Oms.PlatformAppointment) {
  const baseDisabled = row.status === 'CANCELLED' || row.status === 'DELIVERED';
  return [
    { label: '生成出库单', key: 'create-outbound', disabled: baseDisabled || Boolean(row.outboundOrderNo) },
    { label: '生成预出单', key: 'create-pre-outbound', disabled: baseDisabled || Boolean(row.preOutboundNo) },
    { label: '详情', key: 'detail' }
  ];
}

function openCreateOutbound(row: Api.Oms.PlatformAppointment) {
  createOrderMode.value = 'outbound';
  preOutboundFilter.value = null;
  createOutboundRow.value = { ...row };
  createOutboundVisible.value = true;
}

function openCreatePreOutbound(row: Api.Oms.PlatformAppointment) {
  preOutboundFilterRow.value = { ...row };
  preOutboundFilterVisible.value = true;
}

function onPreOutboundFilterConfirm(filter: Api.Oms.PlatformAppointmentPreOutboundFilter) {
  if (!preOutboundFilterRow.value) return;
  createOrderMode.value = 'pre-outbound';
  preOutboundFilter.value = filter;
  createOutboundRow.value = { ...preOutboundFilterRow.value };
  createOutboundVisible.value = true;
}

function onOrderCreated(
  result: Api.Oms.PlatformAppointmentCreateOutboundResult | Api.Oms.PlatformAppointmentCreatePreOutboundResult
) {
  const idx = data.value.findIndex(item => String(item.id) === String(result.appointment.id));
  if (idx >= 0) data.value[idx] = result.appointment;
  if (currentRow.value && String(currentRow.value.id) === String(result.appointment.id)) {
    currentRow.value = result.appointment;
  }
  loadStatusCount();
}

function openDetail(row: Api.Oms.PlatformAppointment) {
  currentRow.value = row;
  detailVisible.value = true;
}

function handleOperate(key: string, row: Api.Oms.PlatformAppointment) {
  if (key === 'detail') {
    openDetail(row);
    return;
  }
  if (key === 'create-outbound') {
    openCreateOutbound(row);
    return;
  }
  if (key === 'create-pre-outbound') {
    openCreatePreOutbound(row);
  }
}

async function loadStatusCount() {
  const { status: _status, ...rest } = searchParams.value;
  const { data: countData, error } = await fetchGetPlatformAppointmentStatusCount(rest);
  if (!error && countData) {
    statusCountMap.value = countData;
  }
}

async function handleSearch() {
  searchParams.value.pageNum = 1;
  await Promise.all([getDataByPage(1), loadStatusCount()]);
}

function handleReset() {
  activeTag.value = '';
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    keyword: null,
    platformName: null,
    warehouseCode: null,
    appointmentType: null,
    status: null
  };
  handleSearch();
}

function handleTagChange(value: string) {
  activeTag.value = value;
  searchParams.value.status = value || null;
  handleSearch();
}

function onAppointmentCreated(row: Api.Oms.PlatformAppointment) {
  data.value.unshift(row);
  loadStatusCount();
}

function openCreate() {
  createVisible.value = true;
}

onMounted(handleSearch);
onActivated(handleSearch);
</script>

<template>
  <OmsListPage content-title="平台预约管理" filter-description="按平台、仓库与预约号筛选，支持状态标签切换">
    <template #filter-actions>
      <NButton type="primary" @click="openCreate">新增</NButton>
      <NButton type="primary" secondary @click="handleSearch">搜索</NButton>
      <NButton @click="handleReset">重置</NButton>
    </template>

    <template #filters>
      <div class="mt-14px">
        <NForm inline label-placement="left" :show-feedback="false">
          <NFormItem label="关键词">
            <NInput
              v-model:value="searchParams.keyword"
              placeholder="平台/仓库代码/预约号"
              clearable
              class="w-240px"
            />
          </NFormItem>
          <NFormItem label="平台">
            <NInput v-model:value="searchParams.platformName" placeholder="平台名称" clearable class="w-180px" />
          </NFormItem>
          <NFormItem label="仓库代码">
            <NInput v-model:value="searchParams.warehouseCode" placeholder="仓库代码" clearable class="w-150px" />
          </NFormItem>
          <NFormItem label="类型">
            <NSelect
              v-model:value="searchParams.appointmentType"
              :to="POPUP_TO_BODY"
              clearable
              :options="typeOptions"
              class="w-150px"
            />
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
        @refresh="handleSearch"
      />
    </template>

    <template #tabs>
      <div class="mb-12px flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
        <div
          v-for="tab in statusTabs"
          :key="tab.value"
          class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
          :class="
            activeTag === tab.value ? 'bg-primary text-white shadow-sm' : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'
          "
          @click="handleTagChange(tab.value)"
        >
          <span>{{ tab.label }}</span>
          <span
            class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold leading-14px"
            :class="
              activeTag === tab.value
                ? 'bg-white/25 text-white'
                : tab.count > 0
                  ? 'bg-#ef4444 text-white'
                  : 'bg-#d0d3d9 text-#909399'
            "
          >
            {{ tab.count }}
          </span>
        </div>
      </div>
    </template>

    <NDataTable
      remote
      :columns="columns"
      :data="data"
      :loading="loading"
      :scroll-x="scrollX"
      :pagination="mobilePagination"
      size="small"
      flex-height
      class="min-h-0 flex-1"
    />

    <PlatformAppointmentDetailDrawer v-model:visible="detailVisible" v-model:row="currentRow" />

    <PlatformAppointmentPreOutboundFilterModal
      v-model:visible="preOutboundFilterVisible"
      v-model:appointment="preOutboundFilterRow"
      @confirm="onPreOutboundFilterConfirm"
    />

    <PlatformAppointmentCreateOutboundModal
      v-model:visible="createOutboundVisible"
      v-model:appointment="createOutboundRow"
      :mode="createOrderMode"
      :pre-outbound-filter="preOutboundFilter"
      @success="onOrderCreated"
    />

    <PlatformAppointmentOperateModal v-model:visible="createVisible" @success="onAppointmentCreated" />
  </OmsListPage>
</template>

<style scoped>
:deep(.n-data-table) {
  flex: 1;
  min-height: 0;
}
</style>
