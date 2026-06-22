<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NGi, NGrid, NInput, NModal, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import {
  fetchAssignTripDock,
  fetchAutoAssignDock,
  fetchGetDockAssignLogs,
  fetchGetDockScheduleOverview,
  fetchGetDockSlotList,
  fetchGetDockWaitingTrips
} from '@/service/api/wms/outbound-mgmt';
import { CARGO_READY_META, DOCK_STATUS_META } from '../outbound-mgmt/constants';

defineOptions({ name: 'WmsDockAutoSchedule' });

const overview = ref<Api.Wms.DockScheduleOverview | null>(null);
const waitingRows = ref<Api.Wms.DockWaitingTripRow[]>([]);
const dockSlots = ref<Api.Wms.DockSlotRow[]>([]);
const logs = ref<Api.Wms.DockAssignLogRow[]>([]);
const loading = ref(false);
const assignModalVisible = ref(false);
const assignTripId = ref<CommonType.IdType | null>(null);
const assignDockNo = ref('');
const assignReason = ref('');

const kpiCards = computed(() => {
  const o = overview.value;
  if (!o) return [];
  return [
    { label: 'DOCK总数', value: o.total, color: '#2563eb' },
    { label: '空闲DOCK', value: o.idle, color: '#16a34a' },
    { label: '已预约', value: o.reserved, color: '#0284c7' },
    { label: '等待车辆', value: o.waiting, color: '#f59e0b' },
    { label: '装车中', value: o.loading, color: '#ea580c' },
    { label: '等待车次', value: o.waitingVehicles, color: '#7c3aed' },
    { label: '暂停', value: o.paused, color: '#9ca3af' },
    { label: '维修', value: o.maintenance, color: '#dc2626' }
  ];
});

const waitingColumns: DataTableColumns<Api.Wms.DockWaitingTripRow> = [
  { key: 'tripNo', title: '车次号', width: 130, fixed: 'left' },
  { key: 'destination', title: '目的地', width: 80 },
  { key: 'customerName', title: '客户', width: 110, ellipsis: { tooltip: true } },
  { key: 'appointmentTime', title: '预约时间', width: 150 },
  { key: 'palletQty', title: '板数', width: 56, align: 'center' },
  { key: 'vehicleType', title: '车型', width: 110 },
  { key: 'checkinTime', title: 'Check-in', width: 150 },
  {
    key: 'waitMinutes',
    title: '等待时长',
    width: 88,
    render: r => <span class={r.waitMinutes > 60 ? 'text-error' : ''}>{r.waitMinutes} 分</span>
  },
  {
    key: 'cargoStatus',
    title: '货物状态',
    width: 88,
    render: r => {
      const m = CARGO_READY_META[r.cargoStatus];
      return <NTag size="small" type={m?.type || 'default'}>{m?.label || r.cargoStatus}</NTag>;
    }
  },
  { key: 'latestFinish', title: '最晚完成', width: 150 },
  { key: 'priority', title: '优先级', width: 72, align: 'center' },
  { key: 'recommendedDock', title: '推荐DOCK', width: 96 },
  {
    key: 'action',
    title: '操作',
    width: 150,
    fixed: 'right',
    render: row => (
      <NSpace size="small">
        <NButton size="tiny" type="primary" onClick={() => autoAssign(row.id)}>自动安排</NButton>
        <NButton size="tiny" onClick={() => openAssign(row.id)}>人工安排</NButton>
      </NSpace>
    )
  }
];

const logColumns: DataTableColumns<Api.Wms.DockAssignLogRow> = [
  { key: 'time', title: '时间', width: 150 },
  { key: 'tripNo', title: '车次号', width: 130 },
  { key: 'dockNo', title: 'DOCK', width: 72 },
  { key: 'action', title: '动作', width: 88 },
  { key: 'operator', title: '操作人', width: 88 },
  { key: 'reason', title: '原因', ellipsis: { tooltip: true }, render: r => r.reason || '—' }
];

async function loadAll() {
  loading.value = true;
  try {
    const [ov, wait, slots, logRes] = await Promise.all([
      fetchGetDockScheduleOverview(),
      fetchGetDockWaitingTrips({ pageNum: 1, pageSize: 20 }),
      fetchGetDockSlotList(),
      fetchGetDockAssignLogs({ pageNum: 1, pageSize: 10 })
    ]);
    overview.value = ov.data ?? null;
    waitingRows.value = wait.data?.rows ?? [];
    dockSlots.value = slots.data ?? [];
    logs.value = logRes.data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

async function autoAssign(id: CommonType.IdType) {
  const { data, error } = await fetchAutoAssignDock(id);
  if (!error && data?.success) {
    window.$message?.success(data.message);
    await loadAll();
  } else if (data && !data.success) {
    window.$message?.warning(data.message);
  }
}

function openAssign(id: CommonType.IdType) {
  assignTripId.value = id;
  assignDockNo.value = '';
  assignReason.value = '';
  assignModalVisible.value = true;
}

async function confirmAssign() {
  if (!assignTripId.value || !assignDockNo.value) return;
  const { data, error } = await fetchAssignTripDock(assignTripId.value, assignDockNo.value, assignReason.value);
  if (!error && data?.success) {
    window.$message?.success(data.message);
    assignModalVisible.value = false;
    await loadAll();
  }
}

onMounted(loadAll);
</script>

<template>
  <div class="dock-page h-full flex-col-stretch gap-12px overflow-auto pb-12px">
    <NGrid :x-gap="10" :y-gap="10" cols="2 s:4 m:8" responsive="screen">
      <NGi v-for="card in kpiCards" :key="card.label">
        <NCard :bordered="false" size="small">
          <div class="text-18px font-700" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="text-12px text-#6b7280">{{ card.label }}</div>
        </NCard>
      </NGi>
    </NGrid>

    <div class="dock-main flex gap-12px min-h-420px">
      <NCard title="等待 DOCK 车次" :bordered="false" size="small" class="flex-1 min-w-0">
        <NDataTable
          :columns="waitingColumns"
          :data="waitingRows"
          :loading="loading"
          :row-key="(r: Api.Wms.DockWaitingTripRow) => r.id"
          :scroll-x="1300"
          size="small"
          :max-height="360"
        />
      </NCard>

      <NCard title="DOCK 实时状态" :bordered="false" size="small" class="w-420px flex-shrink-0">
        <div class="dock-grid">
          <div v-for="dock in dockSlots" :key="dock.id" class="dock-card" :class="`dock-card--${dock.status.toLowerCase()}`">
            <div class="dock-card__no">{{ dock.dockNo }}</div>
            <NTag size="small" :type="(DOCK_STATUS_META[dock.status]?.type || 'default') as any">
              {{ DOCK_STATUS_META[dock.status]?.label || dock.status }}
            </NTag>
            <div class="dock-card__meta">{{ dock.vehicleTypes.join(' / ') }}</div>
            <div class="dock-card__trip">{{ dock.currentTripNo || '—' }}</div>
            <div class="text-11px text-#9ca3af">{{ dock.expectedReleaseTime ? `释放 ${dock.expectedReleaseTime}` : dock.zone }}</div>
          </div>
        </div>
      </NCard>
    </div>

    <NCard title="安排记录 / 调整日志" :bordered="false" size="small">
      <NDataTable :columns="logColumns" :data="logs" :row-key="(r: Api.Wms.DockAssignLogRow) => r.id" size="small" :max-height="200" />
      <div class="mt-8px text-12px text-#6b7280">
        自动安排规则：已 Check-in 优先 · 预约紧急 · 最晚完成最早 · 货物备齐 · DOCK 空闲 · 车型匹配 · 靠近备货区 · VIP/加急优先
      </div>
    </NCard>

    <NModal v-model:show="assignModalVisible" preset="card" title="人工安排 DOCK" class="w-400px">
      <NForm label-width="80" label-placement="left">
        <NFormItem label="DOCK">
          <NSelect
            :to="POPUP_TO_BODY"
            v-model:value="assignDockNo"
            :options="dockSlots.filter(d => ['IDLE','RESERVED','WAITING'].includes(d.status)).map(d => ({ label: d.dockNo, value: d.dockNo }))"
          />
        </NFormItem>
        <NFormItem label="原因">
          <NInput v-model:value="assignReason" type="textarea" placeholder="调整原因" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="assignModalVisible = false">取消</NButton>
          <NButton type="primary" @click="confirmAssign">确认并通知</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.dock-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
}
.dock-card {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  &__no {
    font-weight: 700;
    font-size: 15px;
  }
  &__meta,
  &__trip {
    margin-top: 4px;
    font-size: 12px;
  }
  &--idle {
    border-color: #86efac;
    background: rgb(22 163 74 / 0.06);
  }
  &--loading {
    border-color: #fdba74;
    background: rgb(234 88 12 / 0.06);
  }
}
</style>
