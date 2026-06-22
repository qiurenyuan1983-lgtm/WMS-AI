<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui';
import { NTag } from 'naive-ui';
import { menuIsFrameRecord } from '@/constants/business';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import DictTag from '@/components/custom/dict-tag.vue';
import ButtonIcon from '@/components/custom/button-icon.vue';
import { formatApplicablePorts } from '../constants';

defineOptions({ name: 'MenuDetailDrawer' });

const props = defineProps<{
  menu?: Api.System.Menu | null;
  parentName?: string;
  menuTypeLabel?: string;
  btnData?: Api.System.Menu[];
  btnLoading?: boolean;
  btnColumns?: DataTableColumns<Api.System.Menu>;
  canDelete?: boolean;
  isCatalog?: boolean;
  isMenu?: boolean;
  isExternalType?: boolean;
  isIframeType?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'add-child'): void;
  (e: 'refresh-buttons'): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const { hasAuth } = useAuth();
const appStore = useAppStore();

const tagMap: Record<'0' | '1' | '2', NaiveUI.ThemeColor> = {
  '0': 'success',
  '1': 'warning',
  '2': 'primary'
};

function renderMenuName(menuName?: string) {
  if (!menuName) return '-';
  return menuName.startsWith('route.') || menuName.startsWith('menu.')
    ? $t(menuName as App.I18n.I18nKey)
    : menuName;
}

function renderIframeQuery(queryParam?: string) {
  try {
    return JSON.parse(queryParam || '{}')?.url;
  } catch {
    return queryParam;
  }
}

const drawerTitle = () => {
  if (!props.menu) return $t('page.system.menu.menuDetail');
  return `${$t('page.system.menu.menuDetail')} - ${renderMenuName(props.menu.menuName)}`;
};
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="720" class="max-w-95%">
    <NDrawerContent :title="drawerTitle()" :native-scrollbar="false" closable>
      <template v-if="menu" #header-extra>
        <NSpace>
          <NButton
            v-if="isCatalog && hasAuth('system:menu:add')"
            size="small"
            ghost
            type="primary"
            @click="emit('add-child')"
          >
            {{ $t('page.system.menu.addChildMenu') }}
          </NButton>
          <NButton v-if="hasAuth('system:menu:edit')" size="small" ghost type="primary" @click="emit('edit')">
            {{ $t('common.edit') }}
          </NButton>
          <NPopconfirm @positive-click="emit('delete')">
            <template #trigger>
              <NButton
                v-if="hasAuth('system:menu:remove')"
                size="small"
                ghost
                type="error"
                :disabled="!canDelete"
              >
                {{ $t('common.delete') }}
              </NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </NSpace>
      </template>

      <template v-if="menu">
        <NDescriptions
          label-placement="left"
          size="small"
          bordered
          :column="appStore.isMobile ? 1 : 2"
          label-class="w-30% min-w-88px"
        >
          <NDescriptionsItem :label="$t('page.system.menu.menuName')">
            {{ renderMenuName(menu.menuName) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.menuNameEn')">
            {{ menu.menuNameEn || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.menuCode')">
            {{ menu.menuCode || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.parentMenu')">
            {{ parentName || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.menuType')">
            <NTag class="m-1" size="small" type="primary">{{ menuTypeLabel }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.orderNum')">
            {{ menu.orderNum }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.status')">
            <DictTag size="small" :value="menu.status" dict-code="sys_normal_disable" />
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.visible')">
            <DictTag size="small" :value="menu.visible" dict-code="sys_show_hide" />
          </NDescriptionsItem>
          <NDescriptionsItem v-if="isMenu" :label="$t('page.system.menu.component')">
            {{
              menu.component?.startsWith('layout.blank$view.')
                ? `${menu.component?.slice(18)?.replaceAll('_', '/')}/index`
                : menu.component
            }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="!isExternalType ? $t('page.system.menu.path') : $t('page.system.menu.externalPath')">
            {{ menu.path }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="isMenu && !isExternalType && !isIframeType" :label="$t('page.system.menu.query')">
            {{ menu.queryParam }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="isMenu && !isExternalType && isIframeType" :label="$t('page.system.menu.iframeQuery')">
            {{ renderIframeQuery(menu.queryParam) }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="!isCatalog" :label="$t('page.system.menu.perms')">
            {{ menu.perms || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="!isCatalog" :label="$t('page.system.menu.permName')">
            {{ menu.permName || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.applicablePorts')">
            {{ formatApplicablePorts(menu.applicablePorts) }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="!isCatalog" :label="$t('page.system.menu.highRisk')">
            <NTag size="small" :type="menu.highRisk ? 'error' : 'default'">
              {{ menu.highRisk ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.isFrame')">
            <NTag v-if="menu.isFrame" class="m-1" size="small" :type="tagMap[menu.isFrame]">
              {{ menuIsFrameRecord[menu.isFrame] }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem v-if="isMenu" :label="$t('page.system.menu.isCache')">
            <NTag v-if="menu.isCache" class="m-1" size="small" :type="tagMap[menu.isCache]">
              {{ menu.isCache === '0' ? $t('page.system.menu.cache') : $t('page.system.menu.noCache') }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.createTime')">
            {{ menu.createTime }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.system.menu.updateTime')">
            {{ menu.updateTime || '-' }}
          </NDescriptionsItem>
        </NDescriptions>

        <NCard
          v-if="menu.menuType === 'C'"
          class="mt-16px card-wrapper"
          :title="$t('page.system.menu.buttonPermissionList')"
          :bordered="false"
          size="small"
        >
          <template #header-extra>
            <ButtonIcon
              size="small"
              icon="ic-round-refresh"
              class="h-28px text-icon"
              :tooltip-content="$t('common.refresh')"
              @click.stop="emit('refresh-buttons')"
            />
          </template>
          <NDataTable :loading="btnLoading" :columns="btnColumns || []" :data="btnData || []" size="small" />
        </NCard>
      </template>
      <NEmpty v-else :description="$t('page.system.menu.selectMenuHint')" class="py-24px" />
    </NDrawerContent>
  </NDrawer>
</template>
