/**
 * Patch devanning-order list + detail (UTF-8 safe via \\u escapes).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const listPath = path.join(root, 'src/views/wms/devanning-order/index.vue');
let list = fs.readFileSync(listPath, 'utf8');

list = list.replace(
  /function statusLabel\(code: string\) \{[\s\S]*?return STATUS_LABEL\[code\] \|\| code;\n\}/,
  `function statusLabel(code: string) {
  const mapped = STATUS_LABEL[code];
  if (mapped) return mapped;
  const fromDict = statusRecord.value[code]?.dictLabel;
  if (fromDict && !isGarbledLabel(fromDict)) return fromDict;
  return code || '—';
}`
);

list = list.replace(
  /function methodLabel\(code: string\) \{[\s\S]*?return METHOD_LABEL\[code\] \|\| code;\n\}/,
  `function methodLabel(code: string) {
  const mapped = METHOD_LABEL[code];
  if (mapped) return mapped;
  const fromDict = methodRecord.value[code]?.dictLabel;
  if (fromDict && !isGarbledLabel(fromDict)) return fromDict;
  return code || '—';
}`
);

list = list.replace(
  /<NDropdown options=\{options\} onSelect=\{\(key: string\) => handleRowAction\(key, row\)\}>/,
  `<NDropdown trigger="click" options={options} onSelect={(key: string) => handleRowAction(String(key), row)}>`
);

list = list.replace(
  /<NButton size="tiny">操作<\/NButton>/,
  `<NButton size="tiny" onClick={(e: MouseEvent) => e.stopPropagation()}>操作</NButton>`
);

list = list.replace(
  /async function handleRowAction\(key: string, row: Api\.Wms\.DevanningOrder\) \{[\s\S]*?await getData\(\);\n\}/,
  `async function handleRowAction(key: string, row: Api.Wms.DevanningOrder) {
  if (key === 'view') {
    router.push({ name: 'wms_devanning-order-detail', query: { id: String(row.id) } });
    return;
  }
  if (key === 'work') {
    router.push({ name: 'wms_devanning-work', query: { containerNo: row.containerNo || '' } });
    return;
  }
  if (key === 'edit') {
    formModel.value = { ...row, version: row.version ?? null };
    openDrawer();
    return;
  }
  const actionKeys = [
    'confirmPickup',
    'confirmArrival',
    'startDevanning',
    'completeDevanning',
    'markException',
    'clearException',
    'cancel'
  ] as const;
  if (!actionKeys.includes(key as (typeof actionKeys)[number])) return;

  const id = row.id;
  const actionLabels: Record<string, string> = {
    confirmPickup: '确认提柜',
    confirmArrival: '到仓登记',
    startDevanning: '开始拆柜',
    completeDevanning: '完成拆柜',
    markException: '标记异常',
    clearException: '解除异常',
    cancel: '取消'
  };
  try {
    let res: { error: unknown } | null = null;
    if (key === 'confirmPickup') res = await fetchConfirmPickupDevanningOrder(id);
    if (key === 'confirmArrival') res = await fetchConfirmArrivalDevanningOrder(id);
    if (key === 'startDevanning') res = await fetchStartDevanningOrder(id);
    if (key === 'completeDevanning') res = await fetchCompleteDevanningOrder(id);
    if (key === 'markException') res = await fetchMarkExceptionDevanningOrder(id);
    if (key === 'clearException') res = await fetchClearExceptionDevanningOrder(id);
    if (key === 'cancel') res = await fetchCancelDevanningOrder(id);
    if (res?.error) {
      const msg = (res.error as Error)?.message || '操作失败';
      window.$message?.warning(msg);
      return;
    }
    window.$message?.success(\`[原型] \${actionLabels[key] || key} 成功\`);
    await getData();
  } catch (e: any) {
    window.$message?.warning(e?.message || '操作失败');
  }
}`
);

list = list.replace(
  /v-if="hasAuth\('wms:devanningOrder:add'\)"/g,
  `v-if="allowAuth('wms:devanningOrder:add')"`
);
list = list.replace(
  /:show-add="hasAuth\('wms:devanningOrder:add'\)"/,
  `:show-add="allowAuth('wms:devanningOrder:add')"`
);
list = list.replace(
  /:show-delete="hasAuth\('wms:devanningOrder:remove'\)"/,
  `:show-delete="allowAuth('wms:devanningOrder:remove')"`
);

fs.writeFileSync(listPath, list, 'utf8');

const detailVue = `<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NDescriptions, NDescriptionsItem, NTabPane, NTabs, NTag } from 'naive-ui';
import { request } from '@/service/request';
import { isMockMode } from '@/mock';

defineOptions({ name: 'WmsDevanningOrderDetail' });

const STATUS_LABEL: Record<string, string> = {
  UNPICKEDUP: '\\u672a\\u63d0\\u67dc',
  PICKEDUP: '\\u5df2\\u63d0\\u67dc',
  ARRIVED: '\\u5df2\\u5230\\u4ed3',
  DEVANNING: '\\u62c6\\u67dc\\u4e2d',
  DEVANNED: '\\u62c6\\u67dc\\u5b8c\\u6210',
  EXCEPTION: '\\u5f02\\u5e38',
  CANCELLED: '\\u53d6\\u6d88'
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
  { palletNo: 'PLT-001', boxQty: 40, status: '\\u5728\\u5e93' },
  { palletNo: 'PLT-002', boxQty: 35, status: '\\u5df2\\u51fa\\u5e93' }
]);

const statusText = computed(() => STATUS_LABEL[detail.value.status] || detail.value.status || '—');

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
    <NCard title="\\u62c6\\u67dc\\u8ba2\\u5355\\u8be6\\u60c5" :bordered="false">
      <template #header-extra>
        <NTag v-if="detail.status" size="small" :type="STATUS_TAG[detail.status] || 'default'" class="mr-8px">{{ statusText }}</NTag>
        <NButton type="primary" @click="goWork">\\u8fdb\\u5165\\u62c6\\u67dc\\u4f5c\\u4e1a</NButton>
        <NButton class="ml-8px" @click="router.back()">\\u8fd4\\u56de</NButton>
      </template>
      <NTabs type="line">
        <NTabPane name="base" tab="\\u57fa\\u7840\\u4fe1\\u606f">
          <NDescriptions :column="2" bordered label-placement="left" class="mt-12px">
            <NDescriptionsItem label="\\u67dc\\u53f7">{{ detail.containerNo || route.query.id }}</NDescriptionsItem>
            <NDescriptionsItem label="\\u63d0\\u5355\\u53f7">{{ detail.blNo || 'BL202605001' }}</NDescriptionsItem>
            <NDescriptionsItem label="\\u5ba2\\u6237">{{ detail.customerName || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="ETA">{{ detail.eta || detail.etaWarehouseTime || '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="\\u4ed3\\u5e93">{{ detail.warehouseName || (isMockMode() ? '\\u6d1b\\u6749\\u77f3\\u4e00\\u53f7\\u4ed3' : '—') }}</NDescriptionsItem>
            <NDescriptionsItem label="\\u8fdb\\u5ea6">
              <NTag type="warning">{{ detail.progress ?? 0 }}%</NTag>
            </NDescriptionsItem>
          </NDescriptions>
        </NTabPane>
        <NTabPane name="cargo" tab="\\u8d27\\u4ef6\\u4fe1\\u606f">
          <NDataTable class="mt-12px" :columns="[
            { title: 'SO', key: 'so' },
            { title: 'Shipment', key: 'shipment' },
            { title: '\\u7bb1\\u6570', key: 'boxQty' },
            { title: '\\u91cd\\u91cf', key: 'weight' },
            { title: '\\u4f53\\u79ef', key: 'cbm' }
          ]" :data="shipments" size="small" />
        </NTabPane>
        <NTabPane name="pallet" tab="\\u6258\\u76d8\\u4fe1\\u606f">
          <NDataTable class="mt-12px" :columns="[
            { title: '\\u6258\\u76d8\\u53f7', key: 'palletNo' },
            { title: '\\u7bb1\\u6570', key: 'boxQty' },
            { title: '\\u72b6\\u6001', key: 'status' }
          ]" :data="pallets" size="small" />
        </NTabPane>
        <NTabPane name="attach" tab="\\u9644\\u4ef6">
          <p class="text-gray mt-12px">DO\\u6587\\u4ef6\\u3001\\u56fe\\u7247\\uff08\\u539f\\u578b\\u5360\\u4f4d\\uff09</p>
        </NTabPane>
        <NTabPane name="log" tab="\\u64cd\\u4f5c\\u65e5\\u5fd7">
          <p class="text-gray mt-12px">2026-05-28 09:00 \\u5f00\\u59cb\\u62c6\\u67dc</p>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>
`;

// Convert \\u in template/script strings to real Unicode in output file
function unescapeVue(src) {
  return src.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

const detailPath = path.join(root, 'src/views/wms/devanning-order-detail/index.vue');
fs.writeFileSync(detailPath, unescapeVue(detailVue), 'utf8');

console.log('patched devanning-order list + detail');
