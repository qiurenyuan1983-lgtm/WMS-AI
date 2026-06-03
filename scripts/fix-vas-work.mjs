import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, '../src/views/wms/vas-work/index.vue');

const content = `<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NSpace } from 'naive-ui';

defineOptions({ name: 'WmsVasWork' });

const route = useRoute();
const router = useRouter();

const taskNo = computed(() => String(route.query.taskNo || 'VAS-2026-0001'));
const operationOrderNo = computed(() => String(route.query.operationOrderNo || 'OP-2026-0001'));
const cargoOrderNo = computed(() => String(route.query.cargoOrderNo || 'CO-2026-0001'));
const customerName = computed(() => String(route.query.customerName || '\u6f14\u793a\u5ba2\u6237 A'));
const serviceType = computed(() => String(route.query.serviceType || 'LABEL'));
const qty = computed(() => String(route.query.qty || '100'));

const serviceTypeLabel: Record<string, string> = {
  LABEL: '\u8d34\u6807',
  REPACK: '\u6362\u5305',
  PHOTO: '\u62cd\u7167'
};
</script>

<template>
  <div class="p-16px">
    <NCard :title="\`\u589e\u503c\u4f5c\u4e1a - \${taskNo}\`">
      <NDescriptions bordered :column="2" class="mb-16px">
        <NDescriptionsItem label="\u4efb\u52a1\u53f7">{{ taskNo }}</NDescriptionsItem>
        <NDescriptionsItem label="\u6307\u4ee4\u5355\u53f7">{{ operationOrderNo }}</NDescriptionsItem>
        <NDescriptionsItem label="\u8ba2\u5355\u53f7">{{ cargoOrderNo }}</NDescriptionsItem>
        <NDescriptionsItem label="\u5ba2\u6237">{{ customerName }}</NDescriptionsItem>
        <NDescriptionsItem label="\u670d\u52a1\u7c7b\u578b">{{ serviceTypeLabel[serviceType] || serviceType }}</NDescriptionsItem>
        <NDescriptionsItem label="\u6570\u91cf">{{ qty }}</NDescriptionsItem>
      </NDescriptions>
      <NSpace size="large">
        <NButton type="primary" size="large">\u5f00\u59cb\u4f5c\u4e1a</NButton>
        <NButton size="large">\u4e0a\u4f20\u56fe\u7247</NButton>
        <NButton type="success" size="large">\u5b8c\u6210\u4f5c\u4e1a</NButton>
        <NButton @click="router.back()">\u8fd4\u56de</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
`;

fs.writeFileSync(target, content, 'utf8');
console.log('Fixed:', target);
