<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchApplyMenuButtonTemplate } from '@/service/api/system';
import { $t } from '@/locales';
import { BUTTON_PERM_TEMPLATES } from '../constants';

defineOptions({ name: 'MenuButtonTemplateModal' });

const props = defineProps<{
  parentMenu?: Api.System.Menu | null;
}>();

const emit = defineEmits<{
  (e: 'submitted'): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const templateKey = ref(BUTTON_PERM_TEMPLATES[0]?.key || '');
const applying = ref(false);

const templateOptions = computed(() =>
  BUTTON_PERM_TEMPLATES.map(item => ({
    label: item.label,
    value: item.key
  }))
);

const selectedTemplate = computed(() => BUTTON_PERM_TEMPLATES.find(item => item.key === templateKey.value));

watch(visible, val => {
  if (val) templateKey.value = BUTTON_PERM_TEMPLATES[0]?.key || '';
});

async function handleApply() {
  if (!props.parentMenu?.menuId || props.parentMenu.menuType !== 'C') {
    window.$message?.warning($t('page.system.menu.templatePageRequired'));
    return;
  }

  applying.value = true;
  const { data, error } = await fetchApplyMenuButtonTemplate({
    templateKey: templateKey.value,
    parentMenuId: props.parentMenu.menuId,
    routeKey: props.parentMenu.menuName
  });
  applying.value = false;

  if (error) return;
  if (!data?.success) {
    window.$message?.warning(data?.message || $t('page.system.menu.templateApplyFailed'));
    return;
  }

  window.$message?.success(
    `${$t('page.system.menu.applyButtonTemplate')}${$t('common.updateSuccess')}：${$t('page.system.menu.importCreated')} ${data.added}，${$t('page.system.menu.importSkipped')} ${data.skipped}`
  );
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.system.menu.applyButtonTemplate')"
    class="w-560px max-w-95vw"
    :mask-closable="false"
  >
    <NSpace vertical>
      <NAlert type="warning" :show-icon="false">
        {{ $t('page.system.menu.templateTip') }}
      </NAlert>
      <NFormItem :label="$t('page.system.menu.targetPage')" label-placement="left">
        <NInput :value="parentMenu?.menuName?.startsWith('route.') ? $t(parentMenu.menuName as App.I18n.I18nKey) : parentMenu?.menuName" disabled />
      </NFormItem>
      <NFormItem :label="$t('page.system.menu.buttonTemplate')" label-placement="left">
        <NSelect v-model:value="templateKey" :options="templateOptions" />
      </NFormItem>
      <NDataTable
        v-if="selectedTemplate"
        size="small"
        :max-height="240"
        :columns="[
          { title: $t('page.system.menu.menuName'), key: 'menuName', width: 100 },
          { title: $t('page.system.menu.perms'), key: 'perms', minWidth: 180 },
          { title: $t('page.system.menu.highRisk'), key: 'highRisk', width: 72, render: (row: any) => (row.highRisk ? '是' : '否') }
        ]"
        :data="selectedTemplate.buttons"
      />
    </NSpace>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="applying" @click="handleApply">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
