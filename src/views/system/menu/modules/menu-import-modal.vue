<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { fetchImportMenus } from '@/service/api/system';
import { $t } from '@/locales';

defineOptions({ name: 'MenuImportModal' });

const emit = defineEmits<{
  (e: 'submitted'): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const importMode = ref<'merge' | 'replace'>('merge');
const fileList = ref<UploadFileInfo[]>([]);
const importing = ref(false);

watch(visible, val => {
  if (val) {
    importMode.value = 'merge';
    fileList.value = [];
  }
});

async function handleImport() {
  const file = fileList.value[0]?.file;
  if (!file) {
    window.$message?.warning($t('page.system.menu.importFileRequired'));
    return;
  }

  importing.value = true;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const menus = Array.isArray(parsed) ? parsed : parsed?.menus;
    if (!Array.isArray(menus) || !menus.length) {
      window.$message?.error($t('page.system.menu.importFormatError'));
      return;
    }

    const { data, error } = await fetchImportMenus({ menus, mode: importMode.value });
    if (error) return;

    window.$message?.success(
      `${$t('page.system.menu.importMenu')}${$t('common.updateSuccess')}：${$t('page.system.menu.importCreated')} ${data?.created ?? 0}，${$t('page.system.menu.importUpdated')} ${data?.updated ?? 0}，${$t('page.system.menu.importSkipped')} ${data?.skipped ?? 0}`
    );
    visible.value = false;
    emit('submitted');
  } catch {
    window.$message?.error($t('page.system.menu.importFormatError'));
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.system.menu.importMenu')"
    class="w-480px max-w-95vw"
    :mask-closable="false"
  >
    <NSpace vertical>
      <NAlert type="info" :show-icon="false">
        {{ $t('page.system.menu.importTip') }}
      </NAlert>
      <NFormItem :label="$t('page.system.menu.importMode')" label-placement="left">
        <NRadioGroup v-model:value="importMode">
          <NRadio value="merge" :label="$t('page.system.menu.importModeMerge')" />
          <NRadio value="replace" :label="$t('page.system.menu.importModeReplace')" />
        </NRadioGroup>
      </NFormItem>
      <NUpload
        v-model:file-list="fileList"
        :max="1"
        accept=".json,application/json"
        :default-upload="false"
      >
        <NButton>{{ $t('page.system.menu.selectImportFile') }}</NButton>
      </NUpload>
    </NSpace>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="importing" @click="handleImport">{{ $t('page.system.menu.importMenu') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
