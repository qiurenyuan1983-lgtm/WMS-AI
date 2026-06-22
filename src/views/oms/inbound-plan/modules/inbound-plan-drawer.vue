<script setup lang="tsx">
import { computed, watch } from 'vue';
import {
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NEmpty,
  NInput,
  NSelect,
  NSpin,
  NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { useDict } from '@/hooks/business/dict';
import { useInboundPlanCore } from '../composables/use-inbound-plan-core';

defineOptions({ name: 'InboundPlanDrawer' });

const props = defineProps<{
  containerOrderId?: CommonType.IdType | null;
  warehouseId?: CommonType.IdType | null;
  containerNo?: string | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const { record: addressTypeRecord } = useDict('oms_address_type');
const { record: outboundStatusRecord } = useDict('oms_inbound_outbound_status');

const containerOrderIdRef = () => props.containerOrderId;
const warehouseIdRef = () => props.warehouseId;

const core = useInboundPlanCore(containerOrderIdRef, warehouseIdRef);

const {
  loading, plan, checkedRowKeys, isEditable, flatItems,
  loadPlan, resetState,
  editingItemId, editingField, editingValue, startEdit, saveEdit, cancelEdit, patchItem
} = core;

const DESC_PROPS = {
  labelPlacement: 'left' as const,
  size: 'small' as const,
  column: 2,
  labelStyle: { width: '108px', color: '#6b7280' }
};

function text(v: unknown) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

const displayContainerNo = computed(() =>
  props.containerNo || plan.value?.containerNo || plan.value?.containerOrderNo || '—'
);

const PLATFORM_OPTIONS = [
  { label: '亚马逊 (AMZ)', value: 'Amazon' },
  { label: '沃尔玛 (WMT)', value: 'Walmart' },
  { label: 'Wayfair', value: 'Wayfair' },
  { label: 'Target', value: 'Target' }
];

const DELIVERY_OPTIONS = [
  { label: 'LTL', value: 'LTL' },
  { label: 'FTL', value: 'FTL' },
  { label: 'Parcel', value: 'Parcel' },
  { label: '整送', value: '整送' },
  { label: '卡派', value: '卡派' }
];

const addressTypeOptions = computed(() =>
  Object.entries(addressTypeRecord.value).map(([value, item]) => ({
    label: item.dictLabel,
    value
  }))
);

function renderEditableInput(row: Api.Oms.InboundPlanItem, field: string, width = '100%') {
  const isEditing = editingItemId.value === row.id && editingField.value === field;
  if (isEditing) {
    return (
      <NInput
        class="inbound-plan-cell-input"
        size="small"
        style={{ width }}
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
  const val = (row as any)[field];
  return (
    <div
      class={isEditable.value ? 'cursor-pointer hover:bg-primary-50 px-4px rounded min-h-24px' : ''}
      onDblclick={() => startEdit(row, field, val)}
    >
      {val || <span class="text-gray-400">—</span>}
    </div>
  );
}

function buildColumns(): DataTableColumns<Api.Oms.InboundPlanItem> {
  return [
    { type: 'selection' },
    {
      key: 'preLocation',
      title: '系统预库位',
      width: 130,
      render: row => (
        row.preLocation
          ? <span>{row.preLocation}</span>
          : <span class="text-gray-400 text-12px">由系统生成，无需手填</span>
      )
    },
    {
      key: 'palletQty',
      title: '预计打板数',
      width: 100,
      align: 'center',
      render: row => row.palletQty ?? '—'
    },
    {
      key: 'outboundStatus',
      title: '出库状态',
      width: 96,
      render: row => {
        const code = (row as any).outboundStatus || 'NOT_OUTBOUND';
        const meta = outboundStatusRecord.value[code];
        return (
          <NTag size="small" type={(meta?.listClass as NaiveUI.ThemeColor) || 'default'}>
            {meta?.dictLabel || code}
          </NTag>
        );
      }
    },
    {
      key: 'cargoOrderNo',
      title: '订单号',
      width: 150,
      ellipsis: { tooltip: true }
    },
    {
      key: 'shipmentNo',
      title: '货件编码',
      width: 140,
      ellipsis: { tooltip: true }
    },
    {
      key: 'platformName',
      title: '平台',
      width: 150,
      render: row => (
        <NSelect
          to={POPUP_TO_BODY}
          size="small"
          value={row.platformName}
          options={PLATFORM_OPTIONS}
          disabled={!isEditable.value}
          clearable
          onUpdateValue={(v: string | null) => patchItem(row, 'platformName', v)}
        />
      )
    },
    {
      key: 'platformWarehouseCode',
      title: '仓库代码',
      width: 110,
      render: row => renderEditableInput(row, 'platformWarehouseCode', '96px')
    },
    {
      key: 'addressType',
      title: '地址类型',
      width: 110,
      render: row => (
        <NSelect
          to={POPUP_TO_BODY}
          size="small"
          value={row.addressType}
          options={addressTypeOptions.value}
          disabled={!isEditable.value}
          clearable
          onUpdateValue={(v: string | null) => patchItem(row, 'addressType', v)}
        />
      )
    },
    {
      key: 'deliveryMethod',
      title: '派送方式',
      width: 110,
      render: row => (
        <NSelect
          to={POPUP_TO_BODY}
          size="small"
          value={(row as any).deliveryMethod || row.businessTypeName}
          options={DELIVERY_OPTIONS}
          disabled={!isEditable.value}
          clearable
          onUpdateValue={(v: string | null) => patchItem(row, 'deliveryMethod', v)}
        />
      )
    },
    {
      key: 'holdFlag',
      title: 'HOLD',
      width: 72,
      align: 'center',
      render: row => renderEditableInput(row, 'holdFlag', '56px')
    },
    {
      key: 'actions',
      title: '操作',
      width: 80,
      fixed: 'right',
      render: () => (
        <NDropdown
          trigger="click"
          options={[
            { label: '查看订单', key: 'view' },
            { label: '移除行', key: 'remove' }
          ]}
          onSelect={(key: string) => window.$message?.info(`[原型] ${key}`)}
        >
          <NButton text type="primary" size="small">更多</NButton>
        </NDropdown>
      )
    }
  ];
}

const columns = buildColumns();

watch(visible, async val => {
  if (!val) {
    resetState();
    return;
  }
  await loadPlan();
});

function handleAddInboundRow() {
  window.$message?.info('[原型] 添加入库计划行');
}

function previewAttachment(name: string) {
  window.$message?.info(`[原型] 查看 ${name}`);
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1360" class="max-w-98%">
    <NDrawerContent closable :native-scrollbar="false" class="oms-detail-drawer">
      <template #header>
        <div class="flex flex-wrap items-center gap-12px">
          <span class="text-18px font-semibold">入库计划</span>
          <span v-if="plan" class="text-13px text-gray-500">{{ plan.planNo }}</span>
        </div>
      </template>

      <NSpin :show="loading">
        <template v-if="plan">
          <NCard title="基础资料" size="small" :bordered="true" class="mb-12px">
            <NDescriptions v-bind="DESC_PROPS">
              <NDescriptionsItem label="柜号">{{ displayContainerNo }}</NDescriptionsItem>
              <NDescriptionsItem label="创建时间">{{ text(plan.createTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="提单号">{{ text(plan.mblNo) }}</NDescriptionsItem>
              <NDescriptionsItem label="状态">{{ text(plan.containerStatusLabel) }}</NDescriptionsItem>
              <NDescriptionsItem label="拆柜完成时间">{{ text(plan.devanningFinishTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="预计拆柜时间">{{ text(plan.expectedDevanningTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="入库仓库">{{ text(plan.warehouseName) }}</NDescriptionsItem>
              <NDescriptionsItem label="订单等级">{{ text(plan.orderLevel) }}</NDescriptionsItem>
              <NDescriptionsItem label="拆柜状态">{{ text(plan.devanningStatusLabel) }}</NDescriptionsItem>
              <NDescriptionsItem label="排队序号">{{ text(plan.queueNo) }}</NDescriptionsItem>
              <NDescriptionsItem label="拆柜口">{{ text(plan.dockCode) }}</NDescriptionsItem>
              <NDescriptionsItem label="司机电话">{{ text(plan.driverPhone) }}</NDescriptionsItem>
              <NDescriptionsItem label="货物数量">{{ text(plan.cargoQty) }}</NDescriptionsItem>
              <NDescriptionsItem label="货物重量">
                {{ plan.cargoWeight != null ? `${plan.cargoWeight} kg` : '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="拆柜轮次">{{ text(plan.devanningRoundNo) }}</NDescriptionsItem>
              <NDescriptionsItem label="备注">{{ text(plan.remark) }}</NDescriptionsItem>
              <NDescriptionsItem label="附件" :span="2">
                <template v-if="plan.attachments?.length">
                  <div class="flex flex-wrap gap-8px">
                    <NButton
                      v-for="file in plan.attachments"
                      :key="file.name"
                      text
                      type="primary"
                      size="small"
                      @click="previewAttachment(file.name)"
                    >
                      {{ file.name }}
                    </NButton>
                  </div>
                </template>
                <span v-else>—</span>
              </NDescriptionsItem>
            </NDescriptions>
          </NCard>

          <div class="mb-12px flex flex-wrap items-center gap-24px text-14px">
            <span><span class="text-gray-500">总件数：</span><strong>{{ plan.totalCartonQty ?? 0 }}</strong></span>
            <span>
              <span class="text-gray-500">总CBM：</span>
              <strong>{{ plan.totalCbm != null ? Number(plan.totalCbm).toFixed(4) : '0.0000' }}</strong>
            </span>
          </div>

          <p class="mb-12px text-12px text-gray-500 leading-relaxed">
            平台（下拉选择已维护平台）、仓库代码（未选平台时可手填；选平台后可下拉）、地址类型（Commercial/Private）、派送方式、HOLD：双击单元格可原地编辑，保存后立即生效。
          </p>

          <div class="mb-12px flex justify-end">
            <NButton type="primary" size="small" @click="handleAddInboundRow">+ 添加入库计划行</NButton>
          </div>

          <NDataTable
            v-model:checked-row-keys="checkedRowKeys"
            :columns="columns"
            :data="flatItems"
            :row-key="(row: Api.Oms.InboundPlanItem) => String(row.id)"
            size="small"
            :bordered="true"
            :single-line="false"
            scroll-x="1400"
            :pagination="{ pageSize: 50, showSizePicker: true, pageSizes: [20, 50, 100] }"
          />
        </template>
        <NEmpty v-else-if="!loading" description="暂无入库计划数据" class="py-40px" />
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
