<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchGetOrderWorkbenchDetail } from '@/service/api/oms/order-workbench';
import { CARGO_OPERATION_STATUS_META, type CargoOperationStatus } from '@/utils/oms/operation-status';
import { STATUS_META, WORKFLOW_STEPS } from '../constants';

defineOptions({ name: 'PlatformOrderDetailDrawer' });

const props = defineProps<{
  orderId: CommonType.IdType | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const detail = ref<Api.Oms.OrderWorkbenchDetail | null>(null);
const detailTab = ref('basic');

const drawerTitle = computed(() =>
  detail.value?.orderNo ? `平台预约订单 · ${detail.value.orderNo}` : '平台预约订单'
);

const statusMeta = computed(() => {
  const s = detail.value?.status;
  return s ? STATUS_META[s] : null;
});

const qtyLabel = computed(() => {
  const d = detail.value;
  if (!d) return '—';
  return `${d.palletQty} 板${d.cartonQty ? ` / ${d.cartonQty} 箱` : ''}`;
});

async function loadDetail() {
  if (!props.orderId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetOrderWorkbenchDetail(props.orderId);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [visible.value, props.orderId] as const,
  ([show, id]) => {
    if (show && id) {
      detailTab.value = 'basic';
      loadDetail();
    }
    if (!show) detail.value = null;
  }
);
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="720" class="max-w-98%">
    <NDrawerContent :title="drawerTitle" :native-scrollbar="true" closable>
      <template #header-extra>
        <NSpace v-if="detail" :size="8" align="center">
          <NTag v-if="statusMeta" size="small" :type="statusMeta.type">{{ statusMeta.label }}</NTag>
          <NTag size="small" type="info" :bordered="false">{{ detail.platform || '平台' }}</NTag>
          <NButton size="small" :loading="loading" @click="loadDetail">刷新</NButton>
        </NSpace>
      </template>

      <NSpin :show="loading">
        <template v-if="detail">
          <NSteps :current="Math.max(0, detail.workflowStep - 1)" size="small" class="mb-12px">
            <NStep v-for="step in WORKFLOW_STEPS" :key="step" :title="step" />
          </NSteps>

          <NTabs v-model:value="detailTab" type="line" size="small">
            <NTabPane name="basic" tab="基础信息" />
            <NTabPane name="cargo" :tab="`货物明细 (${detail.cargoItems.length})`" />
            <NTabPane name="logs" tab="操作日志" />
          </NTabs>

          <div v-show="detailTab === 'basic'" class="detail-body">
            <NDescriptions :column="2" size="small" bordered label-placement="left">
              <NDescriptionsItem label="订单号">{{ detail.orderNo }}</NDescriptionsItem>
              <NDescriptionsItem label="订单类型">{{ detail.orderTypeLabel }}</NDescriptionsItem>
              <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
              <NDescriptionsItem label="平台">{{ detail.platform || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
              <NDescriptionsItem v-if="detail.isaNo" label="ISA号">{{ detail.isaNo }}</NDescriptionsItem>
              <NDescriptionsItem label="预约时间">{{ detail.appointmentTime || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="装载方式">{{ detail.loadingMethod || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="板数/箱数">{{ qtyLabel }}</NDescriptionsItem>
              <NDescriptionsItem label="操作状态">
                <NTag
                  v-if="detail.operationStatus"
                  size="small"
                  :type="CARGO_OPERATION_STATUS_META[detail.operationStatus as CargoOperationStatus]?.type || 'default'"
                >
                  {{ CARGO_OPERATION_STATUS_META[detail.operationStatus as CargoOperationStatus]?.label || detail.operationStatus }}
                </NTag>
                <span v-else>—</span>
              </NDescriptionsItem>
              <NDescriptionsItem label="重量(KG)">{{ detail.weightKg != null ? detail.weightKg.toFixed(1) : '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="CBM">{{ detail.volumeCbm != null ? Number(detail.volumeCbm).toFixed(2) : '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="卡板尺寸">{{ detail.palletSize || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="创建时间">{{ detail.createTime }}</NDescriptionsItem>
            </NDescriptions>

            <NCard title="预约信息" size="small" :bordered="false" class="card-wrapper mt-12px">
              <NDescriptions :column="2" size="small" bordered label-placement="left">
                <NDescriptionsItem label="预约仓库">{{ detail.destination }}</NDescriptionsItem>
                <NDescriptionsItem label="仓库地址">{{ detail.warehouseAddress || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="预车次号">{{ detail.preTripNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="DOCK">{{ detail.dockNo || '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <NCard v-if="detail.preTripNo" title="车次信息" size="small" :bordered="false" class="card-wrapper mt-12px">
              <NDescriptions :column="2" size="small" bordered label-placement="left">
                <NDescriptionsItem label="预车次号">{{ detail.preTripNo }}</NDescriptionsItem>
                <NDescriptionsItem label="车型">{{ detail.vehicleType || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="DOCK">{{ detail.dockNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="司机">{{ detail.driverName || '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </div>

          <div v-show="detailTab === 'cargo'" class="detail-body">
            <NDataTable
              v-if="detail.cargoItems.length"
              size="small"
              :columns="[
                { key: 'palletNo', title: '卡板号', width: 120 },
                { key: 'cargoName', title: '货物', ellipsis: { tooltip: true } },
                { key: 'palletQty', title: '板', width: 50 },
                { key: 'cartonQty', title: '箱', width: 50 },
                { key: 'locationCode', title: '库位', width: 80 }
              ]"
              :data="detail.cargoItems"
            />
            <NEmpty v-else description="暂无货物" class="py-24px" />
          </div>

          <div v-show="detailTab === 'logs'" class="detail-body">
            <NTimeline>
              <NTimelineItem v-for="log in detail.logs" :key="log.id" :title="log.action" :time="log.time">
                <div class="text-12px">{{ log.operator }} · {{ log.status }}</div>
              </NTimelineItem>
            </NTimeline>
          </div>
        </template>
        <NEmpty v-else-if="!loading" description="未找到平台预约订单" class="py-80px" />
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
.detail-body {
  margin-top: 8px;
  padding-right: 4px;
}
</style>
