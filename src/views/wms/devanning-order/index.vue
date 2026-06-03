<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { isMockMode } from '@/mock';
import { useDictStore } from '@/store/modules/dict';
import {
  NButton,
  NCard,
  NDataTable,
  NDropdown,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NTag
} from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import {
  fetchBatchDeleteDevanningOrder,
  fetchCreateDevanningOrder,
  fetchGetDevanningOrderList,
  fetchGetDevanningOrderStatusCount,
  fetchUpdateDevanningOrder
} from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import DevanningOrderDetailDrawer from './modules/devanning-order-detail-drawer.vue';

defineOptions({ name: 'WmsDevanningOrderList' });

const appStore = useAppStore();
const router = useRouter();
const { hasAuth } = useAuth();
const dictStore = useDictStore();
const { record: statusRecord, reload: reloadStatusDict } = useDict('wms_devanning_status');
const { record: methodRecord, reload: reloadMethodDict } = useDict('wms_devanning_method');

const STATUS_TAG: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  UNPICKEDUP: 'default',
  PICKEDUP: 'info',
  ARRIVED: 'warning',
  DEVANNING: 'warning',
  DEVANNED: 'success',
  EXCEPTION: 'error',
  CANCELLED: 'default'
};

const STATUS_LABEL: Record<string, string> = {
  UNPICKEDUP: '未提柜',
  PICKEDUP: '已提柜',
  ARRIVED: '已到仓',
  DEVANNING: '拆柜中',
  DEVANNED: '拆柜完成',
  EXCEPTION: '异常',
  CANCELLED: '取消'
};

const METHOD_LABEL: Record<string, string> = {
  MANUAL: '人工',
  FORKLIFT: '叉车',
  MACHINE: '机械'
};

const STATUS_TAB_ORDER = [
  'UNPICKEDUP',
  'PICKEDUP',
  'ARRIVED',
  'DEVANNING',
  'DEVANNED',
  'EXCEPTION',
  'CANCELLED'
] as const;

const activeStatus = ref('');
const statusCountMap = ref<Record<string, number>>({});

const statusTabs = computed(() => {
  const total = Object.values(statusCountMap.value).reduce((sum, n) => sum + n, 0);
  return [
    { label: '全部', value: '', count: total },
    ...STATUS_TAB_ORDER.map(value => ({
      label: STATUS_LABEL[value],
      value,
      count: statusCountMap.value[value] || 0
    }))
  ];
});

function isGarbledLabel(label?: string | null) {
  if (!label) return true;
  return /[?锟]/.test(label) || label.includes('\uFFFD');
}

function statusLabel(code: string) {
  const mapped = STATUS_LABEL[code];
  if (mapped) return mapped;
  const fromDict = statusRecord.value[code]?.dictLabel;
  if (fromDict && !isGarbledLabel(fromDict)) return fromDict;
  return code || '—';
}

function methodLabel(code: string) {
  const mapped = METHOD_LABEL[code];
  if (mapped) return mapped;
  const fromDict = methodRecord.value[code]?.dictLabel;
  if (fromDict && !isGarbledLabel(fromDict)) return fromDict;
  return code || '—';
}

function allowAuth(code: string) {
  return isMockMode() || hasAuth(code);
}

function fmtDt(v?: string | null) {
  if (!v) return '—';
  return String(v).replace('T', ' ').slice(0, 19);
}

function valueText(v: unknown) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function fmtNum(v?: number | null, digits = 2) {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(digits);
}

const EXAM_STATUS_LABEL: Record<string, string> = {
  NONE: '\u65e0',
  EXAMINING: '\u67e5\u9a8c\u4e2d',
  EXAMINED: '\u67e5\u9a8c\u5b8c\u6210'
};

function examStatusLabel(value?: string | null) {
  if (!value || value === 'NONE') return '\u65e0';
  return EXAM_STATUS_LABEL[value] || value;
}

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const searchParams = ref<Api.Wms.DevanningOrderSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  status: null,
  warehouseId: null,
  orderByColumn: null,
  isAsc: null
});

const formModel = ref<Api.Wms.DevanningOrderOperateParams>({
  id: null,
  warehouseId: null,
  companyId: null,
  containerNo: null,
  customerName: null,
  channelName: null,
  customerServiceName: null,
  etaWarehouseTime: null,
  plannedDevanningTime: null,
  devanningMethod: 'MANUAL',
  devanningRemark: null,
  remark: null,
  version: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX, reloadColumns } =
  useNaivePaginatedTable<Api.Wms.DevanningOrderList, Api.Wms.DevanningOrder>({
    api: () => fetchGetDevanningOrderList(searchParams.value),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', width: 60, render: (_, index) => index + 1 },
      { key: 'devanningNo', title: '拆柜单号', width: 160, fixed: 'left' },
      { key: 'containerNo', title: '柜号', width: 130 },
      { key: 'sourceOrderNo', title: '来源单号', width: 150, ellipsis: { tooltip: true } },
      {
        key: 'status',
        title: '状态',
        width: 110,
        render: row => (
          <NTag size="small" type={STATUS_TAG[row.status] || 'default'}>
            {statusLabel(row.status)}
          </NTag>
        )
      },
      { key: 'customerName', title: '客户', width: 120, ellipsis: { tooltip: true } },
      { key: 'channelName', title: '渠道', width: 100 },
      { key: 'totalWeight', title: '总重量', width: 100, render: row => fmtNum(row.totalWeight, 1) },
      { key: 'totalBoxQty', title: '总箱数', width: 90, render: row => valueText(row.totalBoxQty) },
      { key: 'totalCbm', title: '总体积', width: 90, render: row => fmtNum(row.totalCbm, 2) },
      { key: 'inboundedBoxQty', title: '已入库箱数', width: 100, render: row => valueText(row.inboundedBoxQty) },
      { key: 'inboundedPalletQty', title: '已入库板数', width: 100, render: row => valueText(row.inboundedPalletQty) },
      {
        key: 'examStatus',
        title: '查验状态',
        width: 100,
        render: row => (
          <NTag size="small" type={row.examStatus === 'EXAMINING' ? 'warning' : row.examStatus === 'EXAMINED' ? 'success' : 'default'}>
            {examStatusLabel(row.examStatus)}
          </NTag>
        )
      },
      { key: 'plannedTruckQty', title: '预排车数', width: 90, render: row => valueText(row.plannedTruckQty) },
      { key: 'plannedCbm', title: '预排方数', width: 90, render: row => fmtNum(row.plannedCbm, 2) },
      {
        key: 'attachmentCount',
        title: '附件',
        width: 80,
        render: row => (row.attachmentCount ? `${row.attachmentCount}\u4e2a` : '—')
      },
      { key: 'plannedDevanningTime', title: '预计拆柜时间', width: 160, render: row => fmtDt(row.plannedDevanningTime) },
      { key: 'devanningRound', title: '拆柜轮次', width: 90, render: row => valueText(row.devanningRound) },
      { key: 'devanningStartTime', title: '拆柜开始时间', width: 160, render: row => fmtDt(row.devanningStartTime) },
      { key: 'dockCode', title: 'Dock', width: 90, render: row => row.dockCode || '—' },
      { key: 'etaWarehouseTime', title: 'ETA到仓', width: 160, render: row => fmtDt(row.etaWarehouseTime) },
      { key: 'pickupTime', title: '提柜时间', width: 160, render: row => fmtDt(row.pickupTime) },
      { key: 'actualArrivalTime', title: '到仓时间', width: 160, render: row => fmtDt(row.actualArrivalTime) },
      { key: 'devanningFinishTime', title: '拆柜完成', width: 160, render: row => fmtDt(row.devanningFinishTime) },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 80,
        fixed: 'right',
        render: row => {
          const options = buildRowActions(row);
          if (!options.length) return null;
          return (
            <NDropdown trigger="click" options={options} onSelect={(key: string) => handleRowAction(String(key), row)}>
              <NButton size="small" secondary onClick={(e: MouseEvent) => e.stopPropagation()}>
                更多
              </NButton>
            </NDropdown>
          );
        }
      }
    ]
  });

const { drawerVisible, openDrawer, closeDrawer, checkedRowKeys, onBatchDeleted } = useTableOperate(
  data,
  'id',
  getData
);

const modalTitle = computed(() => (formModel.value.id ? '编辑拆柜订单' : '新建拆柜订单'));

const detailVisible = ref(false);
const detailId = ref<CommonType.IdType>();
const detailInitialTab = ref('basic');

const SOURCE_ORDER_NO_TO_CONTAINER_ID: Record<string, string> = {
  'CTN-2026-0001': '70001',
  'CTN-2026-0002': '70002'
};

function resolveContainerOrderId(row: Api.Wms.DevanningOrder) {
  if (row.sourceOrderId != null && row.sourceOrderId !== '') return String(row.sourceOrderId);
  if (row.sourceOrderNo && SOURCE_ORDER_NO_TO_CONTAINER_ID[row.sourceOrderNo]) {
    return SOURCE_ORDER_NO_TO_CONTAINER_ID[row.sourceOrderNo];
  }
  return null;
}

function handleView(id: CommonType.IdType, initialTab = 'basic') {
  detailId.value = id;
  detailInitialTab.value = initialTab;
  detailVisible.value = true;
}

function buildRowActions(row: Api.Wms.DevanningOrder) {
  const opts: Array<{ label: string; key: string; type?: string; disabled?: boolean }> = [];
  if (allowAuth('wms:devanningOrder:query')) {
    opts.push({ label: '查看详情', key: 'view' });
    opts.push({ label: '文件管理', key: 'files' });
    opts.push({ label: '查看轨迹', key: 'trace' });
    opts.push({ label: '操作日志', key: 'log' });
  }
  if (allowAuth('wms:devanningOrder:query') || allowAuth('oms:containerOrder:inboundPlan') || isMockMode()) {
    opts.push({ label: '入库计划', key: 'inboundPlan' });
  }
  opts.push({ label: '拆柜作业', key: 'work' });
  if (allowAuth('wms:devanningOrder:edit')) opts.push({ label: '编辑', key: 'edit' });
  return opts;
}

function handleRowAction(key: string, row: Api.Wms.DevanningOrder) {
  if (key === 'view') {
    handleView(row.id);
    return;
  }
  if (key === 'files') {
    handleView(row.id, 'files');
    return;
  }
  if (key === 'trace') {
    handleView(row.id, 'trace');
    return;
  }
  if (key === 'log') {
    window.$message?.info('操作日志功能开发中，敬请期待');
    return;
  }
  if (key === 'inboundPlan') {
    const containerOrderId = resolveContainerOrderId(row);
    if (!containerOrderId) {
      window.$message?.warning('未关联海柜订单，无法打开入库计划');
      return;
    }
    router.push({
      path: '/oms/inbound-plan',
      query: { containerOrderId, warehouseId: String(row.warehouseId) }
    });
    return;
  }
  if (key === 'work') {
    const dockId = row.dockCode === 'DOC-LA-002' ? '3010002' : '3010001';
    router.push({
      name: 'wms_devanning-work-exec',
      query: { dockId, taskId: String(row.id), containerNo: row.containerNo || '' }
    });
    return;
  }
  if (key === 'edit') {
    formModel.value = { ...row, version: row.version ?? null };
    openDrawer();
  }
}

onMounted(async () => {
  if (!isMockMode()) return;
  dictStore.removeDict('wms_devanning_status');
  dictStore.removeDict('wms_devanning_method');
  await reloadStatusDict();
  await reloadMethodDict();
  reloadColumns();
});

watch(
  () => statusRecord.value,
  () => reloadColumns(),
  { deep: true }
);

async function loadWarehouses() {
  const { data: whData } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500 } as any);
  warehouseOptions.value = ((whData as any)?.rows || []).map((item: any) => ({
    label: `${item.warehouseName}（${item.warehouseCode}）`,
    value: item.id
  }));
}

async function handleSubmit() {
  if (!formModel.value.warehouseId || !formModel.value.containerNo) {
    window.$message?.warning('请填写仓库与柜号');
    return;
  }
  if (formModel.value.id) {
    await fetchUpdateDevanningOrder(formModel.value);
  } else {
    await fetchCreateDevanningOrder(formModel.value);
  }
  closeDrawer();
  await getData();
  await loadStatusCount();
}

async function handleBatchDelete() {
  await fetchBatchDeleteDevanningOrder(checkedRowKeys.value);
  onBatchDeleted();
}

function openCreate() {
  formModel.value = {
    id: null,
    warehouseId: warehouseOptions.value[0]?.value ?? null,
    companyId: null,
    containerNo: null,
    devanningMethod: 'MANUAL',
    remark: null,
    version: null
  };
  openDrawer();
}

async function loadStatusCount() {
  const { data } = await fetchGetDevanningOrderStatusCount({
    ...searchParams.value,
    status: null
  });
  if (data) statusCountMap.value = data;
}

function handleStatusChange(value: string) {
  activeStatus.value = value;
  searchParams.value.status = value || null;
  getDataByPage(1);
  loadStatusCount();
}

async function handleSearch() {
  getDataByPage(1);
  await loadStatusCount();
}

loadWarehouses();
handleSearch();
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="关键词">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="单号/柜号/客户" class="w-200px" />
        </NFormItem>
        <NFormItem label="仓库">
          <NSelect v-model:value="searchParams.warehouseId" clearable class="w-200px" :options="warehouseOptions" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton v-if="allowAuth('wms:devanningOrder:add')" class="ml-8px" @click="openCreate">新建</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-add="allowAuth('wms:devanningOrder:add')"
          :show-delete="allowAuth('wms:devanningOrder:remove')"
          @add="openCreate"
          @delete="handleBatchDelete"
          @refresh="handleSearch"
        />
      </template>

      <div class="mb-12px flex flex-shrink-0 flex-nowrap gap-5px overflow-x-auto pb-2px">
        <div
          v-for="tab in statusTabs"
          :key="tab.value"
          class="flex flex-shrink-0 cursor-pointer select-none items-center gap-4px rounded-16px px-8px py-3px text-12px transition-colors"
          :class="
            activeStatus === tab.value
              ? 'bg-primary text-white shadow-sm'
              : 'bg-#f0f2f5 text-#606266 hover:bg-#e6e8ef'
          "
          @click="handleStatusChange(tab.value)"
        >
          <span>{{ tab.label }}</span>
          <span
            class="inline-flex min-w-14px items-center justify-center rounded-7px px-3px text-10px font-semibold leading-14px"
            :class="
              activeStatus === tab.value
                ? 'bg-white/25 text-white'
                : tab.count > 0
                  ? 'bg-#ef4444 text-white'
                  : 'bg-#d0d3d9 text-#909399'
            "
          >
            {{ tab.count }}
          </span>
        </div>
      </div>

      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :flex-height="!appStore.isMobile"
        :row-key="row => row.id"
        :pagination="mobilePagination"
        remote
        size="small"
        class="sm:h-full"
      />
    </NCard>

    <NModal v-model:show="drawerVisible" preset="card" :title="modalTitle" class="w-560px">
      <NForm label-placement="left" label-width="100">
        <NFormItem label="仓库" required>
          <NSelect v-model:value="formModel.warehouseId" :options="warehouseOptions" />
        </NFormItem>
        <NFormItem label="柜号" required>
          <NInput v-model:value="formModel.containerNo" />
        </NFormItem>
        <NFormItem label="客户">
          <NInput v-model:value="formModel.customerName" />
        </NFormItem>
        <NFormItem label="渠道">
          <NInput v-model:value="formModel.channelName" />
        </NFormItem>
        <NFormItem label="拆柜方式">
          <NSelect
            v-model:value="formModel.devanningMethod"
            :options="Object.entries(METHOD_LABEL).map(([value, label]) => ({ label, value }))"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="formModel.remark" type="textarea" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton @click="closeDrawer">取消</NButton>
        <NButton type="primary" class="ml-8px" @click="handleSubmit">保存</NButton>
      </template>
    </NModal>

    <DevanningOrderDetailDrawer
      v-model:visible="detailVisible"
      :order-id="detailId"
      :initial-tab="detailInitialTab"
      @updated="handleSearch"
    />
  </div>
</template>

<style scoped></style>
