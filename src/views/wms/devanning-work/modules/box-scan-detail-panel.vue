<script setup lang="tsx">
import { computed, nextTick, ref } from 'vue';
import { NButton, NDataTable, NEmpty, NInput, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';

const props = defineProps<{
  scans: Api.Wms.DevanningBoxScanLog[];
  groupCode: string | null;
  labelEntryDisabled?: boolean;
  scanLoading?: boolean;
  scanHint?: string;
  scanDisabled?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}>();

const scanValue = defineModel<string>('scanValue', { default: '' });

const emit = defineEmits<{
  labelEntry: [];
  scanSubmit: [];
}>();

const scanInputRef = ref<{ focus: () => void } | null>(null);

const columns = computed<DataTableColumns<Api.Wms.DevanningBoxScanLog>>(() => [
  { key: 'scanCode', title: props.t('scanCodeCol'), width: 120, ellipsis: { tooltip: true } },
  { key: 'cargoOrderNo', title: props.t('orderCol'), minWidth: 120, ellipsis: { tooltip: true } },
  { key: 'qty', title: props.t('qtyCol'), width: 52, align: 'center' }
]);

const emptyDescription = computed(() =>
  props.groupCode ? props.t('noScanRecords') : props.t('selectDestFirst')
);

function focusScan() {
  nextTick(() => scanInputRef.value?.focus());
}

defineExpose({ focusScan });
</script>

<template>
  <div class="box-scan-panel">
    <div class="scan-module-header">
      <span class="scan-module-title">{{ t('boxScanDetail') }}</span>
      <NTag v-if="groupCode" type="success" size="medium" :bordered="false" class="dest-tag">
        {{ t('destLabel') }}：{{ groupCode }}
      </NTag>
      <span v-else class="dest-empty">{{ t('selectDestFirst') }}</span>
    </div>

    <div v-if="!scanDisabled" class="scan-receive-block">
      <div class="scan-receive-label">{{ t('scanReceive') }}</div>
      <NInput
        ref="scanInputRef"
        v-model:value="scanValue"
        size="large"
        :placeholder="t('scanPlaceholder')"
        :loading="scanLoading"
        :disabled="!groupCode"
        clearable
        @keyup.enter="emit('scanSubmit')"
      />
      <p v-if="scanHint" class="scan-hint">{{ scanHint }}</p>
    </div>

    <p v-if="groupCode" class="hint-text">{{ t('selectGroupHint') }}</p>

    <NDataTable
      v-if="groupCode && scans.length"
      :columns="columns"
      :data="scans"
      :row-key="row => row.id"
      size="small"
      :max-height="200"
      :scroll-x="320"
      class="scan-table"
    />
    <NEmpty v-else :description="emptyDescription" class="py-12px" />

    <div class="scan-module-footer">
      <NButton
        type="success"
        ghost
        class="btn-label-entry"
        :disabled="labelEntryDisabled"
        @click="emit('labelEntry')"
      >
        {{ t('manualGroupEntry') }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.box-scan-panel {
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.scan-module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.scan-module-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.scan-receive-block {
  margin-bottom: 10px;
}

.scan-receive-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.scan-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #059669;
  line-height: 1.4;
}

.dest-tag {
  font-weight: 600;
  max-width: 58%;
}

.dest-tag :deep(.n-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dest-empty {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
}

.hint-text {
  margin: 0 0 8px;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.4;
}

.scan-table {
  flex: 1;
}

.scan-module-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 12px;
}

.btn-label-entry {
  border: 1px solid #22c55e !important;
  color: #16a34a !important;
  font-weight: 600;
  min-width: 96px;
}

.btn-label-entry:hover:not(:disabled),
.btn-label-entry:focus:not(:disabled) {
  border-color: #16a34a !important;
  background: #f0fdf4 !important;
  color: #15803d !important;
}

.btn-label-entry:disabled {
  opacity: 0.45;
}
</style>
