<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  computeTripDeadline,
  formatRemainingMinutes,
  resolveRiskLevel,
  TRIP_DEADLINE_RISK_META
} from '@/utils/tms/trip-deadline';
import TripDeadlineRiskTag from './TripDeadlineRiskTag.vue';

const props = withDefaults(
  defineProps<{
    appointmentTime?: string | null;
    originWarehouse?: string | null;
    destination?: string | null;
    palletQty?: number;
    cartonQty?: number;
    loadingMethod?: string | null;
    latestFinishTime?: string | null;
    remainingMinutes?: number | null;
    deadlineRiskLevel?: string | null;
    compact?: boolean;
    showRisk?: boolean;
    tickMs?: number;
    /** 深色/紫色页头场景，倒计时文字使用高对比浅色 */
    onDark?: boolean;
  }>(),
  { showRisk: true, tickMs: 30_000, onDark: false }
);

const tick = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const deadline = computed(() => {
  void tick.value;
  if (props.latestFinishTime) {
    const now = new Date();
    const finish = new Date(String(props.latestFinishTime).replace(' ', 'T'));
    const remaining = Math.round((finish.getTime() - now.getTime()) / 60_000);
    return {
      latestFinishTime: props.latestFinishTime,
      latestStartLoadingTime: props.latestStartLoadingTime ?? null,
      remainingMinutes: remaining,
      deadlineRiskLevel: resolveRiskLevel(remaining)
    };
  }
  return computeTripDeadline({
    appointmentTime: props.appointmentTime ?? null,
    originWarehouse: props.originWarehouse,
    destination: props.destination,
    palletQty: props.palletQty,
    cartonQty: props.cartonQty,
    loadingMethod: props.loadingMethod
  });
});

const displayText = computed(() => formatRemainingMinutes(deadline.value.remainingMinutes));
const color = computed(() => {
  if (props.onDark) return '#ffffff';
  return TRIP_DEADLINE_RISK_META[deadline.value.deadlineRiskLevel]?.color ?? '#374151';
});
const isOverdue = computed(() => deadline.value.deadlineRiskLevel === 'OVERDUE');

onMounted(() => {
  timer = setInterval(() => {
    tick.value += 1;
  }, props.tickMs);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="deadline-countdown" :class="{ 'deadline-countdown--overdue': isOverdue, 'deadline-countdown--compact': compact }">
    <span class="deadline-countdown__text" :style="{ color }">{{ displayText }}</span>
    <TripDeadlineRiskTag v-if="showRisk" :level="deadline.deadlineRiskLevel" size="tiny" />
  </div>
</template>

<style scoped>
.deadline-countdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}
.deadline-countdown--compact {
  font-size: 12px;
}
.deadline-countdown--overdue .deadline-countdown__text {
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>
