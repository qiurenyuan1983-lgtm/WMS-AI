<script setup lang="ts">
import { watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';

const props = defineProps<{ data: Array<{ date: string; orderCount: number }> }>();

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: [] as string[] },
  yAxis: { type: 'value', name: '订单量' },
  series: [{ name: '订单量', type: 'line', smooth: true, color: '#2563eb', areaStyle: { opacity: 0.08 }, data: [] as number[] }]
}));

function render() {
  updateOptions(opts => {
    opts.xAxis.data = props.data.map(d => d.date);
    opts.series[0].data = props.data.map(d => d.orderCount);
    return opts;
  });
}

watch(() => props.data, render, { deep: true, immediate: true });
</script>

<template>
  <div ref="domRef" class="h-240px w-full" />
</template>
