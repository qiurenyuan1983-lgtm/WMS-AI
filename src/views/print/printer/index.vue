<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NCard, NDataTable, NForm, NFormItem, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetPrintPrinterList } from '@/service/api/print';

defineOptions({ name: 'PrintPrinter' });

const { record: typeRecord } = useDict('print_printer_type');
const { record: onlineRecord } = useDict('print_printer_online');

const searchParams = ref<Api.Print.PrinterSearchParams>({
  pageNum: 1,
  pageSize: 10,
  printerName: null,
  warehouseName: null,
  onlineStatus: null,
  deviceType: null
});

const onlineOptions = computed(() =>
  Object.entries(onlineRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);
const typeOptions = computed(() =>
  Object.entries(typeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function protoMsg(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function onlineTagType(status?: string | null) {
  return (onlineRecord.value[status || '']?.listClass as NaiveUI.ThemeColor) || 'default';
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetPrintPrinterList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { key: 'printerCode', title: '编号', width: 120, fixed: 'left' },
    { key: 'printerName', title: '打印机名称', width: 160, fixed: 'left' },
    { key: 'warehouseName', title: '所属仓库', width: 120 },
    { key: 'zoneName', title: '区域', width: 100 },
    {
      key: 'deviceType',
      title: '设备类型',
      width: 110,
      render: row => typeRecord.value[row.deviceType]?.dictLabel || row.deviceType
    },
    { key: 'ipAddress', title: 'IP 地址', width: 130 },
    { key: 'defaultPaper', title: '默认纸张', width: 100 },
    {
      key: 'onlineStatus',
      title: '在线状态',
      width: 90,
      render: row => (
        <NTag type={onlineTagType(row.onlineStatus)} size="small">
          {onlineRecord.value[row.onlineStatus]?.dictLabel || row.onlineStatus}
        </NTag>
      )
    },
    { key: 'defaultTemplateName', title: '默认模板', width: 160, ellipsis: { tooltip: true } },
    { key: 'lastPrintTime', title: '最近打印', width: 160 },
    { key: 'bindScene', title: '绑定场景', width: 130 },
    { key: 'abnormalStatus', title: '异常', width: 160, ellipsis: { tooltip: true } },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      fixed: 'right',
      render: row => (
        <NSpace size="small">
          <NButton size="small" text type="primary" onClick={() => protoMsg(`测试打印：${row.printerName}`)}>
            测试
          </NButton>
          <NButton size="small" text onClick={() => protoMsg(`编辑：${row.printerName}`)}>
            编辑
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
  searchParams.value.printerName = null;
  searchParams.value.warehouseName = null;
  searchParams.value.onlineStatus = null;
  searchParams.value.deviceType = null;
  handleSearch();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="打印机管理" :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="名称">
          <NInput v-model:value="searchParams.printerName" clearable class="w-160px" />
        </NFormItem>
        <NFormItem label="仓库">
          <NInput v-model:value="searchParams.warehouseName" clearable class="w-140px" />
        </NFormItem>
        <NFormItem label="在线">
          <NSelect v-model:value="searchParams.onlineStatus" :options="onlineOptions" clearable class="w-100px" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect v-model:value="searchParams.deviceType" :options="typeOptions" clearable class="w-120px" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
            <NButton @click="protoMsg('新增打印机')">新增</NButton>
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
