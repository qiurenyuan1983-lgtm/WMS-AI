<script setup lang="tsx">
import { computed, h } from 'vue';
import { NDataTable, NEmpty } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';

defineOptions({ name: 'CargoOrderShipmentDrawer' });

interface Props {
  cargoOrder?: Api.Oms.CargoOrder | null;
}

const props = defineProps<Props>();
const visible = defineModel<boolean>('visible', { default: false });

const shipments = computed(() => props.cargoOrder?.shipments || []);

function val(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

// SKU 子表列（CargoOrderShipment 暂无 skuItems，预留结构）
const skuColumns: DataTableColumns<Api.Oms.CargoOrderSkuItem> = [
  { title: 'SKU', key: 'sku', width: 140 },
  { title: 'FNSKU', key: 'fnsku', width: 140 },
  { title: '商品名称', key: 'productName', minWidth: 180 },
  { title: '数量', key: 'qty', width: 90, align: 'right' },
  { title: '箱数', key: 'cartonQty', width: 80, align: 'right' },
  { title: '重量KG', key: 'weight', width: 90, align: 'right' },
  { title: '体积CBM', key: 'cbm', width: 90, align: 'right' },
  { title: '备注', key: 'remark', minWidth: 120 }
];

function renderExpand(row: Api.Oms.CargoOrderShipment) {
  const skuItems: Api.Oms.CargoOrderSkuItem[] = (row as any).skuItems || [];
  if (!skuItems.length) {
    return (
      <div class="px-24px py-12px text-12px text-#9ca3af">
        暂无 SKU 明细数据
      </div>
    );
  }
  return h('div', { class: 'px-8px py-8px' }, [
    h(NDataTable as any, {
      size: 'small',
      columns: skuColumns,
      data: skuItems,
      pagination: false,
      bordered: false
    })
  ]);
}

const shipmentColumns: DataTableColumns<Api.Oms.CargoOrderShipment> = [
  { type: 'expand', expandable: () => true, renderExpand },
  {
    title: '货件编码',
    key: 'shipmentNo',
    width: 170,
    render: row => val(row.shipmentNo ?? row.shipmentCode)
  },
  { title: 'PO 号', key: 'poNo', width: 150 },
  {
    title: 'Mark / 唛头',
    key: 'shippingMark',
    width: 140,
    render: row => val(row.shippingMark ?? row.mark)
  },
  { title: 'DW 时间', key: 'dwTime', width: 140, render: row => val(row.dwTime) },
  {
    title: '预报箱数',
    key: 'cartonQty',
    width: 90,
    align: 'right',
    render: row => val(row.cartonQty ?? row.expectedBoxQty)
  },
  {
    title: '重量 KG',
    key: 'weight',
    width: 90,
    align: 'right',
    render: row => val(row.weight ?? row.expectedWeight)
  },
  {
    title: '体积 CBM',
    key: 'cbm',
    width: 90,
    align: 'right',
    render: row => val(row.cbm ?? row.expectedCbm)
  },
  { title: '备注', key: 'remark', minWidth: 120, ellipsis: { tooltip: true } }
];
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="960" class="max-w-98%">
    <NDrawerContent :native-scrollbar="false" closable>
      <template #header>
        <div class="flex items-center gap-12px">
          <span class="text-16px font-semibold">货件明细</span>
          <template v-if="cargoOrder">
            <span class="text-14px text-#4b5563">{{ cargoOrder.cargoOrderNo }}</span>
            <span class="text-12px text-#9ca3af">{{ cargoOrder.customerName }}</span>
          </template>
        </div>
      </template>

      <NSpin :show="false">
        <NEmpty v-if="!cargoOrder" description="请先选择订单" />
        <div v-else class="flex-col gap-16px">
          <!-- 订单摘要 -->
          <NDescriptions :column="4" size="small" bordered label-placement="left">
            <NDescriptionsItem label="订单号">{{ cargoOrder.cargoOrderNo }}</NDescriptionsItem>
            <NDescriptionsItem label="客户">{{ val(cargoOrder.customerName) }}</NDescriptionsItem>
            <NDescriptionsItem label="地址类型">{{ val(cargoOrder.addressType) }}</NDescriptionsItem>
            <NDescriptionsItem label="DW 时间">{{ val(cargoOrder.earliestDwTime) }}</NDescriptionsItem>
            <NDescriptionsItem label="预报箱数">{{ val(cargoOrder.expectedBoxQty) }}</NDescriptionsItem>
            <NDescriptionsItem label="预报重量">{{ val(cargoOrder.expectedWeight) }} KG</NDescriptionsItem>
            <NDescriptionsItem label="预报体积">{{ val(cargoOrder.expectedCbm) }} CBM</NDescriptionsItem>
            <NDescriptionsItem label="货件数">{{ shipments.length }}</NDescriptionsItem>
          </NDescriptions>

          <!-- 货件表格，可展开看 SKU -->
          <div>
            <div class="mb-8px text-13px font-medium text-#374151">货件层（点击行左侧箭头查看 SKU 明细）</div>
            <NEmpty v-if="!shipments.length" description="该订单暂无货件数据" size="small" />
            <NDataTable
              v-else
              :columns="shipmentColumns"
              :data="shipments"
              :pagination="false"
              :row-key="(row: Api.Oms.CargoOrderShipment) => row.id || row.shipmentCode || ''"
              size="small"
              bordered
            />
          </div>
        </div>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
