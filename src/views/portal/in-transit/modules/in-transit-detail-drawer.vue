<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NSpin, NTable, NTag } from 'naive-ui';
import { fetchGetPortalInTransitDetail } from '@/service/api/portal';

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{ transitId: number | null }>();

const loading = ref(false);
const detail = ref<Api.Portal.PortalInTransitDetail | null>(null);

async function loadDetail() {
  if (!props.transitId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetPortalInTransitDetail(props.transitId);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch([() => props.transitId, visible], () => {
  if (visible.value) loadDetail();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="560" placement="right">
    <NDrawerContent :title="detail ? detail.refNo : '在途详情'" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <NDescriptions :column="1" label-placement="left" size="small" bordered>
            <NDescriptionsItem label="类型">{{ detail.refType === 'TRUCK' ? '车次' : '海柜' }}</NDescriptionsItem>
            <NDescriptionsItem label="路线">{{ detail.route }}</NDescriptionsItem>
            <NDescriptionsItem label="状态">{{ detail.statusLabel }}</NDescriptionsItem>
            <NDescriptionsItem label="GPS">{{ detail.gpsStatusLabel }}</NDescriptionsItem>
            <NDescriptionsItem label="最新位置">{{ detail.lastLocation }}</NDescriptionsItem>
            <NDescriptionsItem label="预计到达">{{ detail.eta || '—' }}</NDescriptionsItem>
            <NDescriptionsItem v-if="detail.driverName" label="司机">{{ detail.driverName }}</NDescriptionsItem>
          </NDescriptions>

          <div class="mt-16px text-13px font-medium">关联订单</div>
          <div class="mt-8px flex flex-wrap gap-6px">
            <NTag v-for="no in detail.relatedOrders" :key="no" size="small" type="info">{{ no }}</NTag>
          </div>

          <div class="mt-16px rounded-8px bg-#f3f4f6 p-12px text-12px text-#6b7280">
            地图追踪（原型占位）：{{ detail.lastLocation }}
          </div>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
