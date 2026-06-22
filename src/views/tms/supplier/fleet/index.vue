<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchGetSupplierDriverList,
  fetchGetSupplierEquipmentList,
  fetchGetSupplierVehicleList
} from '@/service/api/tms/supplier';
import OmsListPage from '@/views/oms/components/oms-list-page.vue';

defineOptions({ name: 'TmsSupplierFleet' });

type FleetTab = 'vehicle' | 'driver' | 'equipment';

const activeTab = ref<FleetTab>('vehicle');
const keyword = ref<string | null>(null);
const searchParams = ref({ pageNum: 1, pageSize: 10, keyword: null as string | null });

const { record: equipTypeRecord } = useDict('oms_supplier_equipment_type');
const { record: equipStatusRecord } = useDict('oms_supplier_equipment_status');

function getText(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

function onPageChange(page: number | undefined, pageSize: number | undefined) {
  searchParams.value.pageNum = page ?? 1;
  searchParams.value.pageSize = pageSize ?? 10;
}

const {
  columns: vehicleColumns,
  columnChecks: vehicleColumnChecks,
  data: vehicleData,
  getData: getVehicleData,
  getDataByPage: getVehicleDataByPage,
  loading: vehicleLoading,
  mobilePagination: vehiclePagination,
  scrollX: vehicleScrollX
} = useNaivePaginatedTable({
  api: () => fetchGetSupplierVehicleList(searchParams.value),
  transform: response => defaultTransform(response),
  immediate: false,
  onPaginationParamsChange: ({ page, pageSize }) => onPageChange(page, pageSize),
  columns: () => [
    { key: 'plateNo', title: '车牌号', width: 120, fixed: 'left' },
    { key: 'supplierName', title: '供应商', minWidth: 160, ellipsis: { tooltip: true } },
    { key: 'vehicleType', title: '车型', width: 90 },
    { key: 'driverName', title: '绑定司机', width: 100, render: row => getText(row.driverName) },
    { key: 'gpsDeviceNo', title: 'GPS设备', width: 110, render: row => getText(row.gpsDeviceNo) },
    {
      key: 'vehicleStatus',
      title: '状态',
      width: 80,
      render: row => (
        <NTag size="small" type={row.vehicleStatus === 'ACTIVE' ? 'success' : 'default'}>
          {row.vehicleStatus === 'ACTIVE' ? '可用' : row.vehicleStatus}
        </NTag>
      )
    }
  ]
});

const {
  columns: driverColumns,
  columnChecks: driverColumnChecks,
  data: driverData,
  getData: getDriverData,
  getDataByPage: getDriverDataByPage,
  loading: driverLoading,
  mobilePagination: driverPagination,
  scrollX: driverScrollX
} = useNaivePaginatedTable({
  api: () => fetchGetSupplierDriverList(searchParams.value),
  transform: response => defaultTransform(response),
  immediate: false,
  onPaginationParamsChange: ({ page, pageSize }) => onPageChange(page, pageSize),
  columns: () => [
    { key: 'driverName', title: '司机姓名', width: 110, fixed: 'left' },
    { key: 'supplierName', title: '供应商', minWidth: 160, ellipsis: { tooltip: true } },
    { key: 'driverPhone', title: '电话', width: 130, render: row => getText(row.driverPhone) },
    { key: 'boundPlateNo', title: '绑定车辆', width: 120, render: row => getText(row.boundPlateNo) },
    {
      key: 'gpsOnline',
      title: 'GPS',
      width: 80,
      render: row => (
        <NTag size="small" type={row.gpsOnline ? 'success' : 'default'}>{row.gpsOnline ? '在线' : '离线'}</NTag>
      )
    }
  ]
});

const {
  columns: equipmentColumns,
  columnChecks: equipmentColumnChecks,
  data: equipmentData,
  getData: getEquipmentData,
  getDataByPage: getEquipmentDataByPage,
  loading: equipmentLoading,
  mobilePagination: equipmentPagination,
  scrollX: equipmentScrollX
} = useNaivePaginatedTable({
  api: () => fetchGetSupplierEquipmentList(searchParams.value),
  transform: response => defaultTransform(response),
  immediate: false,
  onPaginationParamsChange: ({ page, pageSize }) => onPageChange(page, pageSize),
  columns: () => [
    { key: 'equipmentNo', title: '设备编号', width: 110, fixed: 'left' },
    { key: 'supplierName', title: '供应商', minWidth: 160, ellipsis: { tooltip: true } },
    {
      key: 'equipmentType',
      title: '类型',
      width: 90,
      render: row => equipTypeRecord.value[row.equipmentType]?.dictLabel || row.equipmentType
    },
    { key: 'assigneeName', title: '领用人', width: 90, render: row => getText(row.assigneeName) },
    { key: 'relatedTaskNo', title: '关联任务', width: 130, render: row => getText(row.relatedTaskNo) },
    {
      key: 'equipmentStatus',
      title: '状态',
      width: 90,
      render: row => (
        <NTag size="small" type={(equipStatusRecord.value[row.equipmentStatus]?.listClass as NaiveUI.ThemeColor) || 'default'}>
          {equipStatusRecord.value[row.equipmentStatus]?.dictLabel || row.equipmentStatus}
        </NTag>
      )
    }
  ]
});

function reloadActive() {
  searchParams.value.pageNum = 1;
  searchParams.value.keyword = keyword.value;
  if (activeTab.value === 'vehicle') getVehicleDataByPage();
  else if (activeTab.value === 'driver') getDriverDataByPage();
  else getEquipmentDataByPage();
}

function refreshActive() {
  if (activeTab.value === 'vehicle') getVehicleData();
  else if (activeTab.value === 'driver') getDriverData();
  else getEquipmentData();
}

watch(activeTab, () => reloadActive());

onMounted(() => reloadActive());

function handleAddFleet() {
  window.$message?.info('[原型] 新增');
}
</script>

<template>
  <OmsListPage
    filter-title="车辆 / 司机 / 设备管理"
    filter-description="统一管理卡派/提柜车辆、司机档案，以及拆柜装车供应商的叉车、PDA 等设备领用记录。"
    content-title="资源列表"
  >
    <template #filter-actions>
      <NButton type="primary" @click="handleAddFleet">新增</NButton>
    </template>

    <template #filters>
      <NForm inline :show-feedback="false" class="mt-12px">
        <NFormItem label="关键字">
          <NInput v-model:value="keyword" clearable placeholder="车牌/司机/设备编号" class="w-200px" @keydown.enter="reloadActive" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="reloadActive">搜索</NButton>
          <NButton class="ml-8px" @click="keyword = null; reloadActive()">重置</NButton>
        </NFormItem>
      </NForm>
    </template>

    <template #tabs>
      <div class="flex gap-8px mb-4px">
        <NButton :type="activeTab === 'vehicle' ? 'primary' : 'default'" size="small" @click="activeTab = 'vehicle'">车辆</NButton>
        <NButton :type="activeTab === 'driver' ? 'primary' : 'default'" size="small" @click="activeTab = 'driver'">司机</NButton>
        <NButton :type="activeTab === 'equipment' ? 'primary' : 'default'" size="small" @click="activeTab = 'equipment'">设备</NButton>
      </div>
    </template>

    <template #header-extra>
      <TableHeaderOperation
        v-if="activeTab === 'vehicle'"
        v-model:columns="vehicleColumnChecks"
        :loading="vehicleLoading"
        @refresh="refreshActive"
      />
      <TableHeaderOperation
        v-else-if="activeTab === 'driver'"
        v-model:columns="driverColumnChecks"
        :loading="driverLoading"
        @refresh="refreshActive"
      />
      <TableHeaderOperation
        v-else
        v-model:columns="equipmentColumnChecks"
        :loading="equipmentLoading"
        @refresh="refreshActive"
      />
    </template>

    <NDataTable
      v-show="activeTab === 'vehicle'"
      :columns="vehicleColumns"
      :data="vehicleData"
      :loading="vehicleLoading"
      :scroll-x="vehicleScrollX"
      :pagination="vehiclePagination"
      remote
      size="small"
      class="min-h-0 flex-1"
      flex-height
    />
    <NDataTable
      v-show="activeTab === 'driver'"
      :columns="driverColumns"
      :data="driverData"
      :loading="driverLoading"
      :scroll-x="driverScrollX"
      :pagination="driverPagination"
      remote
      size="small"
      class="min-h-0 flex-1"
      flex-height
    />
    <NDataTable
      v-show="activeTab === 'equipment'"
      :columns="equipmentColumns"
      :data="equipmentData"
      :loading="equipmentLoading"
      :scroll-x="equipmentScrollX"
      :pagination="equipmentPagination"
      remote
      size="small"
      class="min-h-0 flex-1"
      flex-height
    />
  </OmsListPage>
</template>
