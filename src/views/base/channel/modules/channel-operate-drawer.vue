<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateChannel, fetchUpdateChannel } from '@/service/api/base/channel';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'ChannelOperateDrawer' });

const props = defineProps<{ operateType: NaiveUI.TableOperateType; rowData?: Api.Base.Channel | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();
const title = computed(() => (props.operateType === 'add' ? '新增渠道' : '编辑渠道'));

const CHANNEL_TYPE_OPTIONS = [
  { label: '海运', value: 'SEA' }, { label: '空运', value: 'AIR' }, { label: '快递', value: 'EXPRESS' },
  { label: '铁运', value: 'RAIL' }, { label: '整车', value: 'TRUCK' }, { label: '本土散板', value: 'LOCAL_BULK' },
  { label: '同行散板', value: 'PEER_BULK' }
];
const CONTAINER_MODE_OPTIONS = [{ label: '整柜', value: 'FCL' }, { label: '拼柜', value: 'LCL' }, { label: '散货', value: 'BULK' }];

const model = ref<Api.Base.ChannelOperateParams>(createDefaultModel());
function createDefaultModel(): Api.Base.ChannelOperateParams {
  return { id: null, channelCode: null, channelName: null, channelType: null, containerMode: null, priority: 100, sortOrder: 0, status: '0', remark: null };
}

const rules = {
  channelCode: createRequiredRule('渠道编码不能为空'),
  channelName: createRequiredRule('渠道名称不能为空'),
  channelType: createRequiredRule('请选择渠道类型')
};

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  const { error } = props.operateType === 'add' ? await fetchCreateChannel(model.value) : await fetchUpdateChannel(model.value);
  if (error) return;
  window.$message?.success(props.operateType === 'add' ? '新增成功' : '修改成功');
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (!visible.value) return;
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) Object.assign(model.value, jsonClone(props.rowData));
  restoreValidation();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="560" class="max-w-90%" display-directive="show">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
        <NFormItem label="渠道编码" path="channelCode"><NInput v-model:value="model.channelCode" :disabled="operateType === 'edit'" placeholder="如：SEA_TRUCK" style="text-transform: uppercase" /></NFormItem>
        <NFormItem label="渠道名称" path="channelName"><NInput v-model:value="model.channelName" placeholder="如：海卡海派" /></NFormItem>
        <NFormItem label="渠道类型" path="channelType"><NSelect v-model:value="model.channelType" :options="CHANNEL_TYPE_OPTIONS" placeholder="请选择渠道类型" /></NFormItem>
        <NFormItem label="装载模式" path="containerMode"><NSelect v-model:value="model.containerMode" :options="CONTAINER_MODE_OPTIONS" clearable placeholder="可选" /></NFormItem>
        <NFormItem label="优先级" path="priority"><NInputNumber v-model:value="model.priority" :min="1" :max="9999" class="w-full" /></NFormItem>
        <NFormItem label="排序" path="sortOrder"><NInputNumber v-model:value="model.sortOrder" :min="0" class="w-full" /></NFormItem>
        <NFormItem label="状态" path="status"><NRadioGroup v-model:value="model.status"><NRadio value="0">正常</NRadio><NRadio value="1">禁用</NRadio></NRadioGroup></NFormItem>
        <NFormItem label="备注" path="remark"><NInput v-model:value="model.remark" type="textarea" :rows="2" placeholder="备注（可选）" /></NFormItem>
      </NForm>
      <template #footer><NSpace :size="16"><NButton @click="closeDrawer">取消</NButton><NButton type="primary" @click="handleSubmit">确定</NButton></NSpace></template>
    </NDrawerContent>
  </NDrawer>
</template>

