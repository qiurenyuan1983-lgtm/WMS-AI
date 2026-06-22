<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({ name: 'OmsListPage' });

defineProps<{
  filterTitle?: string;
  filterDescription?: string;
  contentTitle?: string;
}>();
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">{{ filterTitle || '筛选条件' }}</div>
          <div v-if="filterDescription" class="mt-4px text-12px text-#6b7280">{{ filterDescription }}</div>
        </div>
        <NSpace :size="8">
          <slot name="filter-actions" />
        </NSpace>
      </div>
      <NCollapse v-if="$slots.filters" default-expanded-names="['search']" class="mt-8px">
        <NCollapseItem :title="$t('common.search')" name="search">
          <slot name="filters" />
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard
      :bordered="false"
      size="small"
      :title="contentTitle"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header-extra>
        <slot name="header-extra" />
      </template>

      <div class="flex min-h-0 flex-1 flex-col gap-12px overflow-hidden">
        <slot name="tabs" />
        <slot />
      </div>
    </NCard>
  </div>
</template>
