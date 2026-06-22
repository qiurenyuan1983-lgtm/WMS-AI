<script setup lang="ts">
import { ref, watch } from 'vue';
import { fetchGetTripOutboundPlanDetail } from '@/service/api/wms/outbound-mgmt';
import {
  CHECKIN_STATUS_META,
  DOCK_ASSIGN_STATUS_META,
  NOTIFY_STATUS_META,
  OUTBOUND_STATUS_META,
  TRIP_OP_STATUS_META
} from '../../outbound-mgmt/constants';

defineOptions({ name: 'TripPlanDetailPanel' });

const props = defineProps<{ tripId: CommonType.IdType | null }>();
const loading = ref(false);
const detail = ref<Api.Wms.TripOutboundPlanRow | null>(null);

async function load() {
  if (!props.tripId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetTripOutboundPlanDetail(props.tripId);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch(() => props.tripId, load, { immediate: true });

defineExpose({ reload: load });
</script>

<template>
  <NSpin :show="loading">
    <template v-if="detail">
      <div class="mb-8px text-15px font-600">{{ detail.tripNo }}</div>
      <NDescriptions :column="1" size="small" bordered label-placement="left">
        <NDescriptionsItem label="订单号">{{ detail.orderNos }}</NDescriptionsItem>
        <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
        <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
        <NDescriptionsItem label="预约时间">{{ detail.appointmentTime }}</NDescriptionsItem>
        <NDescriptionsItem label="板数/箱数">{{ detail.palletQty }} 板 / {{ detail.cartonQty }} 箱</NDescriptionsItem>
        <NDescriptionsItem label="车型">{{ detail.vehicleType }}</NDescriptionsItem>
        <NDescriptionsItem label="司机">{{ detail.driverName || '—' }}</NDescriptionsItem>
        <NDescriptionsItem label="车牌">{{ detail.plateNo || '—' }}</NDescriptionsItem>
        <NDescriptionsItem label="供应商">{{ detail.supplierName }}</NDescriptionsItem>
        <NDescriptionsItem label="通知状态">
          <NTag size="small" :type="NOTIFY_STATUS_META[detail.notifyStatus]?.type || 'default'">
            {{ NOTIFY_STATUS_META[detail.notifyStatus]?.label || detail.notifyStatus }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="Check-in">
          <NTag size="small" :type="CHECKIN_STATUS_META[detail.checkinStatus]?.type || 'default'">
            {{ CHECKIN_STATUS_META[detail.checkinStatus]?.label || detail.checkinStatus }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="DOCK">{{ detail.dockNo || '—' }}</NDescriptionsItem>
        <NDescriptionsItem label="操作状态">
          <NTag size="small" :type="TRIP_OP_STATUS_META[detail.operationStatus]?.type || 'default'">
            {{ TRIP_OP_STATUS_META[detail.operationStatus]?.label || detail.operationStatus }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="出库状态">
          <NTag size="small" :type="OUTBOUND_STATUS_META[detail.outboundStatus]?.type || 'default'">
            {{ OUTBOUND_STATUS_META[detail.outboundStatus]?.label || detail.outboundStatus }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="最晚开始装车">{{ detail.latestLoadStart }}</NDescriptionsItem>
        <NDescriptionsItem label="最晚完成">{{ detail.latestLoadFinish }}</NDescriptionsItem>
      </NDescriptions>

      <div class="mt-12px text-13px font-600">通知与操作日志</div>
      <NTimeline v-if="detail.logs.length" class="mt-8px">
        <NTimelineItem v-for="(log, idx) in detail.logs" :key="idx" :time="log.time">
          {{ log.operator }} · {{ log.action }}
        </NTimelineItem>
      </NTimeline>
      <NEmpty v-else class="mt-8px" description="暂无日志" size="small" />
    </template>
    <NEmpty v-else description="选择车次查看详情" />
  </NSpin>
</template>
