<script setup lang="ts">
import { NAlert, NCard } from 'naive-ui';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="portal-placeholder">
    <NCard :title="title" size="small">
      <NAlert type="info" :bordered="false">
        {{ description || '客户门户原型占位页，后续可接入订单、费用、账单等业务能力。' }}
      </NAlert>
    </NCard>
  </div>
</template>

<style scoped>
.portal-placeholder {
  padding: 4px;
}
</style>
