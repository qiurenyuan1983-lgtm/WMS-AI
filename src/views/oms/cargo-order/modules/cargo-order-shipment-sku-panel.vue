<script setup lang="tsx">
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { computed, h, ref } from 'vue';
import { NButton, NDataTable, NDatePicker, NEmpty, NInput, NInputNumber, NSpace } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { ShipmentEditableModel } from '../../container-order/modules/container-cargo-order-shipment-table.vue';
import { resolveOrderNoForShippingMark } from '@/utils/oms/shipping-mark';
import {
  createDefaultShipment,
  isByPallet,
  normalizeDatePickerDateTime,
  syncCargoOrderTableFields
} from '../../container-order/utils/container-cargo-order';
import type { ContainerCargoOrderDraftRow } from '../../container-order/utils/container-cargo-order-display';

defineOptions({ name: 'CargoOrderShipmentSkuPanel' });

const props = withDefaults(
  defineProps<{
    editable?: boolean;
    /** 只读模式下的货件列表（无 v-model 时使用） */
    shipments?: Api.Oms.CargoOrderShipment[];
  }>(),
  { editable: false, shipments: () => [] }
);

const cargo = defineModel<ShipmentEditableModel>();

const expandedKeys = ref<Array<string | number>>([]);

function val(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

function rowKey(row: Api.Oms.CargoOrderShipment | Api.Oms.CargoOrderShipmentItem, index: number): string | number {
  return row.id ?? row.shipmentNo ?? `idx-${index}`;
}

function displayShipments() {
  return props.editable ? cargo.value?.shipments || [] : props.shipments;
}

const autoShippingMark = computed(
  () => (cargo.value ? resolveOrderNoForShippingMark(cargo.value as Api.Oms.ContainerCargoOrderForm) : '') || '待生成'
);

function onShipmentChange() {
  if (cargo.value) syncCargoOrderTableFields(cargo.value as ContainerCargoOrderDraftRow);
}

function addShipment() {
  if (!cargo.value) return;
  cargo.value.shipments ||= [];
  cargo.value.shipments.push({ ...createDefaultShipment(), skuItems: [] });
}

function removeShipment(index: number) {
  if (!cargo.value?.shipments) return;
  cargo.value.shipments.splice(index, 1);
  if (!cargo.value.shipments.length) {
    cargo.value.shipments = [{ ...createDefaultShipment(), skuItems: [] } as Api.Oms.CargoOrderShipmentItem];
  }
  onShipmentChange();
}

function createDefaultSkuItem(shipment: Api.Oms.CargoOrderShipment | Api.Oms.CargoOrderShipmentItem): Api.Oms.CargoOrderSkuItem {
  return {
    id: null,
    shipmentId: shipment.id ?? null,
    shipmentNo: shipment.shipmentNo ?? null,
    poNo: shipment.poNo ?? null,
    shippingMark: shipment.shippingMark ?? null,
    sku: null,
    fnsku: null,
    productName: null,
    qty: null,
    cartonQty: null,
    weight: null,
    cbm: null,
    remark: null
  };
}

function ensureSkuItems(row: Api.Oms.CargoOrderShipment | Api.Oms.CargoOrderShipmentItem) {
  if (!row.skuItems) row.skuItems = [];
  return row.skuItems;
}

function addSku(row: Api.Oms.CargoOrderShipment | Api.Oms.CargoOrderShipmentItem) {
  if (!row.shipmentNo?.trim()) {
    window.$message?.warning('请先填写货件编码');
    return;
  }
  ensureSkuItems(row).push(createDefaultSkuItem(row));
}

function addSkuToActive() {
  const shipments = displayShipments();
  if (!shipments.length) {
    window.$message?.warning('请先添加货件');
    return;
  }
  const activeKey = expandedKeys.value[expandedKeys.value.length - 1];
  let row: Api.Oms.CargoOrderShipment | Api.Oms.CargoOrderShipmentItem | undefined;
  if (activeKey != null) {
    const index = shipments.findIndex((item, idx) => rowKey(item, idx) === activeKey);
    if (index >= 0) row = shipments[index];
  }
  if (!row && shipments.length === 1) {
    row = shipments[0];
    expandedKeys.value = [rowKey(row, 0)];
  }
  if (!row) {
    window.$message?.warning('请先展开要维护 SKU 的货件行');
    return;
  }
  addSku(row);
}

function removeSku(row: Api.Oms.CargoOrderShipment, index: number) {
  ensureSkuItems(row).splice(index, 1);
}

const readSkuColumns: DataTableColumns<Api.Oms.CargoOrderSkuItem> = [
  { title: 'SKU', key: 'sku', width: 140 },
  { title: 'FNSKU', key: 'fnsku', width: 140 },
  { title: '商品名称', key: 'productName', minWidth: 160, ellipsis: { tooltip: true } },
  { title: '数量', key: 'qty', width: 80, align: 'right' },
  { title: '箱数', key: 'cartonQty', width: 80, align: 'right' },
  { title: '重量', key: 'weight', width: 90, align: 'right' },
  { title: '体积', key: 'cbm', width: 90, align: 'right' },
  { title: '备注', key: 'remark', minWidth: 120, ellipsis: { tooltip: true } }
];

const editSkuColumns = (shipment: Api.Oms.CargoOrderShipment): DataTableColumns<Api.Oms.CargoOrderSkuItem> => [
  {
    title: 'SKU',
    key: 'sku',
    width: 130,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInput, {
        value: row.sku,
        size: 'small',
        placeholder: '必填',
        onUpdateValue: (v: string) => { row.sku = v; }
      })
  },
  {
    title: 'FNSKU',
    key: 'fnsku',
    width: 120,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInput, {
        value: row.fnsku,
        size: 'small',
        onUpdateValue: (v: string) => { row.fnsku = v; }
      })
  },
  {
    title: '商品名称',
    key: 'productName',
    width: 150,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInput, {
        value: row.productName,
        size: 'small',
        onUpdateValue: (v: string) => { row.productName = v; }
      })
  },
  {
    title: '数量',
    key: 'qty',
    width: 90,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInputNumber, {
        value: row.qty,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => { row.qty = v; }
      })
  },
  {
    title: '箱数',
    key: 'cartonQty',
    width: 90,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInputNumber, {
        value: row.cartonQty,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => { row.cartonQty = v; }
      })
  },
  {
    title: '重量',
    key: 'weight',
    width: 90,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInputNumber, {
        value: row.weight,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => { row.weight = v; }
      })
  },
  {
    title: '体积',
    key: 'cbm',
    width: 90,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInputNumber, {
        value: row.cbm,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => { row.cbm = v; }
      })
  },
  {
    title: '备注',
    key: 'remark',
    width: 100,
    render: (row: Api.Oms.CargoOrderSkuItem) =>
      h(NInput, {
        value: row.remark,
        size: 'small',
        onUpdateValue: (v: string) => { row.remark = v; }
      })
  },
  {
    title: '操作',
    key: 'operate',
    width: 70,
    render: (_row: Api.Oms.CargoOrderSkuItem, index: number) =>
      h(NButton, {
        text: true,
        type: 'error',
        size: 'small',
        onClick: () => removeSku(shipment, index)
      }, { default: () => '删除' })
  }
];

function renderExpand(row: Api.Oms.CargoOrderShipment) {
  const skuItems = ensureSkuItems(row);
  const header = h('div', { class: 'mb-8px flex flex-wrap items-center justify-between gap-8px' }, [
    h('span', { class: 'text-12px text-#6b7280' }, `SKU 明细 · 货件 ${val(row.shipmentNo ?? row.shipmentCode)}（${skuItems.length} 条）`),
    props.editable
      ? h(NButton, {
          size: 'small',
          type: 'primary',
          secondary: true,
          onClick: () => addSku(row)
        }, { default: () => '添加 SKU' })
      : null
  ]);

  if (!skuItems.length) {
    return h('div', { class: 'px-16px py-12px' }, [
      header,
      h(NEmpty, {
        size: 'small',
        description: props.editable && !row.shipmentNo?.trim() ? '请先填写货件编码' : '暂无 SKU，可点击上方「添加 SKU」'
      })
    ]);
  }

  return h('div', { class: 'px-8px py-8px' }, [
    header,
    h(NDataTable as any, {
      size: 'small',
      bordered: true,
      pagination: false,
      scrollX: 1000,
      columns: props.editable ? editSkuColumns(row) : readSkuColumns,
      data: skuItems
    })
  ]);
}

const readShipmentColumns: DataTableColumns<Api.Oms.CargoOrderShipment> = [
  { type: 'expand', expandable: () => true, renderExpand },
  { title: '货件编码', key: 'shipmentNo', width: 150, render: row => val(row.shipmentNo ?? row.shipmentCode) },
  { title: 'PO号', key: 'poNo', width: 130, render: row => val(row.poNo) },
  { title: '唛头', key: 'shippingMark', width: 120, render: row => val(row.shippingMark ?? row.mark) },
  { title: '箱数', key: 'cartonQty', width: 80, align: 'right', render: row => val(row.cartonQty ?? row.expectedBoxQty) },
  { title: '板数', key: 'palletQty', width: 80, align: 'right', render: row => val(row.palletQty) },
  { title: '重量KG', key: 'weight', width: 90, align: 'right', render: row => val(row.weight ?? row.expectedWeight) },
  { title: '体积CBM', key: 'cbm', width: 90, align: 'right', render: row => val(row.cbm ?? row.expectedCbm) },
  { title: 'DW时间', key: 'dwTime', width: 150, render: row => val(row.dwTime) },
  {
    title: 'SKU数',
    key: 'skuCount',
    width: 70,
    align: 'center',
    render: row => String((row.skuItems || []).length)
  },
  { title: '备注', key: 'remark', minWidth: 100, ellipsis: { tooltip: true }, render: row => val(row.remark) }
];

const editShipmentColumns = computed<DataTableColumns<Api.Oms.CargoOrderShipmentItem>>(() => [
  { type: 'expand', expandable: () => true, renderExpand },
  {
    title: '货件编码',
    key: 'shipmentNo',
    width: 140,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInput, {
        value: row.shipmentNo,
        placeholder: '必填',
        size: 'small',
        onUpdateValue: (v: string) => { row.shipmentNo = v; onShipmentChange(); }
      })
  },
  {
    title: 'PO号',
    key: 'poNo',
    width: 120,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInput, {
        value: row.poNo,
        size: 'small',
        onUpdateValue: (v: string) => { row.poNo = v; onShipmentChange(); }
      })
  },
  {
    title: '唛头',
    key: 'shippingMark',
    width: 130,
    render: (row: Api.Oms.CargoOrderShipmentItem) => {
      const mark = autoShippingMark.value === '待生成' ? row.shippingMark || '待生成' : autoShippingMark.value;
      if (mark !== '待生成') row.shippingMark = mark;
      return h('span', { class: 'text-13px text-gray-600' }, mark);
    }
  },
  ...(isByPallet(cargo.value)
    ? [{
        title: '板数',
        key: 'palletQty',
        width: 90,
        render: (row: Api.Oms.CargoOrderShipmentItem) =>
          h(NInputNumber, {
            value: row.palletQty,
            min: 0,
            size: 'small',
            class: 'w-full',
            onUpdateValue: (v: number | null) => { row.palletQty = v; onShipmentChange(); }
          })
      }]
    : [{
        title: '箱数',
        key: 'cartonQty',
        width: 90,
        render: (row: Api.Oms.CargoOrderShipmentItem) =>
          h(NInputNumber, {
            value: row.cartonQty,
            min: 0,
            size: 'small',
            class: 'w-full',
            onUpdateValue: (v: number | null) => { row.cartonQty = v; onShipmentChange(); }
          })
      }]),
  {
    title: '重量KG',
    key: 'weight',
    width: 90,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInputNumber, {
        value: row.weight,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => { row.weight = v; onShipmentChange(); }
      })
  },
  {
    title: '体积CBM',
    key: 'cbm',
    width: 90,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInputNumber, {
        value: row.cbm,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => { row.cbm = v; onShipmentChange(); }
      })
  },
  {
    title: 'DW时间',
    key: 'dwTime',
    width: 160,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NDatePicker, {
        to: POPUP_TO_BODY,
        formattedValue: normalizeDatePickerDateTime(row.dwTime),
        type: 'datetime',
        valueFormat: 'yyyy-MM-dd HH:mm:ss',
        size: 'small',
        class: 'w-full',
        clearable: true,
        onUpdateFormattedValue: (v: string | null) => { row.dwTime = v; onShipmentChange(); }
      })
  },
  {
    title: 'SKU数',
    key: 'skuCount',
    width: 70,
    align: 'center' as const,
    render: (row: Api.Oms.CargoOrderShipmentItem) => String((row.skuItems || []).length)
  },
  {
    title: '操作',
    key: 'operate',
    width: 70,
    render: (_row: Api.Oms.CargoOrderShipmentItem, index: number) =>
      h(NButton, {
        text: true,
        type: 'error',
        size: 'small',
        onClick: () => removeShipment(index)
      }, { default: () => '删除' })
  }
]);

const tableColumns = computed(() => (props.editable ? editShipmentColumns.value : readShipmentColumns));

const tableData = computed(() => displayShipments());

const unitLabel = computed(() =>
  props.editable && cargo.value?.forecastQtyUnit === 'BY_PALLET' ? '按板' : '按箱'
);
</script>

<template>
  <div>
    <div class="mb-8px flex flex-wrap items-center justify-between gap-8px">
      <span class="text-13px text-#374151">
        货件明细（展开行维护 SKU 子表{{ editable ? `，计量：${unitLabel}` : '' }}）
      </span>
      <NSpace v-if="editable" :size="8">
        <NButton size="small" type="primary" @click="addShipment">添加货件</NButton>
        <NButton size="small" type="primary" secondary @click="addSkuToActive">添加 SKU</NButton>
      </NSpace>
    </div>
    <NEmpty v-if="!tableData.length" description="暂无货件数据" size="small" />
    <NDataTable
      v-else
      v-model:expanded-row-keys="expandedKeys"
      size="small"
      bordered
      :columns="tableColumns"
      :data="tableData"
      :pagination="false"
      :scroll-x="editable ? 1300 : 1100"
      :row-key="(row: any) => rowKey(row, tableData.indexOf(row))"
    />
  </div>
</template>
