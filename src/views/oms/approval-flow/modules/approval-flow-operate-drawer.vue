<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch
} from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { fetchGetWarehouseList } from '@/service/api/base/warehouse';
import { fetchCreateApprovalFlow, fetchUpdateApprovalFlow } from '@/service/api/oms/approval-flow';
import {
  APPROVAL_FLOW_CATEGORIES,
  APPROVAL_MODE_OPTIONS,
  APPROVAL_NODE_TYPE_OPTIONS,
  ROLE_APPROVER_OPTIONS,
  TRIGGER_HINTS
} from '../constants';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  row?: Api.Oms.ApprovalFlow | null;
  defaultCategory?: Api.Oms.ApprovalFlowCategory | null;
}>();

const emit = defineEmits<{ (e: 'submitted'): void }>();

const { options: statusOptions } = useDict('oms_approval_flow_status');

const warehouseOptions = reactive<CommonType.Option[]>([]);

type NodeRow = {
  nodeName: string;
  nodeType: Api.Oms.ApprovalNodeType;
  approverRole: string | null;
  approverNames: string;
  approveMode: Api.Oms.ApprovalMode;
  timeoutHours: number;
  autoPass: boolean;
};

const form = reactive({
  id: undefined as CommonType.IdType | undefined,
  flowCode: '',
  flowName: '',
  category: 'FEE' as Api.Oms.ApprovalFlowCategory,
  warehouseIds: [] as string[],
  warehouseNames: '',
  triggerDesc: '',
  amountThreshold: null as number | null,
  status: 'draft' as Api.Oms.ApprovalFlowStatus,
  remark: '',
  nodes: [
    {
      nodeName: '一级审批',
      nodeType: 'ROLE' as Api.Oms.ApprovalNodeType,
      approverRole: 'WAREHOUSE_SUPERVISOR',
      approverNames: '仓库主管',
      approveMode: 'ANY' as Api.Oms.ApprovalMode,
      timeoutHours: 24,
      autoPass: false
    }
  ] as NodeRow[]
});

const categoryOptions = APPROVAL_FLOW_CATEGORIES.map(c => ({ label: c.label, value: c.key }));
const isEdit = computed(() => Boolean(form.id));
const triggerHint = computed(() => TRIGGER_HINTS[form.category]);

function resetForm() {
  const category = props.defaultCategory || 'FEE';
  Object.assign(form, {
    id: undefined,
    flowCode: '',
    flowName: '',
    category,
    warehouseIds: warehouseOptions[0] ? [String(warehouseOptions[0].value)] : [],
    warehouseNames: warehouseOptions[0]?.label ? String(warehouseOptions[0].label) : '',
    triggerDesc: '',
    amountThreshold: null,
    status: 'draft',
    remark: '',
    nodes: [
      {
        nodeName: '一级审批',
        nodeType: 'ROLE' as Api.Oms.ApprovalNodeType,
        approverRole: 'WAREHOUSE_SUPERVISOR',
        approverNames: '仓库主管',
        approveMode: 'ANY' as Api.Oms.ApprovalMode,
        timeoutHours: 24,
        autoPass: false
      }
    ]
  });
}

function parseNodes(nodesConfig: string): NodeRow[] {
  try {
    const nodes = JSON.parse(nodesConfig) as Api.Oms.ApprovalFlowNode[];
    return nodes.map(n => ({
      nodeName: n.nodeName,
      nodeType: n.nodeType,
      approverRole: n.approverIds || null,
      approverNames: n.approverNames,
      approveMode: n.approveMode || 'ANY',
      timeoutHours: n.timeoutHours ?? 24,
      autoPass: Boolean(n.autoPass)
    }));
  } catch {
    return form.nodes;
  }
}

function fillForm(row: Api.Oms.ApprovalFlow) {
  let amountThreshold: number | null = null;
  try {
    const cfg = JSON.parse(row.triggerConfig || '{}');
    amountThreshold = cfg.amountThreshold ?? null;
  } catch {
    amountThreshold = null;
  }
  let warehouseIds: string[] = [];
  try {
    warehouseIds = JSON.parse(row.warehouseIds || '[]');
  } catch {
    warehouseIds = [];
  }
  Object.assign(form, {
    id: row.id,
    flowCode: row.flowCode,
    flowName: row.flowName,
    category: row.category,
    warehouseIds,
    warehouseNames: row.warehouseName || '',
    triggerDesc: row.triggerDesc,
    amountThreshold,
    status: row.status,
    remark: row.remark || '',
    nodes: parseNodes(row.nodesConfig)
  });
}

watch(
  () => visible.value,
  async open => {
    if (!open) return;
    if (!warehouseOptions.length) {
      const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 100, status: '0' });
      warehouseOptions.splice(0, warehouseOptions.length, ...(data?.rows || []).map(w => ({ label: w.warehouseName, value: w.id })));
    }
    if (props.row) fillForm(props.row);
    else resetForm();
  }
);

function addNode() {
  form.nodes.push({
    nodeName: `${form.nodes.length + 1} 级审批`,
    nodeType: 'ROLE',
    approverRole: null,
    approverNames: '',
    approveMode: 'ANY',
    timeoutHours: 24,
    autoPass: false
  });
}

function removeNode(index: number) {
  if (form.nodes.length <= 1) return;
  form.nodes.splice(index, 1);
}

function onRoleChange(node: NodeRow, role: string) {
  const opt = ROLE_APPROVER_OPTIONS.find(o => o.value === role);
  node.approverNames = opt?.label ? String(opt.label) : node.approverNames;
}

function buildPayload(): Api.Oms.ApprovalFlowOperateParams {
  const triggerConfig =
    form.amountThreshold != null ? JSON.stringify({ amountThreshold: form.amountThreshold }) : null;
  const nodesConfig = JSON.stringify(
    form.nodes.map((node, index) => ({
      stepNo: index + 1,
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      approverIds: node.approverRole,
      approverNames: node.approverNames,
      approveMode: node.approveMode,
      timeoutHours: node.timeoutHours,
      autoPass: node.autoPass
    }))
  );
  const whLabel = warehouseOptions.find(o => String(o.value) === form.warehouseIds[0])?.label;
  return {
    id: form.id,
    flowCode: form.flowCode,
    flowName: form.flowName,
    category: form.category,
    warehouseIds: JSON.stringify(form.warehouseIds),
    warehouseName: whLabel ? String(whLabel) : form.warehouseNames,
    triggerDesc: form.triggerDesc,
    triggerConfig,
    nodesConfig,
    status: form.status,
    remark: form.remark
  };
}

async function handleSubmit() {
  if (!form.flowName.trim()) {
    window.$message?.warning('请填写流程名称');
    return;
  }
  const payload = buildPayload();
  const { error } = isEdit.value ? await fetchUpdateApprovalFlow(payload) : await fetchCreateApprovalFlow(payload);
  if (error) return;
  window.$message?.success(isEdit.value ? '更新成功' : '创建成功');
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="640" display-directive="show">
    <NDrawerContent :title="isEdit ? '编辑审批流' : '新增审批流'" closable>
      <NForm label-placement="top" size="small">
        <NGrid :cols="2" :x-gap="12">
          <NGridItem>
            <NFormItem label="流程编号">
              <NInput v-model:value="form.flowCode" placeholder="留空自动生成" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="流程名称" required>
              <NInput v-model:value="form.flowName" placeholder="请输入流程名称" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="审批类型">
              <NSelect v-model:value="form.category" :options="categoryOptions" :disabled="isEdit" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="适用仓库">
              <NSelect v-model:value="form.warehouseIds" multiple :options="warehouseOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="状态">
              <NSelect v-model:value="form.status" :options="statusOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem v-if="['FEE', 'EXCEPTION_COMPENSATION'].includes(form.category)">
            <NFormItem label="金额阈值 (USD)">
              <NInputNumber v-model:value="form.amountThreshold" :min="0" class="w-full" placeholder="超过此金额触发审批" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <NFormItem label="触发条件">
          <NInput v-model:value="form.triggerDesc" type="textarea" :rows="2" :placeholder="triggerHint" />
        </NFormItem>

        <div class="mb-8px flex items-center justify-between">
          <span class="text-13px font-500">审批节点</span>
          <NButton size="tiny" type="primary" ghost @click="addNode">添加节点</NButton>
        </div>

        <div v-for="(node, index) in form.nodes" :key="index" class="mb-12px border border-#e5e7eb rounded-8px p-12px">
          <div class="mb-8px flex items-center justify-between">
            <span class="text-12px text-#6b7280">节点 {{ index + 1 }}</span>
            <NButton v-if="form.nodes.length > 1" size="tiny" quaternary type="error" @click="removeNode(index)">删除</NButton>
          </div>
          <NGrid :cols="2" :x-gap="12">
            <NGridItem>
              <NFormItem label="节点名称">
                <NInput v-model:value="node.nodeName" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="审批人类型">
                <NSelect v-model:value="node.nodeType" :options="APPROVAL_NODE_TYPE_OPTIONS" />
              </NFormItem>
            </NGridItem>
            <NGridItem v-if="node.nodeType === 'ROLE'">
              <NFormItem label="审批角色">
                <NSelect
                  v-model:value="node.approverRole"
                  :options="ROLE_APPROVER_OPTIONS"
                  @update:value="(v: string) => onRoleChange(node, v)"
                />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="审批人显示名">
                <NInput v-model:value="node.approverNames" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="审批方式">
                <NSelect v-model:value="node.approveMode" :options="APPROVAL_MODE_OPTIONS" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="超时 (小时)">
                <NInputNumber v-model:value="node.timeoutHours" :min="1" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="超时自动通过">
                <NSwitch v-model:value="node.autoPass" />
              </NFormItem>
            </NGridItem>
          </NGrid>
        </div>

        <NFormItem label="备注">
          <NInput v-model:value="form.remark" type="textarea" :rows="2" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
