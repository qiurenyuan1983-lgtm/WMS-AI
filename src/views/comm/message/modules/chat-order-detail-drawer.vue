<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NEmpty, NSpin, NTabPane, NTabs, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetCommOrderDetail } from '@/service/api/comm';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  orderNo?: string | null;
}>();

const loading = ref(false);
const detail = ref<Api.Comm.CommOrderDetail | null>(null);
const activeTab = ref('basic');

async function loadDetail() {
  if (!props.orderNo) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data } = await fetchGetCommOrderDetail(props.orderNo);
  loading.value = false;
  detail.value = data ?? null;
}

watch(
  () => props.orderNo,
  () => {
    if (visible.value) loadDetail();
  }
);

watch(visible, open => {
  if (open) {
    activeTab.value = 'basic';
    loadDetail();
  }
});

function statusTagType(status?: string) {
  if (!status) return 'default' as const;
  if (status.includes('待')) return 'warning' as const;
  if (status.includes('已') || status.includes('完成') || status.includes('确认')) return 'success' as const;
  return 'info' as const;
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="520" placement="right" :to="POPUP_TO_BODY">
    <NDrawerContent :title="detail ? `订单详情 · ${detail.orderNo}` : '订单详情'" closable>
      <NSpin :show="loading">
        <NEmpty v-if="!loading && !detail" description="未找到订单详情" class="py-40px" />
        <template v-else-if="detail">
          <div class="detail-header">
            <div class="detail-title">{{ detail.customerName }}</div>
            <NTag :type="statusTagType(detail.status)" size="small">{{ detail.status }}</NTag>
          </div>

          <NTabs v-model:value="activeTab" type="line" size="small" class="detail-tabs">
            <NTabPane name="basic" tab="基础信息">
              <NDescriptions :column="1" label-placement="left" bordered size="small">
                <NDescriptionsItem label="订单号">{{ detail.orderNo }}</NDescriptionsItem>
                <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
                <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
                <NDescriptionsItem label="海柜客服">{{ detail.containerCs }}</NDescriptionsItem>
                <NDescriptionsItem label="仓库">{{ detail.warehouse || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="库位">{{ detail.locationCodes || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="板数">{{ detail.palletQty }}</NDescriptionsItem>
                <NDescriptionsItem label="箱数">{{ detail.cartonQty ?? '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="重量(kg)">{{ detail.weightKg ?? '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="体积(CBM)">{{ detail.volumeCbm ?? '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="入库时间">{{ detail.inboundTime || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="ISA 状态">{{ detail.isaStatus || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="预约时间">{{ detail.appointmentTime || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="异常">{{ detail.exceptionStatus || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="账单">{{ detail.billStatus || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="备注">{{ detail.remark || '--' }}</NDescriptionsItem>
              </NDescriptions>
            </NTabPane>

            <NTabPane name="timeline" tab="跟进记录">
              <div v-if="detail.timeline?.length" class="timeline-list">
                <div v-for="(item, index) in detail.timeline" :key="index" class="timeline-item">
                  <div class="timeline-time">{{ item.time }}</div>
                  <div class="timeline-event">{{ item.event }}</div>
                  <div v-if="item.operator" class="timeline-operator">{{ item.operator }}</div>
                </div>
              </div>
              <NEmpty v-else description="暂无跟进记录" class="py-24px" />
            </NTabPane>
          </NTabs>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.detail-tabs {
  margin-top: 4px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.timeline-time {
  font-size: 12px;
  color: #6b7280;
}

.timeline-event {
  margin-top: 4px;
  font-size: 13px;
  color: #111827;
  font-weight: 500;
}

.timeline-operator {
  margin-top: 2px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
