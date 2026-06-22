<script setup lang="ts">
import { computed } from 'vue';
import { NTag } from 'naive-ui';
import { TRIP_DEADLINE_RISK_META, type TripDeadlineRiskLevel } from '@/utils/tms/trip-deadline';

const props = defineProps<{
  level?: TripDeadlineRiskLevel | string | null;
  size?: 'tiny' | 'small' | 'medium';
}>();

const meta = computed(() => TRIP_DEADLINE_RISK_META[(props.level as TripDeadlineRiskLevel) || 'NORMAL'] ?? TRIP_DEADLINE_RISK_META.NORMAL);
</script>

<template>
  <NTag
    :size="size ?? 'small'"
    :bordered="false"
    class="trip-deadline-risk-tag"
    :style="{ backgroundColor: meta.tagBg, color: meta.tagColor }"
  >
    {{ meta.label }}
  </NTag>
</template>

<style scoped>
.trip-deadline-risk-tag {
  font-weight: 700;
}
</style>
