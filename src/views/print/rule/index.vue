<script setup lang="tsx">
import { computed, ref } from 'vue';
import { NButton, NCard, NCollapse, NCollapseItem, NDataTable, NForm, NFormItem, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetPrintRuleList } from '@/service/api/print';
import { formatPalletScopeLabel, PRINT_RULE_MODE_OPTIONS } from '../constants';
import PrintRuleOperateDrawer from './modules/print-rule-operate-drawer.vue';

defineOptions({ name: 'PrintRule' });

const { record: docTypeRecord } = useDict('print_doc_type');

const searchParams = ref<Api.Print.RuleSearchParams>({
  pageNum: 1,
  pageSize: 10,
  ruleName: null,
  docType: null,
  status: null
});

const drawerVisible = ref(false);
const editingRow = ref<Api.Print.PrintRule | null>(null);

const docTypeOptions = computed(() =>
  Object.entries(docTypeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);
const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' }
];

function printModeLabel(mode?: Api.Print.PrintRuleMode | null) {
  return PRINT_RULE_MODE_OPTIONS.find(m => m.value === mode)?.label || mode || '—';
}

function openCreate() {
  editingRow.value = null;
  drawerVisible.value = true;
}

function openEdit(row: Api.Print.PrintRule) {
  editingRow.value = row;
  drawerVisible.value = true;
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetPrintRuleList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { key: 'ruleCode', title: '规则编号', width: 100, fixed: 'left' },
    { key: 'ruleName', title: '规则名称', width: 220, ellipsis: { tooltip: true }, fixed: 'left' },
    {
      key: 'docType',
      title: '单据类型',
      width: 100,
      render: row => docTypeRecord.value[row.docType]?.dictLabel || row.docType
    },
    { key: 'conditionSummary', title: '触发条件', width: 280, ellipsis: { tooltip: true } },
    { key: 'templateName', title: '选用模板', width: 160, ellipsis: { tooltip: true } },
    { key: 'printQty', title: '份数', width: 56 },
    {
      key: 'printMode',
      title: '打印模式',
      width: 100,
      render: row => printModeLabel(row.printMode)
    },
    { key: 'printerName', title: '打印机', width: 130, ellipsis: { tooltip: true } },
    {
      key: 'palletScope',
      title: '模板目的地',
      width: 140,
      ellipsis: { tooltip: true },
      render: row =>
        formatPalletScopeLabel(row.palletScopeType, row.palletScopeValues) ||
        (row.groupCodes?.length ? row.groupCodes.join('、') : '—')
    },
    { key: 'priority', title: '优先级', width: 72 },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: row => (
        <NTag type={row.status === 'enabled' ? 'success' : 'default'} size="small">
          {row.status === 'enabled' ? '启用' : '停用'}
        </NTag>
      )
    },
    { key: 'hitCount', title: '命中次数', width: 90 },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => (
        <NButton size="small" text type="primary" onClick={() => openEdit(row)}>
          编辑
        </NButton>
      )
    }
  ]
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value.ruleName = null;
  searchParams.value.docType = null;
  searchParams.value.status = null;
  handleSearch();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="打印规则配置" :bordered="false" size="small" class="card-wrapper">
      <template #header-extra>
        <span class="text-xs text-gray-500">按业务触发自动选择模板、份数、打印机与预览模式</span>
      </template>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <NForm inline label-placement="left" :show-feedback="false">
            <NFormItem label="规则名称">
              <NInput v-model:value="searchParams.ruleName" clearable class="w-180px" />
            </NFormItem>
            <NFormItem label="单据类型">
              <NSelect v-model:value="searchParams.docType" :options="docTypeOptions" clearable class="w-120px" />
            </NFormItem>
            <NFormItem label="状态">
              <NSelect v-model:value="searchParams.status" :options="statusOptions" clearable class="w-100px" />
            </NFormItem>
            <NFormItem>
              <NSpace>
                <NButton type="primary" @click="handleSearch">搜索</NButton>
                <NButton @click="handleReset">重置</NButton>
                <NButton type="primary" ghost @click="openCreate">新建规则</NButton>
              </NSpace>
            </NFormItem>
          </NForm>
        </NCollapseItem>
      </NCollapse>
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

    <PrintRuleOperateDrawer v-model:show="drawerVisible" :row="editingRow" @saved="getData" />
  </div>
</template>
