<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NInput } from 'naive-ui';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';
import PdaScanFeedbackBar from '@/components/pda/PdaScanFeedbackBar.vue';
import { fetchPdaTask, fetchPdaTaskAction } from '@/service/api/pda';
import { BIZ_LABELS, resolveTaskType, type BusinessKey } from '../shared/business-config';
import { TASK_TYPE_MAP } from '../shared/pda-constants';
import { usePdaScan } from '../shared/pda-scan';
import { usePdaScanFeedback } from '../shared/pda-scan-feedback';
import { usePdaBizGuard } from '../shared/use-pda-biz';
import TaskExceptionModal from './modules/task-exception-modal.vue';
import TaskPhotoOverlay from './modules/task-photo-overlay.vue';

defineOptions({ name: 'PdaTask' });

const route = useRoute();
const router = useRouter();
usePdaBizGuard(route, router, { fixTaskType: true });

const loading = ref(false);
const submitting = ref(false);
const task = ref<Api.Pda.TaskDetail | null>(null);
const lastScanCode = ref('');
const scanStatus = ref<'idle' | 'success' | 'warn' | 'error'>('idle');
const scanStatusText = ref('');
const showException = ref(false);
const showPhoto = ref(false);

const biz = computed(() => String(route.query.biz || 'transfer'));
const taskType = computed(() => resolveTaskType(String(route.query.taskType || 'exception')));
const taskId = computed(() => String(route.query.taskId || 'TASK-2026-001'));

const bizLabel = computed(() => BIZ_LABELS[biz.value as BusinessKey] ?? '');
const taskLabel = computed(() => TASK_TYPE_MAP[taskType.value] || '统一任务');
const pageTitle = computed(() => (bizLabel.value ? `${bizLabel.value} · ${taskLabel.value}` : taskLabel.value));

const { scanInput, onEnter, resetScanDebounce } = usePdaScan();
const { scanFeedbackType, scanFeedbackText, feedbackSuccess, feedbackError } = usePdaScanFeedback();

async function loadTask() {
  loading.value = true;
  const { data, error } = await fetchPdaTask(taskId.value, {
    biz: biz.value,
    taskType: taskType.value
  });
  loading.value = false;
  if (!error && data) task.value = data;
}

onMounted(() => loadTask());

function goBack() {
  if (biz.value) {
    router.push({ name: 'pda_business', query: { biz: biz.value } });
    return;
  }
  router.push({ name: 'pda_home' });
}

async function runAction(payload: Api.Pda.TaskActionPayload) {
  submitting.value = true;
  const { data, error } = await fetchPdaTaskAction(taskId.value, payload);
  submitting.value = false;
  if (error) return null;
  if (data?.task) task.value = data.task;
  if (data?.message) window.$message?.success(data.message);
  return data;
}

function resolveExpectedScanCodes(): string[] {
  if (!task.value) return [];
  const codes = [task.value.palletNo, task.value.currentLocation, task.value.targetLocation].filter(Boolean);
  return [...new Set(codes)];
}

function processScan(code: string) {
  const expected = resolveExpectedScanCodes();
  const matched = expected.length === 0 || expected.some(item => item === code);
  if (!matched) {
    scanStatus.value = 'error';
    scanStatusText.value = '识别错误：条码与任务不匹配';
    feedbackError('条码与任务不匹配');
    return;
  }
  lastScanCode.value = code;
  scanStatus.value = 'success';
  scanStatusText.value = `已扫描：${code}`;
  feedbackSuccess(`已扫描：${code}`);
  runAction({ action: 'scan', scanCode: code });
  resetScanDebounce();
}

function onScanEnter(e: KeyboardEvent) {
  onEnter(e, processScan);
}

function mockScan() {
  const code = task.value?.palletNo || 'PLT-001';
  scanInput.value = code;
  processScan(code);
}

async function handleConfirm() {
  await runAction({ action: 'confirm' });
}

function handleException() {
  showException.value = true;
}

async function onExceptionConfirm(reason: string) {
  scanStatus.value = 'warn';
  scanStatusText.value = `异常：${reason}`;
  await runAction({ action: 'exception', exceptionReason: reason });
}

function handlePhoto() {
  showPhoto.value = true;
}

async function onPhotoConfirm() {
  await runAction({ action: 'photo' });
}

async function handleFinish() {
  const result = await runAction({ action: 'finish' });
  if (result?.success) {
    router.push({ name: 'pda_business', query: { biz: biz.value } });
  }
}
</script>

<template>
  <PdaPhoneShell>
    <div class="pda-task-app">
      <header class="pda-task-header">
        <button type="button" class="pda-task-back" @click="goBack">&larr; 返回</button>
        <h2 class="pda-task-title">{{ pageTitle }}</h2>
      </header>

      <section v-if="loading" class="pda-task-loading">加载任务...</section>

      <template v-else-if="task">
        <section class="pda-task-card">
          <dl class="pda-task-dl">
            <dt>任务号</dt>
            <dd>{{ task.taskId }}</dd>
            <dt>客户</dt>
            <dd>{{ task.customer }}</dd>
            <dt>托盘号</dt>
            <dd>{{ task.palletNo }}</dd>
            <dt>当前库位</dt>
            <dd>{{ task.currentLocation }}</dd>
            <dt>目标库位</dt>
            <dd>{{ task.targetLocation }}</dd>
            <dt>状态</dt>
            <dd>{{ task.status }}</dd>
          </dl>
        </section>

        <section class="pda-task-scan">
          <h3 class="pda-task-scan-title">扫码操作</h3>
          <NInput
            v-model:value="scanInput"
            placeholder="扫描条码，回车确认"
            size="large"
            @keyup="onScanEnter"
          />
          <PdaScanFeedbackBar :type="scanFeedbackType" :text="scanFeedbackText" />
          <p v-if="lastScanCode" class="pda-task-last-scan">最近扫描：{{ lastScanCode }}</p>
          <p
            v-if="scanStatusText"
            class="pda-task-status"
            :class="`status-${scanStatus}`"
          >
            {{ scanStatusText }}
          </p>
        </section>
      </template>

      <div class="pda-task-actions">
        <button type="button" class="btn primary" :disabled="submitting" @click="mockScan">扫描</button>
        <button type="button" class="btn success" :disabled="submitting" @click="handleConfirm">确认</button>
        <button type="button" class="btn warn" :disabled="submitting" @click="handleException">异常</button>
        <button type="button" class="btn ghost" :disabled="submitting" @click="handlePhoto">拍照</button>
        <button type="button" class="btn info" :disabled="submitting" @click="handleFinish">完成</button>
      </div>

      <TaskExceptionModal v-model:show="showException" @confirm="onExceptionConfirm" />
      <TaskPhotoOverlay v-model:show="showPhoto" @confirm="onPhotoConfirm" />
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.pda-task-app {
  min-height: 100%;
  padding: 4px 12px 88px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
  box-sizing: border-box;
}

.pda-task-header {
  margin-bottom: 14px;
}

.pda-task-back {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.pda-task-title {
  margin: 10px 0 0;
  font-size: 18px;
  font-weight: 700;
}

.pda-task-loading {
  padding: 20px;
  text-align: center;
  font-size: 13px;
}

.pda-task-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  color: #333;
  margin-bottom: 12px;
  box-shadow: 0 3px 12px rgba(50, 40, 120, 0.16);
}

.pda-task-dl {
  margin: 0;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  font-size: 13px;
}

.pda-task-dl dt {
  color: #888;
  margin: 0;
}

.pda-task-dl dd {
  margin: 0;
  font-weight: 600;
}

.pda-task-scan {
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  color: #1f2937;
  margin-bottom: 12px;
}

.pda-task-scan-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
}

.pda-task-last-scan {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.pda-task-status {
  margin: 8px 0 0;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-success {
  background: #ecfdf5;
  color: #34c759;
}

.status-warn {
  background: #fff7e6;
  color: #ff9500;
}

.status-error {
  background: #fef2f2;
  color: #ff3b30;
}

.pda-task-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  background: linear-gradient(180deg, transparent 0%, rgba(106, 95, 224, 0.95) 24%);
}

.btn {
  height: 48px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: #fff;
  color: #5b54d8;
}

.btn.success {
  background: #34c759;
  color: #fff;
}

.btn.warn {
  background: #ff9500;
  color: #fff;
}

.btn.info {
  background: #5ac8fa;
  color: #fff;
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}
</style>
