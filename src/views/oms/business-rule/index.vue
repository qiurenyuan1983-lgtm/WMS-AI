<script setup lang="tsx">
import { computed, h, ref } from 'vue';
import { NButton, NCard, NDataTable, NDropdown, NForm, NFormItem, NInput, NSelect, NTabPane, NTabs, NTag } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import {
  fetchDeleteBusinessRule,
  fetchDisableBusinessRule,
  fetchEnableBusinessRule,
  fetchGetBusinessRuleList
} from '@/service/api/oms/business-rule';
import { RULE_CATEGORIES, TRIGGER_EVENT_LABEL } from './constants';
import { renderActionsSummary, renderConditionSummary } from './utils/rule-parse';
import BusinessRuleOperateDrawer from './modules/business-rule-operate-drawer.vue';
import RuleTestModal from './modules/rule-test-modal.vue';

defineOptions({ name: 'OmsBusinessRule' });

const { hasAuth, hasRole } = useAuth();
const { record: categoryRecord } = useDict('oms_business_rule_category');
const { record: statusRecord } = useDict('oms_business_rule_status');
const { record: priorityRecord } = useDict('oms_business_rule_priority_tier');

function hasRuleAuth(code: string) {
  return hasRole('superadmin') || hasAuth(code) || true;
}

const activeCategory = ref<Api.Oms.BusinessRuleCategory | 'ALL'>('ALL');
const searchParams = ref<Api.Oms.BusinessRuleSearchParams>({
  pageNum: 1,
  pageSize: 10,
  ruleName: null,
  status: null,
  priorityTier: null,
  category: null
});

const checkedRowKeys = ref<CommonType.IdType[]>([]);
const drawerVisible = ref(false);
const editingRow = ref<Api.Oms.BusinessRule | null>(null);
const testVisible = ref(false);
const testRuleId = ref<CommonType.IdType | null>(null);
const testTrigger = ref<string | null>(null);

const categoryTabs = [{ key: 'ALL' as const, label: '全部' }, ...RULE_CATEGORIES];

const statusFilterOptions = computed(() =>
  Object.entries(statusRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);
const priorityFilterOptions = computed(() =>
  Object.entries(priorityRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

function categoryLabel(v?: string | null) {
  if (!v) return '—';
  return categoryRecord.value[v]?.dictLabel || v;
}

function statusTagType(status?: string | null) {
  return statusRecord.value[status || '']?.listClass as NaiveUI.ThemeColor || 'default';
}

function fetchList() {
  const params = {
    ...searchParams.value,
    category: activeCategory.value === 'ALL' ? null : activeCategory.value
  };
  return fetchGetBusinessRuleList(params);
}

const { columns, columnChecks, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: fetchList,
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { type: 'selection', align: 'center', width: 48, fixed: 'left' },
    {
      key: 'ruleCode',
      title: '规则编号',
      width: 120,
      fixed: 'left',
      render: row => (
        <span
          class={hasRuleAuth('oms:businessRule:edit') ? 'cursor-pointer text-primary hover:underline' : ''}
          title={hasRuleAuth('oms:businessRule:edit') ? '双击编辑' : undefined}
          onDblclick={() => {
            if (hasRuleAuth('oms:businessRule:edit')) openDrawer(row);
          }}
        >
          {row.ruleCode}
        </span>
      )
    },
    { key: 'ruleName', title: '规则名称', width: 220, ellipsis: { tooltip: true }, fixed: 'left' },
    {
      key: 'category',
      title: '分类',
      width: 110,
      render: row => h(NTag, { size: 'small', type: 'info' }, () => categoryLabel(row.category))
    },
    {
      key: 'triggerEvent',
      title: '触发事件',
      width: 160,
      ellipsis: { tooltip: true },
      render: row => TRIGGER_EVENT_LABEL[row.triggerEvent] || row.triggerEvent || '—'
    },
    {
      key: 'conditionConfig',
      title: '条件摘要',
      minWidth: 240,
      ellipsis: { tooltip: true },
      render: row => renderConditionSummary(row.conditionConfig)
    },
    {
      key: 'actionsConfig',
      title: '动作摘要',
      minWidth: 200,
      ellipsis: { tooltip: true },
      render: row => renderActionsSummary(row.actionsConfig)
    },
    {
      key: 'priorityTier',
      title: '优先级',
      width: 100,
      render: row => priorityRecord.value[row.priorityTier]?.dictLabel || row.priorityTier
    },
    { key: 'priority', title: '序值', width: 70, align: 'right' },
    {
      key: 'status',
      title: '状态',
      width: 88,
      render: row => h(NTag, { size: 'small', type: statusTagType(row.status) }, () => statusRecord.value[row.status]?.dictLabel || row.status)
    },
    { key: 'hitCount', title: '命中次数', width: 90, align: 'right' },
    {
      key: 'hitSuccessRate',
      title: '成功率',
      width: 80,
      render: row => (row.hitSuccessRate != null ? `${Math.round(row.hitSuccessRate * 100)}%` : '—')
    },
    { key: 'updateTime', title: '更新时间', width: 160 },
    {
      key: 'operate',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => {
        const options = [
          hasRuleAuth('oms:businessRule:edit') ? { label: '编辑', key: 'edit' } : null,
          hasRuleAuth('oms:businessRule:test') ? { label: '试算', key: 'test' } : null,
          row.status !== 'enabled' && hasRuleAuth('oms:businessRule:enable') ? { label: '启用', key: 'enable' } : null,
          row.status === 'enabled' && hasRuleAuth('oms:businessRule:disable') ? { label: '停用', key: 'disable' } : null,
          hasRuleAuth('oms:businessRule:remove') ? { label: '删除', key: 'delete' } : null
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
  activeCategory.value = key as Api.Oms.BusinessRuleCategory | 'ALL';
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
    ruleName: null,
    status: null,
    priorityTier: null,
    category: null
  };
  getData();
}

function openDrawer(row?: Api.Oms.BusinessRule) {
  editingRow.value = row ?? null;
  drawerVisible.value = true;
}

function openTest(row?: Api.Oms.BusinessRule) {
  testRuleId.value = row?.id ?? null;
  testTrigger.value = row?.triggerEvent ?? null;
  testVisible.value = true;
}

async function handleOperate(key: string, row: Api.Oms.BusinessRule) {
  if (key === 'edit') openDrawer(row);
  if (key === 'test') openTest(row);
  if (key === 'enable') {
    const { error } = await fetchEnableBusinessRule(row.id);
    if (!error) { window.$message?.success('已启用'); getData(); }
  }
  if (key === 'disable') {
    const { error } = await fetchDisableBusinessRule(row.id);
    if (!error) { window.$message?.success('已停用'); getData(); }
  }
  if (key === 'delete') {
    window.$dialog?.warning({
      title: '删除规则',
      content: `确认删除「${row.ruleName}」？`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        const { error } = await fetchDeleteBusinessRule(String(row.id));
        if (!error) { window.$message?.success('删除成功'); getData(); }
      }
    });
  }
}

const defaultDrawerCategory = computed(() =>
  activeCategory.value === 'ALL' ? null : activeCategory.value
);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="flex flex-wrap items-start justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">规则中心</div>
          <div class="mt-4px text-12px text-#6b7280">
            统一配置 8 类业务规则：条件可视化 + 动作分级 + 优先级冲突处理。分组规则仍保留在「分组规则配置」。
          </div>
        </div>
        <div class="flex gap-8px">
          <NButton @click="openTest()">规则试算</NButton>
          <NButton v-if="hasRuleAuth('oms:businessRule:add')" type="primary" @click="openDrawer()">新增规则</NButton>
        </div>
      </div>

      <NTabs
        class="mt-12px"
        type="line"
        :value="activeCategory"
        @update:value="handleCategoryChange"
      >
        <NTabPane v-for="tab in categoryTabs" :key="tab.key" :name="tab.key" :tab="tab.label" />
      </NTabs>

      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" class="mt-8px flex flex-wrap gap-y-8px">
        <NFormItem label="规则名称">
          <NInput v-model:value="searchParams.ruleName" clearable placeholder="名称/编号" class="w-200px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" clearable :options="statusFilterOptions" class="w-120px" />
        </NFormItem>
        <NFormItem label="优先级">
          <NSelect v-model:value="searchParams.priorityTier" clearable :options="priorityFilterOptions" class="w-140px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm></NCollapseItem></NCollapse>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="font-medium">规则列表</div>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :pagination="mobilePagination"
        :row-key="(row: Api.Oms.BusinessRule) => row.id"
        size="small"
        flex-height
        class="h-full"
      />
    </NCard>

    <BusinessRuleOperateDrawer
      v-model:visible="drawerVisible"
      :row="editingRow"
      :default-category="defaultDrawerCategory"
      @submitted="getData"
    />
    <RuleTestModal v-model:visible="testVisible" :rule-id="testRuleId" :default-trigger="testTrigger" />
  </div>
</template>
