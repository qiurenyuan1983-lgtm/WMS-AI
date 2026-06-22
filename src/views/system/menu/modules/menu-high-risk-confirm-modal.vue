<script setup lang="ts">
import { ref, watch } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'MenuHighRiskConfirmModal' });

const props = defineProps<{
  title?: string;
  content?: string;
}>();

const emit = defineEmits<{
  (e: 'confirm', remark: string): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const remark = ref('');

watch(visible, val => {
  if (val) remark.value = '';
});

function handleConfirm() {
  if (!remark.value.trim()) {
    window.$message?.warning($t('page.system.menu.confirmRemarkRequired'));
    return false;
  }
  emit('confirm', remark.value.trim());
  return true;
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="dialog"
    :title="title || $t('page.system.menu.highRiskConfirmTitle')"
    :positive-text="$t('common.confirm')"
    :negative-text="$t('common.cancel')"
    @positive-click="handleConfirm"
  >
    <div class="py-8px text-14px text-#666">
      {{ content || $t('page.system.menu.highRiskConfirmContent') }}
    </div>
    <NInput
      v-model:value="remark"
      type="textarea"
      :rows="3"
      :placeholder="$t('page.system.menu.confirmRemarkPlaceholder')"
    />
  </NModal>
</template>
