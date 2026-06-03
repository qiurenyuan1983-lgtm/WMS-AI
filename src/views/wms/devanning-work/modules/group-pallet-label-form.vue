<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { NButton, NForm, NFormItem, NInputNumber, NSpace } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchCreateDevanningGroupPalletLabel } from '@/service/api/wms/devanning-work';
import { printPalletLabel } from '../utils/print-pallet-label';
import TouchBoxQtyKeypad from './touch-box-qty-keypad.vue';

defineOptions({ name: 'GroupPalletLabelForm' });

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
const qtyKeypadOpen = ref(false);

const form = reactive({
  qty: (props.initialQty != null && props.initialQty > 0 ? props.initialQty : null) as number | null,
  lengthCm: 40,
  widthCm: 72,
  heightCm: 48,
  weightKg: null as number | null
});

const remainQty = computed(() =>
  Math.max(0, props.group.totalExpectedQty - props.group.totalReceivedQty)
);

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
  printPalletLabel(data.pallet);
  emit('success', data);
}

function handleCancel() {
  emit('cancel');
}

function toggleQtyKeypad() {
  if (props.disabled || remainQty.value <= 0) return;
  qtyKeypadOpen.value = !qtyKeypadOpen.value;
}

const qtyDisplay = computed(() =>
  form.qty != null && form.qty > 0 ? String(form.qty) : ''
);
</script>

<template>
  <div>
    <p class="text-13px text-#6b7280 m-0 mb-16px">
      剩余可收 {{ remainQty }} · {{ group.orders.length }} 单
    </p>
    <NForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      :disabled="disabled"
    >
      <NFormItem label="箱数" path="qty">
        <div class="qty-field">
          <button
            type="button"
            class="qty-trigger"
            :class="{
              'qty-trigger-empty': !qtyDisplay,
              'qty-trigger-disabled': disabled || remainQty <= 0,
              'qty-trigger-active': qtyKeypadOpen
            }"
            :disabled="disabled || remainQty <= 0"
            @click="toggleQtyKeypad"
          >
            {{ qtyDisplay || '点击输入箱数' }}
          </button>
          <TouchBoxQtyKeypad
            v-if="qtyKeypadOpen"
            v-model="form.qty"
            :max="remainQty"
            :disabled="disabled || remainQty <= 0"
          />
        </div>
      </NFormItem>
      <div class="grid grid-cols-3 gap-12px">
        <NFormItem label="长 (cm)" path="lengthCm">
          <NInputNumber
            v-model:value="form.lengthCm"
            size="large"
            :min="0.1"
            placeholder="长"
            class="w-full"
            :show-button="false"
          />
        </NFormItem>
        <NFormItem label="宽 (cm)" path="widthCm">
          <NInputNumber
            v-model:value="form.widthCm"
            size="large"
            :min="0.1"
            placeholder="宽"
            class="w-full"
            :show-button="false"
          />
        </NFormItem>
        <NFormItem label="高 (cm)" path="heightCm">
          <NInputNumber
            v-model:value="form.heightCm"
            size="large"
            :min="0.1"
            placeholder="高"
            class="w-full"
            :show-button="false"
          />
        </NFormItem>
      </div>
      <NFormItem label="重量 (kg)">
        <NInputNumber
          v-model:value="form.weightKg"
          size="large"
          :min="0.1"
          placeholder="选填"
          class="w-full"
          clearable
          :show-button="false"
        />
      </NFormItem>

      <NSpace justify="center" class="mt-24px" :size="16">
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
    </NForm>
  </div>
</template>

<style scoped>
.qty-field {
  width: 100%;
}

.qty-trigger {
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

.qty-trigger-empty {
  color: #9ca3af;
  font-size: 15px;
  font-weight: 500;
}

.qty-trigger-active {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgb(37 99 235 / 12%);
}

.qty-trigger-disabled {
  cursor: not-allowed;
  background: #f3f4f6;
  color: #9ca3af;
}
</style>
