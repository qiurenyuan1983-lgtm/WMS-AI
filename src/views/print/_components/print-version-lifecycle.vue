<script setup lang="ts">
import { NCard, NStep, NSteps, NTag } from 'naive-ui';
import { TEMPLATE_VERSION_LIFECYCLE } from '../constants';

defineOptions({ name: 'PrintVersionLifecycleHint' });
</script>

<template>
  <NCard size="small" :bordered="false" class="mb-12px">
    <div class="mb-12px text-sm font-medium">模板版本生命周期</div>
    <NSteps size="small" :current="4">
      <NStep
        v-for="s in TEMPLATE_VERSION_LIFECYCLE"
        :key="s.key"
        :title="s.label"
        :description="s.desc"
      />
    </NSteps>
    <div class="mt-12px flex flex-wrap gap-8px">
      <NTag v-for="s in TEMPLATE_VERSION_LIFECYCLE" :key="s.key" size="small">
        {{ s.label }}
      </NTag>
    </div>
  </NCard>
</template>
