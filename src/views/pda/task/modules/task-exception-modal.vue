<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NModal, NRadio, NRadioGroup, NSpace } from 'naive-ui';
import { EXCEPTION_REASONS } from '../../shared/pda-constants';

defineOptions({ name: 'TaskExceptionModal' });

const visible = defineModel<boolean>('show', { default: false });

const emit = defineEmits<{
  confirm: [reason: string];
}>();

const reason = ref<string>(EXCEPTION_REASONS[0]);

function handleConfirm() {
  emit('confirm', reason.value);
  visible.value = false;
}

function handleCancel() {
  visible.value = false;
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="异常上报" :style="{ width: '90%', maxWidth: '320px' }">
    <p class="modal-hint">请选择异常原因</p>
    <NRadioGroup v-model:value="reason">
      <NSpace vertical>
        <NRadio v-for="r in EXCEPTION_REASONS" :key="r" :value="r">{{ r }}</NRadio>
      </NSpace>
    </NRadioGroup>
    <div class="modal-actions">
      <NButton block size="large" @click="handleCancel">取消</NButton>
      <NButton block type="warning" size="large" @click="handleConfirm">确认上报</NButton>
    </div>
  </NModal>
</template>

<style scoped>
.modal-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
