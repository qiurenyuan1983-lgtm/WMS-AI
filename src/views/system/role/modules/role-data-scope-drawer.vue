<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import { dataScopeOptions } from '@/constants/business';
import {
  fetchGetOrgScopeCompanies,
  fetchGetOrgScopeWarehouses,
  fetchGetRoleOrgScope,
  fetchUpdateRoleOrgScope
} from '@/service/api/system/org-scope';
import { fetchGetRoleDeptTreeSelect, fetchUpdateRoleDataScope } from '@/service/api/system/role';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import DeptTree from '@/components/custom/dept-tree.vue';

defineOptions({
  name: 'RoleDataScopeDrawer'
});

interface Props {
  /** the edit row data */
  rowData?: Api.System.Role | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const deptTreeRef = ref<InstanceType<typeof DeptTree> | null>(null);

const visible = defineModel<boolean>('visible', {
  default: false
});

const deptOptions = ref<Api.System.Dept[]>([]);
const companyOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);
const warehouseOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

const { loading: deptLoading, startLoading: startDeptLoading, endLoading: endDeptLoading } = useLoading();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => '分配数据权限');

type Model = Api.System.RoleOperateParams;
type OrgModel = Api.System.RoleOrgScopeOperateParams;

const model: Model = reactive(createDefaultModel());
const orgModel: OrgModel = reactive(createDefaultOrgModel());

function createDefaultModel(): Model {
  return {
    roleId: props.rowData?.roleId,
    roleName: props.rowData?.roleName,
    roleKey: props.rowData?.roleKey,
    roleSort: props.rowData?.roleSort,
    deptIds: [],
    menuIds: [],
    deptCheckStrictly: true,
    dataScope: '1'
  };
}

function createDefaultOrgModel(): OrgModel {
  return {
    roleId: props.rowData?.roleId,
    orgScope: 'ALL',
    companyIds: [],
    warehouseIds: []
  };
}

type RuleKey = Extract<keyof Model, 'dataScope'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  dataScope: createRequiredRule('数据权限范围不能为空')
};

async function handleUpdateModelWhenEdit() {
  startDeptLoading();
  deptOptions.value = [];
  model.deptIds = [];
  Object.assign(orgModel, createDefaultOrgModel());

  if (props.rowData) {
    Object.assign(model, props.rowData);
    orgModel.roleId = props.rowData.roleId;
    const [deptResult, orgResult, companyResult, warehouseResult] = await Promise.all([
      fetchGetRoleDeptTreeSelect(props.rowData.roleId!),
      fetchGetRoleOrgScope(props.rowData.roleId!),
      fetchGetOrgScopeCompanies(),
      fetchGetOrgScopeWarehouses()
    ]);
    if (!deptResult.error) {
      deptOptions.value = deptResult.data.depts;
      model.deptIds = deptResult.data.checkedKeys;
    }
    if (!orgResult.error) Object.assign(orgModel, orgResult.data);
    if (!companyResult.error) {
      companyOptions.value = (companyResult.data || []).map(item => ({
        label: `${item.companyName} (${item.companyCode})`,
        value: item.id
      }));
    }
    if (!warehouseResult.error) {
      warehouseOptions.value = (warehouseResult.data || []).map(item => ({
        label: `${item.warehouseName} (${item.warehouseCode})`,
        value: item.id
      }));
    }
  }
  endDeptLoading();
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { roleId, roleName, roleKey, roleSort, dataScope, deptIds, menuIds } = model;

  const { error } = await fetchUpdateRoleDataScope({
    roleId,
    roleName,
    roleKey,
    roleSort,
    dataScope,
    deptIds: dataScope === '2' ? deptIds : [],
    menuIds
  });
  if (error) return;

  const { error: orgError } = await fetchUpdateRoleOrgScope({
    roleId,
    orgScope: orgModel.orgScope,
    companyIds: orgModel.orgScope === 'COMPANY' ? orgModel.companyIds : [],
    warehouseIds: orgModel.orgScope === 'WAREHOUSE' ? orgModel.warehouseIds : []
  });
  if (orgError) return;

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="800" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem label="角色名称" path="roleName">
          <NInput v-model:value="model.roleName" disabled placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem path="roleKey">
          <template #label>
            <div class="flex-center">
              <FormTip content="控制器中定义的权限字符，如：@SaCheckRole('admin')" />
              <span class="pl-3px">权限字符</span>
            </div>
          </template>
          <NInput v-model:value="model.roleKey" disabled placeholder="请输入权限字符" />
        </NFormItem>
        <NFormItem label="权限范围" path="dataScope">
          <NSelect v-model:value="model.dataScope" :options="dataScopeOptions" />
        </NFormItem>
        <NFormItem v-if="model.dataScope === '2'" label="数据权限" path="deptIds" class="pr-24px">
          <DeptTree
            v-if="visible"
            ref="deptTreeRef"
            v-model:value="model.deptIds"
            v-model:options="deptOptions"
            v-model:loading="deptLoading"
            v-model:cascade="model.deptCheckStrictly"
            :immediate="false"
          />
        </NFormItem>
        <NDivider />
        <NFormItem label="组织范围" path="orgScope">
          <NRadioGroup v-model:value="orgModel.orgScope">
            <NRadio value="ALL">全部主体/仓库</NRadio>
            <NRadio value="COMPANY">指定主体</NRadio>
            <NRadio value="WAREHOUSE">指定仓库</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem v-if="orgModel.orgScope === 'COMPANY'" label="授权主体" path="companyIds">
          <NSelect
            v-model:value="orgModel.companyIds"
            :options="companyOptions"
            multiple
            filterable
            placeholder="请选择主体"
          />
        </NFormItem>
        <NFormItem v-if="orgModel.orgScope === 'WAREHOUSE'" label="授权仓库" path="warehouseIds">
          <NSelect
            v-model:value="orgModel.warehouseIds"
            :options="warehouseOptions"
            multiple
            filterable
            placeholder="请选择仓库"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
