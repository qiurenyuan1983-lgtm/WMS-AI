<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalInTransitList } from '@/service/api/portal';
import { usePortalWarehouse } from '../composables/use-portal-warehouse';
import InTransitDetailDrawer from './modules/in-transit-detail-drawer.vue';

defineOptions({ name: 'PortalInTransit' });

const { warehouseId } = usePortalWarehouse();
const loading = ref(false);
const rows = ref<Api.Portal.PortalInTransitDetail[]>([]);
const detailVisible = ref(false);
const detailId = ref<number | null>(null);

const GPS_TYPE: Record<string, NaiveUI.ThemeColor> = {
  TRACKING: 'info',
  IN_FENCE: 'success',
  OFFLINE: 'warning'
};

function openDetail(row: Api.Portal.PortalInTransitDetail) {
  detailId.value = row.id;
  detailVisible.value = true;
}

const columns: DataTableColumns<Api.Portal.PortalInTransitDetail> = [
  {
    title: '运输单号',
    key: 'refNo',
    width: 180,
    render: row => (
      <span class="cursor-pointer text-primary hover:underline" onClick={() => openDetail(row)}>
        {row.refNo}
      </span>
    )
  },
  {
    title: '类型',
    key: 'refType',
    width: 72,
    render: row => (row.refType === 'TRUCK' ? '车次' : '海柜')
  },
  { title: '路线', key: 'route', minWidth: 180, ellipsis: { tooltip: true } },
  {
    title: 'GPS',
    key: 'gpsStatus',
    width: 110,
    render: row => (
      <NTag size="small" type={GPS_TYPE[row.gpsStatus] || 'default'}>
        {row.gpsStatusLabel}
      </NTag>
    )
  },
  { title: '状态', key: 'statusLabel', width: 88 },
  { title: 'ETA', key: 'eta', width: 160, render: row => row.eta || '—' },
  { title: '最新位置', key: 'lastLocation', minWidth: 180, ellipsis: { tooltip: true } },
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
    const { data } = await fetchGetPortalInTransitList({ warehouseId: warehouseId.value || null });
    rows.value = data ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="portal-in-transit">
    <NCard title="在途运输" size="small" :bordered="false">
      <p class="mb-12px text-13px text-#6b7280">
        车次 GPS 与海柜到港状态与 TMS 执行任务中心 Mock 数据一致。
      </p>
      <NDataTable :columns="columns" :data="rows" :loading="loading" :scroll-x="1100" size="small" :bordered="false" />
    </NCard>
    <InTransitDetailDrawer v-model:visible="detailVisible" :transit-id="detailId" />
  </div>
</template>
