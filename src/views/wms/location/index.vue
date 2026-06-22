<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { NButton, NCard, NDataTable, NDropdown, NForm, NFormItem, NInput, NInputNumber, NModal, NPopconfirm, NProgress, NSelect, NTag } from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchBatchDeleteWmsLocation,
  fetchChangeWmsLocationStatus,
  fetchCreateWmsLocation,
  fetchGetWmsLocationList,
  fetchGetWmsLocationStats,
  fetchGetWmsZoneOptions
} from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import {
  LOCATION_VIEW_OPTIONS,
  locationOperateStatusLabel,
  locationOperateStatusType,
  type LocationViewMode
} from './constants';
import LocationDetailDrawer from './modules/location-detail-drawer.vue';
import LocationMapView from './modules/location-map-view.vue';
import LocationKanbanView from './modules/location-kanban-view.vue';
import LocationBatchGenerateModal from './modules/location-batch-generate-modal.vue';
import LocationBatchActionModal from './modules/location-batch-action-modal.vue';
import LocationImportModal from './modules/location-import-modal.vue';

defineOptions({ name: 'WmsLocationList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { record: zoneTypeRecord } = useDict('wms_zone_type');
const { record: storageMethodRecord } = useDict('wms_storage_method');

const viewMode = ref<LocationViewMode>('list');
const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType; code: string; name: string }>>([]);
const zoneOptions = ref<Array<{ label: string; value: CommonType.IdType; name: string }>>([]);
const zoneList = ref<Api.Wms.Zone[]>([]);
const zoneKeyword = ref('');
const zoneLocationCounts = ref<Record<string, number>>({});
const stats = ref<Api.Wms.LocationStats | null>(null);
const statsLoading = ref(false);
const mapLocations = ref<Api.Wms.Location[]>([]);
const detailVisible = ref(false);
const selectedRow = ref<Api.Wms.Location | null>(null);
const importVisible = ref(false);
const generateVisible = ref(false);
const batchActionVisible = ref(false);
const batchActionMode = ref<'capacity' | 'bind'>('capacity');
const createModalVisible = ref(false);

const searchParams = ref<Api.Wms.LocationSearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: 4000001,
  warehouseId: null,
  zoneId: null,
  keyword: null,
  status: null,
  purpose: null,
  platformCode: null,
  customerName: null
});

const createForm = ref<Api.Wms.LocationOperateParams>({
  companyId: 4000001,
  warehouseId: null,
  zoneId: null,
  locationCode: null,
  capacity: 30,
  status: 'EMPTY',
  purpose: 'GENERAL',
  destinationLimit: 1,
  destinationCodes: []
});

const checkedRowKeys = ref<CommonType.IdType[]>([]);

const zoneOptionsForMap = computed(() =>
  zoneOptions.value.map(z => ({ label: z.label, value: z.value, zoneName: z.name }))
);

const statusChangeOptions = computed(() => [
  { label: '启用（空闲）', key: 'enable', disabled: !checkedRowKeys.value.length },
  { label: '禁用', key: 'disable', disabled: !checkedRowKeys.value.length },
  { label: '锁定', key: 'lock', disabled: !checkedRowKeys.value.length },
  { label: '解锁', key: 'unlock', disabled: !checkedRowKeys.value.length }
]);

const batchMenuOptions = computed(() => [
  ...statusChangeOptions.value,
  { label: '设置容量', key: 'capacity', disabled: !checkedRowKeys.value.length },
  { label: '设置用途/绑定', key: 'bind', disabled: !checkedRowKeys.value.length },
  { label: '打印二维码', key: 'print', disabled: !checkedRowKeys.value.length },
  { label: '批量删除', key: 'delete', disabled: !checkedRowKeys.value.length }
]);

const filteredSidebarZones = computed(() => {
  const keyword = zoneKeyword.value.trim().toLowerCase();
  const list = zoneList.value;
  return keyword ? list.filter(z => z.zoneName.toLowerCase().includes(keyword)) : list;
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetWmsLocationList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      {
        key: 'index',
        title: '序号',
        width: 60,
        align: 'center',
        render: (_, index) => index + 1
      },
      { key: 'zoneName', title: '区域', width: 90 },
      {
        key: 'locationCode',
        title: '库位',
        width: 100,
        fixed: 'left',
        render: row => (
          <NButton text type="primary" onClick={() => openDetail(row)}>
            {row.locationCode}
          </NButton>
        )
      },
      {
        key: 'capacity',
        title: '库位容量',
        width: 96,
        align: 'center',
        render: row => row.capacity ?? 8
      },
      {
        key: 'currentQty',
        title: '现有库存',
        width: 96,
        align: 'center',
        render: row => row.currentQty ?? 0
      },
      {
        key: 'remainingCapacity',
        title: '剩余容量',
        width: 96,
        align: 'center',
        render: row => row.remainingCapacity ?? Math.max(0, (row.capacity ?? 8) - (row.currentQty ?? 0))
      },
      {
        key: 'status',
        title: '状态',
        width: 88,
        render: row => (
          <NTag size="small" type={locationOperateStatusType(row.status)}>
            {locationOperateStatusLabel(row.status)}
          </NTag>
        )
      },
      {
        key: 'operate',
        title: '操作',
        width: 120,
        fixed: 'right',
        render: row => (
          <div class="flex items-center gap-4px">
            <NButton size="tiny" quaternary onClick={() => openDetail(row)}>
              查看
            </NButton>
            <NButton size="tiny" quaternary onClick={() => openDetail(row)}>
              编辑
            </NButton>
            <NPopconfirm onPositiveClick={() => handleDeleteRow(row.id)}>
              {{
                default: () => '确认删除该库位？',
                trigger: () => (
                  <NButton size="tiny" quaternary type="error">
                    删除
                  </NButton>
                )
              }}
            </NPopconfirm>
          </div>
        )
      }
    ]
  });

async function loadStats() {
  statsLoading.value = true;
  const { data: statData } = await fetchGetWmsLocationStats({
    warehouseId: searchParams.value.warehouseId,
    zoneId: searchParams.value.zoneId
  });
  stats.value = statData;
  statsLoading.value = false;
}

async function loadMapData() {
  const { data: listData } = await fetchGetWmsLocationList({
    ...searchParams.value,
    pageNum: 1,
    pageSize: 200
  });
  mapLocations.value = listData?.rows || [];
}

async function refreshAll() {
  await Promise.all([getData(), loadStats(), loadMapData()]);
}

async function loadWarehouses() {
  const { data: whData } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500 } as any);
  warehouseOptions.value = ((whData as any)?.rows || []).map((item: any) => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id,
    code: item.warehouseCode,
    name: item.warehouseName
  }));
  if (!searchParams.value.warehouseId && warehouseOptions.value.length) {
    searchParams.value.warehouseId = warehouseOptions.value[0].value;
  }
}

async function loadZones() {
  if (!searchParams.value.warehouseId) {
    zoneOptions.value = [];
    zoneList.value = [];
    return;
  }
  const { data: zoneData } = await fetchGetWmsZoneOptions({
    pageNum: 1,
    pageSize: 500,
    warehouseId: searchParams.value.warehouseId
  } as any);
  zoneList.value = zoneData || [];
  zoneOptions.value = zoneList.value.map(item => ({
    label: item.zoneName,
    value: item.id,
    name: item.zoneName
  }));
  await loadZoneLocationCounts();
}

async function loadZoneLocationCounts() {
  const { data: listData } = await fetchGetWmsLocationList({
    warehouseId: searchParams.value.warehouseId,
    pageNum: 1,
    pageSize: 5000
  });
  const counts: Record<string, number> = {};
  (listData?.rows || []).forEach(row => {
    const key = String(row.zoneId);
    counts[key] = (counts[key] || 0) + 1;
  });
  zoneLocationCounts.value = counts;
}

function selectZone(zoneId: CommonType.IdType | null) {
  searchParams.value.zoneId = zoneId;
  searchParams.value.pageNum = 1;
  refreshAll();
}

async function handleDeleteRow(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteWmsLocation([id]);
  if (error) return;
  window.$message?.success('已删除');
  refreshAll();
}

function zoneTypeLabel(zone: Api.Wms.Zone) {
  return zoneTypeRecord.value[zone.zoneType]?.dictLabel || zone.zoneType;
}

function storageMethodLabel(zone: Api.Wms.Zone) {
  return storageMethodRecord.value[zone.storageMethod]?.dictLabel || zone.storageMethod;
}

function openDetail(row: Api.Wms.Location) {
  selectedRow.value = row;
  detailVisible.value = true;
}

function openCreate() {
  createForm.value = {
    companyId: 4000001,
    warehouseId: searchParams.value.warehouseId,
    zoneId: zoneOptions.value[0]?.value ?? null,
    zoneName: zoneOptions.value[0]?.name ?? null,
    locationCode: null,
    capacity: 30,
    status: 'EMPTY',
    purpose: 'GENERAL',
    destinationLimit: 1,
    destinationCodes: []
  };
  createModalVisible.value = true;
}

async function submitCreate() {
  if (!createForm.value.locationCode?.trim()) {
    window.$message?.warning('请填写库位编码');
    return;
  }
  const wh = warehouseOptions.value.find(w => w.value === createForm.value.warehouseId);
  createForm.value.warehouseCode = wh?.code ?? null;
  createForm.value.warehouseName = wh?.name ?? null;
  const zone = zoneOptions.value.find(z => z.value === createForm.value.zoneId);
  createForm.value.zoneName = zone?.name ?? null;
  const { error } = await fetchCreateWmsLocation(createForm.value);
  if (error) return;
  window.$message?.success('库位已创建');
  createModalVisible.value = false;
  refreshAll();
}

async function batchChangeStatus(status: string) {
  if (!checkedRowKeys.value.length) return;
  const { error } = await fetchChangeWmsLocationStatus({ ids: checkedRowKeys.value, status });
  if (error) return;
  window.$message?.success('状态已更新');
  refreshAll();
}

async function handleBatchMenu(key: string) {
  if (key === 'enable') await batchChangeStatus('EMPTY');
  if (key === 'disable') await batchChangeStatus('DISABLED');
  if (key === 'lock') await batchChangeStatus('LOCKED');
  if (key === 'unlock') await batchChangeStatus('EMPTY');
  if (key === 'capacity') {
    batchActionMode.value = 'capacity';
    batchActionVisible.value = true;
  }
  if (key === 'bind') {
    batchActionMode.value = 'bind';
    batchActionVisible.value = true;
  }
  if (key === 'print') window.$message?.success(`已发送 ${checkedRowKeys.value.length} 个库位二维码打印任务（原型）`);
  if (key === 'delete') {
    const { error } = await fetchBatchDeleteWmsLocation(checkedRowKeys.value);
    if (!error) {
      window.$message?.success('已删除');
      checkedRowKeys.value = [];
      refreshAll();
    }
  }
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  refreshAll();
}

function handleReset() {
  searchParams.value.keyword = null;
  searchParams.value.zoneId = null;
  searchParams.value.status = null;
  searchParams.value.purpose = null;
  searchParams.value.platformCode = null;
  searchParams.value.customerName = null;
  zoneKeyword.value = '';
  handleSearch();
}

watch(
  () => searchParams.value.warehouseId,
  async () => {
    searchParams.value.zoneId = null;
    await loadZones();
    handleSearch();
  }
);

watch(viewMode, mode => {
  if (mode !== 'list') loadMapData();
});

loadWarehouses().then(() => refreshAll());
</script>

<template>
  <div class="location-page min-h-500px flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper shrink-0">
      <div class="mb-12px flex flex-wrap items-start justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">库位管理</div>
          <div class="mt-4px text-12px text-#6b7280">管理仓库库位资料与状态，支持列表 / 地图 / 看板视图及批量运维。</div>
        </div>
        <NButtonGroup size="small">
          <NButton
            v-for="opt in LOCATION_VIEW_OPTIONS"
            :key="opt.value"
            :type="viewMode === opt.value ? 'primary' : 'default'"
            @click="viewMode = opt.value"
          >
            {{ opt.label }}
          </NButton>
        </NButtonGroup>
      </div>

      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" class="flex flex-wrap gap-y-8px">
        <NFormItem label="仓库">
          <NSelect v-model:value="searchParams.warehouseId" :options="warehouseOptions" filterable class="w-200px" />
        </NFormItem>
        <NFormItem label="库区">
          <NSelect v-model:value="searchParams.zoneId" :options="zoneOptions" clearable filterable class="w-120px" />
        </NFormItem>
        <NFormItem label="关键词">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="库位/客户/平台" class="w-160px" @keyup.enter="handleSearch" />
        </NFormItem>
        <NFormItem label="状态">
          <DictSelect v-model:value="searchParams.status" dict-code="wms_location_status" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="用途">
          <DictSelect v-model:value="searchParams.purpose" dict-code="wms_location_purpose" clearable class="w-120px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm></NCollapseItem></NCollapse>
    </NCard>

    <div class="location-body min-h-0 flex flex-1 gap-12px overflow-hidden">
      <NCard :bordered="false" size="small" class="zone-sidebar card-wrapper w-260px shrink-0">
        <div class="mb-8px flex items-center justify-between">
          <span class="font-600">库区</span>
          <span class="text-12px text-#6b7280">共 {{ zoneList.length }} 个</span>
        </div>
        <NInput v-model:value="zoneKeyword" clearable placeholder="搜索库区" size="small" class="mb-10px" />
        <div
          class="zone-item"
          :class="{ active: !searchParams.zoneId }"
          @click="selectZone(null)"
        >
          <div class="font-600">全部库区</div>
        </div>
        <div
          v-for="zone in filteredSidebarZones"
          :key="zone.id"
          class="zone-item"
          :class="{ active: String(searchParams.zoneId) === String(zone.id) }"
          @click="selectZone(zone.id)"
        >
          <div class="flex items-start justify-between gap-8px">
            <div class="min-w-0">
              <div class="font-600">{{ zone.zoneName }}</div>
              <div class="mt-4px flex flex-wrap gap-4px">
                <NTag size="tiny" :bordered="false">{{ zoneTypeLabel(zone) }}</NTag>
                <NTag size="tiny" type="info" :bordered="false">{{ storageMethodLabel(zone) }}</NTag>
              </div>
            </div>
            <span class="text-12px shrink-0 text-#6b7280">{{ zoneLocationCounts[String(zone.id)] || 0 }}</span>
          </div>
        </div>
      </NCard>

      <NCard :bordered="false" size="small" class="card-wrapper min-w-0 flex-1 flex-col">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-8px">
            <span class="font-medium">库位列表</span>
            <div class="flex flex-wrap gap-8px">
              <NDropdown trigger="click" :options="batchMenuOptions" @select="handleBatchMenu">
                <NButton size="small">批量操作</NButton>
              </NDropdown>
              <NDropdown trigger="click" :options="statusChangeOptions" @select="handleBatchMenu">
                <NButton size="small">修改状态</NButton>
              </NDropdown>
              <NButton v-if="hasAuth('wms:location:add')" type="primary" size="small" @click="openCreate">新增库位</NButton>
              <NButton v-if="hasAuth('wms:location:import')" size="small" @click="importVisible = true">导入库位</NButton>
              <NButton size="small" @click="generateVisible = true">批量生成</NButton>
              <NButtonGroup size="small">
                <NButton
                  v-for="opt in LOCATION_VIEW_OPTIONS"
                  :key="opt.value"
                  :type="viewMode === opt.value ? 'primary' : 'default'"
                  @click="viewMode = opt.value"
                >
                  {{ opt.label }}
                </NButton>
              </NButtonGroup>
              <TableHeaderOperation
                v-model:columns="columnChecks"
                :loading="loading"
                :show-add="false"
                :show-delete="false"
                @refresh="refreshAll"
              />
            </div>
          </div>
        </template>

        <div v-show="viewMode === 'list'" class="h-full min-h-360px">
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
            class="h-full"
            :row-props="row => ({ style: selectedRow?.id === row.id ? 'background: rgb(var(--primary-color) / 0.06)' : '' })"
          />
        </div>

        <LocationMapView
          v-if="viewMode === 'map'"
          :locations="mapLocations"
          :zone-options="zoneOptionsForMap"
          @select="openDetail"
        />

        <LocationKanbanView v-if="viewMode === 'kanban'" :locations="mapLocations" @select="openDetail" />
      </NCard>
    </div>

    <LocationDetailDrawer
      v-model:visible="detailVisible"
      :row="selectedRow"
      :zone-options="zoneOptions"
      :warehouse-options="warehouseOptions"
      @submitted="refreshAll"
      @print-qr="() => {}"
    />

    <LocationBatchGenerateModal
      v-model:visible="generateVisible"
      :warehouse-id="searchParams.warehouseId"
      :zone-options="zoneOptions"
      @submitted="refreshAll"
    />

    <LocationBatchActionModal
      v-model:visible="batchActionVisible"
      :mode="batchActionMode"
      :ids="checkedRowKeys"
      @submitted="refreshAll"
    />

    <LocationImportModal
      v-model:visible="importVisible"
      :warehouse-id="searchParams.warehouseId"
      :company-id="searchParams.companyId"
      @submitted="refreshAll"
    />

    <NModal v-model:show="createModalVisible" preset="card" title="新增库位" class="w-560px">
      <NForm label-placement="left" label-width="90" size="small">
        <NFormItem label="所属库区">
          <NSelect v-model:value="createForm.zoneId" :options="zoneOptions" />
        </NFormItem>
        <NFormItem label="库位编码" required>
          <NInput v-model:value="createForm.locationCode" placeholder="如 A-01-01" />
        </NFormItem>
        <NFormItem label="库位容量">
          <NInputNumber v-model:value="createForm.capacity" class="w-full" :min="1" />
        </NFormItem>
        <NFormItem label="用途">
          <DictSelect v-model:value="createForm.purpose" dict-code="wms_location_purpose" />
        </NFormItem>
        <NFormItem label="状态">
          <DictSelect v-model:value="createForm.status" dict-code="wms_location_status" />
        </NFormItem>
        <NFormItem label="目的地数量">
          <NInputNumber v-model:value="createForm.destinationLimit" class="w-full" :min="1" :max="10" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="createModalVisible = false">取消</NButton>
          <NButton type="primary" @click="submitCreate">保存</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.location-page {
  height: calc(100vh - 120px - var(--calc-footer-height, 0px));
}

.location-body {
  min-height: 420px;
}

.zone-sidebar :deep(.n-card__content) {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.zone-item {
  padding: 10px 8px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: rgb(var(--primary-color) / 0.04);
  }

  &.active {
    background: rgb(var(--primary-color) / 0.08);
    border-color: rgb(var(--primary-color) / 0.25);
  }
}
</style>
