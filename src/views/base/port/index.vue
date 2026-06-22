<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeletePort, fetchGetPortList } from '@/service/api/base/port';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import PortOperateDrawer from './modules/port-operate-drawer.vue';

defineOptions({ name: 'PortList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const PORT_TYPE_MAP: Record<number, { label: string; type: 'info' | 'success' | 'warning' }> = {
  1: { label: '海港', type: 'info' },
  2: { label: '空港', type: 'success' },
  3: { label: '内陆港', type: 'warning' }
};

const searchParams = ref<Api.Base.PortSearchParams>({
  pageNum: 1,
  pageSize: 10,
  portCode: null,
  nameEn: null,
  countryCode: null,
  portType: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetPortList(searchParams.value),
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
        key: 'portCode',
        title: '港口代码',
        align: 'center',
        width: 110
      },
      {
        key: 'nameEn',
        title: '港口名称',
        align: 'center',
        minWidth: 160
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
        width: 90
      },
      {
        key: 'city',
        title: '城市',
        align: 'center',
        minWidth: 120
      },
      {
        key: 'portType',
        title: '港口类型',
        align: 'center',
        width: 100,
        render: row => {
          const meta = PORT_TYPE_MAP[row.portType];
          if (!meta) return row.portType;
          return <NTag type={meta.type} size="small">{meta.label}</NTag>;
        }
      },
      {
        key: 'timezone',
        title: '时区',
        align: 'center',
        minWidth: 140
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
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:port:edit')) return null;
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
            if (!hasAuth('base:port:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该港口？"
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
  const { error } = await fetchBatchDeletePort(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeletePort([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/port/export', searchParams.value, `港口数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    portCode: null,
    nameEn: null,
    countryCode: null,
    portType: null,
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
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="港口代码">
          <NInput v-model:value="searchParams.portCode" clearable placeholder="如 CNSHA" class="w-120px" />
        </NFormItem>
        <NFormItem label="港口名称">
          <NInput v-model:value="searchParams.nameEn" clearable placeholder="请输入英文名称" class="w-160px" />
        </NFormItem>
        <NFormItem label="国家">
          <NInput v-model:value="searchParams.countryCode" clearable placeholder="如 CN" class="w-80px" />
        </NFormItem>
        <NFormItem label="港口类型">
          <NSelect
            v-model:value="searchParams.portType"
            :options="[{ label: '海港', value: 1 }, { label: '空港', value: 2 }, { label: '内陆港', value: 3 }]"
            clearable
            placeholder="全部"
            class="w-110px"
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
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <!-- 列表区 -->
    <NCard title="港口列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:port:add')"
          :show-delete="hasAuth('base:port:remove')"
          :show-export="hasAuth('base:port:export')"
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
        :row-key="(row: Api.Base.Port) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <PortOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
