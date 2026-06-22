import { computed, nextTick, ref } from 'vue';
import {
  fetchCancelInboundPlan,
  fetchCompleteInboundPlan,
  fetchGetOrCreateInboundPlan,
  fetchPreviewApplyRuleInboundPlan,
  fetchPreviewAutoGroupInboundPlan,
  fetchSaveGroupInboundPlan,
  fetchStartWorkInboundPlan,
  fetchUpdateInboundPlanItem
} from '@/service/api/oms/inbound-plan';
import { fetchGetCargoGroupingRuleList } from '@/service/api/oms/cargo-grouping-rule';
import { useAuth } from '@/hooks/business/auth';

export function useInboundPlanCore(
  containerOrderId: () => CommonType.IdType | null | undefined,
  warehouseId: () => CommonType.IdType | null | undefined
) {
  const { hasAuth } = useAuth();

  const loading = ref(false);
  const actionLoading = ref(false);
  const plan = ref<Api.Oms.InboundPlan | null>(null);
  const groupingRules = ref<Api.Oms.CargoGroupingRule[]>([]);
  const pendingGroupChanges = ref<Map<string, string | null>>(new Map());
  const checkedRowKeys = ref<Array<string | number>>([]);

  const hasPendingChanges = computed(() => pendingGroupChanges.value.size > 0);
  const isEditable = computed(() => plan.value?.status === 'draft' || plan.value?.status === 'in_progress');
  const planStatus = computed(() => plan.value?.status ?? '');
  const flatItems = computed(() => plan.value?.groups.flatMap(g => g.items) ?? []);

  const pendingChangedCount = computed(() =>
    Array.from(pendingGroupChanges.value.entries()).filter(([itemId, code]) => {
      const item = flatItems.value.find(i => String(i.id) === itemId);
      return item && code !== item.groupCode;
    }).length
  );

  async function loadPlan() {
    const coId = containerOrderId();
    const whId = warehouseId();
    if (!coId || !whId) return;
    loading.value = true;
    const { data, error } = await fetchGetOrCreateInboundPlan(coId, whId);
    loading.value = false;
    if (!error && data) plan.value = data;
  }

  async function reloadDetail() {
    await loadPlan();
  }

  async function loadGroupingRules() {
    const whId = warehouseId();
    if (!whId) return;
    const { data, error } = await fetchGetCargoGroupingRuleList({ warehouseId: whId, status: 'enabled' });
    if (!error && data) groupingRules.value = data.rows ?? [];
  }

  async function handleAutoGroup() {
    if (!plan.value) return;
    actionLoading.value = true;
    const { data, error } = await fetchPreviewAutoGroupInboundPlan(plan.value.id);
    actionLoading.value = false;
    if (!error && data) {
      const newPending = new Map<string, string | null>();
      for (const item of data) newPending.set(String(item.itemId), item.proposedGroupCode);
      pendingGroupChanges.value = newPending;
      const changedCount = data.filter(d => d.changed).length;
      window.$message?.info(`已预览分组，${changedCount} 条有变化，确认后点击「保存分组」生效`);
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

  const editingItemId = ref<CommonType.IdType | null>(null);
  const editingField = ref<string | null>(null);
  const editingValue = ref('');

  function startEdit(item: Api.Oms.InboundPlanItem, field: string, initial?: string | null) {
    if (!isEditable.value) return;
    editingItemId.value = item.id;
    editingField.value = field;
    editingValue.value = initial ?? (item as any)[field] ?? '';
    nextTick(() => {
      const input = document.querySelector('.inbound-plan-cell-input input') as HTMLInputElement;
      input?.focus();
    });
  }

  async function saveItemField(item: Api.Oms.InboundPlanItem, field: string, value: string | null) {
    const params: Api.Oms.InboundPlanItemUpdateParams = { id: item.id, [field]: value } as any;
    const { error } = await fetchUpdateInboundPlanItem(params);
    if (!error) {
      (item as any)[field] = value;
      window.$message?.success('已保存');
    }
  }

  async function saveEdit(item: Api.Oms.InboundPlanItem) {
    if (editingItemId.value !== item.id || !editingField.value) return;
    const field = editingField.value;
    const val = editingValue.value.trim() || null;
    editingItemId.value = null;
    editingField.value = null;

    if (field === 'groupCode') {
      pendingGroupChanges.value.set(String(item.id), val);
      item.groupCode = val;
      return;
    }

    await saveItemField(item, field, val);
  }

  function cancelEdit() {
    editingItemId.value = null;
    editingField.value = null;
  }

  function patchItem(item: Api.Oms.InboundPlanItem, field: string, value: string | null) {
    (item as any)[field] = value;
    saveItemField(item, field, value);
  }

  function resetState() {
    plan.value = null;
    pendingGroupChanges.value = new Map();
    checkedRowKeys.value = [];
    cancelEdit();
  }

  return {
    hasAuth,
    loading,
    actionLoading,
    plan,
    groupingRules,
    pendingGroupChanges,
    checkedRowKeys,
    hasPendingChanges,
    isEditable,
    planStatus,
    flatItems,
    pendingChangedCount,
    loadPlan,
    reloadDetail,
    loadGroupingRules,
    handleAutoGroup,
    handleApplyRule,
    handleSaveGroup,
    handleDiscardPending,
    handleStartWork,
    handleComplete,
    handleCancel,
    editingItemId,
    editingField,
    editingValue,
    startEdit,
    saveEdit,
    cancelEdit,
    patchItem,
    resetState
  };
}
