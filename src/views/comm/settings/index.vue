<script setup lang="ts">
import { NCard, NSwitch, NForm, NFormItem } from 'naive-ui';
import { ref } from 'vue';

defineOptions({ name: 'CommSettings' });

const settings = ref({
  notify: true,
  mention: true,
  readReceipt: true,
  autoArchive: true,
  translate: false
});
</script>

<template>
  <NCard title="设置" size="small" class="card-wrapper max-w-560px">
    <NForm label-placement="left" label-width="140">
      <NFormItem label="新消息提醒">
        <NSwitch v-model:value="settings.notify" />
      </NFormItem>
      <NFormItem label="@我 提醒">
        <NSwitch v-model:value="settings.mention" />
      </NFormItem>
      <NFormItem label="已读回执">
        <NSwitch v-model:value="settings.readReceipt" />
      </NFormItem>
      <NFormItem label="文件自动归档">
        <NSwitch v-model:value="settings.autoArchive" />
      </NFormItem>
      <NFormItem label="消息自动翻译">
        <NSwitch v-model:value="settings.translate" />
      </NFormItem>
    </NForm>
  </NCard>
</template>
