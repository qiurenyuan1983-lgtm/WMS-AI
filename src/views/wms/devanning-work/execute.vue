<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NEmpty, NInput, NModal, NProgress, NSpace, NTag } from 'naive-ui';
import {
  fetchCompleteDevanningWorkTask,
  fetchGetDevanningWorkSession,
  fetchResolveDevanningScan,
  fetchStartDevanningWorkTask
} from '@/service/api/wms/devanning-work';
import GroupPalletLabelForm from './modules/group-pallet-label-form.vue';
import PalletHistoryDrawer from './modules/pallet-history-drawer.vue';

defineOptions({ name: 'WmsDevanningWorkExec' });

const route = useRoute();
const router = useRouter();

const dockId = computed(() => String(route.query.dockId || ''));
const taskId = computed(() => String(route.query.taskId || ''));
const containerNo = computed(() => String(route.query.containerNo || ''));

const session = ref<Api.Wms.DevanningWorkSession | null>(null);
const loading = ref(false);
const palletDrawerVisible = ref(false);
const groupFormVisible = ref(false);
const activeGroupCode = ref('');
const formOpenKey = ref(0);
const formInitialQty = ref<number | null>(null);

const scanInput = ref('');
const scanInputRef = ref<{ focus: () => void } | null>(null);
const scanLoading = ref(false);
const lastScanHint = ref('');

const activeGroup = computed(() =>
  session.value?.groups.find(g => g.groupCode === activeGroupCode.value) || null
);

const progressPercent = computed(() => {
  if (!session.value?.totalBoxQty) return 0;
  return Math.min(100, Math.round((session.value.markedBoxQty / session.value.totalBoxQty) * 100));
});

/** not_started | in_progress | finished */
const workPhase = computed(() => {
  const s = session.value;
  if (!s) return 'not_started';
  if (s.devanningFinishTime || s.status === 'DEVANNED') return 'finished';
  if (s.devanningStartTime || s.status === 'DEVANNING') return 'in_progress';
  return 'not_started';
});

function groupProgress(g: Api.Wms.DevanningWorkGroup) {
  if (!g.totalExpectedQty) return 0;
  return Math.min(100, Math.round((g.totalReceivedQty / g.totalExpectedQty) * 100));
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
}

async function handleStartWork() {
  const { data, error } = await fetchStartDevanningWorkTask(taskId.value);
  if (error || !data) return;
  session.value = data;
  window.$message?.success('已开始拆柜');
  focusScanInput();
}

async function handleCompleteWork() {
  const { data, error } = await fetchCompleteDevanningWorkTask(taskId.value);
  if (error || !data) return;
  session.value = data;
  window.$message?.success('拆柜已完成');
}

function goBack() {
  router.push({ name: 'wms_devanning-work', query: { dockId: dockId.value } });
}

function focusScanInput() {
  nextTick(() => scanInputRef.value?.focus());
}

async function ensureWorkStarted() {
  if (workPhase.value !== 'not_started') return true;
  const { data, error } = await fetchStartDevanningWorkTask(taskId.value);
  if (error || !data) return false;
  session.value = data;
  return true;
}

function openGroupModal(groupCode: string, initialQty?: number | null) {
  formInitialQty.value = initialQty ?? null;
  formOpenKey.value += 1;
  activeGroupCode.value = groupCode;
  groupFormVisible.value = true;
}

async function openGroupForm(groupCode: string) {
  if (workPhase.value === 'finished') {
    window.$message?.warning('拆柜已完成');
    return;
  }
  if (!(await ensureWorkStarted())) return;
  openGroupModal(groupCode);
}

function closeGroupForm() {
  groupFormVisible.value = false;
  activeGroupCode.value = '';
  formInitialQty.value = null;
  focusScanInput();
}

async function submitScan() {
  const code = scanInput.value.trim();
  if (!code || scanLoading.value) return;
  if (workPhase.value === 'finished') {
    window.$message?.warning('拆柜已完成');
    return;
  }

  scanLoading.value = true;
  const { data, error } = await fetchResolveDevanningScan(taskId.value, code);
  scanLoading.value = false;

  if (error || !data) {
    focusScanInput();
    return;
  }

  if (!(await ensureWorkStarted())) {
    focusScanInput();
    return;
  }

  if (!data.groupCode) {
    window.$message?.warning('未识别到对应分组');
    focusScanInput();
    return;
  }

  openGroupModal(data.groupCode, data.qty);
  lastScanHint.value = data.isPallet
    ? `已识别：卡板 ${code} → ${data.groupCode}`
    : `已识别：${data.remark || code} → ${data.groupCode}`;
  scanInput.value = '';
}

function onLabelCreated(result: Api.Wms.DevanningGroupPalletLabelResult) {
  session.value = result.session;
  lastScanHint.value = '';
  closeGroupForm();
}

onMounted(async () => {
  await loadSession();
  if (workPhase.value !== 'finished') focusScanInput();
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
        <NButton secondary @click="palletDrawerVisible = true">板贴历史</NButton>
        <NButton v-if="workPhase === 'not_started'" type="primary" @click="handleStartWork">开始拆柜</NButton>
        <NButton v-else-if="workPhase === 'in_progress'" type="success" @click="handleCompleteWork">拆柜完成</NButton>
        <NTag v-else type="success" size="medium">已拆柜完成</NTag>
        <NButton @click="goBack">返回任务</NButton>
      </NSpace>
    </NSpace>

    <NCard v-if="session" size="small" :bordered="false">
      <div class="scan-progress-row">
        <div v-if="workPhase !== 'finished'" class="scan-col">
          <div class="text-14px font-600 mb-8px">扫码收货</div>
          <NInput
            ref="scanInputRef"
            v-model:value="scanInput"
            size="large"
            placeholder="扫描或输入唛头 / 货件号 / 订单号 / 箱唛 / 卡板号，回车打开对应分组录入"
            :loading="scanLoading"
            clearable
            @keyup.enter="submitScan"
          />
          <p v-if="lastScanHint" class="text-13px text-#059669 m-0 mt-8px">{{ lastScanHint }}</p>
        </div>
        <div class="progress-col" :class="workPhase === 'finished' ? 'progress-col-full' : ''">
          <div class="text-14px font-600 mb-8px">收货进度</div>
          <div class="flex flex-wrap items-center gap-16px">
            <span class="text-15px font-600">{{ session.markedBoxQty }} / {{ session.totalBoxQty }} 箱</span>
            <div class="min-w-160px flex-1">
              <NProgress type="line" :percentage="progressPercent" :show-indicator="true" />
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <NCard v-if="session" size="small" title="选择目的地分组" :bordered="false">
      <div class="group-grid">
        <NCard
          v-for="g in session.groups"
          :key="g.groupCode"
          size="small"
          hoverable
          class="cursor-pointer group-cell"
          :class="workPhase === 'finished' ? 'opacity-70' : ''"
          @click="openGroupForm(g.groupCode)"
        >
          <div class="text-18px font-600 mb-8px truncate">{{ g.groupCode }}</div>
          <NProgress type="line" :percentage="groupProgress(g)" :show-indicator="false" class="mb-8px" />
          <div class="group-received">
            <span class="group-received-label">已收</span>
            <span class="group-received-num">{{ g.totalReceivedQty }}</span>
            <span class="group-received-total">/ {{ g.totalExpectedQty }} 箱</span>
          </div>
        </NCard>
      </div>
    </NCard>

    <NEmpty v-else-if="!loading" description="未找到作业数据" class="py-40px" />

    <NModal
      v-model:show="groupFormVisible"
      preset="card"
      :title="activeGroup ? '录入板贴 · ' + activeGroup.groupCode : '录入板贴'"
      style="width: 520px; max-width: 95vw"
      :mask-closable="false"
      @after-leave="activeGroupCode = ''"
    >
      <GroupPalletLabelForm
        v-if="activeGroup"
        :key="`${activeGroup.groupCode}-${formOpenKey}`"
        :task-id="taskId"
        :group-code="activeGroup.groupCode"
        :group="activeGroup"
        :initial-qty="formInitialQty"
        :disabled="workPhase === 'finished'"
        @cancel="closeGroupForm"
        @success="onLabelCreated"
      />
    </NModal>

    <PalletHistoryDrawer
      v-model:visible="palletDrawerVisible"
      v-model:session="session"
      :task-id="taskId"
      @refreshed="loadSession"
    />
  </div>
</template>

<style scoped>
.scan-progress-row {
  display: flex;
  align-items: stretch;
  gap: 24px;
}

.scan-col {
  flex: 1;
  min-width: 0;
}

.progress-col {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid #e5e7eb;
  padding-left: 24px;
}

.progress-col-full {
  width: 100%;
  border-left: none;
  padding-left: 0;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 16px;
}

.group-cell {
  width: 200px;
  height: 200px;
  box-sizing: border-box;
}

.group-cell :deep(.n-card) {
  width: 100%;
  height: 100%;
}

.group-cell :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 14px;
  box-sizing: border-box;
}

.group-received {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}

.group-received-label {
  font-size: 13px;
  color: #6b7280;
}

.group-received-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: #111827;
}

.group-received-total {
  font-size: 14px;
  color: #6b7280;
}
</style>
