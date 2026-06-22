<script setup lang="ts">

import { computed, defineAsyncComponent, ref, watch } from 'vue';

import { useLoading } from '@sa/hooks';

import { jsonClone } from '@sa/utils';

import { fetchGetUserInfo, fetchUpdateUser } from '@/service/api/system';

import { useNaiveForm } from '@/hooks/common/form';

import { DEFAULT_PHONE_COUNTRY_CODE } from '@/constants/phone-country';

import { createIntlPhoneRule, splitIntlPhone } from '@/utils/phone/intl-phone';

import IntlPhoneInput from '@/components/custom/intl-phone-input.vue';

import { ACCOUNT_TYPE_OPTIONS } from '@/mock/data/user-workbench-constants';

import type { UserPermissionSummary } from '@/mock/data/user-permission-workbench';



const UserPermissionItemDrawer = defineAsyncComponent(() => import('./user-permission-item-drawer.vue'));



defineOptions({ name: 'UserPermissionPanel' });



interface Props {

  user: (Api.System.User & Record<string, any>) | null;

  deptData?: Api.Common.CommonTreeRecord;

  postOptions?: CommonType.Option[];

}



interface Emits {

  (e: 'saved'): void;

  (e: 'reset-password'): void;

  (e: 'copy-permissions'): void;

}



const props = withDefaults(defineProps<Props>(), {

  deptData: () => [],

  postOptions: () => []

});

const emit = defineEmits<Emits>();



const detailTab = ref('detail');

const { formRef, validate, restoreValidation } = useNaiveForm();

const { loading, startLoading, endLoading } = useLoading();



const roleOptions = ref<CommonType.Option[]>([]);



const model = ref({

  userId: null as CommonType.IdType | null,

  userName: '',

  nickName: '',

  phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,

  phonenumber: '',

  email: '',

  deptId: null as CommonType.IdType | null,

  postIds: [] as CommonType.IdType[],

  accountType: 'INTERNAL',

  status: '0' as Api.Common.EnableStatus,

  remark: '',

  roleIds: [] as CommonType.IdType[]

});



const formRules = {

  phonenumber: [createIntlPhoneRule(() => model.value.phoneCountryCode)]

};



const permissionDrawerVisible = ref(false);

const permissionDrawerTitle = ref('');

const permissionDrawerKey = ref('');

const permissionDrawerType = ref<'role' | 'menu' | 'button' | 'warehouse' | 'generic'>('generic');

const permissionRefreshKey = ref(0);

const summary = ref<UserPermissionSummary | null>(null);

const summaryLoading = ref(false);



const permissionItems = computed(() => {

  if (!summary.value) return [];

  return [

    { key: 'role', label: '角色与岗位', value: summary.value.roleLabel, type: 'role' as const },

    { key: 'menu', label: '菜单权限', value: `已授权 ${summary.value.menuCount} 个菜单`, type: 'menu' as const },

    { key: 'button', label: '按钮权限', value: `已授权 ${summary.value.buttonCount} 个按钮`, type: 'button' as const },

    { key: 'data', label: '数据权限', value: summary.value.dataScopeLabel, type: 'generic' as const },

    { key: 'warehouse', label: '仓库权限', value: summary.value.warehouseLabel, type: 'warehouse' as const },

    { key: 'customer', label: '客户权限', value: summary.value.customerLabel, type: 'generic' as const },

    { key: 'supplier', label: '供应商权限', value: summary.value.supplierLabel, type: 'generic' as const },

    { key: 'pda', label: 'PDA / 司机权限', value: summary.value.pdaLabel, type: 'generic' as const },

    { key: 'security', label: '登录安全设置', value: summary.value.securityLabel, type: 'generic' as const }

  ];

});



async function refreshPermissionSummary(userId: CommonType.IdType) {

  summaryLoading.value = true;

  try {

    const { loadUserPermissionSummary } = await import('@/mock/data/user-permission-workbench');

    summary.value = await loadUserPermissionSummary(userId);

  } finally {

    summaryLoading.value = false;

  }

}



watch(

  () => [props.user?.userId, permissionRefreshKey.value] as const,

  async ([userId]) => {

    if (userId == null) {

      summary.value = null;

      return;

    }

    await refreshPermissionSummary(userId);

  },

  { immediate: true }

);



watch(

  () => props.user,

  async user => {

    await restoreValidation();

    if (!user) {

      model.value = {

        userId: null,

        userName: '',

        nickName: '',

        phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,

        phonenumber: '',

        email: '',

        deptId: null,

        postIds: [],

        accountType: 'INTERNAL',

        status: '0',

        remark: '',

        roleIds: []

      };

      return;

    }

    startLoading();

    const { data, error } = await fetchGetUserInfo(user.userId);

    endLoading();

    if (error) return;

    roleOptions.value = data.roles.map(r => ({ label: r.roleName, value: r.roleId }));

    const phoneParts = splitIntlPhone(user.phonenumber, user.phoneCountryCode);

    model.value = {

      userId: user.userId,

      userName: user.userName,

      nickName: user.nickName,

      phoneCountryCode: phoneParts.phoneCountryCode,

      phonenumber: phoneParts.phonenumber,

      email: user.email,

      deptId: user.deptId,

      postIds: data.postIds.map(Number),

      accountType: user.accountType || 'INTERNAL',

      status: user.status,

      remark: user.remark || '',

      roleIds: data.roleIds.map(Number)

    };

  },

  { immediate: true }

);



function openPermissionItem(item: (typeof permissionItems.value)[number]) {

  if (!props.user) return;

  permissionDrawerKey.value = item.key;

  permissionDrawerType.value = item.type;

  permissionDrawerTitle.value = item.label;

  permissionDrawerVisible.value = true;

}



async function handlePermissionSubmitted() {

  if (props.user) {

    const { invalidateUserPermissionSummary } = await import('@/mock/data/user-permission-workbench');

    invalidateUserPermissionSummary(props.user.userId);

  }

  permissionRefreshKey.value += 1;

  if (props.user) {

    const { data } = await fetchGetUserInfo(props.user.userId);

    if (data) {

      model.value.roleIds = data.roleIds.map(Number);

      model.value.postIds = data.postIds.map(Number);

    }

  }

  emit('saved');

}



async function handleSave() {

  if (!props.user) return;

  await validate();

  startLoading();

  const payload = jsonClone(model.value) as Api.System.UserOperateParams;

  const { error } = await fetchUpdateUser(payload);

  endLoading();

  if (error) return;

  window.$message?.success('保存成功');

  emit('saved');

}



function handleCopyPermissions() {

  emit('copy-permissions');

  window.$message?.success('已复制权限配置（原型）');

}

</script>



<template>

  <NCard :bordered="false" size="small" class="permission-panel card-wrapper h-full w-320px shrink-0">

    <template v-if="user">

      <NTabs v-model:value="detailTab" type="line" size="small" class="mb-8px">

        <NTabPane name="detail" tab="用户详情" />

        <NTabPane name="login" tab="登录日志" />

        <NTabPane name="operation" tab="操作日志" />

        <NTabPane name="permission" tab="权限变更" />

      </NTabs>



      <div v-show="detailTab === 'detail'" class="panel-body">

        <div class="mb-12px text-14px font-600">{{ user.nickName }}（{{ user.userName }}）</div>

        <NSpin :show="loading">

          <NForm ref="formRef" :model="model" :rules="formRules" label-placement="top" size="small">

            <NFormItem label="用户 ID">

              <NInput :value="String(user.userId)" disabled />

            </NFormItem>

            <NFormItem label="姓名">

              <NInput v-model:value="model.nickName" />

            </NFormItem>

            <NFormItem label="手机号" path="phonenumber">

              <IntlPhoneInput

                v-model:phone-country-code="model.phoneCountryCode"

                v-model:phonenumber="model.phonenumber"

                size="small"

              />

            </NFormItem>

            <NFormItem label="邮箱">

              <NInput v-model:value="model.email" />

            </NFormItem>

            <NFormItem label="所属部门">

              <NTreeSelect

                v-model:value="model.deptId"

                :options="deptData as []"

                key-field="id"

                label-field="label"

                clearable

              />

            </NFormItem>

            <NFormItem label="岗位">

              <NSelect v-model:value="model.postIds" multiple :options="postOptions" />

            </NFormItem>

            <NFormItem label="账号类型">

              <NSelect v-model:value="model.accountType" :options="ACCOUNT_TYPE_OPTIONS" />

            </NFormItem>

            <NFormItem label="状态">

              <DictSelect v-model:value="model.status" dict-code="sys_normal_disable" />

            </NFormItem>

            <NFormItem label="备注">

              <NInput v-model:value="model.remark" type="textarea" :rows="2" />

            </NFormItem>

          </NForm>

        </NSpin>



        <NDivider class="my-12px">权限配置</NDivider>

        <NSpin :show="summaryLoading" size="small">

          <div class="permission-list">

            <div

              v-for="item in permissionItems"

              :key="item.key"

              class="permission-item"

              @click="openPermissionItem(item)"

            >

              <span class="permission-label">{{ item.label }}</span>

              <span class="permission-value">{{ item.value }}</span>

              <icon-material-symbols-chevron-right class="text-16px text-gray" />

            </div>

          </div>

        </NSpin>



        <div class="panel-footer mt-12px flex flex-wrap gap-8px">

          <NButton size="small" @click="handleCopyPermissions">复制权限</NButton>

          <NButton size="small" @click="emit('reset-password')">重置密码</NButton>

          <NButton size="small" type="primary" :loading="loading" @click="handleSave">保存</NButton>

        </div>

      </div>



      <div v-show="detailTab !== 'detail'" class="panel-body">

        <NEmpty description="请在下方日志区查看该用户相关记录" class="min-h-200px justify-center" />

      </div>

    </template>

    <NEmpty v-else description="请选择用户查看详情与权限" class="min-h-300px justify-center" />



    <UserPermissionItemDrawer

      v-if="permissionDrawerVisible"

      v-model:visible="permissionDrawerVisible"

      :title="permissionDrawerTitle"

      :permission-key="permissionDrawerKey"

      :type="permissionDrawerType"

      :user="user"

      :role-ids="model.roleIds"

      :role-options="roleOptions"

      :post-ids="model.postIds"

      :post-options="postOptions"

      @submitted="handlePermissionSubmitted"

    />

  </NCard>

</template>



<style scoped lang="scss">

.permission-panel {

  display: flex;

  flex-direction: column;

  min-height: 0;

  overflow: hidden;

}



.panel-body {

  flex: 1;

  overflow: auto;

  max-height: calc(100vh - 220px);

}



.permission-list {

  display: flex;

  flex-direction: column;

  gap: 4px;

}



.permission-item {

  display: flex;

  align-items: center;

  gap: 8px;

  padding: 10px 12px;

  border-radius: 6px;

  background: rgb(var(--container-bg-color));

  cursor: pointer;

  transition: background 0.2s;



  &:hover {

    background: rgb(var(--primary-color) / 0.08);

  }

}



.permission-label {

  flex: 1;

  font-size: 13px;

}



.permission-value {

  font-size: 12px;

  color: rgb(var(--primary-color));

}



.panel-footer {

  border-top: 1px solid var(--n-border-color);

  padding-top: 12px;

}

</style>


