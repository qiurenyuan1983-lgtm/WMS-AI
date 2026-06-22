import { computed, ref, watch, type Ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NTag } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import {
  fetchExecuteOrderWorkbenchAction,
  fetchGetOrderWorkbenchDetail
} from '@/service/api/oms/order-workbench';
import { buildLtlTripOrderNo } from '@/utils/oms/ltl-generate-trip-order';
import { STATUS_META } from '../../order-workbench/constants';
import { LTL_WORKFLOW_STEPS, type LtlOrderAction } from '../constants';

export function useLtlOrderDetail(orderId: Ref<CommonType.IdType | null | undefined>) {
  const { routerPushByKey } = useRouterPush();

  const loading = ref(false);
  const generateModalVisible = ref(false);
  const generatePreview = ref<Api.Oms.LtlGenerateTripPreview | null>(null);
  const actionLoading = ref(false);
  const detail = ref<Api.Oms.OrderWorkbenchDetail | null>(null);
  const orderMethod = ref<'API' | 'RPA' | 'MANUAL'>('API');
  const selectedSupplierId = ref<number | null>(null);

  const statusMeta = computed(() => {
    const s = detail.value?.status;
    return s ? STATUS_META[s] : null;
  });

  const ltl = computed(() => detail.value?.ltl ?? null);

  const selectedSupplierPortal = computed(() => {
    const id = selectedSupplierId.value;
    return ltl.value?.supplierCandidates?.find(c => c.supplierId === id)?.orderPortalUrl ?? null;
  });

  const workflowCurrent = computed(() => {
    const step = detail.value?.workflowStep ?? 1;
    return Math.max(0, Math.min(LTL_WORKFLOW_STEPS.length - 1, step - 1));
  });

  const supplierColumns: DataTableColumns<Api.Oms.LtlSupplierCandidate> = [
    {
      key: 'recommendTag',
      title: '推荐',
      width: 64,
      render: row =>
        row.recommendTag ? <NTag type="success" size="small">{row.recommendTag}</NTag> : '—'
    },
    { key: 'supplierName', title: '供应商', width: 130 },
    { key: 'serviceRating', title: '服务评分', width: 88, render: row => `${row.serviceRating}` },
    { key: 'onTimeRate', title: '准时率', width: 72, render: row => `${row.onTimeRate}%` },
    {
      key: 'quoteAmount',
      title: '报价(USD)',
      width: 100,
      align: 'right',
      render: row => `$${row.quoteAmount.toLocaleString()}`
    },
    { key: 'leadTimeDays', title: '时效', width: 72, render: row => `${row.leadTimeDays}天` },
    { key: 'serviceArea', title: '服务范围', width: 100, ellipsis: { tooltip: true } },
    {
      key: 'fees',
      title: '附加费',
      width: 140,
      render: row => `Liftgate $${row.liftgateFee} / 保险 $${row.insuranceFee}`
    },
    {
      key: 'totalAmount',
      title: '合计',
      width: 88,
      align: 'right',
      render: row => <span class="font-600">${row.totalAmount.toLocaleString()}</span>
    },
    {
      key: 'action',
      title: '操作',
      width: 80,
      fixed: 'right',
      render: row => (
        <NButton
          size="tiny"
          type={selectedSupplierId.value === row.supplierId ? 'primary' : 'default'}
          onClick={() => (selectedSupplierId.value = row.supplierId)}
        >
          选择
        </NButton>
      )
    }
  ];

  async function loadDetail() {
    const id = orderId.value;
    if (!id) {
      detail.value = null;
      return;
    }
    loading.value = true;
    try {
      const { data } = await fetchGetOrderWorkbenchDetail(id);
      detail.value = data ?? null;
      selectedSupplierId.value = data?.ltl?.selectedSupplierId ?? data?.ltl?.supplierCandidates?.[0]?.supplierId ?? null;
      orderMethod.value = data?.ltl?.orderMethod ?? 'API';
    } finally {
      loading.value = false;
    }
  }

  async function runAction(action: LtlOrderAction, extra?: Record<string, any>) {
    const id = orderId.value;
    if (!id) return;
    actionLoading.value = true;
    try {
      const { data } = await fetchExecuteOrderWorkbenchAction(id, action, extra);
      window.$message?.[data?.success ? 'success' : 'warning'](data?.message ?? '操作完成');
      if (data?.success) await loadDetail();
      return data?.success;
    } finally {
      actionLoading.value = false;
    }
  }

  async function handlePlaceOrder() {
    if (!selectedSupplierId.value) {
      window.$message?.warning('请先选择供应商');
      return;
    }
    const id = orderId.value;
    if (!id) return;
    actionLoading.value = true;
    try {
      const { data } = await fetchExecuteOrderWorkbenchAction(id, 'placeSupplierOrder', {
        orderMethod: orderMethod.value,
        selectedSupplierId: selectedSupplierId.value
      });
      if (data?.success) {
        window.$message?.[data.portalUrl || orderMethod.value !== 'MANUAL' ? 'success' : 'warning'](data.message ?? '操作完成');
        if (orderMethod.value === 'MANUAL' && data.portalUrl) {
          window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
        }
        await loadDetail();
      } else {
        window.$message?.warning(data?.message ?? '操作失败');
      }
    } finally {
      actionLoading.value = false;
    }
  }

  function showProtoInfo(msg: string) {
    window.$message?.info(msg);
  }

  function openGenerateOrderModal() {
    if (!detail.value) return;
    if (!detail.value.supplierName) {
      window.$message?.warning('请先匹配供应商并完成下单');
      return;
    }
    if (detail.value.generatedTripNo) {
      window.$message?.info(`已生成车次订单 ${detail.value.generatedTripNo}`);
      return;
    }
    const id = orderId.value;
    if (!id) return;
    generatePreview.value = {
      tripNo: buildLtlTripOrderNo(id),
      orderNo: detail.value.orderNo,
      supplierName: detail.value.supplierName,
      palletQty: detail.value.palletQty
    };
    generateModalVisible.value = true;
  }

  async function confirmGenerateOrder() {
    const id = orderId.value;
    if (!id) return;
    actionLoading.value = true;
    try {
      const { data } = await fetchExecuteOrderWorkbenchAction(id, 'generateOrder');
      if (data?.success) {
        window.$message?.success(data.message ?? '车次订单已生成');
        generateModalVisible.value = false;
        await loadDetail();
      } else {
        window.$message?.warning(data?.message ?? '生成失败');
      }
    } finally {
      actionLoading.value = false;
    }
  }

  function goTripOrderList() {
    generateModalVisible.value = false;
    routerPushByKey('oms_outbound-order' as any);
  }

  watch(
    orderId,
    id => {
      if (id) loadDetail();
      else detail.value = null;
    },
    { immediate: true }
  );

  return {
    loading,
    generateModalVisible,
    generatePreview,
    actionLoading,
    detail,
    orderMethod,
    selectedSupplierId,
    statusMeta,
    ltl,
    selectedSupplierPortal,
    workflowCurrent,
    supplierColumns,
    loadDetail,
    runAction,
    handlePlaceOrder,
    showProtoInfo,
    openGenerateOrderModal,
    confirmGenerateOrder,
    goTripOrderList,
    LTL_WORKFLOW_STEPS
  };
}
