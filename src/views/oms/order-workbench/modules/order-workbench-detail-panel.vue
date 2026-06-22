<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { STATUS_META, WORKFLOW_STEPS } from '../constants';
import { buildLocationSummaryFromPallets } from '@/utils/portal/location-summary';

const props = defineProps<{
  detail: Api.Oms.OrderWorkbenchDetail | null;
  loading?: boolean;
}>();

const detailTab = ref('basic');

watch(
  () => props.detail?.id,
  () => {
    detailTab.value = 'basic';
  }
);

const statusMeta = computed(() => {
  const s = props.detail?.status;
  return s ? STATUS_META[s] : null;
});

const qtyLabel = computed(() => {
  const d = props.detail;
  if (!d) return '—';
  if (d.pool === 'EXPRESS') return `${d.cartonQty} 箱`;
  return `${d.palletQty} 板${d.cartonQty ? ` / ${d.cartonQty} 箱` : ''}`;
});

const locationSummary = computed(() => {
  const items = props.detail?.cargoItems;
  if (!items?.length) return '—';
  return buildLocationSummaryFromPallets(
    items.map(item => ({ locationCode: item.locationCode, palletQty: item.palletQty || 1 }))
  );
});

</script>

<template>
  <div class="detail-panel">
    <NEmpty v-if="!detail && !loading" description="请选择订单查看详情" class="py-80px" />
    <NSpin v-else :show="loading" class="detail-spin">
      <template v-if="detail">
        <div class="detail-head">
          <div>
            <div class="detail-title">{{ detail.orderNo }}</div>
            <div class="text-12px text-#6b7280">{{ detail.orderTypeLabel }}</div>
          </div>
          <NTag v-if="statusMeta" :type="statusMeta.type" size="small">{{ statusMeta.label }}</NTag>
        </div>

        <NSteps :current="Math.max(0, detail.workflowStep - 1)" size="small" class="mb-12px">
          <NStep v-for="step in WORKFLOW_STEPS" :key="step" :title="step" />
        </NSteps>

        <NTabs v-model:value="detailTab" type="line" size="small">
          <NTabPane name="basic" tab="基础信息" />
          <NTabPane name="cargo" :tab="`货物明细 (${detail.cargoItems.length})`" />
          <NTabPane name="logs" tab="操作日志" />
        </NTabs>

        <div v-show="detailTab === 'basic'" class="detail-body">
          <NDescriptions :column="1" size="small" bordered label-placement="left">
            <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
            <NDescriptionsItem label="平台">{{ detail.platform || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
            <NDescriptionsItem v-if="detail.isaNo" label="ISA号">{{ detail.isaNo }}</NDescriptionsItem>
            <NDescriptionsItem label="预约时间">{{ detail.appointmentTime || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="装载方式">{{ detail.loadingMethod || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="板数/箱数">{{ qtyLabel }}</NDescriptionsItem>
            <NDescriptionsItem label="库位汇总">{{ locationSummary }}</NDescriptionsItem>
            <NDescriptionsItem v-if="detail.weightLbs" label="重量">{{ detail.weightLbs }} lbs</NDescriptionsItem>
            <NDescriptionsItem v-if="detail.volumeCbm" label="体积">{{ detail.volumeCbm }} CBM</NDescriptionsItem>
          </NDescriptions>

          <div v-if="detail.pool === 'PLATFORM' || detail.warehouseAddress" class="section-card">
            <div class="section-title">预约信息</div>
            <NDescriptions :column="1" size="small">
              <NDescriptionsItem label="预约仓库">{{ detail.destination }}</NDescriptionsItem>
              <NDescriptionsItem label="仓库地址">{{ detail.warehouseAddress || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="预车次号">{{ detail.preTripNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="DOCK">{{ detail.dockNo || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </div>

          <div v-if="detail.pool === 'LTL'" class="section-card">
            <div class="section-title">供应商信息</div>
            <NDescriptions :column="1" size="small">
              <NDescriptionsItem label="推荐供应商">{{ detail.supplierName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="报价">{{ detail.supplierQuote || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="PRO#">{{ detail.supplierProNo || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </div>

          <div v-if="detail.pool === 'LOCAL'" class="section-card">
            <div class="section-title">客户确认信息</div>
            <NDescriptions :column="1" size="small">
              <NDescriptionsItem label="联系人">{{ detail.contactName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="电话">{{ detail.contactPhone || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="邮件发送">{{ detail.emailSentTime || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="客户确认">
                <NTag :type="detail.customerConfirmed ? 'success' : 'warning'" size="tiny">
                  {{ detail.customerConfirmed ? '已确认' : '待确认' }}
                </NTag>
              </NDescriptionsItem>
            </NDescriptions>
          </div>

          <div v-if="detail.preTripNo" class="section-card">
            <div class="section-title">车次信息</div>
            <NDescriptions :column="1" size="small">
              <NDescriptionsItem label="预车次号">{{ detail.preTripNo }}</NDescriptionsItem>
              <NDescriptionsItem label="车型">{{ detail.vehicleType || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="DOCK">{{ detail.dockNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="司机">{{ detail.driverName || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </div>
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
          <NEmpty v-else description="暂无货物，请添加货物" class="py-24px" />
        </div>

        <div v-show="detailTab === 'logs'" class="detail-body">
          <NTimeline>
            <NTimelineItem v-for="log in detail.logs" :key="log.id" :title="log.action" :time="log.time">
              <div class="text-12px">{{ log.operator }} · {{ log.status }}</div>
            </NTimelineItem>
          </NTimeline>
        </div>

      </template>
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-left: 1px solid var(--n-border-color);
  background: rgb(var(--container-bg-color));
}

.detail-spin {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 12px;

  :deep(.n-spin-content) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.detail-title {
  font-size: 15px;
  font-weight: 700;
}

.detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: 8px;
  padding-right: 4px;
}

.section-card {
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.section-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

</style>
