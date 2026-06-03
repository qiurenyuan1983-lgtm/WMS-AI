<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NButton,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpin
} from 'naive-ui';
import { fetchGetWmsPalletList } from '@/service/api/wms';
import { useWmsPalletOperate } from '../composables/use-wms-pallet-operate.tsx';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  warehouseId: CommonType.IdType | null;
  locationId: CommonType.IdType | null;
  locationCode?: string | null;
  occupancyPercent?: number;
  currentQty?: number;
  capacity?: number | null;
}>();

const emit = defineEmits<{ refreshed: [] }>();

const loading = ref(false);
const pallets = ref<Api.Wms.Pallet[]>([]);

const {
  orderDrawerVisible,
  moveModalVisible,
  expandedOrderKeys,
  currentPallet,
  orderRows,
  orderColumns,
  orderRowKey,
  locationOptions,
  moveForm,
  buildPalletTableColumns,
  submitMove
} = useWmsPalletOperate({
  onRefresh: () => {
    loadPallets();
    emit('refreshed');
  }
});

const columns = buildPalletTableColumns({ hideLocation: true });

async function loadPallets() {
  if (!props.warehouseId || !props.locationId) {
    pallets.value = [];
    return;
  }
  loading.value = true;
  const { data, error } = await fetchGetWmsPalletList({
    pageNum: 1,
    pageSize: 200,
    warehouseId: props.warehouseId,
    locationId: props.locationId,
    scope: 'ACTIVE'
  } as any);
  loading.value = false;
  if (error) return;
  pallets.value = (data as any)?.rows || [];
}

watch(
  () => [visible.value, props.locationId, props.warehouseId] as const,
  ([show]) => {
    if (show) loadPallets();
  }
);
</script>

<template>
  <NDrawer v-model:show="visible" width="920" placement="right">
    <NDrawerContent :title="`库位 ${locationCode || ''}`" closable>
      <p class="mb-12px text-13px text-gray-500">
        占用 {{ occupancyPercent ?? 0 }}% · 卡板 {{ currentQty ?? 0 }} 板
        <span v-if="capacity">/ 容量 {{ capacity }}</span>
      </p>
      <NSpin :show="loading">
        <NDataTable :columns="columns" :data="pallets" :pagination="false" :scroll-x="900" size="small" />
        <p v-if="!loading && !pallets.length" class="py-24px text-center text-13px text-gray-500">暂无在库卡板</p>
      </NSpin>
    </NDrawerContent>
  </NDrawer>

  <NDrawer v-model:show="orderDrawerVisible" width="1000">
    <NDrawerContent :title="`卡板订单明细 - ${currentPallet?.palletNo || ''}`" closable>
      <p class="mb-12px text-13px text-gray-500">点击订单行「明细」展开该订单下的货件。</p>
      <NDataTable
        v-model:expanded-row-keys="expandedOrderKeys"
        :columns="orderColumns"
        :data="orderRows"
        :row-key="(row: Api.Wms.PalletOrderSummary) => orderRowKey(row)"
        :pagination="false"
        :scroll-x="1150"
        size="small"
      />
    </NDrawerContent>
  </NDrawer>

  <NModal v-model:show="moveModalVisible" preset="card" title="移动库位" class="w-480px">
    <NForm label-placement="left" label-width="90">
      <NFormItem label="卡板号">
        <NInput :value="currentPallet?.palletNo" disabled />
      </NFormItem>
      <NFormItem label="目标库位" required>
        <NSelect v-model:value="moveForm.locationId" :options="locationOptions" filterable placeholder="请选择库位" />
      </NFormItem>
      <NFormItem label="备注">
        <NInput v-model:value="moveForm.remark" type="textarea" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="moveModalVisible = false">取消</NButton>
        <NButton type="primary" @click="submitMove">确定</NButton>
      </div>
    </template>
  </NModal>
</template>
