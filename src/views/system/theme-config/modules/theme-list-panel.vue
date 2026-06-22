<script setup lang="tsx">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import ThemeSearchForm from './theme-search-form.vue';

defineOptions({ name: 'ThemeListPanel' });

interface Props {
  searchParams: Api.System.ThemeConfigSearchParams;
  columns: DataTableColumns<Api.System.ThemeConfig>;
  data: Api.System.ThemeConfig[];
  loading: boolean;
  scrollX?: number;
  pagination: any;
  selectedId: CommonType.IdType | null;
  editorMode: 'create' | 'edit';
  checkedRowKeys: Array<string | number>;
}

interface Emits {
  (e: 'update:searchParams', v: Api.System.ThemeConfigSearchParams): void;
  (e: 'update:checkedRowKeys', v: Array<string | number>): void;
  (e: 'search'): void;
  (e: 'reset'): void;
  (e: 'select', row: Api.System.ThemeConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchModel = computed({
  get: () => props.searchParams,
  set: v => emit('update:searchParams', v)
});

const checkedKeys = computed({
  get: () => props.checkedRowKeys,
  set: v => emit('update:checkedRowKeys', v)
});
</script>

<template>
  <div class="theme-list-panel">
    <ThemeSearchForm v-model:search-params="searchModel" @search="$emit('search')" @reset="$emit('reset')" />
    <NDataTable
      v-model:checked-row-keys="checkedKeys"
      :columns="columns"
      :data="data"
      :loading="loading"
      :scroll-x="scrollX"
      :pagination="pagination"
      :flex-height="true"
      :row-key="(row: Api.System.ThemeConfig) => row.themeId"
      :row-props="(row: Api.System.ThemeConfig) => ({
        style:
          editorMode !== 'create' && String(selectedId) === String(row.themeId)
            ? 'background: rgba(24,144,255,0.08)'
            : '',
        onClick: () => $emit('select', row)
      })"
      size="small"
      class="theme-table"
    />
  </div>
</template>

<style scoped lang="scss">
.theme-list-panel {
  flex: 0 0 40%;
  max-width: 680px;
  min-width: 420px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 12px 32px rgba(24, 144, 255, 0.08);
  border-radius: 14px;
}

.theme-table {
  flex: 1;
  min-height: 360px;

  :deep(.n-data-table-th) {
    background: #eaf3ff !important;
    color: #1f2d3d;
    font-weight: 500;
    font-size: 13px;
  }

  :deep(.n-data-table-td) {
    cursor: pointer;
    font-size: 13px;
  }

  :deep(.n-data-table-wrapper) {
    border-radius: 8px;
  }
}

@media (max-width: 1366px) {
  .theme-list-panel {
    flex: 1 1 auto;
    max-width: none;
    min-width: 0;
    max-height: 46vh;
  }
}
</style>
