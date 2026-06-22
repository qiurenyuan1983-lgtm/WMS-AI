<script setup lang="tsx">
import { ref } from 'vue';
import { NAvatar, NButton, NDivider, NEllipsis, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { jsonClone } from '@sa/utils';
import { fetchBatchDeleteUser, fetchGetUserList, fetchUpdateUserStatus } from '@/service/api/system';
import { useAppStore } from '@/store/modules/app';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import ButtonIcon from '@/components/custom/button-icon.vue';
import StatusSwitch from '@/components/custom/status-switch.vue';
import UserOperateDrawer from './modules/user-operate-drawer.vue';
import UserImportModal from './modules/user-import-modal.vue';
import UserPasswordDrawer from './modules/user-password-drawer.vue';
import UserWorkbenchSearch from './modules/user-workbench-search.vue';
import UserOrgSidebar, { type OrgSidebarTab } from './modules/user-org-sidebar.vue';
import UserPermissionPanel from './modules/user-permission-panel.vue';
import UserAuditLogPanel from './modules/user-audit-log-panel.vue';
import { useUserWorkbenchOptions } from './modules/use-user-workbench-options';

defineOptions({ name: 'UserList' });

useDict('sys_normal_disable');

const { hasAuth } = useAuth();
const appStore = useAppStore();
const { download } = useDownload();
const { options: workbenchOptions, loading: workbenchOptionsLoading, ensureLoaded } = useUserWorkbenchOptions();

ensureLoaded();

const { bool: importVisible, setTrue: openImportModal } = useBoolean();
const { bool: passwordVisible, setTrue: openPasswordDrawer } = useBoolean();

type UserRow = Api.System.User & {
  roleNames?: string[];
  postName?: string;
  warehouseLabel?: string;
  accountTypeLabel?: string;
  lastLoginTime?: string;
};

const workbenchSearch = ref({
  keyword: null as string | null,
  deptId: null as CommonType.IdType | null,
  warehouseId: null as CommonType.IdType | null,
  roleId: null as CommonType.IdType | null,
  accountType: null as string | null,
  status: null as Api.Common.EnableStatus | null
});

const searchParams = ref<Record<string, any>>({
  pageNum: 1,
  pageSize: 10,
  deptId: null,
  status: null,
  params: {}
});

const selectedUser = ref<UserRow | null>(null);

function syncSearchParams() {
  searchParams.value = {
    ...searchParams.value,
    deptId: workbenchSearch.value.deptId,
    warehouseId: workbenchSearch.value.warehouseId,
    roleId: workbenchSearch.value.roleId,
    accountType: workbenchSearch.value.accountType,
    status: workbenchSearch.value.status,
    keyword: workbenchSearch.value.keyword
  };
}

const { columns, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => {
      syncSearchParams();
      return fetchGetUserList(searchParams.value as Api.System.UserSearchParams);
    },
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      {
        key: 'userName',
        title: '用户名',
        align: 'left',
        width: 200,
        render: row => (
          <div class="flex items-center gap-8px cursor-pointer" onClick={() => selectUser(row)}>
            <NAvatar src={row.avatar} class="bg-primary shrink-0" size="small">
              {row.avatar ? undefined : row.nickName?.charAt(0)}
            </NAvatar>
            <div class="min-w-0">
              <NEllipsis class="text-13px font-500">{row.userName}</NEllipsis>
              <NEllipsis class="text-12px text-gray">{row.nickName}</NEllipsis>
            </div>
          </div>
        )
      },
      { key: 'nickName', title: '姓名', width: 100, ellipsis: true },
      { key: 'deptName', title: '部门', width: 100, ellipsis: true },
      { key: 'postName', title: '岗位', width: 100, ellipsis: true },
      {
        key: 'roleNames',
        title: '角色',
        width: 160,
        render: row => (
          <div class="flex flex-wrap gap-4px justify-center">
            {(row.roleNames || []).map((name: string) => (
              <NTag size="small" type={name.includes('超级') ? 'error' : 'info'} bordered={false}>
                {name}
              </NTag>
            ))}
          </div>
        )
      },
      { key: 'warehouseLabel', title: '仓库', width: 120, ellipsis: true },
      { key: 'accountTypeLabel', title: '账号类型', width: 100, ellipsis: true },
      {
        key: 'status',
        title: '状态',
        width: 80,
        align: 'center',
        render: row => (
          <StatusSwitch
            v-model:value={row.status}
            disabled={row.userId === 1}
            info={row.userName}
            onSubmitted={(value, callback) => handleStatusChange(row, value, callback)}
          />
        )
      },
      { key: 'lastLoginTime', title: '最后登录', width: 150, ellipsis: true },
      {
        key: 'operate',
        title: '操作',
        width: 140,
        align: 'center',
        fixed: 'right',
        render: row => {
          if (row.userId === 1) return null;
          return (
            <div class="flex-center gap-4px">
              <ButtonIcon text type="primary" icon="material-symbols:drive-file-rename-outline-outline" tooltipContent="编辑" onClick={() => edit(row.userId)} />
              <NDivider vertical />
              <ButtonIcon text type="info" icon="material-symbols:account-tree-outline" tooltipContent="权限图谱" onClick={() => selectUser(row)} />
              <NDivider vertical />
              <ButtonIcon text type="primary" icon="material-symbols:key-vertical-outline" tooltipContent="重置密码" onClick={() => handleResetPwd(row.userId)} />
              <NDivider vertical />
              <ButtonIcon text type="error" icon="material-symbols:delete-outline" tooltipContent="删除" popconfirmContent="确认删除？" onPositiveClick={() => handleDelete(row.userId)} />
            </div>
          );
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'userId', getData);

function selectUser(row: UserRow) {
  selectedUser.value = row;
}

function handleOrgSelect(payload: { tab: OrgSidebarTab; key: string | null }) {
  workbenchSearch.value.deptId = null;
  workbenchSearch.value.warehouseId = null;
  workbenchSearch.value.roleId = null;
  workbenchSearch.value.accountType = null;
  searchParams.value.postId = null;

  if (!payload.key) {
    getDataByPage();
    return;
  }
  if (payload.tab === 'dept') workbenchSearch.value.deptId = payload.key;
  if (payload.tab === 'warehouse') workbenchSearch.value.warehouseId = payload.key;
  if (payload.tab === 'post') searchParams.value.postId = payload.key;
  if (payload.tab === 'accountType') workbenchSearch.value.accountType = payload.key;
  getDataByPage();
}

function handleSearch() {
  getDataByPage();
}

function handleResetSearch() {
  workbenchSearch.value.deptId = null;
  searchParams.value.postId = null;
  selectedUser.value = null;
  getDataByPage();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteUser(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
  selectedUser.value = null;
}

async function handleDelete(userId: CommonType.IdType) {
  const { error } = await fetchBatchDeleteUser([userId]);
  if (error) return;
  onDeleted();
  if (String(selectedUser.value?.userId) === String(userId)) selectedUser.value = null;
}

function edit(userId: CommonType.IdType) {
  handleEdit(userId);
}

function handleResetPwd(userId: CommonType.IdType) {
  const findItem = data.value.find(item => item.userId === userId) || null;
  editingData.value = jsonClone(findItem);
  openPasswordDrawer();
}

function handlePanelResetPwd() {
  if (!selectedUser.value) return;
  handleResetPwd(selectedUser.value.userId);
}

async function handleStatusChange(row: Api.System.User, value: Api.Common.EnableStatus, callback: (flag: boolean) => void) {
  const { error } = await fetchUpdateUserStatus({ userId: row.userId, status: value });
  callback(!error);
  if (!error) {
    window.$message?.success('状态更新成功');
    getData();
  }
}

function handleExport() {
  syncSearchParams();
  download('/system/user/export', searchParams.value, `用户与权限_${Date.now()}.xlsx`);
}

function handleBatchAction(action: string) {
  window.$message?.info(`原型：${action}`);
}

function handleRowClick(_e: MouseEvent, row: UserRow) {
  selectUser(row);
}
</script>

<template>
  <div class="user-workbench min-h-500px flex-col-stretch gap-12px overflow-hidden">
    <UserWorkbenchSearch
      v-model:model="workbenchSearch"
      :role-options="workbenchOptions.roleOptions"
      @search="handleSearch"
      @reset="handleResetSearch"
    />

    <div class="workbench-main min-h-0 flex flex-1 gap-12px overflow-hidden">
      <UserOrgSidebar
        :dept-data="workbenchOptions.deptData"
        :post-options="workbenchOptions.postOptions"
        :options-loading="workbenchOptionsLoading"
        @select="handleOrgSelect"
      />

      <div class="center-column min-w-0 flex-col-stretch flex-1 gap-12px overflow-hidden">
        <NCard :bordered="false" size="small" class="user-list-card card-wrapper flex-1-hidden">
          <div class="mb-8px flex flex-wrap gap-8px">
            <NButton v-if="hasAuth('system:user:add')" type="primary" size="small" @click="handleAdd">新增用户</NButton>
            <NButton v-if="hasAuth('system:user:import')" type="success" size="small" ghost @click="openImportModal">批量导入</NButton>
            <NButton size="small" type="info" ghost @click="handleBatchAction('批量分配角色')">批量分配角色</NButton>
            <NButton size="small" type="info" ghost @click="handleBatchAction('批量设置仓库权限')">批量设置仓库权限</NButton>
            <NButton size="small" type="warning" ghost @click="handleBatchAction('批量停用')">批量停用</NButton>
            <NButton
              v-if="hasAuth('system:user:remove')"
              size="small"
              type="error"
              ghost
              :disabled="checkedRowKeys.length === 0"
              @click="handleBatchDelete"
            >
              批量删除
            </NButton>
            <NButton size="small" ghost @click="handleBatchAction('重置密码')">重置密码</NButton>
            <NDivider vertical class="mx-4px h-24px" />
            <NButton v-if="hasAuth('system:user:export')" size="small" ghost @click="handleExport">导出</NButton>
            <NButton size="small" ghost @click="handleBatchAction('列设置')">列设置</NButton>
            <NButton size="small" ghost @click="handleBatchAction('权限模板')">权限模板</NButton>
          </div>

          <NDataTable
            v-model:checked-row-keys="checkedRowKeys"
            :columns="columns"
            :data="data"
            size="small"
            :flex-height="!appStore.isMobile"
            :scroll-x="scrollX"
            :loading="loading"
            remote
            :row-key="row => row.userId"
            :pagination="mobilePagination"
            :row-props="row => ({ style: selectedUser?.userId === row.userId ? 'background: rgb(var(--primary-color) / 0.06)' : '' })"
            class="user-table h-full"
            @row-click="handleRowClick"
          />
        </NCard>

        <UserAuditLogPanel :selected-user-id="selectedUser?.userId" />
      </div>

      <UserPermissionPanel
        :user="selectedUser"
        :dept-data="workbenchOptions.deptData"
        :post-options="workbenchOptions.postOptions"
        @saved="getData"
        @reset-password="handlePanelResetPwd"
        @copy-permissions="handleBatchAction('复制权限')"
      />
    </div>

    <UserImportModal v-model:visible="importVisible" @submitted="getData" />
    <UserOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :dept-data="workbenchOptions.deptData"
      :dept-id="workbenchSearch.deptId"
      @submitted="getDataByPage"
    />
    <UserPasswordDrawer v-model:visible="passwordVisible" :row-data="editingData" />
  </div>
</template>

<style scoped lang="scss">
.user-workbench {
  height: calc(100vh - 120px - var(--calc-footer-height, 0px));
}

.center-column {
  min-height: 0;
}

.user-list-card {
  :deep(.n-card__content) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
}

.user-table {
  min-height: 240px;

  :deep(.n-data-table-wrapper),
  :deep(.n-data-table-base-table),
  :deep(.n-data-table-base-table-body) {
    height: 100%;
  }
}
</style>
