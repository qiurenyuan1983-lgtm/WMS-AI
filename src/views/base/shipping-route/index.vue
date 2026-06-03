<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchGetPortList } from '@/service/api/base/port';
import { fetchGetShippingLineList } from '@/service/api/base/shipping-line';
import { fetchBatchDeleteShippingRoute, fetchGetShippingRouteList } from '@/service/api/base/shipping-route';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import ShippingRouteOperateDrawer from './modules/shipping-route-operate-drawer.vue';

defineOptions({ name: 'ShippingRouteList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();
const shippingLineOptions = ref<CommonType.Option[]>([]);
const portOptions = ref<CommonType.Option[]>([]);

const searchParams = ref<Api.Base.ShippingRouteSearchParams>({
  pageNum: 1,
  pageSize: 10,
  routeCode: null,
  routeName: null,
  shippingLineId: null,
  originPortId: null,
  destinationPortId: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

async function loadOptions() {
  const [lineRes, portRes] = await Promise.all([
    fetchGetShippingLineList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.ShippingLineSearchParams),
    fetchGetPortList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.PortSearchParams)
  ]);
  shippingLineOptions.value = (lineRes.data?.rows || []).map(item => ({ label: `${item.nameAbbr || item.nameEn}（${item.code}）`, value: item.id }));
  portOptions.value = (portRes.data?.rows || []).map(item => ({ label: `${item.nameEn}（${item.portCode}）`, value: item.id }));
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetShippingRouteList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 60, render: (_, index) => index + 1 },
      { key: 'routeCode', title: '航线代码', align: 'center', width: 100 },
      { key: 'routeName', title: '航线名称', align: 'center', minWidth: 150 },
      { key: 'shippingLineName', title: '船公司', align: 'center', width: 120 },
      { key: 'originPortName', title: '起运港', align: 'center', minWidth: 140 },
      { key: 'destinationPortName', title: '目的港', align: 'center', minWidth: 140 },
      { key: 'defaultTransitDays', title: '航程(天)', align: 'center', width: 90 },
      {
        key: 'routeType',
        title: '直航/中转',
        align: 'center',
        width: 100,
        render: row => (
          <NTag type={row.routeType === 'TRANSSHIP' ? 'info' : 'success'} size="small">
            {row.routeType === 'TRANSSHIP' ? '中转' : '直航'}
          </NTag>
        )
      },
      { key: 'referenceMinDays', title: '最短', align: 'center', width: 70 },
      { key: 'referenceAvgDays', title: '平均', align: 'center', width: 70 },
      { key: 'referenceMaxDays', title: '最长', align: 'center', width: 70 },
      { key: 'referenceFreight', title: '参考运费', align: 'right', width: 110, render: row => row.referenceFreight ? String(row.referenceFreight) : '--' },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 90,
        render: row => <NTag type={row.status === '0' ? 'success' : 'default'} size="small">{row.status === '0' ? '启用' : '停用'}</NTag>
      },
      { key: 'remark', title: '备注', align: 'left', minWidth: 140, ellipsis: { tooltip: true } },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('base:shippingRoute:edit') ? <ButtonIcon text type="primary" icon="material-symbols:drive-file-rename-outline-outline" tooltipContent="编辑" onClick={() => handleEdit(row.id)} /> : null}
            {hasAuth('base:shippingRoute:remove') ? <ButtonIcon text type="error" icon="material-symbols:delete-outline" tooltipContent="删除" popconfirmContent="确认删除该航线？" onPositiveClick={() => handleDelete(row.id)} /> : null}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteShippingRoute(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteShippingRoute([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/shipping-route/export', searchParams.value, `航线数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 10, routeCode: null, routeName: null, shippingLineId: null, originPortId: null, destinationPortId: null, status: null, orderByColumn: null, isAsc: null, params: {} };
  getDataByPage();
}

onMounted(loadOptions);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="航线代码"><NInput v-model:value="searchParams.routeCode" clearable placeholder="请输入航线代码" class="w-150px" /></NFormItem>
        <NFormItem label="航线名称"><NInput v-model:value="searchParams.routeName" clearable placeholder="请输入航线名称" class="w-170px" /></NFormItem>
        <NFormItem label="船公司"><NSelect v-model:value="searchParams.shippingLineId" :options="shippingLineOptions" filterable clearable placeholder="请选择船公司" class="w-180px" /></NFormItem>
        <NFormItem label="起运港"><NSelect v-model:value="searchParams.originPortId" :options="portOptions" filterable clearable placeholder="请选择起运港" class="w-180px" /></NFormItem>
        <NFormItem label="目的港"><NSelect v-model:value="searchParams.destinationPortId" :options="portOptions" filterable clearable placeholder="请选择目的港" class="w-180px" /></NFormItem>
        <NFormItem label="状态"><NSelect v-model:value="searchParams.status" :options="[{ label: '启用', value: '0' }, { label: '停用', value: '1' }]" clearable placeholder="全部" class="w-100px" /></NFormItem>
        <NFormItem><NButton type="primary" @click="handleSearch">查询</NButton><NButton class="ml-8px" @click="handleReset">重置</NButton></NFormItem>
      </NForm>
    </NCard>

    <NCard title="航线列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:shippingRoute:add')"
          :show-delete="hasAuth('base:shippingRoute:remove')"
          :show-export="hasAuth('base:shippingRoute:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        />
      </template>
      <DataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data" :flex-height="!appStore.isMobile" :scroll-x="scrollX" :loading="loading" remote :row-key="(row: Api.Base.ShippingRoute) => row.id" :pagination="mobilePagination" class="sm:h-full" />
      <ShippingRouteOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getDataByPage" />
    </NCard>

    <NAlert type="info" :show-icon="true" class="card-wrapper">
      <div class="leading-7">
        <div>参考时效基于历史数据统计，仅供参考，实际受天气、港口拥堵等因素影响。</div>
        <div>直航/中转会影响整体时效及稳定性，请在业务报价时注意说明。</div>
      </div>
    </NAlert>
  </div>
</template>
