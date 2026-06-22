<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NSpace,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import { fetchGetPalletInventoryDetail, fetchPalletInventoryAction } from '@/service/api/wms/inventory';
import { PALLET_INSTRUCTION_TYPE_LABELS, PALLET_INVENTORY_STATUS_META } from '../constants';

const visible = defineModel<boolean>('show', { default: false });

const props = defineProps<{
  palletId: CommonType.IdType | null;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const loading = ref(false);
const actionLoading = ref(false);
const detail = ref<Api.Wms.PalletInventoryDetail | null>(null);

const actionOptions = [
  { label: '暂扣', key: 'hold' },
  { label: '放行', key: 'release' },
  { label: '锁定', key: 'lock' },
  { label: '解锁', key: 'unlock' },
  { type: 'divider', key: 'd1' },
  { label: '生成拣货指令', key: 'pick_instruction' },
  { label: '生成换标指令', key: 'relabel_instruction' },
  { label: '生成换箱指令', key: 'repack_instruction' },
  { type: 'divider', key: 'd2' },
  { label: '生成异常单', key: 'exception' },
  { label: '注销货物', key: 'void' },
  { label: '打印卡板标签', key: 'print_label' }
];

async function loadDetail() {
  if (!props.palletId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data } = await fetchGetPalletInventoryDetail(props.palletId);
  loading.value = false;
  detail.value = data ?? null;
}

watch([() => props.palletId, visible], () => {
  if (visible.value) loadDetail();
});

async function runAction(action: Api.Wms.PalletInventoryActionPayload['action']) {
  if (!props.palletId) return;
  actionLoading.value = true;
  const { data, error } = await fetchPalletInventoryAction({ palletId: props.palletId, action });
  actionLoading.value = false;
  if (error) return;
  const result = data as { success: boolean; message: string };
  window.$message?.[result?.success ? 'success' : 'warning'](result?.message || '操作完成');
  await loadDetail();
  emit('updated');
}

const cargoColumns = [
  { title: 'SKU', key: 'sku', width: 110 },
  { title: 'FNSKU', key: 'fnsku', width: 120 },
  { title: '箱数', key: 'boxQty', width: 70 },
  { title: 'PCS', key: 'pcs', width: 70 },
  { title: '单箱重量', key: 'unitWeight', width: 90 },
  { title: '单箱尺寸', key: 'unitSize', width: 110 },
  { title: '标签状态', key: 'labelStatus', width: 90 },
  { title: '包装状态', key: 'packStatus', width: 90 },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } }
];

const instructionColumns = [
  {
    title: '指令号',
    key: 'instructionNo',
    width: 130
  },
  {
    title: '指令类型',
    key: 'instructionType',
    width: 110,
    render: (row: Api.Wms.PalletInventoryInstruction) =>
      PALLET_INSTRUCTION_TYPE_LABELS[row.instructionType] || row.instructionType
  },
  { title: '状态', key: 'status', width: 90 },
  { title: '责任人', key: 'assignee', width: 90 },
  { title: '最晚完成', key: 'deadline', width: 150 }
];

const transactionColumns = [
  { title: '时间', key: 'time', width: 150 },
  { title: '操作类型', key: 'actionType', width: 100 },
  { title: '操作前', key: 'beforeValue', width: 90 },
  { title: '操作后', key: 'afterValue', width: 90 },
  { title: '操作人', key: 'operatorName', width: 90 },
  { title: '来源模块', key: 'sourceModule', width: 100 },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } }
];
</script>

<template>
  <NDrawer v-model:show="visible" :width="720" placement="right">
    <NDrawerContent :title="detail ? `卡板 ${detail.palletNo}` : '库存详情'" closable>
      <template #header-extra>
        <NDropdown
          :options="actionOptions"
          trigger="click"
          @select="key => runAction(key as Api.Wms.PalletInventoryActionPayload['action'])"
        >
          <NButton size="small" type="primary" :loading="actionLoading">操作</NButton>
        </NDropdown>
      </template>

      <div v-if="loading" class="drawer-loading">加载中…</div>
      <template v-else-if="detail">
        <NTabs type="line" size="small" default-value="basic">
          <NTabPane name="basic" tab="基础信息">
            <NDescriptions :column="2" label-placement="left" size="small" bordered>
              <NDescriptionsItem label="卡板号">{{ detail.palletNo }}</NDescriptionsItem>
              <NDescriptionsItem label="库存状态">
                <NTag size="small" :type="PALLET_INVENTORY_STATUS_META[detail.inventoryStatus].type">
                  {{ PALLET_INVENTORY_STATUS_META[detail.inventoryStatus].label }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
              <NDescriptionsItem label="平台">{{ detail.platformName }}</NDescriptionsItem>
              <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
              <NDescriptionsItem label="业务类型">{{ detail.businessTypeName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="仓库">{{ detail.warehouseName }}</NDescriptionsItem>
              <NDescriptionsItem label="当前库位">{{ detail.locationCode }}</NDescriptionsItem>
              <NDescriptionsItem label="箱数">{{ detail.boxQty }}</NDescriptionsItem>
              <NDescriptionsItem label="SKU数量">{{ detail.skuQty }}</NDescriptionsItem>
              <NDescriptionsItem label="卡板尺寸">
                {{ detail.lengthCm }}×{{ detail.widthCm }}×{{ detail.heightCm }} cm
              </NDescriptionsItem>
              <NDescriptionsItem label="重量">{{ detail.weight }} kg</NDescriptionsItem>
              <NDescriptionsItem label="是否异常">{{ detail.exceptionFlag ? '是' : '否' }}</NDescriptionsItem>
              <NDescriptionsItem label="入库时间">{{ detail.inboundTime }}</NDescriptionsItem>
              <NDescriptionsItem label="库龄">{{ detail.ageDays }} 天</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="order" tab="订单信息">
            <NDescriptions :column="2" label-placement="left" size="small" bordered>
              <NDescriptionsItem label="订单号">{{ detail.orderInfo.cargoOrderNo }}</NDescriptionsItem>
              <NDescriptionsItem label="客户订单号">{{ detail.orderInfo.customerOrderNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="入库单号">{{ detail.orderInfo.inboundOrderNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="出库单号">{{ detail.orderInfo.outboundOrderNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="车次号">{{ detail.orderInfo.tripNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="拆柜单号">{{ detail.orderInfo.devanningNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="柜号">{{ detail.orderInfo.containerNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="预约号/ISA">{{ detail.orderInfo.appointmentNo || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="Reference ID">{{ detail.orderInfo.referenceId || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="PO Number">{{ detail.orderInfo.poNumber || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="cargo" tab="货物明细">
            <NDataTable :columns="cargoColumns" :data="detail.cargoItems" size="small" :scroll-x="900" />
          </NTabPane>

          <NTabPane name="location" tab="库位信息">
            <NDescriptions :column="2" label-placement="left" size="small" bordered>
              <NDescriptionsItem label="当前仓库">{{ detail.locationInfo.warehouseName }}</NDescriptionsItem>
              <NDescriptionsItem label="当前库区">{{ detail.locationInfo.zoneName }}</NDescriptionsItem>
              <NDescriptionsItem label="当前库位">{{ detail.locationInfo.locationCode }}</NDescriptionsItem>
              <NDescriptionsItem label="库位类型">{{ detail.locationInfo.locationType }}</NDescriptionsItem>
              <NDescriptionsItem label="库位容量">{{ detail.locationInfo.capacity }} 板</NDescriptionsItem>
              <NDescriptionsItem label="高货值区">{{ detail.locationInfo.highValueZone ? '是' : '否' }}</NDescriptionsItem>
              <NDescriptionsItem label="暂扣区">{{ detail.locationInfo.holdZone ? '是' : '否' }}</NDescriptionsItem>
              <NDescriptionsItem label="待出库区">{{ detail.locationInfo.pendingOutboundZone ? '是' : '否' }}</NDescriptionsItem>
              <NDescriptionsItem label="上架时间">{{ detail.locationInfo.putawayTime || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="最后移动">{{ detail.locationInfo.lastMoveTime || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="instruction" tab="关联指令">
            <NDataTable :columns="instructionColumns" :data="detail.instructions" size="small" />
          </NTabPane>

          <NTabPane name="attach" tab="照片附件">
            <NSpace vertical>
              <div v-for="a in detail.attachments" :key="a.fileName" class="attach-row">
                <NTag size="small">{{ a.category }}</NTag>
                <span>{{ a.fileName }}</span>
                <span class="muted">{{ a.uploadTime }}</span>
              </div>
            </NSpace>
          </NTabPane>

          <NTabPane name="fee" tab="费用信息">
            <NSpace vertical>
              <div v-for="f in detail.fees" :key="f.feeType" class="fee-row">
                {{ f.feeType }}：{{ f.currency }} {{ f.amount.toFixed(2) }}（{{ f.status }}）
              </div>
            </NSpace>
          </NTabPane>

          <NTabPane name="log" tab="库存流水">
            <NDataTable :columns="transactionColumns" :data="detail.transactions" size="small" :scroll-x="800" />
          </NTabPane>
        </NTabs>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.drawer-loading {
  padding: 24px;
  text-align: center;
}
.attach-row,
.fee-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.muted {
  color: var(--n-text-color-3);
  font-size: 12px;
}
</style>
