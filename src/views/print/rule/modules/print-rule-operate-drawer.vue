<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace
} from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { fetchGetPrintPrinterList, fetchGetPrintTemplateList, fetchSavePrintRule } from '@/service/api/print';
import {
  DEVANNING_GROUP_OPTIONS,
  PALLET_LABEL_DESTINATION_OPTIONS,
  PALLET_LABEL_PLATFORM_OPTIONS,
  PALLET_SCOPE_TYPE_OPTIONS,
  PRINT_RULE_MODE_OPTIONS,
  PRINT_RULE_TRIGGER_OPTIONS
} from '../../constants';

const props = defineProps<{
  show: boolean;
  row?: Api.Print.PrintRule | null;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  saved: [];
}>();

const { record: docTypeRecord } = useDict('print_doc_type');

const saving = ref(false);
const templateOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const printerOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);

const form = ref<Api.Print.SavePrintRulePayload>({
  ruleName: '',
  docType: 'pallet_label',
  triggerEvent: 'DEVANNING_PALLET_COMPLETE',
  templateId: 920002,
  printerId: 923002,
  printQty: 4,
  printMode: 'preview',
  groupCodes: ['FedEx-LAX', 'UPS-ORD', 'FBA-ONT', '同行散板'],
  palletScopeType: 'platform',
  palletScopeValues: ['Amazon', 'Amazon FBA'],
  priority: 50,
  status: 'enabled'
});

const drawerTitle = computed(() => (props.row ? '编辑打印规则' : '新建打印规则'));

const docTypeOptions = computed(() =>
  Object.entries(docTypeRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

const triggerOptions = computed(() =>
  PRINT_RULE_TRIGGER_OPTIONS.filter(t => t.docTypes.includes(form.value.docType)).map(t => ({
    label: t.label,
    value: t.value
  }))
);

const scopeValueOptions = computed(() =>
  form.value.palletScopeType === 'destination'
    ? PALLET_LABEL_DESTINATION_OPTIONS
    : PALLET_LABEL_PLATFORM_OPTIONS
);

const scopeValueLabel = computed(() =>
  form.value.palletScopeType === 'destination' ? '模板目的地' : '模板平台'
);

function defaultForm(): Api.Print.SavePrintRulePayload {
  return {
    ruleName: '拆柜板贴 · PLT-STD · 预览4份',
    docType: 'pallet_label',
    triggerEvent: 'DEVANNING_PALLET_COMPLETE',
    templateId: 920002,
    printerId: 923002,
    printQty: 4,
    printMode: 'preview',
    groupCodes: ['FedEx-LAX', 'UPS-ORD', 'FBA-ONT', '同行散板'],
    palletScopeType: 'platform',
    palletScopeValues: ['Amazon', 'Amazon FBA'],
    priority: 50,
    status: 'enabled'
  };
}

async function loadOptions() {
  const [tplRes, prnRes] = await Promise.all([
    fetchGetPrintTemplateList({ pageNum: 1, pageSize: 100, status: 'published' }),
    fetchGetPrintPrinterList({ pageNum: 1, pageSize: 100 })
  ]);
  templateOptions.value = (tplRes.data?.rows || []).map(t => ({
    label: `${t.templateCode} · ${t.templateName}`,
    value: t.id
  }));
  printerOptions.value = (prnRes.data?.rows || []).map(p => ({
    label: p.printerName,
    value: p.id
  }));
}

watch(
  () => props.show,
  visible => {
    if (!visible) return;
    loadOptions();
    if (props.row) {
      form.value = {
        id: props.row.id,
        ruleName: props.row.ruleName,
        docType: props.row.docType,
        triggerEvent: props.row.triggerEvent,
        templateId: props.row.templateId,
        printerId: props.row.printerId,
        printQty: props.row.printQty,
        printMode: props.row.printMode,
        groupCodes: [...(props.row.groupCodes || [])],
        palletScopeType: props.row.palletScopeType || 'all',
        palletScopeValues: [...(props.row.palletScopeValues || [])],
        priority: props.row.priority,
        status: props.row.status
      };
    } else {
      form.value = defaultForm();
    }
  },
  { immediate: true }
);

watch(
  () => form.value.docType,
  () => {
    if (!triggerOptions.value.some(o => o.value === form.value.triggerEvent)) {
      form.value.triggerEvent = triggerOptions.value[0]?.value || 'DEVANNING_PALLET_COMPLETE';
    }
  }
);

watch(
  () => form.value.palletScopeType,
  (next, prev) => {
    if (next !== prev) form.value.palletScopeValues = [];
  }
);

function close() {
  emit('update:show', false);
}

async function handleSave() {
  if (!form.value.ruleName.trim()) {
    window.$message?.warning('请输入规则名称');
    return;
  }
  if (!form.value.templateId) {
    window.$message?.warning('请选择模板');
    return;
  }
  if (form.value.docType === 'pallet_label' && !form.value.groupCodes.length) {
    window.$message?.warning('卡板贴规则请至少选择一个目的地分组');
    return;
  }
  if (form.value.palletScopeType !== 'all' && !form.value.palletScopeValues.length) {
    window.$message?.warning(`请选择${scopeValueLabel.value}`);
    return;
  }

  saving.value = true;
  const { error } = await fetchSavePrintRule({
    ...form.value,
    groupCodes: form.value.docType === 'pallet_label' ? form.value.groupCodes : [],
    palletScopeValues: form.value.palletScopeType === 'all' ? [] : form.value.palletScopeValues
  });
  saving.value = false;
  if (error) return;

  window.$message?.success(props.row ? '规则已更新' : '规则已创建');
  emit('saved');
  close();
}
</script>

<template>
  <NDrawer :show="show" :width="520" @update:show="emit('update:show', $event)">
    <NDrawerContent :title="drawerTitle" closable>
      <NForm label-placement="left" label-width="108" :show-feedback="true">
        <NFormItem label="规则名称" required>
          <NInput v-model:value="form.ruleName" placeholder="如：拆柜板贴 · PLT-STD · 预览4份" />
        </NFormItem>
        <NFormItem label="单据类型" required>
          <NSelect v-model:value="form.docType" :options="docTypeOptions" />
        </NFormItem>
        <NFormItem label="触发时机" required>
          <NSelect v-model:value="form.triggerEvent" :options="triggerOptions" />
        </NFormItem>
        <NFormItem label="选用模板" required>
          <NSelect v-model:value="form.templateId" :options="templateOptions" filterable />
        </NFormItem>
        <NFormItem label="打印份数" required>
          <NInputNumber v-model:value="form.printQty" :min="1" :max="20" class="w-full" />
        </NFormItem>
        <NFormItem label="打印模式" required>
          <NRadioGroup v-model:value="form.printMode">
            <NRadioButton
              v-for="opt in PRINT_RULE_MODE_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </NRadioButton>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="打印机">
          <NSelect
            v-model:value="form.printerId"
            :options="printerOptions"
            clearable
            placeholder="如 DOCK-01 标签机"
          />
        </NFormItem>
        <NFormItem v-if="form.docType === 'pallet_label'" label="目的地分组" required>
          <NSelect
            v-model:value="form.groupCodes"
            :options="DEVANNING_GROUP_OPTIONS"
            multiple
            placeholder="拆柜作业右侧分组，如 FedEx-LAX"
          />
        </NFormItem>
        <NFormItem label="模板适用范围">
          <NRadioGroup v-model:value="form.palletScopeType">
            <NRadioButton
              v-for="opt in PALLET_SCOPE_TYPE_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </NRadioButton>
          </NRadioGroup>
        </NFormItem>
        <NFormItem
          v-if="form.palletScopeType !== 'all'"
          :label="scopeValueLabel"
          required
        >
          <NSelect
            v-model:value="form.palletScopeValues"
            :options="scopeValueOptions"
            multiple
            :placeholder="`选择${scopeValueLabel}`"
          />
        </NFormItem>
        <NFormItem label="优先级">
          <NInputNumber v-model:value="form.priority" :min="1" :max="999" class="w-full" />
        </NFormItem>
        <NFormItem label="状态">
          <NRadioGroup v-model:value="form.status">
            <NRadioButton value="enabled">启用</NRadioButton>
            <NRadioButton value="disabled">停用</NRadioButton>
          </NRadioGroup>
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="close">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">保存</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
