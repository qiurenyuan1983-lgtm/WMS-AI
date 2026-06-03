<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteTerminal, fetchGetTerminalList } from '@/service/api/base/terminal';
import { fetchGetPortList } from '@/service/api/base/port';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import TerminalOperateDrawer from './modules/terminal-operate-drawer.vue';

defineOptions({ name: 'TerminalList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const portOptions = ref<CommonType.Option[]>([]);

const RELEASE_METHOD_MAP: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  DO: { label: 'DO', type: 'info' },
  EDO: { label: 'EDO', type: 'success' },
  PIN: { label: 'PIN', type: 'warning' },
  EMAIL_RELEASE: { label: '邮件放行', type: 'info' },
  PAPER: { label: '纸质放行', type: 'default' }
};

const searchParams = ref<Api.Base.TerminalSearchParams>({
  pageNum: 1,
  pageSize: 10,
  terminalCode: null,
  terminalName: null,
  portId: null,
  defaultReleaseMethod: null,
  appointmentSupported: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

async function loadPortOptions() {
  const { data } = await fetchGetPortList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.PortSearchParams);
  portOptions.value = (data?.rows || []).map(item => ({
    label: `${item.nameEn}（${item.portCode}）`,
    value: item.id
  }));
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetTerminalList(searchParams.value),
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
      { key: 'terminalCode', title: '码头代码', align: 'center', width: 110 },
      { key: 'terminalName', title: '码头名称', align: 'center', minWidth: 180 },
      { key: 'portName', title: '所属港口', align: 'center', minWidth: 140 },
      { key: 'address', title: '地址', align: 'left', minWidth: 220, ellipsis: { tooltip: true } },
      {
        key: 'defaultReleaseMethod',
        title: '放行方式',
        align: 'center',
        width: 110,
        render: row => {
          const meta = RELEASE_METHOD_MAP[row.defaultReleaseMethod || ''];
          if (!meta) return row.defaultReleaseMethod || '--';
          return <NTag type={meta.type} size="small">{meta.label}</NTag>;
        }
      },
      {
        key: 'appointmentSupported',
        title: '是否支持预约',
        align: 'center',
        width: 120,
        render: row => (
          <NTag type={row.appointmentSupported ? 'success' : 'error'} size="small">
            {row.appointmentSupported ? '是' : '否'}
          </NTag>
        )
      },
      { key: 'contactPhone', title: '联系电话', align: 'center', width: 140 },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 90,
        render: row => (
          <NTag type={row.status === '0' ? 'success' : 'default'} size="small">
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
            if (!hasAuth('base:terminal:edit')) return null;
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
            if (!hasAuth('base:terminal:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该码头？"
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
  const { error } = await fetchBatchDeleteTerminal(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteTerminal([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/terminal/export', searchParams.value, `码头数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    terminalCode: null,
    terminalName: null,
    portId: null,
    defaultReleaseMethod: null,
    appointmentSupported: null,
    status: null,
    orderByColumn: null,
    isAsc: null,
    params: {}
  };
  getDataByPage();
}

onMounted(loadPortOptions);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="码头代码">
          <NInput v-model:value="searchParams.terminalCode" clearable placeholder="如 APM" class="w-130px" />
        </NFormItem>
        <NFormItem label="码头名称">
          <NInput v-model:value="searchParams.terminalName" clearable placeholder="请输入码头名称" class="w-180px" />
        </NFormItem>
        <NFormItem label="所属港口">
          <NSelect
            v-model:value="searchParams.portId"
            :options="portOptions"
            filterable
            clearable
            placeholder="请选择港口"
            class="w-180px"
          />
        </NFormItem>
        <NFormItem label="放行方式">
          <NSelect
            v-model:value="searchParams.defaultReleaseMethod"
            :options="[
              { label: 'DO', value: 'DO' },
              { label: 'EDO', value: 'EDO' },
              { label: 'PIN', value: 'PIN' },
              { label: '邮件放行', value: 'EMAIL_RELEASE' },
              { label: '纸质放行', value: 'PAPER' }
            ]"
            clearable
            placeholder="全部"
            class="w-140px"
          />
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
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard title="码头列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:terminal:add')"
          :show-delete="hasAuth('base:terminal:remove')"
          :show-export="hasAuth('base:terminal:export')"
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
        :row-key="(row: Api.Base.Terminal) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <TerminalOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>

    <NAlert type="info" :show-icon="true" class="card-wrapper">
      <div class="leading-7">
        <div>放行方式：DO / EDO / PIN / 邮件放行 / 纸质放行。</div>
        <div>所属港口选择后，后端会自动冗余港口代码、港口名称、国家、州省、城市和时区，方便海柜订单快速带出。</div>
      </div>
    </NAlert>
  </div>
</template>

<style scoped></style>
