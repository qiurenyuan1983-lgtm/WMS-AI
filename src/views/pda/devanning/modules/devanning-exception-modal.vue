<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NInput, NModal, NRadio, NRadioGroup, NSelect, NSpace, NTag } from 'naive-ui';
import {
  DEVANNING_EXCEPTION_TYPES,
  type DevanningExceptionType
} from '../shared/devanning-constants';

defineOptions({ name: 'DevanningExceptionModal' });

const visible = defineModel<boolean>('show', { default: false });

const props = withDefaults(
  defineProps<{
    defaultContainerNo?: string;
    orderOptions?: string[];
    title?: string;
  }>(),
  { title: '异常问题' }
);

const emit = defineEmits<{
  confirm: [payload: {
    containerNo: string;
    containerAutoRecognized: boolean;
    orderNo: string;
    orderUnrecognized: boolean;
    exceptionType: DevanningExceptionType;
    remark: string;
    photoCaptured: boolean;
  }];
}>();

const containerNo = ref('');
const containerAutoRecognized = ref(false);
const orderMode = ref<'select' | 'unrecognized'>('select');
const selectedOrderNo = ref<string | null>(null);
const exceptionType = ref<DevanningExceptionType>('DAMAGE');
const remark = ref('');
const photoReady = ref(false);

const orderSelectOptions = computed(() =>
  (props.orderOptions || []).map(no => ({ label: no, value: no }))
);

const hasOrderOptions = computed(() => orderSelectOptions.value.length > 0);

watch(visible, val => {
  if (!val) return;
  resetForm();
  autoRecognizeContainer();
});

function resetForm() {
  containerNo.value = '';
  containerAutoRecognized.value = false;
  orderMode.value = 'select';
  selectedOrderNo.value = null;
  exceptionType.value = 'DAMAGE';
  remark.value = '';
  photoReady.value = false;
}

function autoRecognizeContainer() {
  const detected = String(props.defaultContainerNo || '').trim().toUpperCase();
  if (!detected) return;
  containerNo.value = detected;
  containerAutoRecognized.value = true;
  if (props.orderOptions?.length) {
    orderMode.value = 'select';
    selectedOrderNo.value = props.orderOptions[0];
  } else {
    orderMode.value = 'unrecognized';
  }
}

function mockRecognizeContainer() {
  const detected = String(props.defaultContainerNo || 'MSCU1234567').trim().toUpperCase();
  containerNo.value = detected;
  containerAutoRecognized.value = true;
  if (props.orderOptions?.length && !selectedOrderNo.value) {
    selectedOrderNo.value = props.orderOptions[0];
  }
  window.$message?.success(`[原型] 已识别柜号 ${detected}`);
}

function mockCapture() {
  photoReady.value = true;
  if (!containerAutoRecognized.value && !containerNo.value.trim()) {
    autoRecognizeContainer();
    if (!containerNo.value.trim()) mockRecognizeContainer();
  }
  window.$message?.success('[原型] 异常照片已拍摄');
}

function handleConfirm() {
  const cn = containerNo.value.trim().toUpperCase();
  if (!cn) {
    window.$message?.warning('请先识别或填写柜号');
    return;
  }
  if (!photoReady.value) {
    window.$message?.warning('请先拍摄异常照片');
    return;
  }
  if (orderMode.value === 'select') {
    if (!hasOrderOptions.value) {
      window.$message?.warning('当前柜号无关联订单，请选择无法识别订单号');
      return;
    }
    if (!selectedOrderNo.value) {
      window.$message?.warning('请选择订单号');
      return;
    }
  }
  if (!remark.value.trim()) {
    window.$message?.warning('请填写问题描述');
    return;
  }

  const typeLabel = DEVANNING_EXCEPTION_TYPES.find(t => t.value === exceptionType.value)?.label || exceptionType.value;

  emit('confirm', {
    containerNo: cn,
    containerAutoRecognized: containerAutoRecognized.value,
    orderNo: orderMode.value === 'select' ? String(selectedOrderNo.value) : '',
    orderUnrecognized: orderMode.value === 'unrecognized',
    exceptionType: exceptionType.value,
    remark: `[${typeLabel}] ${remark.value.trim()}`,
    photoCaptured: photoReady.value
  });
  visible.value = false;
}

function handleCancel() {
  visible.value = false;
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" :style="{ width: '92%', maxWidth: '320px' }">
    <div class="form-field">
      <div class="field-head">
        <label class="field-label">柜号 <em class="required">*</em></label>
        <NTag v-if="containerAutoRecognized" size="small" type="success">已自动识别</NTag>
      </div>
      <NInput
        v-model:value="containerNo"
        size="large"
        placeholder="拍照或扫码后自动识别"
        :readonly="containerAutoRecognized"
        @update:value="containerAutoRecognized = false"
      />
      <NButton
        v-if="!containerAutoRecognized"
        quaternary
        block
        size="small"
        class="field-action"
        @click="mockRecognizeContainer"
      >
        模拟识别柜号
      </NButton>
    </div>

    <div class="form-field">
      <label class="field-label">订单号 <em class="required">*</em></label>
      <NRadioGroup v-model:value="orderMode" class="order-mode">
        <NSpace vertical>
          <NRadio value="select" :disabled="!hasOrderOptions">选择订单号</NRadio>
          <NSelect
            v-if="orderMode === 'select'"
            v-model:value="selectedOrderNo"
            :options="orderSelectOptions"
            size="large"
            placeholder="请选择订单号"
            :disabled="!hasOrderOptions"
          />
          <NRadio value="unrecognized">无法识别订单号</NRadio>
        </NSpace>
      </NRadioGroup>
    </div>

    <div class="form-field">
      <label class="field-label">异常情况 <em class="required">*</em></label>
      <NRadioGroup v-model:value="exceptionType">
        <NSpace vertical>
          <NRadio v-for="item in DEVANNING_EXCEPTION_TYPES" :key="item.value" :value="item.value">
            {{ item.label }}
          </NRadio>
        </NSpace>
      </NRadioGroup>
    </div>

    <div class="form-field">
      <label class="field-label">异常照片 <em class="required">*</em></label>
      <div class="photo-preview">
        <span v-if="photoReady" class="photo-done">✓ 照片已就绪</span>
        <span v-else class="photo-placeholder">请拍摄异常现场照片</span>
      </div>
      <NButton type="warning" block size="large" class="photo-btn" @click="mockCapture">
        {{ photoReady ? '重新拍照' : '模拟拍照' }}
      </NButton>
    </div>

    <div class="form-field">
      <label class="field-label">问题描述 <em class="required">*</em></label>
      <NInput
        v-model:value="remark"
        type="textarea"
        :rows="3"
        placeholder="请补充异常详情，如破损位置、湿箱范围等"
      />
    </div>

    <template #footer>
      <NButton block size="large" @click="handleCancel">取消</NButton>
      <NButton block type="warning" size="large" @click="handleConfirm">提交异常</NButton>
    </template>
  </NModal>
</template>

<style scoped>
.form-field {
  margin-bottom: 12px;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.field-head .field-label {
  margin-bottom: 0;
}

.field-action {
  margin-top: 6px;
}

.order-mode {
  width: 100%;
}

.required {
  color: #dc2626;
  font-style: normal;
}

.photo-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f3f4f6;
  font-size: 13px;
  color: #6b7280;
}

.photo-done {
  color: #34c759;
  font-weight: 600;
}

.photo-btn {
  min-height: 44px;
}
</style>
