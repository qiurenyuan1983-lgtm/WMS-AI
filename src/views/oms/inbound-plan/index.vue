<script setup lang="tsx">
import { computed, nextTick, onActivated, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NInput,
  NPopconfirm,
  NSpin,
  NTag,
  NText
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import {
  fetchPreviewAutoGroupInboundPlan,
  fetchPreviewApplyRuleInboundPlan,
  fetchSaveGroupInboundPlan,
  fetchCancelInboundPlan,
  fetchCompleteInboundPlan,
  fetchGetOrCreateInboundPlan,
  fetchStartWorkInboundPlan,
  fetchUpdateInboundPlanItem
} from '@/service/api/oms/inbound-plan';
import { fetchGetCargoGroupingRuleList } from '@/service/api/oms/cargo-grouping-rule';

defineOptions({ name: 'OmsInboundPlan' });

const route = useRoute();
const router = useRouter();
const { hasAuth } = useAuth();
const { record: addressTypeRecord } = useDict('oms_address_type');

const containerOrderId = computed(() => route.query.containerOrderId as string);
const warehouseId = computed(() => route.query.warehouseId as string);

const loading = ref(false);
const actionLoading = ref(false);
const plan = ref<Api.Oms.InboundPlan | null>(null);
const groupingRules = ref<Api.Oms.CargoGroupingRule[]>([]);

// 待保存的分组变更: itemId(string) → proposedGroupCode（预览阶段不写库）
const pendingGroupChanges = ref<Map<string, string | null>>(new Map());
const hasPendingChanges = computed(() => pendingGroupChanges.value.size > 0);
const pendingChangedCount = computed(() =>
  Array.from(pendingGroupChanges.value.entries()).filter(
    ([itemId, code]) => {
      const item = plan.value?.groups.flatMap(g => g.items).find(i => String(i.id) === itemId);
      return item && code !== item.groupCode;
    }
  ).length
);

// 分组展开状态
const expandedGroups = ref<Set<string>>(new Set());

// 单元格内联编辑状态
const editingItemId = ref<CommonType.IdType | null>(null);
const editingField = ref<'groupCode' | 'preLocation' | null>(null);
const editingValue = ref('');

async function loadPlan() {
  if (!containerOrderId.value || !warehouseId.value) return;
  loading.value = true;
  const { data, error } = await fetchGetOrCreateInboundPlan(containerOrderId.value, warehouseId.value);
  loading.value = false;
  if (!error && data) {
    plan.value = data;
    // 默认展开所有分组
    expandedGroups.value = new Set(data.groups.map(g => g.groupCode ?? '__UNGROUPED__'));
  }
}

async function reloadDetail() {
  if (!plan.value) return;
  const { data, error } = await fetchGetOrCreateInboundPlan(containerOrderId.value, warehouseId.value);
  if (!error && data) {
    plan.value = data;
  }
}

async function loadGroupingRules() {
  if (!warehouseId.value) return;
  const { data, error } = await fetchGetCargoGroupingRuleList({ warehouseId: warehouseId.value, status: 'enabled' });
  if (!error && data) {
    groupingRules.value = data.rows ?? [];
  }
}

onMounted(() => {
  loadPlan();
  loadGroupingRules();
});

// keepAlive tab 重新激活时刷新
onActivated(() => {
  loadPlan();
  loadGroupingRules();
});

// 同一 tab 内切换不同海柜时重新加载
watch(containerOrderId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    plan.value = null;
    loadPlan();
    loadGroupingRules();
  }
});

function toggleGroup(key: string) {
  const next = new Set(expandedGroups.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expandedGroups.value = next;
}

// ===================== 业务动作 =====================

async function handleAutoGroup() {
  if (!plan.value) return;
  actionLoading.value = true;
  const { data, error } = await fetchPreviewAutoGroupInboundPlan(plan.value.id);
  actionLoading.value = false;
  if (!error && data) {
    const newPending = new Map<string, string | null>();
    for (const item of data) {
      newPending.set(String(item.itemId), item.proposedGroupCode);
    }
    pendingGroupChanges.value = newPending;
    const changedCount = data.filter(d => d.changed).length;
    window.$message?.info(`已预算分组，${changedCount} 条有变化，确认后点击「保存分组」生效`);
  }
}

async function handleApplyRule(ruleId: CommonType.IdType, ruleName: string) {
  if (!plan.value) return;
  actionLoading.value = true;
  const { data, error } = await fetchPreviewApplyRuleInboundPlan(plan.value.id, ruleId);
  actionLoading.value = false;
  if (!error && data) {
    const newPending = new Map(pendingGroupChanges.value);
    let hitCount = 0;
    for (const item of data) {
      if (item.proposedGroupCode !== null) {
        newPending.set(String(item.itemId), item.proposedGroupCode);
        if (item.changed) hitCount++;
      }
    }
    pendingGroupChanges.value = newPending;
    window.$message?.info(`规则「${ruleName}」命中 ${hitCount} 条，确认后点击「保存分组」生效`);
  }
}

async function handleSaveGroup() {
  if (!plan.value || !hasPendingChanges.value) return;
  actionLoading.value = true;
  const changes: Api.Oms.InboundPlanSaveGroupParams[] = Array.from(pendingGroupChanges.value.entries()).map(
    ([itemId, groupCode]) => ({ itemId, groupCode })
  );
  const { error } = await fetchSaveGroupInboundPlan(plan.value.id, changes);
  actionLoading.value = false;
  if (!error) {
    pendingGroupChanges.value = new Map();
    window.$message?.success('分组已保存');
    reloadDetail();
  }
}

function handleDiscardPending() {
  pendingGroupChanges.value = new Map();
  window.$message?.info('已撤销未保存的分组变更');
}

async function handleStartWork() {
  if (!plan.value) return;
  actionLoading.value = true;
  const { error } = await fetchStartWorkInboundPlan(plan.value.id);
  actionLoading.value = false;
  if (!error) {
    window.$message?.success('已开始作业');
    reloadDetail();
  }
}

async function handleComplete() {
  if (!plan.value) return;
  actionLoading.value = true;
  const { error } = await fetchCompleteInboundPlan(plan.value.id);
  actionLoading.value = false;
  if (!error) {
    window.$message?.success('计划已完结');
    reloadDetail();
  }
}

async function handleCancel() {
  if (!plan.value) return;
  actionLoading.value = true;
  const { error } = await fetchCancelInboundPlan(plan.value.id);
  actionLoading.value = false;
  if (!error) {
    window.$message?.success('计划已取消');
    reloadDetail();
  }
}

// ===================== 内联编辑 =====================

function startEdit(item: Api.Oms.InboundPlanItem, field: 'groupCode' | 'preLocation') {
  if (!isEditable.value) return;
  editingItemId.value = item.id;
  editingField.value = field;
  if (field === 'groupCode' && pendingGroupChanges.value.has(String(item.id))) {
    editingValue.value = pendingGroupChanges.value.get(String(item.id)) ?? '';
  } else {
    editingValue.value = (field === 'groupCode' ? item.groupCode : item.preLocation) ?? '';
  }
  nextTick(() => {
    const input = document.querySelector('.cell-editing-input input') as HTMLInputElement;
    input?.focus();
  });
}

async function saveEdit(item: Api.Oms.InboundPlanItem) {
  if (editingItemId.value !== item.id || !editingField.value) return;
  const field = editingField.value;
  const val = editingValue.value.trim() || null;

  editingItemId.value = null;
  editingField.value = null;

  if (field === 'groupCode') {
    // groupCode 编辑统一进入 pending，不直接写库
    const newPending = new Map(pendingGroupChanges.value);
    newPending.set(String(item.id), val);
    pendingGroupChanges.value = newPending;
    return;
  }

  // preLocation 仍然直接写库
  const originalVal = item.preLocation;
  if (val === originalVal) return;
  const params: Api.Oms.InboundPlanItemUpdateParams = { id: item.id, preLocation: val };
  const { error } = await fetchUpdateInboundPlanItem(params);
  if (!error) {
    item.preLocation = val;
  }
}

function cancelEdit() {
  editingItemId.value = null;
  editingField.value = null;
}

// ===================== 计算属性 =====================

const planStatus = computed(() => plan.value?.status ?? '');

const isEditable = computed(() =>
  planStatus.value === 'draft' || planStatus.value === 'in_progress'
);

const statusTag = computed(() => {
  const map: Record<string, { type: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
    draft: { type: 'default', label: '草稿' },
    in_progress: { type: 'info', label: '作业中' },
    completed: { type: 'success', label: '已完结' },
    cancelled: { type: 'default', label: '已取消' }
  };
  return map[planStatus.value] ?? { type: 'default', label: planStatus.value };
});

// ===================== 表格列定义 =====================

function buildItemColumns(): DataTableColumns<Api.Oms.InboundPlanItem> {
  return [
    {
      key: 'groupCode',
      title: '分组',
      width: 160,
      render: (row) => {
        const isEditing = editingItemId.value === row.id && editingField.value === 'groupCode';
        if (isEditing) {
          return (
            <NInput
              class="cell-editing-input"
              size="small"
              value={editingValue.value}
              onUpdateValue={(v: string) => { editingValue.value = v; }}
              onBlur={() => saveEdit(row)}
              onKeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') saveEdit(row);
                if (e.key === 'Escape') cancelEdit();
              }}
            />
          );
        }
        const hasPending = pendingGroupChanges.value.has(String(row.id));
        const pendingCode = pendingGroupChanges.value.get(String(row.id));
        const displayCode = hasPending ? pendingCode : row.groupCode;
        const isPending = hasPending && pendingCode !== row.groupCode;
        return (
          <div
            class={[
              isEditable.value ? 'cursor-pointer hover:bg-primary-100 px-1 rounded min-h-24px' : 'px-1',
              isPending ? 'bg-yellow-50 border border-yellow-300 rounded' : ''
            ].join(' ')}
            onClick={() => startEdit(row, 'groupCode')}
          >
            {isPending ? (
              <span>
                <span style="color: #d97706; font-weight: 500;">{displayCode ?? '—'}</span>
                <span style="font-size: 10px; color: #d97706; margin-left: 4px;">待保存</span>
              </span>
            ) : (
              <NText>{displayCode ?? <span class="text-gray-400">—</span>}</NText>
            )}
          </div>
        );
      }
    },
    {
      key: 'preLocation',
      title: '系统预库位',
      width: 120,
      render: (row) => {
        const isEditing = editingItemId.value === row.id && editingField.value === 'preLocation';
        if (isEditing) {
          return (
            <NInput
              class="cell-editing-input"
              size="small"
              value={editingValue.value}
              onUpdateValue={(v: string) => { editingValue.value = v; }}
              onBlur={() => saveEdit(row)}
              onKeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') saveEdit(row);
                if (e.key === 'Escape') cancelEdit();
              }}
            />
          );
        }
        return (
          <div
            class={isEditable.value ? 'cursor-pointer hover:bg-primary-100 px-1 rounded min-h-24px' : ''}
            onClick={() => startEdit(row, 'preLocation')}
          >
            <NText>{row.preLocation ?? <span class="text-gray-400">—</span>}</NText>
          </div>
        );
      }
    },
    {
      key: 'cargoOrderNo',
      title: '货物订单号',
      width: 160,
      ellipsis: { tooltip: true }
    },
    {
      key: 'shipmentNo',
      title: '货件编码',
      width: 150,
      ellipsis: { tooltip: true }
    },
    {
      key: 'poNo',
      title: 'PO号',
      width: 130,
      ellipsis: { tooltip: true }
    },
    {
      key: 'shippingMark',
      title: '唛头',
      width: 100,
      ellipsis: { tooltip: true }
    },
    {
      key: 'platformName',
      title: '平台',
      width: 100,
      ellipsis: { tooltip: true }
    },
    {
      key: 'platformWarehouseCode',
      title: '仓库代码',
      width: 100
    },
    {
      key: 'addressType',
      title: '地址类型',
      width: 100,
      render: (row: any) => addressTypeRecord.value[row.addressType]?.dictLabel ?? row.addressType ?? '--'
    },
    {
      key: 'businessTypeName',
      title: '业务类型',
      width: 100,
      ellipsis: { tooltip: true }
    },
    {
      key: 'orderStatus',
      title: '订单状态',
      width: 100,
      render: (row) => row.orderStatus ? <NTag size="small">{row.orderStatus}</NTag> : null
    },
    {
      key: 'cartonQty',
      title: '数量(箱)',
      width: 90,
      align: 'right'
    },
    {
      key: 'weight',
      title: '重量(kg)',
      width: 90,
      align: 'right'
    },
    {
      key: 'cbm',
      title: '体积(cbm)',
      width: 95,
      align: 'right'
    }
  ];
}

const itemColumns = buildItemColumns();
</script>

<template>
  <div class="h-full flex-col-stretch gap-12px overflow-auto p-16px">
    <!-- 顶部返回栏 -->
    <div class="flex items-center gap-8px">
      <NButton quaternary size="small" @click="router.back()">← 返回</NButton>
      <span class="text-16px font-medium text-gray-700">入库计划</span>
      <NTag v-if="plan" :type="statusTag.type" size="small" class="ml-4px">{{ statusTag.label }}</NTag>
      <span v-if="plan" class="ml-8px text-13px text-gray-500">{{ plan.planNo }}</span>
    </div>

    <NSpin :show="loading">
      <template v-if="plan">
        <!-- 海柜信息卡片 -->
        <NCard size="small" :bordered="false" class="card-wrapper">
          <NDescriptions :column="6" size="small" label-placement="left">
            <NDescriptionsItem label="海柜订单">{{ plan.containerOrderNo ?? '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="渠道">{{ plan.channelName ?? '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="客户">{{ plan.customerName ?? '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="ETA">{{ plan.eta ?? '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="总CBM">{{ plan.totalCbm ?? '—' }}</NDescriptionsItem>
            <NDescriptionsItem label="总箱数">{{ plan.totalCartonQty ?? '—' }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- 操作栏 -->
        <NCard size="small" :bordered="false" class="card-wrapper">
          <div class="flex flex-wrap items-center gap-8px">
            <!-- 主业务动作 -->
            <template v-if="hasAuth('wms:inboundPlan:autoGroup')">
              <NButton
                type="primary"
                :loading="actionLoading"
                :disabled="!isEditable"
                @click="handleAutoGroup"
              >
                自动分组
              </NButton>
            </template>

            <!-- 快速配置：按分组规则平铺 -->
            <template v-if="hasAuth('wms:inboundPlan:applyRule') && groupingRules.length > 0">
              <div class="flex flex-wrap items-center gap-6px">
                <span class="text-13px text-gray-500">快速配置：</span>
                <NButton
                  v-for="rule in groupingRules"
                  :key="String(rule.id)"
                  size="small"
                  secondary
                  :disabled="!isEditable || actionLoading"
                  @click="handleApplyRule(rule.id, rule.ruleName)"
                >
                  {{ rule.ruleName }}
                </NButton>
              </div>
            </template>

            <!-- 待保存提示 + 保存/撤销按钮 -->
            <template v-if="hasPendingChanges">
              <div class="flex items-center gap-8px rounded border border-yellow-300 bg-yellow-50 px-12px py-4px">
                <span class="text-13px text-yellow-700">{{ pendingChangedCount }} 条分组待保存</span>
                <NButton
                  type="warning"
                  size="small"
                  :loading="actionLoading"
                  @click="handleSaveGroup"
                >
                  保存分组
                </NButton>
                <NButton size="small" quaternary @click="handleDiscardPending">撤销</NButton>
              </div>
            </template>

            <div class="ml-auto flex gap-8px">
              <!-- 状态流转按钮 -->
              <template v-if="hasAuth('wms:inboundPlan:startWork') && plan.status === 'draft'">
                <NPopconfirm @positive-click="handleStartWork">
                  <template #default>确认开始作业？开始后仍可继续编辑分组。</template>
                  <template #trigger>
                    <NButton type="primary" ghost :loading="actionLoading">开始作业</NButton>
                  </template>
                </NPopconfirm>
              </template>

              <template v-if="hasAuth('wms:inboundPlan:complete') && plan.status === 'in_progress'">
                <NPopconfirm @positive-click="handleComplete">
                  <template #default>确认完结计划？完结后不可再修改分组。</template>
                  <template #trigger>
                    <NButton type="success" ghost :loading="actionLoading">完结计划</NButton>
                  </template>
                </NPopconfirm>
              </template>

              <template v-if="hasAuth('wms:inboundPlan:cancel') && (plan.status === 'draft' || plan.status === 'in_progress')">
                <NPopconfirm @positive-click="handleCancel">
                  <template #default>确认取消该入库计划？</template>
                  <template #trigger>
                    <NButton type="error" ghost :loading="actionLoading">取消计划</NButton>
                  </template>
                </NPopconfirm>
              </template>
            </div>
          </div>
        </NCard>

        <!-- 分组明细区域 -->
        <div class="flex flex-col gap-8px">
          <template v-if="plan.groups.length === 0">
            <NCard :bordered="false" class="card-wrapper">
              <NEmpty description="暂无明细数据" />
            </NCard>
          </template>

          <template v-for="group in plan.groups" :key="group.groupCode ?? '__UNGROUPED__'">
            <NCard size="small" :bordered="false" class="card-wrapper overflow-hidden p-0">
              <!-- 分组表头行 -->
              <div
                class="flex cursor-pointer items-center gap-16px bg-gray-50 px-16px py-10px hover:bg-gray-100"
                @click="toggleGroup(group.groupCode ?? '__UNGROUPED__')"
              >
                <span
                  class="text-gray-500 transition-transform inline-block"
                  :style="expandedGroups.has(group.groupCode ?? '__UNGROUPED__') ? 'transform:rotate(0deg)' : 'transform:rotate(-90deg)'"
                >▼</span>
                <span class="min-w-120px text-15px font-semibold">
                  {{ group.groupCode ?? '未分组' }}
                </span>
                <div class="flex flex-wrap gap-16px text-13px text-gray-600">
                  <span>{{ group.itemCount }} 票</span>
                  <span>{{ group.totalCartonQty ?? 0 }} 箱</span>
                  <span>{{ group.totalWeight ?? 0 }} kg</span>
                  <span>{{ group.totalCbm ?? 0 }} CBM</span>
                  <span v-if="group.expectedPalletQty != null" class="text-primary font-medium">
                    预计 {{ group.expectedPalletQty }} 板
                  </span>
                  <span v-else class="text-gray-400">预计打板数待算</span>
                </div>
              </div>

              <!-- 分组明细表格 -->
              <div v-show="expandedGroups.has(group.groupCode ?? '__UNGROUPED__')" class="px-0">
                <NDataTable
                  :columns="itemColumns"
                  :data="group.items"
                  :row-key="(row: Api.Oms.InboundPlanItem) => String(row.id)"
                  size="small"
                  :bordered="false"
                  :single-line="false"
                  scroll-x="1500"
                />
              </div>
            </NCard>
          </template>
        </div>
      </template>

      <template v-else-if="!loading">
        <NCard :bordered="false" class="card-wrapper">
          <NEmpty description="暂无入库计划数据" />
        </NCard>
      </template>
    </NSpin>
  </div>
</template>
