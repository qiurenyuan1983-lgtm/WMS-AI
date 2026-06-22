<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NCard, NDataTable, NForm, NFormItem, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetPrintTemplateVersionList } from '@/service/api/print';
import PrintVersionLifecycleHint from '../_components/print-version-lifecycle.vue';

defineOptions({ name: 'PrintTemplateVersion' });

const { record: statusRecord } = useDict('print_template_status');
const { record: typeRecord } = useDict('print_template_type');

const searchParams = ref<Api.Print.VersionSearchParams>({
  pageNum: 1,
  pageSize: 10,
  templateName: null,
  templateType: null,
  status: null
});

const statusOptions = computed(() =>
  Object.entries(statusRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);
const typeOptions = computed(() =>
  Object.entries(typeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function protoMsg(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function statusTagType(status?: string | null) {
  return (statusRecord.value[status || '']?.listClass as NaiveUI.ThemeColor) || 'default';
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetPrintTemplateVersionList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { key: 'templateCode', title: '模板编号', width: 120, fixed: 'left' },
    { key: 'templateName', title: '模板名称', width: 180, ellipsis: { tooltip: true }, fixed: 'left' },
    {
      key: 'templateType',
      title: '类型',
      width: 100,
      render: row => typeRecord.value[row.templateType]?.dictLabel || row.templateType
    },
    { key: 'version', title: '版本号', width: 72 },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: row => (
        <NTag type={statusTagType(row.status)} size="small">
          {statusRecord.value[row.status || '']?.dictLabel || row.status}
        </NTag>
      )
    },
    { key: 'publisherName', title: '发布人', width: 90 },
    { key: 'effectiveTime', title: '生效时间', width: 160 },
    { key: 'warehouseNames', title: '适用仓库', width: 120 },
    { key: 'customerNames', title: '适用客户', width: 100 },
    { key: 'useCount', title: '使用次数', width: 90 },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      fixed: 'right',
      render: row => (
        <NSpace size="small">
          <NButton size="small" text type="primary" onClick={() => protoMsg(`对比版本：${row.templateName} v${row.version}`)}>
            对比
          </NButton>
          <NButton size="small" text onClick={() => protoMsg(`回滚至 v${row.version}`)}>
            回滚
          </NButton>
        </NSpace>
      )
    }
  ]
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value.templateName = null;
  searchParams.value.templateType = null;
  searchParams.value.status = null;
  handleSearch();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <PrintVersionLifecycleHint />
    <NCard title="模板版本管理" :bordered="false" size="small" class="card-wrapper">
      <template #header-extra>
        <span class="text-xs text-gray-500">支持历史版本对比、回滚、适用仓库/客户与使用次数统计</span>
      </template>
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="模板名称">
          <NInput v-model:value="searchParams.templateName" clearable class="w-180px" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect v-model:value="searchParams.templateType" :options="typeOptions" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" :options="statusOptions" clearable class="w-120px" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NFormItem>
      </NForm></NCollapseItem></NCollapse>
    </NCard>
    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :pagination="mobilePagination"
        remote
        size="small"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>
