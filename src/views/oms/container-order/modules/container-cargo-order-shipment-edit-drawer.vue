<script setup lang="ts">
import { ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import ContainerCargoOrderShipmentTable from './container-cargo-order-shipment-table.vue';
import type { ContainerCargoOrderDraftRow } from '../utils/container-cargo-order-display';
import { syncCargoOrderTableFields } from '../utils/container-cargo-order';
import { displayCargoOrderNo } from '../utils/container-cargo-order-display';

defineOptions({ name: 'ContainerCargoOrderShipmentEditDrawer' });

const visible = defineModel<boolean>('visible', { default: false });
const cargo = defineModel<ContainerCargoOrderDraftRow | null>('cargo', { default: null });

const editModel = ref<ContainerCargoOrderDraftRow | null>(null);

watch(visible, val => {
  if (val && cargo.value) {
    editModel.value = jsonClone(cargo.value) as ContainerCargoOrderDraftRow;
  }
});

function handleSave() {
  if (!editModel.value || !cargo.value) return;
  const shipments = (editModel.value.shipments || []).filter(item => item.shipmentNo?.trim());
  if (!shipments.length) {
    window.$message?.warning('至少需要一条货件');
    return;
  }
  cargo.value.shipments = editModel.value.shipments;
  cargo.value.forecastQtyUnit = editModel.value.forecastQtyUnit;
  syncCargoOrderTableFields(cargo.value);
  visible.value = false;
  window.$message?.success('货件已保存');
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1000" class="max-w-96%" @after-leave="editModel = null">
    <NDrawerContent closable :native-scrollbar="false">
      <template #header>
        <div class="flex items-center gap-12px">
          <span class="text-16px font-semibold">货件明细</span>
          <span v-if="editModel" class="text-14px text-#4b5563">{{ displayCargoOrderNo(editModel) }}</span>
          <span v-if="editModel?.customerName" class="text-12px text-#9ca3af">{{ editModel.customerName }}</span>
        </div>
      </template>

      <NEmpty v-if="!editModel" description="请先选择货物订单" />
      <div v-else class="flex-col gap-16px">
        <NDescriptions :column="4" size="small" bordered label-placement="left">
          <NDescriptionsItem label="参考号">{{ editModel.externalOrderNo || '--' }}</NDescriptionsItem>
          <NDescriptionsItem label="地址类型">{{ editModel.addressType || '--' }}</NDescriptionsItem>
          <NDescriptionsItem label="仓库代码">{{ editModel.platformWarehouseCode || '--' }}</NDescriptionsItem>
          <NDescriptionsItem label="下单计量">{{ editModel.forecastQtyUnit === 'BY_PALLET' ? '按板' : '按箱' }}</NDescriptionsItem>
        </NDescriptions>
        <ContainerCargoOrderShipmentTable v-model="editModel" />
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="handleClose">取消</NButton>
          <NButton type="primary" @click="handleSave">保存货件</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
