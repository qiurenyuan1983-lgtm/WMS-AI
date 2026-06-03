<script setup lang="tsx">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NButton,
  NCard,
  NDataTable,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NProgress,
  NSpace,
  NStatistic,
  NTag,
  NEmpty
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  fetchCompleteDevanningWorkTask,
  fetchGetDevanningWorkSession,
  fetchReceiveDevanningByPallet,
  fetchPalletizeDevanningSelection,
  fetchResolveDevanningScan,
  fetchStartDevanningWorkTask
} from '@/service/api/wms/devanning-work';
import PalletHistoryDrawer from './modules/pallet-history-drawer.vue';

defineOptions({ name: 'WmsDevanningWorkExec' });

type SelectionLine = {
  id: string;
  source: 'scan' | 'manual';
  scanCode?: string;
  groupCode: string;
  cargoOrderId: number;
  cargoOrderNo: string;
  customerName: string;
  qty: number;
  qtyUnitLabel: string;
  remark: string;
  isPallet?: boolean;
};

const route = useRoute();
const router = useRouter();

const dockId = computed(() => String(route.query.dockId || ''));
const taskId = computed(() => String(route.query.taskId || ''));
const containerNo = computed(() => String(route.query.containerNo || ''));

const session = ref<Api.Wms.DevanningWorkSession | null>(null);
const loading = ref(false);
const activeGroup = ref('');
const palletDrawerVisible = ref(false);

const scanInput = ref('');
const scanInputRef = ref<{ focus: () => void } | null>(null);
const scanLoading = ref(false);
const lastScanHint = ref('');

const selectionByGroup = ref<Record<string, SelectionLine[]>>({});
const selectedVisible = ref(false);
const palletizing = ref(false);
const rowDraftQty = ref<Record<number, number | null>>({});

const currentGroup = computed(() =>
  session.value?.groups.find(g => g.groupCode === activeGroup.value) || null
);

const currentGroupSelection = computed(() =>
  activeGroup.value ? selectionByGroup.value[activeGroup.value] || [] : []
);

const progressPercent = computed(() => {
  if (!session.value?.totalBoxQty) return 0;
  return Math.min(100, Math.round((session.value.markedBoxQty / session.value.totalBoxQty) * 100));
});

const selectionTotalQty = computed(() =>
  currentGroupSelection.value.reduce((sum, line) => sum + line.qty, 0)
);

function getGroupPendingQty(groupCode: string) {
  return (selectionByGroup.value[groupCode] || []).reduce((sum, line) => sum + line.qty, 0);
}

function getGroupSelection(groupCode: string) {
  return selectionByGroup.value[groupCode] || [];
}

function setGroupSelection(groupCode: string, lines: SelectionLine[]) {
  const next = { ...selectionByGroup.value };
  if (lines.length) next[groupCode] = lines;
  else delete next[groupCode];
  selectionByGroup.value = next;
}

/** not_started | in_progress | finished */
const workPhase = computed(() => {
  const s = session.value;
  if (!s) return 'not_started';
  if (s.devanningFinishTime || s.status === 'DEVANNED') return 'finished';
  if (s.devanningStartTime || s.status === 'DEVANNING') return 'in_progress';
  return 'not_started';
});

function orderSelKey(groupCode: string, cargoOrderId: number) {
  return `${groupCode}:${cargoOrderId}`;
}

const scannedQtyMap = computed(() => {
  const map = new Map<string, number>();
  if (!activeGroup.value) return map;
  for (const line of getGroupSelection(activeGroup.value)) {
    if (line.isPallet) continue;
    const k = orderSelKey(line.groupCode, line.cargoOrderId);
    map.set(k, (map.get(k) || 0) + line.qty);
  }
  return map;
});

function findOrder(groupCode: string, cargoOrderId: number) {
  const group = session.value?.groups.find(g => g.groupCode === groupCode);
  return group?.orders.find(o => o.cargoOrderId === cargoOrderId) || null;
}

function getScannedQty(row: Api.Wms.DevanningWorkOrder) {
  if (!currentGroup.value) return 0;
  return scannedQtyMap.value.get(orderSelKey(currentGroup.value.groupCode, row.cargoOrderId)) || 0;
}

function getRemainCapacity(groupCode: string, cargoOrderId: number) {
  const ord = findOrder(groupCode, cargoOrderId);
  if (!ord) return 0;
  const pending = scannedQtyMap.value.get(orderSelKey(groupCode, cargoOrderId)) || 0;
  return Math.max(0, ord.expectedQty - ord.receivedQty - pending);
}

function nextSelectionId() {
  return `sel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}


function pushSelection(line: Omit<SelectionLine, 'id'>, groupCode: string) {
  setGroupSelection(groupCode, [
    ...getGroupSelection(groupCode),
    { ...line, id: nextSelectionId() }
  ]);
}

function validateAndAddSelection(payload: {
  source: 'scan' | 'manual';
  scanCode?: string;
  groupCode: string;
  cargoOrderId: number;
  cargoOrderNo: string;
  customerName: string;
  qty: number;
  qtyUnitLabel: string;
  remark: string;
  isPallet?: boolean;
}) {
  if (!activeGroup.value) {
    window.$message?.warning('请先选择一个分组');
    return false;
  }
  if (payload.groupCode !== activeGroup.value) {
    window.$message?.warning(
      `该数据属于分组「${payload.groupCode}」，请切换到对应分组后再操作`
    );
    return false;
  }

  const groupCode = activeGroup.value;
  const code = payload.scanCode?.trim();
  if (code) {
    const dup = getGroupSelection(groupCode).some(
      s => s.scanCode?.toUpperCase() === code.toUpperCase()
    );
    if (dup) {
      window.$message?.warning('该条码已在当前分组已选择列表中');
      return false;
    }
  }

  if (payload.isPallet) {
    pushSelection(payload, groupCode);
    return true;
  }

  const remain = getRemainCapacity(payload.groupCode, payload.cargoOrderId);
  if (payload.qty <= 0) {
    window.$message?.warning('请输入有效数量');
    return false;
  }
  if (payload.qty > remain) {
    const ord = findOrder(payload.groupCode, payload.cargoOrderId);
    window.$message?.warning(
      `超出可收数量，剩余 ${remain} ${ord?.qtyUnitLabel || payload.qtyUnitLabel}`
    );
    return false;
  }

  pushSelection(payload, groupCode);
  return true;
}

async function loadSession() {
  if (!taskId.value) return;
  loading.value = true;
  const { data, error } = await fetchGetDevanningWorkSession(taskId.value, dockId.value);
  loading.value = false;
  if (error || !data) {
    session.value = null;
    return;
  }
  session.value = data;
  if (!activeGroup.value && data.groups.length) {
    activeGroup.value = data.groups[0].groupCode;
  }
}

function focusScanInput() {
  nextTick(() => scanInputRef.value?.focus());
}

async function submitScan() {
  const code = scanInput.value.trim();
  if (!code || scanLoading.value) return;

  scanLoading.value = true;
  const { data, error } = await fetchResolveDevanningScan(taskId.value, code);
  scanLoading.value = false;

  if (error || !data) {
    focusScanInput();
    return;
  }

  if (!activeGroup.value) {
    window.$message?.warning('请先选择一个分组');
    focusScanInput();
    return;
  }
  if (!data.isPallet && data.groupCode && data.groupCode !== activeGroup.value) {
    window.$message?.warning(
      `该条码属于分组「${data.groupCode}」，请切换到对应分组后扫描`
    );
    focusScanInput();
    return;
  }

  const ok = validateAndAddSelection({
    source: 'scan',
    scanCode: data.scanCode,
    groupCode: data.isPallet ? activeGroup.value : data.groupCode,
    cargoOrderId: data.cargoOrderId,
    cargoOrderNo: data.cargoOrderNo,
    customerName: data.customerName,
    qty: data.qty,
    qtyUnitLabel: data.qtyUnitLabel,
    remark: data.remark,
    isPallet: data.isPallet
  });

  if (!ok) {
    focusScanInput();
    return;
  }

  scanInput.value = '';
  lastScanHint.value = data.isPallet
    ? `已加入：卡板 ${code}`
    : `已加入：${data.remark || code}`;
  window.$message?.success('已加入已选择');
  focusScanInput();
}

function addManualToSelection(row: Api.Wms.DevanningWorkOrder) {
  if (!currentGroup.value) return;
  const qty = Number(rowDraftQty.value[row.cargoOrderId] || 0);
  const ok = validateAndAddSelection({
    source: 'manual',
    groupCode: currentGroup.value.groupCode,
    cargoOrderId: row.cargoOrderId,
    cargoOrderNo: row.cargoOrderNo,
    customerName: row.customerName,
    qty,
    qtyUnitLabel: row.qtyUnitLabel,
    remark: `手动输入 · ${row.cargoOrderNo}`
  });
  if (ok) {
    rowDraftQty.value[row.cargoOrderId] = null;
    window.$message?.success('已加入已选择');
  }
}

function cancelSelection() {
  if (!activeGroup.value) return;
  setGroupSelection(activeGroup.value, []);
  selectedVisible.value = false;
  lastScanHint.value = '';
}

async function confirmPalletize() {
  if (!activeGroup.value || !currentGroupSelection.value.length || palletizing.value) return;

  const groupCode = activeGroup.value;
  const lines = currentGroupSelection.value;

  palletizing.value = true;
  let lastSession: Api.Wms.DevanningWorkSession | null = null;

  const pltLines = lines.filter(l => l.isPallet);
  const orderLines = lines.filter(l => !l.isPallet);
  const orderAgg = new Map<string, { groupCode: string; cargoOrderId: number; qty: number }>();

  for (const line of orderLines) {
    const k = orderSelKey(line.groupCode, line.cargoOrderId);
    const prev = orderAgg.get(k);
    if (prev) prev.qty += line.qty;
    else orderAgg.set(k, { groupCode: line.groupCode, cargoOrderId: line.cargoOrderId, qty: line.qty });
  }

  const palletItems = Array.from(orderAgg.values());

  if (palletItems.length) {
    const { data, error } = await fetchPalletizeDevanningSelection(taskId.value, {
      groupCode,
      items: palletItems
    });
    if (error) {
      palletizing.value = false;
      return;
    }
    lastSession = data as Api.Wms.DevanningWorkSession;
  }

  for (const line of pltLines) {
    const { data, error } = await fetchReceiveDevanningByPallet(taskId.value, {
      palletNo: line.scanCode || '',
      groupCode,
      boxQty: line.qty
    });
    if (error) {
      palletizing.value = false;
      return;
    }
    lastSession = data as Api.Wms.DevanningWorkSession;
  }

  palletizing.value = false;
  setGroupSelection(groupCode, []);
  selectedVisible.value = false;
  lastScanHint.value = '';
  if (lastSession) session.value = lastSession;
  else await loadSession();
  window.$message?.success(`${groupCode} 打板成功`);
  focusScanInput();
}

async function handleStartWork() {
  const { data, error } = await fetchStartDevanningWorkTask(taskId.value);
  if (error || !data) return;
  session.value = data;
  window.$message?.success('已开始拆柜');
  focusScanInput();
}

async function handleCompleteWork() {
  const pendingGroups = Object.entries(selectionByGroup.value)
    .filter(([, lines]) => lines.length > 0)
    .map(([g]) => g);
  if (pendingGroups.length) {
    window.$message?.warning(`以下分组仍有未打板数据：${pendingGroups.join('、')}`);
    return;
  }
  const { data, error } = await fetchCompleteDevanningWorkTask(taskId.value);
  if (error || !data) return;
  session.value = data;
  window.$message?.success('拆柜已完成');
}

function goBack() {
  router.push({ name: 'wms_devanning-work', query: { dockId: dockId.value } });
}

function buildOrderColumns(): DataTableColumns<Api.Wms.DevanningWorkOrder> {
  return [
    { title: '货物订单号', key: 'cargoOrderNo', width: 130, fixed: 'left' },
    { title: '客户', key: 'customerName', width: 90, ellipsis: { tooltip: true } },
    {
      title: '预报单位',
      key: 'qtyUnitLabel',
      width: 72,
      align: 'center',
      render: row => <NTag size="small">{row.qtyUnitLabel}</NTag>
    },
    {
      title: '预报',
      key: 'expectedQty',
      width: 72,
      align: 'center',
      render: row => `${row.expectedQty} ${row.qtyUnitLabel}`
    },
    {
      title: '已收',
      key: 'receivedQty',
      width: 72,
      align: 'center',
      render: row => `${row.receivedQty} ${row.qtyUnitLabel}`
    },
    {
      title: '已扫',
      key: 'scannedQty',
      width: 72,
      align: 'center',
      render: row => {
        const scanned = getScannedQty(row);
        return (
          <span class={scanned > 0 ? 'text-#d97706 font-600' : ''}>
            {scanned} {row.qtyUnitLabel}
          </span>
        );
      }
    },
    {
      title: '收货',
      key: 'inputQty',
      width: 160,
      fixed: 'right',
      render: row => {
        const remain = getRemainCapacity(
          currentGroup.value?.groupCode || '',
          row.cargoOrderId
        );
        const disabled = workPhase.value !== 'in_progress' || remain <= 0;
        return (
          <div class="flex items-center gap-6px">
            <NInputNumber
              size="small"
              min={1}
              max={Math.max(1, remain)}
              disabled={disabled}
              value={rowDraftQty.value[row.cargoOrderId] ?? null}
              onUpdateValue={v => {
                rowDraftQty.value = { ...rowDraftQty.value, [row.cargoOrderId]: v };
              }}
              onKeyup={(e: KeyboardEvent) => {
                if (e.key === 'Enter') addManualToSelection(row);
              }}
              placeholder="数量"
              show-button={false}
              style={{ width: '72px' }}
            />
            <NButton
              size="small"
              type="primary"
              disabled={disabled}
              onClick={() => addManualToSelection(row)}
            >
              加入
            </NButton>
          </div>
        );
      }
    }
  ];
}

const orderColumns = computed(() => {
  selectionByGroup.value;
  rowDraftQty.value;
  activeGroup.value;
  return buildOrderColumns();
});

const selectionColumns: DataTableColumns<SelectionLine> = [
  {
    title: '来源',
    key: 'source',
    width: 72,
    render: row => (
      <NTag size="small" type={row.source === 'scan' ? 'info' : 'default'}>
        {row.source === 'scan' ? '扫码' : '输入'}
      </NTag>
    )
  },
  {
    title: '条码 / 说明',
    key: 'remark',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: row => row.scanCode || row.remark
  },
  { title: '订单号', key: 'cargoOrderNo', width: 140 },
  {
    title: '数量',
    key: 'qty',
    width: 80,
    align: 'center',
    render: row => `${row.qty} ${row.qtyUnitLabel}`
  }
];

onMounted(async () => {
  await loadSession();
  if (workPhase.value === 'in_progress') focusScanInput();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px bg-#f5f7fa p-16px">
    <NSpace justify="space-between" align="center" wrap>
      <div>
        <h2 class="text-20px font-600 m-0">拆柜作业</h2>
        <p class="mt-4px text-13px text-#6b7280">
          柜号：{{ session?.containerNo || containerNo }} · Dock {{ session?.dockCode }}
          <span v-if="session?.devanningStartTime" class="ml-12px">开始：{{ session.devanningStartTime }}</span>
          <span v-if="session?.devanningFinishTime" class="ml-12px">完成：{{ session.devanningFinishTime }}</span>
        </p>
      </div>
      <NSpace wrap>
        <NButton secondary type="info">蓝牙连接</NButton>
        <NButton secondary @click="palletDrawerVisible = true">卡板历史</NButton>
        <NButton v-if="workPhase === 'not_started'" type="primary" @click="handleStartWork">开始拆柜</NButton>
        <NButton v-else-if="workPhase === 'in_progress'" type="success" @click="handleCompleteWork">拆柜完成</NButton>
        <NTag v-else type="success" size="medium">已拆柜完成</NTag>
        <NButton @click="goBack">返回任务</NButton>
      </NSpace>
    </NSpace>

    <NCard v-if="session && workPhase === 'in_progress'" size="small" title="扫码收货" :bordered="false">
      <div class="flex flex-col gap-8px">
        <NInput
          ref="scanInputRef"
          v-model:value="scanInput"
          size="large"
          placeholder="扫描或输入唛头 / 货件号 / 订单号 / 箱唛 / 卡板号，回车加入已选择"
          :loading="scanLoading"
          clearable
          @keyup.enter="submitScan"
        />
        <p class="text-12px text-#6b7280 m-0">
          扫码后数据进入当前分组的「已选择」，确认无误后点击「已选择」→「打板」完成收货
          <span v-if="activeGroup" class="ml-8px">当前分组：{{ activeGroup }}</span>
        </p>
        <p v-if="lastScanHint" class="text-13px text-#059669 m-0">{{ lastScanHint }}</p>
      </div>
    </NCard>

    <NCard v-if="session" size="small" :bordered="false">
      <div class="flex flex-wrap items-center gap-24px">
        <NStatistic label="收货进度" :value="session.markedBoxQty + ' / ' + session.totalBoxQty + ' 箱'" />
        <div class="min-w-200px flex-1">
          <NProgress type="line" :percentage="progressPercent" :show-indicator="true" />
        </div>
      </div>
    </NCard>

    <NGrid v-if="session" :cols="24" :x-gap="12" :y-gap="12">
      <NGridItem :span="5">
        <NCard size="small" :title="'分组 (' + session.groups.length + ')'">
          <div class="flex flex-col gap-8px">
            <NButton
              v-for="g in session.groups"
              :key="g.groupCode"
              :type="activeGroup === g.groupCode ? 'primary' : 'default'"
              secondary
              class="justify-start"
              @click="activeGroup = g.groupCode"
            >
              <div class="text-left w-full">
                <div class="font-600">{{ g.groupCode }}</div>
                <div class="text-12px opacity-80">
                  {{ g.totalReceivedQty }}/{{ g.totalExpectedQty }} · {{ g.orders.length }} 单
                  <span v-if="getGroupPendingQty(g.groupCode)" class="text-#d97706 font-600">
                    · 已选 {{ getGroupPendingQty(g.groupCode) }}
                  </span>
                </div>
              </div>
            </NButton>
          </div>
        </NCard>
      </NGridItem>

      <NGridItem :span="19">
        <NCard v-if="currentGroup" size="small">
          <template #header>
            <div class="flex items-center justify-between gap-12px w-full">
              <span>分组：{{ currentGroup.groupCode }}（订单维度）</span>
              <NButton
                v-if="workPhase === 'in_progress'"
                type="warning"
                size="small"
                :disabled="!currentGroupSelection.length"
                @click="selectedVisible = true"
              >
                已选择{{ selectionTotalQty ? `（${selectionTotalQty}）` : '' }}
              </NButton>
            </div>
          </template>
          <NDataTable
            :columns="orderColumns"
            :data="currentGroup.orders"
            :loading="loading"
            size="small"
            :scroll-x="860"
            :pagination="false"
          />
        </NCard>
        <NEmpty v-else description="请先选择一个分组" class="py-40px" />
      </NGridItem>
    </NGrid>

    <NEmpty v-else-if="!loading" description="未找到作业数据" class="py-40px" />

    <NModal
      v-model:show="selectedVisible"
      preset="card"
      :title="'已选择 · ' + (activeGroup || '')"
      style="width: 720px; max-width: 95vw"
      :mask-closable="false"
    >
      <NEmpty v-if="!currentGroupSelection.length" description="当前分组暂无已选择数据" class="py-24px" />
      <NDataTable
        v-else
        :columns="selectionColumns"
        :data="currentGroupSelection"
        size="small"
        :pagination="false"
        :max-height="360"
      />
      <p v-if="currentGroupSelection.length" class="mt-12px text-13px text-#6b7280 m-0">
        共 {{ currentGroupSelection.length }} 条，合计 {{ selectionTotalQty }} 件
      </p>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="cancelSelection">取消</NButton>
          <NButton
            type="primary"
            :loading="palletizing"
            :disabled="!currentGroupSelection.length"
            @click="confirmPalletize"
          >
            打板
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <PalletHistoryDrawer
      v-model:visible="palletDrawerVisible"
      v-model:session="session"
      :task-id="taskId"
      @refreshed="loadSession"
    />
  </div>
</template>
