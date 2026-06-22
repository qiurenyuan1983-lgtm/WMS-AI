<script setup lang="ts">
import { MOCK_THEME_VERSION_HISTORY } from '../shared/version-history.mock';

defineOptions({ name: 'ThemeVersionModal' });

const visible = defineModel<boolean>('visible', { default: false });

const columns = [
  { key: 'version', title: '版本', width: 90 },
  { key: 'action', title: '操作', width: 80 },
  { key: 'operator', title: '操作人', width: 90 },
  { key: 'time', title: '时间', width: 160 },
  { key: 'remark', title: '备注', ellipsis: { tooltip: true } }
];
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="版本记录" class="w-720px forest-version-modal">
    <NDataTable :columns="columns" :data="MOCK_THEME_VERSION_HISTORY" size="small" :bordered="false" />
    <template #footer>
      <NButton @click="visible = false">关闭</NButton>
    </template>
  </NModal>
</template>
