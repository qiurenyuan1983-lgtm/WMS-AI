<script setup lang="tsx">
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
    window.$message?.error('打印失败，请允许弹窗');
    return;
  }
  const orderLines = (row.items || [])
    .map(
      item =>
        `<div class="row">${item.cargoOrderNo}：${item.receiveQty} ${item.receiveUnitLabel} / ${item.boxQty} 箱</div>`
    )
    .join('');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>卡板标签 - ${row.palletNo}</title>
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
        <div class="no">${row.palletNo}</div>
        <div class="row">分组：${row.groupCode}</div>
        <div class="row">订单数：${row.orderCount}</div>
        ${orderLines}
        <div class="row">合计：${row.boxQty} 箱</div>
        <div class="bar">${row.palletNo}</div>
      </div>
      <script>window.onload = () => window.print();<\/script>
    </body>
    </html>
  `);
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
  window.$message?.success('已删除卡板，收货数量已回退，可重新收货');
  emit('refreshed');
}

const detailItemColumns: DataTableColumns<Api.Wms.DevanningWorkPalletItem> = [
  { title: '货物订单号', key: 'cargoOrderNo', width: 140 },
  { title: '客户', key: 'customerName', width: 100, ellipsis: { tooltip: true } },
  {
    title: '收货量',
    key: 'receiveQty',
    width: 90,
    align: 'center',
    render: row => `${row.receiveQty} ${row.receiveUnitLabel}`
  },
  { title: '箱数', key: 'boxQty', width: 70, align: 'center' }
];

function buildColumns(): DataTableColumns<Api.Wms.DevanningWorkPallet> {
  return [
    { title: '卡板号', key: 'palletNo', width: 130 },
    { title: '分组', key: 'groupCode', width: 100 },
    {
      title: '订单数',
      key: 'orderCount',
      width: 72,
      align: 'center',
      render: row => row.orderCount ?? row.items?.length ?? 0
    },
    { title: '箱数', key: 'boxQty', width: 70, align: 'center' },
    { title: '时间', key: 'createTime', width: 150 },
    {
      title: '操作',
      key: 'operate',
      width: 220,
      fixed: 'right',
      render: row => (
        <NSpace size="small">
          <NButton size="tiny" type="primary" secondary onClick={() => openDetail(row)}>
            详情
          </NButton>
          <NButton size="tiny" onClick={() => printPalletLabel(row)}>
            打印标签
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row)}>
            {{
              default: () => '删除后对应收货数量将回退，可重新收货',
              trigger: () => (
                <NButton size="tiny" type="error" secondary>
                  删除
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
    <NDrawerContent :title="'卡板历史 (' + palletList.length + ')'" closable :native-scrollbar="false">
      <p class="mb-12px text-13px text-#6b7280">
        卡板为收货打板后自动生成，一块卡板可包含多个订单，点击「详情」查看明细
      </p>
      <NDataTable :columns="columns" :data="palletList" size="small" :scroll-x="760" :pagination="false" />
    </NDrawerContent>
  </NDrawer>

  <NModal
    v-model:show="detailVisible"
    preset="card"
    :title="detailPallet ? '卡板详情 · ' + detailPallet.palletNo : '卡板详情'"
    style="width: 640px; max-width: 95vw"
  >
    <template v-if="detailPallet">
      <NDescriptions :column="2" size="small" label-placement="left" bordered class="mb-16px">
        <NDescriptionsItem label="卡板号">{{ detailPallet.palletNo }}</NDescriptionsItem>
        <NDescriptionsItem label="分组">{{ detailPallet.groupCode }}</NDescriptionsItem>
        <NDescriptionsItem label="订单数">{{ detailPallet.orderCount ?? detailPallet.items?.length ?? 0 }}</NDescriptionsItem>
        <NDescriptionsItem label="箱数合计">{{ detailPallet.boxQty }}</NDescriptionsItem>
        <NDescriptionsItem label="打板时间" :span="2">{{ detailPallet.createTime }}</NDescriptionsItem>
      </NDescriptions>
      <p class="mb-8px text-14px font-600">订单明细</p>
      <NDataTable
        :columns="detailItemColumns"
        :data="detailPallet.items || []"
        size="small"
        :pagination="false"
      />
    </template>
  </NModal>
</template>
