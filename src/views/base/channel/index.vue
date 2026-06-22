<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteChannel, fetchGetChannelList } from '@/service/api/base/channel';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import ChannelOperateDrawer from './modules/channel-operate-drawer.vue';

defineOptions({ name: 'ChannelList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const CHANNEL_TYPE_OPTIONS = [
  { label: '海运', value: 'SEA' },
  { label: '空运', value: 'AIR' },
  { label: '快递', value: 'EXPRESS' },
  { label: '铁运', value: 'RAIL' },
  { label: '整车', value: 'TRUCK' },
  { label: '本土散板', value: 'LOCAL_BULK' },
  { label: '同行散板', value: 'PEER_BULK' }
];
const CONTAINER_MODE_OPTIONS = [
  { label: '整柜', value: 'FCL' },
  { label: '拼柜', value: 'LCL' },
  { label: '散货', value: 'BULK' }
];
const optionLabel = (options: { label: string; value: string }[], value?: string | null) =>
  options.find(item => item.value === value)?.label || value || '-';

const searchParams = ref<Api.Base.ChannelSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  channelType: null,
  containerMode: null,
  status: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetChannelList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'channelCode', title: '渠道编码', align: 'center', width: 150 },
      { key: 'channelName', title: '渠道名称', align: 'center', minWidth: 150 },
      {
        key: 'channelType',
        title: '渠道类型',
        align: 'center',
        width: 110,
        render: row => <NTag size="small">{optionLabel(CHANNEL_TYPE_OPTIONS, row.channelType)}</NTag>
      },
      { key: 'containerMode', title: '装载模式', align: 'center', width: 100, render: row => optionLabel(CONTAINER_MODE_OPTIONS, row.containerMode) },
      { key: 'priority', title: '优先级', align: 'center', width: 80 },
      { key: 'sortOrder', title: '排序', align: 'center', width: 70 },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 80,
        render: row => <NTag type={row.status === '0' ? 'success' : 'error'} size="small">{row.status === '0' ? '正常' : '禁用'}</NTag>
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('base:channel:edit') && (
              <ButtonIcon text type="primary" icon="material-symbols:drive-file-rename-outline-outline" tooltipContent="编辑" onClick={() => handleEdit(row.id)} />
            )}
            {hasAuth('base:channel:remove') && (
              <ButtonIcon text type="error" icon="material-symbols:delete-outline" tooltipContent="删除" popconfirmContent="确认删除该渠道？" onPositiveClick={() => handleDelete(row.id)} />
            )}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteChannel(checkedRowKeys.value);
  if (!error) onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteChannel([id]);
  if (!error) onDeleted();
}

function handleExport() {
  download('/base/channel/export', searchParams.value, `渠道数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 10, keyword: null, channelType: null, containerMode: null, status: null, params: {} };
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="编码/名称"><NInput v-model:value="searchParams.keyword" clearable placeholder="渠道编码或名称" class="w-160px" /></NFormItem>
        <NFormItem label="渠道类型"><NSelect v-model:value="searchParams.channelType" :options="CHANNEL_TYPE_OPTIONS" clearable placeholder="全部" class="w-120px" /></NFormItem>
        <NFormItem label="装载模式"><NSelect v-model:value="searchParams.containerMode" :options="CONTAINER_MODE_OPTIONS" clearable placeholder="全部" class="w-110px" /></NFormItem>
        <NFormItem label="状态"><NSelect v-model:value="searchParams.status" :options="[{ label: '正常', value: '0' }, { label: '禁用', value: '1' }]" clearable placeholder="全部" class="w-100px" /></NFormItem>
        <NFormItem><NButton type="primary" @click="handleSearch">搜索</NButton><NButton class="ml-8px" @click="handleReset">重置</NButton></NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>
    <NCard title="渠道管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :disabled-delete="checkedRowKeys.length === 0" :loading="loading" :show-add="hasAuth('base:channel:add')" :show-delete="hasAuth('base:channel:remove')" :show-export="hasAuth('base:channel:export')" @add="handleAdd" @delete="handleBatchDelete" @export="handleExport" @refresh="getData" />
      </template>
      <DataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data" :flex-height="!appStore.isMobile" :scroll-x="scrollX" :loading="loading" remote :row-key="(row: Api.Base.Channel) => row.id" :pagination="mobilePagination" class="sm:h-full" />
      <ChannelOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getDataByPage" />
    </NCard>
  </div>
</template>

