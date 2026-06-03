<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NSpace } from 'naive-ui';

defineOptions({ name: 'WmsStockPrepExec' });

const route = useRoute();
const router = useRouter();
</script>

<template>
  <div class="p-16px">
    <NCard :title="`备货执行 - ${route.query.orderNo || 'SP-2026-0001'}`">
      <NDescriptions bordered :column="2" class="mb-16px">
        <NDescriptionsItem label="出库单号">OB-2026-0001</NDescriptionsItem>
        <NDescriptionsItem label="客户">演示客户 A</NDescriptionsItem>
        <NDescriptionsItem label="托盘号">PLT-001</NDescriptionsItem>
        <NDescriptionsItem label="当前库位">A-01-01</NDescriptionsItem>
        <NDescriptionsItem label="目标备货区">STAGING-B</NDescriptionsItem>
      </NDescriptions>
      <NSpace size="large">
        <NButton type="primary" size="large">开始备货</NButton>
        <NButton type="success" size="large">确认到达备货区</NButton>
        <NButton type="warning" size="large">异常登记</NButton>
        <NButton @click="router.back()">返回</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
