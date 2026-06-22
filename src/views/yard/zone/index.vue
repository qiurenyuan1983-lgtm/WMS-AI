<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchBatchDeleteYardZone, fetchGetYardZoneList } from '@/service/api/yard/zone';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import ZoneOperateDrawer from './modules/zone-operate-drawer.vue';

defineOptions({ name: 'YardZoneList' });

const { hasAuth } = useAuth();
const { record: zoneTypeRecord } = useDict('yard_zone_type');

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const searchParams = ref<Api.Yard.ZoneSearchParams>({ pageNum: 1, pageSize: 20, zoneCode: null, zoneName: null, zoneType: null, warehouseId: null });

const { columns, data, getData, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetYardZoneList(searchParams.value),
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    { key: 'zoneCode', title: '分区编码', width: 140, ellipsis: { tooltip: true } },
    { key: 'zoneName', title: '分区名称', width: 160, ellipsis: { tooltip: true } },
    {
      key: 'zoneType',
      title: '类型',
      width: 120,
      render: row => <NTag>{zoneTypeRecord.value[row.zoneType]?.dictLabel ?? row.zoneType}</NTag>
    },
    { key: 'sortOrder', title: '排序', width: 80, align: 'center' },
    { key: 'remark', title: '备注', ellipsis: { tooltip: true } },
    {
      key: 'operate',
      title: '操作',
      width: 140,
      fixed: 'right',
      render: row => (
        <div class="flex gap-1">
          {hasAuth('yard:zone:edit') && (
            <NButton size="tiny" quaternary type="primary" onClick={() => handleEdit(row)}>编辑</NButton>
          )}
          {hasAuth('yard:zone:remove') && (
            <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
              {{
                default: () => '确认删除该分区？',
                trigger: () => <NButton size="tiny" quaternary type="error">删除</NButton>
              }}
            </NPopconfirm>
          )}
        </div>
      )
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys } = useTableOperate(getData);

async function loadWarehouses() {
  const { data: whData } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  warehouseOptions.value = ((whData as any)?.rows ?? []).map((w: any) => ({ label: w.warehouseName, value: w.id }));
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteYardZone([id]);
  if (!error) {
    window.$message?.success('删除成功');
    getData();
  }
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteYardZone(checkedRowKeys.value as CommonType.IdType[]);
  if (!error) {
    window.$message?.success('删除成功');
    getData();
  }
}

onMounted(loadWarehouses);
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="仓库">
          <NSelect v-model:value="searchParams.warehouseId" clearable filterable placeholder="选择仓库" class="w-180px" :options="warehouseOptions" />
        </NFormItem>
        <NFormItem label="分区编码">
          <NInput v-model:value="searchParams.zoneCode" clearable placeholder="分区编码" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="() => { searchParams.pageNum = 1; getData(); }">搜索</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper overflow-hidden">
      <div class="mb-12px flex gap-8px">
        <NButton v-if="hasAuth('yard:zone:add')" type="primary" @click="handleAdd">新增分区</NButton>
        <NButton v-if="hasAuth('yard:zone:remove')" type="error" :disabled="!checkedRowKeys.length" @click="handleBatchDelete">批量删除</NButton>
      </div>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-key="(row: Api.Yard.Zone) => row.id"
        size="small"
        flex-height
        remote
        class="h-full"
      />
    </NCard>

    <ZoneOperateDrawer v-model:visible="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getData" />
  </div>
</template>
