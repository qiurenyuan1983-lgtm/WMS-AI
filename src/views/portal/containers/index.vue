<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import { NButton, NCard, NDataTable, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalContainers } from '@/service/api/portal';
import { PORTAL_ORDER_CHANNEL_META } from '../constants';
import { usePortalWarehouse } from '../composables/use-portal-warehouse';
import ContainerDetailDrawer from './modules/container-detail-drawer.vue';

defineOptions({ name: 'PortalContainers' });

const { warehouseId } = usePortalWarehouse();
const loading = ref(false);
const rows = ref<Api.Portal.PortalContainerSummary[]>([]);
const detailVisible = ref(false);
const detailContainerNo = ref<string | null>(null);

function openDetail(row: Api.Portal.PortalContainerSummary) {
  detailContainerNo.value = row.containerNo;
  detailVisible.value = true;
}

const columns: DataTableColumns<Api.Portal.PortalContainerSummary> = [
  {
    title: '海柜号',
    key: 'containerNo',
    width: 140,
    fixed: 'left',
    render: row => (
      <span class="cursor-pointer text-primary hover:underline" onClick={() => openDetail(row)}>
        {row.containerNo}
      </span>
    )
  },
  { title: '仓库', key: 'warehouseCode', width: 72 },
  {
    title: '装柜类型',
    key: 'loadingType',
    width: 88,
    render: row => (row.loadingType === 'MIXED' ? '混装' : '整板')
  },
  { title: '货件数', key: 'cargoCount', width: 72 },
  {
    title: '渠道分布',
    key: 'channelBreakdown',
    minWidth: 200,
    render: row => (
      <div class="flex flex-wrap gap-4px">
        {row.channelBreakdown.map(item => (
          <NTag key={item.channel} size="small" type={PORTAL_ORDER_CHANNEL_META[item.channel]?.type || 'default'}>
            {PORTAL_ORDER_CHANNEL_META[item.channel]?.label}×{item.count}
          </NTag>
        ))}
      </div>
    )
  },
  { title: '状态', key: 'status', width: 88 },
  { title: '预计到仓', key: 'eta', width: 160, render: row => row.eta || '—' },
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
    const { data } = await fetchGetPortalContainers({ warehouseId: warehouseId.value || null });
    rows.value = data ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
watch(warehouseId, () => loadList());
</script>

<template>
  <div class="portal-containers">
    <NCard title="我的海柜" size="small" :bordered="false">
      <p class="mb-12px text-13px text-#6b7280">
        支持亚马逊、商业平台、私人地址、一件代发、中转业务混装同一海柜，按柜查看货件与渠道分布。
      </p>
      <NDataTable
        :columns="columns"
        :data="rows"
        :loading="loading"
        :scroll-x="900"
        size="small"
        :bordered="false"
      />
    </NCard>
    <ContainerDetailDrawer v-model:visible="detailVisible" :container-no="detailContainerNo" />
  </div>
</template>
