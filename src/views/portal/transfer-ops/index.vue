<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalTransferInstructions } from '@/service/api/portal';
import TransferCreateModal from './modules/transfer-create-modal.vue';
import TransferDetailDrawer from './modules/transfer-detail-drawer.vue';

defineOptions({ name: 'PortalTransferOps' });

const loading = ref(false);
const rows = ref<Api.Portal.PortalTransferInstruction[]>([]);
const createVisible = ref(false);
const detailVisible = ref(false);
const detailId = ref<number | null>(null);

const STATUS_TYPE: Record<string, NaiveUI.ThemeColor> = {
  SUBMITTED: 'info',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'default'
};

function openDetail(row: Api.Portal.PortalTransferInstruction) {
  detailId.value = row.id;
  detailVisible.value = true;
}

const columns: DataTableColumns<Api.Portal.PortalTransferInstruction> = [
  {
    title: '指令号',
    key: 'instructionNo',
    width: 150,
    render: row => (
      <span class="cursor-pointer text-primary hover:underline" onClick={() => openDetail(row)}>
        {row.instructionNo}
      </span>
    )
  },
  { title: '系统订单号', key: 'orderNo', width: 130 },
  { title: '客户订单号', key: 'customerOrderNo', width: 140, ellipsis: { tooltip: true } },
  { title: '操作类型', key: 'operationTypeLabel', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render: row => (
      <NTag size="small" type={STATUS_TYPE[row.status] || 'default'}>
        {row.statusLabel}
      </NTag>
    )
  },
  { title: '提交时间', key: 'submitTime', width: 160 },
  { title: '附件', key: 'attachmentCount', width: 64, render: row => row.attachmentCount || '—' },
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
    const { data } = await fetchGetPortalTransferInstructions({ pageNum: 1, pageSize: 50 });
    rows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="portal-transfer-ops">
    <NCard title="中转与库内操作" size="small" :bordered="false">
      <div class="mb-12px flex items-center justify-between gap-12px">
        <p class="text-13px text-#6b7280">
          到仓后对在库/暂扣货件下发换标、拍照、暂扣/放行等指令，支持上传附件。
        </p>
        <NButton type="primary" @click="createVisible = true">新建指令</NButton>
      </div>
      <NDataTable
        :columns="columns"
        :data="rows"
        :loading="loading"
        :scroll-x="960"
        size="small"
        :bordered="false"
      />
    </NCard>
    <TransferCreateModal v-model:visible="createVisible" @success="loadList" />
    <TransferDetailDrawer v-model:visible="detailVisible" :instruction-id="detailId" />
  </div>
</template>
