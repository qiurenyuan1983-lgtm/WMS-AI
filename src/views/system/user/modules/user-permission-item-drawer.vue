<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import { dataScopeOptions } from '@/constants/business';
import { fetchGetMenuTreeSelect, fetchGetRoleMenuTreeSelect, fetchAuthUserRole, fetchUpdateUser } from '@/service/api/system';
import { updateUserWarehouses, MOCK_USER_WAREHOUSES } from '@/mock/data/system';
import { MOCK_ORG_SCOPE } from '@/mock/data/user-workbench-constants';
import {
  buildSystemNavigationMenuTreeFromSelect,
  getUserButtonMenuCheckedKeys,
  getUserNavigationMenuCheckedKeys,
  wrapRoleMenuTree
} from '@/utils/system/menu-permission-tree';
import MenuTree from '@/components/custom/menu-tree.vue';

defineOptions({ name: 'UserPermissionItemDrawer' });

interface Props {
  title: string;
  permissionKey: string;
  type: 'role' | 'menu' | 'button' | 'warehouse' | 'generic';
  user: (Api.System.User & Record<string, any>) | null;
  roleIds: CommonType.IdType[];
  roleOptions: CommonType.Option[];
  postIds: CommonType.IdType[];
  postOptions: CommonType.Option[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { loading, startLoading, endLoading } = useLoading();

const draftRoleIds = ref<CommonType.IdType[]>([]);
const draftPostIds = ref<CommonType.IdType[]>([]);
const draftWarehouseIds = ref<CommonType.IdType[]>([]);
const draftDataScope = ref('5');
const draftCustomerScope = ref('partial');
const draftSupplierScope = ref('partial');
const draftPdaScopes = ref<string[]>([]);
const draftSecurity = ref({
  mfa: false,
  ipLimit: false,
  singleSession: false
});

const menuOptions = ref<Api.System.MenuList>([]);
const menuCheckedKeys = ref<CommonType.IdType[]>([]);
const menuLoading = ref(false);

const warehouseOptions = computed(() =>
  MOCK_ORG_SCOPE.warehouses.map(item => ({
    label: item.warehouseName,
    value: item.warehouseId
  }))
);

const drawerWidth = computed(() => {
  if (props.type === 'menu' || props.type === 'button') return 760;
  return 560;
});

const drawerSubtitle = computed(() => {
  if (!props.user) return '';
  return `${props.user.nickName}（${props.user.userName}）`;
});

const pdaScopeOptions = [
  { label: 'PDA 入库作业', value: 'PDA_INBOUND' },
  { label: 'PDA 出库作业', value: 'PDA_OUTBOUND' },
  { label: 'PDA 盘点作业', value: 'PDA_COUNT' },
  { label: '司机接单', value: 'DRIVER_DISPATCH' },
  { label: '司机签到', value: 'DRIVER_CHECKIN' }
];

async function loadMenuTree() {
  if (!props.user) return;
  menuLoading.value = true;

  if (props.type === 'menu') {
    const { data, error } = await fetchGetMenuTreeSelect();
    menuLoading.value = false;
    if (error || !data) return;
    menuOptions.value = buildSystemNavigationMenuTreeFromSelect(data);
    menuCheckedKeys.value = getUserNavigationMenuCheckedKeys(
      draftRoleIds.value.length ? draftRoleIds.value : props.roleIds
    );
    return;
  }

  if (props.type === 'button') {
    const roleId = draftRoleIds.value[0] || props.roleIds[0] || 1;
    const { data, error } = await fetchGetRoleMenuTreeSelect(roleId);
    menuLoading.value = false;
    if (error) return;
    menuOptions.value = wrapRoleMenuTree(data.menus);
    menuCheckedKeys.value = getUserButtonMenuCheckedKeys(
      draftRoleIds.value.length ? draftRoleIds.value : props.roleIds
    );
    return;
  }

  menuLoading.value = false;
}

function resetDraft() {
  if (!props.user) return;
  draftRoleIds.value = [...props.roleIds];
  draftPostIds.value = [...props.postIds];
  draftWarehouseIds.value = [...(MOCK_USER_WAREHOUSES[Number(props.user.userId)] || [])];
  draftDataScope.value = '5';
  draftCustomerScope.value = 'partial';
  draftSupplierScope.value = 'partial';
  draftPdaScopes.value =
    props.user.accountType === 'PDA' || props.user.accountType === 'DRIVER'
      ? ['PDA_INBOUND', 'PDA_OUTBOUND']
      : [];
  draftSecurity.value = { mfa: false, ipLimit: true, singleSession: false };
}

watch(visible, async val => {
  if (!val) return;
  resetDraft();
  await loadMenuTree();
});

watch(
  () => draftRoleIds.value[0],
  () => {
    if (visible.value) loadMenuTree();
  }
);

async function handleConfirm() {
  if (!props.user) return;
  startLoading();

  if (props.type === 'role') {
    await fetchAuthUserRole(props.user.userId, draftRoleIds.value);
    await fetchUpdateUser({
      userId: props.user.userId,
      roleIds: draftRoleIds.value,
      postIds: draftPostIds.value
    });
  }

  if (props.type === 'warehouse') {
    updateUserWarehouses(props.user.userId, draftWarehouseIds.value);
  }

  endLoading();
  window.$message?.success('权限已保存');
  visible.value = false;
  emit('submitted');
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="drawerWidth" placement="right" class="max-w-95%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <div v-if="drawerSubtitle" class="drawer-subtitle mb-16px">{{ drawerSubtitle }}</div>
      <template v-if="type === 'role'">
        <NAlert type="info" :bordered="false" class="mb-16px">
          为用户分配角色与岗位，菜单、按钮及数据权限将继承所选角色。
        </NAlert>
        <NForm label-placement="left" label-width="88">
          <NFormItem label="角色">
            <NSelect v-model:value="draftRoleIds" multiple filterable :options="roleOptions" placeholder="请选择角色" />
          </NFormItem>
          <NFormItem label="岗位">
            <NSelect v-model:value="draftPostIds" multiple filterable :options="postOptions" placeholder="请选择岗位" />
          </NFormItem>
        </NForm>
      </template>

      <template v-else-if="type === 'menu'">
        <NAlert type="info" :bordered="false" class="mb-12px">
          展示与「系统管理 → 菜单管理」一致的目录与页面菜单，勾选即授权可访问的菜单。
        </NAlert>
        <NSpin :show="menuLoading">
          <MenuTree
            v-model:checked-keys="menuCheckedKeys"
            v-model:options="menuOptions"
            :immediate="false"
            :permission-mode="false"
            :show-header="true"
            class="permission-tree-panel"
          />
        </NSpin>
      </template>

      <template v-else-if="type === 'button'">
        <NAlert type="info" :bordered="false" class="mb-12px">
          配置页面内按钮级操作权限，可通过上方「功能权限」筛选按钮节点。
        </NAlert>
        <NSpin :show="menuLoading">
          <MenuTree
            v-model:checked-keys="menuCheckedKeys"
            v-model:options="menuOptions"
            :immediate="false"
            :permission-mode="true"
            :show-header="true"
            class="permission-tree-panel"
          />
        </NSpin>
      </template>

      <template v-else-if="type === 'warehouse'">
        <NAlert type="info" :bordered="false" class="mb-16px">
          限制用户可访问的仓库范围，未授权仓库的数据将不可见。
        </NAlert>
        <NForm label-placement="left" label-width="88">
          <NFormItem label="授权仓库">
            <NSelect
              v-model:value="draftWarehouseIds"
              multiple
              filterable
              :options="warehouseOptions"
              placeholder="请选择仓库"
            />
          </NFormItem>
        </NForm>
      </template>

      <template v-else-if="permissionKey === 'data'">
        <NAlert type="info" :bordered="false" class="mb-16px">设置用户可查看的业务数据范围。</NAlert>
        <NForm label-placement="left" label-width="88">
          <NFormItem label="数据范围">
            <NSelect v-model:value="draftDataScope" :options="dataScopeOptions" />
          </NFormItem>
        </NForm>
      </template>

      <template v-else-if="permissionKey === 'customer'">
        <NForm label-placement="left" label-width="88">
          <NFormItem label="客户范围">
            <NRadioGroup v-model:value="draftCustomerScope">
              <NSpace vertical>
                <NRadio value="all">全部客户</NRadio>
                <NRadio value="partial">部分客户</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
          <NFormItem v-if="draftCustomerScope === 'partial'" label="指定客户">
            <NSelect multiple filterable placeholder="请选择客户" :options="[]" />
          </NFormItem>
        </NForm>
      </template>

      <template v-else-if="permissionKey === 'supplier'">
        <NForm label-placement="left" label-width="88">
          <NFormItem label="供应商范围">
            <NRadioGroup v-model:value="draftSupplierScope">
              <NSpace vertical>
                <NRadio value="all">全部供应商</NRadio>
                <NRadio value="partial">部分供应商</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
          <NFormItem v-if="draftSupplierScope === 'partial'" label="指定供应商">
            <NSelect multiple filterable placeholder="请选择供应商" :options="[]" />
          </NFormItem>
        </NForm>
      </template>

      <template v-else-if="permissionKey === 'pda'">
        <NForm label-placement="left" label-width="108">
          <NFormItem label="移动端权限">
            <NCheckboxGroup v-model:value="draftPdaScopes">
              <NSpace vertical>
                <NCheckbox v-for="item in pdaScopeOptions" :key="item.value" :value="item.value" :label="item.label" />
              </NSpace>
            </NCheckboxGroup>
          </NFormItem>
        </NForm>
      </template>

      <template v-else-if="permissionKey === 'security'">
        <NForm label-placement="left" label-width="108">
          <NFormItem label="双因素认证">
            <NSwitch v-model:value="draftSecurity.mfa" />
          </NFormItem>
          <NFormItem label="登录 IP 限制">
            <NSwitch v-model:value="draftSecurity.ipLimit" />
          </NFormItem>
          <NFormItem label="单端登录">
            <NSwitch v-model:value="draftSecurity.singleSession" />
          </NFormItem>
        </NForm>
      </template>

      <template v-else>
        <NEmpty description="该权限项暂不支持配置" />
      </template>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="handleClose">取消</NButton>
          <NButton type="primary" :loading="loading" @click="handleConfirm">保存</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
.drawer-subtitle {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.permission-tree-panel {
  min-height: 420px;
  max-height: calc(100vh - 220px);
  overflow: auto;
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
}
</style>
