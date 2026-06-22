<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NInput } from 'naive-ui';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';
import PdaScanFeedbackBar from '@/components/pda/PdaScanFeedbackBar.vue';
import { fetchPdaInboundConfirm, fetchPdaInboundScanPallet } from '@/service/api/pda';
import { BIZ_LABELS, type BusinessKey } from '../shared/business-config';
import { usePdaScan } from '../shared/pda-scan';
import { usePdaScanFeedback } from '../shared/pda-scan-feedback';
import { usePdaBizGuard } from '../shared/use-pda-biz';

defineOptions({ name: 'PdaInbound' });

type InboundStep = 0 | 1 | 2;

const STEPS = ['扫卡板贴', '扫库位码', '确认入库'] as const;

const route = useRoute();
const router = useRouter();
usePdaBizGuard(route, router);

const biz = computed(() => String(route.query.biz || 'transfer'));
const bizLabel = computed(() => BIZ_LABELS[biz.value as BusinessKey] ?? '转运业务');

const currentStep = ref<InboundStep>(0);
const palletInfo = ref<Api.Pda.InboundPalletInfo | null>(null);
const locationCode = ref('');
const submitting = ref(false);
const mockPalletIndex = ref(0);

const { scanInput, handleScan, onEnter, resetScanDebounce } = usePdaScan();
const { scanFeedbackType, scanFeedbackText, clearScanFeedback, feedbackSuccess, feedbackError, feedbackWarn } =
  usePdaScanFeedback();

const locationMismatch = computed(
  () =>
    Boolean(
      palletInfo.value &&
        locationCode.value &&
        locationCode.value !== palletInfo.value.recommendLocation
    )
);

function goBack() {
  router.push({ name: 'pda_business', query: { biz: biz.value } });
}

async function processPalletScan(code: string) {
  const { data, error } = await fetchPdaInboundScanPallet(code, biz.value);
  if (error || !data) {
    feedbackError('卡板贴不存在');
    return;
  }
  palletInfo.value = data;
  feedbackSuccess(`已扫描卡板贴 ${data.palletLabelNo}`);
  currentStep.value = 1;
  resetScanDebounce();
}

function processLocationScan(code: string) {
  if (!palletInfo.value) return;
  locationCode.value = code;
  if (code !== palletInfo.value.recommendLocation) {
    feedbackWarn('扫描库位与推荐库位不一致');
  } else {
    feedbackSuccess(`已扫描库位 ${code}`);
  }
  currentStep.value = 2;
  resetScanDebounce();
}

function onPalletEnter(e: KeyboardEvent) {
  onEnter(e, processPalletScan);
}

function onLocationEnter(e: KeyboardEvent) {
  onEnter(e, processLocationScan);
}

function mockScanPallet() {
  const pool = ['PLT-LBL-2026-001', 'PLT-LBL-2026-002', 'PLT-LBL-2026-003'];
  const code = pool[mockPalletIndex.value % pool.length];
  mockPalletIndex.value += 1;
  scanInput.value = code;
  processPalletScan(code);
}

function mockScanLocation() {
  if (!palletInfo.value) return;
  const code = mockPalletIndex.value % 2 === 0 ? palletInfo.value.recommendLocation : 'Z-99-99';
  mockPalletIndex.value += 1;
  scanInput.value = code;
  processLocationScan(code);
}

async function handleFinalConfirm() {
  if (!palletInfo.value || !locationCode.value) return;
  submitting.value = true;
  const { error } = await fetchPdaInboundConfirm({
    biz: biz.value,
    palletLabelNo: palletInfo.value.palletLabelNo,
    locationCode: locationCode.value
  });
  submitting.value = false;
  if (error) return;
  window.$message?.success(`入库成功：${palletInfo.value.palletLabelNo} → ${locationCode.value}`);
  resetFlow();
}

function resetFlow() {
  currentStep.value = 0;
  palletInfo.value = null;
  locationCode.value = '';
  resetScanDebounce();
  clearScanFeedback();
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
        <p class="inbound-sub">{{ bizLabel }} · PDA 扫码入库</p>
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

      <section v-if="currentStep === 0" class="scan-cell">
        <h3 class="scan-cell-title">扫描卡板贴</h3>
        <p class="scan-cell-hint">请扫描卡板贴号，或回车确认</p>
        <div class="scan-input-wrap">
          <NInput
            v-model:value="scanInput"
            placeholder="等待扫描..."
            size="large"
            class="scan-input"
            @keyup="onPalletEnter"
          >
            <template #suffix>
              <span class="scan-icon" aria-hidden="true">📷</span>
            </template>
          </NInput>
        </div>
        <PdaScanFeedbackBar :type="scanFeedbackType" :text="scanFeedbackText" />
        <NButton type="primary" block size="large" class="mock-scan-btn" @click="mockScanPallet">
          模拟扫描
        </NButton>
      </section>

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
            <dt>箱数</dt>
            <dd>{{ palletInfo.boxCount }}</dd>
          </dl>
        </section>

        <section class="scan-cell">
          <h3 class="scan-cell-title">扫库位码</h3>
          <p class="scan-cell-hint">请扫描库位码，或回车确认</p>
          <div class="scan-input-wrap">
            <NInput
              v-model:value="scanInput"
              placeholder="等待扫描..."
              size="large"
              class="scan-input"
              @keyup="onLocationEnter"
            >
              <template #suffix>
                <span class="scan-icon" aria-hidden="true">📷</span>
              </template>
            </NInput>
          </div>
          <PdaScanFeedbackBar :type="scanFeedbackType" :text="scanFeedbackText" />
          <div v-if="locationMismatch" class="location-warn">扫描库位与推荐库位不一致，请确认后继续</div>
          <NButton type="primary" block size="large" class="mock-scan-btn" @click="mockScanLocation">
            模拟扫描
          </NButton>
        </section>
      </template>

      <section v-else class="confirm-panel">
        <h3 class="confirm-panel-title">确认入库</h3>
        <div v-if="locationMismatch" class="location-warn">注意：入库库位与推荐库位不一致</div>
        <dl class="confirm-dl">
          <dt>卡板贴号</dt>
          <dd>{{ palletInfo?.palletLabelNo }}</dd>
          <dt>目的地</dt>
          <dd>{{ palletInfo?.destination }}</dd>
          <dt>箱数</dt>
          <dd>{{ palletInfo?.boxCount }}</dd>
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

.scan-icon {
  display: flex;
  font-size: 18px;
}

.location-warn {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff7e6;
  color: #ff9500;
  font-size: 12px;
  font-weight: 600;
}

.mock-scan-btn {
  height: 48px;
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
  height: 48px;
  font-size: 15px;
  font-weight: 600;
}

.reset-btn {
  margin-top: 8px;
  color: #6b7280 !important;
}
</style>
