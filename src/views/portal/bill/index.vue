<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalBillList } from '@/service/api/portal';
import { PORTAL_BILL_STATUS_META } from '../constants';
import BillDetailDrawer from './modules/bill-detail-drawer.vue';

defineOptions({ name: 'PortalBill' });

const loading = ref(false);
const rows = ref<Api.Portal.PortalBill[]>([]);
const statusFilter = ref<string | null>(null);
const detailVisible = ref(false);
const detailBillNo = ref<string | null>(null);

const statusOptions = [
  { label: '全部状态', value: '' },
  ...Object.entries(PORTAL_BILL_STATUS_META).map(([value, meta]) => ({ label: meta.label, value }))
];

function openDetail(row: Api.Portal.PortalBill) {
  detailBillNo.value = row.billNo;
  detailVisible.value = true;
}

function downloadMock(format: 'pdf' | 'excel') {
  window.$message?.info(`原型模式：${format.toUpperCase()} 下载已模拟`);
}

const columns: DataTableColumns<Api.Portal.PortalBill> = [
  {
    title: '账单号',
    key: 'billNo',
    width: 130,
    render: row => (
      <span class="cursor-pointer text-primary hover:underline" onClick={() => openDetail(row)}>
        {row.billNo}
      </span>
    )
  },
  { title: '账期', key: 'billMonth', width: 96 },
  { title: '仓库', key: 'warehouseCode', width: 72 },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render: row => {
      const meta = PORTAL_BILL_STATUS_META[row.status];
      return <NTag size="small" type={meta?.type || 'default'}>{meta?.label || row.statusLabel}</NTag>;
    }
  },
  { title: '账单总额', key: 'totalAmount', width: 120, render: row => row.totalAmount.display },
  { title: '已付', key: 'paidAmount', width: 120, render: row => row.paidAmount.display },
  { title: '到期日', key: 'dueDate', width: 110 },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right',
    render: row => (
      <NSpace size="small">
        <NButton text type="primary" size="small" onClick={() => openDetail(row)}>详情</NButton>
        <NButton text size="small" onClick={() => downloadMock('pdf')}>PDF</NButton>
        <NButton text size="small" onClick={() => downloadMock('excel')}>Excel</NButton>
      </NSpace>
    )
  }
];

async function loadList() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalBillList({
      pageNum: 1,
      pageSize: 50,
      status: (statusFilter.value || undefined) as Api.Portal.PortalBillStatus | undefined
    });
    rows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="portal-bill">
    <NCard title="账单中心" size="small" :bordered="false">
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
      <NDataTable :columns="columns" :data="rows" :loading="loading" :scroll-x="960" size="small" :bordered="false" />
    </NCard>
    <BillDetailDrawer v-model:visible="detailVisible" :bill-no="detailBillNo" />
  </div>
</template>
