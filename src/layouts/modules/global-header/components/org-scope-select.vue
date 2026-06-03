<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  fetchGetCurrentOrgScope,
  fetchGetOrgScopeCompanies,
  fetchGetOrgScopeWarehouses,
  fetchUpdateCurrentOrgScope
} from '@/service/api/system/org-scope';

defineOptions({ name: 'OrgScopeSelect' });

const companies = ref<Api.System.OrgCompanyOption[]>([]);
const warehouses = ref<Api.System.OrgWarehouseOption[]>([]);
const companyId = ref<CommonType.IdType | null>(null);
const warehouseId = ref<CommonType.IdType | null>(null);
const loading = ref(false);
const initialized = ref(false);

const companyOptions = computed(() =>
  companies.value.map(item => ({
    label: item.companyName || item.companyCode,
    value: item.id
  }))
);

const warehouseOptions = computed(() =>
  warehouses.value.map(item => ({
    label: item.warehouseName || item.warehouseCode,
    value: item.id
  }))
);

async function loadCompanies() {
  const { data } = await fetchGetOrgScopeCompanies();
  companies.value = data || [];
}

async function loadWarehouses(targetCompanyId = companyId.value) {
  const { data } = await fetchGetOrgScopeWarehouses(targetCompanyId);
  warehouses.value = data || [];
}

async function saveCurrent() {
  const { error } = await fetchUpdateCurrentOrgScope({
    companyId: companyId.value,
    warehouseId: warehouseId.value
  });
  if (!error) window.$message?.success('组织上下文已切换');
}

async function handleCompanyChange(value: CommonType.IdType | null) {
  if (!initialized.value) return;
  companyId.value = value;
  warehouseId.value = null;
  await loadWarehouses(value);
  await saveCurrent();
}

async function handleWarehouseChange(value: CommonType.IdType | null) {
  if (!initialized.value) return;
  warehouseId.value = value;
  const selectedWarehouse = warehouses.value.find(item => item.id === value);
  if (selectedWarehouse && companyId.value !== selectedWarehouse.companyId) {
    companyId.value = selectedWarehouse.companyId;
    await loadWarehouses(selectedWarehouse.companyId);
  }
  await saveCurrent();
}

onMounted(async () => {
  loading.value = true;
  const { data } = await fetchGetCurrentOrgScope();
  companyId.value = data?.companyId || null;
  warehouseId.value = data?.warehouseId || null;
  await loadCompanies();
  await loadWarehouses();
  initialized.value = true;
  loading.value = false;
});

watch(companyId, value => {
  if (value && !companies.value.some(item => item.id === value)) companyId.value = null;
});
</script>

<template>
  <NSpace :size="8" align="center" :wrap="false" class="mr-12px">
    <NSelect
      v-model:value="companyId"
      :options="companyOptions"
      :loading="loading"
      clearable
      filterable
      placeholder="主体"
      class="w-150px"
      @update:value="handleCompanyChange"
    />
    <NSelect
      v-model:value="warehouseId"
      :options="warehouseOptions"
      :loading="loading"
      clearable
      filterable
      placeholder="仓库"
      class="w-150px"
      @update:value="handleWarehouseChange"
    />
  </NSpace>
</template>
