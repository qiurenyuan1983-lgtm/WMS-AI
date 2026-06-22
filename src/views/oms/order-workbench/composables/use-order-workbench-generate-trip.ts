import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { fetchBatchGenerateWorkbenchTrip } from '@/service/api/oms/order-workbench';
import { validateWorkbenchGenerateTrip } from '@/utils/oms/order-workbench-rules';

const LBS_TO_KG = 0.453592;

function isRowTripGenerated(row: Api.Oms.OrderWorkbenchRow) {
  return Boolean(row.generatedTripNo) || row.status === 'GENERATED';
}

function rowWeightKg(row: Api.Oms.OrderWorkbenchRow) {
  const lbs = Number(row.weightLbs || 0);
  if (lbs > 0) return lbs * LBS_TO_KG;
  return Number(row.palletQty || 0) * 450;
}

export function useOrderWorkbenchGenerateTrip(onSuccess?: () => void) {
  const message = useMessage();
  const checkedRowKeys = ref<CommonType.IdType[]>([]);
  const selectedRowMap = ref(new Map<string, Api.Oms.OrderWorkbenchRow>());
  const modalVisible = ref(false);
  const submitting = ref(false);

  function syncSelectionFromPage(rows: Api.Oms.OrderWorkbenchRow[]) {
    rows.forEach(row => {
      const id = String(row.id);
      if (checkedRowKeys.value.map(String).includes(id)) {
        selectedRowMap.value.set(id, row);
      }
    });
  }

  function handleCheckedRowKeysChange(keys: CommonType.IdType[], pageRows: Api.Oms.OrderWorkbenchRow[]) {
    checkedRowKeys.value = keys;
    const keySet = new Set(keys.map(String));
    pageRows.forEach(row => {
      const id = String(row.id);
      if (keySet.has(id)) selectedRowMap.value.set(id, row);
      else selectedRowMap.value.delete(id);
    });
  }

  const selectedRows = computed(() =>
    checkedRowKeys.value
      .map(id => selectedRowMap.value.get(String(id)))
      .filter((row): row is Api.Oms.OrderWorkbenchRow => Boolean(row))
  );

  const selectionTotals = computed(() =>
    selectedRows.value.reduce(
      (total, row) => {
        total.weightKg += rowWeightKg(row);
        total.cbm += Number(row.volumeCbm || 0);
        total.palletQty += Number(row.palletQty || 0);
        return total;
      },
      { weightKg: 0, cbm: 0, palletQty: 0 }
    )
  );

  const formattedTotals = computed(() => ({
    weightKg: selectionTotals.value.weightKg.toFixed(1),
    cbm: selectionTotals.value.cbm.toFixed(2),
    palletQty: selectionTotals.value.palletQty
  }));

  function openGenerateModal() {
    if (!checkedRowKeys.value.length) {
      message.warning('请先勾选订单');
      return;
    }
    if (selectedRows.value.length < checkedRowKeys.value.length) {
      message.warning('部分选中订单未加载，请翻页确认后重试');
      return;
    }
    const rows = selectedRows.value;
    const validation = validateWorkbenchGenerateTrip(rows);
    if (!validation.ok) {
      message.warning(validation.message || '无法生成车次');
      return;
    }
    modalVisible.value = true;
  }

  async function confirmGenerate(payload?: Api.Oms.OrderWorkbenchBatchGenerateTripParams) {
    submitting.value = true;
    const { data, error } = await fetchBatchGenerateWorkbenchTrip(checkedRowKeys.value, payload);
    submitting.value = false;
    if (error || !data?.success) {
      message.error(data?.message || '生成车次失败');
      return;
    }
    message.success(data.message);
    modalVisible.value = false;
    checkedRowKeys.value = [];
    selectedRowMap.value.clear();
    onSuccess?.();
  }

  return {
    checkedRowKeys,
    selectedRows,
    selectionTotals: formattedTotals,
    selectedCount: computed(() => checkedRowKeys.value.length),
    modalVisible,
    submitting,
    syncSelectionFromPage,
    handleCheckedRowKeysChange,
    openGenerateModal,
    confirmGenerate,
    isRowTripGenerated
  };
}
