<script setup lang="tsx">
import { h, ref } from 'vue';
import { NButton, NCard, NDataTable, NForm, NFormItem, NInput, NModal, NSelect } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchAssignZoneRuleFallback, fetchDeleteZoneRule, fetchGetZoneRuleList } from '@/service/api/oms/zone-rule';
import {
  DELIVERY_METHOD_OPTIONS,
  PLATFORM_OPTIONS,
  STORAGE_METHOD_OPTIONS,
  ZONE_TYPE_OPTIONS,
  deliveryMethodLabel,
  displayDash,
  platformLabel
} from './constants';
import ZoneRuleOperateDrawer from './modules/zone-rule-operate-drawer.vue';

defineOptions({ name: 'OmsZoneRule' });

const searchParams = ref<Api.Oms.ZoneRuleSearchParams>({
  pageNum: 1,
  pageSize: 10,
  zoneName: null,
  locationNo: null,
  zoneType: null,
  storageMethod: null,
  deliveryMethod: null,
  platform: null,
  platformCode: null
});

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const editingRow = ref<Api.Oms.ZoneRule | null>(null);
const fallbackVisible = ref(false);
const fallbackForm = ref<Api.Oms.ZoneRuleFallbackParams>({ zoneNames: 'Z区', locationNos: 'Z01-Z05', remark: null });

const { columns, columnChecks, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetZoneRuleList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    {
      key: 'index',
      title: '序号',
      width: 64,
      align: 'center',
      render: (_row, index) => {
        const page = searchParams.value.pageNum || 1;
        const size = searchParams.value.pageSize || 10;
        return (page - 1) * size + index + 1;
      }
    },
    { key: 'zoneNames', title: '区域', minWidth: 120, ellipsis: { tooltip: true } },
    { key: 'locationNos', title: '库位', minWidth: 200, ellipsis: { tooltip: true } },
    {
      key: 'zoneType',
      title: '库区类型',
      width: 96,
      render: row => displayDash(row.zoneType)
    },
    {
      key: 'storageMethod',
      title: '存放方式',
      width: 96,
      render: row => displayDash(row.storageMethod)
    },
    { key: 'priority', title: '优先级', width: 80, align: 'center' },
    {
      key: 'deliveryMethod',
      title: '派送方式',
      width: 130,
      ellipsis: { tooltip: true },
      render: row => deliveryMethodLabel(row.deliveryMethod)
    },
    {
      key: 'platform',
      title: '平台',
      width: 130,
      render: row => platformLabel(row.platform)
    },
    {
      key: 'platformCode',
      title: '平台代码',
      minWidth: 160,
      ellipsis: { tooltip: true },
      render: row => displayDash(row.platformCode)
    },
    {
      key: 'operate',
      title: '操作',
      width: 130,
      fixed: 'right',
      render: row =>
        h('div', { class: 'flex gap-8px' }, [
          h(NButton, { size: 'small', tertiary: true, type: 'primary', onClick: () => openDrawer(row) }, () => '编辑'),
          h(NButton, { size: 'small', tertiary: true, type: 'error', onClick: () => handleDelete(row) }, () => '删除')
        ])
    }
  ]
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    zoneName: null,
    locationNo: null,
    zoneType: null,
    storageMethod: null,
    deliveryMethod: null,
    platform: null,
    platformCode: null
  };
  getData();
}

function openDrawer(row?: Api.Oms.ZoneRule) {
  drawerMode.value = row?.id != null ? 'edit' : 'create';
  editingRow.value = row ?? null;
  drawerVisible.value = true;
}

function handleDelete(row: Api.Oms.ZoneRule) {
  window.$dialog?.warning({
    title: '删除规则',
    content: `确认删除区域「${row.zoneNames}」的上架规则？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await fetchDeleteZoneRule(String(row.id));
      if (!error) {
        window.$message?.success('已删除');
        getData();
      }
    }
  });
}

async function submitFallback() {
  const { error } = await fetchAssignZoneRuleFallback(fallbackForm.value);
  if (!error) {
    window.$message?.success('兜底库区库位已更新');
    fallbackVisible.value = false;
    getData();
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="mb-12px flex flex-wrap items-start justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">入库配置规则</div>
          <div class="mt-4px text-12px text-#6b7280">配置入库推荐库区/库位，按派送方式、平台与优先级匹配货物。</div>
        </div>
        <div class="flex flex-wrap gap-8px">
          <NButton @click="fallbackVisible = true">分配现库区库位</NButton>
          <NButton type="primary" @click="openDrawer()">+ 新增规则</NButton>
        </div>
      </div>

      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" class="flex flex-wrap gap-y-8px">
        <NFormItem label="区域名称">
          <NInput v-model:value="searchParams.zoneName" clearable placeholder="区域" class="w-120px" />
        </NFormItem>
        <NFormItem label="库位号">
          <NInput v-model:value="searchParams.locationNo" clearable placeholder="库位" class="w-120px" />
        </NFormItem>
        <NFormItem label="库区类型">
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="searchParams.zoneType"
            clearable
            :options="ZONE_TYPE_OPTIONS"
            class="w-120px"
          />
        </NFormItem>
        <NFormItem label="存放方式">
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="searchParams.storageMethod"
            clearable
            :options="STORAGE_METHOD_OPTIONS"
            class="w-120px"
          />
        </NFormItem>
        <NFormItem label="派送方式">
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="searchParams.deliveryMethod"
            clearable
            :options="DELIVERY_METHOD_OPTIONS"
            class="w-150px"
          />
        </NFormItem>
        <NFormItem label="平台">
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="searchParams.platform"
            clearable
            :options="PLATFORM_OPTIONS"
            class="w-140px"
          />
        </NFormItem>
        <NFormItem label="平台代码">
          <NInput v-model:value="searchParams.platformCode" clearable placeholder="平台代码" class="w-140px" />
        </NFormItem>
        <NFormItem>
          <NButton @click="handleReset">重置</NButton>
          <NButton type="primary" class="ml-8px" @click="handleSearch">搜索</NButton>
        </NFormItem>
      </NForm></NCollapseItem></NCollapse>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">入库配置规则</span>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :loading="loading"
            :show-add="false"
            :show-delete="false"
            @refresh="getData"
          />
        </div>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :pagination="mobilePagination"
        :row-key="(row: Api.Oms.ZoneRule) => row.id"
        size="small"
        flex-height
        class="h-full min-h-360px"
      />
    </NCard>

    <ZoneRuleOperateDrawer
      :key="`${drawerMode}-${editingRow?.id ?? 'new'}`"
      v-model:visible="drawerVisible"
      :mode="drawerMode"
      :row="editingRow"
      @submitted="getData"
    />

    <NModal v-model:show="fallbackVisible" preset="card" title="分配兜底库区库位" style="width: 420px; max-width: 96vw">
      <NForm label-placement="top" size="small">
        <NFormItem label="兜底区域">
          <NInput v-model:value="fallbackForm.zoneNames" placeholder="未匹配规则时使用" />
        </NFormItem>
        <NFormItem label="兜底库位">
          <NInput v-model:value="fallbackForm.locationNos" placeholder="如 Z01-Z05" />
        </NFormItem>
        <NFormItem label="说明">
          <NInput v-model:value="fallbackForm.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="fallbackVisible = false">取消</NButton>
          <NButton type="primary" @click="submitFallback">确认</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
