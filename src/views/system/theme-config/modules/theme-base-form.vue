<script setup lang="ts">
import { computed } from 'vue';
import { ACCOUNT_SCOPE_OPTIONS, PORT_OPTIONS, ROLE_OPTIONS, WAREHOUSE_OPTIONS } from '../shared/theme-visual-config';
import type { ThemeEditorModel } from './types';

defineOptions({ name: 'ThemeBaseForm' });

const model = defineModel<ThemeEditorModel>({ required: true });

const portValues = computed({
  get: () => model.value.applicablePorts,
  set: v => {
    model.value.applicablePorts = v;
  }
});

const warehouseValues = computed({
  get: () => model.value.applicableWarehouses,
  set: v => {
    model.value.applicableWarehouses = v;
  }
});

const roleValues = computed({
  get: () => model.value.applicableRoles,
  set: v => {
    model.value.applicableRoles = v;
  }
});
</script>

<template>
  <NForm label-placement="top" size="small" class="forest-form">
    <NGrid :cols="2" :x-gap="20" :y-gap="8">
      <NFormItemGi label="主题名称" :span="1">
        <NInput v-model:value="model.themeName" placeholder="天空淡蓝" />
      </NFormItemGi>
      <NFormItemGi label="是否默认" :span="1">
        <NRadioGroup v-model:value="model.isDefault">
          <NRadio value="Y">是</NRadio>
          <NRadio value="N">否</NRadio>
        </NRadioGroup>
      </NFormItemGi>
      <NFormItemGi label="主题编码" :span="1">
        <NInput v-model:value="model.themeCode" placeholder="THEME-SKY" />
      </NFormItemGi>
      <NFormItemGi label="启用状态" :span="1">
        <NSwitch :value="model.status === '0'" @update:value="(v: boolean) => (model.status = v ? '0' : '1')" />
      </NFormItemGi>
      <NFormItemGi label="适用端口" :span="1">
        <NSelect v-model:value="portValues" multiple tag :options="PORT_OPTIONS" placeholder="PC / Web、PDA" />
      </NFormItemGi>
      <NFormItemGi label="创建时间" :span="1">
        <NInput :value="model.createTime || '-'" disabled />
      </NFormItemGi>
      <NFormItemGi label="适用仓库" :span="1">
        <NSelect v-model:value="warehouseValues" multiple tag :options="WAREHOUSE_OPTIONS" placeholder="全部仓库" />
      </NFormItemGi>
      <NFormItemGi label="更新时间" :span="1">
        <NInput :value="model.updateTime || '-'" disabled />
      </NFormItemGi>
      <NFormItemGi label="适用角色" :span="1">
        <NSelect v-model:value="roleValues" multiple tag :options="ROLE_OPTIONS" />
      </NFormItemGi>
      <NFormItemGi label="版本号" :span="1">
        <NInput v-model:value="model.version" placeholder="V1.2.0" />
      </NFormItemGi>
      <NFormItemGi label="适用账号" :span="2">
        <NSelect v-model:value="model.applicableAccounts" :options="ACCOUNT_SCOPE_OPTIONS" />
      </NFormItemGi>
      <NFormItemGi label="主题说明" :span="2">
        <NInput v-model:value="model.remark" type="textarea" :rows="2" placeholder="主题描述" />
      </NFormItemGi>
    </NGrid>
  </NForm>
</template>

<style scoped>
.forest-form :deep(.n-input),
.forest-form :deep(.n-base-selection) {
  border-radius: 8px;
}
</style>
