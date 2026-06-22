<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NTag } from 'naive-ui';
import { fetchTestBusinessRule } from '@/service/api/oms/business-rule';
import { TRIGGER_EVENTS } from '../constants';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  ruleId?: CommonType.IdType | null;
  defaultTrigger?: string | null;
}>();

const loading = ref(false);
const result = ref<Api.Oms.BusinessRuleTestResult | null>(null);

const form = reactive({
  triggerEvent: '',
  contextJson: `{
  "order": {
    "platform_code": "Amazon",
    "fba_shipment_id": null,
    "hold_flag": "0",
    "customer_name": "Demo"
  },
  "load": {
    "pallet_destination": "XLX7",
    "trip": { "destination": "ONT8" }
  }
}`
});

const triggerOptions = Object.values(TRIGGER_EVENTS).flat();

watch(visible, val => {
  if (!val) {
    result.value = null;
    return;
  }
  form.triggerEvent = props.defaultTrigger || 'ORDER_ENTER_OUTBOUND_POOL';
});

async function handleTest() {
  loading.value = true;
  let context: Record<string, unknown> = {};
  try {
    context = JSON.parse(form.contextJson || '{}');
  } catch {
    loading.value = false;
    window.$message?.error('上下文 JSON 格式不正确');
    return;
  }
  const { data, error } = await fetchTestBusinessRule({
    ruleId: props.ruleId ?? undefined,
    triggerEvent: form.triggerEvent || undefined,
    context
  });
  loading.value = false;
  if (error) return;
  result.value = data ?? null;
}

const levelTag: Record<string, 'default' | 'warning' | 'error' | 'success' | 'info'> = {
  HINT: 'default',
  WARN: 'warning',
  STRONG_WARN: 'warning',
  BLOCK: 'error',
  AUTO: 'success'
};
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="规则试算" style="width: 820px; max-width: 96vw">
    <NForm label-placement="left" :label-width="88">
      <NFormItem label="触发事件">
        <NSelect v-model:value="form.triggerEvent" :options="triggerOptions" filterable clearable />
      </NFormItem>
      <NFormItem label="试算上下文">
        <NInput v-model:value="form.contextJson" type="textarea" :rows="10" placeholder="JSON 格式业务上下文" />
      </NFormItem>
    </NForm>
    <div class="mb-12px">
      <NButton type="primary" :loading="loading" @click="handleTest">执行试算</NButton>
    </div>
    <template v-if="result">
      <div class="mb-8px flex flex-wrap items-center gap-8px">
        <NTag :type="result.matched ? 'success' : 'default'">{{ result.matched ? '已命中' : '未命中' }}</NTag>
        <span v-if="result.ruleName" class="text-14px">{{ result.ruleCode }} · {{ result.ruleName }}</span>
        <NTag v-if="result.finalDecision" :type="levelTag[result.finalDecision] || 'info'">
          最终决策：{{ result.finalDecision }}
        </NTag>
      </div>
      <p class="mb-8px text-13px">{{ result.message }}</p>
      <div v-if="result.conflictNotes?.length" class="mb-8px text-12px text-orange-600">
        {{ result.conflictNotes.join('；') }}
      </div>
      <div v-if="result.actions?.length" class="mb-8px">
        <div class="mb-4px text-13px font-medium">执行动作</div>
        <ul class="list-disc pl-20px text-13px text-gray-600">
          <li v-for="(act, i) in result.actions" :key="i">
            [{{ act.level }}] {{ act.type }} — {{ act.message || '—' }}
          </li>
        </ul>
      </div>
      <div v-if="result.conditionDetails?.length">
        <div class="mb-4px text-13px font-medium">条件明细</div>
        <ul class="list-disc pl-20px text-12px text-gray-600">
          <li v-for="(d, i) in result.conditionDetails" :key="i">
            {{ d.field }} {{ d.op }} {{ d.expectedValue }} → 实际 {{ d.fieldValue }}（{{ d.hit ? '命中' : '未命中' }}）
          </li>
        </ul>
      </div>
    </template>
  </NModal>
</template>
