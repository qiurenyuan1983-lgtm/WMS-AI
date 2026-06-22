<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchBatchBindWmsLocations, fetchBatchSetWmsLocationCapacity } from '@/service/api/wms';
import { DESTINATION_OPTIONS, PLATFORM_OPTIONS } from '../constants';

export type BatchActionMode = 'capacity' | 'bind';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  mode: BatchActionMode;
  ids: CommonType.IdType[];
}>();

const emit = defineEmits<{ (e: 'submitted'): void }>();

const capacity = ref(30);
const bindForm = ref({
  customerName: '',
  platformCode: null as string | null,
  platformName: null as string | null,
  destinationCode: null as string | null,
  destinationName: null as string | null,
  purpose: null as string | null
});

const title = computed(() => (props.mode === 'capacity' ? '批量设置容量' : '批量绑定客户/平台/目的地'));

watch(visible, open => {
  if (!open) return;
  capacity.value = 30;
  bindForm.value = {
    customerName: '',
    platformCode: null,
    platformName: null,
    destinationCode: null,
    destinationName: null,
    purpose: null
  };
});

async function handleSubmit() {
  if (!props.ids.length) return;
  if (props.mode === 'capacity') {
    const { error } = await fetchBatchSetWmsLocationCapacity({ ids: props.ids, capacity: capacity.value });
    if (error) return;
    window.$message?.success('容量已更新');
  } else {
    const { error } = await fetchBatchBindWmsLocations({ ids: props.ids, ...bindForm.value });
    if (error) return;
    window.$message?.success('绑定信息已更新');
  }
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-520px">
    <template v-if="mode === 'capacity'">
      <NForm label-placement="left" label-width="90">
        <NFormItem label="库位容量">
          <NInputNumber v-model:value="capacity" class="w-full" :min="1" />
        </NFormItem>
        <div class="text-12px text-#6b7280">已选 {{ ids.length }} 个库位</div>
      </NForm>
    </template>
    <template v-else>
      <NForm label-placement="left" label-width="90" size="small">
        <NFormItem label="客户">
          <NInput v-model:value="bindForm.customerName" />
        </NFormItem>
        <NFormItem label="平台">
          <NSelect
            v-model:value="bindForm.platformCode"
            :options="PLATFORM_OPTIONS"
            clearable
            @update:value="(v: string) => { bindForm.platformName = PLATFORM_OPTIONS.find(o => o.value === v)?.label as string }"
          />
        </NFormItem>
        <NFormItem label="目的地">
          <NSelect
            v-model:value="bindForm.destinationCode"
            :options="DESTINATION_OPTIONS"
            clearable
            @update:value="(v: string) => { bindForm.destinationName = v }"
          />
        </NFormItem>
        <NFormItem label="用途">
          <DictSelect v-model:value="bindForm.purpose" dict-code="wms_location_purpose" clearable />
        </NFormItem>
        <div class="text-12px text-#6b7280">已选 {{ ids.length }} 个库位</div>
      </NForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" @click="handleSubmit">确定</NButton>
      </div>
    </template>
  </NModal>
</template>
