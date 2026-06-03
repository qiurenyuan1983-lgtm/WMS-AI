<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { fetchBatchDeleteCountry, fetchGetCountryList } from '@/service/api/base/country';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import CountryOperateDrawer from './modules/country-operate-drawer.vue';

defineOptions({ name: 'CountryList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const searchParams = ref<Api.Base.CountrySearchParams>({
  pageNum: 1,
  pageSize: 10,
  code: null,
  nameEn: null,
  isActive: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetCountryList(searchParams.value),
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
        title: '国家代码',
        align: 'center',
        minWidth: 100
      },
      {
        key: 'nameEn',
        title: '英文名称',
        align: 'center',
        minWidth: 160
      },
      {
        key: 'phoneCode',
        title: '电话区号',
        align: 'center',
        minWidth: 100
      },
      {
        key: 'currencyCode',
        title: '默认货币',
        align: 'center',
        minWidth: 100
      },
      {
        key: 'timezoneDefault',
        title: '默认时区',
        align: 'center',
        minWidth: 160
      },
      {
        key: 'isActive',
        title: '是否开通',
        align: 'center',
        width: 100,
        render: row => (
          <NTag type={row.isActive === 1 ? 'success' : 'default'}>
            {row.isActive === 1 ? '已开通' : '未开通'}
          </NTag>
        )
      },
      {
        key: 'sortOrder',
        title: '排序',
        align: 'center',
        width: 80
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:country:edit')) return null;
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
            if (!hasAuth('base:country:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该国家？"
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
  const { error } = await fetchBatchDeleteCountry(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteCountry([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/country/export', searchParams.value, `国家数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    code: null,
    nameEn: null,
    isActive: null,
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
        <NFormItem label="国家代码">
          <NInput v-model:value="searchParams.code" clearable placeholder="请输入国家代码" class="w-140px" />
        </NFormItem>
        <NFormItem label="国家名称">
          <NInput v-model:value="searchParams.nameEn" clearable placeholder="请输入英文名称" class="w-160px" />
        </NFormItem>
        <NFormItem label="是否开通">
          <NSelect
            v-model:value="searchParams.isActive"
            :options="[{ label: '已开通', value: 1 }, { label: '未开通', value: 0 }]"
            clearable
            placeholder="全部"
            class="w-120px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <!-- 列表区 -->
    <NCard title="国家列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:country:add')"
          :show-delete="hasAuth('base:country:remove')"
          :show-export="hasAuth('base:country:export')"
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
        :row-key="(row: Api.Base.Country) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <CountryOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
