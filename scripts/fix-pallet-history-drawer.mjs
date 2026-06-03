import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, '../src/views/wms/devanning-work/modules/pallet-history-drawer.vue');

const content = `<script setup lang="tsx">
import { computed, ref } from 'vue';
import {
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NModal,
  NPopconfirm,
  NSpace
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchDeleteDevanningWorkPallet } from '@/service/api/wms/devanning-work';

defineOptions({ name: 'DevanningPalletHistoryDrawer' });

const props = defineProps<{
  taskId: string;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const session = defineModel<Api.Wms.DevanningWorkSession | null>('session', { default: null });

const emit = defineEmits<{ refreshed: [] }>();

const palletList = computed(() => session.value?.pallets ?? []);
const detailVisible = ref(false);
const detailPallet = ref<Api.Wms.DevanningWorkPallet | null>(null);

function openDetail(row: Api.Wms.DevanningWorkPallet) {
  detailPallet.value = row;
  detailVisible.value = true;
}

function printPalletLabel(row: Api.Wms.DevanningWorkPallet) {
  const win = window.open('', '_blank');
  if (!win) {
    window.$message?.error('\u6253\u5370\u5931\u8d25\uff0c\u8bf7\u5141\u8bb8\u5f39\u7a97');
    return;
  }
  const orderLines = (row.items || [])
    .map(
      item =>
        \`<div class="row">\${item.cargoOrderNo}\uff1a\${item.receiveQty} \${item.receiveUnitLabel} / \${item.boxQty} \u7bb1</div>\`
    )
    .join('');
  win.document.write(\`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>\u5361\u677f\u6807\u7b7e - \${row.palletNo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, 'PingFang SC', sans-serif; padding: 24px; }
        .label { width: 320px; border: 2px solid #111; padding: 16px; }
        .no { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
        .row { font-size: 14px; margin: 6px 0; color: #333; }
        .bar { height: 48px; background: #f0f0f0; margin-top: 12px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="no">\${row.palletNo}</div>
        <div class="row">\u5206\u7ec4\uff1a\${row.groupCode}</div>
        <div class="row">\u8ba2\u5355\u6570\uff1a\${row.orderCount}</div>
        \${orderLines}
        <div class="row">\u5408\u8ba1\uff1a\${row.boxQty} \u7bb1</div>
        <div class="bar">\${row.palletNo}</div>
      </div>
      <script>window.onload = () => window.print();<\\/script>
    </body>
    </html>
  \`);
  win.document.close();
}

async function handleDelete(row: Api.Wms.DevanningWorkPallet) {
  const { data, error } = await fetchDeleteDevanningWorkPallet(props.taskId, row.id);
  if (error) return;
  session.value = data as Api.Wms.DevanningWorkSession;
  if (detailPallet.value?.id === row.id) {
    detailVisible.value = false;
    detailPallet.value = null;
  }
  window.$message?.success('\u5df2\u5220\u9664\u5361\u677f\uff0c\u6536\u8d27\u6570\u91cf\u5df2\u56de\u9000\uff0c\u53ef\u91cd\u65b0\u6536\u8d27');
  emit('refreshed');
}

const detailItemColumns: DataTableColumns<Api.Wms.DevanningWorkPalletItem> = [
  { title: '\u8d27\u7269\u8ba2\u5355\u53f7', key: 'cargoOrderNo', width: 140 },
  { title: '\u5ba2\u6237', key: 'customerName', width: 100, ellipsis: { tooltip: true } },
  {
    title: '\u6536\u8d27\u91cf',
    key: 'receiveQty',
    width: 90,
    align: 'center',
    render: row => \`\${row.receiveQty} \${row.receiveUnitLabel}\`
  },
  { title: '\u7bb1\u6570', key: 'boxQty', width: 70, align: 'center' }
];

function buildColumns(): DataTableColumns<Api.Wms.DevanningWorkPallet> {
  return [
    { title: '\u5361\u677f\u53f7', key: 'palletNo', width: 130 },
    { title: '\u5206\u7ec4', key: 'groupCode', width: 100 },
    {
      title: '\u8ba2\u5355\u6570',
      key: 'orderCount',
      width: 72,
      align: 'center',
      render: row => row.orderCount ?? row.items?.length ?? 0
    },
    { title: '\u7bb1\u6570', key: 'boxQty', width: 70, align: 'center' },
    { title: '\u65f6\u95f4', key: 'createTime', width: 150 },
    {
      title: '\u64cd\u4f5c',
      key: 'operate',
      width: 220,
      fixed: 'right',
      render: row => (
        <NSpace size="small">
          <NButton size="tiny" type="primary" secondary onClick={() => openDetail(row)}>
            \u8be6\u60c5
          </NButton>
          <NButton size="tiny" onClick={() => printPalletLabel(row)}>
            \u6253\u5370\u6807\u7b7e
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row)}>
            {{
              default: () => '\u5220\u9664\u540e\u5bf9\u5e94\u6536\u8d27\u6570\u91cf\u5c06\u56de\u9000\uff0c\u53ef\u91cd\u65b0\u6536\u8d27',
              trigger: () => (
                <NButton size="tiny" type="error" secondary>
                  \u5220\u9664
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      )
    }
  ];
}

const columns = buildColumns();
</script>

<template>
  <NDrawer v-model:show="visible" :width="720" display-directive="show">
    <NDrawerContent :title="'\u5361\u677f\u5386\u53f2 (' + palletList.length + ')'" closable :native-scrollbar="false">
      <p class="mb-12px text-13px text-#6b7280">
        \u5361\u677f\u4e3a\u6536\u8d27\u6253\u677f\u540e\u81ea\u52a8\u751f\u6210\uff0c\u4e00\u5757\u5361\u677f\u53ef\u5305\u542b\u591a\u4e2a\u8ba2\u5355\uff0c\u70b9\u51fb\u300c\u8be6\u60c5\u300d\u67e5\u770b\u660e\u7ec6
      </p>
      <NDataTable :columns="columns" :data="palletList" size="small" :scroll-x="760" :pagination="false" />
    </NDrawerContent>
  </NDrawer>

  <NModal
    v-model:show="detailVisible"
    preset="card"
    :title="detailPallet ? '\u5361\u677f\u8be6\u60c5 \u00b7 ' + detailPallet.palletNo : '\u5361\u677f\u8be6\u60c5'"
    style="width: 640px; max-width: 95vw"
  >
    <template v-if="detailPallet">
      <NDescriptions :column="2" size="small" label-placement="left" bordered class="mb-16px">
        <NDescriptionsItem label="\u5361\u677f\u53f7">{{ detailPallet.palletNo }}</NDescriptionsItem>
        <NDescriptionsItem label="\u5206\u7ec4">{{ detailPallet.groupCode }}</NDescriptionsItem>
        <NDescriptionsItem label="\u8ba2\u5355\u6570">{{ detailPallet.orderCount ?? detailPallet.items?.length ?? 0 }}</NDescriptionsItem>
        <NDescriptionsItem label="\u7bb1\u6570\u5408\u8ba1">{{ detailPallet.boxQty }}</NDescriptionsItem>
        <NDescriptionsItem label="\u6253\u677f\u65f6\u95f4" :span="2">{{ detailPallet.createTime }}</NDescriptionsItem>
      </NDescriptions>
      <p class="mb-8px text-14px font-600">\u8ba2\u5355\u660e\u7ec6</p>
      <NDataTable
        :columns="detailItemColumns"
        :data="detailPallet.items || []"
        size="small"
        :pagination="false"
      />
    </template>
  </NModal>
</template>
`;

fs.writeFileSync(target, content, 'utf8');
console.log('Updated:', target);
