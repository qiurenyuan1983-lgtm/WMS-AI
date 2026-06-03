<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NTag
} from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchBatchDeleteWmsLocation,
  fetchChangeWmsLocationStatus,
  fetchCreateWmsLocation,
  fetchGetWmsLocationList,
  fetchGetWmsZoneOptions,
  fetchUpdateWmsLocation
} from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import LocationImportModal from './modules/location-import-modal.vue';

defineOptions({ name: 'WmsLocationList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { record: zoneTypeRecord } = useDict('wms_zone_type');
const { record: storageRecord } = useDict('wms_storage_method');
const { record: statusRecord } = useDict('wms_location_status');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType; code: string; name: string }>>([]);
const zoneOptions = ref<Array<{ label: string; value: CommonType.IdType; name: string }>>([]);
const zonePanelList = ref<Api.Wms.Zone[]>([]);
const zonePanelKeyword = ref('');
const selectedZoneId = ref<CommonType.IdType | null>(null);
const importVisible = ref(false);
const statusModalVisible = ref(false);
const batchStatus = ref('NORMAL');

const zonePanelParams = ref({ pageNum: 1, pageSize: 12, total: 0 });

const searchParams = ref<Api.Wms.LocationSearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: null,
  warehouseId: null,
  zoneId: null,
  zoneName: null,
  locationCode: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const formModel = ref<Api.Wms.LocationOperateParams>({
  id: null,
  companyId: 4000001,
  warehouseId: null,
  warehouseCode: null,
  warehouseName: null,
  zoneId: null,
  zoneName: null,
  locationCode: null,
  rowNo: null,
  columnNo: null,
  capacity: null,
  status: 'NORMAL',
  remark: null
});

const filteredZonePanelList = computed(() => {
  const keyword = zonePanelKeyword.value.trim().toLowerCase();
  if (!keyword) return zonePanelList.value;
  return zonePanelList.value.filter(item => item.zoneName?.toLowerCase().includes(keyword));
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.LocationList, Api.Wms.Location>({
    api: () => fetchGetWmsLocationList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', width: 60, render: (_, index) => index + 1 },
      { key: 'zoneName', title: '区域', width: 140 },
      { key: 'locationCode', title: '库位', width: 140, fixed: 'left' },
      { key: 'rowNo', title: '行', width: 80 },
      { key: 'columnNo', title: '列', width: 80 },
      { key: 'capacity', title: '库位容量', width: 100, align: 'right', render: row => row.capacity ?? '—' },
      { key: 'currentQty', title: '现有库存', width: 100, align: 'right' },
      {
        key: 'remainingCapacity',
        title: '剩余容量',
        width: 100,
        align: 'right',
        render: row => (row.remainingCapacity == null ? '—' : row.remainingCapacity)
      },
      {
        key: 'status',
        title: '状态',
        width: 90,
        render: row => (
          <NTag
            size="small"
            type={row.status === 'NORMAL' ? 'success' : row.status === 'LOCKED' ? 'warning' : 'default'}
          >
            {statusRecord.value[row.status]?.dictLabel || row.status}
          </NTag>
        )
      },
      {
        key: 'operate',
        title: '操作',
        width: 150,
        fixed: 'right',
        render: row => (
          <div class="flex gap-8px">
            {hasAuth('wms:location:edit') ? <NButton size="tiny" onClick={() => openEdit(row)}>编辑</NButton> : null}
            {hasAuth('wms:location:remove') ? (
              <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
                {{
                  default: () => '确认删除该库位？',
                  trigger: () => <NButton size="tiny" type="error">删除</NButton>
                }}
              </NPopconfirm>
            ) : null}
          </div>
        )
      }
    ]
  });

const { drawerVisible, openDrawer, closeDrawer, checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate(
  data,
  'id',
  getData
);

const modalTitle = computed(() => (formModel.value.id ? '编辑库位' : '新增库位'));

function zonePanelLabel(zone: Api.Wms.Zone) {
  const typeLabel = zoneTypeRecord.value[zone.zoneType]?.dictLabel || zone.zoneType;
  const storageLabel = storageRecord.value[zone.storageMethod]?.dictLabel || zone.storageMethod;
  return `${typeLabel}、${storageLabel}`;
}

async function loadWarehouses() {
  const { data: whData } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500 } as any);
  warehouseOptions.value = ((whData as any)?.rows || []).map((item: any) => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id,
    code: item.warehouseCode,
    name: item.warehouseName
  }));
}

async function loadZonePanel() {
  if (!searchParams.value.warehouseId) {
    zonePanelList.value = [];
    return;
  }
  const { data } = await fetchGetWmsZoneOptions({
    pageNum: zonePanelParams.value.pageNum,
    pageSize: zonePanelParams.value.pageSize,
    warehouseId: searchParams.value.warehouseId,
    zoneName: zonePanelKeyword.value || null
  } as any);
  zonePanelList.value = data || [];
}

async function loadZonesForForm(warehouseId?: CommonType.IdType | null) {
  const { data: zoneData } = await fetchGetWmsZoneOptions({
    pageNum: 1,
    pageSize: 500,
    warehouseId: warehouseId || null
  } as any);
  zoneOptions.value = (zoneData || []).map(item => ({
    label: item.zoneName,
    value: item.id,
    name: item.zoneName
  }));
}

function selectZone(zoneId: CommonType.IdType | null) {
  selectedZoneId.value = zoneId;
  searchParams.value.zoneId = zoneId;
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function openAdd() {
  formModel.value = {
    id: null,
    companyId: 4000001,
    warehouseId: searchParams.value.warehouseId,
    warehouseCode: null,
    warehouseName: null,
    zoneId: selectedZoneId.value,
    zoneName: null,
    locationCode: null,
    rowNo: null,
    columnNo: null,
    capacity: null,
    status: 'NORMAL',
    remark: null
  };
  loadZonesForForm(searchParams.value.warehouseId);
  openDrawer();
}

function openEdit(row: Api.Wms.Location) {
  formModel.value = { ...row };
  loadZonesForForm(row.warehouseId);
  openDrawer();
}

function handleWarehouseChange(value: CommonType.IdType | null) {
  const item = warehouseOptions.value.find(option => option.value === value);
  formModel.value.warehouseCode = item?.code || null;
  formModel.value.warehouseName = item?.name || null;
  formModel.value.zoneId = null;
  formModel.value.zoneName = null;
  loadZonesForForm(value);
}

function handleZoneChange(value: CommonType.IdType | null) {
  const item = zoneOptions.value.find(option => option.value === value);
  formModel.value.zoneName = item?.name || null;
}

async function submitForm() {
  const api = formModel.value.id ? fetchUpdateWmsLocation : fetchCreateWmsLocation;
  const { error } = await api(formModel.value);
  if (error) return;
  window.$message?.success('保存成功');
  closeDrawer();
  getData();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteWmsLocation([id]);
  if (!error) onDeleted();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteWmsLocation(checkedRowKeys.value);
  if (!error) onBatchDeleted();
}

async function submitBatchStatus() {
  if (!checkedRowKeys.value.length) return;
  const { error } = await fetchChangeWmsLocationStatus({
    ids: checkedRowKeys.value,
    status: batchStatus.value
  });
  if (error) return;
  window.$message?.success('状态已更新');
  statusModalVisible.value = false;
  getData();
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value.locationCode = null;
  searchParams.value.status = null;
  handleSearch();
}

watch(
  () => searchParams.value.warehouseId,
  () => {
    selectedZoneId.value = null;
    searchParams.value.zoneId = null;
    loadZonePanel();
    getDataByPage();
  }
);

loadWarehouses();
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="仓库">
          <NSelect
            v-model:value="searchParams.warehouseId"
            :options="warehouseOptions"
            filterable
            clearable
            placeholder="请选择仓库"
            class="w-220px"
          />
        </NFormItem>
        <NFormItem label="库位编码">
          <NInput v-model:value="searchParams.locationCode" clearable placeholder="库位编码" class="w-160px" />
        </NFormItem>
        <NFormItem label="状态">
          <DictSelect v-model:value="searchParams.status" dict-code="wms_location_status" clearable class="w-120px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <div class="flex flex-1 gap-16px overflow-hidden">
      <NCard title="库区" :bordered="false" size="small" class="w-280px flex-shrink-0 card-wrapper">
        <NInput
          v-model:value="zonePanelKeyword"
          clearable
          placeholder="搜索库区名称"
          class="mb-12px"
          @keydown.enter="loadZonePanel"
        />
        <div
          class="mb-8px cursor-pointer rounded-6px px-10px py-8px text-13px"
          :class="selectedZoneId === null ? 'bg-primary/10 text-primary font-500' : 'hover:bg-gray-100'"
          @click="selectZone(null)"
        >
          全部库位
        </div>
        <div class="max-h-420px flex flex-col gap-6px overflow-auto">
          <div
            v-for="zone in filteredZonePanelList"
            :key="zone.id"
            class="cursor-pointer rounded-6px border border-transparent px-10px py-8px text-13px hover:bg-gray-50"
            :class="selectedZoneId === zone.id ? 'border-primary bg-primary/5' : ''"
            @click="selectZone(zone.id)"
          >
            <div class="font-500">{{ zone.zoneName }}</div>
            <NTag size="tiny" class="mt-4px">{{ zonePanelLabel(zone) }}</NTag>
          </div>
        </div>
        <div class="mt-12px text-12px text-gray-500">共 {{ filteredZonePanelList.length }} 个库区</div>
      </NCard>

      <NCard title="库位管理" :bordered="false" size="small" class="card-wrapper min-w-0 flex-1 sm:flex-1-hidden">
        <template #header-extra>
          <div class="flex items-center gap-8px">
            <NButton v-if="hasAuth('wms:location:changeStatus')" size="small" :disabled="!checkedRowKeys.length" @click="statusModalVisible = true">
              修改状态
            </NButton>
            <NButton v-if="hasAuth('wms:location:import')" size="small" @click="importVisible = true">导入库位</NButton>
            <TableHeaderOperation
              v-model:columns="columnChecks"
              :disabled-delete="checkedRowKeys.length === 0"
              :loading="loading"
              :show-add="hasAuth('wms:location:add')"
              :show-delete="hasAuth('wms:location:remove')"
              :show-export="false"
              @add="openAdd"
              @delete="handleBatchDelete"
              @refresh="getData"
            />
          </div>
        </template>
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          :loading="loading"
          :pagination="mobilePagination"
          :scroll-x="scrollX"
          :row-key="(row: Api.Wms.Location) => row.id"
          :flex-height="!appStore.isMobile"
          remote
          size="small"
          class="sm:h-full"
        />
      </NCard>
    </div>

    <NModal v-model:show="drawerVisible" preset="card" :title="modalTitle" class="w-640px">
      <NForm label-placement="left" label-width="100">
        <NFormItem label="所属仓库" required>
          <NSelect
            v-model:value="formModel.warehouseId"
            :options="warehouseOptions"
            filterable
            clearable
            @update:value="handleWarehouseChange"
          />
        </NFormItem>
        <NFormItem label="所属库区" required>
          <NSelect v-model:value="formModel.zoneId" :options="zoneOptions" filterable clearable @update:value="handleZoneChange" />
        </NFormItem>
        <NFormItem label="库位编码" required>
          <NInput v-model:value="formModel.locationCode" />
        </NFormItem>
        <div class="grid grid-cols-2 gap-x-16px">
          <NFormItem label="行">
            <NInput v-model:value="formModel.rowNo" />
          </NFormItem>
          <NFormItem label="列">
            <NInput v-model:value="formModel.columnNo" />
          </NFormItem>
        </div>
        <NFormItem label="库位容量">
          <NInputNumber v-model:value="formModel.capacity" class="w-full" :min="0" />
        </NFormItem>
        <NFormItem label="状态" required>
          <DictSelect v-model:value="formModel.status" dict-code="wms_location_status" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="formModel.remark" type="textarea" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="closeDrawer">取消</NButton>
          <NButton type="primary" @click="submitForm">保存</NButton>
        </div>
      </template>
    </NModal>

    <NModal v-model:show="statusModalVisible" preset="card" title="批量修改状态" class="w-400px">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="状态">
          <DictSelect v-model:value="batchStatus" dict-code="wms_location_status" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="statusModalVisible = false">取消</NButton>
          <NButton type="primary" @click="submitBatchStatus">确定</NButton>
        </div>
      </template>
    </NModal>

    <LocationImportModal
      v-model:visible="importVisible"
      :warehouse-id="searchParams.warehouseId"
      :company-id="searchParams.companyId"
      @submitted="getData"
    />
  </div>
</template>
