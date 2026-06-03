<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NSpace } from 'naive-ui';

defineOptions({ name: 'WmsVasWork' });

const route = useRoute();
const router = useRouter();

const taskNo = computed(() => String(route.query.taskNo || 'VAS-2026-0001'));
const operationOrderNo = computed(() => String(route.query.operationOrderNo || 'OP-2026-0001'));
const cargoOrderNo = computed(() => String(route.query.cargoOrderNo || 'CO-2026-0001'));
const customerName = computed(() => String(route.query.customerName || '演示客户 A'));
const serviceType = computed(() => String(route.query.serviceType || 'LABEL'));
const qty = computed(() => String(route.query.qty || '100'));

const serviceTypeLabel: Record<string, string> = {
  LABEL: '贴标',
  REPACK: '换包',
  PHOTO: '拍照'
};
</script>

<template>
  <div class="p-16px">
    <NCard :title="`增值作业 - ${taskNo}`">
      <NDescriptions bordered :column="2" class="mb-16px">
        <NDescriptionsItem label="任务号">{{ taskNo }}</NDescriptionsItem>
        <NDescriptionsItem label="指令单号">{{ operationOrderNo }}</NDescriptionsItem>
        <NDescriptionsItem label="订单号">{{ cargoOrderNo }}</NDescriptionsItem>
        <NDescriptionsItem label="客户">{{ customerName }}</NDescriptionsItem>
        <NDescriptionsItem label="服务类型">{{ serviceTypeLabel[serviceType] || serviceType }}</NDescriptionsItem>
        <NDescriptionsItem label="数量">{{ qty }}</NDescriptionsItem>
      </NDescriptions>
      <NSpace size="large">
        <NButton type="primary" size="large">开始作业</NButton>
        <NButton size="large">上传图片</NButton>
        <NButton type="success" size="large">完成作业</NButton>
        <NButton @click="router.back()">返回</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
