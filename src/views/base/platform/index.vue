<script setup lang="tsx">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NTag } from 'naive-ui';
import { fetchBatchDeletePlatform, fetchGetPlatformList } from '@/service/api/base/platform';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import PlatformOperateDrawer from './modules/platform-operate-drawer.vue';

defineOptions({ name: 'PlatformList' });

const appStore = useAppStore();
const router = useRouter();
const { hasAuth } = useAuth();
const { download } = useDownload();

const PLATFORM_TYPE_MAP: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'default' }> = {
  ECOMMERCE: { label: '电商平台', type: 'info' },
  INDEPENDENT_SITE: { label: '独立站', type: 'success' },
  STORE: { label: '门店', type: 'warning' }
};

const PLATFORM_TYPE_OPTIONS = [
  { label: '电商平台', value: 'ECOMMERCE' },
  { label: '独立站', value: 'INDEPENDENT_SITE' },
  { label: '门店', value: 'STORE' }
];

const searchParams = ref<Api.Base.PlatformSearchParams>({
  pageNum: 1,
  pageSize: 10,
  nameEn: null,
  typeCode: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetPlatformList(searchParams.value),
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
        align: 'center',
        width: 64,
        render: (_, index) => index + 1
      },
      {
        key: 'code',
        title: '平台代码',
        align: 'center',
        width: 130
      },
      {
        key: 'nameEn',
        title: '平台名称',
        align: 'center',
        minWidth: 160,
        render: row => (
          <div class="flex items-center gap-8px">
            {row.logoUrl && (
              <img src={row.logoUrl} alt={row.nameEn ?? ''} class="h-24px w-24px object-contain" />
            )}
            <span>{row.nameEn}</span>
          </div>
        )
      },
      {
        key: 'typeCode',
        title: '平台类型',
        align: 'center',
        width: 120,
        render: row => {
          const info = PLATFORM_TYPE_MAP[row.typeCode ?? ''];
          return info ? (
            <NTag type={info.type} size="small">{info.label}</NTag>
          ) : (
            <span>{row.typeCode}</span>
          );
        }
      },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 90,
        render: row => (
          <NTag type={row.status === '0' ? 'success' : 'error'} size="small">
            {row.status === '0' ? '正常' : '禁用'}
          </NTag>
        )
      },
      {
        key: 'sortOrder',
        title: '排序',
        align: 'center',
        width: 70
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 150,
        render: row => {
          const toAddressBtn = () => (
            <ButtonIcon
              text
              type="info"
              icon="material-symbols:location-on-outline"
              tooltipContent="查看地址库"
              onClick={() => router.push({ path: '/base-data/platform-address', query: { platformId: String(row.id) } })}
            />
          );
          const editBtn = () => {
            if (!hasAuth('base:platform:edit')) return null;
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
          const deleteBtn = () => {
            if (!hasAuth('base:platform:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该平台？删除后不可恢复。"
                onPositiveClick={() => handleDelete(row.id)}
              />
            );
          };
          return <div class="flex-center gap-8px">{toAddressBtn()}{editBtn()}{deleteBtn()}</div>;
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeletePlatform(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeletePlatform([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/platform/export', searchParams.value, `平台数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    nameEn: null,
    typeCode: null,
    status: null,
    orderByColumn: null,
    isAsc: null,
    params: {}
  };
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 查询区 -->
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="平台名称/代码">
          <NInput v-model:value="searchParams.nameEn" clearable placeholder="输入平台名称或代码" class="w-180px" />
        </NFormItem>
        <NFormItem label="平台类型">
          <NSelect
            v-model:value="searchParams.typeCode"
            :options="PLATFORM_TYPE_OPTIONS"
            clearable
            placeholder="全部"
            class="w-120px"
          />
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
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <!-- 列表区 -->
    <NCard title="平台列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:platform:add')"
          :show-delete="hasAuth('base:platform:remove')"
          :show-export="hasAuth('base:platform:export')"
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
        :row-key="(row: Api.Base.Platform) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <PlatformOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
