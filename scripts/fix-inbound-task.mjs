import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, '../src/views/wms/inbound-task/index.vue');

const content = `<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NInput, NSpace, NTag } from 'naive-ui';

defineOptions({ name: 'WmsInboundTask' });

const route = useRoute();
const router = useRouter();

const palletNo = ref(String(route.query.palletNo || 'PLT-IN-2026-001'));
const scanInput = ref('');

const inboundNo = computed(() => String(route.query.inboundNo || 'IN-2026-0001'));
const containerNo = computed(() => String(route.query.containerNo || 'MSCU1234567'));
const groupCode = computed(() => String(route.query.groupCode || 'FedEx-LAX'));

const recommendLocation = computed(() => {
  const fromQuery = route.query.recommendLocation;
  if (fromQuery) return String(fromQuery);
  if (palletNo.value.endsWith('004') || palletNo.value.endsWith('005')) return 'B-01-02';
  if (palletNo.value.endsWith('003')) return 'A-02-04';
  return 'A-02-03';
});

const palletInfo = computed(() => ({
  palletNo: palletNo.value,
  boxQty: palletNo.value.endsWith('003') ? 45 : palletNo.value.endsWith('002') ? 35 : palletNo.value.endsWith('004') ? 28 : palletNo.value.endsWith('005') ? 32 : 40,
  weight: palletNo.value.endsWith('003') ? 580 : palletNo.value.endsWith('002') ? 455 : palletNo.value.endsWith('004') ? 360 : palletNo.value.endsWith('005') ? 410 : 520,
  recommendLocation: recommendLocation.value,
  status: 'PENDING'
}));

function applyScan() {
  const v = scanInput.value.trim();
  if (!v) return;
  palletNo.value = v;
  scanInput.value = '';
  window.$message?.success(\`[\u539f\u578b] \u5df2\u5207\u6362\u5230\u5361\u677f \${v}\`);
}

function confirmInbound() {
  window.$message?.success(\`[\u539f\u578b] \u5361\u677f \${palletNo.value} \u5165\u5e93\u5b8c\u6210\uff0c\u5c06\u6309\u63a8\u8350\u5e93\u4f4d \${recommendLocation.value} \u8fdb\u5165\u4e0a\u67b6\u4efb\u52a1\`);
}
</script>

<template>
  <div class="p-16px">
    <NCard :title="\`\u5361\u677f\u5165\u5e93 - \${palletNo}\`">
      <template #header-extra>
        <NButton @click="router.back()">\u8fd4\u56de</NButton>
      </template>
      <p class="mb-8px text-gray-500">
        \u5165\u5e93\u5355\u6309\u5361\u677f\u7ef4\u5ea6\u5904\u7406\uff1a\u5f85\u5165\u5e93\u5361\u677f\u5c55\u793a\u7cfb\u7edf\u63a8\u8350\u5e93\u4f4d\uff0c\u786e\u8ba4\u5165\u5e93\u540e\u7531\u4e0a\u67b6\u4efb\u52a1\u843d\u4f4d\u81f3\u8be5\u5e93\u4f4d
      </p>
      <NDescriptions :column="2" bordered label-placement="left" class="mb-16px">
        <NDescriptionsItem label="\u5165\u5e93\u6279\u6b21">{{ inboundNo }}</NDescriptionsItem>
        <NDescriptionsItem label="\u67dc\u53f7">{{ containerNo }}</NDescriptionsItem>
        <NDescriptionsItem label="\u5206\u7ec4">{{ groupCode }}</NDescriptionsItem>
        <NDescriptionsItem label="\u5361\u677f\u53f7">{{ palletInfo.palletNo }}</NDescriptionsItem>
        <NDescriptionsItem label="\u63a8\u8350\u5e93\u4f4d">{{ palletInfo.recommendLocation }}</NDescriptionsItem>
        <NDescriptionsItem label="\u7bb1\u6570">{{ palletInfo.boxQty }}</NDescriptionsItem>
        <NDescriptionsItem label="\u91cd\u91cf(kg)">{{ palletInfo.weight }}</NDescriptionsItem>
        <NDescriptionsItem label="\u72b6\u6001">
          <NTag type="warning" size="small">\u5f85\u5165\u5e93</NTag>
        </NDescriptionsItem>
      </NDescriptions>
      <NSpace class="mb-16px" align="center">
        <NInput
          v-model:value="scanInput"
          class="max-w-360px"
          placeholder="\u626b\u63cf\u6258\u76d8\u53f7\u5207\u6362\u5361\u677f"
          @keyup.enter="applyScan"
        />
        <NButton @click="applyScan">\u626b\u63cf\u786e\u8ba4</NButton>
      </NSpace>
      <NSpace>
        <NButton type="primary" size="large" @click="confirmInbound">\u786e\u8ba4\u672c\u677f\u5165\u5e93</NButton>
        <NButton size="large">\u6253\u5370\u5361\u677f\u6807\u7b7e</NButton>
        <NButton type="warning" size="large">\u5f02\u5e38\u767b\u8bb0</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
`;

fs.writeFileSync(target, content, 'utf8');
console.log('Fixed:', target);
