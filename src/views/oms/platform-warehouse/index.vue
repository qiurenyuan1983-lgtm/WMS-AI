<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import {
  NBadge,
  NButton,
  NCard,
  NDataTable,
  NDropdown,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
import type { DataTableColumns, DropdownOption } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import {
  fetchDeletePlatform,
  fetchGetPlatformList,
  fetchGetPlatformWarehouseList,
  fetchUpdatePlatform,
  fetchUpdatePlatformWarehouseStatus
} from '@/service/api/oms/platform-warehouse';
import { COUNTRY_OPTIONS, countryLabel, statusLabel, statusTagType } from './constants';
import PlatformOperateModal from './modules/platform-operate-modal.vue';
import WarehouseOperateDrawer from './modules/warehouse-operate-drawer.vue';

defineOptions({ name: 'OmsPlatformWarehouse' });

const platformKeyword = ref('');
const platforms = ref<Api.Oms.PlatformEntity[]>([]);
const platformLoading = ref(false);
const selectedPlatformId = ref<CommonType.IdType | null>(null);

const platformModalVisible = ref(false);
const editingPlatform = ref<Api.Oms.PlatformEntity | null>(null);

const warehouseDrawerVisible = ref(false);
const editingWarehouse = ref<Api.Oms.PlatformWarehouse | null>(null);

const searchParams = ref<Api.Oms.PlatformWarehouseSearchParams>({
  pageNum: 1,
  pageSize: 50,
  platformId: null,
  keyword: null,
  status: null,
  countryCode: null
});

const selectedPlatform = computed(() =>
  platforms.value.find(p => String(p.id) === String(selectedPlatformId.value)) ?? null
);

const filteredPlatforms = computed(() => {
  const kw = platformKeyword.value.trim().toLowerCase();
  if (!kw) return platforms.value;
  return platforms.value.filter(
    p => p.platformName.toLowerCase().includes(kw) || p.platformCode.toLowerCase().includes(kw)
  );
});

async function loadPlatforms(selectFirst = false) {
  platformLoading.value = true;
  const { data, error } = await fetchGetPlatformList();
  platformLoading.value = false;
  if (error) return;
  platforms.value = data?.rows || [];
  if (selectFirst && platforms.value.length && !selectedPlatformId.value) {
    selectedPlatformId.value = platforms.value[0].id;
  }
  if (selectedPlatformId.value && !platforms.value.some(p => p.id === selectedPlatformId.value)) {
    selectedPlatformId.value = platforms.value[0]?.id ?? null;
  }
}

function selectPlatform(id: CommonType.IdType) {
  selectedPlatformId.value = id;
  searchParams.value.pageNum = 1;
  getDataByPage(1);
}

function openAddPlatform() {
  editingPlatform.value = null;
  platformModalVisible.value = true;
}

function openEditPlatform(row: Api.Oms.PlatformEntity) {
  editingPlatform.value = row;
  platformModalVisible.value = true;
}

function platformMenuOptions(row: Api.Oms.PlatformEntity): DropdownOption[] {
  return [
    { label: '编辑平台', key: 'edit' },
    {
      label: row.status === '0' ? '停用平台' : '启用平台',
      key: 'toggle'
    },
    { label: '删除平台', key: 'delete' }
  ];
}

async function handlePlatformMenu(key: string, row: Api.Oms.PlatformEntity) {
  if (key === 'edit') {
    openEditPlatform(row);
    return;
  }
  if (key === 'toggle') {
    const next = row.status === '0' ? '1' : '0';
    const { error } = await fetchUpdatePlatform({
      id: row.id,
      platformName: row.platformName,
      platformCode: row.platformCode,
      status: next,
      remark: row.remark
    });
    if (error) return;
    window.$message?.success(next === '0' ? '平台已启用' : '平台已停用');
    await loadPlatforms();
    return;
  }
  if (key === 'delete') {
    window.$dialog?.warning({
      title: '删除平台',
      content: `确认删除平台 ${row.platformName}？其下仓库也会一并删除。`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: async () => {
        const { error } = await fetchDeletePlatform(String(row.id));
        if (error) return;
        window.$message?.success('平台已删除');
        if (String(selectedPlatformId.value) === String(row.id)) {
          selectedPlatformId.value = null;
        }
        await loadPlatforms(true);
        getData();
      }
    });
  }
}

const { columns, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () =>
      fetchGetPlatformWarehouseList({
        ...searchParams.value,
        platformId: selectedPlatformId.value
      }),
    transform: response => defaultTransform(response),
    immediate: false,
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', width: 48, fixed: 'left' },
      {
        key: 'warehouseCode',
        title: '仓库代码',
        width: 120,
        fixed: 'left',
        render: row => (
          <NButton text type="primary" onClick={() => openEditWarehouse(row)}>
            {row.warehouseCode}
          </NButton>
        )
      },
      { key: 'warehouseName', title: '仓库名称', minWidth: 140, ellipsis: { tooltip: true } },
      {
        key: 'countryCode',
        title: '国家/地区',
        width: 120,
        render: row => countryLabel(row.countryCode, row.countryName)
      },
      { key: 'address', title: '详细地址', minWidth: 220, ellipsis: { tooltip: true } },
      { key: 'zipCode', title: '邮编', width: 90 },
      { key: 'cbmPerPallet', title: '单托CBM', width: 90, align: 'center' },
      {
        key: 'status',
        title: '状态',
        width: 80,
        render: row => <NTag size="small" type={statusTagType(row.status)}>{statusLabel(row.status)}</NTag>
      },
      { key: 'createTime', title: '创建时间', width: 170 },
      {
        key: 'operate',
        title: '操作',
        width: 130,
        fixed: 'right',
        render: row => (
          <NSpace size={4}>
            <NButton text type="primary" size="small" onClick={() => openEditWarehouse(row)}>
              编辑
            </NButton>
            <NButton
              text
              type={row.status === '0' ? 'warning' : 'success'}
              size="small"
              onClick={() => toggleWarehouseStatus(row)}
            >
              {row.status === '0' ? '停用' : '启用'}
            </NButton>
          </NSpace>
        )
      }
    ] as DataTableColumns<Api.Oms.PlatformWarehouse>
  });

const { checkedRowKeys } = useTableOperate(data, 'id', getData);

watch(selectedPlatformId, id => {
  searchParams.value.platformId = id;
  if (id) getDataByPage(1);
});

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  searchParams.value.keyword = null;
  searchParams.value.status = null;
  searchParams.value.countryCode = null;
  getDataByPage(1);
}

function openAddWarehouse() {
  if (!selectedPlatformId.value) {
    window.$message?.warning('请先选择平台');
    return;
  }
  editingWarehouse.value = null;
  warehouseDrawerVisible.value = true;
}

function openEditWarehouse(row: Api.Oms.PlatformWarehouse) {
  editingWarehouse.value = row;
  warehouseDrawerVisible.value = true;
}

async function toggleWarehouseStatus(row: Api.Oms.PlatformWarehouse) {
  const next = row.status === '0' ? '1' : '0';
  const { error } = await fetchUpdatePlatformWarehouseStatus(row.id, next);
  if (error) return;
  window.$message?.success(next === '0' ? '仓库已启用' : '仓库已停用');
  getData();
}

function handleImport() {
  window.$message?.info('原型模式：导入仓库功能待接入');
}

function handleExport() {
  window.$message?.info('原型模式：导出功能待接入');
}

async function onPlatformSubmitted() {
  await loadPlatforms();
  getData();
}

async function onWarehouseSubmitted() {
  await loadPlatforms();
  getData();
}

onMounted(async () => {
  await loadPlatforms(true);
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-1 overflow-hidden">
      <div class="platform-warehouse-layout">
        <!-- 左侧平台列表 -->
        <aside class="platform-sidebar">
          <div class="platform-sidebar__header">
            <span class="font-medium">平台列表</span>
            <NButton type="primary" size="small" @click="openAddPlatform">+ 新增平台</NButton>
          </div>
          <NInput
            v-model:value="platformKeyword"
            placeholder="搜索平台名称或代码"
            clearable
            size="small"
            class="platform-sidebar__search"
          >
            <template #prefix>
              <icon-ic-round-search class="text-16px text-#9ca3af" />
            </template>
          </NInput>
          <div v-if="platformLoading" class="platform-sidebar__loading">加载中…</div>
          <div v-else-if="!filteredPlatforms.length" class="platform-sidebar__empty">
            <NEmpty description="暂无平台" size="small" />
          </div>
          <div v-else class="platform-sidebar__list">
            <div
              v-for="item in filteredPlatforms"
              :key="item.id"
              class="platform-item"
              :class="{ 'platform-item--active': String(selectedPlatformId) === String(item.id) }"
              @click="selectPlatform(item.id)"
            >
              <div class="platform-item__main">
                <div class="platform-item__title">
                  <span class="font-medium">{{ item.platformName }}</span>
                  <span class="text-12px text-#9ca3af">({{ item.platformCode }})</span>
                </div>
                <div class="platform-item__meta">
                  <NTag size="small" :type="statusTagType(item.status)">{{ statusLabel(item.status) }}</NTag>
                  <NBadge :value="item.warehouseCount" :max="999" type="error" />
                </div>
              </div>
              <NDropdown
                trigger="click"
                :options="platformMenuOptions(item)"
                @select="key => handlePlatformMenu(String(key), item)"
              >
                <NButton text size="tiny" class="platform-item__more" @click.stop>
                  <icon-ic-round-more-horiz class="text-18px" />
                </NButton>
              </NDropdown>
            </div>
          </div>
        </aside>

        <!-- 右侧仓库列表 -->
        <main class="warehouse-main">
          <div class="warehouse-main__title">
            <span class="text-16px font-medium">平台仓库管理</span>
            <span v-if="selectedPlatform" class="text-13px text-#6b7280">
              — {{ selectedPlatform.platformName }} ({{ selectedPlatform.platformCode }})
            </span>
          </div>

          <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" size="small" class="warehouse-main__filters">
            <NFormItem label="仓库代码/名称">
              <NInput
                v-model:value="searchParams.keyword"
                clearable
                placeholder="仓库代码/名称"
                class="w-180px"
                @keyup.enter="handleSearch"
              />
            </NFormItem>
            <NFormItem label="状态">
              <NSelect
                :to="POPUP_TO_BODY"
                v-model:value="searchParams.status"
                clearable
                :options="[
                  { label: '启用', value: '0' },
                  { label: '停用', value: '1' }
                ]"
                class="w-100px"
              />
            </NFormItem>
            <NFormItem label="国家/地区">
              <NSelect
                :to="POPUP_TO_BODY"
                v-model:value="searchParams.countryCode"
                clearable
                :options="COUNTRY_OPTIONS.map(o => ({ label: o.label, value: o.value }))"
                class="w-130px"
              />
            </NFormItem>
            <NFormItem>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="primary" class="ml-8px" @click="handleSearch">搜索</NButton>
            </NFormItem>
            <NFormItem class="ml-auto">
              <NSpace>
                <NButton @click="handleImport">导入仓库</NButton>
                <NButton @click="handleExport">导出</NButton>
                <NButton type="primary" :disabled="!selectedPlatformId" @click="openAddWarehouse">
                  新增仓库
                </NButton>
              </NSpace>
            </NFormItem>
          </NForm></NCollapseItem></NCollapse>

          <NDataTable
            v-model:checked-row-keys="checkedRowKeys"
            :columns="columns"
            :data="data"
            :loading="loading"
            :scroll-x="scrollX"
            :pagination="mobilePagination"
            :row-key="(row: Api.Oms.PlatformWarehouse) => row.id"
            size="small"
            flex-height
            class="warehouse-main__table"
          />
        </main>
      </div>
    </NCard>

    <PlatformOperateModal
      v-model:visible="platformModalVisible"
      :row="editingPlatform"
      @submitted="onPlatformSubmitted"
    />

    <WarehouseOperateDrawer
      v-model:visible="warehouseDrawerVisible"
      :platform="selectedPlatform"
      :row="editingWarehouse"
      @submitted="onWarehouseSubmitted"
    />
  </div>
</template>

<style scoped>
.platform-warehouse-layout {
  display: flex;
  gap: 12px;
  height: calc(100vh - 220px);
  min-height: 520px;
}

.platform-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: #fafafa;
  overflow: hidden;
}

.platform-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--n-border-color);
  background: #fff;
}

.platform-sidebar__search {
  margin: 10px 12px 0;
}

.platform-sidebar__loading,
.platform-sidebar__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.platform-sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.platform-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 8px 10px 12px;
  margin-bottom: 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.platform-item:hover {
  border-color: #dbeafe;
}

.platform-item--active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.platform-item__main {
  flex: 1;
  min-width: 0;
}

.platform-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 6px;
}

.platform-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-item__more {
  flex-shrink: 0;
  margin-top: 2px;
}

.warehouse-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  overflow: hidden;
}

.warehouse-main__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.warehouse-main__filters {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.warehouse-main__filters :deep(.n-form-item) {
  margin-bottom: 8px;
}

.warehouse-main__table {
  flex: 1;
  min-height: 0;
}

@media (max-width: 960px) {
  .platform-warehouse-layout {
    flex-direction: column;
    height: auto;
  }

  .platform-sidebar {
    width: 100%;
    max-height: 240px;
  }
}
</style>
