<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import { NButton, NCard, NDataTable, NInput, NPagination, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalOrderList } from '@/service/api/portal';
import {
  PORTAL_ORDER_CHANNEL_META,
  PORTAL_ORDER_CHANNEL_OPTIONS,
  PORTAL_ORDER_STATUS_META
} from '../constants';
import { usePortalWarehouse } from '../composables/use-portal-warehouse';
import { sanitizePortalCustomerStatus, type PortalCustomerOrderStatus } from '@/utils/portal/portal-order-status';
import OrderDetailDrawer from './modules/order-detail-drawer.vue';

defineOptions({ name: 'PortalOrders' });

const { warehouseId } = usePortalWarehouse();
const loading = ref(false);
const keyword = ref('');
const orderChannel = ref<Api.Portal.PortalOrderChannel | null>(null);
const statusFilter = ref<string | null>(null);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);
const rows = ref<Api.Portal.PortalOrderOption[]>([]);
const detailVisible = ref(false);
const detailId = ref<number | null>(null);

const channelFilterOptions = [
  { label: '全部类型', value: '' },
  ...PORTAL_ORDER_CHANNEL_OPTIONS.map(o => ({ label: o.label, value: o.value }))
];

const statusFilterOptions = [
  { label: '全部状态', value: '' },
  ...Object.entries(PORTAL_ORDER_STATUS_META).map(([value, meta]) => ({ label: meta.label, value }))
];

const TIMELINESS_LABEL: Record<string, string> = {
  T: 'T（第一等级）',
  K: 'K（第二等级）',
  NORMAL_SHIP: '普船（第三等级）'
};

function portalStatusMeta(status?: string | null) {
  const key = sanitizePortalCustomerStatus(status);
  return PORTAL_ORDER_STATUS_META[key as PortalCustomerOrderStatus] || { label: key, type: 'default' as const };
}

function openDetail(row: Api.Portal.PortalOrderOption) {
  detailId.value = row.id;
  detailVisible.value = true;
}

const columns: DataTableColumns<Api.Portal.PortalOrderOption> = [
  {
    title: '系统订单号',
    key: 'orderNo',
    width: 130,
    fixed: 'left',
    render: row => (
      <span class="cursor-pointer text-primary hover:underline" onClick={() => openDetail(row)}>
        {row.orderNo}
      </span>
    )
  },
  { title: '客户订单号', key: 'customerOrderNo', width: 150, ellipsis: { tooltip: true } },
  {
    title: '订单类型',
    key: 'orderChannel',
    width: 108,
    render: row => (
      <NTag size="small" type={PORTAL_ORDER_CHANNEL_META[row.orderChannel]?.type || 'default'}>
        {PORTAL_ORDER_CHANNEL_META[row.orderChannel]?.label || row.orderChannel}
      </NTag>
    )
  },
  { title: '海柜号', key: 'containerNo', width: 120, render: row => row.containerNo || '—' },
  { title: '库位', key: 'locationSummary', width: 140, ellipsis: { tooltip: true }, render: row => row.locationSummary || '—' },
  { title: '目的地', key: 'destination', width: 100, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render: row => {
      const meta = portalStatusMeta(row.status);
      return <NTag size="small" type={meta.type}>{meta.label}</NTag>;
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 72,
    fixed: 'right',
    render: row => (
      <NButton text type="primary" size="small" onClick={() => openDetail(row)}>
        详情
      </NButton>
    )
  }
];

async function loadList() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalOrderList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      orderChannel: orderChannel.value || undefined,
      status: statusFilter.value || undefined,
      warehouseId: warehouseId.value || null
    });
    rows.value = data?.rows ?? [];
    total.value = data?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onPageChange(page: number) {
  pageNum.value = page;
  loadList();
}

onMounted(loadList);
watch(warehouseId, () => loadList());
</script>

<template>
  <div class="portal-orders">
    <NCard title="我的订单" size="small" :bordered="false">
      <div class="portal-orders__toolbar">
        <NSpace wrap>
          <NInput
            v-model:value="keyword"
            placeholder="订单号 / 客户单号 / 海柜 / 目的地"
            clearable
            style="width: 260px"
            @keyup.enter="loadList"
          />
          <NSelect
            v-model:value="orderChannel"
            :options="channelFilterOptions"
            clearable
            placeholder="订单类型"
            class="w-140px"
            @update:value="pageNum = 1; loadList()"
          />
          <NSelect
            v-model:value="statusFilter"
            :options="statusFilterOptions"
            clearable
            placeholder="订单状态"
            class="w-120px"
            @update:value="pageNum = 1; loadList()"
          />
          <NButton type="primary" :loading="loading" @click="pageNum = 1; loadList()">查询</NButton>
        </NSpace>
      </div>
      <NDataTable
        :columns="columns"
        :data="rows"
        :loading="loading"
        :row-key="(r: Api.Portal.PortalOrderOption) => r.id"
        size="small"
        :scroll-x="980"
        class="mt-12px"
      />
      <div class="mt-12px flex justify-end">
        <NPagination
          v-model:page="pageNum"
          :page-size="pageSize"
          :item-count="total"
          size="small"
          @update:page="onPageChange"
        />
      </div>
    </NCard>
    <OrderDetailDrawer v-model:visible="detailVisible" :order-id="detailId" />
  </div>
</template>

<style scoped>
.portal-orders__toolbar {
  margin-bottom: 4px;
}
</style>
