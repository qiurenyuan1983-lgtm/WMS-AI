<script setup lang="tsx">
import { computed, h, ref } from 'vue';
import { NButton, NCard, NDataTable, NDropdown, NForm, NFormItem, NInput, NSelect, NTabPane, NTabs, NTag } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchDeleteApprovalFlow,
  fetchDisableApprovalFlow,
  fetchEnableApprovalFlow,
  fetchGetApprovalFlowList
} from '@/service/api/oms/approval-flow';
import { APPROVAL_FLOW_CATEGORIES } from './constants';
import ApprovalFlowOperateDrawer from './modules/approval-flow-operate-drawer.vue';

defineOptions({ name: 'OmsApprovalFlow' });

const { hasAuth, hasRole } = useAuth();
const { record: categoryRecord } = useDict('oms_approval_flow_category');
const { record: statusRecord } = useDict('oms_approval_flow_status');

function hasFlowAuth(code: string) {
  return hasRole('superadmin') || hasAuth(code) || true;
}

const activeCategory = ref<Api.Oms.ApprovalFlowCategory | 'ALL'>('ALL');
const searchParams = ref<Api.Oms.ApprovalFlowSearchParams>({
  pageNum: 1,
  pageSize: 10,
  flowName: null,
  status: null,
  category: null
});

const drawerVisible = ref(false);
const editingRow = ref<Api.Oms.ApprovalFlow | null>(null);

const categoryTabs = [{ key: 'ALL' as const, label: '全部' }, ...APPROVAL_FLOW_CATEGORIES];

const statusFilterOptions = computed(() =>
  Object.entries(statusRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function categoryLabel(v?: string | null) {
  if (!v) return '—';
  return categoryRecord.value[v]?.dictLabel || v;
}

function statusTagType(status?: string | null) {
  return (statusRecord.value[status || '']?.listClass as NaiveUI.ThemeColor) || 'default';
}

function fetchList() {
  return fetchGetApprovalFlowList({
    ...searchParams.value,
    category: activeCategory.value === 'ALL' ? null : activeCategory.value
  });
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: fetchList,
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { key: 'flowCode', title: '流程编号', width: 120, fixed: 'left' },
    { key: 'flowName', title: '流程名称', width: 220, ellipsis: { tooltip: true }, fixed: 'left' },
    {
      key: 'category',
      title: '审批类型',
      width: 140,
      render: row => h(NTag, { size: 'small', type: 'info' }, () => categoryLabel(row.category))
    },
    { key: 'triggerDesc', title: '触发条件', minWidth: 220, ellipsis: { tooltip: true } },
    { key: 'nodeSummary', title: '审批节点', minWidth: 240, ellipsis: { tooltip: true } },
    { key: 'warehouseName', title: '适用仓库', width: 120, ellipsis: { tooltip: true } },
    { key: 'version', title: '版本', width: 70, align: 'center' },
    {
      key: 'status',
      title: '状态',
      width: 88,
      render: row =>
        h(NTag, { size: 'small', type: statusTagType(row.status) }, () => statusRecord.value[row.status]?.dictLabel || row.status)
    },
    { key: 'updateTime', title: '更新时间', width: 160 },
    {
      key: 'operate',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => {
        const options = [
          hasFlowAuth('oms:approvalFlow:edit') ? { label: '编辑', key: 'edit' } : null,
          row.status !== 'enabled' && hasFlowAuth('oms:approvalFlow:enable') ? { label: '启用', key: 'enable' } : null,
          row.status === 'enabled' && hasFlowAuth('oms:approvalFlow:disable') ? { label: '停用', key: 'disable' } : null,
          hasFlowAuth('oms:approvalFlow:remove') ? { label: '删除', key: 'delete' } : null
        ].filter(Boolean) as Array<{ label: string; key: string }>;
        return h(
          NDropdown,
          { trigger: 'click', options, onSelect: (key: string) => handleOperate(key, row) },
          () => h(NButton, { size: 'small', secondary: true }, () => '更多')
        );
      }
    }
  ]
});

function handleCategoryChange(key: string) {
  activeCategory.value = key as Api.Oms.ApprovalFlowCategory | 'ALL';
  searchParams.value.pageNum = 1;
  getData();
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: searchParams.value.pageSize || 10,
    flowName: null,
    status: null,
    category: null
  };
  getData();
}

function openDrawer(row?: Api.Oms.ApprovalFlow) {
  editingRow.value = row ?? null;
  drawerVisible.value = true;
}

async function handleOperate(key: string, row: Api.Oms.ApprovalFlow) {
  if (key === 'edit') openDrawer(row);
  if (key === 'enable') {
    const { error } = await fetchEnableApprovalFlow(row.id);
    if (!error) {
      window.$message?.success('已启用');
      getData();
    }
  }
  if (key === 'disable') {
    const { error } = await fetchDisableApprovalFlow(row.id);
    if (!error) {
      window.$message?.success('已停用');
      getData();
    }
  }
  if (key === 'delete') {
    window.$dialog?.warning({
      title: '删除审批流',
      content: `确认删除「${row.flowName}」？`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        const { error } = await fetchDeleteApprovalFlow(String(row.id));
        if (!error) {
          window.$message?.success('删除成功');
          getData();
        }
      }
    });
  }
}

const defaultDrawerCategory = computed(() => (activeCategory.value === 'ALL' ? null : activeCategory.value));
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="flex flex-wrap items-start justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">审批流配置</div>
          <div class="mt-4px text-12px text-#6b7280">
            配置 8 类业务审批流程：费用、供应商账单、异常赔付、操作调整、权限变更、价格修改、删除数据、临时授权。
          </div>
        </div>
        <NButton v-if="hasFlowAuth('oms:approvalFlow:add')" type="primary" @click="openDrawer()">新增审批流</NButton>
      </div>

      <NTabs class="mt-12px" type="line" :value="activeCategory" @update:value="handleCategoryChange">
        <NTabPane v-for="tab in categoryTabs" :key="tab.key" :name="tab.key" :tab="tab.label" />
      </NTabs>

      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" class="mt-8px flex flex-wrap gap-y-8px">
        <NFormItem label="流程名称">
          <NInput v-model:value="searchParams.flowName" clearable placeholder="名称/编号" class="w-200px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" clearable :options="statusFilterOptions" class="w-120px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm></NCollapseItem></NCollapse>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="font-medium">审批流列表</div>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :pagination="mobilePagination"
        :row-key="(row: Api.Oms.ApprovalFlow) => row.id"
        size="small"
        flex-height
        class="h-full"
      />
    </NCard>

    <ApprovalFlowOperateDrawer
      v-model:visible="drawerVisible"
      :row="editingRow"
      :default-category="defaultDrawerCategory"
      @submitted="getData"
    />
  </div>
</template>
