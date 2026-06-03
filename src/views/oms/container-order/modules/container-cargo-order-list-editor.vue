<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useDownload } from '@/hooks/business/download';
import { fetchGetBusinessTypeList } from '@/service/api/base';
import { getContainerCargoImportTemplateUrl } from '@/service/api/oms/container-order';
import { useAuth } from '@/hooks/business/auth';
import { useContainerCargoTableColumns } from '../composables/use-container-cargo-table-columns';
import ContainerCargoOrderAddDrawer from './container-cargo-order-add-drawer.vue';
import ContainerCargoOrderImportModal from './container-cargo-order-import-modal.vue';
import type { ContainerCargoDefaults } from '../utils/container-cargo-order';
import {
  ensureDraftKey,
  type ContainerCargoOrderDraftRow
} from '../utils/container-cargo-order-display';
import { syncCargoOrderTableFields, syncCargoOrderListTableFields } from '../utils/container-cargo-order';

defineOptions({ name: 'ContainerCargoOrderListEditor' });

const props = defineProps<{
  defaults?: ContainerCargoDefaults;
}>();

const cargoOrders = defineModel<ContainerCargoOrderDraftRow[]>({ required: true });

const { hasAuth } = useAuth();
const { download } = useDownload();

const importVisible = ref(false);
const addDrawerVisible = ref(false);
const editCargo = ref<ContainerCargoOrderDraftRow | null>(null);
const addDrawerInitialTab = ref<'basic' | 'shipment'>('basic');

const businessTypeNameMap = ref<Record<string, string>>({});

const canImport = () => hasAuth('oms:containerOrder:add') || hasAuth('oms:containerOrder:importCargo');

function getCargoBusinessTypeName(row: Api.Oms.CargoOrder) {
  return String((row.businessTypeId ? businessTypeNameMap.value[String(row.businessTypeId)] : '') || row.businessTypeId || '--');
}

function openAddDrawer() {
  editCargo.value = null;
  addDrawerInitialTab.value = 'basic';
  addDrawerVisible.value = true;
}

function openEditDrawer(row: Api.Oms.CargoOrder, index: number) {
  editCargo.value = cargoOrders.value[index] ?? row;
  addDrawerInitialTab.value = 'basic';
  addDrawerVisible.value = true;
}

function openShipmentDrawer(row: Api.Oms.CargoOrder, index: number) {
  editCargo.value = cargoOrders.value[index] ?? row;
  addDrawerInitialTab.value = 'shipment';
  addDrawerVisible.value = true;
}

function removeCargoOrder(index: number) {
  cargoOrders.value.splice(index, 1);
}

function handleDownloadTemplate() {
  download(getContainerCargoImportTemplateUrl(), {}, `海柜关联货物订单导入模板_${Date.now()}.xlsx`);
}

function handleParsed(orders: Api.Oms.ContainerCargoOrderForm[]) {
  const rows = orders as ContainerCargoOrderDraftRow[];
  rows.forEach(row => ensureDraftKey(row));
  cargoOrders.value.push(...rows);
  syncCargoOrderListTableFields(cargoOrders.value);
}

function handleCargoSaved(payload: { cargo: ContainerCargoOrderDraftRow; draftKey?: string }) {
  const { cargo, draftKey } = payload;
  syncCargoOrderTableFields(cargo);
  const idx = draftKey ? cargoOrders.value.findIndex(item => item._draftKey === draftKey) : -1;
  if (idx >= 0) {
    cargoOrders.value[idx] = cargo;
  } else {
    ensureDraftKey(cargo);
    cargoOrders.value.push(cargo);
  }
  syncCargoOrderListTableFields(cargoOrders.value);
}

const cargoColumns = useContainerCargoTableColumns({
  mode: 'draft',
  getBusinessTypeName: getCargoBusinessTypeName,
  onOpenShipment: openShipmentDrawer,
  onEdit: openEditDrawer,
  onDelete: removeCargoOrder
});

function rowKey(row: ContainerCargoOrderDraftRow) {
  return row._draftKey || String(row.id) || row.externalOrderNo || Math.random();
}

async function loadBusinessTypes() {
  const { data } = await fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} }).catch(() => ({
    data: null
  }));
  businessTypeNameMap.value = Object.fromEntries(
    (data?.rows || []).map(item => [String(item.id), item.businessTypeName])
  );
}

onMounted(loadBusinessTypes);
</script>

<template>
  <div>
    <NAlert type="info" class="mb-12px">
      新增或编辑货物订单时，在抽屉内通过「基础信息」「货件信息」两个页签切换填写；列表中仍可点击「货件」单独维护货件。
    </NAlert>
    <NSpace class="mb-12px">
      <NButton type="primary" @click="openAddDrawer">新增货物订单</NButton>
      <NButton v-if="canImport()" @click="importVisible = true">导入货物订单</NButton>
      <NButton v-if="canImport()" secondary @click="handleDownloadTemplate">下载模板</NButton>
    </NSpace>

    <NEmpty v-if="!cargoOrders.length" description="暂未添加货物订单，可直接进入确认提交" />
    <template v-else>
      <div class="mb-8px text-12px text-#9ca3af">点击「编辑」维护订单；点击「货件」可快速打开货件页签</div>
      <NDataTable
        size="small"
        :columns="cargoColumns"
        :data="cargoOrders"
        :pagination="false"
        :row-key="rowKey"
        :scroll-x="4300"
        bordered
      />
    </template>

    <ContainerCargoOrderAddDrawer
      v-model:visible="addDrawerVisible"
      :defaults="defaults"
      :edit-cargo="editCargo"
      :initial-tab="addDrawerInitialTab"
      @saved="handleCargoSaved"
    />

    <ContainerCargoOrderImportModal v-model:visible="importVisible" :defaults="defaults" @parsed="handleParsed" />
  </div>
</template>
