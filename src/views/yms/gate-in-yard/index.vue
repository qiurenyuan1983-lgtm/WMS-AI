<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGetInYardList } from '@/service/api/yms/gate';
import { fetchMarkContainerException } from '@/service/api/yms/container';
import { fetchMarkTrailerException } from '@/service/api/yms/trailer';

defineOptions({ name: 'YmsGateInYard' });

const { hasAuth } = useAuth();
const { record: containerStatusRecord } = useDict('yms_container_status');
const { record: trailerStatusRecord } = useDict('yms_trailer_status');
const { record: vehicleSourceRecord } = useDict('yms_vehicle_source');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const searchParams = ref<Api.Yms.InYardSearchParams>({
  pageNum: 1,
  pageSize: 20,
  warehouseId: null,
  objectType: null,
  keyword: null,
  currentArea: null
});

const AREA_LABEL: Record<string, string> = {
  WAITING: '等待区',
  YARD: '堆场',
  DOCK: 'Dock'
};

function formatStayMinutes(minutes: number | null) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

function statusLabel(row: Api.Yms.InYard) {
  if (row.objectType === 'CONTAINER') {
    return containerStatusRecord.value[row.currentStatus]?.dictLabel ?? row.currentStatus;
  }
  return trailerStatusRecord.value[row.currentStatus]?.dictLabel ?? row.currentStatus;
}

function typeLabel(row: Api.Yms.InYard) {
  if (row.objectType === 'CONTAINER') return '海柜';
  if (row.vehicleSource) {
    return vehicleSourceRecord.value[row.vehicleSource]?.dictLabel ?? row.vehicleSource;
  }
  return '车厢/车辆';
}

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
  if (warehouseOptions.value.length && !searchParams.value.warehouseId) {
    searchParams.value.warehouseId = warehouseOptions.value[0].value;
  }
}

const { columns, data, getData, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetInYardList(searchParams.value),
  columns: () => [
    {
      key: 'objectType',
      title: '类型',
      width: 120,
      render: row => <NTag size="small">{typeLabel(row)}</NTag>
    },
    { key: 'plateNo', title: '车牌', width: 110, render: row => row.plateNo ?? '—' },
    { key: 'trailerNo', title: '车厢号', width: 130, ellipsis: { tooltip: true }, render: row => row.trailerNo ?? '—' },
    { key: 'containerNo', title: '柜号', width: 150, ellipsis: { tooltip: true }, render: row => row.containerNo ?? '—' },
    {
      key: 'currentStatus',
      title: '状态',
      width: 120,
      render: row => (
        <NTag size="small" type={row.exceptionFlag ? 'error' : 'default'}>
          {statusLabel(row)}
        </NTag>
      )
    },
    {
      key: 'currentArea',
      title: '区域',
      width: 90,
      render: row => AREA_LABEL[row.currentArea] ?? row.currentArea
    },
    { key: 'areaLabel', title: '位置', width: 120, ellipsis: { tooltip: true } },
    { key: 'gateInTime', title: '到场时间', width: 170 },
    {
      key: 'stayMinutes',
      title: '在场时长',
      width: 110,
      render: row => formatStayMinutes(row.stayMinutes)
    },
    { key: 'relatedOrderNo', title: '关联单号', width: 140, ellipsis: { tooltip: true }, render: row => row.relatedOrderNo ?? '—' },
    { key: 'driverName', title: '司机', width: 90, render: row => row.driverName ?? '—' },
    {
      key: 'operate',
      title: '操作',
      width: 120,
      fixed: 'right',
      render: row => {
        if (!hasAuth('yms:exception:handle') || row.exceptionFlag) return null;
        return (
          <NButton size="tiny" quaternary type="warning" onClick={() => handleMarkException(row)}>
            标记异常
          </NButton>
        );
      }
    }
  ]
});

async function handleMarkException(row: Api.Yms.InYard) {
  const reason = window.prompt('请输入异常原因');
  if (!reason) return;
  if (row.objectType === 'CONTAINER') {
    const { error } = await fetchMarkContainerException(row.resourceId, reason);
    if (!error) {
      window.$message?.success('已标记异常');
      getData();
    }
  } else {
    const { error } = await fetchMarkTrailerException(row.resourceId, reason);
    if (!error) {
      window.$message?.success('已标记异常');
      getData();
    }
  }
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  const wh = searchParams.value.warehouseId;
  searchParams.value = {
    pageNum: 1,
    pageSize: 20,
    warehouseId: wh,
    objectType: null,
    keyword: null,
    currentArea: null
  };
  getData();
}

onMounted(async () => {
  await loadWarehouses();
  getData();
});
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="仓库">
          <NSelect
            v-model:value="searchParams.warehouseId"
            :options="warehouseOptions"
            filterable
            placeholder="请选择仓库"
            class="w-180px"
            size="small"
          />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect
            v-model:value="searchParams.objectType"
            clearable
            placeholder="全部"
            class="w-120px"
            size="small"
            :options="[
              { label: '海柜', value: 'CONTAINER' },
              { label: '车厢/车辆', value: 'TRAILER' }
            ]"
          />
        </NFormItem>
        <NFormItem label="区域">
          <NSelect
            v-model:value="searchParams.currentArea"
            clearable
            placeholder="全部"
            class="w-110px"
            size="small"
            :options="[
              { label: '等待区', value: 'WAITING' },
              { label: '堆场', value: 'YARD' },
              { label: 'Dock', value: 'DOCK' }
            ]"
          />
        </NFormItem>
        <NFormItem label="关键字">
          <NInput
            v-model:value="searchParams.keyword"
            clearable
            placeholder="车牌/柜号/车厢号"
            class="w-160px"
            size="small"
          />
        </NFormItem>
        <NFormItem>
          <NButton size="small" type="primary" @click="handleSearch">搜索</NButton>
          <NButton size="small" class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper overflow-hidden">
      <template #header>
        <span>当前在场列表</span>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-key="(row: Api.Yms.InYard) => `${row.objectType}-${row.resourceId}`"
        size="small"
        flex-height
        remote
        scroll-x="1400"
        class="h-full"
      />
    </NCard>
  </div>
</template>
