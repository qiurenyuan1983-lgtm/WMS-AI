<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { NButton, NForm, NFormItem, NSpace } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchCreateDevanningGroupPalletLabel } from '@/service/api/wms/devanning-work';
import { enrichPalletForPrint, printPalletLabel } from '../utils/print-pallet-label';
import TouchBoxQtyKeypad from './touch-box-qty-keypad.vue';

defineOptions({ name: 'GroupPalletLabelForm' });

type NumericField = 'qty' | 'lengthCm' | 'widthCm' | 'heightCm' | 'weightKg';

const props = defineProps<{
  taskId: string;
  groupCode: string;
  group: Api.Wms.DevanningWorkGroup;
  disabled?: boolean;
  initialQty?: number | null;
}>();

const emit = defineEmits<{
  cancel: [];
  success: [result: Api.Wms.DevanningGroupPalletLabelResult];
}>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const activeField = ref<NumericField>('qty');

const form = reactive({
  qty: (props.initialQty != null && props.initialQty > 0 ? props.initialQty : null) as number | null,
  lengthCm: 40,
  widthCm: 72,
  heightCm: 48,
  weightKg: null as number | null
});

const fieldMeta: Record<NumericField, { label: string; placeholder: string; path?: NumericField }> = {
  qty: { label: '箱数', placeholder: '点击输入箱数', path: 'qty' },
  lengthCm: { label: '长 (cm)', placeholder: '长' },
  widthCm: { label: '宽 (cm)', placeholder: '宽' },
  heightCm: { label: '高 (cm)', placeholder: '高' },
  weightKg: { label: '重量 (kg)', placeholder: '选填' }
};

const remainQty = computed(() =>
  Math.max(0, props.group.totalExpectedQty - props.group.totalReceivedQty)
);

const activeFieldLabel = computed(() => fieldMeta[activeField.value].label);

const activeAllowDecimal = computed(() => activeField.value !== 'qty');

const activeMax = computed(() => (activeField.value === 'qty' ? remainQty.value : undefined));

const activeValue = computed({
  get(): number | null {
    return form[activeField.value];
  },
  set(value: number | null) {
    form[activeField.value] = value;
  }
});

const rules: FormRules = {
  qty: [
    {
      required: true,
      type: 'number',
      message: '请输入箱数',
      trigger: ['blur', 'input']
    },
    {
      validator: (_rule, value: number | null) => {
        if (value == null || value <= 0) return new Error('箱数须大于 0');
        if (value > remainQty.value) return new Error(`不能超过剩余 ${remainQty.value}`);
        return true;
      },
      trigger: ['blur', 'input']
    }
  ],
  lengthCm: [{ required: true, type: 'number', message: '请输入长度', trigger: ['blur', 'input'] }],
  widthCm: [{ required: true, type: 'number', message: '请输入宽度', trigger: ['blur', 'input'] }],
  heightCm: [{ required: true, type: 'number', message: '请输入高度', trigger: ['blur', 'input'] }]
};

function displayValue(field: NumericField): string {
  const value = form[field];
  if (value == null) return '';
  return String(value);
}

function isFieldEmpty(field: NumericField): boolean {
  return displayValue(field) === '';
}

function selectField(field: NumericField) {
  if (props.disabled) return;
  if (field === 'qty' && remainQty.value <= 0) return;
  activeField.value = field;
}

function isFieldActive(field: NumericField): boolean {
  return activeField.value === field;
}

function isFieldDisabled(field: NumericField): boolean {
  return Boolean(props.disabled) || (field === 'qty' && remainQty.value <= 0);
}

async function handleConfirm() {
  if (props.disabled || submitting.value) return;
  await formRef.value?.validate();
  submitting.value = true;
  const { data, error } = await fetchCreateDevanningGroupPalletLabel(props.taskId, {
    groupCode: props.groupCode,
    qty: Number(form.qty),
    lengthCm: Number(form.lengthCm),
    widthCm: Number(form.widthCm),
    heightCm: Number(form.heightCm),
    weightKg: form.weightKg != null ? Number(form.weightKg) : 0
  });
  submitting.value = false;
  if (error || !data?.pallet) return;
  window.$message?.success(`板贴已生成：${data.pallet.palletNo}`);
  await printPalletLabel(enrichPalletForPrint(data.pallet, data.session));
  emit('success', data);
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <div class="pallet-label-form">
    <p class="text-13px text-#6b7280 m-0 mb-16px">
      剩余可收 {{ remainQty }} · {{ group.orders.length }} 单
    </p>
    <NForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      :disabled="disabled"
      class="pallet-label-form__fields"
    >
      <NFormItem label="箱数" path="qty">
        <button
          type="button"
          class="num-trigger"
          :class="{
            'num-trigger-empty': isFieldEmpty('qty'),
            'num-trigger-active': isFieldActive('qty'),
            'num-trigger-disabled': isFieldDisabled('qty')
          }"
          :disabled="isFieldDisabled('qty')"
          @click="selectField('qty')"
        >
          {{ displayValue('qty') || fieldMeta.qty.placeholder }}
        </button>
      </NFormItem>

      <div class="pallet-size-section">
        <div class="pallet-size-section__title">卡板尺寸</div>
        <div class="grid grid-cols-3 gap-12px">
        <NFormItem label="长 (cm)" path="lengthCm">
          <button
            type="button"
            class="num-trigger"
            :class="{
              'num-trigger-empty': isFieldEmpty('lengthCm'),
              'num-trigger-active': isFieldActive('lengthCm'),
              'num-trigger-disabled': isFieldDisabled('lengthCm')
            }"
            :disabled="isFieldDisabled('lengthCm')"
            @click="selectField('lengthCm')"
          >
            {{ displayValue('lengthCm') || fieldMeta.lengthCm.placeholder }}
          </button>
        </NFormItem>
        <NFormItem label="宽 (cm)" path="widthCm">
          <button
            type="button"
            class="num-trigger"
            :class="{
              'num-trigger-empty': isFieldEmpty('widthCm'),
              'num-trigger-active': isFieldActive('widthCm'),
              'num-trigger-disabled': isFieldDisabled('widthCm')
            }"
            :disabled="isFieldDisabled('widthCm')"
            @click="selectField('widthCm')"
          >
            {{ displayValue('widthCm') || fieldMeta.widthCm.placeholder }}
          </button>
        </NFormItem>
        <NFormItem label="高 (cm)" path="heightCm">
          <button
            type="button"
            class="num-trigger"
            :class="{
              'num-trigger-empty': isFieldEmpty('heightCm'),
              'num-trigger-active': isFieldActive('heightCm'),
              'num-trigger-disabled': isFieldDisabled('heightCm')
            }"
            :disabled="isFieldDisabled('heightCm')"
            @click="selectField('heightCm')"
          >
            {{ displayValue('heightCm') || fieldMeta.heightCm.placeholder }}
          </button>
        </NFormItem>
        </div>
      </div>

      <NFormItem label="重量 (kg)">
        <button
          type="button"
          class="num-trigger"
          :class="{
            'num-trigger-empty': isFieldEmpty('weightKg'),
            'num-trigger-active': isFieldActive('weightKg'),
            'num-trigger-disabled': isFieldDisabled('weightKg')
          }"
          :disabled="isFieldDisabled('weightKg')"
          @click="selectField('weightKg')"
        >
          {{ displayValue('weightKg') || fieldMeta.weightKg.placeholder }}
        </button>
      </NFormItem>
    </NForm>

    <div class="pallet-label-form__keypad">
      <p class="keypad-hint">当前编辑：{{ activeFieldLabel }}</p>
      <TouchBoxQtyKeypad
        v-model="activeValue"
        :max="activeMax"
        :allow-decimal="activeAllowDecimal"
        :disabled="disabled || isFieldDisabled(activeField)"
      />
    </div>

    <NSpace justify="center" class="mt-16px" :size="16">
      <NButton size="large" class="min-w-120px" @click="handleCancel">取消</NButton>
      <NButton
        type="primary"
        size="large"
        class="min-w-120px"
        :loading="submitting"
        :disabled="disabled || remainQty <= 0"
        @click="handleConfirm"
      >
        确认
      </NButton>
    </NSpace>
  </div>
</template>

<style scoped>
.pallet-label-form {
  display: flex;
  flex-direction: column;
}

.pallet-label-form__fields {
  flex-shrink: 0;
}

.pallet-label-form__keypad {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.keypad-hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
}

.num-trigger {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
}

.num-trigger-empty {
  color: #9ca3af;
  font-size: 15px;
  font-weight: 500;
}

.num-trigger-active {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgb(37 99 235 / 12%);
}

.num-trigger-disabled {
  cursor: not-allowed;
  background: #f3f4f6;
  color: #9ca3af;
}

.pallet-size-section__title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
</style>
