import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/wms/outbound-exec/index.vue');

const content = `<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NInput, NSpace } from 'naive-ui';

defineOptions({ name: 'WmsOutboundExec' });

const route = useRoute();
const router = useRouter();
const scanPallet = ref('');
const scanned = ref<Array<{ palletNo: string; status: string }>>([]);

const outboundOrderNo = (route.query.outboundOrderNo as string) || 'WOB-2026-0001';

function scanPalletAction() {
  const v = scanPallet.value.trim();
  if (!v) {
    window.$message?.warning('${'\u8bf7\u8f93\u5165\u6216\u626b\u63cf\u6258\u76d8\u53f7'}');
    return;
  }
  if (scanned.value.some(p => p.palletNo === v)) {
    window.$message?.warning('${'\u8be5\u6258\u76d8\u5df2\u626b\u63cf'}');
    return;
  }
  scanned.value.push({ palletNo: v, status: '${'\u5f85\u590d\u6838'}' });
  scanPallet.value = '';
}

function reviewAll() {
  scanned.value = scanned.value.map(p => ({ ...p, status: '${'\u5df2\u590d\u6838'}' }));
  window.$message?.success('[${'\u539f\u578b'}] ${'\u590d\u6838\u5b8c\u6210'}');
}

function completeOutbound() {
  if (!scanned.value.length) {
    window.$message?.warning('${'\u8bf7\u5148\u626b\u63cf\u6258\u76d8'}');
    return;
  }
  window.$message?.success(\`[${'\u539f\u578b'}] ${'\u51fa\u5e93\u5355'} \${outboundOrderNo} ${'\u5df2\u5b8c\u6210\uff0c\u5171'} \${scanned.value.length} ${'\u677f'}\`);
}
</script>

<template>
  <div class="p-16px">
    <NCard title="${'\u51fa\u5e93\u6267\u884c'}">
      <p class="mb-8px">
        ${'\u51fa\u5e93\u5355\u53f7'}\uff1a{{ outboundOrderNo }} \uff5c ${'\u5ba2\u6237'}\uff1a${'\u6f14\u793a\u5ba2\u6237 A'}
      </p>
      <NSpace class="mb-12px">
        <NInput
          v-model:value="scanPallet"
          size="large"
          placeholder="${'\u626b\u63cf\u6258\u76d8\u53f7'}"
          class="max-w-320px"
          @keyup.enter="scanPalletAction"
        />
        <NButton type="primary" size="large" @click="scanPalletAction">${'\u626b\u63cf\u6258\u76d8'}</NButton>
      </NSpace>
      <NDataTable
        size="small"
        :data="scanned"
        :columns="[
          { title: '${'\u6258\u76d8\u53f7'}', key: 'palletNo' },
          { title: '${'\u72b6\u6001'}', key: 'status' }
        ]"
      />
      <NSpace class="mt-16px" size="large">
        <NButton size="large" @click="reviewAll">${'\u590d\u6838'}</NButton>
        <NButton type="info" size="large" @click="router.push({ name: 'wms_outbound-loading' })">${'\u88c5\u8f66\u786e\u8ba4'}</NButton>
        <NButton type="success" size="large" @click="completeOutbound">${'\u5b8c\u6210\u51fa\u5e93'}</NButton>
        <NButton @click="router.back()">${'\u8fd4\u56de'}</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
`;

fs.writeFileSync(file, content, 'utf8');
console.log('wrote outbound-exec');
