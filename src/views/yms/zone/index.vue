<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { fetchGetYardZoneList, fetchDeleteYardZone } from '@/service/api/yms/zone';
import ZoneOperateDrawer from './modules/zone-operate-drawer.vue';

const { hasAuth } = useAuth();
const { record: zoneTypeRecord } = useDict('yms_zone_type');

const searchParams = ref<Api.Yms.YardZoneSearchParams>({ pageNum: 1, pageSize: 20 });

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
      render: row => {
        const label = zoneTypeRecord.value[row.zoneType]?.dictLabel ?? row.zoneType;
        return <NTag>{label}</NTag>;
      }
    },
    { key: 'warehouseName', title: '仓库', width: 160, ellipsis: { tooltip: true } },
    { key: 'sortOrder', title: '排序', width: 80, align: 'center' },
    { key: 'remark', title: '备注', ellipsis: { tooltip: true } },
    {
      key: 'operate',
      title: '操作',
      width: 140,
      fixed: 'right',
      render: row => (
        <div class="flex gap-1">
          {hasAuth('yms:yardZone:edit') && (
            <NButton size="tiny" quaternary type="primary" onClick={() => handleEdit(row)}>编辑</NButton>
          )}
          {hasAuth('yms:yardZone:remove') && (
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

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys } =
  useTableOperate(getData);

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchDeleteYardZone([id]);
  if (!error) {
    window.$message?.success('删除成功');
    getData();
  }
}

async function handleBatchDelete() {
  const { error } = await fetchDeleteYardZone(checkedRowKeys.value);
  if (!error) {
    window.$message?.success('删除成功');
    getData();
  }
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: 20 };
  getData();
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="分区编码">
          <NInput v-model:value="searchParams.zoneCode" clearable placeholder="请输入分区编码" />
        </NFormItem>
        <NFormItem label="分区类型">
          <NSelect v-model:value="searchParams.zoneType" clearable placeholder="请选择类型" class="w-140px"
            :options="[
              { label: '集装箱区', value: 'CONTAINER' },
              { label: '卡车区', value: 'TRUCK' },
              { label: '自提区', value: 'SELF_PICKUP' },
              { label: '停车区', value: 'PARKING' }
            ]"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper overflow-hidden">
      <div class="mb-12px flex gap-8px">
        <NButton v-if="hasAuth('yms:yardZone:add')" type="primary" @click="handleAdd">
          <template #icon><SvgIcon icon="ic:round-plus" /></template>
          新增分区
        </NButton>
        <NButton
          v-if="hasAuth('yms:yardZone:remove')"
          type="error"
          :disabled="!checkedRowKeys.length"
          @click="handleBatchDelete"
        >
          批量删除
        </NButton>
      </div>

      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-key="(row: Api.Yms.YardZone) => row.id"
        size="small"
        flex-height
        remote
        class="h-full"
      />
    </NCard>

    <ZoneOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getData"
    />
  </div>
</template>
