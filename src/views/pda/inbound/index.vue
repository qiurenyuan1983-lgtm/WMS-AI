<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NInput } from 'naive-ui';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';

defineOptions({ name: 'PdaInbound' });

type InboundStep = 0 | 1 | 2;

type PalletScanInfo = {
  palletLabelNo: string;
  destination: string;
  recommendLocation: string;
};

const STEPS = ['扫卡板贴', '扫库位码', '确认入库'] as const;

const MOCK_PALLET_POOL: PalletScanInfo[] = [
  { palletLabelNo: 'PLT-LBL-2026-001', destination: '美西二号仓 · A区', recommendLocation: 'A-01-03' },
  { palletLabelNo: 'PLT-LBL-2026-002', destination: '美西二号仓 · B区', recommendLocation: 'B-02-08' },
  { palletLabelNo: 'PLT-LBL-2026-003', destination: '美西二号仓 · C区', recommendLocation: 'C-03-12' }
];

const route = useRoute();
const router = useRouter();

const biz = computed(() => String(route.query.biz || 'transfer'));
const currentStep = ref<InboundStep>(0);
const scanDisplay = ref('');
const palletInfo = ref<PalletScanInfo | null>(null);
const locationCode = ref('');
const submitting = ref(false);
const mockPalletIndex = ref(0);

function goBack() {
  router.push({ name: 'pda_business', query: { biz: biz.value } });
}

function blockManualInput(e: KeyboardEvent) {
  e.preventDefault();
}

function mockScanPallet() {
  const info = MOCK_PALLET_POOL[mockPalletIndex.value % MOCK_PALLET_POOL.length];
  mockPalletIndex.value += 1;
  palletInfo.value = info;
  scanDisplay.value = info.palletLabelNo;
  window.$message?.success(`已扫描卡板贴 ${info.palletLabelNo}`);
  currentStep.value = 1;
  scanDisplay.value = '';
}

function mockScanLocation() {
  if (!palletInfo.value) return;
  const scanned = palletInfo.value.recommendLocation;
  locationCode.value = scanned;
  scanDisplay.value = scanned;
  window.$message?.success(`已扫描库位 ${scanned}`);
  currentStep.value = 2;
}

function handleFinalConfirm() {
  if (!palletInfo.value || !locationCode.value) return;
  submitting.value = true;
  window.setTimeout(() => {
    submitting.value = false;
    window.$message?.success(
      `[原型] 入库成功：${palletInfo.value!.palletLabelNo} → ${locationCode.value}`
    );
    resetFlow();
  }, 400);
}

function resetFlow() {
  currentStep.value = 0;
  scanDisplay.value = '';
  palletInfo.value = null;
  locationCode.value = '';
}

function stepClass(index: InboundStep) {
  if (currentStep.value > index) return 'done';
  if (currentStep.value === index) return 'active';
  return 'pending';
}
</script>

<template>
  <PdaPhoneShell>
    <div class="inbound-app">
      <header class="inbound-head">
        <button type="button" class="inbound-back" @click="goBack">&larr; 返回</button>
        <h2 class="inbound-title">入库操作</h2>
        <p class="inbound-sub">转运业务 · PDA 扫码入库</p>
      </header>

      <nav class="inbound-steps" aria-label="入库步骤">
        <div
          v-for="(label, index) in STEPS"
          :key="label"
          class="inbound-step"
          :class="stepClass(index as InboundStep)"
        >
          <span class="inbound-step-dot">{{ index + 1 }}</span>
          <span class="inbound-step-label">{{ label }}</span>
        </div>
      </nav>

      <!-- Step 1: 扫卡板贴 -->
      <section v-if="currentStep === 0" class="scan-cell">
        <h3 class="scan-cell-title">扫描卡板贴</h3>
        <p class="scan-cell-hint">请扫描卡板贴号</p>
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
        <NButton type="primary" block size="large" class="mock-scan-btn" @click="mockScanPallet">
          模拟扫描
        </NButton>
      </section>

      <!-- Step 2: 扫库位码 -->
      <template v-else-if="currentStep === 1">
        <section v-if="palletInfo" class="pallet-info">
          <h3 class="pallet-info-title">已扫卡板贴</h3>
          <dl class="pallet-info-dl">
            <dt>卡板贴号</dt>
            <dd>{{ palletInfo.palletLabelNo }}</dd>
            <dt>目的地</dt>
            <dd>{{ palletInfo.destination }}</dd>
            <dt>推荐库位</dt>
            <dd class="highlight">{{ palletInfo.recommendLocation }}</dd>
          </dl>
        </section>

        <section class="scan-cell">
          <h3 class="scan-cell-title">扫库位码</h3>
          <p class="scan-cell-hint">请扫描库位码</p>
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
          <NButton type="primary" block size="large" class="mock-scan-btn" @click="mockScanLocation">
            模拟扫描
          </NButton>
        </section>
      </template>

      <!-- Step 3: 确认入库 -->
      <section v-else class="confirm-panel">
        <h3 class="confirm-panel-title">确认入库</h3>
        <dl class="confirm-dl">
          <dt>卡板贴号</dt>
          <dd>{{ palletInfo?.palletLabelNo }}</dd>
          <dt>目的地</dt>
          <dd>{{ palletInfo?.destination }}</dd>
          <dt>入库库位</dt>
          <dd class="highlight">{{ locationCode }}</dd>
        </dl>
        <NButton
          type="primary"
          block
          size="large"
          class="confirm-btn"
          :loading="submitting"
          @click="handleFinalConfirm"
        >
          确认入库
        </NButton>
        <NButton block size="large" quaternary class="reset-btn" @click="resetFlow">重新扫描</NButton>
      </section>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.inbound-app {
  min-height: 100%;
  padding: 4px 12px 20px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
  box-sizing: border-box;
}

.inbound-head {
  margin-bottom: 12px;
}

.inbound-back {
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  cursor: pointer;
}

.inbound-title {
  margin: 10px 0 0;
  font-size: 18px;
  font-weight: 700;
}

.inbound-sub {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.85;
}

.inbound-steps {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.inbound-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 2px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
}

.inbound-step.active {
  background: #fff;
}

.inbound-step.done {
  background: rgba(52, 199, 89, 0.25);
}

.inbound-step-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}

.inbound-step.active .inbound-step-dot {
  background: #5b54d8;
  color: #fff;
}

.inbound-step.done .inbound-step-dot {
  background: #34c759;
  color: #fff;
}

.inbound-step-label {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  opacity: 0.9;
}

.inbound-step.active .inbound-step-label {
  color: #5b54d8;
  opacity: 1;
}

.scan-cell,
.pallet-info,
.confirm-panel {
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 3px 12px rgba(50, 40, 120, 0.16);
}

.pallet-info {
  margin-bottom: 10px;
}

.scan-cell-title,
.pallet-info-title,
.confirm-panel-title {
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
  cursor: default;
  caret-color: transparent;
}

.scan-icon {
  display: flex;
  color: #5b54d8;
}

.mock-scan-btn {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
}

.pallet-info-dl,
.confirm-dl {
  margin: 0;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px 10px;
  font-size: 13px;
}

.pallet-info-dl dt,
.confirm-dl dt {
  color: #9ca3af;
  margin: 0;
}

.pallet-info-dl dd,
.confirm-dl dd {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.highlight {
  color: #5b54d8 !important;
}

.confirm-btn {
  margin-top: 16px;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
}

.reset-btn {
  margin-top: 8px;
  color: #6b7280 !important;
}
</style>
