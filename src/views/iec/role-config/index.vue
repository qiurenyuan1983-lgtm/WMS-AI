<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSelect, NSpace, NSwitch, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetIecEmployeeList, fetchUpdateIecEmployee } from '@/service/api/iec';
import { EMPLOYEE_STATUS_META, HIGH_RISK_ACTIONS } from '../constants';

defineOptions({ name: 'IecRoleConfig' });

const loading = ref(false);
const rows = ref<Api.Iec.IntelligentEmployee[]>([]);
const drawerVisible = ref(false);
const editing = ref<Api.Iec.IntelligentEmployee | null>(null);
const form = ref<{
  responsibleModules?: string;
  allowedActions?: string;
  forbiddenActions?: string;
  needManualConfirm?: boolean;
  workSchedule?: string;
  retryCount?: number;
  takeoverOwner?: string;
  logLevel?: string;
}>({});

const columns: DataTableColumns<Api.Iec.IntelligentEmployee> = [
  { key: 'employeeName', title: '智能员工', width: 130 },
  { key: 'roleTypeLabel', title: '岗位类型', width: 110 },
  {
    key: 'responsibleModules',
    title: '负责模块',
    width: 160,
    render: row => row.responsibleModules.join(' / ')
  },
  {
    key: 'needManualConfirm',
    title: '人工确认',
    width: 88,
    align: 'center',
    render: row => (row.needManualConfirm ? '是' : '否')
  },
  { key: 'workSchedule', title: '执行时间', width: 120 },
  { key: 'retryCount', title: '重试次数', width: 80, align: 'center' },
  { key: 'takeoverOwner', title: '异常接管人', width: 100 },
  {
    key: 'action',
    title: '操作',
    width: 88,
    fixed: 'right',
    render: row => <NButton size="tiny" type="primary" onClick={() => openEdit(row)}>配置</NButton>
  }
];

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchGetIecEmployeeList({ pageNum: 1, pageSize: 50 });
    rows.value = (data as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

function openEdit(row: Api.Iec.IntelligentEmployee) {
  editing.value = row;
  form.value = {
    responsibleModules: row.responsibleModules.join(', '),
    allowedActions: row.allowedActions.join(', '),
    forbiddenActions: row.forbiddenActions.join(', '),
    needManualConfirm: row.needManualConfirm,
    workSchedule: row.workSchedule,
    retryCount: row.retryCount,
    takeoverOwner: row.takeoverOwner,
    logLevel: row.logLevel
  };
  drawerVisible.value = true;
}

async function save() {
  if (!editing.value) return;
  const split = (s?: string) => (s ? s.split(/,\s*/).filter(Boolean) : []);
  const { data } = await fetchUpdateIecEmployee(editing.value.id, {
    responsibleModules: split(form.value.responsibleModules),
    allowedActions: split(form.value.allowedActions),
    forbiddenActions: split(form.value.forbiddenActions),
    needManualConfirm: form.value.needManualConfirm,
    workSchedule: form.value.workSchedule,
    retryCount: form.value.retryCount,
    takeoverOwner: form.value.takeoverOwner,
    logLevel: form.value.logLevel
  });
  window.$message?.success((data as any)?.message ?? '已保存');
  drawerVisible.value = false;
  await load();
}

onMounted(load);
</script>

<template>
  <div class="h-full overflow-hidden">
    <NCard title="智能岗位配置" :bordered="false" class="card-wrapper h-full flex flex-col">
      <p class="text-13px text-gray-500 mb-12px">
        配置职责与权限边界。高风险操作（删除订单、付款、关闭严重异常、扣减库存）仅可生成建议或待确认任务。
      </p>
      <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Api.Iec.IntelligentEmployee) => r.id" size="small" :scroll-x="960" flex-height class="flex-1" />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="480" :to="POPUP_TO_BODY">
      <NDrawerContent :title="`配置 · ${editing?.employeeName}`" closable>
        <NForm v-if="editing" label-placement="left" label-width="100">
          <NFormItem label="负责模块"><NInput v-model:value="form.responsibleModules" placeholder="TMS,WMS" /></NFormItem>
          <NFormItem label="可执行动作"><NInput v-model:value="form.allowedActions" type="textarea" :rows="2" /></NFormItem>
          <NFormItem label="禁止动作">
            <NSpace vertical class="w-full">
              <NTag v-for="a in HIGH_RISK_ACTIONS" :key="a" type="error" size="small">{{ a }}</NTag>
              <NInput v-model:value="form.forbiddenActions" type="textarea" :rows="2" />
            </NSpace>
          </NFormItem>
          <NFormItem label="需人工确认"><NSwitch v-model:value="form.needManualConfirm" /></NFormItem>
          <NFormItem label="执行时间"><NInput v-model:value="form.workSchedule" /></NFormItem>
          <NFormItem label="失败重试"><NInput v-model:value="form.retryCount" /></NFormItem>
          <NFormItem label="异常接管人"><NInput v-model:value="form.takeoverOwner" /></NFormItem>
          <NFormItem label="日志级别">
            <NSelect v-model:value="form.logLevel" :options="[{ label: 'INFO', value: 'INFO' }, { label: 'WARN', value: 'WARN' }, { label: 'DEBUG', value: 'DEBUG' }]" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end"><NButton @click="drawerVisible = false">取消</NButton><NButton type="primary" @click="save">保存</NButton></NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
