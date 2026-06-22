<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NCard, NDataTable, NDropdown, NForm, NFormItem, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetPrintTaskList } from '@/service/api/print';

defineOptions({ name: 'PrintTask' });

const { record: statusRecord } = useDict('print_task_status');
const { record: docTypeRecord } = useDict('print_doc_type');

const searchParams = ref<Api.Print.TaskSearchParams>({
  pageNum: 1,
  pageSize: 10,
  taskNo: null,
  docType: null,
  status: null,
  sourceNo: null
});

const statusOptions = computed(() =>
  Object.entries(statusRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);
const docTypeOptions = computed(() =>
  Object.entries(docTypeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function protoMsg(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function statusTagType(status?: string | null) {
  return (statusRecord.value[status || '']?.listClass as NaiveUI.ThemeColor) || 'default';
}

function rowActions(row: Api.Print.PrintTask) {
  return [
    { label: '打印', key: 'print', show: row.status === 'pending' || row.status === 'failed' },
    { label: '重新打印', key: 'reprint', show: row.status === 'completed' || row.status === 'failed' },
    { label: '取消', key: 'cancel', show: row.status === 'pending' },
    { label: '更换模板', key: 'changeTemplate' },
    { label: '更换打印机', key: 'changePrinter' },
    { label: '下载 PDF', key: 'pdf' },
    { label: '查看记录', key: 'record' }
  ].filter(a => a.show !== false);
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetPrintTaskList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { key: 'taskNo', title: '打印任务号', width: 150, fixed: 'left' },
    {
      key: 'docType',
      title: '单据类型',
      width: 100,
      render: row => docTypeRecord.value[row.docType]?.dictLabel || row.docType
    },
    { key: 'sourceNo', title: '来源单号', width: 150 },
    { key: 'templateName', title: '模板名称', width: 180, ellipsis: { tooltip: true } },
    { key: 'printQty', title: '份数', width: 60 },
    { key: 'printerName', title: '打印机', width: 140 },
    { key: 'creatorName', title: '创建人', width: 80 },
    { key: 'createTime', title: '创建时间', width: 160 },
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
    { key: 'failReason', title: '失败原因', width: 120, ellipsis: { tooltip: true } },
    { key: 'reprintCount', title: '重打次数', width: 80 },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => (
        <NDropdown
          options={rowActions(row).map(a => ({ label: a.label, key: a.key }))}
          onSelect={(key: string) => protoMsg(`${key}：${row.taskNo}`)}
        >
          <NButton size="small" type="primary" text>
            操作
          </NButton>
        </NDropdown>
      )
    }
  ]
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value.taskNo = null;
  searchParams.value.docType = null;
  searchParams.value.status = null;
  searchParams.value.sourceNo = null;
  handleSearch();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="打印任务" :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="任务号">
          <NInput v-model:value="searchParams.taskNo" clearable class="w-160px" />
        </NFormItem>
        <NFormItem label="单据类型">
          <NSelect v-model:value="searchParams.docType" :options="docTypeOptions" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" :options="statusOptions" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="来源单号">
          <NInput v-model:value="searchParams.sourceNo" clearable class="w-160px" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
            <NButton @click="protoMsg('创建打印任务')">新建任务</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>
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
