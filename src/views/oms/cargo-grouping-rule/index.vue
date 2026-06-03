<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { NButton, NDropdown, NInput, NInputNumber, NSelect, NTag } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetBusinessTypeList } from '@/service/api/base/business-type';
import { fetchGetChannelList } from '@/service/api/base/channel';
import { fetchGetPlatformList } from '@/service/api/base/platform';
import { fetchGetPlatformAddressList } from '@/service/api/base/platform-address';
import { fetchGetWarehouseList } from '@/service/api/base/warehouse';
import {
  fetchCopyCargoGroupingRule,
  fetchCreateCargoGroupingRule,
  fetchDeleteCargoGroupingRule,
  fetchDisableCargoGroupingRule,
  fetchEnableCargoGroupingRule,
  fetchGetCargoGroupingFieldMetaList,
  fetchGetCargoGroupingRuleList,
  fetchTestCargoGroupingRule,
  fetchUpdateCargoGroupingRule
} from '@/service/api/oms/cargo-grouping-rule';

defineOptions({ name: 'OmsCargoGroupingRule' });

const { hasAuth, hasRole } = useAuth();
const { options: statusOptions } = useDict('oms_cargo_grouping_rule_status');
const { options: parcelCarrierOptions } = useDict('oms_parcel_carrier');
const { options: addressTypeOptions } = useDict('oms_address_type');

const warehouseOptions = ref<CommonType.Option[]>([]);
const businessTypeOptions = ref<CommonType.Option[]>([]);
const channelOptions = ref<CommonType.Option[]>([]);
const platformOptions = ref<CommonType.Option[]>([]);
const platformWarehouseOptions = ref<CommonType.Option[]>([]);
const fieldMetaList = ref<Api.Oms.CargoGroupingFieldMeta[]>([]);
const checkedRowKeys = ref<CommonType.IdType[]>([]);

function hasRuleAuth(code: string) {
  return hasRole('superadmin') || hasAuth(code);
}

const DEFAULT_FIELD_META_LIST: Api.Oms.CargoGroupingFieldMeta[] = [
  { id: 'order.order_no', tableAlias: 'order', fieldName: 'order_no', displayName: '订单号', dataType: 'STRING', canBeCondition: 0, canBeGroupKey: 1, enabled: 1 },
  { id: 'order.order_type', tableAlias: 'order', fieldName: 'order_type', displayName: '业务类型/派送方式', dataType: 'ENUM', enumCode: 'base_business_type', canBeCondition: 1, canBeGroupKey: 1, enabled: 1 },
  { id: 'order.address_type', tableAlias: 'order', fieldName: 'address_type', displayName: '地址类型', dataType: 'ENUM', enumCode: 'oms_address_type', canBeCondition: 1, canBeGroupKey: 1, enabled: 1 },
  { id: 'order.platform_id', tableAlias: 'order', fieldName: 'platform_id', displayName: '平台', dataType: 'REF', refType: 'base_platform', canBeCondition: 1, canBeGroupKey: 1, enabled: 1 },
  { id: 'order.platform_code', tableAlias: 'order', fieldName: 'platform_code', displayName: '仓库代码', dataType: 'REF', refType: 'base_platform_address', canBeCondition: 1, canBeGroupKey: 1, enabled: 1 },
  { id: 'order.parcel_carrier_name', tableAlias: 'order', fieldName: 'parcel_carrier_name', displayName: '快递商', dataType: 'ENUM', enumCode: 'oms_parcel_carrier', canBeCondition: 1, canBeGroupKey: 1, enabled: 1 },
  { id: 'order.customer_id', tableAlias: 'order', fieldName: 'customer_id', displayName: '客户', dataType: 'REF', refType: 'base_customer', canBeCondition: 1, canBeGroupKey: 0, enabled: 1 },
  { id: 'order.channel_id', tableAlias: 'order', fieldName: 'channel_id', displayName: '渠道', dataType: 'REF', refType: 'base_channel', canBeCondition: 1, canBeGroupKey: 0, enabled: 1 },
  { id: 'order.hold_flag', tableAlias: 'order', fieldName: 'hold_flag', displayName: 'HOLD标记', dataType: 'ENUM', enumCode: 'yes_no_int', canBeCondition: 1, canBeGroupKey: 1, enabled: 1 },
  { id: 'order.transfer_flag', tableAlias: 'order', fieldName: 'transfer_flag', displayName: '是否转仓', dataType: 'ENUM', enumCode: 'yes_no_int', canBeCondition: 1, canBeGroupKey: 0, enabled: 1 },
  { id: 'order.transfer_warehouse_code', tableAlias: 'order', fieldName: 'transfer_warehouse_code', displayName: '转仓地址', dataType: 'STRING', canBeCondition: 0, canBeGroupKey: 1, enabled: 1 },
  { id: 'shipment.shipment_no', tableAlias: 'shipment', fieldName: 'shipment_no', displayName: '货件编号', dataType: 'STRING', canBeCondition: 0, canBeGroupKey: 1, enabled: 1 },
  { id: 'shipment.warehouse_code', tableAlias: 'shipment', fieldName: 'warehouse_code', displayName: '货件仓库代码', dataType: 'STRING', canBeCondition: 0, canBeGroupKey: 1, enabled: 1 },
  { id: 'shipment.shipment_type', tableAlias: 'shipment', fieldName: 'shipment_type', displayName: '货件类型', dataType: 'ENUM', enumCode: 'oms_shipment_type', canBeCondition: 0, canBeGroupKey: 1, enabled: 1 }
];


const shipmentTypeOptions: CommonType.Option[] = [
  { label: '普通货件', value: 'STANDARD' },
  { label: '虚拟货件', value: 'VIRTUAL' }
];

const searchCollapsed = ref(false);
const searchParams = ref<Api.Oms.CargoGroupingRuleSearchParams>({
  pageNum: 1,
  pageSize: 10,
  status: null,
  ruleName: null
});

const conditionFieldOptions = computed(() =>
  fieldMetaList.value
    .filter(item => item.canBeCondition !== 0)
    .map(item => ({
      label: `${item.displayName} (${item.tableAlias}.${item.fieldName})`,
      value: `${item.tableAlias}.${item.fieldName}`
    }))
);

const groupKeyFieldOptions = computed(() =>
  fieldMetaList.value
    .filter(item => item.canBeGroupKey !== 0)
    .map(item => ({
      label: `${item.displayName} (${item.tableAlias}.${item.fieldName})`,
      value: `${item.tableAlias}.${item.fieldName}`
    }))
);

const opOptions = [
  { label: '等于', value: 'EQ' },
  { label: '不等于', value: 'NEQ' },
  { label: '包含于', value: 'IN' },
  { label: '不包含于', value: 'NOT_IN' },
  { label: '为空', value: 'IS_NULL' },
  { label: '不为空', value: 'IS_NOT_NULL' },
  { label: '大于', value: 'GT' },
  { label: '大于等于', value: 'GTE' },
  { label: '小于', value: 'LT' },
  { label: '小于等于', value: 'LTE' }
];

function statusLabel(status?: string | null) {
  return status === 'disabled' ? '停用' : '启用';
}

function statusTagType(status?: string | null) {
  return status === 'disabled' ? 'default' : 'success';
}

function safeParse<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function renderConditionSummary(row: Api.Oms.CargoGroupingRule) {
  const config = safeParse<Api.Oms.CargoGroupingRuleConditionConfig>(row.conditionConfig, {
    mode: 'VALUE_MATCH',
    logic: 'AND',
    conditions: []
  });
  if (config.mode === 'EXPRESSION') return config.expression || '--';
  if (!config.conditions?.length) return '全部匹配';
  return config.conditions
    .map(item => `${fieldLabel(item.field)} ${item.op} ${Array.isArray(item.value) ? item.value.join(',') : item.value ?? ''}`)
    .join(` ${config.logic || 'AND'} `);
}

function renderGroupKeySummary(row: Api.Oms.CargoGroupingRule) {
  const config = safeParse<Api.Oms.CargoGroupingRuleGroupKeyConfig>(row.groupKeyConfig, { separator: '-', fields: [] });
  if (!config.fields.length) return '--';
  return config.fields.map(item => fieldLabel(item.field)).join(` ${config.separator || '-'} `);
}

function fieldLabel(field: string) {
  const [tableAlias, fieldName] = field.split('.');
  const meta = fieldMetaList.value.find(item => item.tableAlias === tableAlias && item.fieldName === fieldName);
  return meta?.displayName || field;
}

const { columns, columnChecks, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetCargoGroupingRuleList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    { key: 'ruleName', title: '规则名称', width: 180, ellipsis: { tooltip: true } },
    { key: 'warehouseName', title: '仓库', width: 180, ellipsis: { tooltip: true } },
    {
      key: 'conditionConfig',
      title: '匹配条件',
      minWidth: 260,
      ellipsis: { tooltip: true },
      render: row => renderConditionSummary(row)
    },
    {
      key: 'groupKeyConfig',
      title: '分组键',
      width: 220,
      ellipsis: { tooltip: true },
      render: row => renderGroupKeySummary(row)
    },
    { key: 'priority', title: '优先级', width: 90, align: 'right' },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: row => h(NTag, { type: statusTagType(row.status), size: 'small' }, () => statusLabel(row.status))
    },
    {
      key: 'isDefault',
      title: '来源',
      width: 100,
      render: row =>
        row.isDefault
          ? h(NTag, { type: 'info', size: 'small' }, () => '内置')
          : h(NTag, { type: 'success', size: 'small' }, () => '运营配置')
    },
    { key: 'updateTime', title: '更新时间', width: 170 },
    {
      key: 'operate',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => {
        const options = [
          hasRuleAuth('oms:cargoGroupingRule:edit') ? { label: '编辑', key: 'edit' } : null,
          hasRuleAuth('oms:cargoGroupingRule:copy') ? { label: '复制', key: 'copy' } : null,
          row.status === 'disabled' && hasRuleAuth('oms:cargoGroupingRule:enable') ? { label: '启用', key: 'enable' } : null,
          row.status !== 'disabled' && hasRuleAuth('oms:cargoGroupingRule:disable') ? { label: '停用', key: 'disable' } : null,
          hasRuleAuth('oms:cargoGroupingRule:remove') && !row.isDefault ? { label: '删除', key: 'delete' } : null
        ].filter(Boolean) as Array<{ label: string; key: string }>;
        return h(
          NDropdown,
          {
            trigger: 'click',
            options,
            onSelect: key => handleOperate(key as string, row)
          },
          () => h(NButton, { size: 'small', secondary: true }, () => '更多')
        );
      }
    }
  ]
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value = { pageNum: 1, pageSize: searchParams.value.pageSize || 10, status: null, ruleName: null };
  getData();
}

async function handleOperate(key: string, row: Api.Oms.CargoGroupingRule) {
  if (key === 'edit') openDrawer(row);
  if (key === 'copy') {
    const { error } = await fetchCopyCargoGroupingRule(row.id);
    if (!error) {
      window.$message?.success('复制成功');
      getData();
    }
  }
  if (key === 'enable') await changeStatus(row.id, true);
  if (key === 'disable') await changeStatus(row.id, false);
  if (key === 'delete') {
    window.$dialog?.warning({
      title: '删除规则',
      content: `确认删除规则「${row.ruleName}」？`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        const { error } = await fetchDeleteCargoGroupingRule(String(row.id));
        if (!error) {
          window.$message?.success('删除成功');
          getData();
        }
      }
    });
  }
}

async function changeStatus(id: CommonType.IdType, enabled: boolean) {
  const api = enabled ? fetchEnableCargoGroupingRule : fetchDisableCargoGroupingRule;
  const { error } = await api(id);
  if (!error) {
    window.$message?.success(enabled ? '已启用' : '已停用');
    getData();
  }
}

// ===================== operate drawer =====================

const drawerVisible = ref(false);
const editingRow = ref<Api.Oms.CargoGroupingRule | null>(null);

type RuleForm = {
  id?: CommonType.IdType;
  warehouseIds: string[];
  warehouseNames: string;
  ruleName: string;
  priority: number;
  status: Api.Oms.CargoGroupingRuleStatus;
  isDefault: number;
  version?: number | null;
  remark: string | null;
  conditionMode: 'VALUE_MATCH' | 'EXPRESSION';
  conditionLogic: 'AND' | 'OR';
  conditions: Array<{ field: string | null; op: string; value: string | string[] | null }>;
  expression: string | null;
  separator: string;
  groupFields: Array<{ field: string | null }>;
};

function isMultiValueOp(op: string) {
  return ['IN', 'NOT_IN'].includes(op);
}

const YES_NO_INT_OPTIONS: CommonType.Option[] = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
];

function conditionValueOptions(field: string | null) {
  if (field === 'order.order_type') return businessTypeOptions.value;
  if (field === 'order.address_type') return addressTypeOptions.value;
  if (field === 'order.channel_id') return channelOptions.value;
  if (field === 'order.platform_id') return platformOptions.value;
  if (field === 'order.platform_code') return platformWarehouseOptions.value;
  if (field === 'order.parcel_carrier_name') return parcelCarrierOptions.value;
  if (field === 'order.hold_flag') return YES_NO_INT_OPTIONS;
  if (field === 'order.transfer_flag') return YES_NO_INT_OPTIONS;
  if (field === 'shipment.shipment_type') return shipmentTypeOptions;
  return [];
}

function conditionUsesSelect(field: string | null) {
  return conditionValueOptions(field).length > 0;
}

function normalizeConditionValue(op: string, value: unknown) {
  if (isMultiValueOp(op)) {
    if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
    if (value == null || value === '') return [];
    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) return value[0] == null ? null : String(value[0]);
  return value == null ? null : String(value);
}

function handleConditionFieldChange(condition: RuleForm['conditions'][number], value: string | null) {
  condition.field = value;
  condition.value = isMultiValueOp(condition.op) ? [] : null;
}

function handleConditionOpChange(condition: RuleForm['conditions'][number], value: string) {
  condition.op = value;
  condition.value = isMultiValueOp(value) ? [] : null;
}

const form = reactive<RuleForm>(createDefaultForm());

function createDefaultForm(): RuleForm {
  return {
    warehouseIds: [],
    warehouseNames: '',
    ruleName: '',
    priority: 0,
    status: 'enabled',
    isDefault: 0,
    remark: null,
    conditionMode: 'VALUE_MATCH',
    conditionLogic: 'AND',
    conditions: [{ field: null, op: 'EQ', value: null }],
    expression: null,
    separator: '-',
    groupFields: [{ field: null }]
  };
}

function resetForm() {
  Object.assign(form, createDefaultForm());
  editingRow.value = null;
}

function openDrawer(row?: Api.Oms.CargoGroupingRule) {
  resetForm();
  if (row) {
    editingRow.value = row;
    const conditionConfig = safeParse<Api.Oms.CargoGroupingRuleConditionConfig>(row.conditionConfig, {
      mode: 'VALUE_MATCH',
      logic: 'AND',
      conditions: []
    });
    const groupConfig = safeParse<Api.Oms.CargoGroupingRuleGroupKeyConfig>(row.groupKeyConfig, { separator: '-', fields: [] });
    const parsedIds: string[] = (() => {
      try { return row.warehouseIds ? JSON.parse(row.warehouseIds) : []; }
      catch { return []; }
    })();
    Object.assign(form, {
      id: row.id,
      warehouseIds: parsedIds,
      warehouseNames: row.warehouseName || '',
      ruleName: row.ruleName,
      priority: row.priority || 0,
      status: row.status || 'enabled',
      isDefault: row.isDefault || 0,
      version: row.version,
      remark: row.remark || null,
      conditionMode: conditionConfig.mode || 'VALUE_MATCH',
      conditionLogic: conditionConfig.logic || 'AND',
      conditions: conditionConfig.conditions?.length
        ? conditionConfig.conditions.map(item => ({
            field: item.field,
            op: item.op || 'EQ',
            value: normalizeConditionValue(item.op || 'EQ', item.value)
          }))
        : [{ field: null, op: 'EQ', value: null }],
      expression: conditionConfig.expression || null,
      separator: groupConfig.separator || '-',
      groupFields: groupConfig.fields?.length ? groupConfig.fields.map(item => ({ field: item.field })) : [{ field: null }]
    });
  }
  drawerVisible.value = true;
}

function addCondition() {
  form.conditions.push({ field: null, op: 'EQ', value: null });
}

function removeCondition(index: number) {
  form.conditions.splice(index, 1);
  if (!form.conditions.length) addCondition();
}

function addGroupField() {
  form.groupFields.push({ field: null });
}

function removeGroupField(index: number) {
  form.groupFields.splice(index, 1);
  if (!form.groupFields.length) addGroupField();
}

function handleWarehouseChange(values: string[]) {
  form.warehouseIds = values;
  form.warehouseNames = values
    .map(id => {
      const opt = warehouseOptions.value.find(item => item.value === id);
      return opt?.label ? String(opt.label) : id;
    })
    .join(', ');
}

async function handleSubmit() {
  if (!form.warehouseIds.length) return window.$message?.warning('请选择仓库');
  if (!form.ruleName.trim()) return window.$message?.warning('请输入规则名称');
  const groupFields = form.groupFields.filter(item => item.field).map(item => ({ field: item.field as string }));
  if (!groupFields.length) return window.$message?.warning('请至少配置一个分组键');
  const conditionConfig: Api.Oms.CargoGroupingRuleConditionConfig =
    form.conditionMode === 'EXPRESSION'
      ? { mode: 'EXPRESSION', expression: form.expression || '' }
      : {
          mode: 'VALUE_MATCH',
          logic: form.conditionLogic,
          conditions: form.conditions
            .filter(item => item.field)
            .map(item => ({
              field: item.field as string,
              op: item.op,
              value: normalizeConditionValue(item.op, item.value)
            }))
        };
  const payload: Api.Oms.CargoGroupingRuleOperateParams = {
    id: form.id,
    warehouseIds: JSON.stringify(form.warehouseIds),
    warehouseNames: form.warehouseNames,
    ruleName: form.ruleName,
    priority: form.priority,
    status: form.status,
    isDefault: form.isDefault,
    version: form.version,
    remark: form.remark,
    conditionConfig: JSON.stringify(conditionConfig),
    groupKeyConfig: JSON.stringify({ separator: form.separator || '-', fields: groupFields })
  };
  const api = form.id ? fetchUpdateCargoGroupingRule : fetchCreateCargoGroupingRule;
  const { error } = await api(payload);
  if (!error) {
    window.$message?.success(form.id ? '保存成功' : '新增成功');
    drawerVisible.value = false;
    getData();
  }
}

// ===================== test modal =====================

const testVisible = ref(false);
const testForm = reactive<Api.Oms.CargoGroupingRuleTestParams>({
  warehouseId: null as unknown as CommonType.IdType,
  cargoOrderId: null,
  shipmentId: null,
  orderContext: '',
  shipmentContext: ''
});
const testResult = ref<Api.Oms.CargoGroupingRuleTestResult | null>(null);

async function handleTest() {
  if (!testForm.warehouseId) return window.$message?.warning('请选择仓库');
  const { data: result, error } = await fetchTestCargoGroupingRule(testForm);
  if (!error) testResult.value = result || null;
}

async function loadOptions() {
  const [warehouseRes, fieldRes, businessTypeRes, channelRes, platformRes, platformAddressRes] = await Promise.all([
    fetchGetWarehouseList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetCargoGroupingFieldMetaList({}),
    fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetChannelList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformAddressList({ pageNum: 1, pageSize: 500, status: '0', params: {} })
  ]);
  warehouseOptions.value = (warehouseRes.data?.rows || []).map(item => ({ label: item.warehouseName, value: String(item.id) }));
  businessTypeOptions.value = (businessTypeRes.data?.rows || []).map(item => ({
    label: item.businessTypeName,
    value: item.businessTypeName
  }));
  channelOptions.value = (channelRes.data?.rows || []).map(item => ({
    label: item.channelName,
    value: String(item.id)
  }));
  platformOptions.value = (platformRes.data?.rows || []).map(item => ({
    label: `${item.nameEn}${item.code ? ` / ${item.code}` : ''}`,
    value: String(item.id)
  }));
  platformWarehouseOptions.value = (platformAddressRes.data?.rows || []).map(item => ({
    label: `${item.addressCode}${item.platformName ? ` / ${item.platformName}` : ''}${item.nameEn ? ` / ${item.nameEn}` : ''}`,
    value: item.addressCode
  }));
  fieldMetaList.value = fieldRes.data?.length ? fieldRes.data : DEFAULT_FIELD_META_LIST;
}

onMounted(async () => {
  await loadOptions();
  getData();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">分组规则配置</div>
          <div class="mt-4px text-12px text-#6b7280">按仓库配置货件层分组逻辑，出单、预约和后续规则引擎可复用同一套规则。</div>
        </div>
        <NSpace :size="8">
          <NButton quaternary @click="searchCollapsed = !searchCollapsed">
            {{ searchCollapsed ? '展开筛选' : '收起筛选' }}
          </NButton>
          <NButton v-if="hasRuleAuth('oms:cargoGroupingRule:test')" @click="testVisible = true">规则试算</NButton>
          <NButton v-if="hasRuleAuth('oms:cargoGroupingRule:add')" type="primary" @click="openDrawer()">新增规则</NButton>
          <NButton @click="handleReset">重置</NButton>
          <NButton type="primary" @click="handleSearch">查询</NButton>
        </NSpace>
      </div>
      <NForm v-show="!searchCollapsed" inline label-placement="left" :show-feedback="false" class="mt-14px">
        <NFormItem label="仓库">
          <NInput v-model:value="searchParams.warehouseName" clearable placeholder="请输入仓库名称" class="w-220px" />
        </NFormItem>
        <NFormItem label="规则名称">
          <NInput v-model:value="searchParams.ruleName" clearable placeholder="请输入规则名称" class="w-220px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.status"
            :options="statusOptions"
            clearable
            placeholder="请选择状态"
            class="w-160px"
          />
        </NFormItem>
      </NForm>
    </NCard>

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="font-medium">分组规则</div>
      </template>
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-add="false"
          :show-delete="false"
          :show-export="false"
          @refresh="getData"
        />
      </template>
      <div class="min-h-0 flex flex-1 flex-col overflow-hidden">
        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          :loading="loading"
          :pagination="mobilePagination"
          :row-key="(row: Api.Oms.CargoGroupingRule) => row.id"
          :scroll-x="scrollX"
          remote
          flex-height
          class="h-full min-h-0"
        />
      </div>
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="760">
      <NDrawerContent :title="form.id ? '编辑分组规则' : '新增分组规则'" closable>
        <NForm :model="form" label-placement="left" :label-width="110">
          <NDivider title-placement="left">基础信息</NDivider>
          <NFormItem label="规则适用仓库" required>
            <NSelect
              v-model:value="form.warehouseIds"
              :options="warehouseOptions"
              multiple
              clearable
              filterable
              :disabled="Boolean(form.isDefault)"
              placeholder="请选择仓库（可多选）"
              @update:value="handleWarehouseChange"
            />
            <template #feedback>
              <span class="text-12px text-#6b7280">
                分组规则按仓库隔离；内置规则的仓库不可修改，运营新增的规则可选择或调整仓库。
              </span>
            </template>
          </NFormItem>
          <NFormItem label="规则名称" required>
            <NInput
              v-model:value="form.ruleName"
              :disabled="Boolean(form.isDefault)"
              placeholder="请输入规则名称，例如：LA仓-Amazon平台仓分组"
            />
          </NFormItem>
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NFormItem label="优先级">
                <NInputNumber v-model:value="form.priority" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="状态">
                <NSelect v-model:value="form.status" :options="statusOptions" />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <NDivider title-placement="left">匹配条件</NDivider>
          <NFormItem label="匹配模式">
            <NRadioGroup v-model:value="form.conditionMode" :disabled="Boolean(form.isDefault)">
              <NSpace>
                <NRadio value="VALUE_MATCH">字段匹配</NRadio>
                <NRadio value="EXPRESSION">表达式</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
          <template v-if="form.conditionMode === 'VALUE_MATCH'">
            <NFormItem label="条件关系">
              <NRadioGroup v-model:value="form.conditionLogic" :disabled="Boolean(form.isDefault)">
                <NSpace>
                  <NRadio value="AND">全部满足</NRadio>
                  <NRadio value="OR">任一满足</NRadio>
                </NSpace>
              </NRadioGroup>
            </NFormItem>
            <NSpace vertical :size="8" class="mb-12px">
              <div v-for="(condition, index) in form.conditions" :key="index" class="flex items-center gap-8px">
                <NSelect
                  v-model:value="condition.field"
                  :options="conditionFieldOptions"
                  filterable
                  clearable
                  :disabled="Boolean(form.isDefault)"
                  placeholder="选择字段"
                  class="w-260px"
                  @update:value="value => handleConditionFieldChange(condition, value as string | null)"
                />
                <NSelect
                  v-model:value="condition.op"
                  :options="opOptions"
                  :disabled="Boolean(form.isDefault)"
                  class="w-120px"
                  @update:value="value => handleConditionOpChange(condition, value as string)"
                />
                <NSelect
                  v-if="conditionUsesSelect(condition.field) && !['IS_NULL', 'IS_NOT_NULL'].includes(condition.op)"
                  v-model:value="condition.value"
                  :options="conditionValueOptions(condition.field)"
                  :multiple="isMultiValueOp(condition.op)"
                  :tag="['order.platform_code', 'order.parcel_carrier_name'].includes(condition.field || '')"
                  filterable
                  clearable
                  :disabled="Boolean(form.isDefault)"
                  placeholder="请选择值"
                  class="flex-1"
                />
                <NInput
                  v-else
                  :value="Array.isArray(condition.value) ? condition.value.join(',') : condition.value"
                  :disabled="Boolean(form.isDefault) || ['IS_NULL', 'IS_NOT_NULL'].includes(condition.op)"
                  placeholder="值，多值用逗号分隔"
                  @update:value="value => (condition.value = value)"
                />
                <NButton quaternary type="error" :disabled="Boolean(form.isDefault)" @click="removeCondition(index)">删除</NButton>
              </div>
            </NSpace>
            <NButton size="small" secondary :disabled="Boolean(form.isDefault)" @click="addCondition">添加条件</NButton>
          </template>
          <NFormItem v-else label="表达式">
            <NInput
              v-model:value="form.expression"
              :disabled="Boolean(form.isDefault)"
              type="textarea"
              :rows="4"
              placeholder="示例：order.order_type == 'FBA头程' && order.address_type == '平台仓'"
            />
          </NFormItem>

          <NDivider title-placement="left">分组键</NDivider>
          <NFormItem label="连接符">
            <NInput v-model:value="form.separator" :disabled="Boolean(form.isDefault)" class="w-120px" />
          </NFormItem>
          <NSpace vertical :size="8" class="mb-12px">
            <div v-for="(item, index) in form.groupFields" :key="index" class="flex items-center gap-8px">
              <NSelect
                v-model:value="item.field"
                :options="groupKeyFieldOptions"
                filterable
                clearable
                :disabled="Boolean(form.isDefault)"
                placeholder="选择分组字段"
                class="w-360px"
              />
              <NButton quaternary type="error" :disabled="Boolean(form.isDefault)" @click="removeGroupField(index)">删除</NButton>
            </div>
          </NSpace>
          <NButton size="small" secondary :disabled="Boolean(form.isDefault)" @click="addGroupField">添加分组字段</NButton>

          <NDivider title-placement="left">备注</NDivider>
          <NInput v-model:value="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </NForm>
        <template #footer>
          <div class="flex justify-end gap-8px">
            <NButton @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="handleSubmit">保存</NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>

    <NModal v-model:show="testVisible" preset="card" title="规则试算" style="width: 780px; max-width: 96vw">
      <NForm :model="testForm" label-placement="left" :label-width="110">
        <NFormItem label="仓库" required>
          <NSelect v-model:value="testForm.warehouseId" :options="warehouseOptions" filterable clearable placeholder="请选择仓库" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem label="货物订单ID">
              <NInput v-model:value="(testForm as any).cargoOrderId" clearable placeholder="可选，填了则优先查库" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="货件ID">
              <NInput v-model:value="(testForm as any).shipmentId" clearable placeholder="可选，填了则优先查库" />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <NFormItem label="订单上下文">
          <NInput
            v-model:value="testForm.orderContext"
            type="textarea"
            :rows="4"
            placeholder='{"businessTypeName":"FBA头程","addressType":"平台仓","platformWarehouseCode":"ONT8"}'
          />
        </NFormItem>
        <NFormItem label="货件上下文">
          <NInput
            v-model:value="testForm.shipmentContext"
            type="textarea"
            :rows="3"
            placeholder='{"shipmentNo":"SHIP001","warehouseCode":"ONT8"}'
          />
        </NFormItem>
      </NForm>
      <NAlert v-if="testResult" class="mt-12px" :type="testResult.matched ? 'success' : 'warning'">
        <div class="font-medium">{{ testResult.message }}</div>
        <div class="mt-4px text-13px">
          规则：{{ testResult.ruleName || '--' }}；分组键：{{ testResult.groupKey || '--' }}
        </div>
      </NAlert>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="testVisible = false">关闭</NButton>
          <NButton type="primary" @click="handleTest">开始试算</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
