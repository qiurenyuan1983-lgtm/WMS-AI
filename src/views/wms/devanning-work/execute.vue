<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NEmpty, NModal, NProgress, NTag } from 'naive-ui';
import {
  fetchCompleteDevanningWorkTask,
  fetchGetDevanningWorkTasks,
  fetchGetDevanningWorkSession,
  fetchReceiveDevanningByBox,
  fetchReceiveDevanningByPallet,
  fetchStartDevanningWorkTask
} from '@/service/api/wms/devanning-work';
import {
  buildDevanningExecQuery,
  pickDevanningExecTask
} from './utils/resolve-exec-task';
import BoxScanDetailPanel from './modules/box-scan-detail-panel.vue';
import GroupPalletLabelForm from './modules/group-pallet-label-form.vue';
import PalletHistoryDrawer from './modules/pallet-history-drawer.vue';
import { useDevanningWorkI18n, type DevanningWorkLocale } from './composables/use-devanning-work-i18n';

defineOptions({ name: 'WmsDevanningWorkExec' });

const route = useRoute();
const router = useRouter();
const { locale, setLocale, t, DEVANNING_WORK_LOCALE_OPTIONS } = useDevanningWorkI18n();

const dockId = computed(() => String(route.query.dockId || ''));
const taskId = computed(() => String(route.query.taskId || ''));
const containerNo = computed(() => String(route.query.containerNo || ''));

const session = ref<Api.Wms.DevanningWorkSession | null>(null);
const loading = ref(false);
const palletDrawerVisible = ref(false);
const groupFormVisible = ref(false);
const activeGroupCode = ref('');
const selectedGroupCode = ref<string | null>(null);
const formOpenKey = ref(0);
const formInitialQty = ref<number | null>(null);

const scanInput = ref('');
const scanPanelRef = ref<{ focusScan: () => void } | null>(null);
const scanLoading = ref(false);
const lastScanHint = ref('');

const displayContainerNo = computed(() => session.value?.containerNo || containerNo.value || '—');

const activeGroup = computed(() =>
  session.value?.groups.find(g => g.groupCode === activeGroupCode.value) || null
);

const boxScans = computed(() => session.value?.boxScans || []);

const visibleBoxScans = computed(() => {
  if (!selectedGroupCode.value) return [];
  return boxScans.value.filter(s => s.groupCode === selectedGroupCode.value);
});

const canLabelEntry = computed(() => {
  return Boolean(selectedGroupCode.value) && workPhase.value !== 'finished' && visibleBoxScans.value.length > 0;
});

const progressPercent = computed(() => {
  if (!session.value?.totalBoxQty) return 0;
  return Math.min(100, Math.round((session.value.markedBoxQty / session.value.totalBoxQty) * 100));
});

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

function groupScanCount(groupCode: string) {
  return boxScans.value.filter(s => s.groupCode === groupCode).reduce((sum, s) => sum + s.qty, 0);
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
  window.$message?.success(t('startedSuccess'));
  focusScanInput();
}

async function handleCompleteWork() {
  const { data, error } = await fetchCompleteDevanningWorkTask(taskId.value);
  if (error || !data) return;
  session.value = data;
  window.$message?.success(t('completedSuccess'));
}

function goBack() {
  router.push({ name: 'wms_devanning-work', query: { dockId: dockId.value } });
}

function focusScanInput() {
  scanPanelRef.value?.focusScan();
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

async function handleGroupClick(groupCode: string) {
  if (workPhase.value === 'finished') {
    window.$message?.warning(t('workFinishedWarning'));
    return;
  }
  selectedGroupCode.value = groupCode;
  lastScanHint.value = '';
  if (!(await ensureWorkStarted())) return;
  openGroupModal(groupCode);
}

function openScanLabelEntry() {
  if (!selectedGroupCode.value) {
    window.$message?.warning(t('selectDestFirst'));
    return;
  }
  handleGroupClick(selectedGroupCode.value);
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
    window.$message?.warning(t('workFinishedWarning'));
    return;
  }
  if (!selectedGroupCode.value) {
    window.$message?.warning(t('selectDestFirst'));
    focusScanInput();
    return;
  }

  scanLoading.value = true;
  if (!(await ensureWorkStarted())) {
    scanLoading.value = false;
    focusScanInput();
    return;
  }

  const isPallet = /^PLT-/i.test(code);
  const { data, error } = isPallet
    ? await fetchReceiveDevanningByPallet(taskId.value, {
        palletNo: code,
        groupCode: selectedGroupCode.value
      })
    : await fetchReceiveDevanningByBox(taskId.value, {
        scanCode: code,
        qty: 1,
        groupCode: selectedGroupCode.value
      });

  scanLoading.value = false;

  if (error || !data) {
    focusScanInput();
    return;
  }

  session.value = data;
  const latest = data.boxScans?.[0];
  if (latest) {
    lastScanHint.value = t('boxScanSuccess', { group: latest.groupCode });
  }
  scanInput.value = '';
  focusScanInput();
}

function onLabelCreated(result: Api.Wms.DevanningGroupPalletLabelResult) {
  session.value = result.session;
  lastScanHint.value = '';
  closeGroupForm();
}

async function ensureExecTaskFromDock() {
  if (taskId.value || !dockId.value) return;
  const { data } = await fetchGetDevanningWorkTasks({ dockId: dockId.value });
  const rows = (data as Api.Wms.DevanningWorkTaskList | undefined)?.rows ?? [];
  const task = pickDevanningExecTask(rows, dockId.value);
  if (!task) {
    window.$message?.warning('该 Dock 暂无可用拆柜任务');
    router.replace({ name: 'wms_devanning-work', query: { dockId: dockId.value } });
    return;
  }
  await router.replace({
    name: 'wms_devanning-work-exec',
    query: buildDevanningExecQuery(task)
  });
  await nextTick();
}

onMounted(async () => {
  await ensureExecTaskFromDock();
  await loadSession();
  if (session.value?.groups.length && !selectedGroupCode.value) {
    selectedGroupCode.value = session.value.groups[0].groupCode;
  }
  if (workPhase.value !== 'finished') focusScanInput();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px bg-#f5f7fa p-16px">
    <NCard size="small" :bordered="false" class="exec-hero-card">
      <div class="exec-hero">
        <div class="exec-hero-side exec-hero-left">
          <div class="exec-left-stack">
            <NButton secondary @click="goBack">{{ t('backToTasks') }}</NButton>
            <div class="exec-primary-actions">
              <NButton secondary type="info" size="medium">{{ t('bluetooth') }}</NButton>
              <NButton secondary size="medium" @click="palletDrawerVisible = true">{{ t('palletHistory') }}</NButton>
              <NButton
                v-if="workPhase === 'not_started'"
                type="primary"
                size="medium"
                @click="handleStartWork"
              >
                {{ t('startWork') }}
              </NButton>
              <NButton
                v-else-if="workPhase === 'in_progress'"
                type="success"
                size="medium"
                @click="handleCompleteWork"
              >
                {{ t('completeWork') }}
              </NButton>
              <NTag v-else type="success" size="medium">{{ t('workFinishedTag') }}</NTag>
            </div>
          </div>
        </div>

        <div class="exec-hero-center">
          <div class="container-no-display">{{ displayContainerNo }}</div>
          <p v-if="session" class="exec-meta m-0 mt-8px">
            {{ t('dock') }} {{ session.dockCode }}
            <span v-if="session.devanningStartTime" class="ml-12px">
              {{ t('startAt') }}：{{ session.devanningStartTime }}
            </span>
            <span v-if="session.devanningFinishTime" class="ml-12px">
              {{ t('finishAt') }}：{{ session.devanningFinishTime }}
            </span>
          </p>
        </div>

        <div class="exec-hero-side exec-hero-right">
          <div class="lang-switch">
            <NButton
              v-for="opt in DEVANNING_WORK_LOCALE_OPTIONS"
              :key="opt.value"
              size="small"
              :type="locale === opt.value ? 'primary' : 'default'"
              :secondary="locale !== opt.value"
              @click="setLocale(opt.value as DevanningWorkLocale)"
            >
              {{ t(opt.labelKey) }}
            </NButton>
          </div>
        </div>
      </div>

    </NCard>

    <NCard v-if="session" size="small" :bordered="false">
      <div class="receive-progress-block">
        <div class="text-14px font-600 mb-8px">{{ t('receiveProgress') }}</div>
        <div class="flex flex-wrap items-center gap-16px">
          <span class="text-15px font-600">
            {{ session.markedBoxQty }} / {{ session.totalBoxQty }} {{ t('boxesUnit') }}
          </span>
          <div class="min-w-160px flex-1">
            <NProgress type="line" :percentage="progressPercent" :show-indicator="true" />
          </div>
        </div>
      </div>
    </NCard>

    <div v-if="session" class="work-main">
      <NCard size="small" :bordered="false" class="work-main-scans" :content-style="{ padding: '12px 14px' }">
        <BoxScanDetailPanel
          ref="scanPanelRef"
          v-model:scan-value="scanInput"
          :scans="visibleBoxScans"
          :group-code="selectedGroupCode"
          :label-entry-disabled="!canLabelEntry"
          :scan-loading="scanLoading"
          :scan-hint="lastScanHint"
          :scan-disabled="workPhase === 'finished'"
          :t="t"
          @label-entry="openScanLabelEntry"
          @scan-submit="submitScan"
        />
      </NCard>

      <NCard size="small" :title="t('selectDestGroup')" :bordered="false" class="work-main-groups">
        <div class="group-grid-main">
          <div
            v-for="g in session.groups"
            :key="g.groupCode"
            role="button"
            tabindex="0"
            class="group-cell-wrap"
            :class="{
              'group-cell-selected': selectedGroupCode === g.groupCode,
              'opacity-70': workPhase === 'finished'
            }"
            @click="handleGroupClick(g.groupCode)"
            @keydown.enter="handleGroupClick(g.groupCode)"
          >
            <NCard size="small" hoverable class="group-cell-main">
              <div class="text-18px font-600 mb-8px truncate">{{ g.groupCode }}</div>
              <div class="group-locations">
                <span class="group-locations-label">{{ t('recommendedLocations') }}</span>
                <div v-if="g.recommendedLocations?.length" class="group-locations-tags">
                  <NTag
                    v-for="loc in g.recommendedLocations"
                    :key="loc"
                    size="small"
                    type="info"
                    :bordered="false"
                  >
                    {{ loc }}
                  </NTag>
                </div>
                <span v-else class="group-locations-empty">{{ t('noRecommendedLocation') }}</span>
              </div>
              <NProgress type="line" :percentage="groupProgress(g)" :show-indicator="false" class="mb-10px" />
              <div class="group-received">
                <span class="group-received-label">{{ t('received') }}</span>
                <span class="group-received-num">{{ g.totalReceivedQty }}</span>
                <span class="group-received-total">/ {{ g.totalExpectedQty }} {{ t('boxesUnit') }}</span>
              </div>
              <p class="group-scan-stat m-0 mt-8px">
                {{ t('scannedInGroup', { count: groupScanCount(g.groupCode) }) }}
              </p>
            </NCard>
          </div>
        </div>
      </NCard>
    </div>

    <NEmpty v-else-if="!loading" :description="t('noSessionData')" class="py-40px" />

    <NModal
      v-model:show="groupFormVisible"
      preset="card"
      :title="activeGroup ? t('labelEntryTitle', { group: activeGroup.groupCode }) : t('labelEntryTitle', { group: '' })"
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
.exec-hero-card :deep(.n-card__content) {
  padding-top: 16px;
  padding-bottom: 12px;
}

.exec-hero {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) auto minmax(100px, 1fr);
  align-items: start;
  gap: 12px;
}

.exec-hero-center {
  text-align: center;
  min-width: 0;
}

.exec-hero-side {
  display: flex;
  align-items: flex-start;
}

.exec-hero-left {
  justify-content: flex-start;
}

.exec-left-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.exec-primary-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.exec-primary-actions :deep(.n-button) {
  min-width: 108px;
  height: 40px;
  font-size: 15px;
  padding: 0 18px;
}

.exec-hero-right {
  justify-content: flex-end;
}

.lang-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.container-no-display {
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.15;
  color: #111827;
  word-break: break-all;
}

.exec-meta {
  font-size: 13px;
  color: #6b7280;
}

.receive-progress-block {
  width: 100%;
}

.work-main {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-height: 460px;
}

.work-main-groups {
  flex: 1;
  min-width: 0;
}

.work-main-scans {
  width: 340px;
  flex-shrink: 0;
}

.group-grid-main {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  align-content: start;
  min-height: 360px;
}

.group-locations {
  margin-bottom: 10px;
}

.group-locations-label {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.group-locations-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.group-locations-empty {
  font-size: 12px;
  color: #d1d5db;
}

.group-cell-wrap {
  cursor: pointer;
  min-height: 188px;
  border-radius: 8px;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.group-cell-wrap:focus-visible {
  outline: 2px solid var(--n-color-primary);
  outline-offset: 2px;
}

.group-cell-main {
  height: 100%;
  pointer-events: none;
}

.group-cell-main :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 14px 16px;
  box-sizing: border-box;
}

.group-cell-selected {
  box-shadow: 0 0 0 2px var(--n-color-primary);
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
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: #111827;
}

.group-received-total {
  font-size: 14px;
  color: #6b7280;
}

.group-scan-stat {
  font-size: 12px;
  color: #059669;
}

@media (max-width: 960px) {
  .work-main {
    flex-direction: column;
  }

  .work-main-scans {
    width: 100%;
  }

  .group-grid-main {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
