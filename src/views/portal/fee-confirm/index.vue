<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalFeeConfirmList } from '@/service/api/portal';
import { PORTAL_FEE_STATUS_META } from '../constants';
import FeeConfirmDetailDrawer from './modules/fee-confirm-detail-drawer.vue';

defineOptions({ name: 'PortalFeeConfirm' });

const loading = ref(false);
const rows = ref<Api.Portal.PortalFeeConfirmItem[]>([]);
const statusFilter = ref<string | null>(null);
const detailVisible = ref(false);
const detailId = ref<number | null>(null);

const statusOptions = [
  { label: '全部状态', value: '' },
  ...Object.entries(PORTAL_FEE_STATUS_META).map(([value, meta]) => ({ label: meta.label, value }))
];

function openDetail(row: Api.Portal.PortalFeeConfirmItem) {
  detailId.value = row.id;
  detailVisible.value = true;
}

const columns: DataTableColumns<Api.Portal.PortalFeeConfirmItem> = [
  {
    title: '费用单号',
    key: 'feeNo',
    width: 140,
    render: row => (
      <span class="cursor-pointer text-primary hover:underline" onClick={() => openDetail(row)}>
        {row.feeNo}
      </span>
    )
  },
  { title: '费用类型', key: 'feeTypeLabel', width: 100 },
  { title: '关联订单', key: 'orderNo', width: 130, render: row => row.orderNo || '—' },
  { title: '海柜', key: 'containerNo', width: 120, render: row => row.containerNo || '—' },
  { title: '周期', key: 'period', width: 88 },
  { title: '金额', key: 'amount', width: 110, render: row => row.amount.display },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render: row => {
      const meta = PORTAL_FEE_STATUS_META[row.status];
      return <NTag size="small" type={meta?.type || 'default'}>{meta?.label || row.statusLabel}</NTag>;
    }
  },
  { title: '提交时间', key: 'submitTime', width: 160 },
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
    const { data } = await fetchGetPortalFeeConfirmList({
      pageNum: 1,
      pageSize: 50,
      status: (statusFilter.value || undefined) as Api.Portal.PortalFeeConfirmStatus | undefined
    });
    rows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="portal-fee-confirm">
    <NCard title="费用确认" size="small" :bordered="false">
      <div class="mb-12px">
        <NSpace>
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            class="w-140px"
            size="small"
            @update:value="loadList"
          />
          <NButton size="small" :loading="loading" @click="loadList">刷新</NButton>
        </NSpace>
      </div>
      <NDataTable :columns="columns" :data="rows" :loading="loading" :scroll-x="1000" size="small" :bordered="false" />
    </NCard>
    <FeeConfirmDetailDrawer v-model:visible="detailVisible" :fee-id="detailId" @updated="loadList" />
  </div>
</template>
