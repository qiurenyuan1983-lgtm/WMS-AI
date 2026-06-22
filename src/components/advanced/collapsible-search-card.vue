<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'CollapsibleSearchCard' });

const expandedNames = ref<string[]>(['search']);
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
    <NCollapse v-model:expanded-names="expandedNames">
      <NCollapseItem :title="$t('common.search')" name="search">
        <slot />
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>
