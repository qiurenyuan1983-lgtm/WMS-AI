<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteCompany, fetchGetCompanyList } from '@/service/api/base/company';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import CompanyOperateDrawer from './modules/company-operate-drawer.vue';

defineOptions({ name: 'CompanyList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const searchParams = ref<Api.Base.MdmCompanySearchParams>({
  pageNum: 1,
  pageSize: 10,
  companyCode: null,
  companyName: null,
  countryCode: null,
  status: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetCompanyList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'id', title: 'ID', align: 'center', width: 180 },
      { key: 'companyCode', title: '主体编码', align: 'center', width: 130 },
      { key: 'companyName', title: '主体名称', align: 'center', minWidth: 180 },
      { key: 'countryCode', title: '国家', align: 'center', width: 80 },
      { key: 'currencyCode', title: '结算货币', align: 'center', width: 90 },
      { key: 'timezone', title: '时区', align: 'center', width: 180, ellipsis: { tooltip: true } },
      { key: 'taxNo', title: '税号', align: 'center', width: 140, ellipsis: { tooltip: true } },
      {
        key: 'vatRegistered',
        title: 'VAT注册',
        align: 'center',
        width: 90,
        render: row => (
          <NTag type={row.vatRegistered === 1 ? 'success' : 'default'} size="small">
            {row.vatRegistered === 1 ? '是' : '否'}
          </NTag>
        )
      },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 80,
        render: row => (
          <NTag type={row.status === '0' ? 'success' : 'error'} size="small">
            {row.status === '0' ? '启用' : '停用'}
          </NTag>
        )
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:company:edit')) return null;
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
            if (!hasAuth('base:company:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该主体？请确保该主体下所有仓库已停用。"
                onPositiveClick={() => handleDelete(row.id)}
              />
            );
          };
          return (
            <div class="flex-center gap-8px">
              {editBtn()}{deleteBtn()}
            </div>
          );
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteCompany(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteCompany([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/company/export', searchParams.value, `主体数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    companyCode: null,
    companyName: null,
    countryCode: null,
    status: null,
    params: {}
  };
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="编码/名称">
          <NInput v-model:value="searchParams.companyName" clearable placeholder="主体编码或名称" class="w-180px" />
        </NFormItem>
        <NFormItem label="国家">
          <NInput v-model:value="searchParams.countryCode" clearable placeholder="如 US / CN" class="w-90px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.status"
            :options="[{ label: '启用', value: '0' }, { label: '停用', value: '1' }]"
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

    <NCard title="主体管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:company:add')"
          :show-delete="hasAuth('base:company:remove')"
          :show-export="hasAuth('base:company:export')"
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
        :row-key="(row: Api.Base.MdmCompany) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <CompanyOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
