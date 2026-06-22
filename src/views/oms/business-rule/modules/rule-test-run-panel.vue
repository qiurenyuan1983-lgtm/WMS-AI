<script setup lang="ts">
import { computed, ref } from 'vue';
import { NAlert, NButton, NProgress, NTag } from 'naive-ui';
import { fetchTestBusinessRule } from '@/service/api/oms/business-rule';
import { ACTION_TYPE_OPTIONS, OP_OPTIONS, getMenuLabel } from '../constants';
import { buildPassingTestContext } from '../utils/rule-test-context';
import type { ConditionRow } from '../utils/condition-row';
import { getFieldDef, inferMenuFromField } from '../constants';
import { formatTimeRangeDisplay, isTimeFieldDef } from '../utils/condition-time-range';

type StepStatus = 'pending' | 'running' | 'done' | 'error';

type TestStep = {
  key: string;
  label: string;
  status: StepStatus;
  detail?: string;
};

const props = defineProps<{
  ruleName: string;
  triggerEvent?: string | null;
  conditionLogic: 'AND' | 'OR';
  conditions: ConditionRow[];
  actions: Array<{ level: string; type: string; message: string; execMenuPage?: string | null }>;
  conflictStrategy: string;
  priority: number;
  ruleId?: CommonType.IdType;
  disabled?: boolean;
}>();

const running = ref(false);
const progress = ref(0);
const steps = ref<TestStep[]>([]);
const testResult = ref<Api.Oms.BusinessRuleTestResult | null>(null);
const verified = ref(false);

const kanbanColumns = computed(() => ({
  pending: steps.value.filter(item => item.status === 'pending'),
  running: steps.value.filter(item => item.status === 'running'),
  done: steps.value.filter(item => item.status === 'done' || item.status === 'error')
}));

function fieldLabel(field: string) {
  const menu = inferMenuFromField(field);
  return getFieldDef(menu, field)?.label || field;
}

function opLabel(op: string) {
  return OP_OPTIONS.find(item => item.value === op)?.label || op;
}

function formatExpected(field: string, value: unknown) {
  const menu = inferMenuFromField(field);
  const def = getFieldDef(menu, field);
  if (isTimeFieldDef(def)) return formatTimeRangeDisplay(value);
  if (Array.isArray(value)) return value.join('、');
  return value == null || value === '' ? '—' : String(value);
}

function buildInitialSteps() {
  const list: TestStep[] = [
    { key: 'prepare', label: '准备模拟上下文', status: 'pending' },
    { key: 'validate', label: '校验规则配置', status: 'pending' }
  ];
  if (props.triggerEvent) {
    list.push({ key: 'trigger', label: '匹配触发事件', status: 'pending' });
  }
  props.conditions
    .filter(row => row.field)
    .forEach((row, index) => {
      list.push({
        key: `cond-${index}`,
        label: `评估条件：${fieldLabel(String(row.field))}`,
        status: 'pending',
        detail: `${opLabel(row.op)} ${formatExpected(String(row.field), row.value)}`
      });
    });
  list.push(
    { key: 'actions', label: '计算执行动作', status: 'pending' },
    { key: 'finish', label: '输出试算结论', status: 'pending' }
  );
  return list;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setStepStatus(key: string, status: StepStatus, detail?: string) {
  const step = steps.value.find(item => item.key === key);
  if (!step) return;
  step.status = status;
  if (detail != null) step.detail = detail;
}

async function animateStep(key: string, detail?: string) {
  setStepStatus(key, 'running', detail);
  progress.value = Math.min(95, progress.value + Math.floor(80 / Math.max(steps.value.length, 1)));
  await delay(420);
  setStepStatus(key, 'done', detail);
}

async function handleStartTest() {
  const validConditions = props.conditions.filter(row => row.field);
  if (!validConditions.length) {
    window.$message?.warning('请至少配置一条有效条件');
    return;
  }
  if (!props.actions.length) {
    window.$message?.warning('请至少配置一条执行动作');
    return;
  }

  running.value = true;
  verified.value = false;
  testResult.value = null;
  progress.value = 8;
  steps.value = buildInitialSteps();

  try {
    await animateStep('prepare', '生成可命中样例数据');
    const context = buildPassingTestContext(validConditions);

    await animateStep('validate', `${validConditions.length} 条条件 · ${props.actions.length} 条动作`);
    if (props.triggerEvent) {
      await animateStep('trigger', props.triggerEvent);
    }

    const conditionConfig = JSON.stringify({
      logic: props.conditionLogic,
      conditions: validConditions.map(({ field, op, value }) => ({ field, op, value }))
    });
    const actionsConfig = JSON.stringify(
      props.actions.map(action => ({
        level: action.level,
        type: action.type,
        message: action.message || null,
        notifyTargets: null,
        execMenuPage: action.execMenuPage || null,
        params: action.execMenuPage ? { execMenuPage: action.execMenuPage } : {}
      }))
    );

    validConditions.forEach((_row, index) => setStepStatus(`cond-${index}`, 'running'));

    const { data, error } = await fetchTestBusinessRule({
      ruleId: props.ruleId,
      triggerEvent: props.triggerEvent || undefined,
      context,
      draft: {
        ruleName: props.ruleName || '当前编辑规则',
        triggerEvent: props.triggerEvent || null,
        conditionConfig,
        actionsConfig,
        priority: props.priority,
        conflictStrategy: props.conflictStrategy
      }
    });
    if (error) {
      steps.value.forEach(step => {
        if (step.status === 'pending' || step.status === 'running') step.status = 'error';
      });
      return;
    }

    const details = data?.conditionDetails || [];
    validConditions.forEach((row, index) => {
      const key = `cond-${index}`;
      const hit = details.find(item => item.field === row.field);
      setStepStatus(
        key,
        hit?.hit ? 'done' : 'error',
        hit ? `实际值 ${hit.fieldValue ?? '—'} · ${hit.hit ? '命中' : '未命中'}` : '未返回评估结果'
      );
    });

    await animateStep('actions', data?.actions?.map(item => `[${item.level}] ${item.type}`).join('；') || '—');
    await animateStep('finish', data?.matched ? '规则命中，试算通过' : '规则未命中');

    testResult.value = data ?? null;
    verified.value = Boolean(data?.verified ?? (data?.matched && details.every(item => item.hit)));
    progress.value = 100;
  } finally {
    running.value = false;
  }
}

function resetPanel() {
  steps.value = [];
  progress.value = 0;
  testResult.value = null;
  verified.value = false;
}

defineExpose({ resetPanel });
</script>

<template>
  <div class="rounded-8px border border-#e5e7eb bg-#fafafa p-12px">
    <div class="mb-10px flex flex-wrap items-center justify-between gap-8px">
      <div>
        <div class="text-14px font-medium">规则试算看板</div>
        <div class="mt-2px text-12px text-#6b7280">模拟跑一次当前配置，逐步展示进度并验证规则是否正确</div>
      </div>
      <NButton type="primary" :loading="running" :disabled="disabled" @click="handleStartTest">开始测试</NButton>
    </div>

    <NProgress
      v-if="steps.length"
      type="line"
      :percentage="progress"
      indicator-placement="inside"
      :processing="running"
      class="mb-12px"
    />

    <div v-if="steps.length" class="grid grid-cols-3 gap-10px">
      <div class="rounded-6px border border-#e5e7eb bg-white p-10px">
        <div class="mb-8px text-12px font-medium text-#6b7280">待执行</div>
        <div class="flex flex-col gap-6px">
          <div
            v-for="step in kanbanColumns.pending"
            :key="step.key"
            class="rounded-4px border border-dashed border-#d1d5db px-8px py-6px text-12px text-#6b7280"
          >
            {{ step.label }}
          </div>
          <div v-if="!kanbanColumns.pending.length" class="text-12px text-#9ca3af">—</div>
        </div>
      </div>
      <div class="rounded-6px border border-#93c5fd bg-#eff6ff p-10px">
        <div class="mb-8px text-12px font-medium text-#2563eb">执行中</div>
        <div class="flex flex-col gap-6px">
          <div
            v-for="step in kanbanColumns.running"
            :key="step.key"
            class="rounded-4px border border-#93c5fd bg-white px-8px py-6px text-12px text-#1d4ed8"
          >
            {{ step.label }}
          </div>
          <div v-if="!kanbanColumns.running.length" class="text-12px text-#60a5fa">—</div>
        </div>
      </div>
      <div class="rounded-6px border border-#86efac bg-#f0fdf4 p-10px">
        <div class="mb-8px text-12px font-medium text-#16a34a">已完成</div>
        <div class="flex flex-col gap-6px">
          <div
            v-for="step in kanbanColumns.done"
            :key="step.key"
            class="rounded-4px border px-8px py-6px text-12px"
            :class="step.status === 'error' ? 'border-#fecaca bg-#fef2f2 text-#dc2626' : 'border-#86efac bg-white text-#166534'"
          >
            <div>{{ step.label }}</div>
            <div v-if="step.detail" class="mt-2px text-11px opacity-80">{{ step.detail }}</div>
          </div>
          <div v-if="!kanbanColumns.done.length" class="text-12px text-#9ca3af">—</div>
        </div>
      </div>
    </div>

    <NAlert v-if="verified" type="success" class="mt-12px" title="规则验证通过">
      模拟试算已完成，全部条件命中且动作可正常输出，当前规则配置正确。
    </NAlert>
    <NAlert v-else-if="testResult && !verified" type="warning" class="mt-12px" title="规则未通过验证">
      {{ testResult.message || '试算未命中或存在未满足条件，请检查条件组合与模拟数据。' }}
    </NAlert>

    <div v-if="testResult?.actions?.length" class="mt-10px rounded-6px border border-#e5e7eb bg-white p-10px">
      <div class="mb-6px flex flex-wrap items-center gap-8px">
        <span class="text-13px font-medium">试算结果</span>
        <NTag :type="testResult.matched ? 'success' : 'default'" size="small">
          {{ testResult.matched ? '已命中' : '未命中' }}
        </NTag>
        <NTag v-if="testResult.finalDecision" size="small" type="info">决策 {{ testResult.finalDecision }}</NTag>
      </div>
      <ul class="list-disc pl-18px text-12px text-#4b5563">
        <li v-for="(action, index) in testResult.actions" :key="index">
          [{{ action.level }}] {{ ACTION_TYPE_OPTIONS.find(item => item.value === action.type)?.label || action.type }}
          <template v-if="action.execMenuPage || action.params?.execMenuPage">
            → {{ getMenuLabel(String(action.execMenuPage || action.params?.execMenuPage)) }}
          </template>
          — {{ action.message || '—' }}
        </li>
      </ul>
    </div>
  </div>
</template>
