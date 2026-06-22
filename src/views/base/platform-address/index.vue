<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { NTag } from 'naive-ui';
import {
  fetchBatchDeletePlatformAddress,
  fetchDisablePlatformAddress,
  fetchGetPlatformAddressList
} from '@/service/api/base/platform-address';
import { fetchGetPlatformList } from '@/service/api/base/platform';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import PlatformAddressOperateDrawer from './modules/platform-address-operate-drawer.vue';
import ChangeLogDrawer from './modules/change-log-drawer.vue';

defineOptions({ name: 'PlatformAddressList' });

const appStore = useAppStore();
const route = useRoute();
const { hasAuth } = useAuth();
const { download } = useDownload();

const ADDRESS_TYPE_MAP: Record<number, { label: string; type: 'info' | 'success' | 'warning' | 'default' }> = {
  1: { label: 'FBA仓库', type: 'info' },
  2: { label: '门店', type: 'success' },
  3: { label: '配送中心', type: 'warning' },
  4: { label: '其他', type: 'default' }
};

const ADDRESS_TYPE_OPTIONS = [
  { label: 'FBA仓库', value: 1 },
  { label: '门店', value: 2 },
  { label: '配送中心', value: 3 },
  { label: '其他', value: 4 }
];

// 平台选项（全量加载供下拉使用）
const platformOptions = ref<{ label: string; value: number }[]>([]);

async function loadPlatformOptions() {
  const { data } = await fetchGetPlatformList({ pageSize: 200, pageNum: 1 });
  if (data?.rows) {
    platformOptions.value = data.rows.map(p => ({ label: `${p.code} - ${p.nameEn}`, value: Number(p.id) }));
  }
}

const searchParams = ref<Api.Base.PlatformAddressSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  platformId: null,
  addressType: null,
  countryCode: null,
  stateCode: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

// 变更记录 Drawer
const changeLogVisible = ref(false);
const changeLogAddressId = ref<CommonType.IdType | null>(null);

function handleViewChangeLogs(id: CommonType.IdType) {
  changeLogAddressId.value = id;
  changeLogVisible.value = true;
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetPlatformAddressList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'addressCode', title: '地址编码', align: 'center', width: 110 },
      { key: 'nameEn', title: '地址名称', align: 'center', minWidth: 160 },
      { key: 'platformName', title: '所属平台', align: 'center', width: 130 },
      {
        key: 'addressType',
        title: '地址类型',
        align: 'center',
        width: 110,
        render: row => {
          const info = ADDRESS_TYPE_MAP[row.addressType ?? 0];
          return info ? (
            <NTag type={info.type} size="small">{info.label}</NTag>
          ) : (
            <span>{row.addressType}</span>
          );
        }
      },
      {
        key: 'location',
        title: '国家/州/城市',
        align: 'center',
        minWidth: 140,
        render: row => {
          const parts = [row.countryCode, row.stateCode, row.city].filter(Boolean);
          return <span>{parts.join(' · ')}</span>;
        }
      },
      { key: 'addressLine1', title: '详细地址', align: 'center', minWidth: 180, ellipsis: { tooltip: true } },
      { key: 'zipCode', title: '邮编', align: 'center', width: 90 },
      { key: 'unitPalletCbm', title: '单板CBM', align: 'right', width: 100, render: row => row.unitPalletCbm ?? '2.000' },
      {
        key: 'lastVerifiedAt',
        title: '最后核验',
        align: 'center',
        width: 120,
        render: row => {
          if (!row.lastVerifiedAt) return <span class="text-gray-400">—</span>;
          const daysDiff = Math.floor((Date.now() - new Date(row.lastVerifiedAt).getTime()) / 86400000);
          const isOld = daysDiff > 180;
          return (
            <span class={isOld ? 'text-orange-500' : ''} title={isOld ? `已超过 ${daysDiff} 天未核验` : ''}>
              {row.lastVerifiedAt.slice(0, 10)}
            </span>
          );
        }
      },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 80,
        render: row => (
          <NTag type={row.status === '0' ? 'success' : 'error'} size="small">
            {row.status === '0' ? '正常' : '禁用'}
          </NTag>
        )
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 150,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:platformAddress:edit')) return null;
            return (
              <ButtonIcon
                text
                type="primary"
                icon="material-symbols:drive-file-rename-outline-outline"
                tooltipContent="编辑"
                onClick={() => handleEdit(row.id)}
              />
            );
          };
          const disableBtn = () => {
            if (!hasAuth('base:platformAddress:edit') || row.status === '1') return null;
            return (
              <ButtonIcon
                text
                type="warning"
                icon="material-symbols:block"
                tooltipContent="禁用"
                popconfirmContent="确认禁用该地址？操作将写入变更记录。"
                onPositiveClick={() => handleDisable(row.id)}
              />
            );
          };
          const logBtn = () => (
            <ButtonIcon
              text
              type="default"
              icon="material-symbols:history"
              tooltipContent="变更记录"
              onClick={() => handleViewChangeLogs(row.id)}
            />
          );
          const deleteBtn = () => {
            if (!hasAuth('base:platformAddress:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该地址？"
                onPositiveClick={() => handleDelete(row.id)}
              />
            );
          };
          return (
            <div class="flex-center gap-8px">
              {editBtn()}{disableBtn()}{logBtn()}{deleteBtn()}
            </div>
          );
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleDisable(id: CommonType.IdType) {
  const { error } = await fetchDisablePlatformAddress(id);
  if (error) return;
  window.$message?.success('禁用成功');
  getData();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeletePlatformAddress(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeletePlatformAddress([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/platform-address/export', searchParams.value, `平台地址数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    keyword: null,
    platformId: null,
    addressType: null,
    countryCode: null,
    stateCode: null,
    status: null,
    orderByColumn: null,
    isAsc: null,
    params: {}
  };
  getDataByPage();
}

onMounted(async () => {
  await loadPlatformOptions();
  // 支持从平台列表页跳转时带入 platformId 参数
  const { platformId } = route.query;
  if (platformId) {
    searchParams.value.platformId = Number(platformId);
    getDataByPage();
  }
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 查询区 -->
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="编码/名称">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="地址编码或名称" class="w-160px" />
        </NFormItem>
        <NFormItem label="所属平台">
          <NSelect
            v-model:value="searchParams.platformId"
            :options="platformOptions"
            clearable
            placeholder="全部平台"
            class="w-180px"
          />
        </NFormItem>
        <NFormItem label="地址类型">
          <NSelect
            v-model:value="searchParams.addressType"
            :options="ADDRESS_TYPE_OPTIONS"
            clearable
            placeholder="全部"
            class="w-120px"
          />
        </NFormItem>
        <NFormItem label="国家">
          <NInput v-model:value="searchParams.countryCode" clearable placeholder="如 US / CN" class="w-90px" />
        </NFormItem>
        <NFormItem label="州/省">
          <NInput v-model:value="searchParams.stateCode" clearable placeholder="如 CA" class="w-80px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.status"
            :options="[{ label: '正常', value: '0' }, { label: '禁用', value: '1' }]"
            clearable
            placeholder="全部"
            class="w-100px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <!-- 列表区 -->
    <NCard title="平台地址库" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:platformAddress:add')"
          :show-delete="hasAuth('base:platformAddress:remove')"
          :show-export="hasAuth('base:platformAddress:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        />
      </template>
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        :loading="loading"
        remote
        :row-key="(row: Api.Base.PlatformAddress) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <PlatformAddressOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :platform-options="platformOptions"
        @submitted="getDataByPage"
      />
      <ChangeLogDrawer
        v-if="changeLogAddressId"
        v-model:visible="changeLogVisible"
        :address-id="changeLogAddressId"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
