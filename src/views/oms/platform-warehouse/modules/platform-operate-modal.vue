<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInput, NModal, NRadioButton, NRadioGroup } from 'naive-ui';
import { fetchCreatePlatform, fetchUpdatePlatform } from '@/service/api/oms/platform-warehouse';
import { STATUS_OPTIONS } from '../constants';

defineOptions({ name: 'PlatformOperateModal' });

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{ row?: Api.Oms.PlatformEntity | null }>();
const emit = defineEmits<{ submitted: [] }>();

const loading = ref(false);
const form = ref<Api.Oms.PlatformOperateParams>({
  platformName: null,
  platformCode: null,
  status: '0',
  remark: null
});

const isEdit = computed(() => Boolean(props.row?.id));
const title = computed(() => (isEdit.value ? '编辑平台' : '新增平台'));

watch(visible, val => {
  if (!val) return;
  if (props.row) {
    form.value = {
      platformName: props.row.platformName,
      platformCode: props.row.platformCode,
      status: props.row.status,
      remark: props.row.remark ?? null
    };
  } else {
    form.value = { platformName: null, platformCode: null, status: '0', remark: null };
  }
});

async function handleSubmit() {
  if (!form.value.platformName?.trim()) {
    window.$message?.warning('请输入平台名称');
    return;
  }
  if (!form.value.platformCode?.trim()) {
    window.$message?.warning('请输入平台代码');
    return;
  }
  loading.value = true;
  const payload = {
    platformName: form.value.platformName.trim(),
    platformCode: form.value.platformCode.trim().toUpperCase(),
    status: form.value.status ?? '0',
    remark: form.value.remark
  };
  const { error } = isEdit.value
    ? await fetchUpdatePlatform({ ...payload, id: props.row!.id })
    : await fetchCreatePlatform(payload);
  loading.value = false;
  if (error) return;
  window.$message?.success(isEdit.value ? '平台已更新' : '平台已创建');
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" style="width: 440px; max-width: 96vw">
    <NForm label-placement="top" size="small">
      <NFormItem label="平台名称" required>
        <NInput v-model:value="form.platformName" placeholder="如 Walmart、亚马逊" />
      </NFormItem>
      <NFormItem label="平台代码" required>
        <NInput v-model:value="form.platformCode" placeholder="如 WAL、AMZ" />
      </NFormItem>
      <NFormItem label="状态">
        <NRadioGroup v-model:value="form.status" size="small">
          <NRadioButton v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </NRadioButton>
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="备注">
        <NInput v-model:value="form.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">确认</NButton>
      </div>
    </template>
  </NModal>
</template>
