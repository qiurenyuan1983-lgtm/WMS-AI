<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NInput, NSpace, NTag } from 'naive-ui';
import {
  fetchGetOutboundOrderList,
  fetchGetOutboundOrderItems
} from '@/service/api/oms/outbound-order';

defineOptions({ name: 'WmsOutboundExec' });

const route = useRoute();
const router = useRouter();
const scanPallet = ref('');
const scanned = ref<Array<{ palletNo: string; status: string }>>([]);
const loading = ref(false);

const outboundOrderNo = ref((route.query.outboundOrderNo as string) || 'TRIP250604001');
const tripCustomer = ref('—');
const tripDestination = ref('—');
const tripCargoOrders = ref<Api.Oms.OutboundOrderItem[]>([]);

async function loadTripContext() {
  loading.value = true;
  const { data: listRes } = await fetchGetOutboundOrderList({
    pageNum: 1,
    pageSize: 20,
    keyword: outboundOrderNo.value
  });
  const trip = listRes?.rows?.find(row => row.outboundOrderNo === outboundOrderNo.value) ?? listRes?.rows?.[0];
  if (!trip) {
    loading.value = false;
    return;
  }
  tripCustomer.value = trip.customerName || '—';
  tripDestination.value = trip.destination || '—';
  const { data: items } = await fetchGetOutboundOrderItems(trip.id);
  tripCargoOrders.value = items || [];
  loading.value = false;
}

function scanPalletAction() {
  const v = scanPallet.value.trim();
  if (!v) {
    window.$message?.warning('请输入或扫描托盘号');
    return;
  }
  if (scanned.value.some(p => p.palletNo === v)) {
    window.$message?.warning('该托盘已扫描');
    return;
  }
  scanned.value.push({ palletNo: v, status: '待复核' });
  scanPallet.value = '';
}

function reviewAll() {
  scanned.value = scanned.value.map(p => ({ ...p, status: '已复核' }));
  window.$message?.success('复核完成');
}

function completeOutbound() {
  if (!scanned.value.length) {
    window.$message?.warning('请先扫描托盘');
    return;
  }
  window.$message?.success(
    `车次 ${outboundOrderNo.value} 装车完成，共 ${scanned.value.length} 板 · 关联订单 ${tripCargoOrders.value.length} 单`
  );
}

onMounted(() => {
  loadTripContext();
});
</script>

<template>
  <div class="p-16px">
    <NCard title="装车执行">
      <p class="mb-8px">
        车次订单号：{{ outboundOrderNo }} ｜ 客户：{{ tripCustomer }} ｜ 目的地：{{ tripDestination }}
      </p>
      <div v-if="tripCargoOrders.length" class="mb-12px">
        <div class="mb-6px text-13px text-#6b7280">关联订单（{{ tripCargoOrders.length }}）</div>
        <NSpace size="small">
          <NTag v-for="item in tripCargoOrders" :key="item.id" type="info" size="small">
            {{ item.cargoOrderNo }} · {{ item.actualCartonQty }} 箱
          </NTag>
        </NSpace>
      </div>
      <NSpace class="mb-12px">
        <NInput
          v-model:value="scanPallet"
          size="large"
          placeholder="扫描托盘号"
          class="max-w-320px"
          @keyup.enter="scanPalletAction"
        />
        <NButton type="primary" size="large" @click="scanPalletAction">扫描托盘</NButton>
      </NSpace>
      <NDataTable
        size="small"
        :loading="loading"
        :data="scanned"
        :columns="[
          { title: '托盘号', key: 'palletNo' },
          { title: '状态', key: 'status' }
        ]"
      />
      <NSpace class="mt-16px" size="large">
        <NButton size="large" @click="reviewAll">复核</NButton>
        <NButton type="info" size="large" @click="router.push({ name: 'wms_outbound-loading' })">装车确认</NButton>
        <NButton type="success" size="large" @click="completeOutbound">完成出库</NButton>
        <NButton @click="router.back()">返回</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
