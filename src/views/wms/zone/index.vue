<script setup lang="tsx">
import { computed, ref } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NDropdown,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSwitch,
  NTag
} from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchBatchDeleteWmsZone,
  fetchChangeWmsZoneStatus,
  fetchCreateWmsZone,
  fetchGetWmsZoneList,
  fetchUpdateWmsZone
} from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';

defineOptions({ name: 'WmsZoneList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { record: typeRecord } = useDict('wms_zone_type');
const { record: storageRecord } = useDict('wms_storage_method');
const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType; code: string; name: string }>>([]);
const searchParams = ref<Api.Wms.ZoneSearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyId: null,
  warehouseId: null,
  zoneName: null,
  zoneType: null,
  storageMethod: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const formModel = ref<Api.Wms.ZoneOperateParams>({
  id: null,
  companyId: 4000001,
  warehouseId: null,
  warehouseCode: null,
  warehouseName: null,
  zoneName: null,
  storageMethod: 'FLOOR',
  zoneType: 'TEMP',
  allowMixedStorage: 0,
  maxMixedQty: null,
  status: 'ENABLED',
  remark: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable<Api.Wms.ZoneList, Api.Wms.Zone>({
    api: () => fetchGetWmsZoneList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', width: 60, render: (_, index) => index + 1 },
      { key: 'zoneName', title: '区域', width: 160, fixed: 'left' },
      {
        key: 'storageMethod',
        title: '存放方式',
        width: 100,
        render: row => storageRecord.value[row.storageMethod]?.dictLabel || row.storageMethod
      },
      {
        key: 'zoneType',
        title: '库区类型',
        width: 120,
        render: row => <NTag size="small">{typeRecord.value[row.zoneType]?.dictLabel || row.zoneType}</NTag>
      },
      {
        key: 'allowMixedStorage',
        title: '库位混合存储',
        width: 120,
        align: 'center',
        render: row => (row.allowMixedStorage === 1 ? '是' : '否')
      },
      {
        key: 'maxMixedQty',
        title: '最大混合数量',
        width: 120,
        align: 'center',
        render: row => (row.allowMixedStorage === 1 ? row.maxMixedQty : '—')
      },
      {
        key: 'createTime',
        title: '创建时间',
        width: 170,
        render: row => (row.createTime ? String(row.createTime).replace('T', ' ').slice(0, 19) : '')
      },
      {
        key: 'operate',
        title: '操作',
        width: 100,
        fixed: 'right',
        render: row => {
          const options = [
            hasAuth('wms:zone:edit') ? { label: '编辑', key: 'edit' } : null,
            hasAuth('wms:zone:changeStatus') && row.status === 'ENABLED'
              ? { label: '停用', key: 'disable' }
              : null,
            hasAuth('wms:zone:changeStatus') && row.status === 'DISABLED'
              ? { label: '启用', key: 'enable' }
              : null,
            hasAuth('wms:zone:remove') ? { label: '删除', key: 'delete' } : null
          ].filter(Boolean) as Array<{ label: string; key: string }>;
          return (
            <NDropdown
              options={options}
              onSelect={(key: string) => handleMoreAction(key, row)}
            >
              <NButton size="tiny">更多</NButton>
            </NDropdown>
          );
        }
      }
    ]
  });

const { drawerVisible, openDrawer, closeDrawer, checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate(data, 'id', getData);

const modalTitle = computed(() => (formModel.value.id ? '编辑库区' : '新增库区'));

async function loadWarehouses() {
  const { data: whData } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500 } as any);
  warehouseOptions.value = ((whData as any)?.rows || []).map((item: any) => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id,
    code: item.warehouseCode,
    name: item.warehouseName
  }));
}

function openAdd() {
  formModel.value = {
    id: null,
    companyId: 4000001,
    warehouseId: searchParams.value.warehouseId,
    warehouseCode: null,
    warehouseName: null,
    zoneName: null,
    storageMethod: 'FLOOR',
    zoneType: 'TEMP',
    allowMixedStorage: 0,
    maxMixedQty: null,
    status: 'ENABLED',
    remark: null
  };
  openDrawer();
}

function openEdit(row: Api.Wms.Zone) {
  formModel.value = { ...row };
  openDrawer();
}

function handleWarehouseChange(value: CommonType.IdType | null) {
  const item = warehouseOptions.value.find(option => option.value === value);
  formModel.value.warehouseCode = item?.code || null;
  formModel.value.warehouseName = item?.name || null;
}

async function submitForm() {
  const api = formModel.value.id ? fetchUpdateWmsZone : fetchCreateWmsZone;
  const { error } = await api(formModel.value);
  if (error) return;
  window.$message?.success('保存成功');
  closeDrawer();
  getData();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteWmsZone([id]);
  if (!error) onDeleted();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteWmsZone(checkedRowKeys.value);
  if (!error) onBatchDeleted();
}

async function handleMoreAction(key: string, row: Api.Wms.Zone) {
  if (key === 'edit') {
    openEdit(row);
    return;
  }
  if (key === 'disable' || key === 'enable') {
    const status = key === 'disable' ? 'DISABLED' : 'ENABLED';
    const { error } = await fetchChangeWmsZoneStatus({ id: row.id, status });
    if (!error) {
      window.$message?.success('操作成功');
      getData();
    }
    return;
  }
  if (key === 'delete') {
    await handleDelete(row.id);
  }
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value.zoneName = null;
  searchParams.value.zoneType = null;
  searchParams.value.storageMethod = null;
  searchParams.value.status = null;
  handleSearch();
}

loadWarehouses();
</script>

<template>
  <div class="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
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
        <NFormItem label="区域名称">
          <NInput v-model:value="searchParams.zoneName" clearable placeholder="区域名称" class="w-160px" />
        </NFormItem>
        <NFormItem label="库区类型">
          <DictSelect v-model:value="searchParams.zoneType" dict-code="wms_zone_type" clearable class="w-140px" />
        </NFormItem>
        <NFormItem label="存放方式">
          <DictSelect v-model:value="searchParams.storageMethod" dict-code="wms_storage_method" clearable class="w-120px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard title="库区管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('wms:zone:add')"
          :show-delete="hasAuth('wms:zone:remove')"
          :show-export="false"
          @add="openAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :scroll-x="scrollX"
        :row-key="(row: Api.Wms.Zone) => row.id"
        :flex-height="!appStore.isMobile"
        remote
        size="small"
        class="sm:h-full"
      />
    </NCard>

    <NModal v-model:show="drawerVisible" preset="card" :title="modalTitle" class="w-620px">
      <NForm label-placement="left" label-width="110">
        <NFormItem label="所属仓库" required>
          <NSelect
            v-model:value="formModel.warehouseId"
            :options="warehouseOptions"
            filterable
            clearable
            @update:value="handleWarehouseChange"
          />
        </NFormItem>
        <NFormItem label="区域名称" required>
          <NInput v-model:value="formModel.zoneName" />
        </NFormItem>
        <NFormItem label="存放方式" required>
          <DictSelect v-model:value="formModel.storageMethod" dict-code="wms_storage_method" />
        </NFormItem>
        <NFormItem label="库区类型" required>
          <DictSelect v-model:value="formModel.zoneType" dict-code="wms_zone_type" />
        </NFormItem>
        <NFormItem label="库位混合存储" required>
          <NSwitch
            :value="formModel.allowMixedStorage === 1"
            @update:value="(v: boolean) => { formModel.allowMixedStorage = v ? 1 : 0; if (!v) formModel.maxMixedQty = null; }"
          />
          <span class="ml-8px text-13px">{{ formModel.allowMixedStorage === 1 ? '是' : '否' }}</span>
        </NFormItem>
        <NFormItem v-if="formModel.allowMixedStorage === 1" label="最大混合数量" required>
          <NInputNumber v-model:value="formModel.maxMixedQty" class="w-full" :min="1" />
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
  </div>
</template>
