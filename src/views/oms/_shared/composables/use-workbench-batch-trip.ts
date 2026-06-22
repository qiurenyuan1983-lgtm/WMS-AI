import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { fetchBatchGenerateWorkbenchTrip } from '@/service/api/oms/order-workbench';
import { buildBatchTripOrderNo } from '@/utils/oms/ltl-generate-trip-order';

function isRowTripGenerated(row: Api.Oms.OrderWorkbenchRow) {
  return Boolean(row.generatedTripNo) || row.status === 'GENERATED';
}

export function useWorkbenchBatchTrip(pool: Api.Oms.OrderWorkbenchPool, onSuccess?: () => void) {
  const message = useMessage();
  const checkedRowKeys = ref<CommonType.IdType[]>([]);
  const selectedRowMap = ref(new Map<string, Api.Oms.OrderWorkbenchRow>());
  const modalVisible = ref(false);
  const submitting = ref(false);

  const selectionColumn = {
    type: 'selection' as const,
    fixed: 'left' as const,
    disabled: (row: Api.Oms.OrderWorkbenchRow) => isRowTripGenerated(row)
  };

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

  const preview = computed<Api.Oms.OrderWorkbenchBatchGenerateTripPreview | null>(() => {
    const rows = selectedRows.value;
    if (!rows.length) return null;
    const suppliers = [...new Set(rows.map(row => row.supplierName).filter(Boolean))];
    const destinations = [...new Set(rows.map(row => row.destination))];
    return {
      tripNo: buildBatchTripOrderNo(rows.map(row => row.id)),
      pool,
      orderNos: rows.map(row => row.orderNo),
      totalPalletQty: rows.reduce((sum, row) => sum + (row.palletQty || 0), 0),
      totalCartonQty: rows.reduce((sum, row) => sum + (row.cartonQty || 0), 0),
      destination: destinations.length === 1 ? destinations[0] : destinations.join(' / '),
      supplierName: pool === 'LTL' ? suppliers.join(' / ') || null : null,
      platform: pool === 'PLATFORM' ? rows[0]?.platform : null
    };
  });

  function openBatchModal() {
    if (!checkedRowKeys.value.length) {
      message.warning('请先勾选订单');
      return;
    }
    if (selectedRows.value.length < checkedRowKeys.value.length) {
      message.warning('部分选中订单未加载，请翻页确认后重试');
      return;
    }
    const rows = selectedRows.value;
    if (rows.some(row => isRowTripGenerated(row))) {
      message.warning('所选订单中包含已生成车次的订单');
      return;
    }
    if (pool === 'LTL' && rows.some(row => !row.supplierName)) {
      message.warning('请先为所有选中订单匹配供应商');
      return;
    }
    modalVisible.value = true;
  }

  async function confirmBatchGenerate() {
    submitting.value = true;
    const { data, error } = await fetchBatchGenerateWorkbenchTrip(checkedRowKeys.value);
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
    selectionColumn,
    syncSelectionFromPage,
    handleCheckedRowKeysChange,
    modalVisible,
    submitting,
    preview,
    openBatchModal,
    confirmBatchGenerate,
    selectedCount: computed(() => checkedRowKeys.value.length)
  };
}
