<script setup lang="tsx">
import { ref } from 'vue';
import { fetchBatchDeleteZipCode, fetchGetZipCodeList } from '@/service/api/base/zip-code';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import ZipCodeOperateDrawer from './modules/zip-code-operate-drawer.vue';

defineOptions({ name: 'ZipCodeList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const searchParams = ref<Api.Base.ZipCodeSearchParams>({
  pageNum: 1,
  pageSize: 10,
  countryCode: null,
  stateCode: null,
  zip: null,
  cityName: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetZipCodeList(searchParams.value),
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
        key: 'zip',
        title: '邮编',
        align: 'center',
        width: 120
      },
      {
        key: 'countryCode',
        title: '国家',
        align: 'center',
        width: 80
      },
      {
        key: 'stateCode',
        title: '州/省',
        align: 'center',
        width: 100
      },
      {
        key: 'cityName',
        title: '城市',
        align: 'center',
        minWidth: 140
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:zipCode:edit')) return null;
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
            if (!hasAuth('base:zipCode:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该邮编？"
                onPositiveClick={() => handleDelete(row.id)}
              />
            );
          };
          return <div class="flex-center gap-8px">{editBtn()}{deleteBtn()}</div>;
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteZipCode(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteZipCode([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/zip-code/export', searchParams.value, `邮编数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    countryCode: null,
    stateCode: null,
    zip: null,
    cityName: null,
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
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="邮编">
          <NInput v-model:value="searchParams.zip" clearable placeholder="请输入邮编" class="w-130px" />
        </NFormItem>
        <NFormItem label="国家">
          <NInput v-model:value="searchParams.countryCode" clearable placeholder="如 CN / US" class="w-90px" />
        </NFormItem>
        <NFormItem label="州/省">
          <NInput v-model:value="searchParams.stateCode" clearable placeholder="如 SH / CA" class="w-90px" />
        </NFormItem>
        <NFormItem label="城市">
          <NInput v-model:value="searchParams.cityName" clearable placeholder="请输入城市名称" class="w-140px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <!-- 列表区 -->
    <NCard title="邮编库" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:zipCode:add')"
          :show-delete="hasAuth('base:zipCode:remove')"
          :show-export="hasAuth('base:zipCode:export')"
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
        :row-key="(row: Api.Base.ZipCode) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <ZipCodeOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
