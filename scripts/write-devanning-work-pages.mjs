/**
 * Generate devanning work mock + vue pages (UTF-8 safe).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...codes) => codes.map(c => String.fromCharCode(c)).join('');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- mock data ----------
const mockTs = `import { MOCK_WAREHOUSE } from './common';
import { MOCK_WMS_DEVANNING_ORDERS } from './wms';
import { buildInboundPlanItemsFromContainer, buildCargoOrdersForContainer } from './oms-container-cargo';

/** dockId -> dockCode */
export const DOCK_ID_CODE: Record<string, string> = {
  '3010001': 'DOC-LA-001',
  '3010002': 'DOC-LA-002'
};

export type DevanningWorkTask = {
  id: number;
  devanningNo: string;
  containerNo: string;
  orderType: string;
  totalBoxQty: number;
  markedBoxQty: number;
  workStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  workStatusLabel: string;
  devanningStartTime: string | null;
  devanningFinishTime: string | null;
  dockId: number;
  dockCode: string;
  sourceOrderId: number | null;
  customerName: string | null;
};

function mapWorkStatus(status: string): DevanningWorkTask['workStatus'] {
  if (status === 'DEVANNING') return 'IN_PROGRESS';
  if (status === 'DEVANNED' || status === 'CANCELLED') return 'COMPLETED';
  if (status === 'UNPICKEDUP') return 'NOT_STARTED';
  return 'IN_PROGRESS';
}

function workStatusLabel(ws: DevanningWorkTask['workStatus']) {
  const m: Record<DevanningWorkTask['workStatus'], string> = {
    NOT_STARTED: '${u(0x672a, 0x5f00, 0x59cb)}',
    IN_PROGRESS: '${u(0x8fdb, 0x884c, 0x4e2d)}',
    COMPLETED: '${u(0x5df2, 0x5b8c, 0x6210)}'
  };
  return m[ws];
}

export function getDevanningWorkTasks(params?: Record<string, any>) {
  const dockId = String(params?.dockId ?? '3010001');
  const dockCode = DOCK_ID_CODE[dockId] || 'DOC-LA-001';
  const keyword = String(params?.containerNo || params?.keyword || '').trim().toLowerCase();

  let rows: DevanningWorkTask[] = MOCK_WMS_DEVANNING_ORDERS.filter(
    o => (o.dockCode || 'DOC-LA-001') === dockCode || String(o.dockCode).includes('DOC-LA')
  ).map(o => {
    const ws = mapWorkStatus(String(o.status));
    return {
      id: Number(o.id),
      devanningNo: o.devanningNo || o.orderNo,
      containerNo: o.containerNo,
      orderType: '${u(0x6d77, 0x8fd0)}',
      totalBoxQty: Number(o.totalBoxQty || 0),
      markedBoxQty: Number(o.inboundedBoxQty || 0),
      workStatus: ws,
      workStatusLabel: workStatusLabel(ws),
      devanningStartTime: o.devanningStartTime || null,
      devanningFinishTime: o.devanningFinishTime || null,
      dockId: Number(dockId),
      dockCode: o.dockCode || dockCode,
      sourceOrderId: o.sourceOrderId ?? 70001,
      customerName: o.customerName
    };
  });

  if (keyword) {
    rows = rows.filter(
      r =>
        r.containerNo.toLowerCase().includes(keyword) ||
        r.devanningNo.toLowerCase().includes(keyword)
    );
  }
  return { rows, total: rows.length };
}

export type WorkGroup = {
  groupCode: string;
  cargoOrderNos: string[];
  shipmentNos: string[];
  totalCartonQty: number;
  receivedCartonQty: number;
  items: Array<{
    shipmentNo: string;
    cargoOrderNo: string;
    cartonQty: number;
    receivedQty: number;
    poNo: string;
    shippingMark: string;
  }>;
};

export type DevanningWorkSession = {
  taskId: number;
  devanningNo: string;
  containerNo: string;
  dockId: number;
  dockCode: string;
  customerName: string;
  totalBoxQty: number;
  markedBoxQty: number;
  groups: WorkGroup[];
  pallets: Array<{ palletNo: string; groupCode: string; boxQty: number; status: string }>;
};

const receivedState = new Map<string, number>();

function recvKey(taskId: number, shipmentNo: string) {
  return taskId + ':' + shipmentNo;
}

export function getDevanningWorkSession(taskId: number | string, dockId?: number | string) {
  const id = Number(taskId);
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === id);
  if (!order) return null;

  const containerOrderId = order.sourceOrderId ?? 70001;
  const planItems = buildInboundPlanItemsFromContainer(containerOrderId, 81001);
  const cargoOrders = buildCargoOrdersForContainer(containerOrderId);

  const groupMap = new Map<string, WorkGroup>();
  for (const item of planItems) {
    const code = item.groupCode || '${u(0x672a, 0x5206, 0x7ec4)}';
    if (!groupMap.has(code)) {
      groupMap.set(code, {
        groupCode: code,
        cargoOrderNos: [],
        shipmentNos: [],
        totalCartonQty: 0,
        receivedCartonQty: 0,
        items: []
      });
    }
    const g = groupMap.get(code)!;
    if (item.cargoOrderNo && !g.cargoOrderNos.includes(item.cargoOrderNo)) g.cargoOrderNos.push(item.cargoOrderNo);
    if (item.shipmentNo && !g.shipmentNos.includes(item.shipmentNo)) g.shipmentNos.push(item.shipmentNo);
    const rq = receivedState.get(recvKey(id, item.shipmentNo || '')) || 0;
    g.items.push({
      shipmentNo: item.shipmentNo || '',
      cargoOrderNo: item.cargoOrderNo || '',
      cartonQty: Number(item.cartonQty || 0),
      receivedQty: rq,
      poNo: item.poNo || '',
      shippingMark: item.shippingMark || ''
    });
    g.totalCartonQty += Number(item.cartonQty || 0);
    g.receivedCartonQty += rq;
  }

  const groups = Array.from(groupMap.values());
  const marked = groups.reduce((s, g) => s + g.receivedCartonQty, 0);

  return {
    taskId: id,
    devanningNo: order.devanningNo || order.orderNo,
    containerNo: order.containerNo,
    dockId: Number(dockId ?? 3010001),
    dockCode: order.dockCode || 'DOC-LA-001',
    customerName: order.customerName || cargoOrders[0]?.customerName,
    totalBoxQty: Number(order.totalBoxQty || 0),
    markedBoxQty: marked,
    groups,
    pallets: [
      { palletNo: 'PLT-DV-001', groupCode: 'FedEx-LAX', boxQty: 40, status: '${u(0x5728, 0x5e93)}' },
      { palletNo: 'PLT-DV-002', groupCode: 'UPS-ORD', boxQty: 35, status: '${u(0x6253, 0x677f, 0x4e2d)}' }
    ]
  } as DevanningWorkSession;
}

export function receiveByBox(taskId: number | string, payload: { scanCode: string; qty?: number }) {
  const key = recvKey(Number(taskId), payload.scanCode);
  receivedState.set(key, (receivedState.get(key) || 0) + (payload.qty || 1));
  return getDevanningWorkSession(taskId);
}

export function receiveByPallet(
  taskId: number | string,
  payload: { palletNo: string; groupCode: string; boxQty: number }
) {
  return {
    ok: true,
    palletNo: payload.palletNo,
    boxQty: payload.boxQty,
    session: getDevanningWorkSession(taskId)
  };
}

export function startDevanningWork(taskId: number | string) {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId));
  if (order && order.status === 'ARRIVED') {
    order.status = 'DEVANNING';
    order.devanningStartTime = order.devanningStartTime || '2026-06-01 14:00:00';
  }
  return true;
}
`;

fs.writeFileSync(path.join(root, 'src/mock/data/devanning-work.ts'), mockTs, 'utf8');

// ---------- dock task list vue ----------
const dockListVue = `<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NDropdown, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetDevanningWorkTasks } from '@/service/api/wms/devanning-work';
import { fetchGetYardDockList } from '@/service/api/yard/dock';
import { isMockMode } from '@/mock';

defineOptions({ name: 'WmsDevanningWorkDockList' });

const route = useRoute();
const router = useRouter();

const dockId = ref(String(route.query.dockId || '3010001'));
const containerNo = ref('');
const loading = ref(false);
const tasks = ref<Api.Wms.DevanningWorkTask[]>([]);
const dockOptions = ref<Array<{ label: string; value: string }>>([]);

const dockLabel = computed(() => {
  const opt = dockOptions.value.find(o => o.value === dockId.value);
  return opt?.label || dockId.value;
});

const STATUS_TAG: Record<string, 'default' | 'warning' | 'success' | 'info'> = {
  NOT_STARTED: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success'
};

async function loadDocks() {
  const { data } = await fetchGetYardDockList({ pageNum: 1, pageSize: 50 } as any);
  const rows = (data as any)?.rows || [];
  dockOptions.value = rows
    .filter((d: any) => d.dockType === 'DEVANNING' || d.dockCode?.includes('DOC'))
    .map((d: any) => ({ label: d.dockName + ' (' + d.dockCode + ')', value: String(d.id) }));
  if (!dockOptions.value.length) {
    dockOptions.value = [
      { label: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 1 (DOC-LA-001)', value: '3010001' },
      { label: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 2 (DOC-LA-002)', value: '3010002' }
    ];
  }
}

async function loadTasks() {
  loading.value = true;
  const { data } = await fetchGetDevanningWorkTasks({
    dockId: dockId.value,
    containerNo: containerNo.value || undefined
  });
  loading.value = false;
  tasks.value = (data as any)?.rows || [];
}

function onDockChange(val: string) {
  dockId.value = val;
  router.replace({ query: { ...route.query, dockId: val } });
  loadTasks();
}

function handleSearch() {
  loadTasks();
}

function handleReset() {
  containerNo.value = '';
  loadTasks();
}

function enterWork(row: Api.Wms.DevanningWorkTask) {
  router.push({
    name: 'wms_devanning-work-exec',
    query: { dockId: String(row.dockId), taskId: String(row.id), containerNo: row.containerNo }
  });
}

function buildColumns(): DataTableColumns<Api.Wms.DevanningWorkTask> {
  return [
    { key: 'containerNo', title: '${u(0x67dc, 0x53f7)}', width: 140 },
    { key: 'orderType', title: '${u(0x7c7b, 0x578b)}', width: 90 },
    { key: 'totalBoxQty', title: '${u(0x603b, 0x7bb1, 0x6570)}', width: 90, align: 'center' },
    { key: 'markedBoxQty', title: '${u(0x5df2, 0x6253, 0x6807, 0x7bb1, 0x6570)}', width: 110, align: 'center' },
    {
      key: 'workStatus',
      title: '${u(0x62c6, 0x67dc, 0x72b6, 0x6001)}',
      width: 100,
      render: row => (
        <NTag size="small" type={STATUS_TAG[row.workStatus] || 'default'}>
          {row.workStatusLabel}
        </NTag>
      )
    },
    {
      key: 'devanningStartTime',
      title: '${u(0x5f00, 0x59cb, 0x62c6, 0x67dc, 0x65f6, 0x95f4)}',
      width: 160,
      render: row => row.devanningStartTime || '¡ª'
    },
    {
      key: 'devanningFinishTime',
      title: '${u(0x62c6, 0x67dc, 0x5b8c, 0x6210, 0x65f6, 0x95f4)}',
      width: 160,
      render: row => row.devanningFinishTime || '¡ª'
    },
    { key: 'dockCode', title: 'Dock', width: 110 },
    {
      key: 'operate',
      title: '${u(0x64cd, 0x4f5c)}',
      width: 100,
      fixed: 'right',
      render: row => (
        <NDropdown
          trigger="click"
          options={[
            { label: '${u(0x8fdb, 0x5165, 0x62c6, 0x67dc)}', key: 'enter' },
            { label: '${u(0x5361, 0x770b, 0x8be6, 0x60c5)}', key: 'detail' }
          ]}
          onSelect={(key: string) => {
            if (key === 'enter') enterWork(row);
            if (key === 'detail') {
              router.push({ name: 'wms_devanning-order', query: { highlight: row.devanningNo } });
            }
          }}
        >
          <NButton size="small" secondary>
            ${u(0x66f4, 0x591a)}
          </NButton>
        </NDropdown>
      )
    }
  ];
}

const columns = buildColumns();

onMounted(async () => {
  await loadDocks();
  await loadTasks();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px p-16px">
    <NCard :bordered="false" size="small">
      <div class="mb-12px flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="text-18px font-600 m-0">${u(0x4eba, 0x5de5, 0x62c6, 0x67dc, 0x4f5c, 0x4e1a)}</h2>
          <p class="mt-4px text-13px text-#6b7280">Dock£º{{ dockLabel }}</p>
        </div>
        <NFormItem label="ÇÐ»» Dock" label-placement="left" :show-feedback="false" class="mb-0">
          <NSelect
            v-model:value="dockId"
            :options="dockOptions"
            class="w-280px"
            @update:value="onDockChange"
          />
        </NFormItem>
      </div>
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="${u(0x67dc, 0x53f7)}">
          <NInput v-model:value="containerNo" clearable placeholder="${u(0x67dc, 0x53f7)}" class="w-200px" @keydown.enter="handleSearch" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">${u(0x641c, 0x7d22)}</NButton>
          <NButton class="ml-8px" @click="handleReset">${u(0x91cd, 0x7f6e)}</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :bordered="false" size="small" class="sm:flex-1-hidden">
      <template #header-extra>
        <div class="flex flex-wrap gap-8px">
          <NButton secondary type="info">${u(0x84dd, 0x7259, 0x8fde, 0x63a5)}</NButton>
          <NButton secondary type="success">${u(0x5361, 0x677f, 0x8bb0, 0x5f55)}</NButton>
          <NButton type="success" ghost>${u(0x5f00, 0x59cb, 0x62c6, 0x67dc)}</NButton>
          <NButton type="primary">${u(0x8fdb, 0x5165, 0x62c6, 0x67dc)}</NButton>
        </div>
      </template>
      <NDataTable
        :columns="columns"
        :data="tasks"
        :loading="loading"
        :row-key="row => row.id"
        size="small"
        :scroll-x="1100"
        @row-dblclick="enterWork"
      />
      <p class="mt-8px text-12px text-#9ca3af">${u(0x5171)} {{ tasks.length }} ${u(0x6761, 0x4efb, 0x52a1)}£»${u(0x53cc, 0x51fb, 0x8fdb, 0x5165, 0x62c6, 0x67dc, 0x4f5c, 0x4e1a)}</p>
    </NCard>
  </div>
</template>
`;

fs.writeFileSync(path.join(root, 'src/views/wms/devanning-work/dock-task-list.vue'), dockListVue, 'utf8');

// ---------- execute vue ----------
const execVue = `<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NStatistic,
  NTag,
  NSpace,
  NEmpty
} from 'naive-ui';
import {
  fetchGetDevanningWorkSession,
  fetchReceiveDevanningByBox,
  fetchReceiveDevanningByPallet,
  fetchStartDevanningWorkTask
} from '@/service/api/wms/devanning-work';

defineOptions({ name: 'WmsDevanningWorkExec' });

const route = useRoute();
const router = useRouter();

const dockId = computed(() => String(route.query.dockId || ''));
const taskId = computed(() => String(route.query.taskId || ''));
const containerNo = computed(() => String(route.query.containerNo || ''));

const session = ref<Api.Wms.DevanningWorkSession | null>(null);
const loading = ref(false);
const activeGroup = ref('');
const receiveMode = ref<'BOX' | 'PALLET'>('BOX');
const scanCode = ref('');
const palletNo = ref('PLT-DV-NEW');
const palletBoxQty = ref<number | null>(20);

const currentGroup = computed(() =>
  session.value?.groups.find(g => g.groupCode === activeGroup.value) || null
);

const progressText = computed(() => {
  if (!session.value) return '0/0';
  return session.value.markedBoxQty + '/' + session.value.totalBoxQty;
});

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

async function handleReceive() {
  if (!scanCode.value.trim()) {
    window.$message?.warning('${u(0x8bf7, 0x626b, 0x7f29, 0x6216, 0x626b, 0x7a7a, 0x7801, 0x7bb1, 0x53f7, 0x6216, 0x8d27, 0x7801)}');
    return;
  }
  const { data, error } = await fetchReceiveDevanningByBox(taskId.value, {
    scanCode: scanCode.value.trim(),
    qty: 1,
    groupCode: activeGroup.value
  });
  if (error) return;
  session.value = data as Api.Wms.DevanningWorkSession;
  scanCode.value = '';
  window.$message?.success('[${u(0x539f, 0x578b)}] ${u(0x6309, 0x7bb1, 0x6536, 0x8d27, 0x6210, 0x529f)}');
}

async function handlePalletReceive() {
  if (!palletNo.value.trim() || !palletBoxQty.value) {
    window.$message?.warning('${u(0x8bf7, 0x586b, 0x5199, 0x5361, 0x677f, 0x53f7, 0x4e0e, 0x7bb1, 0x6570)}');
    return;
  }
  const { data, error } = await fetchReceiveDevanningByPallet(taskId.value, {
    palletNo: palletNo.value.trim(),
    groupCode: activeGroup.value,
    boxQty: palletBoxQty.value
  });
  if (error) return;
  if (data?.session) session.value = data.session;
  window.$message?.success('[${u(0x539f, 0x578b)}] ${u(0x5361, 0x677f, 0x6536, 0x8d27, 0x6210, 0x529f)}');
}

async function handleStartWork() {
  await fetchStartDevanningWorkTask(taskId.value);
  await loadSession();
  window.$message?.success('${u(0x5df2, 0x5f00, 0x59cb, 0x62c6, 0x67dc)}');
}

function goBack() {
  router.push({ name: 'wms_devanning-work', query: { dockId: dockId.value } });
}

watch(activeGroup, () => {
  scanCode.value = '';
});

onMounted(() => loadSession());
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px bg-#f5f7fa p-16px">
    <NSpace justify="space-between" align="center">
      <div>
        <h2 class="text-20px font-600 m-0">${u(0x62c6, 0x67dc, 0x4f5c, 0x4e1a)}</h2>
        <p class="mt-4px text-13px text-#6b7280">
          ${u(0x67dc, 0x53f7)}£º{{ session?.containerNo || containerNo }} ¡¤ Dock {{ session?.dockCode }}
        </p>
      </div>
      <NSpace>
        <NButton @click="handleStartWork">${u(0x5f00, 0x59cb, 0x62c6, 0x67dc)}</NButton>
        <NButton @click="goBack">${u(0x8fd4, 0x56de, 0x4efb, 0x52a1)}</NButton>
      </NSpace>
    </NSpace>

    <NGrid v-if="session" :cols="24" :x-gap="12" :y-gap="12">
      <NGridItem :span="6">
        <NCard size="small" :title="'${u(0x5206, 0x7ec4)} (' + session.groups.length + ')'">
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
                <div class="text-12px opacity-80">{{ g.receivedCartonQty }}/{{ g.totalCartonQty }} ${u(0x7bb1)}</div>
              </div>
            </NButton>
          </div>
        </NCard>
      </NGridItem>

      <NGridItem :span="10">
        <NCard v-if="currentGroup" size="small" :title="'${u(0x5206, 0x7ec4)}£º' + currentGroup.groupCode">
          <div class="mb-12px rounded bg-#f9fafb p-12px text-13px">
            <p class="m-0 mb-6px">
              <span class="text-#6b7280">${u(0x8d27, 0x7269, 0x8ba2, 0x5355, 0x53f7)}£º</span>
              {{ currentGroup.cargoOrderNos.join('¡¢') || '¡ª' }}
            </p>
            <p class="m-0">
              <span class="text-#6b7280">${u(0x8d27, 0x4ef6, 0x53f7)}£º</span>
              {{ currentGroup.shipmentNos.join('¡¢') || '¡ª' }}
            </p>
          </div>

          <NRadioGroup v-model:value="receiveMode" class="mb-12px">
            <NRadioButton value="BOX">${u(0x6309, 0x7bb1, 0x6536, 0x8d27)}</NRadioButton>
            <NRadioButton value="PALLET">${u(0x6309, 0x5361, 0x677f, 0x6536, 0x8d27)}</NRadioButton>
          </NRadioGroup>

          <template v-if="receiveMode === 'BOX'">
            <NForm label-placement="top">
              <NFormItem :label="'${u(0x626b, 0x7a7a, 0x7801)}/${u(0x8f93, 0x5165)}£¨${u(0x8d27, 0x4ef6)}/${u(0x7bb1, 0x53f7)}£©'">
                <NInput
                  v-model:value="scanCode"
                  size="large"
                  clearable
                  placeholder="Shipment / PO / ${u(0x7bb1, 0x53f7)}"
                  @keydown.enter="handleReceive"
                />
              </NFormItem>
            </NForm>
            <NButton type="primary" size="large" block class="mt-8px" @click="handleReceive">
              ${u(0x786e, 0x8ba4, 0x6536, 0x8d27)}
            </NButton>
          </template>

          <template v-else>
            <NForm label-placement="top">
              <NFormItem label="${u(0x5361, 0x677f, 0x53f7)}">
                <NInput v-model:value="palletNo" size="large" />
              </NFormItem>
              <NFormItem label="${u(0x6536, 0x8d27, 0x7bb1, 0x6570)}">
                <NInputNumber v-model:value="palletBoxQty" size="large" class="w-full" :min="1" />
              </NFormItem>
            </NForm>
            <NButton type="primary" size="large" block class="mt-8px" @click="handlePalletReceive">
              ${u(0x5361, 0x677f, 0x6536, 0x8d27)}
            </NButton>
          </template>

          <NDataTable
            class="mt-16px"
            size="small"
            :columns="[
              { title: '${u(0x8d27, 0x4ef6)}', key: 'shipmentNo', width: 120 },
              { title: '${u(0x8d27, 0x7269)}', key: 'cargoOrderNo', width: 130 },
              { title: '${u(0x7bb1, 0x6570)}', key: 'cartonQty', width: 70, align: 'center' },
              { title: '${u(0x5df2, 0x6536)}', key: 'receivedQty', width: 70, align: 'center' }
            ]"
            :data="currentGroup.items"
            :pagination="false"
          />
        </NCard>
        <NEmpty v-else description="${u(0x8bf7, 0x5148, 0x9009, 0x62e9, 0x4e00, 0x4e2a, 0x5206, 0x7ec4)}" />
      </NGridItem>

      <NGridItem :span="8">
        <NCard size="small" :title="'${u(0x8fdb, 0x5ea6)}'">
          <NStatistic label="${u(0x7bb1, 0x6570, 0x8fdb, 0x5ea6)}" :value="progressText" class="mb-12px" />
          <NDataTable
            size="small"
            :data="session.pallets"
            :columns="[
              { title: '${u(0x5361, 0x677f, 0x53f7)}', key: 'palletNo' },
              { title: '${u(0x5206, 0x7ec4)}', key: 'groupCode' },
              { title: '${u(0x7bb1, 0x6570)}', key: 'boxQty', align: 'center' },
              { title: '${u(0x72b6, 0x6001)}', key: 'status' }
            ]"
          />
        </NCard>
      </NGridItem>
    </NGrid>

    <NEmpty v-else-if="!loading" description="${u(0x672a, 0x627e, 0x5230, 0x4f5c, 0x4e1a, 0x6570, 0x636e)}" class="py-40px" />
  </div>
</template>
`;

fs.writeFileSync(path.join(root, 'src/views/wms/devanning-work/execute.vue'), execVue, 'utf8');

// index redirect
fs.writeFileSync(
  path.join(root, 'src/views/wms/devanning-work/index.vue'),
  `<script setup lang="ts">
import DockTaskList from './dock-task-list.vue';
defineOptions({ name: 'WmsDevanningWork' });
</script>
<template>
  <DockTaskList />
</template>
`,
  'utf8'
);

console.log('wrote devanning work pages');
