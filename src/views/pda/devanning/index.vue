<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCheckbox, NInput, NInputNumber, NModal, NSelect, NTag } from 'naive-ui';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';
import PdaScanFeedbackBar from '@/components/pda/PdaScanFeedbackBar.vue';
import {
  fetchPdaDevanningCreatePallet,
  fetchPdaDevanningException,
  fetchPdaDevanningFinish,
  fetchPdaDevanningInbound,
  fetchPdaDevanningPhoto,
  fetchPdaDevanningPrint,
  fetchPdaDevanningPushInstructions,
  fetchPdaDevanningReport,
  fetchPdaDevanningScanContainer,
  fetchPdaDevanningStart,
  fetchPdaDevanningTaskDetail,
  fetchPdaDevanningTasks,
  fetchPdaDevanningUploadPhoto,
  fetchPdaDevanningValidateFinish
} from '@/service/api/pda';
import { BIZ_LABELS, type BusinessKey } from '../shared/business-config';
import { PDA_BTN_MIN_H, PDA_GRADIENT } from '../shared/pda-constants';
import { usePdaScan } from '../shared/pda-scan';
import { usePdaScanFeedback } from '../shared/pda-scan-feedback';
import { usePdaBizGuard } from '../shared/use-pda-biz';
import DevanningBottomBar from './modules/devanning-bottom-bar.vue';
import DevanningExceptionModal from './modules/devanning-exception-modal.vue';
import DevanningMoreMenu from './modules/devanning-more-menu.vue';
import DevanningPhotoUploadModal from './modules/devanning-photo-upload-modal.vue';
import {
  DEFAULT_PALLET_SIZE,
  INBOUND_LOCATION_OPTIONS,
  OPTIONAL_PHOTO_TYPES,
  REQUIRED_PHOTO_TYPES,
  DEVANNING_CONTAINER_ORDERS,
  TASK_STATUS_LABEL,
  PALLET_STATUS_LABEL,
  type DevanningExceptionType,
  type DevanningStep
} from './shared/devanning-constants';

defineOptions({ name: 'PdaDevanning' });

const route = useRoute();
const router = useRouter();
usePdaBizGuard(route, router);

const biz = computed(() => String(route.query.biz || 'transfer'));
const bizLabel = computed(() => BIZ_LABELS[biz.value as BusinessKey] ?? '转运业务');

const step = ref<DevanningStep>('entry');
const tasks = ref<Api.Pda.DevanningTaskListItem[]>([]);
const pushedInstructions = ref<Api.Pda.DevanningPushInstruction[]>([]);
const listFilterHint = ref('');
const loading = ref(false);
const entryLoading = ref(false);
const activeTask = ref<Api.Pda.DevanningTaskDetail | null>(null);
const report = ref<Api.Pda.DevanningReport | null>(null);
const selectedDestId = ref('');
const activePalletNo = ref('');
const finishReasons = ref<string[]>([]);
const showFinishModal = ref(false);
const showDetailModal = ref(false);
const showPhotoUploadModal = ref(false);
const showExceptionModal = ref(false);
const detailTask = ref<Api.Pda.DevanningTaskDetail | null>(null);

const { scanInput: searchInput, onEnter: onSearchEnter, resetScanDebounce: resetSearchDebounce } = usePdaScan();
const { scanInput, onEnter, resetScanDebounce } = usePdaScan();
const { scanFeedbackType, scanFeedbackText, clearScanFeedback, feedbackSuccess, feedbackError, feedbackWarn } =
  usePdaScanFeedback();

const palletForm = ref({
  boxQty: 24,
  sizeL: DEFAULT_PALLET_SIZE.l,
  sizeW: DEFAULT_PALLET_SIZE.w,
  sizeH: DEFAULT_PALLET_SIZE.h,
  skuQty: 0,
  mixedPallet: false,
  exceptionFlag: false,
  remark: ''
});

const inboundLocation = ref('');
const selectedPhotoType = ref(REQUIRED_PHOTO_TYPES[0].key);
const skipPrint = ref(false);

const hasActiveTask = computed(() => Boolean(activeTask.value));
const selectedDest = computed(() => activeTask.value?.destinations.find(d => d.id === selectedDestId.value));
const activePallet = computed(() => activeTask.value?.pallets.find(p => p.palletNo === activePalletNo.value));
const activePalletLocation = computed(() => {
  if (!activeTask.value || !activePallet.value) return '—';
  const dest = activeTask.value.destinations.find(d => d.id === activePallet.value!.destinationId);
  return dest?.locationCode || '—';
});

const contextContainerNo = computed(
  () => activeTask.value?.containerNo || searchInput.value.trim() || tasks.value[0]?.containerNo || ''
);

const contextOrderOptions = computed(() => {
  const cn = contextContainerNo.value.trim().toUpperCase();
  return cn ? DEVANNING_CONTAINER_ORDERS[cn] || [] : [];
});

const stepTitle = computed(() => {
  const map: Record<DevanningStep, string> = {
    entry: '搜索柜号',
    list: '拆柜任务列表',
    scan: '扫描柜号',
    destinations: '目的地建板',
    create: '创建卡板',
    print: '打印卡板标签',
    inbound: '扫描入库',
    photo: '拍照留底',
    report: '拆柜报表',
    detail: '任务详情'
  };
  return map[step.value];
});

function goBack() {
  if (step.value === 'entry') {
    router.push({ name: 'pda_business', query: { biz: biz.value } });
    return;
  }
  if (step.value === 'list') {
    step.value = 'entry';
    listFilterHint.value = '';
    return;
  }
  if (['create', 'print', 'inbound', 'photo'].includes(step.value)) {
    step.value = 'destinations';
    return;
  }
  if (step.value === 'destinations') {
    step.value = 'list';
    return;
  }
  if (step.value === 'scan') {
    step.value = activeTask.value ? 'destinations' : 'entry';
    return;
  }
  if (step.value === 'report') {
    step.value = 'entry';
    loadEntry();
    return;
  }
  step.value = 'entry';
}

async function loadEntry() {
  entryLoading.value = true;
  const { data } = await fetchPdaDevanningPushInstructions(biz.value);
  entryLoading.value = false;
  pushedInstructions.value = data || [];
}

async function applySearch(keyword: string) {
  const kw = keyword.trim();
  if (!kw) {
    feedbackWarn('请输入或扫描柜号');
    return;
  }
  loading.value = true;
  const { data } = await fetchPdaDevanningTasks(biz.value, { keyword: kw });
  loading.value = false;
  tasks.value = data || [];
  if (!tasks.value.length) {
    feedbackError('未找到匹配的拆柜任务');
    return;
  }
  listFilterHint.value = `柜号/单号「${kw}」`;
  feedbackSuccess(`找到 ${tasks.value.length} 条拆柜任务`);
  step.value = 'list';
  resetSearchDebounce();
}

function onEntrySearchEnter(e: KeyboardEvent) {
  onSearchEnter(e, applySearch);
}

function mockSearchContainer() {
  const code = pushedInstructions.value[0]?.containerNo || 'MSCU1234567';
  searchInput.value = code;
  applySearch(code);
}

async function selectPushInstruction(item: Api.Pda.DevanningPushInstruction) {
  loading.value = true;
  const { data } = await fetchPdaDevanningTasks(biz.value, { taskId: item.taskId });
  loading.value = false;
  tasks.value = data || [];
  if (!tasks.value.length) {
    feedbackError('推送指令关联任务不可用');
    return;
  }
  listFilterHint.value = `推送指令 ${item.instructionNo}`;
  searchInput.value = item.containerNo;
  feedbackSuccess(`已加载推送指令 ${item.instructionNo}`);
  step.value = 'list';
}

async function refreshActiveTask(taskId?: string) {
  const id = taskId || activeTask.value?.id;
  if (!id) return;
  const { data } = await fetchPdaDevanningTaskDetail(id);
  if (data) activeTask.value = data;
}

async function openTaskDetail(taskId: string) {
  const { data } = await fetchPdaDevanningTaskDetail(taskId);
  detailTask.value = data || null;
  showDetailModal.value = true;
}

function resetPalletForm() {
  palletForm.value = {
    boxQty: 24,
    sizeL: DEFAULT_PALLET_SIZE.l,
    sizeW: DEFAULT_PALLET_SIZE.w,
    sizeH: DEFAULT_PALLET_SIZE.h,
    skuQty: 0,
    mixedPallet: false,
    exceptionFlag: false,
    remark: ''
  };
}

async function processContainerScan(code: string) {
  const { data, error } = await fetchPdaDevanningScanContainer(code, biz.value);
  if (error || !data?.ok || !data.taskId) {
    feedbackError(data?.message || '柜号校验失败');
    return;
  }
  feedbackSuccess(data.message);
  await fetchPdaDevanningStart(data.taskId);
  await refreshActiveTask(data.taskId);
  step.value = 'destinations';
  resetScanDebounce();
}

function onScanEnter(e: KeyboardEvent) {
  onEnter(e, processContainerScan);
}

function mockScanContainer() {
  const pool = tasks.value.map(t => t.containerNo);
  const code = pool[0] || 'MSCU1234567';
  scanInput.value = code;
  processContainerScan(code);
}

async function handleStartTask(taskId: string) {
  await fetchPdaDevanningStart(taskId);
  await refreshActiveTask(taskId);
  activeTask.value = (await fetchPdaDevanningTaskDetail(taskId)).data || null;
  step.value = 'destinations';
}

function goCreatePallet(destId: string) {
  selectedDestId.value = destId;
  resetPalletForm();
  step.value = 'create';
}

async function submitCreatePallet() {
  if (!activeTask.value || !selectedDestId.value) return;
  const { data, error } = await fetchPdaDevanningCreatePallet({
    taskId: activeTask.value.id,
    destinationId: selectedDestId.value,
    boxQty: palletForm.value.boxQty,
    sizeL: palletForm.value.sizeL,
    sizeW: palletForm.value.sizeW,
    sizeH: palletForm.value.sizeH,
    skuQty: palletForm.value.skuQty,
    mixedPallet: palletForm.value.mixedPallet,
    exceptionFlag: palletForm.value.exceptionFlag,
    remark: palletForm.value.remark
  });
  if (error || !data?.ok) {
    window.$message?.error(data?.message || '创建失败');
    return;
  }
  activeTask.value = data.task || activeTask.value;
  activePalletNo.value = data.palletNo || '';
  window.$message?.success(data.message);
  step.value = 'print';
}

async function handlePrint(skip = false) {
  if (!activeTask.value || !activePalletNo.value) return;
  if (skip) {
    skipPrint.value = true;
    window.$message?.warning('已跳过打印，扫描入库将被拦截');
    step.value = 'inbound';
    return;
  }
  const { data, error } = await fetchPdaDevanningPrint(activeTask.value.id, activePalletNo.value);
  if (error || !data?.ok) {
    window.$message?.error(data?.message || '打印失败');
    return;
  }
  activeTask.value = data.task || activeTask.value;
  skipPrint.value = false;
  window.$message?.success('标签已打印');
  step.value = 'inbound';
}

async function processInboundScan(code: string) {
  if (!activeTask.value || !activePalletNo.value) return;
  if (code.toUpperCase() === activePalletNo.value.toUpperCase()) {
    feedbackSuccess(`已识别卡板 ${code}`);
    return;
  }
  inboundLocation.value = code;
  const { data, error } = await fetchPdaDevanningInbound({
    taskId: activeTask.value.id,
    palletNo: activePalletNo.value,
    locationCode: code
  });
  if (error || !data?.ok) {
    feedbackError(data?.message || '入库失败');
    return;
  }
  activeTask.value = data.task || activeTask.value;
  feedbackSuccess(`已绑定库位 ${code}`);
  step.value = 'photo';
  resetScanDebounce();
}

function onInboundEnter(e: KeyboardEvent) {
  onEnter(e, processInboundScan);
}

async function capturePhoto() {
  if (!activeTask.value || !activePalletNo.value) return;
  const { data, error } = await fetchPdaDevanningPhoto({
    taskId: activeTask.value.id,
    palletNo: activePalletNo.value,
    photoType: selectedPhotoType.value
  });
  if (error || !data?.ok) {
    window.$message?.error(data?.message || '拍照失败');
    return;
  }
  activeTask.value = data.task || activeTask.value;
  window.$message?.success('照片已绑定');
}

async function loadReport() {
  if (!activeTask.value) return;
  const { data } = await fetchPdaDevanningReport(activeTask.value.id);
  report.value = data || null;
  step.value = 'report';
}

async function tryFinish() {
  if (!activeTask.value) return;
  const { data } = await fetchPdaDevanningValidateFinish(activeTask.value.id);
  if (!data?.ok) {
    finishReasons.value = data?.reasons || ['校验未通过'];
    showFinishModal.value = true;
    return;
  }
  finishReasons.value = [];
  showFinishModal.value = true;
}

async function confirmFinish() {
  if (!activeTask.value) return;
  const { data, error } = await fetchPdaDevanningFinish({ taskId: activeTask.value.id });
  if (error || !data?.ok) {
    finishReasons.value = data?.reasons || [data?.message || '完成失败'];
    return;
  }
  showFinishModal.value = false;
  report.value = data.report || report.value;
  activeTask.value = data.task || activeTask.value;
  window.$message?.success(data.message);
  step.value = 'report';
}

function openPhotoUpload() {
  showPhotoUploadModal.value = true;
}

function openExceptionReport() {
  showExceptionModal.value = true;
}

async function confirmPhotoUpload(photoCount: number) {
  const { data, error } = await fetchPdaDevanningUploadPhoto({
    biz: biz.value,
    taskId: activeTask.value?.id,
    containerNo: contextContainerNo.value || undefined,
    photoCount
  });
  if (error || !data?.ok) {
    window.$message?.error(data?.message || '上传失败');
    return;
  }
  window.$message?.success(data.message || '照片已上传');
}

async function confirmExceptionReport(payload: {
  containerNo: string;
  containerAutoRecognized: boolean;
  orderNo: string;
  orderUnrecognized: boolean;
  exceptionType: DevanningExceptionType;
  remark: string;
  photoCaptured: boolean;
}) {
  const { data, error } = await fetchPdaDevanningException({
    biz: biz.value,
    taskId: activeTask.value?.id,
    containerNo: payload.containerNo || contextContainerNo.value || undefined,
    containerAutoRecognized: payload.containerAutoRecognized,
    orderNo: payload.orderUnrecognized ? undefined : payload.orderNo,
    orderUnrecognized: payload.orderUnrecognized,
    exceptionType: payload.exceptionType,
    remark: payload.remark,
    photoCaptured: payload.photoCaptured
  });
  if (error || !data?.ok) {
    window.$message?.error(data?.message || '上报失败');
    return;
  }
  if (data.task && activeTask.value?.id === data.task.id) {
    activeTask.value = (await fetchPdaDevanningTaskDetail(data.task.id)).data || activeTask.value;
  }
  window.$message?.success(data.message || '异常已上报');
}

function bottomAction(target: DevanningStep) {
  if (!activeTask.value && target !== 'scan') {
    window.$message?.warning('请先扫描柜号开始拆柜');
    return;
  }
  if (target === 'scan') step.value = 'scan';
  else if (target === 'create') step.value = 'destinations';
  else if (target === 'print') {
    const last = activeTask.value?.pallets[0];
    if (!last) {
      window.$message?.warning('请先创建卡板');
      return;
    }
    activePalletNo.value = last.palletNo;
    step.value = 'print';
  } else if (target === 'photo') {
    const need = activeTask.value?.pallets.find(p => p.inboundLocation && !p.photos.filter(x => x.required).every(x => x.captured));
    if (!need) {
      window.$message?.info('暂无待拍照卡板');
      return;
    }
    activePalletNo.value = need.palletNo;
    step.value = 'photo';
  } else if (target === 'report') {
    loadReport();
  }
}

function statusTagType(status: string) {
  if (status === 'DEVANNING') return 'warning';
  if (status === 'COMPLETED' || status === 'DONE') return 'success';
  if (status === 'PENDING') return 'info';
  return 'default';
}

onMounted(loadEntry);
</script>

<template>
  <PdaPhoneShell>
    <div class="dv-app" :style="{ background: PDA_GRADIENT }">
      <header class="dv-head">
        <button type="button" class="dv-back" @click="goBack">&larr;</button>
        <div class="dv-head-text">
          <h2 class="dv-title">{{ stepTitle }}</h2>
          <p class="dv-sub">{{ bizLabel }} · 转运拆柜</p>
        </div>
        <DevanningMoreMenu @photo-upload="openPhotoUpload" @exception="openExceptionReport" />
      </header>

      <PdaScanFeedbackBar :type="scanFeedbackType" :text="scanFeedbackText" @clear="clearScanFeedback" />

      <main class="dv-main">
        <!-- 入口：搜索柜号 + 推送指令 -->
        <section v-if="step === 'entry'" class="dv-panel">
          <div class="dv-scan-cell">
            <h3 class="dv-scan-title">搜索或扫描柜号</h3>
            <p class="dv-hint">输入柜号、拆柜单号或 DOCK，匹配后展示拆柜任务列表</p>
            <NInput
              v-model:value="searchInput"
              size="large"
              placeholder="等待扫描或输入柜号..."
              class="dv-scan-input"
              @keyup.enter="onEntrySearchEnter"
            />
            <NButton type="primary" size="large" block class="dv-btn" @click="mockSearchContainer">模拟扫码</NButton>
          </div>

          <div class="dv-push-list">
            <div class="dv-push-head">
              <h3 class="dv-push-title">推送拆柜指令</h3>
              <span class="dv-push-count">{{ pushedInstructions.length }} 条</span>
            </div>
            <p class="dv-hint">以下为本班推送给您的拆柜任务，点击可直接进入列表</p>
            <p v-if="entryLoading" class="dv-empty">加载推送指令…</p>
            <p v-else-if="!pushedInstructions.length" class="dv-empty">暂无推送拆柜指令</p>
            <button
              v-for="item in pushedInstructions"
              :key="item.instructionNo"
              type="button"
              class="dv-push-item"
              @click="selectPushInstruction(item)"
            >
              <div class="dv-push-item-top">
                <span class="dv-push-container">{{ item.containerNo }}</span>
                <NTag v-if="item.priority === 'URGENT'" size="small" type="error">加急</NTag>
              </div>
              <span class="dv-push-no">指令 {{ item.instructionNo }}</span>
              <span class="dv-push-meta">
                拆柜单 {{ item.devanningNo }} · DOCK {{ item.dock }}
              </span>
              <span class="dv-push-meta">预约 {{ item.appointmentTime }}</span>
              <span class="dv-push-time">推送 {{ item.pushedAt }} · {{ item.pushedBy }}</span>
            </button>
          </div>
        </section>

        <!-- 任务列表 -->
        <section v-else-if="step === 'list'" class="dv-panel">
          <p v-if="listFilterHint" class="dv-filter-hint">{{ listFilterHint }} · 共 {{ tasks.length }} 条</p>
          <div v-if="loading" class="dv-empty">加载中…</div>
          <div v-else-if="!tasks.length" class="dv-empty">暂无匹配的拆柜任务</div>
          <article v-for="task in tasks" :key="task.id" class="dv-task-card">
            <div class="dv-task-head">
              <strong class="dv-container">{{ task.containerNo }}</strong>
              <NTag size="small" :type="statusTagType(task.status)">{{ TASK_STATUS_LABEL[task.status] }}</NTag>
            </div>
            <dl class="dv-kv">
              <div><dt>拆柜单号</dt><dd>{{ task.devanningNo }}</dd></div>
              <div><dt>柜型</dt><dd>{{ task.containerType }}</dd></div>
              <div><dt>DOCK</dt><dd>{{ task.dock }}</dd></div>
              <div><dt>预约时间</dt><dd>{{ task.appointmentTime }}</dd></div>
              <div><dt>预计目的地</dt><dd>{{ task.destCount }}</dd></div>
              <div><dt>预计箱数</dt><dd>{{ task.expectedBoxQty }}</dd></div>
              <div><dt>预计板数</dt><dd>{{ task.expectedPalletQty }}</dd></div>
            </dl>
            <button type="button" class="dv-start-btn" @click="handleStartTask(task.id)">开始拆柜</button>
          </article>
        </section>

        <!-- 扫描柜号 -->
        <section v-else-if="step === 'scan'" class="dv-panel">
          <p class="dv-hint">扫描或输入柜号，系统将校验是否属于转运业务且允许 PDA 操作</p>
          <NInput
            v-model:value="scanInput"
            size="large"
            placeholder="扫描柜号"
            class="dv-scan-input"
            @keyup.enter="onScanEnter"
          />
          <NButton type="primary" size="large" block class="dv-btn" @click="mockScanContainer">模拟扫码</NButton>
        </section>

        <!-- 目的地建板 -->
        <section v-else-if="step === 'destinations' && activeTask" class="dv-panel">
          <div class="dv-summary">
            <div>柜号 <strong>{{ activeTask.containerNo }}</strong></div>
          </div>
          <article v-for="dest in activeTask.destinations" :key="dest.id" class="dv-dest-card" @click="goCreatePallet(dest.id)">
            <div class="dv-dest-title">{{ dest.destination }}</div>
            <div class="dv-dest-meta">平台 {{ dest.platform }}</div>
            <div class="dv-dest-meta">库位 {{ dest.locationCode }}</div>
            <div class="dv-dest-stats">
              <span>已建板 {{ dest.palletCount }}</span>
              <span>已录箱 {{ dest.boxCount }}</span>
              <span>异常 {{ dest.exceptionCount }}</span>
            </div>
          </article>
          <NButton type="info" size="large" block class="dv-btn" @click="loadReport">查看拆柜报表</NButton>
        </section>

        <!-- 创建卡板 -->
        <section v-else-if="step === 'create' && activeTask && selectedDest" class="dv-panel">
          <div class="dv-form-grid">
            <label>目的地</label><span>{{ selectedDest.destination }}</span>
            <label>平台</label><span>{{ selectedDest.platform }}</span>
            <label>库位</label><span>{{ selectedDest.locationCode }}</span>
            <label>柜号</label><span>{{ activeTask.containerNo }}</span>
            <label>箱数</label>
            <NInputNumber v-model:value="palletForm.boxQty" :min="1" size="large" class="dv-field" />
            <label>卡板尺寸 (in)</label>
            <div class="dv-size-row">
              <NInputNumber v-model:value="palletForm.sizeL" :min="1" size="large" />
              <NInputNumber v-model:value="palletForm.sizeW" :min="1" size="large" />
              <NInputNumber v-model:value="palletForm.sizeH" :min="1" size="large" />
            </div>
            <label>SKU 数量</label>
            <NInputNumber v-model:value="palletForm.skuQty" :min="0" size="large" class="dv-field" />
            <label>混板</label><NCheckbox v-model:checked="palletForm.mixedPallet">是否混板</NCheckbox>
            <label>异常</label><NCheckbox v-model:checked="palletForm.exceptionFlag">标记异常</NCheckbox>
            <label>备注</label>
            <NInput v-model:value="palletForm.remark" type="textarea" :rows="2" />
          </div>
          <NButton type="primary" size="large" block class="dv-btn" @click="submitCreatePallet">确认创建卡板</NButton>
        </section>

        <!-- 打印标签 -->
        <section v-else-if="step === 'print' && activePallet" class="dv-panel">
          <div class="dv-label-preview">
            <div class="dv-label-title">卡板标签预览</div>
            <div class="dv-label-no">{{ activePallet.palletNo }}</div>
            <dl class="dv-kv light">
              <div><dt>柜号</dt><dd>{{ activePallet.containerNo }}</dd></div>
              <div><dt>目的地</dt><dd>{{ activePallet.destination }}</dd></div>
              <div><dt>平台</dt><dd>{{ activePallet.platform }}</dd></div>
              <div><dt>库位</dt><dd>{{ activePalletLocation }}</dd></div>
              <div><dt>箱数</dt><dd>{{ activePallet.boxQty }}</dd></div>
              <div><dt>卡板尺寸</dt><dd>{{ activePallet.sizeL }}×{{ activePallet.sizeW }}×{{ activePallet.sizeH }}</dd></div>
              <div><dt>操作员</dt><dd>{{ activePallet.operatorName }}</dd></div>
            </dl>
            <div class="dv-qr">QR</div>
          </div>
          <NButton type="primary" size="large" block class="dv-btn" @click="handlePrint(false)">打印标签</NButton>
          <NButton size="large" block class="dv-btn" @click="handlePrint(false)">重新打印</NButton>
          <NButton quaternary size="large" block class="dv-btn" @click="handlePrint(true)">跳过打印</NButton>
        </section>

        <!-- 扫描入库 -->
        <section v-else-if="step === 'inbound' && activePallet" class="dv-panel">
          <p class="dv-hint">先扫卡板号 <strong>{{ activePalletNo }}</strong>，再扫入库库位</p>
          <NInput v-model:value="scanInput" size="large" placeholder="扫描卡板或库位" @keyup.enter="onInboundEnter" />
          <NSelect v-model:value="inboundLocation" :options="INBOUND_LOCATION_OPTIONS" size="large" placeholder="或选择暂存区" class="dv-field" />
          <NButton type="primary" size="large" block class="dv-btn" @click="processInboundScan(inboundLocation || scanInput)">确认入库绑定</NButton>
        </section>

        <!-- 拍照留底 -->
        <section v-else-if="step === 'photo' && activePallet" class="dv-panel">
          <p class="dv-hint">卡板 {{ activePalletNo }} · 必拍 3 张，可选异常类照片</p>
          <NSelect
            v-model:value="selectedPhotoType"
            :options="[...REQUIRED_PHOTO_TYPES, ...OPTIONAL_PHOTO_TYPES].map(p => ({ label: p.label, value: p.key }))"
            size="large"
            class="dv-field"
          />
          <ul class="dv-photo-list">
            <li v-for="p in activePallet.photos" :key="p.type" :class="{ done: p.captured }">
              {{ p.label }} {{ p.required ? '(必拍)' : '' }} {{ p.captured ? '✓' : '' }}
            </li>
          </ul>
          <NButton type="primary" size="large" block class="dv-btn" @click="capturePhoto">模拟拍照</NButton>
          <NButton size="large" block class="dv-btn" @click="step = 'destinations'">返回建板</NButton>
        </section>

        <!-- 拆柜报表 -->
        <section v-else-if="step === 'report' && report" class="dv-panel">
          <dl class="dv-kv light block">
            <div><dt>柜号</dt><dd>{{ report.containerNo }}</dd></div>
            <div><dt>总卡板</dt><dd>{{ report.totalPalletQty }}</dd></div>
            <div><dt>总箱数</dt><dd>{{ report.totalBoxQty }}</dd></div>
            <div><dt>未打印</dt><dd>{{ report.unprintedCount }}</dd></div>
            <div><dt>未入库</dt><dd>{{ report.uninboundCount }}</dd></div>
            <div><dt>未拍照</dt><dd>{{ report.unphotoCount }}</dd></div>
          </dl>
          <h3 class="dv-section-title">按目的地汇总</h3>
          <article v-for="(row, i) in report.destinationSummary" :key="i" class="dv-mini-card">
            <div>{{ row.destination }} · {{ row.platform }}</div>
            <div class="dv-dest-stats">板 {{ row.palletCount }} · 箱 {{ row.boxCount }} · 入库 {{ row.inboundCount }} · 拍照 {{ row.photoCount }}</div>
          </article>
          <h3 class="dv-section-title">卡板明细</h3>
          <article v-for="p in report.palletDetails" :key="p.palletNo" class="dv-mini-card">
            <div><strong>{{ p.palletNo }}</strong> · {{ p.destination }}</div>
            <div>{{ p.boxQty }} 箱 · {{ p.size }} · {{ PALLET_STATUS_LABEL[p.status] }}</div>
            <div>打印{{ p.printed ? '✓' : '×' }} 入库{{ p.inbound ? '✓' : '×' }} 拍照{{ p.photoDone ? '✓' : '×' }}</div>
          </article>
          <NButton type="primary" size="large" block class="dv-btn" @click="tryFinish">拆柜完成</NButton>
        </section>
      </main>

      <DevanningBottomBar
        v-if="!['entry', 'list', 'create'].includes(step)"
        :disabled="!hasActiveTask && step !== 'scan'"
        :active-step="step"
        @action="bottomAction"
      />

      <NModal v-model:show="showFinishModal" preset="card" title="拆柜完成校验" style="width: 92%; max-width: 320px">
        <ul v-if="finishReasons.length" class="dv-reason-list">
          <li v-for="(r, i) in finishReasons" :key="i">{{ r }}</li>
        </ul>
        <p v-else class="dv-hint">校验通过，确认总板数与总箱数后完成拆柜？</p>
        <template #footer>
          <NButton block size="large" @click="showFinishModal = false">取消</NButton>
          <NButton v-if="!finishReasons.length" block type="primary" size="large" class="dv-btn" @click="confirmFinish">确认完成</NButton>
        </template>
      </NModal>

      <DevanningPhotoUploadModal v-model:show="showPhotoUploadModal" @confirm="confirmPhotoUpload" />
      <DevanningExceptionModal
        v-model:show="showExceptionModal"
        :default-container-no="contextContainerNo"
        :order-options="contextOrderOptions"
        @confirm="confirmExceptionReport"
      />

      <NModal v-model:show="showDetailModal" preset="card" title="任务详情" style="width: 92%; max-width: 340px">
        <dl v-if="detailTask" class="dv-kv light block">
          <div><dt>柜号</dt><dd>{{ detailTask.containerNo }}</dd></div>
          <div><dt>拆柜单号</dt><dd>{{ detailTask.devanningNo }}</dd></div>
          <div><dt>DOCK</dt><dd>{{ detailTask.dock }}</dd></div>
          <div><dt>预约</dt><dd>{{ detailTask.appointmentTime }}</dd></div>
          <div><dt>状态</dt><dd>{{ TASK_STATUS_LABEL[detailTask.status] }}</dd></div>
        </dl>
      </NModal>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.dv-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #fff;
}

.dv-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 4px;
  flex-shrink: 0;
}

.dv-head-text {
  flex: 1;
  min-width: 0;
}

.dv-back {
  min-width: 40px;
  min-height: 40px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

.dv-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.dv-sub {
  margin: 2px 0 0;
  font-size: 11px;
  opacity: 0.85;
}

.dv-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px 12px;
}

.dv-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dv-task-card,
.dv-dest-card,
.dv-mini-card,
.dv-label-preview {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dv-task-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dv-start-btn {
  width: 100%;
  min-height: v-bind(PDA_BTN_MIN_H);
  margin-top: 4px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.dv-start-btn:active {
  background: #1d4ed8;
}

.dv-task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dv-container {
  font-size: 16px;
}

.dv-kv {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 4px 8px;
  margin: 0;
  font-size: 12px;
}

.dv-kv div {
  display: contents;
}

.dv-kv dt {
  opacity: 0.75;
}

.dv-kv dd {
  margin: 0;
  font-weight: 600;
}

.dv-kv.block div {
  display: grid;
  grid-template-columns: 88px 1fr;
}

.dv-btn-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.dv-btn {
  min-height: v-bind(PDA_BTN_MIN_H);
  font-size: 15px;
  font-weight: 600;
}

.dv-hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.9;
}

.dv-scan-input,
.dv-field {
  width: 100%;
}

.dv-dest-card {
  cursor: pointer;
}

.dv-dest-title {
  font-size: 15px;
  font-weight: 700;
}

.dv-dest-meta,
.dv-dest-stats {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.9;
}

.dv-dest-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dv-summary {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.15);
  font-size: 13px;
}

.dv-form-grid {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.dv-size-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.dv-label-preview {
  text-align: center;
}

.dv-label-title {
  font-size: 12px;
  opacity: 0.8;
}

.dv-label-no {
  margin: 6px 0 10px;
  font-size: 18px;
  font-weight: 800;
}

.dv-kv.light dd {
  color: #fff;
}

.dv-qr {
  margin: 10px auto 0;
  width: 72px;
  height: 72px;
  line-height: 72px;
  border-radius: 8px;
  background: #fff;
  color: #333;
  font-weight: 700;
}

.dv-photo-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
}

.dv-photo-list li.done {
  color: #a7f3d0;
}

.dv-section-title {
  margin: 4px 0 0;
  font-size: 14px;
}

.dv-empty {
  padding: 24px;
  text-align: center;
  opacity: 0.8;
}

.dv-reason-list {
  margin: 0;
  padding-left: 18px;
  color: #b91c1c;
  font-size: 13px;
}

.dv-scan-cell {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dv-scan-title,
.dv-push-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.dv-push-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dv-push-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dv-push-count {
  font-size: 12px;
  opacity: 0.85;
}

.dv-push-item {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  text-align: left;
  cursor: pointer;
}

.dv-push-item:active {
  background: rgba(255, 255, 255, 0.18);
}

.dv-push-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dv-push-container {
  font-size: 16px;
  font-weight: 700;
}

.dv-push-no {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.9;
}

.dv-push-meta,
.dv-push-time {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.85;
}

.dv-filter-hint {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.15);
  font-size: 12px;
}
</style>
