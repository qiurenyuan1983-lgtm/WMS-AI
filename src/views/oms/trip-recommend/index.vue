<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItemGi,
  NGi,
  NGrid,
  NInput,
  NSelect,
  NSpace,
  NStatistic,
  NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchGenerateTripRecommend,
  fetchGetTripRecommendStats,
  fetchGetTripRecommendSummaryList,
  fetchGetTripRecommendOrders,
  fetchPreviewTripRecommendLoad
} from '@/service/api/oms/trip-recommend';
import DestinationOrderDrawer from './modules/destination-order-drawer.vue';
import TripRecommendConfirmModal from './modules/trip-recommend-confirm-modal.vue';
import { buildConfirmItemFromSummary } from './utils/trip-recommend-confirm';
import type { TripRecommendConfirmItem } from './utils/trip-recommend-confirm';
import {
  APPOINTMENT_TYPE_OPTIONS,
  BOOL_FILTER_OPTIONS,
  CARGO_STATUS_OPTIONS,
  INVENTORY_STATUS_OPTIONS,
  PLATFORM_OPTIONS,
  RECOMMEND_STATUS_META,
  SEARCH_PLACEHOLDER
} from './constants';

defineOptions({ name: 'OmsTripRecommend' });

const keyword = ref('');
const showGenerated = ref(false);
const stats = ref<Api.Oms.TripRecommendStats | null>(null);
const drawerVisible = ref(false);
const activeGroupId = ref<string | null>(null);
const generatingGroupId = ref<string | null>(null);
const confirmModalVisible = ref(false);
const confirmItems = ref<TripRecommendConfirmItem[]>([]);
const confirmRuleLabel = ref('');
const confirmGroupId = ref<string | null>(null);
const confirmLoadingKey = ref<string | null>(null);
const confirmSummaryRow = ref<Api.Oms.TripRecommendSummaryRow | null>(null);

const searchParams = ref<Api.Oms.TripRecommendSearchParams>({
  pageNum: 1,
  pageSize: 10,
  platform: null,
  destination: null,
  appointmentNo: null,
  appointmentType: null,
  customerName: null,
  warehouseName: null,
  inventoryStatus: null,
  cargoStatus: null,
  holdFlag: null,
  exceptionFlag: null,
  tripGenerated: null,
  appointmentTimeStart: null,
  appointmentTimeEnd: null
});

const appointmentRange = ref<[number, number] | null>(null);
const searchExpandedNames = ref<Array<string | number>>(['search']);

const filterPayload = computed<Api.Oms.TripRecommendSearchParams>(() => ({
  ...searchParams.value,
  keyword: keyword.value || null,
  showGenerated: showGenerated.value ? '1' : '0',
  appointmentTimeStart: appointmentRange.value
    ? new Date(appointmentRange.value[0]).toISOString().slice(0, 19).replace('T', ' ')
    : null,
  appointmentTimeEnd: appointmentRange.value
    ? new Date(appointmentRange.value[1]).toISOString().slice(0, 19).replace('T', ' ')
    : null
}));

async function loadStats() {
  const { data } = await fetchGetTripRecommendStats(filterPayload.value);
  stats.value = data || null;
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  reloadAll();
}

function handleReset() {
  keyword.value = '';
  showGenerated.value = false;
  appointmentRange.value = null;
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    platform: null,
    destination: null,
    appointmentNo: null,
    appointmentType: null,
    customerName: null,
    warehouseName: null,
    inventoryStatus: null,
    cargoStatus: null,
    holdFlag: null,
    exceptionFlag: null,
    tripGenerated: null,
    appointmentTimeStart: null,
    appointmentTimeEnd: null
  };
  reloadAll();
}

function openDrawer(row: Api.Oms.TripRecommendSummaryRow) {
  activeGroupId.value = row.id;
  drawerVisible.value = true;
}

async function handleQuickGenerate(row: Api.Oms.TripRecommendSummaryRow) {
  if (row.operableOrderCount <= 0 || row.matchableTripCount <= 0) {
    window.$message?.warning('当前目的地暂无可生成车次的订单');
    return;
  }

  generatingGroupId.value = row.id;
  try {
    const { data: orderData, error: orderError } = await fetchGetTripRecommendOrders({
      ...filterPayload.value,
      groupId: row.id
    });
    if (orderError || !orderData) {
      window.$message?.error('加载订单失败');
      return;
    }

    const orderIds = (orderData.defaultSelectedIds || []).map(Number);
    if (!orderIds.length) {
      window.$message?.warning('没有符合规则的默认可生成订单，请双击打开详情手动勾选');
      openDrawer(row);
      return;
    }

    const { data: preview } = await fetchPreviewTripRecommendLoad(row.id, orderIds);

    confirmGroupId.value = row.id;
    confirmSummaryRow.value = row;
    confirmItems.value = [buildConfirmItemFromSummary(row, orderIds, preview)];
    confirmRuleLabel.value = preview?.ruleStatusLabel || '';
    confirmModalVisible.value = true;
  } finally {
    generatingGroupId.value = null;
  }
}

async function handleConfirmGenerate(payload: { orderIds: number[]; item: TripRecommendConfirmItem }) {
  if (!confirmGroupId.value) return;
  confirmLoadingKey.value = payload.item.key;
  try {
    const { data, error } = await fetchGenerateTripRecommend({
      groupId: confirmGroupId.value,
      orderIds: payload.orderIds
    });
    if (error || !data?.success) {
      window.$message?.error(data?.message || '生成车次失败');
      if (
        (data?.message?.includes('不一致') || data?.message?.includes('勾选')) &&
        confirmSummaryRow.value
      ) {
        openDrawer(confirmSummaryRow.value);
      }
      return;
    }
    window.$message?.success(data.message);
    confirmModalVisible.value = false;
    reloadAll();
  } finally {
    confirmLoadingKey.value = null;
  }
}

function reloadAll() {
  loadStats();
  getData();
}

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetTripRecommendSummaryList(filterPayload.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page ?? 1;
    searchParams.value.pageSize = pageSize ?? 10;
  },
  columns: () =>
    [
      { key: 'destination', title: '目的地', width: 96, fixed: 'left', ellipsis: { tooltip: true } },
      { key: 'platform', title: '平台', width: 120, ellipsis: { tooltip: true } },
      { key: 'appointmentNo', title: '预约号', width: 150, ellipsis: { tooltip: true } },
      {
        key: 'appointmentType',
        title: '预约类型',
        width: 92,
        render: row => {
          const type = row.appointmentType;
          if (type === 'MIXED') {
            return (
              <NTag size="small" type="warning">
                Floor/Pallet
              </NTag>
            );
          }
          return (
            <NTag size="small" type={type === 'FLOOR' ? 'info' : 'primary'}>
              {type === 'FLOOR' ? 'Floor' : 'Pallet'}
            </NTag>
          );
        }
      },
      { key: 'appointmentTime', title: '预约时间', width: 158 },
      { key: 'operableOrderCount', title: '可操作订单数', width: 108, align: 'center' },
      { key: 'totalPalletQty', title: '总板数', width: 72, align: 'center' },
      { key: 'totalCartonQty', title: '总箱数', width: 72, align: 'center' },
      { key: 'totalCbm', title: '总CBM', width: 80, align: 'right', render: row => row.totalCbm?.toFixed(2) },
      { key: 'totalWeightKg', title: '总重量KG', width: 96, align: 'right', render: row => row.totalWeightKg?.toFixed(1) },
      { key: 'matchableTripCount', title: '可匹配车次', width: 96, align: 'center' },
      {
        key: 'recommendRule',
        title: '推荐规则',
        minWidth: 200,
        ellipsis: { tooltip: true }
      },
      {
        key: 'recommendStatus',
        title: '推荐状态',
        width: 108,
        render: row => {
          const meta = RECOMMEND_STATUS_META[row.recommendStatus];
          return <NTag size="small" type={meta?.type || 'default'}>{row.recommendStatusLabel}</NTag>;
        }
      },
      {
        key: 'tripGenerated',
        title: '是否已生成',
        width: 96,
        render: row => (
          <NTag size="small" type={row.tripGenerated ? 'success' : 'default'}>
            {row.tripGenerated ? '是' : '否'}
          </NTag>
        )
      },
      {
        key: 'action',
        title: '操作',
        width: 108,
        fixed: 'right',
        render: row => (
          <NButton
            size="tiny"
            type="primary"
            loading={generatingGroupId.value === row.id}
            disabled={row.operableOrderCount <= 0 || row.matchableTripCount <= 0}
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              handleQuickGenerate(row);
            }}
          >
            生成车次
          </NButton>
        )
      }
    ] as DataTableColumns<Api.Oms.TripRecommendSummaryRow>
});

watch(showGenerated, () => handleSearch());

onMounted(() => {
  loadStats();
});
</script>

<template>
  <div class="min-h-500px flex flex-col gap-16px p-16px">
    <NGrid :cols="24" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="可操作订单数" :value="stats?.operableOrderCount ?? 0" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="可操作总板数" :value="stats?.operablePalletQty ?? 0" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="可操作总CBM" :value="stats?.operableCbm ?? 0" :precision="2" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="可操作总重量" :value="stats?.operableWeightKg ?? 0" :precision="1" suffix="KG" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="可匹配车次数" :value="stats?.matchableTripCount ?? 0" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="Floor可生成" :value="stats?.floorGenerable ?? 0" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="Pallet可生成" :value="stats?.palletGenerable ?? 0" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="已生成车次" :value="stats?.generatedTripCount ?? 0" />
        </NCard>
      </NGi>
      <NGi span="24 s:12 m:6 l:3">
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NStatistic label="不可操作订单" :value="stats?.inoperableOrderCount ?? 0" />
        </NCard>
      </NGi>
    </NGrid>

    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <NCollapse v-model:expanded-names="searchExpandedNames">
        <NCollapseItem title="搜索" name="search">
          <div class="mb-12px flex flex-wrap items-center gap-12px">
            <NInput
              v-model:value="keyword"
              class="max-w-480px flex-1"
              clearable
              :placeholder="SEARCH_PLACEHOLDER"
              @keyup.enter="handleSearch"
            />
            <NCheckbox v-model:checked="showGenerated">显示已生成车次</NCheckbox>
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
            </NSpace>
          </div>

          <NForm label-placement="left" label-width="88" size="small">
            <NGrid :cols="24" :x-gap="12" :y-gap="4" responsive="screen" item-responsive>
              <NFormItemGi span="24 s:12 m:8 l:6" label="平台">
                <NSelect v-model:value="searchParams.platform" :options="PLATFORM_OPTIONS" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="目的地">
                <NInput v-model:value="searchParams.destination" clearable placeholder="目的地" />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="预约号">
                <NInput v-model:value="searchParams.appointmentNo" clearable placeholder="预约号" />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="预约类型">
                <NSelect v-model:value="searchParams.appointmentType" :options="APPOINTMENT_TYPE_OPTIONS" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="客户">
                <NInput v-model:value="searchParams.customerName" clearable placeholder="客户" />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="仓库">
                <NInput v-model:value="searchParams.warehouseName" clearable placeholder="仓库" />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="库存状态">
                <NSelect v-model:value="searchParams.inventoryStatus" :options="INVENTORY_STATUS_OPTIONS" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="货物状态">
                <NSelect v-model:value="searchParams.cargoStatus" :options="CARGO_STATUS_OPTIONS" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="是否暂扣">
                <NSelect v-model:value="searchParams.holdFlag" :options="BOOL_FILTER_OPTIONS" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="是否异常">
                <NSelect v-model:value="searchParams.exceptionFlag" :options="BOOL_FILTER_OPTIONS" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="已生成车次">
                <NSelect v-model:value="searchParams.tripGenerated" :options="BOOL_FILTER_OPTIONS" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8 l:6" label="预约时间">
                <NDatePicker v-model:value="appointmentRange" type="datetimerange" clearable class="w-full" />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard title="自动车次推荐" size="small" :bordered="false" class="card-wrapper">
      <p class="mb-8px text-12px text-#6b7280">主列表按目的地汇总；双击行查看订单详情，点击「生成车次」按默认勾选快速生成。</p>

      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="row => row.id"
        size="small"
        :scroll-x="1680"
        :pagination="mobilePagination"
        @row-dblclick="(_e, row) => openDrawer(row)"
      />
    </NCard>

    <DestinationOrderDrawer
      v-model:visible="drawerVisible"
      :group-id="activeGroupId"
      :filter-params="filterPayload"
      @success="reloadAll"
    />

    <TripRecommendConfirmModal
      v-model:visible="confirmModalVisible"
      :items="confirmItems"
      :rule-status-label="confirmRuleLabel"
      :loading-key="confirmLoadingKey"
      @confirm="handleConfirmGenerate"
    />
  </div>
</template>
