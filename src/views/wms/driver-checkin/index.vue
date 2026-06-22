<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NGi, NGrid, NInput, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  fetchGetDriverCheckinList,
  fetchGetDriverCheckinStats,
  fetchSubmitDriverCheckin
} from '@/service/api/wms/outbound-mgmt';
import { CHECKIN_METHOD_META, CHECKIN_STATUS_META } from '../outbound-mgmt/constants';

defineOptions({ name: 'WmsDriverCheckin' });

const CHECKIN_METHODS = [
  { key: 'ONSITE', label: '现场 Check-in' },
  { key: 'APP', label: 'APP Check-in' },
  { key: 'SELF_PICKUP', label: '自提预约 Check-in' }
] as const;

const stats = ref<Api.Wms.DriverCheckinStats | null>(null);
const activeMethod = ref<string>('ONSITE');
const loading = ref(false);
const rows = ref<Api.Wms.DriverCheckinRow[]>([]);
const selectedId = ref<CommonType.IdType | null>(null);

const scanTripNo = ref('');
const driverName = ref('');
const driverPhone = ref('');
const plateNo = ref('');
const selfPickupNo = ref('');

const kpiCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { label: '今日预约司机', value: s.todayAppointments, color: '#2563eb' },
    { label: '已Check-in', value: s.checkedIn, color: '#16a34a' },
    { label: '现场Check-in', value: s.onsite, color: '#0284c7' },
    { label: 'APP Check-in', value: s.app, color: '#7c3aed' },
    { label: '自提预约', value: s.selfPickup, color: '#f59e0b' },
    { label: '等待DOCK', value: s.waitingDock, color: '#ea580c' },
    { label: '异常Check-in', value: s.exception, color: '#dc2626' }
  ];
});

const selectedRow = computed(() => rows.value.find(r => r.id === selectedId.value) ?? null);

const columns: DataTableColumns<Api.Wms.DriverCheckinRow> = [
  {
    key: 'tripNo',
    title: '车次号',
    width: 130,
    fixed: 'left',
    render: row => (
      <NButton text type="primary" onClick={() => { selectedId.value = row.id; }}>
        {row.tripNo}
      </NButton>
    )
  },
  { key: 'driverName', title: '司机', width: 90 },
  { key: 'driverPhone', title: '手机号', width: 130 },
  { key: 'plateNo', title: '车牌', width: 96 },
  { key: 'supplierName', title: '供应商', width: 130, ellipsis: { tooltip: true } },
  {
    key: 'checkinMethod',
    title: 'Check-in方式',
    width: 120,
    render: row => {
      const m = CHECKIN_METHOD_META[row.checkinMethod];
      return <NTag size="small" type={m?.type || 'default'}>{m?.label || row.checkinMethod}</NTag>;
    }
  },
  { key: 'checkinTime', title: 'Check-in时间', width: 150, render: r => r.checkinTime || '—' },
  { key: 'appointmentTime', title: '预约时间', width: 150 },
  {
    key: 'currentStatus',
    title: '当前状态',
    width: 100,
    render: row => {
      const m = CHECKIN_STATUS_META[row.currentStatus] || CHECKIN_STATUS_META.PENDING;
      return <NTag size="small" type={m.type}>{m.label}</NTag>;
    }
  },
  { key: 'dockNo', title: 'DOCK', width: 72, render: r => r.dockNo || '—' },
  {
    key: 'action',
    title: '操作',
    width: 100,
    fixed: 'right',
    render: row =>
      row.currentStatus === 'PENDING' ? (
        <NButton size="tiny" type="primary" onClick={() => quickCheckin(row)}>签到</NButton>
      ) : (
        '—'
      )
  }
];

async function loadStats() {
  const { data } = await fetchGetDriverCheckinStats();
  stats.value = data ?? null;
}

async function loadList() {
  loading.value = true;
  try {
    const { data } = await fetchGetDriverCheckinList({
      pageNum: 1,
      pageSize: 50,
      checkinMethod: activeMethod.value
    });
    rows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([loadStats(), loadList()]);
}

async function submitCheckin(payload: Record<string, any>) {
  const { data, error } = await fetchSubmitDriverCheckin(payload);
  if (!error && data?.success) {
    window.$message?.success(data.message);
    scanTripNo.value = '';
    driverName.value = '';
    driverPhone.value = '';
    plateNo.value = '';
    await refreshAll();
  }
}

function quickCheckin(row: Api.Wms.DriverCheckinRow) {
  submitCheckin({ tripNo: row.tripNo, method: row.checkinMethod, driverName: row.driverName, plateNo: row.plateNo });
}

async function handleOnsiteCheckin() {
  if (!scanTripNo.value.trim()) {
    window.$message?.warning('请扫描或输入车次号');
    return;
  }
  await submitCheckin({
    tripNo: scanTripNo.value.trim(),
    method: 'ONSITE',
    driverName: driverName.value,
    driverPhone: driverPhone.value,
    plateNo: plateNo.value
  });
}

async function handleAppCheckin() {
  if (!scanTripNo.value.trim()) {
    window.$message?.warning('请输入车次号');
    return;
  }
  await submitCheckin({ tripNo: scanTripNo.value.trim(), method: 'APP', gpsVerified: true });
}

async function handleSelfPickupCheckin() {
  if (!selfPickupNo.value.trim()) {
    window.$message?.warning('请输入自提预约号');
    return;
  }
  await submitCheckin({ tripNo: scanTripNo.value.trim() || undefined, method: 'SELF_PICKUP', selfPickupNo: selfPickupNo.value });
}

onMounted(refreshAll);
</script>

<template>
  <div class="checkin-page h-full flex-col-stretch gap-12px overflow-hidden">
    <NGrid :x-gap="10" :y-gap="10" cols="2 s:4 m:7" responsive="screen" class="flex-shrink-0">
      <NGi v-for="card in kpiCards" :key="card.label">
        <NCard :bordered="false" size="small">
          <div class="text-20px font-700" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="text-12px text-#6b7280 mt-4px">{{ card.label }}</div>
        </NCard>
      </NGi>
    </NGrid>

    <NCard :bordered="false" size="small" class="flex-shrink-0">
      <NTabs v-model:value="activeMethod" type="line" @update:value="loadList">
        <NTab v-for="m in CHECKIN_METHODS" :key="m.key" :name="m.key" :tab="m.label" />
      </NTabs>

      <div v-if="activeMethod === 'ONSITE'" class="mt-12px scan-panel">
        <div class="text-13px font-600 mb-8px">现场 Check-in · 扫描车次二维码</div>
        <div class="flex flex-wrap gap-8px items-end">
          <NFormItem label="车次号" :show-feedback="false" class="w-180px">
            <NInput v-model:value="scanTripNo" placeholder="扫描/输入车次号" />
          </NFormItem>
          <NFormItem label="司机姓名" :show-feedback="false" class="w-120px">
            <NInput v-model:value="driverName" />
          </NFormItem>
          <NFormItem label="手机号" :show-feedback="false" class="w-140px">
            <NInput v-model:value="driverPhone" />
          </NFormItem>
          <NFormItem label="车牌" :show-feedback="false" class="w-120px">
            <NInput v-model:value="plateNo" />
          </NFormItem>
          <NButton type="primary" @click="handleOnsiteCheckin">完成签到</NButton>
        </div>
      </div>

      <div v-else-if="activeMethod === 'APP'" class="mt-12px scan-panel">
        <NAlert type="info" :bordered="false" class="mb-8px">
          司机 APP 到仓 Check-in：校验 GPS 在仓范围内、允许签到时段、车次司机身份。
        </NAlert>
        <NSpace>
          <NInput v-model:value="scanTripNo" placeholder="车次号（模拟 APP 签到）" class="w-200px" />
          <NButton type="primary" @click="handleAppCheckin">模拟 APP 签到</NButton>
        </NSpace>
      </div>

      <div v-else class="mt-12px scan-panel">
        <div class="text-13px font-600 mb-8px">自提预约 Check-in</div>
        <NSpace>
          <NInput v-model:value="selfPickupNo" placeholder="自提预约号 SPU-xxxx" class="w-180px" />
          <NInput v-model:value="scanTripNo" placeholder="车次号（可选）" class="w-160px" />
          <NButton type="primary" @click="handleSelfPickupCheckin">扫码签到</NButton>
        </NSpace>
      </div>
    </NCard>

    <div class="checkin-body flex flex-1 gap-12px min-h-0 overflow-hidden">
      <NCard :bordered="false" size="small" class="flex-1 min-w-0">
        <NDataTable
          :columns="columns"
          :data="rows"
          :loading="loading"
          :row-key="(r: Api.Wms.DriverCheckinRow) => r.id"
          :scroll-x="1200"
          size="small"
          flex-height
          :row-props="(row: Api.Wms.DriverCheckinRow) => ({ style: selectedId === row.id ? 'background:#eff6ff' : '', onClick: () => { selectedId = row.id; } })"
        />
      </NCard>
      <NCard v-if="selectedRow" :bordered="false" size="small" class="w-300px flex-shrink-0">
        <div class="text-13px font-600 mb-8px">Check-in 详情</div>
        <NDescriptions :column="1" size="small" bordered>
          <NDescriptionsItem label="车次号">{{ selectedRow.tripNo }}</NDescriptionsItem>
          <NDescriptionsItem label="司机">{{ selectedRow.driverName }}</NDescriptionsItem>
          <NDescriptionsItem label="手机">{{ selectedRow.driverPhone }}</NDescriptionsItem>
          <NDescriptionsItem label="方式">
            {{ CHECKIN_METHOD_META[selectedRow.checkinMethod]?.label }}
          </NDescriptionsItem>
          <NDescriptionsItem label="GPS校验">
            {{ selectedRow.gpsVerified ? '通过' : selectedRow.checkinMethod === 'APP' ? '待校验' : '—' }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="selectedRow.selfPickupNo" label="自提预约号">{{ selectedRow.selfPickupNo }}</NDescriptionsItem>
          <NDescriptionsItem label="DOCK">{{ selectedRow.dockNo || '待分配' }}</NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.checkin-body :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
</style>
