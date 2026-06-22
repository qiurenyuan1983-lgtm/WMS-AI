<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NCard, NDataTable, NForm, NFormItem, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetPrintRecordList } from '@/service/api/print';

defineOptions({ name: 'PrintRecord' });

const { record: docTypeRecord } = useDict('print_doc_type');
const { record: resultRecord } = useDict('print_record_result');

const searchParams = ref<Api.Print.RecordSearchParams>({
  pageNum: 1,
  pageSize: 10,
  sourceNo: null,
  docType: null,
  printUser: null,
  result: null
});

const docTypeOptions = computed(() =>
  Object.entries(docTypeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);
const resultOptions = computed(() =>
  Object.entries(resultRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function protoMsg(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function resultTagType(result?: string | null) {
  return (resultRecord.value[result || '']?.listClass as NaiveUI.ThemeColor) || 'default';
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetPrintRecordList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { key: 'printTime', title: '打印时间', width: 160, fixed: 'left' },
    { key: 'printUser', title: '打印用户', width: 90 },
    { key: 'templateName', title: '模板', width: 180, ellipsis: { tooltip: true } },
    {
      key: 'docType',
      title: '单据类型',
      width: 100,
      render: row => docTypeRecord.value[row.docType]?.dictLabel || row.docType
    },
    { key: 'sourceNo', title: '来源单号', width: 150 },
    { key: 'printQty', title: '份数', width: 60 },
    { key: 'printerName', title: '打印机', width: 140 },
    {
      key: 'isReprint',
      title: '重打',
      width: 70,
      render: row => (row.isReprint ? <NTag type="warning" size="small">是</NTag> : '否')
    },
    { key: 'reprintReason', title: '重打原因', width: 160, ellipsis: { tooltip: true } },
    {
      key: 'result',
      title: '结果',
      width: 80,
      render: row => (
        <NTag type={resultTagType(row.result)} size="small">
          {resultRecord.value[row.result]?.dictLabel || row.result}
        </NTag>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      fixed: 'right',
      render: row => (
        <NSpace size="small">
          <NButton size="small" text type="primary" onClick={() => protoMsg(`下载 PDF：${row.sourceNo}`)}>
            PDF
          </NButton>
          <NButton size="small" text onClick={() => protoMsg(`审计详情：${row.id}`)}>
            详情
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
  searchParams.value.sourceNo = null;
  searchParams.value.docType = null;
  searchParams.value.printUser = null;
  searchParams.value.result = null;
  handleSearch();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="打印记录" :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="来源单号">
          <NInput v-model:value="searchParams.sourceNo" clearable class="w-160px" />
        </NFormItem>
        <NFormItem label="单据类型">
          <NSelect v-model:value="searchParams.docType" :options="docTypeOptions" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="打印用户">
          <NInput v-model:value="searchParams.printUser" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="结果">
          <NSelect v-model:value="searchParams.result" :options="resultOptions" clearable class="w-100px" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
            <NButton @click="protoMsg('导出审计报表')">导出</NButton>
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
