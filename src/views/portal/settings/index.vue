<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NForm, NFormItem, NSelect, NSwitch } from 'naive-ui';
import { fetchGetPortalAlertConfig, fetchSavePortalAlertConfig } from '@/service/api/portal';

defineOptions({ name: 'PortalSettings' });

const CURRENCY_OPTIONS = [
  { label: 'USD 美元', value: 'USD' },
  { label: 'CNY 人民币', value: 'CNY' },
  { label: 'EUR 欧元', value: 'EUR' }
];

const loading = ref(false);
const saving = ref(false);
const form = ref<Api.Portal.AlertConfig>({
  emailEnabled: true,
  wechatEnabled: false,
  systemMessageEnabled: true,
  safetyStockEnabled: true,
  defaultCurrency: 'USD',
  displayCurrency: 'USD'
});

async function loadConfig() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalAlertConfig();
    if (data) form.value = { ...data };
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  const { data, error } = await fetchSavePortalAlertConfig(form.value);
  saving.value = false;
  if (error) return;
  if (data) form.value = { ...data };
  window.$message?.success('提醒与显示偏好已保存');
}

onMounted(loadConfig);
</script>

<template>
  <div class="portal-settings max-w-640px">
    <NCard title="提醒与显示偏好" size="small" :bordered="false" :loading="loading">
      <p class="mb-16px text-13px text-#6b7280">
        配置通知渠道与费用展示币种。一期为配置入口，实际推送由系统后台对接。
      </p>
      <NForm label-placement="left" label-width="120">
        <NFormItem label="邮件通知">
          <NSwitch v-model:value="form.emailEnabled" />
        </NFormItem>
        <NFormItem label="微信通知">
          <NSwitch v-model:value="form.wechatEnabled" />
        </NFormItem>
        <NFormItem label="站内消息">
          <NSwitch v-model:value="form.systemMessageEnabled" />
        </NFormItem>
        <NFormItem label="安全库存预警">
          <NSwitch v-model:value="form.safetyStockEnabled" />
        </NFormItem>
        <NFormItem label="账单默认币种">
          <NSelect v-model:value="form.defaultCurrency" :options="CURRENCY_OPTIONS" class="w-200px" />
        </NFormItem>
        <NFormItem label="门户展示币种">
          <NSelect v-model:value="form.displayCurrency" :options="CURRENCY_OPTIONS" class="w-200px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" :loading="saving" @click="handleSave">保存设置</NButton>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
