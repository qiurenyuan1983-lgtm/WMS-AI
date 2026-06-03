<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NInput } from 'naive-ui';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';
import {
  addScannedPalletToTrip,
  createOutboundTrip,
  getAllPallets,
  getNextUnscannedPallet,
  getPendingOutboundTrips,
  getScannedUnloadPallets,
  isAllLoaded,
  type OutboundPallet,
  type OutboundTrip
} from '../shared/outbound-mock';

defineOptions({ name: 'PdaOutbound' });

type OutboundStep = 0 | 1 | 2 | 3 | 4;

const STEPS = ['车次', '车厢', '详情', '装车', '完成'] as const;

const route = useRoute();
const router = useRouter();

const biz = computed(() => String(route.query.biz || 'transfer'));
const currentStep = ref<OutboundStep>(0);
const scanDisplay = ref('');
const pendingTrips = ref(getPendingOutboundTrips());
const activeTrip = ref<OutboundTrip | null>(null);
const carriageNo = ref('');
const expandedLocations = ref<string[]>([]);
const submitting = ref(false);
const dockVerified = ref(false);
const dockScanDisplay = ref('');
const loadPalletScanDisplay = ref('');
const progressOpMenuOpen = ref(false);
const showAddPalletPanel = ref(false);
const addPalletScanDisplay = ref('');
const showFinishPhotoOverlay = ref(false);
const finishPhotoUploaded = ref(false);
const showUploadPhotoOverlay = ref(false);
const uploadPhotoReady = ref(false);
const tripPhotoCount = ref(0);

const headerInfo = computed(() => ({
  tripNo: activeTrip.value?.tripNo ?? '—',
  carriageNo: carriageNo.value || '—',
  dockNo: activeTrip.value?.dockNo ?? '—'
}));

const loadingBatch = computed(() =>
  activeTrip.value ? getScannedUnloadPallets(activeTrip.value) : []
);

const allLoaded = computed(() => (activeTrip.value ? isAllLoaded(activeTrip.value) : false));

const remainingCount = computed(() => {
  if (!activeTrip.value) return 0;
  return activeTrip.value.locations.flatMap(l => l.pallets).filter(p => !p.loaded).length;
});

const totalPalletCount = computed(() =>
  activeTrip.value ? getAllPallets(activeTrip.value).length : 0
);

const loadedCount = computed(() =>
  activeTrip.value ? getAllPallets(activeTrip.value).filter(p => p.loaded).length : 0
);

const loadProgressPercent = computed(() => {
  const total = totalPalletCount.value;
  return total ? Math.round((loadedCount.value / total) * 100) : 0;
});

const verifiedPalletCount = computed(() =>
  activeTrip.value
    ? getAllPallets(activeTrip.value).filter(p => !p.loaded && p.scanned).length
    : 0
);

const loadStowedCount = computed(() => loadingBatch.value.filter(p => p.loadScanned).length);

const allLoadBatchScanned = computed(
  () => loadingBatch.value.length > 0 && loadingBatch.value.every(p => p.loadScanned)
);

const canConfirmLoad = computed(() => dockVerified.value && allLoadBatchScanned.value);

function goBack() {
  if (currentStep.value > 0 && currentStep.value < 4) {
    currentStep.value = 0;
    resetSession(false);
    return;
  }
  router.push({ name: 'pda_business', query: { biz: biz.value } });
}

function resetSession(full = true) {
  scanDisplay.value = '';
  activeTrip.value = null;
  carriageNo.value = '';
  expandedLocations.value = [];
  progressOpMenuOpen.value = false;
  showAddPalletPanel.value = false;
  addPalletScanDisplay.value = '';
  showFinishPhotoOverlay.value = false;
  finishPhotoUploaded.value = false;
  showUploadPhotoOverlay.value = false;
  uploadPhotoReady.value = false;
  tripPhotoCount.value = 0;
  if (full) {
    currentStep.value = 0;
    pendingTrips.value = getPendingOutboundTrips();
  }
}

function blockManualInput(e: KeyboardEvent) {
  e.preventDefault();
}

function selectTrip(trip: OutboundTrip) {
  activeTrip.value = createOutboundTrip(trip.tripNo) ?? null;
  if (!activeTrip.value) return;
  carriageNo.value = activeTrip.value.carriageNo;
  scanDisplay.value = activeTrip.value.tripNo;
  currentStep.value = 1;
}

function mockScanTrip() {
  const trip = pendingTrips.value[0];
  if (!trip) {
    window.$message?.warning('暂无待出库车次');
    return;
  }
  selectTrip(trip);
  window.$message?.success(`已扫描车次 ${trip.tripNo}`);
}

function confirmCarriage() {
  if (!activeTrip.value) return;
  const val = carriageNo.value.trim();
  if (!val) {
    window.$message?.warning('请输入车厢号');
    return;
  }
  activeTrip.value.carriageNo = val;
  currentStep.value = 2;
}

function toggleLocation(code: string) {
  const idx = expandedLocations.value.indexOf(code);
  if (idx >= 0) {
    expandedLocations.value.splice(idx, 1);
  } else {
    expandedLocations.value.push(code);
  }
}

function isLocationExpanded(code: string) {
  return expandedLocations.value.includes(code);
}

function mockScanPallet(pallet: OutboundPallet) {
  if (pallet.loaded) {
    window.$message?.info('该卡板已装车');
    return;
  }
  pallet.scanned = true;
  window.$message?.success(`已扫描 ${pallet.palletNo}`);
}

function mockScanNextPallet() {
  if (!activeTrip.value) return;
  const next = getNextUnscannedPallet(activeTrip.value);
  if (!next) {
    window.$message?.info('没有待扫描的卡板');
    return;
  }
  mockScanPallet(next);
  const loc = activeTrip.value.locations.find(l => l.pallets.includes(next));
  if (loc && !isLocationExpanded(loc.locationCode)) {
    expandedLocations.value.push(loc.locationCode);
  }
}

function resetLoadScanState() {
  dockVerified.value = false;
  dockScanDisplay.value = '';
  loadPalletScanDisplay.value = '';
  loadingBatch.value.forEach(p => {
    p.loadScanned = false;
  });
}

function enterLoading() {
  if (!loadingBatch.value.length) {
    window.$message?.warning('请先扫描至少一块待装车卡板');
    return;
  }
  resetLoadScanState();
  currentStep.value = 3;
}

function mockScanDock() {
  if (!activeTrip.value) return;
  dockScanDisplay.value = activeTrip.value.dockNo;
  dockVerified.value = true;
  window.$message?.success(`道口核对 ${activeTrip.value.dockNo}`);
}

function mockScanLoadPallet(pallet: OutboundPallet) {
  if (!pallet.loadScanned) {
    pallet.loadScanned = true;
    loadPalletScanDisplay.value = pallet.palletNo;
    window.$message?.success(`已装车扫描 ${pallet.palletNo}`);
  }
}

function mockScanNextLoadPallet() {
  const next = loadingBatch.value.find(p => !p.loadScanned);
  if (!next) {
    window.$message?.info('本次装车卡板已全部扫描装车');
    return;
  }
  mockScanLoadPallet(next);
}

function confirmLoadBatch() {
  if (!dockVerified.value) {
    window.$message?.warning('请先扫描道口核对');
    return;
  }
  if (!allLoadBatchScanned.value) {
    window.$message?.warning('请先扫描本次装车的全部卡板贴完成装车');
    return;
  }
  if (!activeTrip.value || !loadingBatch.value.length) return;
  const count = loadingBatch.value.length;
  submitting.value = true;
  window.setTimeout(() => {
    loadingBatch.value.forEach(p => {
      p.loaded = true;
      p.scanned = false;
      p.loadScanned = false;
    });
    submitting.value = false;
    dockVerified.value = false;
    dockScanDisplay.value = '';
    loadPalletScanDisplay.value = '';
    window.$message?.success(`已装车 ${count} 板`);
    currentStep.value = 2;
  }, 400);
}

function continueOutbound() {
  currentStep.value = 2;
}

function toggleProgressOpMenu() {
  progressOpMenuOpen.value = !progressOpMenuOpen.value;
}

function closeProgressOpMenu() {
  progressOpMenuOpen.value = false;
}

function handleUploadPhoto() {
  closeProgressOpMenu();
  uploadPhotoReady.value = false;
  showUploadPhotoOverlay.value = true;
}

function mockUploadTripPhoto() {
  uploadPhotoReady.value = true;
}

function confirmUploadPhoto() {
  if (!uploadPhotoReady.value) {
    window.$message?.warning('请先上传照片');
    return;
  }
  tripPhotoCount.value += 1;
  showUploadPhotoOverlay.value = false;
  uploadPhotoReady.value = false;
  window.$message?.success(`[原型] 照片已上传（共 ${tripPhotoCount.value} 张）`);
}

function cancelUploadPhoto() {
  showUploadPhotoOverlay.value = false;
  uploadPhotoReady.value = false;
}

function openAddPalletScan() {
  closeProgressOpMenu();
  showAddPalletPanel.value = true;
  addPalletScanDisplay.value = '';
}

function mockAddPalletScan() {
  if (!activeTrip.value) return;
  const added = addScannedPalletToTrip(activeTrip.value);
  if (!added) return;
  addPalletScanDisplay.value = added.palletNo;
  showAddPalletPanel.value = false;
  const loc = activeTrip.value.locations.find(l => l.pallets.includes(added));
  if (loc && !expandedLocations.value.includes(loc.locationCode)) {
    expandedLocations.value.push(loc.locationCode);
  }
  window.$message?.success(`已添加卡板 ${added.palletNo}，状态：已核对`);
}

function requestFinishLoading() {
  if (!allLoaded.value) {
    window.$message?.warning('仍有货物未装车完成');
    return;
  }
  finishPhotoUploaded.value = false;
  showFinishPhotoOverlay.value = true;
}

function mockUploadFinishPhoto() {
  finishPhotoUploaded.value = true;
  window.$message?.success('[原型] 装车照片已上传');
}

function confirmFinishLoading() {
  if (!finishPhotoUploaded.value) {
    window.$message?.warning('请先上传装车照片');
    return;
  }
  showFinishPhotoOverlay.value = false;
  currentStep.value = 4;
}

function cancelFinishPhoto() {
  showFinishPhotoOverlay.value = false;
  finishPhotoUploaded.value = false;
}

function handleComplete() {
  window.$message?.success('[原型] 出库车次已完成');
  resetSession(true);
}

function stepClass(index: OutboundStep) {
  if (currentStep.value > index) return 'done';
  if (currentStep.value === index) return 'active';
  return 'pending';
}

function isStepDone(index: OutboundStep) {
  return currentStep.value > index;
}

function isStepConnectorDone(index: number) {
  return currentStep.value > index;
}

function getLocationLoadedCount(loc: OutboundTrip['locations'][number]) {
  return loc.pallets.filter(p => p.loaded).length;
}

function getLocationTotalCount(loc: OutboundTrip['locations'][number]) {
  return loc.pallets.length;
}

function getPalletRowClass(pallet: OutboundPallet) {
  if (pallet.loaded) return 'pallet-row-stowed';
  if (pallet.scanned) return 'pallet-row-verified';
  return '';
}
</script>

<template>
  <PdaPhoneShell>
    <div class="outbound-app">
      <header class="outbound-head">
        <button type="button" class="outbound-back" @click="goBack">&larr; 返回</button>
        <h2 class="outbound-title">出库操作</h2>
        <p class="outbound-sub">转运业务 · PDA 扫码出库</p>
      </header>

      <nav v-if="currentStep > 0" class="step-track" aria-label="出库步骤">
        <div v-for="(label, index) in STEPS" :key="label" class="step-track-item">
          <div class="step-track-node-wrap">
            <span
              v-if="index > 0"
              class="step-track-line step-track-line-left"
              :class="{ done: isStepConnectorDone(index - 1) }"
            />
            <span class="step-track-dot" :class="stepClass(index as OutboundStep)">
              <svg v-if="isStepDone(index as OutboundStep)" viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                <path d="M6.2 11.4 3.4 8.6l1-1 1.8 1.8 4.4-4.4 1 1-5.4 5.4z" />
              </svg>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span
              v-if="index < STEPS.length - 1"
              class="step-track-line step-track-line-right"
              :class="{ done: isStepConnectorDone(index) }"
            />
          </div>
          <span class="step-track-label" :class="stepClass(index as OutboundStep)">{{ label }}</span>
        </div>
      </nav>

      <nav v-else class="outbound-steps" aria-label="出库步骤">
        <div
          v-for="(label, index) in STEPS"
          :key="`init-${label}`"
          class="outbound-step"
          :class="stepClass(index as OutboundStep)"
        >
          <span class="outbound-step-dot">{{ index + 1 }}</span>
          <span class="outbound-step-label">{{ label }}</span>
        </div>
      </nav>

      <!-- Step 0: 扫描车次号 -->
      <template v-if="currentStep === 0">
        <section class="scan-cell">
          <h3 class="scan-cell-title">扫描车次号</h3>
          <p class="scan-cell-hint">请扫描出库车次号</p>
          <div class="scan-input-wrap">
            <NInput
              :value="scanDisplay"
              readonly
              placeholder="等待扫描..."
              size="large"
              class="scan-input"
              @keydown="blockManualInput"
              @paste="blockManualInput"
            >
              <template #suffix>
                <span class="scan-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path
                      d="M4 6h2v12H4V6zm14 0h2v12h-2V6zM7 8h10v2H7V8zm0 4h10v2H7v-2zm0 4h7v2H7v-2zM3 4h4v2H3V4zm14 0h4v2h-4V4zm0 14h4v2h-4v-2zM3 18h4v2H3v-2z"
                    />
                  </svg>
                </span>
              </template>
            </NInput>
          </div>
          <NButton type="primary" block size="large" class="action-btn" @click="mockScanTrip">
            模拟扫描
          </NButton>
        </section>

        <section class="trip-list">
          <h3 class="trip-list-title">待出库车次</h3>
          <button
            v-for="trip in pendingTrips"
            :key="trip.tripNo"
            type="button"
            class="trip-item"
            @click="selectTrip(trip)"
          >
            <span class="trip-item-no">{{ trip.tripNo }}</span>
            <span class="trip-item-meta">道口 {{ trip.dockNo }} · 车厢 {{ trip.carriageNo }}</span>
            <span class="trip-item-count">
              {{ trip.locations.reduce((n, l) => n + l.pallets.length, 0) }} 板
            </span>
          </button>
        </section>
      </template>

      <!-- Step 1: 核对车厢 -->
      <template v-else-if="currentStep === 1 && activeTrip">
        <section class="info-banner">
          <dl class="info-banner-dl">
            <dt>车次号</dt>
            <dd>{{ activeTrip.tripNo }}</dd>
            <dt>道口号</dt>
            <dd class="highlight">{{ activeTrip.dockNo }}</dd>
          </dl>
        </section>

        <section class="scan-cell">
          <h3 class="scan-cell-title">核对车厢号</h3>
          <p class="scan-cell-hint">请核对并确认车厢号（可手动修改）</p>
          <div class="scan-input-wrap">
            <NInput
              v-model:value="carriageNo"
              placeholder="车厢号"
              size="large"
              class="scan-input editable"
            >
              <template #suffix>
                <span class="scan-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path
                      d="M4 6h2v12H4V6zm14 0h2v12h-2V6zM7 8h10v2H7V8zm0 4h10v2H7v-2zm0 4h7v2H7v-2zM3 4h4v2H3V4zm14 0h4v2h-4V4zm0 14h4v2h-4v-2zM3 18h4v2H3v-2z"
                    />
                  </svg>
                </span>
              </template>
            </NInput>
          </div>
          <NButton type="primary" block size="large" class="action-btn" @click="confirmCarriage">
            确认车厢
          </NButton>
        </section>
      </template>

      <!-- Step 2: 详情 -->
      <template v-else-if="currentStep === 2 && activeTrip">
        <section class="trip-summary">
          <div class="load-progress-block">
            <div class="load-progress-header">
              <span class="load-progress-label">装车进度</span>
              <div class="progress-op-wrap">
                <button type="button" class="progress-op-btn" @click="toggleProgressOpMenu">
                  操作 ▾
                </button>
                <div v-if="progressOpMenuOpen" class="progress-op-menu">
                  <button type="button" @click="handleUploadPhoto">上传照片</button>
                  <button type="button" @click="openAddPalletScan">添加卡板</button>
                </div>
              </div>
            </div>
            <span class="load-progress-value">{{ loadedCount }} / {{ totalPalletCount }} 板</span>
            <div class="load-progress-bar">
              <span class="load-progress-fill" :style="{ width: `${loadProgressPercent}%` }" />
            </div>
            <p v-if="tripPhotoCount" class="trip-photo-hint">已上传 {{ tripPhotoCount }} 张照片</p>
          </div>
          <div class="verify-summary-row">
            <span class="verify-summary-label">已核对</span>
            <span class="verify-summary-value">{{ verifiedPalletCount }} 板</span>
          </div>
          <dl class="trip-info-grid">
            <div><dt>车次号</dt><dd class="trip-info-val">{{ headerInfo.tripNo }}</dd></div>
            <div><dt>车厢号</dt><dd class="trip-info-val">{{ headerInfo.carriageNo }}</dd></div>
            <div><dt>道口</dt><dd>{{ headerInfo.dockNo }}</dd></div>
            <div class="trip-op-cell">
              <dt>操作</dt>
              <button
                type="button"
                class="trip-load-btn"
                :disabled="!verifiedPalletCount"
                @click="enterLoading"
              >
                装车
              </button>
            </div>
          </dl>
        </section>

        <section v-if="showAddPalletPanel" class="scan-cell add-pallet-panel">
          <h3 class="scan-cell-title">添加卡板</h3>
          <p class="scan-cell-hint">请扫描卡板贴，扫描后直接进入本订单</p>
          <div class="scan-input-wrap">
            <NInput
              :value="addPalletScanDisplay"
              readonly
              placeholder="等待扫描..."
              size="large"
              class="scan-input"
              @keydown="blockManualInput"
              @paste="blockManualInput"
            >
              <template #suffix>
                <span class="scan-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path
                      d="M4 6h2v12H4V6zm14 0h2v12h-2V6zM7 8h10v2H7V8zm0 4h10v2H7v-2zm0 4h7v2H7v-2zM3 4h4v2H3V4zm14 0h4v2h-4V4zm0 14h4v2h-4v-2zM3 18h4v2H3v-2z"
                    />
                  </svg>
                </span>
              </template>
            </NInput>
          </div>
          <NButton type="primary" block size="large" class="action-btn" @click="mockAddPalletScan">
            模拟扫描
          </NButton>
          <NButton block size="large" quaternary class="secondary-btn" @click="showAddPalletPanel = false">
            取消
          </NButton>
        </section>

        <section class="detail-panel">
          <div class="detail-toolbar">
            <span class="detail-toolbar-label">订单详情 · 按库位</span>
            <div class="detail-toolbar-actions">
              <NButton v-if="allLoaded" size="tiny" type="success" @click="requestFinishLoading">装车完成</NButton>
              <NButton size="tiny" type="primary" ghost @click="mockScanNextPallet">模拟扫描</NButton>
            </div>
          </div>

          <div v-for="loc in activeTrip.locations" :key="loc.locationCode" class="loc-group">
            <button
              v-if="getLocationTotalCount(loc) > 0"
              type="button"
              class="loc-head"
              @click="toggleLocation(loc.locationCode)"
            >
              <span class="loc-pin" aria-hidden="true">📍</span>
              <span class="loc-code">{{ loc.locationCode }}</span>
              <span class="loc-count">
                <em class="loc-count-loaded">{{ getLocationLoadedCount(loc) }}</em>/{{ getLocationTotalCount(loc) }} 板
              </span>
              <span class="loc-arrow" :class="{ open: isLocationExpanded(loc.locationCode) }">›</span>
            </button>
            <div v-show="isLocationExpanded(loc.locationCode)" class="loc-body">
              <p class="loc-body-title">卡板明细</p>
              <div
                v-for="pallet in loc.pallets"
                :key="pallet.palletNo"
                class="pallet-row"
                :class="getPalletRowClass(pallet)"
              >
                <div class="pallet-row-content">
                  <div class="pallet-row-main">
                    <span class="pallet-no">{{ pallet.palletNo }}</span>
                    <span v-if="pallet.loaded" class="pallet-tag pallet-tag-stowed">已装车</span>
                    <span v-else-if="pallet.scanned" class="pallet-tag pallet-tag-verified">已核对</span>
                  </div>
                  <dl class="pallet-row-dl">
                    <dt>目的地</dt><dd>{{ pallet.destination }}</dd>
                    <dt>柜号</dt><dd>{{ pallet.containerNo }}</dd>
                    <dt>箱数</dt><dd>{{ pallet.qty }} 箱</dd>
                  </dl>
                </div>
                <NButton
                  v-if="!pallet.loaded"
                  size="tiny"
                  :type="pallet.scanned ? 'default' : 'primary'"
                  ghost
                  @click="mockScanPallet(pallet)"
                >
                  {{ pallet.scanned ? '已核对' : '模拟扫描' }}
                </NButton>
              </div>
            </div>
          </div>

          <p v-if="remainingCount === 0" class="all-done-hint">全部货物已装车，可点击「装车完成」</p>
        </section>

        <div v-if="showUploadPhotoOverlay" class="pda-inline-overlay">
          <div class="pda-inline-dialog">
            <h3 class="pda-inline-dialog-title">上传照片</h3>
            <p class="pda-inline-dialog-hint">请上传出库现场照片</p>
            <div class="photo-upload-box" :class="{ uploaded: uploadPhotoReady }">
              <span v-if="uploadPhotoReady" class="photo-upload-done">✓ 照片已选择</span>
              <span v-else class="photo-upload-placeholder">点击下方按钮模拟上传</span>
            </div>
            <NButton type="primary" block size="large" class="action-btn" @click="mockUploadTripPhoto">
              {{ uploadPhotoReady ? '重新选择' : '选择照片' }}
            </NButton>
            <div class="pda-inline-dialog-actions">
              <NButton block size="large" @click="cancelUploadPhoto">取消</NButton>
              <NButton
                block
                type="primary"
                size="large"
                :disabled="!uploadPhotoReady"
                @click="confirmUploadPhoto"
              >
                确认上传
              </NButton>
            </div>
          </div>
        </div>

        <div v-if="showFinishPhotoOverlay" class="pda-inline-overlay">
          <div class="pda-inline-dialog">
            <h3 class="pda-inline-dialog-title">上传装车照片</h3>
            <p class="pda-inline-dialog-hint">装车完成前请上传现场照片</p>
            <div class="photo-upload-box" :class="{ uploaded: finishPhotoUploaded }">
              <span v-if="finishPhotoUploaded" class="photo-upload-done">✓ 照片已上传</span>
              <span v-else class="photo-upload-placeholder">点击下方按钮模拟上传</span>
            </div>
            <NButton type="primary" block size="large" class="action-btn" @click="mockUploadFinishPhoto">
              {{ finishPhotoUploaded ? '重新上传' : '上传照片' }}
            </NButton>
            <div class="pda-inline-dialog-actions">
              <NButton block size="large" @click="cancelFinishPhoto">取消</NButton>
              <NButton
                block
                type="primary"
                size="large"
                :disabled="!finishPhotoUploaded"
                @click="confirmFinishLoading"
              >
                确认完成
              </NButton>
            </div>
          </div>
        </div>
      </template>

      <!-- Step 3: 装车 -->
      <template v-else-if="currentStep === 3 && activeTrip">
        <section class="scan-cell">
          <h3 class="scan-cell-title">扫描道口核对</h3>
          <p class="scan-cell-hint">请扫描道口码</p>
          <div class="scan-input-wrap">
            <NInput
              :value="dockScanDisplay"
              readonly
              placeholder="等待扫描..."
              size="large"
              class="scan-input"
              @keydown="blockManualInput"
              @paste="blockManualInput"
            >
              <template #suffix>
                <span class="scan-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path
                      d="M4 6h2v12H4V6zm14 0h2v12h-2V6zM7 8h10v2H7V8zm0 4h10v2H7v-2zm0 4h7v2H7v-2zM3 4h4v2H3V4zm14 0h4v2h-4V4zm0 14h4v2h-4v-2zM3 18h4v2H3v-2z"
                    />
                  </svg>
                </span>
              </template>
            </NInput>
          </div>
          <NButton type="primary" block size="large" class="action-btn" @click="mockScanDock">
            模拟扫描
          </NButton>
          <p v-if="dockVerified" class="scan-done-hint">道口已核对 · {{ headerInfo.dockNo }}</p>
        </section>

        <section class="load-panel">
          <div class="load-panel-head">
            <h3 class="load-panel-title">本次装车 · {{ loadingBatch.length }} 板</h3>
            <NButton size="tiny" type="primary" ghost @click="mockScanNextLoadPallet">
              模拟扫描
            </NButton>
          </div>
          <p class="load-scan-progress">已装车 {{ loadStowedCount }} / {{ loadingBatch.length }} 板</p>

          <div
            v-for="pallet in loadingBatch"
            :key="pallet.palletNo"
            class="load-row"
            :class="pallet.loadScanned ? 'load-row-stowed' : 'load-row-verified'"
          >
            <div class="load-row-top">
              <span class="load-row-no">{{ pallet.palletNo }}</span>
              <span v-if="pallet.loadScanned" class="load-row-tag load-row-tag-stowed">已装车</span>
              <span v-else class="load-row-tag load-row-tag-verified">已核对</span>
            </div>
            <dl class="load-row-dl">
              <dt>目的地</dt><dd>{{ pallet.destination }}</dd>
              <dt>柜号</dt><dd>{{ pallet.containerNo }}</dd>
              <dt>数量</dt><dd>{{ pallet.qty }} 箱</dd>
            </dl>
            <NButton
              size="tiny"
              :type="pallet.loadScanned ? 'default' : 'primary'"
              ghost
              block
              class="load-row-scan-btn"
              @click="mockScanLoadPallet(pallet)"
            >
              {{ pallet.loadScanned ? '已装车' : '模拟扫描卡板贴' }}
            </NButton>
          </div>

          <NButton
            type="primary"
            block
            size="large"
            class="action-btn"
            :loading="submitting"
            :disabled="!canConfirmLoad"
            @click="confirmLoadBatch"
          >
            装车
          </NButton>
          <NButton block size="large" quaternary class="secondary-btn" @click="continueOutbound">
            继续出库
          </NButton>
        </section>
      </template>

      <!-- Step 4: 完成 -->
      <section v-else-if="currentStep === 4 && activeTrip" class="complete-panel">
        <div class="complete-icon">✓</div>
        <h3 class="complete-title">装车完成</h3>
        <p class="complete-sub">车次 {{ activeTrip.tripNo }} 已全部装车</p>
        <dl class="complete-dl">
          <dt>车厢号</dt><dd>{{ headerInfo.carriageNo }}</dd>
          <dt>道口</dt><dd>{{ headerInfo.dockNo }}</dd>
          <dt>装车板数</dt>
          <dd>{{ activeTrip.locations.flatMap(l => l.pallets).length }} 板</dd>
        </dl>
        <NButton type="primary" block size="large" class="action-btn" @click="handleComplete">
          完成
        </NButton>
      </section>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.outbound-app {
  position: relative;
  min-height: 100%;
  padding: 4px 12px 20px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
  box-sizing: border-box;
}

.outbound-head {
  margin-bottom: 10px;
}

.outbound-back {
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  cursor: pointer;
}

.outbound-title {
  margin: 8px 0 0;
  font-size: 18px;
  font-weight: 700;
}

.outbound-sub {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.85;
}

.outbound-steps {
  display: flex;
  gap: 3px;
  margin-bottom: 10px;
}

.outbound-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 1px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
}

.outbound-step.active {
  background: #fff;
}

.outbound-step.done {
  background: rgba(52, 199, 89, 0.25);
}

.outbound-step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.outbound-step.active .outbound-step-dot {
  background: #5b54d8;
  color: #fff;
}

.outbound-step.done .outbound-step-dot {
  background: #34c759;
  color: #fff;
}

.outbound-step-label {
  font-size: 9px;
  font-weight: 600;
  text-align: center;
  line-height: 1.15;
  opacity: 0.9;
}

.outbound-step.active .outbound-step-label {
  color: #5b54d8;
  opacity: 1;
}

.step-track {
  display: flex;
  margin-bottom: 10px;
  padding: 10px 6px 8px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.step-track-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.step-track-node-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 24px;
}

.step-track-dot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  background: #e5e7eb;
  color: #9ca3af;
}

.step-track-dot.active,
.step-track-dot.done {
  background: #1a7f37;
  color: #fff;
}

.step-track-line {
  position: absolute;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  background: #e5e7eb;
}

.step-track-line.done {
  background: #1a7f37;
}

.step-track-line-left {
  left: 0;
  right: 50%;
  margin-right: 11px;
}

.step-track-line-right {
  left: 50%;
  right: 0;
  margin-left: 11px;
}

.step-track-label {
  margin-top: 4px;
  font-size: 9px;
  font-weight: 600;
  color: #9ca3af;
  text-align: center;
}

.step-track-label.active,
.step-track-label.done {
  color: #1a7f37;
}

.trip-summary {
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.load-progress-block {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.load-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.progress-op-wrap {
  position: relative;
}

.progress-op-btn {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.progress-op-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 5;
  min-width: 120px;
  padding: 4px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.progress-op-menu button {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.progress-op-menu button:active {
  background: #f3f4f6;
}

.trip-photo-hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: #6b7280;
}

.add-pallet-panel {
  margin-bottom: 10px;
}

.pda-inline-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  background: rgba(17, 24, 39, 0.55);
  border-radius: 0;
}

.pda-inline-dialog {
  width: 100%;
  max-width: 280px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  color: #111827;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.pda-inline-dialog-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
}

.pda-inline-dialog-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #6b7280;
}

.photo-upload-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  margin-bottom: 12px;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
}

.photo-upload-box.uploaded {
  border-color: #86efac;
  background: #dcfce7;
}

.photo-upload-placeholder {
  font-size: 12px;
  color: #9ca3af;
}

.photo-upload-done {
  font-size: 14px;
  font-weight: 700;
  color: #1a7f37;
}

.pda-inline-dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.verify-summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.verify-summary-label {
  font-size: 12px;
  color: #6b7280;
}

.verify-summary-value {
  font-size: 16px;
  font-weight: 800;
  color: #1a7f37;
}

.load-progress-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
}

.load-progress-value {
  display: block;
  margin-top: 2px;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.load-progress-bar {
  height: 6px;
  margin-top: 8px;
  border-radius: 3px;
  background: #e5e7eb;
  overflow: hidden;
}

.load-progress-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: #1a7f37;
  transition: width 0.2s ease;
}

.trip-info-grid {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  font-size: 12px;
}

.trip-info-grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trip-info-grid dt {
  color: #9ca3af;
  margin: 0;
  font-size: 10px;
}

.trip-info-grid dd {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.trip-info-val {
  color: #1a7f37 !important;
  font-size: 13px;
}

.trip-op-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trip-load-btn {
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  background: #1a7f37;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  line-height: 1.3;
}

.trip-load-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.scan-done-hint {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #1a7f37;
  text-align: center;
}

.load-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.load-scan-progress {
  margin: 0 0 10px;
  font-size: 12px;
  color: #6b7280;
}

.load-row-verified {
  background: #dcfce7 !important;
  border-color: #86efac !important;
}

.load-row-stowed {
  background: #dbeafe !important;
  border-color: #93c5fd !important;
}

.load-row-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.load-row-no {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.load-row-tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.load-row-tag-verified {
  background: #34c759;
  color: #fff;
}

.load-row-tag-stowed {
  background: #2563eb;
  color: #fff;
}

.load-row-scan-btn {
  margin-top: 8px;
}

.detail-toolbar-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.scan-cell,
.info-banner,
.trip-list,
.detail-panel,
.load-panel,
.complete-panel,
.sticky-header {
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 3px 12px rgba(50, 40, 120, 0.16);
}

.info-banner,
.sticky-header {
  margin-bottom: 10px;
}

.scan-cell-title,
.trip-list-title,
.load-panel-title,
.complete-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.scan-cell-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.scan-input-wrap {
  margin-bottom: 12px;
}

.scan-input :deep(.n-input__input-el) {
  caret-color: transparent;
}

.scan-input.editable :deep(.n-input__input-el) {
  caret-color: auto;
}

.scan-icon {
  display: flex;
  color: #5b54d8;
}

.action-btn {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
}

.secondary-btn {
  margin-top: 8px;
  color: #6b7280 !important;
}

.trip-list {
  margin-top: 10px;
}

.trip-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  cursor: pointer;
  text-align: left;
}

.trip-item:last-child {
  margin-bottom: 0;
}

.trip-item:active {
  background: #eef2ff;
}

.trip-item-no {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  width: 100%;
}

.trip-item-meta {
  flex: 1;
  font-size: 11px;
  color: #6b7280;
}

.trip-item-count {
  font-size: 12px;
  font-weight: 600;
  color: #5b54d8;
}

.info-banner-dl,
.complete-dl {
  margin: 0;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  font-size: 13px;
}

.info-banner-dl dt,
.complete-dl dt {
  color: #9ca3af;
  margin: 0;
}

.info-banner-dl dd,
.complete-dl dd {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.highlight {
  color: #5b54d8 !important;
}

.sticky-header-dl {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  font-size: 12px;
}

.sticky-header-dl div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sticky-header-dl dt {
  color: #9ca3af;
  margin: 0;
  font-size: 10px;
}

.sticky-header-dl dd {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.sticky-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.detail-toolbar-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.loc-group {
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.loc-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: #f9fafb;
  cursor: pointer;
  text-align: left;
}

.loc-pin {
  font-size: 14px;
  line-height: 1;
}

.loc-code {
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
}

.loc-count {
  margin-left: auto;
  margin-right: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
}

.loc-count-loaded {
  font-style: normal;
  color: #ef4444;
  font-weight: 700;
}

.loc-body-title {
  margin: 4px 4px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
}

.loc-arrow {
  font-size: 18px;
  color: #9ca3af;
  transform: rotate(0deg);
  transition: transform 0.15s;
}

.loc-arrow.open {
  transform: rotate(90deg);
}

.loc-body {
  padding: 0 8px 8px;
  background: #fff;
}

.pallet-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  margin-top: 6px;
  border-radius: 8px;
  background: #f3f4f6;
}

.pallet-row-verified {
  background: #dcfce7;
  border: 1px solid #86efac;
}

.pallet-row-stowed {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.pallet-row-content {
  flex: 1;
  min-width: 0;
}

.pallet-row-main {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.pallet-row-dl {
  margin: 0;
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 4px 8px;
  font-size: 11px;
}

.pallet-row-dl dt {
  color: #9ca3af;
  margin: 0;
}

.pallet-row-dl dd {
  margin: 0;
  font-weight: 600;
  color: #374151;
}

.pallet-no {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.pallet-tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.pallet-tag-verified {
  background: #34c759;
  color: #fff;
}

.pallet-tag-stowed {
  background: #2563eb;
  color: #fff;
}

.all-done-hint {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  color: #34c759;
  font-weight: 600;
}

.load-row {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.load-row-dl {
  margin: 0;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 6px 8px;
  font-size: 12px;
}

.load-row-dl dt {
  color: #9ca3af;
  margin: 0;
}

.load-row-dl dd {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.complete-panel {
  text-align: center;
}

.complete-icon {
  width: 56px;
  height: 56px;
  margin: 8px auto 12px;
  border-radius: 50%;
  background: #dcfce7;
  color: #34c759;
  font-size: 28px;
  font-weight: 700;
  line-height: 56px;
}

.complete-sub {
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b7280;
}

.complete-dl {
  text-align: left;
  margin-bottom: 16px;
}
</style>
