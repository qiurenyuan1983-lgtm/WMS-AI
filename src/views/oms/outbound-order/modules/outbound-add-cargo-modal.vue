<script setup lang="tsx">
import { ref, watch } from 'vue';
import { NButton, NDataTable, NInput, NModal, NSpace } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchAddOutboundCargo, fetchGetOutboundAvailableOrders } from '@/service/api/oms/outbound-order';
import { displayAppointmentNo } from '@/utils/oms/appointment-no';

defineOptions({ name: 'OutboundAddCargoModal' });

const props = defineProps<{
  outboundOrderId: CommonType.IdType | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ (e: 'added'): void }>();

const keyword = ref('');
const checkedRowKeys = ref<number[]>([]);
const submitting = ref(false);
const searchParams = ref({ pageNum: 1, pageSize: 10, keyword: '' });

const { columns, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable<
  Api.Oms.OutboundAvailableOrderList,
  Api.Oms.OutboundAvailableOrder
>({
  api: () => {
    if (!props.outboundOrderId) return Promise.resolve({ data: null, error: null });
    return fetchGetOutboundAvailableOrders(props.outboundOrderId, searchParams.value);
  },
  columns: () => [
    { type: 'selection' },
    { key: 'cargoOrderNo', title: '运单号', minWidth: 140 },
    {
      key: 'appointmentNo',
      title: '预约号',
      width: 130,
      render: row => displayAppointmentNo(row.appointmentNo, { platformName: row.platformName }, '—')
    },
    { key: 'customerName', title: '客户', minWidth: 120, ellipsis: { tooltip: true } },
    { key: 'destination', title: '目的地', minWidth: 110, ellipsis: { tooltip: true } },
    {
      key: 'transferWarehouseCode',
      title: '转仓仓库',
      width: 100,
      render: row => row.transferWarehouseCode || '—'
    },
    {
      key: 'deliveryFee',
      title: '派送费用',
      width: 100,
      align: 'right',
      render: row => (row.deliveryFee != null ? `$${row.deliveryFee.toFixed(2)}` : '—')
    },
    { key: 'actualPalletQty', title: '板数', width: 72, align: 'center' },
    { key: 'actualCartonQty', title: '箱数', width: 72, align: 'center' }
  ],
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page ?? 1;
    searchParams.value.pageSize = pageSize ?? 10;
  }
});

watch(visible, val => {
  if (val && props.outboundOrderId) {
    keyword.value = '';
    checkedRowKeys.value = [];
    searchParams.value = { pageNum: 1, pageSize: 10, keyword: '' };
    getData();
  }
});

function handleSearch() {
  searchParams.value.keyword = keyword.value.trim();
  searchParams.value.pageNum = 1;
  getDataByPage(1);
}

async function handleConfirm() {
  if (!props.outboundOrderId || !checkedRowKeys.value.length) {
    window.$message?.warning('请选择要添加的订单');
    return;
  }
  submitting.value = true;
  try {
    const { data, error } = await fetchAddOutboundCargo(props.outboundOrderId, checkedRowKeys.value);
    if (error) return;
    window.$message?.success(data?.message ?? '添加成功');
    visible.value = false;
    emit('added');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="选择订单添加到车次"
    :to="POPUP_TO_BODY"
    :style="{ width: '980px' }"
    :mask-closable="false"
  >
    <NSpace vertical :size="12">
      <NSpace>
        <NInput
          v-model:value="keyword"
          placeholder="运单号/预约号/客户/目的地/转仓仓库"
          clearable
          class="w-280px"
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">搜索</NButton>
      </NSpace>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        remote
        size="small"
        :row-key="(row: Api.Oms.OutboundAvailableOrder) => row.id"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :scroll-x="960"
      />
    </NSpace>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="submitting" :disabled="!checkedRowKeys.length" @click="handleConfirm">
          确认添加 ({{ checkedRowKeys.length }})
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
