<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteShippingLine, fetchGetShippingLineList } from '@/service/api/base/shipping-line';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import ShippingLineOperateDrawer from './modules/shipping-line-operate-drawer.vue';

defineOptions({ name: 'ShippingLineList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const searchParams = ref<Api.Base.ShippingLineSearchParams>({
  pageNum: 1,
  pageSize: 10,
  code: null,
  nameEn: null,
  nameAbbr: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetShippingLineList(searchParams.value),
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
        title: 'SCAC代码',
        align: 'center',
        width: 110
      },
      {
        key: 'nameEn',
        title: '船司全称',
        align: 'center',
        minWidth: 180
      },
      {
        key: 'nameAbbr',
        title: '常用简称',
        align: 'center',
        width: 110
      },
      {
        key: 'countryCode',
        title: '注册国家',
        align: 'center',
        width: 90
      },
      {
        key: 'contactEmail',
        title: '联系邮箱',
        align: 'center',
        minWidth: 180
      },
      {
        key: 'contactPhone',
        title: '联系电话',
        align: 'center',
        minWidth: 130
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
        width: 80
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:shippingLine:edit')) return null;
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
            if (!hasAuth('base:shippingLine:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该船司？"
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
  const { error } = await fetchBatchDeleteShippingLine(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteShippingLine([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/shipping-line/export', searchParams.value, `船司数据_${new Date().getTime()}.xlsx`);
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
    nameAbbr: null,
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
        <NFormItem label="SCAC代码">
          <NInput v-model:value="searchParams.code" clearable placeholder="如 MSCU / COSU" class="w-140px" />
        </NFormItem>
        <NFormItem label="船司全称">
          <NInput v-model:value="searchParams.nameEn" clearable placeholder="请输入英文全称" class="w-160px" />
        </NFormItem>
        <NFormItem label="常用简称">
          <NInput v-model:value="searchParams.nameAbbr" clearable placeholder="如 MSC / COSCO" class="w-130px" />
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
    <NCard title="船司列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:shippingLine:add')"
          :show-delete="hasAuth('base:shippingLine:remove')"
          :show-export="hasAuth('base:shippingLine:export')"
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
        :row-key="(row: Api.Base.ShippingLine) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <ShippingLineOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
