<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NSpin, NTable, NTag } from 'naive-ui';
import { fetchGetPortalContainerDetail } from '@/service/api/portal';
import { PORTAL_ORDER_CHANNEL_META } from '../../constants';

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{ containerNo: string | null }>();

const loading = ref(false);
const detail = ref<Api.Portal.PortalContainerDetail | null>(null);

async function loadDetail() {
  if (!props.containerNo) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetPortalContainerDetail(props.containerNo);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch([() => props.containerNo, visible], () => {
  if (visible.value) loadDetail();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="640" placement="right">
    <NDrawerContent :title="`海柜 ${containerNo || ''}`" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <NDescriptions :column="2" label-placement="left" size="small" bordered class="mb-16px">
            <NDescriptionsItem label="海柜号">{{ detail.containerNo }}</NDescriptionsItem>
            <NDescriptionsItem label="仓库">{{ detail.warehouseCode }}</NDescriptionsItem>
            <NDescriptionsItem label="装柜类型">{{ detail.loadingType === 'MIXED' ? '混装' : '整板' }}</NDescriptionsItem>
            <NDescriptionsItem label="货件数">{{ detail.cargoCount }}</NDescriptionsItem>
            <NDescriptionsItem label="状态">{{ detail.status }}</NDescriptionsItem>
            <NDescriptionsItem label="预计到仓">{{ detail.eta || '—' }}</NDescriptionsItem>
          </NDescriptions>

          <div class="mb-8px text-13px font-medium">渠道分布</div>
          <div class="mb-16px flex flex-wrap gap-6px">
            <NTag
              v-for="item in detail.channelBreakdown"
              :key="item.channel"
              size="small"
              :type="PORTAL_ORDER_CHANNEL_META[item.channel]?.type || 'default'"
            >
              {{ PORTAL_ORDER_CHANNEL_META[item.channel]?.label || item.channel }} × {{ item.count }}
            </NTag>
          </div>

          <div class="mb-8px text-13px font-medium">柜内货件</div>
          <NTable size="small" :single-line="false">
            <thead>
              <tr>
                <th>系统订单号</th>
                <th>客户订单号</th>
                <th>类型</th>
                <th>目的地</th>
                <th>板数</th>
                <th>库位</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in detail.cargoLines" :key="line.orderNo">
                <td>{{ line.orderNo }}</td>
                <td>{{ line.customerOrderNo }}</td>
                <td>
                  <NTag size="small" :type="PORTAL_ORDER_CHANNEL_META[line.orderChannel]?.type || 'default'">
                    {{ PORTAL_ORDER_CHANNEL_META[line.orderChannel]?.label }}
                  </NTag>
                </td>
                <td>{{ line.destination }}</td>
                <td>{{ line.palletQty }}</td>
                <td>{{ line.locationSummary }}</td>
                <td>{{ line.status }}</td>
              </tr>
            </tbody>
          </NTable>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
