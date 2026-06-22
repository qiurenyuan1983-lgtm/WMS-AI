<script setup lang="ts">
import { NCard, NEmpty } from 'naive-ui';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="min-h-500px p-16px">
    <NCard :title="title" size="small" :bordered="false">
      <NEmpty :description="description || '原型页面，后续对接业务接口'" class="py-40px" />
    </NCard>
  </div>
</template>
