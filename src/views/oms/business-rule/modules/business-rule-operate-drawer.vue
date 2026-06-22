<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  NButton,
  NDatePicker,
  NDivider,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace
} from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { fetchGetWarehouseList } from '@/service/api/base/warehouse';
import {
  fetchCreateBusinessRule,
  fetchUpdateBusinessRule
} from '@/service/api/oms/business-rule';
import {
  ACTION_TYPE_OPTIONS,
  BIZ_TYPE_SCOPE_OPTIONS,
  CONDITION_MENU_OPTIONS,
  CUSTOMER_SCOPE_OPTIONS,
  NOTIFY_TARGET_OPTIONS,
  RULE_CATEGORIES,
  TRIGGER_EVENTS
} from '../constants';
import RuleConditionBuilder from './rule-condition-builder.vue';
import RuleTestRunPanel from './rule-test-run-panel.vue';
import { normalizeConditionRow, type ConditionRow } from '../utils/condition-row';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  row?: Api.Oms.BusinessRule | null;
  defaultCategory?: Api.Oms.BusinessRuleCategory | null;
}>();

const emit = defineEmits<{ (e: 'submitted'): void }>();

const { options: statusOptions } = useDict('oms_business_rule_status');
const { options: priorityTierOptions } = useDict('oms_business_rule_priority_tier');
const { options: actionLevelOptions } = useDict('oms_business_rule_action_level');
const { options: conflictOptions } = useDict('oms_business_rule_conflict_strategy');

const warehouseOptions = reactive<CommonType.Option[]>([]);
const testPanelRef = ref<InstanceType<typeof RuleTestRunPanel> | null>(null);

type ActionRow = {
  level: Api.Oms.BusinessRuleActionLevel;
  type: string;
  message: string;
  notifyTargets: string[];
  execMenuPage: string | null;
};

const form = reactive({
  id: undefined as CommonType.IdType | undefined,
  ruleCode: '',
  ruleName: '',
  category: 'ORDER' as Api.Oms.BusinessRuleCategory,
  warehouseIds: [] as string[],
  warehouseNames: '',
  customerScope: 'ALL',
  bizTypeScope: 'ALL',
  triggerEvent: '',
  priorityTier: 'P3' as Api.Oms.BusinessRulePriorityTier,
  priority: 50,
  conflictStrategy: 'FIRST_BLOCK_WINS' as Api.Oms.BusinessRuleConflictStrategy,
  effectiveStart: null as number | null,
  effectiveEnd: null as number | null,
  status: 'draft' as Api.Oms.BusinessRuleStatus,
  remark: '',
  conditionLogic: 'AND' as 'AND' | 'OR',
  conditions: [{ menu: null, field: null, op: 'IN', value: [] }] as ConditionRow[],
  actions: [{ level: 'HINT' as Api.Oms.BusinessRuleActionLevel, type: 'NOTIFY', message: '', notifyTargets: [], execMenuPage: null }] as ActionRow[]
});

const categoryOptions = RULE_CATEGORIES.map(c => ({ label: c.label, value: c.key }));

const triggerOptions = computed(() => TRIGGER_EVENTS[form.category] || []);

function resetForm() {
  Object.assign(form, {
    id: undefined,
    ruleCode: '',
    ruleName: '',
    category: props.defaultCategory || 'ORDER',
    warehouseIds: warehouseOptions[0] ? [String(warehouseOptions[0].value)] : [],
    warehouseNames: warehouseOptions[0]?.label ? String(warehouseOptions[0].label) : '',
    customerScope: 'ALL',
    bizTypeScope: 'ALL',
    triggerEvent: '',
    priorityTier: 'P3',
    priority: 50,
    conflictStrategy: 'FIRST_BLOCK_WINS',
    effectiveStart: null,
    effectiveEnd: null,
    status: 'draft',
    remark: '',
    conditionLogic: 'AND',
    conditions: [{ menu: null, field: null, op: 'IN', value: [] }],
    actions: [{ level: 'HINT', type: 'NOTIFY', message: '', notifyTargets: [], execMenuPage: null }]
  });
}

function loadFromRow(row: Api.Oms.BusinessRule) {
  const cond = JSON.parse(row.conditionConfig || '{}') as Api.Oms.BusinessRuleConditionConfig;
  const acts = JSON.parse(row.actionsConfig || '[]') as Api.Oms.BusinessRuleAction[];
  let whIds: string[] = [];
  try { whIds = JSON.parse(row.warehouseIds || '[]'); } catch { whIds = []; }
  Object.assign(form, {
    id: row.id,
    ruleCode: row.ruleCode,
    ruleName: row.ruleName,
    category: row.category,
    warehouseIds: whIds,
    warehouseNames: row.warehouseName || '',
    customerScope: row.customerScope || 'ALL',
    bizTypeScope: row.bizTypeScope || 'ALL',
    triggerEvent: row.triggerEvent || '',
    priorityTier: row.priorityTier,
    priority: row.priority,
    conflictStrategy: row.conflictStrategy,
    effectiveStart: row.effectiveStart ? new Date(row.effectiveStart).getTime() : null,
    effectiveEnd: row.effectiveEnd ? new Date(row.effectiveEnd).getTime() : null,
    status: row.status,
    remark: row.remark || '',
    conditionLogic: cond.logic || 'AND',
    conditions: cond.conditions?.length
      ? cond.conditions.map(c => normalizeConditionRow({ ...c, field: c.field }))
      : [{ menu: null, field: null, op: 'IN', value: [] }],
    actions: acts.length
      ? acts.map(a => ({
          level: a.level,
          type: a.type,
          message: a.message || '',
          notifyTargets: a.notifyTargets || [],
          execMenuPage: a.execMenuPage || (a.params?.execMenuPage as string) || null
        }))
      : [{ level: 'HINT', type: 'NOTIFY', message: '', notifyTargets: [], execMenuPage: null }]
  });
}

watch(visible, val => {
  if (!val) {
    testPanelRef.value?.resetPanel();
    return;
  }
  if (props.row) loadFromRow(props.row);
  else resetForm();
});

watch(() => form.category, (cat, prev) => {
  if (!visible.value || (props.row && prev === undefined)) return;
  const options = TRIGGER_EVENTS[cat] || [];
  const stillValid = options.some(item => String(item.value) === String(form.triggerEvent));
  if (!stillValid) form.triggerEvent = '';
});

function onWarehouseChange(ids: string[]) {
  form.warehouseIds = ids;
  form.warehouseNames = ids
    .map(id => warehouseOptions.find(o => String(o.value) === String(id))?.label || id)
    .join(', ');
}

function addAction() {
  form.actions.push({ level: 'HINT', type: 'NOTIFY', message: '', notifyTargets: [], execMenuPage: null });
}

function removeAction(index: number) {
  form.actions.splice(index, 1);
  if (!form.actions.length) addAction();
}

function fmtDate(ts: number | null) {
  if (!ts) return null;
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function handleSubmit() {
  if (!form.ruleName.trim()) return window.$message?.warning('请输入规则名称');
  if (!form.warehouseIds.length) return window.$message?.warning('请选择适用仓库');
  const payload: Api.Oms.BusinessRuleOperateParams = {
    id: form.id,
    ruleCode: form.ruleCode || undefined,
    ruleName: form.ruleName.trim(),
    category: form.category,
    warehouseIds: JSON.stringify(form.warehouseIds),
    warehouseNames: form.warehouseNames,
    customerScope: form.customerScope || 'ALL',
    bizTypeScope: form.bizTypeScope || 'ALL',
    triggerEvent: form.triggerEvent || null,
    conditionConfig: JSON.stringify({
      logic: form.conditionLogic,
      conditions: form.conditions
        .filter(c => c.field)
        .map(({ menu: _menu, field, op, value }) => ({ field, op, value }))
    }),
    actionsConfig: JSON.stringify(
      form.actions.map(a => ({
        level: a.level,
        type: a.type,
        message: a.message || null,
        notifyTargets: a.notifyTargets.length ? a.notifyTargets : null,
        execMenuPage: a.execMenuPage || null,
        params: a.execMenuPage ? { execMenuPage: a.execMenuPage } : {}
      }))
    ),
    priorityTier: form.priorityTier,
    priority: form.priority,
    conflictStrategy: form.conflictStrategy,
    effectiveStart: fmtDate(form.effectiveStart),
    effectiveEnd: fmtDate(form.effectiveEnd),
    status: form.status,
    remark: form.remark || null
  };

  const api = form.id ? fetchUpdateBusinessRule : fetchCreateBusinessRule;
  const { error } = await api(payload);
  if (error) return;
  window.$message?.success(form.id ? '更新成功' : '创建成功');
  visible.value = false;
  emit('submitted');
}

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 500, status: '0', params: {} });
  warehouseOptions.splice(0, warehouseOptions.length, ...(data?.rows || []).map(w => ({
    label: w.warehouseName,
    value: String(w.id)
  })));
}

loadWarehouses();
</script>

<template>
  <NDrawer v-model:show="visible" :width="920" class="max-w-98%">
    <NDrawerContent :title="form.id ? '编辑业务规则' : '新增业务规则'" closable :native-scrollbar="false">
      <NForm label-placement="left" :label-width="108">
        <NDivider title-placement="left">基础信息</NDivider>
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem label="规则编号">
              <NInput v-model:value="form.ruleCode" placeholder="留空自动生成，如 ORD-0001" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="规则名称" required>
              <NInput v-model:value="form.ruleName" placeholder="例如：高货值货物自动分配贵品区" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="规则分类" required>
              <NSelect v-model:value="form.category" :options="categoryOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="触发事件">
              <NSelect v-model:value="form.triggerEvent" :options="triggerOptions" filterable clearable placeholder="可选，不填则仅按条件匹配" />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem label="适用仓库" required>
              <NSelect
                :value="form.warehouseIds"
                :options="warehouseOptions"
                multiple
                filterable
                @update:value="onWarehouseChange"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="适用客户">
              <NSelect
                v-model:value="form.customerScope"
                :options="CUSTOMER_SCOPE_OPTIONS"
                filterable
                clearable
                placeholder="请选择客户范围"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="业务类型">
              <NSelect
                v-model:value="form.bizTypeScope"
                :options="BIZ_TYPE_SCOPE_OPTIONS"
                filterable
                clearable
                placeholder="请选择业务类型"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="优先级层级">
              <NSelect v-model:value="form.priorityTier" :options="priorityTierOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="优先级数值">
              <NInputNumber v-model:value="form.priority" class="w-full" :min="0" :max="999" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="冲突策略">
              <NSelect v-model:value="form.conflictStrategy" :options="conflictOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="状态">
              <NSelect v-model:value="form.status" :options="statusOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="生效开始">
              <NDatePicker v-model:value="form.effectiveStart" type="date" clearable class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="生效结束">
              <NDatePicker v-model:value="form.effectiveEnd" type="date" clearable class="w-full" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <NDivider title-placement="left">条件组合</NDivider>
        <RuleConditionBuilder v-model:logic="form.conditionLogic" v-model:conditions="form.conditions" />

        <NDivider title-placement="left">执行动作</NDivider>
        <NSpace vertical :size="12" class="w-full">
          <div v-for="(action, idx) in form.actions" :key="idx" class="rounded-8px border border-#e5e7eb p-12px">
            <NGrid :cols="2" :x-gap="12">
              <NGridItem>
                <NFormItem label="动作等级" :show-feedback="false">
                  <NSelect v-model:value="action.level" :options="actionLevelOptions" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="动作类型" :show-feedback="false">
                  <NSelect v-model:value="action.type" :options="ACTION_TYPE_OPTIONS" filterable />
                </NFormItem>
              </NGridItem>
              <NGridItem :span="2">
                <NFormItem label="执行菜单页面" :show-feedback="false">
                  <NSelect
                    v-model:value="action.execMenuPage"
                    :options="CONDITION_MENU_OPTIONS"
                    filterable
                    clearable
                    placeholder="命中后跳转或展示的菜单页面"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem :span="2">
                <NFormItem label="说明文案" :show-feedback="false">
                  <NInput v-model:value="action.message" type="textarea" :rows="2" placeholder="命中后展示给操作员或写入日志" />
                </NFormItem>
              </NGridItem>
              <NGridItem :span="2">
                <NFormItem label="通知对象" :show-feedback="false">
                  <NSelect v-model:value="action.notifyTargets" :options="NOTIFY_TARGET_OPTIONS" multiple />
                </NFormItem>
              </NGridItem>
            </NGrid>
            <div class="mt-8px text-right">
              <NButton quaternary type="error" size="small" @click="removeAction(idx)">删除动作</NButton>
            </div>
          </div>
          <NButton size="small" secondary @click="addAction">添加动作</NButton>
        </NSpace>

        <NDivider title-placement="left">规则试算</NDivider>
        <RuleTestRunPanel
          ref="testPanelRef"
          :rule-id="form.id"
          :rule-name="form.ruleName"
          :trigger-event="form.triggerEvent || null"
          :condition-logic="form.conditionLogic"
          :conditions="form.conditions"
          :actions="form.actions"
          :conflict-strategy="form.conflictStrategy"
          :priority="form.priority"
        />

        <NDivider title-placement="left">备注</NDivider>
        <NInput v-model:value="form.remark" type="textarea" :rows="2" placeholder="可选" />
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
