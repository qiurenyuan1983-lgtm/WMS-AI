<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { fetchGetShippingLineList } from '@/service/api/base/shipping-line';
import {
  fetchBatchDeleteVessel,
  fetchGetVesselList,
  fetchUpdateVesselStatus
} from '@/service/api/base/vessel';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import VesselDetailDrawer from './modules/vessel-detail-drawer.vue';
import VesselOperateDrawer from './modules/vessel-operate-drawer.vue';

defineOptions({ name: 'VesselList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();
const shippingLineOptions = ref<CommonType.Option[]>([]);
const detailVisible = ref(false);
const detailData = ref<Api.Base.Vessel | null>(null);

const vesselTypeOptions = [
  { label: '集装箱船', value: 'CONTAINER' },
  { label: '散货船', value: 'BULK' },
  { label: '冷藏船', value: 'REEFER' },
  { label: '滚装船', value: 'RORO' },
  { label: '其他', value: 'OTHER' }
];

const vesselTypeMap: Record<string, { label: string; type: 'success' | 'info' | 'warning' | 'default' }> = {
  CONTAINER: { label: '集装箱船', type: 'success' },
  BULK: { label: '散货船', type: 'info' },
  REEFER: { label: '冷藏船', type: 'warning' },
  RORO: { label: '滚装船', type: 'default' },
  OTHER: { label: '其他', type: 'default' }
};

const searchParams = ref<Api.Base.VesselSearchParams>({
  pageNum: 1,
  pageSize: 10,
  vesselCode: null,
  vesselName: null,
  vesselNameEn: null,
  imoNo: null,
  shippingLineId: null,
  vesselType: null,
  status: null,
  orderByColumn: null,
  isAsc: null,
  params: {}
});

async function loadOptions() {
  const { data } = await fetchGetShippingLineList({ pageNum: 1, pageSize: 500, status: '0' } as Api.Base.ShippingLineSearchParams);
  shippingLineOptions.value = (data?.rows || []).map(item => ({
    label: `${item.nameAbbr || item.nameEn}（${item.code}）`,
    value: item.id
  }));
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetVesselList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 60, render: (_, index) => index + 1 },
      { key: 'vesselCode', title: '船舶编码', align: 'center', width: 130 },
      { key: 'vesselName', title: '船名（中文）', align: 'center', minWidth: 150 },
      { key: 'vesselNameEn', title: '船名（英文）', align: 'center', minWidth: 190 },
      { key: 'imoNo', title: 'IMO编号', align: 'center', width: 110 },
      { key: 'shippingLineName', title: '所属船司', align: 'center', width: 120 },
      {
        key: 'vesselType',
        title: '船舶类型',
        align: 'center',
        width: 110,
        render: row => {
          const meta = vesselTypeMap[row.vesselType || 'OTHER'] || vesselTypeMap.OTHER;
          return <NTag type={meta.type} size="small">{meta.label}</NTag>;
        }
      },
      { key: 'capacityTeu', title: 'TEU容量', align: 'right', width: 100, render: row => row.capacityTeu ?? '--' },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 90,
        render: row => <NTag type={row.status === '0' ? 'success' : 'default'} size="small">{row.status === '0' ? '启用' : '停用'}</NTag>
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 180,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('base:vessel:query') ? <ButtonIcon text type="primary" icon="material-symbols:visibility-outline" tooltipContent="查看" onClick={() => handleView(row)} /> : null}
            {hasAuth('base:vessel:edit') ? <ButtonIcon text type="primary" icon="material-symbols:drive-file-rename-outline-outline" tooltipContent="编辑" onClick={() => handleEdit(row.id)} /> : null}
            {hasAuth('base:vessel:edit') ? (
              <NButton text type={row.status === '0' ? 'warning' : 'success'} onClick={() => handleToggleStatus(row)}>
                {row.status === '0' ? '停用' : '启用'}
              </NButton>
            ) : null}
            {hasAuth('base:vessel:remove') ? <ButtonIcon text type="error" icon="material-symbols:delete-outline" tooltipContent="删除" popconfirmContent="确认删除该船舶？" onPositiveClick={() => handleDelete(row.id)} /> : null}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

function handleView(row: Api.Base.Vessel) {
  detailData.value = row;
  detailVisible.value = true;
}

async function handleToggleStatus(row: Api.Base.Vessel) {
  const targetStatus = row.status === '0' ? '1' : '0';
  const { error } = await fetchUpdateVesselStatus(row.id, targetStatus);
  if (error) return;
  window.$message?.success(targetStatus === '0' ? '启用成功' : '停用成功');
  getDataByPage();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteVessel(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteVessel([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/vessel/export', searchParams.value, `船舶数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    vesselCode: null,
    vesselName: null,
    vesselNameEn: null,
    imoNo: null,
    shippingLineId: null,
    vesselType: null,
    status: null,
    orderByColumn: null,
    isAsc: null,
    params: {}
  };
  getDataByPage();
}

onMounted(loadOptions);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="船舶编码">
          <NInput v-model:value="searchParams.vesselCode" clearable placeholder="请输入船舶编码" class="w-160px" />
        </NFormItem>
        <NFormItem label="船名（中文）">
          <NInput v-model:value="searchParams.vesselName" clearable placeholder="请输入船名" class="w-170px" />
        </NFormItem>
        <NFormItem label="船名（英文）">
          <NInput v-model:value="searchParams.vesselNameEn" clearable placeholder="请输入英文船名" class="w-190px" />
        </NFormItem>
        <NFormItem label="所属船司">
          <NSelect v-model:value="searchParams.shippingLineId" :options="shippingLineOptions" filterable clearable placeholder="请选择船司" class="w-180px" />
        </NFormItem>
        <NFormItem label="船舶类型">
          <NSelect v-model:value="searchParams.vesselType" :options="vesselTypeOptions" clearable placeholder="请选择类型" class="w-140px" />
        </NFormItem>
        <NFormItem label="IMO编号">
          <NInput v-model:value="searchParams.imoNo" clearable placeholder="请输入 IMO" class="w-150px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" :options="[{ label: '启用', value: '0' }, { label: '停用', value: '1' }]" clearable placeholder="全部" class="w-100px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard title="船舶列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:vessel:add')"
          :show-delete="hasAuth('base:vessel:remove')"
          :show-export="hasAuth('base:vessel:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        />
      </template>
      <DataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data" :flex-height="!appStore.isMobile" :scroll-x="scrollX" :loading="loading" remote :row-key="(row: Api.Base.Vessel) => row.id" :pagination="mobilePagination" class="sm:h-full" />
      <VesselOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getDataByPage" />
      <VesselDetailDrawer v-model:visible="detailVisible" :row-data="detailData" />
    </NCard>

    <NAlert type="info" :show-icon="true" class="card-wrapper">
      <div class="leading-7">
        <div>启用的船舶可在海柜订单、船次录入等业务中引用；停用后不再作为业务下拉选项。</div>
        <div>航次变化频繁，当前仍作为海柜订单字段录入，不在基础资料中维护。</div>
      </div>
    </NAlert>
  </div>
</template>
