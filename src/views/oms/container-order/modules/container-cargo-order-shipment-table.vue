<script setup lang="tsx">
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { computed, h } from 'vue';
import { NButton, NDatePicker, NInput, NInputNumber } from 'naive-ui';
import type { ContainerCargoOrderDraftRow } from '../utils/container-cargo-order-display';
import { createDefaultShipment, isByPallet, normalizeDatePickerDateTime, summarizeCargoOrderForm } from '../utils/container-cargo-order';

/** 货件可编辑表单（海柜草稿 / 货物订单详情共用） */
export type ShipmentEditableModel = Pick<
  Api.Oms.ContainerCargoOrderForm,
  'forecastQtyUnit' | 'shipments'
>;

defineOptions({ name: 'ContainerCargoOrderShipmentTable' });

const cargo = defineModel<ShipmentEditableModel>({ required: true });

function onShipmentChange() {
  summarizeCargoOrderForm(cargo.value as Api.Oms.ContainerCargoOrderForm);
}

function addShipment() {
  cargo.value.shipments ||= [];
  cargo.value.shipments.push(createDefaultShipment());
}

function removeShipment(index: number) {
  cargo.value.shipments?.splice(index, 1);
  if (!cargo.value.shipments?.length) {
    cargo.value.shipments = [createDefaultShipment() as Api.Oms.CargoOrderShipmentItem];
  }
  onShipmentChange();
}

const shipmentColumns = computed(() => [
  {
    title: '货件编码',
    key: 'shipmentNo',
    width: 150,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInput, {
        value: row.shipmentNo,
        placeholder: '必填',
        size: 'small',
        onUpdateValue: (v: string) => {
          row.shipmentNo = v;
          onShipmentChange();
        }
      })
  },
  {
    title: 'PO号',
    key: 'poNo',
    width: 130,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInput, {
        value: row.poNo,
        placeholder: 'PO',
        size: 'small',
        onUpdateValue: (v: string) => {
          row.poNo = v;
          onShipmentChange();
        }
      })
  },
  {
    title: '唛头',
    key: 'shippingMark',
    width: 120,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInput, {
        value: row.shippingMark,
        size: 'small',
        onUpdateValue: (v: string) => {
          row.shippingMark = v;
          onShipmentChange();
        }
      })
  },
  ...(isByPallet(cargo.value)
    ? [
        {
          title: '板数',
          key: 'palletQty',
          width: 100,
          render: (row: Api.Oms.CargoOrderShipmentItem) =>
            h(NInputNumber, {
              value: row.palletQty,
              min: 0,
              size: 'small',
              class: 'w-full',
              onUpdateValue: (v: number | null) => {
                row.palletQty = v;
                onShipmentChange();
              }
            })
        }
      ]
    : [
        {
          title: '箱数',
          key: 'cartonQty',
          width: 100,
          render: (row: Api.Oms.CargoOrderShipmentItem) =>
            h(NInputNumber, {
              value: row.cartonQty,
              min: 0,
              size: 'small',
              class: 'w-full',
              onUpdateValue: (v: number | null) => {
                row.cartonQty = v;
                onShipmentChange();
              }
            })
        }
      ]),
  {
    title: '重量KG',
    key: 'weight',
    width: 100,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInputNumber, {
        value: row.weight,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => {
          row.weight = v;
          onShipmentChange();
        }
      })
  },
  {
    title: '体积CBM',
    key: 'cbm',
    width: 100,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInputNumber, {
        value: row.cbm,
        min: 0,
        size: 'small',
        class: 'w-full',
        onUpdateValue: (v: number | null) => {
          row.cbm = v;
          onShipmentChange();
        }
      })
  },
  {
    title: 'DW时间',
    key: 'dwTime',
    width: 170,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NDatePicker, { to: POPUP_TO_BODY,
        formattedValue: normalizeDatePickerDateTime(row.dwTime),
        type: 'datetime',
        valueFormat: 'yyyy-MM-dd HH:mm:ss',
        size: 'small',
        class: 'w-full',
        clearable: true,
        onUpdateFormattedValue: (v: string | null) => {
          row.dwTime = v;
          onShipmentChange();
        }
      })
  },
  {
    title: '备注',
    key: 'remark',
    width: 120,
    render: (row: Api.Oms.CargoOrderShipmentItem) =>
      h(NInput, {
        value: row.remark,
        size: 'small',
        onUpdateValue: (v: string) => (row.remark = v)
      })
  },
  {
    title: '操作',
    key: 'operate',
    width: 70,
    render: (_row: Api.Oms.CargoOrderShipmentItem, index: number) =>
      h(
        NButton,
        { text: true, type: 'error', size: 'small', onClick: () => removeShipment(index) },
        { default: () => '删除' }
      )
  }
]);
</script>

<template>
  <div>
    <div class="mb-8px flex items-center justify-between">
      <span class="text-13px text-#374151">货件层（至少 1 条，计量：{{ cargo.forecastQtyUnit === 'BY_PALLET' ? '按板' : '按箱' }}）</span>
      <NButton size="small" type="primary" @click="addShipment">添加货件</NButton>
    </div>
    <NDataTable
      size="small"
      :columns="shipmentColumns"
      :data="cargo.shipments || []"
      :pagination="false"
      :scroll-x="1200"
      bordered
    />
  </div>
</template>
