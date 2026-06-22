<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NSpin,
  NTabPane,
  NTabs,
  NTable,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { fetchGetPortalOrderDetail } from '@/service/api/portal';
import { PORTAL_ORDER_CHANNEL_META, PORTAL_ORDER_STATUS_META } from '../../constants';
import { sanitizePortalCustomerStatus, type PortalCustomerOrderStatus } from '@/utils/portal/portal-order-status';

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{ orderId: number | null }>();

const loading = ref(false);
const detailTab = ref('basic');
const detail = ref<Api.Portal.PortalOrderDetail | null>(null);

const TIMELINESS_LABEL: Record<string, string> = {
  T: 'T（第一等级）',
  K: 'K（第二等级）',
  NORMAL_SHIP: '普船（第三等级）'
};

async function loadDetail() {
  if (!props.orderId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetPortalOrderDetail(props.orderId);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch([() => props.orderId, visible], () => {
  if (visible.value) {
    detailTab.value = 'basic';
    loadDetail();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="560" placement="right">
    <NDrawerContent title="订单详情" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <div class="mb-12px flex flex-wrap items-center gap-8px">
            <NTag size="small" :type="PORTAL_ORDER_CHANNEL_META[detail.orderChannel]?.type || 'default'">
              {{ PORTAL_ORDER_CHANNEL_META[detail.orderChannel]?.label || detail.orderChannel }}
            </NTag>
            <NTag
              size="small"
              :type="PORTAL_ORDER_STATUS_META[sanitizePortalCustomerStatus(detail.status) as PortalCustomerOrderStatus]?.type || 'default'"
            >
              {{ PORTAL_ORDER_STATUS_META[sanitizePortalCustomerStatus(detail.status) as PortalCustomerOrderStatus]?.label || detail.status }}
            </NTag>
          </div>

          <NTabs v-model:value="detailTab" type="line" size="small">
            <NTabPane name="basic" tab="基础信息" />
            <NTabPane name="cargo" :tab="`货物明细 (${detail.palletLines?.length || 0})`" />
            <NTabPane name="logs" tab="操作日志" />
          </NTabs>

          <div v-show="detailTab === 'basic'" class="mt-12px">
            <NDescriptions :column="1" label-placement="left" size="small" bordered>
              <NDescriptionsItem label="系统订单号">{{ detail.orderNo }}</NDescriptionsItem>
              <NDescriptionsItem label="客户订单号">{{ detail.customerOrderNo }}</NDescriptionsItem>
              <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
              <NDescriptionsItem label="海柜号">{{ detail.containerNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="仓库">{{ detail.warehouseCode || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="库位">{{ detail.locationSummary || '—' }}</NDescriptionsItem>
              <NDescriptionsItem v-if="detail.timelinessLevel" label="时效等级">
                {{ TIMELINESS_LABEL[detail.timelinessLevel] || detail.timelinessLevel }}
              </NDescriptionsItem>
              <NDescriptionsItem v-if="detail.fbaSku" label="FBA/SKU">{{ detail.fbaSku }}</NDescriptionsItem>
              <NDescriptionsItem v-if="detail.contactName" label="联系人">{{ detail.contactName }}</NDescriptionsItem>
              <NDescriptionsItem v-if="detail.remark" label="备注">{{ detail.remark }}</NDescriptionsItem>
            </NDescriptions>
          </div>

          <div v-show="detailTab === 'cargo'" class="mt-12px">
            <NTable v-if="detail.palletLines?.length" size="small" :single-line="false">
              <thead>
                <tr>
                  <th>卡板号</th>
                  <th>库位</th>
                  <th class="text-right">板数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in detail.palletLines" :key="line.palletNo">
                  <td>{{ line.palletNo }}</td>
                  <td>{{ line.locationCode }}</td>
                  <td class="text-right">{{ line.palletQty }}</td>
                </tr>
              </tbody>
            </NTable>
            <p v-else class="py-24px text-center text-13px text-#6b7280">暂无货物明细</p>
          </div>

          <div v-show="detailTab === 'logs'" class="mt-12px">
            <NTimeline v-if="detail.operationLogs?.length">
              <NTimelineItem
                v-for="(log, idx) in detail.operationLogs"
                :key="idx"
                :title="log.action"
                :time="log.time"
              >
                <div class="text-12px text-#6b7280">{{ log.operator }}</div>
                <div v-if="log.remark" class="text-12px">{{ log.remark }}</div>
              </NTimelineItem>
            </NTimeline>
            <p v-else class="py-24px text-center text-13px text-#6b7280">暂无操作日志</p>
          </div>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
