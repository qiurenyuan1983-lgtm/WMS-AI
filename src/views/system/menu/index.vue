<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import type { DataTableColumns, TreeDropInfo, TreeInst, TreeOption } from 'naive-ui';
import { NButton, NDivider, NIcon, NInput, NPopconfirm, NTag } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { menuIsFrameRecord, menuTypeRecord } from '@/constants/business';
import {
  fetchBatchUpdateMenuStatus,
  fetchDeleteMenu,
  fetchExportMenus,
  fetchGetMenuDeletable,
  fetchGetMenuList,
  fetchRefreshMenuCache,
  fetchSortMenus
} from '@/service/api/system';
import { useAppStore } from '@/store/modules/app';
import { useRouteStore } from '@/store/modules/route';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import { useNaiveTable } from '@/hooks/common/table';
import { handleTree } from '@/utils/common';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import ButtonIcon from '@/components/custom/button-icon.vue';
import MenuOperateDrawer from './modules/menu-operate-drawer.vue';
import MenuCascadeDeleteModal from './modules/menu-cascade-delete-modal.vue';
import MenuImportModal from './modules/menu-import-modal.vue';
import MenuButtonTemplateModal from './modules/menu-button-template-modal.vue';
import MenuHighRiskConfirmModal from './modules/menu-high-risk-confirm-modal.vue';
import MenuDetailDrawer from './modules/menu-detail-drawer.vue';

useDict('sys_show_hide');
useDict('sys_normal_disable');

const defaultIcon = import.meta.env.VITE_MENU_ICON;

const { hasAuth } = useAuth();
const appStore = useAppStore();
const routeStore = useRouteStore();
const editingData = ref<Api.System.Menu>();
const operateType = ref<NaiveUI.TableOperateType>('add');
const { loading, startLoading, endLoading } = useLoading();
const { bool: drawerVisible, setTrue: openDrawer } = useBoolean();
const { bool: cascadeDeleteVisible, setTrue: openCascadeDeleteDrawer } = useBoolean();
const { bool: importVisible, setTrue: openImportModal } = useBoolean();
const { bool: templateVisible, setTrue: openTemplateModal } = useBoolean();
const { bool: detailVisible, setTrue: openDetailDrawer, setFalse: closeDetailDrawer } = useBoolean();
const highRiskConfirmVisible = ref(false);
const highRiskConfirmContent = ref('');
const pendingHighRiskAction = ref<(() => Promise<void>) | null>(null);
const { loading: btnLoading, startLoading: startBtnLoading, endLoading: endBtnLoading } = useLoading();
const { loading: listLoading, startLoading: startListLoading, endLoading: endListLoading } = useLoading();

const name = ref<string>();
const createType = ref<Api.System.MenuType>();
const createPid = ref<CommonType.IdType>(0);
const currentMenu = ref<Api.System.Menu>();
const selectedParentId = ref<CommonType.IdType>(0);
const treeData = ref<Api.System.Menu[]>([]);
const checkedKeys = ref<CommonType.IdType[]>([0]);
const expandedKeys = ref<CommonType.IdType[]>([0]);
const listData = ref<Api.System.Menu[]>([]);
const checkedRowKeys = ref<CommonType.IdType[]>([]);
const childMenuCount = ref(0);

const isCatalog = computed(() => currentMenu.value?.menuType === 'M');
const isMenu = computed(() => currentMenu.value?.menuType === 'C');
const isExternalType = computed(() => currentMenu.value?.isFrame === '0');
const isIframeType = computed(() => currentMenu.value?.isFrame === '2');
const canDeleteCurrent = computed(() => btnData.value.length === 0 && childMenuCount.value === 0 && !btnLoading.value);
const currentParentName = computed(() =>
  currentMenu.value ? findParentName(currentMenu.value.parentId) : '-'
);
const currentMenuTypeLabel = computed(() =>
  currentMenu.value ? resolveMenuTypeLabel(currentMenu.value) : ''
);

const menuTreeRef = ref<TreeInst>();
const btnData = ref<Api.System.MenuList>([]);

async function reloadSidebar() {
  await routeStore.reloadAuthRoutesFromMenu();
}

const getMeunTree = async () => {
  startLoading();
  const { data, error } = await fetchGetMenuList();
  if (error) return;
  const { tree } = handleTree(data, { idField: 'menuId', filterFn: item => item.menuType !== 'F' });
  treeData.value = [
    {
      menuId: 0,
      menuName: $t('page.system.menu.rootName'),
      icon: 'material-symbols:home-outline-rounded',
      children: tree
    }
  ] as Api.System.Menu[];
  endLoading();
};

async function loadListData(parentId: CommonType.IdType = selectedParentId.value) {
  startListLoading();
  const { data, error } = await fetchGetMenuList({ parentId });
  if (error) {
    endListLoading();
    return;
  }
  listData.value = (data || []).filter(item => item.menuType !== 'F');
  checkedRowKeys.value = [];
  endListLoading();
}

async function checkChildMenus(menuId?: CommonType.IdType) {
  if (!menuId) {
    childMenuCount.value = 0;
    return;
  }
  const { data } = await fetchGetMenuList({ parentId: menuId });
  childMenuCount.value = (data || []).filter(item => item.menuType !== 'F').length;
}

getMeunTree();
loadListData(0);

async function handleSubmitted(menuType?: Api.System.MenuType) {
  await getMeunTree();
  await loadListData(selectedParentId.value);
  await reloadSidebar();

  if (menuType === 'F') {
    await getBtnMenuList();
    return;
  }

  if (currentMenu.value?.menuId) {
    await checkChildMenus(currentMenu.value.menuId);
  }

  if (operateType.value === 'edit' && currentMenu.value) {
    const refreshed = listData.value.find(item => String(item.menuId) === String(currentMenu.value?.menuId));
    if (refreshed) currentMenu.value = refreshed;
  }
}

function handleAddMenu(pid: CommonType.IdType, type: Api.System.MenuType = pid === 0 ? 'M' : 'C') {
  createPid.value = pid;
  createType.value = type;
  operateType.value = 'add';
  openDrawer();
}

function handleUpdateMenu(row?: Api.System.Menu) {
  operateType.value = 'edit';
  editingData.value = row || currentMenu.value;
  openDrawer();
}

async function ensureMenuDeletable(menuId: CommonType.IdType) {
  const { data, error } = await fetchGetMenuDeletable(menuId);
  if (error) return false;
  if (!data?.canDelete) {
    window.$message?.warning(data?.message || $t('page.system.menu.deleteBlocked'));
    return false;
  }
  return true;
}

function findMenuRow(menuId: CommonType.IdType) {
  return listData.value.find(item => String(item.menuId) === String(menuId)) || currentMenu.value;
}

async function runWithHighRiskConfirm(menu: Api.System.Menu | undefined, action: () => Promise<void>, content: string) {
  if (menu?.highRisk || menu?.needConfirm) {
    highRiskConfirmContent.value = content;
    pendingHighRiskAction.value = action;
    highRiskConfirmVisible.value = true;
    return;
  }
  await action();
}

async function handleHighRiskConfirm(_remark: string) {
  if (pendingHighRiskAction.value) {
    await pendingHighRiskAction.value();
    pendingHighRiskAction.value = null;
  }
}

async function handleDeleteMenu(id?: CommonType.IdType) {
  const targetId = id || currentMenu.value?.menuId || checkedKeys.value[0];
  if (!targetId) return;

  const targetMenu = findMenuRow(targetId) || btnData.value.find(item => String(item.menuId) === String(targetId));

  await runWithHighRiskConfirm(targetMenu, async () => {
    const deletable = await ensureMenuDeletable(targetId);
    if (!deletable) return;

    const { error } = await fetchDeleteMenu(targetId);
    if (error) return;
    await afterDeleteSuccess(targetId, id);
  }, $t('page.system.menu.highRiskDeleteContent'));
}

async function afterDeleteSuccess(targetId: CommonType.IdType, id?: CommonType.IdType) {
  window.$message?.success($t('common.deleteSuccess'));
  checkedRowKeys.value = checkedRowKeys.value.filter(key => String(key) !== String(targetId));

  if (id) {
    if (String(currentMenu.value?.menuId) === String(id)) {
      currentMenu.value = undefined;
      closeDetailDrawer();
    }
    await getBtnMenuList();
    await loadListData(selectedParentId.value);
    await reloadSidebar();
    return;
  }
  expandedKeys.value = expandedKeys.value.filter(item => !checkedKeys.value.includes(item));
  currentMenu.value = undefined;
  checkedKeys.value = [];
  closeDetailDrawer();
  await handleSubmitted();
}

async function openMenuDetail(menu: Api.System.Menu) {
  currentMenu.value = menu;
  checkedKeys.value = [menu.menuId!];
  await checkChildMenus(menu.menuId);
  if (menu.menuType === 'C') {
    await getBtnMenuList();
  } else {
    btnData.value = [];
  }
  openDetailDrawer();
}

async function handleBatchStatus(status: Api.Common.EnableStatus) {
  if (!checkedRowKeys.value.length) {
    window.$message?.warning($t('page.system.menu.batchSelectRequired'));
    return;
  }

  const selectedRows = listData.value.filter(row => checkedRowKeys.value.includes(row.menuId!));
  const hasRisk = selectedRows.some(row => row.highRisk || row.needConfirm);

  const runBatch = async () => {
    const { error } = await fetchBatchUpdateMenuStatus({ menuIds: checkedRowKeys.value, status });
    if (error) return;
    window.$message?.success(status === '0' ? $t('page.system.menu.batchEnableSuccess') : $t('page.system.menu.batchDisableSuccess'));
    checkedRowKeys.value = [];
    await handleSubmitted();
  };

  if (hasRisk && status === '1') {
    await runWithHighRiskConfirm(selectedRows[0], runBatch, $t('page.system.menu.highRiskBatchDisableContent'));
    return;
  }

  await runBatch();
}

async function handleExportMenu() {
  const { data, error } = await fetchExportMenus({ parentId: selectedParentId.value });
  if (error || !data) return;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `menu-export-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  window.$message?.success($t('page.system.menu.exportSuccess'));
}

function getMenuLabel(option: TreeOption) {
  const raw = String(option.menuName);
  if (raw.startsWith('route.') || raw.startsWith('menu.')) {
    return $t(raw as App.I18n.I18nKey);
  }
  return raw;
}

function customFilterTree(pattern: string, node: TreeOption) {
  if (!pattern) return true;
  const label = getMenuLabel(node);
  return label.toLowerCase().includes(pattern.toLowerCase());
}

function renderLabel({ option }: { option: TreeOption }) {
  const label = getMenuLabel(option);
  if (option.status === '1') {
    return (
      <div class="flex items-center gap-4px text-error-200">
        {label}
        <SvgIcon icon="ri:prohibited-line" class="text-16px" />
      </div>
    );
  }
  if (option.visible === '1') {
    return (
      <div class="flex items-center gap-4px text-gray-400">
        {label}
        <SvgIcon icon="codex:hidden" class="text-21px" />
      </div>
    );
  }
  return <div>{label}</div>;
}

function renderPrefix({ option }: { option: TreeOption }) {
  const renderLocalIcon = String(option.icon).startsWith('local-icon-');
  const icon = renderLocalIcon ? undefined : String(option.icon);
  const localIcon = renderLocalIcon ? String(option.icon).replace('local-icon-', 'menu-') : undefined;
  return <SvgIcon icon={icon || defaultIcon} localIcon={localIcon} />;
}

function renderSuffix({ option }: { option: TreeOption }) {
  if (!['M'].includes(String(option.menuType)) || !hasAuth('system:menu:add')) {
    return null;
  }
  return (
    <div class="flex-center gap-8px">
      <ButtonIcon
        text
        class="h-18px"
        icon="ic-round-plus"
        tooltip-content={$t('page.system.menu.addChildMenu')}
        onClick={(event: Event) => {
          event.stopPropagation();
          handleAddMenu(option.menuId as CommonType.IdType, 'C');
        }}
      />
    </div>
  );
}

function reset() {
  name.value = undefined;
  getMeunTree();
  loadListData(selectedParentId.value);
}

async function handleClickTree(option: Array<TreeOption | null>) {
  checkedKeys.value = option?.map(item => item?.menuId as CommonType.IdType);
  const menu = option[0] as Api.System.Menu;
  if (!menu || menu.menuId === 0) {
    selectedParentId.value = 0;
    currentMenu.value = undefined;
    childMenuCount.value = 0;
    btnData.value = [];
    closeDetailDrawer();
    await loadListData(0);
    return;
  }
  selectedParentId.value = menu.menuId!;
  await loadListData(menu.menuId!);
  await openMenuDetail(menu);
}

async function handleSelectListRow(row: Api.System.Menu) {
  await openMenuDetail(row);
}

let controller = new AbortController();

async function getBtnMenuList() {
  if (!currentMenu.value?.menuId || currentMenu.value.menuType !== 'C') {
    btnData.value = [];
    return;
  }
  controller.abort();
  controller = new AbortController();
  startBtnLoading();
  btnData.value = [];
  const { data, error } = await fetchGetMenuList(
    { parentId: currentMenu.value.menuId, menuType: 'F' },
    controller.signal
  );
  if (error) return;
  btnData.value = (data || []).filter(item => String(item.remark || '').includes('btn_perm'));
  endBtnLoading();
}

function addBtnMenu() {
  if (!currentMenu.value?.menuId || currentMenu.value.menuType !== 'C') {
    window.$message?.warning($t('page.system.menu.selectMenuHint'));
    return;
  }
  operateType.value = 'add';
  createType.value = 'F';
  createPid.value = currentMenu.value.menuId;
  openDrawer();
}

function handleDeleteBtnMenu(id: CommonType.IdType) {
  handleDeleteMenu(id);
}

function handleUpdateBtnMenu(row: Api.System.Menu) {
  operateType.value = 'edit';
  editingData.value = row;
  openDrawer();
}

function resolveMenuTypeLabel(row: Api.System.Menu) {
  if (row.menuType === 'F') return menuTypeRecord.F;
  if (row.menuType === 'M') return menuTypeRecord.M;
  if (row.isFrame === '0') return `${menuTypeRecord.C} / ${menuIsFrameRecord['0']}`;
  if (row.isFrame === '2') return `${menuTypeRecord.C} / ${menuIsFrameRecord['2']}`;
  return menuTypeRecord.C;
}

function renderMenuName(menuName: string) {
  return menuName?.startsWith('route.') || menuName?.startsWith('menu.') ? $t(menuName as App.I18n.I18nKey) : menuName;
}

function findMenuInTree(nodes: Api.System.Menu[], menuId: CommonType.IdType): Api.System.Menu | undefined {
  for (const node of nodes) {
    if (String(node.menuId) === String(menuId)) return node;
    if (node.children?.length) {
      const found = findMenuInTree(node.children, menuId);
      if (found) return found;
    }
  }
  return undefined;
}

function findParentName(parentId: CommonType.IdType) {
  if (String(parentId) === '0') return $t('page.system.menu.rootName');
  const parent = findMenuInTree(treeData.value, parentId);
  return parent ? renderMenuName(parent.menuName) : '-';
}

const { columns: listColumns, columnChecks, reloadColumns, scrollX } = useNaiveTable({
  api: async () => listData.value,
  transform: data => data,
  immediate: false,
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    {
      key: 'menuName',
      title: $t('page.system.menu.menuName'),
      minWidth: 140,
      ellipsis: { tooltip: true },
      render(row: Api.System.Menu) {
        return renderMenuName(row.menuName);
      }
    },
    {
      key: 'menuNameEn',
      title: $t('page.system.menu.menuNameEn'),
      minWidth: 120,
      ellipsis: { tooltip: true },
      render(row: Api.System.Menu) {
        return row.menuNameEn || '-';
      }
    },
    {
      key: 'menuType',
      title: $t('page.system.menu.menuType'),
      width: 110,
      align: 'center',
      render(row: Api.System.Menu) {
        return <NTag size="small" type="primary">{resolveMenuTypeLabel(row)}</NTag>;
      }
    },
    {
      key: 'path',
      title: $t('page.system.menu.path'),
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      key: 'component',
      title: $t('page.system.menu.component'),
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      key: 'perms',
      title: $t('page.system.menu.perms'),
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      key: 'icon',
      title: $t('page.system.menu.icon'),
      width: 72,
      align: 'center',
      render(row: Api.System.Menu) {
        return <SvgIcon icon={row.icon || defaultIcon} class="text-18px" />;
      }
    },
    {
      key: 'orderNum',
      title: $t('page.system.menu.orderNum'),
      width: 72,
      align: 'center'
    },
    {
      key: 'isCache',
      title: $t('page.system.menu.isCache'),
      width: 88,
      align: 'center',
      render(row: Api.System.Menu) {
        if (row.menuType !== 'C') return '-';
        return row.isCache === '0' ? $t('page.system.menu.cache') : $t('page.system.menu.noCache');
      }
    },
    {
      key: 'visible',
      title: $t('page.system.menu.visible'),
      width: 88,
      align: 'center',
      render(row: Api.System.Menu) {
        return <DictTag size="small" value={row.visible} dictCode="sys_show_hide" />;
      }
    },
    {
      key: 'status',
      title: $t('page.system.menu.status'),
      width: 88,
      align: 'center',
      render(row: Api.System.Menu) {
        return <DictTag size="small" value={row.status} dictCode="sys_normal_disable" />;
      }
    },
    {
      key: 'applicablePorts',
      title: $t('page.system.menu.applicablePorts'),
      minWidth: 120,
      ellipsis: { tooltip: true },
      render(row: Api.System.Menu) {
        return formatApplicablePorts(row.applicablePorts);
      }
    },
    {
      key: 'highRisk',
      title: $t('page.system.menu.highRisk'),
      width: 88,
      align: 'center',
      render(row: Api.System.Menu) {
        return row.highRisk ? (
          <NTag size="small" type="error">{$t('common.yesOrNo.yes')}</NTag>
        ) : (
          <NTag size="small">{$t('common.yesOrNo.no')}</NTag>
        );
      }
    },
    {
      key: 'createTime',
      title: $t('page.system.menu.createTime'),
      width: 155
    },
    {
      key: 'updateTime',
      title: $t('page.system.menu.updateTime'),
      width: 155,
      render(row: Api.System.Menu) {
        return row.updateTime || '-';
      }
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 130,
      align: 'center',
      fixed: 'right',
      render(row: Api.System.Menu) {
        return (
          <div class="flex-center gap-8px">
            <ButtonIcon
              text
              type="info"
              icon="material-symbols:chevron-right"
              tooltipContent={$t('page.system.menu.menuDetail')}
              onClick={() => openMenuDetail(row)}
            />
            {hasAuth('system:menu:edit') ? (
              <ButtonIcon
                text
                type="primary"
                icon="material-symbols:drive-file-rename-outline-outline"
                tooltipContent={$t('common.edit')}
                onClick={() => handleUpdateMenu(row)}
              />
            ) : null}
            {hasAuth('system:menu:edit') && hasAuth('system:menu:remove') ? <NDivider vertical /> : null}
            {hasAuth('system:menu:remove') ? (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent={$t('common.delete')}
                popconfirmContent={$t('common.confirmDelete')}
                onPositiveClick={() => handleDeleteMenu(row.menuId!)}
              />
            ) : null}
          </div>
        );
      }
    }
  ]
});

watch(
  () => appStore.locale,
  () => reloadColumns()
);

const btnColumns: DataTableColumns<Api.System.Menu> = [
  {
    key: 'index',
    width: 64,
    align: 'center',
    title() {
      return (
        <NButton circle type="primary" size="small" onClick={() => addBtnMenu()}>
          {{
            icon: () => (
              <NIcon>
                <SvgIcon icon="ic-round-plus" />
              </NIcon>
            )
          }}
        </NButton>
      );
    },
    render(_, index) {
      return index + 1;
    }
  },
  {
    title: $t('page.system.menu.menuName'),
    key: 'menuName',
    minWidth: 120
  },
  {
    title: $t('page.system.menu.perms'),
    key: 'perms',
    align: 'center',
    minWidth: 120
  },
  {
    title: $t('page.system.menu.status'),
    key: 'status',
    minWidth: 80,
    align: 'center',
    render(row) {
      return <DictTag size="small" value={row.status} dictCode="sys_normal_disable" />;
    }
  },
  {
    title: $t('page.system.menu.createTime'),
    key: 'createTime',
    align: 'center',
    minWidth: 150
  },
  {
    title: $t('common.action'),
    key: 'actions',
    width: 80,
    align: 'center',
    render(row) {
      return (
        <div class="flex-center gap-8px">
          {hasAuth('system:menu:edit') ? (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent={$t('common.edit')}
              onClick={() => handleUpdateBtnMenu(row)}
            />
          ) : null}
          {hasAuth('system:menu:edit') && hasAuth('system:menu:remove') ? <NDivider vertical /> : null}
          {hasAuth('system:menu:remove') ? (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDeleteBtnMenu(row.menuId!)}
            />
          ) : null}
        </div>
      );
    }
  }
];

function buildSortPayload(
  siblings: Api.System.Menu[],
  dragMenu: Api.System.Menu,
  targetMenu: Api.System.Menu,
  dropPosition: 'before' | 'after'
) {
  const ordered = siblings.filter(item => String(item.menuId) !== String(dragMenu.menuId));
  const targetIndex = ordered.findIndex(item => String(item.menuId) === String(targetMenu.menuId));
  if (targetIndex < 0) return null;

  const insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
  ordered.splice(insertIndex, 0, dragMenu);

  return ordered.map((item, index) => ({
    menuId: item.menuId!,
    orderNum: index + 1
  }));
}

async function handleTreeDrop({ node, dragNode, dropPosition }: TreeDropInfo) {
  if (dropPosition === 'inside') {
    window.$message?.warning($t('page.system.menu.dragSameLevelOnly'));
    return false;
  }

  const dragMenu = dragNode as Api.System.Menu;
  const targetMenu = node as Api.System.Menu;

  if (!dragMenu.menuId || !targetMenu.menuId || dragMenu.menuId === 0 || targetMenu.menuId === 0) {
    return false;
  }

  if (String(dragMenu.parentId) !== String(targetMenu.parentId)) {
    window.$message?.warning($t('page.system.menu.dragSameLevelOnly'));
    return false;
  }

  const { data, error: listError } = await fetchGetMenuList({ parentId: dragMenu.parentId });
  if (listError) return false;

  const siblings = (data || [])
    .filter(item => item.menuType !== 'F')
    .sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0));

  const items = buildSortPayload(siblings, dragMenu, targetMenu, dropPosition);
  if (!items?.length) return false;

  const { error } = await fetchSortMenus(items);
  if (error) return false;

  window.$message?.success($t('common.updateSuccess'));
  await getMeunTree();
  if (String(selectedParentId.value) === String(dragMenu.parentId)) {
    await loadListData(selectedParentId.value);
  }
  await reloadSidebar();
  return true;
}

async function handleRefreshCache() {
  const { error } = await fetchRefreshMenuCache();
  if (error) return;
  await reloadSidebar();
  window.$message?.success($t('page.system.menu.refreshCache'));
}

watch(
  () => currentMenu.value?.menuId,
  menuId => {
    if (!menuId || currentMenu.value?.menuType !== 'C') {
      btnData.value = [];
    }
  }
);
</script>

<template>
  <TableSiderLayout default-expanded>
    <template #header>{{ $t('page.system.menu.title') }}</template>
    <template #header-extra>
      <ButtonIcon
        size="small"
        icon="material-symbols:refresh-rounded"
        class="h-28px text-icon"
        :tooltip-content="$t('common.refresh')"
        @click.stop="reset"
      />
    </template>
    <template #sider>
      <div class="flex gap-6px">
        <NInput v-model:value="name" size="small" :placeholder="$t('page.system.menu.form.menuName.required')" />
      </div>
      <NSpin :show="loading" class="infinite-scroll">
        <NTree
          ref="menuTreeRef"
          v-model:checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          draggable
          :cancelable="false"
          block-node
          :filter="customFilterTree"
          show-line
          :data="treeData as []"
          :default-expanded-keys="[0]"
          :show-irrelevant-nodes="false"
          :pattern="name"
          class="menu-tree h-full min-h-200px py-3"
          key-field="menuId"
          label-field="menuName"
          virtual-scroll
          checkable
          :render-label="renderLabel"
          :render-prefix="renderPrefix"
          :render-suffix="renderSuffix"
          @drop="handleTreeDrop"
          @update:selected-keys="(_: Array<string & number>, option: Array<TreeOption | null>) => handleClickTree(option)"
        >
          <template #empty>
            <NEmpty :description="$t('page.system.menu.emptyMenu')" class="h-full min-h-200px justify-center" />
          </template>
        </NTree>
      </NSpin>
    </template>

    <div class="h-full flex-col-stretch gap-12px min-h-0">
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NSpace wrap>
          <NButton v-if="hasAuth('system:menu:add')" type="primary" size="small" @click="handleAddMenu(0, 'M')">
            <template #icon>
              <icon-material-symbols-add-rounded />
            </template>
            {{ $t('page.system.menu.addMenu') }}
          </NButton>
          <NButton
            v-if="hasAuth('system:menu:add')"
            size="small"
            @click="handleAddMenu(selectedParentId || 0, 'C')"
          >
            <template #icon>
              <icon-material-symbols-menu />
            </template>
            {{ $t('page.system.menu.addPage') }}
          </NButton>
          <NButton v-if="hasAuth('system:menu:add')" size="small" @click="addBtnMenu">
            <template #icon>
              <icon-material-symbols-add />
            </template>
            {{ $t('page.system.menu.addButton') }}
          </NButton>
          <NButton
            v-if="hasAuth('system:menu:edit')"
            size="small"
            type="success"
            ghost
            :disabled="!checkedRowKeys.length"
            @click="handleBatchStatus('0')"
          >
            {{ $t('page.system.menu.batchEnable') }}
          </NButton>
          <NButton
            v-if="hasAuth('system:menu:edit')"
            size="small"
            type="warning"
            ghost
            :disabled="!checkedRowKeys.length"
            @click="handleBatchStatus('1')"
          >
            {{ $t('page.system.menu.batchDisable') }}
          </NButton>
          <NButton v-if="hasAuth('system:menu:remove')" size="small" type="error" ghost @click="openCascadeDeleteDrawer">
            {{ $t('page.system.menu.cascadeDelete') }}
          </NButton>
          <NButton v-if="hasAuth('system:menu:export')" size="small" @click="handleExportMenu">
            {{ $t('page.system.menu.exportMenu') }}
          </NButton>
          <NButton v-if="hasAuth('system:menu:import')" size="small" @click="openImportModal">
            {{ $t('page.system.menu.importMenu') }}
          </NButton>
          <NButton
            v-if="hasAuth('system:menu:add') && currentMenu?.menuType === 'C'"
            size="small"
            @click="openTemplateModal"
          >
            {{ $t('page.system.menu.applyButtonTemplate') }}
          </NButton>
          <NButton size="small" @click="handleRefreshCache">
            <template #icon>
              <icon-material-symbols-sync-outline />
            </template>
            {{ $t('page.system.menu.refreshCache') }}
          </NButton>
        </NSpace>
      </NCard>

      <NCard
        :title="$t('page.system.menu.menuList')"
        :bordered="false"
        size="small"
        class="menu-list-card flex-1 card-wrapper"
        content-class="overflow-hidden"
      >
        <template #header-extra>
          <TableColumnSetting v-model:columns="columnChecks" />
        </template>
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :loading="listLoading"
          :columns="listColumns"
          :data="listData"
          :scroll-x="scrollX"
          :row-key="(row: Api.System.Menu) => row.menuId!"
          :row-props="
            (row: Api.System.Menu) => ({
              style: 'cursor: pointer',
              class: String(row.menuId) === String(currentMenu?.menuId) ? 'menu-row-active' : ''
            })
          "
          flex-height
          class="h-full"
          size="small"
          @row-click="(_e: MouseEvent, row: Api.System.Menu) => handleSelectListRow(row)"
        />
      </NCard>
    </div>

    <MenuDetailDrawer
      v-model:visible="detailVisible"
      :menu="currentMenu"
      :parent-name="currentParentName"
      :menu-type-label="currentMenuTypeLabel"
      :btn-data="btnData"
      :btn-loading="btnLoading"
      :btn-columns="btnColumns"
      :can-delete="canDeleteCurrent"
      :is-catalog="isCatalog"
      :is-menu="isMenu"
      :is-external-type="isExternalType"
      :is-iframe-type="isIframeType"
      @edit="handleUpdateMenu()"
      @delete="handleDeleteMenu(currentMenu?.menuId)"
      @add-child="handleAddMenu(currentMenu!.menuId!, 'C')"
      @refresh-buttons="getBtnMenuList"
    />
    <MenuOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :tree-data="treeData"
      :pid="createPid"
      :menu-type="createType"
      @submitted="handleSubmitted"
    />
    <MenuCascadeDeleteModal v-model:visible="cascadeDeleteVisible" @submitted="handleSubmitted" />
    <MenuImportModal v-model:visible="importVisible" @submitted="handleSubmitted" />
    <MenuButtonTemplateModal v-model:visible="templateVisible" :parent-menu="currentMenu" @submitted="handleSubmitted" />
    <MenuHighRiskConfirmModal
      v-model:visible="highRiskConfirmVisible"
      :content="highRiskConfirmContent"
      @confirm="handleHighRiskConfirm"
    />
  </TableSiderLayout>
</template>

<style scoped lang="scss">
:deep(.infinite-scroll) {
  height: calc(100vh - 224px - var(--calc-footer-height, 0px)) !important;
  max-height: calc(100vh - 224px - var(--calc-footer-height, 0px)) !important;
}

@media screen and (max-width: 1024px) {
  :deep(.infinite-scroll) {
    height: calc(100vh - 227px - var(--calc-footer-height, 0px)) !important;
    max-height: calc(100vh - 227px - var(--calc-footer-height, 0px)) !important;
  }
}

:deep(.n-spin-content) {
  height: 100%;
}

:deep(.n-tree-node-checkbox) {
  display: none;
}

.menu-tree {
  :deep(.n-tree-node) {
    height: 25px;
  }

  :deep(.n-tree-node-switcher) {
    height: 25px;
  }

  :deep(.n-tree-node-switcher__icon) {
    font-size: 16px !important;
    height: 16px !important;
    width: 16px !important;
  }
}

.menu-list-card {
  min-height: calc(100vh - 280px - var(--calc-footer-height, 0px));
  min-width: 0;
}

:deep(.menu-row-active td) {
  background-color: rgba(var(--primary-color-rgb, 24, 160, 88), 0.08) !important;
}
</style>
