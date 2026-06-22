<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace
} from 'naive-ui';
import {
  PALLET_LABEL_DESTINATION_OPTIONS,
  PALLET_LABEL_PLATFORM_OPTIONS,
  PALLET_SCOPE_TYPE_OPTIONS
} from '../constants';

const props = defineProps<{
  show: boolean;
  row?: Api.Print.PrintTemplate | null;
  mode: 'create' | 'edit';
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  save: [payload: {
    templateName: string;
    palletScopeType: Api.Print.PalletScopeType;
    palletScopeValues: string[];
  }];
}>();

const templateName = ref('');
const scopeType = ref<Api.Print.PalletScopeType>('all');
const scopeValues = ref<string[]>([]);

const drawerTitle = computed(() => (props.mode === 'create' ? '新建卡板贴模板' : '编辑模板'));

const scopeValueOptions = computed(() =>
  scopeType.value === 'destination' ? PALLET_LABEL_DESTINATION_OPTIONS : PALLET_LABEL_PLATFORM_OPTIONS
);

const scopeValueLabel = computed(() => (scopeType.value === 'destination' ? '目的地' : '平台'));

watch(
  () => props.show,
  visible => {
    if (!visible) return;
    templateName.value = props.row?.templateName || '';
    scopeType.value = props.row?.palletScopeType || 'all';
    scopeValues.value = [...(props.row?.palletScopeValues || [])];
  },
  { immediate: true }
);

watch(scopeType, (next, prev) => {
  if (next !== prev) scopeValues.value = [];
});

function close() {
  emit('update:show', false);
}

function buildPayload() {
  return {
    templateName: templateName.value.trim(),
    palletScopeType: scopeType.value,
    palletScopeValues: scopeType.value === 'all' ? [] : [...scopeValues.value]
  };
}

function validate(): boolean {
  if (!templateName.value.trim()) {
    window.$message?.warning('请输入模板名称');
    return false;
  }
  if (scopeType.value !== 'all' && !scopeValues.value.length) {
    window.$message?.warning(`请至少选择一个${scopeValueLabel.value}`);
    return false;
  }
  return true;
}

function handleSave() {
  if (!validate()) return;
  emit('save', buildPayload());
  close();
}
</script>

<template>
  <NDrawer :show="show" :width="420" @update:show="emit('update:show', $event)">
    <NDrawerContent :title="drawerTitle" closable>
      <NForm label-placement="top" size="small">
        <NFormItem label="模板名称" required>
          <NInput v-model:value="templateName" placeholder="如：Anker 高货值卡板贴" />
        </NFormItem>
        <NFormItem label="适用范围">
          <NRadioGroup v-model:value="scopeType">
            <NRadioButton v-for="opt in PALLET_SCOPE_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </NRadioButton>
          </NRadioGroup>
        </NFormItem>
        <NFormItem v-if="scopeType !== 'all'" :label="`选择${scopeValueLabel}（可多选）`" required>
          <NSelect
            v-model:value="scopeValues"
            :options="scopeValueOptions"
            multiple
            filterable
            clearable
            max-tag-count="responsive"
            placeholder="请选择"
          />
        </NFormItem>
        <p class="text-xs text-gray-500 leading-relaxed">
          打印时按卡板的目的地或平台匹配模板；保存后将自动进入模板设计器制作样式。
        </p>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="close">取消</NButton>
          <NButton type="primary" @click="handleSave">
            {{ mode === 'create' ? '保存并制作模板' : '保存' }}
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
