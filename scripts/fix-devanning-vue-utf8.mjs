/**
 * Fix garbled Chinese in devanning vue files (write via \\u only).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...codes) => codes.map(c => String.fromCharCode(c)).join('');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const listPath = path.join(root, 'src/views/wms/devanning-order/index.vue');
let list = fs.readFileSync(listPath, 'utf8');

list = list.replace(/return code \|\| '[^']*';/g, `return code || '${u(0x2014)}';`);

const actionLabelsBlock = `  const actionLabels: Record<string, string> = {
    confirmPickup: '${u(0x786e, 0x8ba4, 0x63d0, 0x67dc)}',
    confirmArrival: '${u(0x5230, 0x4ed3, 0x767b, 0x8bb0)}',
    startDevanning: '${u(0x5f00, 0x59cb, 0x62c6, 0x67dc)}',
    completeDevanning: '${u(0x5b8c, 0x6210, 0x62c6, 0x67dc)}',
    markException: '${u(0x6807, 0x8bb0, 0x5f02, 0x5e38)}',
    clearException: '${u(0x89e3, 0x9664, 0x5f02, 0x5e38)}',
    cancel: '${u(0x53d6, 0x6d88)}'
  };`;

list = list.replace(
  /  const actionLabels: Record<string, string> = \{[\s\S]*?\};/,
  actionLabelsBlock
);

list = list.replace(
  /\(res\.error as Error\)\?\.message \|\| '[^']*'/,
  `(res.error as Error)?.message || '${u(0x64cd, 0x4f5c, 0x5931, 0x8d25)}'`
);
list = list.replace(
  /e\?\.message \|\| '[^']*'/,
  `e?.message || '${u(0x64cd, 0x4f5c, 0x5931, 0x8d25)}'`
);
list = list.replace(
  /window\.\$message\?\.success\(`\[.*?\] \$\{actionLabels\[key\] \|\| key\} .*?`\);/,
  `window.$message?.success(\`[${u(0x539f, 0x578b)}] \${actionLabels[key] || key} ${u(0x6210, 0x529f)}\`);`
);

if (!list.includes('stopPropagation')) {
  list = list.replace(
    '<NButton size="tiny">²Ù×÷</NButton>',
    `<NButton size="tiny" onClick={(e: MouseEvent) => e.stopPropagation()}>${u(0x64cd, 0x4f5c)}</NButton>`
  );
}

fs.writeFileSync(listPath, list, 'utf8');

const detailPath = path.join(root, 'src/views/wms/devanning-order-detail/index.vue');
const detail = `<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NDescriptions, NDescriptionsItem, NTabPane, NTabs, NTag } from 'naive-ui';
import { request } from '@/service/request';
import { isMockMode } from '@/mock';

defineOptions({ name: 'WmsDevanningOrderDetail' });

const STATUS_LABEL: Record<string, string> = {
  UNPICKEDUP: '${u(0x672a, 0x63d0, 0x67dc)}',
  PICKEDUP: '${u(0x5df2, 0x63d0, 0x67dc)}',
  ARRIVED: '${u(0x5df2, 0x5230, 0x4ed3)}',
  DEVANNING: '${u(0x62c6, 0x67dc, 0x4e2d)}',
  DEVANNED: '${u(0x62c6, 0x67dc, 0x5b8c, 0x6210)}',
  EXCEPTION: '${u(0x5f02, 0x5e38)}',
  CANCELLED: '${u(0x53d6, 0x6d88)}'
};

const STATUS_TAG: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  UNPICKEDUP: 'default',
  PICKEDUP: 'info',
  ARRIVED: 'warning',
  DEVANNING: 'warning',
  DEVANNED: 'success',
  EXCEPTION: 'error',
  CANCELLED: 'default'
};

const route = useRoute();
const router = useRouter();
const detail = ref<Record<string, any>>({});
const shipments = ref<any[]>([]);
const pallets = ref([
  { palletNo: 'PLT-001', boxQty: 40, status: '${u(0x5728, 0x5e93)}' },
  { palletNo: 'PLT-002', boxQty: 35, status: '${u(0x5df2, 0x51fa, 0x5e93)}' }
]);

const statusText = computed(() => STATUS_LABEL[detail.value.status] || detail.value.status || '${u(0x2014)}');

onMounted(async () => {
  const res = await request<any>({
    url: '/wms/devanning-order/detail',
    method: 'get',
    params: { id: route.query.id }
  });
  detail.value = res?.data || res || {};
  shipments.value = [
    { so: 'SO-001', shipment: 'SHP-001', boxQty: 120, weight: 1500, cbm: 12.5 },
    { so: 'SO-002', shipment: 'SHP-002', boxQty: 80, weight: 900, cbm: 8.2 }
  ];
});

function goWork() {
  router.push({ name: 'wms_devanning-work', query: { containerNo: detail.value.containerNo } });
}
</script>

<template>
  <div class="p-16px">
    <NCard title="${u(0x62c6, 0x67dc, 0x8ba2, 0x5355, 0x8be6, 0x60c5)}" :bordered="false">
      <template #header-extra>
        <NTag v-if="detail.status" size="small" :type="STATUS_TAG[detail.status] || 'default'" class="mr-8px">{{ statusText }}</NTag>
        <NButton type="primary" @click="goWork">${u(0x8fdb, 0x5165, 0x62c6, 0x67dc, 0x4f5c, 0x4e1a)}</NButton>
        <NButton class="ml-8px" @click="router.back()">${u(0x8fd4, 0x56de)}</NButton>
      </template>
      <NTabs type="line">
        <NTabPane name="base" tab="${u(0x57fa, 0x7840, 0x4fe1, 0x606f)}">
          <NDescriptions :column="2" bordered label-placement="left" class="mt-12px">
            <NDescriptionsItem label="${u(0x67dc, 0x53f7)}">{{ detail.containerNo || route.query.id }}</NDescriptionsItem>
            <NDescriptionsItem label="${u(0x63d0, 0x5355, 0x53f7)}">{{ detail.blNo || 'BL202605001' }}</NDescriptionsItem>
            <NDescriptionsItem label="${u(0x5ba2, 0x6237)}">{{ detail.customerName || '${u(0x2014)}' }}</NDescriptionsItem>
            <NDescriptionsItem label="ETA">{{ detail.eta || detail.etaWarehouseTime || '${u(0x2014)}' }}</NDescriptionsItem>
            <NDescriptionsItem label="${u(0x4ed3, 0x5e93)}">{{ detail.warehouseName || (isMockMode() ? '${u(0x6d1b, 0x6749, 0x77f3, 0x4e00, 0x53f7, 0x4ed3)}' : '${u(0x2014)}') }}</NDescriptionsItem>
            <NDescriptionsItem label="${u(0x8fdb, 0x5ea6)}">
              <NTag type="warning">{{ detail.progress ?? 0 }}%</NTag>
            </NDescriptionsItem>
          </NDescriptions>
        </NTabPane>
        <NTabPane name="cargo" tab="${u(0x8d27, 0x4ef6, 0x4fe1, 0x606f)}">
          <NDataTable class="mt-12px" :columns="[
            { title: 'SO', key: 'so' },
            { title: 'Shipment', key: 'shipment' },
            { title: '${u(0x7bb1, 0x6570)}', key: 'boxQty' },
            { title: '${u(0x91cd, 0x91cf)}', key: 'weight' },
            { title: '${u(0x4f53, 0x79ef)}', key: 'cbm' }
          ]" :data="shipments" size="small" />
        </NTabPane>
        <NTabPane name="pallet" tab="${u(0x6258, 0x76d8, 0x4fe1, 0x606f)}">
          <NDataTable class="mt-12px" :columns="[
            { title: '${u(0x6258, 0x76d8, 0x53f7)}', key: 'palletNo' },
            { title: '${u(0x7bb1, 0x6570)}', key: 'boxQty' },
            { title: '${u(0x72b6, 0x6001)}', key: 'status' }
          ]" :data="pallets" size="small" />
        </NTabPane>
        <NTabPane name="attach" tab="${u(0x9644, 0x4ef6)}">
          <p class="text-gray mt-12px">DO${u(0x6587, 0x4ef6)}${u(0x3001)}${u(0x56fe, 0x7247)}${u(0xff08, 0x539f, 0x578b, 0x5360, 0x4f4d)}${u(0xff09)}</p>
        </NTabPane>
        <NTabPane name="log" tab="${u(0x64cd, 0x4f5c, 0x65e5, 0x5fd7)}">
          <p class="text-gray mt-12px">2026-05-28 09:00 ${u(0x5f00, 0x59cb, 0x62c6, 0x67dc)}</p>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>
`;

fs.writeFileSync(detailPath, detail, 'utf8');
console.log('fixed devanning vue utf8');
