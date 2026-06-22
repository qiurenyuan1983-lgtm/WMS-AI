<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { jsonClone } from '@sa/utils';
import { menuIconTypeOptions, menuIsFrameOptions, menuLayoutOptions, menuTypeOptions } from '@/constants/business';
import { fetchCreateMenu, fetchUpdateMenu } from '@/service/api/system';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { getLocalMenuIcons } from '@/utils/icon';
import { isNotNull } from '@/utils/common';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import MenuHighRiskConfirmModal from './menu-high-risk-confirm-modal.vue';
import {
  OPEN_MODE_OPTIONS,
  PERM_TYPE_OPTIONS,
  PORT_OPTIONS,
  ROLE_OPTIONS,
  TENANT_OPTIONS,
  WAREHOUSE_OPTIONS,
  joinCsv,
  splitCsv
} from '../constants';

defineOptions({
  name: 'MenuOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.System.Menu | null;
  treeData?: Api.System.Menu[] | null;
  pid?: string | number;
  menuType?: Api.System.MenuType;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted', menuType: Api.System.MenuType): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });
const activeTab = ref('basic');

const defaultIcon = import.meta.env.VITE_MENU_ICON;
const layoutType = ref<string>('0');
const iconType = ref<Api.System.IconType>('1');
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule, createNumberRequiredRule } = useFormRules();
const queryList = ref<{ key: string; value: string }[]>([]);

const applicablePortsArr = ref<string[]>(['BACKEND']);
const applicableWarehousesArr = ref<string[]>([]);
const applicableRolesArr = ref<string[]>([]);
const applicableTenantsArr = ref<string[]>([]);
const highRiskConfirmVisible = ref(false);
const pendingConfirmRemark = ref('');

const drawerTitle = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.system.menu.addMenu'),
    edit: $t('page.system.menu.editMenu')
  };
  return titles[props.operateType];
});

type Model = Api.System.MenuOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    parentId: props.pid || 0,
    menuName: '',
    menuNameEn: '',
    menuCode: '',
    permName: '',
    permType: props.menuType === 'F' ? 'button' : 'menu',
    highRisk: false,
    needConfirm: false,
    auditLog: props.menuType === 'F',
    applicablePorts: 'BACKEND',
    applicableWarehouses: '',
    applicableRoles: '',
    applicableTenants: '',
    affixTab: false,
    openMode: 'self',
    orderNum: 1,
    path: '',
    component: '',
    queryParam: '',
    isFrame: '1',
    isCache: '1',
    menuType: props.menuType || 'M',
    visible: '0',
    status: '0',
    perms: '',
    icon: defaultIcon,
    remark: ''
  };
}

type RuleKey = Extract<keyof Model, 'menuName' | 'orderNum' | 'path' | 'component'>;

const rules = computed<Partial<Record<RuleKey, App.Global.FormRule>>>(() => {
  const base: Partial<Record<RuleKey, App.Global.FormRule>> = {
    menuName: createRequiredRule($t('page.system.menu.form.menuName.invalid')),
    orderNum: createNumberRequiredRule($t('page.system.menu.form.orderNum.invalid'))
  };
  if (!isBtn.value) {
    base.path = createRequiredRule($t('page.system.menu.form.path.invalid'));
    if (isMenu.value && isInternalType.value) {
      base.component = createRequiredRule($t('page.system.menu.form.component.invalid'));
    }
  }
  return base;
});

const isCatalog = computed(() => model.value.menuType === 'M');
const isMenu = computed(() => model.value.menuType === 'C');
const isBtn = computed(() => model.value.menuType === 'F');
const isExternalType = computed(() => model.value.isFrame === '0');
const isInternalType = computed(() => model.value.isFrame === '1');
const isBlankLayout = computed(() => layoutType.value === '1');
const isIframeType = computed(() => model.value.isFrame === '2');
const isLocalIcon = computed(() => iconType.value === '2');
const layoutDisabled = computed(() => !(isMenu.value && model.value.parentId === 0));

const localIcons = getLocalMenuIcons();
const localIconOptions = localIcons.map<SelectOption>(item => ({
  label: () => (
    <div class="flex-y-center gap-16px">
      <SvgIcon localIcon={`menu-${item}`} class="text-icon" />
      <span>{item}</span>
    </div>
  ),
  value: `local-icon-${item}`
}));

function syncScopeArraysFromModel() {
  applicablePortsArr.value = splitCsv(model.value.applicablePorts).length ? splitCsv(model.value.applicablePorts) : ['BACKEND'];
  applicableWarehousesArr.value = splitCsv(model.value.applicableWarehouses);
  applicableRolesArr.value = splitCsv(model.value.applicableRoles);
  applicableTenantsArr.value = splitCsv(model.value.applicableTenants);
}

function syncScopeArraysToModel() {
  model.value.applicablePorts = joinCsv(applicablePortsArr.value);
  model.value.applicableWarehouses = joinCsv(applicableWarehousesArr.value);
  model.value.applicableRoles = joinCsv(applicableRolesArr.value);
  model.value.applicableTenants = joinCsv(applicableTenantsArr.value);
}

function handleInitModel() {
  queryList.value = [];
  iconType.value = '1';
  layoutType.value = '0';
  activeTab.value = 'basic';
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, jsonClone(props.rowData));
    const component = model.value.component;
    if (component?.startsWith('layout.blank$view.')) {
      layoutType.value = '1';
      model.value.component = component?.slice(18)?.replaceAll('_', '/');
    } else if (isMenu.value && isInternalType.value) {
      model.value.component = component?.slice(0, -6);
    }
    iconType.value = model.value.icon?.startsWith('local-icon-') ? '2' : '1';

    if (model.value.isFrame === '1') {
      try {
        const queryObj: Record<string, string> = JSON.parse(model.value.queryParam || '{}');
        queryList.value = Object.keys(queryObj).map(item => ({ key: item, value: queryObj[item] }));
      } catch {
        queryList.value = [];
      }
    } else {
      try {
        if (model.value.isFrame === '2') {
          model.value.queryParam = JSON.parse(model.value.queryParam || '{}')?.url || '';
        }
      } catch {}
    }
  }

  syncScopeArraysFromModel();
}

function closeDrawer() {
  visible.value = false;
}

function processPath(path: string | null | undefined): string {
  return path?.startsWith('/') ? path.substring(1) : path || '';
}

function processComponent(component: string | null | undefined): string {
  if (isCatalog.value && isInternalType.value) return 'Layout';
  if (isIframeType.value || isExternalType.value) return 'FrameView';
  if (isMenu.value && isBlankLayout.value) return `layout.blank$view.${component?.replaceAll('/', '_')}`;
  if (isMenu.value && isInternalType.value) {
    return component?.endsWith('/index') ? component : `${component || ''}/index`;
  }
  return component || '';
}

function processQueryParam(queryParam: string | null | undefined): string {
  if (isExternalType.value) return '';
  if (isInternalType.value && queryList.value.length) {
    return JSON.stringify(Object.fromEntries(queryList.value.map(({ key, value }) => [key, value])));
  }
  if (isIframeType.value) return queryParam ? `{"url": "${queryParam}"}` : '';
  return '';
}

function needsHighRiskConfirm() {
  return Boolean(model.value.highRisk || model.value.needConfirm);
}

async function submitMenu(confirmRemark?: string) {
  syncScopeArraysToModel();

  const payload = {
    ...model.value,
    path: processPath(model.value.path),
    queryParam: processQueryParam(model.value.queryParam),
    icon: model.value.icon || defaultIcon,
    component: processComponent(model.value.component),
    remark: confirmRemark
      ? [model.value.remark, `confirm:${confirmRemark}`].filter(Boolean).join('|')
      : model.value.remark
  };

  if (props.operateType === 'add') {
    const { error } = await fetchCreateMenu(payload);
    if (error) return;
    window.$message?.success($t('common.addSuccess'));
  } else {
    const { error } = await fetchUpdateMenu(payload);
    if (error) return;
    window.$message?.success($t('common.updateSuccess'));
  }

  closeDrawer();
  emit('submitted', model.value.menuType!);
}

async function handleSubmit() {
  await validate();
  if (needsHighRiskConfirm()) {
    highRiskConfirmVisible.value = true;
    return;
  }
  await submitMenu();
}

function handleHighRiskConfirm(remark: string) {
  pendingConfirmRemark.value = remark;
  submitMenu(remark);
}

watch(
  () => model.value.menuType,
  newType => {
    if (newType === 'M') model.value.isFrame = '1';
    if (newType === 'F') model.value.permType = 'button';
  }
);

watch(layoutDisabled, () => {
  if (!layoutDisabled.value) return;
  layoutType.value = '0';
  model.value.visible = '0';
}, { immediate: true });

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});

function handleLayoutChange(value: string) {
  model.value.visible = value as Api.Common.VisibleStatus;
}

function onCreate() {
  return { key: '', value: '' };
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="720" class="max-w-95%">
    <NDrawerContent :title="drawerTitle" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="basic" :tab="$t('page.system.menu.tabBasic')">
            <NGrid responsive="screen" item-responsive class="pt-8px">
              <NFormItemGi :span="24" :label="$t('page.system.menu.parentId')" path="pid">
                <MenuTreeSelect
                  v-model:value="model.parentId"
                  :immediate="false"
                  :options="treeData as []"
                  :placeholder="$t('page.system.menu.form.parentId.required')"
                />
              </NFormItemGi>
              <NFormItemGi v-if="!isBtn" :span="12" :label="$t('page.system.menu.menuType')" path="menuType">
                <NRadioGroup v-model:value="model.menuType">
                  <NRadioButton
                    v-for="item in menuTypeOptions.filter(item => item.value !== 'F')"
                    :key="item.value"
                    :value="item.value"
                    :label="item.label"
                  />
                </NRadioGroup>
              </NFormItemGi>
              <NFormItemGi v-if="!isBtn" :span="12" path="layout">
                <template #label>
                  <div class="flex-center">
                    <FormTip :content="$t('page.system.menu.layoutTip')" />
                    <span>{{ $t('page.system.menu.layout') }}</span>
                  </div>
                </template>
                <NRadioGroup v-model:value="layoutType" :disabled="layoutDisabled" @update:value="handleLayoutChange">
                  <NRadio v-for="item in menuLayoutOptions" :key="item.value" :value="item.value" :label="item.label" />
                </NRadioGroup>
              </NFormItemGi>
              <NFormItemGi span="12" :label="$t('page.system.menu.menuName')" path="menuName">
                <NInput v-model:value="model.menuName" :placeholder="$t('page.system.menu.form.menuName.required')" />
              </NFormItemGi>
              <NFormItemGi span="12" :label="$t('page.system.menu.menuNameEn')">
                <NInput v-model:value="model.menuNameEn" :placeholder="$t('page.system.menu.menuNameEn')" />
              </NFormItemGi>
              <NFormItemGi span="12" :label="$t('page.system.menu.menuCode')">
                <NInput v-model:value="model.menuCode" placeholder="system_menu" />
              </NFormItemGi>
              <NFormItemGi :span="12" :label="$t('page.system.menu.orderNum')" path="orderNum">
                <NInputNumber v-model:value="model.orderNum" class="w-full" />
              </NFormItemGi>
              <NFormItemGi v-if="!isBtn" span="12" :label="$t('page.system.menu.iconType')">
                <NRadioGroup v-model:value="iconType">
                  <NRadio v-for="item in menuIconTypeOptions" :key="item.value" :value="item.value" :label="item.label" />
                </NRadioGroup>
              </NFormItemGi>
              <NFormItemGi v-if="!isBtn" span="12" path="icon">
                <template #label>
                  <div class="flex-center">
                    <FormTip :content="$t('page.system.menu.iconifyTip')" />
                    <span class="pl-3px">{{ $t('page.system.menu.icon') }}</span>
                  </div>
                </template>
                <NSelect
                  v-if="isLocalIcon"
                  v-model:value="model.icon"
                  filterable
                  :options="localIconOptions"
                />
                <NInput v-else v-model:value="model.icon" class="flex-1">
                  <template #suffix>
                    <SvgIcon v-if="model.icon" :icon="model.icon" class="text-icon" />
                  </template>
                </NInput>
              </NFormItemGi>
              <NFormItemGi v-if="!isBtn" :span="12" :label="$t('page.system.menu.visible')" path="visible">
                <DictRadio v-model:value="model.visible" dict-code="sys_show_hide" :disabled="isBlankLayout" />
              </NFormItemGi>
              <NFormItemGi :span="12" path="status">
                <template #label>
                  <FormTip :content="$t('page.system.menu.statusTip')" />
                  <span>{{ $t('page.system.menu.status') }}</span>
                </template>
                <DictRadio v-model:value="model.status" dict-code="sys_normal_disable" />
              </NFormItemGi>
            </NGrid>
          </NTabPane>

          <NTabPane v-if="!isBtn" name="route" :tab="$t('page.system.menu.tabRoute')">
            <NGrid responsive="screen" item-responsive class="pt-8px">
              <NFormItemGi :span="12" path="isFrame">
                <template #label>
                  <FormTip :content="$t('page.system.menu.isFrameTip')" />
                  <span>{{ $t('page.system.menu.isFrame') }}</span>
                </template>
                <NRadioGroup v-model:value="model.isFrame">
                  <NSpace>
                    <NRadio
                      v-for="option in menuIsFrameOptions"
                      :key="option.value"
                      :value="option.value"
                      :label="option.label"
                      :disabled="option.value === '2' && isCatalog"
                    />
                  </NSpace>
                </NRadioGroup>
              </NFormItemGi>
              <NFormItemGi v-if="isMenu" :span="12" path="isCache">
                <template #label>
                  <FormTip :content="$t('page.system.menu.isCacheTip')" />
                  <span>{{ $t('page.system.menu.isCache') }}</span>
                </template>
                <NRadioGroup v-model:value="model.isCache">
                  <NSpace>
                    <NRadio value="0" :label="$t('common.yesOrNo.yes')" />
                    <NRadio value="1" :label="$t('common.yesOrNo.no')" />
                  </NSpace>
                </NRadioGroup>
              </NFormItemGi>
              <NFormItemGi :span="24" path="path">
                <template #label>
                  <span>{{ !isExternalType ? $t('page.system.menu.path') : $t('page.system.menu.externalPath') }}</span>
                </template>
                <NInput v-model:value="model.path" />
              </NFormItemGi>
              <NFormItemGi v-if="isMenu && isInternalType" :span="24" path="component">
                <template #label>{{ $t('page.system.menu.component') }}</template>
                <NInputGroup>
                  <NInputGroupLabel>views/</NInputGroupLabel>
                  <NInput v-model:value="model.component" />
                  <NInputGroupLabel>/index.vue</NInputGroupLabel>
                </NInputGroup>
              </NFormItemGi>
              <NFormItemGi
                v-if="isMenu && !isExternalType"
                span="24"
                :label="isInternalType ? $t('page.system.menu.query') : $t('page.system.menu.iframeQuery')"
              >
                <NDynamicInput v-if="isInternalType" v-model:value="queryList" :on-create="onCreate" />
                <NInput v-else v-model:value="model.queryParam" />
              </NFormItemGi>
              <NFormItemGi v-if="isMenu" :span="12" :label="$t('page.system.menu.affixTab')">
                <NSwitch v-model:value="model.affixTab" />
              </NFormItemGi>
              <NFormItemGi v-if="isMenu" :span="12" :label="$t('page.system.menu.openMode')">
                <NSelect v-model:value="model.openMode" :options="OPEN_MODE_OPTIONS" />
              </NFormItemGi>
            </NGrid>
          </NTabPane>

          <NTabPane v-if="!isCatalog" name="perm" :tab="$t('page.system.menu.tabPerm')">
            <NGrid responsive="screen" item-responsive class="pt-8px">
              <NFormItemGi :span="24" path="perms">
                <template #label>
                  <FormTip :content="$t('page.system.menu.permsTip')" />
                  <span>{{ $t('page.system.menu.perms') }}</span>
                </template>
                <NInput v-model:value="model.perms" />
              </NFormItemGi>
              <NFormItemGi :span="12" :label="$t('page.system.menu.permName')">
                <NInput v-model:value="model.permName" />
              </NFormItemGi>
              <NFormItemGi :span="12" :label="$t('page.system.menu.permType')">
                <NSelect v-model:value="model.permType" :options="PERM_TYPE_OPTIONS" />
              </NFormItemGi>
              <NFormItemGi :span="8" :label="$t('page.system.menu.highRisk')">
                <NSwitch v-model:value="model.highRisk" />
              </NFormItemGi>
              <NFormItemGi :span="8" :label="$t('page.system.menu.needConfirm')">
                <NSwitch v-model:value="model.needConfirm" />
              </NFormItemGi>
              <NFormItemGi :span="8" :label="$t('page.system.menu.auditLog')">
                <NSwitch v-model:value="model.auditLog" />
              </NFormItemGi>
            </NGrid>
          </NTabPane>

          <NTabPane v-if="!isBtn" name="scope" :tab="$t('page.system.menu.tabScope')">
            <NGrid responsive="screen" item-responsive class="pt-8px">
              <NFormItemGi :span="24" :label="$t('page.system.menu.applicablePorts')">
                <NSelect v-model:value="applicablePortsArr" multiple :options="PORT_OPTIONS" />
              </NFormItemGi>
              <NFormItemGi :span="24" :label="$t('page.system.menu.applicableWarehouses')">
                <NSelect v-model:value="applicableWarehousesArr" multiple :options="WAREHOUSE_OPTIONS" />
              </NFormItemGi>
              <NFormItemGi :span="24" :label="$t('page.system.menu.applicableRoles')">
                <NSelect v-model:value="applicableRolesArr" multiple :options="ROLE_OPTIONS" />
              </NFormItemGi>
              <NFormItemGi :span="24" :label="$t('page.system.menu.applicableTenants')">
                <NSelect v-model:value="applicableTenantsArr" multiple :options="TENANT_OPTIONS" />
              </NFormItemGi>
            </NGrid>
          </NTabPane>
        </NTabs>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
  <MenuHighRiskConfirmModal
    v-model:visible="highRiskConfirmVisible"
    :title="$t('page.system.menu.highRiskConfirmTitle')"
    :content="$t('page.system.menu.highRiskSaveContent')"
    @confirm="handleHighRiskConfirm"
  />
</template>
